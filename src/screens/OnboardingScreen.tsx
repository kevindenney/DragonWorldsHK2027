import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Anchor,
  Users,
  Award,
  Eye,
  ArrowRight,
  CheckCircle,
  Wind,
  Calendar,
  MessageSquare,
  MapPin,
  Bell
} from 'lucide-react-native';
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
    color: colors.primary,
    requiresVerification: true
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
    color: colors.success,
    requiresVerification: true
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
    color: colors.warning,
    requiresVerification: true
  }
];

interface OnboardingScreenProps {
  onComplete: (userType: UserType, profile: Partial<UserProfile>) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [selectedUserType, setSelectedUserType] = useState<OnboardingUserType | null>(null);
  const [showBenefits, setShowBenefits] = useState(false);
  const { setUserType, setProfile } = useUserStore();

  const handleUserTypeSelect = (userType: OnboardingUserType) => {
    setSelectedUserType(userType);
    setShowBenefits(true);
  };

  const handleContinue = () => {
    if (!selectedUserType) return;

    const option = userTypeOptions.find(opt => opt.id === selectedUserType);
    
    if (option?.requiresVerification) {
      Alert.alert(
        'Verification Required',
        `To access ${option.title.toLowerCase()} features, you'll need to verify your credentials in the next step.`,
        [
          {
            text: 'Continue',
            onPress: () => proceedWithUserType()
          },
          {
            text: 'Back',
            style: 'cancel'
          }
        ]
      );
    } else {
      proceedWithUserType();
    }
  };

  const proceedWithUserType = () => {
    if (!selectedUserType) return;

    // Map onboarding type to app user type
    const userTypeMapping: Record<OnboardingUserType, UserType> = {
      participant: 'participant',
      spectator: 'spectator', 
      official: 'participant', // Officials get participant-level access
      media: 'spectator' // Media gets spectator-level access initially
    };

    const mappedUserType = userTypeMapping[selectedUserType];
    const option = userTypeOptions.find(opt => opt.id === selectedUserType);

    const profile: Partial<UserProfile> = {
      onboardingType: selectedUserType,
      needsVerification: option?.requiresVerification || false,
      joinedAt: new Date().toISOString(),
      preferences: {
        weatherAlerts: selectedUserType === 'participant',
        raceNotifications: true,
        socialUpdates: selectedUserType !== 'official',
        marketingEmails: false
      }
    };

    // Update stores
    setUserType(mappedUserType);
    setProfile(profile);

    // Complete onboarding
    onComplete(mappedUserType, profile);
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
    setUserType('spectator');
    onComplete('spectator', { 
      onboardingType: 'spectator',
      needsVerification: false,
      joinedAt: new Date().toISOString()
    });
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
          <ArrowRight size={20} color={colors.gray[400]} />
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <IOSText style={styles.title}>Welcome to Dragon World Championships</IOSText>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
    color: colors.gray[600],
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
    color: colors.gray[600],
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