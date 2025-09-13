import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Service for managing push notifications with Firebase Cloud Messaging
 */
export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service and configure handlers
   */
  async initialize(): Promise<void> {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data;
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: data?.priority === 'emergency' || data?.priority === 'urgent',
          shouldSetBadge: true,
        };
      },
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      await this.createNotificationChannels();
    }

    // Set up notification listeners
    this.setupNotificationListeners();

    console.log('📱 Notification service initialized');
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(userId?: string): Promise<string | null> {
    try {
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return null;
      }

      // Get existing permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
        return null;
      }

      // Get the Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      });

      this.expoPushToken = token.data;
      console.log('✅ Got Expo push token:', token.data);

      // Store token in Firestore for the user
      if (userId) {
        await this.updateUserPushToken(userId, token.data);
      }

      return token.data;

    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Update user's push token in Firestore
   */
  private async updateUserPushToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        tokenUpdatedAt: new Date().toISOString(),
        notificationsEnabled: true
      });
      
      console.log('✅ Updated user push token in Firestore');
    } catch (error) {
      console.error('❌ Error updating user push token:', error);
    }
  }

  /**
   * Create notification channels for Android
   */
  private async createNotificationChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('emergency_notices', {
      name: 'Emergency Race Notices',
      description: 'Urgent sailing notices and safety alerts',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF3B30',
    });

    await Notifications.setNotificationChannelAsync('general_notices', {
      name: 'Race Notices',
      description: 'General race updates and announcements',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('protests', {
      name: 'Protest Notices',
      description: 'Protest and hearing notifications',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    console.log('📢 Created Android notification channels');
  }

  /**
   * Set up notification event listeners
   */
  private setupNotificationListeners(): void {
    // Listener for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification);
      
      const data = notification.request.content.data;
      
      // Handle different types of notices
      this.handleNotificationReceived(notification, data);
    });

    // Listener for when user taps a notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle notification tap
      this.handleNotificationTapped(data);
    });
  }

  /**
   * Handle notification received while app is running
   */
  private handleNotificationReceived(notification: any, data: any): void {
    // You could show an in-app banner or update badge count here
    if (data?.priority === 'emergency') {
      // For emergency notices, we might want to show a modal or sound an alarm
      console.log('🚨 Emergency notice received!');
    }
  }

  /**
   * Handle notification tap - navigate to relevant screen
   */
  private handleNotificationTapped(data: any): void {
    if (data?.noticeId && data?.eventId) {
      // Navigate to notice detail screen
      console.log(`🔔 Opening notice ${data.noticeId} for event ${data.eventId}`);
      
      // You would implement navigation here, for example:
      // NavigationService.navigate('NoticeDetail', { noticeId: data.noticeId });
    }
  }

  /**
   * Send a local notification (for testing purposes)
   */
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    console.log('🧹 Cleared all notifications');
  }

  /**
   * Get notification permission status
   */
  async getPermissionStatus(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Enable/disable notifications for the user
   */
  async setNotificationsEnabled(userId: string, enabled: boolean): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationsEnabled: enabled,
        notificationSettingsUpdatedAt: new Date().toISOString()
      });
      
      console.log(`${enabled ? '🔔' : '🔕'} Notifications ${enabled ? 'enabled' : 'disabled'} for user`);
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences for different types
   */
  async updateNotificationPreferences(userId: string, preferences: {
    emergency?: boolean;
    protests?: boolean;
    weather?: boolean;
    courseChanges?: boolean;
    general?: boolean;
  }): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationPreferences: preferences,
        notificationSettingsUpdatedAt: new Date().toISOString()
      });
      
      console.log('⚙️ Updated notification preferences for user');
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    
    console.log('🧹 Notification service cleaned up');
  }
}

export default NotificationService;