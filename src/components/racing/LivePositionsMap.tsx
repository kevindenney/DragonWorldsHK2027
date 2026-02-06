import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Animated 
} from 'react-native';
import MapView, { 
  Marker, 
  Polyline, 
  Circle,
  PROVIDER_APPLE 
} from '../../utils/mapComponentStubs';
import { 
  Crosshair, 
  Maximize2, 
  Minimize2,
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
  Wind,
  Compass,
  Layers
} from 'lucide-react-native';

import { IOSText, IOSButton, IOSBadge } from '../ios';
import type { LiveRacePosition } from '../../services/resultsService';

interface CourseMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'windward' | 'leeward' | 'finish' | 'gate';
  order: number;
}

interface LivePositionsMapProps {
  positions: LiveRacePosition[];
  courseMarkers: CourseMarker[];
  windDirection?: number; // degrees
  windSpeed?: number; // knots
  onBoatPress?: (sailNumber: string) => void;
  onCenterOnFleet?: () => void;
  showTrails?: boolean;
  mapType?: 'standard' | 'satellite' | 'hybrid';
  followLeader?: boolean;
}

interface MapSettings {
  showCourse: boolean;
  showWindIndicator: boolean;
  showLaylines: boolean;
  showTrails: boolean;
  boatLabelSize: 'small' | 'medium' | 'large';
}

