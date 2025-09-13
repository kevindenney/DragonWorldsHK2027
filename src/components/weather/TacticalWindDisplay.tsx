import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  FadeInDown 
} from 'react-native-reanimated';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown,
  RotateCw,
  Target,
  Wind
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { darkSkyColors, darkSkyTypography, darkSkySpacing } from '../../constants/darkSkyTheme';

const { width } = Dimensions.get('window');

interface WindShift {
  time: string;
  previousDirection: number;
  currentDirection: number;
  magnitude: number;
  type: 'lift' | 'header' | 'veer' | 'back';
}

interface TacticalData {
  laylineAngle: number;
  crossingAngle: number;
  favoredTack: 'port' | 'starboard';
  windShiftPrediction: {
    nextShift: WindShift | null;
    confidence: number;
    timeToShift: number; // minutes
  };
  startLineAnalysis: {
    favored: 'left' | 'right' | 'neutral';
    advantage: number; // degrees
    currentBias: number;
  };
}

interface TacticalWindDisplayProps {
  currentWind: {
    speed: number;
    direction: number;
    gust?: number;
  };
  windHistory: Array<{
    time: string;
    direction: number;
    speed: number;
  }>;
  courseInfo?: {
    startLineBearing: number;
    windwardMarkBearing: number;
    raceDistance: number; // nautical miles
  };
  showStartLineAnalysis?: boolean;
}

