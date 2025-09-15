/**
 * Competitor Detail Screen - Individual racer performance details
 * Shows race-by-race breakdown, boat specs, crew info, and performance analytics
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from '../utils/reanimatedWrapper';
import { 
  Trophy,
  Medal,
  User,
  Flag,
  ArrowLeft,
  Crown,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  MapPin
} from 'lucide-react-native';
import { dragonChampionshipsLightTheme } from '../constants/dragonChampionshipsTheme';
import type { RootStackScreenProps } from '../types/navigation';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width } = Dimensions.get('window');

type CompetitorDetailScreenProps = RootStackScreenProps<'CompetitorDetail'>;

export function CompetitorDetailScreen({ navigation, route }: CompetitorDetailScreenProps) {
  const { sailNumber, competitorData, standings } = route.params;
  
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

  const racingClass = extractRacingClass(sailNumber);
  const racingClassColor = getRacingClassColor(racingClass);

  // Generate mock race results for demonstration (5 races)
  const raceResults = standings?.raceResults || [2, 1, 4, 3, 1];
  const totalRaces = raceResults.length;
  const bestFinish = Math.min(...raceResults);
  const averageFinish = (raceResults.reduce((a: number, b: number) => a + b, 0) / totalRaces).toFixed(1);
  
  // Performance trend calculation
  const recentRaces = raceResults.slice(-3);
  const earlierRaces = raceResults.slice(0, -3);
  const recentAvg = recentRaces.reduce((a: number, b: number) => a + b, 0) / recentRaces.length;
  const earlierAvg = earlierRaces.length ? earlierRaces.reduce((a: number, b: number) => a + b, 0) / earlierRaces.length : recentAvg;
  const isImproving = recentAvg < earlierAvg;

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderRaceBreakdown = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Race-by-Race Results</Text>
        <View style={styles.raceGrid}>
          {raceResults.map((result: number, index: number) => (
            <Animated.View 
              key={index}
              entering={FadeInDown.delay(index * 100)}
              style={[
                styles.raceCard,
                result === 1 && styles.raceCardWin,
                result <= 3 && result > 1 && styles.raceCardPodium
              ]}
            >
              <Text style={styles.raceNumber}>R{index + 1}</Text>
              <Text style={[
                styles.racePosition,
                result === 1 && styles.racePositionWin
              ]}>
                {result === 1 ? '🏆' : result <= 3 ? '🥈' : ''} {result}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  };

  const renderPerformanceStats = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Analytics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Trophy color={colors.championshipGold} size={24} />
            <Text style={styles.statValue}>{bestFinish}</Text>
            <Text style={styles.statLabel}>Best Finish</Text>
          </View>
          <View style={styles.statCard}>
            <Award color={colors.primary} size={24} />
            <Text style={styles.statValue}>{averageFinish}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          <View style={styles.statCard}>
            {isImproving ? (
              <TrendingUp color={colors.success} size={24} />
            ) : (
              <TrendingDown color={colors.error} size={24} />
            )}
            <Text style={[
              styles.statValue, 
              { color: isImproving ? colors.success : colors.error }
            ]}>
              {isImproving ? '↗' : '↘'}
            </Text>
            <Text style={styles.statLabel}>Trend</Text>
          </View>
          <View style={styles.statCard}>
            <Flag color={colors.textSecondary} size={24} />
            <Text style={styles.statValue}>{totalRaces}</Text>
            <Text style={styles.statLabel}>Races</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.sailNumberTitle}>{sailNumber}</Text>
          <View style={[
            styles.classHeaderBadge,
            { backgroundColor: racingClassColor }
          ]}>
            <Text style={styles.classHeaderBadgeText}>{racingClass}</Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Competitor Info Card */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          style={styles.competitorCard}
        >
          <View style={styles.competitorInfo}>
            <View style={styles.competitorHeader}>
              <Crown color={colors.championshipGold} size={32} />
              <View style={styles.competitorDetails}>
                <Text style={styles.competitorName}>
                  {standings?.helmName || 'John Smith'}
                </Text>
                {standings?.crewName && (
                  <View style={styles.crewRow}>
                    <Users color={colors.textSecondary} size={16} />
                    <Text style={styles.crewName}>& {standings.crewName}</Text>
                  </View>
                )}
                {standings?.club && (
                  <View style={styles.clubRow}>
                    <MapPin color={colors.textSecondary} size={16} />
                    <Text style={styles.clubName}>{standings.club}</Text>
                  </View>
                )}
              </View>
            </View>
            
            {competitorData?.boatName && (
              <Text style={styles.boatName}>"{competitorData.boatName}"</Text>
            )}
            
            <View style={styles.overallPosition}>
              <Text style={styles.positionLabel}>Overall Position</Text>
              <Text style={styles.positionValue}>#{standings?.position || 1}</Text>
              <Text style={styles.pointsValue}>
                {standings?.netPoints || 9} pts ({standings?.totalPoints || 9})
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Performance Analytics */}
        <Animated.View entering={FadeInDown.delay(200)}>
          {renderPerformanceStats()}
        </Animated.View>

        {/* Race-by-Race Breakdown */}
        <Animated.View entering={FadeInDown.delay(300)}>
          {renderRaceBreakdown()}
        </Animated.View>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.cardSmall,
  },
  backButton: {
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.round,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sailNumberTitle: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
  },
  classHeaderBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  classHeaderBadgeText: {
    ...typography.labelSmall,
    color: colors.textInverted,
    fontWeight: '700',
    fontSize: 11,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  competitorCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.cardMedium,
  },
  competitorInfo: {
    gap: spacing.md,
  },
  competitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  competitorDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  competitorName: {
    ...typography.headlineLarge,
    color: colors.text,
    fontWeight: '700',
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  crewName: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clubName: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  boatName: {
    ...typography.bodyLarge,
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  overallPosition: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  positionLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  positionValue: {
    ...typography.displayLarge,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 42,
  },
  pointsValue: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.cardSmall,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statValue: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  raceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  raceCard: {
    width: (width - spacing.md * 2 - spacing.lg * 2 - spacing.sm * 4) / 5,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  raceCardWin: {
    backgroundColor: colors.championshipGold + '20',
    borderColor: colors.championshipGold,
  },
  raceCardPodium: {
    backgroundColor: colors.championshipSilver + '20',
    borderColor: colors.championshipSilver,
  },
  raceNumber: {
    ...typography.labelSmall,
    color: colors.textMuted,
    fontSize: 10,
  },
  racePosition: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.xs / 2,
  },
  racePositionWin: {
    color: colors.championshipGold,
  },
});