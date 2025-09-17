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
console.log('🔍 [Firebase] Debugging Firebase config object...');
debugFirebaseConfig(firebaseConfig);

// Additional debugging for environment variables
console.log('🔍 [Firebase] Environment variable values:');
console.log('EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '***set***' : 'MISSING');
console.log('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING');
console.log('EXPO_PUBLIC_FIREBASE_PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING');
console.log('EXPO_PUBLIC_FIREBASE_APP_ID:', process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? '***set***' : 'MISSING');

/**
 * Validation function for Firebase configuration
 */
function validateFirebaseConfig(config: FirebaseConfig): void {
  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  console.log('🔍 [Firebase] Validating configuration...');
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    console.error('❌ [Firebase] Missing required configuration fields:', missingFields);
    console.error('❌ [Firebase] Current config values:');
    requiredFields.forEach(field => {
      const value = config[field];
      console.error(`  ${field}: ${value ? (field === 'apiKey' ? '***set***' : value) : 'MISSING'}`);
    });

    throw new Error(
      `Missing required Firebase configuration: ${missingFields.join(', ')}. ` +
      'Please check your .env files and environment variables.'
    );
  }

  console.log('✅ [Firebase] Configuration validation passed');

  if (__DEV__) {
    console.log('🔍 [Firebase] Configuration summary:');
    console.log('  Project ID:', config.projectId);
    console.log('  Auth Domain:', config.authDomain);
    console.log('  API Key:', config.apiKey ? '***set***' : 'MISSING');
  }
}

/**
 * Test Firebase connectivity
 */
export async function testFirebaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 [Firebase] Testing connection...');

    // Test if auth is available
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }

    // Test if we can access auth properties
    const currentUser = auth.currentUser;
    console.log('✅ [Firebase] Auth service accessible, current user:', currentUser ? 'logged in' : 'anonymous');

    return { success: true };
  } catch (error) {
    console.error('❌ [Firebase] Connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
}

// Validate configuration with additional diagnostics
try {
  validateFirebaseConfig(firebaseConfig);
  if (__DEV__) {
    console.log('[firebase.ts] ✅ Config validated. projectId=', firebaseConfig.projectId);
  }
} catch (e) {
  console.error('[firebase.ts] ❌ Firebase config validation failed:', e);
  console.log('[firebase.ts] Env snapshot', {
    NODE_ENV: process.env.EXPO_PUBLIC_NODE_ENV,
    hasApiKey: Boolean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
    hasAuthDomain: Boolean(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
    hasProjectId: Boolean(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
    hasStorageBucket: Boolean(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
    hasMessagingSenderId: Boolean(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    hasAppId: Boolean(process.env.EXPO_PUBLIC_FIREBASE_APP_ID)
  });
  throw e;
}

/**
 * Initialize Firebase app
 */
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

/**
 * Initialize Firebase services with proper persistence for React Native
 */
let auth: Auth;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Initialize Auth with persistence for React Native
if (Platform.OS !== 'web') {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
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

export { auth, firestore, storage };
export const isFirestoreReady = () => Boolean(firestore);

// Analytics disabled for mobile - only available on web
export let analytics: any = null;

/**
 * Connect to Firebase emulators in development
 */
if (__DEV__ && process.env.EXPO_PUBLIC_NODE_ENV === 'development') {
  const EMULATOR_HOST = process.env.EXPO_PUBLIC_EMULATOR_HOST || 'localhost';
  
  try {
    // Connect Auth Emulator
    try {
      connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, {
        disableWarnings: true
      });
    } catch (error) {
      // Emulator might already be connected
    }

    // Connect Firestore Emulator only if firestore is available 
    if (firestore) {
      try {
        connectFirestoreEmulator(firestore, EMULATOR_HOST, 8080);
      } catch (error) {
        // Emulator might already be connected
      }
    }

    // Connect Storage Emulator only if storage is available
    if (storage) {
      try {
        connectStorageEmulator(storage, EMULATOR_HOST, 9199);
      } catch (error) {
        // Emulator might already be connected
      }
    }

    console.log('🔥 Connected to Firebase emulators');
  } catch (error) {
    // Emulators might already be connected
    console.log('Firebase emulators connection info:', error);
  }
}

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