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
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue, onSkip }) => {
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
      description: 'Real-time race tracking and standings',
      color: colors.warning,
    },
    {
      icon: Globe,
      title: 'Global Championship',
      description: 'World-class Dragon Class racing in Hong Kong',
      color: colors.primary,
    },
    {
      icon: Anchor,
      title: 'Course Maps',
      description: 'Interactive sailing maps and weather data',
      color: colors.accent,
    },
    {
      icon: Users,
      title: 'Racing Community',
      description: 'Connect with sailors from around the world',
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
          'rgba(43, 92, 230, 0.95)', // Primary blue with opacity
          'rgba(43, 92, 230, 0.85)',
          'rgba(255, 255, 255, 0.95)', // White fade
        ]}
        locations={[0, 0.6, 1]}
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
              title="Get Started"
              onPress={onContinue}
              variant="filled"
              size="large"
              style={styles.primaryButton}
            />

            <IOSButton
              title="Skip for now"
              onPress={onSkip}
              variant="plain"
              size="large"
              style={styles.secondaryButton}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  logoContainer: {
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    color: colors.background,
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: colors.background,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  featuresContainer: {
    flex: 1,
    paddingVertical: spacing.xl,
  },
  featuresTitle: {
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.lg,
    fontSize: 20,
    fontWeight: '600',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    ...shadows.button,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  footerText: {
    fontSize: 11,
    opacity: 0.7,
  },
});

export default WelcomeScreen;