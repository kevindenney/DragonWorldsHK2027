import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from '../../utils/mapComponentStubs';
import { TrendingUp, Navigation } from 'lucide-react-native';
import { colors } from '../../constants/theme';

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

});