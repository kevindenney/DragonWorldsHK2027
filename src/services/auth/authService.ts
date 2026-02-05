import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError as FirebaseAuthError,
  GoogleAuthProvider,
  signInWithCredential,
  linkWithCredential,
  unlink,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { auth } from '../../config/firebase';
import { authApi, userApi } from '../api/client';
import {
  User,
  AuthState,
  LoginCredentials,
  RegistrationData,
  PasswordResetRequest,
  PasswordChangeRequest,
  AuthError,
  AuthErrorCodes,
  AuthErrorCode,
  AuthProviderType,
  OAuthLoginResponse,
  AccountLinkingRequest,
} from '../../types/auth';

/**
 * Authentication Service Class
 */
class AuthService {
  private listeners: Array<(authState: AuthState) => void> = [];
  private currentAuthState: AuthState = {
    user: null,
    firebaseUser: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    lastActivity: null,
  };

  constructor() {
    // Skip initialization since we're using the authStore directly
    // this.initializeAuth();
  }

  /**
   * Initialize authentication
   */
  private initializeAuth() {
    // Listen for Firebase auth state changes
    if (!auth) return; // Skip if auth not initialized
    onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        await this.handleAuthStateChange(firebaseUser);
      } catch (error) {
        this.updateAuthState({
          user: null,
          firebaseUser: null,
          isLoading: false,
          isAuthenticated: false,
          error: 'Authentication error',
          lastActivity: Date.now(),
        });
      }
    });
  }


  /**
   * Handle Firebase auth state changes
   */
  private async handleAuthStateChange(firebaseUser: FirebaseUser | null) {
    this.updateAuthState({ isLoading: true });

    if (firebaseUser) {
      try {
        // Get ID token for backend authentication
        const idToken = await firebaseUser.getIdToken();
        authApi.setAuthToken(idToken);

        // Get user data from backend
        const response = await userApi.getProfile();
        
        if (response.success && response.data) {
          // Store auth data
          await this.storeAuthData(idToken, response.data);

          this.updateAuthState({
            user: response.data,
            firebaseUser,
            isLoading: false,
            isAuthenticated: true,
            error: null,
            lastActivity: Date.now(),
          });
        } else {
          throw new Error('Failed to fetch user profile');
        }
      } catch (error) {
        await this.signOut();
      }
    } else {
      // User is signed out
      authApi.clearAuthToken();
      await this.clearStoredAuthData();
      
      this.updateAuthState({
        user: null,
        firebaseUser: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
        lastActivity: Date.now(),
      });
    }
  }

  /**
   * Update auth state and notify listeners
   */
  private updateAuthState(updates: Partial<AuthState>) {
    this.currentAuthState = { ...this.currentAuthState, ...updates };
    this.listeners.forEach(listener => listener(this.currentAuthState));
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (authState: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Call listener immediately with current state
    listener(this.currentAuthState);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current auth state
   */
  getCurrentState(): AuthState {
    return this.currentAuthState;
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(token: string, user: User) {
    try {
      await AsyncStorage.multiSet([
        ['@auth_token', token],
        ['@user_data', JSON.stringify(user)],
        ['@last_activity', Date.now().toString()],
      ]);
    } catch (error) {
    }
  }

  /**
   * Clear stored authentication data
   */
  private async clearStoredAuthData() {
    try {
      await AsyncStorage.multiRemove(['@auth_token', '@user_data', '@last_activity']);
    } catch (error) {
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): AuthError {
    if (error.code && error.code in AuthErrorCodes) {
      return {
        code: error.code,
        message: AuthErrorCodes[error.code as AuthErrorCode],
        details: error,
      };
    }

    return {
      code: 'auth/unknown',
      message: error.message || 'An unknown error occurred',
      details: error,
    };
  }

  // Public Methods

  /**
   * Register with email and password
   */
  async register(data: RegistrationData): Promise<OAuthLoginResponse> {
    try {
      this.updateAuthState({ isLoading: true, error: null });

      // Create user in Firebase
      if (!auth) throw new Error('Firebase Auth is not initialized');
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Update display name
      await updateProfile(credential.user, {
        displayName: data.displayName,
      });

      // Send email verification
      await sendEmailVerification(credential.user);

      // Register with backend
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Registration failed');
      }

      return response.data;
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.updateAuthState({ isLoading: false, error: authError.message });
      throw authError;
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<OAuthLoginResponse> {
    try {
      this.updateAuthState({ isLoading: true, error: null });

      // Sign in with Firebase
      if (!auth) throw new Error('Firebase Auth is not initialized');
      const result = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Backend will handle the auth state change
      return {
        user: this.currentAuthState.user!,
        tokens: {
          accessToken: await result.user.getIdToken(),
          expiresIn: 3600,
        },
      };
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.updateAuthState({ isLoading: false, error: authError.message });
      throw authError;
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<OAuthLoginResponse> {
    try {
      this.updateAuthState({ isLoading: true, error: null });

      if (Platform.OS === 'web') {
        return await this.signInWithGoogleWeb();
      } else {
        return await this.signInWithGoogleNative();
      }
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.updateAuthState({ isLoading: false, error: authError.message });
      throw authError;
    }
  }

  /**
   * Google Sign-In for web
   * NOTE: This method requires an ID token obtained from OAuth flow.
   * For proper web implementation, use signInWithPopup or signInWithRedirect.
   */
  private async signInWithGoogleWeb(): Promise<OAuthLoginResponse> {
    // For web, we would typically use signInWithPopup or signInWithRedirect
    // This is a simplified version that requires an external OAuth flow
    throw new Error('Web Google Sign-In requires OAuth flow implementation');

    // Note: Code below is unreachable but kept as placeholder for future implementation
    // const provider = new GoogleAuthProvider();
    // provider.addScope('email');
    // provider.addScope('profile');
    // if (!auth) throw new Error('Firebase Auth is not initialized');
    // const result = await signInWithPopup(auth, provider);
    // const idToken = await result.user.getIdToken();
    // const response = await authApi.loginWithGoogle(idToken);
    // if (!response.success || !response.data) {
    //   throw new Error(response.error || 'Google sign-in failed');
    // }
    // return response.data;
  }

  /**
   * Google Sign-In for native platforms
   */
  private async signInWithGoogleNative(): Promise<OAuthLoginResponse> {
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices();

    // Get user info and id token
    // Note: v13 API returns { data: { user, idToken } } structure
    const signInResult = await GoogleSignin.signIn();
    const idToken = (signInResult as any).data?.idToken || (signInResult as any).idToken;

    if (!idToken) {
      throw new Error('Google sign-in failed: No ID token received');
    }

    // Create credential and sign in with Firebase
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const googleCredential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, googleCredential);

    // Authenticate with backend
    const response = await authApi.loginWithGoogle(idToken);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Google sign-in failed');
    }

    return response.data;
  }

  /**
   * Sign in with Apple (iOS only)
   */
  async signInWithApple(): Promise<OAuthLoginResponse> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In is only available on iOS');
      }

      this.updateAuthState({ isLoading: true, error: null });

      // Perform Apple Sign-In request using Expo API
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      const { identityToken } = credential;
      if (!identityToken) {
        throw new Error('Apple Sign-In failed: No identity token received');
      }

      // Authenticate with backend
      const response = await authApi.loginWithApple(identityToken);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Apple sign-in failed');
      }

      return response.data;
    } catch (error) {
      const authError = this.handleAuthError(error);
      this.updateAuthState({ isLoading: false, error: authError.message });
      throw authError;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      this.updateAuthState({ isLoading: true, error: null });

      // Sign out from Google if signed in
      if (Platform.OS !== 'web') {
        try {
          await GoogleSignin.signOut();
        } catch (error) {
          // Google sign-out might fail if user wasn't signed in with Google
        }
      }

      // Notify backend
      try {
        await authApi.logout();
      } catch (error) {
      }

      // Sign out from Firebase
      if (auth) await signOut(auth);
    } catch (error) {
      // Force clear local state even if sign out fails
      await this.clearStoredAuthData();
      authApi.clearAuthToken();
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(request: PasswordResetRequest): Promise<void> {
    try {
      if (!auth) throw new Error('Firebase Auth is not initialized');
      await sendPasswordResetEmail(auth, request.email);
      await authApi.resetPassword(request.email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(request: PasswordChangeRequest): Promise<void> {
    try {
      if (!this.currentAuthState.firebaseUser) {
        throw new Error('No user signed in');
      }

      // Reauthenticate with current password
      const credential = EmailAuthProvider.credential(
        this.currentAuthState.firebaseUser.email!,
        request.currentPassword
      );
      
      await reauthenticateWithCredential(this.currentAuthState.firebaseUser, credential);

      // Update password in Firebase
      await updatePassword(this.currentAuthState.firebaseUser, request.newPassword);

      // Update password in backend
      await authApi.changePassword({
        currentPassword: request.currentPassword,
        newPassword: request.newPassword,
      });
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<void> {
    try {
      if (!this.currentAuthState.firebaseUser) {
        throw new Error('No user signed in');
      }

      await sendEmailVerification(this.currentAuthState.firebaseUser);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Link OAuth provider to account
   */
  async linkProvider(request: AccountLinkingRequest): Promise<User> {
    try {
      if (!this.currentAuthState.firebaseUser) {
        throw new Error('No user signed in');
      }

      const response = await authApi.linkProvider(request);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Provider linking failed');
      }

      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Unlink OAuth provider from account
   */
  async unlinkProvider(provider: AuthProviderType): Promise<User> {
    try {
      if (!this.currentAuthState.firebaseUser) {
        throw new Error('No user signed in');
      }

      // Unlink from Firebase
      await unlink(this.currentAuthState.firebaseUser, provider);

      // Unlink from backend
      const response = await authApi.unlinkProvider(provider);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Provider unlinking failed');
      }

      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    try {
      if (!this.currentAuthState.firebaseUser) {
        throw new Error('No user signed in');
      }

      const idToken = await this.currentAuthState.firebaseUser.getIdToken(true);
      authApi.setAuthToken(idToken);
      
      await this.storeAuthData(idToken, this.currentAuthState.user!);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;