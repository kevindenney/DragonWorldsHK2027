import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

export interface AuthButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export function AuthButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  testID,
}: AuthButtonProps) {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle = [
      styles.button,
      styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
      styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    ];

    if (isDisabled) {
      baseStyle.push(styles.buttonDisabled);
    } else if (variant !== 'text') {
      baseStyle.push(shadows.button);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle = [
      styles.text,
      styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`],
      styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    ];

    if (isDisabled) {
      baseStyle.push(styles.textDisabled);
    }

    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  const getLoadingColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.background;
      case 'secondary':
        return colors.text;
      case 'outline':
      case 'text':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      testID={testID}
    >
      {leftIcon && !loading && leftIcon}
      
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getLoadingColor()}
          style={leftIcon ? styles.iconSpacing : undefined}
        />
      ) : null}
      
      <Text style={getTextStyle()}>
        {loading ? 'Loading...' : title}
      </Text>
      
      {rightIcon && !loading && rightIcon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    marginVertical: spacing.xs,
  },
  buttonSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  buttonMedium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  buttonLarge: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
    borderWidth: 0,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  buttonDanger: {
    backgroundColor: colors.error,
    borderWidth: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMedium: {
    fontSize: 16,
    lineHeight: 22,
  },
  textLarge: {
    fontSize: 18,
    lineHeight: 24,
  },
  textPrimary: {
    color: colors.background,
  },
  textSecondary: {
    color: colors.text,
  },
  textOutline: {
    color: colors.primary,
  },
  textText: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.background,
  },
  textDisabled: {
    opacity: 0.7,
  },
  iconSpacing: {
    marginRight: spacing.sm,
  },
});