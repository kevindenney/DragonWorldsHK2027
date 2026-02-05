import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Image, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Compass } from 'lucide-react-native';
import { useAuth } from '../../auth/useAuth';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { SocialLoginGroup, commonProviderSets } from '../../components/auth/SocialLoginButton';
import { AuthProviderType } from '../../auth/authTypes';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { 
  darkSkyColors, 
  darkSkyTypography, 
  darkSkySpacing, 
  darkSkyAnimations 
} from '../../constants/darkSkyTheme';

interface EnhancedLoginScreenProps {
  navigation: any;
}

export function EnhancedLoginScreen({ navigation }: EnhancedLoginScreenProps) {
  const { login, loginWithProvider, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const logoScale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Logo breathing animation
    const logoAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    logoAnimation.start();
    
    return () => {
      logoAnimation.stop();
    };
  }, []);

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
    if (password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters' };
    }
    return { isValid: true };
  };

  const handleLogin = async () => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    setEmailError(emailValidation.error || '');
    setPasswordError(passwordValidation.error || '');
    
    if (!emailValidation.isValid || !passwordValidation.isValid) {
      return;
    }

    try {
      await login({ email, password });
    } catch (error) {
      Alert.alert('Unable to Sign In', (error instanceof Error ? error.message : 'Please check your credentials and try again.'));
    }
  };

  const handleSocialLogin = async (provider: AuthProviderType) => {
    try {
      await loginWithProvider(provider);
    } catch (error) {
      Alert.alert('Social Login Error', (error instanceof Error ? error.message : `${provider} login failed`));
    }
  };

  const handleSwitchToRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Dark Sky inspired fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: darkSkyAnimations.fadeIn.duration,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={darkSkyColors.backgroundPrimary} />
      
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        <View style={styles.logoSection}>
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
            <Image 
              source={require('../../../assets/dragon-logo.png')}
              style={styles.dragonLogo}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.appName}>DragonWorlds HK</Text>
          <Text style={styles.appSubtitle}>2027 Championships</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Stay updated with race information, weather data, and championship content
            </Text>
            <View style={styles.divider} />
          </View>

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
            testID="login-email"
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
            testID="login-password"
          />

          <AuthButton
            title={isLoading ? 'Signing In...' : 'Sign In'}
            onPress={handleLogin}
            loading={isLoading}
            variant="primary"
            size="large"
            style={styles.loginButton}
            testID="login-submit"
          />

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <SocialLoginGroup
            providers={commonProviderSets.basic}
            onPress={handleSocialLogin}
            loading={isLoading}
            title="Or continue with"
            testID="login-social-buttons"
          />

          <View style={styles.registerSection}>
            <Text style={styles.registerPrompt}>Don't have an account?</Text>
            <TouchableOpacity onPress={handleSwitchToRegister}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkSkyColors.backgroundPrimary,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: darkSkySpacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: darkSkySpacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    marginBottom: darkSkySpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragonLogo: {
    width: 64,
    height: 64,
  },
  appName: {
    ...darkSkyTypography.displayMedium,
    color: darkSkyColors.textPrimary,
    textAlign: 'center',
    marginBottom: darkSkySpacing.xs,
  },
  appSubtitle: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: darkSkyColors.cardBackground,
    borderRadius: darkSkySpacing.cardRadius,
    padding: darkSkySpacing.cardPadding,
    marginHorizontal: darkSkySpacing.sm,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: darkSkySpacing.lg,
  },
  welcomeTitle: {
    ...darkSkyTypography.displayMedium,
    color: darkSkyColors.textPrimary,
    textAlign: 'center',
    marginBottom: darkSkySpacing.sm,
  },
  welcomeSubtitle: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.textSecondary,
    textAlign: 'center',
    marginBottom: darkSkySpacing.md,
    paddingHorizontal: darkSkySpacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: darkSkyColors.cardBorder,
    marginVertical: darkSkySpacing.sm,
    width: 40,
    alignSelf: 'center',
    opacity: 0.3,
  },
  formFields: {
    width: '100%',
  },
  loginButton: {
    marginBottom: darkSkySpacing.md,
    height: 50,
    borderRadius: darkSkySpacing.cardRadius,
    backgroundColor: darkSkyColors.accent,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    paddingVertical: darkSkySpacing.sm,
    marginBottom: darkSkySpacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.accent,
    fontWeight: '500',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: darkSkySpacing.sm,
    paddingTop: darkSkySpacing.md,
    borderTopWidth: 1,
    borderTopColor: darkSkyColors.cardBorder,
    borderTopOpacity: 0.3,
  },
  registerPrompt: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.textTertiary,
    marginRight: darkSkySpacing.xs,
  },
  registerLink: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.accent,
    fontWeight: '600',
  },
});