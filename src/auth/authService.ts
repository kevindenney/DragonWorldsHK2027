import {
  Auth,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  deleteUser,
  AuthError as FirebaseAuthError,
  onAuthStateChanged,
  Unsubscribe,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';
import {
  User,
  LoginCredentials,
  RegistrationData,
  AuthError,
  AuthProvider,
  AuthErrorCodes,
  ProfileUpdateRequest,
  UserRole,
  UserStatus,
} from '../types/auth';

class AuthService {
  private auth: Auth;
  private unsubscribeAuth: Unsubscribe | null = null;

  constructor() {
    this.auth = auth;
  }

  private handleAuthError = (error: FirebaseAuthError): AuthError => {
    const code = error.code as keyof typeof AuthErrorCodes;
    return {
      code: error.code,
      message: AuthErrorCodes[code] || AuthErrorCodes['auth/unknown'],
      details: error,
    };
  };

  private mapFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    const providerIds = firebaseUser.providerData.map(p => {
      switch (p.providerId) {
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
    });

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL,
      phoneNumber: firebaseUser.phoneNumber,
      emailVerified: firebaseUser.emailVerified,
      role: UserRole.USER,
      status: firebaseUser.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
      providers: providerIds,
      linkedProviders: firebaseUser.providerData.map(provider => ({
        provider: providerIds.find(p => provider.providerId.includes(p.toLowerCase())) || AuthProvider.EMAIL,
        providerId: provider.providerId,
        providerUid: provider.uid,
        email: provider.email,
        displayName: provider.displayName,
        photoURL: provider.photoURL,
        linkedAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        isVerified: true,
        isPrimary: provider.providerId === firebaseUser.providerId,
        canUnlink: firebaseUser.providerData.length > 1,
      })),
      primaryProvider: providerIds[0] || AuthProvider.EMAIL,
      profile: {
        bio: undefined,
        website: undefined,
        location: undefined,
        dateOfBirth: undefined,
        gender: undefined,
        timezone: undefined,
        language: undefined,
      },
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        privacy: {
          profileVisible: true,
          emailVisible: false,
          phoneVisible: false,
          allowProviderLinking: true,
          allowDataSync: true,
        },
        theme: 'auto',
        oauth: {
          autoSyncProfile: true,
          allowMultipleAccounts: false,
          preferredProvider: providerIds[0],
        },
      },
      metadata: {
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: firebaseUser.metadata.lastSignInTime,
        lastActiveAt: new Date().toISOString(),
        loginCount: 1,
      },
    };
  };

  // Email/Password Authentication
  signInWithEmailAndPassword = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(this.auth, credentials.email, credentials.password);
      return await this.mapFirebaseUserToUser(result.user);
    } catch (error) {
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  };

  createUserWithEmailAndPassword = async (registrationData: RegistrationData): Promise<User> => {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, registrationData.email, registrationData.password);
      
      // Update profile with display name
      if (registrationData.displayName) {
        await updateProfile(result.user, {
          displayName: registrationData.displayName,
        });
      }

      return await this.mapFirebaseUserToUser(result.user);
    } catch (error) {
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  };

  // Google Sign-In (placeholder - disabled for now)
  signInWithGoogle = async (method: 'popup' | 'redirect' = 'popup'): Promise<User> => {
    throw new Error('Google Sign-In is temporarily disabled');
  };

  // Apple Sign-In (placeholder - disabled for now)
  signInWithApple = async (): Promise<User> => {
    throw new Error('Apple Sign-In is temporarily disabled');
  };

  // Password Reset
  sendPasswordResetEmail = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  };

  // Email Verification
  sendEmailVerification = async (): Promise<void> => {
    try {
      if (!this.auth.currentUser) {
        throw new Error('No user is currently signed in');
      }
      await sendEmailVerification(this.auth.currentUser);
    } catch (error) {
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  };

  // Profile Update
  updateUserProfile = async (profileUpdate: ProfileUpdateRequest): Promise<void> => {
    try {
      if (!this.auth.currentUser) {
        throw new Error('No user is currently signed in');
      }

      const updateData: { displayName?: string; photoURL?: string } = {};
      
      if (profileUpdate.displayName !== undefined) {
        updateData.displayName = profileUpdate.displayName;
      }
      
      if (profileUpdate.photoURL !== undefined) {
        updateData.photoURL = profileUpdate.photoURL;
      }

      await updateProfile(this.auth.currentUser, updateData);
    } catch (error) {
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  };

  // Sign Out
  signOut = async (): Promise<void> => {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  };

  // Delete Account
  deleteAccount = async (): Promise<void> => {
    try {
      if (!this.auth.currentUser) {
        throw new Error('No user is currently signed in');
      }
      await deleteUser(this.auth.currentUser);
    } catch (error) {
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  };

  // Get Current User
  getCurrentUser = (): FirebaseUser | null => {
    return this.auth.currentUser;
  };

  // Auth State Listener
  onAuthStateChanged = (callback: (user: User | null) => void): Unsubscribe => {
    return onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.mapFirebaseUserToUser(firebaseUser);
        callback(user);
      } else {
        callback(null);
      }
    });
  };

  // Initialize Google Sign-In (placeholder - disabled for now)
  initializeGoogleSignIn = (webClientId: string) => {
    // Google Sign-In initialization disabled
    console.log('Google Sign-In initialization skipped');
  };

  // Check if user is signed in
  isSignedIn = (): boolean => {
    return this.auth.currentUser !== null;
  };

  // Get user token
  getUserToken = async (forceRefresh: boolean = false): Promise<string | null> => {
    if (!this.auth.currentUser) {
      return null;
    }
    
    try {
      return await this.auth.currentUser.getIdToken(forceRefresh);
    } catch (error) {
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  };
}

// Export singleton instance
export const authService = new AuthService();
export default authService;