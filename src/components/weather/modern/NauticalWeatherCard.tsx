import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import {
  Wind,
  Waves,
  Anchor,
  Navigation,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react-native';

import { IOSText } from '../../ios';
import { 
  WeatherCondition,
  MarineCondition,
} from '../../../stores/weatherStore';

interface NauticalWeatherCardProps {
  weatherData?: WeatherCondition;
  marineData?: MarineCondition;
  onPress?: () => void;
  location?: string;
  timestamp?: string;
  sailingConditions?: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
  compact?: boolean;
}

const getSailingConditionColor = (condition: string) => {
  switch (condition) {
    case 'excellent':
      return '#34C759';
    case 'good':
      return '#30D158';
    case 'moderate':
      return '#FFD60A';
    case 'poor':
      return '#FF9F0A';
    case 'dangerous':
      return '#FF453A';
    default:
      return '#8E8E93';
  }
};

const getSailingConditionIcon = (condition: string, size: number = 16) => {
  const color = getSailingConditionColor(condition);
  
  switch (condition) {
    case 'excellent':
    case 'good':
      return <CheckCircle size={size} color={color} />;
    case 'moderate':
      return <Clock size={size} color={color} />;
    case 'poor':
    case 'dangerous':
      return <AlertTriangle size={size} color={color} />;
    default:
      return <Clock size={size} color={color} />;
  }
};

const formatWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const getWindStrength = (speed: number): string => {
  if (speed < 4) return 'Calm';
  if (speed < 7) return 'Light';
  if (speed < 11) return 'Gentle';
  if (speed < 16) return 'Moderate';
  if (speed < 22) return 'Fresh';
  if (speed < 28) return 'Strong';
  return 'Gale';
};

const getTideStatus = (height: number): { status: string; trend: 'rising' | 'falling' | 'stable' } => {
  // This would normally come from tide prediction data
  // For now, we'll use simple logic based on height
  if (height > 2.0) {
    return { status: 'High', trend: 'falling' };
  } else if (height < 0.5) {
    return { status: 'Low', trend: 'rising' };
  } else {
    return { status: 'Mid', trend: 'rising' };
  }
};

export const NauticalWeatherCard: React.FC<NauticalWeatherCardProps> = ({
  weatherData,
  marineData,
  onPress,
  location = 'Current Location',
  timestamp,
  sailingConditions = 'moderate',
  compact = false,
}) => {
  const pressAnimation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressAnimation.value, [0, 1], [1, 0.98]);
    
    return {
      transform: [{ scale }],
    };
  });

  const handlePressIn = () => {
    pressAnimation.value = withSpring(1, { damping: 15 });
  };

  const handlePressOut = () => {
    pressAnimation.value = withSpring(0, { damping: 15 });
  };

  const tideInfo = getTideStatus(marineData?.tideHeight || 1.0);
  const windStrength = getWindStrength(weatherData?.windSpeed || 0);

  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <Animated.View
      entering={FadeInDown.delay(300)}
      style={[animatedStyle]}
    >
      <CardContainer
        style={[
          styles.container,
          compact && styles.compactContainer,
          getSailingConditionColor(sailingConditions) && {
            borderLeftWidth: 4,
            borderLeftColor: getSailingConditionColor(sailingConditions),
          }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.locationInfo}>
            <IOSText style={styles.locationText}>{location}</IOSText>
            {timestamp && (
              <IOSText style={styles.timestampText}>
                Updated {new Date(timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </IOSText>
            )}
          </View>
          
          <View style={styles.conditionBadge}>
            {getSailingConditionIcon(sailingConditions)}
            <IOSText style={[
              styles.conditionText,
              { color: getSailingConditionColor(sailingConditions) }
            ]}>
              {sailingConditions.charAt(0).toUpperCase() + sailingConditions.slice(1)}
            </IOSText>
          </View>
        </View>

        {/* Main Weather Data */}
        <View style={styles.mainData}>
          <View style={styles.primaryMetric}>
            <Wind size={24} color="#007AFF" />
            <View style={styles.metricInfo}>
              <IOSText style={styles.primaryValue}>
                {weatherData?.windSpeed || '--'} kts
              </IOSText>
              <IOSText style={styles.primarySubtext}>
                {formatWindDirection(weatherData?.windDirection || 0)} • {windStrength}
              </IOSText>
            </View>
          </View>

          {weatherData?.windGust && weatherData.windGust > (weatherData.windSpeed || 0) * 1.2 && (
            <View style={styles.gustWarning}>
              <TrendingUp size={16} color="#FF9F0A" />
              <IOSText style={styles.gustText}>
                Gusts to {weatherData.windGust} kts
              </IOSText>
            </View>
          )}
        </View>

        {/* Marine Conditions */}
        <View style={styles.marineData}>
          <View style={styles.marineMetric}>
            <Waves size={20} color="#4ECDC4" />
            <View style={styles.marineInfo}>
              <IOSText style={styles.marineValue}>
                {marineData?.waveHeight || '--'}m
              </IOSText>
              <IOSText style={styles.marineLabel}>Wave Height</IOSText>
            </View>
          </View>

          <View style={styles.marineMetric}>
            <Anchor size={20} color="#5856D6" />
            <View style={styles.marineInfo}>
              <View style={styles.tideContainer}>
                <IOSText style={styles.marineValue}>
                  {marineData?.tideHeight?.toFixed(1) || '--'}m
                </IOSText>
                {tideInfo.trend === 'rising' ? (
                  <TrendingUp size={14} color="#34C759" />
                ) : (
                  <TrendingDown size={14} color="#FF453A" />
                )}
              </View>
              <IOSText style={styles.marineLabel}>
                {tideInfo.status} Tide
              </IOSText>
            </View>
          </View>

          {marineData?.current && marineData.current.speed > 0.5 && (
            <View style={styles.marineMetric}>
              <Navigation size={20} color="#FF6B6B" />
              <View style={styles.marineInfo}>
                <IOSText style={styles.marineValue}>
                  {marineData.current.speed.toFixed(1)} kts
                </IOSText>
                <IOSText style={styles.marineLabel}>Current</IOSText>
              </View>
            </View>
          )}
        </View>

        {/* Additional Info for Non-Compact */}
        {!compact && (
          <View style={styles.additionalInfo}>
            <View style={styles.infoRow}>
              <IOSText style={styles.infoLabel}>Temperature:</IOSText>
              <IOSText style={styles.infoValue}>
                {weatherData?.temperature || '--'}°C
              </IOSText>
            </View>
            
            {marineData?.seaTemperature && (
              <View style={styles.infoRow}>
                <IOSText style={styles.infoLabel}>Sea Temp:</IOSText>
                <IOSText style={styles.infoValue}>
                  {marineData.seaTemperature}°C
                </IOSText>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <IOSText style={styles.infoLabel}>Visibility:</IOSText>
              <IOSText style={styles.infoValue}>
                {weatherData?.visibility || '--'} km
              </IOSText>
            </View>
          </View>
        )}
      </CardContainer>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    backdropFilter: 'blur(20px)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  compactContainer: {
    padding: 12,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timestampText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainData: {
    marginBottom: 16,
  },
  primaryMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricInfo: {
    marginLeft: 12,
    flex: 1,
  },
  primaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  primarySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  gustWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  gustText: {
    fontSize: 12,
    color: '#FF9F0A',
    fontWeight: '600',
  },
  marineData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  marineMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  marineInfo: {
    marginLeft: 8,
    alignItems: 'center',
  },
  marineValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  marineLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  tideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  additionalInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(120, 120, 128, 0.2)',
    paddingTop: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});