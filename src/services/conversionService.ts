import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService, SubscriptionTier, SubscriptionTierId } from './subscriptionService';
import { notificationService } from './notificationService';
import { errorHandler } from './errorHandler';

// Conversion tracking interfaces
export interface ConversionEvent {
  id: string;
  type: 'trial_start' | 'feature_blocked' | 'upgrade_prompt' | 'subscription_purchase' | 'conversion_complete';
  userId?: string;
  timestamp: string;
  context: {
    source: string; // Where the conversion event originated
    feature?: string; // Feature that triggered the event
    subscriptionTier?: SubscriptionTierId;
    value?: number; // Purchase value
    paywallId?: string; // Paywall that triggered the event
    trigger?: string; // Trigger type for cross-promotion
    segment?: string; // User segment ID
    offer?: string; // Offer code
  };
  metadata?: Record<string, any>;
}

export interface ConversionFunnel {
  trialStarts: number;
  featureBlocks: number;
  upgradePrompts: number;
  subscriptionPurchases: number;
  conversions: number;
  conversionRate: number;
  averageValue: number;
}

export interface PaywallConfig {
  id: string;
  name: string;
  trigger: 'feature_limit' | 'query_limit' | 'weather_alert' | 'premium_data';
  title: string;
  subtitle: string;
  features: string[];
  primaryAction: string;
  secondaryAction?: string;
  urgency?: {
    enabled: boolean;
    message: string;
    countdown?: number; // seconds
  };
  discount?: {
    percentage: number;
    validUntil: string;
    code?: string;
  };
}

export interface ConversionMetrics {
  totalTrials: number;
  activeTrials: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  timeToConversion: number; // average days
}

// Conversion service for freemium model optimization
export class ConversionService {
  private conversionEvents: ConversionEvent[] = [];
  private maxEventHistory = 500;
  private paywallConfigs: Map<string, PaywallConfig> = new Map();

  constructor() {
    this.loadConversionData();
    this.setupDefaultPaywalls();
  }

  // Initialize conversion tracking
  async initialize(): Promise<void> {
    try {
      await this.loadConversionData();
    } catch (error) {
    }
  }

  // Track conversion events
  async trackEvent(event: Omit<ConversionEvent, 'id' | 'timestamp'>): Promise<void> {
    const conversionEvent: ConversionEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      ...event
    };

    this.conversionEvents.unshift(conversionEvent);
    
    // Maintain event history size
    if (this.conversionEvents.length > this.maxEventHistory) {
      this.conversionEvents = this.conversionEvents.slice(0, this.maxEventHistory);
    }

