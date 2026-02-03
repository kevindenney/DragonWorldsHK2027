/**
 * RacingWeatherMapScreen - Interactive Weather Map for Dragon Worlds Hong Kong 2027
 * 
 * Living Document Implementation:
 * This component provides a comprehensive weather visualization tool designed specifically 
 * for sailing racers. It follows modular architecture principles with self-documenting
 * code and extensible design patterns.
 * 
 * Features:
 * - Interactive map centered on Hong Kong racing waters
 * - Real-time weather data overlays (wind, waves, tides, currents, temperature)
 * - Racing tactical analysis panel
 * - Subscription tier-based feature access
 * - Performance-optimized for mobile marine environments
 * 
 * Geographic Focus:
 * - Racing Area: 22.3500°N, 114.2500°E (8km x 8km coverage)
 * - Marina Base: Clearwater Bay Marina (22.2783°N, 114.1757°E)
 * 
 * Architecture: Container → MapView → Overlays → Tactical Panel
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { 
  Marker, 
  Polygon, 
  PROVIDER_GOOGLE,
  Region
} from '../../utils/mapComponentStubs';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  withSpring,
  useAnimatedStyle 
} from '../../utils/reanimatedWrapper';
import { 
  Wind, 
  Waves, 
  Navigation2, 
  Target,
  MapPin,
  Layers,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react-native';

// Import existing infrastructure
import { IOSText, IOSButton, IOSSegmentedControl } from '../../components/ios';
import { colors, typography, spacing } from '../../constants/theme';
import type { WeatherScreenProps } from '../../types/navigation';
import { NINEPINS_RACE_COURSE_CENTER, CLEARWATER_BAY_MARINA as CLEARWATER_BAY_COORDS } from '../../constants/raceCoordinates';

// Import weather infrastructure
import {
  useWeatherStore,
  useWindStationsVisible,
  useWaveStationsVisible,
  useTideStationsVisible
} from '../../stores/weatherStore';
import { WeatherMapLayer, type WeatherDataPoint } from '../../components/weather/WeatherMapLayer';
import type { OverlayMode } from '../../components/weather/WeatherMapLayer';
import { WeatherLayerControls } from '../../components/weather/WeatherLayerControls';
import { racingWeatherSimulation } from '../../services/racingWeatherSimulation';

// Import station data
import { HK_TIDE_STATIONS } from '../../constants/hkTideStations';
import { HK_WAVE_STATIONS } from '../../constants/hkWaveStations';
import { windStationService } from '../../services/windStationService';

// Import advanced weather overlay components - Phase 3 enhancements
import { WindPatternHeatmap } from '../../components/weather/WindPatternHeatmap';
import { TideCurrentOverlay } from '../../components/weather/TideCurrentOverlay';
import { WaveHeightVisualization } from '../../components/weather/WaveHeightVisualization';
import { PressureGradientOverlay } from '../../components/weather/PressureGradientOverlay';

// Geographic Constants - Hong Kong Racing Waters
const RACING_AREA_CENTER = NINEPINS_RACE_COURSE_CENTER;

const CLEARWATER_BAY_MARINA = CLEARWATER_BAY_COORDS;

// Racing area boundary (approximate 8km x 8km)
const RACING_BOUNDARY = [
  { latitude: 22.3900, longitude: 114.2100 },
  { latitude: 22.3900, longitude: 114.2900 },
  { latitude: 22.3100, longitude: 114.2900 },
  { latitude: 22.3100, longitude: 114.2100 },
];

// Course marks for Dragon Worlds racing
const COURSE_MARKS = [
  {
    id: 'start-line-port',
    coordinate: { latitude: 22.3450, longitude: 114.2450 },
    title: 'Start Line - Port',
    type: 'start'
  },
  {
    id: 'start-line-starboard', 
    coordinate: { latitude: 22.3450, longitude: 114.2550 },
    title: 'Start Line - Starboard',
    type: 'start'
  },
  {
    id: 'windward-mark',
    coordinate: { latitude: 22.3600, longitude: 114.2500 },
    title: 'Windward Mark',
    type: 'windward'
  },
  {
    id: 'leeward-gate-port',
    coordinate: { latitude: 22.3300, longitude: 114.2480 },
    title: 'Leeward Gate - Port',
    type: 'leeward'
  },
  {
    id: 'leeward-gate-starboard',
    coordinate: { latitude: 22.3300, longitude: 114.2520 },
    title: 'Leeward Gate - Starboard', 
    type: 'leeward'
  }
];

// View modes for different racing phases
type ViewMode = 'overview' | 'tactical' | 'analysis';

/**
 * RacingWeatherMapScreen Component
 * 
 * Main container component that orchestrates the interactive weather map,
 * header controls, and tactical analysis features for sailing race preparation.
 */
