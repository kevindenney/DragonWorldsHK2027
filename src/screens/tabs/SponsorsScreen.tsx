import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToolbarVisibility } from '../../contexts/TabBarVisibilityContext';
import {
  Trophy,
  Award,
  Star,
  ExternalLink,
  MapPin,
  Clock,
  Phone,
  Globe,
  Gift,
  ChevronRight,
  Calendar,
  Users,
  Utensils,
  Camera,
  ShoppingBag,
  Building
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import {
  dragonWorldsSponsors,
  getOrganiser,
  getCoOrganisers,
  getPartners,
  getSupportingSponsors,
  getAllHongKongActivities,
  getActivitiesByType
} from '../../data/sponsors';
import { Sponsor, HongKongActivity } from '../../types/sponsor';

const { colors, spacing, typography, shadows, borderRadius } = dragonChampionshipsLightTheme;

type TabType = 'sponsors' | 'activities' | 'offers';

const ActivityTypeIcon = ({ type }: { type: string }) => {
  const iconProps = { size: 16, color: colors.primary };

  switch (type) {
    case 'cultural':
      return <Users {...iconProps} />;
    case 'dining':
      return <Utensils {...iconProps} />;
    case 'shopping':
      return <ShoppingBag {...iconProps} />;
    case 'sightseeing':
      return <Camera {...iconProps} />;
    case 'business':
      return <Building {...iconProps} />;
    case 'entertainment':
      return <Star {...iconProps} />;
    default:
      return <Calendar {...iconProps} />;
  }
};

const SponsorTierBadge = ({ tier }: { tier: string }) => {
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'organiser':
        return { label: 'ORGANISER', color: colors.championshipGold, icon: Trophy };
      case 'co-organiser':
        return { label: 'CO-ORGANISER', color: colors.championshipSilver, icon: Award };
      case 'partner':
        return { label: 'PARTNER', color: colors.primary, icon: Star };
      case 'supporting':
        return { label: 'SUPPORTING', color: colors.textMuted, icon: Star };
      default:
        return { label: tier.toUpperCase(), color: colors.textMuted, icon: Star };
    }
  };

  const tierInfo = getTierInfo(tier);
  const IconComponent = tierInfo.icon;

  return (
    <View style={[styles.tierBadge, { backgroundColor: `${tierInfo.color}15` }]}>
      <IconComponent size={12} color={tierInfo.color} />
      <Text style={[styles.tierText, { color: tierInfo.color }]}>
        {tierInfo.label}
      </Text>
    </View>
  );
};

