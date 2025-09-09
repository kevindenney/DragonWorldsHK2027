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
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  OAuthProvider,
  getAdditionalUserInfo,
  AuthError as FirebaseAuthError,
  onAuthStateChanged,
  Unsubscribe,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
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
          return AuthProvider.GOOGLE;
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

  // Google Sign-In
  signInWithGoogle = async (method: 'popup' | 'redirect' = 'popup'): Promise<User> => {
    try {
      if (Platform.OS === 'web') {
        return await this.signInWithGoogleWeb(method);
      } else {
        return await this.signInWithGoogleNative();
      }
    } catch (error) {
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  };

  private signInWithGoogleWeb = async (method: 'popup' | 'redirect'): Promise<User> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const result = method === 'popup' 
      ? await signInWithPopup(this.auth, provider)
      : await signInWithRedirect(this.auth, provider);

    return await this.mapFirebaseUserToUser(result.user);
  };

  private signInWithGoogleNative = async (): Promise<User> => {
    // Check if your device supports Google Play services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Get the users ID token
    const { idToken } = await GoogleSignin.signIn();

    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    const result = await signInWithEmailAndPassword(this.auth, googleCredential.providerId, googleCredential.secret || '');
    
    return await this.mapFirebaseUserToUser(result.user);
  };

  // Apple Sign-In
  signInWithApple = async (): Promise<User> => {
    try {
      if (Platform.OS === 'web') {
        return await this.signInWithAppleWeb();
      } else {
        return await this.signInWithAppleNative();
      }
    } catch (error) {
      throw this.handleAuthError(error as FirebaseAuthError);
    }
  };

  private signInWithAppleWeb = async (): Promise<User> => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    const result = await signInWithPopup(this.auth, provider);
    return await this.mapFirebaseUserToUser(result.user);
  };

  private signInWithAppleNative = async (): Promise<User> => {
    // Perform the sign-in request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    // Ensure Apple returned a user identityToken
    if (!appleAuthRequestResponse.identityToken) {
      throw new Error('Apple Sign-In failed - no identify token returned');
    }

    // Create a Firebase credential from the response
    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = new OAuthProvider('apple.com').credential({
      idToken: identityToken,
      rawNonce: nonce,
    });

    // Sign the user in with the credential
    const result = await signInWithEmailAndPassword(this.auth, appleCredential.providerId, appleCredential.secret || '');
    
    return await this.mapFirebaseUserToUser(result.user);
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
      // Sign out from Google if signed in with Google
      if (Platform.OS !== 'web') {
        try {
          await GoogleSignin.signOut();
        } catch (error) {
          // Ignore Google sign out errors as user might not be signed in with Google
        }
      }

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

  // Initialize Google Sign-In (for React Native)
  initializeGoogleSignIn = (webClientId: string) => {
    if (Platform.OS !== 'web') {
      GoogleSignin.configure({
        webClientId,
        offlineAccess: true,
      });
    }
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