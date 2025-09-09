import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Anchor, Flag, Shield, Navigation, Building } from 'lucide-react-native';

import GarminService, { RaceAreaBoundary, SponsorLocation, GarminChartData } from '../../services/garminService';
import { useUserStore } from '../../stores/userStore';
import { IOSText } from '../ui/IOSText';
import { IOSButton } from '../ui/IOSButton';
import { IOSCard } from '../ui/IOSCard';

interface InteractiveRaceMapProps {
  showRaceAreas?: boolean;
  showSponsorLocations?: boolean;
  showNavigation?: boolean;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  selectedLocationId?: string;
  onLocationSelect?: (location: SponsorLocation | RaceAreaBoundary) => void;
}

interface MapState {
  charts: GarminChartData[];
  raceAreas: RaceAreaBoundary[];
  sponsorLocations: SponsorLocation[];
  chartAccess: {
    hasAccess: boolean;
    accessLevel: 'basic' | 'professional' | 'premium';
    availableFeatures: string[];
  };
  isLoading: boolean;
  error: string | null;
}

const { width, height } = Dimensions.get('window');

export const InteractiveRaceMap: React.FC<InteractiveRaceMapProps> = ({
  showRaceAreas = true,
  showSponsorLocations = true,
  showNavigation = false,
  initialRegion = {
    latitude: 22.2830,
    longitude: 114.1650,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  selectedLocationId,
  onLocationSelect,
}) => {
  const userStore = useUserStore();
  const garminService = useMemo(() => new GarminService(userStore), []);
  
  const [mapState, setMapState] = useState<MapState>({
    charts: [],
    raceAreas: [],
    sponsorLocations: [],
    chartAccess: {
      hasAccess: false,
      accessLevel: 'basic',
      availableFeatures: []
    },
    isLoading: true,
    error: null
  });
  
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(selectedLocationId || null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('hybrid');

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setMapState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [charts, chartAccess, raceAreas, sponsorLocations] = await Promise.all([
        garminService.getAvailableCharts(),
        garminService.getChartAccess(),
        showRaceAreas ? garminService.getRaceAreaBoundaries() : [],
        showSponsorLocations ? garminService.getSponsorLocations() : []
      ]);
      
      setMapState({
        charts,
        chartAccess,
        raceAreas,
        sponsorLocations,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to load map data:', error);
      setMapState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load map data'
      }));
    }
  };

  const handleMarkerPress = (location: SponsorLocation | RaceAreaBoundary) => {
    setSelectedMarkerId(location.id);
    onLocationSelect?.(location);
  };

  const getMarkerIcon = (type: string, sponsor?: string) => {
    switch (type) {
      case 'start_line':
      case 'finish_line':
        return <Flag size={24} color="#4CAF50" />;
      case 'mark':
        return <Anchor size={24} color="#FF9800" />;
      case 'prohibited_area':
        return <Shield size={24} color="#F44336" />;
      case 'ATM':
      case 'branch':
        return <Building size={24} color="#DC143C" />; // HSBC Red
      case 'hotel':
      case 'restaurant':
        return <Building size={24} color="#8B4513" />; // Sino Brown
      case 'service_center':
        if (sponsor === 'BMW') {
          return <Navigation size={24} color="#0066CC" />; // BMW Blue
        } else if (sponsor === 'Garmin') {
          return <MapPin size={24} color="#007CC3" />; // Garmin Blue
        }
        return <Building size={24} color="#666666" />;
      default:
        return <MapPin size={24} color="#666666" />;
    }
  };

  const getPolygonColor = (type: string) => {
    switch (type) {
      case 'start_line':
        return {
          strokeColor: '#4CAF50',
          fillColor: 'rgba(76, 175, 80, 0.2)',
          strokeWidth: 3
        };
      case 'finish_line':
        return {
          strokeColor: '#2196F3',
          fillColor: 'rgba(33, 150, 243, 0.2)',
          strokeWidth: 3
        };
      case 'prohibited_area':
        return {
          strokeColor: '#F44336',
          fillColor: 'rgba(244, 67, 54, 0.3)',
          strokeWidth: 2
        };
      case 'boundary':
        return {
          strokeColor: '#FF9800',
          fillColor: 'rgba(255, 152, 0, 0.1)',
          strokeWidth: 2
        };
      default:
        return {
          strokeColor: '#9E9E9E',
          fillColor: 'rgba(158, 158, 158, 0.1)',
          strokeWidth: 1
        };
    }
  };

  if (mapState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <IOSText style={styles.loadingText}>Loading marine charts...</IOSText>
      </View>
    );
  }

  if (mapState.error) {
    return (
      <View style={styles.errorContainer}>
        <IOSText style={styles.errorText}>{mapState.error}</IOSText>
        <IOSButton
          title="Retry"
          onPress={loadMapData}
          variant="primary"
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        showsBuildings={false}
        showsIndoors={false}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={true}
      >
        {/* Race Area Boundaries */}
        {showRaceAreas && mapState.raceAreas.map((area) => {
          if (area.coordinates.length === 1) {
            // Single point marker (race marks)
            return (
              <Marker
                key={area.id}
                coordinate={area.coordinates[0]}
                title={area.name}
                description={area.description}
                onPress={() => handleMarkerPress(area)}
              >
                <View style={[
                  styles.markerContainer,
                  selectedMarkerId === area.id && styles.selectedMarker
                ]}>
                  {getMarkerIcon(area.type)}
                </View>
              </Marker>
            );
          } else if (area.coordinates.length === 2) {
            // Line (start/finish lines)
            return (
              <Polyline
                key={area.id}
                coordinates={area.coordinates}
                {...getPolygonColor(area.type)}
              />
            );
          } else {
            // Polygon (boundaries, prohibited areas)
            return (
              <Polygon
                key={area.id}
                coordinates={area.coordinates}
                {...getPolygonColor(area.type)}
                tappable={true}
                onPress={() => handleMarkerPress(area)}
              />
            );
          }
        })}

        {/* Sponsor Locations */}
        {showSponsorLocations && mapState.sponsorLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={location.coordinates}
            title={location.name}
            description={location.address}
            onPress={() => handleMarkerPress(location)}
          >
            <View style={[
              styles.markerContainer,
              styles.sponsorMarker,
              selectedMarkerId === location.id && styles.selectedMarker
            ]}>
              {getMarkerIcon(location.type, location.sponsor)}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <IOSButton
          title={mapType === 'standard' ? 'Satellite' : mapType === 'satellite' ? 'Hybrid' : 'Standard'}
          onPress={() => {
            setMapType(prev => 
              prev === 'standard' ? 'satellite' : 
              prev === 'satellite' ? 'hybrid' : 'standard'
            );
          }}
          variant="secondary"
          size="small"
        />
      </View>

      {/* Chart Access Info */}
      {mapState.chartAccess.accessLevel !== 'basic' && (
        <IOSCard style={styles.chartAccessCard}>
          <IOSText style={styles.chartAccessTitle}>
            {mapState.chartAccess.accessLevel === 'professional' ? 'Professional Charts' : 'Premium Navigation'}
          </IOSText>
          <IOSText style={styles.chartAccessSubtitle}>
            {mapState.chartAccess.accessLevel === 'professional' 
              ? 'High-resolution racing charts active' 
              : 'VIP navigation services available'}
          </IOSText>
        </IOSCard>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <IOSText style={styles.legendTitle}>Map Legend</IOSText>
        
        {showRaceAreas && (
          <>
            <View style={styles.legendItem}>
              <Flag size={16} color="#4CAF50" />
              <IOSText style={styles.legendText}>Start/Finish Lines</IOSText>
            </View>
            <View style={styles.legendItem}>
              <Anchor size={16} color="#FF9800" />
              <IOSText style={styles.legendText}>Race Marks</IOSText>
            </View>
            <View style={styles.legendItem}>
              <Shield size={16} color="#F44336" />
              <IOSText style={styles.legendText}>Restricted Areas</IOSText>
            </View>
          </>
        )}
        
        {showSponsorLocations && (
          <>
            <View style={styles.legendItem}>
              <Building size={16} color="#DC143C" />
              <IOSText style={styles.legendText}>HSBC Services</IOSText>
            </View>
            <View style={styles.legendItem}>
              <Building size={16} color="#8B4513" />
              <IOSText style={styles.legendText}>Sino Group</IOSText>
            </View>
            <View style={styles.legendItem}>
              <Navigation size={16} color="#0066CC" />
              <IOSText style={styles.legendText}>BMW Services</IOSText>
            </View>
            <View style={styles.legendItem}>
              <MapPin size={16} color="#007CC3" />
              <IOSText style={styles.legendText}>Garmin Marine</IOSText>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height - 100, // Account for navigation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  errorText: {
    fontSize: 17,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    minWidth: 100,
  },
  markerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sponsorMarker: {
    borderColor: '#007AFF',
  },
  selectedMarker: {
    borderColor: '#FF3B30',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  mapControls: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
  },
  chartAccessCard: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 80,
    zIndex: 10,
    padding: 12,
  },
  chartAccessTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  chartAccessSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendText: {
    fontSize: 13,
    color: '#3C3C43',
    marginLeft: 8,
  },
});