import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

export interface SimpleAuthButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'inverse';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  testID?: string;
}

export function SimpleAuthButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  testID,
}: SimpleAuthButtonProps) {
  const isDisabled = disabled || loading;

  const variantButtonStyles = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    outline: styles.buttonOutline,
    text: styles.buttonText,
    inverse: styles.buttonInverse,
  };

  const variantTextStyles = {
    primary: styles.textPrimary,
    secondary: styles.textSecondary,
    outline: styles.textOutline,
    text: styles.textText,
    inverse: styles.textInverse,
  };

  const buttonStyle = [
    styles.button,
    variant !== 'text' && shadows.button,
    variantButtonStyles[variant],
    isDisabled && styles.buttonDisabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    variantTextStyles[variant],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  const getLoadingColor = () => {
    switch (variant) {
      case 'primary':
        return colors.background;
      case 'secondary':
        return colors.text;
      case 'inverse':
        return '#0A1E3D';
      case 'outline':
      case 'text':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
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
      {loading && (
        <ActivityIndicator
          size="small"
          color={getLoadingColor()}
          style={styles.loader}
        />
      )}

      <Text style={textStyleCombined}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    marginVertical: spacing.xs,
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
  buttonInverse: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
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
  textInverse: {
    color: '#0A1E3D',
  },
  textDisabled: {
    opacity: 0.7,
  },
  loader: {
    marginRight: spacing.sm,
  },
});