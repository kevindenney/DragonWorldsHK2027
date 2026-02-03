import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  connectAuthEmulator,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Analytics conditionally imported only for web
import { Platform } from 'react-native';
import { debugFirebaseConfig } from '../utils/hermesDebugger';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Firebase configuration from environment variables
 * TEMPORARY: Using fallback config for testing when env vars are missing
 */
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dragonworldshk2027.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'dragonworldshk2027',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dragonworldshk2027.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

// Debug Firebase config object for Hermes compatibility
debugFirebaseConfig(firebaseConfig);

// Additional debugging for environment variables

/**
 * Enhanced validation function for Firebase configuration with emulator support
 */
function validateFirebaseConfig(config: FirebaseConfig): { isValid: boolean; isEmulator: boolean; errors: string[] } {
  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !config[field]);
  const errors: string[] = [];

  // Check if we're likely using emulator mode (missing API key but have project ID)
  const isEmulatorMode = !config.apiKey && config.projectId;

  if (missingFields.length > 0) {
    requiredFields.forEach(field => {
      const value = config[field];
    });

    if (isEmulatorMode) {
      // For emulator mode, only project ID is strictly required
      if (!config.projectId) {
        errors.push('Project ID is required even in emulator mode');
      }
    } else {
      errors.push(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
    }
  }

  const isValid = errors.length === 0;

  if (isValid) {
    if (isEmulatorMode) {
    }
  } else {
  }

  if (__DEV__) {
    console.log('🔍 [Firebase] Configuration summary:');
    console.log('  Project ID:', config.projectId);
    console.log('  Auth Domain:', config.authDomain);
    console.log('  API Key:', config.apiKey ? '***set***' : 'MISSING');
    console.log('  Emulator Mode:', isEmulatorMode);
  }

  return { isValid, isEmulator: isEmulatorMode, errors };
}

/**
 * Test Firebase connectivity
 */
export async function testFirebaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {

    // Test if auth is available
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    // Test if we can access auth properties
    const currentUser = auth.currentUser;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
}

// Validate configuration with enhanced emulator support
const configValidation = validateFirebaseConfig(firebaseConfig);
let isEmulatorMode = false;

if (!configValidation.isValid) {

  // Don't throw - let AuthProvider handle fallback to mock auth
} else {
  if (__DEV__) {
    console.log('[firebase.ts] ✅ Config validated. projectId=', firebaseConfig.projectId);
    if (configValidation.isEmulator) {
      console.log('[firebase.ts] 🔥 Running in emulator mode');
      isEmulatorMode = true;
    }
  }
}

/**
 * Initialize Firebase app
 */
let app: FirebaseApp | null = null;

try {
  if (configValidation.isValid && getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else if (configValidation.isValid) {
    app = getApp();
  } else {
  }
} catch (error) {
  app = null;
}

/**
 * Initialize Firebase services with proper persistence for React Native
 */
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Only initialize Firebase services if app was successfully created
if (app) {
  try {
    // Initialize Auth with persistence for React Native
    if (Platform.OS !== 'web') {
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } catch (error) {
        // Auth might already be initialized
        auth = getAuth(app);
      }
    } else {
      auth = getAuth(app);
    }

    // Initialize Firestore and Storage only if Firebase is properly configured
    try {
      if (__DEV__) console.log('[firebase.ts] Attempting to initialize Firestore/Storage...');
      firestore = getFirestore(app);
      storage = getStorage(app);
      console.log('✅ Firebase Firestore and Storage initialized');
    } catch (error) {
      console.warn('⚠️ Firebase Firestore/Storage initialization skipped:', error);
      // Services will remain null if not available
    }
  } catch (error) {
  }
} else {
}

export { auth, firestore, storage };
export const isFirestoreReady = () => Boolean(firestore);

// Analytics disabled for mobile - only available on web
export let analytics: any = null;

/**
 * Connect to Firebase emulators in development with enhanced debugging
 */
if (__DEV__ && (process.env.EXPO_PUBLIC_NODE_ENV === 'development' || isEmulatorMode) && app && auth) {
  const EMULATOR_HOST = process.env.EXPO_PUBLIC_EMULATOR_HOST || 'localhost';

  console.log('🔥 [Firebase] Attempting to connect to emulators...');
  console.log('🔥 [Firebase] Emulator host:', EMULATOR_HOST);

  const emulatorConnections = {
    auth: false,
    firestore: false,
    storage: false
  };

  try {
    // Connect Auth Emulator
    try {
      connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, {
        disableWarnings: true
      });
      emulatorConnections.auth = true;
      console.log('✅ [Firebase] Auth emulator connected');
    } catch (error: any) {
      if (error.message.includes('already')) {
        emulatorConnections.auth = true;
        console.log('✅ [Firebase] Auth emulator already connected');
      } else {
        console.warn('⚠️ [Firebase] Auth emulator connection failed:', error.message);
      }
    }

    // Connect Firestore Emulator only if firestore is available
    if (firestore) {
      try {
        connectFirestoreEmulator(firestore, EMULATOR_HOST, 8090);
        emulatorConnections.firestore = true;
        console.log('✅ [Firebase] Firestore emulator connected');
      } catch (error: any) {
        if (error.message.includes('already')) {
          emulatorConnections.firestore = true;
          console.log('✅ [Firebase] Firestore emulator already connected');
        } else {
          console.warn('⚠️ [Firebase] Firestore emulator connection failed:', error.message);
        }
      }
    }

    // Connect Storage Emulator only if storage is available
    if (storage) {
      try {
        connectStorageEmulator(storage, EMULATOR_HOST, 9199);
        emulatorConnections.storage = true;
        console.log('✅ [Firebase] Storage emulator connected');
      } catch (error: any) {
        if (error.message.includes('already')) {
          emulatorConnections.storage = true;
          console.log('✅ [Firebase] Storage emulator already connected');
        } else {
          console.warn('⚠️ [Firebase] Storage emulator connection failed:', error.message);
        }
      }
    }

    console.log('🔥 [Firebase] Emulator connection summary:', emulatorConnections);

    if (emulatorConnections.auth) {
      console.log('🔥 [Firebase] Auth emulator ready at http://localhost:9099');
    }
  } catch (error) {
    console.error('❌ [Firebase] Emulator connection error:', error);
  }
}

// Export emulator mode for other modules to use
export { isEmulatorMode };

/**
 * Backend API configuration
 */
export const apiConfig = {
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  apiVersion: process.env.EXPO_PUBLIC_API_VERSION || 'v1',
  timeout: 10000,
} as const;

/**
 * OAuth configuration
 */
export const oauthConfig = {
  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  },
} as const;

/**
 * App configuration
 */
export const appConfig = {
  isDebug: __DEV__ && process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  environment: process.env.EXPO_PUBLIC_NODE_ENV || 'development',
  projectId: firebaseConfig.projectId,
} as const;

export default app;