import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react-native';
import Animated from '../../utils/reanimatedWrapper';
import { IOSCard, IOSText, IOSButton, IOSSection } from '../../components/ios';
import { SocialLoginButton } from '../../components/auth/SocialLoginButton';
import { AuthInput } from '../../components/auth/AuthInput';
import { colors } from '../../constants/theme';
import { useAuth } from '../../auth/useAuth';
import { useUserStore } from '../../stores/userStore';
import { AuthProvider } from '../../auth/authTypes';
import type { UserType, OnboardingUserType, UserProfile } from '../../types';

interface AccountCreationScreenProps {
  onComplete: (userType: UserType, profile: Partial<UserProfile>) => void;
  onBack?: () => void;
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

export const AccountCreationScreen: React.FC<AccountCreationScreenProps> = ({ onComplete, onBack }) => {
  const { register, loginWithProvider, isLoading } = useAuth();
  const { selectedOnboardingType, completeOnboarding } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
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

  const handleEmailSignUp = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setDisplayNameError('');

    // Validate inputs
    let hasErrors = false;

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }

    if (!validateDisplayName(displayName)) {
      setDisplayNameError('Display name must be at least 2 characters');
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      // Map onboarding type to user type
      const userTypeMapping: Record<OnboardingUserType, UserType> = {
        participant: 'participant',
        spectator: 'spectator',
        official: 'participant', // Officials get participant-level access
        media: 'spectator' // Media gets spectator-level access initially
      };

      const mappedUserType = userTypeMapping[selectedOnboardingType || 'spectator'];

      const userData: Partial<UserProfile> = {
        email,
        displayName,
        firstName: displayName.split(' ')[0] || displayName,
        lastName: displayName.split(' ').slice(1).join(' ') || '',
        onboardingType: selectedOnboardingType,
        needsVerification: false,
        joinedAt: new Date().toISOString(),
        preferences: {
          weatherAlerts: selectedOnboardingType === 'participant',
          raceNotifications: true,
          socialUpdates: selectedOnboardingType !== 'official',
          marketingEmails: false
        }
      };

      await register({
        email,
        password,
        displayName
      });

      // Complete onboarding after successful registration
      completeOnboarding(mappedUserType, userData);
      onComplete(mappedUserType, userData);
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
    }
  };

  const handleSocialSignUp = async (provider: 'google' | 'apple') => {
    try {
      const authProvider = provider === 'google' ? AuthProvider.GOOGLE : AuthProvider.APPLE;
      await loginWithProvider(authProvider);

      // Map onboarding type to user type
      const userTypeMapping: Record<OnboardingUserType, UserType> = {
        participant: 'participant',
        spectator: 'spectator',
        official: 'participant',
        media: 'spectator'
      };

      const mappedUserType = userTypeMapping[selectedOnboardingType || 'spectator'];

      const userData: Partial<UserProfile> = {
        onboardingType: selectedOnboardingType,
        needsVerification: false,
        joinedAt: new Date().toISOString(),
        preferences: {
          weatherAlerts: selectedOnboardingType === 'participant',
          raceNotifications: true,
          socialUpdates: selectedOnboardingType !== 'official',
          marketingEmails: false
        }
      };

      // Complete onboarding after successful social login
      completeOnboarding(mappedUserType, userData);
      onComplete(mappedUserType, userData);
    } catch (error) {
      Alert.alert('Sign Up Failed', error.message || `Failed to sign up with ${provider}`);
    }
  };

  const selectedUserType = selectedOnboardingType || 'spectator';
  const userInfo = userTypeInfo[selectedUserType];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        <IOSText style={styles.headerTitle} textStyle="headline" weight="semibold">
          Create Account
        </IOSText>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.animatedContent,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Selected User Type Display */}
          <IOSSection style={styles.userTypeSection}>
            <IOSCard style={[styles.selectedUserTypeCard, { borderColor: userInfo.color }]}>
              <View style={styles.selectedUserTypeHeader}>
                <View style={[styles.selectedUserTypeIcon, { backgroundColor: userInfo.color }]}>
                  <Text style={styles.selectedUserTypeEmoji}>{userInfo.icon}</Text>
                </View>
                <View style={styles.selectedUserTypeContent}>
                  <IOSText style={styles.selectedUserTypeTitle}>{userInfo.title}</IOSText>
                  <IOSText style={styles.selectedUserTypeDescription}>{userInfo.description}</IOSText>
                </View>
              </View>
            </IOSCard>
          </IOSSection>

          {/* Social Sign Up Options */}
          <IOSSection title="QUICK SIGN UP" style={styles.socialSection}>
            <View style={styles.socialButtons}>
              <SocialLoginButton
                provider={AuthProvider.GOOGLE}
                onPress={() => handleSocialSignUp('google')}
                isLoading={isLoading}
                style={styles.socialButton}
              />
              <SocialLoginButton
                provider={AuthProvider.APPLE}
                onPress={() => handleSocialSignUp('apple')}
                isLoading={isLoading}
                style={styles.socialButton}
              />
            </View>
          </IOSSection>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <IOSText style={styles.dividerText}>or create with email</IOSText>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Sign Up Form */}
          <IOSSection title="CREATE ACCOUNT" style={styles.formSection}>
            <View style={styles.formContainer}>
              <AuthInput
                icon={User}
                placeholder="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                error={displayNameError}
                autoCapitalize="words"
                style={styles.input}
              />

              <AuthInput
                icon={Mail}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <AuthInput
                icon={Lock}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                secureTextEntry
                style={styles.input}
              />

              <IOSButton
                title="Create Account"
                onPress={handleEmailSignUp}
                loading={isLoading}
                style={styles.createButton}
              />
            </View>
          </IOSSection>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <IOSText style={styles.termsText}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </IOSText>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
  },
  headerSpacer: {
    width: 44,
  },
  animatedContent: {
    flex: 1,
  },
  userTypeSection: {
    marginTop: 12,
  },
  selectedUserTypeCard: {
    borderWidth: 2,
    padding: 0,
  },
  selectedUserTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  selectedUserTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedUserTypeEmoji: {
    fontSize: 24,
  },
  selectedUserTypeContent: {
    flex: 1,
  },
  selectedUserTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  selectedUserTypeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  socialSection: {
    marginTop: 20,
  },
  socialButtons: {
    gap: 8,
  },
  socialButton: {
    marginBottom: 0,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.textMuted,
  },
  formSection: {
    marginTop: 0,
  },
  formContainer: {
    gap: 12,
  },
  input: {
    marginBottom: 0,
  },
  createButton: {
    marginTop: 4,
  },
  termsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AccountCreationScreen;