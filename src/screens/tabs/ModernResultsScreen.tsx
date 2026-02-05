/**
 * Modern Championship Results Screen
 * Matches the provided design with dual regatta support and realistic sailing data
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Trophy,
  Users,
  RefreshCw,
  ChevronRight,
  MapPin,
  Play,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react-native';
import { formatRelativeTime } from '../../utils/timeUtils';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import { Championship, ChampionshipCompetitor, RACING_CLASS_COLORS } from '../../data/mockChampionshipData';
import { resultsService } from '../../services/resultsService';
import { IOSText } from '../../components/ios/IOSText';
import { FloatingEventSwitch } from '../../components/navigation/FloatingEventSwitch';
import { ProfileButton } from '../../components/navigation/ProfileButton';
import { useSelectedEvent, useSetSelectedEvent } from '../../stores/eventStore';
import { EVENTS } from '../../constants/events';
import type { ResultsScreenProps } from '../../types/navigation';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width } = Dimensions.get('window');

interface ModernResultsScreenProps extends ResultsScreenProps {
  onToggleView?: () => void;
}

export function ModernResultsScreen({ navigation, onToggleView }: ModernResultsScreenProps) {
  const selectedEvent = useSelectedEvent();
  const setSelectedEvent = useSetSelectedEvent();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [timestampKey, setTimestampKey] = useState(0); // Forces re-render of relative time
  const appState = useRef(AppState.currentState);

  // Fetch championship data when event changes
  useEffect(() => {
    loadChampionship();
  }, [selectedEvent]);

  // Auto-update timestamp display every 60 seconds when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!lastUpdated) return;

      // Update timestamp display every minute
      const interval = setInterval(() => {
        setTimestampKey(prev => prev + 1);
      }, 60000);

      // Listen for app state changes to pause/resume updates
      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          // App came to foreground, trigger timestamp update
          setTimestampKey(prev => prev + 1);
        }
        appState.current = nextAppState;
      });

      return () => {
        clearInterval(interval);
        subscription.remove();
      };
    }, [lastUpdated])
  );

  const loadChampionship = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      // Map selected event to cloud function event ID
      const eventId = selectedEvent === EVENTS.WORLDS_2027.id ? '13242' : '13241';
      const result = await resultsService.getChampionship(eventId, forceRefresh);
      setChampionship(result);
      // Update last fetch time
      const fetchTime = resultsService.getLastFetchTime(eventId);
      setLastUpdated(fetchTime);
    } catch (err) {
      // Capture more descriptive error messages
      let errorMessage = 'Failed to load results. Please check your internet connection and try again.';
      if (err instanceof Error) {
        if (err.message.includes('Network request failed')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. The server may be busy. Please try again.';
        } else if (err.message.includes('HTTP 5')) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      setError(errorMessage);
      // Clear championship so error state shows (not stale cached data in UI)
      setChampionship(null);
    } finally {
      setLoading(false);
    }
  };

  // Use championship from state, or provide a default for loading state
  const currentChampionship = championship;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Force refresh from cloud function (bypass cache)
    await loadChampionship(true);
    setRefreshing(false);
  }, [selectedEvent]);

  const toggleCard = (sailNumber: string) => {
    setExpandedCard(expandedCard === sailNumber ? null : sailNumber);
  };

  const getPositionBadgeStyle = (position: number) => {
    if (position === 1) return { backgroundColor: '#FFD700', color: '#1A1A1A' }; // Gold
    if (position === 2) return { backgroundColor: '#C0C0C0', color: '#1A1A1A' }; // Silver
    if (position === 3) return { backgroundColor: '#CD7F32', color: '#FFFFFF' }; // Bronze
    return { backgroundColor: colors.textMuted, color: '#FFFFFF' }; // Gray
  };

  const getRacingClassColor = (racingClass: string) => {
    return RACING_CLASS_COLORS[racingClass] || colors.primary;
  };


  // Live Results Controls Component
  const LiveResultsControls = () => {
    const getLiveResultsUrl = () => {
      // Different URLs for each championship on racingrulesofsailing.org
      if (selectedEvent === EVENTS.APAC_2026.id) {
        // APAC 2026 - Event #13241
        return 'https://www.racingrulesofsailing.org/events/13241/event_links?name=2026%2520HONG%2520KONG%2520DRAGON%2520ASIA%2520PACIFIC%2520CHAMPIONSHIP';
      }
      // Worlds 2027 - Event #13242
      return 'https://www.racingrulesofsailing.org/events/13242/event_links?name=2027%2520HONG%2520KONG%2520DRAGON%2520WORLD%2520CHAMPIONSHIP';
    };

    const handleLiveResultsPress = async () => {
      const url = getLiveResultsUrl();
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert(
            'Cannot Open URL',
            'Unable to open the live results page. Please check your internet connection.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        Alert.alert(
          'Error',
          'There was an error opening the live results page.',
          [{ text: 'OK' }]
        );
      }
    };

    const handleRacingRulesPress = () => {
      navigation.navigate('RacingRules');
    };

    return (
      <View style={styles.liveResultsWrapper}>
        <View style={styles.liveResultsContainer}>
          <TouchableOpacity style={styles.liveResultsButton} onPress={handleLiveResultsPress}>
            <Play size={16} color={colors.textInverted} />
            <Text style={styles.liveResultsText}>Live Results</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.racingRulesButton} onPress={handleRacingRulesPress}>
            <BookOpen size={16} color={colors.primary} />
            <Text style={styles.racingRulesText}>Rules</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <RefreshCw size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {lastUpdated && (
          <View style={styles.lastUpdatedContainer}>
            <CheckCircle2 size={12} color={colors.success} />
            <Text style={styles.lastUpdatedText}>
              Updated: {formatRelativeTime(lastUpdated)}
            </Text>
          </View>
        )}
      </View>
    );
  };


  // Loading State Component
  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading results...</Text>
    </View>
  );

  // Error State Component - shown when API fails and no cached data available
  const ErrorState = () => {
    const handleCheckRrsPress = async () => {
      const url = selectedEvent === EVENTS.APAC_2026.id
        ? 'https://www.racingrulesofsailing.org/events/13241/event_links'
        : 'https://www.racingrulesofsailing.org/events/13242/event_links';
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        }
      } catch (err) {
        console.error('Failed to open RRS URL:', err);
      }
    };

    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <AlertCircle size={48} color={colors.error} strokeWidth={1.5} />
        </View>
        <Text style={styles.errorTitle}>Unable to Load Results</Text>
        <Text style={styles.errorMessage}>
          {error || 'Failed to connect to racingrulesofsailing.org. Please check your internet connection and try again.'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadChampionship(true)}>
          <RefreshCw size={16} color={colors.textInverted} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.errorLinkButton} onPress={handleCheckRrsPress}>
          <Text style={styles.errorLinkText}>View results directly on racingrulesofsailing.org</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Championship Info Card Component
  const ChampionshipInfoCard = () => {
    if (!currentChampionship) return null;

    const getStatusColor = () => {
      switch (currentChampionship.status) {
        case 'ongoing': return '#007AFF';
        case 'completed': return '#34C759';
        case 'upcoming': return '#FF9500';
        default: return colors.textMuted;
      }
    };

    const getStatusText = () => {
      switch (currentChampionship.status) {
        case 'ongoing': return 'Ongoing';
        case 'completed': return 'Completed';
        case 'upcoming': return 'Upcoming';
        default: return '';
      }
    };

    return (
      <View style={styles.championshipCard}>
        <View style={styles.championshipHeader}>
          <View style={styles.championshipInfo}>
            <Text style={styles.championshipTitle}>{currentChampionship.name}</Text>
            <View style={styles.championshipMeta}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.championshipLocation}>{currentChampionship.location}</Text>
              {currentChampionship.totalBoats > 0 && (
                <>
                  <Users size={14} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                  <Text style={styles.championshipBoats}>{currentChampionship.totalBoats} boats</Text>
                </>
              )}
              <Trophy size={14} color={colors.textSecondary} style={{ marginLeft: 12 }} />
              <Text style={styles.championshipRaces}>{currentChampionship.totalRaces} races</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Empty State Component - shown when API returns successfully but no results are posted
  const EmptyState = () => {
    const handleCheckRrsPress = async () => {
      const url = selectedEvent === EVENTS.APAC_2026.id
        ? 'https://www.racingrulesofsailing.org/events/13241/event_links'
        : 'https://www.racingrulesofsailing.org/events/13242/event_links';
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        }
      } catch (err) {
        console.error('Failed to open RRS URL:', err);
      }
    };

    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateIconContainer}>
          <Clock size={48} color={colors.textMuted} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyStateTitle}>Results Not Posted Yet</Text>
        <Text style={styles.emptyStateMessage}>
          Results will appear here once racing begins and scores are posted to racingrulesofsailing.org
        </Text>
        {currentChampionship && (
          <Text style={styles.emptyStateDate}>
            Racing begins: {currentChampionship.startDate}
          </Text>
        )}
        <TouchableOpacity style={styles.emptyStateButton} onPress={handleCheckRrsPress}>
          <Text style={styles.emptyStateButtonText}>Check racingrulesofsailing.org</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.emptyStateRefreshButton} onPress={onRefresh}>
          <RefreshCw size={16} color={colors.primary} />
          <Text style={styles.emptyStateRefreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Position Badge Component
  const PositionBadge = ({ position }: { position: number }) => {
    const style = getPositionBadgeStyle(position);
    return (
      <View style={[styles.positionBadge, { backgroundColor: style.backgroundColor }]}>
        <Text style={[styles.positionText, { color: style.color }]}>{position}</Text>
      </View>
    );
  };

  // Racing Class Badge Component
  const RacingClassBadge = ({ racingClass }: { racingClass: string }) => (
    <View style={[styles.racingClassBadge, { backgroundColor: getRacingClassColor(racingClass) + '20' }]}>
      <Text style={[styles.racingClassText, { color: getRacingClassColor(racingClass) }]}>
        {racingClass}
      </Text>
    </View>
  );

  // Competitor Card Component
  const CompetitorCard = ({ competitor }: { competitor: ChampionshipCompetitor }) => {
    const isExpanded = expandedCard === competitor.sailNumber;

    return (
      <TouchableOpacity
        style={styles.competitorCard}
        onPress={() => toggleCard(competitor.sailNumber)}
        activeOpacity={0.7}
      >
        <View style={styles.competitorHeader}>
          <PositionBadge position={competitor.position} />

          <View style={styles.competitorInfo}>
            <View style={styles.competitorTop}>
              <Text style={styles.sailNumber}>{competitor.sailNumber}</Text>
              <RacingClassBadge racingClass={competitor.racingClass} />
            </View>

            <Text style={styles.competitorName}>
              {competitor.helmName}
              {competitor.crewName && (
                <Text style={styles.crewName}> & {competitor.crewName}</Text>
              )}
            </Text>

            <View style={styles.competitorMeta}>
              <Text style={styles.countryFlag}>{competitor.countryFlag}</Text>
              <Text style={styles.yachtClub}>{competitor.yachtClub}</Text>
            </View>
          </View>

          <View style={styles.competitorRight}>
            <Text style={styles.totalPoints}>{competitor.totalPoints}</Text>
            <Text style={styles.pointsLabel}>pts</Text>
            <ChevronRight
              size={20}
              color={colors.textTertiary}
              style={{
                marginTop: 4,
                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }]
              }}
            />
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.raceResultsTitle}>Race Results:</Text>
            <View style={styles.raceResultsGrid}>
              {competitor.raceResults.map((result, index) => (
                <View
                  key={index}
                  style={[
                    styles.raceResult,
                    competitor.discards?.includes(result) && styles.discardedResult
                  ]}
                >
                  <Text style={[
                    styles.raceResultText,
                    competitor.discards?.includes(result) && styles.discardedResultText
                  ]}>
                    {result}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Header with Profile Button */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IOSText textStyle="title1" weight="bold" style={styles.headerTitle}>
            Results
          </IOSText>
          <ProfileButton size={36} />
        </View>
        <FloatingEventSwitch
          options={[
            { label: 'APAC 2026', shortLabel: 'APAC 2026', value: EVENTS.APAC_2026.id },
            { label: 'Worlds 2027', shortLabel: 'Worlds 2027', value: EVENTS.WORLDS_2027.id }
          ]}
          selectedValue={selectedEvent}
          onValueChange={setSelectedEvent}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Live Results Controls */}
        <LiveResultsControls />

        {/* Dev Mode Banner - only visible when force mock data is enabled */}
        {__DEV__ && resultsService.getForceMockData() && (
          <View style={styles.devModeBanner}>
            <FlaskConical size={14} color={colors.warning} />
            <Text style={styles.devModeBannerText}>
              Dev Mode: Using Mock Data
            </Text>
          </View>
        )}

        {/* Loading State */}
        {loading && !refreshing && <LoadingState />}

        {/* Error State */}
        {!loading && error && <ErrorState />}

        {/* Championship Info and Results */}
        {!loading && !error && currentChampionship && (
          <>
            {/* Championship Info */}
            <ChampionshipInfoCard />

            {/* Competitors List or Empty State */}
            {currentChampionship.competitors.length > 0 ? (
              <View style={styles.competitorsList}>
                {currentChampionship.competitors.map((competitor) => (
                  <CompetitorCard key={competitor.sailNumber} competitor={competitor} />
                ))}
              </View>
            ) : (
              <EmptyState />
            )}
          </>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text,
  },
  liveResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  liveResultsText: {
    ...typography.labelMedium,
    color: colors.textInverted,
    fontWeight: '600',
  },
  racingRulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  racingRulesText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  refreshButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  liveResultsWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  liveResultsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  lastUpdatedText: {
    ...typography.labelSmall,
    color: colors.textTertiary,
  },
  devModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '15',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  devModeBannerText: {
    ...typography.labelSmall,
    color: colors.warning,
    fontWeight: '600',
  },
  championshipCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  championshipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  championshipInfo: {
    flex: 1,
  },
  championshipTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
  },
  championshipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  championshipLocation: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  championshipBoats: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  championshipRaces: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    ...typography.labelSmall,
    color: colors.textInverted,
    fontWeight: '600',
  },
  competitorsList: {
    paddingHorizontal: spacing.lg,
  },
  competitorCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  competitorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  positionText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  competitorInfo: {
    flex: 1,
  },
  competitorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sailNumber: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
  },
  competitorName: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  crewName: {
    fontWeight: '400',
    color: colors.textSecondary,
  },
  competitorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryFlag: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  yachtClub: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  competitorRight: {
    alignItems: 'flex-end',
  },
  totalPoints: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
  },
  pointsLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  racingClassBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  racingClassText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  raceResultsTitle: {
    ...typography.labelMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  raceResultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  raceResult: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardedResult: {
    backgroundColor: colors.error + '20',
  },
  raceResultText: {
    ...typography.labelSmall,
    color: colors.text,
    fontWeight: '600',
  },
  discardedResultText: {
    color: colors.error,
    textDecorationLine: 'line-through',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  emptyStateDate: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  emptyStateButtonText: {
    ...typography.labelMedium,
    color: colors.textInverted,
    fontWeight: '600',
  },
  emptyStateRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  emptyStateRefreshText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  retryButtonText: {
    ...typography.labelMedium,
    color: colors.textInverted,
    fontWeight: '600',
  },
  errorLinkButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorLinkText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});