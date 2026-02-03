import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Environment types
export type Environment = 'development' | 'staging' | 'production';
export type BuildType = 'debug' | 'release';

// Configuration interface
export interface AppConfig {
  environment: Environment;
  buildType: BuildType;
  version: string;
  buildNumber: string;
  bundleId: string;
  
  // API Configuration
  apiUrl: string;
  weatherApiUrl: string;
  analyticsUrl?: string;
  
  // Feature Flags
  analyticsEnabled: boolean;
  sentryEnabled: boolean;
  crashlyticsEnabled: boolean;
  debugMenuEnabled: boolean;
  offlineMode: boolean;
  crossPromotionEnabled: boolean;
  
  // External Services
  sentryDsn?: string;
  amplitudeApiKey?: string;
  mixpanelToken?: string;
  
  // App Store & Play Store
  appStoreId?: string;
  playStoreId?: string;
  
  // Deep Linking
  scheme: string;
  universalLinks: string[];
  
  // Push Notifications
  pushNotificationsEnabled: boolean;
  oneSignalAppId?: string;
  
  // Subscription & Payments
  applePayMerchantId?: string;
  stripePublishableKey?: string;
  revenueCatApiKey?: string;
}

// Get current environment from Expo Constants
const getEnvironment = (): Environment => {
  const releaseChannel = Constants.expoConfig?.releaseChannel;
  const extra = Constants.expoConfig?.extra;
  
  if (__DEV__) {
    return 'development';
  }
  
  if (releaseChannel === 'staging' || extra?.NODE_ENV === 'staging') {
    return 'staging';
  }
  
  return 'production';
};

// Get build type
const getBuildType = (): BuildType => {
  return __DEV__ ? 'debug' : 'release';
};

// Environment-specific configurations
const environmentConfigs: Record<Environment, Partial<AppConfig>> = {
  development: {
    apiUrl: 'https://dev-api.dragonworlds.com',
    weatherApiUrl: 'https://dev-weather-api.dragonworlds.com',
    analyticsEnabled: true,
    sentryEnabled: false,
    crashlyticsEnabled: false,
    debugMenuEnabled: true,
    offlineMode: true,
    crossPromotionEnabled: true,
    pushNotificationsEnabled: false,
    sentryDsn: undefined,
    amplitudeApiKey: 'dev_amplitude_key_here',
    stripePublishableKey: 'pk_test_stripe_key_here',
  },
  
  staging: {
    apiUrl: 'https://staging-api.dragonworlds.com',
    weatherApiUrl: 'https://staging-weather-api.dragonworlds.com',
    analyticsEnabled: true,
    sentryEnabled: true,
    crashlyticsEnabled: true,
    debugMenuEnabled: false,
    offlineMode: true,
    crossPromotionEnabled: true,
    pushNotificationsEnabled: true,
    sentryDsn: 'https://staging-sentry-dsn@sentry.io/project-id',
    amplitudeApiKey: 'staging_amplitude_key_here',
    stripePublishableKey: 'pk_test_stripe_key_here',
    oneSignalAppId: 'staging-onesignal-app-id',
  },
  
  production: {
    apiUrl: 'https://api.dragonworlds.com',
    weatherApiUrl: 'https://weather-api.dragonworlds.com',
    analyticsUrl: 'https://analytics.dragonworlds.com',
    analyticsEnabled: true,
    sentryEnabled: true,
    crashlyticsEnabled: true,
    debugMenuEnabled: false,
    offlineMode: true,
    crossPromotionEnabled: true,
    pushNotificationsEnabled: true,
    sentryDsn: 'https://production-sentry-dsn@sentry.io/project-id',
    amplitudeApiKey: 'production_amplitude_key_here',
    mixpanelToken: 'production_mixpanel_token_here',
    stripePublishableKey: 'pk_live_stripe_key_here',
    oneSignalAppId: 'production-onesignal-app-id',
    revenueCatApiKey: 'production_revenuecat_key_here',
  }
};

// Platform-specific configurations
const getPlatformConfig = (): Partial<AppConfig> => {
  const baseConfig = {
    scheme: 'dragonworlds',
    universalLinks: ['https://dragonworlds.com'],
  };

  if (Platform.OS === 'ios') {
    return {
      ...baseConfig,
      bundleId: 'com.dragonworlds.hk2027',
      appStoreId: '123456789',
      applePayMerchantId: 'merchant.com.dragonworlds.hk2027',
    };
  }

  if (Platform.OS === 'android') {
    return {
      ...baseConfig,
      bundleId: 'com.dragonworlds.hk2027',
      playStoreId: 'com.dragonworlds.hk2027',
    };
  }

  return baseConfig;
};

