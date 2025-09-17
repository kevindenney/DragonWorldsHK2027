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
  console.log('🔐 [SimpleLoginScreen] Component rendering...');

  // TEMPORARY: Test if useAuth hook is working
  let authHookResult;
  try {
    authHookResult = useAuth();
    console.log('🔐 [SimpleLoginScreen] useAuth hook successful:', !!authHookResult);
  } catch (error) {
    console.error('🔐 [SimpleLoginScreen] useAuth hook failed:', error);
    alert('CRITICAL: useAuth hook failed - ' + error.message);
  }

  const { login, loginWithProvider, isLoading, register, isAuthenticated, user } = authHookResult || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Monitor authentication state and navigate away when login succeeds
  useEffect(() => {
    console.log('🔄 [SimpleLoginScreen] Auth state effect triggered:', {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email || 'none'
    });

    if (isAuthenticated && user) {
      console.log('✅ [SimpleLoginScreen] User authenticated successfully! Navigating away from login screen...');

      // Add a small delay to show success before navigating
      setTimeout(() => {
        try {
          console.log('🔄 [SimpleLoginScreen] Attempting to navigate back from login screen');

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

          console.log('✅ [SimpleLoginScreen] Navigation completed successfully');
        } catch (navError) {
          console.error('❌ [SimpleLoginScreen] Navigation failed:', navError);
          // If navigation fails, user can still access the app via tabs
        }
      }, 500);
    }
  }, [isAuthenticated, user, navigation]);

  console.log('🔐 [SimpleLoginScreen] Component state:', {
    email: email || 'empty',
    hasPassword: !!password,
    isLoading,
    authHookAvailable: !!login,
    isAuthenticated,
    hasUser: !!user,
    userEmail: user?.email || 'none'
  });

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
    console.log('🔐 [SimpleLoginScreen] Login button pressed');
    console.log('🔐 [SimpleLoginScreen] DEBUGGING: Button handler executed successfully');

    // Check if login function is available
    if (!login) {
      console.error('🔐 [SimpleLoginScreen] login function not available');
      return;
    }

    const loginStartTime = Date.now();

    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);

    if (emailValidationError || passwordValidationError) {
      console.log('❌ [SimpleLoginScreen] Validation failed:', {
        emailError: emailValidationError,
        passwordError: passwordValidationError
      });
      return;
    }

    console.log('🔐 [SimpleLoginScreen] Starting login attempt for:', email);

    try {
      // Test Firebase connection before attempting login
      console.log('🔍 [SimpleLoginScreen] Testing Firebase connection...');
      try {
        const { testFirebaseConnection } = await import('../../config/firebase');
        const connectionTest = await testFirebaseConnection();
        console.log('🔍 [SimpleLoginScreen] Firebase connection test result:', connectionTest);

        if (!connectionTest.success) {
          throw new Error(`Firebase connection failed: ${connectionTest.error}`);
        }
      } catch (connectionError) {
        console.error('❌ [SimpleLoginScreen] Firebase connection test failed:', connectionError);
        throw connectionError;
      }

      // Add loading state timeout detection
      const loadingTimeoutId = setTimeout(() => {
        console.warn('⚠️ [SimpleLoginScreen] Login taking longer than expected (5s)');
      }, 5000);

      console.log('🔐 [SimpleLoginScreen] Firebase connection verified, proceeding with login...');

      // TEMPORARY: For debugging, let's try with simple test credentials first
      const testCredentials = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      console.log('🔍 [SimpleLoginScreen] Testing with simplified credentials:', testCredentials.email);

      try {
        await login(testCredentials);
      } catch (loginError: any) {
        // If user doesn't exist, try to create it first
        if (loginError?.message?.includes('No account found') || loginError?.message?.includes('user-not-found')) {
          console.log('🔍 [SimpleLoginScreen] User not found, attempting to create test user...');

          try {
            console.log('🔍 [SimpleLoginScreen] Attempting to register test user...');

            if (!register) {
              throw new Error('Register function not available from auth context');
            }

            await register({
              email: testCredentials.email,
              password: testCredentials.password,
              displayName: 'Test User'
            });

            console.log('✅ [SimpleLoginScreen] Test user created successfully, retrying login...');

            // Small delay to ensure Firebase user is ready
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Now try login again
            console.log('🔍 [SimpleLoginScreen] Retrying login with newly created user...');
            await login(testCredentials);
          } catch (createError: any) {
            console.error('❌ [SimpleLoginScreen] Failed to create test user:', createError);

            // Show detailed error for registration failure
            const registrationErrorDetails = {
              message: createError?.message,
              code: createError?.code,
              name: createError?.name
            };

            console.error('❌ [SimpleLoginScreen] Registration failed details:', registrationErrorDetails);
            throw createError;
          }
        } else {
          throw loginError;
        }
      }

      clearTimeout(loadingTimeoutId);

      const loginDuration = Date.now() - loginStartTime;
      console.log(`✅ [SimpleLoginScreen] Login completed successfully in ${loginDuration}ms`);

    } catch (error: any) {
      const loginDuration = Date.now() - loginStartTime;
      console.error(`❌ [SimpleLoginScreen] Login failed after ${loginDuration}ms:`, error);

      // TEMPORARY: Show full error details in alert for debugging
      const errorDetails = {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        toString: error?.toString(),
        stack: error?.stack?.substring(0, 200)
      };

      console.error('❌ [SimpleLoginScreen] Full error details:', errorDetails);

      // Provide more specific error messages based on error type
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

      // Show the formatted error after the debug details
      setTimeout(() => {
        Alert.alert(title, message);
      }, 1000);
    }
  };

  const handleSwitchToRegister = () => {
    console.log('🔗 [SimpleLoginScreen] handleSwitchToRegister called');
    console.log('🔗 [SimpleLoginScreen] Navigation object:', !!navigation);
    console.log('🔗 [SimpleLoginScreen] Available routes:', navigation?.getState?.()?.routeNames);

    try {
      console.log('🔗 [SimpleLoginScreen] Attempting to navigate to Register screen');
      navigation.navigate('Register');
      console.log('✅ [SimpleLoginScreen] Navigation to Register completed successfully');
    } catch (error) {
      console.error('❌ [SimpleLoginScreen] Navigation to Register failed:', error);
      console.error('❌ [SimpleLoginScreen] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 300)
      });
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
                onPress={() => {
                  console.log('🔐 [SimpleLoginScreen] Button onPress wrapper called');
                  handleLogin();
                }}
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