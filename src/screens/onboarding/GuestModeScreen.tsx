import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  UserPlus,
  Eye,
  Lock,
  Bell,
  Cloud,
  Users,
  Star,
  ArrowLeft,
  Check,
  AlertCircle
} from 'lucide-react-native';
import { IOSText, IOSButton, IOSCard } from '../../components/ios';
import { colors, spacing, typography, shadows } from '../../constants/theme';
import Animated from '../../utils/reanimatedWrapper';

interface GuestModeScreenProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
  onContinueAsGuest: () => void;
  onBack: () => void;
}

interface AccessLevel {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  features: {
    text: string;
    included: boolean;
    premium?: boolean;
  }[];
  action: {
    primary: string;
    secondary?: string;
  };
  color: string;
}

const accessLevels: AccessLevel[] = [
  {
    id: 'account',
    title: 'Create Account',
    subtitle: 'Full championship experience',
    icon: UserPlus,
    color: colors.primary,
    features: [
      { text: 'Live race notifications', included: true },
      { text: 'Weather alerts', included: true },
      { text: 'Personalized schedule', included: true },
      { text: 'Social features', included: true },
      { text: 'Offline access', included: true },
      { text: 'Professional weather data', included: true, premium: true },
      { text: 'Data export', included: true },
      { text: 'Cross-device sync', included: true },
    ],
    action: {
      primary: 'Create Free Account',
      secondary: 'Sign In',
    },
  },
  {
    id: 'guest',
    title: 'Continue as Guest',
    subtitle: 'Essential racing features',
    icon: Eye,
    color: colors.textSecondary,
    features: [
      { text: 'Live race notifications', included: false },
      { text: 'Weather alerts', included: false },
      { text: 'Personalized schedule', included: false },
      { text: 'Social features', included: false },
      { text: 'Offline access', included: false },
      { text: 'Basic race tracking', included: true },
      { text: 'Results and standings', included: true },
      { text: 'Schedule viewing', included: true },
    ],
    action: {
      primary: 'Continue as Guest',
    },
  },
];

export const GuestModeScreen: React.FC<GuestModeScreenProps> = ({
  onCreateAccount,
  onSignIn,
  onContinueAsGuest,
  onBack
}) => {
  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(cardsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cardsTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const renderAccessCard = (access: AccessLevel) => {
    const Icon = access.icon;
    const isAccount = access.id === 'account';

    return (
      <Animated.View
        style={{
          opacity: cardsOpacity,
          transform: [{ translateY: cardsTranslateY }],
        }}
      >
        <IOSCard
          style={[styles.accessCard, ...(isAccount ? [styles.recommendedCard] : [])]}
          onPress={isAccount ? onCreateAccount : onContinueAsGuest}
        >
          {isAccount && (
            <View style={styles.recommendedBadge}>
              <Star size={12} color={colors.secondary} fill={colors.secondary} />
              <IOSText style={styles.recommendedText} textStyle="caption2" weight="bold">
                RECOMMENDED
              </IOSText>
            </View>
          )}

          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${access.color}15` }]}>
              <Icon size={32} color={access.color} strokeWidth={1.5} />
            </View>
            <View style={styles.cardHeaderText}>
              <IOSText style={styles.cardTitle} textStyle="title2" weight="bold">
                {access.title}
              </IOSText>
              <IOSText style={styles.cardSubtitle} textStyle="footnote" color="secondaryLabel">
                {access.subtitle}
              </IOSText>
            </View>
          </View>

          {/* Features List */}
          <View style={styles.featuresList}>
            {access.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  {feature.included ? (
                    <Check size={16} color={colors.success} strokeWidth={2} />
                  ) : (
                    <View style={styles.unavailableIcon} />
                  )}
                </View>
                <IOSText
                  style={[
                    styles.featureText,
                    !feature.included && styles.unavailableText,
                  ]}
                  textStyle="footnote"
                >
                  {feature.text}
                </IOSText>
                {feature.premium && (
                  <View style={styles.premiumBadge}>
                    <IOSText style={styles.premiumText} textStyle="caption2" weight="bold">
                      PRO
                    </IOSText>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Action Button */}
          <View style={styles.cardActions}>
            <IOSButton
              title={access.action.primary}
              onPress={isAccount ? onCreateAccount : onContinueAsGuest}
              variant={isAccount ? 'filled' : 'gray'}
              size="large"
              style={[styles.primaryButton, ...(isAccount ? [{ backgroundColor: access.color }] : [])]}
            />
            {access.action.secondary && (
              <TouchableOpacity onPress={onSignIn} style={styles.secondaryAction}>
                <IOSText style={styles.secondaryActionText} textStyle="body" color="systemBlue">
                  {access.action.secondary}
                </IOSText>
              </TouchableOpacity>
            )}
          </View>
        </IOSCard>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <IOSText style={styles.headerTitle} textStyle="headline" weight="semibold">
          Choose Your Experience
        </IOSText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <Animated.View style={[styles.intro, { opacity: headerOpacity }]}>
          <IOSText style={styles.introTitle} textStyle="title1" weight="bold">
            Welcome to Dragon Worlds
          </IOSText>
          <IOSText style={styles.introDescription} textStyle="body" color="secondaryLabel">
            Choose how you'd like to experience the championship. You can always upgrade later.
          </IOSText>
        </Animated.View>

        {/* Access Options */}
        <View style={styles.accessOptions}>
          {accessLevels.map((access) => (
            <View key={access.id}>
              {renderAccessCard(access)}
            </View>
          ))}
        </View>

        {/* Info Section */}
        <Animated.View style={[styles.infoSection, { opacity: headerOpacity }]}>
          <View style={styles.infoCard}>
            <AlertCircle size={20} color={colors.info} />
            <View style={styles.infoContent}>
              <IOSText style={styles.infoTitle} textStyle="footnote" weight="semibold">
                Your data is secure
              </IOSText>
              <IOSText style={styles.infoText} textStyle="caption1" color="secondaryLabel">
                We only collect essential data to enhance your racing experience.
                No personal information is shared with third parties.
              </IOSText>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  scrollView: {
    flex: 1,
  },
  intro: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  introTitle: {
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.md,
  },
  introDescription: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  accessOptions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  accessCard: {
    padding: spacing.lg,
    position: 'relative',
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.medium,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: spacing.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    ...shadows.small,
  },
  recommendedText: {
    color: colors.background,
    fontSize: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    lineHeight: 18,
  },
  featuresList: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  featureText: {
    flex: 1,
    color: colors.text,
    lineHeight: 20,
  },
  unavailableText: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  premiumBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    color: colors.text,
    fontSize: 9,
  },
  cardActions: {
    gap: spacing.md,
  },
  primaryButton: {
    borderRadius: 12,
    ...shadows.button,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryActionText: {
    fontSize: 16,
  },
  infoSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoText: {
    lineHeight: 16,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});

export default GuestModeScreen;