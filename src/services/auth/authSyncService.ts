import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { userProfileService } from '../userProfileService';
import { userDatabaseService } from '../database';
import { User, AuthProvider, UserStatus } from '../../types/auth';
import { toFirestoreTimestamp } from '../../types/database';

/**
 * Authentication synchronization error
 */
export class AuthSyncError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AuthSyncError';
  }
}

/**
 * Authentication synchronization service
 * Handles syncing between Firebase Auth and Firestore user profiles
 */
export class AuthSyncService {
  private syncInProgress = new Set<string>();
  private listeners: Array<(user: User | null) => void> = [];

  constructor() {
    this.initializeSync();
  }

  /**
   * Initialize authentication synchronization
   */
  private initializeSync(): void {
    // Listen to Firebase Auth state changes and sync with Firestore
    onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        await this.syncAuthState(firebaseUser);
      } catch (error) {
        this.notifyListeners(null);
      }
    });
  }

  /**
   * Subscribe to auth sync state changes
   */
  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of auth state changes
   */
  private notifyListeners(user: User | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
      }
    });
  }

  /**
   * Sync Firebase Auth state with Firestore profile
   */
  async syncAuthState(firebaseUser: FirebaseUser | null): Promise<User | null> {
    if (!firebaseUser) {
      // User signed out
      this.notifyListeners(null);
      return null;
    }

    const uid = firebaseUser.uid;

    // Prevent duplicate sync operations
    if (this.syncInProgress.has(uid)) {
      return null;
    }

    this.syncInProgress.add(uid);

    try {
      // Check if user profile exists in Firestore
      const existingProfile = await userDatabaseService.getUserProfile(uid);

      if (existingProfile) {
        // User exists, sync auth data with profile
        const syncedUser = await this.syncExistingUser(firebaseUser, existingProfile);
        this.notifyListeners(syncedUser);
        return syncedUser;
      } else {
        // New user, create profile
        const newUser = await this.createNewUserProfile(firebaseUser);
        this.notifyListeners(newUser);
        return newUser;
      }
    } catch (error) {
      throw new AuthSyncError('sync_failed', 'Failed to sync authentication state', error as Error);
    } finally {
      this.syncInProgress.delete(uid);
    }
  }

  /**
   * Sync existing user data with Firebase Auth
   */
  private async syncExistingUser(firebaseUser: FirebaseUser, existingProfile: User): Promise<User> {
    const hasChanges = this.detectAuthChanges(firebaseUser, existingProfile);

    if (hasChanges) {
      // Update Firestore profile with latest auth data
      const syncUpdates = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || existingProfile.displayName,
        photoURL: firebaseUser.photoURL || existingProfile.photoURL,
        phoneNumber: firebaseUser.phoneNumber || existingProfile.phoneNumber,
        emailVerified: firebaseUser.emailVerified,
        status: this.determineUserStatus(firebaseUser, existingProfile),
        linkedProviders: this.updateLinkedProviders(firebaseUser, existingProfile),
        metadata: {
          ...existingProfile.metadata,
          lastLoginAt: toFirestoreTimestamp(),
          lastActiveAt: toFirestoreTimestamp(),
          updatedAt: toFirestoreTimestamp(),
          loginCount: existingProfile.metadata.loginCount + 1,
        },
      };

      return await userDatabaseService.updateUserProfile(existingProfile.uid, syncUpdates);
    } else {
      // Just update activity
      await userDatabaseService.updateUserActivity(existingProfile.uid);
      await userDatabaseService.incrementLoginCount(existingProfile.uid);
      
      return existingProfile;
    }
  }

  /**
   * Create new user profile from Firebase Auth
   */
  private async createNewUserProfile(firebaseUser: FirebaseUser): Promise<User> {
    const provider = this.detectAuthProvider(firebaseUser);
    return await userProfileService.createUserProfileOnSignIn(firebaseUser, provider);
  }

  /**
   * Detect changes between Firebase Auth and Firestore profile
   */
  private detectAuthChanges(firebaseUser: FirebaseUser, profile: User): boolean {
    return (
      firebaseUser.email !== profile.email ||
      firebaseUser.displayName !== profile.displayName ||
      firebaseUser.photoURL !== profile.photoURL ||
      firebaseUser.phoneNumber !== profile.phoneNumber ||
      firebaseUser.emailVerified !== profile.emailVerified ||
      this.hasProviderChanges(firebaseUser, profile)
    );
  }

  /**
   * Check if provider information has changed
   */
  private hasProviderChanges(firebaseUser: FirebaseUser, profile: User): boolean {
    const currentProviders = firebaseUser.providerData.map(p => p.providerId);
    const profileProviders = profile.providers.map(p => p);

    return (
      currentProviders.length !== profileProviders.length ||
      !currentProviders.every(provider => profileProviders.includes(provider as AuthProvider))
    );
  }

  /**
   * Determine user status based on auth state
   */
  private determineUserStatus(firebaseUser: FirebaseUser, existingProfile: User): UserStatus {
    // If user was suspended/inactive, keep that status
    if (existingProfile.status === UserStatus.SUSPENDED) {
      return UserStatus.SUSPENDED;
    }

    // Update status based on email verification
    return firebaseUser.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION;
  }

  /**
   * Update linked providers based on Firebase Auth data
   */
  private updateLinkedProviders(firebaseUser: FirebaseUser, profile: User) {
    const currentProviders = firebaseUser.providerData;
    const existingLinkedProviders = profile.linkedProviders;
    const now = toFirestoreTimestamp();

    // Update existing providers and add new ones
    const updatedProviders = currentProviders.map(providerData => {
      const provider = providerData.providerId as AuthProvider;
      const existingProvider = existingLinkedProviders.find(lp => lp.provider === provider);

      return {
        provider,
        providerId: providerData.providerId,
        providerUid: providerData.uid || firebaseUser.uid,
        email: providerData.email || undefined,
        displayName: providerData.displayName || undefined,
        photoURL: providerData.photoURL || undefined,
        linkedAt: existingProvider?.linkedAt || now,
        lastUsed: now,
        isVerified: true, // Assume verified if from Firebase Auth
        isPrimary: provider === profile.primaryProvider,
        canUnlink: currentProviders.length > 1,
        metadata: {
          ...existingProvider?.metadata,
          lastLogin: now,
        },
      };
    });

    return updatedProviders;
  }

  /**
   * Detect the authentication provider used for sign-in
   */
  private detectAuthProvider(firebaseUser: FirebaseUser): AuthProvider {
    // Check provider data for the most recent sign-in
    if (firebaseUser.providerData.length > 0) {
      const providerId = firebaseUser.providerData[0].providerId;
      
      switch (providerId) {
        case 'google.com':
          return AuthProvider.EMAIL; // Google temporarily disabled
        case 'apple.com':
          return AuthProvider.APPLE;
        case 'facebook.com':
          return AuthProvider.FACEBOOK;
        case 'github.com':
          return AuthProvider.GITHUB;
        default:
          return AuthProvider.EMAIL;
      }
    }

    return AuthProvider.EMAIL;
  }

  /**
   * Force sync for current user
   */
  async forceSyncCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    return await this.syncAuthState(firebaseUser);
  }

  /**
   * Handle email verification state change
   */
  async handleEmailVerification(uid: string): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || firebaseUser.uid !== uid) {
        throw new AuthSyncError('user_mismatch', 'Firebase user does not match provided UID');
      }

      // Reload Firebase user to get latest email verification status
      await firebaseUser.reload();

      if (firebaseUser.emailVerified) {
        // Update user status to active
        const updatedUser = await userDatabaseService.updateUserProfile(uid, {
          emailVerified: true,
          status: UserStatus.ACTIVE,
        });

        // Log verification activity
        await userDatabaseService.logUserActivity({
          uid,
          action: 'email_verified',
          timestamp: toFirestoreTimestamp(),
        });

        this.notifyListeners(updatedUser);
        return updatedUser;
      }

      return null;
    } catch (error) {
      throw new AuthSyncError('email_verification_failed', 'Failed to handle email verification', error as Error);
    }
  }

  /**
   * Handle password change
   */
  async handlePasswordChange(uid: string): Promise<void> {
    try {
      // Log password change activity
      await userDatabaseService.logUserActivity({
        uid,
        action: 'password_changed',
        timestamp: toFirestoreTimestamp(),
      });

      // Update last activity
      await userDatabaseService.updateUserActivity(uid);
    } catch (error) {
      // Don't throw error as password change itself was successful
    }
  }

  /**
   * Handle account deletion
   */
  async handleAccountDeletion(uid: string): Promise<void> {
    try {
      // Log deletion activity
      await userDatabaseService.logUserActivity({
        uid,
        action: 'account_deleted',
        timestamp: toFirestoreTimestamp(),
      });

      // Delete user profile
      await userDatabaseService.deleteUserProfile(uid);

      this.notifyListeners(null);
    } catch (error) {
      throw new AuthSyncError('account_deletion_failed', 'Failed to handle account deletion', error as Error);
    }
  }

  /**
   * Get current sync state
   */
  isSyncInProgress(uid?: string): boolean {
    if (uid) {
      return this.syncInProgress.has(uid);
    }
    return this.syncInProgress.size > 0;
  }

  /**
   * Manual sync for specific user (admin function)
   */
  async manualSyncUser(uid: string): Promise<User | null> {
    try {
      const user = await userDatabaseService.getUserProfile(uid);
      if (!user) {
        throw new AuthSyncError('user_not_found', 'User profile not found');
      }

      // This would require admin SDK in a real scenario
      // For now, just update activity
      await userDatabaseService.updateUserActivity(uid);
      
      return user;
    } catch (error) {
      throw new AuthSyncError('manual_sync_failed', 'Failed to manually sync user', error as Error);
    }
  }
}

// Export singleton instance
export const authSyncService = new AuthSyncService();
export default authSyncService;