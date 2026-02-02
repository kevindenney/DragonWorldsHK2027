import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Users,
  MapPin,
  Check,
  X,
  Clock,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Radio
} from 'lucide-react-native';

import { colors, spacing } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import { IOSCard, IOSText, IOSBadge, IOSSection, IOSButton } from '../../components/ios';
import { IOSSegmentedControl } from '../../components/ios/IOSSegmentedControl';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { SimpleError } from '../../components/shared/SimpleError';
import { useClubSpotEntrants, getClubSpotService } from '../../hooks/useClubSpotEntrants';
import type { Competitor } from '../../types/noticeBoard';
import type { EntrantsScreenProps } from '../../types/navigation';
import { eventSchedules } from '../../data/scheduleData';
import { externalUrls } from '../../config/externalUrls';

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

const getStatusColor = (status: Competitor['registrationStatus']) => {
  switch (status) {
    case 'confirmed': return 'systemGreen';
    case 'paid': return 'systemBlue';
    case 'pending': return 'systemOrange';
    case 'incomplete': return 'systemRed';
    default: return 'systemGray';
  }
};

const getStatusIcon = (status: Competitor['registrationStatus']) => {
  switch (status) {
    case 'confirmed': return Check;
    case 'paid': return Check;
    case 'pending': return Clock;
    case 'incomplete': return X;
    default: return AlertCircle;
  }
};

type EventSegment = 'asia-pacific' | 'world';

const EVENT_SEGMENT_OPTIONS: Array<{ label: string; value: EventSegment }> = [
  { label: '2026 Asia Pacific Championship', value: 'asia-pacific' },
  { label: '2027 Dragon World Championship', value: 'world' }
];

