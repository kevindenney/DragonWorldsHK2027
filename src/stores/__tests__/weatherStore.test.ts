import { act, renderHook } from '@testing-library/react-native';
import { useWeatherStore } from '../weatherStore';
import { MockDataFactory, StoreTestUtils } from '../../testing/testingSetup';

// Mock the weather API
jest.mock('../weatherAPI', () => ({
  fetchWeatherData: jest.fn(),
}));

describe('WeatherStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      const { resetWeatherData } = useWeatherStore.getState();
      if (resetWeatherData) resetWeatherData();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useWeatherStore());
      
      expect(result.current.currentWeather).toBeNull();
      expect(result.current.forecast).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
      expect(result.current.alerts).toEqual([]);
    });
  });

  describe('Weather Data Loading', () => {
    it('should set loading state when fetching weather', async () => {
      const { result } = renderHook(() => useWeatherStore());
      const mockWeatherData = MockDataFactory.createMockWeatherData();

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should update weather data successfully', async () => {
      const { result } = renderHook(() => useWeatherStore());
      const mockWeatherData = MockDataFactory.createMockWeatherData();

      act(() => {
        result.current.updateCurrentWeather(mockWeatherData);
      });

      expect(result.current.currentWeather).toEqual(mockWeatherData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle weather fetch errors', async () => {
      const { result } = renderHook(() => useWeatherStore());
      const mockError = 'Failed to fetch weather data';

      act(() => {
        result.current.setError(mockError);
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Forecast Management', () => {
    it('should update forecast data', () => {
      const { result } = renderHook(() => useWeatherStore());
      const mockForecast = Array.from({ length: 5 }, (_, i) => 
        MockDataFactory.createMockWeatherData({
          timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString()
        })
      );

      act(() => {
        result.current.updateForecast(mockForecast);
      });

      expect(result.current.forecast).toEqual(mockForecast);
      expect(result.current.forecast).toHaveLength(5);
    });

    it('should clear old forecast data', () => {
      const { result } = renderHook(() => useWeatherStore());
      const mockForecast = [MockDataFactory.createMockWeatherData()];

      act(() => {
        result.current.updateForecast(mockForecast);
      });

      expect(result.current.forecast).toHaveLength(1);

      act(() => {
        result.current.updateForecast([]);
      });

      expect(result.current.forecast).toHaveLength(0);
    });
  });

  describe('Weather Alerts', () => {
    it('should add weather alerts', () => {
      const { result } = renderHook(() => useWeatherStore());
      const mockAlert = {
        id: 'alert_1',
        type: 'wind' as const,
        severity: 'moderate' as const,
        title: 'Strong Wind Warning',
        message: 'Winds expected to increase to 25+ knots',
        threshold: 25,
        currentValue: 28,
        location: 'Hong Kong',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        requiresSubscription: false,
      };

      act(() => {
        result.current.addAlert(mockAlert);
      });

      expect(result.current.alerts).toContain(mockAlert);
      expect(result.current.alerts).toHaveLength(1);
    });

    it('should remove weather alerts', () => {
      const { result } = renderHook(() => useWeatherStore());
      const mockAlert = {
        id: 'alert_1',
        type: 'wind' as const,
        severity: 'moderate' as const,
        title: 'Strong Wind Warning',
        message: 'Test alert',
        threshold: 25,
        currentValue: 28,
        location: 'Hong Kong',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        requiresSubscription: false,
      };

      act(() => {
        result.current.addAlert(mockAlert);
      });

      expect(result.current.alerts).toHaveLength(1);

      act(() => {
        result.current.removeAlert('alert_1');
      });

      expect(result.current.alerts).toHaveLength(0);
    });

    it('should clear expired alerts automatically', () => {
      const { result } = renderHook(() => useWeatherStore());
      const expiredAlert = {
        id: 'alert_expired',
        type: 'wind' as const,
        severity: 'moderate' as const,
        title: 'Expired Alert',
        message: 'This alert should be expired',
        threshold: 25,
        currentValue: 28,
        location: 'Hong Kong',
        validFrom: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        validTo: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        requiresSubscription: false,
      };

      act(() => {
        result.current.addAlert(expiredAlert);
      });

      act(() => {
        result.current.clearExpiredAlerts();
      });

      expect(result.current.alerts).toHaveLength(0);
    });
  });

  describe('Data Persistence', () => {
    it('should maintain last updated timestamp', () => {
      const { result } = renderHook(() => useWeatherStore());
      const mockWeatherData = MockDataFactory.createMockWeatherData();
      const beforeUpdate = new Date();

      act(() => {
        result.current.updateCurrentWeather(mockWeatherData);
      });

      expect(result.current.lastUpdated).toBeTruthy();
      expect(new Date(result.current.lastUpdated!)).toBeInstanceOf(Date);
      expect(new Date(result.current.lastUpdated!).getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('Store Performance', () => {
    it('should handle multiple rapid updates efficiently', () => {
      const { result } = renderHook(() => useWeatherStore());
      const updates = Array.from({ length: 10 }, () => MockDataFactory.createMockWeatherData());

      const startTime = performance.now();
      
      updates.forEach((weatherData, index) => {
        act(() => {
          result.current.updateCurrentWeather({
            ...weatherData,
            temperature: 20 + index,
          });
        });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all updates in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
      expect(result.current.currentWeather?.temperature).toBe(29); // Last update
    });
  });
});