    await this.saveConversionData();
    this.processConversionEvent(conversionEvent);
  }

  // Process conversion events for automation
  private processConversionEvent(event: ConversionEvent): void {
    switch (event.type) {
      case 'trial_start':
        this.onTrialStart(event);
        break;
      case 'feature_blocked':
        this.onFeatureBlocked(event);
        break;
      case 'upgrade_prompt':
        this.onUpgradePrompt(event);
        break;
      case 'subscription_purchase':
        this.onSubscriptionPurchase(event);
        break;
    }
  }

  private async onTrialStart(event: ConversionEvent): Promise<void> {
    // Schedule trial ending notifications
    await notificationService.monitorSubscriptionStatus({
      isActive: true,
      isTrial: true,
      daysRemaining: 7
    });

    // Track trial start for analytics
  }

  private async onFeatureBlocked(event: ConversionEvent): Promise<void> {
    // Show appropriate paywall based on feature
    const paywall = this.selectPaywallForFeature(event.context.feature || '');
    if (paywall) {
      await this.showPaywall(paywall.id, event.context);
    }
  }

  private async onUpgradePrompt(event: ConversionEvent): Promise<void> {
    // Track upgrade prompt effectiveness
    const recentPrompts = this.getRecentEventsByType('upgrade_prompt', 24); // Last 24 hours
    
    // Don't oversaturate with prompts
    if (recentPrompts.length >= 3) {
      return;
    }
  }

  private async onSubscriptionPurchase(event: ConversionEvent): Promise<void> {
    // Send TacticalWind Pro cross-promotion
    if (event.context.subscriptionTier === 'basic') {
      setTimeout(() => {
        notificationService.sendTacticalWindPromotion();
      }, 24 * 60 * 60 * 1000); // 24 hours after purchase
    }
    
    // Track successful conversion
    await this.trackEvent({
      type: 'conversion_complete',
      userId: event.userId,
      context: {
        source: 'subscription_purchase',
        subscriptionTier: event.context.subscriptionTier,
        value: event.context.value
      }
    });
  }

  // Paywall management
  private setupDefaultPaywalls(): void {
    // Weather data paywall
    this.paywallConfigs.set('weather_premium', {
      id: 'weather_premium',
      name: 'Premium Weather Access',
      trigger: 'premium_data',
      title: 'Unlock Professional Weather Data',
      subtitle: 'Get access to PredictWind marine forecasts, detailed wave analysis, and racing-specific conditions.',
      features: [
        'Professional marine forecasts from PredictWind',
        'Detailed wave height and period data',
        'Wind gust predictions for tactical decisions',
        'Racing area micro-weather conditions',
        'Unlimited weather queries'
      ],
      primaryAction: 'Upgrade to Professional',
      secondaryAction: 'Start Free Trial'
    });

    // Query limit paywall
    this.paywallConfigs.set('query_limit', {
      id: 'query_limit',
      name: 'Weather Query Limit',
      trigger: 'query_limit',
      title: 'Weather Query Limit Reached',
      subtitle: 'You\'ve reached your daily weather query limit. Upgrade for unlimited access.',
      features: [
        'Unlimited weather queries',
        'Real-time weather updates',
        'Advanced marine conditions',
        'Racing-specific forecasts'
      ],
      primaryAction: 'Upgrade Now',
      urgency: {
        enabled: true,
        message: 'Don\'t miss critical weather updates during racing!'
      }
    });

    // Weather alerts paywall
    this.paywallConfigs.set('weather_alerts', {
      id: 'weather_alerts',
      name: 'Weather Alert Access',
      trigger: 'weather_alert',
      title: 'Stay Safe with Weather Alerts',
      subtitle: 'Get instant notifications for dangerous conditions and racing weather changes.',
      features: [
        'Critical weather condition alerts',
        'Wind shift notifications',
        'Race safety warnings',
        'Customizable alert thresholds'
      ],
      primaryAction: 'Enable Weather Alerts',
      secondaryAction: 'Maybe Later'
    });

    // Championship special offer
    this.paywallConfigs.set('championship_offer', {
      id: 'championship_offer',
      name: 'Dragon Worlds Special',
      trigger: 'feature_limit',
      title: 'Dragon World Championships Special Offer',
      subtitle: 'Get professional weather analysis for the entire championship at a special rate.',
      features: [
        'Complete championship weather coverage',
        'Professional marine forecasting',
        'Racing tactical weather insights',
        'Exclusive Dragon Worlds data'
      ],
      primaryAction: 'Get Championship Access',
      discount: {
        percentage: 30,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        code: 'DRAGONWORLDS2027'
      }
    });
  }

  private selectPaywallForFeature(feature: string): PaywallConfig | null {
    const featurePaywallMap: Record<string, string> = {
      'marine_forecast': 'weather_premium',
      'wave_data': 'weather_premium',
      'wind_analysis': 'weather_premium',
      'weather_alerts': 'weather_alerts',
      'unlimited_queries': 'query_limit',
      'premium_data': 'weather_premium'
    };

    const paywallId = featurePaywallMap[feature];
    return paywallId ? this.paywallConfigs.get(paywallId) || null : null;
  }

  async showPaywall(paywallId: string, context: Record<string, any>): Promise<void> {
    const paywall = this.paywallConfigs.get(paywallId);
    if (!paywall) return;

    // Track paywall impression
    await this.trackEvent({
      type: 'upgrade_prompt',
      context: {
        source: 'paywall',
        feature: context.feature,
        paywallId
      }
    });

    // In a real implementation, this would show the paywall UI
  }

  // Conversion optimization
  async optimizeConversionFlow(userId?: string): Promise<PaywallConfig | null> {
    try {
      const subscription = await subscriptionService.getSubscriptionStatus();
      const userEvents = userId ? this.getUserEvents(userId) : this.conversionEvents.slice(0, 50);

      // Don't show paywalls to active subscribers
      if (subscription?.active && !subscription?.isTrial) {
        return null;
      }

      // Analyze user behavior to select best paywall
      const featureBlocks = userEvents.filter(e => e.type === 'feature_blocked');
      const mostBlockedFeature = this.getMostFrequentFeature(featureBlocks);

      if (mostBlockedFeature) {
        const paywall = this.selectPaywallForFeature(mostBlockedFeature);
        if (paywall) {
          return paywall;
        }
      }

      // Default to championship offer during event period
      if (this.isDuringChampionship()) {
        return this.paywallConfigs.get('championship_offer') || null;
      }

      // Fallback to premium weather paywall
      return this.paywallConfigs.get('weather_premium') || null;

    } catch (error) {
      errorHandler.logError({
        type: 'general',
        severity: 'medium',
        message: `Conversion optimization failed: ${(error as Error).message}`,
        source: 'conversion_service'
      });
      return null;
    }
  }

  // Analytics and metrics
  getConversionFunnel(days: number = 30): ConversionFunnel {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentEvents = this.conversionEvents.filter(
      e => new Date(e.timestamp) >= cutoff
    );

    const trialStarts = recentEvents.filter(e => e.type === 'trial_start').length;
    const featureBlocks = recentEvents.filter(e => e.type === 'feature_blocked').length;
    const upgradePrompts = recentEvents.filter(e => e.type === 'upgrade_prompt').length;
    const purchases = recentEvents.filter(e => e.type === 'subscription_purchase').length;
    const conversions = recentEvents.filter(e => e.type === 'conversion_complete').length;

    const conversionRate = trialStarts > 0 ? (conversions / trialStarts) * 100 : 0;
    const purchaseEvents = recentEvents.filter(e => e.type === 'subscription_purchase' && e.context.value);
    const averageValue = purchaseEvents.length > 0 
      ? purchaseEvents.reduce((sum, e) => sum + (e.context.value || 0), 0) / purchaseEvents.length 
      : 0;

    return {
      trialStarts,
      featureBlocks,
      upgradePrompts,
      subscriptionPurchases: purchases,
      conversions,
      conversionRate,
      averageValue
    };
  }

  getConversionMetrics(): ConversionMetrics {
    const funnel = this.getConversionFunnel(30);
    const allTimeEvents = this.conversionEvents;
    
    const totalTrials = allTimeEvents.filter(e => e.type === 'trial_start').length;
    const totalConversions = allTimeEvents.filter(e => e.type === 'conversion_complete').length;
    const totalRevenue = allTimeEvents
      .filter(e => e.type === 'subscription_purchase' && e.context.value)
      .reduce((sum, e) => sum + (e.context.value || 0), 0);

    return {
      totalTrials,
      activeTrials: 0, // Would need integration with subscription service
      conversions: totalConversions,
      conversionRate: totalTrials > 0 ? (totalConversions / totalTrials) * 100 : 0,
      revenue: totalRevenue,
      averageRevenuePerUser: totalConversions > 0 ? totalRevenue / totalConversions : 0,
      churnRate: 0, // Would need subscription cancellation data
      timeToConversion: this.getAverageTimeToConversion()
    };
  }

  // Helper methods
  private getUserEvents(userId: string): ConversionEvent[] {
    return this.conversionEvents.filter(e => e.userId === userId);
  }

  private getRecentEventsByType(type: ConversionEvent['type'], hours: number): ConversionEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.conversionEvents.filter(
      e => e.type === type && new Date(e.timestamp) >= cutoff
    );
  }

  private getMostFrequentFeature(events: ConversionEvent[]): string | null {
    const featureCounts: Record<string, number> = {};
    
    events.forEach(event => {
      const feature = event.context.feature;
      if (feature) {
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      }
    });

    const features = Object.entries(featureCounts);
    if (features.length === 0) return null;
    
    features.sort((a, b) => b[1] - a[1]);
    return features[0][0];
  }

  private isDuringChampionship(): boolean {
    // Dragon Worlds 2027 dates (example)
    const championshipStart = new Date('2027-03-15');
    const championshipEnd = new Date('2027-03-22');
    const now = new Date();
    
    return now >= championshipStart && now <= championshipEnd;
  }

  private getAverageTimeToConversion(): number {
    const conversions = this.conversionEvents.filter(e => e.type === 'conversion_complete');
    if (conversions.length === 0) return 0;

    let totalDays = 0;
    let validConversions = 0;

    conversions.forEach(conversion => {
      const userId = conversion.userId;
      if (!userId) return;

      const trialStart = this.conversionEvents.find(
        e => e.type === 'trial_start' && e.userId === userId
      );

      if (trialStart) {
        const days = (new Date(conversion.timestamp).getTime() - new Date(trialStart.timestamp).getTime()) 
          / (1000 * 60 * 60 * 24);
        totalDays += days;
        validConversions++;
      }
    });

    return validConversions > 0 ? totalDays / validConversions : 0;
  }

  // Storage management
  private async loadConversionData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('conversion_events');
      if (stored) {
        this.conversionEvents = JSON.parse(stored);
      }
    } catch (error) {
    }
  }

  private async saveConversionData(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'conversion_events', 
        JSON.stringify(this.conversionEvents.slice(0, this.maxEventHistory))
      );
    } catch (error) {
    }
  }

  private generateEventId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public utility methods
  clearConversionData(): void {
    this.conversionEvents = [];
    AsyncStorage.removeItem('conversion_events');
  }

  getPaywallConfig(id: string): PaywallConfig | null {
    return this.paywallConfigs.get(id) || null;
  }

  getAllPaywalls(): PaywallConfig[] {
    return Array.from(this.paywallConfigs.values());
  }
}

// Export singleton instance
export const conversionService = new ConversionService();