import { User as FirebaseUser } from 'firebase/auth';
import { Unsubscribe } from 'firebase/firestore';
import { userDatabaseService, FirestoreServiceError } from './database';
import { authService } from './auth/authService';
import {
  User,
  UserPreferences,
  UserProfile,
  UserRole,
  UserStatus,
  AuthProvider,
  ProfileUpdateRequest,
  LinkedProvider,
} from '../types/auth';
import {
  CreateUserProfile,
  UpdateUserProfile,
  UpdatePreferences,
  UpdateProfileInfo,
  WeatherPreferences,
  toFirestoreTimestamp,
  defaultUserPreferences,
  defaultUserProfile,
  defaultWeatherPreferences,
} from '../types/database';
import { auth } from '../config/firebase';
import { updateProfile } from 'firebase/auth';

/**
 * User profile service error
 */
export class UserProfileServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'UserProfileServiceError';
  }
}

/**
 * User profile management service
 * Handles creation, updates, and synchronization between Firebase Auth and Firestore
 */
export class UserProfileService {
  private currentUser: User | null = null;
  private authUnsubscribe: (() => void) | null = null;
  private userProfileUnsubscribe: Unsubscribe | null = null;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the service
   */
  private initializeService(): void {
    // Subscribe to auth state changes
    this.authUnsubscribe = authService.subscribe((authState) => {
      if (authState.isAuthenticated && authState.user) {
        this.currentUser = authState.user;
      } else {
        this.currentUser = null;
        this.cleanup();
      }
    });
  }

