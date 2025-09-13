import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { deploymentConfig, getBuildInfo, isProduction } from '../config/deploymentConfig';

// Error types and interfaces
export interface AppError {
  id: string;
  type: 'network' | 'api' | 'storage' | 'permission' | 'subscription' | 'weather' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  code?: string | number;
  source?: string;
  timestamp: string;
  context?: Record<string, any>;
  retryable: boolean;
  userFacing: boolean;
}

export interface NetworkStatus {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
}

export interface OfflineAction {
  id: string;
  type: 'api_call' | 'data_sync' | 'subscription_update';
  action: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  backoffMultiplier: number;
  maxDelay: number;
}

// Error handler service class
export class ErrorHandler {
  private errorLog: AppError[] = [];
  private networkStatus: NetworkStatus = {
    isConnected: false,
    type: null,
    isInternetReachable: null
  };
  private offlineActions: OfflineAction[] = [];
  private maxErrorLogSize = 100;
  private retryConfigs: Map<string, RetryConfig> = new Map();

  constructor() {
    this.setupNetworkListener();
    this.loadOfflineActions();
    this.setupDefaultRetryConfigs();
  }

  // Initialize error handling
  async initialize(): Promise<void> {
    try {
      await this.loadErrorLog();
      await this.checkNetworkStatus();
      console.log('Error handler initialized');
    } catch (error) {
      console.error('Failed to initialize error handler:', error);
    }
  }

  // Network monitoring
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.networkStatus.isConnected;
      
      this.networkStatus = {
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable
      };

