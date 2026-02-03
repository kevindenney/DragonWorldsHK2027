import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../auth/useAuth';
import { SimpleAuthInput } from '../../components/auth/SimpleAuthInput';
import { SimpleAuthButton } from '../../components/auth/SimpleAuthButton';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

interface SimpleRegisterScreenProps {
  navigation: any;
}

export function SimpleRegisterScreen({ navigation }: SimpleRegisterScreenProps) {
  const { register, loginWithProvider, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get('window');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');


  const validateDisplayName = (name: string) => {
    if (!name.trim()) {
      return 'Display name is required';
    }
    if (name.length < 2) {
      return 'Display name must be at least 2 characters';
    }
    return '';
  };

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
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain uppercase, lowercase, and number';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword.trim()) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleRegister = async () => {
    const displayNameValidationError = validateDisplayName(displayName);
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);
    const confirmPasswordValidationError = validateConfirmPassword(confirmPassword, password);

    setDisplayNameError(displayNameValidationError);
    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);
    setConfirmPasswordError(confirmPasswordValidationError);

    if (
      displayNameValidationError ||
      emailValidationError ||
      passwordValidationError ||
      confirmPasswordValidationError
    ) {
      return;
    }

    try {
      // Debug environment variables before attempting registration

      // Check network connectivity before attempting Firebase operation
      const isConnected = await checkConnectivity();

      if (!isConnected) {
        throw {
          code: 'network/no-connection',
          message: 'No internet connection available. Please check your network and try again.'
        };
      }

      await register({ email, password, displayName });


      // Check if navigation is available and navigate appropriately
      try {

        // Check if we can navigate to MainTabs, otherwise go back to login
        if (navigation.canGoBack()) {
          navigation.navigate('MainTabs');
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }
      } catch (navError) {
        // If navigation fails, the auth state change should still trigger proper navigation
      }
    } catch (error: any) {

      // Provide more specific error messages
      let title = 'Unable to Create Account';
      let message = 'Please check your information and try again.';

      if (error.code) {
        switch (error.code) {
          case 'network/no-connection':
            title = 'No Internet Connection';
            message = error.message;
            break;
          case 'auth/email-already-in-use':
            title = 'Email Already Registered';
            message = 'An account with this email already exists. Try signing in instead.';
            break;
          case 'auth/weak-password':
            title = 'Password Too Weak';
            message = 'Please choose a stronger password with at least 8 characters.';
            break;
          case 'auth/invalid-email':
            title = 'Invalid Email';
            message = 'Please enter a valid email address.';
            break;
          case 'auth/network-request-failed':
            title = 'Connection Problem';
            message = 'Unable to connect to the server. Please check your internet connection and try again.';
            break;
          case 'auth/too-many-requests':
            title = 'Too Many Attempts';
            message = 'Too many failed attempts. Please wait a few minutes and try again.';
            break;
          default:
            if (error.message.includes('network') || error.message.includes('connection')) {
              title = 'Network Error';
              message = 'Please check your internet connection and try again. If the problem persists, Firebase may not be properly configured.';
            } else {
              message = error.message || message;
            }
            break;
        }
      } else if (error.message) {
        if (error.message.includes('Missing required Firebase configuration')) {
          title = 'Configuration Error';
          message = 'The app is not properly configured. Please contact support.';
        } else {
          message = error.message;
        }
      }

      Alert.alert(title, message);
    }
  };

  const handleSwitchToLogin = () => {
    try {
      navigation.navigate('Login');
    } catch (error) {
    }
  };

  const handleCancel = () => {
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Login');
      }
    } catch (error) {
    }
  };

  const handleSocialSignUp = async (provider: 'google' | 'apple') => {
    try {
      if (loginWithProvider) {
        await loginWithProvider(provider);
      } else {
        throw new Error(`${provider} sign up not available`);
      }
    } catch (error: any) {
      Alert.alert(
        'Sign Up Failed',
        error.message || `Unable to sign up with ${provider}. Please try again.`
      );
    }
  };

  // Simple network connectivity check with timeout
  const checkConnectivity = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // If connectivity check fails or times out, assume we're connected
      // Firebase will handle the actual network error if there is one
      return true;
    }
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

          <KeyboardAwareScrollView
            style={styles.keyboardScrollView}
            contentContainerStyle={[
              styles.scrollContainer,
              {
                paddingBottom: Math.max(insets.bottom + 60, 140), // Extra padding for keyboard
              }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraScrollHeight={50}
            extraHeight={Platform.OS === 'ios' ? 50 : 100}
          >
              {/* Header Section */}
              <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { top: insets.top + 8 }]}
                  onPress={handleCancel}
                  testID="register-cancel"
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/dragon-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Join the Fleet</Text>
            <Text style={styles.appSubtitle}>
              Create your account to access exclusive regatta content
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Set Sail with Us</Text>
              <Text style={styles.welcomeSubtitle}>
                Be part of the official Dragon World Championships 2027 community
              </Text>
            </View>

            <View style={styles.formFields}>
              <SimpleAuthInput
                label="Display Name"
                type="text"
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (displayNameError) setDisplayNameError('');
                }}
                error={displayNameError}
                testID="register-displayname"
              />

              <SimpleAuthInput
                label="Email Address"
                type="email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                error={emailError}
                testID="register-email"
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
                testID="register-password"
              />

              <SimpleAuthInput
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError('');
                }}
                error={confirmPasswordError}
                testID="register-confirm-password"
              />

              <SimpleAuthButton
                title={isLoading ? 'Creating Account...' : 'Join the Fleet'}
                onPress={handleRegister}
                loading={isLoading}
                variant="inverse"
                style={styles.registerButton}
                testID="register-submit"
              />

              {/* Social Sign Up Options - Temporarily hidden for future implementation */}
              {/*
              <View style={styles.socialSection}>
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtons}>
                  <TouchableOpacity
                    style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                    onPress={() => handleSocialSignUp('google')}
                    disabled={isLoading}
                    testID="google-signup"
                  >
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                    onPress={() => handleSocialSignUp('apple')}
                    disabled={isLoading}
                    testID="apple-signup"
                  >
                    <Text style={styles.socialButtonText}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>
              */}

              <View style={styles.loginSection}>
                <Text style={styles.loginPrompt}>Already part of the crew?</Text>
                <TouchableOpacity onPress={handleSwitchToLogin}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </KeyboardAwareScrollView>
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
  keyboardScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm, // Reduced from lg to sm
    // paddingBottom is now set dynamically in the component
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md, // Reduced from xl to md
    position: 'relative',
  },
  cancelButton: {
    position: 'absolute',
    top: 0, // Will be overridden by inline style with insets.top + 8
    left: 16,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    zIndex: 10,
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.9)', // White text to show on dark gradient
    fontSize: 17,
    fontWeight: '500',
  },
  logoContainer: {
    width: 50, // Reduced from 70
    height: 50, // Reduced from 70
    marginBottom: spacing.sm, // Reduced from md to sm
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 40, // Reduced from 56
    height: 40, // Reduced from 56
    tintColor: '#FFFFFF', // White logo on dark gradient
  },
  appName: {
    ...typography.h1,
    color: '#FFFFFF', // White text on dark gradient
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  appSubtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  formContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg, // Reduced from xl to lg
    marginBottom: spacing.sm, // Reduced from lg to sm
    // Enhanced shadow for dark background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.md, // Reduced from lg to md
  },
  welcomeTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  welcomeSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  formFields: {
    width: '100%',
  },
  registerButton: {
    marginTop: spacing.md, // Reduced from lg to md
    marginBottom: spacing.sm, // Reduced from lg to sm
    ...shadows.button,
  },
  socialSection: {
    marginBottom: spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 12,
    marginHorizontal: spacing.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.md, // Reduced from lg to md
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  loginPrompt: {
    ...typography.body2,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  loginLink: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
});