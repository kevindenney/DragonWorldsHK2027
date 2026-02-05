import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// TypeScript interfaces for subscription management
export type SubscriptionTierId = 'free' | 'basic' | 'professional' | 'elite';

export interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  price: number;
  currency: 'USD' | 'HKD' | 'EUR' | 'GBP';
  period: 'month' | 'year';
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
  trialDays: number;
  isPopular?: boolean;
  productId: string; // For app store integration
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  category: 'weather' | 'social' | 'results' | 'premium';
  included: boolean;
}

export interface SubscriptionLimits {
  weatherQueries: number; // per day
  forecastHours: number; // how far ahead
  detailLevel: 'basic' | 'professional' | 'premium';
  alerts: boolean;
  marineData: boolean;
  racingAnalysis: boolean;
  socialFeatures: boolean;
  offlineSync: boolean;
}

export interface ParticipantVerification {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  type: 'competitor' | 'support-crew' | 'coach' | 'official' | 'media';
  eventId: string;
  sailNumber?: string;
  teamName?: string;
  credentials: {
    documentType: 'entry-list' | 'accreditation' | 'crew-list';
    documentUrl?: string;
    verificationCode?: string;
  };
  verifiedAt?: string;
  verifiedBy?: string;
  benefits: ParticipantBenefit[];
  expiresAt: string; // End of event + grace period
}

export interface ParticipantBenefit {
  type: 'weather-access' | 'vip-content' | 'priority-support';
  description: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface SubscriptionStatus {
  currentTier: SubscriptionTier['id'];
  status: 'active' | 'expired' | 'cancelled' | 'trial' | 'grace-period';
  startDate: string;
  endDate: string;
  renewalDate?: string;
  isAutoRenew: boolean;
  paymentMethod?: 'stripe' | 'app-store' | 'google-play' | 'participant-access';
  lastPaymentDate?: string;
  nextBillingDate?: string;
  cancelledAt?: string;
  trialEndsAt?: string;
  gracePeriodEndsAt?: string;
  // Convenience properties for status checking
  active?: boolean;
  isTrial?: boolean;
  tier?: SubscriptionTierId;
}

export interface PaymentProvider {
  initialize: () => Promise<void>;
  purchaseSubscription: (productId: string) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult[]>;
  getProducts: () => Promise<Product[]>;
  validateReceipt: (receipt: string) => Promise<boolean>;
}

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  productId?: string;
  receipt?: string;
  error?: string;
}

export interface Product {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
}

// Championship event access periods
export interface ChampionshipAccess {
  eventId: string;
  name: string;
  startDate: string;
  endDate: string;
  gracePeriod: number; // days after event
  participantAccess: {
    tier: SubscriptionTier['id'];
    features: string[];
    weatherAccess: 'professional' | 'premium';
  };
}

// Subscription service class
export class SubscriptionService {
  private subscriptionTiers: SubscriptionTier[] = [];
  private currentStatus: SubscriptionStatus | null = null;
  private participantVerification: ParticipantVerification | null = null;
  private paymentProvider: PaymentProvider | null = null;
  
  constructor() {
    this.initializeSubscriptionTiers();
    this.loadSubscriptionStatus();
    this.loadParticipantVerification();
  }