      // If back online, process queued actions
      if (wasOffline && this.networkStatus.isConnected) {
        this.processOfflineActions();
      }
    });
  }

  private async checkNetworkStatus(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    this.networkStatus = {
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable
    };
    return this.networkStatus;
  }

  // Error logging and handling
  logError(error: Partial<AppError>): string {
    const appError: AppError = {
      id: this.generateErrorId(),
      type: error.type || 'general',
      severity: error.severity || 'medium',
      message: error.message || 'Unknown error',
      code: error.code,
      source: error.source,
      timestamp: new Date().toISOString(),
      context: error.context,
      retryable: error.retryable ?? false,
      userFacing: error.userFacing ?? true
    };

    this.errorLog.unshift(appError);
    
    // Maintain max log size
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxErrorLogSize);
    }

    this.saveErrorLog();
    this.handleError(appError);
    
    return appError.id;
  }

  private handleError(error: AppError): void {
    console.error(`[${error.severity.toUpperCase()}] ${error.type}: ${error.message}`, error);

    // Show user-facing errors as notifications
    if (error.userFacing) {
      this.showErrorNotification(error);
    }

    // Critical errors require immediate attention
    if (error.severity === 'critical' && error.userFacing) {
      this.showCriticalErrorAlert(error);
    }

    // Network errors when offline
    if (error.type === 'network' && !this.networkStatus.isConnected) {
      this.handleOfflineError(error);
    }

    // API errors with retry logic
    if (error.type === 'api' && error.retryable) {
      this.scheduleRetry(error);
    }
  }

  private showErrorNotification(error: AppError): void {
    // For weather errors, show a local notification
    if (error.type === 'weather') {
      import('../services/notificationService').then(({ notificationService }) => {
        notificationService.sendLocalNotification(
          this.getErrorTitle(error),
          error.message,
          { 
            type: 'weather_error',
            errorId: error.id,
            retryable: error.retryable 
          }
        );
      }).catch(err => {
        console.warn('Failed to show weather error notification:', err);
      });
    }
  }

  private getErrorTitle(error: AppError): string {
    switch (error.type) {
      case 'weather':
        return 'Weather Data Error';
      case 'api':
        return 'Connection Error';
      case 'network':
        return 'Network Error';
      case 'subscription':
        return 'Subscription Error';
      case 'storage':
        return 'Storage Error';
      case 'permission':
        return 'Permission Error';
      default:
        return 'Error';
    }
  }

  private showCriticalErrorAlert(error: AppError): void {
    Alert.alert(
      'Critical Error',
      error.message,
      [
        {
          text: 'Retry',
          onPress: () => this.retryErrorAction(error)
        },
        {
          text: 'Report Issue',
          onPress: () => this.reportError(error)
        },
        {
          text: 'Continue',
          style: 'cancel'
        }
      ]
    );
  }

  private handleOfflineError(error: AppError): void {
    if (error.context?.offlineAction) {
      this.queueOfflineAction(error.context.offlineAction);
    }
  }

  // Offline action management
  queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): void {
    const offlineAction: OfflineAction = {
      id: this.generateActionId(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      ...action
    };

    this.offlineActions.push(offlineAction);
    this.saveOfflineActions();
  }

  private async processOfflineActions(): Promise<void> {
    if (!this.networkStatus.isConnected || this.offlineActions.length === 0) {
      return;
    }

    console.log(`Processing ${this.offlineActions.length} offline actions`);
    
    const actionsToProcess = [...this.offlineActions];
    this.offlineActions = [];

    for (const action of actionsToProcess) {
      try {
        await this.executeOfflineAction(action);
        console.log(`Successfully processed offline action: ${action.id}`);
      } catch (error) {
        if (action.retryCount < action.maxRetries) {
          action.retryCount++;
          this.offlineActions.push(action);
          console.warn(`Offline action ${action.id} failed, will retry (${action.retryCount}/${action.maxRetries})`);
        } else {
          console.error(`Offline action ${action.id} failed permanently:`, error);
          this.logError({
            type: 'general',
            severity: 'medium',
            message: `Failed to process offline action: ${action.action}`,
            source: 'offline_queue',
            retryable: false
          });
        }
      }
    }

    this.saveOfflineActions();
  }

  private async executeOfflineAction(action: OfflineAction): Promise<void> {
    // This would integrate with your actual services
    switch (action.type) {
      case 'api_call':
        // Retry API calls
        break;
      case 'data_sync':
        // Sync local data changes
        break;
      case 'subscription_update':
        // Update subscription status
        break;
      default:
        throw new Error(`Unknown offline action type: ${action.type}`);
    }
  }

  // Retry mechanism with exponential backoff
  private setupDefaultRetryConfigs(): void {
    this.retryConfigs.set('api', {
      maxRetries: 3,
      baseDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000
    });

    this.retryConfigs.set('weather', {
      maxRetries: 5,
      baseDelay: 2000,
      backoffMultiplier: 1.5,
      maxDelay: 30000
    });

    this.retryConfigs.set('subscription', {
      maxRetries: 3,
      baseDelay: 1500,
      backoffMultiplier: 2,
      maxDelay: 15000
    });
  }

  async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    errorType: string,
    context?: Record<string, any>
  ): Promise<T> {
    const config = this.retryConfigs.get(errorType) || this.retryConfigs.get('api')!;
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === config.maxRetries) {
          // Final attempt failed
          this.logError({
            type: errorType as any,
            severity: 'high',
            message: `Operation failed after ${config.maxRetries} retries: ${lastError.message}`,
            source: 'retry_mechanism',
            context: { ...context, attempts: attempt + 1 },
            retryable: false
          });
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );

        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private scheduleRetry(error: AppError): void {
    // Schedule retry for retryable errors
    const config = this.retryConfigs.get(error.type) || this.retryConfigs.get('api')!;
    
    setTimeout(() => {
      this.retryErrorAction(error);
    }, config.baseDelay);
  }

  private async retryErrorAction(error: AppError): Promise<void> {
    try {
      // This would retry the original action that caused the error
      console.log(`Retrying action for error: ${error.id}`);
      
      // Mark error as resolved if retry succeeds
      this.markErrorResolved(error.id);
    } catch (retryError) {
      this.logError({
        type: error.type,
        severity: 'medium',
        message: `Retry failed for error ${error.id}: ${(retryError as Error).message}`,
        source: 'retry_action',
        retryable: false
      });
    }
  }

  // Error reporting
  private async reportError(error: AppError): Promise<void> {
    try {
      // In a real app, this would send to crash reporting service
      const report = {
        error,
        deviceInfo: await this.getDeviceInfo(),
        networkStatus: this.networkStatus,
        timestamp: new Date().toISOString()
      };

      console.log('Error report generated:', report);
      
      // Could integrate with Sentry, Bugsnag, etc.
      // await crashlytics().recordError(new Error(error.message));
      
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  private async getDeviceInfo(): Promise<Record<string, any>> {
    // Collect relevant device/app info for error reports
    return {
      platform: 'react-native',
      // Add other relevant info
    };
  }

  // Error status management
  markErrorResolved(errorId: string): void {
    const error = this.errorLog.find(e => e.id === errorId);
    if (error) {
      error.context = { ...error.context, resolved: true, resolvedAt: new Date().toISOString() };
      this.saveErrorLog();
    }
  }

  getRecentErrors(hours: number = 24): AppError[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    return this.errorLog.filter(error => error.timestamp >= cutoff);
  }

  getErrorsByType(type: AppError['type']): AppError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  getErrorsBySeverity(severity: AppError['severity']): AppError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  // Network status
  getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  isOnline(): boolean {
    return this.networkStatus.isConnected;
  }

  // Storage management
  private async loadErrorLog(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('error_log');
      if (stored) {
        this.errorLog = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load error log:', error);
    }
  }

  private async saveErrorLog(): Promise<void> {
    try {
      await AsyncStorage.setItem('error_log', JSON.stringify(this.errorLog.slice(0, this.maxErrorLogSize)));
    } catch (error) {
      console.warn('Failed to save error log:', error);
    }
  }

  private async loadOfflineActions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offline_actions');
      if (stored) {
        this.offlineActions = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load offline actions:', error);
    }
  }

  private async saveOfflineActions(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_actions', JSON.stringify(this.offlineActions));
    } catch (error) {
      console.warn('Failed to save offline actions:', error);
    }
  }

  // Utility methods
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearErrorLog(): void {
    this.errorLog = [];
    AsyncStorage.removeItem('error_log');
  }

  clearOfflineActions(): void {
    this.offlineActions = [];
    AsyncStorage.removeItem('offline_actions');
  }

  getStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    pendingOfflineActions: number;
    networkStatus: NetworkStatus;
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorLog.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsBySeverity,
      pendingOfflineActions: this.offlineActions.length,
      networkStatus: this.networkStatus
    };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Utility functions for common error scenarios
