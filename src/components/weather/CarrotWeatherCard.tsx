import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeInDown, useSharedValue, withSpring } from 'react-native-reanimated';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Eye, 
  Droplets,
  Thermometer,
  ArrowUp,
  ArrowDown,
  ChevronRight
} from 'lucide-react-native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width } = Dimensions.get('window');

interface WeatherData {
  temperature: number;
  conditions: string;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  humidity: number;
  visibility: number;
  pressure: number;
  precipitationChance?: number;
  uvIndex?: number;
  feelsLike?: number;
}

interface CarrotWeatherCardProps {
  weather: WeatherData;
  location: string;
  lastUpdated: string;
  onPress?: () => void;
  showSailingFocus?: boolean;
}

export const CarrotWeatherCard: React.FC<CarrotWeatherCardProps> = ({
  weather,
  location,
  lastUpdated,
  onPress,
  showSailingFocus = true,
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });
    onPress?.();
  };

  const getWeatherIcon = (conditions: string, size: number = 64) => {
    const iconColor = colors.weatherClear;
    
    if (conditions.toLowerCase().includes('rain')) {
      return <CloudRain color={colors.weatherRain} size={size} strokeWidth={1.5} />;
    } else if (conditions.toLowerCase().includes('cloud')) {
      return <Cloud color={colors.weatherPartlyCloud} size={size} strokeWidth={1.5} />;
    } else {
      return <Sun color={colors.weatherClear} size={size} strokeWidth={1.5} />;
    }
  };

  const getSailingCondition = (windSpeed: number): {
    condition: string;
    color: string;
    description: string;
  } => {
    if (windSpeed < 5) {
      return {
        condition: 'Light',
        color: colors.windLight,
        description: 'Light air sailing',
      };
    } else if (windSpeed < 12) {
      return {
        condition: 'Perfect',
        color: colors.windModerate,
        description: 'Ideal racing conditions',
      };
    } else if (windSpeed < 20) {
      return {
        condition: 'Strong',
        color: colors.windStrong,
        description: 'Challenging but good',
      };
    } else {
      return {
        condition: 'Heavy',
        color: colors.windGale,
        description: 'Strong wind sailing',
      };
    }
  };

  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const sailingCondition = getSailingCondition(weather.windSpeed);

  return (
    <Animated.View
      style={[styles.container]}
      entering={FadeInDown.duration(600)}
    >
      <TouchableOpacity
        onPress={handlePress}
        style={styles.card}
        activeOpacity={0.95}
        disabled={!onPress}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <Text style={styles.location}>{location}</Text>
            <Text style={styles.lastUpdated}>Updated {formatTime(lastUpdated)}</Text>
          </View>
          {onPress && (
            <ChevronRight color={colors.textMuted} size={20} />
          )}
        </View>

        {/* Main Weather Display */}
        <View style={styles.mainWeather}>
          <View style={styles.temperatureSection}>
            <Text style={styles.temperature}>
              {Math.round(weather.temperature)}°
            </Text>
            <Text style={styles.conditions}>{weather.conditions}</Text>
            {weather.feelsLike && Math.abs(weather.feelsLike - weather.temperature) > 2 && (
              <Text style={styles.feelsLike}>
                Feels like {Math.round(weather.feelsLike)}°
              </Text>
            )}
          </View>
          
          <View style={styles.weatherIconContainer}>
            {getWeatherIcon(weather.conditions, 72)}
          </View>
        </View>

        {/* Sailing Focus Section */}
        {showSailingFocus && (
          <View style={styles.sailingSection}>
            <View style={styles.sailingHeader}>
              <View style={[
                styles.sailingConditionBadge,
                { backgroundColor: sailingCondition.color + '20' }
              ]}>
                <Text style={[
                  styles.sailingConditionText,
                  { color: sailingCondition.color }
                ]}>
                  {sailingCondition.condition}
                </Text>
              </View>
              <Text style={styles.sailingDescription}>
                {sailingCondition.description}
              </Text>
            </View>
            
            <View style={styles.windDisplay}>
              <View style={styles.windMain}>
                <Wind 
                  color={sailingCondition.color} 
                  size={24} 
                  style={{ transform: [{ rotate: `${weather.windDirection}deg` }] }}
                />
                <Text style={styles.windSpeed}>{weather.windSpeed}</Text>
                <Text style={styles.windUnit}>kts</Text>
              </View>
              
              <View style={styles.windDetails}>
                <Text style={styles.windDirection}>
                  {formatDirection(weather.windDirection)} ({weather.windDirection}°)
                </Text>
                {weather.windGust > weather.windSpeed + 2 && (
                  <Text style={styles.windGust}>
                    Gusts {weather.windGust} kts
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Weather Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Droplets color={colors.textSecondary} size={18} />
            <Text style={styles.detailValue}>{weather.humidity}%</Text>
            <Text style={styles.detailLabel}>Humidity</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Eye color={colors.textSecondary} size={18} />
            <Text style={styles.detailValue}>{weather.visibility}km</Text>
            <Text style={styles.detailLabel}>Visibility</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Thermometer color={colors.textSecondary} size={18} />
            <Text style={styles.detailValue}>{Math.round(weather.pressure || 1013)}</Text>
            <Text style={styles.detailLabel}>Pressure</Text>
          </View>
          
          {weather.precipitationChance !== undefined && weather.precipitationChance > 0 && (
            <View style={styles.detailItem}>
              <CloudRain color={colors.weatherRain} size={18} />
              <Text style={styles.detailValue}>{weather.precipitationChance}%</Text>
              <Text style={styles.detailLabel}>Rain</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.screenPadding,
    marginVertical: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.weatherCardPadding,
    ...shadows.cardMedium,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  locationContainer: {
    flex: 1,
  },
  location: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '600',
  },
  lastUpdated: {
    ...typography.labelMedium,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  mainWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  temperatureSection: {
    flex: 1,
  },
  temperature: {
    ...typography.displayHero,
    color: colors.text,
    lineHeight: 80,
    fontWeight: '200',
  },
  conditions: {
    ...typography.headlineSmall,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.xs,
  },
  feelsLike: {
    ...typography.labelMedium,
    color: colors.textMuted,
  },
  weatherIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.lg,
  },
  sailingSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sailingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sailingConditionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  sailingConditionText: {
    ...typography.labelMedium,
    fontWeight: '700',
    fontSize: 12,
  },
  sailingDescription: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    flex: 1,
  },
  windDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  windMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: spacing.lg,
  },
  windSpeed: {
    ...typography.displayMedium,
    color: colors.text,
    fontWeight: '300',
    marginLeft: spacing.sm,
  },
  windUnit: {
    ...typography.labelLarge,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
  },
  windDetails: {
    flex: 1,
  },
  windDirection: {
    ...typography.sailingData,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  windGust: {
    ...typography.labelMedium,
    color: colors.windStrong,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    ...typography.labelLarge,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  detailLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
});