import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, Platform, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated from '../../utils/reanimatedWrapper';
import { SocialLoginButton } from '../../components/auth/SocialLoginButton';
import { AuthProvider } from '../../auth/authTypes';
import { useAuth } from '../../auth/useAuth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WelcomeScreenProps {
  onContinue: () => void;
  onSignIn?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue, onSignIn }) => {
  const { loginWithProvider, isLoading } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Orchestrated animation sequence - faster and cleaner
    Animated.sequence([
      // Logo appears first
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Then content
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Finally buttons
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await Haptics.selectionAsync();
      setLoadingProvider('google');
      await loginWithProvider(AuthProvider.GOOGLE);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation will happen automatically via auth state change
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Sign In Failed',
        error?.message || 'Failed to sign in with Google. Please try again.'
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await Haptics.selectionAsync();
      setLoadingProvider('apple');
      await loginWithProvider(AuthProvider.APPLE);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation will happen automatically via auth state change
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Sign In Failed',
        error?.message || 'Failed to sign in with Apple. Please try again.'
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleEmailSignUp = async () => {
    await Haptics.selectionAsync();
    onContinue();
  };

  const handleSignIn = async () => {
    await Haptics.selectionAsync();
    onSignIn?.();
  };

  return (
    <LinearGradient
      colors={['#0A1E3D', '#0D2440', '#122B4A']}
      locations={[0, 0.5, 1]}
      style={styles.gradientOverlay}
    >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Main Content - Centered */}
          <View style={styles.mainContent}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [{ scale: logoScale }],
                  opacity: logoOpacity,
                },
              ]}
            >
              <Image
                source={require('../../../assets/dragon-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Content Section */}
          <Animated.View style={[styles.contentSection, { opacity: contentOpacity }]}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.titleText}>Dragon Worlds</Text>
            <Text style={styles.subtitleText}>Hong Kong 2027</Text>
            <Text style={styles.descriptionText}>
              The official app for the Dragon Class World Championships
            </Text>
          </Animated.View>

          {/* Buttons Section */}
          <Animated.View style={[styles.buttonsSection, { opacity: buttonsOpacity }]}>
            {/* Primary: Google Sign In/Sign Up */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading || loadingProvider !== null}
              activeOpacity={0.8}
            >
              <View style={styles.googleIconContainer}>
                <Image
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  style={styles.googleIcon}
                  defaultSource={require('../../../assets/dragon-logo.png')}
                />
              </View>
              <Text style={styles.googleButtonText}>
                {loadingProvider === 'google' ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            {/* Secondary: Apple Sign In/Sign Up (all platforms) */}
            <TouchableOpacity
              style={styles.appleButton}
              onPress={handleAppleSignIn}
              disabled={isLoading || loadingProvider !== null}
              activeOpacity={0.8}
            >
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.appleButtonText}>
                {loadingProvider === 'apple' ? 'Signing in...' : 'Continue with Apple'}
              </Text>
            </TouchableOpacity>

            {/* Tertiary: Email Sign In/Sign Up */}
            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleEmailSignUp}
              activeOpacity={0.7}
            >
              <Mail size={18} color="#FFFFFF" strokeWidth={2} style={styles.emailIcon} />
              <Text style={styles.emailButtonText}>Continue with Email</Text>
            </TouchableOpacity>
          </Animated.View>
          </View>

          {/* Footer Section - Sign In Link + Terms */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.signInLink}
              onPress={handleSignIn}
              activeOpacity={0.7}
            >
              <Text style={styles.signInLinkText}>
                Already have an account? <Text style={styles.signInLinkBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service
            </Text>
          </View>
        </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Main content wrapper - centered vertically
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },

  // Logo Section
  logoSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 140,
    height: 140,
  },

  // Content Section
  contentSection: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Buttons Section
  buttonsSection: {
    paddingTop: 8,
  },

  // Google Button - Primary CTA
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1F1F',
  },

  // Apple Button - Secondary
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  appleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: 10,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Email Button - Tertiary
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  emailIcon: {
    marginRight: 10,
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Sign In Link
  signInLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  signInLinkText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signInLinkBold: {
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Footer
  footer: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});

export default WelcomeScreen;