export const handleAPIError = (error: any, source: string, retryable: boolean = true): string => {
  return errorHandler.logError({
    type: 'api',
    severity: error.status >= 500 ? 'high' : 'medium',
    message: `API Error: ${error.message || 'Unknown API error'}`,
    code: error.status || error.code,
    source,
    context: { url: error.url, method: error.method },
    retryable
  });
};

export const handleWeatherAPIError = (error: any, source: string): string => {
  return errorHandler.logError({
    type: 'weather',
    severity: 'medium',
    message: `Weather API Error: ${error.message || 'Weather data unavailable'}`,
    code: error.code,
    source,
    context: { weatherSource: error.source },
    retryable: true
  });
};

export const handleSubscriptionError = (error: any, source: string): string => {
  return errorHandler.logError({
    type: 'subscription',
    severity: 'high',
    message: `Subscription Error: ${error.message || 'Subscription service unavailable'}`,
    code: error.code,
    source,
    retryable: true,
    userFacing: true
  });
};

export const handleStorageError = (error: any, source: string): string => {
  return errorHandler.logError({
    type: 'storage',
    severity: 'medium',
    message: `Storage Error: ${error.message || 'Local storage unavailable'}`,
    source,
    retryable: false,
    userFacing: false
  });
};

// Export types
export type {
  AppError,
  NetworkStatus,
  OfflineAction,
  RetryConfig
};