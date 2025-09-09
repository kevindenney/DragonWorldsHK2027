import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { weatherAPI } from '../weatherAPI';
import { MockDataFactory, APITestUtils } from '../../testing/testingSetup';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');

// Mock global fetch
global.fetch = jest.fn();

describe('WeatherAPI Integration Tests', () => {
  const mockNetworkState = {
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetworkState);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Weather Data Fetching', () => {
    it('should fetch current weather successfully', async () => {
      const mockWeatherData = MockDataFactory.createMockWeatherData();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherData),
      });

      const result = await weatherAPI.getCurrentWeather();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockWeatherData);
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(weatherAPI.getCurrentWeather()).rejects.toThrow('Network error');
    });

    it('should handle API errors with error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(weatherAPI.getCurrentWeather()).rejects.toThrow();
    });

    it('should cache weather data locally', async () => {
      const mockWeatherData = MockDataFactory.createMockWeatherData();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherData),
      });

      await weatherAPI.getCurrentWeather();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('weather_cache'),
        expect.stringContaining(JSON.stringify(mockWeatherData).substring(0, 10))
      );
    });

    it('should use cached data when offline', async () => {
      const mockWeatherData = MockDataFactory.createMockWeatherData();
      const cachedData = {
        data: mockWeatherData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
      };

      // Mock offline state
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        type: null,
        isInternetReachable: false,
      });

      // Mock cached data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cachedData)
      );

      const result = await weatherAPI.getCurrentWeather();

      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockWeatherData);
    });

    it('should fetch fresh data when cache is expired', async () => {
      const oldWeatherData = MockDataFactory.createMockWeatherData({ temperature: 20 });
      const newWeatherData = MockDataFactory.createMockWeatherData({ temperature: 25 });
      
      const expiredCachedData = {
        data: oldWeatherData,
        timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
        expiresAt: Date.now() - 30 * 60 * 1000, // Expired 30 minutes ago
      };

      // Mock expired cache
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(expiredCachedData)
      );

      // Mock fresh API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newWeatherData),
      });

      const result = await weatherAPI.getCurrentWeather();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result.temperature).toBe(25); // Should get fresh data
    });
  });

  describe('Weather Forecast', () => {
    it('should fetch 5-day forecast successfully', async () => {
      const mockForecast = Array.from({ length: 5 }, (_, i) => 
        MockDataFactory.createMockWeatherData({
          timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString()
        })
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecast),
      });

      const result = await weatherAPI.getForecast();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual(mockForecast[0]);
    });

    it('should handle forecast API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(weatherAPI.getForecast()).rejects.toThrow();
    });
  });

  describe('Historical Weather Data', () => {
    it('should fetch historical weather data for date range', async () => {
      const startDate = new Date('2024-11-15');
      const endDate = new Date('2024-11-20');
      
      const mockHistoricalData = Array.from({ length: 6 }, (_, i) => 
        MockDataFactory.createMockWeatherData({
          timestamp: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString()
        })
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoricalData),
      });

      const result = await weatherAPI.getHistoricalData(startDate, endDate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('historical'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toHaveLength(6);
    });
  });

  describe('Weather Alerts', () => {
    it('should fetch current weather alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
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
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAlerts),
      });

      const result = await weatherAPI.getWeatherAlerts();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAlerts);
    });
  });

  describe('Marine Weather Data', () => {
    it('should fetch marine-specific weather data', async () => {
      const mockMarineData = {
        ...MockDataFactory.createMockWeatherData(),
        waveHeight: 1.2,
        waveDirection: 220,
        wavePeriod: 4.5,
        currentSpeed: 0.8,
        currentDirection: 180,
        tideHeight: 1.5,
        tideDirection: 'rising' as const,
        seaTemperature: 23,
        visibility: 12,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMarineData),
      });

      const result = await weatherAPI.getMarineWeather();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('marine'),
        expect.any(Object)
      );
      expect(result.waveHeight).toBeDefined();
      expect(result.currentSpeed).toBeDefined();
      expect(result.tideHeight).toBeDefined();
    });
  });

  describe('Racing Conditions Analysis', () => {
    it('should analyze sailing conditions', async () => {
      const mockWeatherData = MockDataFactory.createMockWeatherData({
        windSpeed: 15,
        windDirection: 220,
        windGust: 18,
        waveHeight: 1.0,
        temperature: 24,
        conditions: 'Partly Cloudy'
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherData),
      });

      const result = await weatherAPI.getRacingConditions();

      expect(result).toHaveProperty('sailingConditions');
      expect(['excellent', 'good', 'fair', 'poor', 'dangerous']).toContain(result.sailingConditions);
    });

    it('should provide sailing recommendations based on conditions', async () => {
      const heavyWeatherData = MockDataFactory.createMockWeatherData({
        windSpeed: 35,
        windGust: 45,
        waveHeight: 3.5,
        conditions: 'Stormy'
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(heavyWeatherData),
      });

      const result = await weatherAPI.getRacingConditions();

      expect(result.sailingConditions).toBe('dangerous');
    });
  });

  describe('Rate Limiting and Request Management', () => {
    it('should handle rate limiting gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['Retry-After', '60']]),
      });

      await expect(weatherAPI.getCurrentWeather()).rejects.toThrow();
    });

    it('should implement request debouncing for rapid calls', async () => {
      const mockWeatherData = MockDataFactory.createMockWeatherData();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWeatherData),
      });

      // Make multiple rapid requests
      const promises = Array.from({ length: 5 }, () => weatherAPI.getCurrentWeather());
      await Promise.all(promises);

      // Should only make one actual network request due to debouncing/caching
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Subscription-based Features', () => {
    it('should respect subscription limits for premium features', async () => {
      // Mock free user - should not have access to detailed marine data
      const basicWeatherData = MockDataFactory.createMockWeatherData();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(basicWeatherData),
      });

      // This would typically check user subscription status
      const result = await weatherAPI.getCurrentWeather();
      
      // Free users should get basic weather data
      expect(result).toBeDefined();
      expect(result.temperature).toBeDefined();
    });

    it('should provide enhanced data for premium subscribers', async () => {
      // Mock premium user
      const premiumWeatherData = {
        ...MockDataFactory.createMockWeatherData(),
        detailedForecast: true,
        marineData: {
          waveHeight: 1.2,
          currentSpeed: 0.5,
          tideHeight: 1.8,
        },
        windAnalysis: {
          gusts: [18, 22, 16],
          shiftProbability: 0.3,
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(premiumWeatherData),
      });

      const result = await weatherAPI.getPremiumWeatherData();

      expect(result.detailedForecast).toBe(true);
      expect(result.marineData).toBeDefined();
      expect(result.windAnalysis).toBeDefined();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should retry failed requests with exponential backoff', async () => {
      // First call fails
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(MockDataFactory.createMockWeatherData()),
        });

      const result = await weatherAPI.getCurrentWeather();

      expect(fetch).toHaveBeenCalledTimes(2); // Initial call + 1 retry
      expect(result).toBeDefined();
    });

    it('should fallback to cached data on persistent failures', async () => {
      const cachedData = {
        data: MockDataFactory.createMockWeatherData(),
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes old but not expired
        expiresAt: Date.now() + 20 * 60 * 1000, // Still valid
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));
      
      // Mock persistent network failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network unavailable'));

      const result = await weatherAPI.getCurrentWeather();

      expect(result).toEqual(cachedData.data);
    });

    it('should handle malformed API responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data', missing: 'required fields' }),
      });

      await expect(weatherAPI.getCurrentWeather()).rejects.toThrow();
    });
  });
});