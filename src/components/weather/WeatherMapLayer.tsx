import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Circle } from 'react-native-maps';
import { Wind, Waves, TrendingUp, Thermometer, Navigation } from 'lucide-react-native';
import { IOSText } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';

export interface WeatherDataPoint {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  tideHeight: number;
  currentSpeed: number;
  currentDirection: number;
  temperature: number;
  intensity: number;
}

export type OverlayMode = 'wind' | 'waves' | 'tides' | 'currents' | 'temperature';

interface WeatherMapLayerProps {
  weatherData: WeatherDataPoint[];
  overlayMode: OverlayMode;
  onPointSelect?: (point: WeatherDataPoint) => void;
  showLabels?: boolean;
  opacity?: number;
}

export const WeatherMapLayer: React.FC<WeatherMapLayerProps> = ({
  weatherData,
  overlayMode,
  onPointSelect,
  showLabels = false,
  opacity = 0.7
}) => {
  // Filter and sample data points for performance
  const sampledData = useMemo(() => {
    // Sample every nth point based on data density
    const sampleRate = weatherData.length > 200 ? 3 : weatherData.length > 100 ? 2 : 1;
    return weatherData.filter((_, index) => index % sampleRate === 0);
  }, [weatherData]);

  // Get color for data point based on overlay mode and intensity
  const getPointColor = (point: WeatherDataPoint): string => {
    let normalizedValue: number;
    
    switch (overlayMode) {
      case 'wind':
        normalizedValue = Math.min(1, point.windSpeed / 25);
        break;
      case 'waves':
        normalizedValue = Math.min(1, point.waveHeight / 2.5);
        break;
      case 'currents':
        normalizedValue = Math.min(1, point.currentSpeed / 2);
        break;
      case 'tides':
        // Tides: normalize based on typical range (-2m to +3m)
        normalizedValue = Math.min(1, Math.max(0, (point.tideHeight + 2) / 5));
        break;
      case 'temperature':
        // Temperature: normalize around 20-30°C range
        normalizedValue = Math.min(1, Math.max(0, (point.temperature - 20) / 10));
        break;
      default:
        normalizedValue = point.intensity;
    }

    // Create color gradient from blue (low) to red (high)
    const red = Math.floor(normalizedValue * 255);
    const blue = Math.floor((1 - normalizedValue) * 255);
    const green = Math.floor(normalizedValue * (1 - normalizedValue) * 510);
    
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  };

  // Get radius for data point circles based on intensity
  const getPointRadius = (point: WeatherDataPoint): number => {
    const baseRadius = 15;
    const intensityMultiplier = 1 + point.intensity * 0.5;
    return baseRadius * intensityMultiplier;
  };

  // Get display value for overlay mode
  const getDisplayValue = (point: WeatherDataPoint): string => {
    switch (overlayMode) {
      case 'wind':
        return `${point.windSpeed.toFixed(1)}kts`;
      case 'waves':
        return `${point.waveHeight.toFixed(1)}m`;
      case 'currents':
        return `${point.currentSpeed.toFixed(1)}kts`;
      case 'tides':
        return `${point.tideHeight > 0 ? '+' : ''}${point.tideHeight.toFixed(1)}m`;
      case 'temperature':
        return `${point.temperature.toFixed(1)}°C`;
      default:
        return '';
    }
  };

  // Get wind arrow rotation
  const getWindArrowRotation = (direction: number): number => {
    // Wind direction is "from" direction, arrow should point "to" direction
    return (direction + 180) % 360;
  };

  // Get current arrow rotation
  const getCurrentArrowRotation = (direction: number): number => {
    // Current direction is "to" direction
    return direction;
  };

  return (
    <>
      {/* Render weather data points */}
      {sampledData.map((point, index) => {
        const pointKey = `${point.coordinate.latitude}-${point.coordinate.longitude}-${index}`;
        
        return (
          <React.Fragment key={pointKey}>
            {/* Data point circle */}
            <Circle
              center={point.coordinate}
              radius={getPointRadius(point)}
              fillColor={getPointColor(point)}
              strokeColor={getPointColor(point)}
              strokeWidth={1}
            />

            {/* Wind direction arrows for wind overlay */}
            {overlayMode === 'wind' && point.windSpeed > 2 && (
              <Marker
                coordinate={point.coordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => onPointSelect?.(point)}
              >
                <View 
                  style={[
                    styles.windArrow,
                    { 
                      transform: [{ rotate: `${getWindArrowRotation(point.windDirection)}deg` }] 
                    }
                  ]}
                >
                  <Navigation size={12} color={colors.background} />
                </View>
              </Marker>
            )}

            {/* Current direction arrows for currents overlay */}
            {overlayMode === 'currents' && point.currentSpeed > 0.1 && (
              <Marker
                coordinate={point.coordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => onPointSelect?.(point)}
              >
                <View 
                  style={[
                    styles.currentArrow,
                    { 
                      transform: [{ rotate: `${getCurrentArrowRotation(point.currentDirection)}deg` }] 
                    }
                  ]}
                >
                  <TrendingUp size={10} color={colors.accent} />
                </View>
              </Marker>
            )}

            {/* Data labels (if enabled) */}
            {showLabels && (index % 4 === 0) && ( // Show only every 4th label to avoid clutter
              <Marker
                coordinate={point.coordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => onPointSelect?.(point)}
              >
                <View style={styles.dataLabel}>
                  <IOSText style={styles.dataLabelText}>
                    {getDisplayValue(point)}
                  </IOSText>
                </View>
              </Marker>
            )}

            {/* Interactive marker for detailed data */}
            {(index % 8 === 0) && ( // Interactive markers every 8th point
              <Marker
                coordinate={point.coordinate}
                onPress={() => onPointSelect?.(point)}
                tracksViewChanges={false}
              >
                <View style={styles.interactiveMarker}>
                  {overlayMode === 'wind' && <Wind size={8} color={colors.primary} />}
                  {overlayMode === 'waves' && <Waves size={8} color={colors.info} />}
                  {overlayMode === 'temperature' && <Thermometer size={8} color={colors.warning} />}
                  {(overlayMode === 'tides' || overlayMode === 'currents') && 
                    <TrendingUp size={8} color={colors.accent} />
                  }
                </View>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  windArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background,
  },

  currentArrow: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 150, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background,
  },

  dataLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: spacing.xs,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
  },

  dataLabelText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text,
    fontWeight: '600',
  },

  interactiveMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});