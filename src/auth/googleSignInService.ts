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
      console.log('🔐 [GoogleSignIn] Already initialized');
      return;
    }

    try {
      console.log('🔐 [GoogleSignIn] Initializing Google Sign-In...');

      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

      console.log('🔍 [GoogleSignIn] DEBUG - Environment variables:');
      console.log('  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:', webClientId || 'MISSING');
      console.log('  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:', iosClientId || 'MISSING');
      console.log('  Platform:', Platform.OS);

      if (!webClientId) {
        throw new Error('Google Web Client ID not configured');
      }

      // Validate client ID format
      if (!webClientId.includes('.apps.googleusercontent.com')) {
        console.warn('⚠️ [GoogleSignIn] Web Client ID format unexpected:', webClientId);
      }

      console.log('🔐 [GoogleSignIn] Configuring with client IDs:', {
        webClientIdPrefix: webClientId.split('-')[0], // Log first part only for privacy
        hasWebClientId: !!webClientId,
        hasIosClientId: !!iosClientId,
        platform: Platform.OS
      });

      const configOptions = {
        webClientId: webClientId,
        iosClientId: Platform.OS === 'ios' ? iosClientId : undefined,
        offlineAccess: true,
        hostedDomain: '', // Use empty string for any domain
        forceCodeForRefreshToken: true,
        accountName: '',
        googleServicePlistPath: '',
        openIdConnect: true,
        profileImageSize: 120,
      };

      console.log('🔍 [GoogleSignIn] DEBUG - Configuration options:');
      console.log('  webClientId:', webClientId);
      console.log('  iosClientId:', configOptions.iosClientId || 'not set');
      console.log('  offlineAccess:', configOptions.offlineAccess);
      console.log('  openIdConnect:', configOptions.openIdConnect);

      GoogleSignin.configure(configOptions);

      this.initialized = true;
      console.log('✅ [GoogleSignIn] Initialized successfully with config:', {
        webClientIdSet: !!webClientId,
        iosClientIdSet: !!(Platform.OS === 'ios' && iosClientId)
      });
    } catch (error) {
      console.error('❌ [GoogleSignIn] Initialization failed:', error);
      throw error;
    }
  }

  async signIn(): Promise<GoogleSignInResult> {
    try {
      await this.initialize();

      console.log('🔐 [GoogleSignIn] Starting sign-in process...');
      console.log('🔍 [GoogleSignIn] DEBUG - Pre-sign-in state check');

      // Check current sign-in status
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        console.log('🔍 [GoogleSignIn] Currently signed in:', isSignedIn);

        if (isSignedIn) {
          const currentUser = await GoogleSignin.getCurrentUser();
          console.log('🔍 [GoogleSignIn] Current user:', currentUser?.data?.user?.email || currentUser?.user?.email || 'none');
        }
      } catch (error) {
        console.warn('⚠️ [GoogleSignIn] Could not check current sign-in status:', error);
      }

      // Check if device has Google Play Services (Android)
      if (Platform.OS === 'android') {
        console.log('🔍 [GoogleSignIn] Checking Google Play Services...');
        await GoogleSignin.hasPlayServices();
        console.log('✅ [GoogleSignIn] Google Play Services available');
      }

      console.log('🔍 [GoogleSignIn] Initiating GoogleSignin.signIn()...');
      const response = await GoogleSignin.signIn();

      console.log('✅ [GoogleSignIn] Sign-in successful - analyzing response structure...');
      console.log('🔍 [GoogleSignIn] FULL response object:', JSON.stringify(response, null, 2));
      console.log('🔍 [GoogleSignIn] response type:', typeof response);
      console.log('🔍 [GoogleSignIn] response keys:', response ? Object.keys(response) : 'null');

      // Handle the new API structure in version 16+
      let userData, idToken, serverAuthCode;

      if (response.type === 'success') {
        // New API structure (v16+)
        console.log('🔍 [GoogleSignIn] Using new API structure (v16+)');
        userData = response.data.user;
        idToken = response.data.idToken;
        serverAuthCode = response.data.serverAuthCode;
      } else if (response.user) {
        // Legacy API structure
        console.log('🔍 [GoogleSignIn] Using legacy API structure');
        userData = response.user;
        idToken = response.idToken;
        serverAuthCode = response.serverAuthCode;
      } else {
        console.error('❌ [GoogleSignIn] Unknown response structure:', response);
        throw new Error('Google Sign-In returned unknown response structure');
      }

      console.log('🔍 [GoogleSignIn] Extracted user data:', JSON.stringify(userData, null, 2));

      // Validate user data structure
      if (!userData) {
        console.error('❌ [GoogleSignIn] userData is null or undefined');
        throw new Error('Google Sign-In returned null user data');
      }

      if (!userData.id) {
        console.error('❌ [GoogleSignIn] userData.id is missing. Available keys:', Object.keys(userData));
        console.error('❌ [GoogleSignIn] Full userData:', userData);
        throw new Error('Google Sign-In returned user data without ID');
      }

      console.log('✅ [GoogleSignIn] User structure validated:', {
        userId: userData.id,
        email: userData.email || 'undefined',
        name: userData.name || 'undefined',
        hasIdToken: !!idToken,
        hasServerAuthCode: !!serverAuthCode
      });

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
      console.error('❌ [GoogleSignIn] Sign-in failed:', error);

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
      console.log('✅ [GoogleSignIn] Sign-out successful');
    } catch (error) {
      console.error('❌ [GoogleSignIn] Sign-out failed:', error);
      throw error;
    }
  }

  async isSignedIn(): Promise<boolean> {
    try {
      await this.initialize();
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('❌ [GoogleSignIn] Check sign-in status failed:', error);
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
        console.error('❌ [GoogleSignIn] Unknown getCurrentUser response structure:', response);
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
      console.error('❌ [GoogleSignIn] Get current user failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const googleSignInService = new GoogleSignInService();