// Create the deployment configuration
const createDeploymentConfig = (): AppConfig => {
  const environment = getEnvironment();
  const buildType = getBuildType();
  
  const baseConfig: AppConfig = {
    environment,
    buildType,
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber: Constants.expoConfig?.ios?.buildNumber || 
                 Constants.expoConfig?.android?.versionCode?.toString() || '1',
    bundleId: '',
    
    // Default values
    apiUrl: '',
    weatherApiUrl: '',
    analyticsEnabled: false,
    sentryEnabled: false,
    crashlyticsEnabled: false,
    debugMenuEnabled: false,
    offlineMode: true,
    crossPromotionEnabled: false,
    pushNotificationsEnabled: false,
    scheme: 'dragonworlds',
    universalLinks: [],
  };

  // Merge configurations
  const envConfig = environmentConfigs[environment];
  const platformConfig = getPlatformConfig();
  const extraConfig = Constants.expoConfig?.extra || {};

  return {
    ...baseConfig,
    ...envConfig,
    ...platformConfig,
    // Override with any extra config from app.json
    ...(extraConfig.apiUrl && { apiUrl: extraConfig.apiUrl }),
    ...(extraConfig.weatherApiUrl && { weatherApiUrl: extraConfig.weatherApiUrl }),
    ...(extraConfig.analyticsEnabled !== undefined && { 
      analyticsEnabled: extraConfig.analyticsEnabled === 'true' 
    }),
    ...(extraConfig.sentryDsn && { sentryDsn: extraConfig.sentryDsn }),
  };
};

// Export the configuration
export const deploymentConfig = createDeploymentConfig();

// Utility functions
export const isDevelopment = () => deploymentConfig.environment === 'development';
export const isStaging = () => deploymentConfig.environment === 'staging';
export const isProduction = () => deploymentConfig.environment === 'production';
export const isDebugBuild = () => deploymentConfig.buildType === 'debug';
export const isReleaseBuild = () => deploymentConfig.buildType === 'release';

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof Pick<AppConfig, 
  'analyticsEnabled' | 'sentryEnabled' | 'debugMenuEnabled' | 'offlineMode' | 
  'crossPromotionEnabled' | 'pushNotificationsEnabled'
>): boolean => {
  return deploymentConfig[feature];
};

// API URL helpers
export const getApiUrl = (endpoint?: string): string => {
  const baseUrl = deploymentConfig.apiUrl;
  return endpoint ? `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}` : baseUrl;
};

export const getWeatherApiUrl = (endpoint?: string): string => {
  const baseUrl = deploymentConfig.weatherApiUrl;
  return endpoint ? `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}` : baseUrl;
};

// Version helpers
export const getVersionString = (): string => {
  const { version, buildNumber, environment } = deploymentConfig;
  if (isDevelopment()) {
    return `${version} (${buildNumber}) [DEV]`;
  }
  if (isStaging()) {
    return `${version} (${buildNumber}) [STAGING]`;
  }
  return `${version} (${buildNumber})`;
};

export const getBuildInfo = () => ({
  version: deploymentConfig.version,
  buildNumber: deploymentConfig.buildNumber,
  environment: deploymentConfig.environment,
  buildType: deploymentConfig.buildType,
  platform: Platform.OS,
  platformVersion: Platform.Version,
});

// App Store / Play Store helpers
export const getStoreUrl = (): string | undefined => {
  if (Platform.OS === 'ios' && deploymentConfig.appStoreId) {
    return `https://apps.apple.com/app/id${deploymentConfig.appStoreId}`;
  }
  
  if (Platform.OS === 'android' && deploymentConfig.playStoreId) {
    return `https://play.google.com/store/apps/details?id=${deploymentConfig.playStoreId}`;
  }
  
  return undefined;
};

// Deep linking helpers
export const createDeepLink = (path: string, params?: Record<string, string>): string => {
  const { scheme } = deploymentConfig;
  const queryString = params ? 
    '?' + Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&') : 
    '';
  
  return `${scheme}://${path}${queryString}`;
};

export const createUniversalLink = (path: string, params?: Record<string, string>): string => {
  const baseUrl = deploymentConfig.universalLinks[0] || 'https://dragonworlds.com';
  const queryString = params ? 
    '?' + Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&') : 
    '';
  
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}${queryString}`;
};

// Configuration validation
export const validateConfiguration = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!deploymentConfig.apiUrl) {
    errors.push('API URL is required');
  }
  
  if (!deploymentConfig.weatherApiUrl) {
    errors.push('Weather API URL is required');
  }
  
  if (deploymentConfig.sentryEnabled && !deploymentConfig.sentryDsn) {
    errors.push('Sentry DSN is required when Sentry is enabled');
  }
  
  if (deploymentConfig.analyticsEnabled && !deploymentConfig.amplitudeApiKey && !deploymentConfig.mixpanelToken) {
    errors.push('Analytics API key is required when analytics is enabled');
  }
  
  if (isProduction()) {
    if (!deploymentConfig.bundleId) {
      errors.push('Bundle ID is required for production builds');
    }
    
    if (Platform.OS === 'ios' && !deploymentConfig.appStoreId) {
      errors.push('App Store ID is required for iOS production builds');
    }
    
    if (Platform.OS === 'android' && !deploymentConfig.playStoreId) {
      errors.push('Play Store ID is required for Android production builds');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Debug information (only in development)
if (isDevelopment()) {
  
  const validation = validateConfiguration();
  if (!validation.isValid) {
  } else {
  }
}

// Export default
export default deploymentConfig;