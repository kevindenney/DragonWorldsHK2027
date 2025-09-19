/**
 * Isolated Firebase Authentication Service
 * 
 * This service handles all Firebase authentication operations
 * with no external dependencies to prevent circular imports.
 * Pure business logic only - no state management.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth, firestore } from '../../config/firebase';
import { LoginCredentials, RegisterCredentials, User, AuthProviderType, UserStatus } from '../authTypes';
import { setDoc, getDoc, doc } from 'firebase/firestore';
import { googleSignInService } from '../googleSignInService';

/**
 * Convert Firebase User to our User type
 */
function convertFirebaseUser(firebaseUser: FirebaseUser, additionalData?: any): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: additionalData?.displayName || firebaseUser.displayName || '',
    photoURL: additionalData?.photoURL || firebaseUser.photoURL || undefined,
    phoneNumber: additionalData?.phoneNumber || firebaseUser.phoneNumber || undefined,
    emailVerified: firebaseUser.emailVerified,
    role: additionalData?.role || 'participant',
    status: additionalData?.status || UserStatus.ACTIVE, // Default to ACTIVE for authenticated users
    providers: additionalData?.providers || ['email'],
    createdAt: additionalData?.createdAt?.toDate?.() || new Date(),
    updatedAt: additionalData?.updatedAt?.toDate?.() || new Date(),
    preferences: additionalData?.preferences,
  };
}

/**
 * Firebase Authentication Service
 */
export class FirebaseAuthService {
  /**
   * Test Firebase connection and configuration
   */
  async testConnection(): Promise<{ isConnected: boolean; error?: string }> {
    try {
      console.log('🔍 [FirebaseAuth] Testing Firebase connection...');

      // Check if auth instance is available
      if (!auth) {
        return { isConnected: false, error: 'Firebase auth instance not initialized' };
      }

      // Check current auth state
      const currentUser = auth.currentUser;
      console.log('🔍 [FirebaseAuth] Current user:', currentUser ? currentUser.uid : 'None');

      // Test auth configuration by attempting to get current user
      try {
        await auth.authStateReady();
        console.log('✅ [FirebaseAuth] Auth state ready');
      } catch (error) {
        console.error('❌ [FirebaseAuth] Auth state not ready:', error);
        return { isConnected: false, error: `Auth state not ready: ${error.message}` };
      }

      // Check if we're using emulator
      const isUsingEmulator = auth.config?.emulator || false;
      console.log('🔍 [FirebaseAuth] Using emulator:', isUsingEmulator);

      // Test basic auth functionality by checking if we can access auth methods
      if (typeof signInWithEmailAndPassword !== 'function') {
        return { isConnected: false, error: 'Firebase auth methods not available' };
      }

      console.log('✅ [FirebaseAuth] Connection test passed');
      return { isConnected: true };
    } catch (error: any) {
      console.error('❌ [FirebaseAuth] Connection test failed:', error);
      return { isConnected: false, error: error.message || 'Unknown connection error' };
    }
  }

  /**
   * Check Firebase service health
   */
  async checkServiceHealth(): Promise<{ isHealthy: boolean; details: any }> {
    try {
      console.log('🏥 [FirebaseAuth] Checking service health...');

      const details = {
        authInstance: !!auth,
        firestoreInstance: !!firestore,
        currentUser: auth?.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          emailVerified: auth.currentUser.emailVerified
        } : null,
        emulatorMode: auth?.config?.emulator || false,
        authMethods: {
          signIn: typeof signInWithEmailAndPassword === 'function',
          signUp: typeof createUserWithEmailAndPassword === 'function',
          signOut: typeof signOut === 'function',
          resetPassword: typeof sendPasswordResetEmail === 'function'
        }
      };

      console.log('🏥 [FirebaseAuth] Service health details:', details);

      const isHealthy = details.authInstance &&
                       details.authMethods.signIn &&
                       details.authMethods.signUp &&
                       details.authMethods.signOut;

      return { isHealthy, details };
    } catch (error: any) {
      console.error('❌ [FirebaseAuth] Service health check failed:', error);
      return {
        isHealthy: false,
        details: { error: error.message || 'Unknown health check error' }
      };
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      console.log('🔐 [FirebaseAuth] Starting login process...');

      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.isConnected) {
        console.error('❌ [FirebaseAuth] Connection test failed:', connectionTest.error);
        throw new Error(`Firebase connection failed: ${connectionTest.error}`);
      }

