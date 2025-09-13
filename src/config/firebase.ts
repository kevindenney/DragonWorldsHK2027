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
 */
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

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

  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required Firebase configuration: ${missingFields.join(', ')}. ` +
      'Please check your environment variables.'
    );
  }

  if (__DEV__ && process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {
    console.log('Firebase Config:', {
      ...config,
      apiKey: config.apiKey.substring(0, 10) + '...'
    });
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