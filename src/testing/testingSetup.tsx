import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Test data factories
class MockDataFactory {
  // Weather data mocks
  static createMockWeatherData(overrides = {}) {
    return {
      location: 'Royal Hong Kong Yacht Club',
      timestamp: new Date().toISOString(),
      temperature: 24,
      humidity: 68,
      pressure: 1018,
      visibility: 15,
      uvIndex: 6,
      windSpeed: 12,
      windDirection: 220,
      windGust: 16,
      waveHeight: 0.8,
      waveDirection: 200,
      wavePeriod: 4.2,
      currentSpeed: 0.3,
      currentDirection: 180,
      tideHeight: 1.2,
      tideDirection: 'rising' as const,
      conditions: 'Partly Cloudy',
      sailingConditions: 'good' as const,
      ...overrides,
    };
  }

  // User subscription data
  static createMockSubscription(tier: 'free' | 'basic' | 'professional' | 'elite' = 'free') {
    return {
      tier,
      status: 'active' as const,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      features: {
        weatherAccess: tier !== 'free',
        detailedForecast: ['professional', 'elite'].includes(tier),
        windAnalysis: ['basic', 'professional', 'elite'].includes(tier),
        waveData: ['professional', 'elite'].includes(tier),
        socialFeatures: tier !== 'free',
        crossPromotion: tier !== 'free',
      },
      paymentMethod: tier !== 'free' ? 'credit_card' : null,
      autoRenew: true,
    };
  }

  // Race event data
  static createMockRaceEvent(overrides = {}) {
    return {
      id: 'race_' + Math.random().toString(36).substr(2, 9),
      type: 'racing' as const,
      time: '14:00',
      title: 'Dragon Class Race 1',
      location: 'Royal Hong Kong Yacht Club',
      status: 'upcoming' as const,
      details: [
        'Wind forecast: 12-15 knots SW',
        'Start sequence begins 14:00',
        'Course: Triangle + Windward/Leeward',
      ],
      icon: 'Flag',
      ...overrides,
    };
  }

  // Schedule data
  static createMockScheduleData(eventCount = 3) {
    const events = Array.from({ length: eventCount }, (_, i) =>
      this.createMockRaceEvent({
        id: `race_${i + 1}`,
        time: `${14 + i}:00`,
        title: `Dragon Class Race ${i + 1}`,
      })
    );

    return [
      {
        date: 'today',
        displayDate: 'TODAY - FRIDAY, NOV 21',
        events,
      },
    ];
  }

  // Results data
  static createMockResults(boatCount = 10) {
    return Array.from({ length: boatCount }, (_, i) => ({
      position: i + 1,
      sailNumber: `HKG ${100 + i}`,
      helmsman: `Helmsman ${i + 1}`,
      crew: [`Crew ${i + 1}A`, `Crew ${i + 1}B`],
      points: Math.floor(Math.random() * 20) + 1,
      races: Array.from({ length: 5 }, () => Math.floor(Math.random() * boatCount) + 1),
      totalPoints: Math.floor(Math.random() * 50) + i + 1,
    }));
  }

  // Social connection data
  static createMockConnection(overrides = {}) {
    return {
      id: 'conn_' + Math.random().toString(36).substr(2, 9),
      userId: 'user_123',
      connectedUserId: 'user_456',
      relationship: 'crew_member' as const,
      status: 'accepted' as const,
      connectedAt: new Date().toISOString(),
      sharedEvents: ['race_1', 'race_2'],
      communicationPreferences: {
        shareCalendar: true,
        shareResults: true,
        shareWeatherAlerts: false,
      },
      ...overrides,
    };
  }

  // Analytics data
  static createMockAnalytics() {
    return {
      impressions: Math.floor(Math.random() * 1000) + 100,
      clicks: Math.floor(Math.random() * 100) + 10,
      conversions: Math.floor(Math.random() * 10) + 1,
      clickThroughRate: Math.random() * 10 + 2,
      conversionRate: Math.random() * 5 + 1,
      revenue: Math.random() * 1000 + 100,
      segment: 'competitive_racer',
      trigger: 'weather_paywall',
    };
  }

