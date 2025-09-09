import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { crossPromotionService } from '../crossPromotionService';
import { MockDataFactory, APITestUtils } from '../../testing/testingSetup';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');

// Mock global fetch
global.fetch = jest.fn();

describe('CrossPromotionService Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('TacticalWind Pro Integration', () => {
    it('should check TacticalWind Pro availability', async () => {
      const mockResponse = {
        available: true,
        appStoreUrl: 'https://apps.apple.com/app/tacticalwind-pro/id123456789',
        features: [
          'Advanced wind analysis',
          'Tactical racing insights',
          'Professional weather routing'
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await crossPromotionService.checkTacticalWindAvailability();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cross-promotion/tacticalwind'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result.available).toBe(true);
      expect(result.features).toHaveLength(3);
    });

    it('should handle TacticalWind Pro unavailable in region', async () => {
      const mockResponse = {
        available: false,
        reason: 'not_available_in_region',
        message: 'TacticalWind Pro is not available in your region'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await crossPromotionService.checkTacticalWindAvailability();

      expect(result.available).toBe(false);
      expect(result.reason).toBe('not_available_in_region');
    });

    it('should track TacticalWind Pro promotion impressions', async () => {
      const mockResponse = { success: true, impressionId: 'imp_123' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await crossPromotionService.trackPromotion('tacticalwind_pro', 'impression', {
        location: 'weather_screen_banner',
        userId: 'user_123',
        userSegment: 'competitive_racer'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cross-promotion/track'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('tacticalwind_pro'),
        })
      );
    });

    it('should track TacticalWind Pro app store clicks', async () => {
      const mockResponse = { success: true, clickId: 'click_456' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await crossPromotionService.trackPromotion('tacticalwind_pro', 'click', {
        location: 'weather_paywall',
        userId: 'user_123',
        ctaText: 'Get Professional Weather Analysis'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cross-promotion/track'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('click'),
        })
      );
    });
  });

  describe('User Segmentation for Cross-Promotion', () => {
    it('should determine user segment based on behavior', async () => {
      const userBehavior = {
        weatherChecksPerWeek: 25,
        racingEventsAttended: 8,
        subscriptionTier: 'free',
        appUsageDays: 45,
        featureUsage: {
          detailedForecast: 15,
          windAnalysis: 22,
          raceCommentary: 8
        }
      };

      const segment = await crossPromotionService.determineUserSegment(userBehavior);

      expect(segment).toBe('competitive_racer'); // High usage, racing focus
    });

    it('should segment casual users differently', async () => {
      const casualUserBehavior = {
        weatherChecksPerWeek: 3,
        racingEventsAttended: 1,
        subscriptionTier: 'free',
        appUsageDays: 12,
        featureUsage: {
          detailedForecast: 2,
          windAnalysis: 1,
          raceCommentary: 0
        }
      };

      const segment = await crossPromotionService.determineUserSegment(casualUserBehavior);

      expect(segment).toBe('casual_sailor');
    });

    it('should segment professional users', async () => {
      const proUserBehavior = {
        weatherChecksPerWeek: 35,
        racingEventsAttended: 15,
        subscriptionTier: 'professional',
        appUsageDays: 120,
        featureUsage: {
          detailedForecast: 45,
          windAnalysis: 50,
          raceCommentary: 20,
          tacticalInsights: 25
        }
      };

      const segment = await crossPromotionService.determineUserSegment(proUserBehavior);

      expect(segment).toBe('professional_racer');
    });
  });

  describe('Personalized Promotion Content', () => {
    it('should generate personalized promotion for competitive racers', async () => {
      const mockPromotionContent = {
        title: 'Dominate the Racing Circuit',
        description: 'Get the tactical edge with TacticalWind Pro\'s advanced wind analysis',
        cta: 'Upgrade Your Racing Strategy',
        visualAsset: 'racing_hero_image.jpg',
        features: [
          'Real-time wind shift predictions',
          'Tactical racing lines',
          'Professional weather routing'
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPromotionContent),
      });

      const content = await crossPromotionService.getPersonalizedPromotion('user_123', 'competitive_racer');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cross-promotion/content'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('competitive_racer'),
        })
      );
      expect(content.title).toContain('Racing');
      expect(content.features).toContain('Real-time wind shift predictions');
    });

    it('should generate different content for casual sailors', async () => {
      const casualPromotionContent = {
        title: 'Enhance Your Sailing Experience',
        description: 'Discover better sailing conditions with TacticalWind Pro',
        cta: 'Improve Your Sailing',
        visualAsset: 'casual_sailing_image.jpg',
        features: [
          'Easy-to-understand weather insights',
          'Perfect timing for recreational sailing',
          'Beautiful weather visualizations'
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(casualPromotionContent),
      });

      const content = await crossPromotionService.getPersonalizedPromotion('user_456', 'casual_sailor');

      expect(content.title).toContain('Sailing Experience');
      expect(content.features).toContain('Easy-to-understand weather insights');
    });
  });

  describe('A/B Testing for Cross-Promotion', () => {
    it('should assign users to A/B test variants', async () => {
      const mockABTest = {
        testId: 'tacticalwind_promo_v2',
        variant: 'variant_b',
        content: {
          title: 'Professional Weather Analysis Awaits',
          cta: 'Get TacticalWind Pro Now',
          discount: '20% off first month'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockABTest),
      });

      const assignment = await crossPromotionService.getABTestAssignment('user_123', 'tacticalwind_promo_v2');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cross-promotion/ab-test'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('tacticalwind_promo_v2'),
        })
      );
      expect(assignment.variant).toBe('variant_b');
      expect(assignment.content.discount).toBe('20% off first month');
    });

    it('should track A/B test performance', async () => {
      const mockResponse = { success: true, recorded: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await crossPromotionService.trackABTestEvent('tacticalwind_promo_v2', 'variant_b', 'conversion', {
        userId: 'user_123',
        conversionValue: 9.99,
        timeToConversion: 180 // seconds
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cross-promotion/ab-test/event'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('conversion'),
        })
      );
    });
  });

  describe('Conversion Tracking', () => {
    it('should track successful app store conversions', async () => {
      const mockResponse = { success: true, conversionId: 'conv_789' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await crossPromotionService.trackConversion('tacticalwind_pro', 'app_store_visit', {
        userId: 'user_123',
        source: 'weather_paywall',
        revenue: 9.99,
        conversionPath: ['impression', 'click', 'app_store_visit']
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cross-promotion/conversion'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('app_store_visit'),
        })
      );
    });

    it('should track subscription conversions with revenue attribution', async () => {
      const mockResponse = { success: true, attributed: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await crossPromotionService.trackConversion('tacticalwind_pro', 'subscription', {
        userId: 'user_123',
        revenue: 9.99,
        subscriptionTier: 'professional',
        attributionWindow: '7_days'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cross-promotion/conversion'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('subscription'),
        })
      );
    });
  });

  describe('Performance Analytics', () => {
    it('should calculate cross-promotion performance metrics', async () => {
      const mockAnalytics = {
        impressions: 10000,
        clicks: 850,
        appStoreVisits: 125,
        subscriptions: 15,
        revenue: 149.85,
        clickThroughRate: 0.085,
        conversionRate: 0.176,
        revenuePerImpression: 0.015
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalytics),
      });

      const analytics = await crossPromotionService.getPerformanceAnalytics('tacticalwind_pro', {
        dateRange: { start: '2024-11-01', end: '2024-11-21' }
      });

      expect(analytics.clickThroughRate).toBeCloseTo(0.085, 3);
      expect(analytics.conversionRate).toBeCloseTo(0.176, 3);
      expect(analytics.revenuePerImpression).toBeCloseTo(0.015, 3);
    });

    it('should segment analytics by user type', async () => {
      const mockSegmentedAnalytics = {
        competitive_racer: {
          impressions: 3000,
          clicks: 450,
          conversions: 18,
          revenue: 179.82
        },
        casual_sailor: {
          impressions: 5000,
          clicks: 300,
          conversions: 8,
          revenue: 79.92
        },
        professional_racer: {
          impressions: 2000,
          clicks: 100,
          conversions: 5,
          revenue: 49.95
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSegmentedAnalytics),
      });

      const segmentedAnalytics = await crossPromotionService.getSegmentedAnalytics('tacticalwind_pro');

      expect(segmentedAnalytics.competitive_racer.impressions).toBe(3000);
      expect(segmentedAnalytics.competitive_racer.conversions).toBe(18);
    });
  });

  describe('Timing and Frequency Optimization', () => {
    it('should determine optimal promotion timing', async () => {
      const mockOptimalTiming = {
        bestDayOfWeek: 'Wednesday',
        bestTimeOfDay: '14:00',
        frequencyCap: 3, // max 3 promotions per week
        cooldownPeriod: 48, // hours between promotions
        context: 'pre_race_day' // best context for showing promotions
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOptimalTiming),
      });

      const timing = await crossPromotionService.getOptimalPromotionTiming('user_123');

      expect(timing.bestDayOfWeek).toBe('Wednesday');
      expect(timing.frequencyCap).toBe(3);
    });

    it('should respect frequency caps', async () => {
      // Mock user who has already seen 3 promotions this week
      const recentPromotions = [
        { timestamp: Date.now() - 24 * 60 * 60 * 1000, type: 'impression' }, // 1 day ago
        { timestamp: Date.now() - 48 * 60 * 60 * 1000, type: 'impression' }, // 2 days ago
        { timestamp: Date.now() - 72 * 60 * 60 * 1000, type: 'impression' }, // 3 days ago
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(recentPromotions));

      const shouldShow = await crossPromotionService.shouldShowPromotion('user_123', 'tacticalwind_pro');

      expect(shouldShow).toBe(false); // Should respect frequency cap
    });
  });

  describe('Revenue Attribution', () => {
    it('should attribute revenue to cross-promotion campaigns', async () => {
      const mockRevenue = {
        totalAttributedRevenue: 2499.85,
        attributionBySource: {
          weather_paywall: 1299.90,
          schedule_banner: 599.95,
          post_race_popup: 599.99
        },
        attributionWindow: '30_days',
        conversionCount: 125
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRevenue),
      });

      const revenueData = await crossPromotionService.getRevenueAttribution('tacticalwind_pro');

      expect(revenueData.totalAttributedRevenue).toBeCloseTo(2499.85, 2);
      expect(revenueData.attributionBySource.weather_paywall).toBeCloseTo(1299.90, 2);
    });

    it('should calculate return on ad spend (ROAS)', async () => {
      const campaignData = {
        promotionCost: 500.00, // Cost of promotion campaign
        attributedRevenue: 2499.85,
        directConversions: 125,
        assistedConversions: 45
      };

      const roas = await crossPromotionService.calculateROAS(campaignData);

      expect(roas.directROAS).toBeCloseTo(5.0, 1); // 2499.85 / 500
      expect(roas.totalROAS).toBeGreaterThan(5.0); // Including assisted conversions
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle cross-promotion service unavailability', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await crossPromotionService.checkTacticalWindAvailability();

      expect(result.available).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fallback to cached promotion content', async () => {
      const cachedContent = {
        title: 'Cached Promotion',
        description: 'Fallback content',
        cta: 'Learn More',
        cached: true,
        timestamp: Date.now() - 30 * 60 * 1000 // 30 minutes old
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedContent));
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const content = await crossPromotionService.getPersonalizedPromotion('user_123', 'competitive_racer');

      expect(content.title).toBe('Cached Promotion');
      expect(content.cached).toBe(true);
    });

    it('should queue analytics when offline', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await crossPromotionService.trackPromotion('tacticalwind_pro', 'impression', {
        location: 'weather_screen',
        userId: 'user_123'
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('cross_promotion_queue'),
        expect.stringContaining('impression')
      );
    });
  });

  describe('Privacy and Compliance', () => {
    it('should respect user opt-out preferences', async () => {
      // Mock user who has opted out of cross-promotion
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('cross_promotion_consent')) {
          return Promise.resolve('false');
        }
        return Promise.resolve(null);
      });

      const shouldShow = await crossPromotionService.shouldShowPromotion('user_123', 'tacticalwind_pro');

      expect(shouldShow).toBe(false);
    });

    it('should anonymize tracking data', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await crossPromotionService.trackPromotion('tacticalwind_pro', 'impression', {
        location: 'weather_screen',
        email: 'user@example.com', // Should be filtered
        deviceId: '123-456-789', // Should be hashed
        userId: 'user_123'
      });

      const sentData = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      
      expect(sentData.email).toBeUndefined();
      expect(sentData.deviceId).not.toBe('123-456-789'); // Should be hashed
      expect(sentData.userId).toBeDefined();
    });
  });
});