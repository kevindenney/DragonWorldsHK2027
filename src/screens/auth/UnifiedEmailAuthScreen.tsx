import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import Animated from '../../utils/reanimatedWrapper';
import { useAuth } from '../../auth/useAuth';
import { authService } from '../../auth/firebase/authService';
import { SimpleAuthInput } from '../../components/auth/SimpleAuthInput';
import { SimpleAuthButton } from '../../components/auth/SimpleAuthButton';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

interface UnifiedEmailAuthScreenProps {
  navigation: any;
}

type AuthStep = 'email' | 'signin' | 'signup';

// User-friendly error messages
const getErrorMessage = (error: any): { title: string; message: string } => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
    return {
      title: 'Incorrect Password',
      message: 'The password you entered is incorrect. Please try again or reset your password.',
    };
  }
  if (errorCode === 'auth/user-not-found') {
    return {
      title: 'Account Not Found',
      message: 'No account exists with this email address.',
    };
  }
  if (errorCode === 'auth/invalid-email') {
    return {
      title: 'Invalid Email',
      message: 'Please enter a valid email address.',
    };
  }
  if (errorCode === 'auth/email-already-in-use') {
    return {
      title: 'Email Already Registered',
      message: 'An account with this email already exists. Try signing in instead.',
    };
  }
  if (errorCode === 'auth/weak-password') {
    return {
      title: 'Password Too Weak',
      message: 'Please choose a stronger password with at least 8 characters.',
    };
  }
  if (errorCode === 'auth/too-many-requests') {
    return {
      title: 'Too Many Attempts',
      message: 'Please wait a few minutes and try again.',
    };
  }
  if (errorCode === 'auth/network-request-failed' || errorMessage.includes('network')) {
    return {
      title: 'Connection Problem',
      message: 'Please check your internet connection and try again.',
    };
  }

  return {
    title: 'Authentication Failed',
    message: errorMessage || 'Please check your information and try again.',
  };
};

