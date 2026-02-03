/**
 * Live Results Screen with Firestore Integration
 * Displays real-time race results from racingrulesofsailing.org
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
  ActivityIndicator,
  Linking,
  Alert
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
  Crown,
  RefreshCw,
  WifiOff,
  ExternalLink,
  FileText,
  AlertCircle
} from 'lucide-react-native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import firebaseRaceDataService, { 
  Standing, 
  EventData, 
  Race,
  Competitor 
} from '../../services/firebaseRaceDataService';
import type { ResultsScreenProps } from '../../types/navigation';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width } = Dimensions.get('window');

// Default event ID for Dragon Worlds HK 2027
const DEFAULT_EVENT_ID = 'dragon-worlds-2027';

export function LiveResultsScreen({ navigation }: ResultsScreenProps) {
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<'All' | 'Red' | 'Blue' | 'Yellow'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadEventData();
    
    // Subscribe to real-time updates
    const unsubscribe = firebaseRaceDataService.subscribeToStandings(
      DEFAULT_EVENT_ID,
      (updatedStandings) => {
        setStandings(updatedStandings);
        setIsOffline(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Load event data from Firestore
  const loadEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load event info
      const event = await firebaseRaceDataService.getEvent(DEFAULT_EVENT_ID);
      if (event) {
        setEventData(event);
      }

      // Load standings
      const standingsData = await firebaseRaceDataService.getStandings(DEFAULT_EVENT_ID);
      setStandings(standingsData);

      // Load races
      const racesData = await firebaseRaceDataService.getRaceResults(DEFAULT_EVENT_ID);
      setRaces(racesData);

      // Load competitors
      const competitorsData = await firebaseRaceDataService.getCompetitors(DEFAULT_EVENT_ID);
      setCompetitors(competitorsData);

      setIsOffline(false);
    } catch (error) {
      setError('Failed to load race data. Using cached results.');
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Trigger Firebase Function to scrape latest data
    const syncSuccess = await firebaseRaceDataService.triggerDataSync(DEFAULT_EVENT_ID);
    
    if (syncSuccess) {
      // Reload data after sync
      await loadEventData();
    } else {
      Alert.alert(
        'Sync Failed',
        'Unable to fetch latest results. Please try again later.',
        [{ text: 'OK' }]
      );
    }
    
    setRefreshing(false);
  }, []);

  // Open external links
  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  // Open protest form
  const openProtestForm = () => {
    const protestUrl = `https://www.racingrulesofsailing.org/event/${DEFAULT_EVENT_ID}/protest/new`;
    openExternalLink(protestUrl);
  };

  // Open scoring inquiry form
  const openScoringInquiry = () => {
    const inquiryUrl = `https://www.racingrulesofsailing.org/event/${DEFAULT_EVENT_ID}/scoring-inquiry`;
    openExternalLink(inquiryUrl);
  };

  // View full results on website
  const viewFullResults = () => {
    const resultsUrl = `https://www.racingrulesofsailing.org/event/${DEFAULT_EVENT_ID}/results`;
    openExternalLink(resultsUrl);
  };

  // Get position change indicator
  const getPositionChange = (current: number, previousPosition?: number): 'up' | 'down' | 'same' => {
    if (!previousPosition) return 'same';
    if (current < previousPosition) return 'up';
    if (current > previousPosition) return 'down';
    return 'same';
  };

  // Get position change icon
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

  // Get medal icon for top 3
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

  // Get division color
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

  // Filter standings by division
  const filteredStandings = selectedDivision === 'All' 
    ? standings 
    : standings.filter(s => {
        const competitor = competitors.find(c => c.sailNumber === s.sailNumber);
        return competitor?.division === selectedDivision;
      });

  // Render division filter tabs
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

  // Render standing card
  const renderStandingCard = (standing: Standing, index: number) => {
    const competitor = competitors.find(c => c.sailNumber === standing.sailNumber);
    const isExpanded = showDetails === standing.sailNumber;
    
    return (
      <Animated.View
        key={standing.sailNumber}
        entering={FadeInDown.delay(index * 50)}
        style={styles.standingCard}
      >
        <TouchableOpacity 
          onPress={() => setShowDetails(isExpanded ? null : standing.sailNumber)}
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
          </View>
          
          <View style={styles.competitorInfo}>
            <View style={styles.competitorHeader}>
              <Text style={styles.sailNumber}>{standing.sailNumber}</Text>
              {competitor?.division && (
                <View style={[
                  styles.divisionBadge,
                  { backgroundColor: getDivisionColor(competitor.division) + '20' }
                ]}>
                  <Text style={[
                    styles.divisionText,
                    { color: getDivisionColor(competitor.division) }
                  ]}>
                    {competitor.division}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.helmName}>{standing.helmName}</Text>
            {standing.crewName && (
              <Text style={styles.crewName}>& {standing.crewName}</Text>
            )}
            {standing.club && (
              <Text style={styles.clubCountry}>{standing.club}</Text>
            )}
            {competitor?.boatName && (
              <Text style={styles.boatName}>"{competitor.boatName}"</Text>
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
              <Text style={styles.raceResultsTitle}>Race Scores</Text>
              <Text style={styles.dropWorstText}>
                {standing.raceScores.filter(s => s.isDiscarded).length} discarded
              </Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.raceResultsScroll}
            >
              {standing.raceScores.map((score, index) => (
                <View 
                  key={index}
                  style={[
                    styles.raceResultCard,
                    score.isDiscarded && styles.raceResultDropped
                  ]}
                >
                  <Text style={styles.raceNumber}>R{index + 1}</Text>
                  <Text style={[
                    styles.racePosition,
                    score.isDiscarded && styles.racePositionDropped
                  ]}>
                    {score.status === 'finished' ? score.position || score.points : score.status}
                  </Text>
                  <Text style={[
                    styles.racePoints,
                    score.isDiscarded && styles.racePointsDropped
                  ]}>
                    {score.points}pts
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading race results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Championship Standings</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={viewFullResults}>
            <ExternalLink color={colors.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
            <RefreshCw color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {eventData && (
        <View style={styles.championshipInfo}>
          <Text style={styles.championshipName}>{eventData.name}</Text>
          <View style={styles.championshipStats}>
            <View style={styles.statItem}>
              <Flag color={colors.textSecondary} size={16} />
              <Text style={styles.statText}>
                {eventData.completedRaces}/{eventData.totalRaces} races
              </Text>
            </View>
            <View style={styles.statItem}>
              <User color={colors.textSecondary} size={16} />
              <Text style={styles.statText}>{eventData.totalCompetitors} boats</Text>
            </View>
            <View style={styles.statItem}>
              <Calendar color={colors.textSecondary} size={16} />
              <Text style={styles.statText}>
                {new Date(eventData.lastUpdated.toDate()).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {(isOffline || error) && (
        <Animated.View 
          style={styles.offlineIndicator}
          entering={SlideInRight.duration(300)}
        >
          {isOffline ? (
            <>
              <WifiOff color={colors.warning} size={16} />
              <Text style={styles.offlineText}>Offline - showing cached results</Text>
            </>
          ) : (
            <>
              <AlertCircle color={colors.warning} size={16} />
              <Text style={styles.offlineText}>{error}</Text>
            </>
          )}
        </Animated.View>
      )}

      {/* Quick Actions */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.actionsContainer}
        contentContainerStyle={styles.actionsContent}
      >
        <TouchableOpacity style={styles.actionButton} onPress={openProtestForm}>
          <FileText color={colors.primary} size={16} />
          <Text style={styles.actionButtonText}>File Protest</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={openScoringInquiry}>
          <AlertCircle color={colors.primary} size={16} />
          <Text style={styles.actionButtonText}>Scoring Inquiry</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={viewFullResults}>
          <ExternalLink color={colors.primary} size={16} />
          <Text style={styles.actionButtonText}>Full Results</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderDivisionFilter()}

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
          {filteredStandings.length > 0 ? (
            filteredStandings.map((standing, index) => renderStandingCard(standing, index))
          ) : (
            <View style={styles.emptyState}>
              <Trophy color={colors.textMuted} size={48} />
              <Text style={styles.emptyStateText}>No results available yet</Text>
              <Text style={styles.emptyStateSubtext}>Pull down to refresh</Text>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginTop: spacing.md,
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
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
  actionsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  actionsContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    gap: spacing.xs,
  },
  actionButtonText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '600',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    ...typography.headlineSmall,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});