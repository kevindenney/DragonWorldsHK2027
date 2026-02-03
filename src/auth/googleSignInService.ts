import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
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

      // Configure without empty strings that cause issues on iOS
      const configOptions = {
        webClientId: webClientId,
        iosClientId: Platform.OS === 'ios' ? iosClientId : undefined,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        profileImageSize: 120,
      };


      GoogleSignin.configure(configOptions);

      this.initialized = true;
    } catch (error) {
      throw error;
    }
  }

  async signIn(): Promise<GoogleSignInResult> {
    try {
      await this.initialize();


      // Check current sign-in status
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();

        if (isSignedIn) {
          const currentUser = await GoogleSignin.getCurrentUser();
        }
      } catch (error) {
      }

      // Check if device has Google Play Services (Android)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      const response = await GoogleSignin.signIn();


      // Handle the new API structure in version 16+
      let userData, idToken, serverAuthCode;

      if (response.type === 'success') {
        // New API structure (v16+)
        userData = response.data.user;
        idToken = response.data.idToken;
        serverAuthCode = response.data.serverAuthCode;
      } else if (response.user) {
        // Legacy API structure
        userData = response.user;
        idToken = response.idToken;
        serverAuthCode = response.serverAuthCode;
      } else {
        throw new Error('Google Sign-In returned unknown response structure');
      }


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
        idToken: idToken,
        accessToken: serverAuthCode, // Note: using serverAuthCode as accessToken for compatibility
      };
    } catch (error: any) {

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Google sign-in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      } else {
        throw new Error(error.message || 'Google sign-in failed');
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

  async isSignedIn(): Promise<boolean> {
    try {
      await this.initialize();
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      return false;
    }
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      await this.initialize();
      const response = await GoogleSignin.getCurrentUser();

      if (!response) {
        return null;
      }

      // Handle both new API structure (v16+) and legacy structure
      let userData;
      if (response.data && response.data.user) {
        // New API structure (v16+)
        userData = response.data.user;
      } else if (response.user) {
        // Legacy API structure
        userData = response.user;
      } else {
        return null;
      }

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