  // Error scenarios
  static createMockError(type = 'network', severity = 'medium') {
    return {
      id: 'error_' + Math.random().toString(36).substr(2, 9),
      type,
      severity,
      message: `Mock ${type} error for testing`,
      timestamp: new Date().toISOString(),
      retryable: true,
      userFacing: true,
    };
  }

  // Offline action data
  static createMockOfflineAction(overrides = {}) {
    return {
      id: 'offline_' + Math.random().toString(36).substr(2, 9),
      type: 'weather_request' as const,
      timestamp: new Date().toISOString(),
      data: { location: { lat: 22.2783, lon: 114.1747 } },
      retryCount: 0,
      maxRetries: 3,
      priority: 'medium' as const,
      userId: 'user_123',
      ...overrides,
    };
  }
}

// Custom render with providers
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const initialMetrics = {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };

  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<any>;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  return render(ui, {
    wrapper: options.wrapper || AllProviders,
    ...options,
  });
};

// Zustand store testing utilities
class StoreTestUtils {
  static async waitForStoreUpdate<T>(
    getStore: () => T,
    predicate: (state: T) => boolean,
    timeout = 1000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkState = () => {
        if (predicate(getStore())) {
          resolve();
        } else if (Date.now() - startTime >= timeout) {
          reject(new Error(`Store update timeout after ${timeout}ms`));
        } else {
          setTimeout(checkState, 10);
        }
      };
      
      checkState();
    });
  }

  static createStoreSnapshot<T>(store: () => T): T {
    return JSON.parse(JSON.stringify(store()));
  }

  static resetAllStores() {
    // This would reset all Zustand stores to initial state
    // Implementation depends on how stores are structured
  }
}

// API mocking utilities
class APITestUtils {
  static mockFetch(response: any, options: { status?: number; delay?: number } = {}) {
    const { status = 200, delay = 0 } = options;
    
    return jest.fn().mockImplementation(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: status >= 200 && status < 300,
            status,
            json: () => Promise.resolve(response),
            text: () => Promise.resolve(JSON.stringify(response)),
          });
        }, delay);
      })
    );
  }

  static mockNetworkError() {
    return jest.fn().mockRejectedValue(new Error('Network request failed'));
  }

  static mockTimeoutError() {
    return jest.fn().mockImplementation(() => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      })
    );
  }
}

// Accessibility testing utilities
class AccessibilityTestUtils {
  static findByAccessibilityLabel(getByLabelText: any, label: string) {
    return getByLabelText(label);
  }

  static findByAccessibilityRole(getByRole: any, role: string) {
    return getByRole(role);
  }

  static hasAccessibilityHint(element: any, hint: string) {
    return element.props.accessibilityHint === hint;
  }

  static isAccessibilityFocusable(element: any) {
    return element.props.accessible !== false;
  }

  static async testScreenReaderNavigation(component: any) {
    // Mock screen reader navigation test
    const accessibleElements = component.findAllByProps({ accessible: true });
    return accessibleElements.length > 0;
  }
}

// Performance testing utilities
class PerformanceTestUtils {
  static measureRenderTime<T>(renderFn: () => T): { result: T; time: number } {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    return {
      result,
      time: endTime - startTime,
    };
  }

  static async measureAsyncOperation<T>(operation: () => Promise<T>): Promise<{ result: T; time: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    
    return {
      result,
      time: endTime - startTime,
    };
  }
}

// Navigation testing utilities
class NavigationTestUtils {
  static createMockNavigation(overrides = {}) {
    return {
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      isFocused: jest.fn(() => true),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      ...overrides,
    };
  }

  static createMockRoute(params = {}) {
    return {
      key: 'test-route',
      name: 'TestScreen',
      params,
    };
  }
}

// Export all utilities
export {
  renderWithProviders as render,
  MockDataFactory,
  StoreTestUtils,
  APITestUtils,
  AccessibilityTestUtils,
  PerformanceTestUtils,
  NavigationTestUtils,
};