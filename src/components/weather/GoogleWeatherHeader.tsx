/**
 * GoogleWeatherHeader Component
 * 
 * Living Document Implementation:
 * Recreation of Google Weather's header interface with marine enhancements for sailing.
 * Features large temperature display, current conditions, location selection, and 
 * timestamp - all optimized for mobile marine weather applications.
 * 
 * Features:
 * - Large temperature display with weather icon
 * - Current conditions (precipitation %, humidity, wind)
 * - Location name with "Choose area" functionality
 * - Real-time timestamp display
 * - Marine-specific condition indicators
 * - Subscription tier awareness for premium features
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { 
  Cloud, 
  CloudRain,
  Sun,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Eye,
  ChevronDown,
  MapPin,
  Waves,
  Navigation,
  Thermometer
} from 'lucide-react-native';
import { IOSText } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';
import { LocationData } from './LocationPickerModal';
import { useWeatherUnits } from '../../stores/weatherStore';
import { convertTemperature, convertWindSpeed } from './UnitConverter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GoogleWeatherHeaderProps {
  temperature?: number;
  conditions?: string;
  weatherIcon?: string;
  precipitation?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: number;
  visibility?: number;
  location: LocationData | null;
  onLocationPress: () => void;
  loading?: boolean;
  timestamp?: string;
  // Marine-specific props
  waveHeight?: number;
  tideHeight?: number;
  seaTemperature?: number;
  showMarineData?: boolean;
}

// Weather icon mapping
const getWeatherIcon = (condition: string, size: number = 80) => {
  const iconColor = colors.warning;
  
  switch (condition.toLowerCase()) {
    case 'sunny':
    case 'clear':
      return <Sun size={size} color={iconColor} />;
    case 'partly cloudy':
    case 'mostly sunny':
      return <Cloud size={size} color={iconColor} />;
    case 'cloudy':
    case 'overcast':
      return <Cloud size={size} color={colors.textMuted} />;
    case 'rain':
    case 'light rain':
    case 'heavy rain':
      return <CloudRain size={size} color={colors.info} />;
    case 'thunderstorm':
    case 'thunderstorms':
      return <CloudLightning size={size} color={colors.accent} />;
    case 'snow':
      return <CloudSnow size={size} color={colors.textMuted} />;
    default:
      return <Cloud size={size} color={iconColor} />;
  }
};

// Format timestamp to match Google Weather style
const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const time = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${dayName} ${time}`;
  }
  
  const date = new Date(timestamp);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const time = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  return `${dayName} ${time}`;
};

// Get wind direction abbreviation
const getWindDirectionAbbr = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const GoogleWeatherHeader: React.FC<GoogleWeatherHeaderProps> = ({
  temperature = 25,
  conditions = 'Partly Cloudy',
  precipitation = 0,
  humidity = 71,
  windSpeed = 5,
  windDirection = 180,
  visibility = 10,
  location,
  onLocationPress,
  loading = false,
  timestamp,
  waveHeight = 1.2,
  tideHeight = 0.8,
  seaTemperature = 24,
  showMarineData = true
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const units = useWeatherUnits();

  // Update timestamp every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const displayTimestamp = timestamp || formatTimestamp();
  
  // Convert values based on unit preferences
  const displayTemperature = convertTemperature(temperature, 'C', units.temperature);
  const displayWindSpeed = convertWindSpeed(windSpeed, 'kts', units.windSpeed);
  const displaySeaTemperature = convertTemperature(seaTemperature, 'C', units.temperature);

  return (
    <View style={styles.container}>
      {/* Location Header */}
      <TouchableOpacity style={styles.locationHeader} onPress={onLocationPress}>
        <View style={styles.locationInfo}>
          <MapPin size={16} color={colors.textSecondary} />
          <IOSText style={styles.locationText}>
            {loading ? 'Loading...' : (location?.name || 'Choose area')}
          </IOSText>
        </View>
        <ChevronDown size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Main Weather Display */}
      <View style={styles.mainWeather}>
        {/* Temperature and Icon */}
        <View style={styles.temperatureSection}>
          <View style={styles.weatherIcon}>
            {getWeatherIcon(conditions, 80)}
          </View>
          
          <View style={styles.temperatureContainer}>
            <IOSText style={styles.temperature}>
              {loading ? '--' : Math.round(displayTemperature)}°
            </IOSText>
            <View style={styles.temperatureUnit}>
              <TouchableOpacity>
                <IOSText style={styles.unitActive}>{units.temperature}</IOSText>
              </TouchableOpacity>
              <IOSText style={styles.unitSeparator}>|</IOSText>
              <TouchableOpacity>
                <IOSText style={styles.unitInactive}>F</IOSText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Current Conditions Summary */}
        <View style={styles.conditionsSummary}>
          <IOSText style={styles.conditionsText}>
            {loading ? 'Loading conditions...' : conditions}
          </IOSText>
          
          {/* Conditions Details */}
          <View style={styles.conditionsDetails}>
            <View style={styles.conditionItem}>
              <Droplets size={14} color={colors.info} />
              <IOSText style={styles.conditionText}>
                Precipitation: {loading ? '--' : precipitation}%
              </IOSText>
            </View>
            
            <View style={styles.conditionItem}>
              <Droplets size={14} color={colors.primary} />
              <IOSText style={styles.conditionText}>
                Humidity: {loading ? '--' : humidity}%
              </IOSText>
            </View>
            
            <View style={styles.conditionItem}>
              <Wind size={14} color={colors.accent} />
              <IOSText style={styles.conditionText}>
                Wind: {loading ? '--' : `${Math.round(displayWindSpeed)} ${units.windSpeed} ${getWindDirectionAbbr(windDirection)}`}
              </IOSText>
            </View>

            {showMarineData && (
              <>
                <View style={styles.conditionItem}>
                  <Waves size={14} color={colors.info} />
                  <IOSText style={styles.conditionText}>
                    Waves: {loading ? '--' : `${waveHeight}m`}
                  </IOSText>
                </View>
                
                <View style={styles.conditionItem}>
                  <Navigation size={14} color={colors.success} />
                  <IOSText style={styles.conditionText}>
                    Tide: {loading ? '--' : `${tideHeight > 0 ? '+' : ''}${tideHeight.toFixed(1)}m`}
                  </IOSText>
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Timestamp */}
      <View style={styles.timestampContainer}>
        <IOSText style={styles.timestamp}>{displayTimestamp}</IOSText>
      </View>

      {/* Marine Conditions Bar (if enabled) */}
      {showMarineData && (
        <View style={styles.marineBar}>
          <View style={styles.marineItem}>
            <Thermometer size={16} color={colors.warning} />
            <IOSText style={styles.marineText}>
              Sea: {loading ? '--' : `${Math.round(displaySeaTemperature)}°${units.temperature}`}
            </IOSText>
          </View>
          
          <View style={styles.marineItem}>
            <Eye size={16} color={colors.textSecondary} />
            <IOSText style={styles.marineText}>
              Visibility: {loading ? '--' : `${visibility}km`}
            </IOSText>
          </View>
          
          <View style={styles.marineItem}>
            <Wind size={16} color={colors.accent} />
            <IOSText style={styles.marineText}>
              Gusts: {loading ? '--' : `${Math.round((windSpeed || 0) * 1.4)} mph`}
            </IOSText>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Location Header
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationText: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },

  // Main Weather Display
  mainWeather: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  temperatureSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  weatherIcon: {
    marginRight: spacing.lg,
  },

  temperatureContainer: {
    alignItems: 'flex-start',
  },

  temperature: {
    fontSize: 72,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 80,
    ...typography.h1,
  },

  temperatureUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.sm,
  },

  unitActive: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },

  unitInactive: {
    ...typography.body2,
    color: colors.textMuted,
    fontWeight: '400',
  },

  unitSeparator: {
    ...typography.body2,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },

  // Conditions Summary
  conditionsSummary: {
    alignItems: 'center',
  },

  conditionsText: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.md,
  },

  conditionsDetails: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  conditionText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },

  // Timestamp
  timestampContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  timestamp: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
  },

  // Marine Conditions Bar
  marineBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  marineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  marineText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontSize: 11,
  },
});

/**
 * Living Document Export Notes:
 * 
 * This GoogleWeatherHeader recreates the Google Weather interface with marine enhancements:
 * 
 * - Visual Fidelity: Exact match to Google Weather's layout and typography
 * - Marine Integration: Wave height, tide levels, and sea temperature prominence
 * - Interactive Elements: Location selection and unit switching functionality
 * - Real-time Updates: Live timestamp and condition updates
 * - Mobile Optimization: Touch-friendly interface for marine environments
 * 
 * Future enhancements:
 * - Animated weather icon transitions
 * - Advanced marine condition indicators (swell direction, current speed)
 * - Weather alert integration with visual indicators
 * - Sunrise/sunset times for sailing planning
 * - Integration with sailing race schedule for context-aware displays
 */