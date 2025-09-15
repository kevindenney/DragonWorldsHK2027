/**
 * Modern Championship Results Screen
 * Matches the provided design with dual regatta support and realistic sailing data
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {
  Trophy,
  Users,
  Calendar,
  RefreshCw,
  ChevronRight,
  MapPin,
  Play,
} from 'lucide-react-native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import { MOCK_CHAMPIONSHIPS, Championship, ChampionshipCompetitor, RACING_CLASS_COLORS } from '../../data/mockChampionshipData';
import type { ResultsScreenProps } from '../../types/navigation';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width } = Dimensions.get('window');

interface ModernResultsScreenProps extends ResultsScreenProps {
  onToggleView?: () => void;
}

export function ModernResultsScreen({ navigation, onToggleView }: ModernResultsScreenProps) {
  const [selectedChampionship, setSelectedChampionship] = useState<string>('dragon-world-2026');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const currentChampionship = MOCK_CHAMPIONSHIPS.find(c => c.id === selectedChampionship) || MOCK_CHAMPIONSHIPS[1];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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

  // Championship Toggle Component
  const ChampionshipToggle = () => (
    <View style={styles.toggleContainer}>
      {MOCK_CHAMPIONSHIPS.map((championship) => (
        <TouchableOpacity
          key={championship.id}
          style={[
            styles.toggleTab,
            selectedChampionship === championship.id && styles.toggleTabActive
          ]}
          onPress={() => setSelectedChampionship(championship.id)}
        >
          <Text style={[
            styles.toggleTabText,
            selectedChampionship === championship.id && styles.toggleTabTextActive
          ]}>
            {championship.shortName}
          </Text>
          <Text style={[
            styles.toggleTabDate,
            selectedChampionship === championship.id && styles.toggleTabDateActive
          ]}>
            {championship.startDate}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Event Statistics Bar Component
  const EventStatsBar = () => (
    <View style={styles.statsBar}>
      <View style={styles.statItem}>
        <Trophy size={16} color={colors.textSecondary} />
        <Text style={styles.statText}>
          {currentChampionship.completedRaces}/{currentChampionship.totalRaces} races
        </Text>
      </View>
      <View style={styles.statItem}>
        <Users size={16} color={colors.textSecondary} />
        <Text style={styles.statText}>{currentChampionship.totalBoats} boats</Text>
      </View>
      <View style={styles.statItem}>
        <Calendar size={16} color={colors.textSecondary} />
        <Text style={styles.statText}>Updated {currentChampionship.lastUpdated}</Text>
      </View>
    </View>
  );

  // Championship Info Card Component
  const ChampionshipInfoCard = () => (
    <View style={styles.championshipCard}>
      <View style={styles.championshipHeader}>
        <View style={styles.championshipInfo}>
          <Text style={styles.championshipTitle}>{currentChampionship.name}</Text>
          <View style={styles.championshipMeta}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.championshipLocation}>{currentChampionship.location}</Text>
            <Users size={14} color={colors.textSecondary} style={{ marginLeft: 12 }} />
            <Text style={styles.championshipBoats}>{currentChampionship.totalBoats} boats</Text>
            <Trophy size={14} color={colors.textSecondary} style={{ marginLeft: 12 }} />
            <Text style={styles.championshipRaces}>{currentChampionship.totalRaces} races</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: currentChampionship.status === 'ongoing' ? '#007AFF' : '#34C759' }]}>
          <Text style={styles.statusText}>
            {currentChampionship.status === 'ongoing' ? 'Ongoing' : 'Completed'}
          </Text>
        </View>
      </View>
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Championship Standings</Text>
          <Text style={styles.headerSubtitle}>China Coast Regatta 2024</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.liveResultsButton}>
            <Play size={16} color={colors.textInverted} />
            <Text style={styles.liveResultsText}>Live Results</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <RefreshCw size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Event Statistics */}
        <EventStatsBar />

        {/* Championship Toggle */}
        <ChampionshipToggle />

        {/* Championship Info */}
        <ChampionshipInfoCard />

        {/* Competitors List */}
        <View style={styles.competitorsList}>
          {currentChampionship.competitors.map((competitor) => (
            <CompetitorCard key={competitor.sailNumber} competitor={competitor} />
          ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  refreshButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  toggleTabActive: {
    backgroundColor: '#00C896',
  },
  toggleTabText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTabTextActive: {
    color: colors.textInverted,
  },
  toggleTabDate: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },
  toggleTabDateActive: {
    color: colors.textInverted,
    opacity: 0.9,
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
});