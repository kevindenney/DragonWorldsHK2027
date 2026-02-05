import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Alert } from 'react-native';
import { subscriptionService, SubscriptionTier, SubscriptionTierId } from './subscriptionService';
import { notificationService } from './notificationService';
import { errorHandler } from './errorHandler';
import { conversionService } from './conversionService';

// Cross-promotion interfaces
export interface TacticalWindUser {
  id: string;
  email: string;
  dragonWorldsUserId: string;
  syncedAt: string;
  tacticalWindSubscription?: {
    tier: 'free' | 'pro' | 'elite';
    active: boolean;
    expiresAt?: string;
  };
}

export interface CrossPromotionTrigger {
  id: string;
  type: 'weather_paywall' | 'results_screen' | 'post_race' | 'subscription_upgrade' | 'feature_usage';
  name: string;
  conditions: {
    minSubscriptionTier?: SubscriptionTierId;
    userSegment?: UserSegment;
    weatherCheckCount?: number;
    raceParticipation?: boolean;
    timeSinceLastPromotion?: number; // hours
  };
  priority: number;
  active: boolean;
}

export interface SpecialOffer {
  id: string;
  name: string;
  type: 'first_month_free' | 'discount_percentage' | 'extended_trial';
  value: number; // percentage or months
  validUntil: string;
  code: string;
  maxRedemptions?: number;
  currentRedemptions: number;
  targetSegment: UserSegment;
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: {
    subscriptionTier?: SubscriptionTierId[];
    weatherCheckFrequency?: 'low' | 'medium' | 'high';
    raceParticipation?: boolean;
    socialEngagement?: 'low' | 'medium' | 'high';
    experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  };
}

export interface CrossPromotionAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
  revenue: number;
  segment: string;
  trigger: string;
}

// Cross-promotion service class
export class CrossPromotionService {
  private tacticalWindUsers: Map<string, TacticalWindUser> = new Map();
  private triggers: Map<string, CrossPromotionTrigger> = new Map();
  private offers: Map<string, SpecialOffer> = new Map();
  private userSegments: Map<string, UserSegment> = new Map();
  private analytics: CrossPromotionAnalytics[] = [];
  private lastPromotionTime: Map<string, number> = new Map();

  // TacticalWind Pro deep linking
  private readonly TACTICALWIND_SCHEME = 'tacticalwind://';
  private readonly TACTICALWIND_WEB_URL = 'https://tacticalwind.app';
  private readonly TACTICALWIND_APP_STORE = 'https://apps.apple.com/app/tacticalwind-pro/id123456789';

  constructor() {
    this.loadCrossPromotionData();
    this.setupDefaultTriggers();
    this.setupDefaultSegments();
    this.setupDefaultOffers();
  }

  // Initialize cross-promotion system
  async initialize(): Promise<void> {
    try {
      await this.loadCrossPromotionData();
      await this.syncUserSegments();
    } catch (error) {
    }
  }

  // User segmentation and targeting
  async segmentUser(userId: string): Promise<UserSegment | null> {
    try {
      const subscription = await subscriptionService.getSubscriptionStatus();
      
      // Get user behavior data (mock implementation - would integrate with analytics)
      const weatherCheckCount = await this.getWeatherCheckCount(userId);
      const raceParticipation = await this.hasRaceParticipation(userId);
      const socialScore = await this.getSocialEngagementScore(userId);
      
      // Determine segments
      const segments = Array.from(this.userSegments.values()).filter(segment => {
        const criteria = segment.criteria;
        
        // Check subscription tier
        if (criteria.subscriptionTier && !criteria.subscriptionTier.includes(subscription.tier)) {
          return false;
        }
        
        // Check weather check frequency
        if (criteria.weatherCheckFrequency) {
          const frequency = this.categorizeWeatherFrequency(weatherCheckCount);
          if (frequency !== criteria.weatherCheckFrequency) {
            return false;
          }
        }
        
        // Check race participation
        if (criteria.raceParticipation !== undefined && criteria.raceParticipation !== raceParticipation) {
          return false;
        }
        
        // Check social engagement
        if (criteria.socialEngagement) {
          const engagement = this.categorizeSocialEngagement(socialScore);
          if (engagement !== criteria.socialEngagement) {
            return false;
          }
        }
        
        return true;
      });
      
      // Return highest priority segment
      return segments.length > 0 ? segments[0] : null;
      
    } catch (error) {
      errorHandler.logError({
        type: 'general',
        severity: 'medium',
        message: `User segmentation failed: ${(error as Error).message}`,
        source: 'cross_promotion_service'
      });
      return null;
    }
  }

