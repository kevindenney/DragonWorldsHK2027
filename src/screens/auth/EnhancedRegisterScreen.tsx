import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, Image, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Anchor, Compass, Users } from 'lucide-react-native';
import { useAuth } from '../../auth/useAuth';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

interface EnhancedRegisterScreenProps {
  navigation: any;
}

export function EnhancedRegisterScreen({ navigation }: EnhancedRegisterScreenProps) {
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  
  const logoScale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const logoAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    logoAnimation.start();
    
    return () => logoAnimation.stop();
  }, []);

  const validateDisplayName = (name: string) => {
    if (!name.trim()) {
      return { isValid: false, error: 'Display name is required' };
    }
    if (name.length < 2) {
      return { isValid: false, error: 'Display name must be at least 2 characters' };
    }
    return { isValid: true };
  };
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  };
  
  const validatePassword = (password: string) => {
    if (!password.trim()) {
      return { isValid: false, error: 'Password is required' };
    }
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters' };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { isValid: false, error: 'Password must contain uppercase, lowercase, and number' };
    }
    return { isValid: true };
  };
  
  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword.trim()) {
      return { isValid: false, error: 'Please confirm your password' };
    }
    if (confirmPassword !== password) {
      return { isValid: false, error: 'Passwords do not match' };
    }
    return { isValid: true };
  };

  const handleRegister = async () => {
    const displayNameValidation = validateDisplayName(displayName);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validateConfirmPassword(confirmPassword, password);
    
    setDisplayNameError(displayNameValidation.error || '');
    setEmailError(emailValidation.error || '');
    setPasswordError(passwordValidation.error || '');
    setConfirmPasswordError(confirmPasswordValidation.error || '');
    
    if (!displayNameValidation.isValid || !emailValidation.isValid || 
        !passwordValidation.isValid || !confirmPasswordValidation.isValid) {
      return;
    }

    try {
      await register({ email, password, displayName });
    } catch (error: any) {
      Alert.alert('Unable to Create Account', error.message || 'Please check your information and try again.');
    }
  };

  const handleSwitchToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      
      <View style={styles.header}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
          <Image 
            source={require('../../../assets/dragon-logo.png')}
            style={styles.dragonLogo}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.appName}>Join the Fleet</Text>
        <Text style={styles.appSubtitle}>
          Create your account to access exclusive regatta content and race updates
        </Text>
        <View style={styles.compassContainer}>
          <Users size={16} color={colors.background + 'AA'} />
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Set Sail with Us</Text>
          <Text style={styles.welcomeSubtitle}>
            Join thousands of sailing enthusiasts following the Dragon World Championships
          </Text>
          <View style={styles.anchorDivider}>
            <Anchor size={16} color={colors.primary} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.formFields}>
            <AuthInput
              label="Display Name"
              type="text"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (displayNameError) setDisplayNameError('');
              }}
              error={displayNameError}
              isRequired
              onValidate={validateDisplayName}
              helpText="This is how other sailors will see you"
              testID="register-displayname"
            />
            
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
              testID="register-email"
            />
            
            <AuthInput
              label="Password"
              type="password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              isRequired
              onValidate={validatePassword}
              helpText="At least 8 characters with uppercase, lowercase, and number"
              testID="register-password"
            />
            
            <AuthInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              error={confirmPasswordError}
              isRequired
              onValidate={(value) => validateConfirmPassword(value, password)}
              testID="register-confirm-password"
            />

            <AuthButton
              title={isLoading ? 'Hoisting the Colors...' : 'Join the Fleet'}
              onPress={handleRegister}
              loading={isLoading}
              variant="primary"
              size="large"
              style={styles.registerButton}
              testID="register-submit"
            />

            <View style={styles.loginSection}>
              <Text style={styles.loginPrompt}>Already part of the crew?</Text>
              <TouchableOpacity onPress={handleSwitchToLogin}>
                <Text style={styles.loginLink}>Return to Port</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.large,
    overflow: 'hidden',
    position: 'relative',
  },
  logoContainer: {
    width: 70,
    height: 70,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragonLogo: {
    width: 60,
    height: 60,
    tintColor: colors.background,
  },
  appName: {
    ...typography.h2,
    color: colors.background,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  appSubtitle: {
    ...typography.body1,
    color: colors.background + 'DD',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  compassContainer: {
    marginTop: spacing.xs,
  },
  formContainer: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
  scrollView: {
    flex: 1,
  },
  formFields: {
    paddingBottom: spacing.xxl,
  },
  registerButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.button,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
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