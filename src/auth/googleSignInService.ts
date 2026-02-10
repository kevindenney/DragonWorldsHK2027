import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

interface GoogleUser {
  id: string;
  name: string | null;
  email: string;
  photo: string | null;
  familyName: string | null;
  givenName: string | null;
}

interface GoogleSignInResult {
  user: GoogleUser;
  idToken: string | null;
  accessToken: string | null;
}

export class GoogleSignInService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

      if (!webClientId) {
        throw new Error('Google Web Client ID not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
      }

      // Validate iOS Client ID on iOS platform
      if (Platform.OS === 'ios' && !iosClientId) {
        throw new Error('Google iOS Client ID not configured. Please set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
      }

      // Validate client ID format
      if (!webClientId.includes('.apps.googleusercontent.com')) {
        throw new Error('Invalid Google Web Client ID format');
      }

      // DEBUG: Log actual client IDs being used at runtime
      console.log('[GoogleSignIn] === DEBUG CONFIG ===');
      console.log('[GoogleSignIn] webClientId:', webClientId);
      console.log('[GoogleSignIn] webClientId length:', webClientId?.length);
      console.log('[GoogleSignIn] webClientId last 20 chars:', webClientId?.slice(-20));
      console.log('[GoogleSignIn] iosClientId:', iosClientId);
      console.log('[GoogleSignIn] iosClientId length:', iosClientId?.length);
      console.log('[GoogleSignIn] Platform:', Platform.OS);
      console.log('[GoogleSignIn] === END DEBUG ===');

      // Configure without empty strings that cause issues on iOS
      const configOptions = {
        webClientId: webClientId,
        iosClientId: Platform.OS === 'ios' ? iosClientId : undefined,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        profileImageSize: 120,
      };

      console.log('[GoogleSignIn] Calling GoogleSignin.configure() with:', JSON.stringify(configOptions));

      GoogleSignin.configure(configOptions);

      this.initialized = true;
      console.log('[GoogleSignIn] Configuration complete');
    } catch (error) {
      throw error;
    }
  }

  async signIn(): Promise<GoogleSignInResult> {
    try {
      await this.initialize();


      // Check current sign-in status using hasPreviousSignIn (synchronous)
      try {
        const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();

        if (hasPreviousSignIn) {
          const currentUser = GoogleSignin.getCurrentUser();
          if (currentUser) {
            console.log('[GoogleSignIn] Found existing user:', currentUser.user.email);
          }
        }
      } catch (error) {
        // Silently continue if check fails
      }

      // Check if device has Google Play Services (Android)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      console.log('[GoogleSignIn] Calling GoogleSignin.signIn()...');
      const response = await GoogleSignin.signIn();
      console.log('[GoogleSignIn] signIn response type:', response.type);


      // Handle the response based on type
      if (response.type === 'cancelled') {
        throw new Error('Google sign-in was cancelled');
      }

      // response.type === 'success'
      // data is of type User which has: { user, scopes, idToken, serverAuthCode }
      const { data } = response;
      const userData = data.user;


      // Validate user data structure
      if (!userData) {
        throw new Error('Google Sign-In returned null user data');
      }

      if (!userData.id) {
        throw new Error('Google Sign-In returned user data without ID');
      }


      return {
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          photo: userData.photo,
          familyName: userData.familyName,
          givenName: userData.givenName,
        },
        idToken: data.idToken,
        accessToken: data.serverAuthCode, // Note: using serverAuthCode as accessToken for compatibility
      };
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };

      console.error('[GoogleSignIn] === SIGN IN ERROR ===');
      console.error('[GoogleSignIn] Error code:', err.code);
      console.error('[GoogleSignIn] Error message:', err.message);
      console.error('[GoogleSignIn] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
      console.error('[GoogleSignIn] === END ERROR ===');

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Google sign-in was cancelled');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google sign-in is already in progress');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else {
        throw new Error(err.message || 'Google sign-in failed');
      }
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.initialize();
      await GoogleSignin.signOut();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has previously signed in (synchronous)
   */
  isSignedIn(): boolean {
    try {
      // Note: hasPreviousSignIn is synchronous in v14+
      return GoogleSignin.hasPreviousSignIn();
    } catch (error) {
      return false;
    }
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      await this.initialize();

      // getCurrentUser returns User | null directly
      // User has structure: { user: {...}, scopes, idToken, serverAuthCode }
      const userResponse = GoogleSignin.getCurrentUser();

      if (!userResponse) {
        return null;
      }

      // Extract the nested user data
      const userData = userResponse.user;

      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        photo: userData.photo,
        familyName: userData.familyName,
        givenName: userData.givenName,
      };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const googleSignInService = new GoogleSignInService();
