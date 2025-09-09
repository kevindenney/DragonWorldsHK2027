import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  CreditCard,
  DollarSign,
  MapPin,
  Phone,
  Utensils,
  Spa,
  Concierge,
  Map,
  Trophy,
  FileText,
  AlertTriangle,
  Building,
  Users,
  Navigation,
  Car,
  Anchor,
  Calendar
} from 'lucide-react-native';
import { colors, spacing } from '../../constants/theme';
import {
  IOSNavigationBar,
  IOSCard,
  IOSSection,
  IOSButton,
  IOSText,
  IOSList,
  IOSListSection
} from '../../components/ios';
import type { ServicesScreenProps } from '../../types/navigation';

// TypeScript interfaces
interface SponsorArea {
  titlePrefix?: string;
  footer?: string;
  logoPlaceholder?: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: any;
  onPress: () => void;
}

interface RaceStanding {
  position: number;
  sailNumber: string;
  country: string;
  skipper: string;
  points: number;
}

interface ServiceSection {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  sponsorArea?: SponsorArea;
  quickActions?: QuickAction[];
  actionButtons?: {
    primary?: { title: string; onPress: () => void };
    secondary?: { title: string; onPress: () => void };
  };
}

// Quick Actions Row Component
const QuickActionsRow: React.FC<{ actions: QuickAction[] }> = ({ actions }) => (
  <View style={styles.quickActionsRow}>
    {actions.map((action) => (
      <IOSButton
        key={action.id}
        title={action.title}
        variant="gray"
        size="small"
        onPress={action.onPress}
        style={styles.quickActionButton}
        textStyle={styles.quickActionText}
      />
    ))}
  </View>
);

// Sponsor Footer Component
const SponsorFooter: React.FC<{ footer: string }> = ({ footer }) => (
  <View style={styles.sponsorFooter}>
    <IOSText textStyle="caption1" color="tertiaryLabel" style={styles.sponsorText}>
      {footer}
    </IOSText>
  </View>
);