  // Initialize subscription tiers with pricing
  private initializeSubscriptionTiers(): void {
    this.subscriptionTiers = [
      {
        id: 'free',
        name: 'Free Sailing',
        price: 0,
        currency: 'USD',
        period: 'month',
        trialDays: 0,
        productId: '',
        features: [
          {
            id: 'basic-weather',
            name: 'Basic Weather',
            description: 'Current conditions and 3-hour forecast',
            category: 'weather',
            included: true
          },
          {
            id: 'schedule-access',
            name: 'Event Schedule',
            description: 'Race schedules and results',
            category: 'results',
            included: true
          }
        ],
        limits: {
          weatherQueries: 10,
          forecastHours: 3,
          detailLevel: 'basic',
          alerts: false,
          marineData: false,
          racingAnalysis: false,
          socialFeatures: true,
          offlineSync: false
        }
      },
      {
        id: 'basic',
        name: 'Basic Sailing',
        price: 9.99,
        currency: 'USD',
        period: 'month',
        trialDays: 7,
        productId: Platform.OS === 'ios' ? 'dragon_basic_monthly' : 'dragon.basic.monthly',
        features: [
          {
            id: 'extended-forecast',
            name: 'Extended Forecast',
            description: '12-hour detailed forecast',
            category: 'weather',
            included: true
          },
          {
            id: 'weather-alerts',
            name: 'Weather Alerts',
            description: 'Wind and weather warnings',
            category: 'weather',
            included: true
          }
        ],
        limits: {
          weatherQueries: 100,
          forecastHours: 12,
          detailLevel: 'basic',
          alerts: true,
          marineData: false,
          racingAnalysis: false,
          socialFeatures: true,
          offlineSync: true
        }
      },
      {
        id: 'professional',
        name: 'Professional Racing',
        price: 24.99,
        currency: 'USD',
        period: 'month',
        trialDays: 7,
        isPopular: true,
        productId: Platform.OS === 'ios' ? 'dragon_pro_monthly' : 'dragon.pro.monthly',
        features: [
          {
            id: 'marine-conditions',
            name: 'Marine Conditions',
            description: 'Wave, tide, and current data',
            category: 'weather',
            included: true
          },
          {
            id: 'racing-analysis',
            name: 'Racing Analysis',
            description: 'Wind patterns and tactical insights',
            category: 'weather',
            included: true
          },
          {
            id: 'detailed-results',
            name: 'Detailed Results',
            description: 'Split times and analytics',
            category: 'results',
            included: true
          }
        ],
        limits: {
          weatherQueries: 500,
          forecastHours: 48,
          detailLevel: 'professional',
          alerts: true,
          marineData: true,
          racingAnalysis: true,
          socialFeatures: true,
          offlineSync: true
        }
      },
      {
        id: 'elite',
        name: 'Elite Sailor',
        price: 49.99,
        currency: 'USD',
        period: 'month',
        trialDays: 7,
        productId: Platform.OS === 'ios' ? 'dragon_elite_monthly' : 'dragon.elite.monthly',
        features: [
          {
            id: 'premium-analysis',
            name: 'Premium Analysis',
            description: 'AI-powered racing insights',
            category: 'premium',
            included: true
          },
          {
            id: 'vip-access',
            name: 'VIP Access',
            description: 'Exclusive content and features',
            category: 'social',
            included: true
          }
        ],
        limits: {
          weatherQueries: -1, // unlimited
          forecastHours: 168, // 7 days
          detailLevel: 'premium',
          alerts: true,
          marineData: true,
          racingAnalysis: true,
          socialFeatures: true,
          offlineSync: true
        }
      }
    ];
  }

