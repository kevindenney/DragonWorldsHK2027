import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';
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
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
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

// Validate configuration
validateFirebaseConfig(firebaseConfig);

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
 * Initialize Firebase services
 */
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Initialize Analytics only on web platform
export let analytics: Analytics | null = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

/**
 * Connect to Firebase emulators in development
 */
if (__DEV__ && process.env.EXPO_PUBLIC_NODE_ENV === 'development') {
  const EMULATOR_HOST = process.env.EXPO_PUBLIC_EMULATOR_HOST || 'localhost';
  
  try {
    // Connect Auth Emulator
    if (!auth._delegate._config?.emulator) {
      connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, {
        disableWarnings: true
      });
    }

    // Connect Firestore Emulator  
    if (!firestore._delegate._databaseId.projectId.includes('demo-')) {
      connectFirestoreEmulator(firestore, EMULATOR_HOST, 8080);
    }

    // Connect Storage Emulator
    if (!storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, EMULATOR_HOST, 9199);
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