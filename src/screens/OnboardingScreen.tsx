import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Anchor,
  Users,
  Award,
  Eye,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Wind,
  Calendar,
  MessageSquare,
  MapPin,
  Bell
} from 'lucide-react-native';
import Animated from '../utils/reanimatedWrapper';
import { IOSCard, IOSText, IOSButton, IOSSection } from '../components/ios';
import { colors } from '../constants/theme';
import { useUserStore } from '../stores/userStore';
import type { UserType, UserProfile } from '../types';

export type OnboardingUserType = 'participant' | 'spectator' | 'official' | 'media';

interface UserTypeOption {
  id: OnboardingUserType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  benefits: string[];
  color: string;
  requiresVerification?: boolean;
}

const userTypeOptions: UserTypeOption[] = [
  {
    id: 'participant',
    title: 'Yes - I\'m Racing',
    subtitle: 'Registered competitor in Dragon Worlds HK 2027',
    icon: Anchor,
    benefits: [
      'Professional weather data',
      'Free during championship',
      'Exclusive competitor groups',
      'HSBC banking services',
      'Sino Group VIP experiences'
    ],
    color: colors.primary
  },
  {
    id: 'spectator',
    title: 'No - I\'m a Spectator',
    subtitle: 'Sailing enthusiast following the championship',
    icon: Eye,
    benefits: [
      'Live race tracking',
      'Results and standings',
      'Social groups and chat',
      'Hong Kong travel guide',
      'Event schedules and notices'
    ],
    color: colors.secondary
  },
  {
    id: 'official',
    title: 'Official/Race Committee',
    subtitle: 'Race official or committee member',
    icon: Award,
    benefits: [
      'Official coordination tools',
      'Race management features',
      'Weather monitoring',
      'Emergency communications',
      'Results management'
    ],
    color: colors.success
  },
  {
    id: 'media',
    title: 'Media/Press',
    subtitle: 'Journalist or media professional',
    icon: Users,
    benefits: [
      'Press center access',
      'High-resolution results',
      'Interview coordination',
      'Photo and video access',
      'Media kit downloads'
    ],
    color: colors.warning
  }
];

