import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { AuthInput, AuthInputRef } from './AuthInput';
import { SocialLoginGroup, commonProviderSets } from './SocialLoginButton';
import { AuthButton } from './AuthButton';
import { AuthProvider, LoginCredentials, RegistrationData } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../services/auth/authUtils';
import { colors, spacing } from '../../constants/theme';
import { Mail, Lock, User, Phone } from 'lucide-react-native';

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
  showSocialLogin?: boolean;
  socialProviders?: AuthProvider[];
  testID?: string;
}

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
  showSocialLogin = true,
  socialProviders = commonProviderSets.basic,
  testID,
}: LoginFormProps) {
  const { login, loginWithProvider, isLoading, error, clearError } = useAuth();
  
  const emailRef = useRef<AuthInputRef>(null);
  const passwordRef = useRef<AuthInputRef>(null);
  
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<LoginCredentials> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      clearError();
      await login(formData);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      Alert.alert('Login Error', errorMessage);
    }
  };

  const handleSocialLogin = async (provider: AuthProvider) => {
    try {
      clearError();
      await loginWithProvider(provider);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Social login failed';
      Alert.alert('Login Error', errorMessage);
    }
  };

  const handleFieldChange = (field: keyof LoginCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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

  const handlePasswordValidation = (value: string) => {
    if (!value) {
      return { isValid: false, error: 'Password is required' };
    }
    if (value.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters' };
    }
    return { isValid: true };
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
        <View style={styles.formContainer}>
          <AuthInput
            ref={emailRef}
            label="Email"
            type="email"
            isRequired
            leftIcon={<Mail size={20} color={colors.textMuted} />}
            value={formData.email}
            onChangeText={(value) => handleFieldChange('email', value)}
            onValidate={handleEmailValidation}
            error={errors.email}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            testID={`${testID}-email`}
          />

          <AuthInput
            ref={passwordRef}
            label="Password"
            type="password"
            isRequired
            leftIcon={<Lock size={20} color={colors.textMuted} />}
            value={formData.password}
            onChangeText={(value) => handleFieldChange('password', value)}
            onValidate={handlePasswordValidation}
            error={errors.password}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            testID={`${testID}-password`}
          />

          <AuthButton
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            variant="primary"
            size="large"
            testID={`${testID}-submit`}
          />

          <AuthButton
            title="Forgot Password?"
            onPress={onForgotPassword}
            variant="text"
            size="medium"
            disabled={isLoading}
            style={styles.forgotPasswordButton}
            testID={`${testID}-forgot-password`}
          />

          {showSocialLogin && (
            <SocialLoginGroup
              providers={socialProviders}
              onPress={handleSocialLogin}
              disabled={isLoading}
              testID={`${testID}-social`}
            />
          )}

          <AuthButton
            title="Don't have an account? Sign Up"
            onPress={onSwitchToRegister}
            variant="text"
            size="medium"
            disabled={isLoading}
            style={styles.switchButton}
            testID={`${testID}-switch-to-register`}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  showSocialLogin?: boolean;
  socialProviders?: AuthProvider[];
  testID?: string;
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
  showSocialLogin = true,
  socialProviders = commonProviderSets.basic,
  testID,
}: RegisterFormProps) {
  const { register, loginWithProvider, isLoading, error, clearError } = useAuth();
  
  const displayNameRef = useRef<AuthInputRef>(null);
  const emailRef = useRef<AuthInputRef>(null);
  const phoneRef = useRef<AuthInputRef>(null);
  const passwordRef = useRef<AuthInputRef>(null);
  const confirmPasswordRef = useRef<AuthInputRef>(null);
  
  const [formData, setFormData] = useState<RegistrationData>({
    displayName: '',
    email: '',
    password: '',
    phoneNumber: '',
    acceptTerms: false,
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Partial<RegistrationData & { confirmPassword?: string }>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<RegistrationData & { confirmPassword?: string }> = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, confirmPassword]);

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      clearError();
      await register(formData);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      Alert.alert('Registration Error', errorMessage);
    }
  };

  const handleSocialLogin = async (provider: AuthProvider) => {
    try {
      clearError();
      await loginWithProvider(provider);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Social registration failed';
      Alert.alert('Registration Error', errorMessage);
    }
  };

  const handleFieldChange = (field: keyof RegistrationData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDisplayNameValidation = (value: string) => {
    if (!value.trim()) {
      return { isValid: false, error: 'Display name is required' };
    }
    if (value.trim().length < 2) {
      return { isValid: false, error: 'Display name must be at least 2 characters' };
    }
    return { isValid: true };
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

  const handlePasswordValidation = (value: string) => {
    if (!value) {
      return { isValid: false, error: 'Password is required' };
    }
    const passwordValidation = validatePassword(value);
    if (!passwordValidation.isValid) {
      return { isValid: false, error: passwordValidation.errors[0] };
    }
    return { isValid: true };
  };

  const handleConfirmPasswordValidation = (value: string) => {
    if (!value) {
      return { isValid: false, error: 'Please confirm your password' };
    }
    if (formData.password !== value) {
      return { isValid: false, error: 'Passwords do not match' };
    }
    return { isValid: true };
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
        <View style={styles.formContainer}>
          <AuthInput
            ref={displayNameRef}
            label="Display Name"
            type="text"
            isRequired
            leftIcon={<User size={20} color={colors.textMuted} />}
            value={formData.displayName}
            onChangeText={(value) => handleFieldChange('displayName', value)}
            onValidate={handleDisplayNameValidation}
            error={errors.displayName}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            testID={`${testID}-displayName`}
          />

          <AuthInput
            ref={emailRef}
            label="Email"
            type="email"
            isRequired
            leftIcon={<Mail size={20} color={colors.textMuted} />}
            value={formData.email}
            onChangeText={(value) => handleFieldChange('email', value)}
            onValidate={handleEmailValidation}
            error={errors.email}
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            testID={`${testID}-email`}
          />

          <AuthInput
            ref={phoneRef}
            label="Phone Number (Optional)"
            type="phone"
            leftIcon={<Phone size={20} color={colors.textMuted} />}
            value={formData.phoneNumber || ''}
            onChangeText={(value) => handleFieldChange('phoneNumber', value)}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            testID={`${testID}-phone`}
          />

          <AuthInput
            ref={passwordRef}
            label="Password"
            type="password"
            isRequired
            leftIcon={<Lock size={20} color={colors.textMuted} />}
            value={formData.password}
            onChangeText={(value) => handleFieldChange('password', value)}
            onValidate={handlePasswordValidation}
            error={errors.password}
            helpText="Password must be at least 8 characters with uppercase, lowercase, and numbers"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            testID={`${testID}-password`}
          />

          <AuthInput
            ref={confirmPasswordRef}
            label="Confirm Password"
            type="password"
            isRequired
            leftIcon={<Lock size={20} color={colors.textMuted} />}
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (errors.confirmPassword) {
                setErrors(prev => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            onValidate={handleConfirmPasswordValidation}
            error={errors.confirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            testID={`${testID}-confirmPassword`}
          />

          <AuthButton
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading || !formData.acceptTerms}
            variant="primary"
            size="large"
            testID={`${testID}-submit`}
          />

          {showSocialLogin && (
            <SocialLoginGroup
              providers={socialProviders}
              onPress={handleSocialLogin}
              disabled={isLoading}
              testID={`${testID}-social`}
            />
          )}

          <AuthButton
            title="Already have an account? Sign In"
            onPress={onSwitchToLogin}
            variant="text"
            size="medium"
            disabled={isLoading}
            style={styles.switchButton}
            testID={`${testID}-switch-to-login`}
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
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  switchButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
});