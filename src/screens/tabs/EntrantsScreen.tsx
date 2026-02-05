import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, RefreshControl, Animated, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Users,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
  Radio,
  Sailboat,
  Anchor,
  ExternalLink
} from 'lucide-react-native';

import { colors, spacing } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import { IOSCard, IOSText, IOSBadge, IOSSection, IOSButton } from '../../components/ios';
import { FloatingEventSwitch } from '../../components/navigation/FloatingEventSwitch';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { SimpleError } from '../../components/shared/SimpleError';
import { ProfileButton } from '../../components/navigation/ProfileButton';
import { useClubSpotEntrants } from '../../hooks/useClubSpotEntrants';
import type { Competitor } from '../../types/noticeBoard';
import type { EntrantsScreenProps } from '../../types/navigation';
import { eventSchedules } from '../../data/scheduleData';
import { externalUrls } from '../../config/externalUrls';
import { useToolbarVisibility } from '../../contexts/TabBarVisibilityContext';
import { useSelectedEvent, useSetSelectedEvent } from '../../stores/eventStore';
import { EVENTS } from '../../constants/events';
import { FloatingBackButton } from '../../components/navigation/FloatingBackButton';

// Header height: title row (~52pt) + event switch tabs (~48pt)
const HEADER_HEIGHT = 100;

const getCountryFlag = (countryCode: string): string => {
  const flagEmojis: { [key: string]: string } = {
    'HKG': '🇭🇰',
    'AUS': '🇦🇺',
    'GBR': '🇬🇧',
    'USA': '🇺🇸',
    'NZL': '🇳🇿',
    'SIN': '🇸🇬',
    'JPN': '🇯🇵',
    'FRA': '🇫🇷',
    'ITA': '🇮🇹',
    'GER': '🇩🇪',
    'NED': '🇳🇱',
    'ESP': '🇪🇸',
    'CAN': '🇨🇦',
    'DEN': '🇩🇰',
    'SWE': '🇸🇪'
  };
  return flagEmojis[countryCode] || '🏁';
};

/**
 * Filter out invalid entries that are scraped header rows or placeholder data
 */
const isValidEntrant = (entrant: Competitor): boolean => {
  // Filter out entries that look like header rows or registration form links
  const invalidNames = [
    'sail registration form',
    'registration form',
    'entry form',
    'click here',
    'view document'
  ];

  const helmNameLower = entrant.helmName.toLowerCase();
  if (invalidNames.some(invalid => helmNameLower.includes(invalid))) {
    return false;
  }

  // Filter out entries with no meaningful data
  if (!entrant.helmName || entrant.helmName === 'TBD') {
    return false;
  }

  return true;
};

type EventSegment = 'asia-pacific' | 'world';

interface EntrantsScreenCustomProps {
  onBack?: () => void;
}

