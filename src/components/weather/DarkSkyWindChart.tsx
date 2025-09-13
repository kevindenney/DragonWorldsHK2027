import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { ArrowUp, TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { darkSkyColors, darkSkyTypography, darkSkySpacing } from '../../constants/darkSkyTheme';

const { width } = Dimensions.get('window');

interface WindData {
  time: string;
  speed: number;
  direction: number;
  gusts?: number;
  trend?: 'increasing' | 'decreasing' | 'steady';
}

interface DarkSkyWindChartProps {
  windData: WindData[];
  currentWind: {
    speed: number;
    direction: number;
    gusts?: number;
  };
  showRacingAnalysis?: boolean;
}

export const DarkSkyWindChart: React.FC<DarkSkyWindChartProps> = ({
  windData,
  currentWind,
  showRacingAnalysis = false
}) => {
  const animatedRotation = useSharedValue(0);
  const animatedPulse = useSharedValue(1);
  const chartWidth = width - (spacing.lg * 2);
  const maxWindSpeed = Math.max(...windData.map(w => w.speed), currentWind.speed);

  useEffect(() => {
    animatedRotation.value = withTiming(currentWind.direction, { duration: 800 });
    
    if (currentWind.gusts && currentWind.gusts > currentWind.speed + 3) {
      animatedPulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    }
  }, [currentWind]);

  const windArrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${animatedRotation.value}deg` }],
    };
  });

  const gustIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: animatedPulse.value }],
      opacity: interpolate(animatedPulse.value, [1, 1.2], [0.7, 1]),
    };
  });

  const getWindStrengthColor = (speed: number): string => {
    if (speed < 5) return darkSkyColors.windCalm;
    if (speed < 10) return darkSkyColors.windLight;
    if (speed < 15) return darkSkyColors.windModerate;
    if (speed < 20) return darkSkyColors.windFresh;
    if (speed < 25) return darkSkyColors.windStrong;
    return darkSkyColors.windGale;
  };

  const getBeaufortDescription = (speed: number): string => {
    if (speed < 1) return 'Calm';
    if (speed < 4) return 'Light air';
    if (speed < 7) return 'Light breeze';
    if (speed < 11) return 'Gentle breeze';
    if (speed < 16) return 'Moderate breeze';
    if (speed < 22) return 'Fresh breeze';
    if (speed < 28) return 'Strong breeze';
    return 'Near gale';
  };

  const getRacingCondition = (speed: number): { condition: string; color: string } => {
    if (speed < 6) return { condition: 'LIGHT', color: colors.textMuted };
    if (speed < 12) return { condition: 'MODERATE', color: colors.success };
    if (speed < 18) return { condition: 'FRESH', color: colors.primary };
    if (speed < 25) return { condition: 'STRONG', color: colors.warning };
    return { condition: 'EXTREME', color: colors.error };
  };

  const renderWindBars = () => {
    return windData.slice(0, 12).map((wind, index) => {
      const barHeight = (wind.speed / maxWindSpeed) * 60;
      const barColor = getWindStrengthColor(wind.speed);
      
      return (
        <View key={wind.time} style={styles.windBar}>
          <Animated.View 
            style={[
              styles.windBarFill,
              { 
                height: barHeight,
                backgroundColor: barColor,
              }
            ]}
          />
          <Text style={styles.windBarTime}>
            {new Date(wind.time).getHours()}:00
          </Text>
          <Text style={styles.windBarSpeed}>{wind.speed}</Text>
        </View>
      );
    });
  };

  const racingCondition = getRacingCondition(currentWind.speed);

  return (
    <View style={styles.container}>
      {/* Current Wind Display */}
      <View style={styles.currentWindSection}>
        <View style={styles.windCompass}>
          <Animated.View style={[styles.windArrow, windArrowStyle]}>
            <ArrowUp color={getWindStrengthColor(currentWind.speed)} size={32} />
          </Animated.View>
          {currentWind.gusts && currentWind.gusts > currentWind.speed + 2 && (
            <Animated.View style={[styles.gustIndicator, gustIndicatorStyle]}>
              <View style={styles.gustRing} />
            </Animated.View>
          )}
        </View>
        
        <View style={styles.windDetails}>
          <Text style={styles.windSpeed}>
            {currentWind.speed}<Text style={styles.windUnit}>kts</Text>
          </Text>
          <Text style={styles.windDirection}>{currentWind.direction}°</Text>
          <Text style={styles.beaufortScale}>
            {getBeaufortDescription(currentWind.speed)}
          </Text>
          {currentWind.gusts && (
            <Text style={styles.gustSpeed}>
              Gusts {currentWind.gusts} kts
            </Text>
          )}
        </View>

        {showRacingAnalysis && (
          <View style={styles.racingAnalysis}>
            <Text style={[styles.racingCondition, { color: racingCondition.color }]}>
              {racingCondition.condition}
            </Text>
            <Text style={styles.racingAdvice}>
              {currentWind.speed > 15 ? 'Consider reefing' : 'Full sail conditions'}
            </Text>
          </View>
        )}
      </View>

      {/* Wind Trend Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>12-Hour Wind Forecast</Text>
        <View style={styles.windChart}>
          {renderWindBars()}
        </View>
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabel}>0 kts</Text>
          <Text style={styles.chartLabel}>{Math.round(maxWindSpeed)} kts</Text>
        </View>
      </View>

      {/* Wind Analysis */}
      {showRacingAnalysis && (
        <View style={styles.analysisSection}>
          <Text style={styles.analysisTitle}>Racing Analysis</Text>
          <View style={styles.analysisGrid}>
            <View style={styles.analysisCard}>
              <Text style={styles.analysisValue}>
                {Math.abs(windData[1]?.speed - currentWind.speed).toFixed(1)}
              </Text>
              <Text style={styles.analysisLabel}>Change (1hr)</Text>
              {windData[1]?.speed > currentWind.speed ? (
                <TrendingUp color={colors.success} size={16} />
              ) : (
                <TrendingDown color={colors.error} size={16} />
              )}
            </View>
            <View style={styles.analysisCard}>
              <Text style={styles.analysisValue}>
                {windData.filter(w => Math.abs(w.direction - currentWind.direction) > 15).length}
              </Text>
              <Text style={styles.analysisLabel}>Shifts (12hr)</Text>
            </View>
            <View style={styles.analysisCard}>
              <Text style={styles.analysisValue}>
                {windData.filter(w => w.gusts && w.gusts > w.speed + 5).length}
              </Text>
              <Text style={styles.analysisLabel}>Gust Events</Text>
            </View>
          </View>
        </View>
      )}
    </View>
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
  currentWindSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  windCompass: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  windArrow: {
    zIndex: 2,
  },
  gustIndicator: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gustRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  windDetails: {
    flex: 1,
  },
  windSpeed: {
    ...darkSkyTypography.displayMedium,
    color: darkSkyColors.textPrimary,
    fontFamily: darkSkyTypography.mono.fontFamily,
  },
  windUnit: {
    fontSize: 18,
    color: darkSkyColors.textMuted,
    fontWeight: 'normal',
  },
  windDirection: {
    fontSize: 16,
    color: darkSkyColors.textSecondary,
    fontFamily: darkSkyTypography.mono.fontFamily,
  },
  beaufortScale: {
    fontSize: 14,
    color: darkSkyColors.accent,
    marginTop: 4,
  },
  gustSpeed: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 2,
  },
  racingAnalysis: {
    alignItems: 'flex-end',
  },
  racingCondition: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  racingAdvice: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  chartSection: {
    marginVertical: spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  windChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    marginBottom: spacing.xs,
  },
  windBar: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 1,
  },
  windBarFill: {
    width: '80%',
    borderRadius: 2,
    marginBottom: 4,
  },
  windBarTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  windBarSpeed: {
    fontSize: 9,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.mono,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  analysisSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  analysisGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analysisCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: typography.fontFamily.mono,
  },
  analysisLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});