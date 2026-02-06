import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X,
  Wifi,
  WifiOff 
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationConfig {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  testID?: string;
}

export interface NotificationProps extends NotificationConfig {
  onHide: (id: string) => void;
  index: number;
}

export function Notification({
  id,
  type,
  title,
  message,
  duration = 4000,
  persistent = false,
  action,
  onDismiss,
  onHide,
  index,
  testID,
}: NotificationProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide if not persistent
    if (!persistent && duration > 0) {
      // Progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start();

      timeoutRef.current = setTimeout(() => {
        hideNotification();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hideNotification = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
      onHide(id);
    });
  };

  const getIcon = () => {
    const iconSize = 20;
    const iconColor = getConfig().iconColor;

    switch (type) {
      case 'success':
        return <CheckCircle size={iconSize} color={iconColor} />;
      case 'error':
        return <AlertCircle size={iconSize} color={iconColor} />;
      case 'warning':
        return <AlertTriangle size={iconSize} color={iconColor} />;
      case 'info':
      default:
        return <Info size={iconSize} color={iconColor} />;
    }
  };

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success + '20',
          borderColor: colors.success,
          iconColor: colors.success,
          textColor: colors.success,
        };
      case 'error':
        return {
          backgroundColor: colors.error + '20',
          borderColor: colors.error,
          iconColor: colors.error,
          textColor: colors.error,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning + '20',
          borderColor: colors.warning,
          iconColor: colors.warning,
          textColor: colors.warning,
        };
      case 'info':
      default:
        return {
          backgroundColor: colors.info + '20',
          borderColor: colors.info,
          iconColor: colors.info,
          textColor: colors.info,
        };
    }
  };

  const config = getConfig();
  const topOffset = index * 70 + 50; // Stack notifications

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
          top: topOffset,
        },
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.textColor }]}>
            {title}
          </Text>
          {message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {action && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: config.borderColor }]}
              onPress={() => {
                action.onPress();
                hideNotification();
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text style={[styles.actionText, { color: config.textColor }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideNotification}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close notification"
            testID={`${testID}-close`}
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {!persistent && duration > 0 && (
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: config.borderColor,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

export interface AuthNotificationProps {
  type: 'login_success' | 'login_error' | 'logout' | 'registration_success' | 
        'password_reset' | 'verification_sent' | 'profile_updated' | 'connection_lost' | 
        'connection_restored';
  message?: string;
  onDismiss?: () => void;
  testID?: string;
}

export function AuthNotification({ type, message, onDismiss, testID }: AuthNotificationProps) {
  const getNotificationConfig = (): Omit<NotificationConfig, 'id'> => {
    switch (type) {
      case 'login_success':
        return {
          type: 'success',
          title: 'Welcome back!',
          message: message || 'You have successfully signed in.',
          duration: 3000,
        };
      
      case 'login_error':
        return {
          type: 'error',
          title: 'Sign in failed',
          message: message || 'Please check your credentials and try again.',
          duration: 5000,
          action: {
            label: 'Retry',
            onPress: () => {
              // Handle retry logic
            },
          },
        };

      case 'logout':
        return {
          type: 'info',
          title: 'Signed out',
          message: message || 'You have been signed out successfully.',
          duration: 2000,
        };

      case 'registration_success':
        return {
          type: 'success',
          title: 'Account created!',
          message: message || 'Welcome to Dragon Worlds HK 2027.',
          duration: 4000,
        };

      case 'password_reset':
        return {
          type: 'info',
          title: 'Password reset sent',
          message: message || 'Check your email for reset instructions.',
          duration: 5000,
        };

      case 'verification_sent':
        return {
          type: 'info',
          title: 'Verification email sent',
          message: message || 'Please check your email and follow the verification link.',
          duration: 6000,
        };

      case 'profile_updated':
        return {
          type: 'success',
          title: 'Profile updated',
          message: message || 'Your profile has been saved successfully.',
          duration: 3000,
        };

      case 'connection_lost':
        return {
          type: 'warning',
          title: 'Connection lost',
          message: message || 'Please check your internet connection.',
          persistent: true,
        };

      case 'connection_restored':
        return {
          type: 'success',
          title: 'Connection restored',
          message: message || 'You are back online.',
          duration: 2000,
        };

      default:
        return {
          type: 'info',
          title: 'Notification',
          message: message || '',
          duration: 3000,
        };
    }
  };

  const config = getNotificationConfig();

  return (
    <Notification
      {...config}
      id={type}
      onHide={() => {}}
      index={0}
      onDismiss={onDismiss}
      testID={testID}
    />
  );
}

export function ConnectionStatus({ isOnline }: { isOnline: boolean }) {
  const slideAnim = useRef(new Animated.Value(isOnline ? -50 : 0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? -50 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  if (isOnline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.connectionBanner,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <WifiOff size={16} color={colors.background} />
      <Text style={styles.connectionText}>
        No internet connection
      </Text>
    </Animated.View>
  );
}

// Notification context for managing global notifications
interface NotificationContextType {
  showNotification: (config: Omit<NotificationConfig, 'id'>) => string;
  hideNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = React.createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<NotificationConfig[]>([]);

  const showNotification = (config: Omit<NotificationConfig, 'id'>): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: NotificationConfig = { ...config, id };
    
    setNotifications(prev => [...prev, notification]);
    return id;
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification, clearAll }}>
      {children}
      <View style={styles.notificationContainer} pointerEvents="box-none">
        {notifications.map((notification, index) => (
          <Notification
            key={notification.id}
            {...notification}
            onHide={hideNotification}
            index={index}
          />
        ))}
      </View>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    ...shadows.large,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.md,
    paddingTop: spacing.xs,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body2,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  actionText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    borderRadius: 1,
  },
  connectionBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.md,
    zIndex: 10000,
  },
  connectionText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
    marginLeft: spacing.sm,
    textTransform: 'uppercase',
  },
});