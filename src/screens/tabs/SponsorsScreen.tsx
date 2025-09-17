import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  SafeAreaView
} from 'react-native';
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
  getLeadSponsors,
  getPremiereSponsors,
  getMajorSponsors,
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
      case 'lead':
        return { label: 'TITLE SPONSOR', color: colors.championshipGold, icon: Trophy };
      case 'premiere':
        return { label: 'PREMIERE', color: colors.championshipSilver, icon: Award };
      case 'major':
        return { label: 'MAJOR', color: colors.championshipBronze, icon: Star };
      case 'supporting':
        return { label: 'SUPPORTING', color: colors.primary, icon: Star };
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
        sponsor.tier === 'lead' && styles.leadSponsorCard,
        sponsor.tier === 'premiere' && styles.premiereSponsorCard
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.sponsorHeader}>
        <View style={styles.sponsorTitleContainer}>
          <Text style={[
            styles.sponsorName,
            sponsor.tier === 'lead' && styles.leadSponsorName
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

      <View style={styles.sponsorActions}>
        <View style={styles.actionCount}>
          <Gift size={14} color={colors.primary} />
          <Text style={styles.countText}>
            {sponsor.offers.length} offer{sponsor.offers.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.actionCount}>
          <MapPin size={14} color={colors.primary} />
          <Text style={styles.countText}>
            {sponsor.hongKongActivities.length} activit{sponsor.hongKongActivities.length !== 1 ? 'ies' : 'y'}
          </Text>
        </View>
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

      {/* Offers */}
      {sponsor.offers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exclusive Offers</Text>
          {sponsor.offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <View style={[styles.offerTypeBadge, { backgroundColor: `${colors.success}15` }]}>
                  <Text style={[styles.offerTypeText, { color: colors.success }]}>
                    {offer.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.offerDescription}>{offer.description}</Text>
              <Text style={styles.offerRedemption}>
                <Text style={styles.redeemLabel}>How to redeem: </Text>
                {offer.howToRedeem}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Hong Kong Activities */}
      {sponsor.hongKongActivities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hong Kong Activities</Text>
          {sponsor.hongKongActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <ActivityTypeIcon type={activity.type} />
                <Text style={styles.activityTitle}>{activity.title}</Text>
                {activity.priceRange && (
                  <Text style={styles.priceRange}>{activity.priceRange}</Text>
                )}
              </View>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <View style={styles.activityMeta}>
                {activity.duration && (
                  <View style={styles.metaItem}>
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={styles.metaText}>{activity.duration}</Text>
                  </View>
                )}
                {activity.bookingRequired && (
                  <View style={styles.metaItem}>
                    <Calendar size={12} color={colors.warning} />
                    <Text style={[styles.metaText, { color: colors.warning }]}>
                      Booking Required
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

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

  const leadSponsors = getLeadSponsors();
  const premiereSponsors = getPremiereSponsors();
  const majorSponsors = getMajorSponsors();
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
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeaderContainer}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
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
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'sponsors' && (
          <>
            {/* Lead Sponsors */}
            {leadSponsors.length > 0 && (
              <View style={styles.tierSection}>
                <Text style={styles.tierTitle}>Title Sponsor</Text>
                {leadSponsors.map((sponsor) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    onPress={() => handleSponsorPress(sponsor)}
                  />
                ))}
              </View>
            )}

            {/* Premiere Sponsors */}
            {premiereSponsors.length > 0 && (
              <View style={styles.tierSection}>
                <Text style={styles.tierTitle}>Premiere Sponsors</Text>
                {premiereSponsors.map((sponsor) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    onPress={() => handleSponsorPress(sponsor)}
                  />
                ))}
              </View>
            )}

            {/* Major Sponsors */}
            {majorSponsors.length > 0 && (
              <View style={styles.tierSection}>
                <Text style={styles.tierTitle}>Major Sponsors</Text>
                {majorSponsors.map((sponsor) => (
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
                <Text style={styles.tierTitle}>Supporting Sponsors</Text>
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
            {allActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
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
});