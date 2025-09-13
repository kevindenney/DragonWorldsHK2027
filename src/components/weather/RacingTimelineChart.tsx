import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  FadeInDown, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor
} from 'react-native-reanimated';
import { 
  Clock, 
  Wind, 
  Sun, 
  CloudRain,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  Flag
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { 
  darkSkyColors, 
  darkSkyTypography, 
  darkSkySpacing,
  darkSkyCharts,
  racingConditionUtils 
} from '../../constants/darkSkyTheme';

const { width } = Dimensions.get('window');
const TIMELINE_HEIGHT = 300;
const HOUR_WIDTH = 60;

interface TimelineHour {
  time: string;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  precipitationChance: number;
  visibility: number;
  temperature: number;
  racingScore: number; // 0-100, calculated racing suitability
  isOptimalWindow: boolean;
  raceEvents?: RaceEvent[];
}

interface RaceEvent {
  type: 'start' | 'mark_rounding' | 'finish' | 'warning_signal' | 'postponement';
  time: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

interface RacingTimelineChartProps {
  timelineData: TimelineHour[];
  raceStartTime?: string;
  raceEndTime?: string;
  showOptimalWindows?: boolean;
  onHourSelect?: (hour: TimelineHour) => void;
  selectedTimeRange?: { start: string; end: string };
  showRaceEvents?: boolean;
}

export const RacingTimelineChart: React.FC<RacingTimelineChartProps> = ({
  timelineData,
  raceStartTime,
  raceEndTime,
  showOptimalWindows = true,
  onHourSelect,
  selectedTimeRange,
  showRaceEvents = true
}) => {
  const [selectedHour, setSelectedHour] = useState<TimelineHour | null>(null);
  const [viewMode, setViewMode] = useState<'racing' | 'weather'>('racing');
  
  const scrollRef = React.useRef<ScrollView>(null);
  const animatedValue = useSharedValue(0);

  // Find optimal racing windows
  const optimalWindows = useMemo(() => {
    const windows: { start: number; end: number; score: number }[] = [];
    let currentWindow: { start: number; end: number; scores: number[] } | null = null;

    timelineData.forEach((hour, index) => {
      if (hour.isOptimalWindow) {
        if (!currentWindow) {
          currentWindow = { start: index, end: index, scores: [hour.racingScore] };
        } else {
          currentWindow.end = index;
          currentWindow.scores.push(hour.racingScore);
        }
      } else if (currentWindow) {
        // End of window
        const avgScore = currentWindow.scores.reduce((sum, score) => sum + score, 0) / currentWindow.scores.length;
        windows.push({
          start: currentWindow.start,
          end: currentWindow.end,
          score: avgScore
        });
        currentWindow = null;
      }
    });

    // Handle window that extends to end
    if (currentWindow) {
      const avgScore = currentWindow.scores.reduce((sum, score) => sum + score, 0) / currentWindow.scores.length;
      windows.push({
        start: currentWindow.start,
        end: currentWindow.end,
        score: avgScore
      });
    }

    return windows;
  }, [timelineData]);

  // Get race timeline markers
  const raceMarkers = useMemo(() => {
    const markers: { time: string; type: string; position: number }[] = [];
    
    if (raceStartTime) {
      const startIndex = timelineData.findIndex(h => h.time === raceStartTime);
      if (startIndex >= 0) {
        markers.push({ time: raceStartTime, type: 'start', position: startIndex });
      }
    }
    
    if (raceEndTime) {
      const endIndex = timelineData.findIndex(h => h.time === raceEndTime);
      if (endIndex >= 0) {
        markers.push({ time: raceEndTime, type: 'finish', position: endIndex });
      }
    }
    
    return markers;
  }, [timelineData, raceStartTime, raceEndTime]);

  React.useEffect(() => {
    animatedValue.value = withSpring(viewMode === 'racing' ? 1 : 0);
  }, [viewMode]);

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      animatedValue.value,
      [0, 1],
      [darkSkyColors.cardBackground, darkSkyColors.backgroundTertiary]
    )
  }));

  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const hours = date.getHours();
    const isNow = Math.abs(date.getTime() - Date.now()) < 30 * 60 * 1000;
    
    if (isNow) return 'Now';
    if (hours === 0) return '12A';
    if (hours === 12) return '12P';
    if (hours > 12) return `${hours - 12}P`;
    return `${hours}A`;
  };

  const getWindConditionColor = (windSpeed: number, gustFactor: number): string => {
    const assessment = racingConditionUtils.assessWindConditions(windSpeed, 0, gustFactor);
    return assessment.color;
  };

  const getRacingScoreColor = (score: number): string => {
    if (score >= 80) return darkSkyColors.racingIdeal;
    if (score >= 60) return darkSkyColors.racingGood;
    if (score >= 40) return darkSkyColors.racingChallenging;
    if (score >= 20) return darkSkyColors.racingPoor;
    return darkSkyColors.racingDangerous;
  };

  const getWeatherIcon = (precipChance: number, hour: TimelineHour) => {
    if (precipChance > 40) {
      return <CloudRain color={darkSkyColors.rain} size={16} />;
    }
    return <Sun color={darkSkyColors.clearSky} size={16} />;
  };

  const getTrendIcon = (current: number, next: number) => {
    const diff = next - current;
    if (diff > 2) return <TrendingUp color={darkSkyColors.windShiftComing} size={12} />;
    if (diff < -2) return <ArrowDown color={darkSkyColors.accent} size={12} />;
    return <Minus color={darkSkyColors.textMuted} size={12} />;
  };

  const scrollToRaceStart = () => {
    if (raceStartTime && scrollRef.current) {
      const startIndex = timelineData.findIndex(h => h.time === raceStartTime);
      if (startIndex >= 0) {
        scrollRef.current.scrollTo({ x: startIndex * HOUR_WIDTH, animated: true });
      }
    }
  };

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <View style={styles.titleSection}>
          <Clock color={darkSkyColors.accent} size={20} />
          <Text style={styles.title}>Racing Timeline</Text>
          <TouchableOpacity 
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'racing' ? 'weather' : 'racing')}
          >
            <Text style={styles.viewToggleText}>
              {viewMode === 'racing' ? 'Weather' : 'Racing'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {raceStartTime && (
            <TouchableOpacity style={styles.quickAction} onPress={scrollToRaceStart}>
              <Play color={darkSkyColors.raceActive} size={14} />
              <Text style={styles.quickActionText}>Race Start</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.quickAction}>
            <Target color={darkSkyColors.startLineFavored} size={14} />
            <Text style={styles.quickActionText}>
              {optimalWindows.length} Optimal Windows
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Timeline chart */}
      <Animated.View style={styles.chartContainer} entering={FadeInDown.delay(200)}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeline}
          contentContainerStyle={styles.timelineContent}
        >
          {/* Optimal windows background */}
          {showOptimalWindows && optimalWindows.map((window, index) => (
            <View
              key={index}
              style={[
                styles.optimalWindow,
                {
                  left: window.start * HOUR_WIDTH,
                  width: (window.end - window.start + 1) * HOUR_WIDTH,
                  backgroundColor: darkSkyColors.racingIdeal + '15'
                }
              ]}
            />
          ))}

          {/* Race markers */}
          {raceMarkers.map((marker, index) => (
            <View
              key={index}
              style={[
                styles.raceMarker,
                { left: marker.position * HOUR_WIDTH + HOUR_WIDTH / 2 - 1 }
              ]}
            >
              <View style={[styles.raceMarkerLine, {
                backgroundColor: marker.type === 'start' ? darkSkyColors.raceActive : darkSkyColors.success
              }]} />
              <View style={[styles.raceMarkerDot, {
                backgroundColor: marker.type === 'start' ? darkSkyColors.raceActive : darkSkyColors.success
              }]}>
                {marker.type === 'start' ? 
                  <Play color={darkSkyColors.textPrimary} size={8} /> : 
                  <Flag color={darkSkyColors.textPrimary} size={8} />
                }
              </View>
            </View>
          ))}

          {/* Hour columns */}
          {timelineData.map((hour, index) => {
            const isSelected = selectedHour?.time === hour.time;
            const nextHour = timelineData[index + 1];
            
            return (
              <TouchableOpacity
                key={hour.time}
                style={[
                  styles.hourColumn,
                  isSelected && styles.hourColumnSelected
                ]}
                onPress={() => {
                  setSelectedHour(hour);
                  onHourSelect?.(hour);
                }}
              >
                <Animated.View entering={SlideInRight.delay(index * 50)}>
                  {/* Time label */}
                  <Text style={styles.timeLabel}>
                    {formatTime(hour.time)}
                  </Text>

                  {/* Weather icon */}
                  <View style={styles.weatherIcon}>
                    {getWeatherIcon(hour.precipitationChance, hour)}
                  </View>

                  {/* Racing score or wind data */}
                  {viewMode === 'racing' ? (
                    <View style={styles.racingData}>
                      <View style={[
                        styles.racingScoreBar,
                        { 
                          height: (hour.racingScore / 100) * 80,
                          backgroundColor: getRacingScoreColor(hour.racingScore)
                        }
                      ]} />
                      <Text style={[styles.scoreText, { color: getRacingScoreColor(hour.racingScore) }]}>
                        {hour.racingScore}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.windData}>
                      <View style={[
                        styles.windBar,
                        { 
                          height: Math.min((hour.windSpeed / 25) * 60, 60),
                          backgroundColor: getWindConditionColor(hour.windSpeed, hour.windGust - hour.windSpeed)
                        }
                      ]} />
                      <Text style={styles.windText}>
                        {Math.round(hour.windSpeed)}
                      </Text>
                      
                      {/* Wind direction arrow */}
                      <View 
                        style={[
                          styles.windArrow,
                          { transform: [{ rotate: `${hour.windDirection}deg` }] }
                        ]}
                      >
                        <ArrowUp color={darkSkyColors.textSecondary} size={10} />
                      </View>
                    </View>
                  )}

                  {/* Trend indicator */}
                  {nextHour && (
                    <View style={styles.trendIndicator}>
                      {viewMode === 'racing' ? 
                        getTrendIcon(hour.racingScore, nextHour.racingScore) :
                        getTrendIcon(hour.windSpeed, nextHour.windSpeed)
                      }
                    </View>
                  )}

                  {/* Precipitation chance */}
                  {hour.precipitationChance > 20 && (
                    <View style={styles.precipChance}>
                      <Text style={styles.precipText}>
                        {hour.precipitationChance}%
                      </Text>
                    </View>
                  )}

                  {/* Gust indicator */}
                  {hour.windGust > hour.windSpeed + 5 && (
                    <View style={styles.gustIndicator}>
                      <Text style={styles.gustText}>
                        G{Math.round(hour.windGust)}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Selected hour details */}
      {selectedHour && (
        <Animated.View style={styles.detailsPanel} entering={FadeInDown.delay(300)}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTime}>
              {new Date(selectedHour.time).toLocaleTimeString('en', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            <View style={[
              styles.detailsScore,
              { backgroundColor: getRacingScoreColor(selectedHour.racingScore) + '20' }
            ]}>
              <Text style={[styles.detailsScoreText, { color: getRacingScoreColor(selectedHour.racingScore) }]}>
                {selectedHour.isOptimalWindow ? 'OPTIMAL' : 'SUBOPTIMAL'}
              </Text>
            </View>
          </View>

          <View style={styles.detailsMetrics}>
            <View style={styles.detailMetric}>
              <Wind color={getWindConditionColor(selectedHour.windSpeed, selectedHour.windGust - selectedHour.windSpeed)} size={16} />
              <Text style={styles.detailMetricValue}>
                {Math.round(selectedHour.windSpeed)} kts
              </Text>
              <Text style={styles.detailMetricLabel}>Wind</Text>
            </View>

            <View style={styles.detailMetric}>
              <ArrowUp 
                color={darkSkyColors.accent} 
                size={16}
                style={{ transform: [{ rotate: `${selectedHour.windDirection}deg` }] }}
              />
              <Text style={styles.detailMetricValue}>
                {Math.round(selectedHour.windDirection)}°
              </Text>
              <Text style={styles.detailMetricLabel}>Direction</Text>
            </View>

            <View style={styles.detailMetric}>
              <CloudRain color={darkSkyColors.rain} size={16} />
              <Text style={styles.detailMetricValue}>
                {selectedHour.precipitationChance}%
              </Text>
              <Text style={styles.detailMetricLabel}>Rain</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Legend */}
      <Animated.View style={styles.legend} entering={FadeInDown.delay(400)}>
        <Text style={styles.legendTitle}>
          {viewMode === 'racing' ? 'Racing Suitability' : 'Wind Speed (kts)'}
        </Text>
        <View style={styles.legendItems}>
          {viewMode === 'racing' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: darkSkyColors.racingIdeal }]} />
                <Text style={styles.legendText}>Optimal (80+)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: darkSkyColors.racingGood }]} />
                <Text style={styles.legendText}>Good (60-80)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: darkSkyColors.racingChallenging }]} />
                <Text style={styles.legendText}>Poor (&lt;40)</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: darkSkyColors.windOptimal }]} />
                <Text style={styles.legendText}>8-15</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: darkSkyColors.windSubOptimal }]} />
                <Text style={styles.legendText}>5-8, 15-20</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: darkSkyColors.windChallenging }]} />
                <Text style={styles.legendText}>20+</Text>
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: darkSkySpacing.cardRadius,
    padding: darkSkySpacing.cardPadding,
    margin: darkSkySpacing.cardMargin,
  },
  
  header: {
    marginBottom: darkSkySpacing.lg,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: darkSkySpacing.sm,
  },
  title: {
    ...darkSkyTypography.bodyLarge,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginLeft: darkSkySpacing.sm,
  },
  viewToggle: {
    backgroundColor: darkSkyColors.accent + '20',
    paddingHorizontal: darkSkySpacing.sm,
    paddingVertical: darkSkySpacing.xs,
    borderRadius: darkSkySpacing.sm,
  },
  viewToggleText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.accent,
    fontWeight: '600',
  },

  quickActions: {
    flexDirection: 'row',
    gap: darkSkySpacing.sm,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkSkyColors.backgroundSecondary,
    paddingHorizontal: darkSkySpacing.sm,
    paddingVertical: darkSkySpacing.xs,
    borderRadius: darkSkySpacing.sm,
  },
  quickActionText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textSecondary,
    marginLeft: darkSkySpacing.xs,
  },

  chartContainer: {
    height: TIMELINE_HEIGHT,
    marginBottom: darkSkySpacing.lg,
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingHorizontal: darkSkySpacing.sm,
  },

  optimalWindow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: darkSkySpacing.xs,
  },

  raceMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    alignItems: 'center',
  },
  raceMarkerLine: {
    width: 2,
    flex: 1,
  },
  raceMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 20,
  },

  hourColumn: {
    width: HOUR_WIDTH,
    alignItems: 'center',
    paddingVertical: darkSkySpacing.sm,
    borderRadius: darkSkySpacing.xs,
  },
  hourColumnSelected: {
    backgroundColor: darkSkyColors.backgroundTertiary,
  },
  
  timeLabel: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textSecondary,
    fontWeight: '600',
    marginBottom: darkSkySpacing.xs,
  },

  weatherIcon: {
    marginBottom: darkSkySpacing.sm,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  racingData: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  racingScoreBar: {
    width: 8,
    borderRadius: 4,
    marginBottom: darkSkySpacing.xs,
  },
  scoreText: {
    ...darkSkyTypography.caption,
    fontSize: 10,
    fontWeight: '600',
  },

  windData: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  windBar: {
    width: 6,
    borderRadius: 3,
    marginBottom: darkSkySpacing.xs,
  },
  windText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  windArrow: {
    marginTop: 2,
  },

  trendIndicator: {
    marginTop: darkSkySpacing.xs,
  },

  precipChance: {
    position: 'absolute',
    top: 30,
    right: 2,
    backgroundColor: darkSkyColors.rain,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  precipText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textPrimary,
    fontSize: 8,
    fontWeight: '600',
  },

  gustIndicator: {
    position: 'absolute',
    top: 50,
    right: 2,
    backgroundColor: darkSkyColors.warning,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  gustText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textPrimary,
    fontSize: 8,
    fontWeight: '600',
  },

  detailsPanel: {
    backgroundColor: darkSkyColors.backgroundSecondary,
    borderRadius: darkSkySpacing.md,
    padding: darkSkySpacing.lg,
    marginBottom: darkSkySpacing.lg,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: darkSkySpacing.md,
  },
  detailsTime: {
    ...darkSkyTypography.bodyLarge,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
  },
  detailsScore: {
    paddingHorizontal: darkSkySpacing.sm,
    paddingVertical: darkSkySpacing.xs,
    borderRadius: darkSkySpacing.sm,
  },
  detailsScoreText: {
    ...darkSkyTypography.caption,
    fontWeight: '700',
  },

  detailsMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailMetric: {
    alignItems: 'center',
    flex: 1,
  },
  detailMetricValue: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
    marginTop: darkSkySpacing.xs,
  },
  detailMetricLabel: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textTertiary,
    marginTop: 2,
  },

  legend: {
    paddingTop: darkSkySpacing.md,
    borderTopWidth: 1,
    borderTopColor: darkSkyColors.cardBorder,
  },
  legendTitle: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textSecondary,
    fontWeight: '600',
    marginBottom: darkSkySpacing.sm,
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
    marginRight: darkSkySpacing.xs,
  },
  legendText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textTertiary,
  },
});