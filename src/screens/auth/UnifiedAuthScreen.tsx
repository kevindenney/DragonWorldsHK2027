import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X, Mail, Lock, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated from '../../utils/reanimatedWrapper';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import { AuthButton } from '../../components/auth/AuthButton';
import { AuthInput } from '../../components/auth/AuthInput';
import { SocialLoginButton } from '../../components/auth/SocialLoginButton';
import { useAuth } from '../../auth/useAuth';
import { useUserStore } from '../../stores/userStore';
import { AuthProvider } from '../../auth/authTypes';
import type { UserType, OnboardingUserType, UserProfile } from '../../types';

const { colors, spacing, typography, borderRadius, shadows } = dragonChampionshipsLightTheme;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UnifiedAuthScreenProps {
  navigation: any;
  route?: {
    params?: {
      mode?: 'signin' | 'signup';
    };
  };
}

// User type info for display
const userTypeInfo = {
  participant: {
    title: 'Racing Competitor',
    description: 'Professional sailing features and competitor access',
    icon: '⛵',
    color: colors.primary
  },
  spectator: {
    title: 'Sailing Enthusiast',
    description: 'Follow the championship and connect with the community',
    icon: '👁️',
    color: colors.secondary
  },
  official: {
    title: 'Race Official',
    description: 'Official coordination tools and race management',
    icon: '🏆',
    color: colors.success
  },
  media: {
    title: 'Media Professional',
    description: 'Press access and media coordination tools',
    icon: '📰',
    color: colors.warning
  }
};

