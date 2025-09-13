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
} from 'firebase/auth';
import { auth, firestore } from '../../config/firebase';
import { LoginCredentials, RegisterCredentials, User, AuthProviderType } from '../authTypes';
import { setDoc, getDoc, doc } from 'firebase/firestore';

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
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
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
          console.log('User document created in Firestore');
        } catch (error) {
          console.warn('Could not create user document in Firestore:', error);
        }
      }

      // Send verification email
      await sendEmailVerification(userCredential.user);

      return convertFirebaseUser(userCredential.user, userData);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login with OAuth provider (placeholder for future implementation)
   */
  async loginWithProvider(provider: AuthProviderType): Promise<User> {
    throw new Error(`${provider} login not yet configured. Please use email/password authentication.`);
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
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        let userData = null;
        if (firestore) {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
            userData = userDoc.data();
          } catch (error) {
            console.warn('Could not fetch user data from Firestore:', error);
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