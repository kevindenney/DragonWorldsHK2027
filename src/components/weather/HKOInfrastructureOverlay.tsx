import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker, Circle } from 'react-native-maps';
import { Activity, Anchor, Waves, Wind, Signal } from 'lucide-react-native';
import {
  useHKOWeatherBuoys,
  useHKOTideStations,
  useHKODriftingBuoys,
  useHKOMarineAreas
} from '../../stores/weatherStore';
import { waveDataService } from '../../services/waveDataService';
import { tideDataService } from '../../services/tideDataService';
import { hkoAPI } from '../../services/hkoAPI';

interface HKOInfrastructureOverlayProps {
  visible: boolean;
  showBuoys?: boolean;
  showTideStations?: boolean;
  showDriftingBuoys?: boolean;
  showForecastAreas?: boolean;
}

interface StationMarkerProps {
  coordinate: { latitude: number; longitude: number };
  title: string;
  description: string;
  stationType: 'weather' | 'tide' | 'drifting' | 'forecast';
  status: 'active' | 'inactive' | 'maintenance';
  lastUpdate?: string;
  onPress?: () => void;
}

const StationMarker: React.FC<StationMarkerProps> = ({
  coordinate,
  title,
  description,
  stationType,
  status,
  lastUpdate,
  onPress
}) => {
  const getMarkerColor = () => {
    switch (status) {
      case 'active': return '#22C55E'; // Green
      case 'inactive': return '#EF4444'; // Red
      case 'maintenance': return '#F59E0B'; // Orange
      default: return '#6B7280'; // Gray
    }
  };

  const getStationIcon = () => {
    switch (stationType) {
      case 'weather': return Wind;
      case 'tide': return Waves;
      case 'drifting': return Activity;
      case 'forecast': return Signal;
      default: return Anchor;
    }
  };

  const IconComponent = getStationIcon();

  return (
    <>
      <Marker
        coordinate={coordinate}
        title={title}
        description={description}
        onPress={onPress}
      >
        <View style={[styles.markerContainer, { backgroundColor: getMarkerColor() }]}>
          <IconComponent size={16} color="#FFFFFF" />
        </View>
      </Marker>

      {/* Coverage area circle for stations */}
      <Circle
        center={coordinate}
        radius={stationType === 'forecast' ? 5000 : 2000} // 5km for forecast areas, 2km for stations
        strokeColor={getMarkerColor()}
        strokeWidth={1}
        fillColor={`${getMarkerColor()}20`} // 20% opacity
      />
    </>
  );
};

export const HKOInfrastructureOverlay: React.FC<HKOInfrastructureOverlayProps> = ({
  visible,
  showBuoys = true,
  showTideStations = true,
  showDriftingBuoys = false,
  showForecastAreas = false
}) => {
  const hkoWeatherBuoys = useHKOWeatherBuoys();
  const hkoTideStations = useHKOTideStations();
  const hkoDriftingBuoys = useHKODriftingBuoys();
  const hkoMarineAreas = useHKOMarineAreas();
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [stationDetails, setStationDetails] = useState<any>(null);

  useEffect(() => {
    if (!visible) return;

    // Fetch station details when component becomes visible
    const loadStationData = async () => {
      try {
        // This could be expanded to show detailed station information
      } catch (error) {
      }
    };

    loadStationData();
  }, [visible]);

  if (!visible) return null;

  const handleStationPress = (stationId: string, stationType: string) => {
    setSelectedStation(stationId);
  };

  return (
    <>
      {/* HKO Weather Buoys */}
      {showBuoys && hkoWeatherBuoys.map((buoy, index) => {
        // Use predefined buoy locations
        const buoyLocations = waveDataService.getHKOBuoyLocations();
        const coordinate = buoyLocations[index % buoyLocations.length];

        return (
          <StationMarker
            key={`weather-buoy-${buoy.id}`}
            coordinate={coordinate}
            title={`HKO Weather Buoy ${buoy.id}`}
            description={`Wind: ${buoy.windSpeed || 0}kts, Temp: ${buoy.temperature || 0}°C`}
            stationType="weather"
            status="active"
            lastUpdate={buoy.lastUpdated}
            onPress={() => handleStationPress(buoy.id, 'weather')}
          />
        );
      })}

      {/* HKO Tide Stations */}
      {showTideStations && hkoTideStations.map((station) => {
        // Get station location from tide service
        const stationLocations = tideDataService.getHKOTideStationLocations();
        const stationInfo = stationLocations.find(loc => loc.stationId === station.id);

        if (!stationInfo) return null;

        return (
          <StationMarker
            key={`tide-station-${station.id}`}
            coordinate={{ latitude: stationInfo.latitude, longitude: stationInfo.longitude }}
            title={stationInfo.name}
            description={`Height: ${station.currentHeight || 0}m, Trend: ${station.trend || 'stable'}`}
            stationType="tide"
            status="active"
            lastUpdate={station.lastUpdated}
            onPress={() => handleStationPress(station.id, 'tide')}
          />
        );
      })}

      {/* HKO Drifting Buoys */}
      {showDriftingBuoys && hkoDriftingBuoys.map((buoy) => (
        <StationMarker
          key={`drifting-buoy-${buoy.id}`}
          coordinate={buoy.coordinate}
          title={`Drifting Buoy ${buoy.id}`}
          description={`Position: ${buoy.coordinate.latitude.toFixed(3)}, ${buoy.coordinate.longitude.toFixed(3)}`}
          stationType="drifting"
          status={buoy.isActive ? 'active' : 'inactive'}
          lastUpdate={buoy.lastUpdated}
          onPress={() => handleStationPress(buoy.id, 'drifting')}
        />
      ))}

      {/* HKO Marine Forecast Areas */}
      {showForecastAreas && hkoMarineAreas.map((forecast) => (
        <StationMarker
          key={`forecast-area-${forecast.areaId}`}
          coordinate={forecast.centerCoordinate}
          title={forecast.areaName}
          description={`Wind: ${forecast.windSpeed || 0}kts, Conditions: ${forecast.conditions || 'Unknown'}`}
          stationType="forecast"
          status="active"
          lastUpdate={forecast.lastUpdated}
          onPress={() => handleStationPress(forecast.areaId ?? '', 'forecast')}
        />
      ))}

      {/* Station Details Panel (if station selected) */}
      {selectedStation && (
        <View style={styles.detailsPanel}>
          <Text style={styles.detailsTitle}>HKO Station Details</Text>
          <Text style={styles.detailsText}>Station: {selectedStation}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedStation(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  detailsPanel: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HKOInfrastructureOverlay;