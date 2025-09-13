import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { AuthInput, AuthInputRef } from './AuthInput';
import { AuthButton } from './AuthButton';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../services/auth/authUtils';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';

export interface PasswordResetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  testID?: string;
}

type ResetState = 'initial' | 'sending' | 'sent' | 'error';

export function PasswordResetForm({
  onSuccess,
  onCancel,
  testID,
}: PasswordResetFormProps) {
  const { resetPassword, isLoading, error, clearError } = useAuth();
  
  const emailRef = useRef<AuthInputRef>(null);
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [resetState, setResetState] = useState<ResetState>('initial');
  const [resetError, setResetError] = useState<string | undefined>();

  const validateForm = useCallback((): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError(undefined);
    return true;
  }, [email]);

  const handlePasswordReset = async () => {
    if (!validateForm()) {
      emailRef.current?.focus();
      return;
    }

    try {
      clearError();
      setResetState('sending');
      setResetError(undefined);
      
      await resetPassword({ email });
      
      setResetState('sent');
      onSuccess?.();
    } catch (err) {
      setResetState('error');
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
      setResetError(errorMessage);
      Alert.alert('Reset Password Error', errorMessage);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    
    // Clear error when user starts typing
    if (emailError) {
      setEmailError(undefined);
    }
    
    if (resetState === 'error') {
      setResetState('initial');
      setResetError(undefined);
    }
  };

  const handleEmailValidation = (value: string) => {
    if (!value.trim()) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!validateEmail(value)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  };

  const handleRetry = () => {
    setResetState('initial');
    setResetError(undefined);
    emailRef.current?.focus();
  };

  const renderContent = () => {
    switch (resetState) {
      case 'sent':
        return (
          <View style={styles.centeredContent}>
            <View style={[styles.iconContainer, styles.successIcon]}>
              <CheckCircle size={48} color={colors.success} />
            </View>
            
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.email}>{email}</Text>
            </Text>
            
            <Text style={styles.instructions}>
              Click the link in the email to reset your password. 
              If you don't see the email, check your spam folder.
            </Text>
            
            <AuthButton
              title="Back to Sign In"
              onPress={onCancel}
              variant="primary"
              size="large"
              style={styles.actionButton}
              testID={`${testID}-back-to-login`}
            />
            
            <AuthButton
              title="Resend Email"
              onPress={handleRetry}
              variant="text"
              size="medium"
              testID={`${testID}-resend`}
            />
          </View>
        );

      case 'error':
        return (
          <View style={styles.centeredContent}>
            <View style={[styles.iconContainer, styles.errorIcon]}>
              <AlertCircle size={48} color={colors.error} />
            </View>
            
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              {resetError || 'Failed to send password reset email'}
            </Text>
            
            <AuthButton
              title="Try Again"
              onPress={handleRetry}
              variant="primary"
              size="large"
              style={styles.actionButton}
              testID={`${testID}-retry`}
            />
            
            <AuthButton
              title="Back to Sign In"
              onPress={onCancel}
              variant="text"
              size="medium"
              testID={`${testID}-back-to-login`}
            />
          </View>
        );

      default:
        return (
          <>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you a link to reset your password
              </Text>
            </View>

            <View style={styles.formContainer}>
              <AuthInput
                ref={emailRef}
                label="Email"
                type="email"
                isRequired
                leftIcon={<Mail size={20} color={colors.textMuted} />}
                value={email}
                onChangeText={handleEmailChange}
                onValidate={handleEmailValidation}
                error={emailError}
                returnKeyType="done"
                onSubmitEditing={handlePasswordReset}
                helpText="We'll send reset instructions to this email address"
                testID={`${testID}-email`}
              />

              <AuthButton
                title={resetState === 'sending' ? 'Sending...' : 'Send Reset Link'}
                onPress={handlePasswordReset}
                loading={resetState === 'sending' || isLoading}
                disabled={resetState === 'sending' || isLoading}
                variant="primary"
                size="large"
                testID={`${testID}-submit`}
              />

              <AuthButton
                title="Back to Sign In"
                onPress={onCancel}
                variant="text"
                size="medium"
                leftIcon={<ArrowLeft size={16} color={colors.primary} />}
                style={styles.backButton}
                testID={`${testID}-back`}
              />
            </View>
          </>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID={testID}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  testID?: string;
}

export function ChangePasswordForm({
  onSuccess,
  onCancel,
  testID,
}: ChangePasswordFormProps) {
  const { changePassword, isLoading, error, clearError } = useAuth();
  
  const currentPasswordRef = useRef<AuthInputRef>(null);
  const newPasswordRef = useRef<AuthInputRef>(null);
  const confirmPasswordRef = useRef<AuthInputRef>(null);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<typeof formData> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      clearError();
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      
      Alert.alert('Success', 'Your password has been changed successfully', [
        { text: 'OK', onPress: onSuccess },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      Alert.alert('Change Password Error', errorMessage);
    }
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID={testID}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>
            Enter your current password and choose a new one
          </Text>
        </View>

        <View style={styles.formContainer}>
          <AuthInput
            ref={currentPasswordRef}
            label="Current Password"
            type="password"
            isRequired
            leftIcon={<Mail size={20} color={colors.textMuted} />}
            value={formData.currentPassword}
            onChangeText={(value) => handleFieldChange('currentPassword', value)}
            error={errors.currentPassword}
            returnKeyType="next"
            onSubmitEditing={() => newPasswordRef.current?.focus()}
            testID={`${testID}-current-password`}
          />

          <AuthInput
            ref={newPasswordRef}
            label="New Password"
            type="password"
            isRequired
            leftIcon={<Mail size={20} color={colors.textMuted} />}
            value={formData.newPassword}
            onChangeText={(value) => handleFieldChange('newPassword', value)}
            error={errors.newPassword}
            helpText="Password must be at least 8 characters"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            testID={`${testID}-new-password`}
          />

          <AuthInput
            ref={confirmPasswordRef}
            label="Confirm New Password"
            type="password"
            isRequired
            leftIcon={<Mail size={20} color={colors.textMuted} />}
            value={formData.confirmPassword}
            onChangeText={(value) => handleFieldChange('confirmPassword', value)}
            error={errors.confirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleChangePassword}
            testID={`${testID}-confirm-password`}
          />

          <AuthButton
            title="Change Password"
            onPress={handleChangePassword}
            loading={isLoading}
            disabled={isLoading}
            variant="primary"
            size="large"
            testID={`${testID}-submit`}
          />

          <AuthButton
            title="Cancel"
            onPress={onCancel}
            variant="text"
            size="medium"
            disabled={isLoading}
            style={styles.backButton}
            testID={`${testID}-cancel`}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  instructions: {
    ...typography.body2,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  email: {
    color: colors.primary,
    fontWeight: '600',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successIcon: {
    backgroundColor: colors.success + '20',
  },
  errorIcon: {
    backgroundColor: colors.error + '20',
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.md,
  },
});