import { Platform } from 'react-native';
import { subscriptionService, SubscriptionTier } from './subscriptionService';
import { errorHandler } from './errorHandler';
import { analyticsService } from './analyticsService';
import { paymentGatewayService, PaymentResult, SubscriptionPayment, OneTimePayment } from './paymentGatewayService';

// Enhanced payment interfaces for Phase 6
export interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'bank_transfer';
  name: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isValid: boolean;
  billingAddress?: BillingAddress;
}

export interface BillingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface PurchaseTransaction {
  id: string;
  userId: string;
  productId: string;
  productType: 'subscription' | 'cross_sell' | 'vip_access' | 'premium_feature';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';
  paymentMethod: PaymentMethod['type'];
  createdAt: string;
  completedAt?: string;
  receipt?: string;
  metadata?: Record<string, any>;
}

export interface PromotionalOffer {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'extended_trial' | 'bundle';
  value: number; // percentage or amount
  applicableProducts: string[];
  eligibilityCriteria: {
    userType?: 'new' | 'returning' | 'participant' | 'vip';
    regionCodes?: string[];
    subscriptionHistory?: 'never_subscribed' | 'previous_subscriber' | 'active_trial';
    sailingExperience?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  };
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

export interface CrossSellProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: 'tactical_wind' | 'coaching' | 'equipment' | 'event_access' | 'insurance';
  provider: string;
  commissionRate: number;
  targetAudience: {
    subscriptionTiers: SubscriptionTier[];
    sailingExperience: string[];
    regions: string[];
  };
  conversionTracking: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  isActive: boolean;
}

export interface VIPAccessPass {
  id: string;
  eventId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  benefits: string[];
  capacity: number;
  sold: number;
  availableFrom: string;
  availableTo: string;
  validFrom: string;
  validTo: string;
  isTransferable: boolean;
  isRefundable: boolean;
}

export interface RegionalPricing {
  regionCode: string;
  regionName: string;
  currency: string;
  priceMultiplier: number;
  taxRate: number;
  paymentMethods: PaymentMethod['type'][];
  promotionalOffers: string[];
}

// Enhanced Payment Service for Phase 6
export class PaymentService {
  private paymentMethods: Map<string, PaymentMethod[]> = new Map();
  private transactions: PurchaseTransaction[] = [];
  private promotionalOffers: PromotionalOffer[] = [];
  private crossSellProducts: CrossSellProduct[] = [];
  private vipAccessPasses: VIPAccessPass[] = [];
  private regionalPricing: Map<string, RegionalPricing> = new Map();

  constructor() {
    this.initializePromotionalOffers();
    this.initializeCrossSellProducts();
    this.initializeVIPAccess();
    this.initializeRegionalPricing();
  }

  // Initialize promotional offers
  private initializePromotionalOffers(): void {
    this.promotionalOffers = [
      {
        id: 'championship_launch',
        name: 'Championship Launch Special',
        type: 'percentage',
        value: 30,
        applicableProducts: ['dragon_pro_monthly', 'dragon_elite_monthly'],
        eligibilityCriteria: {
          userType: 'new',
          subscriptionHistory: 'never_subscribed'
        },
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 1000,
        usedCount: 0,
        isActive: true
      },
      {
        id: 'participant_upgrade',
        name: 'Participant Exclusive Upgrade',
        type: 'extended_trial',
        value: 14, // 14 days instead of 7
        applicableProducts: ['dragon_pro_monthly', 'dragon_elite_monthly'],
        eligibilityCriteria: {
          userType: 'participant'
        },
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        usedCount: 0,
        isActive: true
      },
      {
        id: 'early_bird_annual',
        name: 'Early Bird Annual Discount',
        type: 'percentage',
        value: 40,
        applicableProducts: ['dragon_pro_annual', 'dragon_elite_annual'],
        eligibilityCriteria: {
          sailingExperience: 'professional'
        },
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 500,
        usedCount: 0,
        isActive: true
      }
    ];
  }

