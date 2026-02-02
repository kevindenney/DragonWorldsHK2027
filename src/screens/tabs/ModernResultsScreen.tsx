/**
 * Modern Championship Results Screen
 * Matches the provided design with dual regatta support and realistic sailing data
 */

import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from 'lucide-react-native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import { Championship, ChampionshipCompetitor, RACING_CLASS_COLORS } from '../../data/mockChampionshipData';
import { resultsService } from '../../services/resultsService';
import { IOSText } from '../../components/ios/IOSText';
import { FloatingEventSwitch } from '../../components/navigation/FloatingEventSwitch';
import { ProfileButton } from '../../components/navigation/ProfileButton';
import type { ResultsScreenProps } from '../../types/navigation';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width } = Dimensions.get('window');

interface ModernResultsScreenProps extends ResultsScreenProps {
  onToggleView?: () => void;
}

export function ModernResultsScreen({ navigation, onToggleView }: ModernResultsScreenProps) {
  const [selectedEvent, setSelectedEvent] = useState<'asia-pacific-2026' | 'dragon-worlds-2026'>('asia-pacific-2026');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch championship data when event changes
  useEffect(() => {
    loadChampionship();
  }, [selectedEvent]);

  const loadChampionship = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      // Map selected event to cloud function event ID
      const eventId = selectedEvent === 'dragon-worlds-2026' ? '13242' : '13241';
      const result = await resultsService.getChampionship(eventId, forceRefresh);
      setChampionship(result);
    } catch (err) {
      console.error('Error loading championship:', err);
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use championship from state, or provide a default for loading state
  const currentChampionship = championship;

  const handleEventChange = (eventId: 'asia-pacific-2026' | 'dragon-worlds-2026') => {
    setSelectedEvent(eventId);
  };

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
      if (selectedEvent === 'asia-pacific-2026') {
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
        console.error('Error opening live results:', error);
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
    );
  };


  // Loading State Component
  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading results...</Text>
    </View>
  );

  // Error State Component
  const ErrorState = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <AlertCircle size={48} color={colors.error} strokeWidth={1.5} />
      </View>
      <Text style={styles.errorTitle}>Unable to Load Results</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadChampionship(true)}>
        <RefreshCw size={16} color={colors.textInverted} />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

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

  // Empty State Component
  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <Clock size={48} color={colors.textMuted} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyStateTitle}>No Results Yet</Text>
      <Text style={styles.emptyStateMessage}>
        Results will appear here once racing begins and scores are posted to racingrulesofsailing.org
      </Text>
      {currentChampionship && (
        <Text style={styles.emptyStateDate}>
          Racing begins: {currentChampionship.startDate}
        </Text>
      )}
    </View>
  );

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
      </View>

      {/* Event Selector */}
      <FloatingEventSwitch
        options={[
          { label: '2026 Asia Pacific Championship', shortLabel: 'APAC 2026', value: 'asia-pacific-2026' },
          { label: '2027 Dragon World Championship', shortLabel: 'Worlds 2027', value: 'dragon-worlds-2026' }
        ]}
        selectedValue={selectedEvent}
        onValueChange={(eventId) => handleEventChange(eventId as 'asia-pacific-2026' | 'dragon-worlds-2026')}
      />

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
    marginBottom: 4,
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
  liveResultsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.sm,
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
});