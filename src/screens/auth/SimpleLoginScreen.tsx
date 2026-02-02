import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../auth/useAuth';
import { SimpleAuthInput } from '../../components/auth/SimpleAuthInput';
import { SimpleAuthButton } from '../../components/auth/SimpleAuthButton';
import { SocialLoginGroup, commonProviderSets } from '../../components/auth/SocialLoginButton';
import { AuthProviderType } from '../../auth/authTypes';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

interface SimpleLoginScreenProps {
  navigation: any;
}

// User-friendly error messages for Firebase auth error codes
const getLoginErrorMessage = (error: any): { title: string; message: string } => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Map Firebase error codes to user-friendly messages
  if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
    return {
      title: 'Incorrect Email or Password',
      message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
    };
  }
  if (errorCode === 'auth/user-not-found') {
    return {
      title: 'Account Not Found',
      message: 'No account exists with this email address. Please check your email or create a new account.',
    };
  }
  if (errorCode === 'auth/invalid-email') {
    return {
      title: 'Invalid Email',
      message: 'Please enter a valid email address.',
    };
  }
  if (errorCode === 'auth/user-disabled') {
    return {
      title: 'Account Disabled',
      message: 'This account has been disabled. Please contact support for assistance.',
    };
  }
  if (errorCode === 'auth/too-many-requests') {
    return {
      title: 'Too Many Attempts',
      message: 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later or reset your password.',
    };
  }
  if (errorCode === 'auth/network-request-failed' || errorMessage.includes('network') || errorMessage.includes('connection')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
    };
  }
  if (errorMessage.includes('timeout')) {
    return {
      title: 'Connection Timeout',
      message: 'The request timed out. Please check your connection and try again.',
    };
  }

  // Default error
  return {
    title: 'Sign In Failed',
    message: 'Unable to sign in. Please check your credentials and try again.',
  };
};

export function SimpleLoginScreen({ navigation }: SimpleLoginScreenProps) {
  const { login, loginWithProvider, isLoading, register, isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState<{ title: string; message: string } | null>(null);

  // Monitor authentication state and navigate away when login succeeds
  useEffect(() => {
    if (isAuthenticated && user) {
      // Add a small delay to show success before navigating
      setTimeout(() => {
        try {
          // Navigate back to the main app (pop the modal)
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            // Fallback: reset to main stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          }
        } catch (navError) {
          // If navigation fails, user can still access the app via tabs
        }
      }, 500);
    }
  }, [isAuthenticated, user, navigation]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password.trim()) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handleLogin = async () => {
    // Clear previous login error
    setLoginError(null);

    // Check if login function is available
    if (!login) {
      return;
    }

    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);

    if (emailValidationError || passwordValidationError) {
      return;
    }

    try {
      await login({ email, password });
    } catch (error: any) {

      // Get user-friendly error message and display inline
      const errorInfo = getLoginErrorMessage(error);
      setLoginError(errorInfo);
    }
  };

  const handleSwitchToRegister = () => {
    try {
      navigation.navigate('Register');
    } catch (error) {
    }
  };

  const handleSocialLogin = async (provider: AuthProviderType) => {
    setLoginError(null);
    try {
      await loginWithProvider(provider);
    } catch (error: any) {
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      setLoginError({
        title: `${providerName} Sign In Failed`,
        message: error.message || `Unable to sign in with ${providerName}. Please try again.`,
      });
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={['#0A1E3D', '#0d2440', '#122b4a']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />

          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
            >
          {/* Header Section */}
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/dragon-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>DragonWorlds HK</Text>
            <Text style={styles.appSubtitle}>2027 Championships</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Sign In</Text>
              <Text style={styles.welcomeSubtitle}>
                Access exclusive race information, weather data, and championship content
              </Text>
            </View>

            {/* Inline Error Banner */}
            {loginError && (
              <View style={styles.errorBanner}>
                <View style={styles.errorIconContainer}>
                  <Text style={styles.errorIcon}>!</Text>
                </View>
                <View style={styles.errorTextContainer}>
                  <Text style={styles.errorTitle}>{loginError.title}</Text>
                  <Text style={styles.errorMessage}>{loginError.message}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setLoginError(null)}
                  style={styles.errorDismiss}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.errorDismissText}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.formFields}>
              <SimpleAuthInput
                label="Email Address"
                type="email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                  if (loginError) setLoginError(null);
                }}
                error={emailError}
                testID="login-email"
              />

              <SimpleAuthInput
                label="Password"
                type="password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                  if (loginError) setLoginError(null);
                }}
                error={passwordError}
                testID="login-password"
              />

              <SimpleAuthButton
                title={isLoading ? 'Signing In...' : 'Sign In'}
                onPress={handleLogin}
                loading={isLoading}
                variant="primary"
                style={styles.loginButton}
                testID="login-submit"
              />

              {/* OAuth Login Options - Temporarily disabled until OAuth is configured */}
              {false && (
                <>
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <SocialLoginGroup
                    providers={commonProviderSets.basic}
                    onPress={handleSocialLogin}
                    disabled={isLoading}
                    title=""
                    testID="login-social-buttons"
                  />
                </>
              )}

              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.registerSection}>
                <Text style={styles.registerPrompt}>Don't have an account?</Text>
                <TouchableOpacity onPress={handleSwitchToRegister}>
                  <Text style={styles.registerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoContainer: {
    width: 48,
    height: 48,
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    tintColor: '#FFFFFF', // White logo on dark navy gradient
  },
  appName: {
    ...typography.h3,
    color: '#FFFFFF', // White text on dark navy gradient
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '700',
  },
  appSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white on dark navy gradient
    textAlign: 'center',
    fontSize: 12,
  },
  formContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.large,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    alignItems: 'flex-start',
  },
  errorIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  errorIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
  },
  errorDismiss: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  errorDismissText: {
    fontSize: 20,
    color: '#B91C1C',
    fontWeight: '300',
    lineHeight: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '600',
    fontSize: 20,
  },
  welcomeSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
    fontSize: 12,
  },
  formFields: {
    width: '100%',
  },
  loginButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  forgotPasswordText: {
    ...typography.caption,
    color: '#4A9EFF', // Brighter blue for better visibility on white card
    fontWeight: '500',
    fontSize: 14,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  registerPrompt: {
    ...typography.caption,
    color: colors.textMuted,
    marginRight: spacing.xs,
    fontSize: 14, // Fixed: Changed from 13px to 14px
  },
  registerLink: {
    ...typography.caption,
    color: '#4A9EFF', // Brighter blue for better visibility
    fontWeight: '600',
    fontSize: 14, // Fixed: Changed from 13px to 14px
  },
});