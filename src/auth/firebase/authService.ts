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
  OAuthProvider,
  signInWithCredential,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { auth, firestore } from '../../config/firebase';
import { LoginCredentials, RegisterCredentials, User, AuthProviderType, UserStatus } from '../authTypes';
import { setDoc, getDoc, doc, collection, query, where, getDocs, limit } from 'firebase/firestore';
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
    sailingProfile: additionalData?.sailingProfile,
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

      // Check if auth instance is available
      if (!auth) {
        return { isConnected: false, error: 'Firebase auth instance not initialized' };
      }

      // Check current auth state
      const currentUser = auth.currentUser;

      // Test auth configuration by attempting to get current user
      try {
        await auth.authStateReady();
      } catch (error: unknown) {
        const err = error as Error;
        return { isConnected: false, error: `Auth state not ready: ${err.message}` };
      }

      // Check if we're using emulator (simplified check)
      const isUsingEmulator = false; // Emulator detection handled elsewhere

      // Test basic auth functionality by checking if we can access auth methods
      if (typeof signInWithEmailAndPassword !== 'function') {
        return { isConnected: false, error: 'Firebase auth methods not available' };
      }

      return { isConnected: true };
    } catch (error: any) {
      return { isConnected: false, error: error.message || 'Unknown connection error' };
    }
  }

  /**
   * Check Firebase service health
   */
  async checkServiceHealth(): Promise<{ isHealthy: boolean; details: any }> {
    try {

      const details = {
        authInstance: !!auth,
        firestoreInstance: !!firestore,
        currentUser: auth?.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          emailVerified: auth.currentUser.emailVerified
        } : null,
        emulatorMode: false, // Emulator detection handled elsewhere
        authMethods: {
          signIn: typeof signInWithEmailAndPassword === 'function',
          signUp: typeof createUserWithEmailAndPassword === 'function',
          signOut: typeof signOut === 'function',
          resetPassword: typeof sendPasswordResetEmail === 'function'
        }
      };


      const isHealthy = details.authInstance &&
                       details.authMethods.signIn &&
                       details.authMethods.signUp &&
                       details.authMethods.signOut;

      return { isHealthy, details };
    } catch (error: any) {
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
      // Note: Removed testConnection() and checkServiceHealth() pre-checks
      // These were causing race conditions with the 15-second timeout in AuthProvider
      // Firebase Auth already handles connection errors properly and returns appropriate error codes

      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

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
          if (userDoc.exists()) {
            userData = userDoc.data();
          } else {
            // User exists in Auth but not in Firestore - create the missing document
            console.log('[AuthService] User missing from Firestore, creating document...');
            const newUserData = {
              uid: userCredential.user.uid,
              email: (userCredential.user.email || '').toLowerCase().trim(),
              displayName: userCredential.user.displayName || '',
              emailVerified: userCredential.user.emailVerified,
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
            let createSuccess = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                await setDoc(doc(firestore, 'users', userCredential.user.uid), newUserData);
                userData = newUserData;
                createSuccess = true;
                console.log('[AuthService] Created missing Firestore document for user');
                break;
              } catch (createError: any) {
                console.log(`[AuthService] Firestore recovery attempt ${attempt}/3 failed:`, createError?.message);
                if (attempt < 3) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
              }
            }
            if (!createSuccess) {
              console.error('[AuthService] Could not create user document after 3 attempts');
            }
          }
        } catch (error: any) {
          // Use console.log to avoid LogBox warnings in dev mode
          // Firestore offline is common and not a real failure - user is still authenticated
          console.log('[AuthService] Could not fetch user document (offline?):', error?.message);
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
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );


      // Update display name in Firebase Auth
      await updateProfile(userCredential.user, {
        displayName: credentials.displayName,
      });


      // Create user document in Firestore
      // Normalize email to lowercase for consistent querying
      const userData = {
        uid: userCredential.user.uid,
        email: (userCredential.user.email || '').toLowerCase().trim(),
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
        const maxRetries = 3;
        let firestoreSuccess = false;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await setDoc(doc(firestore, 'users', userCredential.user.uid), userData);
            console.log('[AuthService] User document created in Firestore');
            firestoreSuccess = true;
            break;
          } catch (error: any) {
            console.error(`[AuthService] Firestore setDoc attempt ${attempt}/${maxRetries} failed:`, error?.message || error);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
        if (!firestoreSuccess) {
          console.error('[AuthService] CRITICAL: All Firestore write attempts failed — user has no Firestore document');
        }
      } else {
        console.error('[AuthService] CRITICAL: Firestore not initialized — cannot create user document');
      }

      // Send verification email
      try {
        await sendEmailVerification(userCredential.user);
      } catch (error) {
      }


      return convertFirebaseUser(userCredential.user, userData);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login with OAuth provider
   */
  async loginWithProvider(provider: AuthProviderType): Promise<User> {
    try {

      if (provider === 'google') {
        return await this.loginWithGoogle();
      } else if (provider === 'apple') {
        return await this.loginWithApple();
      } else {
        throw new Error(`${provider} login not yet configured. Please use email/password authentication.`);
      }
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login with Google
   */
  private async loginWithGoogle(): Promise<User> {
    try {

      // Use Google Sign-In service to get credentials
      const googleResult = await googleSignInService.signIn();


      // Validate googleResult structure
      if (!googleResult || !googleResult.user) {
        throw new Error('Google Sign-In returned invalid user data');
      }


      if (!googleResult.idToken) {
        throw new Error('Google Sign-In did not return an ID token');
      }

      // Create Firebase credential from Google ID token
      const credential = GoogleAuthProvider.credential(googleResult.idToken, googleResult.accessToken);

      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      // Sign in to Firebase with the credential
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;



      // Save/update user data in Firestore
      if (firestore) {
        try {
          const userData = {
            email: (firebaseUser.email || '').toLowerCase().trim(),
            displayName: firebaseUser.displayName || googleResult.user.name,
            photoURL: firebaseUser.photoURL || googleResult.user.photo,
            providers: ['google'],
            role: 'participant',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: {
              notifications: true,
              newsletter: false,
              language: 'en',
            },
          };

          await setDoc(doc(firestore, 'users', firebaseUser.uid), userData, { merge: true });
        } catch (error) {
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
      throw error;
    }
  }

  /**
   * Login with Apple
   */
  private async loginWithApple(): Promise<User> {
    try {
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign In is not available on this device');
      }

      // Generate a random nonce for security
      const rawNonce = Math.random().toString(36).substring(2, 15) +
                       Math.random().toString(36).substring(2, 15);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      // Request Apple Sign In
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleCredential.identityToken) {
        throw new Error('Apple Sign In did not return an identity token');
      }

      // Create Firebase credential from Apple credentials
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce: rawNonce,
      });

      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      // Sign in to Firebase with the credential
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      // Build display name from Apple credential (only provided on first sign in)
      let displayName = firebaseUser.displayName;
      if (!displayName && appleCredential.fullName) {
        const { givenName, familyName } = appleCredential.fullName;
        if (givenName || familyName) {
          displayName = [givenName, familyName].filter(Boolean).join(' ');
        }
      }

      // Save/update user data in Firestore
      if (firestore) {
        try {
          const userData = {
            email: (firebaseUser.email || appleCredential.email || '').toLowerCase().trim(),
            displayName: displayName,
            photoURL: firebaseUser.photoURL,
            providers: ['apple'],
            role: 'participant',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: {
              notifications: true,
              newsletter: false,
              language: 'en',
            },
          };

          await setDoc(doc(firestore, 'users', firebaseUser.uid), userData, { merge: true });
        } catch (error) {
          // Silently fail on Firestore write - user is still authenticated
        }
      }

      // Return converted user
      return convertFirebaseUser(firebaseUser, {
        displayName: displayName,
        photoURL: firebaseUser.photoURL,
        providers: ['apple'],
        role: 'participant',
      });
    } catch (error: any) {
      // Handle Apple Sign In specific errors
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Apple Sign In was cancelled');
      }
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
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
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Check if an email is already registered
   * Returns true if account exists, false if new email
   *
   * Strategy:
   * 1. Check Firestore users collection (fast, handles most cases)
   * 2. If not found, try signing in with dummy password to check Firebase Auth
   *    - "auth/wrong-password" = user exists in Auth (Firestore doc may be missing)
   *    - "auth/user-not-found" = user doesn't exist
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // First, check Firestore
      if (firestore) {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', normalizedEmail), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          console.log(`[AuthService] checkEmailExists(${email}): true (found in Firestore)`);
          return true;
        }
      }

      // Not found in Firestore
      // Note: We cannot reliably detect if user exists in Firebase Auth when
      // email enumeration protection is enabled (which is the default since Sept 2023).
      // Both "user not found" and "wrong password" return "auth/invalid-credential".
      //
      // Strategy: Return false (show signup screen). If user actually exists,
      // they will see "Email already in use" error and can switch to sign-in.
      console.log(`[AuthService] checkEmailExists(${email}): false (not in Firestore)`);
      return false;
    } catch (error: any) {
      console.log('[AuthService] checkEmailExists error:', error);
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<User>): Promise<User> {
    console.log('[AuthService] updateUserProfile called');
    console.log('[AuthService] Updates received:', JSON.stringify(updates));

    try {
      console.log('[AuthService] Checking auth...');
      if (!auth) {
        console.error('[AuthService] FAILURE: auth is null');
        throw new Error('Firebase Auth not initialized');
      }
      console.log('[AuthService] auth exists:', !!auth);

      const currentUser = auth.currentUser;
      console.log('[AuthService] currentUser exists:', !!currentUser);
      if (!currentUser) {
        console.error('[AuthService] FAILURE: currentUser is null');
        throw new Error('No user logged in');
      }
      console.log('[AuthService] currentUser.uid:', currentUser.uid);

      // Update Firebase Auth profile - only include defined fields
      const authProfileUpdates: { displayName?: string; photoURL?: string } = {};
      if (updates.displayName !== undefined) {
        authProfileUpdates.displayName = updates.displayName;
        console.log('[AuthService] Will update displayName to:', updates.displayName);
      }
      if (updates.photoURL !== undefined) {
        authProfileUpdates.photoURL = updates.photoURL;
        console.log('[AuthService] Will update photoURL to:', updates.photoURL);
      }

      console.log('[AuthService] authProfileUpdates:', JSON.stringify(authProfileUpdates));

      if (Object.keys(authProfileUpdates).length > 0) {
        console.log('[AuthService] Calling Firebase updateProfile...');
        try {
          await updateProfile(currentUser, authProfileUpdates);
          console.log('[AuthService] Firebase updateProfile SUCCESS');
        } catch (updateError: any) {
          console.error('[AuthService] Firebase updateProfile FAILED');
          console.error('[AuthService] updateProfile error:', updateError);
          console.error('[AuthService] updateProfile error code:', updateError?.code);
          console.error('[AuthService] updateProfile error message:', updateError?.message);
          throw updateError;
        }
      } else {
        console.log('[AuthService] No auth profile updates needed');
      }

      // Update Firestore document (fire and forget - don't block on this)
      if (firestore) {
        console.log('[AuthService] Updating Firestore document...');
        const updatedData = {
          ...updates,
          updatedAt: new Date(),
        };
        setDoc(doc(firestore, 'users', currentUser.uid), updatedData, { merge: true }).catch((firestoreError) => {
          console.log('[AuthService] Firestore update failed (non-blocking):', firestoreError);
          // Silently ignore Firestore errors - Firebase Auth is the source of truth
        });
      } else {
        console.log('[AuthService] Firestore not available, skipping document update');
      }

      // Return updated user
      console.log('[AuthService] Returning updated user');
      return convertFirebaseUser(currentUser, updates);
    } catch (error: any) {
      console.error('[AuthService] updateUserProfile error:', error);
      console.error('[AuthService] Error type:', error?.constructor?.name);
      console.error('[AuthService] Error code:', error?.code);
      console.error('[AuthService] Error message:', error?.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
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
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    return onAuthStateChanged(auth, async (firebaseUser) => {

      if (firebaseUser) {

        // Fetch additional user data from Firestore
        let userData = null;
        if (firestore) {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
            userData = userDoc.data();
          } catch (error) {
          }
        }

        const user = convertFirebaseUser(firebaseUser, userData);
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    if (!auth) {
      return null;
    }
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

    // Create new error with preserved code and stack trace for better debugging
    const newError: any = new Error(message);
    if (error?.code) {
      newError.code = error.code;
    }
    if (error?.stack) {
      newError.stack = error.stack;
    }
    return newError;
  }
}

// Export singleton instance
export const authService = new FirebaseAuthService();