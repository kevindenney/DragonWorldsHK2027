import React, { useState } from 'react';
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
  const { login, loginWithProvider, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
      Alert.alert(
        'Unable to Sign In',
        error.message || 'Please check your credentials and try again.'
      );
    }
  };

  const handleSwitchToRegister = () => {
    navigation.navigate('Register');
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.primary} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
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
    tintColor: colors.background,
  },
  appName: {
    ...typography.h3,
    color: colors.background,
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '700',
  },
  appSubtitle: {
    ...typography.caption,
    color: colors.background + 'CC',
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
    color: colors.primary,
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
    fontSize: 13,
  },
  registerLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});