import { config } from './environment';

/**
 * Client-side Firebase configuration for web applications
 * This configuration is safe to expose to the client
 */
export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Get Firebase configuration for client-side applications
 */
export function getClientFirebaseConfig(): FirebaseClientConfig {
  return {
    apiKey: config.firebase.webApiKey || '',
    authDomain: config.firebase.authDomain || `${config.firebase.projectId}.firebaseapp.com`,
    projectId: config.firebase.projectId,
    storageBucket: `${config.firebase.projectId}.appspot.com`,
    messagingSenderId: extractMessagingId(config.firebase.webApiKey || ''),
    appId: extractAppId(config.firebase.webApiKey || ''),
    measurementId: config.firebase.measurementId
  };
}

/**
 * Get enabled OAuth providers configuration
 */
export interface OAuthProvidersConfig {
  google: {
    enabled: boolean;
    clientId: string;
  };
  apple: {
    enabled: boolean;
    clientId: string;
  };
  facebook: {
    enabled: boolean;
  };
  github: {
    enabled: boolean;
  };
}

export function getEnabledOAuthProviders(): OAuthProvidersConfig {
  return {
    google: {
      enabled: config.oauth.google.enabled && !!config.oauth.google.clientId,
      clientId: config.oauth.google.clientId
    },
    apple: {
      enabled: config.oauth.apple.enabled && !!config.oauth.apple.clientId,
      clientId: config.oauth.apple.clientId
    },
    facebook: {
      enabled: config.socialProviders.facebook
    },
    github: {
      enabled: config.socialProviders.github
    }
  };
}

/**
 * OAuth redirect URLs configuration
 */
export interface OAuthRedirectConfig {
  redirectUrl: string;
  successRedirect: string;
  errorRedirect: string;
}

export function getOAuthRedirectConfig(): OAuthRedirectConfig {
  return {
    redirectUrl: config.oauth.redirectUrl,
    successRedirect: config.oauth.successRedirect,
    errorRedirect: config.oauth.errorRedirect
  };
}

/**
 * Client-side authentication configuration
 */
export interface AuthConfig {
  firebase: FirebaseClientConfig;
  oauthProviders: OAuthProvidersConfig;
  redirects: OAuthRedirectConfig;
  features: {
    enableRegistration: boolean;
    enableEmailVerification: boolean;
    enablePasswordReset: boolean;
    enableSocialLogin: boolean;
    enableAccountLinking: boolean;
    enableProviderUnlinking: boolean;
  };
}

/**
 * Get complete authentication configuration for client applications
 */
export function getAuthConfig(): AuthConfig {
  return {
    firebase: getClientFirebaseConfig(),
    oauthProviders: getEnabledOAuthProviders(),
    redirects: getOAuthRedirectConfig(),
    features: config.features
  };
}

// Helper functions to extract IDs from API keys (basic implementation)
function extractMessagingId(apiKey: string): string {
  // In a real implementation, you would get this from Firebase project settings
  // For now, return a placeholder
  return '123456789';
}

function extractAppId(apiKey: string): string {
  // In a real implementation, you would get this from Firebase project settings
  // For now, return a placeholder based on project ID
  return `1:123456789:web:${config.firebase.projectId}`;
}

/**
 * Validate client configuration
 */
export function validateClientConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.firebase.webApiKey) {
    errors.push('FIREBASE_WEB_API_KEY is required for client-side integration');
  }
  
  if (!config.firebase.projectId) {
    errors.push('FIREBASE_PROJECT_ID is required');
  }
  
  if (config.oauth.google.enabled && !config.oauth.google.clientId) {
    errors.push('GOOGLE_CLIENT_ID is required when Google OAuth is enabled');
  }
  
  if (config.oauth.apple.enabled && !config.oauth.apple.clientId) {
    errors.push('APPLE_CLIENT_ID is required when Apple OAuth is enabled');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Export client-safe configuration as JSON (for API endpoints)
 */
export function getClientConfigJSON(): string {
  const clientConfig = getAuthConfig();
  
  // Remove sensitive information that should not be exposed to clients
  const safeConfig = {
    firebase: clientConfig.firebase,
    oauthProviders: {
      google: {
        enabled: clientConfig.oauthProviders.google.enabled,
        clientId: clientConfig.oauthProviders.google.clientId
      },
      apple: {
        enabled: clientConfig.oauthProviders.apple.enabled,
        clientId: clientConfig.oauthProviders.apple.clientId
      },
      facebook: {
        enabled: clientConfig.oauthProviders.facebook.enabled
      },
      github: {
        enabled: clientConfig.oauthProviders.github.enabled
      }
    },
    redirects: clientConfig.redirects,
    features: clientConfig.features
  };
  
  return JSON.stringify(safeConfig, null, 2);
}

export default {
  getClientFirebaseConfig,
  getEnabledOAuthProviders,
  getOAuthRedirectConfig,
  getAuthConfig,
  validateClientConfig,
  getClientConfigJSON
};