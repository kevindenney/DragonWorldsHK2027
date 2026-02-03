import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { AuthProvider } from '../../auth/authTypes';

// DEBUG: Log AuthProvider import to validate type and properties

// Social login brand colors and configurations
const socialConfigs = {
  [AuthProvider.GOOGLE]: {
    name: 'Google',
    backgroundColor: '#ffffff',
    textColor: '#1f1f1f',
    borderColor: '#dadce0',
    iconComponent: AntDesign,
    iconName: 'google',
    iconColor: '#4285F4',
    accessibilityHint: 'Sign in with your Google account',
  },
  [AuthProvider.APPLE]: {
    name: 'Apple',
    backgroundColor: '#000000',
    textColor: '#ffffff',
    borderColor: '#000000',
    iconComponent: AntDesign,
    iconName: 'apple1',
    iconColor: '#ffffff',
    accessibilityHint: 'Sign in with your Apple ID',
  },
  [AuthProvider.FACEBOOK]: {
    name: 'Facebook',
    backgroundColor: '#1877f2',
    textColor: '#ffffff',
    borderColor: '#1877f2',
    iconComponent: FontAwesome,
    iconName: 'facebook',
    iconColor: '#ffffff',
    accessibilityHint: 'Sign in with your Facebook account',
  },
  [AuthProvider.GITHUB]: {
    name: 'GitHub',
    backgroundColor: '#24292e',
    textColor: '#ffffff',
    borderColor: '#24292e',
    iconComponent: AntDesign,
    iconName: 'github',
    iconColor: '#ffffff',
    accessibilityHint: 'Sign in with your GitHub account',
  },
}; // Removed 'as const' to avoid Hermes property descriptor conflicts

export interface SocialLoginButtonProps {
  provider: AuthProvider;
  onPress: (provider: AuthProvider) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  customText?: string;
  testID?: string;
}

export function SocialLoginButton({
  provider,
  onPress,
  disabled = false,
  loading = false,
  variant = 'outlined',
  size = 'medium',
  showIcon = true,
  customText,
  testID,
}: SocialLoginButtonProps) {
  const config = socialConfigs[provider];
  
  if (!config) {
    return null;
  }

  // Check if provider is available on current platform
  if (provider === AuthProvider.APPLE && Platform.OS !== 'ios') {
    return null;
  }

  const buttonText = customText || `Continue with ${config.name}`;
  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`]];
    
    if (variant === 'filled') {
      baseStyle.push({
        backgroundColor: isDisabled ? colors.border : config.backgroundColor,
        borderColor: isDisabled ? colors.border : config.borderColor,
      });
    } else {
      baseStyle.push({
        backgroundColor: colors.background,
        borderColor: isDisabled ? colors.border : config.borderColor,
      });
    }

    if (isDisabled) {
      baseStyle.push(styles.buttonDisabled);
    } else {
      baseStyle.push(shadows.button);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`]];
    
    if (variant === 'filled') {
      baseStyle.push({
        color: isDisabled ? colors.textMuted : config.textColor,
      });
    } else {
      baseStyle.push({
        color: isDisabled ? colors.textMuted : config.textColor === '#ffffff' ? colors.text : config.textColor,
      });
    }

    return baseStyle;
  };

  const handlePress = () => {
    if (!isDisabled) {
      onPress(provider);
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={isDisabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={buttonText}
      accessibilityHint={config.accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      testID={testID || `social-login-${provider}`}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'filled' ? config.textColor : colors.primary}
            style={styles.spinner}
          />
        ) : (
          showIcon && (
            <View style={styles.iconContainer}>
              <config.iconComponent
                name={config.iconName}
                size={18}
                color={config.iconColor}
              />
            </View>
          )
        )}
        
        <Text style={getTextStyle()}>
          {loading ? 'Signing in...' : buttonText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export interface SocialLoginGroupProps {
  providers: AuthProvider[];
  onPress: (provider: AuthProvider) => void;
  disabled?: boolean;
  loading?: boolean;
  loadingProvider?: AuthProvider;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  title?: string;
  testID?: string;
}

export function SocialLoginGroup({
  providers,
  onPress,
  disabled = false,
  loading = false,
  loadingProvider,
  variant = 'outlined',
  size = 'medium',
  title = 'Or continue with',
  testID,
}: SocialLoginGroupProps) {
  const availableProviders = providers.filter(provider => {
    // Filter out Apple on non-iOS platforms
    if (provider === AuthProvider.APPLE && Platform.OS !== 'ios') {
      return false;
    }
    return socialConfigs[provider];
  });

  if (availableProviders.length === 0) {
    return null;
  }

  return (
    <View style={styles.group} testID={testID}>
      {title && (
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{title}</Text>
          <View style={styles.dividerLine} />
        </View>
      )}
      
      <View style={styles.buttonGroup}>
        {availableProviders.map((provider) => (
          <SocialLoginButton
            key={provider}
            provider={provider}
            onPress={onPress}
            disabled={disabled}
            loading={loading && loadingProvider === provider}
            variant={variant}
            size={size}
            testID={`${testID}-${provider}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  buttonSmall: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  buttonMedium: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 42,
  },
  buttonLarge: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.xs,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: spacing.xs,
  },
  text: {
    ...typography.button,
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  group: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.body2,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
  },
  buttonGroup: {
    width: '100%',
  },
});

// Export commonly used provider configurations for convenience
export const commonProviderSets = {
  basic: [AuthProvider.GOOGLE, AuthProvider.APPLE],
  full: [AuthProvider.GOOGLE, AuthProvider.APPLE, AuthProvider.FACEBOOK],
  developer: [AuthProvider.GOOGLE, AuthProvider.APPLE, AuthProvider.GITHUB],
}; // Removed 'as const' to avoid Hermes property descriptor conflicts