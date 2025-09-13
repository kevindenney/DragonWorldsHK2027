/**
 * LocationPickerModal Component
 * 
 * Living Document Implementation:
 * Comprehensive location selection modal inspired by Google Weather's "Choose area" 
 * functionality, enhanced for marine weather applications. Provides multiple input 
 * methods optimized for sailing and racing locations.
 * 
 * Features:
 * - Interactive map selection with tap-to-place markers
 * - Location search with autocomplete for place names
 * - Manual coordinate entry for precise racing marks
 * - Recent and favorite locations management
 * - Hong Kong racing waters as default region
 * - Marine-specific location categories (marinas, race areas, harbors)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Keyboard,
  Dimensions
} from 'react-native';
import MapView, { 
  Marker, 
  PROVIDER_GOOGLE, 
  Region,
  MapPressEvent 
} from 'react-native-maps';
import { 
  MapPin, 
  Search, 
  Navigation, 
  X, 
  Check, 
  Star,
  Clock,
  Anchor,
  Target,
  Globe
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IOSModal, IOSText, IOSButton, IOSSegmentedControl } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  id: string;
  name: string;
  coordinate: LocationCoordinate;
  type: 'marina' | 'race-area' | 'harbor' | 'city' | 'custom';
  description?: string;
  country?: string;
  region?: string;
  lastUsed?: string;
  isFavorite?: boolean;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  currentLocation?: LocationData;
  title?: string;
}

// Hong Kong sailing locations - updated set for dropdown
const DEFAULT_LOCATIONS: LocationData[] = [
  {
    id: 'clearwater-bay-race-area',
    name: 'Clearwater Bay Race Area',
    coordinate: { latitude: 22.255796757885822, longitude: 114.32596534115692 },
    type: 'race-area',
    description: 'Dragon Worlds 2027 center of race area',
    country: 'Hong Kong',
    region: 'South China Sea'
  },
  {
    id: 'victoria-harbor',
    name: 'Victoria Harbor',
    coordinate: { latitude: 22.303612873304136, longitude: 114.20317897832376 },
    type: 'harbor',
    description: 'Hong Kong\'s iconic harbor',
    country: 'Hong Kong'
  },
  {
    id: 'shelter-cove',
    name: 'Shelter Cove',
    coordinate: { latitude: 22.340971816349295, longitude: 114.28637430456698 },
    type: 'harbor',
    description: 'Shelter Cove waters',
    country: 'Hong Kong'
  },
  {
    id: 'middle-island',
    name: 'Middle Island',
    coordinate: { latitude: 22.232366382833174, longitude: 114.17859939894664 },
    type: 'harbor',
    description: 'Waters near Middle Island',
    country: 'Hong Kong'
  },
  {
    id: 'hung-hom',
    name: 'Hung Hom',
    coordinate: { latitude: 22.176863619628413, longitude: 114.16033681486007 },
    type: 'harbor',
    description: 'Hung Hom waters',
    country: 'Hong Kong'
  }
];

type InputMode = 'map' | 'search' | 'coordinates';

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onLocationSelect,
  currentLocation,
  title = 'Choose Location'
}) => {
  // State management
  const [inputMode, setInputMode] = useState<InputMode>('search');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [recentLocations, setRecentLocations] = useState<LocationData[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<LocationData[]>([]);
  const [selectedCoordinate, setSelectedCoordinate] = useState<LocationCoordinate | null>(null);
  const [latitudeText, setLatitudeText] = useState('');
  const [longitudeText, setLongitudeText] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Map reference
  const mapRef = useRef<MapView>(null);

  // Initial region (Hong Kong racing waters)
  const initialRegion: Region = {
    latitude: 22.3500,
    longitude: 114.2500,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  /**
   * Load stored location data on mount
   */
  useEffect(() => {
    loadStoredLocations();
  }, []);

  /**
   * Load recent and favorite locations from storage
   */
  const loadStoredLocations = async () => {
    try {
      const [recentData, favoriteData] = await Promise.all([
        AsyncStorage.getItem('weather_recent_locations'),
        AsyncStorage.getItem('weather_favorite_locations')
      ]);

      if (recentData) {
        setRecentLocations(JSON.parse(recentData));
      }

      if (favoriteData) {
        setFavoriteLocations(JSON.parse(favoriteData));
      }
    } catch (error) {
      console.warn('Failed to load stored locations:', error);
    }
  };

  /**
   * Save location to recent locations
   */
  const saveToRecentLocations = async (location: LocationData) => {
    try {
      const updatedLocation = { ...location, lastUsed: new Date().toISOString() };
      const updatedRecent = [
        updatedLocation,
        ...recentLocations.filter(loc => loc.id !== location.id)
      ].slice(0, 10); // Keep only 10 recent locations

      setRecentLocations(updatedRecent);
      await AsyncStorage.setItem('weather_recent_locations', JSON.stringify(updatedRecent));
    } catch (error) {
      console.warn('Failed to save recent location:', error);
    }
  };

  /**
   * Toggle favorite status for a location
   */
  const toggleFavorite = async (location: LocationData) => {
    try {
      const isFavorite = favoriteLocations.some(fav => fav.id === location.id);
      let updatedFavorites: LocationData[];

      if (isFavorite) {
        updatedFavorites = favoriteLocations.filter(fav => fav.id !== location.id);
      } else {
        updatedFavorites = [...favoriteLocations, { ...location, isFavorite: true }];
      }

      setFavoriteLocations(updatedFavorites);
      await AsyncStorage.setItem('weather_favorite_locations', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.warn('Failed to update favorite locations:', error);
    }
  };

  /**
   * Perform location search using geocoding
   * In a real implementation, this would use a geocoding service
   */
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Simulate search results - in production, use actual geocoding API
      const filteredDefaults = DEFAULT_LOCATIONS.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        (location.description && location.description.toLowerCase().includes(query.toLowerCase()))
      );

      // Add simulated search results for common sailing locations
      const simulatedResults: LocationData[] = [];
      
      if (query.toLowerCase().includes('singapore')) {
        simulatedResults.push({
          id: 'singapore-sailing',
          name: 'Singapore Sailing Federation',
          coordinate: { latitude: 1.2429, longitude: 103.8278 },
          type: 'marina',
          country: 'Singapore'
        });
      }

      if (query.toLowerCase().includes('sydney')) {
        simulatedResults.push({
          id: 'sydney-harbour',
          name: 'Sydney Harbour',
          coordinate: { latitude: -33.8568, longitude: 151.2153 },
          type: 'harbor',
          country: 'Australia'
        });
      }

      setSearchResults([...filteredDefaults, ...simulatedResults]);
    } catch (error) {
      console.warn('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Handle search text changes with debouncing
   */
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      performSearch(searchText);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchText, performSearch]);

  /**
   * Handle map press for location selection
   */
  const handleMapPress = (event: MapPressEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedCoordinate(coordinate);
    setLatitudeText(coordinate.latitude.toFixed(6));
    setLongitudeText(coordinate.longitude.toFixed(6));
  };

  /**
   * Handle coordinate input validation and parsing
   */
  const handleCoordinateSelect = () => {
    const lat = parseFloat(latitudeText);
    const lon = parseFloat(longitudeText);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values.');
      return;
    }

    const customLocation: LocationData = {
      id: `custom-${Date.now()}`,
      name: `Custom Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      coordinate: { latitude: lat, longitude: lon },
      type: 'custom',
      description: 'Custom coordinates'
    };

    handleLocationSelect(customLocation);
  };

  /**
   * Handle location selection and close modal
   */
  const handleLocationSelect = (location: LocationData) => {
    saveToRecentLocations(location);
    onLocationSelect(location);
    onClose();
  };

  /**
   * Get location type icon
   */
  const getLocationTypeIcon = (type: LocationData['type']) => {
    switch (type) {
      case 'marina': return <Anchor size={16} color={colors.primary} />;
      case 'race-area': return <Target size={16} color={colors.accent} />;
      case 'harbor': return <Navigation size={16} color={colors.info} />;
      case 'city': return <Globe size={16} color={colors.secondary} />;
      default: return <MapPin size={16} color={colors.textMuted} />;
    }
  };

  /**
   * Render location item
   */
  const renderLocationItem = (location: LocationData, showFavoriteButton = true) => {
    const isFavorite = favoriteLocations.some(fav => fav.id === location.id);

    return (
      <TouchableOpacity
        key={location.id}
        style={styles.locationItem}
        onPress={() => handleLocationSelect(location)}
      >
        <View style={styles.locationItemLeft}>
          {getLocationTypeIcon(location.type)}
          <View style={styles.locationInfo}>
            <IOSText style={styles.locationName}>{location.name}</IOSText>
            {location.description && (
              <IOSText style={styles.locationDescription}>{location.description}</IOSText>
            )}
            <IOSText style={styles.locationCoordinates}>
              {location.coordinate.latitude.toFixed(4)}, {location.coordinate.longitude.toFixed(4)}
            </IOSText>
          </View>
        </View>

        {showFavoriteButton && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(location)}
          >
            <Star 
              size={20} 
              color={isFavorite ? colors.warning : colors.textMuted}
              fill={isFavorite ? colors.warning : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <IOSModal visible={visible} onClose={onClose} title={title}>
      <View style={styles.container}>
        {/* Input Mode Selector */}
        <View style={styles.modeSelector}>
          <IOSSegmentedControl
            options={[
              { label: 'Search', value: 'search' },
              { label: 'Map', value: 'map' },
              { label: 'Coordinates', value: 'coordinates' }
            ]}
            selectedValue={inputMode}
            onValueChange={(value) => setInputMode(value as InputMode)}
            style={styles.segmentedControl}
          />
        </View>

        {/* Search Mode */}
        {inputMode === 'search' && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for places, marinas, racing areas..."
                value={searchText}
                onChangeText={setSearchText}
                autoFocus={true}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.section}>
                  <IOSText style={styles.sectionTitle}>Search Results</IOSText>
                  {searchResults.map(location => renderLocationItem(location))}
                </View>
              )}

              {/* Recent Locations */}
              {recentLocations.length > 0 && searchText.length === 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Clock size={16} color={colors.textMuted} />
                    <IOSText style={styles.sectionTitle}>Recent</IOSText>
                  </View>
                  {recentLocations.slice(0, 5).map(location => renderLocationItem(location))}
                </View>
              )}

              {/* Favorite Locations */}
              {favoriteLocations.length > 0 && searchText.length === 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Star size={16} color={colors.warning} />
                    <IOSText style={styles.sectionTitle}>Favorites</IOSText>
                  </View>
                  {favoriteLocations.map(location => renderLocationItem(location, false))}
                </View>
              )}

              {/* Default Locations */}
              {searchText.length === 0 && (
                <View style={styles.section}>
                  <IOSText style={styles.sectionTitle}>Hong Kong Sailing</IOSText>
                  {DEFAULT_LOCATIONS.map(location => renderLocationItem(location))}
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Map Mode */}
        {inputMode === 'map' && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={initialRegion}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {selectedCoordinate && (
                <Marker coordinate={selectedCoordinate} title="Selected Location" />
              )}
            </MapView>

            {selectedCoordinate && (
              <View style={styles.mapOverlay}>
                <View style={styles.selectedLocationInfo}>
                  <IOSText style={styles.selectedLocationText}>
                    Selected: {selectedCoordinate.latitude.toFixed(4)}, {selectedCoordinate.longitude.toFixed(4)}
                  </IOSText>
                  <IOSButton
                    title="Use This Location"
                    onPress={() => {
                      const customLocation: LocationData = {
                        id: `map-${Date.now()}`,
                        name: `Map Location (${selectedCoordinate.latitude.toFixed(4)}, ${selectedCoordinate.longitude.toFixed(4)})`,
                        coordinate: selectedCoordinate,
                        type: 'custom',
                        description: 'Selected from map'
                      };
                      handleLocationSelect(customLocation);
                    }}
                    style={styles.useLocationButton}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Coordinates Mode */}
        {inputMode === 'coordinates' && (
          <View style={styles.coordinatesContainer}>
            <IOSText style={styles.coordinatesTitle}>Enter Coordinates</IOSText>
            <IOSText style={styles.coordinatesSubtitle}>
              Precise location input for racing marks and waypoints
            </IOSText>

            <View style={styles.coordinateInputs}>
              <View style={styles.coordinateInput}>
                <IOSText style={styles.coordinateLabel}>Latitude</IOSText>
                <TextInput
                  style={styles.coordinateTextInput}
                  placeholder="22.3500"
                  value={latitudeText}
                  onChangeText={setLatitudeText}
                  keyboardType="numeric"
                />
                <IOSText style={styles.coordinateHint}>-90 to 90</IOSText>
              </View>

              <View style={styles.coordinateInput}>
                <IOSText style={styles.coordinateLabel}>Longitude</IOSText>
                <TextInput
                  style={styles.coordinateTextInput}
                  placeholder="114.2500"
                  value={longitudeText}
                  onChangeText={setLongitudeText}
                  keyboardType="numeric"
                />
                <IOSText style={styles.coordinateHint}>-180 to 180</IOSText>
              </View>
            </View>

            <IOSButton
              title="Use Coordinates"
              onPress={handleCoordinateSelect}
              disabled={!latitudeText || !longitudeText}
              style={styles.coordinateButton}
            />

            <View style={styles.coordinatePresets}>
              <IOSText style={styles.presetsTitle}>Quick Presets</IOSText>
              {DEFAULT_LOCATIONS.slice(0, 2).map(location => (
                <TouchableOpacity
                  key={location.id}
                  style={styles.presetItem}
                  onPress={() => {
                    setLatitudeText(location.coordinate.latitude.toString());
                    setLongitudeText(location.coordinate.longitude.toString());
                  }}
                >
                  <IOSText style={styles.presetName}>{location.name}</IOSText>
                  <IOSText style={styles.presetCoordinates}>
                    {location.coordinate.latitude.toFixed(4)}, {location.coordinate.longitude.toFixed(4)}
                  </IOSText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </IOSModal>
  );
};

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT * 0.8,
  },

  modeSelector: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  segmentedControl: {
    height: 32,
  },

  // Search Mode Styles
  searchContainer: {
    flex: 1,
  },

  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body1,
    color: colors.text,
  },

  searchResults: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  section: {
    marginBottom: spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },

  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  locationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  locationInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },

  locationName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
  },

  locationDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  locationCoordinates: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },

  favoriteButton: {
    padding: spacing.xs,
  },

  // Map Mode Styles
  mapContainer: {
    flex: 1,
    position: 'relative',
  },

  map: {
    flex: 1,
  },

  mapOverlay: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },

  selectedLocationInfo: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  selectedLocationText: {
    ...typography.body2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: 'monospace',
  },

  useLocationButton: {
    marginTop: spacing.sm,
  },

  // Coordinates Mode Styles
  coordinatesContainer: {
    flex: 1,
    padding: spacing.lg,
  },

  coordinatesTitle: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  coordinatesSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  coordinateInputs: {
    marginBottom: spacing.xl,
  },

  coordinateInput: {
    marginBottom: spacing.lg,
  },

  coordinateLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },

  coordinateTextInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body1,
    color: colors.text,
    fontFamily: 'monospace',
    textAlign: 'center',
  },

  coordinateHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  coordinateButton: {
    marginBottom: spacing.xl,
  },

  coordinatePresets: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.lg,
  },

  presetsTitle: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  presetItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  presetName: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
  },

  presetCoordinates: {
    ...typography.caption,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});

/**
 * Living Document Export Notes:
 * 
 * This LocationPickerModal provides comprehensive location selection capabilities:
 * 
 * - Multi-Modal Input: Search, map selection, and coordinate entry for maximum flexibility
 * - Marine Focus: Optimized for sailing locations with marina and race area categories
 * - User Experience: Recent and favorite location management with persistent storage
 * - Hong Kong Integration: Default sailing locations and racing area presets
 * - Professional Precision: Coordinate input for exact racing mark positioning
 * 
 * Future enhancements:
 * - Integration with marine chart databases for depth and hazard information
 * - Offline location database for use in areas with poor connectivity
 * - Import/export of sailing waypoint files (GPX, KML)
 * - Integration with sailing navigation apps and chart plotters
 * - Weather-aware location suggestions based on current conditions
 */