// Services Index - Dragon World Championships App
// Centralized export of all application services

// Database and authentication services
export * from './database';
export * from './auth';
export { default as userProfileService } from './userProfileService';
export * from './userProfileService';

// Core services
export { weatherAPI } from './weatherAPI';
export type {
  PredictWindResponse,
  PredictWindData,
  WaveData,
  WeatherData,
  TideData,
  NOAAResponse,
  HKObservatoryResponse,
  WeatherAPIError,
  WeatherCache
} from './weatherAPI';

export { subscriptionService } from './subscriptionService';
export type {
  SubscriptionTier,
  SubscriptionFeature,
  SubscriptionStatus,
  ParticipantVerification,
  PurchaseRequest,
  VerificationResult,
  SubscriptionMetrics
} from './subscriptionService';

export { weatherManager } from './weatherManager';
export type {
  ProcessedWeatherData,
  WeatherAlert,
  AlertCondition,
  WeatherUpdateOptions
} from './weatherManager';

export { notificationService } from './notificationService';
export type {
  NotificationPreferences,
  WeatherAlert as NotificationWeatherAlert,
  RaceNotification,
  SubscriptionNotification,
  NotificationSchedule
} from './notificationService';

export { errorHandler } from './errorHandler';
export type {
  AppError,
  NetworkStatus,
  OfflineAction,
  RetryConfig
} from './errorHandler';

// Error handling utilities
export {
  handleAPIError,
  handleWeatherAPIError,
  handleSubscriptionError,
  handleStorageError
} from './errorHandler';

// Service initialization helper
export const initializeServices = async () => {
  try {
    
    // Initialize error handler first
    await errorHandler.initialize();
    
    // Initialize notification service
    const notificationInitialized = await notificationService.initialize();
    if (!notificationInitialized) {
    }
    
    // Weather manager will auto-initialize when first used
    
    return {
      errorHandler: true,
      notifications: notificationInitialized,
      weather: true,
      subscription: true
    };
    
  } catch (error) {
    errorHandler.logError({
      type: 'general',
      severity: 'critical',
      message: `Service initialization failed: ${(error as Error).message}`,
      source: 'service_initialization',
      retryable: false,
      userFacing: true
    });
    
    throw error;
  }
};

// Service health check
export const checkServiceHealth = async () => {
  const health = {
    network: errorHandler.isOnline(),
    weatherAPI: false,
    subscription: false,
    notifications: false,
    errors: errorHandler.getRecentErrors(1).length
  };
  
  // Test weather API connectivity
  try {
    await weatherAPI.getHKObservatoryData();
    health.weatherAPI = true;
  } catch (error) {
  }
  
  // Test subscription service
  try {
    await subscriptionService.getSubscriptionStatus();
    health.subscription = true;
  } catch (error) {
  }
  
  // Test notification service
  try {
    const token = notificationService.getPushToken();
    health.notifications = token !== null;
  } catch (error) {
  }
  
  return health;
};

// Service sync helper for background refresh
export const syncAllServices = async () => {
  try {
    
    // Sync weather data
    await weatherManager.updateWeatherData();
    
    // Monitor subscription status
    await notificationService.monitorSubscriptionStatus();
    
    // Process any offline actions
    // (errorHandler will automatically handle this when network becomes available)
    
    
  } catch (error) {
    errorHandler.logError({
      type: 'general',
      severity: 'medium',
      message: `Service sync failed: ${(error as Error).message}`,
      source: 'service_sync',
      retryable: true
    });
  }
};

// Emergency service reset (for development/testing)
export const resetAllServices = () => {
  try {
    weatherAPI.clearCache();
    subscriptionService.clearCache();
    errorHandler.clearErrorLog();
    errorHandler.clearOfflineActions();
    notificationService.clearAllScheduledNotifications();
    
    
  } catch (error) {
  }
};

// Service statistics for debugging
export const getServiceStats = () => {
  return {
    weather: {
      cache: weatherAPI.getCacheStatus()
    },
    subscription: {
      metrics: subscriptionService.getMetrics()
    },
    errors: errorHandler.getStats(),
    network: errorHandler.getNetworkStatus()
  };
};