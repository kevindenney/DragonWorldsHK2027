import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { subscriptionService, SubscriptionTier } from './subscriptionService';
import { WeatherAPIError } from './weatherAPI';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Notification types and interfaces
export interface NotificationPreferences {
  weatherAlerts: boolean;
  raceUpdates: boolean;
  scheduleChanges: boolean;
  subscriptionReminders: boolean;
  crossPromotions: boolean;
  severityThreshold: 'all' | 'moderate' | 'severe';
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
}

export interface WeatherAlert {
  id: string;
  type: 'wind' | 'weather' | 'marine' | 'race_condition';
  severity: 'info' | 'moderate' | 'severe' | 'critical';
  title: string;
  message: string;
  threshold: number;
  currentValue: number;
  location: string;
  validFrom: string;
  validTo: string;
  requiresSubscription: boolean;
}

export interface RaceNotification {
  id: string;
  type: 'race_start' | 'schedule_change' | 'results_posted' | 'protest_deadline';
  raceId: string;
  title: string;
  message: string;
  scheduledTime: string;
  location?: string;
  requiresSubscription: boolean;
}

export interface SubscriptionNotification {
  id: string;
  type: 'trial_ending' | 'renewal_reminder' | 'upgrade_offer' | 'cross_promotion';
  title: string;
  message: string;
  actionUrl?: string;
  expiresAt?: string;
}

export interface NotificationSchedule {
  id: string;
  type: 'weather' | 'race' | 'subscription';
  scheduledTime: Date;
  notification: WeatherAlert | RaceNotification | SubscriptionNotification;
  recurring?: {
    interval: 'daily' | 'weekly' | 'race_day';
    endDate?: Date;
  };
}

// Notification service class
export class NotificationService {
  private expoPushToken: string | null = null;
  private preferences: NotificationPreferences;
  private scheduledNotifications: Map<string, NotificationSchedule> = new Map();
  
  // Default weather alert thresholds
  private readonly WEATHER_THRESHOLDS = {
    wind: {
      moderate: 20, // knots
      severe: 30,
      critical: 40
    },
    gust: {
      moderate: 25,
      severe: 35,
      critical: 45
    },
    wave: {
      moderate: 1.5, // meters
      severe: 2.5,
      critical: 4.0
    },
    visibility: {
      moderate: 5, // km
      severe: 2,
      critical: 1
    }
  };

