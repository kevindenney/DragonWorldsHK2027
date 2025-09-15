/**
 * Simplified Results Screen - China Coast Race Week Style
 * Clean, simple display of race standings data
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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Removed react-native-reanimated import
import { 
  Trophy,
  Medal,
  User,
  Flag,
  Calendar,
  MapPin,
  RefreshCw,
  Crown,
  Download,
  AlertCircle,
  ChevronRight
} from 'lucide-react-native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import firebaseRaceDataService, { 
  Standing, 
  EventData, 
  Competitor 
} from '../../services/firebaseRaceDataService';
import type { ResultsScreenProps } from '../../types/navigation';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width } = Dimensions.get('window');

// Default event ID for Dragon Worlds HK 2027
const DEFAULT_EVENT_ID = 'dragon-worlds-2027';

export function SimplifiedResultsScreen({ navigation }: ResultsScreenProps) {
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedRacingClass, setSelectedRacingClass] = useState<'All' | string>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load initial data
  useEffect(() => {
    loadEventData();
    
    // Subscribe to real-time updates
    const unsubscribe = firebaseRaceDataService.subscribeToStandings(
      DEFAULT_EVENT_ID,
      (updatedStandings) => {
        setStandings(updatedStandings);
        setLastUpdated(new Date());
      }
    );

    return unsubscribe;
  }, []);

  // Load event data - now with CCR 2024 scraping support
  const loadEventData = async () => {
    try {
      console.log('🏁 Starting enhanced loadEventData with CCR 2024 scraping...');
      setLoading(true);

      // Try loading data in this order:
      // 1. Try CCR 2024 scraping first for real regatta data
      // 2. Fall back to Firestore 
      // 3. Use mock data as final fallback
      
      try {
        console.log('🔥 Attempting to load CCR 2024 from Firestore...');
        const firestoreData = await firebaseRaceDataService.fetchCCR2024FromFirestore();
        
        console.log('🔥 CCR 2024 Firestore data loaded:', { 
          eventName: firestoreData.eventData?.name,
          standings: firestoreData.standings?.length, 
          competitors: firestoreData.competitors?.length 
        });
        
        if (firestoreData.eventData) setEventData(firestoreData.eventData);
        setStandings(firestoreData.standings);
        setCompetitors(firestoreData.competitors);
        setLastUpdated(new Date());
        
        console.log('✅ CCR 2024 Firestore data loaded successfully!');
        return; // Success - exit early
        
      } catch (firestoreError) {
        console.log(
          '🔧 Firestore failed, trying CCR scraping...',
          firestoreError instanceof Error ? firestoreError.message : firestoreError
        );
        
        try {
          console.log('🏁 Attempting CCR 2024 scraping...');
          const scrapedData = await firebaseRaceDataService.scrapeCCR2024Results();
          
          console.log('🏁 CCR 2024 data scraped successfully:', { 
            eventName: scrapedData.eventData?.name,
            standings: scrapedData.standings?.length, 
            competitors: scrapedData.competitors?.length 
          });
          
          if (scrapedData.eventData) setEventData(scrapedData.eventData);
          setStandings(scrapedData.standings);
          setCompetitors(scrapedData.competitors);
          setLastUpdated(new Date());
          
          console.log('✅ CCR 2024 data loaded successfully!');
          return; // Success - exit early
          
        } catch (scrapingError) {
          console.log(
            '🔧 CCR scraping failed, trying Firestore...',
            scrapingError instanceof Error ? scrapingError.message : scrapingError
          );
          
          try {
            console.log('🔥 Trying to load Firestore data...');
            const [event, standingsData, competitorsData] = await Promise.all([
              firebaseRaceDataService.getEvent(DEFAULT_EVENT_ID),
              firebaseRaceDataService.getStandings(DEFAULT_EVENT_ID),
              firebaseRaceDataService.getCompetitors(DEFAULT_EVENT_ID)
            ]);

            console.log('🔥 Firestore data loaded:', { event, standingsData: standingsData?.length, competitorsData: competitorsData?.length });
            if (event) setEventData(event);
            if (standingsData) setStandings(standingsData);
            if (competitorsData) setCompetitors(competitorsData);
            setLastUpdated(new Date());
            
            console.log('✅ Firestore data loaded successfully!');
            return; // Success - exit early
            
          } catch (firestoreError) {
            console.log(
              '🔧 Firestore failed, using mock data...',
              firestoreError instanceof Error ? firestoreError.message : firestoreError
            );
            
            // Final fallback to mock data
            const mockData = firebaseRaceDataService.generateMockRaceData();
            console.log('🔧 Mock data generated:', { 
              eventData: mockData.eventData?.name, 
              standings: mockData.standings?.length, 
              competitors: mockData.competitors?.length 
            });
            
            setEventData(mockData.eventData);
            setStandings(mockData.standings);
            setCompetitors(mockData.competitors);
            setLastUpdated(new Date());
            
            console.log('✅ Mock data loaded successfully!');
          }
        }
      }
      
    } catch (error) {
      console.error('🚨 Error loading event data:', error);
      Alert.alert('Error', 'Failed to load race results');
    } finally {
      setLoading(false);
      console.log('✅ loadEventData completed');
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    console.log('🔄 Starting refresh...');
    setRefreshing(true);
    
    try {
      // Trigger Firebase Function to scrape latest data
      console.log('🔄 Attempting data sync...');
      const syncSuccess = await firebaseRaceDataService.triggerDataSync(DEFAULT_EVENT_ID);
      
      if (syncSuccess) {
        console.log('🔄 Sync successful, reloading data...');
        await loadEventData();
      } else {
        console.log('🔄 Sync failed, falling back to existing data load...');
        // Always try to load data (including mock) even if sync fails
        await loadEventData();
        Alert.alert('Sync Failed', 'Unable to fetch latest results, showing available data');
      }
    } catch (error) {
      console.log('🔄 Refresh error, falling back to data load...', error);
      // Always try to load data (including mock) even if there's an error
      try {
        await loadEventData();
        Alert.alert('Error', 'Failed to sync latest data, showing available data');
      } catch (loadError) {
        Alert.alert('Error', 'Failed to refresh data');
      }
    }
    
    setRefreshing(false);
    console.log('✅ Refresh completed');
  }, []);

  // Get racing class color
  const getRacingClassColor = (racingClass: string) => {
    const normalizedClass = racingClass.toLowerCase();
    if (normalizedClass.includes('irc-racer-0')) return '#FF6B6B'; // Red
    if (normalizedClass.includes('irc-cape-31')) return '#4ECDC4'; // Teal  
    if (normalizedClass.includes('irc-racer-2')) return '#45B7D1'; // Blue
    if (normalizedClass.includes('irc-racer-3')) return '#FFA07A'; // Light Orange
    if (normalizedClass.includes('irc-premier-cruiser')) return '#98D8C8'; // Mint
    if (normalizedClass.includes('phs')) return '#F7DC6F'; // Yellow
    if (normalizedClass.includes('hong-kong-kettle')) return '#BB8FCE'; // Purple
    return colors.textSecondary;
  };

  // Extract racing class from sail number
  const extractRacingClass = (sailNumber: string): string => {
    if (sailNumber.includes('IRC-RACER-0')) return 'IRC Racer 0';
    if (sailNumber.includes('IRC-CAPE-31')) return 'IRC CAPE 31';
    if (sailNumber.includes('IRC-RACER-2')) return 'IRC Racer 2'; 
    if (sailNumber.includes('IRC-RACER-3')) return 'IRC Racer 3';
    if (sailNumber.includes('IRC-PREMIER-CRUISER')) return 'IRC Premier Cruiser';
    if (sailNumber.includes('PHS')) return 'PHS';
    if (sailNumber.includes('HONG-KONG-KETTLE')) return 'Hong Kong Kettle';
    return 'Other';
  };

  // Get unique racing classes from current standings
  const getAvailableRacingClasses = (): string[] => {
    const classes = new Set<string>();
    standings.forEach(standing => {
      const racingClass = extractRacingClass(standing.sailNumber);
      classes.add(racingClass);
    });
    return Array.from(classes).sort();
  };

  // Get medal icon for top 3
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown color={colors.championshipGold} size={20} />;
      case 2:
        return <Medal color={colors.championshipSilver} size={18} />;
      case 3:
        return <Medal color={colors.championshipBronze} size={18} />;
      default:
        return null;
    }
  };

  // Filter standings by racing class
  const filteredStandings = selectedRacingClass === 'All' 
    ? standings || [] 
    : (standings || []).filter(s => {
        const racingClass = extractRacingClass(s.sailNumber);
        return racingClass === selectedRacingClass;
      });

  // Render racing class filter tabs
  const renderRacingClassFilter = () => {
    const availableClasses = getAvailableRacingClasses();
    const allClasses = ['All', ...availableClasses];
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {allClasses.map(racingClass => {
          const isSelected = selectedRacingClass === racingClass;
          const classCount = racingClass === 'All' ? standings.length : 
            standings.filter(s => extractRacingClass(s.sailNumber) === racingClass).length;
          
          return (
            <TouchableOpacity
              key={racingClass}
              style={[
                styles.racingClassTab,
                isSelected && styles.racingClassTabSelected,
                racingClass !== 'All' && { 
                  borderColor: getRacingClassColor(racingClass) + '60',
                  borderWidth: isSelected ? 2 : 1
                }
              ]}
              onPress={() => setSelectedRacingClass(racingClass)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`${racingClass} class filter`}
              accessibilityState={{ selected: isSelected }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <View style={styles.racingClassTabContent}>
                <Text numberOfLines={1} style={[
                  styles.racingClassTabText,
                  isSelected && styles.racingClassTabTextSelected,
                  racingClass !== 'All' && !isSelected && { color: getRacingClassColor(racingClass) }
                ]}>
                  {racingClass}
                </Text>
                <View style={[
                  styles.countBadge,
                  isSelected && styles.countBadgeSelected,
                  !isSelected && racingClass !== 'All' && { borderColor: getRacingClassColor(racingClass) + '80' }
                ]}>
                  <Text style={[
                    styles.countBadgeText,
                    isSelected && styles.countBadgeTextSelected
                  ]}>
                    {classCount}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // Handle competitor card tap
  const handleCompetitorTap = (standing: Standing) => {
    const competitor = competitors.find(c => c.sailNumber === standing.sailNumber);
    navigation.navigate('CompetitorDetail', {
      sailNumber: standing.sailNumber,
      competitorData: competitor,
      standings: standing
    });
  };

  // Render enhanced standing card
  const renderStandingCard = (standing: Standing, index: number) => {
    const competitor = (competitors || []).find(c => c.sailNumber === standing.sailNumber);
    const racingClass = extractRacingClass(standing.sailNumber);
    const racingClassColor = getRacingClassColor(racingClass);
    
    return (
      <View
        key={standing.sailNumber}
      >
        <TouchableOpacity 
          style={styles.standingCard}
          onPress={() => handleCompetitorTap(standing)}
          activeOpacity={0.7}
        >
          <View style={styles.positionSection}>
            <View style={[
              styles.positionBadge,
              standing.position === 1 && styles.positionBadgeGold,
              standing.position === 2 && styles.positionBadgeSilver,
              standing.position === 3 && styles.positionBadgeBronze
            ]}>
              <Text style={styles.positionTextCircle}>{standing.position}</Text>
            </View>
            <Trophy color={standing.position === 1 ? colors.secondary : colors.textMuted} size={18} style={styles.positionTrophy} />
          </View>
          
          <View style={styles.competitorSection}>
            <View style={styles.competitorHeader}>
              <Text style={styles.sailNumber}>{standing.sailNumber}</Text>
              <View style={[
                styles.racingClassBadge,
                { backgroundColor: racingClassColor }
              ]}>
                <Text style={styles.racingClassBadgeText}>
                  {racingClass}
                </Text>
              </View>
            </View>
            
            <Text style={styles.helmName}>{standing.helmName}</Text>
            {standing.crewName && (
              <Text style={styles.crewName}>& {standing.crewName}</Text>
            )}
            
            <View style={styles.detailsRow}>
              {standing.club && (
                <Text style={styles.clubText}>{standing.club}</Text>
              )}
              {competitor?.boatName && (
                <Text style={styles.boatName}>"{competitor.boatName}"</Text>
              )}
            </View>
          </View>
          
          <View style={styles.pointsSection}>
            <Text style={styles.netPoints}>{standing.netPoints}</Text>
            <Text style={styles.totalPoints}>({standing.totalPoints})</Text>
            <Text style={styles.pointsLabel}>pts</Text>
            <ChevronRight color={colors.textMuted} size={16} style={styles.chevronIcon} />
          </View>
        </TouchableOpacity>
      </View>
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Championship Standings</Text>
          {eventData && (
            <Text style={styles.eventName}>{eventData.name}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <RefreshCw color={colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      {/* Series Header + Stats */}
      <View style={styles.seriesHeaderSection}>
        <View style={styles.seriesHeaderLeft}>
          <Text style={styles.seriesTitle}>{eventData?.name || 'Dragon World Championship'}</Text>
          <View style={styles.seriesMetaRow}>
            <View style={styles.seriesMetaItem}>
              <MapPin color={colors.textSecondary} size={16} />
              <Text style={styles.statText}>{(eventData as any)?.location || 'Hong Kong'}</Text>
            </View>
            <View style={styles.seriesMetaItem}>
              <User color={colors.textSecondary} size={16} />
              <Text style={styles.statText}>{eventData?.totalCompetitors || standings.length} boats</Text>
            </View>
            <View style={styles.seriesMetaItem}>
              <Flag color={colors.textSecondary} size={16} />
              <Text style={styles.statText}>
                {(eventData?.completedRaces ?? 0)}/{eventData?.totalRaces || 12} races
              </Text>
            </View>
            {lastUpdated && (
              <View style={styles.seriesMetaItem}>
                <Calendar color={colors.textSecondary} size={16} />
                <Text style={styles.statText}>Updated {lastUpdated.toLocaleTimeString()}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.seriesStatusBadge}>
          <Text style={styles.seriesStatusText}>Ongoing</Text>
        </View>
      </View>

      {/* Racing Class Filter */}
      {renderRacingClassFilter()}

      {/* Results List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredStandings.length > 0 ? (
          filteredStandings.map((standing, index) => renderStandingCard(standing, index))
        ) : (
          <View style={styles.emptyState}>
            <Trophy color={colors.textMuted} size={48} />
            <Text style={styles.emptyStateText}>No results available</Text>
            <Text style={styles.emptyStateSubtext}>Pull down to refresh</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.cardSmall,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
  },
  eventName: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  refreshButton: {
    padding: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.round,
  },
  seriesHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  seriesHeaderLeft: {
    flex: 1,
  },
  seriesTitle: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  seriesMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  seriesMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seriesStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  seriesStatusText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  statText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontSize: 12,
  },
  filterContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 6,
  },
  racingClassTab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  racingClassTabSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  racingClassTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  racingClassTabText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 11,
  },
  racingClassTabTextSelected: {
    color: colors.textInverted,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    minWidth: 18,
    alignItems: 'center',
  },
  countBadgeSelected: {
    backgroundColor: colors.textInverted + '15',
    borderColor: colors.textInverted + '25',
  },
  countBadgeText: {
    ...typography.labelSmall,
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  countBadgeTextSelected: {
    color: colors.textInverted,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  standingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.cardSmall,
  },
  positionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    minWidth: 56,
  },
  positionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  positionBadgeGold: { backgroundColor: '#FFF5CC' },
  positionBadgeSilver: { backgroundColor: '#F0F0F5' },
  positionBadgeBronze: { backgroundColor: '#FFE8D6' },
  positionText: {
    ...typography.displaySmall,
    color: colors.text,
    fontWeight: '700',
    fontSize: 24,
  },
  positionTextCircle: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
  },
  positionTrophy: {
    marginLeft: spacing.xs,
  },
  positionTextMedal: {
    color: colors.championshipGold,
  },
  competitorSection: {
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
  racingClassBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginLeft: spacing.sm,
  },
  racingClassBadgeText: {
    ...typography.labelSmall,
    color: colors.textInverted,
    fontWeight: '700',
    fontSize: 9,
  },
  helmName: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  crewName: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  clubText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontSize: 12,
  },
  boatName: {
    ...typography.labelMedium,
    color: colors.textTertiary,
    fontStyle: 'italic',
    fontSize: 12,
  },
  pointsSection: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
    minWidth: 60,
  },
  netPoints: {
    ...typography.displaySmall,
    color: colors.text,
    fontWeight: '300',
    fontSize: 28,
  },
  totalPoints: {
    ...typography.labelMedium,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: -spacing.xs,
  },
  pointsLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    fontSize: 11,
  },
  chevronIcon: {
    marginTop: spacing.xs,
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