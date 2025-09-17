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
  const { register, isLoading } = useAuth();
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
      console.log('🔍 [Register] Environment variable check:');
      console.log('EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '***set***' : 'MISSING');
      console.log('EXPO_PUBLIC_FIREBASE_PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING');
      console.log('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING');

      // Check network connectivity before attempting Firebase operation
      console.log('🔍 [Register] Checking network connectivity...');
      const isConnected = await checkConnectivity();
      console.log('🔍 [Register] Network connectivity:', isConnected ? 'Connected' : 'No connection');

      if (!isConnected) {
        throw {
          code: 'network/no-connection',
          message: 'No internet connection available. Please check your network and try again.'
        };
      }

      await register({ email, password, displayName });
    } catch (error: any) {
      console.error('Registration error:', error);

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
    navigation.navigate('Login');
  };

  // Simple network connectivity check
  const checkConnectivity = async (): Promise<boolean> => {
    try {
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' },
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.primary} />

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
          <View style={styles.header}>
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
                Join thousands of sailing enthusiasts following the Dragon World Championships
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
                variant="primary"
                style={styles.registerButton}
                testID="register-submit"
              />

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  keyboardScrollView: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    // paddingBottom is now set dynamically in the component
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 70,
    height: 70,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 56,
    height: 56,
    tintColor: colors.background,
  },
  appName: {
    ...typography.h1,
    color: colors.background,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  appSubtitle: {
    ...typography.body1,
    color: colors.background + 'CC',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  formContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg, // Add bottom margin for better spacing
    ...shadows.large,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.lg,
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