export function UnifiedEmailAuthScreen({ navigation }: UnifiedEmailAuthScreenProps) {
  const { login, register, isLoading, isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();

  // Step management
  const [step, setStep] = useState<AuthStep>('email');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [authError, setAuthError] = useState<{ title: string; message: string } | null>(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Track auth attempt for navigation
  const [authAttempted, setAuthAttempted] = useState(false);

  // Navigate after successful auth
  useEffect(() => {
    if (authAttempted && isAuthenticated && user) {
      setTimeout(() => {
        try {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          }
        } catch (navError) {
          // Auth state change should handle navigation
        }
      }, 500);
    }
  }, [authAttempted, isAuthenticated, user, navigation]);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string, isSignUp: boolean) => {
    if (!password.trim()) return 'Password is required';
    if (isSignUp) {
      if (password.length < 8) return 'Password must be at least 8 characters';
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return 'Password must contain uppercase, lowercase, and number';
      }
    } else {
      if (password.length < 6) return 'Password must be at least 6 characters';
    }
    return '';
  };

  const validateDisplayName = (name: string) => {
    if (!name.trim()) return 'Display name is required';
    if (name.length < 2) return 'Display name must be at least 2 characters';
    return '';
  };

  const validateConfirmPassword = (confirm: string, password: string) => {
    if (!confirm.trim()) return 'Please confirm your password';
    if (confirm !== password) return 'Passwords do not match';
    return '';
  };

  // Animate step transition
  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  // Handle email submission
  const handleEmailContinue = async () => {
    setAuthError(null);
    const error = validateEmail(email);
    setEmailError(error);
    if (error) return;

    setIsCheckingEmail(true);
    try {
      const exists = await authService.checkEmailExists(email);
      animateTransition(() => {
        setStep(exists ? 'signin' : 'signup');
      });
    } catch (error: any) {
      const errorInfo = getErrorMessage(error);
      setAuthError(errorInfo);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Handle sign in
  const handleSignIn = async () => {
    setAuthError(null);
    const error = validatePassword(password, false);
    setPasswordError(error);
    if (error) return;

    try {
      setAuthAttempted(true);
      await login({ email, password });
    } catch (error: any) {
      setAuthAttempted(false);
      const errorInfo = getErrorMessage(error);
      setAuthError(errorInfo);
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    setAuthError(null);

    const nameError = validateDisplayName(displayName);
    const passError = validatePassword(password, true);
    const confirmError = validateConfirmPassword(confirmPassword, password);

    setDisplayNameError(nameError);
    setPasswordError(passError);
    setConfirmPasswordError(confirmError);

    if (nameError || passError || confirmError) return;

    try {
      setAuthAttempted(true);
      await register({ email, password, displayName });
    } catch (error: any) {
      setAuthAttempted(false);
      const errorCode = error?.code || '';

      // If email already exists, switch to sign-in mode
      if (errorCode === 'auth/email-already-in-use') {
        animateTransition(() => {
          setStep('signin');
          setPassword('');
          setConfirmPassword('');
          setDisplayName('');
          setPasswordError('');
          setConfirmPasswordError('');
          setDisplayNameError('');
          setAuthError({
            title: 'Account Exists',
            message: 'An account with this email already exists. Please sign in with your password.',
          });
        });
        return;
      }

      const errorInfo = getErrorMessage(error);
      setAuthError(errorInfo);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === 'email') {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } else {
      animateTransition(() => {
        setStep('email');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setPasswordError('');
        setConfirmPasswordError('');
        setDisplayNameError('');
        setAuthError(null);
      });
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  // Get step-specific content
  const getStepContent = () => {
    switch (step) {
      case 'email':
        return {
          title: 'Continue with Email',
          subtitle: 'Enter your email to sign in or create an account',
          buttonText: isCheckingEmail ? 'Checking...' : 'Continue',
          onSubmit: handleEmailContinue,
        };
      case 'signin':
        return {
          title: 'Welcome Back',
          subtitle: `Signing in as ${email}`,
          buttonText: isLoading ? 'Signing In...' : 'Sign In',
          onSubmit: handleSignIn,
        };
      case 'signup':
        return {
          title: 'Create Account',
          subtitle: `Creating account for ${email}`,
          buttonText: isLoading ? 'Creating Account...' : 'Create Account',
          onSubmit: handleSignUp,
        };
    }
  };

  const stepContent = getStepContent();

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
              { paddingBottom: insets.bottom + 16 }
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
                style={[styles.backButton, { top: insets.top + 8 }]}
                onPress={handleBack}
                testID="auth-back"
              >
                <ArrowLeft size={24} color="rgba(255, 255, 255, 0.9)" />
              </TouchableOpacity>

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
            <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>{stepContent.title}</Text>
                <Text style={styles.welcomeSubtitle}>{stepContent.subtitle}</Text>
              </View>

              {/* Error Banner */}
              {authError && (
                <View style={styles.errorBanner}>
                  <View style={styles.errorIconContainer}>
                    <Text style={styles.errorIcon}>!</Text>
                  </View>
                  <View style={styles.errorTextContainer}>
                    <Text style={styles.errorTitle}>{authError.title}</Text>
                    <Text style={styles.errorMessage}>{authError.message}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAuthError(null)}
                    style={styles.errorDismiss}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.errorDismissText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.formFields}>
                {/* Step 1: Email */}
                {step === 'email' && (
                  <>
                    <SimpleAuthInput
                      label="Email Address"
                      type="email"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) setEmailError('');
                        if (authError) setAuthError(null);
                      }}
                      error={emailError}
                      testID="auth-email"
                      autoFocus
                    />

                    <SimpleAuthButton
                      title={stepContent.buttonText}
                      onPress={stepContent.onSubmit}
                      loading={isCheckingEmail}
                      variant="primary"
                      style={styles.submitButton}
                      testID="auth-continue"
                    />
                  </>
                )}

                {/* Step 2a: Sign In */}
                {step === 'signin' && (
                  <>
                    <View style={styles.emailDisplay}>
                      <Text style={styles.emailDisplayLabel}>Email</Text>
                      <Text style={styles.emailDisplayValue}>{email}</Text>
                      <TouchableOpacity onPress={handleBack}>
                        <Text style={styles.changeEmailLink}>Change</Text>
                      </TouchableOpacity>
                    </View>

                    <SimpleAuthInput
                      label="Password"
                      type="password"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError('');
                        if (authError) setAuthError(null);
                      }}
                      error={passwordError}
                      testID="auth-password"
                      autoFocus
                    />

                    <SimpleAuthButton
                      title={stepContent.buttonText}
                      onPress={stepContent.onSubmit}
                      loading={isLoading}
                      variant="primary"
                      style={styles.submitButton}
                      testID="auth-signin"
                    />

                    <TouchableOpacity
                      onPress={handleForgotPassword}
                      style={styles.forgotPasswordContainer}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Step 2b: Sign Up */}
                {step === 'signup' && (
                  <>
                    <View style={styles.emailDisplay}>
                      <Text style={styles.emailDisplayLabel}>Email</Text>
                      <Text style={styles.emailDisplayValue}>{email}</Text>
                      <TouchableOpacity onPress={handleBack}>
                        <Text style={styles.changeEmailLink}>Change</Text>
                      </TouchableOpacity>
                    </View>

                    <SimpleAuthInput
                      label="Display Name"
                      type="text"
                      value={displayName}
                      onChangeText={(text) => {
                        setDisplayName(text);
                        if (displayNameError) setDisplayNameError('');
                        if (authError) setAuthError(null);
                      }}
                      error={displayNameError}
                      testID="auth-displayname"
                      autoFocus
                    />

                    <SimpleAuthInput
                      label="Password"
                      type="password"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError('');
                        if (authError) setAuthError(null);
                      }}
                      error={passwordError}
                      testID="auth-password"
                    />

                    <SimpleAuthInput
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (confirmPasswordError) setConfirmPasswordError('');
                        if (authError) setAuthError(null);
                      }}
                      error={confirmPasswordError}
                      testID="auth-confirm-password"
                    />

                    <SimpleAuthButton
                      title={stepContent.buttonText}
                      onPress={stepContent.onSubmit}
                      loading={isLoading}
                      variant="inverse"
                      style={styles.submitButton}
                      testID="auth-signup"
                    />

                    <Text style={styles.passwordHint}>
                      Password must be at least 8 characters with uppercase, lowercase, and a number
                    </Text>
                  </>
                )}
              </View>
            </Animated.View>
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
    paddingTop: spacing.xs,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    zIndex: 10,
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
    tintColor: '#FFFFFF',
  },
  appName: {
    ...typography.h3,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '700',
  },
  appSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
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
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
    fontSize: 13,
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
  formFields: {
    width: '100%',
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  emailDisplayLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  emailDisplayValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  changeEmailLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4A9EFF',
    fontWeight: '500',
  },
  passwordHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
  },
});

export default UnifiedEmailAuthScreen;