  // Smart trigger evaluation
  async evaluateTriggers(context: {
    screen?: string;
    action?: string;
    userId?: string;
  }): Promise<CrossPromotionTrigger | null> {
    try {
      const userId = context.userId;
      if (!userId) return null;

      // Check cooldown period
      const lastPromotion = this.lastPromotionTime.get(userId);
      const cooldownHours = 6; // Minimum 6 hours between promotions
      
      if (lastPromotion && (Date.now() - lastPromotion) < cooldownHours * 60 * 60 * 1000) {
        return null;
      }

      // Get user segment
      const userSegment = await this.segmentUser(userId);
      if (!userSegment) return null;

      // Find matching triggers
      const activeTriggers = Array.from(this.triggers.values())
        .filter(trigger => trigger.active)
        .filter(trigger => this.evaluateTriggerConditions(trigger, userSegment, context))
        .sort((a, b) => b.priority - a.priority);

      return activeTriggers.length > 0 ? activeTriggers[0] : null;

    } catch (error) {
      errorHandler.logError({
        type: 'general',
        severity: 'low',
        message: `Trigger evaluation failed: ${(error as Error).message}`,
        source: 'cross_promotion_service'
      });
      return null;
    }
  }

  // Show cross-promotion based on trigger
  async showCrossPromotion(trigger: CrossPromotionTrigger, userId: string): Promise<boolean> {
    try {
      const userSegment = await this.segmentUser(userId);
      if (!userSegment) return false;

      // Get appropriate offer
      const offer = this.getOfferForSegment(userSegment);
      
      // Track impression
      await this.trackAnalytics('impression', trigger, userSegment, offer);

      // Show promotion based on trigger type
      switch (trigger.type) {
        case 'weather_paywall':
          return await this.showWeatherPaywallPromotion(offer);
        case 'results_screen':
          return await this.showResultsScreenPromotion(offer);
        case 'post_race':
          return await this.showPostRacePromotion(offer);
        case 'subscription_upgrade':
          return await this.showSubscriptionUpgradePromotion(offer);
        default:
          return await this.showGeneralPromotion(offer);
      }

    } catch (error) {
      errorHandler.logError({
        type: 'general',
        severity: 'medium',
        message: `Cross-promotion display failed: ${(error as Error).message}`,
        source: 'cross_promotion_service'
      });
      return false;
    }
  }

  // Specific promotion displays
  private async showWeatherPaywallPromotion(offer?: SpecialOffer): Promise<boolean> {
    const title = '🌊 Advanced Tactical Weather Analysis';
    const message = offer 
      ? `Get TacticalWind Pro with ${offer.name} - Advanced wind analysis, tactical routing, and professional racing insights.`
      : 'Upgrade to TacticalWind Pro for advanced wind analysis, tactical routing, and professional racing insights.';

    return await this.showPromotionAlert(title, message, offer);
  }

  private async showResultsScreenPromotion(offer?: SpecialOffer): Promise<boolean> {
    const title = '📊 Analyze Your Racing Performance';
    const message = offer
      ? `TacticalWind Pro helps analyze your racing performance with ${offer.name}. Get tactical insights to improve your results.`
      : 'TacticalWind Pro helps analyze your racing performance. Get tactical insights to improve your results.';

    return await this.showPromotionAlert(title, message, offer);
  }

  private async showPostRacePromotion(offer?: SpecialOffer): Promise<boolean> {
    const title = '🏆 Improve Your Next Race';
    const message = offer
      ? `Great racing! Analyze your performance with TacticalWind Pro - ${offer.name}. Learn from today's conditions for better results.`
      : 'Great racing! Analyze your performance with TacticalWind Pro. Learn from today\'s conditions for better results.';

    return await this.showPromotionAlert(title, message, offer);
  }

  private async showSubscriptionUpgradePromotion(offer?: SpecialOffer): Promise<boolean> {
    const title = '⛵ Complete Your Sailing Toolkit';
    const message = offer
      ? `Add TacticalWind Pro to your sailing arsenal with ${offer.name}. Professional tactical analysis for serious racers.`
      : 'Add TacticalWind Pro to your sailing arsenal. Professional tactical analysis for serious racers.';

    return await this.showPromotionAlert(title, message, offer);
  }

  private async showGeneralPromotion(offer?: SpecialOffer): Promise<boolean> {
    const title = '🎯 TacticalWind Pro';
    const message = offer
      ? `Elevate your sailing with TacticalWind Pro - ${offer.name}. Advanced wind analysis and racing tactics.`
      : 'Elevate your sailing with TacticalWind Pro. Advanced wind analysis and racing tactics.';

    return await this.showPromotionAlert(title, message, offer);
  }

