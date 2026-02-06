import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
  Alert,
  Image,
  Platform,
} from 'react-native';
import {
  Anchor,
  ExternalLink,
  Mail,
  Globe,
  Users,
  Trophy,
  Smartphone,
  Cloud,
  GraduationCap,
  BarChart3,
  Compass,
  ChevronRight,
  Heart,
  Apple,
  Play,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { IOSText } from '../components/ios/IOSText';
import { IOSCard } from '../components/ios/IOSCard';
import { colors, spacing } from '../constants/theme';
import Constants from 'expo-constants';

// RegattaFlow Brand Colors
const BRAND = {
  primary: '#0066FF',
  accent: '#00D4AA',
  navy: '#1a365d',
  lightBlue: '#E8F4FF',
  lightGreen: '#E8FFF5',
};

interface FeatureCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, color, bgColor }) => (
  <View style={styles.featureCardWrapper}>
    <View style={[styles.featureCard, { backgroundColor: bgColor }]}>
      <View style={[styles.featureIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} strokeWidth={2} />
      </View>
      <IOSText textStyle="headline" weight="semibold" style={styles.featureTitle}>
        {title}
      </IOSText>
      <IOSText textStyle="subheadline" color="secondaryLabel" style={styles.featureDescription}>
        {description}
      </IOSText>
    </View>
  </View>
);

const openUrl = async (url: string, errorMessage: string) => {
  try {
    await Haptics.selectionAsync();
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', errorMessage);
    }
  } catch (error) {
    Alert.alert('Error', errorMessage);
  }
};

