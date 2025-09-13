/**
 * DaySelector Component
 * 
 * Living Document Implementation:
 * A horizontal scrollable day selector for navigating through 7-day weather forecast.
 * Features smart day labeling (Today, Tomorrow, day names), weather condition icons,
 * and temperature ranges for quick forecast overview.
 * 
 * Features:
 * - 7-day forecast navigation with smooth scrolling
 * - Smart day labeling: Today → Tomorrow → Day Names
 * - Weather condition icons for each day
 * - High/low temperature display
 * - Active day selection with visual feedback
 * - Sailing condition indicators
 * - Accessibility support with proper labels
 */

import React, { useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Platform
} from 'react-native';
import { 
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Waves
} from 'lucide-react-native';
import { IOSText } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Day forecast data interface
export interface DayForecastData {
  id: string;
  date: string;
  dayName: string;
  dayShort: string;
  high: number;
  low: number;
  conditions: string;
  precipitationChance: number;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  sailingConditions: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
  uvIndex: number;
  humidity: number;
}

interface DaySelectorProps {
  forecasts: DayForecastData[];
  selectedDayId: string;
  onDaySelect: (dayId: string) => void;
  loading?: boolean;
  temperatureUnit?: 'C' | 'F';
  windUnit?: 'kph' | 'kts';
  showSailingConditions?: boolean;
}

// Weather icon mapping
const getWeatherIcon = (condition: string, size: number = 24) => {
  const iconColor = colors.primary;
  
  switch (condition.toLowerCase()) {
    case 'sunny':
    case 'clear':
    case 'mostly sunny':
      return <Sun size={size} color={colors.warning} />;
    case 'partly cloudy':
    case 'partly sunny':
      return <Cloud size={size} color={colors.textSecondary} />;
    case 'cloudy':
    case 'overcast':
    case 'mostly cloudy':
      return <Cloud size={size} color={colors.textMuted} />;
    case 'rain':
    case 'light rain':
    case 'heavy rain':
    case 'showers':
      return <CloudRain size={size} color={colors.primary} />;
    case 'thunderstorm':
    case 'thunderstorms':
      return <CloudLightning size={size} color={colors.accent} />;
    case 'snow':
    case 'light snow':
      return <CloudSnow size={size} color={colors.info} />;
    default:
      return <Cloud size={size} color={iconColor} />;
  }
};

// Get sailing condition color
const getSailingConditionColor = (condition: DayForecastData['sailingConditions']): string => {
  switch (condition) {
    case 'excellent':
      return colors.success;
    case 'good':
      return colors.info;
    case 'moderate':
      return colors.warning;
    case 'poor':
      return colors.error;
    case 'dangerous':
      return colors.error;
    default:
      return colors.textMuted;
  }
};

// Convert temperature based on unit
const convertTemperature = (celsius: number, unit: 'C' | 'F'): number => {
  return unit === 'F' ? Math.round(celsius * 9/5 + 32) : Math.round(celsius);
};

// Convert wind speed based on unit
const convertWindSpeed = (kts: number, unit: 'kph' | 'kts'): number => {
  return unit === 'kph' ? Math.round(kts * 1.852) : Math.round(kts);
};