export const EntrantsScreen: React.FC<EntrantsScreenProps> = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventSegment>('world');
  const [filteredEntrants, setFilteredEntrants] = useState<Competitor[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Competitor['registrationStatus']>('all');

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
      console.error('[EntrantsScreen] Failed to refresh entrants:', err);
      await haptics.errorAction();
    }
  }, [refresh]);

  // Filter and search entrants
  useEffect(() => {
    let filtered = entrants;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.registrationStatus === filterStatus);
    }

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(e =>
        e.sailNumber.toLowerCase().includes(searchLower) ||
        e.helmName.toLowerCase().includes(searchLower) ||
        e.club.toLowerCase().includes(searchLower) ||
        e.country.toLowerCase().includes(searchLower) ||
        e.crewNames.some(crew => crew.toLowerCase().includes(searchLower))
      );
    }

    setFilteredEntrants(filtered);
  }, [entrants, searchText, filterStatus]);

  // Handle event change
  const handleEventChange = useCallback(async (value: string) => {
    await haptics.selection();
    setSelectedEvent(value as EventSegment);
    setSearchText('');
    setFilterStatus('all');
  }, []);

  // Handle search input
  const handleSearchChange = useCallback(async (text: string) => {
    setSearchText(text);
    if (text.length > 0) {
      await haptics.keyPress();
    }
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback(async (status: typeof filterStatus) => {
    await haptics.selection();
    setFilterStatus(status);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await haptics.selection();
    await refresh();
  }, [refresh]);

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
        return { label: 'Demo Mode', color: 'systemBlue' as const, icon: WifiOff };
      default:
        return { label: 'Unknown', color: 'systemGray' as const, icon: AlertCircle };
    }
  }, [dataSourceInfo]);

  // Render entrant card
  const renderEntrantCard = (entrant: Competitor) => {
    const StatusIcon = getStatusIcon(entrant.registrationStatus);

    return (
      <IOSCard
        key={entrant.id}
        variant="elevated"
        style={styles.entrantCard}
      >
        <View style={styles.entrantHeader}>
          <View style={styles.entrantInfo}>
            <View style={styles.entrantMeta}>
              <IOSText textStyle="headline" weight="semibold">
                {entrant.sailNumber}
              </IOSText>
              <IOSText textStyle="caption1" color="tertiaryLabel">
                {getCountryFlag(entrant.country)} {entrant.country}
              </IOSText>
            </View>

            <IOSBadge
              color={getStatusColor(entrant.registrationStatus)}
              size="small"
              variant="filled"
            >
              {entrant.registrationStatus.toUpperCase()}
            </IOSBadge>
          </View>

          <StatusIcon
            size={20}
            color={colors[getStatusColor(entrant.registrationStatus) as keyof typeof colors] || colors.textSecondary}
          />
        </View>

        <View style={styles.entrantDetails}>
          <IOSText textStyle="callout" weight="medium">
            {entrant.helmName}
          </IOSText>

          {entrant.crewNames.length > 0 && (
            <IOSText textStyle="caption1" color="secondaryLabel">
              Crew: {entrant.crewNames.join(', ')}
            </IOSText>
          )}

          <View style={styles.entrantMeta}>
            <MapPin size={14} color={colors.textSecondary} />
            <IOSText textStyle="caption1" color="tertiaryLabel">
              {entrant.club}
            </IOSText>
          </View>
        </View>

        <View style={styles.entrantFooter}>
          <View style={styles.statusIndicators}>
            <View style={styles.statusIndicator}>
              <IOSText textStyle="caption2" color="tertiaryLabel">Payment:</IOSText>
              <IOSBadge
                color={entrant.paymentStatus === 'paid' ? 'systemGreen' : 'systemOrange'}
                size="small"
              >
                {entrant.paymentStatus.toUpperCase()}
              </IOSBadge>
            </View>

            <View style={styles.statusIndicator}>
              <IOSText textStyle="caption2" color="tertiaryLabel">Docs:</IOSText>
              <IOSBadge
                color={entrant.documentsSubmitted ? 'systemGreen' : 'systemRed'}
                size="small"
              >
                {entrant.documentsSubmitted ? 'DONE' : 'MISSING'}
              </IOSBadge>
            </View>

            <View style={styles.statusIndicator}>
              <IOSText textStyle="caption2" color="tertiaryLabel">Measurement:</IOSText>
              <IOSBadge
                color={entrant.measurementCompleted ? 'systemGreen' : 'systemOrange'}
                size="small"
              >
                {entrant.measurementCompleted ? 'DONE' : 'PENDING'}
              </IOSBadge>
            </View>
          </View>
        </View>
      </IOSCard>
    );
  };

  // Filter options
  const filterOptions: Array<{ label: string; value: typeof filterStatus }> = [
    { label: 'All', value: 'all' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Incomplete', value: 'incomplete' }
  ];

  // Get statistics
  const totalEntries = entrants.length;
  const confirmedEntries = entrants.filter(e => e.registrationStatus === 'confirmed').length;
  const paidEntries = entrants.filter(e => e.paymentStatus === 'paid').length;
  const countries = [...new Set(entrants.map(e => e.country))].length;

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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Event Selector */}
      <IOSSection spacing="compact" style={styles.eventSelector}>
        <IOSSegmentedControl
          options={EVENT_SEGMENT_OPTIONS}
          selectedValue={selectedEvent}
          onValueChange={handleEventChange}
        />
      </IOSSection>

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
            <IOSButton
              title=""
              icon={<RefreshCw size={16} color={isRefreshing ? colors.textSecondary : colors.primary} />}
              variant="plain"
              size="small"
              onPress={handleRefresh}
              disabled={isRefreshing}
            />
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <IOSText textStyle="title2" weight="bold" color="primary">
                {totalEntries}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Total Entries
              </IOSText>
            </View>

            <View style={styles.statItem}>
              <IOSText textStyle="title2" weight="bold" color="systemGreen">
                {confirmedEntries}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Confirmed
              </IOSText>
            </View>

            <View style={styles.statItem}>
              <IOSText textStyle="title2" weight="bold" color="systemBlue">
                {paidEntries}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Paid
              </IOSText>
            </View>

            <View style={styles.statItem}>
              <IOSText textStyle="title2" weight="bold" color="systemOrange">
                {countries}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Countries
              </IOSText>
            </View>
          </View>
        </IOSCard>
      </IOSSection>

      {/* Search and Filter */}
      <IOSSection spacing="compact">
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by sail number, name, or club..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.map((option) => (
            <IOSButton
              key={option.value}
              title={option.label}
              variant={filterStatus === option.value ? 'filled' : 'tinted'}
              size="small"
              onPress={() => handleFilterChange(option.value)}
              style={styles.filterButton}
            />
          ))}
        </ScrollView>
      </IOSSection>

      {/* Results Title */}
      <View style={styles.resultsHeader}>
        <IOSText textStyle="footnote" color="secondaryLabel" weight="semibold" style={styles.resultsTitle}>
          {`${filteredEntrants.length} ${filteredEntrants.length === 1 ? 'ENTRY' : 'ENTRIES'}`}
        </IOSText>
      </View>

      {/* Results List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {filteredEntrants.length === 0 ? (
          <IOSCard variant="elevated" style={styles.emptyCard}>
            <Users size={48} color={colors.textSecondary} />
            <IOSText textStyle="headline" weight="semibold" color="secondaryLabel">
              No entries found
            </IOSText>
            <IOSText textStyle="callout" color="tertiaryLabel" style={styles.emptyText}>
              {searchText || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No entrants have registered yet'}
            </IOSText>
          </IOSCard>
        ) : (
          <View style={styles.entrantsList}>
            {filteredEntrants.map(renderEntrantCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  eventSelector: {
    paddingTop: spacing.md,
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

  // Search and Filter
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
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
  filterContainer: {
    marginTop: spacing.sm,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    minWidth: 80,
  },

  // Entrants
  entrantsList: {
    gap: spacing.md,
  },
  entrantCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  entrantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entrantInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginRight: spacing.md,
  },
  entrantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entrantDetails: {
    gap: spacing.xs,
  },
  entrantFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderLight,
  },
  statusIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusIndicator: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
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