  /**
   * Create user profile on first sign-in
   */
  async createUserProfileOnSignIn(firebaseUser: FirebaseUser, provider: AuthProvider): Promise<User> {
    try {
      // Check if user profile already exists
      const existingUser = await userDatabaseService.getUserProfile(firebaseUser.uid);
      if (existingUser) {
        // Update last login and return existing user
        await userDatabaseService.updateUserActivity(firebaseUser.uid);
        await userDatabaseService.incrementLoginCount(firebaseUser.uid);
        return existingUser;
      }

      // Create new user profile
      const newUserProfile: CreateUserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        photoURL: firebaseUser.photoURL || undefined,
        phoneNumber: firebaseUser.phoneNumber || undefined,
        emailVerified: firebaseUser.emailVerified,
        role: UserRole.USER,
        status: firebaseUser.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
        providers: [provider],
        linkedProviders: this.createLinkedProviderFromFirebaseUser(firebaseUser, provider),
        primaryProvider: provider,
        profile: { ...defaultUserProfile },
        preferences: { ...defaultUserPreferences },
        metadata: {
          createdAt: toFirestoreTimestamp(),
          updatedAt: toFirestoreTimestamp(),
          lastLoginAt: toFirestoreTimestamp(),
          lastActiveAt: toFirestoreTimestamp(),
          loginCount: 1,
        },
      };

      const createdUser = await userDatabaseService.createUserProfile(newUserProfile);
      this.currentUser = createdUser;

      return createdUser;
    } catch (error) {
      throw new UserProfileServiceError(
        'profile_creation_failed',
        'Failed to create user profile',
        error as Error
      );
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: ProfileUpdateRequest): Promise<User> {
    if (!this.currentUser) {
      throw new UserProfileServiceError('not_authenticated', 'User must be authenticated');
    }

    try {
      const uid = this.currentUser.uid;

      // Prepare Firestore updates
      const firestoreUpdates: UpdateUserProfile = {
        ...(updates.displayName && { displayName: updates.displayName }),
        ...(updates.photoURL && { photoURL: updates.photoURL }),
        ...(updates.phoneNumber && { phoneNumber: updates.phoneNumber }),
        ...(updates.profile && { profile: { ...this.currentUser.profile, ...updates.profile } }),
        ...(updates.preferences && { preferences: { ...this.currentUser.preferences, ...updates.preferences } }),
      };

      // Update Firebase Auth profile if needed
      const firebaseUser = auth.currentUser;
      if (firebaseUser && (updates.displayName || updates.photoURL)) {
        await updateProfile(firebaseUser, {
          ...(updates.displayName && { displayName: updates.displayName }),
          ...(updates.photoURL && { photoURL: updates.photoURL }),
        });
      }

      // Update Firestore profile
      const updatedUser = await userDatabaseService.updateUserProfile(uid, firestoreUpdates);
      this.currentUser = updatedUser;

      return updatedUser;
    } catch (error) {
      throw new UserProfileServiceError(
        'profile_update_failed',
        'Failed to update user profile',
        error as Error
      );
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<User> {
    if (!this.currentUser) {
      throw new UserProfileServiceError('not_authenticated', 'User must be authenticated');
    }

    try {
      const updatedUser = await userDatabaseService.updateUserPreferences(
        this.currentUser.uid,
        preferences
      );
      this.currentUser = updatedUser;

      return updatedUser;
    } catch (error) {
      throw new UserProfileServiceError(
        'preferences_update_failed',
        'Failed to update user preferences',
        error as Error
      );
    }
  }

  /**
   * Update basic profile information
   */
  async updateProfileInfo(profileInfo: UpdateProfileInfo): Promise<User> {
    if (!this.currentUser) {
      throw new UserProfileServiceError('not_authenticated', 'User must be authenticated');
    }

    try {
      // Update Firebase Auth profile if needed
      const firebaseUser = auth.currentUser;
      if (firebaseUser && (profileInfo.displayName || profileInfo.photoURL)) {
        await updateProfile(firebaseUser, {
          ...(profileInfo.displayName && { displayName: profileInfo.displayName }),
          ...(profileInfo.photoURL && { photoURL: profileInfo.photoURL }),
        });
      }

      // Update Firestore profile
      const updatedUser = await userDatabaseService.updateProfileInfo(
        this.currentUser.uid,
        profileInfo
      );
      this.currentUser = updatedUser;

      return updatedUser;
    } catch (error) {
      throw new UserProfileServiceError(
        'profile_info_update_failed',
        'Failed to update profile information',
        error as Error
      );
    }
  }

  /**
   * Sync Firebase Auth data with Firestore profile
   */
  async syncAuthWithProfile(firebaseUser: FirebaseUser): Promise<User> {
    if (!this.currentUser) {
      throw new UserProfileServiceError('not_authenticated', 'User must be authenticated');
    }

    try {
      const syncUpdates: UpdateUserProfile = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || this.currentUser.displayName,
        photoURL: firebaseUser.photoURL || this.currentUser.photoURL,
        phoneNumber: firebaseUser.phoneNumber || this.currentUser.phoneNumber,
        emailVerified: firebaseUser.emailVerified,
        status: firebaseUser.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
      };

      const updatedUser = await userDatabaseService.updateUserProfile(
        this.currentUser.uid,
        syncUpdates
      );
      this.currentUser = updatedUser;

      return updatedUser;
    } catch (error) {
      throw new UserProfileServiceError(
        'sync_failed',
        'Failed to sync authentication data with profile',
        error as Error
      );
    }
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get user profile by UID
   */
  async getUserProfile(uid: string): Promise<User | null> {
    return await userDatabaseService.getUserProfile(uid);
  }

  /**
   * Subscribe to current user profile changes
   */
  subscribeToCurrentUserProfile(callback: (user: User | null) => void): Unsubscribe | null {
    if (!this.currentUser) {
      return null;
    }

    this.userProfileUnsubscribe = userDatabaseService.subscribeToUserProfile(
      this.currentUser.uid,
      (user) => {
        this.currentUser = user;
        callback(user);
      }
    );

    return this.userProfileUnsubscribe;
  }

  /**
   * Weather preferences management
   */
  async getWeatherPreferences(): Promise<WeatherPreferences | null> {
    if (!this.currentUser) {
      return null;
    }

    return await userDatabaseService.getWeatherPreferences(this.currentUser.uid);
  }

  async updateWeatherPreferences(preferences: Partial<WeatherPreferences>): Promise<WeatherPreferences> {
    if (!this.currentUser) {
      throw new UserProfileServiceError('not_authenticated', 'User must be authenticated');
    }

    try {
      return await userDatabaseService.updateWeatherPreferences(
        this.currentUser.uid,
        preferences
      );
    } catch (error) {
      throw new UserProfileServiceError(
        'weather_preferences_update_failed',
        'Failed to update weather preferences',
        error as Error
      );
    }
  }

  /**
   * User activity tracking
   */
  async trackUserActivity(action: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.currentUser) {
      return;
    }

    try {
      await userDatabaseService.logUserActivity({
        uid: this.currentUser.uid,
        action,
        timestamp: toFirestoreTimestamp(),
        metadata,
      });
    } catch (error) {
      // Don't throw error for activity tracking failures
    }
  }

  /**
   * Delete user profile
   */
  async deleteUserProfile(): Promise<void> {
    if (!this.currentUser) {
      throw new UserProfileServiceError('not_authenticated', 'User must be authenticated');
    }

    try {
      const uid = this.currentUser.uid;
      
      // Delete Firestore profile
      await userDatabaseService.deleteUserProfile(uid);
      
      // Delete Firebase Auth user
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await firebaseUser.delete();
      }

      // Clear local state
      this.currentUser = null;
      this.cleanup();
    } catch (error) {
      throw new UserProfileServiceError(
        'profile_deletion_failed',
        'Failed to delete user profile',
        error as Error
      );
    }
  }

