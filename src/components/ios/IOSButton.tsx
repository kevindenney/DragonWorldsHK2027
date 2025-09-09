import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors, typography } from '../../constants/theme';

// Apple HIG Button Types
export type IOSButtonVariant = 'filled' | 'tinted' | 'gray' | 'plain';
export type IOSButtonSize = 'large' | 'medium' | 'small';

export interface IOSButtonProps {
  title: string;
  onPress: () => void;
  variant?: IOSButtonVariant;
  size?: IOSButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const IOSButton: React.FC<IOSButtonProps> = ({
  title,
  onPress,
  variant = 'filled',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  testID,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.6}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'filled' ? colors.background : colors.primary} 
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Base button styles
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8, // Apple HIG 8pt corner radius
    paddingHorizontal: 16, // Apple HIG 16pt horizontal padding
    flexDirection: 'row',
  },

  // Sizes - Apple HIG touch targets
  large: {
    height: 50, // Above 44pt minimum
    paddingHorizontal: 20,
  },
  medium: {
    height: 44, // Apple HIG minimum touch target
    paddingHorizontal: 16,
  },
  small: {
    height: 32,
    paddingHorizontal: 12,
  },

  // Variants - Apple HIG button styles
  filled: {
    backgroundColor: colors.primary,
  },
  tinted: {
    backgroundColor: colors.primary + '20', // 20% opacity tint
  },
  gray: {
    backgroundColor: '#F2F2F7', // iOS systemGray6
  },
  plain: {
    backgroundColor: 'transparent',
  },

  // Full width
  fullWidth: {
    width: '100%',
  },

  // Disabled state
  disabled: {
    opacity: 0.4, // Apple HIG disabled opacity
  },

  // Base text styles
  baseText: {
    ...typography.body1,
    fontSize: 17, // Apple HIG Body text size
    fontWeight: '600', // Apple HIG semibold for buttons
    textAlign: 'center',
  },

  // Text variants
  filledText: {
    color: colors.background, // White text on filled buttons
  },
  tintedText: {
    color: colors.primary,
  },
  grayText: {
    color: colors.text,
  },
  plainText: {
    color: colors.primary,
  },

  // Text sizes
  largeText: {
    fontSize: 18,
  },
  mediumText: {
    fontSize: 17, // Apple HIG Body size
  },
  smallText: {
    fontSize: 15,
  },

  // Disabled text
  disabledText: {
    // Opacity handled by parent disabled style
  },
});