import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeInRight } from '../../utils/reanimatedWrapper';
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  CloudSnow, 
  Zap,
  Wind,
  ArrowUp
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface HourlyWeatherData {
  time: string;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  windGusts?: number;
  conditions: string;
  precipitationChance: number;
  precipitationType?: 'rain' | 'snow' | 'sleet';
  visibility: number;
  pressure: number;
}

interface DarkSkyHourlyChartProps {
  hourlyData: HourlyWeatherData[];
  showRacingFocus?: boolean;
  maxHours?: number;
}

export const DarkSkyHourlyChart: React.FC<DarkSkyHourlyChartProps> = ({
  hourlyData,
  showRacingFocus = false,
  maxHours = 12
}) => {
  const chartData = hourlyData.slice(0, maxHours);
  const maxTemp = Math.max(...chartData.map(d => d.temperature));
  const minTemp = Math.min(...chartData.map(d => d.temperature));
  const maxWind = Math.max(...chartData.map(d => d.windSpeed));
  const tempRange = maxTemp - minTemp || 1;
  
  const getWeatherIcon = (conditions: string, precipChance: number) => {
    const iconSize = 20;
    const iconColor = colors.primary;
    
    if (precipChance > 60) {
      if (conditions.toLowerCase().includes('snow')) {
        return <CloudSnow color={iconColor} size={iconSize} />;
      } else if (conditions.toLowerCase().includes('storm')) {
        return <Zap color={colors.warning} size={iconSize} />;
      } else {
        return <CloudRain color={iconColor} size={iconSize} />;
      }
    } else if (conditions.toLowerCase().includes('cloud')) {
      return <Cloud color={iconColor} size={iconSize} />;
    } else {
      return <Sun color={colors.warning} size={iconSize} />;
    }
  };

  const getWindColor = (speed: number): string => {
    if (speed < 5) return colors.textMuted;
    if (speed < 10) return colors.success;
    if (speed < 15) return colors.warning;
    if (speed < 20) return colors.primary;
    return colors.error;
  };

  const getRacingWindow = (data: HourlyWeatherData): { 
    suitable: boolean; 
    reason?: string;
    color: string;
  } => {
    if (data.precipitationChance > 40) {
      return { suitable: false, reason: 'Rain risk', color: colors.error };
    }
    if (data.windSpeed < 3) {
      return { suitable: false, reason: 'Light winds', color: colors.textMuted };
    }
    if (data.windSpeed > 25) {
      return { suitable: false, reason: 'Strong winds', color: colors.error };
    }
    if (data.visibility < 5) {
      return { suitable: false, reason: 'Poor visibility', color: colors.warning };
    }
    return { suitable: true, color: colors.success };
  };

  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const hours = date.getHours();
    const isNow = Math.abs(date.getTime() - Date.now()) < 30 * 60 * 1000; // Within 30 minutes
    
    if (isNow) return 'Now';
    if (hours === 0) return '12 AM';
    if (hours === 12) return '12 PM';
    if (hours > 12) return `${hours - 12} PM`;
    return `${hours} AM`;
  };

  const renderTemperatureLine = () => {
    return (
      <View style={styles.temperaturePlaceholder}>
        <Text style={styles.temperatureLineText}>Temperature Trend</Text>
        <View style={styles.temperatureDots}>
          {chartData.map((data, index) => (
            <View 
              key={index} 
              style={[
                styles.temperatureDot,
                { backgroundColor: colors.primary }
              ]} 
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {showRacingFocus ? '12-Hour Racing Window' : 'Hourly Forecast'}
      </Text>
      
      {/* Temperature trend line */}
      <View style={styles.temperatureSection}>
        <Text style={styles.sectionLabel}>Temperature Trend</Text>
        <View style={styles.temperatureContainer}>
          {renderTemperatureLine()}
          <View style={styles.temperatureLabels}>
            <Text style={styles.tempLabel}>{Math.round(maxTemp)}°</Text>
            <Text style={styles.tempLabel}>{Math.round(minTemp)}°</Text>
          </View>
        </View>
      </View>

      {/* Hourly cards scroll */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.hourlyScroll}
        contentContainerStyle={styles.hourlyScrollContent}
      >
        {chartData.map((data, index) => {
          const racingWindow = showRacingFocus ? getRacingWindow(data) : null;
          
          return (
            <Animated.View
              key={data.time}
              style={[
                styles.hourlyCard,
                racingWindow && !racingWindow.suitable && styles.unsuitableCard,
                racingWindow && racingWindow.suitable && styles.suitableCard
              ]}
            >
              {/* Time */}
              <Text style={styles.hourlyTime}>
                {formatTime(data.time)}
              </Text>

              {/* Weather icon */}
              <View style={styles.hourlyIcon}>
                {getWeatherIcon(data.conditions, data.precipitationChance)}
              </View>

              {/* Temperature */}
              <Text style={styles.hourlyTemp}>
                {Math.round(data.temperature)}°
              </Text>

              {/* Wind information */}
              <View style={styles.windInfo}>
                <View 
                  style={[
                    styles.windArrow, 
                    { transform: [{ rotate: `${data.windDirection}deg` }] }
                  ]}
                >
                  <ArrowUp color={getWindColor(data.windSpeed)} size={12} />
                </View>
                <Text style={[styles.windSpeed, { color: getWindColor(data.windSpeed) }]}>
                  {Math.round(data.windSpeed)}
                </Text>
              </View>

              {/* Racing-specific indicators */}
              {showRacingFocus && (
                <View style={styles.racingIndicators}>
                  {data.precipitationChance > 20 && (
                    <View style={styles.precipChance}>
                      <Text style={styles.precipText}>{data.precipitationChance}%</Text>
                    </View>
                  )}
                  
                  {racingWindow && (
                    <View style={[styles.racingDot, { backgroundColor: racingWindow.color }]} />
                  )}
                </View>
              )}

              {/* Wind gusts indicator */}
              {data.windGusts && data.windGusts > data.windSpeed + 3 && (
                <View style={styles.gustIndicator}>
                  <Text style={styles.gustText}>G{Math.round(data.windGusts)}</Text>
                </View>
              )}

              {/* Pressure trend (optional) */}
              {!showRacingFocus && (
                <Text style={styles.pressureText}>
                  {Math.round(data.pressure)}
                </Text>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Wind speed legend */}
      <View style={styles.windLegend}>
        <Text style={styles.legendTitle}>Wind Speed (kts)</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
            <Text style={styles.legendText}>0-5</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>5-10</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>10-15</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>15-20</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>20+</Text>
          </View>
        </View>
      </View>

      {/* Racing analysis summary */}
      {showRacingFocus && (
        <View style={styles.racingAnalysis}>
          <Text style={styles.analysisTitle}>Racing Window Analysis</Text>
          <View style={styles.analysisStats}>
            <View style={styles.analysisStat}>
              <Text style={styles.statValue}>
                {chartData.filter(d => getRacingWindow(d).suitable).length}
              </Text>
              <Text style={styles.statLabel}>Suitable Hours</Text>
            </View>
            <View style={styles.analysisStat}>
              <Text style={styles.statValue}>
                {chartData.filter(d => d.precipitationChance > 30).length}
              </Text>
              <Text style={styles.statLabel}>Rain Risk Hours</Text>
            </View>
            <View style={styles.analysisStat}>
              <Text style={styles.statValue}>
                {Math.round(chartData.reduce((sum, d) => sum + d.windSpeed, 0) / chartData.length)}
              </Text>
              <Text style={styles.statLabel}>Avg Wind (kts)</Text>
            </View>
          </View>
        </View>
      )}
    </View>
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
  temperatureSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperaturePlaceholder: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  temperatureLineText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  temperatureDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  temperatureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  temperatureLabels: {
    marginLeft: spacing.sm,
    justifyContent: 'space-between',
    height: 40,
  },
  tempLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.mono,
  },
  hourlyScroll: {
    marginVertical: spacing.sm,
  },
  hourlyScrollContent: {
    paddingRight: spacing.sm,
  },
  hourlyCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.sm,
    marginRight: spacing.sm,
    width: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  suitableCard: {
    borderColor: colors.success,
    backgroundColor: colors.backgroundLight,
  },
  unsuitableCard: {
    borderColor: colors.error,
    backgroundColor: colors.backgroundDark,
  },
  hourlyTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hourlyIcon: {
    marginVertical: spacing.xs,
    height: 24,
    justifyContent: 'center',
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: typography.fontFamily.mono,
    marginBottom: spacing.xs,
  },
  windInfo: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  windArrow: {
    marginBottom: 2,
  },
  windSpeed: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.fontFamily.mono,
  },
  racingIndicators: {
    alignItems: 'center',
    minHeight: 20,
  },
  precipChance: {
    backgroundColor: colors.info,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 2,
  },
  precipText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  racingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gustIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  gustText: {
    fontSize: 8,
    color: colors.white,
    fontWeight: 'bold',
  },
  pressureText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: typography.fontFamily.mono,
  },
  windLegend: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  racingAnalysis: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  analysisStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analysisStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: typography.fontFamily.mono,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});