export const LivePositionsMap: React.FC<LivePositionsMapProps> = ({
  positions,
  courseMarkers,
  windDirection = 0,
  windSpeed = 0,
  onBoatPress,
  onCenterOnFleet,
  showTrails = false,
  mapType = 'standard',
  followLeader = false,
}) => {
  const mapRef = useRef<{ animateToRegion?: (region: any, duration?: number) => void } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState<MapSettings>({
    showCourse: true,
    showWindIndicator: true,
    showLaylines: false,
    showTrails: showTrails,
    boatLabelSize: 'medium'
  });
  const [selectedBoat, setSelectedBoat] = useState<string | null>(null);
  const [followMode, setFollowMode] = useState(followLeader);

  // Animation for boat movements
  const [boatAnimations] = useState(new Map<string, Animated.ValueXY>());

  // Initialize animations for each boat
  useEffect(() => {
    positions.forEach(position => {
      if (!boatAnimations.has(position.sailNumber) && position.latitude !== undefined && position.longitude !== undefined) {
        boatAnimations.set(
          position.sailNumber,
          new Animated.ValueXY({
            x: position.latitude,
            y: position.longitude
          })
        );
      }
    });
  }, [positions, boatAnimations]);

  // Animate boat positions
  useEffect(() => {
    positions.forEach(position => {
      const animation = boatAnimations.get(position.sailNumber);
      if (animation && position.latitude !== undefined && position.longitude !== undefined) {
        Animated.timing(animation, {
          toValue: {
            x: position.latitude,
            y: position.longitude
          },
          duration: 2000,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [positions, boatAnimations]);

  // Follow leader mode
  useEffect(() => {
    if (followMode && positions.length > 0) {
      const leader = positions.find(p => p.position === 1);
      if (leader && mapRef.current?.animateToRegion) {
        mapRef.current.animateToRegion({
          latitude: leader.latitude,
          longitude: leader.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    }
  }, [positions, followMode]);

  const centerOnFleet = () => {
    if (positions.length === 0 || !mapRef.current) return;

    const latitudes = positions.map(p => p.latitude).filter((lat): lat is number => lat !== undefined);
    const longitudes = positions.map(p => p.longitude).filter((lng): lng is number => lng !== undefined);

    if (latitudes.length === 0 || longitudes.length === 0) return;

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.2; // Add 20% padding
    const deltaLng = (maxLng - minLng) * 1.2;

    mapRef.current?.animateToRegion?.({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(deltaLat, 0.01),
      longitudeDelta: Math.max(deltaLng, 0.01),
    }, 1000);

    onCenterOnFleet?.();
  };

  const getBoatIcon = (position: LiveRacePosition) => {
    // Return different icons based on position or status
    if (position.position === 1) return '🥇';
    if (position.position === 2) return '🥈';
    if (position.position === 3) return '🥉';
    if (position.status === 'retired') return '❌';
    if (position.status === 'finished') return '🏁';
    return '⛵';
  };

  const getBoatColor = (position: LiveRacePosition) => {
    if (position.position === 1) return '#FFD700';
    if (position.position === 2) return '#C0C0C0';
    if (position.position === 3) return '#CD7F32';
    if (position.status === 'retired') return '#FF3B30';
    if (position.status === 'finished') return '#34C759';
    return '#007AFF';
  };

  const getCourseMarkerColor = (type: string) => {
    switch (type) {
      case 'start': return '#34C759';
      case 'windward': return '#FF9500';
      case 'leeward': return '#007AFF';
      case 'finish': return '#FF3B30';
      case 'gate': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const renderBoatMarker = (position: LiveRacePosition) => (
    <Marker
      key={position.sailNumber}
      coordinate={{
        latitude: position.latitude,
        longitude: position.longitude
      }}
      onPress={() => {
        setSelectedBoat(position.sailNumber);
        onBoatPress?.(position.sailNumber);
      }}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[
        styles.boatMarker,
        { backgroundColor: getBoatColor(position) },
        selectedBoat === position.sailNumber && styles.selectedBoatMarker
      ]}>
        <IOSText style={styles.boatIcon}>
          {getBoatIcon(position)}
        </IOSText>
        {settings.boatLabelSize !== 'small' && (
          <IOSText style={[
            styles.boatLabel,
            settings.boatLabelSize === 'large' && styles.largeBoardLabel
          ]}>
            {position.sailNumber}
          </IOSText>
        )}
      </View>
      
      {/* Boat heading indicator */}
      {position.heading && (
        <View style={[
          styles.headingIndicator,
          { transform: [{ rotate: `${position.heading}deg` }] }
        ]} />
      )}
    </Marker>
  );

  const renderCourseMarkers = () =>
    courseMarkers.map(marker => (
      <Marker
        key={marker.id}
        coordinate={{
          latitude: marker.latitude,
          longitude: marker.longitude
        }}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={[
          styles.courseMarker,
          { backgroundColor: getCourseMarkerColor(marker.type) }
        ]}>
          <IOSText style={styles.courseMarkerText}>
            {marker.order}
          </IOSText>
        </View>
      </Marker>
    ));

  const renderCourseLines = () => {
    if (!settings.showCourse || courseMarkers.length < 2) return null;

    const sortedMarkers = [...courseMarkers].sort((a, b) => a.order - b.order);
    const coordinates = sortedMarkers.map(marker => ({
      latitude: marker.latitude,
      longitude: marker.longitude
    }));

    return (
      <Polyline
        coordinates={coordinates}
        strokeColor="#FF9500"
        strokeWidth={2}
        lineDashPattern={[10, 5]}
      />
    );
  };

  const renderWindIndicator = () => {
    if (!settings.showWindIndicator || !windDirection) return null;

    // Place wind indicator in top-right of map
    const validPositions = positions.filter(p => p.latitude !== undefined && p.longitude !== undefined);
    const centerLat = validPositions.length > 0 ?
      validPositions.reduce((sum, p) => sum + (p.latitude ?? 0), 0) / validPositions.length : 0;
    const centerLng = validPositions.length > 0 ?
      validPositions.reduce((sum, p) => sum + (p.longitude ?? 0), 0) / validPositions.length : 0;

    return (
      <Marker
        coordinate={{
          latitude: centerLat + 0.005, // Offset to top-right
          longitude: centerLng + 0.005
        }}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.windIndicator}>
          <Wind 
            size={20} 
            color="#007AFF" 
            style={{ transform: [{ rotate: `${windDirection}deg` }] }}
          />
          <IOSText style={styles.windSpeed}>{windSpeed}kt</IOSText>
        </View>
      </Marker>
    );
  };

  const renderBoatTrails = () => {
    if (!settings.showTrails) return null;

    return positions.map(position => {
      if (!position.trail || position.trail.length < 2) return null;

      return (
        <Polyline
          key={`trail-${position.sailNumber}`}
          coordinates={position.trail.map((point: { latitude: number; longitude: number }) => ({
            latitude: point.latitude,
            longitude: point.longitude
          }))}
          strokeColor={getBoatColor(position)}
          strokeWidth={1}
          strokeOpacity={0.6}
        />
      );
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleSetting = (setting: keyof MapSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_APPLE}
        mapType={mapType}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onPress={() => setSelectedBoat(null)}
      >
        {/* Course markers and lines */}
        {settings.showCourse && renderCourseMarkers()}
        {renderCourseLines()}
        
        {/* Boat positions */}
        {positions.map(renderBoatMarker)}
        
        {/* Boat trails */}
        {renderBoatTrails()}
        
        {/* Wind indicator */}
        {renderWindIndicator()}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <View style={styles.topControls}>
          <IOSButton
            title=""
            onPress={toggleFullscreen}
            variant="secondary"
            size="small"
            icon={isFullscreen ? <Minimize2 size={16} color="#007AFF" /> : <Maximize2 size={16} color="#007AFF" />}
            style={styles.controlButton}
          />
          
          <IOSButton
            title=""
            onPress={() => setFollowMode(!followMode)}
            variant={followMode ? "primary" : "secondary"}
            size="small"
            icon={<Crosshair size={16} color={followMode ? "#FFFFFF" : "#007AFF"} />}
            style={styles.controlButton}
          />
        </View>

        <View style={styles.bottomControls}>
          <IOSButton
            title="Center Fleet"
            onPress={centerOnFleet}
            variant="secondary"
            size="small"
            icon={<RotateCcw size={16} color="#007AFF" />}
            style={styles.centerButton}
          />
          
          <IOSButton
            title=""
            onPress={() => toggleSetting('showTrails')}
            variant={settings.showTrails ? "primary" : "secondary"}
            size="small"
            icon={settings.showTrails ? <Eye size={16} color="#FFFFFF" /> : <EyeOff size={16} color="#007AFF" />}
            style={styles.controlButton}
          />
        </View>
      </View>

      {/* Race Info Overlay */}
      {!isFullscreen && (
        <View style={styles.raceInfo}>
          <View style={styles.raceInfoContent}>
            <IOSText style={styles.raceInfoTitle}>Live Positions</IOSText>
            <IOSText style={styles.raceInfoSubtitle}>
              {positions.length} boats • Updated {new Date().toLocaleTimeString()}
            </IOSText>
          </View>
          
          <View style={styles.raceInfoStats}>
            <IOSBadge color="#34C759" size="small">
              Racing: {positions.filter(p => p.status === 'racing').length}
            </IOSBadge>
            <IOSBadge color="#007AFF" size="small">
              Finished: {positions.filter(p => p.status === 'finished').length}
            </IOSBadge>
          </View>
        </View>
      )}

      {/* Selected Boat Info */}
      {selectedBoat && (
        <View style={styles.selectedBoatInfo}>
          {(() => {
            const boat = positions.find(p => p.sailNumber === selectedBoat);
            if (!boat) return null;
            
            return (
              <View style={styles.selectedBoatContent}>
                <View style={styles.selectedBoatHeader}>
                  <IOSText style={styles.selectedBoatSail}>{boat.sailNumber}</IOSText>
                  <IOSText style={styles.selectedBoatName}>{boat.helmName}</IOSText>
                  <TouchableOpacity 
                    onPress={() => setSelectedBoat(null)}
                    style={styles.closeButton}
                  >
                    <IOSText style={styles.closeText}>×</IOSText>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.selectedBoatStats}>
                  <IOSText style={styles.statText}>
                    Position: {boat.position} • Speed: {boat.speed?.toFixed(1) || '—'} kts
                  </IOSText>
                  {boat.heading && (
                    <IOSText style={styles.statText}>
                      Heading: {Math.round(boat.heading)}°
                    </IOSText>
                  )}
                </View>
              </View>
            );
          })()}
        </View>
      )}

      {/* Settings Panel */}
      <View style={styles.settingsPanel}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => toggleSetting('showCourse')}
        >
          <Layers size={16} color={settings.showCourse ? "#007AFF" : "#8E8E93"} />
          <IOSText style={[
            styles.settingText,
            { color: settings.showCourse ? "#007AFF" : "#8E8E93" }
          ]}>
            Course
          </IOSText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => toggleSetting('showWindIndicator')}
        >
          <Wind size={16} color={settings.showWindIndicator ? "#007AFF" : "#8E8E93"} />
          <IOSText style={[
            styles.settingText,
            { color: settings.showWindIndicator ? "#007AFF" : "#8E8E93" }
          ]}>
            Wind
          </IOSText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
    position: 'relative',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    borderRadius: 0,
    zIndex: 1000,
  },
  map: {
    flex: 1,
  },

  // Boat Markers
  boatMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  selectedBoatMarker: {
    borderColor: '#FF3B30',
    borderWidth: 3,
    transform: [{ scale: 1.2 }],
  },
  boatIcon: {
    fontSize: 12,
  },
  boatLabel: {
    position: 'absolute',
    top: 32,
    fontSize: 10,
    fontWeight: '600',
    color: '#1C1C1E',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 20,
    textAlign: 'center',
  },
  largeBoardLabel: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  headingIndicator: {
    position: 'absolute',
    top: -5,
    width: 2,
    height: 10,
    backgroundColor: '#FF3B30',
  },

  // Course Markers
  courseMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  courseMarkerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Wind Indicator
  windIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  windSpeed: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 2,
  },

  // Controls
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  topControls: {
    flexDirection: 'row',
    gap: 8,
  },
  bottomControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  centerButton: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  // Race Info
  raceInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    maxWidth: 200,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  raceInfoContent: {
    marginBottom: 8,
  },
  raceInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  raceInfoSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  raceInfoStats: {
    flexDirection: 'row',
    gap: 6,
  },

  // Selected Boat Info
  selectedBoatInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedBoatContent: {
    gap: 8,
  },
  selectedBoatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedBoatSail: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 8,
  },
  selectedBoatName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  selectedBoatStats: {
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // Settings Panel
  settingsPanel: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  settingItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});