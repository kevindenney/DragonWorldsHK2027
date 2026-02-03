import { Platform } from 'react-native';
import { isProduction, deploymentConfig } from '../config/deploymentConfig';

// Performance monitoring interface
export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  appLaunchTime: number;
  memoryUsage?: number;
  timestamp: string;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private appLaunchTime: number = Date.now();
  private isEnabled: boolean = !isProduction() || deploymentConfig.analyticsEnabled;

  // Start timing a performance metric
  startTiming(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: Date.now(),
      metadata,
    };

    this.metrics.set(name, metric);
  }

  // End timing and calculate duration
  endTiming(name: string, additionalMetadata?: Record<string, any>): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.metadata = { ...metric.metadata, ...additionalMetadata };

    this.metrics.set(name, metric);

    // Log slow operations in development
    if (!isProduction() && duration > 1000) {
    }

    return duration;
  }

  // Mark a specific point in time
  mark(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: Date.now(),
      endTime: Date.now(),
      duration: 0,
      metadata,
    };

    this.metrics.set(name, metric);
  }

  // Get all performance metrics
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // Get a specific metric
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Generate performance report
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      metrics: this.getMetrics(),
      appLaunchTime: this.appLaunchTime,
      timestamp: new Date().toISOString(),
    };

    // Add memory usage if available
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Note: Memory usage would require native module integration
      // For now, we'll just include it in the interface
    }

    return report;
  }

  // Export metrics for analytics
  exportMetrics(): Record<string, any> {
    const metrics = this.getMetrics();
    const exportData: Record<string, any> = {};

    metrics.forEach(metric => {
      const key = metric.name.replace(/[^a-zA-Z0-9]/g, '_');
      exportData[key] = {
        duration: metric.duration,
        timestamp: metric.startTime,
        ...metric.metadata,
      };
    });

    return exportData;
  }

  // Track React component render performance
  trackComponentRender<T extends any[], R>(
    componentName: string,
    renderFunction: (...args: T) => R
  ): (...args: T) => R {
    if (!this.isEnabled) return renderFunction;

    return (...args: T): R => {
      const metricName = `component_render_${componentName}`;
      this.startTiming(metricName, { component: componentName });
      
      try {
        const result = renderFunction(...args);
        this.endTiming(metricName);
        return result;
      } catch (error) {
        this.endTiming(metricName, { error: error.message });
        throw error;
      }
    };
  }

  // Track async operations
  async trackAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isEnabled) return operation();

    this.startTiming(operationName, metadata);
    
    try {
      const result = await operation();
      this.endTiming(operationName, { success: true });
      return result;
    } catch (error) {
      this.endTiming(operationName, { 
        success: false, 
        error: error.message 
      });
      throw error;
    }
  }

  // Track navigation timing
  trackNavigation(fromScreen: string, toScreen: string, metadata?: Record<string, any>): void {
    const metricName = `navigation_${fromScreen}_to_${toScreen}`;
    this.mark(metricName, {
      from: fromScreen,
      to: toScreen,
      ...metadata,
    });
  }

  // Track API call performance
  async trackAPICall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const metricName = `api_call_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    return this.trackAsyncOperation(metricName, apiCall, {
      endpoint,
      ...metadata,
    });
  }

  // Track user interaction
  trackUserInteraction(interactionType: string, target: string, metadata?: Record<string, any>): void {
    const metricName = `user_interaction_${interactionType}_${target}`;
    this.mark(metricName, {
      interaction: interactionType,
      target,
      ...metadata,
    });
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export const withPerformanceTracking = <T extends any[], R>(
  name: string,
  fn: (...args: T) => R,
  metadata?: Record<string, any>
): ((...args: T) => R) => {
  return (...args: T): R => {
    performanceMonitor.startTiming(name, metadata);
    try {
      const result = fn(...args);
      performanceMonitor.endTiming(name);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(name, { error: error.message });
      throw error;
    }
  };
};

export const withAsyncPerformanceTracking = <T extends any[], R>(
  name: string,
  fn: (...args: T) => Promise<R>,
  metadata?: Record<string, any>
): ((...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R> => {
    return performanceMonitor.trackAsyncOperation(name, () => fn(...args), metadata);
  };
};

// React Hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const trackRender = (metadata?: Record<string, any>) => {
    performanceMonitor.mark(`${componentName}_render`, {
      component: componentName,
      ...metadata,
    });
  };

  const trackUserAction = (action: string, metadata?: Record<string, any>) => {
    performanceMonitor.trackUserInteraction(action, componentName, metadata);
  };

  return {
    trackRender,
    trackUserAction,
    startTiming: (name: string, metadata?: Record<string, any>) => 
      performanceMonitor.startTiming(`${componentName}_${name}`, metadata),
    endTiming: (name: string, metadata?: Record<string, any>) => 
      performanceMonitor.endTiming(`${componentName}_${name}`, metadata),
  };
};

// Performance decorator for methods - DISABLED for Hermes compatibility
export const performanceTracked = (name?: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    // Return descriptor unchanged to avoid property configuration issues
    return descriptor;
  };
};

// Performance monitoring for specific sailing app scenarios
export const sailingPerformanceTracking = {
  // Track weather data fetching performance
  trackWeatherFetch: (location: string) => 
    performanceMonitor.startTiming('weather_fetch', { location }),
  
  // Track race schedule loading
  trackScheduleLoad: (eventId: string) => 
    performanceMonitor.startTiming('schedule_load', { eventId }),
  
  // Track map rendering performance
  trackMapRender: (raceArea: string, boatCount: number) => 
    performanceMonitor.startTiming('map_render', { raceArea, boatCount }),
  
  // Track subscription validation
  trackSubscriptionCheck: (tier: string) => 
    performanceMonitor.startTiming('subscription_check', { tier }),
  
  // End any tracked operation
  endTracking: (operationName: string, metadata?: Record<string, any>) =>
    performanceMonitor.endTiming(operationName, metadata),
};

// Initialize performance monitoring
if (!isProduction()) {
  
  // Track app launch performance
  performanceMonitor.mark('app_launch', {
    platform: Platform.OS,
    version: deploymentConfig.version,
  });
}

export default performanceMonitor;