      // Check service health
      const healthCheck = await this.checkServiceHealth();
      if (!healthCheck.isHealthy) {
        console.error('❌ [FirebaseAuth] Service health check failed:', healthCheck.details);
        throw new Error(`Firebase service unhealthy: ${JSON.stringify(healthCheck.details)}`);
      }

      console.log('✅ [FirebaseAuth] Pre-login checks passed, attempting authentication...');

      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Try to fetch additional user data from Firestore
      let userData = null;
      if (firestore) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
          userData = userDoc.data();
        } catch (error) {
          console.warn('Could not fetch user data from Firestore:', error);
        }
      }

      return convertFirebaseUser(userCredential.user, userData);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Register new user with email and password
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      console.log('🔐 [FirebaseAuth] Starting user registration...');

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      console.log('✅ [FirebaseAuth] User created successfully:', userCredential.user.uid);

      // Update display name in Firebase Auth
      await updateProfile(userCredential.user, {
        displayName: credentials.displayName,
      });

      console.log('✅ [FirebaseAuth] Display name updated');

      // Create user document in Firestore
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: credentials.displayName || '',
        emailVerified: false,
        role: 'participant',
        providers: ['email'],
        preferences: {
          notifications: true,
          newsletter: false,
          language: 'en',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (firestore) {
        try {
          await setDoc(doc(firestore, 'users', userCredential.user.uid), userData);
          console.log('✅ [FirebaseAuth] User document created in Firestore');
        } catch (error) {
          console.warn('⚠️ [FirebaseAuth] Could not create user document in Firestore:', error);
        }
      }

      // Send verification email
      try {
        await sendEmailVerification(userCredential.user);
        console.log('✅ [FirebaseAuth] Verification email sent');
      } catch (error) {
        console.warn('⚠️ [FirebaseAuth] Could not send verification email:', error);
      }

      console.log('🎉 [FirebaseAuth] Registration complete! User should be signed in.');
      console.log('🔐 [FirebaseAuth] Current user after registration:', auth.currentUser?.uid);

      return convertFirebaseUser(userCredential.user, userData);
    } catch (error: any) {
      console.error('❌ [FirebaseAuth] Registration failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login with OAuth provider
   */
  async loginWithProvider(provider: AuthProviderType): Promise<User> {
    try {
      console.log(`🔐 [FirebaseAuth] Starting ${provider} login...`);

      if (provider === 'google') {
        return await this.loginWithGoogle();
      } else {
        throw new Error(`${provider} login not yet configured. Please use email/password authentication.`);
      }
    } catch (error: any) {
      console.error(`❌ [FirebaseAuth] ${provider} login failed:`, error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login with Google
   */
  private async loginWithGoogle(): Promise<User> {
    try {
      console.log('🔐 [FirebaseAuth] Initiating Google Sign-In...');
      console.log('🔍 [FirebaseAuth] DEBUG - Firebase project context:');
      console.log('  Firebase app name:', auth?.app?.name || 'unknown');
      console.log('  Firebase project ID:', auth?.app?.options?.projectId || 'unknown');
      console.log('  Firebase auth domain:', auth?.app?.options?.authDomain || 'unknown');

      // Use Google Sign-In service to get credentials
      console.log('🔍 [FirebaseAuth] Calling Google Sign-In service...');
      const googleResult = await googleSignInService.signIn();

      console.log('✅ [FirebaseAuth] Google Sign-In successful, authenticating with Firebase...');
      console.log('🔍 [FirebaseAuth] DEBUG - Google Sign-In result:');

      // Validate googleResult structure
      if (!googleResult || !googleResult.user) {
        console.error('❌ [FirebaseAuth] Invalid Google Sign-In result structure:', googleResult);
        throw new Error('Google Sign-In returned invalid user data');
      }

      console.log('  User ID:', googleResult.user.id || 'undefined');
      console.log('  User email:', googleResult.user.email || 'undefined');
      console.log('  User name:', googleResult.user.name || 'undefined');
      console.log('  Has ID token:', !!googleResult.idToken);
      console.log('  Has access token:', !!googleResult.accessToken);
      console.log('  ID token preview:', googleResult.idToken ? `${googleResult.idToken.substring(0, 20)}...` : 'none');

      if (!googleResult.idToken) {
        throw new Error('Google Sign-In did not return an ID token');
      }

      // Create Firebase credential from Google ID token
      console.log('🔍 [FirebaseAuth] Creating Firebase credential...');
      const credential = GoogleAuthProvider.credential(googleResult.idToken, googleResult.accessToken);
      console.log('✅ [FirebaseAuth] Firebase credential created');

      // Sign in to Firebase with the credential
      console.log('🔍 [FirebaseAuth] Signing in to Firebase with credential...');
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      console.log('✅ [FirebaseAuth] Firebase authentication successful:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        emailVerified: firebaseUser.emailVerified
      });

      console.log('🔍 [FirebaseAuth] DEBUG - Firebase user details:');
      console.log('  Provider data:', firebaseUser.providerData?.map(p => ({
        providerId: p.providerId,
        uid: p.uid,
        email: p.email
      })) || []);
      console.log('  Metadata - creation time:', firebaseUser.metadata?.creationTime);
      console.log('  Metadata - last sign in time:', firebaseUser.metadata?.lastSignInTime);

      // Save/update user data in Firestore
      if (firestore) {
        try {
          const userData = {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || googleResult.user.name,
            photoURL: firebaseUser.photoURL || googleResult.user.photo,
            providers: ['google'],
            role: 'participant',
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: {
              notifications: true,
              newsletter: false,
              language: 'en',
            },
          };

          await setDoc(doc(firestore, 'users', firebaseUser.uid), userData, { merge: true });
          console.log('✅ [FirebaseAuth] User data saved to Firestore');
        } catch (error) {
          console.warn('⚠️ [FirebaseAuth] Could not save user data to Firestore:', error);
        }
      }

      // Return converted user
      return convertFirebaseUser(firebaseUser, {
        displayName: firebaseUser.displayName || googleResult.user.name,
        photoURL: firebaseUser.photoURL || googleResult.user.photo,
        providers: ['google'],
        role: 'participant',
      });
    } catch (error: any) {
      console.error('❌ [FirebaseAuth] Google login failed:', error);
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<User>): Promise<User> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      // Update Firestore document
      if (firestore) {
        try {
          const updatedData = {
            ...updates,
            updatedAt: new Date(),
          };
          await setDoc(doc(firestore, 'users', currentUser.uid), updatedData, { merge: true });
        } catch (error) {
          console.warn('Could not update user document in Firestore:', error);
        }
      }

      // Return updated user
      return convertFirebaseUser(currentUser, updates);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      await sendEmailVerification(currentUser);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Set up authentication state listener
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 [FirebaseAuth] Auth state changed:', firebaseUser ? `User: ${firebaseUser.uid}` : 'No user');

      if (firebaseUser) {
        console.log('✅ [FirebaseAuth] User is signed in:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified
        });

        // Fetch additional user data from Firestore
        let userData = null;
        if (firestore) {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
            userData = userDoc.data();
            console.log('✅ [FirebaseAuth] Firestore user data fetched:', userData ? 'Found' : 'Not found');
          } catch (error) {
            console.warn('⚠️ [FirebaseAuth] Could not fetch user data from Firestore:', error);
          }
        }

        const user = convertFirebaseUser(firebaseUser, userData);
        console.log('📋 [FirebaseAuth] Converted user object:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        callback(user);
      } else {
        console.log('❌ [FirebaseAuth] User is signed out');
        callback(null);
      }
    });
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    const firebaseUser = auth.currentUser;
    return firebaseUser ? convertFirebaseUser(firebaseUser) : null;
  }

  /**
   * Handle Firebase Auth errors and convert to user-friendly messages
   */
  private handleAuthError(error: any): Error {
    let message: string;

    switch (error?.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/email-already-in-use':
        message = 'An account already exists with this email';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        break;
      case 'auth/too-many-requests':
        message = 'Too many attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      default:
        message = error?.message || 'Authentication failed';
    }

    return new Error(message);
  }
}

// Export singleton instance
export const authService = new FirebaseAuthService();