  /**
   * Handle OAuth provider linking
   */
  async linkAuthProvider(provider: AuthProvider, firebaseUser: FirebaseUser): Promise<User> {
    if (!this.currentUser) {
      throw new UserProfileServiceError('not_authenticated', 'User must be authenticated');
    }

    try {
      const linkedProvider = this.createLinkedProviderFromFirebaseUser(firebaseUser, provider, false);
      
      const updates: UpdateUserProfile = {
        providers: [...new Set([...this.currentUser.providers, provider])],
        linkedProviders: [
          ...this.currentUser.linkedProviders.filter(lp => lp.provider !== provider),
          linkedProvider[0],
        ],
      };

      const updatedUser = await userDatabaseService.updateUserProfile(
        this.currentUser.uid,
        updates
      );
      this.currentUser = updatedUser;

      await this.trackUserActivity('provider_linked', { provider });

      return updatedUser;
    } catch (error) {
      throw new UserProfileServiceError(
        'provider_linking_failed',
        'Failed to link authentication provider',
        error as Error
      );
    }
  }

  /**
   * Handle OAuth provider unlinking
   */
  async unlinkAuthProvider(provider: AuthProvider): Promise<User> {
    if (!this.currentUser) {
      throw new UserProfileServiceError('not_authenticated', 'User must be authenticated');
    }

    try {
      const updates: UpdateUserProfile = {
        providers: this.currentUser.providers.filter(p => p !== provider),
        linkedProviders: this.currentUser.linkedProviders.filter(lp => lp.provider !== provider),
      };

      const updatedUser = await userDatabaseService.updateUserProfile(
        this.currentUser.uid,
        updates
      );
      this.currentUser = updatedUser;

      await this.trackUserActivity('provider_unlinked', { provider });

      return updatedUser;
    } catch (error) {
      throw new UserProfileServiceError(
        'provider_unlinking_failed',
        'Failed to unlink authentication provider',
        error as Error
      );
    }
  }

  /**
   * Check if user profile exists
   */
  async userProfileExists(uid: string): Promise<boolean> {
    return await userDatabaseService.userExists(uid);
  }

  /**
   * Helper methods
   */
  private createLinkedProviderFromFirebaseUser(
    firebaseUser: FirebaseUser,
    provider: AuthProvider,
    isPrimary: boolean = true
  ): LinkedProvider[] {
    const now = toFirestoreTimestamp();
    
    return [{
      provider,
      providerId: firebaseUser.providerId || provider,
      providerUid: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      linkedAt: now,
      lastUsed: now,
      isVerified: firebaseUser.emailVerified,
      isPrimary,
      canUnlink: !isPrimary || this.currentUser?.providers.length === 1 ? false : true,
      metadata: {
        lastLogin: now,
        creationTime: firebaseUser.metadata.creationTime,
        lastSignInTime: firebaseUser.metadata.lastSignInTime,
      },
    }];
  }

  /**
   * Cleanup subscriptions
   */
  private cleanup(): void {
    if (this.userProfileUnsubscribe) {
      this.userProfileUnsubscribe();
      this.userProfileUnsubscribe = null;
    }
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.cleanup();
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
    this.currentUser = null;
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();
export default userProfileService;