  constructor() {
    this.preferences = {
      weatherAlerts: true,
      raceUpdates: true,
      scheduleChanges: true,
      subscriptionReminders: true,
      crossPromotions: false,
      severityThreshold: 'moderate',
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00'
      }
    };
    this.loadPreferences();
  }

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return false;
      }

      // Get push token
      this.expoPushToken = await this.getPushToken();
      
      // Set up notification categories
      await this.setupNotificationCategories();
      
      console.log('Notification service initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  // Get Expo push token
  private async getPushToken(): Promise<string> {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID
    });
    return token.data;
  }

  // Set up notification categories with actions
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('weather_alert', [
      {
        identifier: 'view_weather',
        buttonTitle: 'View Weather',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false }
      }
    ]);

    await Notifications.setNotificationCategoryAsync('race_update', [
      {
        identifier: 'view_race',
        buttonTitle: 'View Race',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'add_calendar',
        buttonTitle: 'Add to Calendar',
        options: { opensAppToForeground: false }
      }
    ]);

    await Notifications.setNotificationCategoryAsync('subscription', [
      {
        identifier: 'upgrade',
        buttonTitle: 'Upgrade',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'remind_later',
        buttonTitle: 'Remind Later',
        options: { opensAppToForeground: false }
      }
    ]);
  }

  // Weather alert notifications
  async sendWeatherAlert(alert: WeatherAlert): Promise<boolean> {
    if (!this.preferences.weatherAlerts) return false;
    if (!this.canSendAtCurrentTime()) return false;
    
    // Check subscription requirement
    if (alert.requiresSubscription) {
      const subscription = await subscriptionService.getSubscriptionStatus();
      if (!subscription.active) return false;
    }

    // Check severity threshold
    if (!this.meetsSeverityThreshold(alert.severity)) return false;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ ${alert.title}`,
          body: alert.message,
          data: {
            type: 'weather_alert',
            alertId: alert.id,
            location: alert.location,
            severity: alert.severity
          },
          categoryIdentifier: 'weather_alert',
          sound: alert.severity === 'critical' ? 'default' : undefined
        },
        trigger: null // Send immediately
      });

      console.log(`Weather alert sent: ${notificationId}`);
      return true;

    } catch (error) {
      console.error('Failed to send weather alert:', error);
      return false;
    }
  }

  // Schedule weather alerts based on conditions
  async scheduleWeatherAlerts(weatherData: any): Promise<void> {
    const alerts: WeatherAlert[] = [];

    // Check wind conditions
    if (weatherData.wind) {
      const windSpeed = weatherData.wind.speed;
      const windGust = weatherData.wind.gust;

      if (windSpeed >= this.WEATHER_THRESHOLDS.wind.critical) {
        alerts.push({
          id: `wind_critical_${Date.now()}`,
          type: 'wind',
          severity: 'critical',
          title: 'Critical Wind Alert',
          message: `Extreme wind conditions: ${windSpeed} knots with gusts to ${windGust} knots. Racing may be suspended.`,
          threshold: this.WEATHER_THRESHOLDS.wind.critical,
          currentValue: windSpeed,
          location: 'Racing Area',
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          requiresSubscription: false
        });
      } else if (windSpeed >= this.WEATHER_THRESHOLDS.wind.severe) {
        alerts.push({
          id: `wind_severe_${Date.now()}`,
          type: 'wind',
          severity: 'severe',
          title: 'Strong Wind Warning',
          message: `Strong wind conditions: ${windSpeed} knots. Challenging racing conditions expected.`,
          threshold: this.WEATHER_THRESHOLDS.wind.severe,
          currentValue: windSpeed,
          location: 'Racing Area',
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          requiresSubscription: true
        });
      }
    }

    // Check wave conditions
    if (weatherData.waves && weatherData.waves.height >= this.WEATHER_THRESHOLDS.wave.severe) {
      alerts.push({
        id: `wave_severe_${Date.now()}`,
        type: 'marine',
        severity: 'severe',
        title: 'High Wave Warning',
        message: `Significant wave height: ${weatherData.waves.height}m. Challenging conditions for smaller boats.`,
        threshold: this.WEATHER_THRESHOLDS.wave.severe,
        currentValue: weatherData.waves.height,
        location: 'Racing Area',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        requiresSubscription: true
      });
    }

    // Check visibility
    if (weatherData.visibility && weatherData.visibility <= this.WEATHER_THRESHOLDS.visibility.severe) {
      alerts.push({
        id: `visibility_severe_${Date.now()}`,
        type: 'weather',
        severity: 'severe',
        title: 'Poor Visibility Warning',
        message: `Visibility reduced to ${weatherData.visibility}km. Navigation may be challenging.`,
        threshold: this.WEATHER_THRESHOLDS.visibility.severe,
        currentValue: weatherData.visibility,
        location: 'Racing Area',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        requiresSubscription: true
      });
    }

    // Send alerts
    for (const alert of alerts) {
      await this.sendWeatherAlert(alert);
    }
  }

  // Race notification methods
  async sendRaceNotification(notification: RaceNotification): Promise<boolean> {
    if (!this.preferences.raceUpdates && notification.type !== 'schedule_change') return false;
    if (!this.preferences.scheduleChanges && notification.type === 'schedule_change') return false;
    if (!this.canSendAtCurrentTime()) return false;

    // Check subscription requirement
    if (notification.requiresSubscription) {
      const subscription = await subscriptionService.getSubscriptionStatus();
      if (!subscription.active) return false;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: {
            type: 'race_notification',
            raceId: notification.raceId,
            notificationType: notification.type
          },
          categoryIdentifier: 'race_update'
        },
        trigger: null
      });

      console.log(`Race notification sent: ${notificationId}`);
      return true;

    } catch (error) {
      console.error('Failed to send race notification:', error);
      return false;
    }
  }

  // Schedule race start reminders
  async scheduleRaceReminders(raceId: string, startTime: Date, raceName: string): Promise<void> {
    const now = new Date();
    const raceStart = new Date(startTime);
    
    // 24 hour reminder
    const day_before = new Date(raceStart.getTime() - 24 * 60 * 60 * 1000);
    if (day_before > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏁 Race Tomorrow',
          body: `${raceName} starts tomorrow at ${raceStart.toLocaleTimeString()}`,
          data: { type: 'race_reminder', raceId, timing: '24h' }
        },
        trigger: { date: day_before }
      });
    }

    // 2 hour reminder
    const two_hours = new Date(raceStart.getTime() - 2 * 60 * 60 * 1000);
    if (two_hours > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Race in 2 Hours',
          body: `${raceName} starts at ${raceStart.toLocaleTimeString()}`,
          data: { type: 'race_reminder', raceId, timing: '2h' }
        },
        trigger: { date: two_hours }
      });
    }

    // 30 minute reminder
    const thirty_minutes = new Date(raceStart.getTime() - 30 * 60 * 1000);
    if (thirty_minutes > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Race Starting Soon',
          body: `${raceName} starts in 30 minutes!`,
          data: { type: 'race_reminder', raceId, timing: '30m' }
        },
        trigger: { date: thirty_minutes }
      });
    }
  }

  // Subscription notification methods
  async sendSubscriptionNotification(notification: SubscriptionNotification): Promise<boolean> {
    if (!this.preferences.subscriptionReminders && notification.type !== 'cross_promotion') return false;
    if (!this.preferences.crossPromotions && notification.type === 'cross_promotion') return false;
    if (!this.canSendAtCurrentTime()) return false;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: {
            type: 'subscription_notification',
            subscriptionType: notification.type,
            actionUrl: notification.actionUrl
          },
          categoryIdentifier: 'subscription'
        },
        trigger: null
      });

      console.log(`Subscription notification sent: ${notificationId}`);
      return true;

    } catch (error) {
      console.error('Failed to send subscription notification:', error);
      return false;
    }
  }

  // Monitor subscription status and send appropriate notifications
  async monitorSubscriptionStatus(): Promise<void> {
    const subscription = await subscriptionService.getSubscriptionStatus();
    
    // Trial ending notification
    if (subscription.isTrial && subscription.trialEndsAt) {
      const trialEnd = new Date(subscription.trialEndsAt);
      const now = new Date();
      const daysUntilEnd = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilEnd === 3) {
        await this.sendSubscriptionNotification({
          id: 'trial_ending_3d',
          type: 'trial_ending',
          title: 'Trial Ending Soon',
          message: 'Your 7-day free trial ends in 3 days. Upgrade to continue accessing premium weather features.',
          actionUrl: 'dragonworlds://subscription/upgrade'
        });
      } else if (daysUntilEnd === 1) {
        await this.sendSubscriptionNotification({
          id: 'trial_ending_1d',
          type: 'trial_ending',
          title: 'Trial Ends Tomorrow',
          message: 'Your free trial ends tomorrow. Upgrade now to maintain access to professional weather data.',
          actionUrl: 'dragonworlds://subscription/upgrade'
        });
      }
    }

    // Renewal reminder
    if (subscription.active && !subscription.isTrial && subscription.expiresAt) {
      const expiryDate = new Date(subscription.expiresAt);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry === 7) {
        await this.sendSubscriptionNotification({
          id: 'renewal_reminder_7d',
          type: 'renewal_reminder',
          title: 'Subscription Renewal',
          message: 'Your subscription renews in 7 days. Manage your subscription in Settings.',
          actionUrl: 'dragonworlds://subscription/manage'
        });
      }
    }
  }

  // Cross-promotion for TacticalWind Pro
  async sendTacticalWindPromotion(): Promise<void> {
    const subscription = await subscriptionService.getSubscriptionStatus();
    
    // Only promote to Basic subscribers during championships
    if (subscription.tier !== SubscriptionTier.BASIC) return;
    
    await this.sendSubscriptionNotification({
      id: 'tacticalwind_promo',
      type: 'cross_promotion',
      title: '⛵ TacticalWind Pro Available',
      message: 'Get advanced wind analysis and racing tactics with TacticalWind Pro. Special discount for Dragon Worlds participants.',
      actionUrl: 'https://tacticalwind.app/dragonworlds'
    });
  }

  // Preference management
  async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...newPreferences };
    await this.savePreferences();
  }

  async getPreferences(): Promise<NotificationPreferences> {
    return { ...this.preferences };
  }

  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_preferences');
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error);
    }
  }

  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save notification preferences:', error);
    }
  }

  // Helper methods
  private canSendAtCurrentTime(): boolean {
    if (!this.preferences.quietHours.enabled) return true;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    // Handle overnight quiet hours
    if (startTime > endTime) {
      return !(currentTime >= startTime || currentTime <= endTime);
    } else {
      return !(currentTime >= startTime && currentTime <= endTime);
    }
  }

  private meetsSeverityThreshold(severity: string): boolean {
    const thresholds = ['info', 'moderate', 'severe', 'critical'];
    const severityIndex = thresholds.indexOf(severity);
    const preferenceIndex = thresholds.indexOf(this.preferences.severityThreshold);
    return severityIndex >= preferenceIndex;
  }

  // Utility methods
  async clearAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledNotifications.clear();
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Test notification (development only)
  async sendTestNotification(): Promise<void> {
    if (__DEV__) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Dragon Worlds Test',
          body: 'Notification service is working correctly!',
        },
        trigger: null,
      });
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types
export type {
  NotificationPreferences,
  WeatherAlert,
  RaceNotification,
  SubscriptionNotification,
  NotificationSchedule
};