  // Initialize cross-sell products
  private initializeCrossSellProducts(): void {
    this.crossSellProducts = [
      {
        id: 'tactical_wind_premium',
        name: 'TacticalWind Premium Route Planning',
        description: 'Advanced tactical wind routing for competitive sailing',
        price: 39.99,
        currency: 'USD',
        category: 'tactical_wind',
        provider: 'TacticalWind',
        commissionRate: 0.25,
        targetAudience: {
          subscriptionTiers: ['professional', 'elite'],
          sailingExperience: ['advanced', 'professional'],
          regions: ['global']
        },
        conversionTracking: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        },
        isActive: true
      },
      {
        id: 'sailing_coach_session',
        name: 'Personal Sailing Coach Session',
        description: '1-on-1 virtual coaching with Dragon class experts',
        price: 149.99,
        currency: 'USD',
        category: 'coaching',
        provider: 'Dragon Racing Academy',
        commissionRate: 0.30,
        targetAudience: {
          subscriptionTiers: ['basic', 'professional', 'elite'],
          sailingExperience: ['beginner', 'intermediate', 'advanced'],
          regions: ['global']
        },
        conversionTracking: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        },
        isActive: true
      },
      {
        id: 'dragon_worlds_merchandise',
        name: 'Official Dragon Worlds 2027 Gear',
        description: 'Limited edition championship merchandise and sailing gear',
        price: 89.99,
        currency: 'USD',
        category: 'equipment',
        provider: 'Gill Marine',
        commissionRate: 0.15,
        targetAudience: {
          subscriptionTiers: ['basic', 'professional', 'elite'],
          sailingExperience: ['intermediate', 'advanced', 'professional'],
          regions: ['global']
        },
        conversionTracking: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        },
        isActive: true
      },
      {
        id: 'sailing_insurance',
        name: 'Comprehensive Sailing Insurance',
        description: 'Coverage for boat, equipment, and liability during racing',
        price: 299.99,
        currency: 'USD',
        category: 'insurance',
        provider: 'Marine Insurance Group',
        commissionRate: 0.20,
        targetAudience: {
          subscriptionTiers: ['professional', 'elite'],
          sailingExperience: ['advanced', 'professional'],
          regions: ['global']
        },
        conversionTracking: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        },
        isActive: true
      }
    ];
  }

  // Initialize VIP access passes
  private initializeVIPAccess(): void {
    this.vipAccessPasses = [
      {
        id: 'vip_championship_access',
        eventId: 'dragon-worlds-2027',
        name: 'VIP Championship Experience',
        description: 'Exclusive access to live timing, competitor insights, and behind-the-scenes content',
        price: 199.99,
        currency: 'USD',
        benefits: [
          'Live race commentary with expert analysis',
          'Real-time boat tracking and telemetry',
          'Exclusive interviews with competitors',
          'VIP chat rooms with other premium users',
          'Early access to race results and analysis',
          'Downloadable race highlights and replays'
        ],
        capacity: 500,
        sold: 0,
        availableFrom: new Date().toISOString(),
        availableTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        validFrom: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        validTo: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        isTransferable: false,
        isRefundable: true
      },
      {
        id: 'spectator_plus',
        eventId: 'dragon-worlds-2027',
        name: 'Spectator Plus Package',
        description: 'Enhanced spectator experience with premium features',
        price: 49.99,
        currency: 'USD',
        benefits: [
          'HD live video streams from multiple angles',
          'Interactive course maps with wind data',
          'Push notifications for race updates',
          'Access to competitor profiles and statistics',
          'Photo galleries and event highlights'
        ],
        capacity: 2000,
        sold: 0,
        availableFrom: new Date().toISOString(),
        availableTo: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        validFrom: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        validTo: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        isTransferable: true,
        isRefundable: true
      }
    ];
  }

  // Initialize regional pricing
  private initializeRegionalPricing(): void {
    const regions: RegionalPricing[] = [
      {
        regionCode: 'US',
        regionName: 'United States',
        currency: 'USD',
        priceMultiplier: 1.0,
        taxRate: 0.08,
        paymentMethods: ['card', 'apple_pay', 'paypal'],
        promotionalOffers: ['championship_launch', 'early_bird_annual']
      },
      {
        regionCode: 'HK',
        regionName: 'Hong Kong',
        currency: 'HKD',
        priceMultiplier: 7.8,
        taxRate: 0.0,
        paymentMethods: ['card', 'apple_pay', 'google_pay'],
        promotionalOffers: ['participant_upgrade', 'early_bird_annual']
      },
      {
        regionCode: 'EU',
        regionName: 'European Union',
        currency: 'EUR',
        priceMultiplier: 0.85,
        taxRate: 0.20,
        paymentMethods: ['card', 'apple_pay', 'google_pay', 'paypal'],
        promotionalOffers: ['championship_launch', 'participant_upgrade']
      },
      {
        regionCode: 'AU',
        regionName: 'Australia',
        currency: 'AUD',
        priceMultiplier: 1.45,
        taxRate: 0.10,
        paymentMethods: ['card', 'apple_pay', 'google_pay', 'paypal'],
        promotionalOffers: ['championship_launch', 'early_bird_annual']
      },
      {
        regionCode: 'GB',
        regionName: 'United Kingdom',
        currency: 'GBP',
        priceMultiplier: 0.75,
        taxRate: 0.20,
        paymentMethods: ['card', 'apple_pay', 'google_pay', 'paypal'],
        promotionalOffers: ['championship_launch', 'participant_upgrade']
      }
    ];

    regions.forEach(region => {
      this.regionalPricing.set(region.regionCode, region);
    });
  }

  // Enhanced subscription purchase with regional pricing and promotions
  async purchaseSubscription(
    userId: string,
    tierId: SubscriptionTier,
    regionCode: string,
    promotionalOfferId?: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; message: string; transactionId?: string; finalPrice?: number }> {
    try {
      // Track purchase attempt
      await analyticsService.trackEvent('subscription_purchase_attempt', {
        tier_id: tierId,
        region_code: regionCode,
        promotional_offer: promotionalOfferId,
        payment_method: paymentMethodId
      });

      // Get regional pricing
      const pricing = this.getRegionalPricing(tierId, regionCode);
      let finalPrice = pricing.price;
      
      // Apply promotional offer if valid
      if (promotionalOfferId) {
        const offer = this.getValidPromotionalOffer(promotionalOfferId, tierId, userId);
        if (offer) {
          finalPrice = this.applyPromotionalOffer(finalPrice, offer);
        }
      }

      // Mock payment processing (would integrate with actual payment gateway)
      const transaction = await this.processPayment(userId, tierId, finalPrice, pricing.currency, paymentMethodId);
      
      if (transaction.status === 'completed') {
        // Activate subscription through subscription service
        const subscriptionResult = await subscriptionService.purchaseSubscription(tierId);
        
        if (subscriptionResult.success) {
          // Track successful purchase
          await analyticsService.trackEvent('subscription_purchase_completed', {
            tier_id: tierId,
            transaction_id: transaction.id,
            amount: finalPrice,
            currency: pricing.currency,
            region_code: regionCode
          });

          return {
            success: true,
            message: 'Subscription purchased successfully',
            transactionId: transaction.id,
            finalPrice
          };
        }
      }

      throw new Error('Payment processing failed');

    } catch (error) {
      await analyticsService.trackEvent('subscription_purchase_failed', {
        tier_id: tierId,
        region_code: regionCode,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Purchase failed'
      };
    }
  }

  // Purchase cross-sell product
  async purchaseCrossSellProduct(
    userId: string,
    productId: string,
    regionCode: string
  ): Promise<{ success: boolean; message: string; transactionId?: string }> {
    try {
      const product = this.crossSellProducts.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const pricing = this.getRegionalPricing(null, regionCode, product.price, product.currency);
      
      const transaction = await this.processPayment(
        userId, 
        productId, 
        pricing.price, 
        pricing.currency,
        undefined,
        'cross_sell'
      );

      if (transaction.status === 'completed') {
        // Update conversion tracking
        product.conversionTracking.conversions++;
        product.conversionTracking.revenue += pricing.price;

        await analyticsService.trackEvent('cross_sell_purchase_completed', {
          product_id: productId,
          transaction_id: transaction.id,
          amount: pricing.price,
          currency: pricing.currency,
          category: product.category
        });

        return {
          success: true,
          message: 'Product purchased successfully',
          transactionId: transaction.id
        };
      }

      throw new Error('Payment processing failed');

    } catch (error) {
      await analyticsService.trackEvent('cross_sell_purchase_failed', {
        product_id: productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Purchase failed'
      };
    }
  }

  // Purchase VIP access pass
  async purchaseVIPAccess(
    userId: string,
    passId: string,
    regionCode: string
  ): Promise<{ success: boolean; message: string; transactionId?: string }> {
    try {
      const pass = this.vipAccessPasses.find(p => p.id === passId);
      if (!pass) {
        throw new Error('VIP pass not found');
      }

      if (pass.sold >= pass.capacity) {
        throw new Error('VIP pass sold out');
      }

      const pricing = this.getRegionalPricing(null, regionCode, pass.price, pass.currency);
      
      const transaction = await this.processPayment(
        userId, 
        passId, 
        pricing.price, 
        pricing.currency,
        undefined,
        'vip_access'
      );

      if (transaction.status === 'completed') {
        // Update sold count
        pass.sold++;

        await analyticsService.trackEvent('vip_access_purchase_completed', {
          pass_id: passId,
          transaction_id: transaction.id,
          amount: pricing.price,
          currency: pricing.currency,
          event_id: pass.eventId
        });

        return {
          success: true,
          message: 'VIP access purchased successfully',
          transactionId: transaction.id
        };
      }

      throw new Error('Payment processing failed');

    } catch (error) {
      await analyticsService.trackEvent('vip_access_purchase_failed', {
        pass_id: passId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Purchase failed'
      };
    }
  }

  // Real payment processing with payment gateway integration
  private async processPayment(
    userId: string,
    productId: string,
    amount: number,
    currency: string,
    paymentMethodId?: string,
    productType: PurchaseTransaction['productType'] = 'subscription'
  ): Promise<PurchaseTransaction> {
    try {
      await paymentGatewayService.initialize();

      let paymentResult: PaymentResult;
      
      if (productType === 'subscription') {
        const subscriptionPayment: SubscriptionPayment = {
          subscriptionId: productId,
          planId: productId,
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          interval: productId.includes('annual') ? 'year' : 'month',
          trialDays: productId.includes('trial') ? 7 : undefined
        };

        if (paymentMethodId) {
          paymentResult = await paymentGatewayService.confirmPaymentWithStripe(
            (await paymentGatewayService.createPaymentIntent(subscriptionPayment)).id,
            paymentMethodId
          );
        } else {
          // Try Apple Pay first on iOS, Google Pay on Android
          if (Platform.OS === 'ios') {
            paymentResult = await paymentGatewayService.processApplePay(subscriptionPayment);
          } else if (Platform.OS === 'android') {
            paymentResult = await paymentGatewayService.processGooglePay(subscriptionPayment);
          } else {
            throw new Error('No payment method specified for web platform');
          }
        }
      } else {
        const oneTimePayment: OneTimePayment = {
          productId,
          productType: productType === 'cross_sell' ? 'premium_feature' : 
                       productType === 'vip_access' ? 'vip_access' : 'premium_feature',
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          description: this.getProductDescription(productId, productType)
        };

        if (paymentMethodId) {
          paymentResult = await paymentGatewayService.confirmPaymentWithStripe(
            (await paymentGatewayService.createPaymentIntent(oneTimePayment)).id,
            paymentMethodId
          );
        } else {
          // Try platform-specific payment methods
          if (Platform.OS === 'ios') {
            paymentResult = await paymentGatewayService.processApplePay(oneTimePayment);
          } else if (Platform.OS === 'android') {
            paymentResult = await paymentGatewayService.processGooglePay(oneTimePayment);
          } else {
            throw new Error('No payment method specified for web platform');
          }
        }
      }

      const transaction: PurchaseTransaction = {
        id: paymentResult.paymentId || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        productId,
        productType,
        amount,
        currency,
        status: paymentResult.success ? 'completed' : 'failed',
        paymentMethod: this.determinePaymentMethodType(paymentMethodId),
        createdAt: new Date().toISOString(),
        completedAt: paymentResult.success ? new Date().toISOString() : undefined,
        metadata: { 
          paymentGatewayResult: paymentResult,
          region: this.getCurrentRegion()
        }
      };

      this.transactions.push(transaction);
      return transaction;

    } catch (error) {
      console.error('Payment processing error:', error);
      
      const failedTransaction: PurchaseTransaction = {
        id: `txn_failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        productId,
        productType,
        amount,
        currency,
        status: 'failed',
        paymentMethod: this.determinePaymentMethodType(paymentMethodId),
        createdAt: new Date().toISOString(),
        metadata: { 
          error: error instanceof Error ? error.message : 'Payment processing failed',
          region: this.getCurrentRegion()
        }
      };

      this.transactions.push(failedTransaction);
      return failedTransaction;
    }
  }

  private getProductDescription(productId: string, productType: PurchaseTransaction['productType']): string {
    switch (productType) {
      case 'subscription':
        return `Dragon Worlds HK 2027 - ${productId} Subscription`;
      case 'cross_sell':
        const product = this.crossSellProducts.find(p => p.id === productId);
        return product ? product.description : 'Cross-sell Product';
      case 'vip_access':
        const pass = this.vipAccessPasses.find(p => p.id === productId);
        return pass ? pass.description : 'VIP Access Pass';
      default:
        return 'Dragon Worlds HK 2027 - Premium Feature';
    }
  }

  private determinePaymentMethodType(paymentMethodId?: string): PaymentMethod['type'] {
    if (paymentMethodId) {
      return 'card'; // Stripe card payment
    } else if (Platform.OS === 'ios') {
      return 'apple_pay';
    } else if (Platform.OS === 'android') {
      return 'google_pay';
    } else {
      return 'card'; // Default for web
    }
  }

  private getCurrentRegion(): string {
    // In a real implementation, this would detect user's region
    // For now, default to US
    return 'US';
  }

  // Get regional pricing
  private getRegionalPricing(
    tierId: SubscriptionTier | null, 
    regionCode: string, 
    basePrice?: number,
    baseCurrency?: string
  ): { price: number; currency: string } {
    const region = this.regionalPricing.get(regionCode) || this.regionalPricing.get('US')!;
    
    let price = basePrice || this.getBaseTierPrice(tierId);
    
    // Apply regional multiplier
    price = price * region.priceMultiplier;
    
    // Add tax
    price = price * (1 + region.taxRate);
    
    return {
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      currency: region.currency
    };
  }

  private getBaseTierPrice(tierId: SubscriptionTier | null): number {
    switch (tierId) {
      case 'basic': return 9.99;
      case 'professional': return 24.99;
      case 'elite': return 49.99;
      default: return 0;
    }
  }

  // Get valid promotional offer
  private getValidPromotionalOffer(
    offerId: string, 
    tierId: SubscriptionTier, 
    userId: string
  ): PromotionalOffer | null {
    const offer = this.promotionalOffers.find(o => 
      o.id === offerId && 
      o.isActive && 
      new Date() >= new Date(o.validFrom) &&
      new Date() <= new Date(o.validTo) &&
      o.applicableProducts.includes(`dragon_${tierId}_monthly`) &&
      (!offer.usageLimit || o.usedCount < o.usageLimit)
    );

    return offer || null;
  }

  // Apply promotional offer
  private applyPromotionalOffer(price: number, offer: PromotionalOffer): number {
    switch (offer.type) {
      case 'percentage':
        return price * (1 - offer.value / 100);
      case 'fixed_amount':
        return Math.max(0, price - offer.value);
      default:
        return price;
    }
  }

  // Getters for UI
  getPromotionalOffers(): PromotionalOffer[] {
    return this.promotionalOffers.filter(offer => 
      offer.isActive && 
      new Date() >= new Date(offer.validFrom) &&
      new Date() <= new Date(offer.validTo)
    );
  }

  getCrossSellProducts(subscriptionTier?: SubscriptionTier): CrossSellProduct[] {
    return this.crossSellProducts.filter(product => 
      product.isActive &&
      (!subscriptionTier || product.targetAudience.subscriptionTiers.includes(subscriptionTier))
    );
  }

  getVIPAccessPasses(): VIPAccessPass[] {
    return this.vipAccessPasses.filter(pass => 
      new Date() >= new Date(pass.availableFrom) &&
      new Date() <= new Date(pass.availableTo) &&
      pass.sold < pass.capacity
    );
  }

  // Track cross-sell impressions
  async trackCrossSellImpression(productId: string): Promise<void> {
    const product = this.crossSellProducts.find(p => p.id === productId);
    if (product) {
      product.conversionTracking.impressions++;
      
      await analyticsService.trackEvent('cross_sell_impression', {
        product_id: productId,
        category: product.category,
        price: product.price
      });
    }
  }

  // Track cross-sell clicks
  async trackCrossSellClick(productId: string): Promise<void> {
    const product = this.crossSellProducts.find(p => p.id === productId);
    if (product) {
      product.conversionTracking.clicks++;
      
      await analyticsService.trackEvent('cross_sell_click', {
        product_id: productId,
        category: product.category,
        click_through_rate: (product.conversionTracking.clicks / product.conversionTracking.impressions) * 100
      });
    }
  }

  // Get user's transaction history
  getUserTransactions(userId: string): PurchaseTransaction[] {
    return this.transactions.filter(t => t.userId === userId);
  }

  // Get revenue analytics
  getRevenueAnalytics(days: number = 30): {
    totalRevenue: number;
    subscriptionRevenue: number;
    crossSellRevenue: number;
    vipAccessRevenue: number;
    transactionCount: number;
  } {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentTransactions = this.transactions.filter(
      t => t.status === 'completed' && new Date(t.createdAt) >= cutoffDate
    );

    const subscriptionRevenue = recentTransactions
      .filter(t => t.productType === 'subscription')
      .reduce((sum, t) => sum + t.amount, 0);

    const crossSellRevenue = recentTransactions
      .filter(t => t.productType === 'cross_sell')
      .reduce((sum, t) => sum + t.amount, 0);

    const vipAccessRevenue = recentTransactions
      .filter(t => t.productType === 'vip_access')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalRevenue: subscriptionRevenue + crossSellRevenue + vipAccessRevenue,
      subscriptionRevenue,
      crossSellRevenue,
      vipAccessRevenue,
      transactionCount: recentTransactions.length
    };
  }

  // Payment method management through gateway service
  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const gatewayMethods = await paymentGatewayService.getPaymentMethods(userId);
      
      return gatewayMethods.map(gm => ({
        id: gm.id,
        type: gm.type as PaymentMethod['type'],
        name: this.formatPaymentMethodName(gm),
        last4: gm.last4,
        brand: gm.brand,
        expiryMonth: gm.expiryMonth,
        expiryYear: gm.expiryYear,
        isDefault: gm.isDefault,
        isValid: true // Gateway service validates methods
      }));
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return [];
    }
  }

  async addPaymentMethod(
    userId: string, 
    paymentData: {
      type: PaymentMethod['type'];
      brand?: string;
      last4?: string;
      expiryMonth?: number;
      expiryYear?: number;
      isDefault?: boolean;
    }
  ): Promise<PaymentMethod | null> {
    try {
      const gatewayMethod = await paymentGatewayService.addPaymentMethod(userId, {
        type: paymentData.type === 'card' ? 'card' : paymentData.type,
        brand: paymentData.brand,
        last4: paymentData.last4,
        expiryMonth: paymentData.expiryMonth,
        expiryYear: paymentData.expiryYear,
        isDefault: paymentData.isDefault || false
      });

      return {
        id: gatewayMethod.id,
        type: gatewayMethod.type as PaymentMethod['type'],
        name: this.formatPaymentMethodName(gatewayMethod),
        last4: gatewayMethod.last4,
        brand: gatewayMethod.brand,
        expiryMonth: gatewayMethod.expiryMonth,
        expiryYear: gatewayMethod.expiryYear,
        isDefault: gatewayMethod.isDefault,
        isValid: true
      };
    } catch (error) {
      console.error('Error adding payment method:', error);
      return null;
    }
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<boolean> {
    try {
      await paymentGatewayService.setDefaultPaymentMethod(userId, paymentMethodId);
      return true;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return false;
    }
  }

  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<boolean> {
    try {
      await paymentGatewayService.removePaymentMethod(userId, paymentMethodId);
      return true;
    } catch (error) {
      console.error('Error removing payment method:', error);
      return false;
    }
  }

  async getAvailablePaymentMethods(): Promise<string[]> {
    try {
      return await paymentGatewayService.getAvailablePaymentMethods();
    } catch (error) {
      console.error('Error getting available payment methods:', error);
      return ['card']; // Fallback to card only
    }
  }

  async processRefund(
    paymentId: string,
    amount?: number,
    reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'subscription_canceled' = 'requested_by_customer'
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const result = await paymentGatewayService.processRefund({
        paymentId,
        amount,
        reason
      });

      if (result.success) {
        // Update transaction status
        const transaction = this.transactions.find(t => t.id === paymentId);
        if (transaction) {
          transaction.status = 'refunded';
          transaction.metadata = {
            ...transaction.metadata,
            refundId: result.paymentId,
            refundedAt: new Date().toISOString()
          };
        }

        await analyticsService.trackEvent('payment_refunded', {
          payment_id: paymentId,
          refund_id: result.paymentId,
          amount: amount,
          reason: reason
        });
      }

      return {
        success: result.success,
        refundId: result.paymentId,
        error: result.error
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed'
      };
    }
  }

  private formatPaymentMethodName(gatewayMethod: any): string {
    switch (gatewayMethod.type) {
      case 'card':
        return `${gatewayMethod.brand || 'Card'} •••• ${gatewayMethod.last4 || '0000'}`;
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      default:
        return 'Payment Method';
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export types
export type {
  PaymentMethod,
  BillingAddress,
  PurchaseTransaction,
  PromotionalOffer,
  CrossSellProduct,
  VIPAccessPass,
  RegionalPricing
};