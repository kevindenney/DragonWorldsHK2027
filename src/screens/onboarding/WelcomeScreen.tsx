import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Anchor, Globe, Trophy, Users } from 'lucide-react-native';
import { IOSText, IOSButton } from '../../components/ios';
import { colors, spacing, typography, shadows } from '../../constants/theme';
import Animated from '../../utils/reanimatedWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WelcomeScreenProps {
  onContinue: () => void;
  onSkip: () => void;
  onSignIn?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue, onSkip, onSignIn }) => {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Orchestrated animation sequence
    const logoAnimation = Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    const titleAnimation = Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    });

    const subtitleAnimation = Animated.timing(subtitleOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    });

    const featuresAnimation = Animated.timing(featuresOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });

    const buttonsAnimation = Animated.timing(buttonsOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    });

    // Sequential animation
    Animated.sequence([
      logoAnimation,
      titleAnimation,
      subtitleAnimation,
      featuresAnimation,
      buttonsAnimation,
    ]).start();
  }, []);

  const features = [
    {
      icon: Trophy,
      title: 'Live Results',
      description: 'Real-time race tracking and championship standings',
      color: colors.warning,
    },
    {
      icon: Anchor,
      title: 'Racing Locations',
      description: 'Interactive maps of all course areas and marks',
      color: colors.primary,
    },
    {
      icon: Globe,
      title: 'Event Schedule',
      description: 'Detailed race times, briefings, and social events',
      color: colors.accent,
    },
    {
      icon: Users,
      title: 'Official Documents',
      description: 'Sailing instructions, notices, and race updates',
      color: colors.success,
    },
  ];

  return (
    <ImageBackground
      source={require('../../../assets/adaptive-background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          '#0A1E3D', // Dark navy blue for better text contrast
          '#0d2440', // Mid-dark navy
          '#122b4a', // Stays dark at bottom for button visibility
        ]}
        locations={[0, 0.5, 1]}
        style={styles.gradientOverlay}
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Header Section with Logo */}
          <View style={styles.header}>
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

            <Animated.View style={{ opacity: titleOpacity }}>
              <IOSText style={styles.title} textStyle="largeTitle" weight="bold">
                Dragon Worlds
              </IOSText>
              <IOSText style={styles.subtitle} textStyle="title2" weight="semibold">
                Hong Kong 2027
              </IOSText>
            </Animated.View>

            <Animated.View style={{ opacity: subtitleOpacity }}>
              <IOSText style={styles.description} textStyle="body" color="secondaryLabel">
                Welcome to the official app for the Dragon Class World Championships.
                Follow the world's best sailors as they compete in Hong Kong's legendary waters.
              </IOSText>
            </Animated.View>
          </View>

          {/* Features Grid */}
          <Animated.View style={[styles.featuresContainer, { opacity: featuresOpacity }]}>
            <IOSText style={styles.featuresTitle} textStyle="headline" weight="semibold">
              Experience the Championship
            </IOSText>

            <View style={styles.featuresGrid}>
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <View key={index} style={styles.featureCard}>
                    <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}15` }]}>
                      <Icon size={24} color={feature.color} strokeWidth={2} />
                    </View>
                    <IOSText style={styles.featureTitle} textStyle="footnote" weight="semibold">
                      {feature.title}
                    </IOSText>
                    <IOSText style={styles.featureDescription} textStyle="caption2" color="secondaryLabel">
                      {feature.description}
                    </IOSText>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={[styles.buttonContainer, { opacity: buttonsOpacity }]}>
            <IOSButton
              title="Sign up"
              onPress={onContinue}
              variant="filled"
              size="large"
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />

            {onSignIn && (
              <IOSButton
                title="Sign in"
                onPress={onSignIn}
                variant="plain"
                size="large"
                style={styles.secondaryButton}
                textStyle={styles.secondaryButtonText}
              />
            )}

            <IOSButton
              title="Skip for now"
              onPress={onSkip}
              variant="plain"
              size="large"
              style={styles.tertiaryButton}
              textStyle={styles.tertiaryButtonText}
            />
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <IOSText style={styles.footerText} textStyle="caption2" color="secondaryLabel">
              Powered by the Dragon Class International Association
            </IOSText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.md, // Reduced from xl
    paddingBottom: spacing.sm, // Reduced from lg
  },
  logoContainer: {
    marginBottom: spacing.sm, // Reduced from lg
    ...shadows.medium,
  },
  logo: {
    width: 100, // Reduced from 120
    height: 100, // Reduced from 120
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 32, // Reduced from 36
    fontWeight: '700',
    marginBottom: 4, // Reduced from spacing.xs
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 22, // Reduced from 24
    fontWeight: '600',
    marginBottom: spacing.sm, // Reduced from lg
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    textAlign: 'center',
    fontSize: 14, // Reduced from 16
    lineHeight: 20, // Reduced from 24
    color: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresContainer: {
    paddingVertical: spacing.xs, // Reduced from md
    marginBottom: spacing.xs, // Reduced from md
  },
  featuresTitle: {
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: spacing.sm, // Reduced from xl
    fontSize: 18, // Reduced from 20
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: spacing.sm, // Increased for better text visibility
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    alignItems: 'center',
    ...shadows.card,
  },
  featureIconContainer: {
    width: 40, // Reduced from 48
    height: 40, // Reduced from 48
    borderRadius: 20, // Reduced from 24
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs, // Reduced from sm
  },
  featureTitle: {
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.xs,
    fontSize: 14,
    fontWeight: '600',
  },
  featureDescription: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  buttonContainer: {
    marginTop: spacing.md, // Added to create space above buttons
    paddingBottom: spacing.sm, // Reduced from lg
    paddingTop: spacing.sm, // Reduced from md
    gap: 12, // Fixed: 12px for proper spacing between buttons (requirement: 12-16px)
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    minHeight: 50, // Slightly reduced from 52
    ...shadows.button,
  },
  primaryButtonText: {
    color: '#0A1E3D',
    fontWeight: '700',
    fontSize: 17,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    minHeight: 50, // Slightly reduced from 52
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    fontSize: 15, // Slightly reduced from 16
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  tertiaryButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xs, // Reduced from lg
    paddingTop: spacing.xs, // Reduced from sm
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default WelcomeScreen;