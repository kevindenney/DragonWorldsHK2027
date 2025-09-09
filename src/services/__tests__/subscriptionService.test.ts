import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService } from '../subscriptionService';
import { MockDataFactory, APITestUtils } from '../../testing/testingSetup';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');

// Mock global fetch
global.fetch = jest.fn();

describe('SubscriptionService Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Subscription Plans', () => {
    it('should fetch available subscription plans', async () => {
      const mockPlans = [
        MockDataFactory.createMockSubscription('basic'),
        MockDataFactory.createMockSubscription('professional'),
        MockDataFactory.createMockSubscription('elite')
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlans),
      });

      const plans = await subscriptionService.getAvailablePlans();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/plans'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(plans).toHaveLength(3);
      expect(plans.map(p => p.tier)).toEqual(['basic', 'professional', 'elite']);
    });

    it('should handle subscription plan pricing by region', async () => {
      const mockRegionalPlans = {
        currency: 'USD',
        plans: [
          { tier: 'basic', price: 4.99, localizedPrice: '$4.99' },
          { tier: 'professional', price: 9.99, localizedPrice: '$9.99' },
          { tier: 'elite', price: 19.99, localizedPrice: '$19.99' }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRegionalPlans),
      });

      const plans = await subscriptionService.getRegionalPlans('US');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/plans/US'),
        expect.any(Object)
      );
      expect(plans.currency).toBe('USD');
      expect(plans.plans[1].localizedPrice).toBe('$9.99');
    });
  });

  describe('Current Subscription Management', () => {
    it('should fetch user current subscription status', async () => {
      const mockSubscription = MockDataFactory.createMockSubscription('professional');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSubscription),
      });

      const subscription = await subscriptionService.getCurrentSubscription('user_123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/user_123'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );
      expect(subscription.tier).toBe('professional');
      expect(subscription.features.detailedForecast).toBe(true);
    });

    it('should handle user with no active subscription', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      const subscription = await subscriptionService.getCurrentSubscription('user_456');

      expect(subscription).toBeNull();
    });

    it('should cache subscription status locally', async () => {
      const mockSubscription = MockDataFactory.createMockSubscription('basic');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSubscription),
      });

      await subscriptionService.getCurrentSubscription('user_123');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('subscription_cache_user_123'),
        expect.stringContaining('"tier":"basic"')
      );
    });
  });

  describe('Subscription Upgrades', () => {
    it('should handle subscription upgrade successfully', async () => {
      const upgradeResponse = {
        success: true,
        subscriptionId: 'sub_789',
        newTier: 'professional',
        effectiveDate: new Date().toISOString(),
        prorationAmount: 5.99
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(upgradeResponse),
      });

      const result = await subscriptionService.upgradeSubscription('user_123', 'professional', {
        paymentMethod: 'credit_card',
        paymentToken: 'token_123'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/upgrade'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('professional'),
        })
      );
      expect(result.success).toBe(true);
      expect(result.newTier).toBe('professional');
    });

    it('should handle payment failures during upgrade', async () => {
      const paymentFailureResponse = {
        success: false,
        error: 'payment_failed',
        message: 'Your card was declined',
        errorCode: 'card_declined'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve(paymentFailureResponse),
      });

      await expect(
        subscriptionService.upgradeSubscription('user_123', 'professional', {
          paymentMethod: 'credit_card',
          paymentToken: 'invalid_token'
        })
      ).rejects.toThrow('Your card was declined');
    });

    it('should handle subscription downgrades', async () => {
      const downgradeResponse = {
        success: true,
        subscriptionId: 'sub_789',
        newTier: 'basic',
        effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // End of current period
        refundAmount: 0 // No refund for downgrade
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(downgradeResponse),
      });

      const result = await subscriptionService.downgradeSubscription('user_123', 'basic');

      expect(result.success).toBe(true);
      expect(result.newTier).toBe('basic');
      expect(result.refundAmount).toBe(0);
    });
  });

  describe('Feature Access Control', () => {
    it('should validate feature access for different subscription tiers', async () => {
      const mockSubscription = MockDataFactory.createMockSubscription('basic');

      const hasWeatherAccess = subscriptionService.hasFeatureAccess(mockSubscription, 'weatherAccess');
      const hasDetailedForecast = subscriptionService.hasFeatureAccess(mockSubscription, 'detailedForecast');
      const hasWaveData = subscriptionService.hasFeatureAccess(mockSubscription, 'waveData');

      expect(hasWeatherAccess).toBe(true); // Basic has weather access
      expect(hasDetailedForecast).toBe(false); // Basic doesn't have detailed forecast
      expect(hasWaveData).toBe(false); // Basic doesn't have wave data
    });

    it('should enforce feature limits for free users', async () => {
      const freeSubscription = MockDataFactory.createMockSubscription('free');

      const hasWeatherAccess = subscriptionService.hasFeatureAccess(freeSubscription, 'weatherAccess');
      const hasSocialFeatures = subscriptionService.hasFeatureAccess(freeSubscription, 'socialFeatures');

      expect(hasWeatherAccess).toBe(false);
      expect(hasSocialFeatures).toBe(false);
    });

    it('should track feature usage for analytics', async () => {
      const mockResponse = { success: true, recorded: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await subscriptionService.trackFeatureUsage('user_123', 'detailedForecast', {
        timestamp: new Date().toISOString(),
        subscriptionTier: 'professional'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/usage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('detailedForecast'),
        })
      );
    });
  });

  describe('Trial Periods', () => {
    it('should start free trial for new users', async () => {
      const trialResponse = {
        success: true,
        trialId: 'trial_456',
        tier: 'professional',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 7
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(trialResponse),
      });

      const trial = await subscriptionService.startFreeTrial('user_123', 'professional');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/trial/start'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('user_123'),
        })
      );
      expect(trial.success).toBe(true);
      expect(trial.daysRemaining).toBe(7);
    });

    it('should check trial eligibility', async () => {
      const eligibilityResponse = {
        eligible: false,
        reason: 'already_used_trial',
        message: 'You have already used your free trial'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(eligibilityResponse),
      });

      const eligibility = await subscriptionService.checkTrialEligibility('user_456');

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toBe('already_used_trial');
    });

    it('should handle trial expiration notifications', async () => {
      const mockResponse = { success: true, notificationId: 'notif_123' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await subscriptionService.scheduleTrialExpirationNotification('user_123', {
        trialEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day
        reminderDays: [3, 1] // Remind 3 days before and 1 day before
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/trial/notifications'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('trialEndDate'),
        })
      );
    });
  });

  describe('Payment Processing', () => {
    it('should process subscription payment successfully', async () => {
      const paymentResponse = {
        success: true,
        paymentId: 'pay_789',
        amount: 9.99,
        currency: 'USD',
        receiptUrl: 'https://receipts.example.com/pay_789',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(paymentResponse),
      });

      const result = await subscriptionService.processPayment('user_123', {
        amount: 9.99,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paymentToken: 'token_123'
      });

      expect(result.success).toBe(true);
      expect(result.amount).toBe(9.99);
      expect(result.receiptUrl).toBeDefined();
    });

    it('should handle payment method updates', async () => {
      const updateResponse = {
        success: true,
        paymentMethodId: 'pm_new123',
        lastFour: '4242',
        expiryMonth: 12,
        expiryYear: 2028,
        brand: 'visa'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updateResponse),
      });

      const result = await subscriptionService.updatePaymentMethod('user_123', {
        paymentToken: 'new_token_456'
      });

      expect(result.success).toBe(true);
      expect(result.lastFour).toBe('4242');
    });

    it('should handle recurring payment failures', async () => {
      const failureResponse = {
        success: false,
        error: 'payment_failed',
        errorCode: 'insufficient_funds',
        retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        gracePeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve(failureResponse),
      });

      await expect(
        subscriptionService.processRecurringPayment('sub_123')
      ).rejects.toThrow();
    });
  });

  describe('Subscription Cancellation', () => {
    it('should cancel subscription at period end', async () => {
      const cancellationResponse = {
        success: true,
        subscriptionId: 'sub_789',
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        endOfServiceDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        refundAmount: 0
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(cancellationResponse),
      });

      const result = await subscriptionService.cancelSubscription('user_123', {
        cancelImmediately: false,
        reason: 'too_expensive'
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('cancelled');
      expect(result.endOfServiceDate).toBeDefined();
    });

    it('should handle immediate cancellation with refund', async () => {
      const immediateCancellationResponse = {
        success: true,
        subscriptionId: 'sub_789',
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        endOfServiceDate: new Date().toISOString(),
        refundAmount: 4.99 // Prorated refund
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(immediateCancellationResponse),
      });

      const result = await subscriptionService.cancelSubscription('user_123', {
        cancelImmediately: true,
        reason: 'not_satisfied'
      });

      expect(result.refundAmount).toBe(4.99);
      expect(result.endOfServiceDate).toBeDefined();
    });
  });

  describe('Subscription Restoration', () => {
    it('should restore cancelled subscription', async () => {
      const restoreResponse = {
        success: true,
        subscriptionId: 'sub_789',
        status: 'active',
        restoredAt: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(restoreResponse),
      });

      const result = await subscriptionService.restoreSubscription('user_123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('active');
    });
  });

  describe('Subscription Analytics', () => {
    it('should track subscription conversion funnel', async () => {
      const mockResponse = { success: true, recorded: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await subscriptionService.trackConversionEvent('paywall_view', 'user_123', {
        source: 'weather_limit',
        plan: 'professional',
        timestamp: new Date().toISOString()
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/analytics/funnel'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('paywall_view'),
        })
      );
    });

    it('should calculate subscription metrics', async () => {
      const metricsResponse = {
        totalSubscribers: 1250,
        newSubscribers: 85,
        churnRate: 0.05,
        monthlyRecurringRevenue: 11250.50,
        averageRevenuePerUser: 9.00,
        conversionRate: 0.12,
        trialToSubscriptionRate: 0.35
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(metricsResponse),
      });

      const metrics = await subscriptionService.getSubscriptionMetrics({
        dateRange: { start: '2024-11-01', end: '2024-11-21' }
      });

      expect(metrics.churnRate).toBeCloseTo(0.05, 2);
      expect(metrics.averageRevenuePerUser).toBeCloseTo(9.00, 2);
    });
  });

  describe('Subscription Notifications', () => {
    it('should send billing reminder notifications', async () => {
      const mockResponse = { success: true, notificationId: 'notif_456' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await subscriptionService.sendBillingReminder('user_123', {
        nextBillingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 9.99,
        currency: 'USD'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/notifications/billing-reminder'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('nextBillingDate'),
        })
      );
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle subscription service downtime', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Service unavailable'));

      // Should fallback to cached subscription data
      const cachedSubscription = MockDataFactory.createMockSubscription('professional');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedSubscription));

      const subscription = await subscriptionService.getCurrentSubscription('user_123');

      expect(subscription.tier).toBe('professional');
    });

    it('should queue subscription events when offline', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await subscriptionService.trackFeatureUsage('user_123', 'detailedForecast', {
        timestamp: new Date().toISOString()
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('subscription_events_queue'),
        expect.stringContaining('detailedForecast')
      );
    });

    it('should handle expired authentication tokens', async () => {
      // First call fails with 401
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'token_expired' }),
        })
        // Second call succeeds after token refresh
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(MockDataFactory.createMockSubscription('basic')),
        });

      const subscription = await subscriptionService.getCurrentSubscription('user_123');

      expect(fetch).toHaveBeenCalledTimes(2); // Original call + retry after token refresh
      expect(subscription.tier).toBe('basic');
    });
  });
});