declare module '@env' {
  export const EXPO_PUBLIC_FIREBASE_API_KEY: string;
  export const EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  export const EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
  export const EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  export const EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  export const EXPO_PUBLIC_FIREBASE_APP_ID: string;
  export const EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;
  
  export const EXPO_PUBLIC_BACKEND_URL: string;
  export const EXPO_PUBLIC_API_VERSION: string;
  
  export const EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
  export const EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: string;
  export const EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: string;
  
  export const EXPO_PUBLIC_NODE_ENV: string;
  export const EXPO_PUBLIC_DEBUG_MODE: string;
  export const EXPO_PUBLIC_EMULATOR_HOST?: string;
}

// Extend process.env type for better TypeScript support
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_FIREBASE_API_KEY: string;
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
      EXPO_PUBLIC_FIREBASE_APP_ID: string;
      EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;
      
      EXPO_PUBLIC_BACKEND_URL: string;
      EXPO_PUBLIC_API_VERSION: string;
      
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: string;
      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: string;
      
      EXPO_PUBLIC_NODE_ENV: string;
      EXPO_PUBLIC_DEBUG_MODE: string;
      EXPO_PUBLIC_EMULATOR_HOST?: string;
    }
  }
}