interface OnboardingScreenProps {
  onComplete: (onboardingType: OnboardingUserType) => void;
  onBack?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onBack }) => {
  const [selectedUserType, setSelectedUserType] = useState<OnboardingUserType | null>(null);
  const [showBenefits, setShowBenefits] = useState(false);

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

  const handleUserTypeSelect = (userType: OnboardingUserType) => {
    console.log('🎯 [OnboardingScreen] User type selected:', userType);
    setSelectedUserType(userType);
    setShowBenefits(true);
  };

  const handleContinue = () => {
    if (!selectedUserType) return;

    console.log('📋 [OnboardingScreen] Proceeding to account creation with type:', selectedUserType);
    onComplete(selectedUserType);
  };

  const handleLearnMore = () => {
    Alert.alert(
      'Dragon Class World Championships',
      'The Dragon Class is one of the most prestigious keelboat classes in sailing. The World Championships feature the best sailors from around the globe competing in Hong Kong\'s legendary harbors.\n\nThis app provides comprehensive coverage, professional weather data, and exclusive access to the sailing community.',
      [{ text: 'Got it' }]
    );
  };

  const handleSkip = () => {
    // Default to spectator type
    console.log('📋 [OnboardingScreen] Skipping to spectator account creation');
    onComplete('spectator');
  };

  const renderUserTypeOption = (option: UserTypeOption) => {
    const Icon = option.icon;
    const isSelected = selectedUserType === option.id;

    return (
      <IOSCard
        key={option.id}
        style={[
          styles.userTypeCard,
          isSelected && { borderColor: option.color, borderWidth: 2 }
        ]}
        onPress={() => handleUserTypeSelect(option.id)}
      >
        <View style={styles.userTypeHeader}>
          <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
            <Icon size={24} color={colors.white} />
          </View>
          <View style={styles.userTypeContent}>
            <IOSText style={styles.userTypeTitle}>{option.title}</IOSText>
            <IOSText style={styles.userTypeSubtitle}>{option.subtitle}</IOSText>
          </View>
          <ArrowRight size={20} color={colors.textMuted} />
        </View>
        {option.requiresVerification && (
          <IOSText style={styles.verificationNote}>
            ✓ Verification required
          </IOSText>
        )}
      </IOSCard>
    );
  };

  const renderBenefits = () => {
    if (!selectedUserType) return null;

    const option = userTypeOptions.find(opt => opt.id === selectedUserType);
    if (!option) return null;

    return (
      <IOSSection title={`${option.title} Benefits`} style={styles.benefitsSection}>
        {option.benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <CheckCircle size={16} color={colors.success} />
            <IOSText style={styles.benefitText}>{benefit}</IOSText>
          </View>
        ))}
      </IOSSection>
    );
  };

  const renderSpectatorFeatures = () => {
    const features = [
      { icon: Calendar, text: 'Live race tracking' },
      { icon: Users, text: 'Results and standings' }, 
      { icon: MessageSquare, text: 'Social groups and chat' },
      { icon: MapPin, text: 'Hong Kong travel guide' },
      { icon: Bell, text: 'Event schedules and notices' }
    ];

    return (
      <IOSSection title="Spectator Features" style={styles.spectatorSection}>
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <View key={index} style={styles.featureItem}>
              <Icon size={16} color={colors.primary} />
              <IOSText style={styles.featureText}>{feature.text}</IOSText>
            </View>
          );
        })}
      </IOSSection>
    );
  };

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
          Complete Setup
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
          <View style={styles.welcomeSection}>
            <IOSText style={styles.title}>Almost There!</IOSText>
            <IOSText style={styles.subtitle}>
              Help us personalize your Dragon Worlds experience
            </IOSText>
          </View>

        <IOSSection title="GET STARTED" style={styles.userTypeSection}>
          <IOSText style={styles.sectionSubtitle}>Are you a registered participant?</IOSText>
          
          <View style={styles.userTypeOptions}>
            {userTypeOptions.map(option => renderUserTypeOption(option))}
          </View>
        </IOSSection>

        {showBenefits && renderBenefits()}

        {!selectedUserType && (
          <>
            <IOSSection title="PARTICIPANT BENEFITS" style={styles.participantSection}>
              {[
                { icon: Wind, text: 'Professional weather data' },
                { icon: CheckCircle, text: 'Free during championship' },
                { icon: Users, text: 'Exclusive competitor groups' },
                { text: 'HSBC banking services' },
                { text: 'Sino Group VIP experiences' }
              ].map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <View key={index} style={styles.benefitItem}>
                    {Icon ? <Icon size={16} color={colors.primary} /> : <CheckCircle size={16} color={colors.primary} />}
                    <IOSText style={styles.benefitText}>{benefit.text}</IOSText>
                  </View>
                );
              })}
            </IOSSection>

            {renderSpectatorFeatures()}
          </>
        )}
        </ScrollView>

        <View style={styles.actions}>
          {selectedUserType ? (
            <IOSButton
              title="Continue"
              onPress={handleContinue}
              style={styles.continueButton}
            />
          ) : (
            <View style={styles.actionButtons}>
              <IOSButton
                title="Learn More"
                onPress={handleLearnMore}
                variant="secondary"
                style={styles.secondaryButton}
              />
              <IOSButton
                title="Skip"
                onPress={handleSkip}
                variant="ghost"
                style={styles.skipButton}
              />
            </View>
          )}
        </View>
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
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  userTypeSection: {
    marginTop: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  userTypeOptions: {
    gap: 12,
  },
  userTypeCard: {
    padding: 0,
  },
  userTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userTypeContent: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userTypeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  verificationNote: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  benefitsSection: {
    marginTop: 20,
  },
  participantSection: {
    marginTop: 20,
  },
  spectatorSection: {
    marginTop: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  actions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34, // Extra padding for home indicator
  },
  continueButton: {
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
  },
  skipButton: {
    flex: 1,
  },
});

export default OnboardingScreen;