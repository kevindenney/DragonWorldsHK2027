/**
 * Toast Component - iOS-style toast notifications
 * Slides in from the top with auto-dismiss
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  X,
} from 'lucide-react-native';
import { useToastStore, ToastVariant } from '../../stores/toastStore';
import { colors } from '../../constants/theme';

const TOAST_HEIGHT = 56;

const VARIANT_CONFIG: Record<ToastVariant, { icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  success: {
    icon: CheckCircle2,
    color: '#34C759',
    bgColor: 'rgba(52, 199, 89, 0.15)',
  },
  info: {
    icon: Info,
    color: '#007AFF',
    bgColor: 'rgba(0, 122, 255, 0.15)',
  },
  warning: {
    icon: AlertTriangle,
    color: '#FF9500',
    bgColor: 'rgba(255, 149, 0, 0.15)',
  },
  error: {
    icon: XCircle,
    color: '#FF3B30',
    bgColor: 'rgba(255, 59, 48, 0.15)',
  },
};

export function Toast() {
  const insets = useSafeAreaInsets();
  const { message, variant, visible, hideToast } = useToastStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  if (!message) return null;

  const config = VARIANT_CONFIG[variant];
  const IconComponent = config.icon;

  const toastContent = (
    <View style={[styles.contentContainer, { backgroundColor: config.bgColor }]}>
      <IconComponent size={20} color={config.color} strokeWidth={2} />
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={hideToast}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={16} color={colors.textMuted} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="systemMaterial" style={styles.blurContainer}>
          {toastContent}
        </BlurView>
      ) : (
        <View style={[styles.androidContainer, { backgroundColor: config.bgColor }]}>
          {toastContent}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  androidContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    elevation: 8,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: TOAST_HEIGHT,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast;