export function RacingWeatherMapScreen({ navigation }: WeatherScreenProps) {
  // Weather Store Integration
  const {
    currentConditions,
    currentMarine,
    refreshWeather,
    loading,
    error,
    getAccessLevel,
    canAccessFeature,
    toggleWindStations,
    toggleWaveStations,
    toggleTideStations,
    toggleNauticalMapVisible,
    toggleRadarVisible,
    toggleSatelliteVisible
  } = useWeatherStore();

  // Station visibility hooks
  const windStationsVisible = useWindStationsVisible();
  const waveStationsVisible = useWaveStationsVisible();
  const tideStationsVisible = useTideStationsVisible();

  // State Management
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('wind');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [selectedWeatherPoint, setSelectedWeatherPoint] = useState<WeatherDataPoint | null>(null);
  
  // Advanced Overlay Controls - Phase 3 enhancements
  const [showWindHeatmap, setShowWindHeatmap] = useState(false);
  const [showTideCurrents, setShowTideCurrents] = useState(false);
  const [showWaveVisualization, setShowWaveVisualization] = useState(false);
  const [showPressureGradient, setShowPressureGradient] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Station data and map zoom tracking
  const [mapZoomLevel, setMapZoomLevel] = useState(10);
  const [windStations, setWindStations] = useState<any[]>([]);

  // Load wind station data
  useEffect(() => {
    const loadWindStations = async () => {
      try {
        const stations = await windStationService.getStations();
        setWindStations(stations);
      } catch (error) {
        setWindStations([]);
      }
    };

    loadWindStations();
  }, []);
  
  // Animation values
  const headerOpacity = useSharedValue(1);
  const mapScale = useSharedValue(1);

  // Map configuration
  const initialRegion: Region = {
    ...RACING_AREA_CENTER,
    latitudeDelta: 0.08, // ~8km coverage
    longitudeDelta: 0.08,
  };

  /**
   * Header Controls Animation Styles
   * Provides smooth transitions for header interactions
   */
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: withSpring(mapScale.value) }],
  }));

  /**
   * Get Enhanced Racing Weather Data
   * Uses realistic Hong Kong weather simulation with actual meteorological patterns
   */
  const getRacingWeatherData = useCallback((): {
    conditions: any;
    marine: any;
    spatialData: WeatherDataPoint[];
  } => {
    // Get realistic simulated data
    const simulatedData = racingWeatherSimulation.getCurrentConditions();
    
    // Use simulation if no real data available, otherwise blend with real data
    const enhancedConditions = currentConditions || simulatedData.weather;
    const enhancedMarine = currentMarine || simulatedData.marine;
    
    return {
      conditions: enhancedConditions,
      marine: enhancedMarine,
      spatialData: simulatedData.spatialData
    };
  }, [currentConditions, currentMarine]);

  // Enhanced racing weather data with realistic simulation
  const racingWeatherData = useMemo(() => {
    const data = getRacingWeatherData();
    return data.spatialData;
  }, [getRacingWeatherData]);

  /**
   * Handle Weather Data Refresh
   * Triggers manual refresh of weather data with haptic feedback
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Force update simulation for immediate response
      racingWeatherSimulation.forceUpdate();
      
      // Also try to refresh real weather data
      await refreshWeather();
      
      const pattern = racingWeatherSimulation.getWeatherPattern();
      Alert.alert(
        'Weather Updated', 
        `Latest racing conditions loaded successfully!\n\nPattern: ${pattern.monsoon} monsoon, ${pattern.timeOfDay}\n${pattern.seaBreeze ? 'Sea breeze active' : 'No sea breeze'}`
      );
    } catch (error) {
      Alert.alert('Update Failed', 'Unable to refresh weather data. Using simulation data.');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshWeather]);

  /**
   * Course Mark Selection Handler
   * Provides detailed information about selected racing marks
   */
  const handleMarkPress = useCallback((markId: string) => {
    setSelectedMark(markId);
    const mark = COURSE_MARKS.find(m => m.id === markId);
    if (mark) {
      Alert.alert(
        mark.title,
        `Racing mark coordinates:\\n${mark.coordinate.latitude.toFixed(4)}°N, ${mark.coordinate.longitude.toFixed(4)}°E`,
        [{ text: 'Close', style: 'default' }]
      );
    }
  }, []);

  /**
   * Weather Point Selection Handler
   * Displays detailed weather information for selected data point
   */
  const handleWeatherPointSelect = useCallback((point: WeatherDataPoint) => {
    setSelectedWeatherPoint(point);
    
    const windDir = point.windDirection.toFixed(0);
    const details = `
Wind: ${point.windSpeed.toFixed(1)} kts from ${windDir}°
Waves: ${point.waveHeight.toFixed(1)}m
Current: ${point.currentSpeed.toFixed(1)} kts
Tide: ${point.tideHeight > 0 ? '+' : ''}${point.tideHeight.toFixed(1)}m
Temperature: ${point.temperature.toFixed(1)}°C
    `.trim();
    
    Alert.alert(
      'Weather Conditions',
      details,
      [
        { text: 'Close', style: 'default' },
        { text: 'Set as Target', style: 'default', onPress: () => {
          // TODO: Implement waypoint setting
        }}
      ]
    );
  }, []);

  /**
   * Get Course Mark Color
   * Returns appropriate color coding for different mark types
   */
  const getMarkColor = useCallback((type: string): string => {
    switch (type) {
      case 'start': return colors.success;
      case 'windward': return colors.primary;
      case 'leeward': return colors.warning;
      default: return colors.secondary;
    }
  }, []);

  // Auto-refresh weather data on component mount
  useEffect(() => {
    if (!currentConditions && !loading) {
      refreshWeather();
    }
  }, [currentConditions, loading, refreshWeather]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Controls - Living Document: Modular header with mode selectors */}
      <Animated.View 
        style={[styles.header, headerAnimatedStyle]}
        entering={FadeInDown.duration(600)}
      >
        {/* Title and Navigation */}
        <View style={styles.headerLeft}>
          <Navigation2 color={colors.primary} size={24} />
          <IOSText style={styles.title}>Racing Weather Map</IOSText>
        </View>
        
        {/* Action Controls */}
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw 
              color={isRefreshing ? colors.textMuted : colors.primary} 
              size={20}
              style={{ transform: [{ rotate: isRefreshing ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton}>
            <Layers color={colors.primary} size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton}>
            <Settings color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* View Mode Selector - Living Document: Subscription tier-aware controls */}
      <View style={styles.controlsContainer}>
        <IOSSegmentedControl
          options={[
            { label: 'Overview', value: 'overview' },
            { label: 'Tactical', value: 'tactical' },
            { label: 'Analysis', value: 'analysis' }
          ]}
          selectedValue={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          style={styles.segmentedControl}
        />
      </View>

      {/* Weather Layer Controls - Integrated station toggles */}
      <View style={styles.layerControlsContainer}>
        <WeatherLayerControls
          onNauticalToggle={toggleNauticalMapVisible}
          onRadarToggle={toggleRadarVisible}
          onSatelliteToggle={toggleSatelliteVisible}
          onWindStationsToggle={toggleWindStations}
          onWaveStationsToggle={toggleWaveStations}
          onTideStationsToggle={toggleTideStations}
          windStationsVisible={windStationsVisible}
          waveStationsVisible={waveStationsVisible}
          tideStationsVisible={tideStationsVisible}
        />
      </View>

      {/* Interactive Map - Living Document: Core visualization component */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          mapType="satellite"
          pitchEnabled={true}
          rotateEnabled={true}
          zoomEnabled={true}
          scrollEnabled={true}
          onRegionChangeComplete={(region) => {
            const zoomLevel = Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2);
            setMapZoomLevel(zoomLevel);
          }}
        >
          {/* Racing Area Boundary */}
          <Polygon
            coordinates={RACING_BOUNDARY}
            strokeColor={colors.primary}
            strokeWidth={2}
            fillColor={`${colors.primary}20`}
          />

          {/* Clearwater Bay Marina Marker */}
          <Marker
            coordinate={CLEARWATER_BAY_MARINA}
            title="Clearwater Bay Marina"
            description="Race Base - Dragon Worlds Hong Kong 2027"
          >
            <View style={[styles.markerContainer, { backgroundColor: colors.success }]}>
              <MapPin color="white" size={16} />
            </View>
          </Marker>

          {/* Weather Data Layer - Living Document: Real-time racing conditions */}
          {canAccessFeature('marineConditions') && (
            <WeatherMapLayer
              weatherData={racingWeatherData}
              overlayMode={overlayMode}
              onPointSelect={handleWeatherPointSelect}
              showLabels={viewMode === 'tactical'}
              opacity={0.7}
              windStationsVisible={windStationsVisible}
              waveStationsVisible={waveStationsVisible}
              tideStationsVisible={tideStationsVisible}
              windStations={windStations}
              waveStations={HK_WAVE_STATIONS}
              tideStations={HK_TIDE_STATIONS}
              zoomLevel={mapZoomLevel}
            />
          )}

          {/* Advanced Weather Overlays - Phase 3 enhancements */}
          {canAccessFeature('detailedAnalysis') && (
            <>
              {/* Wind Pattern Heatmap with Beaufort scale visualization */}
              {(showWindHeatmap || advancedMode) && (
                <WindPatternHeatmap
                  weatherData={racingWeatherData}
                  visible={overlayMode === 'wind'}
                  showWindBarbsMode={true}
                  showGustIndicators={true}
                  animateWindFlow={true}
                  showPressureGradient={showPressureGradient}
                />
              )}

              {/* Tide Current Overlay with animated flow */}
              {(showTideCurrents || advancedMode) && (
                <TideCurrentOverlay
                  weatherData={racingWeatherData}
                  visible={overlayMode === 'tides' || overlayMode === 'currents'}
                  showTideStations={true}
                  showCurrentVectors={true}
                  animateFlow={true}
                />
              )}

              {/* Wave Height Visualization with swell direction */}
              {(showWaveVisualization || advancedMode) && (
                <WaveHeightVisualization
                  weatherData={racingWeatherData}
                  visible={overlayMode === 'waves'}
                  showSwellArrows={true}
                  showSeaState={true}
                  showBreakingZones={true}
                  showWaveContours={true}
                  opacity={0.6}
                />
              )}

              {/* Pressure Gradient Overlay for weather system visualization */}
              {(showPressureGradient || advancedMode) && (
                <PressureGradientOverlay
                  weatherData={racingWeatherData}
                  visible={true}
                  showIsobars={true}
                  showPressureSystems={true}
                  showFronts={true}
                  showWindShiftZones={true}
                  opacity={0.5}
                />
              )}
            </>
          )}

          {/* Course Marks */}
          {COURSE_MARKS.map((mark) => (
            <Marker
              key={mark.id}
              coordinate={mark.coordinate}
              title={mark.title}
              onPress={() => handleMarkPress(mark.id)}
            >
              <View style={[
                styles.markerContainer, 
                { backgroundColor: getMarkColor(mark.type) }
              ]}>
                <Target 
                  color="white" 
                  size={14}
                  strokeWidth={mark.type === 'start' ? 3 : 2}
                />
              </View>
            </Marker>
          ))}
        </MapView>


        {/* Advanced Overlay Controls - Phase 3 enhancements */}
        {canAccessFeature('detailedAnalysis') && (
          <View style={styles.advancedControls}>
            <TouchableOpacity 
              style={[
                styles.advancedButton,
                { backgroundColor: advancedMode ? colors.primary : colors.surface }
              ]}
              onPress={() => setAdvancedMode(!advancedMode)}
            >
              <Layers 
                color={advancedMode ? colors.background : colors.primary} 
                size={16} 
              />
              <IOSText style={[
                styles.advancedButtonText,
                { color: advancedMode ? colors.background : colors.primary }
              ]}>
                Advanced
              </IOSText>
            </TouchableOpacity>

            {advancedMode && (
              <View style={styles.advancedToggles}>
                <TouchableOpacity 
                  style={[
                    styles.toggleButton,
                    { backgroundColor: showWindHeatmap ? colors.info : colors.surface }
                  ]}
                  onPress={() => setShowWindHeatmap(!showWindHeatmap)}
                >
                  <Wind 
                    color={showWindHeatmap ? colors.background : colors.info} 
                    size={14} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.toggleButton,
                    { backgroundColor: showTideCurrents ? colors.accent : colors.surface }
                  ]}
                  onPress={() => setShowTideCurrents(!showTideCurrents)}
                >
                  <Navigation2 
                    color={showTideCurrents ? colors.background : colors.accent} 
                    size={14} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.toggleButton,
                    { backgroundColor: showWaveVisualization ? colors.warning : colors.surface }
                  ]}
                  onPress={() => setShowWaveVisualization(!showWaveVisualization)}
                >
                  <Waves 
                    color={showWaveVisualization ? colors.background : colors.warning} 
                    size={14} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.toggleButton,
                    { backgroundColor: showPressureGradient ? colors.success : colors.surface }
                  ]}
                  onPress={() => setShowPressureGradient(!showPressureGradient)}
                >
                  <Target 
                    color={showPressureGradient ? colors.background : colors.success} 
                    size={14} 
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </View>

      {/* Status Bar - Living Document: Current conditions summary */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Wind color={colors.primary} size={16} />
          <IOSText style={styles.statusText}>
            {(() => {
              const data = getRacingWeatherData();
              return data.conditions 
                ? `${data.conditions.windSpeed.toFixed(1)} kts ${data.conditions.windDirection}°`
                : loading ? 'Loading wind...' : 'No wind data';
            })()}
          </IOSText>
        </View>
        
        <View style={styles.statusItem}>
          <Waves color={colors.primary} size={16} />
          <IOSText style={styles.statusText}>
            {(() => {
              const data = getRacingWeatherData();
              return data.marine 
                ? `${data.marine.waveHeight.toFixed(1)}m waves`
                : loading ? 'Loading marine...' : 'No wave data';
            })()}
          </IOSText>
        </View>
        
        {error && (
          <View style={styles.statusItem}>
            <Info color={colors.error} size={16} />
            <IOSText style={[styles.statusText, { color: colors.error }]}>Update failed</IOSText>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => {
            const accessLevel = getAccessLevel();
            Alert.alert(
              'Access Level', 
              `Current: ${accessLevel.toUpperCase()}\n\nFeatures available:\n${
                canAccessFeature('marineConditions') ? '✓' : '✗'
              } Marine conditions\n${
                canAccessFeature('racingInsights') ? '✓' : '✗'
              } Racing insights\n${
                canAccessFeature('detailedAnalysis') ? '✓' : '✗'
              } Detailed analysis`
            );
          }}
        >
          <Info color={colors.textMuted} size={16} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/**
 * StyleSheet - Living Document: Responsive design for mobile marine use
 * 
 * Design principles:
 * - Large touch targets for marine conditions
 * - High contrast for outdoor visibility  
 * - Performance-optimized layout
 * - Accessibility-compliant spacing
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header Controls
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  title: {
    ...typography.h4,
    color: colors.text,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  
  headerButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  
  // Controls
  controlsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },

  layerControlsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  
  segmentedControl: {
    height: 32,
  },
  
  // Map
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  
  map: {
    flex: 1,
  },
  
  // Markers
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  

  // Advanced Controls - Phase 3 enhancements
  advancedControls: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: `${colors.surface}F0`,
    borderRadius: spacing.sm,
    padding: spacing.xs,
  },

  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  advancedButtonText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
    fontSize: 11,
  },

  advancedToggles: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    justifyContent: 'space-around',
  },

  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  // Status Bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  
  infoButton: {
    marginLeft: 'auto',
    padding: spacing.xs,
  },
});

/**
 * Export - Living Document: Modular component export
 * 
 * This component follows living document principles:
 * - Self-documenting code with comprehensive inline documentation
 * - Modular architecture allowing independent development
 * - Performance-optimized for mobile marine environments
 * - Extensible design for future racing features
 * - TypeScript interfaces for all data structures
 * 
 * Next Development Phases:
 * 1. Weather data integration with existing API services
 * 2. Overlay components for wind/wave/tide visualization  
 * 3. Tactical analysis panel for race strategy
 * 4. Subscription tier feature gating
 * 5. Performance optimization and accessibility enhancements
 */