export const TacticalWindDisplay: React.FC<TacticalWindDisplayProps> = ({
  currentWind,
  windHistory,
  courseInfo,
  showStartLineAnalysis = false
}) => {
  const windDirectionAnimation = useSharedValue(currentWind.direction);
  const shiftIndicatorAnimation = useSharedValue(0);

  useEffect(() => {
    windDirectionAnimation.value = withTiming(currentWind.direction, { duration: 800 });
  }, [currentWind.direction]);

  const calculateTacticalData = (): TacticalData => {
    const recentHistory = windHistory.slice(-10);
    
    // Calculate wind shifts
    const windShifts = recentHistory.slice(1).map((current, index) => {
      const previous = recentHistory[index];
      const magnitude = Math.abs(current.direction - previous.direction);
      let type: WindShift['type'] = 'veer';
      
      if (current.direction > previous.direction) {
        type = magnitude > 15 ? 'lift' : 'veer';
      } else {
        type = magnitude > 15 ? 'header' : 'back';
      }

      return {
        time: current.time,
        previousDirection: previous.direction,
        currentDirection: current.direction,
        magnitude,
        type
      } as WindShift;
    });

    // Calculate laylines (±45 degrees from wind)
    const laylineAngle = 45;
    const crossingAngle = 90;

    // Predict next shift based on oscillation pattern
    let nextShift: WindShift | null = null;
    let confidence = 0;
    let timeToShift = 0;

    if (windShifts.length >= 3) {
      const lastShift = windShifts[windShifts.length - 1];
      const avgShiftMagnitude = windShifts.reduce((sum, shift) => sum + shift.magnitude, 0) / windShifts.length;
      
      // Simple oscillation prediction
      if (lastShift.type === 'lift' || lastShift.type === 'veer') {
        confidence = Math.min(80, avgShiftMagnitude * 4);
        timeToShift = Math.max(3, 15 - avgShiftMagnitude);
      }
    }

    // Determine favored tack
    const favoredTack: 'port' | 'starboard' = courseInfo 
      ? (Math.abs(currentWind.direction - courseInfo.windwardMarkBearing) > 90 ? 'port' : 'starboard')
      : 'starboard';

    // Start line analysis
    let startLineAnalysis = {
      favored: 'neutral' as 'left' | 'right' | 'neutral',
      advantage: 0,
      currentBias: 0
    };

    if (courseInfo && showStartLineAnalysis) {
      const windRelativeToStart = currentWind.direction - courseInfo.startLineBearing;
      const bias = windRelativeToStart % 180;
      
      if (Math.abs(bias) > 5) {
        startLineAnalysis = {
          favored: bias > 0 ? 'right' : 'left',
          advantage: Math.abs(bias),
          currentBias: bias
        };
      }
    }

    return {
      laylineAngle,
      crossingAngle,
      favoredTack,
      windShiftPrediction: {
        nextShift,
        confidence,
        timeToShift
      },
      startLineAnalysis
    };
  };

  const tacticalData = calculateTacticalData();

  const windArrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${windDirectionAnimation.value}deg` }],
    };
  });

  const getShiftTypeIcon = (shift: WindShift | null) => {
    if (!shift) return <Wind color={darkSkyColors.textMuted} size={20} />;
    
    switch (shift.type) {
      case 'lift':
        return <TrendingUp color={darkSkyColors.racingIdeal} size={20} />;
      case 'header':
        return <TrendingDown color={darkSkyColors.racingPoor} size={20} />;
      case 'veer':
        return <RotateCw color={darkSkyColors.windModerate} size={20} />;
      case 'back':
        return <RotateCw color={darkSkyColors.windModerate} size={20} style={{ transform: [{ scaleX: -1 }] }} />;
      default:
        return <Wind color={darkSkyColors.textMuted} size={20} />;
    }
  };

  const formatDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  return (
    <Animated.View style={styles.container} entering={FadeInDown.delay(400)}>
      <Text style={styles.title}>Tactical Wind Analysis</Text>
      
      {/* Current Wind Display */}
      <View style={styles.currentWindSection}>
        <View style={styles.windCompass}>
          <Animated.View style={windArrowStyle}>
            <ArrowUp color={darkSkyColors.accent} size={32} strokeWidth={3} />
          </Animated.View>
        </View>
        
        <View style={styles.windDetails}>
          <Text style={styles.windSpeed}>{currentWind.speed} kts</Text>
          <Text style={styles.windDirection}>
            {currentWind.direction}° ({formatDirection(currentWind.direction)})
          </Text>
        </View>
      </View>

      {/* Layline Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Layline Analysis</Text>
        <View style={styles.laylineGrid}>
          <View style={styles.laylineCard}>
            <Text style={styles.laylineAngle}>
              {currentWind.direction - tacticalData.laylineAngle}°
            </Text>
            <Text style={styles.laylineLabel}>Port Layline</Text>
          </View>
          
          <View style={styles.tacticalIndicator}>
            <Text style={styles.favoredTack}>
              {tacticalData.favoredTack.toUpperCase()}
            </Text>
            <Text style={styles.favoredLabel}>Favored Tack</Text>
          </View>
          
          <View style={styles.laylineCard}>
            <Text style={styles.laylineAngle}>
              {currentWind.direction + tacticalData.laylineAngle}°
            </Text>
            <Text style={styles.laylineLabel}>Starboard Layline</Text>
          </View>
        </View>
      </View>

      {/* Wind Shift Prediction */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shift Prediction</Text>
        <View style={styles.shiftPrediction}>
          <View style={styles.shiftIndicator}>
            {getShiftTypeIcon(tacticalData.windShiftPrediction.nextShift)}
            <Text style={styles.shiftType}>
              {tacticalData.windShiftPrediction.nextShift?.type.toUpperCase() || 'STABLE'}
            </Text>
          </View>
          
          <View style={styles.shiftDetails}>
            <Text style={styles.confidenceText}>
              Confidence: {tacticalData.windShiftPrediction.confidence}%
            </Text>
            <Text style={styles.timingText}>
              Next shift: ~{tacticalData.windShiftPrediction.timeToShift}min
            </Text>
          </View>
        </View>
      </View>

      {/* Start Line Analysis */}
      {showStartLineAnalysis && courseInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Line Analysis</Text>
          <View style={styles.startLineAnalysis}>
            <View style={styles.startLineBias}>
              <Target 
                color={
                  tacticalData.startLineAnalysis.favored === 'left' 
                    ? darkSkyColors.racingIdeal
                    : tacticalData.startLineAnalysis.favored === 'right'
                    ? darkSkyColors.windFresh
                    : darkSkyColors.textMuted
                } 
                size={24} 
              />
              <Text style={styles.favoredEnd}>
                {tacticalData.startLineAnalysis.favored.toUpperCase()} END
              </Text>
            </View>
            
            <View style={styles.biasDetails}>
              <Text style={styles.advantageText}>
                Advantage: {tacticalData.startLineAnalysis.advantage.toFixed(1)}°
              </Text>
              <Text style={styles.biasText}>
                Line bias: {tacticalData.startLineAnalysis.currentBias > 0 ? '+' : ''}
                {tacticalData.startLineAnalysis.currentBias.toFixed(1)}°
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Racing Recommendations */}
      <View style={styles.recommendations}>
        <Text style={styles.recommendationTitle}>Tactical Recommendations</Text>
        <View style={styles.recommendationList}>
          <Text style={styles.recommendationItem}>
            • Start on {tacticalData.favoredTack} tack
          </Text>
          {tacticalData.windShiftPrediction.confidence > 60 && (
            <Text style={styles.recommendationItem}>
              • Expect {tacticalData.windShiftPrediction.nextShift?.type} in ~{tacticalData.windShiftPrediction.timeToShift}min
            </Text>
          )}
          {tacticalData.startLineAnalysis.favored !== 'neutral' && (
            <Text style={styles.recommendationItem}>
              • Favor {tacticalData.startLineAnalysis.favored} end of start line
            </Text>
          )}
          <Text style={styles.recommendationItem}>
            • Laylines: {currentWind.direction - tacticalData.laylineAngle}° / {currentWind.direction + tacticalData.laylineAngle}°
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkSkyColors.cardBackground,
    borderRadius: darkSkySpacing.cardRadius,
    padding: darkSkySpacing.cardPadding,
    marginVertical: darkSkySpacing.cardMargin,
    borderWidth: 1,
    borderColor: darkSkyColors.cardBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: darkSkyColors.textPrimary,
    marginBottom: spacing.md,
  },
  currentWindSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkSkyColors.cardBorder,
  },
  windCompass: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: darkSkyColors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  windDetails: {
    flex: 1,
  },
  windSpeed: {
    ...darkSkyTypography.displaySmall,
    color: darkSkyColors.textPrimary,
  },
  windDirection: {
    fontSize: 14,
    color: darkSkyColors.textSecondary,
    fontFamily: darkSkyTypography.mono.fontFamily,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkSkyColors.textPrimary,
    marginBottom: spacing.sm,
  },
  laylineGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  laylineCard: {
    backgroundColor: darkSkyColors.backgroundTertiary,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  laylineAngle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: darkSkyColors.windFresh,
    fontFamily: darkSkyTypography.mono.fontFamily,
  },
  laylineLabel: {
    fontSize: 11,
    color: darkSkyColors.textMuted,
    marginTop: 2,
  },
  tacticalIndicator: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  favoredTack: {
    fontSize: 16,
    fontWeight: 'bold',
    color: darkSkyColors.racingIdeal,
    letterSpacing: 1,
  },
  favoredLabel: {
    fontSize: 11,
    color: darkSkyColors.textMuted,
    marginTop: 2,
  },
  shiftPrediction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftIndicator: {
    backgroundColor: darkSkyColors.backgroundTertiary,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  shiftType: {
    fontSize: 12,
    fontWeight: '600',
    color: darkSkyColors.textPrimary,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  shiftDetails: {
    flex: 1,
  },
  confidenceText: {
    fontSize: 14,
    color: darkSkyColors.textSecondary,
    marginBottom: 2,
  },
  timingText: {
    fontSize: 12,
    color: darkSkyColors.textMuted,
  },
  startLineAnalysis: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startLineBias: {
    backgroundColor: darkSkyColors.backgroundTertiary,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  favoredEnd: {
    fontSize: 12,
    fontWeight: '600',
    color: darkSkyColors.textPrimary,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  biasDetails: {
    flex: 1,
  },
  advantageText: {
    fontSize: 14,
    color: darkSkyColors.textSecondary,
    marginBottom: 2,
  },
  biasText: {
    fontSize: 12,
    color: darkSkyColors.textMuted,
  },
  recommendations: {
    backgroundColor: darkSkyColors.backgroundTertiary,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkSkyColors.textPrimary,
    marginBottom: spacing.xs,
  },
  recommendationList: {
    paddingLeft: spacing.xs,
  },
  recommendationItem: {
    fontSize: 12,
    color: darkSkyColors.textSecondary,
    marginBottom: 3,
    lineHeight: 16,
  },
});