  // Event participant verification
  async verifyParticipant(
    eventId: string,
    participantType: ParticipantVerification['type'],
    credentials: ParticipantVerification['credentials'],
    sailNumber?: string
  ): Promise<{ success: boolean; message: string; verification?: ParticipantVerification }> {
    try {
      // Simulate API call to verify participant credentials
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock verification logic
      const isValid = credentials.verificationCode === 'DRAGON2027' || 
                     credentials.documentType === 'entry-list';
      
      if (isValid) {
        const verification: ParticipantVerification = {
          status: 'verified',
          type: participantType,
          eventId,
          sailNumber,
          credentials,
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'system',
          benefits: await this.getParticipantBenefits(eventId, participantType),
          expiresAt: this.getEventEndDate(eventId)
        };
        
        this.participantVerification = verification;
        await this.saveParticipantVerification();
        
        return {
          success: true,
          message: 'Participant verification successful',
          verification
        };
      } else {
        return {
          success: false,
          message: 'Invalid credentials or participant not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Verification service unavailable'
      };
    }
  }

  // Get participant benefits based on event and role
  private async getParticipantBenefits(
    eventId: string, 
    participantType: ParticipantVerification['type']
  ): Promise<ParticipantBenefit[]> {
    const eventEnd = this.getEventEndDate(eventId);
    const gracePeriod = new Date(eventEnd);
    gracePeriod.setDate(gracePeriod.getDate() + 7); // 7-day grace period
    
    const benefits: ParticipantBenefit[] = [
      {
        type: 'weather-access',
        description: 'Professional weather data during championship',
        validFrom: new Date().toISOString(),
        validTo: gracePeriod.toISOString(),
        isActive: true
      }
    ];
    
    if (participantType === 'competitor' || participantType === 'coach') {
      benefits.push({
        type: 'vip-content',
        description: 'Access to competitor-only content',
        validFrom: new Date().toISOString(),
        validTo: eventEnd,
        isActive: true
      });
    }
    
    return benefits;
  }

  // Check if user has access to a specific feature
  hasFeatureAccess(featureId: string): boolean {
    // Check participant benefits first
    if (this.participantVerification?.status === 'verified') {
      const hasParticipantAccess = this.participantVerification.benefits.some(
        benefit => benefit.isActive && 
        new Date() < new Date(benefit.validTo) &&
        (benefit.type === 'weather-access' || benefit.type === 'vip-content')
      );
      
      if (hasParticipantAccess) return true;
    }
    
    // Check subscription tier
    const currentTier = this.getCurrentTier();
    return currentTier.features.some(feature => 
      feature.id === featureId && feature.included
    );
  }

  // Get effective subscription level (including participant benefits)
  getEffectiveSubscriptionLevel(): SubscriptionTier['id'] {
    // During championship events, verified participants get professional access
    if (this.participantVerification?.status === 'verified') {
      const hasActiveWeatherBenefit = this.participantVerification.benefits.some(
        benefit => benefit.type === 'weather-access' && 
        benefit.isActive && 
        new Date() < new Date(benefit.validTo)
      );
      
      if (hasActiveWeatherBenefit) {
        return 'professional'; // Upgrade to professional during events
      }
    }
    
    return this.currentStatus?.currentTier || 'free';
  }

  // Subscription management
  async purchaseSubscription(tierId: SubscriptionTier['id']): Promise<{ success: boolean; message: string }> {
    const tier = this.subscriptionTiers.find(t => t.id === tierId);
    if (!tier) {
      return { success: false, message: 'Subscription tier not found' };
    }
    
    try {
      if (this.paymentProvider) {
        const result = await this.paymentProvider.purchaseSubscription(tier.productId);
        
        if (result.success) {
          await this.activateSubscription(tierId, result.transactionId);
          return { success: true, message: 'Subscription activated successfully' };
        } else {
          return { success: false, message: result.error || 'Purchase failed' };
        }
      } else {
        // Mock purchase for development
        await this.activateSubscription(tierId);
        return { success: true, message: 'Subscription activated (dev mode)' };
      }
    } catch (error) {
      return { success: false, message: 'Payment processing failed' };
    }
  }

  private async activateSubscription(tierId: SubscriptionTier['id'], transactionId?: string): Promise<void> {
    const tier = this.subscriptionTiers.find(t => t.id === tierId);
    if (!tier) return;
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + (tier.period === 'month' ? 1 : 12));
    
    this.currentStatus = {
      currentTier: tierId,
      status: tier.trialDays > 0 ? 'trial' : 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      trialEndsAt: tier.trialDays > 0 ? 
        new Date(now.getTime() + tier.trialDays * 24 * 60 * 60 * 1000).toISOString() : 
        undefined,
      isAutoRenew: true,
      paymentMethod: this.paymentProvider ? 'app-store' : undefined,
      lastPaymentDate: transactionId ? now.toISOString() : undefined
    };
    
    await this.saveSubscriptionStatus();
  }

