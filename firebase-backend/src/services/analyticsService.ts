import { logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { analytics } from '../firebase';

export interface CustomEventParams {
  [key: string]: any;
}

export class AnalyticsService {
  static logCustomEvent(eventName: string, parameters?: CustomEventParams): void {
    if (!analytics) {
      console.warn('Analytics not initialized. Skipping event logging.');
      return;
    }

    try {
      logEvent(analytics, eventName, parameters);
    } catch (error) {
      console.error('Error logging custom event:', error);
    }
  }

  static logUserRegistration(method: string): void {
    this.logCustomEvent('sign_up', {
      method: method
    });
  }

  static logUserLogin(method: string): void {
    this.logCustomEvent('login', {
      method: method
    });
  }

  static logScreenView(screenName: string, screenClass?: string): void {
    this.logCustomEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName
    });
  }

  static logSearch(searchTerm: string): void {
    this.logCustomEvent('search', {
      search_term: searchTerm
    });
  }

  static logShare(contentType: string, contentId: string): void {
    this.logCustomEvent('share', {
      content_type: contentType,
      content_id: contentId
    });
  }

  static logPurchase(transactionId: string, value: number, currency: string = 'USD'): void {
    this.logCustomEvent('purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency
    });
  }

  static logAppOpen(): void {
    this.logCustomEvent('app_open');
  }

  static logEngagement(engagementTimeMs: number): void {
    this.logCustomEvent('user_engagement', {
      engagement_time_msec: engagementTimeMs
    });
  }

  static setUserProperty(propertyName: string, propertyValue: string): void {
    if (!analytics) {
      console.warn('Analytics not initialized. Skipping user property setting.');
      return;
    }

    try {
      setUserProperties(analytics, {
        [propertyName]: propertyValue
      });
    } catch (error) {
      console.error('Error setting user property:', error);
    }
  }

  static setAnalyticsUserId(userId: string): void {
    if (!analytics) {
      console.warn('Analytics not initialized. Skipping user ID setting.');
      return;
    }

    try {
      setUserId(analytics, userId);
    } catch (error) {
      console.error('Error setting analytics user ID:', error);
    }
  }

  static logSailingEvent(eventType: 'race_start' | 'race_finish' | 'course_view' | 'weather_check', additionalParams?: CustomEventParams): void {
    this.logCustomEvent(`sailing_${eventType}`, {
      category: 'sailing',
      ...additionalParams
    });
  }

  static logDragonWorldsEvent(eventType: string, additionalParams?: CustomEventParams): void {
    this.logCustomEvent(`dragonworlds_${eventType}`, {
      category: 'dragonworlds_hk2027',
      ...additionalParams
    });
  }
}