export const EntrantsScreen: React.FC<EntrantsScreenProps & EntrantsScreenCustomProps> = ({ onBack }) => {
  const globalEventId = useSelectedEvent();
  const setSelectedEvent = useSetSelectedEvent();
  // Map global event ID to internal segment format
  const selectedEvent: EventSegment = globalEventId === EVENTS.WORLDS_2027.id ? 'world' : 'asia-pacific';

  const [filteredEntrants, setFilteredEntrants] = useState<Competitor[]>([]);
  const [searchText, setSearchText] = useState('');
  const insets = useSafeAreaInsets();

  // Toolbar auto-hide
  const { toolbarTranslateY, createScrollHandler } = useToolbarVisibility();
  const scrollHandler = useMemo(() => createScrollHandler(), [createScrollHandler]);

  // Get current event configuration
  const currentEvent = selectedEvent === 'world'
    ? eventSchedules.worldChampionship
    : eventSchedules.asiaPacificChampionships;

  // Get regatta ID from config
  const regattaId = useMemo(() => {
    return selectedEvent === 'world'
      ? externalUrls.clubSpot.regattaIds?.worlds || 'zyQIfeVjhb'
      : externalUrls.clubSpot.regattaIds?.apac || 'p75RuY5UZc';
  }, [selectedEvent]);

  // Use the ClubSpot entrants hook
  const {
    entrants,
    isLoading,
    isRefreshing,
    error: hookError,
    dataSourceInfo,
    refresh,
    isLiveData,
    lastUpdatedText,
  } = useClubSpotEntrants(regattaId, currentEvent.id);

  // Convert hook error to string
  const error = hookError ? hookError.message : null;

  // Handle refresh
  const loadEntrants = useCallback(async (showRefreshing = false) => {
    try {
      await refresh();
    } catch (err) {
      await haptics.errorAction();
    }
  }, [refresh]);

  // Filter out invalid entries and get valid entrants list
  const validEntrants = useMemo(() => {
    return entrants.filter(isValidEntrant);
  }, [entrants]);

  // Filter and search entrants
  useEffect(() => {
    let filtered = validEntrants;

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(e =>
        e.sailNumber.toLowerCase().includes(searchLower) ||
        e.helmName.toLowerCase().includes(searchLower) ||
        e.club.toLowerCase().includes(searchLower) ||
        e.country.toLowerCase().includes(searchLower) ||
        (e.boatName && e.boatName.toLowerCase().includes(searchLower)) ||
        e.crewNames.some(crew => crew.toLowerCase().includes(searchLower))
      );
    }

    setFilteredEntrants(filtered);
  }, [validEntrants, searchText]);

  // Clear search when event changes
  useEffect(() => {
    setSearchText('');
  }, [globalEventId]);

  // Handle search input
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await haptics.selection();
    await refresh();
  }, [refresh]);

  // Open ClubSpot entry list in browser
  const handleOpenClubSpot = useCallback(async () => {
    await haptics.selection();
    const url = selectedEvent === 'world'
      ? externalUrls.clubSpot.worlds.entryList
      : externalUrls.clubSpot.apac.entryList;
    Linking.openURL(url);
  }, [selectedEvent]);

  // Get data source badge info
  const getDataSourceBadge = useCallback(() => {
    if (!dataSourceInfo) {
      return { label: 'Loading', color: 'systemGray' as const, icon: Clock };
    }

    switch (dataSourceInfo.source) {
      case 'live':
        return { label: 'Live Data', color: 'systemGreen' as const, icon: Radio };
      case 'cache':
        return { label: 'Cached', color: 'systemOrange' as const, icon: Wifi };
      case 'demo':
        return { label: 'Sample Data', color: 'systemBlue' as const, icon: WifiOff };
      default:
        return { label: 'Unknown', color: 'systemGray' as const, icon: AlertCircle };
    }
  }, [dataSourceInfo]);

  // Render entrant card - clean design focused on key info
  const renderEntrantCard = (entrant: Competitor) => {
    const hasBoatName = entrant.boatName && entrant.boatName.trim() && entrant.boatName !== 'None';
    const hasClub = entrant.club && entrant.club.trim() && entrant.club !== 'None';

    return (
      <IOSCard
        key={entrant.id}
        variant="elevated"
        style={styles.entrantCard}
      >
        {/* Top row: Sail number + country */}
        <View style={styles.entrantHeader}>
          <View style={styles.sailInfo}>
            <IOSText textStyle="title3" weight="bold">
              {entrant.sailNumber !== 'TBD' ? entrant.sailNumber : '—'}
            </IOSText>
            <View style={styles.countryBadge}>
              <IOSText textStyle="caption1">
                {getCountryFlag(entrant.country)}
              </IOSText>
              <IOSText textStyle="caption2" color="secondaryLabel" weight="medium">
                {entrant.country !== 'TBD' ? entrant.country : ''}
              </IOSText>
            </View>
          </View>

          {hasBoatName && (
            <View style={styles.boatNameContainer}>
              <Sailboat size={14} color={colors.primary} />
              <IOSText textStyle="subheadline" weight="semibold" color="primary">
                {entrant.boatName}
              </IOSText>
            </View>
          )}
        </View>

        {/* Skipper/Helm name */}
        <View style={styles.skipperRow}>
          <IOSText textStyle="headline" weight="semibold">
            {entrant.helmName}
          </IOSText>
        </View>

        {/* Crew names */}
        {entrant.crewNames.length > 0 && (
          <View style={styles.crewRow}>
            <Users size={14} color={colors.textSecondary} />
            <IOSText textStyle="subheadline" color="secondaryLabel">
              {entrant.crewNames.join(', ')}
            </IOSText>
          </View>
        )}

        {/* Club */}
        {hasClub && (
          <View style={styles.clubRow}>
            <Anchor size={14} color={colors.textSecondary} />
            <IOSText textStyle="subheadline" color="tertiaryLabel">
              {entrant.club}
            </IOSText>
          </View>
        )}
      </IOSCard>
    );
  };

  // Get statistics from valid entrants only
  const totalEntries = validEntrants.length;
  const countries = [...new Set(validEntrants.map(e => e.country).filter(c => c && c !== 'TBD'))].length;
  const boatsWithNames = validEntrants.filter(e => e.boatName && e.boatName.trim() && e.boatName !== 'None').length;

  // Show loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner
            size="large"
            text="Loading entrants..."
            showBackground={true}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show error
  if (error && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <SimpleError
          message={error}
          onRetry={() => loadEntrants()}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Results List - Scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT + insets.top + 8 }]}
        scrollEventThrottle={16}
        onScroll={scrollHandler.onScroll}
        onScrollBeginDrag={scrollHandler.onScrollBeginDrag}
        onScrollEndDrag={scrollHandler.onScrollEndDrag}
        onMomentumScrollEnd={scrollHandler.onMomentumScrollEnd}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            progressViewOffset={HEADER_HEIGHT + insets.top + 8}
          />
        }
      >
        {/* Statistics */}
        <IOSSection spacing="compact">
          <IOSCard variant="elevated" style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <View style={styles.statsHeaderLeft}>
                <IOSText textStyle="subheadline" weight="semibold">
                  {currentEvent.title}
                </IOSText>
                <View style={styles.dataSourceRow}>
                  {(() => {
                    const badgeInfo = getDataSourceBadge();
                    const BadgeIcon = badgeInfo.icon;
                    return (
                      <>
                        <View style={styles.dataSourceBadge}>
                          <IOSBadge color={badgeInfo.color} size="small" variant="filled">
                            {badgeInfo.label}
                          </IOSBadge>
                        </View>
                        <IOSText textStyle="caption2" color="tertiaryLabel">
                          Updated {lastUpdatedText}
                        </IOSText>
                      </>
                    );
                  })()}
                </View>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={handleOpenClubSpot}
                  style={styles.iconButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ExternalLink size={20} color={colors.primary} />
                </TouchableOpacity>
                <IOSButton
                  title="↻"
                  variant="plain"
                  size="small"
                  onPress={handleRefresh}
                  disabled={isRefreshing}
                />
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <IOSText textStyle="title1" weight="bold" color="primary">
                  {totalEntries}
                </IOSText>
                <IOSText textStyle="caption1" color="secondaryLabel">
                  Entries
                </IOSText>
              </View>

              <View style={styles.statItem}>
                <IOSText textStyle="title1" weight="bold" color="systemOrange">
                  {countries}
                </IOSText>
                <IOSText textStyle="caption1" color="secondaryLabel">
                  Countries
                </IOSText>
              </View>

              <View style={styles.statItem}>
                <IOSText textStyle="title1" weight="bold" color="systemBlue">
                  {boatsWithNames}
                </IOSText>
                <IOSText textStyle="caption1" color="secondaryLabel">
                  Named Boats
                </IOSText>
              </View>
            </View>
          </IOSCard>
        </IOSSection>

        {/* Search */}
        <IOSSection spacing="compact">
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by sail number, name, boat, or club..."
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </IOSSection>

        {/* Results Title */}
        <View style={styles.resultsHeader}>
          <IOSText textStyle="footnote" color="secondaryLabel" weight="semibold" style={styles.resultsTitle}>
            {`${filteredEntrants.length} ${filteredEntrants.length === 1 ? 'ENTRY' : 'ENTRIES'}`}
          </IOSText>
        </View>

        {filteredEntrants.length === 0 ? (
          <IOSCard variant="elevated" style={styles.emptyCard}>
            <Users size={48} color={colors.textSecondary} />
            <IOSText textStyle="headline" weight="semibold" color="secondaryLabel">
              No entries found
            </IOSText>
            <IOSText textStyle="callout" color="tertiaryLabel" style={styles.emptyText}>
              {searchText
                ? 'Try adjusting your search criteria'
                : 'No entrants have registered yet'}
            </IOSText>
          </IOSCard>
        ) : (
          <View style={styles.entrantsList}>
            {filteredEntrants.map(renderEntrantCard)}
          </View>
        )}
      </ScrollView>

      {/* Floating Header Section - Positioned above content */}
      <Animated.View
        style={[
          styles.headerSection,
          {
            paddingTop: insets.top,
            transform: [{ translateY: toolbarTranslateY }]
          }
        ]}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            {onBack && (
              <FloatingBackButton onPress={onBack} style={styles.inlineBackButton} />
            )}
            <IOSText textStyle="title1" weight="bold">
              Entrants
            </IOSText>
          </View>
          <ProfileButton size={36} />
        </View>
        <FloatingEventSwitch
          options={[
            { label: 'APAC 2026', shortLabel: 'APAC 2026', value: EVENTS.APAC_2026.id },
            { label: 'Worlds 2027', shortLabel: 'Worlds 2027', value: EVENTS.WORLDS_2027.id }
          ]}
          selectedValue={globalEventId}
          onValueChange={setSelectedEvent}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineBackButton: {
    position: 'relative',
    top: 0,
    left: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  resultsHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  resultsTitle: {
    letterSpacing: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Statistics
  statsCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statsHeaderLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    padding: spacing.xs,
  },
  dataSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  dataSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchIcon: {
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.xs,
  },

  // Entrants
  entrantsList: {
    gap: spacing.sm,
  },
  entrantCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  entrantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  sailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.sm,
  },
  boatNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skipperRow: {
    marginTop: spacing.xs,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