  // Trial management
  async startFreeTrial(tierId: SubscriptionTier['id']): Promise<{ success: boolean; message: string }> {
    const tier = this.subscriptionTiers.find(t => t.id === tierId);
    if (!tier || tier.trialDays === 0) {
      return { success: false, message: 'Trial not available for this tier' };
    }
    
    if (this.currentStatus && this.currentStatus.trialEndsAt) {
      return { success: false, message: 'Trial already used' };
    }
    
    const now = new Date();
    const trialEnd = new Date(now.getTime() + tier.trialDays * 24 * 60 * 60 * 1000);
    
    this.currentStatus = {
      currentTier: tierId,
      status: 'trial',
      startDate: now.toISOString(),
      endDate: trialEnd.toISOString(),
      trialEndsAt: trialEnd.toISOString(),
      isAutoRenew: false
    };
    
    await this.saveSubscriptionStatus();
    return { success: true, message: `${tier.trialDays}-day trial started` };
  }

  // Utility methods
  getCurrentTier(): SubscriptionTier {
    const currentTierId = this.getEffectiveSubscriptionLevel();
    return this.subscriptionTiers.find(t => t.id === currentTierId) || this.subscriptionTiers[0];
  }

  getSubscriptionStatus(): SubscriptionStatus | null {
    return this.currentStatus;
  }

  getParticipantVerification(): ParticipantVerification | null {
    return this.participantVerification;
  }

  getAllTiers(): SubscriptionTier[] {
    return [...this.subscriptionTiers];
  }

  // Check if subscription needs renewal
  needsRenewal(): boolean {
    if (!this.currentStatus) return false;
    
    const now = new Date();
    const endDate = new Date(this.currentStatus.endDate);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 3; // Warn 3 days before expiry
  }

  // Private helper methods
  private getEventEndDate(eventId: string): string {
    // Mock event dates - in production, fetch from schedule store
    const eventDates: Record<string, string> = {
      'dragon-worlds-2027': '2024-11-24T23:59:59Z',
      'asia-pacific-2027': '2024-10-31T23:59:59Z'
    };
    
    return eventDates[eventId] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Persistence methods
  private async loadSubscriptionStatus(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('subscription_status');
      if (saved) {
        this.currentStatus = JSON.parse(saved);
      }
    } catch (error) {
    }
  }

  private async saveSubscriptionStatus(): Promise<void> {
    try {
      if (this.currentStatus) {
        await AsyncStorage.setItem('subscription_status', JSON.stringify(this.currentStatus));
      }
    } catch (error) {
    }
  }

  private async loadParticipantVerification(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('participant_verification');
      if (saved) {
        this.participantVerification = JSON.parse(saved);
      }
    } catch (error) {
    }
  }

  private async saveParticipantVerification(): Promise<void> {
    try {
      if (this.participantVerification) {
        await AsyncStorage.setItem('participant_verification', JSON.stringify(this.participantVerification));
      }
    } catch (error) {
    }
  }

  // Payment provider integration
  setPaymentProvider(provider: PaymentProvider): void {
    this.paymentProvider = provider;
  }

  // Clean up expired data
  async cleanup(): Promise<void> {
    const now = new Date();

    // Check if subscription expired
    if (this.currentStatus && new Date(this.currentStatus.endDate) < now) {
      this.currentStatus.status = 'expired';
      await this.saveSubscriptionStatus();
    }

    // Check if participant verification expired
    if (this.participantVerification && new Date(this.participantVerification.expiresAt) < now) {
      this.participantVerification.status = 'rejected'; // Expired
      this.participantVerification.benefits = this.participantVerification.benefits.map(
        benefit => ({ ...benefit, isActive: false })
      );
      await this.saveParticipantVerification();
    }
  }

  // Get subscription metrics for analytics
  getMetrics(): {
    currentTier: SubscriptionTierId;
    status: string;
    daysRemaining: number;
    isActive: boolean;
    isTrial: boolean;
  } {
    const now = new Date();
    const endDate = this.currentStatus ? new Date(this.currentStatus.endDate) : now;
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      currentTier: this.currentStatus?.currentTier || 'free',
      status: this.currentStatus?.status || 'expired',
      daysRemaining,
      isActive: this.currentStatus?.status === 'active' || this.currentStatus?.status === 'trial',
      isTrial: this.currentStatus?.status === 'trial',
    };
  }

  // Clear subscription cache
  async clearCache(): Promise<void> {
    await AsyncStorage.multiRemove(['subscription_status', 'participant_verification']);
    this.currentStatus = null;
    this.participantVerification = null;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();