import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService, SubscriptionTier, SubscriptionTierId } from './subscriptionService';
import { errorHandler } from './errorHandler';

// Analytics interfaces
export interface UserEngagementMetric {
  userId: string;
  timestamp: string;
  event: string;
  screen?: string;
  action?: string;
  properties?: Record<string, any>;
  sessionId: string;
  duration?: number; // milliseconds
}

export interface ConversionFunnelStep {
  step: 'app_open' | 'weather_check' | 'paywall_view' | 'trial_start' | 'subscription_purchase' | 'cross_sell';
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface FeatureUsageMetric {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  averageSessionTime: number;
  subscriptionTierBreakdown: Record<SubscriptionTierId, number>;
  popularScreens: string[];
  timeDistribution: {
    morning: number; // 6-12
    afternoon: number; // 12-18
    evening: number; // 18-24
    night: number; // 0-6
  };
}

export interface WeatherCheckPattern {
  userId: string;
  frequency: 'low' | 'medium' | 'high';
  averageDaily: number;
  peakHours: number[];
  weatherTypes: {
    current: number;
    forecast: number;
    marine: number;
    alerts: number;
  };
  subscriptionInfluence: {
    beforeUpgrade: number;
    afterUpgrade: number;
  };
}

export interface SocialInteractionMetric {
  type: 'connection_request' | 'connection_accept' | 'group_join' | 'discussion_post' | 'activity_like';
  count: number;
  uniqueUsers: number;
  engagementScore: number;
  networkGrowth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface SponsorROIMetric {
  sponsorId: string;
  sponsorName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
  revenueAttribution: number;
  brandAwareness: {
    logoViews: number;
    serviceClicks: number;
    contactInteractions: number;
  };
  audienceReach: {
    totalUsers: number;
    uniqueUsers: number;
    demographics: {
      subscriptionTiers: Record<SubscriptionTierId, number>;
      engagementLevels: Record<string, number>;
    };
  };
}

export interface RevenueMetric {
  subscriptionRevenue: {
    monthly: number;
    annual: number;
    byTier: Record<SubscriptionTierId, number>;
  };
  crossSellRevenue: {
    tacticalWind: number;
    otherProducts: number;
  };
  sponsorRevenue: {
    total: number;
    bySponsor: Record<string, number>;
  };
  projectedRevenue: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
}

export interface BusinessIntelligenceReport {
  period: {
    start: string;
    end: string;
  };
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    retainedUsers: number;
    averageSessionTime: number;
  };
  conversionFunnel: ConversionFunnelStep[];
  featureUsage: FeatureUsageMetric[];
  weatherPatterns: WeatherCheckPattern[];
  socialMetrics: SocialInteractionMetric[];
  sponsorROI: SponsorROIMetric[];
  revenue: RevenueMetric;
  keyInsights: string[];
  recommendations: string[];
}

// Analytics service class
export class AnalyticsService {
  private engagementMetrics: UserEngagementMetric[] = [];
  private maxMetricsStorage = 10000;
  private currentSessionId: string = '';
  private sessionStartTime: number = 0;
  private featureUsageCache: Map<string, FeatureUsageMetric> = new Map();
  private sponsorMetricsCache: Map<string, SponsorROIMetric> = new Map();

  constructor() {
    this.loadAnalyticsData();
    this.initializeSession();
  }

  // Initialize analytics service
  async initialize(): Promise<void> {
    try {
      await this.loadAnalyticsData();
      this.initializeSession();
    } catch (error) {
    }
  }

  // Session management
  private initializeSession(): void {
    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    this.trackEvent('app_session_start', {
      timestamp: new Date().toISOString()
    });
  }