export function AboutRegattaFlowScreen() {
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || '1';

  const handleVisitWebsite = () => {
    openUrl('https://regattaflow.io', 'Could not open website');
  };

  const handleEmailPress = () => {
    openUrl('mailto:hello@regattaflow.io', 'Could not open email client');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Anchor size={48} color={BRAND.primary} strokeWidth={1.5} />
            </View>
          </View>
          <IOSText textStyle="largeTitle" weight="bold" style={styles.brandName}>
            RegattaFlow
          </IOSText>
          <IOSText textStyle="title3" color="secondaryLabel" style={styles.tagline}>
            The Complete Sailing Platform
          </IOSText>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <IOSText textStyle="body" style={styles.aboutText}>
            RegattaFlow is a comprehensive sailing race management and training platform
            built for the modern sailor, coach, and yacht club.
          </IOSText>
          <IOSText textStyle="body" style={styles.aboutText}>
            From race preparation to performance analytics, we provide the tools you need
            to understand conditions, improve your sailing, and manage regattas effectively.
          </IOSText>
        </View>

        {/* Features Grid */}
        <View style={styles.section}>
          <IOSText textStyle="title2" weight="bold" style={styles.sectionTitle}>
            Platform Features
          </IOSText>

          <View style={styles.featuresGrid}>
            <FeatureCard
              icon={Compass}
              title="Race Preparation"
              description="Wind, current, and tactical analysis for any venue worldwide"
              color={BRAND.primary}
              bgColor={BRAND.lightBlue}
            />
            <FeatureCard
              icon={BarChart3}
              title="Performance Tracking"
              description="Track your progress and analyze race results over time"
              color={BRAND.accent}
              bgColor={BRAND.lightGreen}
            />
            <FeatureCard
              icon={GraduationCap}
              title="Sailing Academy"
              description="Learn from experts with our interactive courses and tutorials"
              color="#FF6B00"
              bgColor="#FFF4EC"
            />
            <FeatureCard
              icon={Users}
              title="Coach Tools"
              description="Manage athletes, plan sessions, and track team performance"
              color="#9333EA"
              bgColor="#F5F0FF"
            />
            <FeatureCard
              icon={Trophy}
              title="Race Management"
              description="Complete regatta management for clubs and race officers"
              color="#DC2626"
              bgColor="#FEF2F2"
            />
            <FeatureCard
              icon={Cloud}
              title="Weather Intelligence"
              description="Real-time forecasts with sailing-specific insights"
              color="#0891B2"
              bgColor="#ECFEFF"
            />
          </View>
        </View>

        {/* Who It's For */}
        <View style={styles.section}>
          <IOSText textStyle="title2" weight="bold" style={styles.sectionTitle}>
            Built For
          </IOSText>

          <IOSCard variant="elevated" style={styles.audienceCard}>
            <View style={styles.audienceItem}>
              <View style={[styles.audienceDot, { backgroundColor: BRAND.primary }]} />
              <View style={styles.audienceContent}>
                <IOSText textStyle="headline" weight="semibold">Sailors</IOSText>
                <IOSText textStyle="subheadline" color="secondaryLabel">
                  Race preparation, learning resources, and performance tracking
                </IOSText>
              </View>
            </View>
            <View style={styles.audienceItem}>
              <View style={[styles.audienceDot, { backgroundColor: BRAND.accent }]} />
              <View style={styles.audienceContent}>
                <IOSText textStyle="headline" weight="semibold">Coaches</IOSText>
                <IOSText textStyle="subheadline" color="secondaryLabel">
                  Athlete management, session planning, and team analytics
                </IOSText>
              </View>
            </View>
            <View style={styles.audienceItem}>
              <View style={[styles.audienceDot, { backgroundColor: '#FF6B00' }]} />
              <View style={styles.audienceContent}>
                <IOSText textStyle="headline" weight="semibold">Clubs & Race Officers</IOSText>
                <IOSText textStyle="subheadline" color="secondaryLabel">
                  Race management, results, and fleet administration
                </IOSText>
              </View>
            </View>
          </IOSCard>
        </View>

        {/* This App */}
        <View style={styles.section}>
          <IOSText textStyle="title2" weight="bold" style={styles.sectionTitle}>
            This App
          </IOSText>

          <IOSCard variant="elevated" style={styles.appInfoCard}>
            <View style={styles.appInfoHeader}>
              <View style={styles.eventBadge}>
                <Trophy size={16} color="#FFD700" strokeWidth={2} />
                <IOSText textStyle="caption1" weight="semibold" style={styles.eventBadgeText}>
                  OFFICIAL APP
                </IOSText>
              </View>
            </View>
            <IOSText textStyle="title3" weight="bold" style={styles.eventTitle}>
              Dragon World Championships
            </IOSText>
            <IOSText textStyle="subheadline" color="secondaryLabel">
              Hong Kong 2027
            </IOSText>
            <IOSText textStyle="footnote" color="tertiaryLabel" style={styles.appInfoMeta}>
              Version {appVersion} ({buildNumber}) • Built with RegattaFlow
            </IOSText>
          </IOSCard>
        </View>

        {/* CTA Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleVisitWebsite}
            activeOpacity={0.8}
          >
            <Globe size={20} color="#FFFFFF" strokeWidth={2} />
            <IOSText textStyle="headline" weight="semibold" style={styles.ctaText}>
              Visit regattaflow.io
            </IOSText>
            <ExternalLink size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleEmailPress}
            activeOpacity={0.8}
          >
            <Mail size={18} color={BRAND.primary} strokeWidth={2} />
            <IOSText textStyle="callout" weight="medium" color="primary">
              Contact Us
            </IOSText>
          </TouchableOpacity>
        </View>

        {/* App Store Links */}
        <View style={styles.section}>
          <IOSText textStyle="title2" weight="bold" style={styles.sectionTitle}>
            Get RegattaFlow
          </IOSText>

          <View style={styles.appStoreLinks}>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.appStoreButton}
                onPress={() => openUrl('https://apps.apple.com/app/regattaflow/id6740062155', 'Could not open App Store')}
                activeOpacity={0.8}
              >
                <Apple size={22} color="#FFFFFF" strokeWidth={2} />
                <View style={styles.appStoreTextContainer}>
                  <IOSText textStyle="caption2" style={styles.appStoreLabel}>
                    Download on the
                  </IOSText>
                  <IOSText textStyle="headline" weight="semibold" style={styles.appStoreName}>
                    App Store
                  </IOSText>
                </View>
              </TouchableOpacity>
            )}

            {Platform.OS === 'android' && (
              <TouchableOpacity
                style={[styles.appStoreButton, styles.playStoreButton]}
                onPress={() => openUrl('https://play.google.com/store/apps/details?id=com.regattaflow.app', 'Could not open Play Store')}
                activeOpacity={0.8}
              >
                <Play size={22} color="#FFFFFF" strokeWidth={2} />
                <View style={styles.appStoreTextContainer}>
                  <IOSText textStyle="caption2" style={styles.appStoreLabel}>
                    GET IT ON
                  </IOSText>
                  <IOSText textStyle="headline" weight="semibold" style={styles.appStoreName}>
                    Google Play
                  </IOSText>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.madeWithLove}>
            <IOSText textStyle="caption2" color="tertiaryLabel">
              Made with
            </IOSText>
            <Heart size={12} color="#FF3B30" fill="#FF3B30" />
            <IOSText textStyle="caption2" color="tertiaryLabel">
              for sailors everywhere
            </IOSText>
          </View>
          <IOSText textStyle="caption2" color="quaternaryLabel" style={styles.copyright}>
            © 2024-2027 RegattaFlow. All rights reserved.
          </IOSText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BRAND.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  brandName: {
    color: BRAND.navy,
    marginBottom: 4,
  },
  tagline: {
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.lg,
    color: colors.text,
  },
  aboutText: {
    lineHeight: 24,
    marginBottom: spacing.md,
    color: colors.text,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  featureCardWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  featureCard: {
    padding: spacing.md,
    borderRadius: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    marginBottom: 4,
  },
  featureDescription: {
    lineHeight: 18,
  },
  audienceCard: {
    padding: spacing.lg,
  },
  audienceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  audienceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: spacing.md,
  },
  audienceContent: {
    flex: 1,
  },
  appInfoCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  appInfoHeader: {
    marginBottom: spacing.sm,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  eventBadgeText: {
    color: '#B8860B',
  },
  eventTitle: {
    marginTop: spacing.sm,
    marginBottom: 4,
    color: colors.text,
  },
  appInfoMeta: {
    marginTop: spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  ctaText: {
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: spacing.md,
    gap: 8,
  },
  appStoreLinks: {
    gap: spacing.md,
  },
  appStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 12,
  },
  playStoreButton: {
    backgroundColor: '#01875f',
  },
  appStoreTextContainer: {
    flex: 1,
  },
  appStoreLabel: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  appStoreName: {
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  madeWithLove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  copyright: {
    textAlign: 'center',
  },
});
