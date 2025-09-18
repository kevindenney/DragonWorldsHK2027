/**
 * Station Marker Components
 *
 * Renders weather monitoring station markers on the map with proper clustering
 * and visual indicators for different station types and verification status.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Marker } from '../../utils/mapComponentStubs';
import { Wind, Waves, Activity, MapPin } from 'lucide-react-native';
import type { TideStation } from '../../constants/hkTideStations';
import type { WaveStation } from '../../constants/hkWaveStations';
import type { WindStation } from '../../services/windStationService';

// Common station interface for clustering
export interface StationMarkerData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  verified?: boolean;
  type: 'tide' | 'wave' | 'wind';
  data?: any; // Station-specific data
}

interface StationMarkerProps {
  station: StationMarkerData;
  onPress?: (station: StationMarkerData) => void;
  isCluster?: boolean;
  clusterCount?: number;
}

interface TideStationMarkerProps {
  station: TideStation;
  onPress?: (station: TideStation) => void;
}

interface WaveStationMarkerProps {
  station: WaveStation;
  onPress?: (station: WaveStation) => void;
}

interface WindStationMarkerProps {
  station: WindStation;
  onPress?: (station: WindStation) => void;
}

// Generic station marker with clustering support
export const StationMarker: React.FC<StationMarkerProps> = ({
  station,
  onPress,
  isCluster = false,
  clusterCount = 0
}) => {
  const getStationIcon = () => {
    const iconSize = isCluster ? 14 : 16;
    const iconColor = isCluster ? "#FFF" : getStationColor();

    switch (station.type) {
      case 'tide':
        return <Activity size={iconSize} color={iconColor} />;
      case 'wave':
        return <Waves size={iconSize} color={iconColor} />;
      case 'wind':
        return <Wind size={iconSize} color={iconColor} />;
      default:
        return <MapPin size={iconSize} color={iconColor} />;
    }
  };

  const getStationColor = () => {
    switch (station.type) {
      case 'tide':
        return '#007AFF'; // Blue for tides
      case 'wave':
        return '#34C759'; // Green for waves
      case 'wind':
        return '#FF9500'; // Orange for wind
      default:
        return '#8E8E93'; // Gray for unknown
    }
  };

  const getMarkerStyle = () => {
    if (isCluster) {
      return [
        styles.clusterMarker,
        { backgroundColor: getStationColor() }
      ];
    }

    return [
      styles.stationMarker,
      {
        backgroundColor: getStationColor(),
        borderColor: station.verified ? '#FFF' : 'rgba(255, 255, 255, 0.5)'
      }
    ];
  };

  return (
    <Marker
      coordinate={{ latitude: station.lat, longitude: station.lon }}
      onPress={() => onPress?.(station)}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={getMarkerStyle()}>
        {getStationIcon()}
        {station.verified && !isCluster && (
          <View style={styles.verifiedIndicator} />
        )}
        {isCluster && clusterCount > 1 && (
          <View style={styles.clusterBadge}>
            <Text style={styles.clusterText}>{clusterCount}</Text>
          </View>
        )}
      </View>
    </Marker>
  );
};

// Specialized marker components
export const TideStationMarker: React.FC<TideStationMarkerProps> = ({
  station,
  onPress
}) => {
  const markerData: StationMarkerData = {
    id: station.id,
    name: station.name,
    lat: station.lat,
    lon: station.lon,
    verified: station.verified,
    type: 'tide',
    data: station
  };

  return (
    <StationMarker
      station={markerData}
      onPress={(marker) => onPress?.(station)}
    />
  );
};

export const WaveStationMarker: React.FC<WaveStationMarkerProps> = ({
  station,
  onPress
}) => {
  const markerData: StationMarkerData = {
    id: station.id,
    name: station.name,
    lat: station.lat,
    lon: station.lon,
    verified: station.verified,
    type: 'wave',
    data: station
  };

  return (
    <StationMarker
      station={markerData}
      onPress={(marker) => onPress?.(station)}
    />
  );
};

export const WindStationMarker: React.FC<WindStationMarkerProps> = ({
  station,
  onPress
}) => {
  const markerData: StationMarkerData = {
    id: station.id,
    name: station.name,
    lat: station.coordinate.latitude,
    lon: station.coordinate.longitude,
    verified: station.dataQuality === 'high',
    type: 'wind',
    data: station
  };

  return (
    <StationMarker
      station={markerData}
      onPress={(marker) => onPress?.(station)}
    />
  );
};

// Clustering utility functions
export const clusterStations = (
  stations: StationMarkerData[],
  zoom: number
): Array<StationMarkerData | { isCluster: true; stations: StationMarkerData[]; lat: number; lon: number; id: string }> => {
  // Don't cluster at high zoom levels
  if (zoom >= 12) {
    return stations;
  }

  const clusters: Array<StationMarkerData | { isCluster: true; stations: StationMarkerData[]; lat: number; lon: number; id: string }> = [];
  const clustered = new Set<string>();
  const clusterRadius = zoom < 8 ? 0.05 : 0.02; // Larger radius at lower zoom

  stations.forEach(station => {
    if (clustered.has(station.id)) return;

    const nearbyStations = stations.filter(other => {
      if (other.id === station.id || clustered.has(other.id)) return false;

      const distance = Math.sqrt(
        Math.pow(station.lat - other.lat, 2) +
        Math.pow(station.lon - other.lon, 2)
      );

      return distance < clusterRadius;
    });

    if (nearbyStations.length > 0) {
      // Create cluster
      const allStations = [station, ...nearbyStations];
      allStations.forEach(s => clustered.add(s.id));

      const centerLat = allStations.reduce((sum, s) => sum + s.lat, 0) / allStations.length;
      const centerLon = allStations.reduce((sum, s) => sum + s.lon, 0) / allStations.length;

      clusters.push({
        isCluster: true,
        stations: allStations,
        lat: centerLat,
        lon: centerLon,
        id: `cluster-${allStations.map(s => s.id).join('-')}`
      });
    } else {
      // Individual station
      clusters.push(station);
      clustered.add(station.id);
    }
  });

  return clusters;
};

// Helper to convert station data to marker data
export const convertStationsToMarkerData = (
  tideStations: TideStation[] = [],
  waveStations: WaveStation[] = [],
  windStations: WindStation[] = []
): StationMarkerData[] => {
  const markers: StationMarkerData[] = [];

  // Convert tide stations
  tideStations.forEach(station => {
    markers.push({
      id: station.id,
      name: station.name,
      lat: station.lat,
      lon: station.lon,
      verified: station.verified,
      type: 'tide',
      data: station
    });
  });

  // Convert wave stations
  waveStations.forEach(station => {
    markers.push({
      id: station.id,
      name: station.name,
      lat: station.lat,
      lon: station.lon,
      verified: station.verified,
      type: 'wave',
      data: station
    });
  });

  // Convert wind stations
  windStations.forEach(station => {
    markers.push({
      id: station.id,
      name: station.name,
      lat: station.coordinate.latitude,
      lon: station.coordinate.longitude,
      verified: station.dataQuality === 'high',
      type: 'wind',
      data: station
    });
  });

  return markers;
};

const styles = StyleSheet.create({
  stationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5
  },

  clusterMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6
  },

  verifiedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    borderWidth: 1,
    borderColor: '#FFF'
  },

  clusterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF'
  },

  clusterText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});