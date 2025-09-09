import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  deleteUser,
  User,
  UserCredential,
  AuthError
} from 'firebase/auth';
import { auth } from '../firebase';

export interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  static async createUser(userData: CreateUserData): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      if (userData.displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: userData.displayName
        });
      }

      return userCredential;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error creating user:', authError.message);
      throw new Error(`Failed to create user: ${authError.message}`);
    }
  }

  static async signIn(signInData: SignInData): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        signInData.email,
        signInData.password
      );
      return userCredential;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error signing in:', authError.message);
      throw new Error(`Failed to sign in: ${authError.message}`);
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error signing out:', authError.message);
      throw new Error(`Failed to sign out: ${authError.message}`);
    }
  }

  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  static async updateUserProfile(displayName?: string, photoURL?: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      await updateProfile(user, {
        displayName: displayName ?? user.displayName,
        photoURL: photoURL ?? user.photoURL
      });
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error updating profile:', authError.message);
      throw new Error(`Failed to update profile: ${authError.message}`);
    }
  }

  static async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error sending password reset:', authError.message);
      throw new Error(`Failed to send password reset: ${authError.message}`);
    }
  }

  static async updateUserPassword(newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      await updatePassword(user, newPassword);
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error updating password:', authError.message);
      throw new Error(`Failed to update password: ${authError.message}`);
    }
  }

  static async deleteUserAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      await deleteUser(user);
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error deleting user:', authError.message);
      throw new Error(`Failed to delete user: ${authError.message}`);
    }
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return auth.onAuthStateChanged(callback);
  }
}