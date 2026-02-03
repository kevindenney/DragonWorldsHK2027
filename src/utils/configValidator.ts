/**
 * Runtime Configuration Validator
 *
 * Validates and logs all configuration at app startup to debug
 * potential environment variable or configuration issues.
 */

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  debugInfo: Record<string, any>;
}

export function validateRuntimeConfiguration(): ConfigValidationResult {

  const result: ConfigValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    debugInfo: {}
  };

  // Firebase Configuration
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  result.debugInfo.firebase = {
    hasApiKey: !!firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
    hasAppId: !!firebaseConfig.appId,
    hasMeasurementId: !!firebaseConfig.measurementId,
  };

  Object.entries(result.debugInfo.firebase).forEach(([key, value]) => {
  });

  // Validate Firebase project ID
  if (firebaseConfig.projectId !== 'dragonworldshk2027') {
    result.errors.push(`Firebase project ID mismatch: expected 'dragonworldshk2027', got '${firebaseConfig.projectId}'`);
    result.isValid = false;
  }

  // Google OAuth Configuration
  const googleConfig = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  };

  result.debugInfo.google = {
    webClientId: googleConfig.webClientId,
    iosClientId: googleConfig.iosClientId,
    androidClientId: googleConfig.androidClientId,
    webClientIdPrefix: googleConfig.webClientId?.split('-')[0] || 'missing',
  };

  Object.entries(result.debugInfo.google).forEach(([key, value]) => {
  });

  // Validate Google Client ID format and consistency
  if (!googleConfig.webClientId?.includes('.apps.googleusercontent.com')) {
    result.errors.push('Google Web Client ID format is invalid');
    result.isValid = false;
  }

  if (googleConfig.webClientId && !googleConfig.webClientId.includes('839737857128')) {
    result.warnings.push('Google Web Client ID does not contain expected prefix 839737857128');
  }

  // Environment Information
  result.debugInfo.environment = {
    nodeEnv: process.env.EXPO_PUBLIC_NODE_ENV,
    debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE,
    platform: require('react-native').Platform.OS,
    isDev: __DEV__,
  };

  Object.entries(result.debugInfo.environment).forEach(([key, value]) => {
  });

  // URL Schemes (from app.json via Metro bundler)
  result.debugInfo.urlSchemes = {
    expectedOAuthScheme: 'com.googleusercontent.apps.839737857128-qvdva2jrauf49erhratq7ri72d9hfjbb',
    expectedAppScheme: 'dragonworlds',
    note: 'URL schemes are not accessible via environment variables at runtime'
  };

  // Summary

  if (result.errors.length > 0) {
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.isValid) {
  } else {
  }

  return result;
}

/**
 * Log all process.env variables (safely)
 */
export function logEnvironmentVariables(): void {

  const expoPublicVars = Object.keys(process.env)
    .filter(key => key.startsWith('EXPO_PUBLIC_'))
    .sort();

  expoPublicVars.forEach(key => {
    const value = process.env[key];
    // Safely log sensitive values
    if (key.includes('API_KEY') || key.includes('SECRET')) {
    } else {
    }
  });

  if (expoPublicVars.length === 0) {
  }
}