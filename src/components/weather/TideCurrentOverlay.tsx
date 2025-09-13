import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Polyline, Circle } from 'react-native-maps';
import { TrendingUp, TrendingDown, Navigation, Waves } from 'lucide-react-native';
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { IOSText } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';
import type { WeatherDataPoint } from './WeatherMapLayer';

interface TideCurrentOverlayProps {
  weatherData: WeatherDataPoint[];
  visible: boolean;
  showTideStations?: boolean;
  showCurrentVectors?: boolean;
  animateFlow?: boolean;
}

interface TideStation {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  name: string;
  currentHeight: number;
  trend: 'rising' | 'falling' | 'slack';
  nextTide: {
    type: 'high' | 'low';
    time: string;
    height: number;
  };
}

interface CurrentVector {
  start: {
    latitude: number;
    longitude: number;
  };
  end: {
    latitude: number;
    longitude: number;
  };
  speed: number;
  direction: number;
  strength: 'weak' | 'moderate' | 'strong';
}

export const TideCurrentOverlay: React.FC<TideCurrentOverlayProps> = ({
  weatherData,
  visible,
  showTideStations = true,
  showCurrentVectors = true,
  animateFlow = true
}) => {
  // Animation values for flowing current indicators
  const flowAnimationValue = useSharedValue(0);
  
  React.useEffect(() => {
    if (animateFlow && visible) {
      flowAnimationValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000 }),
          withTiming(0, { duration: 100 })
        ),
        -1,
        true
      );
    } else {
      flowAnimationValue.value = 0;
    }
  }, [animateFlow, visible, flowAnimationValue]);

  // Generate tide stations based on racing area
  const tideStations: TideStation[] = useMemo(() => [
    {
      coordinate: { latitude: 22.2783, longitude: 114.1757 },
      name: 'Clearwater Bay Marina',
      currentHeight: 1.2,
      trend: 'rising',
      nextTide: {
        type: 'high',
        time: '14:30',
        height: 2.1
      }
    },
    {
      coordinate: { latitude: 22.3200, longitude: 114.2300 },
      name: 'West Race Area',
      currentHeight: 1.1,
      trend: 'rising',
      nextTide: {
        type: 'high',
        time: '14:35',
        height: 2.0
      }
    },
    {
      coordinate: { latitude: 22.3600, longitude: 114.2600 },
      name: 'East Race Area', 
      currentHeight: 1.3,
      trend: 'rising',
      nextTide: {
        type: 'high',
        time: '14:25',
        height: 2.2
      }
    }
  ], []);

  // Generate current vectors from weather data
  const currentVectors: CurrentVector[] = useMemo(() => {
    if (!weatherData.length) return [];
    
    const vectors: CurrentVector[] = [];
    const sampleRate = 5; // Every 5th point to avoid clutter

    weatherData.forEach((point, index) => {
      if (index % sampleRate !== 0 || point.currentSpeed < 0.1) return;

      const vectorLength = Math.min(0.005, point.currentSpeed * 0.002); // Scale vector length
      const directionRad = (point.currentDirection * Math.PI) / 180;
      
      const endLatitude = point.coordinate.latitude + vectorLength * Math.cos(directionRad);
      const endLongitude = point.coordinate.longitude + vectorLength * Math.sin(directionRad);

      vectors.push({
        start: point.coordinate,
        end: { latitude: endLatitude, longitude: endLongitude },
        speed: point.currentSpeed,
        direction: point.currentDirection,
        strength: point.currentSpeed > 1.5 ? 'strong' : 
                 point.currentSpeed > 0.8 ? 'moderate' : 'weak'
      });
    });

    return vectors;
  }, [weatherData]);

  // Get tide station icon based on trend
  const getTideIcon = (trend: string, height: number) => {
    const iconColor = height > 1.5 ? colors.info : height > 0.5 ? colors.primary : colors.warning;
    
    switch (trend) {
      case 'rising':
        return <TrendingUp size={16} color={iconColor} />;
      case 'falling':
        return <TrendingDown size={16} color={iconColor} />;
      default:
        return <Waves size={16} color={iconColor} />;
    }
  };

  // Get tide station color based on height
  const getTideStationColor = (height: number): string => {
    if (height < 0.5) return colors.error + '40';
    if (height < 1.0) return colors.warning + '40';
    if (height < 1.5) return colors.primary + '40';
    return colors.info + '40';
  };

  // Get current vector color based on strength
  const getCurrentVectorColor = (strength: string): string => {
    switch (strength) {
      case 'strong': return colors.error;
      case 'moderate': return colors.warning;
      default: return colors.primary;
    }
  };

  // Get current vector width based on strength
  const getCurrentVectorWidth = (strength: string): number => {
    switch (strength) {
      case 'strong': return 4;
      case 'moderate': return 3;
      default: return 2;
    }
  };

  // Animated flow indicator style
  const flowStyle = useAnimatedStyle(() => ({
    opacity: flowAnimationValue.value,
  }));

  if (!visible) return null;

  return (
    <>
      {/* Tide Stations */}
      {showTideStations && tideStations.map((station, index) => (
        <React.Fragment key={`tide-station-${index}`}>
          {/* Tide influence circles */}
          <Circle
            center={station.coordinate}
            radius={500} // 500m influence radius
            fillColor={getTideStationColor(station.currentHeight)}
            strokeColor={getTideStationColor(station.currentHeight).replace('40', '80')}
            strokeWidth={2}
          />

          {/* Tide station marker */}
          <Marker
            coordinate={station.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.tideStationMarker}>
              {getTideIcon(station.trend, station.currentHeight)}
              <View style={styles.tideDataBubble}>
                <IOSText style={styles.tideStationName}>{station.name}</IOSText>
                <IOSText style={styles.tideHeight}>
                  {station.currentHeight > 0 ? '+' : ''}{station.currentHeight.toFixed(1)}m
                </IOSText>
                <IOSText style={styles.tideNextChange}>
                  Next {station.nextTide.type}: {station.nextTide.time}
                </IOSText>
              </View>
            </View>
          </Marker>
        </React.Fragment>
      ))}

      {/* Current Vectors */}
      {showCurrentVectors && currentVectors.map((vector, index) => (
        <React.Fragment key={`current-vector-${index}`}>
          {/* Current flow line */}
          <Polyline
            coordinates={[vector.start, vector.end]}
            strokeColor={getCurrentVectorColor(vector.strength)}
            strokeWidth={getCurrentVectorWidth(vector.strength)}
            lineDashPattern={vector.strength === 'weak' ? [5, 5] : undefined}
          />

          {/* Current arrow head */}
          <Marker
            coordinate={vector.end}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View 
              style={[
                styles.currentArrowHead,
                { 
                  backgroundColor: getCurrentVectorColor(vector.strength),
                  transform: [{ rotate: `${vector.direction}deg` }] 
                }
              ]}
            >
              <Navigation size={8} color={colors.background} />
            </View>
          </Marker>

          {/* Animated flow indicators */}
          {animateFlow && vector.strength !== 'weak' && (
            <Marker
              coordinate={{
                latitude: (vector.start.latitude + vector.end.latitude) / 2,
                longitude: (vector.start.longitude + vector.end.longitude) / 2,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <Animated.View style={[styles.flowIndicator, flowStyle]}>
                <View style={[
                  styles.flowDot,
                  { backgroundColor: getCurrentVectorColor(vector.strength) }
                ]} />
              </Animated.View>
            </Marker>
          )}

          {/* Current speed label for strong currents */}
          {vector.strength === 'strong' && (
            <Marker
              coordinate={vector.start}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.currentSpeedLabel}>
                <IOSText style={styles.currentSpeedText}>
                  {vector.speed.toFixed(1)} kts
                </IOSText>
              </View>
            </Marker>
          )}
        </React.Fragment>
      ))}

      {/* Legend for current overlay */}
      <Marker
        coordinate={{ latitude: 22.3700, longitude: 114.2100 }}
        anchor={{ x: 0, y: 1 }}
        tracksViewChanges={false}
      >
        <View style={styles.currentLegend}>
          <IOSText style={styles.legendTitle}>Current Strength</IOSText>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.primary }]} />
            <IOSText style={styles.legendText}>Weak (&lt;0.8 kts)</IOSText>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.warning }]} />
            <IOSText style={styles.legendText}>Moderate (0.8-1.5 kts)</IOSText>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.error }]} />
            <IOSText style={styles.legendText}>Strong (&gt;1.5 kts)</IOSText>
          </View>
        </View>
      </Marker>

      {/* Tide timing legend */}
      <Marker
        coordinate={{ latitude: 22.3700, longitude: 114.2700 }}
        anchor={{ x: 1, y: 1 }}
        tracksViewChanges={false}
      >
        <View style={styles.tideLegend}>
          <IOSText style={styles.legendTitle}>Tide Status</IOSText>
          
          <View style={styles.legendItem}>
            <TrendingUp size={12} color={colors.primary} />
            <IOSText style={styles.legendText}>Rising</IOSText>
          </View>
          
          <View style={styles.legendItem}>
            <TrendingDown size={12} color={colors.primary} />
            <IOSText style={styles.legendText}>Falling</IOSText>
          </View>
          
          <View style={styles.legendItem}>
            <Waves size={12} color={colors.textMuted} />
            <IOSText style={styles.legendText}>Slack</IOSText>
          </View>
        </View>
      </Marker>
    </>
  );
};

const styles = StyleSheet.create({
  tideStationMarker: {
    alignItems: 'center',
  },

  tideDataBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.xs,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  tideStationName: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
    textAlign: 'center',
  },

  tideHeight: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },

  tideNextChange: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textMuted,
  },

  currentArrowHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background,
  },

  flowIndicator: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  flowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  currentSpeedLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: spacing.xs,
    marginTop: spacing.sm,
  },

  currentSpeedText: {
    ...typography.caption,
    fontSize: 9,
    color: colors.background,
    fontWeight: '600',
  },

  currentLegend: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 140,
  },

  tideLegend: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 100,
  },

  legendTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },

  legendLine: {
    width: 16,
    height: 2,
    marginRight: spacing.xs,
  },

  legendText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
  },
});