  endSession(): void {
    if (this.currentSessionId) {
      const sessionDuration = Date.now() - this.sessionStartTime;
      
      this.trackEvent('app_session_end', {
        duration: sessionDuration,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Core tracking methods
  async trackEvent(
    event: string,
    properties?: Record<string, any>,
    screen?: string,
    action?: string
  ): Promise<void> {
    try {
      const metric: UserEngagementMetric = {
        userId: await this.getCurrentUserId(),
        timestamp: new Date().toISOString(),
        event,
        screen,
        action,
        properties,
        sessionId: this.currentSessionId
      };

      this.engagementMetrics.unshift(metric);
      
      // Maintain storage limits
      if (this.engagementMetrics.length > this.maxMetricsStorage) {
        this.engagementMetrics = this.engagementMetrics.slice(0, this.maxMetricsStorage);
      }

      await this.saveAnalyticsData();
      
      // Update real-time caches
      this.updateFeatureUsageCache(event, screen, properties);
      this.updateSponsorMetrics(event, properties);

    } catch (error) {
    }
  }

  // Screen tracking
  async trackScreen(screenName: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent('screen_view', {
      ...properties,
      screen_name: screenName,
      view_timestamp: new Date().toISOString()
    }, screenName);
  }

  // User engagement analysis
  async trackUserAction(
    action: string,
    feature: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent('user_action', {
      ...properties,
      feature,
      action_type: action
    }, undefined, action);
  }

  // Weather check patterns
  async trackWeatherCheck(
    checkType: 'current' | 'forecast' | 'marine' | 'alerts',
    location?: string,
    subscriptionTier?: SubscriptionTier
  ): Promise<void> {
    await this.trackEvent('weather_check', {
      check_type: checkType,
      location,
      subscription_tier: subscriptionTier,
      hour_of_day: new Date().getHours()
    }, 'weather');
  }

  // Social interaction tracking
  async trackSocialInteraction(
    interactionType: 'connection_request' | 'connection_accept' | 'group_join' | 'discussion_post' | 'activity_like',
    targetUserId?: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent('social_interaction', {
      ...properties,
      interaction_type: interactionType,
      target_user: targetUserId
    }, 'social');
  }

  // Sponsor interaction tracking
  async trackSponsorInteraction(
    sponsorId: string,
    interactionType: 'impression' | 'click' | 'service_click' | 'contact',
    location: 'header' | 'sidebar' | 'footer' | 'modal' | 'services',
    properties?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent('sponsor_interaction', {
      ...properties,
      sponsor_id: sponsorId,
      interaction_type: interactionType,
      interaction_location: location
    }, 'sponsor');
  }

  // Conversion funnel analysis
  generateConversionFunnel(days: number = 30): ConversionFunnelStep[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentMetrics = this.engagementMetrics.filter(
      m => new Date(m.timestamp) >= cutoffDate
    );

    const steps: ConversionFunnelStep[] = [
      { step: 'app_open', count: 0, conversionRate: 100, dropOffRate: 0 },
      { step: 'weather_check', count: 0, conversionRate: 0, dropOffRate: 0 },
      { step: 'paywall_view', count: 0, conversionRate: 0, dropOffRate: 0 },
      { step: 'trial_start', count: 0, conversionRate: 0, dropOffRate: 0 },
      { step: 'subscription_purchase', count: 0, conversionRate: 0, dropOffRate: 0 },
      { step: 'cross_sell', count: 0, conversionRate: 0, dropOffRate: 0 }
    ];

    // Count unique users at each step
    const uniqueUsers = new Set<string>();
    const stepUsers: Record<string, Set<string>> = {
      app_open: new Set(),
      weather_check: new Set(),
      paywall_view: new Set(),
      trial_start: new Set(),
      subscription_purchase: new Set(),
      cross_sell: new Set()
    };

    recentMetrics.forEach(metric => {
      uniqueUsers.add(metric.userId);
      
      // Map events to funnel steps
      switch (metric.event) {
        case 'app_session_start':
          stepUsers.app_open.add(metric.userId);
          break;
        case 'weather_check':
          stepUsers.weather_check.add(metric.userId);
          break;
        case 'upgrade_prompt':
          stepUsers.paywall_view.add(metric.userId);
          break;
        case 'trial_start':
          stepUsers.trial_start.add(metric.userId);
          break;
        case 'subscription_purchase':
          stepUsers.subscription_purchase.add(metric.userId);
          break;
        case 'cross_promotion_click':
          stepUsers.cross_sell.add(metric.userId);
          break;
      }
    });

    // Calculate conversion rates
    let previousStepCount = stepUsers.app_open.size;
    
    steps.forEach((step, index) => {
      const currentStepCount = stepUsers[step.step].size;
      step.count = currentStepCount;
      
      if (index === 0) {
        step.conversionRate = 100;
      } else {
        step.conversionRate = previousStepCount > 0 
          ? (currentStepCount / previousStepCount) * 100 
          : 0;
      }
      
      step.dropOffRate = 100 - step.conversionRate;
      previousStepCount = currentStepCount;
    });

    return steps;
  }

  // Feature usage analysis
  generateFeatureUsageReport(days: number = 30): FeatureUsageMetric[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentMetrics = this.engagementMetrics.filter(
      m => new Date(m.timestamp) >= cutoffDate
    );

    const featureMetrics: Map<string, FeatureUsageMetric> = new Map();

    recentMetrics.forEach(metric => {
      const feature = metric.properties?.feature || metric.screen || metric.event;
      if (!feature) return;

      let featureMetric = featureMetrics.get(feature);
      if (!featureMetric) {
        featureMetric = {
          feature,
          usageCount: 0,
          uniqueUsers: 0,
          averageSessionTime: 0,
          subscriptionTierBreakdown: {
            free: 0,
            basic: 0,
            professional: 0,
            elite: 0
          },
          popularScreens: [],
          timeDistribution: { morning: 0, afternoon: 0, evening: 0, night: 0 }
        };
        featureMetrics.set(feature, featureMetric);
      }

      featureMetric.usageCount++;
      
      const hour = new Date(metric.timestamp).getHours();
      if (hour >= 6 && hour < 12) featureMetric.timeDistribution.morning++;
      else if (hour >= 12 && hour < 18) featureMetric.timeDistribution.afternoon++;
      else if (hour >= 18 && hour < 24) featureMetric.timeDistribution.evening++;
      else featureMetric.timeDistribution.night++;

      // Track subscription tier usage
      const tier = metric.properties?.subscription_tier as SubscriptionTierId | undefined;
      if (tier && featureMetric.subscriptionTierBreakdown[tier] !== undefined) {
        featureMetric.subscriptionTierBreakdown[tier]++;
      }
    });

    return Array.from(featureMetrics.values())
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  // Weather pattern analysis
  analyzeWeatherCheckPatterns(days: number = 30): WeatherCheckPattern[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const weatherChecks = this.engagementMetrics.filter(
      m => m.event === 'weather_check' && new Date(m.timestamp) >= cutoffDate
    );

    const userPatterns: Map<string, WeatherCheckPattern> = new Map();

    weatherChecks.forEach(metric => {
      const userId = metric.userId;
      let pattern = userPatterns.get(userId);
      
      if (!pattern) {
        pattern = {
          userId,
          frequency: 'low',
          averageDaily: 0,
          peakHours: [],
          weatherTypes: { current: 0, forecast: 0, marine: 0, alerts: 0 },
          subscriptionInfluence: { beforeUpgrade: 0, afterUpgrade: 0 }
        };
        userPatterns.set(userId, pattern);
      }

      // Count by weather type
      const checkType = metric.properties?.check_type;
      if (checkType && pattern.weatherTypes[checkType as keyof typeof pattern.weatherTypes] !== undefined) {
        pattern.weatherTypes[checkType as keyof typeof pattern.weatherTypes]++;
      }
    });

    // Calculate frequencies and patterns
    userPatterns.forEach(pattern => {
      const userChecks = weatherChecks.filter(m => m.userId === pattern.userId);
      const totalChecks = userChecks.length;
      
      pattern.averageDaily = totalChecks / days;
      pattern.frequency = totalChecks < 5 ? 'low' : totalChecks < 15 ? 'medium' : 'high';
      
      // Find peak hours
      const hourCounts: number[] = new Array(24).fill(0);
      userChecks.forEach(check => {
        const hour = new Date(check.timestamp).getHours();
        hourCounts[hour]++;
      });
      
      pattern.peakHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(item => item.hour);
    });

    return Array.from(userPatterns.values());
  }

  // Sponsor ROI calculation
  calculateSponsorROI(days: number = 30): SponsorROIMetric[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sponsorMetrics = this.engagementMetrics.filter(
      m => m.event === 'sponsor_interaction' && new Date(m.timestamp) >= cutoffDate
    );

    const sponsorROI: Map<string, SponsorROIMetric> = new Map();

    sponsorMetrics.forEach(metric => {
      const sponsorId = metric.properties?.sponsor_id;
      if (!sponsorId) return;

      let roi = sponsorROI.get(sponsorId);
      if (!roi) {
        roi = {
          sponsorId,
          sponsorName: this.getSponsorName(sponsorId),
          impressions: 0,
          clicks: 0,
          conversions: 0,
          clickThroughRate: 0,
          conversionRate: 0,
          revenueAttribution: 0,
          brandAwareness: { logoViews: 0, serviceClicks: 0, contactInteractions: 0 },
          audienceReach: {
            totalUsers: 0,
            uniqueUsers: 0,
            demographics: {
              subscriptionTiers: {
                free: 0,
                basic: 0,
                professional: 0,
                elite: 0
              },
              engagementLevels: {}
            }
          }
        };
        sponsorROI.set(sponsorId, roi);
      }

      const interactionType = metric.properties?.interaction_type;
      switch (interactionType) {
        case 'impression':
          roi.impressions++;
          roi.brandAwareness.logoViews++;
          break;
        case 'click':
          roi.clicks++;
          break;
        case 'service_click':
          roi.brandAwareness.serviceClicks++;
          break;
        case 'contact':
          roi.brandAwareness.contactInteractions++;
          roi.conversions++;
          break;
      }
    });

    // Calculate rates and final metrics
    sponsorROI.forEach(roi => {
      roi.clickThroughRate = roi.impressions > 0 ? (roi.clicks / roi.impressions) * 100 : 0;
      roi.conversionRate = roi.clicks > 0 ? (roi.conversions / roi.clicks) * 100 : 0;
      
      // Mock revenue attribution (would be calculated based on actual sponsor contracts)
      roi.revenueAttribution = roi.conversions * 100; // $100 per conversion
    });

    return Array.from(sponsorROI.values())
      .sort((a, b) => b.revenueAttribution - a.revenueAttribution);
  }

  // Business intelligence report generation
  async generateBusinessIntelligenceReport(days: number = 30): Promise<BusinessIntelligenceReport> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const userEngagement = await this.calculateUserEngagement(days);
    const conversionFunnel = this.generateConversionFunnel(days);
    const featureUsage = this.generateFeatureUsageReport(days);
    const weatherPatterns = this.analyzeWeatherCheckPatterns(days);
    const socialMetrics = await this.calculateSocialMetrics(days);
    const sponsorROI = this.calculateSponsorROI(days);
    const revenue = await this.calculateRevenue(days);

    const keyInsights = this.generateKeyInsights({
      userEngagement,
      conversionFunnel,
      featureUsage,
      sponsorROI,
      revenue
    });

    const recommendations = this.generateRecommendations({
      userEngagement,
      conversionFunnel,
      featureUsage,
      weatherPatterns
    });

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      userEngagement,
      conversionFunnel,
      featureUsage,
      weatherPatterns,
      socialMetrics,
      sponsorROI,
      revenue,
      keyInsights,
      recommendations
    };
  }

  // Helper methods for report generation
  private async calculateUserEngagement(days: number): Promise<BusinessIntelligenceReport['userEngagement']> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentMetrics = this.engagementMetrics.filter(
      m => new Date(m.timestamp) >= cutoffDate
    );

    const uniqueUsers = new Set(recentMetrics.map(m => m.userId));
    const sessionMetrics = recentMetrics.filter(m => m.event === 'app_session_start');
    
    const totalSessionTime = recentMetrics
      .filter(m => m.event === 'app_session_end' && m.properties?.duration)
      .reduce((total, m) => total + (m.properties!.duration || 0), 0);

    return {
      totalUsers: uniqueUsers.size,
      activeUsers: uniqueUsers.size, // Simplified - would need more sophisticated DAU calculation
      newUsers: Math.floor(uniqueUsers.size * 0.2), // Mock - would track actual new user registrations
      retainedUsers: Math.floor(uniqueUsers.size * 0.7), // Mock - would calculate actual retention
      averageSessionTime: sessionMetrics.length > 0 ? totalSessionTime / sessionMetrics.length : 0
    };
  }

  private async calculateSocialMetrics(days: number): Promise<SocialInteractionMetric[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const socialMetrics = this.engagementMetrics.filter(
      m => m.event === 'social_interaction' && new Date(m.timestamp) >= cutoffDate
    );

    const metrics: Map<string, SocialInteractionMetric> = new Map();

    socialMetrics.forEach(metric => {
      const type = metric.properties?.interaction_type as SocialInteractionMetric['type'];
      if (!type) return;

      let socialMetric = metrics.get(type);
      if (!socialMetric) {
        socialMetric = {
          type,
          count: 0,
          uniqueUsers: 0,
          engagementScore: 0,
          networkGrowth: { daily: 0, weekly: 0, monthly: 0 }
        };
        metrics.set(type, socialMetric);
      }

      socialMetric.count++;
    });

    return Array.from(metrics.values());
  }

  private async calculateRevenue(days: number): Promise<RevenueMetric> {
    // This would integrate with actual subscription service and sponsor contracts
    // For now, returning mock data based on analytics patterns
    
    const subscriptionMetrics = await subscriptionService.getMetrics();
    const estimatedMonthlyRevenue = subscriptionMetrics.isActive ? 10000 : 0;

    return {
      subscriptionRevenue: {
        monthly: (subscriptionMetrics as any).totalRevenue || estimatedMonthlyRevenue,
        annual: ((subscriptionMetrics as any).totalRevenue || estimatedMonthlyRevenue) * 12,
        byTier: {
          free: 0,
          basic: 2000,
          professional: 5000,
          elite: 3000
        }
      },
      crossSellRevenue: {
        tacticalWind: 1500,
        otherProducts: 500
      },
      sponsorRevenue: {
        total: 5000,
        bySponsor: {
          'sponsor_1': 2000,
          'sponsor_2': 1500,
          'sponsor_3': 1500
        }
      },
      projectedRevenue: {
        nextMonth: 12000,
        nextQuarter: 36000,
        nextYear: 144000
      }
    };
  }

  private generateKeyInsights(data: {
    userEngagement: BusinessIntelligenceReport['userEngagement'];
    conversionFunnel: ConversionFunnelStep[];
    featureUsage: FeatureUsageMetric[];
    sponsorROI: SponsorROIMetric[];
    revenue: RevenueMetric;
  }): string[] {
    const insights: string[] = [];

    // User engagement insights
    if (data.userEngagement.averageSessionTime > 300000) { // 5 minutes
      insights.push('High user engagement with average session time over 5 minutes');
    }

    // Conversion insights
    const trialToSubscription = data.conversionFunnel.find(s => s.step === 'subscription_purchase');
    if (trialToSubscription && trialToSubscription.conversionRate > 15) {
      insights.push(`Strong trial-to-paid conversion rate at ${trialToSubscription.conversionRate.toFixed(1)}%`);
    }

    // Feature insights
    const topFeature = data.featureUsage[0];
    if (topFeature) {
      insights.push(`${topFeature.feature} is the most popular feature with ${topFeature.usageCount} uses`);
    }

    // Sponsor insights
    const topSponsor = data.sponsorROI[0];
    if (topSponsor && topSponsor.conversionRate > 5) {
      insights.push(`${topSponsor.sponsorName} showing excellent ROI with ${topSponsor.conversionRate.toFixed(1)}% conversion rate`);
    }

    // Revenue insights
    if (data.revenue.subscriptionRevenue.monthly > 8000) {
      insights.push('Subscription revenue exceeding targets with strong professional tier adoption');
    }

    return insights;
  }

  private generateRecommendations(data: {
    userEngagement: BusinessIntelligenceReport['userEngagement'];
    conversionFunnel: ConversionFunnelStep[];
    featureUsage: FeatureUsageMetric[];
    weatherPatterns: WeatherCheckPattern[];
  }): string[] {
    const recommendations: string[] = [];

    // Engagement recommendations
    if (data.userEngagement.averageSessionTime < 180000) { // 3 minutes
      recommendations.push('Improve user engagement by adding more interactive features and personalized content');
    }

    // Conversion recommendations
    const paywallStep = data.conversionFunnel.find(s => s.step === 'paywall_view');
    if (paywallStep && paywallStep.conversionRate < 10) {
      recommendations.push('Optimize paywall presentation and value proposition to improve conversion rates');
    }

    // Feature recommendations
    const underUsedFeatures = data.featureUsage.filter(f => f.usageCount < 100);
    if (underUsedFeatures.length > 0) {
      recommendations.push(`Promote underutilized features: ${underUsedFeatures.slice(0, 3).map(f => f.feature).join(', ')}`);
    }

    // Weather pattern recommendations
    const highFrequencyUsers = data.weatherPatterns.filter(p => p.frequency === 'high');
    if (highFrequencyUsers.length > 0) {
      recommendations.push('Target high-frequency weather users with premium subscription offers and TacticalWind cross-promotion');
    }

    return recommendations;
  }

  // Cache management
  private updateFeatureUsageCache(event: string, screen?: string, properties?: Record<string, any>): void {
    const feature = properties?.feature || screen || event;
    if (!feature) return;

    let cached = this.featureUsageCache.get(feature);
    if (!cached) {
      cached = {
        feature,
        usageCount: 0,
        uniqueUsers: 0,
        averageSessionTime: 0,
        subscriptionTierBreakdown: {
          free: 0,
          basic: 0,
          professional: 0,
          elite: 0
        },
        popularScreens: [],
        timeDistribution: { morning: 0, afternoon: 0, evening: 0, night: 0 }
      };
      this.featureUsageCache.set(feature, cached);
    }

    cached.usageCount++;
  }

  private updateSponsorMetrics(event: string, properties?: Record<string, any>): void {
    if (event !== 'sponsor_interaction' || !properties?.sponsor_id) return;

    const sponsorId = properties.sponsor_id;
    let cached = this.sponsorMetricsCache.get(sponsorId);
    
    if (!cached) {
      cached = {
        sponsorId,
        sponsorName: this.getSponsorName(sponsorId),
        impressions: 0,
        clicks: 0,
        conversions: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        revenueAttribution: 0,
        brandAwareness: { logoViews: 0, serviceClicks: 0, contactInteractions: 0 },
        audienceReach: {
          totalUsers: 0,
          uniqueUsers: 0,
          demographics: {
            subscriptionTiers: {
              free: 0,
              basic: 0,
              professional: 0,
              elite: 0
            },
            engagementLevels: {}
          }
        }
      };
      this.sponsorMetricsCache.set(sponsorId, cached);
    }

    const interactionType = properties.interaction_type;
    switch (interactionType) {
      case 'impression':
        cached.impressions++;
        break;
      case 'click':
        cached.clicks++;
        break;
      case 'contact':
        cached.conversions++;
        break;
    }

    // Recalculate rates
    cached.clickThroughRate = cached.impressions > 0 ? (cached.clicks / cached.impressions) * 100 : 0;
    cached.conversionRate = cached.clicks > 0 ? (cached.conversions / cached.clicks) * 100 : 0;
  }

  // Helper methods
  private getSponsorName(sponsorId: string): string {
    const sponsorNames: Record<string, string> = {
      'north_sails': 'North Sails',
      'rolex': 'Rolex',
      'gill_marine': 'Gill Marine',
      'harken': 'Harken',
      'ronstan': 'Ronstan'
    };
    return sponsorNames[sponsorId] || sponsorId;
  }

  private async getCurrentUserId(): Promise<string> {
    // Would integrate with user store
    return 'user_analytics_123';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage management
  private async loadAnalyticsData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('analytics_data');
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed.engagementMetrics) {
          this.engagementMetrics = parsed.engagementMetrics;
        }
      }
    } catch (error) {
    }
  }

  private async saveAnalyticsData(): Promise<void> {
    try {
      const data = {
        engagementMetrics: this.engagementMetrics.slice(0, this.maxMetricsStorage)
      };
      
      await AsyncStorage.setItem('analytics_data', JSON.stringify(data));
    } catch (error) {
    }
  }

  // Public utility methods
  clearAnalyticsData(): void {
    this.engagementMetrics = [];
    this.featureUsageCache.clear();
    this.sponsorMetricsCache.clear();
    AsyncStorage.removeItem('analytics_data');
  }

  getAnalyticsStats(): {
    totalEvents: number;
    uniqueUsers: number;
    sessionCount: number;
    cacheSize: number;
  } {
    const uniqueUsers = new Set(this.engagementMetrics.map(m => m.userId));
    const sessions = new Set(this.engagementMetrics.map(m => m.sessionId));

    return {
      totalEvents: this.engagementMetrics.length,
      uniqueUsers: uniqueUsers.size,
      sessionCount: sessions.size,
      cacheSize: this.featureUsageCache.size + this.sponsorMetricsCache.size
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();