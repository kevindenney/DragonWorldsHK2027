import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
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

export function SimpleLoginScreen({ navigation }: SimpleLoginScreenProps) {
  const { login, loginWithProvider, isLoading, register, isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
          console.error('[SimpleLoginScreen] Navigation failed:', navError);
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
    // Check if login function is available
    if (!login) {
      console.error('[SimpleLoginScreen] login function not available');
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
      console.error('[SimpleLoginScreen] Login failed:', error);

      // Provide specific error messages based on error type
      let title = 'Unable to Sign In';
      let message = 'Please check your credentials and try again.';

      if (error?.message) {
        if (error.message.includes('timeout')) {
          title = 'Connection Timeout';
          message = 'The login request timed out. Please check your internet connection and try again.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          title = 'Connection Problem';
          message = 'Unable to connect to the authentication service. Please check your internet connection.';
        } else if (error.message.includes('user-not-found')) {
          title = 'Account Not Found';
          message = 'No account found with this email address. Please check your email or sign up.';
        } else if (error.message.includes('wrong-password')) {
          title = 'Incorrect Password';
          message = 'The password is incorrect. Please try again or reset your password.';
        } else if (error.message.includes('too-many-requests')) {
          title = 'Too Many Attempts';
          message = 'Too many failed login attempts. Please wait a few minutes and try again.';
        } else {
          message = error.message;
        }
      }

      Alert.alert(title, message);
    }
  };

  const handleSwitchToRegister = () => {
    try {
      navigation.navigate('Register');
    } catch (error) {
      console.error('[SimpleLoginScreen] Navigation to Register failed:', error);
    }
  };

  const handleSocialLogin = async (provider: AuthProviderType) => {
    try {
      await loginWithProvider(provider);
    } catch (error: any) {
      Alert.alert(
        'Unable to Sign In',
        error.message || `${provider} sign-in failed. Please try again.`
      );
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

            <View style={styles.formFields}>
              <SimpleAuthInput
                label="Email Address"
                type="email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
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