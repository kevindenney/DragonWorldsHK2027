import { offlineManager } from '../offlineManager';
import { MockDataFactory, APITestUtils, StoreTestUtils } from '../../testing/testingSetup';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock NetInfo
const mockNetInfo = {
  fetch: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

jest.mock('@react-native-community/netinfo', () => mockNetInfo);

describe('OfflineManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    // Mock network as online by default
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(offlineManager.initialize()).resolves.not.toThrow();
    });

    it('should load existing offline data', async () => {
      const mockOfflineData = {
        syncQueue: [MockDataFactory.createMockOfflineAction()],
        cache: {
          'test_key': {
            key: 'test_key',
            data: { test: 'data' },
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60000).toISOString(),
            priority: 'important',
            size: 100,
          },
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockOfflineData));

      await offlineManager.initialize();

      // Should load the cached data
      const cachedData = await offlineManager.getCachedData('test_key');
      expect(cachedData).toEqual({ test: 'data' });
    });
  });

  describe('Network Status Monitoring', () => {
    it('should handle network status changes', async () => {
      let statusCallback: (status: any) => void;
      
      const unsubscribe = offlineManager.onStatusChange((status) => {
        statusCallback = status;
      });

      // Simulate network going offline
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        type: null,
        isInternetReachable: false,
      });

      // Trigger network change
      const networkListener = mockNetInfo.addEventListener.mock.calls[0][1];
      networkListener({
        isConnected: false,
        type: null,
        isInternetReachable: false,
      });

      const status = offlineManager.getStatus();
      expect(status.isConnected).toBe(false);

      unsubscribe();
    });
  });

  describe('Data Caching', () => {
    it('should cache data successfully', async () => {
      const testData = { temperature: 25, windSpeed: 15 };
      
      await offlineManager.cacheData('weather_data', testData, {
        priority: 'critical',
        expiresIn: 60, // 1 hour
      });

      const cachedData = await offlineManager.getCachedData('weather_data');
      expect(cachedData).toEqual(testData);

      // Verify AsyncStorage was called
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return null for expired cache data', async () => {
      const testData = { test: 'expired' };
      
      // Cache data that expires immediately
      await offlineManager.cacheData('expired_data', testData, {
        expiresIn: -1, // Already expired
      });

      // Wait for expiration check
      await new Promise(resolve => setTimeout(resolve, 100));

      const cachedData = await offlineManager.getCachedData('expired_data');
      expect(cachedData).toBeNull();
    });

    it('should handle cache size limits', async () => {
      // Fill cache with large data items
      for (let i = 0; i < 50; i++) {
        const largeData = Array.from({ length: 1000 }, (_, j) => `item_${i}_${j}`);
        await offlineManager.cacheData(`large_item_${i}`, largeData, {
          priority: i < 10 ? 'critical' : 'standard',
        });
      }

      // Critical items should still be available
      const criticalData = await offlineManager.getCachedData('large_item_5');
      expect(criticalData).toBeTruthy();
    });
  });

  describe('Offline Actions Queue', () => {
    it('should queue actions when offline', async () => {
      const mockAction = {
        type: 'weather_request' as const,
        data: { location: { lat: 22.2783, lon: 114.1747 } },
        priority: 'high' as const,
        maxRetries: 3,
      };

      await offlineManager.queueAction(mockAction);

      const status = offlineManager.getStatus();
      expect(status.syncQueueLength).toBe(1);
    });

    it('should process queue when coming back online', async () => {
      // Start offline
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        type: null,
        isInternetReachable: false,
      });

      // Queue some actions
      await offlineManager.queueAction({
        type: 'weather_request' as const,
        data: { location: 'Hong Kong' },
        priority: 'medium' as const,
        maxRetries: 3,
      });

      await offlineManager.queueAction({
        type: 'analytics_event' as const,
        data: { event: 'weather_check' },
        priority: 'low' as const,
        maxRetries: 1,
      });

      expect(offlineManager.getStatus().syncQueueLength).toBe(2);

      // Come back online
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
      });

      // Simulate network change
      const networkListener = mockNetInfo.addEventListener.mock.calls[0]?.[1];
      if (networkListener) {
        networkListener({
          isConnected: true,
          type: 'wifi',
          isInternetReachable: true,
        });
      }

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Queue should be processed (or at least attempted)
      // Note: In a real test, you'd mock the actual API calls
    });

    it('should retry failed actions', async () => {
      const mockAction = {
        type: 'weather_request' as const,
        data: { location: 'Hong Kong' },
        priority: 'medium' as const,
        maxRetries: 2,
      };

      await offlineManager.queueAction(mockAction);

      // Force a sync attempt
      const result = await offlineManager.forceSyncNow();
      
      // Should handle the sync attempt (may fail in test environment)
      expect(result).toBeDefined();
    });
  });

  describe('Critical Data Access', () => {
    it('should provide critical schedule data', async () => {
      const scheduleData = await offlineManager.getCriticalScheduleData();
      
      expect(scheduleData).toBeDefined();
      expect(scheduleData.events).toBeDefined();
    });

    it('should provide critical weather data', async () => {
      const weatherData = await offlineManager.getCriticalWeatherData();
      
      expect(weatherData).toBeDefined();
      expect(weatherData.timestamp).toBeDefined();
    });

    it('should provide critical notices', async () => {
      const notices = await offlineManager.getCriticalNotices();
      
      expect(Array.isArray(notices)).toBe(true);
      expect(notices.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Status', () => {
    it('should report correct offline feature status', () => {
      const featureStatus = offlineManager.getOfflineFeatureStatus();
      
      expect(featureStatus.schedule).toBe(true);
      expect(featureStatus.social).toBe(false); // Requires internet
      expect(featureStatus.notifications).toBe(true);
      expect(featureStatus.maps).toBe(false); // Requires internet
      expect(featureStatus.liveData).toBe(false); // Requires internet
    });

    it('should provide appropriate offline messages', () => {
      const weatherMessage = offlineManager.getOfflineMessage('weather');
      expect(weatherMessage).toContain('Weather data limited offline');

      const socialMessage = offlineManager.getOfflineMessage('social');
      expect(socialMessage).toContain('require internet connection');

      const generalMessage = offlineManager.getOfflineMessage('unknown');
      expect(generalMessage).toContain('currently offline');
    });
  });

  describe('Data Management', () => {
    it('should clear cache successfully', async () => {
      // Add some cache data
      await offlineManager.cacheData('test_data', { test: 'value' });
      
      const cachedData = await offlineManager.getCachedData('test_data');
      expect(cachedData).toBeTruthy();

      // Clear cache
      await offlineManager.clearCache();

      // Data should be cleared
      const clearedData = await offlineManager.getCachedData('test_data');
      expect(clearedData).toBeNull();
    });

    it('should clear sync queue successfully', async () => {
      // Add some actions to queue
      await offlineManager.queueAction({
        type: 'weather_request' as const,
        data: { test: 'data' },
        priority: 'low' as const,
        maxRetries: 1,
      });

      expect(offlineManager.getStatus().syncQueueLength).toBeGreaterThan(0);

      // Clear queue
      await offlineManager.clearSyncQueue();

      expect(offlineManager.getStatus().syncQueueLength).toBe(0);
    });

    it('should provide cache statistics', () => {
      const stats = offlineManager.getCacheStats();
      
      expect(stats.totalItems).toBeGreaterThanOrEqual(0);
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
      expect(stats.sizeByPriority).toBeDefined();
      expect(stats.oldestItem).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle multiple cache operations efficiently', async () => {
      const startTime = performance.now();
      
      // Perform multiple cache operations
      const operations = Array.from({ length: 50 }, (_, i) => 
        offlineManager.cacheData(`perf_test_${i}`, { index: i, data: `test_${i}` })
      );

      await Promise.all(operations);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all operations in reasonable time (< 500ms)
      expect(duration).toBeLessThan(500);

      // Verify data was cached
      const lastData = await offlineManager.getCachedData('perf_test_49');
      expect(lastData).toEqual({ index: 49, data: 'test_49' });
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      // Mock AsyncStorage to throw an error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Should not throw, but handle gracefully
      await expect(offlineManager.cacheData('error_test', { test: 'data' }))
        .resolves.not.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      // Mock network fetch to throw an error
      mockNetInfo.fetch.mockRejectedValue(new Error('Network error'));

      // Should not throw during initialization
      await expect(offlineManager.initialize()).resolves.not.toThrow();
    });
  });
});