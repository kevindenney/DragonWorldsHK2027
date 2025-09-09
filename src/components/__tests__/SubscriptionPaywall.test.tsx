import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SubscriptionPaywall } from '../SubscriptionPaywall';
import { MockDataFactory, renderWithProviders, AccessibilityTestUtils } from '../../testing/testingSetup';

// Mock subscription service
const mockSubscriptionService = {
  getAvailablePlans: jest.fn(),
  upgradeSubscription: jest.fn(),
  startFreeTrial: jest.fn(),
  checkTrialEligibility: jest.fn(),
};

jest.mock('../../services/subscriptionService', () => ({
  subscriptionService: mockSubscriptionService
}));

describe('SubscriptionPaywall Component', () => {
  const mockPlans = [
    MockDataFactory.createMockSubscription('basic'),
    MockDataFactory.createMockSubscription('professional'),
    MockDataFactory.createMockSubscription('elite')
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscriptionService.getAvailablePlans.mockResolvedValue(mockPlans);
    mockSubscriptionService.checkTrialEligibility.mockResolvedValue({ eligible: true });
  });

  describe('Rendering', () => {
    it('should render paywall with feature being limited', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        expect(getByText('Unlock Detailed Weather Forecasts')).toBeTruthy();
        expect(getByTestId('subscription-paywall')).toBeTruthy();
      });
    });

    it('should display available subscription plans', async () => {
      const { getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="weatherAccess"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        expect(getByText('Basic')).toBeTruthy();
        expect(getByText('Professional')).toBeTruthy();
        expect(getByText('Elite')).toBeTruthy();
      });
    });

    it('should show plan features and pricing', async () => {
      const { getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="waveData"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        // Check for features
        expect(getByText('Basic weather access')).toBeTruthy();
        expect(getByText('Detailed forecasts')).toBeTruthy();
        expect(getByText('Professional weather analysis')).toBeTruthy();
        
        // Check for pricing (would be localized)
        expect(getByText(/\$4\.99/)).toBeTruthy(); // Basic plan
        expect(getByText(/\$9\.99/)).toBeTruthy(); // Professional plan
      });
    });

    it('should highlight recommended plan', async () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          recommendedPlan="professional"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        const recommendedBadge = getByTestId('recommended-plan-badge');
        expect(recommendedBadge).toBeTruthy();
      });
    });

    it('should show free trial offer when eligible', async () => {
      const { getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="weatherAccess"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        expect(getByText('Start 7-Day Free Trial')).toBeTruthy();
      });
    });
  });

  describe('Plan Selection', () => {
    it('should handle plan selection', async () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="waveData"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        const professionalPlan = getByTestId('plan-professional');
        fireEvent.press(professionalPlan);
        
        expect(professionalPlan.props.style).toMatchObject(
          expect.objectContaining({ borderColor: expect.any(String) })
        );
      });
    });

    it('should show plan comparison when multiple plans selected', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="weatherAccess"
          showComparison={true}
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('compare-plans-button'));
        expect(getByText('Plan Comparison')).toBeTruthy();
      });
    });

    it('should disable unavailable plans', async () => {
      const plansWithUnavailable = [
        ...mockPlans,
        { 
          ...MockDataFactory.createMockSubscription('elite'),
          available: false,
          unavailableReason: 'Coming Soon'
        }
      ];

      mockSubscriptionService.getAvailablePlans.mockResolvedValue(plansWithUnavailable);

      const { getByTestId, getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="weatherAccess"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        const elitePlan = getByTestId('plan-elite');
        expect(elitePlan.props.accessibilityState.disabled).toBe(true);
        expect(getByText('Coming Soon')).toBeTruthy();
      });
    });
  });

  describe('Purchase Flow', () => {
    it('should handle subscription purchase', async () => {
      const onSubscribe = jest.fn();
      mockSubscriptionService.upgradeSubscription.mockResolvedValue({
        success: true,
        subscriptionId: 'sub_123'
      });

      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          onSubscribe={onSubscribe}
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        // Select professional plan
        fireEvent.press(getByTestId('plan-professional'));
        
        // Purchase
        fireEvent.press(getByTestId('purchase-button'));
      });

      await waitFor(() => {
        expect(mockSubscriptionService.upgradeSubscription).toHaveBeenCalledWith(
          expect.any(String),
          'professional',
          expect.any(Object)
        );
        expect(onSubscribe).toHaveBeenCalledWith('professional');
      });
    });

    it('should handle free trial start', async () => {
      const onTrialStart = jest.fn();
      mockSubscriptionService.startFreeTrial.mockResolvedValue({
        success: true,
        trialId: 'trial_456'
      });

      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="weatherAccess"
          onTrialStart={onTrialStart}
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('start-trial-button'));
      });

      await waitFor(() => {
        expect(mockSubscriptionService.startFreeTrial).toHaveBeenCalled();
        expect(onTrialStart).toHaveBeenCalled();
      });
    });

    it('should show loading state during purchase', async () => {
      mockSubscriptionService.upgradeSubscription.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="waveData"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('plan-basic'));
        fireEvent.press(getByTestId('purchase-button'));
        
        expect(getByTestId('purchase-loading')).toBeTruthy();
      });
    });

    it('should handle purchase errors', async () => {
      mockSubscriptionService.upgradeSubscription.mockRejectedValue(
        new Error('Payment failed')
      );

      const { getByTestId, getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('plan-professional'));
        fireEvent.press(getByTestId('purchase-button'));
      });

      await waitFor(() => {
        expect(getByText('Payment failed')).toBeTruthy();
        expect(getByTestId('retry-purchase-button')).toBeTruthy();
      });
    });
  });

  describe('Feature-Specific Messaging', () => {
    const featureTests = [
      {
        feature: 'weatherAccess',
        expectedTitle: 'Unlock Weather Data',
        expectedDescription: 'Get access to current weather conditions'
      },
      {
        feature: 'detailedForecast',
        expectedTitle: 'Unlock Detailed Weather Forecasts',
        expectedDescription: 'Get 5-day detailed forecasts'
      },
      {
        feature: 'waveData',
        expectedTitle: 'Unlock Marine Weather Data',
        expectedDescription: 'Access wave heights, periods, and directions'
      },
      {
        feature: 'socialFeatures',
        expectedTitle: 'Unlock Social Features',
        expectedDescription: 'Connect with other sailors'
      }
    ] as const;

    featureTests.forEach(({ feature, expectedTitle, expectedDescription }) => {
      it(`should show appropriate messaging for ${feature}`, async () => {
        const { getByText } = renderWithProviders(
          <SubscriptionPaywall 
            feature={feature}
            onDismiss={() => {}}
          />
        );

        await waitFor(() => {
          expect(getByText(expectedTitle)).toBeTruthy();
          expect(getByText(expectedDescription)).toBeTruthy();
        });
      });
    });
  });

  describe('User Segmentation', () => {
    it('should show different messaging for competitive racers', async () => {
      const { getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          userSegment="competitive_racer"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        expect(getByText('Get the competitive edge')).toBeTruthy();
        expect(getByText('Professional weather analysis for serious racing')).toBeTruthy();
      });
    });

    it('should show different messaging for casual sailors', async () => {
      const { getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="weatherAccess"
          userSegment="casual_sailor"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        expect(getByText('Enhance your sailing experience')).toBeTruthy();
        expect(getByText('Get weather insights for better sailing days')).toBeTruthy();
      });
    });
  });

  describe('Cross-Promotion Integration', () => {
    it('should show TacticalWind Pro cross-promotion', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          showCrossPromotion={true}
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        expect(getByText('Also available: TacticalWind Pro')).toBeTruthy();
        expect(getByTestId('tacticalwind-promo')).toBeTruthy();
      });
    });

    it('should handle cross-promotion clicks', async () => {
      const onCrossPromotionClick = jest.fn();
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="weatherAccess"
          showCrossPromotion={true}
          onCrossPromotionClick={onCrossPromotionClick}
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('tacticalwind-promo'));
        expect(onCrossPromotionClick).toHaveBeenCalledWith('tacticalwind_pro');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="waveData"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        const paywall = getByTestId('subscription-paywall');
        expect(paywall.props.accessibilityLabel).toMatch(/subscription.*paywall/i);
        
        const basicPlan = getByTestId('plan-basic');
        expect(basicPlan.props.accessibilityLabel).toMatch(/basic.*plan.*4\.99/i);
      });
    });

    it('should support VoiceOver navigation', async () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        const purchaseButton = getByTestId('purchase-button');
        expect(purchaseButton.props.accessibilityRole).toBe('button');
        expect(purchaseButton.props.accessibilityHint).toMatch(/purchase.*subscription/i);
      });
    });

    it('should announce purchase status changes', async () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="weatherAccess"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('plan-basic'));
        fireEvent.press(getByTestId('purchase-button'));
        
        const purchaseButton = getByTestId('purchase-button');
        expect(purchaseButton.props.accessibilityLabel).toMatch(/processing/i);
      });
    });
  });

  describe('A/B Testing Integration', () => {
    it('should track paywall impressions', async () => {
      const onImpression = jest.fn();
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          variant="variant_b"
          onImpression={onImpression}
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        expect(getByTestId('subscription-paywall')).toBeTruthy();
        expect(onImpression).toHaveBeenCalledWith('variant_b');
      });
    });

    it('should show different designs based on variant', async () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="waveData"
          variant="premium_design"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        const paywall = getByTestId('subscription-paywall');
        expect(paywall.props.style).toMatchObject(
          expect.objectContaining({ backgroundColor: expect.any(String) })
        );
      });
    });
  });

  describe('Animations', () => {
    it('should animate entrance', async () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="socialFeatures"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        const paywall = getByTestId('subscription-paywall');
        expect(paywall.props.style).toMatchObject(
          expect.objectContaining({ transform: expect.any(Array) })
        );
      });
    });

    it('should animate plan selection', async () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        const basicPlan = getByTestId('plan-basic');
        
        act(() => {
          fireEvent.press(basicPlan);
        });

        expect(basicPlan.props.style).toMatchObject(
          expect.objectContaining({ transform: expect.any(Array) })
        );
      });
    });

    it('should animate dismiss', async () => {
      const onDismiss = jest.fn();
      const { getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="weatherAccess"
          onDismiss={onDismiss}
        />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('dismiss-button'));
      });

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle plan loading failures', async () => {
      mockSubscriptionService.getAvailablePlans.mockRejectedValue(
        new Error('Failed to load plans')
      );

      const { getByText, getByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="waveData"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        expect(getByText('Unable to load subscription plans')).toBeTruthy();
        expect(getByTestId('retry-load-plans')).toBeTruthy();
      });
    });

    it('should handle network connectivity issues', async () => {
      mockSubscriptionService.upgradeSubscription.mockRejectedValue(
        new Error('Network error')
      );

      const { getByTestId, getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('plan-professional'));
        fireEvent.press(getByTestId('purchase-button'));
      });

      await waitFor(() => {
        expect(getByText('Check your internet connection and try again')).toBeTruthy();
      });
    });
  });

  describe('Regional Pricing', () => {
    it('should display localized pricing', async () => {
      const regionalPlans = mockPlans.map(plan => ({
        ...plan,
        localizedPrice: plan.tier === 'basic' ? '€4.49' : plan.tier === 'professional' ? '€8.99' : '€17.99',
        currency: 'EUR'
      }));

      mockSubscriptionService.getAvailablePlans.mockResolvedValue(regionalPlans);

      const { getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="weatherAccess"
          region="EU"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        expect(getByText('€4.49')).toBeTruthy();
        expect(getByText('€8.99')).toBeTruthy();
      });
    });

    it('should handle currency conversion', async () => {
      const { getByText } = renderWithProviders(
        <SubscriptionPaywall 
          feature="detailedForecast"
          currency="GBP"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        expect(getByText(/£\d+\.\d+/)).toBeTruthy(); // GBP pricing format
      });
    });
  });

  describe('Performance', () => {
    it('should render quickly with multiple plans', async () => {
      const manyPlans = Array.from({ length: 10 }, (_, i) => 
        MockDataFactory.createMockSubscription('basic')
      );
      
      mockSubscriptionService.getAvailablePlans.mockResolvedValue(manyPlans);

      const startTime = performance.now();
      
      const { getAllByTestId } = renderWithProviders(
        <SubscriptionPaywall 
          feature="waveData"
          onDismiss={() => {}}
        />
      );

      await waitFor(() => {
        const plans = getAllByTestId(/plan-/);
        expect(plans.length).toBeGreaterThan(0);
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});