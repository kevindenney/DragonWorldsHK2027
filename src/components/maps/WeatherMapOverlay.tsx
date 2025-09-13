import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Heatmap, PROVIDER_GOOGLE } from 'react-native-maps';
import { Wind, Waves, Thermometer, Eye } from 'lucide-react-native';

import { IOSText, IOSButton, IOSSegmentedControl } from '../ios';
import { 
  predictWindService,
  formatWindSpeed,
  formatTemperature,
  type PredictWindCurrentConditions
} from '../../services/predictwindService';
import { windStationService } from '../../services/windStationService';

interface WeatherMapOverlayProps {
  height?: number;
  showControls?: boolean;
  overlayType?: 'wind' | 'waves' | 'temperature' | 'visibility';
  onOverlayTypeChange?: (type: 'wind' | 'waves' | 'temperature' | 'visibility') => void;
}

interface WeatherDataPoint {
  latitude: number;
  longitude: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  temperature: number;
  waveHeight: number;
  visibility: number;
  intensity: number; // 0-1 for heatmap
}

const { width } = Dimensions.get('window');

export const WeatherMapOverlay: React.FC<WeatherMapOverlayProps> = ({
  height = 300,
  showControls = true,
  overlayType = 'wind',
  onOverlayTypeChange,
}) => {
  const [weatherData, setWeatherData] = useState<WeatherDataPoint[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<'wind' | 'waves' | 'temperature' | 'visibility'>(overlayType);
  const [isLoading, setIsLoading] = useState(true);

  const overlayOptions = [
    { label: 'Wind', value: 'wind' },
    { label: 'Waves', value: 'waves' },
    { label: 'Temp', value: 'temperature' },
    { label: 'Vis', value: 'visibility' }
  ];

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      setIsLoading(true);
      
      // Get real wind station data (force refresh to bypass cache)
      const windStations = await windStationService.forceRefreshWindStations();
      
      // Convert wind stations to weather data points
      const realWeatherData: WeatherDataPoint[] = windStations.map(station => ({
        latitude: station.coordinate.latitude,
        longitude: station.coordinate.longitude,
        windSpeed: station.windSpeed,
        windDirection: station.windDirection,
        windGust: station.windGust,
        temperature: station.temperature || 24,
        waveHeight: 1.2, // Default wave height
        visibility: station.visibility || 15,
        intensity: Math.min(1, Math.max(0, station.windSpeed / 30)) // Normalize for heatmap
      }));
      
      setWeatherData(realWeatherData);
    } catch (error) {
      console.error('Error loading weather data:', error);
      
      // Fallback to demo data if real data fails
      const demoWeatherData: WeatherDataPoint[] = [];
      
      // Create a grid of weather data points
      for (let lat = 22.24; lat <= 22.32; lat += 0.01) {
        for (let lng = 114.12; lng <= 114.20; lng += 0.01) {
          const distanceFromCenter = Math.sqrt(
            Math.pow(lat - 22.283, 2) + Math.pow(lng - 114.165, 2)
          );
          
          // Create varied weather patterns
          const windSpeed = 12 + Math.sin(lat * 100) * 8 + Math.cos(lng * 100) * 6;
          const windDirection = 45 + Math.sin(lat * 200) * 90;
          const temperature = 24 + Math.sin(lng * 150) * 4;
          const waveHeight = 1.5 + Math.cos(lat * 180) * 1.0;
          const visibility = Math.max(5, 15 - distanceFromCenter * 30);
          
          demoWeatherData.push({
            latitude: lat,
            longitude: lng,
            windSpeed,
            windDirection,
            temperature,
            waveHeight,
            visibility,
            intensity: Math.min(1, Math.max(0, windSpeed / 30)) // Normalize for heatmap
          });
        }
      }
      
      setWeatherData(demoWeatherData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayChange = (value: string) => {
    const newOverlay = value as 'wind' | 'waves' | 'temperature' | 'visibility';
    setSelectedOverlay(newOverlay);
    onOverlayTypeChange?.(newOverlay);
  };

  const getOverlayColor = (dataPoint: WeatherDataPoint): string => {
    let intensity: number;
    
    switch (selectedOverlay) {
      case 'wind':
        intensity = Math.min(1, dataPoint.windSpeed / 30);
        break;
      case 'waves':
        intensity = Math.min(1, dataPoint.waveHeight / 3);
        break;
      case 'temperature':
        intensity = Math.min(1, Math.max(0, (dataPoint.temperature - 20) / 10));
        break;
      case 'visibility':
        intensity = Math.min(1, Math.max(0, (20 - dataPoint.visibility) / 15));
        break;
      default:
        intensity = dataPoint.intensity;
    }
    
    // Color gradient from blue (low) to red (high)
    const r = Math.floor(intensity * 255);
    const b = Math.floor((1 - intensity) * 255);
    const g = Math.floor(intensity * (1 - intensity) * 510);
    
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
  };

  const getHeatmapData = () => {
    return weatherData.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
      weight: getIntensityForOverlay(point)
    }));
  };

  const getIntensityForOverlay = (dataPoint: WeatherDataPoint): number => {
    switch (selectedOverlay) {
      case 'wind':
        return Math.min(1, dataPoint.windSpeed / 30);
      case 'waves':
        return Math.min(1, dataPoint.waveHeight / 3);
      case 'temperature':
        return Math.min(1, Math.max(0, (dataPoint.temperature - 20) / 10));
      case 'visibility':
        return Math.min(1, Math.max(0, (20 - dataPoint.visibility) / 15));
      default:
        return dataPoint.intensity;
    }
  };

  const getOverlayIcon = () => {
    switch (selectedOverlay) {
      case 'wind':
        return <Wind size={16} color="#007AFF" />;
      case 'waves':
        return <Waves size={16} color="#007AFF" />;
      case 'temperature':
        return <Thermometer size={16} color="#007AFF" />;
      case 'visibility':
        return <Eye size={16} color="#007AFF" />;
      default:
        return <Wind size={16} color="#007AFF" />;
    }
  };

  const getOverlayDescription = (): string => {
    switch (selectedOverlay) {
      case 'wind':
        return 'Wind speed and direction patterns';
      case 'waves':
        return 'Wave height distribution';
      case 'temperature':
        return 'Surface temperature variation';
      case 'visibility':
        return 'Visibility conditions';
      default:
        return 'Weather overlay';
    }
  };

  // Sample data points for key racing locations
  const keyLocations = [
    {
      id: 'start_line',
      name: 'Start Line',
      coordinate: { latitude: 22.285, longitude: 114.165 },
      data: weatherData.find(d => 
        Math.abs(d.latitude - 22.285) < 0.005 && Math.abs(d.longitude - 114.165) < 0.005
      )
    },
    {
      id: 'windward_mark',
      name: 'Windward Mark',
      coordinate: { latitude: 22.290, longitude: 114.170 },
      data: weatherData.find(d => 
        Math.abs(d.latitude - 22.290) < 0.005 && Math.abs(d.longitude - 114.170) < 0.005
      )
    },
    {
      id: 'leeward_mark',
      name: 'Leeward Mark',
      coordinate: { latitude: 22.280, longitude: 114.165 },
      data: weatherData.find(d => 
        Math.abs(d.latitude - 22.280) < 0.005 && Math.abs(d.longitude - 114.165) < 0.005
      )
    }
  ];

  return (
    <View style={[styles.container, { height }]}>
      {showControls && (
        <View style={styles.controls}>
          <View style={styles.overlayHeader}>
            {getOverlayIcon()}
            <IOSText style={styles.overlayTitle}>
              {selectedOverlay.charAt(0).toUpperCase() + selectedOverlay.slice(1)} Overlay
            </IOSText>
          </View>
          
          <IOSSegmentedControl
            options={overlayOptions}
            selectedValue={selectedOverlay}
            onValueChange={handleOverlayChange}
            style={styles.segmentedControl}
          />
          
          <IOSText style={styles.overlayDescription}>
            {getOverlayDescription()}
          </IOSText>
        </View>
      )}
      
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 22.283,
          longitude: 114.165,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        mapType="satellite"
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {/* Weather heatmap overlay */}
        <Heatmap
          points={getHeatmapData()}
          opacity={0.6}
          radius={40}
          maxIntensity={1}
          gradientSmoothing={10}
          heatmapMode={'POINTS_DENSITY'}
        />
        
        {/* Key location markers with weather data */}
        {keyLocations.map((location) => (
          location.data && (
            <Marker
              key={location.id}
              coordinate={location.coordinate}
              title={location.name}
              description={`${formatWindSpeed(location.data.windSpeed)} • ${formatTemperature(location.data.temperature)}`}
            >
              <View style={styles.weatherMarker}>
                <IOSText style={styles.weatherMarkerText}>
                  {selectedOverlay === 'wind' && (
                    <>
                      {formatWindSpeed(location.data.windSpeed)}
                      {location.data.windGust && ` G${location.data.windGust.toFixed(0)}`}
                      {` ${location.data.windDirection}°`}
                    </>
                  )}
                  {selectedOverlay === 'waves' && `${location.data.waveHeight.toFixed(1)}m`}
                  {selectedOverlay === 'temperature' && formatTemperature(location.data.temperature)}
                  {selectedOverlay === 'visibility' && `${location.data.visibility.toFixed(0)}km`}
                </IOSText>
              </View>
            </Marker>
          )
        ))}
      </MapView>
      
      {/* Legend */}
      <View style={styles.legend}>
        <IOSText style={styles.legendTitle}>Intensity</IOSText>
        <View style={styles.legendGradient}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(0, 0, 255, 0.6)' }]} />
          <View style={[styles.legendColor, { backgroundColor: 'rgba(0, 255, 0, 0.6)' }]} />
          <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 255, 0, 0.6)' }]} />
          <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 0, 0, 0.6)' }]} />
        </View>
        <View style={styles.legendLabels}>
          <IOSText style={styles.legendLabel}>Low</IOSText>
          <IOSText style={styles.legendLabel}>High</IOSText>
        </View>
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <IOSText style={styles.loadingText}>Loading weather data...</IOSText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    overflow: 'hidden',
  },
  controls: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  overlayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  segmentedControl: {
    marginBottom: 8,
  },
  overlayDescription: {
    fontSize: 12,
    color: '#8E8E93',
  },
  map: {
    flex: 1,
  },
  weatherMarker: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
    minWidth: 40,
    alignItems: 'center',
  },
  weatherMarkerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  legend: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center',
  },
  legendGradient: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  legendColor: {
    flex: 1,
  },
  legendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(242, 242, 247, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});