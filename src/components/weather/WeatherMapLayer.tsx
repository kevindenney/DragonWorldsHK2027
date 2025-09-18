import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from '../../utils/mapComponentStubs';
import { TrendingUp, Navigation } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import {
  StationMarker,
  TideStationMarker,
  WaveStationMarker,
  WindStationMarker,
  clusterStations,
  convertStationsToMarkerData,
  type StationMarkerData
} from './StationMarkers';
import { StationDetailModal } from './StationDetailModal';
import type { TideStation } from '../../constants/hkTideStations';
import type { WaveStation } from '../../constants/hkWaveStations';
import type { WindStation } from '../../services/windStationService';

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
  // Station visibility props
  windStationsVisible?: boolean;
  waveStationsVisible?: boolean;
  tideStationsVisible?: boolean;
  // Station data props
  windStations?: WindStation[];
  waveStations?: WaveStation[];
  tideStations?: TideStation[];
  // Map zoom level for clustering
  zoomLevel?: number;
}

export const WeatherMapLayer: React.FC<WeatherMapLayerProps> = ({
  weatherData,
  overlayMode,
  onPointSelect,
  showLabels = false,
  opacity = 0.7,
  windStationsVisible = false,
  waveStationsVisible = false,
  tideStationsVisible = false,
  windStations = [],
  waveStations = [],
  tideStations = [],
  zoomLevel = 10
}) => {
  // Filter and sample data points for performance
  const sampledData = useMemo(() => {
    // Sample every nth point based on data density
    const sampleRate = weatherData.length > 200 ? 3 : weatherData.length > 100 ? 2 : 1;
    return weatherData.filter((_, index) => index % sampleRate === 0);
  }, [weatherData]);

  // Station modal state
  const [selectedStation, setSelectedStation] = React.useState<StationMarkerData | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  // Convert and cluster stations
  const clusteredStations = useMemo(() => {
    const allStations = convertStationsToMarkerData(
      tideStationsVisible ? tideStations : [],
      waveStationsVisible ? waveStations : [],
      windStationsVisible ? windStations : []
    );
    return clusterStations(allStations, zoomLevel);
  }, [tideStations, waveStations, windStations, tideStationsVisible, waveStationsVisible, windStationsVisible, zoomLevel]);

  // Handle station press
  const handleStationPress = (station: StationMarkerData) => {
    setSelectedStation(station);
    setModalVisible(true);
  };

  // Handle cluster press - could expand to show cluster detail or zoom in
  const handleClusterPress = (cluster: { isCluster: true; stations: StationMarkerData[]; lat: number; lon: number; id: string }) => {
    // For now, just show the first station in the cluster
    if (cluster.stations.length > 0) {
      setSelectedStation(cluster.stations[0]);
      setModalVisible(true);
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

      {/* Render station markers with clustering */}
      {clusteredStations.map((item) => {
        if ('isCluster' in item) {
          // Render cluster marker
          const cluster = item;
          return (
            <Marker
              key={cluster.id}
              coordinate={{ latitude: cluster.lat, longitude: cluster.lon }}
              onPress={() => handleClusterPress(cluster)}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <StationMarker
                station={{
                  id: cluster.id,
                  name: `${cluster.stations.length} stations`,
                  lat: cluster.lat,
                  lon: cluster.lon,
                  type: cluster.stations[0]?.type || 'wind',
                  verified: true
                }}
                onPress={() => handleClusterPress(cluster)}
                isCluster={true}
                clusterCount={cluster.stations.length}
              />
            </Marker>
          );
        } else {
          // Render individual station marker
          const station = item;
          return (
            <StationMarker
              key={station.id}
              station={station}
              onPress={handleStationPress}
            />
          );
        }
      })}

      {/* Station Detail Modal */}
      <StationDetailModal
        visible={modalVisible}
        station={selectedStation}
        onClose={() => {
          setModalVisible(false);
          setSelectedStation(null);
        }}
      />
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