export const UnifiedAuthScreen: React.FC<UnifiedAuthScreenProps> = ({ navigation, route }) => {
  const { login, register, loginWithProvider, isLoading } = useAuth();
  const { selectedOnboardingType, setUserType, completeOnboarding } = useUserStore();

  // Form state
  const initialMode = route?.params?.mode || 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [selectedUserType] = useState<OnboardingUserType>('spectator'); // Default to spectator

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateDisplayName = (name: string) => {
    return name.trim().length >= 2;
  };

  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
    setDisplayNameError('');
  };

  const validateForm = (): boolean => {
    clearErrors();
    let hasErrors = false;

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }

    if (mode === 'signup' && !validateDisplayName(displayName)) {
      setDisplayNameError('Display name must be at least 2 characters');
      hasErrors = true;
    }

    return !hasErrors;
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) return;

    try {
      await Haptics.selectionAsync();

      if (mode === 'signin') {
        await login({ email, password });
      } else {
        // Sign up flow
        const userTypeMapping: Record<OnboardingUserType, UserType> = {
          participant: 'participant',
          spectator: 'spectator',
          official: 'participant',
          media: 'spectator'
        };

        const mappedUserType = userTypeMapping[selectedUserType];
        const userData: Partial<UserProfile> = {
          email,
          displayName,
          firstName: displayName.split(' ')[0] || displayName,
          lastName: displayName.split(' ').slice(1).join(' ') || '',
          onboardingType: selectedUserType,
          needsVerification: false,
          joinedAt: new Date().toISOString(),
          preferences: {
            weatherAlerts: selectedUserType === 'participant',
            raceNotifications: true,
            socialUpdates: selectedUserType !== 'official',
            marketingEmails: false
          }
        };

        await register({
          email,
          password,
          displayName,
          ...userData
        });

        completeOnboarding(mappedUserType, userData);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        mode === 'signin' ? 'Sign In Failed' : 'Sign Up Failed',
        (error instanceof Error ? error.message : 'An error occurred during authentication')
      );
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    try {
      await Haptics.selectionAsync();

      // Handle Apple login - show coming soon message
      if (provider === 'apple') {
        Alert.alert(
          'Apple Login Coming Soon',
          'Apple Sign In is not yet available. Please use Google Sign In or Email authentication instead.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      const authProvider = provider === 'google' ? AuthProvider.GOOGLE : AuthProvider.APPLE;
      await loginWithProvider(authProvider);

      if (mode === 'signup') {
        // Complete onboarding for social sign-up
        const userTypeMapping: Record<OnboardingUserType, UserType> = {
          participant: 'participant',
          spectator: 'spectator',
          official: 'participant',
          media: 'spectator'
        };

        const mappedUserType = userTypeMapping[selectedUserType];
        const userData: Partial<UserProfile> = {
          onboardingType: selectedUserType,
          needsVerification: false,
          joinedAt: new Date().toISOString(),
          preferences: {
            weatherAlerts: selectedUserType === 'participant',
            raceNotifications: true,
            socialUpdates: selectedUserType !== 'official',
            marketingEmails: false
          }
        };

        completeOnboarding(mappedUserType, userData);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Authentication Failed',
        (error instanceof Error ? error.message : `Failed to ${mode === 'signin' ? 'sign in' : 'sign up'} with ${provider}`)
      );
    }
  };

  const handleCancel = async () => {
    await Haptics.selectionAsync();
    navigation.goBack();
  };

  const switchMode = async () => {
    await Haptics.selectionAsync();
    setMode(mode === 'signin' ? 'signup' : 'signin');
    clearErrors();
  };


  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.primary} />

      {/* Background Gradient */}
      <View style={styles.backgroundGradient} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel and go back"
          >
            <X size={24} color={colors.textInverted} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>DragonWorlds HK</Text>
            <Text style={styles.headerSubtitle}>2027 Championships</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.contentContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Mode Toggle */}
              <View style={styles.modeToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    mode === 'signin' && styles.modeToggleButtonActive
                  ]}
                  onPress={() => mode !== 'signin' && switchMode()}
                >
                  <Text style={[
                    styles.modeToggleText,
                    mode === 'signin' && styles.modeToggleTextActive
                  ]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    mode === 'signup' && styles.modeToggleButtonActive
                  ]}
                  onPress={() => mode !== 'signup' && switchMode()}
                >
                  <Text style={[
                    styles.modeToggleText,
                    mode === 'signup' && styles.modeToggleTextActive
                  ]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>


              {/* Social Authentication */}
              <View style={styles.socialSection}>
                <Text style={styles.sectionTitle}>
                  {mode === 'signin' ? 'Quick Sign In' : 'Quick Sign Up'}
                </Text>

                <View style={styles.socialButtons}>
                  <SocialLoginButton
                    provider={AuthProvider.GOOGLE}
                    onPress={() => handleSocialAuth('google')}
                    disabled={isLoading}
                    variant="outlined"
                    size="medium"
                  />

                  {Platform.OS === 'ios' && (
                    <SocialLoginButton
                      provider={AuthProvider.APPLE}
                      onPress={() => handleSocialAuth('apple')}
                      disabled={isLoading}
                      variant="filled"
                      size="medium"
                    />
                  )}
                </View>
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or {mode === 'signin' ? 'sign in' : 'create account'} with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email Form */}
              <View style={styles.formSection}>
                {mode === 'signup' && (
                  <View style={styles.inputContainer}>
                    <AuthInput
                      label="Display Name"
                      leftIcon={<User size={20} color={colors.primary} />}
                      value={displayName}
                      onChangeText={setDisplayName}
                      error={displayNameError}
                      autoCapitalize="words"
                      isRequired
                    />
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <AuthInput
                    label="Email Address"
                    leftIcon={<Mail size={20} color={colors.primary} />}
                    value={email}
                    onChangeText={setEmail}
                    error={emailError}
                    type="email"
                    isRequired
                  />
                </View>

                <View style={styles.inputContainer}>
                  <AuthInput
                    label="Password"
                    leftIcon={<Lock size={20} color={colors.primary} />}
                    value={password}
                    onChangeText={setPassword}
                    error={passwordError}
                    type="password"
                    isRequired
                  />
                </View>

                {mode === 'signin' && (
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}

                <AuthButton
                  title={isLoading ?
                    (mode === 'signin' ? 'Signing In...' : 'Creating Account...') :
                    (mode === 'signin' ? 'Sign In' : 'Create Account')
                  }
                  onPress={handleEmailAuth}
                  loading={isLoading}
                  style={styles.authButton}
                />
              </View>

              {/* Terms and Footer */}
              {mode === 'signup' && (
                <View style={styles.termsContainer}>
                  <Text style={styles.termsText}>
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.headlineSmall,
    color: colors.textInverted,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textInverted,
    opacity: 0.8,
    marginTop: 1,
  },
  headerSpacer: {
    width: 36,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  contentContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
    ...shadows.cardLarge,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: 3,
    margin: spacing.md,
  },
  modeToggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  modeToggleButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.cardSmall,
  },
  modeToggleText: {
    ...typography.labelMedium,
    color: colors.textMuted,
  },
  modeToggleTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  socialSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontSize: 13,
  },
  socialButtons: {
    gap: spacing.xs,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
    fontSize: 11,
  },
  formSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  inputContainer: {
    marginBottom: spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xs,
  },
  forgotPasswordText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
    fontSize: 11,
  },
  authButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.xs / 2,
  },
  termsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  termsText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
    fontSize: 10,
  },
});

export default UnifiedAuthScreen;