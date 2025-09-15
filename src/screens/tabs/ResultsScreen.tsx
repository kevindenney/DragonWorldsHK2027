import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, SlideInRight } from '../../utils/reanimatedWrapper';
import { 
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  User,
  Flag,
  Calendar,
  Filter,
  Download,
  BarChart3,
  Crown,
  Star,
  RefreshCw,
  WifiOff
} from 'lucide-react-native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import type { ResultsScreenProps } from '../../types/navigation';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width } = Dimensions.get('window');

interface Competitor {
  id: string;
  sailNumber: string;
  helmName: string;
  crewName?: string;
  clubCountry: string;
  boatName?: string;
  division: 'Red' | 'Blue' | 'Yellow';
}

interface RaceResult {
  raceNumber: number;
  position?: number;
  points: number;
  status: 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'bfd';
  notes?: string;
}

interface SeriesStanding {
  competitor: Competitor;
  totalPoints: number;
  netPoints: number;
  position: number;
  previousPosition?: number;
  raceResults: RaceResult[];
  dropWorst: number;
}

interface Championship {
  id: string;
  name: string;
  location: string;
  totalRaces: number;
  completedRaces: number;
  currentRace?: number;
  lastUpdated: string;
}

export function ResultsScreen({ navigation }: ResultsScreenProps) {
  const [championship] = useState<Championship>({
    id: '1',
    name: 'Dragon World Championships 2027',
    location: 'Hong Kong',
    totalRaces: 12,
    completedRaces: 8,
    currentRace: 9,
    lastUpdated: new Date().toISOString(),
  });

  const [standings, setStandings] = useState<SeriesStanding[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<'All' | 'Red' | 'Blue' | 'Yellow'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockStandings: SeriesStanding[] = [
      {
        competitor: {
          id: '1',
          sailNumber: 'DEN 7',
          helmName: 'Lars Hansen',
          crewName: 'Mikkel Jensen',
          clubCountry: 'Royal Danish YC (DEN)',
          boatName: 'Valkyrie',
          division: 'Red',
        },
        totalPoints: 24,
        netPoints: 18,
        position: 1,
        previousPosition: 2,
        dropWorst: 1,
        raceResults: [
          { raceNumber: 1, position: 3, points: 3, status: 'finished' },
          { raceNumber: 2, position: 1, points: 1, status: 'finished' },
          { raceNumber: 3, position: 2, points: 2, status: 'finished' },
          { raceNumber: 4, position: 1, points: 1, status: 'finished' },
          { raceNumber: 5, position: 6, points: 6, status: 'finished' },
          { raceNumber: 6, position: 1, points: 1, status: 'finished' },
          { raceNumber: 7, position: 2, points: 2, status: 'finished' },
          { raceNumber: 8, position: 2, points: 2, status: 'finished' },
        ],
      },
      {
        competitor: {
          id: '2',
          sailNumber: 'GBR 888',
          helmName: 'James Thompson',
          crewName: 'Sarah Mitchell',
          clubCountry: 'Royal Thames YC (GBR)',
          boatName: 'Britannia',
          division: 'Red',
        },
        totalPoints: 28,
        netPoints: 20,
        position: 2,
        previousPosition: 1,
        dropWorst: 1,
        raceResults: [
          { raceNumber: 1, position: 1, points: 1, status: 'finished' },
          { raceNumber: 2, position: 2, points: 2, status: 'finished' },
          { raceNumber: 3, position: 1, points: 1, status: 'finished' },
          { raceNumber: 4, position: 4, points: 4, status: 'finished' },
          { raceNumber: 5, position: 2, points: 2, status: 'finished' },
          { raceNumber: 6, position: 8, points: 8, status: 'finished' },
          { raceNumber: 7, position: 3, points: 3, status: 'finished' },
          { raceNumber: 8, position: 1, points: 1, status: 'finished' },
        ],
      },
      {
        competitor: {
          id: '3',
          sailNumber: 'AUS 1234',
          helmName: 'Michael Chen',
          crewName: 'David Wong',
          clubCountry: 'Hong Kong YC (HKG)',
          boatName: 'Dragon Pearl',
          division: 'Blue',
        },
        totalPoints: 32,
        netPoints: 25,
        position: 3,
        previousPosition: 4,
        dropWorst: 1,
        raceResults: [
          { raceNumber: 1, position: 2, points: 2, status: 'finished' },
          { raceNumber: 2, position: 4, points: 4, status: 'finished' },
          { raceNumber: 3, position: 3, points: 3, status: 'finished' },
          { raceNumber: 4, position: 2, points: 2, status: 'finished' },
          { raceNumber: 5, position: 1, points: 1, status: 'finished' },
          { raceNumber: 6, position: 3, points: 3, status: 'finished' },
          { raceNumber: 7, position: 7, points: 7, status: 'finished' },
          { raceNumber: 8, position: 4, points: 4, status: 'finished' },
        ],
      },
      // Add more mock competitors...
    ];
    setStandings(mockStandings);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const getPositionChange = (current: number, previous?: number): 'up' | 'down' | 'same' => {
    if (!previous) return 'same';
    if (current < previous) return 'up';
    if (current > previous) return 'down';
    return 'same';
  };

  const getPositionChangeIcon = (change: 'up' | 'down' | 'same') => {
    switch (change) {
      case 'up':
        return <TrendingUp color={colors.racingOptimal} size={16} />;
      case 'down':
        return <TrendingDown color={colors.racingDangerous} size={16} />;
      default:
        return null;
    }
  };

  const getResultStatus = (result: RaceResult) => {
    const statusColors = {
      finished: colors.text,
      dnf: colors.racingPoor,
      dns: colors.racingChallenging,
      dsq: colors.racingDangerous,
      ocs: colors.racingChallenging,
      bfd: colors.racingDangerous,
    };

    const statusLabels = {
      finished: result.position?.toString() || '-',
      dnf: 'DNF',
      dns: 'DNS',
      dsq: 'DSQ',
      ocs: 'OCS',
      bfd: 'BFD',
    };

    return {
      color: statusColors[result.status],
      label: statusLabels[result.status],
    };
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown color={colors.championshipGold} size={20} />;
      case 2:
        return <Medal color={colors.championshipSilver} size={20} />;
      case 3:
        return <Medal color={colors.championshipBronze} size={20} />;
      default:
        return null;
    }
  };

  const getDivisionColor = (division: string) => {
    switch (division) {
      case 'Red':
        return colors.championshipRed;
      case 'Blue':
        return colors.championshipBlue;
      case 'Yellow':
        return colors.championshipYellow;
      default:
        return colors.textMuted;
    }
  };

  const filteredStandings = selectedDivision === 'All' 
    ? standings 
    : standings.filter(s => s.competitor.division === selectedDivision);

  const renderDivisionFilter = () => {
    const divisions: Array<'All' | 'Red' | 'Blue' | 'Yellow'> = ['All', 'Red', 'Blue', 'Yellow'];
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {divisions.map(division => {
          const isSelected = selectedDivision === division;
          
          return (
            <TouchableOpacity
              key={division}
              style={[
                styles.filterTab,
                isSelected && styles.filterTabSelected,
                division !== 'All' && { 
                  borderColor: getDivisionColor(division),
                  borderWidth: isSelected ? 2 : 1 
                }
              ]}
              onPress={() => setSelectedDivision(division)}
            >
              <Text style={[
                styles.filterTabText,
                isSelected && styles.filterTabTextSelected,
                division !== 'All' && !isSelected && { color: getDivisionColor(division) }
              ]}>
                {division} {division !== 'All' && 'Fleet'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderStandingCard = (standing: SeriesStanding, index: number) => {
    const positionChange = getPositionChange(standing.position, standing.previousPosition);
    const isExpanded = showDetails === standing.competitor.id;
    
    return (
      <Animated.View
        key={standing.competitor.id}
        entering={FadeInDown.delay(index * 100)}
        style={styles.standingCard}
      >
        <TouchableOpacity 
          onPress={() => setShowDetails(isExpanded ? null : standing.competitor.id)}
          style={styles.standingHeader}
        >
          <View style={styles.positionContainer}>
            <View style={styles.positionBadge}>
              {getMedalIcon(standing.position)}
              <Text style={[
                styles.positionText,
                standing.position <= 3 && styles.positionTextMedal
              ]}>
                {standing.position}
              </Text>
            </View>
            {getPositionChangeIcon(positionChange)}
          </View>
          
          <View style={styles.competitorInfo}>
            <View style={styles.competitorHeader}>
              <Text style={styles.sailNumber}>{standing.competitor.sailNumber}</Text>
              <View style={[
                styles.divisionBadge,
                { backgroundColor: getDivisionColor(standing.competitor.division) + '20' }
              ]}>
                <Text style={[
                  styles.divisionText,
                  { color: getDivisionColor(standing.competitor.division) }
                ]}>
                  {standing.competitor.division}
                </Text>
              </View>
            </View>
            
            <Text style={styles.helmName}>{standing.competitor.helmName}</Text>
            {standing.competitor.crewName && (
              <Text style={styles.crewName}>& {standing.competitor.crewName}</Text>
            )}
            <Text style={styles.clubCountry}>{standing.competitor.clubCountry}</Text>
            {standing.competitor.boatName && (
              <Text style={styles.boatName}>"{standing.competitor.boatName}"</Text>
            )}
          </View>
          
          <View style={styles.pointsContainer}>
            <Text style={styles.netPoints}>{standing.netPoints}</Text>
            <Text style={styles.totalPoints}>({standing.totalPoints})</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <Animated.View 
            style={styles.raceResultsContainer}
            entering={FadeInDown.duration(300)}
          >
            <View style={styles.raceResultsHeader}>
              <Text style={styles.raceResultsTitle}>Race Results</Text>
              <Text style={styles.dropWorstText}>Drop worst: {standing.dropWorst}</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.raceResultsScroll}
            >
              {standing.raceResults.map((result) => {
                const resultStatus = getResultStatus(result);
                const isDropped = standing.raceResults
                  .filter(r => r.status === 'finished')
                  .sort((a, b) => (b.points || 0) - (a.points || 0))
                  .slice(0, standing.dropWorst)
                  .includes(result);
                
                return (
                  <View 
                    key={result.raceNumber}
                    style={[
                      styles.raceResultCard,
                      isDropped && styles.raceResultDropped
                    ]}
                  >
                    <Text style={styles.raceNumber}>R{result.raceNumber}</Text>
                    <Text style={[
                      styles.racePosition,
                      { color: resultStatus.color },
                      isDropped && styles.racePositionDropped
                    ]}>
                      {resultStatus.label}
                    </Text>
                    <Text style={[
                      styles.racePoints,
                      isDropped && styles.racePointsDropped
                    ]}>
                      {result.points}pts
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Championship Standings</Text>
        <TouchableOpacity style={styles.downloadButton}>
          <Download color={colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.championshipInfo}>
        <Text style={styles.championshipName}>{championship.name}</Text>
        <View style={styles.championshipStats}>
          <View style={styles.statItem}>
            <Flag color={colors.textSecondary} size={16} />
            <Text style={styles.statText}>
              {championship.completedRaces}/{championship.totalRaces} races
            </Text>
          </View>
          <View style={styles.statItem}>
            <User color={colors.textSecondary} size={16} />
            <Text style={styles.statText}>{standings.length} boats</Text>
          </View>
          <View style={styles.statItem}>
            <Calendar color={colors.textSecondary} size={16} />
            <Text style={styles.statText}>
              Updated {new Date(championship.lastUpdated).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </View>

      {isOffline && (
        <Animated.View 
          style={styles.offlineIndicator}
          entering={SlideInRight.duration(300)}
        >
          <WifiOff color={colors.warning} size={16} />
          <Text style={styles.offlineText}>Offline - showing cached results</Text>
        </Animated.View>
      )}

      {/* Fleet filter removed per design request */}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.standingsContainer}>
          {filteredStandings.map((standing, index) => renderStandingCard(standing, index))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    ...typography.headlineLarge,
    color: colors.text,
  },
  downloadButton: {
    padding: spacing.sm,
  },
  championshipInfo: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  championshipName: {
    ...typography.headlineSmall,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  championshipStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  offlineText: {
    ...typography.labelMedium,
    color: colors.warning,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterTabSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
  },
  filterTabTextSelected: {
    color: colors.textInverted,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  standingsContainer: {
    padding: spacing.screenPadding,
  },
  standingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.cardSmall,
  },
  standingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.weatherCardPadding,
  },
  positionContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
    minWidth: 40,
  },
  positionBadge: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  positionText: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
  },
  positionTextMedal: {
    color: colors.championshipGold,
  },
  competitorInfo: {
    flex: 1,
  },
  competitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sailNumber: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  divisionBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  divisionText: {
    ...typography.labelSmall,
    fontWeight: '600',
    fontSize: 10,
  },
  helmName: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  crewName: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  clubCountry: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  boatName: {
    ...typography.labelMedium,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  pointsContainer: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  netPoints: {
    ...typography.displaySmall,
    color: colors.text,
    fontWeight: '300',
  },
  totalPoints: {
    ...typography.labelMedium,
    color: colors.textMuted,
    marginTop: -spacing.xs,
  },
  pointsLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  raceResultsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.weatherCardPadding,
    paddingBottom: spacing.weatherCardPadding,
  },
  raceResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  raceResultsTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
  },
  dropWorstText: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  raceResultsScroll: {
    marginHorizontal: -spacing.xs,
  },
  raceResultCard: {
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    minWidth: 50,
  },
  raceResultDropped: {
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.6,
  },
  raceNumber: {
    ...typography.labelSmall,
    color: colors.textMuted,
    fontSize: 10,
  },
  racePosition: {
    ...typography.sailingData,
    color: colors.text,
    fontWeight: '600',
    marginVertical: spacing.xs,
  },
  racePositionDropped: {
    textDecorationLine: 'line-through',
  },
  racePoints: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontSize: 10,
  },
  racePointsDropped: {
    textDecorationLine: 'line-through',
  },
});