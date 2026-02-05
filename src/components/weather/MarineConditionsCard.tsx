import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from '../../utils/reanimatedWrapper';
import { Waves, Navigation, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';

interface TideData {
  height: number;
  direction: 'rising' | 'falling' | 'slack';
  nextChange: {
    time: string;
    type: 'high' | 'low';
    height: number;
  };
}

interface CurrentData {
  speed: number;
  direction: number;
  set: string; // Cardinal direction
  drift: number; // Speed in knots
}

interface WaveData {
  significantHeight: number;
  dominantPeriod: number;
  direction: number;
  swellHeight?: number;
  swellPeriod?: number;
  swellDirection?: number;
}

interface MarineConditionsCardProps {
  waveData: WaveData;
  currentData: CurrentData;
  tideData: TideData;
  visibility: number;
  seaTemperature?: number;
  showRacingImpact?: boolean;
}

export const MarineConditionsCard: React.FC<MarineConditionsCardProps> = ({
  waveData,
  currentData,
  tideData,
  visibility,
  seaTemperature,
  showRacingImpact = false
}) => {
  const getWaveConditionColor = (height: number): string => {
    if (height < 0.5) return colors.success;
    if (height < 1.0) return colors.primary;
    if (height < 1.5) return colors.warning;
    return colors.error;
  };

  const getWaveConditionText = (height: number): string => {
    if (height < 0.3) return 'Calm';
    if (height < 0.6) return 'Slight';
    if (height < 1.0) return 'Moderate';
    if (height < 1.5) return 'Rough';
    return 'Very Rough';
  };

  const getTideIcon = (direction: string) => {
    switch (direction) {
      case 'rising':
        return <TrendingUp color={colors.primary} size={16} />;
      case 'falling':
        return <TrendingDown color={colors.primary} size={16} />;
      default:
        return <Minus color={colors.textMuted} size={16} />;
    }
  };

  const getRacingImpact = (): { impact: string; color: string; advice: string } => {
    const waveImpact = waveData.significantHeight;
    const currentImpact = currentData.speed;
    
    if (waveImpact > 1.5 || currentImpact > 2.0) {
      return {
        impact: 'HIGH IMPACT',
        color: colors.error,
        advice: 'Consider tactical adjustments'
      };
    } else if (waveImpact > 1.0 || currentImpact > 1.5) {
      return {
        impact: 'MODERATE',
        color: colors.warning,
        advice: 'Factor into race strategy'
      };
    } else if (waveImpact > 0.5 || currentImpact > 0.8) {
      return {
        impact: 'MINOR',
        color: colors.primary,
        advice: 'Minimal tactical effect'
      };
    } else {
      return {
        impact: 'MINIMAL',
        color: colors.success,
        advice: 'Ideal racing conditions'
      };
    }
  };

  const formatDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const racingImpact = showRacingImpact ? getRacingImpact() : null;

  return (
    <Animated.View style={styles.container}>
      <Text style={styles.title}>Marine Conditions</Text>
      
      {/* Wave Analysis */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Waves color={getWaveConditionColor(waveData.significantHeight)} size={20} />
          <Text style={styles.sectionTitle}>Wave Analysis</Text>
        </View>
        
        <View style={styles.dataGrid}>
          <View style={styles.dataPoint}>
            <Text style={[styles.primaryValue, { color: getWaveConditionColor(waveData.significantHeight) }]}>
              {waveData.significantHeight.toFixed(1)}m
            </Text>
            <Text style={styles.dataLabel}>Significant Height</Text>
            <Text style={styles.conditionText}>
              {getWaveConditionText(waveData.significantHeight)}
            </Text>
          </View>
          
          <View style={styles.dataPoint}>
            <Text style={styles.primaryValue}>{waveData.dominantPeriod.toFixed(1)}s</Text>
            <Text style={styles.dataLabel}>Period</Text>
            <Text style={styles.directionText}>
              {formatDirection(waveData.direction)}
            </Text>
          </View>
          
          {waveData.swellHeight && (
            <View style={styles.dataPoint}>
              <Text style={styles.secondaryValue}>{waveData.swellHeight.toFixed(1)}m</Text>
              <Text style={styles.dataLabel}>Swell</Text>
              <Text style={styles.directionText}>
                {waveData.swellPeriod?.toFixed(1)}s
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Current Analysis */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Navigation color={colors.primary} size={20} />
          <Text style={styles.sectionTitle}>Current</Text>
        </View>
        
        <View style={styles.currentDisplay}>
          <View style={styles.currentVector}>
            <Text style={styles.primaryValue}>{currentData.speed.toFixed(1)} kts</Text>
            <Text style={styles.dataLabel}>Speed</Text>
          </View>
          
          <View style={styles.currentDirection}>
            <Text style={styles.compassValue}>{currentData.direction}°</Text>
            <Text style={styles.cardinalDirection}>{currentData.set}</Text>
            <Text style={styles.dataLabel}>Set</Text>
          </View>
          
          <View style={styles.driftIndicator}>
            <Text style={styles.secondaryValue}>{currentData.drift.toFixed(2)}</Text>
            <Text style={styles.dataLabel}>Drift Factor</Text>
          </View>
        </View>
      </View>

      {/* Tide Information */}
      <View style={styles.section}>
        <View style={styles.tideHeader}>
          <Text style={styles.sectionTitle}>Tidal State</Text>
          {getTideIcon(tideData.direction)}
        </View>
        
        <View style={styles.tideDisplay}>
          <View style={styles.currentTide}>
            <Text style={styles.tideValue}>{tideData.height.toFixed(2)}m</Text>
            <Text style={styles.tideStatus}>
              {tideData.direction === 'rising' ? 'Rising' : 
               tideData.direction === 'falling' ? 'Falling' : 'Slack'}
            </Text>
          </View>
          
          <View style={styles.nextTide}>
            <Text style={styles.nextTideLabel}>
              Next {tideData.nextChange.type}: {tideData.nextChange.time}
            </Text>
            <Text style={styles.nextTideValue}>
              {tideData.nextChange.height.toFixed(2)}m
            </Text>
          </View>
        </View>
      </View>

      {/* Additional Conditions */}
      <View style={styles.additionalConditions}>
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>Visibility</Text>
          <Text style={styles.conditionValue}>{visibility.toFixed(1)} km</Text>
        </View>
        
        {seaTemperature && (
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Sea Temp</Text>
            <Text style={styles.conditionValue}>{seaTemperature.toFixed(1)}°C</Text>
          </View>
        )}
      </View>

      {/* Racing Impact Analysis */}
      {showRacingImpact && racingImpact && (
        <View style={[styles.racingImpact, { borderLeftColor: racingImpact.color }]}>
          <Text style={[styles.impactLevel, { color: racingImpact.color }]}>
            {racingImpact.impact}
          </Text>
          <Text style={styles.impactAdvice}>{racingImpact.advice}</Text>
          
          <View style={styles.impactDetails}>
            <Text style={styles.impactDetailText}>
              • Wave impact: {waveData.significantHeight > 1.0 ? 'Significant' : 'Manageable'}
            </Text>
            <Text style={styles.impactDetailText}>
              • Current effect: {currentData.speed > 1.5 ? 'Major factor' : 'Minor factor'}
            </Text>
            <Text style={styles.impactDetailText}>
              • Tide timing: {tideData.direction === 'slack' ? 'Neutral' : 'Active'}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  dataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataPoint: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  primaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: typography.fontFamily.mono,
  },
  secondaryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: typography.fontFamily.mono,
  },
  dataLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  conditionText: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  directionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  currentDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentVector: {
    alignItems: 'center',
    flex: 1,
  },
  currentDirection: {
    alignItems: 'center',
    flex: 1,
  },
  driftIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  compassValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: typography.fontFamily.mono,
  },
  cardinalDirection: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  tideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  tideDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentTide: {
    alignItems: 'flex-start',
  },
  tideValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: typography.fontFamily.mono,
  },
  tideStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  nextTide: {
    alignItems: 'flex-end',
  },
  nextTideLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  nextTideValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: typography.fontFamily.mono,
  },
  additionalConditions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.sm,
  },
  conditionItem: {
    alignItems: 'center',
  },
  conditionLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
    fontFamily: typography.fontFamily.mono,
  },
  racingImpact: {
    backgroundColor: colors.backgroundLight,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  impactLevel: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  impactAdvice: {
    fontSize: 13,
    color: colors.text,
    marginTop: 4,
    fontWeight: '500',
  },
  impactDetails: {
    marginTop: spacing.xs,
  },
  impactDetailText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});