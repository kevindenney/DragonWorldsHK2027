import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
  Alert,
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
  MapPin,
  Calendar,
  Star,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { dragonChampionshipsLightTheme } from '../constants/dragonChampionshipsTheme';
import { REGATTA_FLOW_BRANDING } from '../constants/regattaFlowBranding';
import Constants from 'expo-constants';

const { colors, spacing, typography, shadows, borderRadius } = dragonChampionshipsLightTheme;

interface ServiceItemProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ icon: Icon, title, description }) => (
  <View style={styles.serviceItem}>
    <View style={styles.serviceIcon}>
      <Icon size={20} color={REGATTA_FLOW_BRANDING.colors.primary} strokeWidth={2} />
    </View>
    <View style={styles.serviceContent}>
      <Text style={styles.serviceTitle}>{title}</Text>
      <Text style={styles.serviceDescription}>{description}</Text>
    </View>
  </View>
);

interface ContactItemProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  onPress?: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ icon: Icon, label, value, onPress }) => (
  <TouchableOpacity style={styles.contactItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.contactIcon}>
      <Icon size={18} color={REGATTA_FLOW_BRANDING.colors.accent} strokeWidth={2} />
    </View>
    <View style={styles.contactContent}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
    {onPress && (
      <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
    )}
  </TouchableOpacity>
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

  const handleEmailPress = () => {
    openUrl(`mailto:${REGATTA_FLOW_BRANDING.contact.email}`, 'Could not open email client');
  };

  const handleWebsitePress = () => {
    openUrl(REGATTA_FLOW_BRANDING.contact.website, 'Could not open website');
  };

  const handleSupportPress = () => {
    openUrl(`mailto:${REGATTA_FLOW_BRANDING.contact.support}`, 'Could not open email client');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Anchor size={40} color={REGATTA_FLOW_BRANDING.colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.companyName}>{REGATTA_FLOW_BRANDING.name}</Text>
          <Text style={styles.tagline}>{REGATTA_FLOW_BRANDING.tagline}</Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About RegattaFlow</Text>
          <Text style={styles.sectionContent}>
            {REGATTA_FLOW_BRANDING.description} We combine deep sailing expertise with modern technology to deliver apps that enhance the racing experience for competitors, organizers, and spectators alike.
          </Text>
          <Text style={styles.sectionContent}>
            Founded in {REGATTA_FLOW_BRANDING.founded}, we've focused on understanding the unique challenges of sailing events and creating technology solutions that truly serve the sailing community.
          </Text>
        </View>

        {/* Parent Company Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OceanFlow - Our Parent Company</Text>
          <Text style={styles.sectionContent}>
            {REGATTA_FLOW_BRANDING.parentCompany.description}
          </Text>
          <Text style={styles.sectionContent}>
            OceanFlow's expertise in logistics and transportation AI technology provides RegattaFlow with advanced technical capabilities and infrastructure to deliver world-class sailing applications.
          </Text>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <View style={styles.servicesContainer}>
            <ServiceItem
              icon={Smartphone}
              title="Custom Regatta Apps"
              description="Tailored mobile applications for yacht clubs and class associations"
            />
            <ServiceItem
              icon={Cloud}
              title="Real-time Weather Integration"
              description="Advanced meteorological data and sailing-specific forecasts"
            />
            <ServiceItem
              icon={Trophy}
              title="Race Management Tools"
              description="Scheduling, results tracking, and competitor communication"
            />
            <ServiceItem
              icon={Users}
              title="Spectator Engagement"
              description="Live tracking, leaderboards, and social features"
            />
            <ServiceItem
              icon={Globe}
              title="Multi-platform Development"
              description="iOS, Android, and web applications using modern frameworks"
            />
          </View>
        </View>

        {/* Portfolio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <View style={styles.portfolioCard}>
            <View style={styles.portfolioHeader}>
              <Star size={20} color={REGATTA_FLOW_BRANDING.colors.accent} />
              <Text style={styles.portfolioTitle}>Dragon World Championships HK 2027</Text>
            </View>
            <Text style={styles.portfolioDescription}>
              Official championship app featuring real-time weather data, interactive sailing charts, race schedules, and spectator engagement tools.
            </Text>
            <View style={styles.portfolioFeatures}>
              <View style={styles.featureTag}>
                <Text style={styles.featureText}>Real-time Weather</Text>
              </View>
              <View style={styles.featureTag}>
                <Text style={styles.featureText}>Live Results</Text>
              </View>
              <View style={styles.featureTag}>
                <Text style={styles.featureText}>Interactive Charts</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Service Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Packages</Text>
          <View style={styles.pricingContainer}>
            <View style={styles.pricingCard}>
              <Text style={styles.pricingTitle}>{REGATTA_FLOW_BRANDING.pricing.starter.name}</Text>
              <Text style={styles.pricingRange}>{REGATTA_FLOW_BRANDING.pricing.starter.range}</Text>
              <Text style={styles.pricingDescription}>{REGATTA_FLOW_BRANDING.pricing.starter.description}</Text>
            </View>
            <View style={styles.pricingCard}>
              <Text style={styles.pricingTitle}>{REGATTA_FLOW_BRANDING.pricing.professional.name}</Text>
              <Text style={styles.pricingRange}>{REGATTA_FLOW_BRANDING.pricing.professional.range}</Text>
              <Text style={styles.pricingDescription}>{REGATTA_FLOW_BRANDING.pricing.professional.description}</Text>
            </View>
            <View style={styles.pricingCard}>
              <Text style={styles.pricingTitle}>{REGATTA_FLOW_BRANDING.pricing.championship.name}</Text>
              <Text style={styles.pricingRange}>{REGATTA_FLOW_BRANDING.pricing.championship.range}</Text>
              <Text style={styles.pricingDescription}>{REGATTA_FLOW_BRANDING.pricing.championship.description}</Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactContainer}>
            <ContactItem
              icon={Globe}
              label="Website"
              value="oceanflow.io/regattaflow"
              onPress={handleWebsitePress}
            />
            <ContactItem
              icon={Mail}
              label="General Inquiries"
              value={REGATTA_FLOW_BRANDING.contact.email}
              onPress={handleEmailPress}
            />
            <ContactItem
              icon={Mail}
              label="Support"
              value={REGATTA_FLOW_BRANDING.contact.support}
              onPress={handleSupportPress}
            />
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.appInfoContainer}>
            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Version</Text>
              <Text style={styles.appInfoValue}>{appVersion} ({buildNumber})</Text>
            </View>
            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Platform</Text>
              <Text style={styles.appInfoValue}>React Native + Expo</Text>
            </View>
            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Developed by</Text>
              <Text style={styles.appInfoValue}>{REGATTA_FLOW_BRANDING.name}</Text>
            </View>
            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Year</Text>
              <Text style={styles.appInfoValue}>{REGATTA_FLOW_BRANDING.founded}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {REGATTA_FLOW_BRANDING.founded} {REGATTA_FLOW_BRANDING.name}. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            Specializing in sailing technology solutions worldwide.
          </Text>
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${REGATTA_FLOW_BRANDING.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  companyName: {
    ...typography.headlineLarge,
    color: REGATTA_FLOW_BRANDING.colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.bodyLarge,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  sectionContent: {
    ...typography.bodyLarge,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  servicesContainer: {
    gap: spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.cardSmall,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: `${REGATTA_FLOW_BRANDING.colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  serviceDescription: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  portfolioCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.cardMedium,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  portfolioTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  portfolioDescription: {
    ...typography.bodyMedium,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  portfolioFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  featureTag: {
    backgroundColor: `${REGATTA_FLOW_BRANDING.colors.accent}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  featureText: {
    ...typography.caption,
    color: REGATTA_FLOW_BRANDING.colors.accent,
    fontWeight: '600',
    fontSize: 12,
  },
  pricingContainer: {
    gap: spacing.md,
  },
  pricingCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.cardSmall,
  },
  pricingTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  pricingRange: {
    ...typography.bodyLarge,
    color: REGATTA_FLOW_BRANDING.colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  pricingDescription: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
  contactContainer: {
    gap: spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: `${REGATTA_FLOW_BRANDING.colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  contactValue: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '500',
  },
  appInfoContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  appInfoLabel: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  appInfoValue: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  footerSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
  },
});