const SponsorCard = ({ sponsor, onPress }: { sponsor: Sponsor; onPress: () => Promise<void> }) => {
  return (
    <TouchableOpacity
      style={[
        styles.sponsorCard,
        sponsor.tier === 'organiser' && styles.leadSponsorCard,
        sponsor.tier === 'co-organiser' && styles.premiereSponsorCard
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.sponsorHeader}>
        <View style={styles.sponsorTitleContainer}>
          <Text style={[
            styles.sponsorName,
            sponsor.tier === 'organiser' && styles.leadSponsorName
          ]}>
            {sponsor.name}
          </Text>
          <SponsorTierBadge tier={sponsor.tier} />
        </View>
        <ChevronRight size={20} color={colors.textMuted} />
      </View>

      <Text style={styles.sponsorDescription}>{sponsor.description}</Text>

      <View style={styles.sponsorDetails}>
        <Text style={styles.sectorText}>{sponsor.business.sector}</Text>
        {sponsor.business.established && (
          <Text style={styles.establishedText}>
            Est. {sponsor.business.established}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const SponsorDetailModal = ({ sponsor, onClose }: { sponsor: Sponsor; onClose: () => Promise<void> }) => {
  const handleOpenWebsite = async (url?: string) => {
    if (url) {
      await Haptics.selectionAsync();
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open website');
      }
    }
  };

  const handleCall = async (phone?: string) => {
    if (phone) {
      await Haptics.selectionAsync();
      const phoneUrl = `tel:${phone}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Unable to make call');
      }
    }
  };

  return (
    <ScrollView style={styles.modalContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.modalHeader}>
        <View>
          <Text style={styles.modalTitle}>{sponsor.name}</Text>
          <SponsorTierBadge tier={sponsor.tier} />
        </View>
      </View>

      <Text style={styles.modalDescription}>{sponsor.business.description}</Text>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        {sponsor.contact.phone && (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleCall(sponsor.contact.phone)}
          >
            <Phone size={16} color={colors.primary} />
            <Text style={styles.contactText}>{sponsor.contact.phone}</Text>
          </TouchableOpacity>
        )}
        {sponsor.website && (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleOpenWebsite(sponsor.website)}
          >
            <Globe size={16} color={colors.primary} />
            <Text style={styles.contactText}>Visit Website</Text>
            <ExternalLink size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Exclusive Offers & Activities - Coming Soon */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exclusive Offers & Activities</Text>
        <View style={styles.comingSoonCard}>
          <Gift size={32} color={colors.textMuted} />
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            Exclusive offers and activities from this sponsor will be available closer to the event.
          </Text>
        </View>
      </View>

      {/* Locations */}
      {sponsor.locations && sponsor.locations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          {sponsor.locations.map((location, index) => (
            <View key={index} style={styles.locationCard}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationAddress}>{location.address}</Text>
              {location.phone && (
                <TouchableOpacity
                  style={styles.locationContact}
                  onPress={() => handleCall(location.phone)}
                >
                  <Phone size={14} color={colors.primary} />
                  <Text style={styles.locationPhone}>{location.phone}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const ActivityCard = ({ activity }: { activity: HongKongActivity & { sponsorName: string; sponsorTier: string } }) => {
  return (
    <View style={styles.activityListCard}>
      <View style={styles.activityListHeader}>
        <ActivityTypeIcon type={activity.type} />
        <View style={styles.activityListTitleContainer}>
          <Text style={styles.activityListTitle}>{activity.title}</Text>
          <Text style={styles.activitySponsor}>by {activity.sponsorName}</Text>
        </View>
        {activity.priceRange && (
          <Text style={styles.activityPrice}>{activity.priceRange}</Text>
        )}
      </View>
      <Text style={styles.activityListDescription}>{activity.description}</Text>
      <View style={styles.activityListMeta}>
        {activity.duration && (
          <View style={styles.metaItem}>
            <Clock size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{activity.duration}</Text>
          </View>
        )}
        {activity.bookingRequired && (
          <View style={styles.metaItem}>
            <Calendar size={12} color={colors.warning} />
            <Text style={[styles.metaText, { color: colors.warning }]}>Booking Required</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export function SponsorsScreen() {
  const [selectedTab, setSelectedTab] = useState<TabType>('sponsors');
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const insets = useSafeAreaInsets();

  // Toolbar auto-hide on scroll
  const { toolbarTranslateY, createScrollHandler } = useToolbarVisibility();
  const scrollHandler = useMemo(() => createScrollHandler(), [createScrollHandler]);

  // Header height for content padding
  const HEADER_HEIGHT = 56;

  const organiser = getOrganiser();
  const coOrganisers = getCoOrganisers();
  const partners = getPartners();
  const supportingSponsors = getSupportingSponsors();
  const allActivities = getAllHongKongActivities();

  const handleTabPress = async (tab: TabType) => {
    await Haptics.selectionAsync();
    setSelectedTab(tab);
  };

  const handleSponsorPress = async (sponsor: Sponsor) => {
    await Haptics.selectionAsync();
    setSelectedSponsor(sponsor);
  };

  const handleCloseModal = async () => {
    await Haptics.selectionAsync();
    setSelectedSponsor(null);
  };

  if (selectedSponsor) {
    return (
      <View style={styles.container}>
        <View style={[styles.modalHeaderContainer, { paddingTop: insets.top + 56 }]}>
          <TouchableOpacity
            onPress={handleCloseModal}
            style={styles.backButton}
          >
            <ChevronRight
              size={24}
              color={colors.primary}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
            <Text style={styles.backText}>Sponsors</Text>
          </TouchableOpacity>
        </View>
        <SponsorDetailModal sponsor={selectedSponsor} onClose={handleCloseModal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ScrollView - scrolls behind the tab navigation */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingTop: insets.top + HEADER_HEIGHT + 8 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler.onScroll}
        onScrollBeginDrag={scrollHandler.onScrollBeginDrag}
        onScrollEndDrag={scrollHandler.onScrollEndDrag}
        onMomentumScrollEnd={scrollHandler.onMomentumScrollEnd}
      >
        {selectedTab === 'sponsors' && (
          <>
            {/* Organiser */}
            {organiser.length > 0 && (
              <View style={styles.tierSection}>
                <Text style={styles.tierTitle}>Organiser</Text>
                {organiser.map((sponsor) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    onPress={() => handleSponsorPress(sponsor)}
                  />
                ))}
              </View>
            )}

            {/* Co-Organisers */}
            {coOrganisers.length > 0 && (
              <View style={styles.tierSection}>
                <Text style={styles.tierTitle}>Co-Organisers</Text>
                {coOrganisers.map((sponsor) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    onPress={() => handleSponsorPress(sponsor)}
                  />
                ))}
              </View>
            )}

            {/* Partners */}
            {partners.length > 0 && (
              <View style={styles.tierSection}>
                <Text style={styles.tierTitle}>Partners</Text>
                {partners.map((sponsor) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    onPress={() => handleSponsorPress(sponsor)}
                  />
                ))}
              </View>
            )}

            {/* Supporting Sponsors */}
            {supportingSponsors.length > 0 && (
              <View style={styles.tierSection}>
                <Text style={styles.tierTitle}>Supporting</Text>
                {supportingSponsors.map((sponsor) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    onPress={() => handleSponsorPress(sponsor)}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {selectedTab === 'activities' && (
          <View style={styles.activitiesSection}>
            <Text style={styles.sectionTitle}>Things to Do in Hong Kong</Text>
            <Text style={styles.sectionSubtitle}>
              Exclusive activities and experiences from our sponsors
            </Text>
            <View style={styles.comingSoonCard}>
              <MapPin size={48} color={colors.textMuted} />
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              <Text style={styles.comingSoonText}>
                Exclusive activities and experiences from our sponsors will be available closer to the event.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Tab Navigation - positioned absolute, hides on scroll */}
      <Animated.View
        style={[
          styles.tabContainer,
          {
            paddingTop: insets.top,
            paddingLeft: 56, // Make room for FloatingBackButton from MoreScreen
            transform: [{ translateY: toolbarTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'sponsors' && styles.activeTab]}
          onPress={() => handleTabPress('sponsors')}
        >
          <Trophy size={18} color={selectedTab === 'sponsors' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, selectedTab === 'sponsors' && styles.activeTabText]}>
            Sponsors
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'activities' && styles.activeTab]}
          onPress={() => handleTabPress('activities')}
        >
          <MapPin size={18} color={selectedTab === 'activities' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, selectedTab === 'activities' && styles.activeTabText]}>
            Activities
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingRight: spacing.lg,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  tierSection: {
    marginBottom: spacing.xl,
  },
  tierTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  sponsorCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.cardMedium,
  },
  leadSponsorCard: {
    borderWidth: 2,
    borderColor: colors.championshipGold,
    backgroundColor: `${colors.championshipGold}05`,
  },
  premiereSponsorCard: {
    borderWidth: 1.5,
    borderColor: colors.championshipSilver,
    backgroundColor: `${colors.championshipSilver}05`,
  },
  sponsorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sponsorTitleContainer: {
    flex: 1,
  },
  sponsorName: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  leadSponsorName: {
    ...typography.headlineMedium,
    fontWeight: '700',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
  },
  tierText: {
    ...typography.overline,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  sponsorDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  sponsorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectorText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  establishedText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sponsorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  modalHeaderContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    ...typography.bodyMedium,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.headlineLarge,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  modalDescription: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  contactText: {
    ...typography.bodyMedium,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  offerCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  offerTitle: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  offerTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  offerTypeText: {
    ...typography.overline,
    fontWeight: '600',
  },
  offerDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  offerRedemption: {
    ...typography.caption,
    color: colors.textMuted,
  },
  redeemLabel: {
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activityTitle: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    marginLeft: spacing.sm,
  },
  priceRange: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  activityDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  locationCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  locationName: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  locationAddress: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  locationContact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPhone: {
    ...typography.bodyMedium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  activitiesSection: {
    flex: 1,
  },
  activityListCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.cardMedium,
  },
  activityListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activityListTitleContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  activityListTitle: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  activitySponsor: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  activityPrice: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  activityListDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  activityListMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comingSoonCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  comingSoonTitle: {
    ...typography.headlineSmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  comingSoonText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});