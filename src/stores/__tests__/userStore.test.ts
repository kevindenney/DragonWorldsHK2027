import { act, renderHook } from '@testing-library/react-native';
import { useUserStore } from '../userStore';
import { MockDataFactory, StoreTestUtils } from '../../testing/testingSetup';

describe('UserStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      const store = useUserStore.getState();
      if (store.resetUserData) store.resetUserData();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUserStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.subscription).toBeNull();
      expect(result.current.preferences).toBeDefined();
      expect(result.current.onboardingComplete).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should handle user login', () => {
      const { result } = renderHook(() => useUserStore());
      const mockUser = {
        id: 'user_123',
        email: 'sailor@dragonworlds.com',
        name: 'Test Sailor',
        avatar: null,
        joinedAt: new Date().toISOString(),
        preferences: {
          notifications: {
            weather: true,
            races: true,
            results: true,
            social: false,
          },
          units: {
            wind: 'knots' as const,
            temperature: 'celsius' as const,
            distance: 'nautical' as const,
          },
          privacy: {
            showProfile: true,
            shareResults: true,
            shareCalendar: false,
          },
        },
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle user logout', () => {
      const { result } = renderHook(() => useUserStore());
      const mockUser = {
        id: 'user_123',
        email: 'sailor@dragonworlds.com',
        name: 'Test Sailor',
        avatar: null,
        joinedAt: new Date().toISOString(),
        preferences: {
          notifications: { weather: true, races: true, results: true, social: false },
          units: { wind: 'knots' as const, temperature: 'celsius' as const, distance: 'nautical' as const },
          privacy: { showProfile: true, shareResults: true, shareCalendar: false },
        },
      };

      // Login first
      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.subscription).toBeNull();
    });
  });

  describe('Subscription Management', () => {
    it('should update subscription status', () => {
      const { result } = renderHook(() => useUserStore());
      const mockSubscription = MockDataFactory.createMockSubscription('professional');

      act(() => {
        result.current.setSubscription(mockSubscription);
      });

      expect(result.current.subscription).toEqual(mockSubscription);
    });

    it('should handle subscription upgrade', () => {
      const { result } = renderHook(() => useUserStore());
      
      // Start with basic subscription
      const basicSubscription = MockDataFactory.createMockSubscription('basic');
      act(() => {
        result.current.setSubscription(basicSubscription);
      });

      expect(result.current.subscription?.tier).toBe('basic');

      // Upgrade to professional
      const professionalSubscription = MockDataFactory.createMockSubscription('professional');
      act(() => {
        result.current.setSubscription(professionalSubscription);
      });

      expect(result.current.subscription?.tier).toBe('professional');
      expect(result.current.subscription?.features.detailedForecast).toBe(true);
      expect(result.current.subscription?.features.waveData).toBe(true);
    });

    it('should handle subscription cancellation', () => {
      const { result } = renderHook(() => useUserStore());
      const mockSubscription = MockDataFactory.createMockSubscription('professional');

      act(() => {
        result.current.setSubscription(mockSubscription);
      });

      expect(result.current.subscription).toBeTruthy();

      act(() => {
        result.current.setSubscription(null);
      });

      expect(result.current.subscription).toBeNull();
    });
  });

  describe('User Preferences', () => {
    it('should update notification preferences', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.updatePreferences({
          notifications: {
            weather: false,
            races: true,
            results: true,
            social: true,
          },
        });
      });

      expect(result.current.preferences.notifications.weather).toBe(false);
      expect(result.current.preferences.notifications.social).toBe(true);
    });

    it('should update unit preferences', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.updatePreferences({
          units: {
            wind: 'mph' as const,
            temperature: 'fahrenheit' as const,
            distance: 'statute' as const,
          },
        });
      });

      expect(result.current.preferences.units.wind).toBe('mph');
      expect(result.current.preferences.units.temperature).toBe('fahrenheit');
      expect(result.current.preferences.units.distance).toBe('statute');
    });

    it('should update privacy preferences', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.updatePreferences({
          privacy: {
            showProfile: false,
            shareResults: false,
            shareCalendar: true,
          },
        });
      });

      expect(result.current.preferences.privacy.showProfile).toBe(false);
      expect(result.current.preferences.privacy.shareCalendar).toBe(true);
    });
  });

  describe('Onboarding', () => {
    it('should track onboarding completion', () => {
      const { result } = renderHook(() => useUserStore());

      expect(result.current.onboardingComplete).toBe(false);

      act(() => {
        result.current.completeOnboarding();
      });

      expect(result.current.onboardingComplete).toBe(true);
    });

    it('should allow resetting onboarding', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.completeOnboarding();
      });

      expect(result.current.onboardingComplete).toBe(true);

      act(() => {
        result.current.resetOnboarding();
      });

      expect(result.current.onboardingComplete).toBe(false);
    });
  });

  describe('Feature Access', () => {
    it('should correctly determine feature access for free user', () => {
      const { result } = renderHook(() => useUserStore());
      const freeSubscription = MockDataFactory.createMockSubscription('free');

      act(() => {
        result.current.setSubscription(freeSubscription);
      });

      expect(result.current.hasFeatureAccess('weatherAccess')).toBe(false);
      expect(result.current.hasFeatureAccess('detailedForecast')).toBe(false);
      expect(result.current.hasFeatureAccess('socialFeatures')).toBe(false);
    });

    it('should correctly determine feature access for professional user', () => {
      const { result } = renderHook(() => useUserStore());
      const professionalSubscription = MockDataFactory.createMockSubscription('professional');

      act(() => {
        result.current.setSubscription(professionalSubscription);
      });

      expect(result.current.hasFeatureAccess('weatherAccess')).toBe(true);
      expect(result.current.hasFeatureAccess('detailedForecast')).toBe(true);
      expect(result.current.hasFeatureAccess('waveData')).toBe(true);
      expect(result.current.hasFeatureAccess('socialFeatures')).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    it('should handle store rehydration', async () => {
      const { result } = renderHook(() => useUserStore());
      const mockUser = {
        id: 'user_123',
        email: 'sailor@dragonworlds.com',
        name: 'Test Sailor',
        avatar: null,
        joinedAt: new Date().toISOString(),
        preferences: {
          notifications: { weather: true, races: true, results: true, social: false },
          units: { wind: 'knots' as const, temperature: 'celsius' as const, distance: 'nautical' as const },
          privacy: { showProfile: true, shareResults: true, shareCalendar: false },
        },
      };

      const mockSubscription = MockDataFactory.createMockSubscription('basic');

      // Set user and subscription
      act(() => {
        result.current.setUser(mockUser);
        result.current.setSubscription(mockSubscription);
      });

      // Simulate store rehydration
      const storeSnapshot = StoreTestUtils.createStoreSnapshot(useUserStore);
      
      expect(storeSnapshot.user).toEqual(mockUser);
      expect(storeSnapshot.subscription).toEqual(mockSubscription);
      expect(storeSnapshot.isAuthenticated).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle rapid preference updates efficiently', () => {
      const { result } = renderHook(() => useUserStore());
      
      const startTime = performance.now();
      
      // Perform 20 rapid preference updates
      for (let i = 0; i < 20; i++) {
        act(() => {
          result.current.updatePreferences({
            notifications: {
              weather: i % 2 === 0,
              races: true,
              results: true,
              social: i % 3 === 0,
            },
          });
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all updates in reasonable time (< 50ms)
      expect(duration).toBeLessThan(50);
      
      // Final state should reflect last update
      expect(result.current.preferences.notifications.weather).toBe(false); // 19 % 2 === 1, so false
      expect(result.current.preferences.notifications.social).toBe(true); // 19 % 3 === 1, so true
    });
  });
});