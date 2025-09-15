import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  FadeInDown, 
  SlideInRight, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withSequence 
} from '../../utils/reanimatedWrapper';
import { 
  Wind, 
  Navigation, 
  TrendingUp, 
  TrendingDown, 
  Waves,
  Clock,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  CheckCircle
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { 
  darkSkyColors, 
  darkSkyTypography, 
  darkSkySpacing,
  racingConditionUtils 
} from '../../constants/darkSkyTheme';

const { width } = Dimensions.get('window');

interface WindData {
  speed: number;
  direction: number;
  gust: number;
  trend: 'increasing' | 'decreasing' | 'steady';
}

interface MarineData {
  waveHeight: number;
  waveDirection: number;
  currentSpeed: number;
  currentDirection: number;
  visibility: number;
}

interface RaceContext {
  timeToStart?: number; // minutes
  startLineBearing?: number;
  courseLength?: number; // nautical miles
  raceActive: boolean;
}

interface RacingDashboardProps {
  currentWind: WindData;
  marineConditions: MarineData;
  raceContext?: RaceContext;
  onTacticalView?: () => void;
  onDetailedView?: () => void;
  showPremiumFeatures?: boolean;
}

export const RacingDashboard: React.FC<RacingDashboardProps> = ({
  currentWind,
  marineConditions,
  raceContext,
  onTacticalView,
  onDetailedView,
  showPremiumFeatures = false
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'wind' | 'wave' | 'current'>('wind');
  
  // Animation values
  const pulseValue = useSharedValue(1);
  const windArrowRotation = useSharedValue(currentWind.direction);

  // Assess racing conditions
  const windAssessment = useMemo(() => 
    racingConditionUtils.assessWindConditions(
      currentWind.speed, 
      currentWind.direction, 
      currentWind.gust - currentWind.speed
    ), [currentWind]
  );

  const startLineAssessment = useMemo(() => 
    raceContext?.startLineBearing ? 
      racingConditionUtils.assessStartLine(currentWind.direction, raceContext.startLineBearing) :
      null, 
    [currentWind.direction, raceContext?.startLineBearing]
  );

  // Animate wind arrow rotation
  React.useEffect(() => {
    windArrowRotation.value = withSpring(currentWind.direction, {
      damping: 15,
      stiffness: 100
    });
  }, [currentWind.direction]);

  // Pulse animation for critical conditions
  React.useEffect(() => {
    if (windAssessment.condition === 'dangerous' || windAssessment.condition === 'poor') {
      pulseValue.value = withRepeat(
        withSequence(
          withSpring(1.1),
          withSpring(1)
        ),
        -1,
        false
      );
    } else {
      pulseValue.value = withSpring(1);
    }
  }, [windAssessment.condition]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }]
  }));

  const windArrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${windArrowRotation.value}deg` }]
  }));

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp color={darkSkyColors.windShiftComing} size={16} />;
      case 'decreasing':
        return <TrendingDown color={darkSkyColors.accent} size={16} />;
      default:
        return <Minus color={darkSkyColors.textTertiary} size={16} />;
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'optimal':
        return <CheckCircle color={darkSkyColors.windOptimal} size={20} />;
      case 'dangerous':
      case 'poor':
        return <AlertTriangle color={darkSkyColors.windDangerous} size={20} />;
      default:
        return <Wind color={darkSkyColors.accent} size={20} />;
    }
  };

  const formatWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  return (
    <View style={styles.container}>
      {/* Header with racing status */}
      {raceContext && (
        <Animated.View style={styles.raceHeader} entering={FadeInDown.delay(100)}>
          <View style={styles.raceStatus}>
            <Clock color={darkSkyColors.accent} size={16} />
            <Text style={styles.raceStatusText}>
              {raceContext.raceActive ? 'RACE ACTIVE' : 
               raceContext.timeToStart ? `Start in ${raceContext.timeToStart}min` : 'Pre-Race'}
            </Text>
          </View>
          {startLineAssessment && (
            <View style={[styles.startLineBias, { backgroundColor: startLineAssessment.color + '20' }]}>
              <Text style={[styles.startLineBiasText, { color: startLineAssessment.color }]}>
                {startLineAssessment.favoredEnd.toUpperCase()} FAVORED
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Main conditions display - Dark Sky inspired */}
      <Animated.View style={styles.mainDisplay} entering={FadeInDown.delay(200)}>
        <View style={styles.primaryMetric}>
          <Animated.View style={[styles.conditionIndicator, pulseStyle]}>
            {getConditionIcon(windAssessment.condition)}
          </Animated.View>
          
          <View style={styles.windSpeed}>
            <Text style={[styles.primaryValue, { color: windAssessment.color }]}>
              {Math.round(currentWind.speed)}
            </Text>
            <Text style={styles.primaryUnit}>kts</Text>
          </View>
          
          <View style={styles.windDirection}>
            <Animated.View style={[styles.windArrow, windArrowStyle]}>
              <ArrowUp color={windAssessment.color} size={24} />
            </Animated.View>
            <Text style={styles.directionText}>
              {formatWindDirection(currentWind.direction)}
            </Text>
            <Text style={styles.directionDegrees}>
              {Math.round(currentWind.direction)}°
            </Text>
          </View>
        </View>

        <View style={styles.secondaryMetrics}>
          <View style={styles.gustInfo}>
            <Text style={styles.gustLabel}>Gusts</Text>
            <Text style={[styles.gustValue, { 
              color: currentWind.gust > currentWind.speed + 5 ? 
                darkSkyColors.warning : darkSkyColors.textSecondary 
            }]}>
              {Math.round(currentWind.gust)} kts
            </Text>
          </View>
          
          <View style={styles.trendInfo}>
            {getTrendIcon(currentWind.trend)}
            <Text style={styles.trendText}>
              {currentWind.trend === 'steady' ? 'Steady' : 
               currentWind.trend === 'increasing' ? 'Building' : 'Easing'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Condition assessment */}
      <Animated.View style={styles.assessmentCard} entering={SlideInRight.delay(300)}>
        <Text style={[styles.assessmentTitle, { color: windAssessment.color }]}>
          {windAssessment.description}
        </Text>
        <Text style={styles.tacticalAdvice}>
          {windAssessment.tacticalAdvice}
        </Text>
      </Animated.View>

      {/* Marine conditions summary */}
      <Animated.View style={styles.marineConditions} entering={FadeInDown.delay(400)}>
        <TouchableOpacity 
          style={[styles.marineMetric, selectedMetric === 'wave' && styles.marineMetricSelected]}
          onPress={() => setSelectedMetric('wave')}
        >
          <Waves color={darkSkyColors.waveModerate} size={18} />
          <Text style={styles.marineValue}>{marineConditions.waveHeight}m</Text>
          <Text style={styles.marineLabel}>Waves</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.marineMetric, selectedMetric === 'current' && styles.marineMetricSelected]}
          onPress={() => setSelectedMetric('current')}
        >
          <Navigation color={darkSkyColors.accent} size={18} />
          <Text style={styles.marineValue}>{marineConditions.currentSpeed.toFixed(1)} kts</Text>
          <Text style={styles.marineLabel}>Current</Text>
        </TouchableOpacity>

        <View style={styles.marineMetric}>
          <View style={styles.visibilityDot} />
          <Text style={styles.marineValue}>{marineConditions.visibility} km</Text>
          <Text style={styles.marineLabel}>Visibility</Text>
        </View>
      </Animated.View>

      {/* Action buttons */}
      <Animated.View style={styles.actionButtons} entering={FadeInDown.delay(500)}>
        {showPremiumFeatures && (
          <TouchableOpacity style={styles.tacticalButton} onPress={onTacticalView}>
            <Target color={darkSkyColors.startLineFavored} size={16} />
            <Text style={styles.buttonText}>Tactical View</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.detailButton} onPress={onDetailedView}>
          <TrendingUp color={darkSkyColors.accent} size={16} />
          <Text style={styles.buttonText}>Detailed Forecast</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkSkyColors.cardBackground,
    borderRadius: darkSkySpacing.cardRadius,
    padding: darkSkySpacing.cardPadding,
    margin: darkSkySpacing.cardMargin,
  },
  
  // Race header
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: darkSkySpacing.lg,
    paddingBottom: darkSkySpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkSkyColors.cardBorder,
  },
  raceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  raceStatusText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textSecondary,
    marginLeft: darkSkySpacing.xs,
    fontWeight: '600',
    letterSpacing: 1,
  },
  startLineBias: {
    paddingHorizontal: darkSkySpacing.sm,
    paddingVertical: darkSkySpacing.xs,
    borderRadius: darkSkySpacing.sm,
  },
  startLineBiasText: {
    ...darkSkyTypography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Main display
  mainDisplay: {
    alignItems: 'center',
    marginBottom: darkSkySpacing.lg,
  },
  primaryMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: darkSkySpacing.md,
  },
  conditionIndicator: {
    padding: darkSkySpacing.sm,
  },
  windSpeed: {
    alignItems: 'center',
    flex: 1,
  },
  primaryValue: {
    ...darkSkyTypography.displayLarge,
    fontWeight: '200',
    lineHeight: 48,
  },
  primaryUnit: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.textTertiary,
    marginTop: -8,
  },
  windDirection: {
    alignItems: 'center',
    padding: darkSkySpacing.sm,
  },
  windArrow: {
    marginBottom: darkSkySpacing.xs,
  },
  directionText: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
  },
  directionDegrees: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textTertiary,
    marginTop: 2,
  },

  // Secondary metrics
  secondaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  gustInfo: {
    alignItems: 'center',
  },
  gustLabel: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textTertiary,
  },
  gustValue: {
    ...darkSkyTypography.bodyLarge,
    fontWeight: '600',
    marginTop: 2,
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    ...darkSkyTypography.bodySmall,
    color: darkSkyColors.textSecondary,
    marginLeft: darkSkySpacing.xs,
  },

  // Assessment
  assessmentCard: {
    backgroundColor: darkSkyColors.backgroundTertiary,
    borderRadius: darkSkySpacing.md,
    padding: darkSkySpacing.lg,
    marginBottom: darkSkySpacing.lg,
  },
  assessmentTitle: {
    ...darkSkyTypography.bodyLarge,
    fontWeight: '600',
    marginBottom: darkSkySpacing.xs,
  },
  tacticalAdvice: {
    ...darkSkyTypography.bodySmall,
    color: darkSkyColors.textSecondary,
    lineHeight: 18,
  },

  // Marine conditions
  marineConditions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: darkSkySpacing.lg,
  },
  marineMetric: {
    alignItems: 'center',
    flex: 1,
    padding: darkSkySpacing.sm,
    borderRadius: darkSkySpacing.sm,
  },
  marineMetricSelected: {
    backgroundColor: darkSkyColors.backgroundTertiary,
  },
  marineValue: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
    marginTop: darkSkySpacing.xs,
  },
  marineLabel: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textTertiary,
    marginTop: 2,
  },
  visibilityDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: darkSkyColors.accent,
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tacticalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkSkyColors.startLineFavored + '20',
    paddingHorizontal: darkSkySpacing.lg,
    paddingVertical: darkSkySpacing.sm,
    borderRadius: darkSkySpacing.sm,
    flex: 1,
    marginRight: darkSkySpacing.sm,
    justifyContent: 'center',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkSkyColors.accent + '20',
    paddingHorizontal: darkSkySpacing.lg,
    paddingVertical: darkSkySpacing.sm,
    borderRadius: darkSkySpacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  buttonText: {
    ...darkSkyTypography.bodySmall,
    color: darkSkyColors.textPrimary,
    marginLeft: darkSkySpacing.xs,
    fontWeight: '600',
  },
});