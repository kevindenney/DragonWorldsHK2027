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
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

interface SimplePasswordResetScreenProps {
  navigation: any;
}

export function SimplePasswordResetScreen({ navigation }: SimplePasswordResetScreenProps) {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

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

  const handlePasswordReset = async () => {
    const emailValidationError = validateEmail(email);
    setEmailError(emailValidationError);

    if (emailValidationError) {
      return;
    }

    try {
      await resetPassword(email);
      setEmailSent(true);
      Alert.alert(
        'Reset Email Sent',
        'Check your email for instructions to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Reset Failed',
        error.message || 'Unable to send reset email. Please try again.'
      );
    }
  };

  const handleBackToLogin = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Login');
    }
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
            <Text style={styles.appName}>Password Reset</Text>
            <Text style={styles.appSubtitle}>
              Enter your email to receive reset instructions
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {!emailSent ? (
              <>
                <View style={styles.instructionsSection}>
                  <Text style={styles.instructionsTitle}>Forgot Your Password?</Text>
                  <Text style={styles.instructionsText}>
                    No worries! Enter your email address below and we'll send you instructions
                    to reset your password.
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
                    testID="reset-email"
                  />

                  <SimpleAuthButton
                    title={isLoading ? 'Sending...' : 'Send Reset Email'}
                    onPress={handlePasswordReset}
                    loading={isLoading}
                    variant="primary"
                    style={styles.resetButton}
                    testID="reset-submit"
                  />

                  <TouchableOpacity
                    onPress={handleBackToLogin}
                    style={styles.backToLoginContainer}
                  >
                    <Text style={styles.backToLoginText}>Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.successSection}>
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  Check your inbox for password reset instructions. If you don't see the email,
                  check your spam folder.
                </Text>

                <SimpleAuthButton
                  title="Back to Sign In"
                  onPress={handleBackToLogin}
                  variant="primary"
                  style={styles.resetButton}
                  testID="back-to-login"
                />
              </View>
            )}
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 64,
    height: 64,
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
  },
  formContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.large,
  },
  instructionsSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  instructionsTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  instructionsText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  formFields: {
    width: '100%',
  },
  resetButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backToLoginContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backToLoginText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '500',
  },
  successSection: {
    alignItems: 'center',
  },
  successTitle: {
    ...typography.h2,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  successText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
});