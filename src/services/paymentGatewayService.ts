import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PaymentMethod {
  id: string;
  type: 'stripe' | 'apple_pay' | 'google_pay' | 'card';
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  clientSecret?: string;
  paymentMethodId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface SubscriptionPayment {
  subscriptionId: string;
  planId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  trialDays?: number;
}

export interface OneTimePayment {
  productId: string;
  productType: 'vip_access' | 'course_data' | 'premium_feature' | 'merchandise';
  amount: number;
  currency: string;
  description: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  needsAction?: boolean;
  actionUrl?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'subscription_canceled';
}

class PaymentGatewayService {
  private stripePublishableKey: string;
  private isInitialized = false;
  
  constructor() {
    this.stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      if (Platform.OS === 'web') {
        await this.initializeStripeWeb();
      } else {
        await this.initializeStripeNative();
      }
      this.isInitialized = true;
    } catch (error) {
      throw error;
    }
  }

  private async initializeStripeWeb(): Promise<void> {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      document.head.appendChild(script);
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          if (window.Stripe) {
            window.stripeInstance = window.Stripe(this.stripePublishableKey);
            resolve();
          } else {
            reject(new Error('Stripe failed to load'));
          }
        };
        script.onerror = () => reject(new Error('Stripe script failed to load'));
      });
    }
  }

  private async initializeStripeNative(): Promise<void> {
    try {
      const { initStripe } = await import('@stripe/stripe-react-native');
      await initStripe({
        publishableKey: this.stripePublishableKey,
        merchantIdentifier: 'merchant.com.dragonworldshk2027',
        urlScheme: 'dragonworldshk2027',
      });
    } catch (error) {
    }
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const stored = await AsyncStorage.getItem(`payment_methods_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  async addPaymentMethod(userId: string, paymentMethodData: Partial<PaymentMethod>): Promise<PaymentMethod> {
    try {
      const paymentMethod: PaymentMethod = {
        id: `pm_${Date.now()}${Math.random().toString(36).substring(7)}`,
        type: paymentMethodData.type || 'card',
        brand: paymentMethodData.brand,
        last4: paymentMethodData.last4,
        expiryMonth: paymentMethodData.expiryMonth,
        expiryYear: paymentMethodData.expiryYear,
        isDefault: paymentMethodData.isDefault || false,
        createdAt: new Date(),
      };

      const existingMethods = await this.getPaymentMethods(userId);
      
      if (paymentMethod.isDefault) {
        existingMethods.forEach(pm => pm.isDefault = false);
      }
      
      existingMethods.push(paymentMethod);
      await AsyncStorage.setItem(`payment_methods_${userId}`, JSON.stringify(existingMethods));
      
      return paymentMethod;
    } catch (error) {
      throw error;
    }
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      const paymentMethods = await this.getPaymentMethods(userId);
      
      paymentMethods.forEach(pm => {
        pm.isDefault = pm.id === paymentMethodId;
      });
      
      await AsyncStorage.setItem(`payment_methods_${userId}`, JSON.stringify(paymentMethods));
    } catch (error) {
      throw error;
    }
  }

  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      const paymentMethods = await this.getPaymentMethods(userId);
      const filteredMethods = paymentMethods.filter(pm => pm.id !== paymentMethodId);
      
      await AsyncStorage.setItem(`payment_methods_${userId}`, JSON.stringify(filteredMethods));
    } catch (error) {
      throw error;
    }
  }

  async createPaymentIntent(payment: SubscriptionPayment | OneTimePayment): Promise<PaymentIntent> {
    try {
      const paymentIntent: PaymentIntent = {
        id: `pi_${Date.now()}${Math.random().toString(36).substring(7)}`,
        amount: payment.amount,
        currency: payment.currency,
        status: 'requires_payment_method',
        clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36)}`,
        metadata: payment,
        createdAt: new Date(),
      };

      await AsyncStorage.setItem(`payment_intent_${paymentIntent.id}`, JSON.stringify(paymentIntent));
      return paymentIntent;
    } catch (error) {
      throw error;
    }
  }

  async confirmPaymentWithStripe(paymentIntentId: string, paymentMethodId: string): Promise<PaymentResult> {
    try {
      await this.initialize();
      
      const paymentIntentData = await AsyncStorage.getItem(`payment_intent_${paymentIntentId}`);
      if (!paymentIntentData) {
        return { success: false, error: 'Payment intent not found' };
      }

      const paymentIntent: PaymentIntent = JSON.parse(paymentIntentData);
      
      if (Platform.OS === 'web') {
        return await this.confirmStripeWeb(paymentIntent, paymentMethodId);
      } else {
        return await this.confirmStripeNative(paymentIntent, paymentMethodId);
      }
    } catch (error) {
      return { success: false, error: 'Payment confirmation failed' };
    }
  }

  private async confirmStripeWeb(paymentIntent: PaymentIntent, paymentMethodId: string): Promise<PaymentResult> {
    try {
      if (typeof window === 'undefined' || !window.stripeInstance) {
        throw new Error('Stripe not initialized');
      }

      const result = await window.stripeInstance.confirmCardPayment(paymentIntent.clientSecret!, {
        payment_method: paymentMethodId
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      if (result.paymentIntent?.status === 'succeeded') {
        paymentIntent.status = 'succeeded';
        await AsyncStorage.setItem(`payment_intent_${paymentIntent.id}`, JSON.stringify(paymentIntent));
        return { success: true, paymentId: paymentIntent.id };
      }

      return { success: false, error: 'Payment not completed' };
    } catch (error) {
      return { success: false, error: 'Payment processing failed' };
    }
  }

  private async confirmStripeNative(paymentIntent: PaymentIntent, paymentMethodId: string): Promise<PaymentResult> {
    try {
      const { confirmPayment } = await import('@stripe/stripe-react-native');
      
      const result = await confirmPayment(paymentIntent.clientSecret!, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          paymentMethodId: paymentMethodId
        }
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      if (result.paymentIntent?.status === 'Succeeded') {
        paymentIntent.status = 'succeeded';
        await AsyncStorage.setItem(`payment_intent_${paymentIntent.id}`, JSON.stringify(paymentIntent));
        return { success: true, paymentId: paymentIntent.id };
      }

      return { success: false, error: 'Payment not completed' };
    } catch (error) {
      return { success: false, error: 'Payment processing failed' };
    }
  }

  async processApplePay(payment: SubscriptionPayment | OneTimePayment): Promise<PaymentResult> {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Pay only available on iOS' };
    }

    try {
      const { isApplePaySupported, presentApplePay } = await import('@stripe/stripe-react-native');
      
      const isSupported = await isApplePaySupported();
      if (!isSupported) {
        return { success: false, error: 'Apple Pay not supported on this device' };
      }

      const paymentIntent = await this.createPaymentIntent(payment);
      
      const result = await presentApplePay({
        cartItems: [{
          label: this.getPaymentDescription(payment),
          amount: (payment.amount / 100).toFixed(2),
          paymentType: 'Immediate'
        }],
        country: 'HK',
        currency: payment.currency.toUpperCase(),
        requiredShippingAddressFields: [],
        requiredBillingContactFields: []
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      paymentIntent.status = 'succeeded';
      await AsyncStorage.setItem(`payment_intent_${paymentIntent.id}`, JSON.stringify(paymentIntent));

      return { success: true, paymentId: paymentIntent.id };
    } catch (error) {
      return { success: false, error: 'Apple Pay processing failed' };
    }
  }

  async processGooglePay(payment: SubscriptionPayment | OneTimePayment): Promise<PaymentResult> {
    if (Platform.OS !== 'android') {
      return { success: false, error: 'Google Pay only available on Android' };
    }

    try {
      const { isGooglePaySupported, initGooglePay, presentGooglePay } = await import('@stripe/stripe-react-native');
      
      const isSupported = await isGooglePaySupported();
      if (!isSupported) {
        return { success: false, error: 'Google Pay not supported on this device' };
      }

      await initGooglePay({
        testEnv: __DEV__,
        merchantName: 'Dragon Worlds HK 2027',
        countryCode: 'HK',
        billingAddressConfig: {
          format: 'MIN',
          isPhoneNumberRequired: false,
          isRequired: false
        },
        existingPaymentMethodRequired: false,
        isEmailRequired: false
      });

      const paymentIntent = await this.createPaymentIntent(payment);

      const result = await presentGooglePay({
        clientSecret: paymentIntent.clientSecret!,
        forSetupIntent: false,
        currencyCode: payment.currency.toUpperCase()
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      paymentIntent.status = 'succeeded';
      await AsyncStorage.setItem(`payment_intent_${paymentIntent.id}`, JSON.stringify(paymentIntent));

      return { success: true, paymentId: paymentIntent.id };
    } catch (error) {
      return { success: false, error: 'Google Pay processing failed' };
    }
  }

  async processRefund(refundRequest: RefundRequest): Promise<PaymentResult> {
    try {
      const refundId = `re_${Date.now()}${Math.random().toString(36).substring(7)}`;
      
      const refund = {
        id: refundId,
        paymentId: refundRequest.paymentId,
        amount: refundRequest.amount,
        reason: refundRequest.reason,
        status: 'succeeded',
        createdAt: new Date()
      };

      await AsyncStorage.setItem(`refund_${refundId}`, JSON.stringify(refund));
      
      return { success: true, paymentId: refundId };
    } catch (error) {
      return { success: false, error: 'Refund processing failed' };
    }
  }

  async getPaymentHistory(userId: string, limit = 50): Promise<PaymentIntent[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const paymentIntentKeys = allKeys.filter(key => key.startsWith('payment_intent_'));
      
      const paymentIntents: PaymentIntent[] = [];
      
      for (const key of paymentIntentKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const paymentIntent = JSON.parse(data);
          if (paymentIntent.metadata?.userId === userId) {
            paymentIntents.push(paymentIntent);
          }
        }
      }
      
      return paymentIntents
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  private getPaymentDescription(payment: SubscriptionPayment | OneTimePayment): string {
    if ('subscriptionId' in payment) {
      return `Dragon Worlds HK 2027 - ${payment.planId} Subscription`;
    } else {
      return `Dragon Worlds HK 2027 - ${payment.description}`;
    }
  }

  async validatePayment(paymentId: string): Promise<boolean> {
    try {
      const paymentData = await AsyncStorage.getItem(`payment_intent_${paymentId}`);
      if (!paymentData) return false;
      
      const payment: PaymentIntent = JSON.parse(paymentData);
      return payment.status === 'succeeded';
    } catch (error) {
      return false;
    }
  }

  async getAvailablePaymentMethods(): Promise<string[]> {
    const methods = ['stripe'];
    
    if (Platform.OS === 'ios') {
      try {
        const { isApplePaySupported } = await import('@stripe/stripe-react-native');
        if (await isApplePaySupported()) {
          methods.push('apple_pay');
        }
      } catch (error) {
      }
    }
    
    if (Platform.OS === 'android') {
      try {
        const { isGooglePaySupported } = await import('@stripe/stripe-react-native');
        if (await isGooglePaySupported()) {
          methods.push('google_pay');
        }
      } catch (error) {
      }
    }
    
    return methods;
  }
}

export const paymentGatewayService = new PaymentGatewayService();