  private async showPromotionAlert(title: string, message: string, offer?: SpecialOffer): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Maybe Later',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: offer ? `Get ${offer.name}` : 'Learn More',
            onPress: async () => {
              await this.openTacticalWind(offer);
              resolve(true);
            }
          }
        ]
      );
    });
  }

  // Deep linking and app integration
  async openTacticalWind(offer?: SpecialOffer): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Build deep link URL with offer parameters
      let deepLinkUrl = `${this.TACTICALWIND_SCHEME}promo?source=dragonworlds`;
      
      if (offer) {
        deepLinkUrl += `&offer=${offer.code}&type=${offer.type}&value=${offer.value}`;
      }
      
      if (userId) {
        deepLinkUrl += `&userId=${userId}`;
      }

      // Try to open TacticalWind Pro app
      const canOpen = await Linking.canOpenURL(deepLinkUrl);
      
      if (canOpen) {
        await Linking.openURL(deepLinkUrl);
        await this.trackAnalytics('app_open', null, null, offer);
      } else {
        // App not installed, open App Store
        await Linking.openURL(this.TACTICALWIND_APP_STORE);
        await this.trackAnalytics('app_store_open', null, null, offer);
      }

      // Track click
      await this.trackAnalytics('click', null, null, offer);

    } catch (error) {
      errorHandler.logError({
        type: 'general',
        severity: 'medium',
        message: `TacticalWind deep linking failed: ${(error as Error).message}`,
        source: 'cross_promotion_service'
      });

      // Fallback to web URL
      await Linking.openURL(`${this.TACTICALWIND_WEB_URL}?source=dragonworlds`);
    }
  }

  // User account synchronization
  async syncUserAccount(dragonWorldsUserId: string, email: string): Promise<boolean> {
    try {
      // Check if user already synced
      const existingUser = this.tacticalWindUsers.get(dragonWorldsUserId);
      
      const syncData = {
        dragonWorldsUserId,
        email,
        subscription: await subscriptionService.getSubscriptionStatus(),
        syncTimestamp: new Date().toISOString()
      };

      // In production, this would call TacticalWind API
      const response = await this.callTacticalWindAPI('/api/sync-user', {
        method: 'POST',
        body: JSON.stringify(syncData)
      });

      if (response.success) {
        const tacticalWindUser: TacticalWindUser = {
          id: response.tacticalWindUserId,
          email,
          dragonWorldsUserId,
          syncedAt: new Date().toISOString(),
          tacticalWindSubscription: response.subscription
        };

        this.tacticalWindUsers.set(dragonWorldsUserId, tacticalWindUser);
        await this.saveCrossPromotionData();
        
        return true;
      }

      return false;

    } catch (error) {
      errorHandler.logError({
        type: 'api',
        severity: 'medium',
        message: `User sync failed: ${(error as Error).message}`,
        source: 'tacticalwind_sync'
      });
      return false;
    }
  }

  // Analytics and conversion tracking
  private async trackAnalytics(
    event: 'impression' | 'click' | 'conversion' | 'app_open' | 'app_store_open',
    trigger?: CrossPromotionTrigger | null,
    segment?: UserSegment | null,
    offer?: SpecialOffer
  ): Promise<void> {
    try {
      const analyticsEvent = {
        event,
        timestamp: new Date().toISOString(),
        trigger: trigger?.id,
        segment: segment?.id,
        offer: offer?.id,
        userId: await this.getCurrentUserId()
      };

      // Update offer redemption count
      if (event === 'conversion' && offer) {
        offer.currentRedemptions++;
        await this.saveCrossPromotionData();
      }

      // Track in conversion service
      await conversionService.trackEvent({
        type: 'upgrade_prompt',
        context: {
          source: 'tacticalwind_cross_promotion',
          trigger: trigger?.type,
          segment: segment?.id,
          offer: offer?.code
        }
      });


    } catch (error) {
    }
  }

  // Setup default configurations
  private setupDefaultTriggers(): void {
    this.triggers.set('weather_paywall', {
      id: 'weather_paywall',
      type: 'weather_paywall',
      name: 'Weather Paywall Cross-Promotion',
      conditions: {
        minSubscriptionTier: 'free',
        timeSinceLastPromotion: 24
      },
      priority: 10,
      active: true
    });

    this.triggers.set('results_analysis', {
      id: 'results_analysis',
      type: 'results_screen',
      name: 'Results Screen Performance Analysis',
      conditions: {
        raceParticipation: true,
        timeSinceLastPromotion: 48
      },
      priority: 8,
      active: true
    });

    this.triggers.set('post_race_tactical', {
      id: 'post_race_tactical',
      type: 'post_race',
      name: 'Post-Race Tactical Analysis',
      conditions: {
        raceParticipation: true,
        minSubscriptionTier: 'basic',
        timeSinceLastPromotion: 72
      },
      priority: 9,
      active: true
    });
  }

  private setupDefaultSegments(): void {
    this.userSegments.set('competitive_racer', {
      id: 'competitive_racer',
      name: 'Competitive Racer',
      criteria: {
        raceParticipation: true,
        weatherCheckFrequency: 'high',
        experienceLevel: 'expert'
      }
    });

    this.userSegments.set('casual_sailor', {
      id: 'casual_sailor',
      name: 'Casual Sailor',
      criteria: {
        weatherCheckFrequency: 'medium',
        socialEngagement: 'high',
        experienceLevel: 'intermediate'
      }
    });

    this.userSegments.set('weather_focused', {
      id: 'weather_focused',
      name: 'Weather Focused',
      criteria: {
        weatherCheckFrequency: 'high',
        subscriptionTier: ['professional', 'elite']
      }
    });
  }

  private setupDefaultOffers(): void {
    this.offers.set('dragon_worlds_special', {
      id: 'dragon_worlds_special',
      name: 'First Month Free',
      type: 'first_month_free',
      value: 1,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      code: 'DRAGONWORLDS2027',
      maxRedemptions: 500,
      currentRedemptions: 0,
      targetSegment: this.userSegments.get('competitive_racer')!
    });

    this.offers.set('sailing_discount', {
      id: 'sailing_discount',
      name: '20% Off Annual',
      type: 'discount_percentage',
      value: 20,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      code: 'SAILING20',
      currentRedemptions: 0,
      targetSegment: this.userSegments.get('weather_focused')!
    });
  }

  // Helper methods
  private evaluateTriggerConditions(
    trigger: CrossPromotionTrigger,
    segment: UserSegment,
    context: any
  ): boolean {
    // Implement trigger condition evaluation logic
    return true; // Simplified for now
  }

  private getOfferForSegment(segment: UserSegment): SpecialOffer | undefined {
    return Array.from(this.offers.values()).find(offer => 
      offer.targetSegment.id === segment.id && 
      new Date(offer.validUntil) > new Date()
    );
  }

  private async getWeatherCheckCount(userId: string): Promise<number> {
    // Mock implementation - would integrate with analytics
    return Math.floor(Math.random() * 20) + 5;
  }

  private async hasRaceParticipation(userId: string): Promise<boolean> {
    // Mock implementation - would check with results store
    return Math.random() > 0.3;
  }

  private async getSocialEngagementScore(userId: string): Promise<number> {
    // Mock implementation - would integrate with social store
    return Math.floor(Math.random() * 10) + 1;
  }

  private categorizeWeatherFrequency(count: number): 'low' | 'medium' | 'high' {
    if (count < 5) return 'low';
    if (count < 15) return 'medium';
    return 'high';
  }

  private categorizeSocialEngagement(score: number): 'low' | 'medium' | 'high' {
    if (score < 3) return 'low';
    if (score < 7) return 'medium';
    return 'high';
  }

  private async getCurrentUserId(): Promise<string | null> {
    // Would integrate with user store
    return 'user_123';
  }

  private async callTacticalWindAPI(endpoint: string, options: any): Promise<any> {
    // Mock API call - would implement actual TacticalWind API integration
    return { success: true, tacticalWindUserId: 'tw_user_123' };
  }

  // Storage management
  private async loadCrossPromotionData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('cross_promotion_data');
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed.tacticalWindUsers) {
          this.tacticalWindUsers = new Map(Object.entries(parsed.tacticalWindUsers));
        }
        
        if (parsed.lastPromotionTime) {
          this.lastPromotionTime = new Map(Object.entries(parsed.lastPromotionTime));
        }
      }
    } catch (error) {
    }
  }

  private async saveCrossPromotionData(): Promise<void> {
    try {
      const data = {
        tacticalWindUsers: Object.fromEntries(this.tacticalWindUsers),
        lastPromotionTime: Object.fromEntries(this.lastPromotionTime)
      };
      
      await AsyncStorage.setItem('cross_promotion_data', JSON.stringify(data));
    } catch (error) {
    }
  }

  private async syncUserSegments(): Promise<void> {
    // Refresh user segments based on current behavior
  }

  // Public utility methods
  async getAnalytics(days: number = 30): Promise<CrossPromotionAnalytics[]> {
    // Return analytics for the specified period
    return this.analytics.slice(0, days);
  }

  clearPromotionCooldown(userId: string): void {
    this.lastPromotionTime.delete(userId);
  }

  getActiveOffers(): SpecialOffer[] {
    return Array.from(this.offers.values()).filter(offer => 
      new Date(offer.validUntil) > new Date()
    );
  }
}

// Export singleton instance
export const crossPromotionService = new CrossPromotionService();