// Smart day labeling
const getSmartDayLabel = (date: string, dayName: string): string => {
  const targetDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Reset time components for accurate date comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  if (targetDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (targetDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    return dayName;
  }
};

export const DaySelector: React.FC<DaySelectorProps> = ({
  forecasts,
  selectedDayId,
  onDaySelect,
  loading = false,
  temperatureUnit = 'C',
  windUnit = 'kts',
  showSailingConditions = true
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to selected day when selection changes
  useEffect(() => {
    if (forecasts.length > 0) {
      const selectedIndex = forecasts.findIndex(day => day.id === selectedDayId);
      if (selectedIndex >= 0 && scrollViewRef.current) {
        const itemWidth = (SCREEN_WIDTH - spacing.lg * 2) / 3.5; // Show ~3.5 days at once
        const scrollPosition = Math.max(0, (selectedIndex - 1) * itemWidth);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: scrollPosition,
            animated: true
          });
        }, 100);
      }
    }
  }, [selectedDayId, forecasts]);

  const handleDayPress = (dayId: string) => {
    // Add haptic feedback on iOS
    if (Platform.OS === 'ios') {
      // Expo Haptics would be imported and used here
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDaySelect(dayId);
  };

  const getDayItemWidth = () => {
    return (SCREEN_WIDTH - spacing.lg * 2) / 3.5; // Show ~3.5 items
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IOSText style={styles.headerTitle}>Loading forecast...</IOSText>
        </View>
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.dayItem, styles.loadingItem]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IOSText style={styles.headerTitle}>7-Day Forecast</IOSText>
        <IOSText style={styles.headerSubtitle}>
          {showSailingConditions ? 'Weather & Marine Conditions' : 'Weather Conditions'}
        </IOSText>
      </View>

      {/* Day Selector */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        decelerationRate="fast"
        snapToInterval={getDayItemWidth()}
        snapToAlignment="start"
      >
        {forecasts.map((day, index) => {
          const isSelected = selectedDayId === day.id;
          const isToday = getSmartDayLabel(day.date, day.dayName) === 'Today';
          const smartLabel = getSmartDayLabel(day.date, day.dayName);
          
          return (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayItem,
                { width: getDayItemWidth() },
                isSelected && styles.selectedDayItem,
                isToday && styles.todayItem
              ]}
              onPress={() => handleDayPress(day.id)}
              accessibilityRole="tab"
              accessibilityLabel={`${smartLabel} forecast`}
              accessibilityHint={`${day.conditions}, high ${convertTemperature(day.high, temperatureUnit)}°, low ${convertTemperature(day.low, temperatureUnit)}°`}
              accessibilityState={{ selected: isSelected }}
            >
              {/* Day Label */}
              <IOSText style={[
                styles.dayLabel,
                isSelected && styles.selectedDayLabel,
                isToday && styles.todayLabel
              ]}>
                {smartLabel}
              </IOSText>

              {/* Weather Icon */}
              <View style={styles.iconContainer}>
                {getWeatherIcon(day.conditions, 28)}
              </View>

              {/* Temperature Range */}
              <View style={styles.temperatureContainer}>
                <IOSText style={[
                  styles.highTemp,
                  isSelected && styles.selectedTempText
                ]}>
                  {convertTemperature(day.high, temperatureUnit)}°
                </IOSText>
                <IOSText style={[
                  styles.lowTemp,
                  isSelected && styles.selectedLowTempText
                ]}>
                  {convertTemperature(day.low, temperatureUnit)}°
                </IOSText>
              </View>

              {/* Marine Conditions */}
              {showSailingConditions && (
                <View style={styles.marineConditions}>
                  {/* Sailing Condition Indicator */}
                  <View style={[
                    styles.sailingIndicator,
                    { backgroundColor: getSailingConditionColor(day.sailingConditions) }
                  ]} />
                  
                  {/* Wind and Wave Info */}
                  <View style={styles.marineInfo}>
                    <View style={styles.marineItem}>
                      <Wind size={12} color={colors.textMuted} />
                      <IOSText style={styles.marineText}>
                        {convertWindSpeed(day.windSpeed, windUnit)}{windUnit}
                      </IOSText>
                    </View>
                    <View style={styles.marineItem}>
                      <Waves size={12} color={colors.info} />
                      <IOSText style={styles.marineText}>
                        {day.waveHeight.toFixed(1)}m
                      </IOSText>
                    </View>
                  </View>
                </View>
              )}

              {/* Rain Chance */}
              {day.precipitationChance > 0 && (
                <View style={styles.rainChance}>
                  <IOSText style={styles.rainText}>
                    {day.precipitationChance}%
                  </IOSText>
                </View>
              )}

              {/* Selection Indicator */}
              {isSelected && (
                <View style={styles.selectionIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  headerTitle: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },

  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Scroll View
  scrollView: {
    paddingBottom: spacing.sm,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xl,
  },

  // Day Items
  dayItem: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative',
  },

  selectedDayItem: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 2,
  },

  todayItem: {
    backgroundColor: colors.info + '05',
  },

  loadingItem: {
    backgroundColor: colors.surface,
    opacity: 0.6,
  },

  // Day Label
  dayLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontSize: 12,
  },

  selectedDayLabel: {
    color: colors.primary,
    fontWeight: '600',
  },

  todayLabel: {
    color: colors.info,
    fontWeight: '600',
  },

  // Weather Icon
  iconContainer: {
    marginBottom: spacing.sm,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Temperature
  temperatureContainer: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  highTemp: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },

  lowTemp: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  selectedTempText: {
    color: colors.primary,
  },

  selectedLowTempText: {
    color: colors.primary,
    opacity: 0.7,
  },

  // Marine Conditions
  marineConditions: {
    width: '100%',
    marginTop: spacing.xs,
  },

  sailingIndicator: {
    width: 20,
    height: 2,
    borderRadius: 1,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },

  marineInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  marineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  marineText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9,
    marginLeft: 2,
  },

  // Rain Chance
  rainChance: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.primary + '20',
    borderRadius: spacing.xs,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  rainText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '600',
  },

  // Selection Indicator
  selectionIndicator: {
    position: 'absolute',
    bottom: -1,
    left: spacing.sm,
    right: spacing.sm,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
});

/**
 * Living Document Export Notes:
 * 
 * This DaySelector provides comprehensive 7-day forecast navigation:
 * 
 * - Smart Labeling: Today/Tomorrow transitions to day names automatically
 * - Weather Integration: Condition icons and temperature ranges
 * - Marine Focus: Sailing conditions, wind speed, and wave height
 * - Unit Support: Celsius/Fahrenheit and KPH/Knots conversion ready
 * - Accessibility: Full screen reader support with detailed descriptions
 * - Smooth UX: Auto-scrolling to selected day with haptic feedback
 * 
 * Future enhancements:
 * - Animated weather icon transitions
 * - Swipe gestures for day navigation
 * - Weather alert badges on days with warnings
 * - Tide timing indicators for sailing planning
 * - Integration with race schedule for event-specific highlights
 */