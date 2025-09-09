import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from '../analyticsService';
import { MockDataFactory, APITestUtils, StoreTestUtils } from '../../testing/testingSetup';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');

// Mock global fetch
global.fetch = jest.fn();

describe('AnalyticsService Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Event Tracking', () => {
    it('should track user interactions correctly', async () => {
      const mockResponse = { success: true, eventId: 'event_123' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await analyticsService.trackEvent('weather_view', {
        location: 'Hong Kong',
        timestamp: new Date().toISOString(),
        userId: 'user_123'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/events'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('weather_view'),
        })
      );
    });

    it('should queue events when offline', async () => {
      // Mock network failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await analyticsService.trackEvent('race_view', {
        raceId: 'race_1',
        userId: 'user_123'
      });

      // Should store event in AsyncStorage for later sync
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('analytics_queue'),
        expect.stringContaining('race_view')
      );
    });

    it('should batch multiple events efficiently', async () => {
      const mockResponse = { success: true, processed: 3 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const events = [
        { name: 'app_open', data: { timestamp: new Date().toISOString() } },
        { name: 'weather_view', data: { location: 'Hong Kong' } },
        { name: 'race_view', data: { raceId: 'race_1' } },
      ];

      await analyticsService.batchTrackEvents(events);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/events/batch'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('app_open'),
        })
      );
    });

    it('should handle event validation and sanitization', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Event with potentially sensitive data
      await analyticsService.trackEvent('user_action', {
        email: 'user@example.com', // Should be filtered
        creditCard: '1234-5678-9012-3456', // Should be filtered
        userId: 'user_123', // Should be kept
        action: 'subscription_upgrade', // Should be kept
      });

      const sentData = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      
      expect(sentData.properties.email).toBeUndefined();
      expect(sentData.properties.creditCard).toBeUndefined();
      expect(sentData.properties.userId).toBe('user_123');
      expect(sentData.properties.action).toBe('subscription_upgrade');
    });
  });

  describe('Performance Tracking', () => {
    it('should track app performance metrics', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const performanceMetrics = {
        screenLoadTime: 1250,
        apiResponseTime: 340,
        renderTime: 87,
        memoryUsage: 125.6,
        screenName: 'WeatherScreen'
      };

      await analyticsService.trackPerformance(performanceMetrics);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/performance'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('screenLoadTime'),
        })
      );
    });

    it('should aggregate performance data locally', async () => {
      const performanceData = [
        { screenName: 'WeatherScreen', loadTime: 1200 },
        { screenName: 'WeatherScreen', loadTime: 1350 },
        { screenName: 'ScheduleScreen', loadTime: 890 },
      ];

      for (const data of performanceData) {
        await analyticsService.trackPerformance(data);
      }

      const aggregatedData = await analyticsService.getPerformanceReport();

      expect(aggregatedData.WeatherScreen.averageLoadTime).toBeCloseTo(1275, 0);
      expect(aggregatedData.WeatherScreen.sampleCount).toBe(2);
      expect(aggregatedData.ScheduleScreen.averageLoadTime).toBe(890);
    });
  });

  describe('User Journey Tracking', () => {
    it('should track complete user journeys', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Simulate user journey
      await analyticsService.startUserJourney('subscription_flow', 'user_123');
      
      await analyticsService.trackJourneyStep('paywall_view', {
        plan: 'professional',
        source: 'weather_limit'
      });
      
      await analyticsService.trackJourneyStep('plan_selected', {
        plan: 'professional',
        price: '$9.99'
      });
      
      await analyticsService.completeUserJourney('subscription_success', {
        plan: 'professional',
        revenue: 9.99,
        duration: 180 // seconds
      });

      // Should have made 4 API calls (start, 2 steps, complete)
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('should calculate journey conversion rates', async () => {
      // Mock stored journey data
      const journeyData = {
        subscription_flow: {
          started: 100,
          paywall_view: 85,
          plan_selected: 45,
          subscription_success: 12
        }
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(journeyData));

      const conversionRates = await analyticsService.getJourneyAnalytics('subscription_flow');

      expect(conversionRates.overallConversionRate).toBeCloseTo(0.12, 2); // 12/100
      expect(conversionRates.stepConversions.paywall_view).toBeCloseTo(0.85, 2); // 85/100
      expect(conversionRates.stepConversions.plan_selected).toBeCloseTo(0.53, 2); // 45/85
    });
  });

  describe('Subscription Analytics', () => {
    it('should track subscription metrics', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await analyticsService.trackSubscriptionMetric('upgrade', {
        fromPlan: 'free',
        toPlan: 'professional',
        revenue: 9.99,
        paymentMethod: 'credit_card',
        userId: 'user_123'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/subscription'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('upgrade'),
        })
      );
    });

    it('should calculate subscription revenue analytics', async () => {
      const subscriptionEvents = [
        { type: 'upgrade', revenue: 9.99, plan: 'professional' },
        { type: 'upgrade', revenue: 19.99, plan: 'elite' },
        { type: 'upgrade', revenue: 4.99, plan: 'basic' },
        { type: 'downgrade', revenue: -5.00, fromPlan: 'professional', toPlan: 'basic' },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(subscriptionEvents));

      const revenueAnalytics = await analyticsService.getRevenueAnalytics();

      expect(revenueAnalytics.totalRevenue).toBeCloseTo(29.97, 2);
      expect(revenueAnalytics.upgradeRevenue).toBeCloseTo(34.97, 2);
      expect(revenueAnalytics.downgradeLoss).toBeCloseTo(5.00, 2);
      expect(revenueAnalytics.averageRevenuePerUser).toBeCloseTo(7.49, 2); // 29.97/4
    });
  });

  describe('Cross-promotion Analytics', () => {
    it('should track cross-promotion effectiveness', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await analyticsService.trackCrossPromotion('tacticalwind_pro', 'impression', {
        location: 'weather_screen_banner',
        userId: 'user_123',
        userSegment: 'competitive_racer'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/cross-promotion'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('tacticalwind_pro'),
        })
      );
    });

    it('should calculate cross-promotion conversion rates', async () => {
      const crossPromotionData = {
        tacticalwind_pro: {
          impressions: 1000,
          clicks: 150,
          conversions: 12,
          revenue: 119.88 // 12 * $9.99
        }
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(crossPromotionData));

      const analytics = await analyticsService.getCrossPromotionAnalytics('tacticalwind_pro');

      expect(analytics.clickThroughRate).toBeCloseTo(0.15, 2); // 150/1000
      expect(analytics.conversionRate).toBeCloseTo(0.08, 2); // 12/150
      expect(analytics.revenuePerImpression).toBeCloseTo(0.12, 2); // 119.88/1000
    });
  });

  describe('Error and Crash Analytics', () => {
    it('should track application errors', async () => {
      const mockResponse = { success: true, errorId: 'error_123' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const errorData = {
        message: 'TypeError: Cannot read property "name" of undefined',
        stack: 'Error: at WeatherComponent.render (...)',
        component: 'WeatherScreen',
        userId: 'user_123',
        appVersion: '1.0.0',
        platform: 'iOS 17.1'
      };

      await analyticsService.trackError(errorData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/errors'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('TypeError'),
        })
      );
    });

    it('should aggregate error patterns', async () => {
      const errors = [
        { message: 'Network timeout', component: 'WeatherScreen', count: 5 },
        { message: 'Network timeout', component: 'ScheduleScreen', count: 3 },
        { message: 'Parse error', component: 'WeatherScreen', count: 2 },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(errors));

      const errorAnalytics = await analyticsService.getErrorAnalytics();

      expect(errorAnalytics.totalErrors).toBe(10);
      expect(errorAnalytics.topErrors[0].message).toBe('Network timeout');
      expect(errorAnalytics.topErrors[0].totalCount).toBe(8);
      expect(errorAnalytics.errorsByComponent.WeatherScreen).toBe(7);
    });
  });

  describe('A/B Testing Integration', () => {
    it('should track A/B test assignments and results', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await analyticsService.trackABTestAssignment('paywall_design_v2', 'variant_b', 'user_123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/ab-test'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('paywall_design_v2'),
        })
      );
    });

    it('should track A/B test conversions', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await analyticsService.trackABTestConversion('paywall_design_v2', 'variant_b', {
        userId: 'user_123',
        revenue: 9.99,
        conversionTime: 180
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/ab-test/conversion'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('variant_b'),
        })
      );
    });
  });

  describe('Privacy and Data Protection', () => {
    it('should respect user privacy settings', async () => {
      // Mock user opting out of analytics
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('analytics_consent')) {
          return Promise.resolve('false');
        }
        return Promise.resolve(null);
      });

      await analyticsService.trackEvent('weather_view', {
        location: 'Hong Kong',
        userId: 'user_123'
      });

      // Should not make any network requests when user has opted out
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should anonymize sensitive user data', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await analyticsService.trackEvent('user_profile_update', {
        email: 'user@example.com',
        name: 'John Smith',
        age: 35,
        location: 'Hong Kong',
        userIdHash: 'hashed_user_id_123'
      });

      const sentData = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      
      // Personal identifiers should be removed or hashed
      expect(sentData.properties.email).toBeUndefined();
      expect(sentData.properties.name).toBeUndefined();
      expect(sentData.properties.location).toBe('Hong Kong'); // Non-sensitive
      expect(sentData.properties.userIdHash).toBeDefined();
    });
  });

  describe('Data Retention and Cleanup', () => {
    it('should clean up old analytics data', async () => {
      const oldData = {
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days old
        events: [{ name: 'old_event', data: {} }]
      };

      const recentData = {
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days old
        events: [{ name: 'recent_event', data: {} }]
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([oldData, recentData])
      );

      await analyticsService.cleanupOldData();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('recent_event')
      );

      // Old data should not be in the saved data
      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      expect(savedData).not.toContain('old_event');
    });
  });

  describe('Offline Analytics', () => {
    it('should sync queued events when coming back online', async () => {
      const queuedEvents = [
        { name: 'offline_event_1', data: { timestamp: Date.now() - 1000 } },
        { name: 'offline_event_2', data: { timestamp: Date.now() - 500 } },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queuedEvents));
      
      const mockResponse = { success: true, processed: 2 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await analyticsService.syncOfflineEvents();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/events/batch'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('offline_event_1'),
        })
      );

      // Queue should be cleared after successful sync
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('analytics_queue'),
        '[]'
      );
    });
  });
});