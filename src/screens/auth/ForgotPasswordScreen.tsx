import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Anchor, Mail } from 'lucide-react-native';
import { useAuth } from '../../auth/useAuth';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return { isValid: false, error: 'Email address is required' };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  };

  const handleResetPassword = async () => {
    const emailValidation = validateEmail(email);
    setEmailError(emailValidation.error || '');
    
    if (!emailValidation.isValid) {
      return;
    }

    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (error: any) {
      Alert.alert('Unable to Send Reset Email', error.message || 'Please check your email address and try again.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleCancel}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Reset Password</Text>
        
        {/* Empty view for spacing */}
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Image 
            source={require('../../../assets/dragon-logo.png')}
            style={styles.dragonLogo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Lost Your Bearings?</Text>
            <Text style={styles.subtitle}>
              No worries, sailor! Enter your email address and we'll send you a compass to find your way back.
            </Text>
            <View style={styles.anchorDivider}>
              <Anchor size={16} color={colors.primary} />
            </View>
          </View>

          {!resetSent ? (
            <View style={styles.formFields}>
              <AuthInput
                label="Email Address"
                type="email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                error={emailError}
                isRequired
                onValidate={validateEmail}
                helpText="Enter the email you used to create your account"
                testID="reset-email"
              />

              <AuthButton
                title={isLoading ? 'Sending Navigation...' : 'Send Course Correction'}
                onPress={handleResetPassword}
                loading={isLoading}
                variant="primary"
                size="large"
                style={styles.resetButton}
                testID="reset-submit"
              />
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Mail size={48} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Course Correction Sent!</Text>
              <Text style={styles.successMessage}>
                We've dispatched navigation instructions to <Text style={styles.emailHighlight}>{email}</Text>.
                Please check your email and follow the course to reset your password.
              </Text>
              
              <AuthButton
                title="Return to Port"
                onPress={handleCancel}
                variant="outline"
                size="large"
                style={styles.backToLoginButton}
                testID="back-to-login"
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.background,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    ...shadows.small,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
    borderRadius: borderRadius.md,
  },
  headerTitle: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  dragonLogo: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
  formContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  anchorDivider: {
    padding: spacing.sm,
  },
  formFields: {
    marginBottom: spacing.xl,
  },
  resetButton: {
    marginTop: spacing.lg,
    ...shadows.button,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h3,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  successMessage: {
    ...typography.body1,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  emailHighlight: {
    fontWeight: '600',
    color: colors.primary,
  },
  backToLoginButton: {
    width: '100%',
    maxWidth: 280,
  },
});