/**
 * DailyForecastCard Component
 * 
 * Living Document Implementation:
 * Recreation of Google Weather's daily forecast cards with marine enhancements
 * for sailing applications. Features day abbreviations, weather icons, temperature
 * ranges, and sailing-specific conditions like wave height and tide information.
 * 
 * Features:
 * - Google Weather-style daily cards layout
 * - Weather icons with sailing-appropriate conditions
 * - High/low temperature display with color coding
 * - Marine enhancements: wave height and tide times
 * - Wind conditions with direction indicators
 * - Interactive cards for detailed daily forecasts
 * - Responsive design optimized for mobile marine use
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { 
  Cloud, 
  CloudRain,
  Sun,
  CloudSnow,
  CloudLightning,
  Wind,
  Waves,
  TrendingUp,
  TrendingDown,
  Navigation,
  Droplets,
  ArrowUp,
  ArrowDown
} from 'lucide-react-native';
import { IOSText } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';
import { useWeatherUnits } from '../../stores/weatherStore';
import { convertTemperature, convertWindSpeed } from './UnitConverter';

export interface DailyForecastData {
  id: string;
  date: string;
  dayName: string;
  dayShort: string; // "Thu", "Fri", "Sat", etc.
  high: number;
  low: number;
  conditions: string;
  precipitationChance: number;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  highTideTime: string;
  lowTideTime: string;
  tideRange: number;
  sailingConditions: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
  uvIndex: number;
  humidity: number;
}

interface DailyForecastCardProps {
  forecasts: DailyForecastData[];
  onDaySelect?: (day: DailyForecastData) => void;
  showMarineData?: boolean;
  loading?: boolean;
}

// Generate sample daily forecast data
const generateSampleForecasts = (): DailyForecastData[] => {
  const days = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  const conditions = ['Partly cloudy', 'Sunny', 'Mostly sunny', 'Cloudy', 'Rain', 'Partly cloudy', 'Sunny', 'Thunderstorms'];
  const sailingConditions = ['good', 'excellent', 'good', 'moderate', 'poor', 'good', 'excellent', 'dangerous'] as const;
  
  return days.map((day, index) => {
    const baseTemp = 87 - index * 1;
    const tempVariation = Math.random() * 4 - 2;
    
    return {
      id: `day-${index}`,
      date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString(),
      dayName: day === 'Thu' ? 'Today' : day,
      dayShort: day,
      high: Math.round(baseTemp + tempVariation),
      low: Math.round(baseTemp - 5 + tempVariation),
      conditions: conditions[index],
      precipitationChance: index === 4 ? 80 : Math.round(Math.random() * 30),
      windSpeed: Math.round(7 + Math.random() * 15),
      windDirection: 180 + (Math.random() - 0.5) * 60,
      waveHeight: 1.2 + Math.random() * 1.3,
      highTideTime: `${Math.floor(6 + index * 0.8) % 12 || 12}:${30 + index * 10}${index % 2 ? 'AM' : 'PM'}`,
      lowTideTime: `${Math.floor(12 + index * 0.8) % 12 || 12}:${15 + index * 5}${index % 2 ? 'PM' : 'AM'}`,
      tideRange: 1.8 + Math.random() * 0.8,
      sailingConditions: sailingConditions[index],
      uvIndex: Math.round(5 + Math.random() * 5),
      humidity: Math.round(65 + Math.random() * 20)
    };
  });
};

// Get weather icon component
const getWeatherIcon = (condition: string, size: number = 24) => {
  const iconColor = colors.warning;
  
  switch (condition.toLowerCase()) {
    case 'sunny':
    case 'mostly sunny':
      return <Sun size={size} color={iconColor} />;
    case 'partly cloudy':
      return <Cloud size={size} color={iconColor} />;
    case 'cloudy':
    case 'overcast':
      return <Cloud size={size} color={colors.textMuted} />;
    case 'rain':
    case 'light rain':
    case 'showers':
      return <CloudRain size={size} color={colors.info} />;
    case 'thunderstorms':
    case 'thunderstorm':
      return <CloudLightning size={size} color={colors.accent} />;
    case 'snow':
      return <CloudSnow size={size} color={colors.textMuted} />;
    default:
      return <Cloud size={size} color={iconColor} />;
  }
};

// Get sailing condition color
const getSailingConditionColor = (condition: DailyForecastData['sailingConditions']): string => {
  switch (condition) {
    case 'excellent': return colors.success;
    case 'good': return colors.primary;
    case 'moderate': return colors.warning;
    case 'poor': return colors.error;
    case 'dangerous': return colors.error;
    default: return colors.textMuted;
  }
};

// Get wind direction abbreviation
const getWindDirectionAbbr = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const DailyForecastCard: React.FC<DailyForecastCardProps> = ({
  forecasts = generateSampleForecasts(),
  onDaySelect,
  showMarineData = true,
  loading = false
}) => {
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <IOSText style={styles.loadingText}>Loading forecast...</IOSText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        <View style={styles.cardsContainer}>
          {forecasts.map((forecast, index) => {
            const isToday = index === 0;
            const sailingColor = getSailingConditionColor(forecast.sailingConditions);
            
            return (
              <TouchableOpacity
                key={forecast.id}
                style={[
                  styles.forecastCard,
                  isToday && styles.todayCard,
                  { borderColor: showMarineData ? sailingColor : colors.borderLight }
                ]}
                onPress={() => onDaySelect?.(forecast)}
              >
                {/* Day Name */}
                <IOSText style={[
                  styles.dayName,
                  isToday && styles.todayText
                ]}>
                  {forecast.dayName}
                </IOSText>

                {/* Weather Icon */}
                <View style={styles.iconContainer}>
                  {getWeatherIcon(forecast.conditions, isToday ? 32 : 28)}
                </View>

                {/* Temperature Range */}
                <View style={styles.temperatureContainer}>
                  <IOSText style={[
                    styles.highTemp,
                    isToday && styles.todayTemp
                  ]}>
                    {Math.round(convertTemperature(forecast.high, 'C', useWeatherUnits().temperature))}°
                  </IOSText>
                  <IOSText style={styles.lowTemp}>
                    {Math.round(convertTemperature(forecast.low, 'C', useWeatherUnits().temperature))}°
                  </IOSText>
                </View>

                {/* Marine Conditions */}
                {showMarineData && (
                  <View style={styles.marineContainer}>
                    {/* Wave Height */}
                    <View style={styles.marineItem}>
                      <Waves size={12} color={colors.info} />
                      <IOSText style={styles.marineText}>
                        {forecast.waveHeight.toFixed(1)}m
                      </IOSText>
                    </View>

                    {/* Wind */}
                    <View style={styles.marineItem}>
                      <Wind size={12} color={colors.accent} />
                      <IOSText style={styles.marineText}>
                        {Math.round(convertWindSpeed(forecast.windSpeed, 'kts', useWeatherUnits().windSpeed))} {useWeatherUnits().windSpeed} {getWindDirectionAbbr(forecast.windDirection)}
                      </IOSText>
                    </View>

                    {/* Tide Times */}
                    <View style={styles.tideContainer}>
                      <View style={styles.tideItem}>
                        <ArrowUp size={10} color={colors.success} />
                        <IOSText style={styles.tideText}>
                          {forecast.highTideTime}
                        </IOSText>
                      </View>
                      <View style={styles.tideItem}>
                        <ArrowDown size={10} color={colors.error} />
                        <IOSText style={styles.tideText}>
                          {forecast.lowTideTime}
                        </IOSText>
                      </View>
                    </View>

                    {/* Sailing Conditions Indicator */}
                    <View style={[
                      styles.sailingIndicator,
                      { backgroundColor: sailingColor }
                    ]}>
                      <IOSText style={styles.sailingText}>
                        {forecast.sailingConditions.charAt(0).toUpperCase()}
                      </IOSText>
                    </View>
                  </View>
                )}

                {/* Precipitation Chance */}
                {forecast.precipitationChance > 0 && (
                  <View style={styles.precipitationContainer}>
                    <Droplets size={12} color={colors.info} />
                    <IOSText style={styles.precipitationText}>
                      {forecast.precipitationChance}%
                    </IOSText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend for marine indicators */}
      {showMarineData && (
        <View style={styles.legendContainer}>
          <IOSText style={styles.legendTitle}>Sailing Conditions</IOSText>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <IOSText style={styles.legendText}>Excellent</IOSText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <IOSText style={styles.legendText}>Good</IOSText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <IOSText style={styles.legendText}>Moderate</IOSText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <IOSText style={styles.legendText}>Poor/Dangerous</IOSText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },

  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    ...typography.body2,
    color: colors.textMuted,
  },

  scrollContainer: {
    paddingHorizontal: spacing.lg,
  },

  cardsContainer: {
    flexDirection: 'row',
    paddingRight: spacing.lg,
  },

  // Forecast Cards
  forecastCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginRight: spacing.sm,
    minWidth: 110,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  todayCard: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 2,
  },

  dayName: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },

  todayText: {
    color: colors.primary,
    fontWeight: '600',
  },

  iconContainer: {
    marginBottom: spacing.sm,
  },

  temperatureContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  highTemp: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },

  todayTemp: {
    color: colors.primary,
    fontSize: 18,
  },

  lowTemp: {
    ...typography.body2,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Marine Conditions
  marineContainer: {
    width: '100%',
    alignItems: 'center',
  },

  marineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  marineText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontSize: 10,
    fontWeight: '500',
  },

  tideContainer: {
    width: '100%',
    marginBottom: spacing.xs,
  },

  tideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  tideText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontSize: 9,
  },

  sailingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },

  sailingText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
    fontSize: 10,
  },

  // Precipitation
  precipitationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    backgroundColor: colors.info + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.xs,
  },

  precipitationText: {
    ...typography.caption,
    color: colors.info,
    marginLeft: spacing.xs,
    fontSize: 10,
    fontWeight: '600',
  },

  // Legend
  legendContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  legendTitle: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },

  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 9,
  },
});

/**
 * Living Document Export Notes:
 * 
 * This DailyForecastCard component recreates Google Weather's daily forecast interface
 * with comprehensive marine enhancements for sailing applications:
 * 
 * - Visual Fidelity: Exact match to Google Weather's card layout and styling
 * - Marine Integration: Wave heights, tide times, and sailing condition indicators
 * - Interactive Design: Touch-enabled cards for detailed daily weather exploration
 * - Sailing Intelligence: Color-coded sailing conditions from excellent to dangerous
 * - Mobile Optimized: Horizontal scrolling for space-efficient forecast display
 * 
 * Future enhancements:
 * - Integration with sailing race calendars for tactical planning
 * - Weather routing suggestions based on sailing conditions
 * - Integration with tide chart services for precise tidal predictions
 * - Customizable marine data display based on boat type and sailing style
 * - Export functionality for sailing logbooks and race preparation
 */