export function ServicesScreen({ navigation }: ServicesScreenProps) {
  // Mock race standings data
  const raceStandings: RaceStanding[] = [
    { position: 1, sailNumber: 'HKG 59', country: '🇭🇰', skipper: 'B. Van Olphen', points: 4 },
    { position: 2, sailNumber: 'GBR 8', country: '🇬🇧', skipper: 'J. Wilson', points: 7 },
    { position: 3, sailNumber: 'AUS 12', country: '🇦🇺', skipper: 'S. Mitchell', points: 9 },
  ];

  // Banking Services Quick Actions
  const bankingActions: QuickAction[] = [
    { id: '1', title: 'Find ATM', icon: MapPin, onPress: () => {} },
    { id: '2', title: 'Currency Rates', icon: DollarSign, onPress: () => {} },
    { id: '3', title: 'Contact RM', icon: Phone, onPress: () => {} },
    { id: '4', title: 'Transfer Money', icon: CreditCard, onPress: () => {} },
  ];

  // Hospitality Quick Actions
  const hospitalityActions: QuickAction[] = [
    { id: '1', title: 'Dinner Tonight', icon: Utensils, onPress: () => {} },
    { id: '2', title: 'Spa Booking', icon: Spa, onPress: () => {} },
    { id: '3', title: 'Concierge', icon: Concierge, onPress: () => {} },
    { id: '4', title: 'City Guide', icon: Map, onPress: () => {} },
  ];

  // Event Information List Items
  const eventInfoItems = [
    { id: '1', title: 'Official Documents', icon: <FileText size={20} color={colors.primary} /> },
    { id: '2', title: 'Emergency Contacts', icon: <AlertTriangle size={20} color={colors.error} /> },
    { id: '3', title: 'Venue Information', icon: <Building size={20} color={colors.textSecondary} /> },
    { id: '4', title: 'Racing Rules Portal', icon: <Users size={20} color={colors.accent} /> },
    { id: '5', title: 'Registration (Clubspot)', icon: <Calendar size={20} color={colors.success} /> },
  ];

  // Navigation & Transport List Items
  const navigationItems = [
    { 
      id: '1', 
      title: 'Directions to venues', 
      icon: <Navigation size={20} color={colors.primary} /> 
    },
    { 
      id: '2', 
      title: 'Transport coordination', 
      subtitle: 'Sponsored by Mercedes-Benz',
      icon: <Car size={20} color={colors.textSecondary} /> 
    },
    { 
      id: '3', 
      title: 'Marine navigation', 
      subtitle: 'Powered by Garmin',
      icon: <Anchor size={20} color={colors.accent} /> 
    },
    { 
      id: '4', 
      title: 'Ferry schedules', 
      icon: <MapPin size={20} color={colors.success} /> 
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Dragon logo */}
      <IOSNavigationBar
        title="Services & Info"
        style="large"
        rightActions={[
          {
            icon: <Image 
              source={require('../../../assets/dragon-logo.png')} 
              style={styles.dragonLogo}
              resizeMode="contain"
            />,
            onPress: () => {}
          }
        ]}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banking Services Section */}
        <IOSSection spacing="regular">
          <IOSCard variant="elevated">
            <View style={styles.serviceHeader}>
              <IOSText textStyle="headline" weight="semibold" color="systemBlue">
                HSBC{' '}
              </IOSText>
              <IOSText textStyle="headline" weight="semibold">
                BANKING SERVICES
              </IOSText>
            </View>
            
            <IOSText textStyle="title3" weight="semibold" color="label" style={styles.serviceSubtitle}>
              International Banking
            </IOSText>
            
            <IOSText textStyle="callout" color="secondaryLabel" style={styles.serviceDescription}>
              Currency exchange, transfers, ATM locations, Premier
            </IOSText>

            <QuickActionsRow actions={bankingActions} />

            <IOSButton
              title="Access Services"
              variant="filled"
              size="large"
              onPress={() => {}}
              style={styles.primaryActionButton}
            />

            <SponsorFooter footer="Powered by HSBC Premier" />
          </IOSCard>
        </IOSSection>

        {/* Hospitality Section */}
        <IOSSection spacing="regular">
          <IOSCard variant="elevated">
            <View style={styles.serviceHeader}>
              <IOSText textStyle="headline" weight="semibold" color="systemBlue">
                Conrad{' '}
              </IOSText>
              <IOSText textStyle="headline" weight="semibold">
                HOSPITALITY
              </IOSText>
            </View>
            
            <IOSText textStyle="title3" weight="semibold" color="label" style={styles.serviceSubtitle}>
              Premium Accommodation
            </IOSText>
            
            <IOSText textStyle="callout" color="secondaryLabel" style={styles.serviceDescription}>
              Premium hotels, VIP dining, experiences
            </IOSText>

            <QuickActionsRow actions={hospitalityActions} />

            <IOSButton
              title="Book Services"
              variant="filled"
              size="large"
              onPress={() => {}}
              style={styles.primaryActionButton}
            />

            <SponsorFooter footer="Hospitality by Conrad Hong Kong" />
          </IOSCard>
        </IOSSection>

        {/* Race Results & Standings Section */}
        <IOSSection spacing="regular">
          <IOSCard variant="elevated">
            <View style={styles.resultsHeader}>
              <IOSText textStyle="headline" weight="semibold">
                RACE RESULTS & STANDINGS
              </IOSText>
            </View>
            
            <View style={styles.standingsHeader}>
              <Trophy size={20} color={colors.warning} />
              <IOSText textStyle="callout" weight="semibold" color="label">
                Current Championship Standings
              </IOSText>
            </View>

            <IOSList style={styles.standingsList}>
              {raceStandings.map((standing) => (
                <View key={standing.position} style={styles.standingItem}>
                  <IOSText textStyle="headline" weight="bold" style={styles.position}>
                    {standing.position}
                  </IOSText>
                  <IOSText textStyle="callout" weight="semibold" color="systemBlue" style={styles.sailNumber}>
                    {standing.sailNumber}
                  </IOSText>
                  <IOSText textStyle="callout" style={styles.country}>
                    {standing.country}
                  </IOSText>
                  <IOSText textStyle="callout" color="secondaryLabel" style={styles.skipper}>
                    {standing.skipper}
                  </IOSText>
                  <IOSText textStyle="callout" weight="semibold" style={styles.points}>
                    {standing.points}pts
                  </IOSText>
                </View>
              ))}
            </IOSList>

            <View style={styles.resultsActions}>
              <IOSButton
                title="Full Results"
                variant="tinted"
                size="medium"
                onPress={() => {}}
                style={styles.resultActionButton}
              />
              <IOSButton
                title="Race Analysis"
                variant="gray"
                size="medium"
                onPress={() => {}}
                style={styles.resultActionButton}
              />
            </View>
          </IOSCard>
        </IOSSection>

        {/* Event Information Section */}
        <IOSSection spacing="regular">
          <IOSCard variant="elevated">
            <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
              EVENT INFORMATION
            </IOSText>

            <IOSList style={styles.infoList}>
              {eventInfoItems.map((item) => (
                <View key={item.id} style={styles.infoItem}>
                  {item.icon}
                  <IOSText textStyle="callout" color="label" style={styles.infoItemText}>
                    {item.title}
                  </IOSText>
                </View>
              ))}
            </IOSList>

            <IOSButton
              title="Access Info Hub"
              variant="tinted"
              size="large"
              onPress={() => {}}
              style={styles.primaryActionButton}
            />
          </IOSCard>
        </IOSSection>

        {/* Navigation & Transport Section */}
        <IOSSection spacing="regular">
          <IOSCard variant="elevated">
            <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
              NAVIGATION & TRANSPORT
            </IOSText>

            <IOSList style={styles.navigationList}>
              {navigationItems.map((item) => (
                <View key={item.id} style={styles.navigationItem}>
                  {item.icon}
                  <View style={styles.navigationItemText}>
                    <IOSText textStyle="callout" color="label">
                      {item.title}
                    </IOSText>
                    {item.subtitle && (
                      <IOSText textStyle="caption1" color="systemBlue">
                        {item.subtitle}
                      </IOSText>
                    )}
                  </View>
                </View>
              ))}
            </IOSList>

            <View style={styles.navigationActions}>
              <IOSButton
                title="Get Directions"
                variant="filled"
                size="medium"
                onPress={() => {}}
                style={styles.navigationActionButton}
              />
              <IOSButton
                title="Book Transport"
                variant="tinted"
                size="medium"
                onPress={() => {}}
                style={styles.navigationActionButton}
              />
            </View>
          </IOSCard>
        </IOSSection>
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

  // Header
  dragonLogo: {
    width: 32,
    height: 32,
  },

  // Service Sections
  serviceHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  serviceSubtitle: {
    marginBottom: 8,
  },
  serviceDescription: {
    marginBottom: 16,
  },
  primaryActionButton: {
    marginTop: 8,
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // 8pt grid system
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 13,
  },

  // Sponsor Footer
  sponsorFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'center',
  },
  sponsorText: {
    textAlign: 'center',
  },

  // Race Results
  resultsHeader: {
    marginBottom: 16,
  },
  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  standingsList: {
    marginBottom: 16,
  },
  standingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  position: {
    width: 24,
  },
  sailNumber: {
    width: 80,
    marginLeft: 16,
  },
  country: {
    width: 30,
  },
  skipper: {
    flex: 1,
    marginLeft: 8,
  },
  points: {
    width: 60,
    textAlign: 'right',
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resultActionButton: {
    flex: 1,
  },

  // Event Information
  sectionTitle: {
    marginBottom: 16,
  },
  infoList: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoItemText: {
    marginLeft: 12,
    flex: 1,
  },

  // Navigation & Transport
  navigationList: {
    marginBottom: 16,
  },
  navigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  navigationItemText: {
    marginLeft: 12,
    flex: 1,
  },
  navigationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  navigationActionButton: {
    flex: 1,
  },
});