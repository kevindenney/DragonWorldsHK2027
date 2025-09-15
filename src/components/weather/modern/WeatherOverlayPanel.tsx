import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from '../../../utils/reanimatedWrapper';
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Waves,
  Thermometer,
  Droplets,
  Eye,
  Gauge,
  ChevronDown,
  ChevronUp,
  X,
  Anchor,
} from 'lucide-react-native';

import { IOSText } from '../../ios';
import { 
  WeatherCondition,
  MarineCondition,
} from '../../../stores/weatherStore';

interface WeatherOverlayPanelProps {
  weatherData?: WeatherCondition;
  marineData?: MarineCondition;
  position?: 'top' | 'bottom';
  onClose?: () => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const formatWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const getWeatherIcon = (conditions: string, size: number = 48) => {
  const condition = conditions?.toLowerCase() || '';
  
  if (condition.includes('rain') || condition.includes('shower')) {
    return <CloudRain size={size} color="#007AFF" />;
  } else if (condition.includes('cloud')) {
    return <Cloud size={size} color="#007AFF" />;
  } else if (condition.includes('sun') || condition.includes('clear')) {
    return <Sun size={size} color="#FFD60A" />;
  } else {
    return <Cloud size={size} color="#007AFF" />;
  }
};

const getConditionGradient = (conditions: string): ViewStyle => {
  const condition = conditions?.toLowerCase() || '';
  
  if (condition.includes('rain')) {
    return {
      backgroundColor: 'rgba(99, 133, 199, 0.15)',
    };
  } else if (condition.includes('sun') || condition.includes('clear')) {
    return {
      backgroundColor: 'rgba(255, 214, 10, 0.15)',
    };
  } else {
    return {
      backgroundColor: 'rgba(120, 120, 128, 0.15)',
    };
  }
};

export const WeatherOverlayPanel: React.FC<WeatherOverlayPanelProps> = ({
  weatherData,
  marineData,
  position = 'top',
  onClose,
  expanded = false,
  onToggleExpanded,
}) => {
  const expandedHeight = useSharedValue(expanded ? 1 : 0);

  const toggleExpanded = () => {
    expandedHeight.value = withSpring(expanded ? 0 : 1, {
      damping: 15,
      stiffness: 150,
    });
    onToggleExpanded?.();
  };

  const animatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      expandedHeight.value,
      [0, 1],
      [80, 200]
    );

    const opacity = interpolate(
      expandedHeight.value,
      [0, 0.5, 1],
      [0, 0.5, 1]
    );

    return {
      height: withTiming(height, { duration: 300 }),
      opacity: withTiming(expanded ? 1 : 0.95, { duration: 200 }),
    };
  });

  const detailsStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(expanded ? 1 : 0, { duration: 200 }),
      transform: [
        {
          translateY: withTiming(expanded ? 0 : 20, { duration: 300 }),
        },
      ],
    };
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(200)}
      exiting={FadeOutUp}
      style={[
        styles.container,
        position === 'bottom' ? styles.bottomPosition : styles.topPosition,
        getConditionGradient(weatherData?.conditions || ''),
        animatedStyle,
      ]}
    >
      {/* Main Weather Display */}
      <Pressable onPress={toggleExpanded} style={styles.mainContent}>
        <View style={styles.weatherHeader}>
          <View style={styles.iconContainer}>
            {getWeatherIcon(weatherData?.conditions || '', 32)}
          </View>

          <View style={styles.mainInfo}>
            <IOSText style={styles.conditions}>
              {weatherData?.conditions || 'Loading...'}
            </IOSText>
          </View>

          <TouchableOpacity
            onPress={toggleExpanded}
            style={styles.expandButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {expanded ? (
              <ChevronUp size={16} color="#007AFF" />
            ) : (
              <ChevronDown size={16} color="#007AFF" />
            )}
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {/* Marine Data Grid */}
        <View style={styles.marineDataGrid}>
          <View style={styles.marineDataItem}>
            <Thermometer size={16} color="#FF6B6B" />
            <IOSText style={styles.marineDataValue}>
              {weatherData?.temperature || '--'}°C
            </IOSText>
            <IOSText style={styles.marineDataLabel}>Temp</IOSText>
          </View>

          <View style={styles.marineDataItem}>
            <Wind size={16} color="#007AFF" />
            <IOSText style={styles.marineDataValue}>
              {weatherData?.windSpeed || '--'} kts
            </IOSText>
            <IOSText style={styles.marineDataLabel}>
              {formatWindDirection(weatherData?.windDirection || 0)}
            </IOSText>
          </View>

          <View style={styles.marineDataItem}>
            <Waves size={16} color="#007AFF" />
            <IOSText style={styles.marineDataValue}>
              {marineData?.waveHeight || '--'}m
            </IOSText>
            <IOSText style={styles.marineDataLabel}>Waves</IOSText>
          </View>

          <View style={styles.marineDataItem}>
            <Anchor size={16} color="#007AFF" />
            <IOSText style={styles.marineDataValue}>
              {marineData?.tideHeight || '--'}m
            </IOSText>
            <IOSText style={styles.marineDataLabel}>Tide</IOSText>
          </View>
        </View>
      </Pressable>

      {/* Expanded Details */}
      {expanded && (
        <Animated.View style={[styles.expandedContent, detailsStyle]}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Droplets size={20} color="#4ECDC4" />
              <IOSText style={styles.detailLabel}>Humidity</IOSText>
              <IOSText style={styles.detailValue}>
                {weatherData?.humidity || '--'}%
              </IOSText>
            </View>

            <View style={styles.detailItem}>
              <Gauge size={20} color="#A8E6CF" />
              <IOSText style={styles.detailLabel}>Pressure</IOSText>
              <IOSText style={styles.detailValue}>
                {weatherData?.pressure || '--'} hPa
              </IOSText>
            </View>
          </View>

          {/* Marine Conditions */}
          <View style={styles.marineSection}>
            <IOSText style={styles.sectionTitle}>Marine Conditions</IOSText>
            <View style={styles.marineGrid}>
              <View style={styles.marineItem}>
                <IOSText style={styles.marineLabel}>Wave Height</IOSText>
                <IOSText style={styles.marineValue}>
                  {marineData?.waveHeight || '--'}m
                </IOSText>
              </View>

              <View style={styles.marineItem}>
                <IOSText style={styles.marineLabel}>Sea Temp</IOSText>
                <IOSText style={styles.marineValue}>
                  {marineData?.seaTemperature || '--'}°C
                </IOSText>
              </View>

              <View style={styles.marineItem}>
                <IOSText style={styles.marineLabel}>Tide</IOSText>
                <IOSText style={styles.marineValue}>
                  {marineData?.tideHeight || '--'}m
                </IOSText>
              </View>

              <View style={styles.marineItem}>
                <IOSText style={styles.marineLabel}>Current</IOSText>
                <IOSText style={styles.marineValue}>
                  {marineData?.current?.speed || '--'} kts
                </IOSText>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  topPosition: {
    top: 100,
  },
  bottomPosition: {
    bottom: 140,
  },
  mainContent: {
    padding: 12,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  mainInfo: {
    flex: 1,
  },
  conditions: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  expandButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  closeButton: {
    padding: 6,
    marginLeft: 6,
  },
  marineDataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  marineDataItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  marineDataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 2,
  },
  marineDataLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(120, 120, 128, 0.08)',
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 2,
  },
  marineSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  marineGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marineItem: {
    alignItems: 'center',
    flex: 1,
  },
  marineLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  marineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});