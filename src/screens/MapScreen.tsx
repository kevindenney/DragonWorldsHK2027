import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, TextInput, ScrollView, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { Filter, Crosshair, Search, X } from 'lucide-react-native';

// Import WebView map for Android fallback
import { MapScreen as WebViewMapScreen } from './MapScreenSafe';

import { SailingLocationMarker } from '../components/maps/SailingLocationMarker';
import { LocationDetailModal } from '../components/maps/LocationDetailModal';
import { FloatingBackButton } from '../components/navigation/FloatingBackButton';
import { haptics } from '../utils/haptics';
import {
  sailingLocations,
  locationFilters,
  getLocationsByType,
  getLocationById
} from '../data/sailingLocations';
import {
  SailingLocation,
  SailingLocationFilter
} from '../types/sailingLocation';
import { dragonChampionshipsLightTheme } from '../constants/dragonChampionshipsTheme';
import type { MapScreenProps } from '../types/navigation';

const { colors, spacing, typography, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width, height } = Dimensions.get('window');

// Tab bar height (64) + bottom offset (20) + safe area margin
const TAB_BAR_BOTTOM_PADDING = 100;

interface MapScreenLocalProps {
  onBack?: () => void;
}

export const MapScreen: React.FC<Partial<MapScreenProps> & MapScreenLocalProps> = (props) => {
  // Use WebView-based map on Android to avoid Google Play Services API key issues
  if ((Platform.OS as string) === 'android') {
    return <WebViewMapScreen {...props as any} />;
  }

  const { navigation: navProp, route, onBack } = props;
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<SailingLocationFilter['type']>('all');
  const [selectedLocation, setSelectedLocation] = useState<SailingLocation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SailingLocation[]>([]);

  // Get filtered locations based on current filter
  const filteredLocations = getLocationsByType(selectedFilter);

  // Hong Kong sailing area center - between RHKYC and Clearwater Bay
  const initialRegion = {
    latitude: 22.2720,
    longitude: 114.2200,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  // Handle navigation from Schedule tab with location parameter
  useEffect(() => {
    const locationId = route?.params?.locationId;
    if (locationId && mapRef.current) {
      const location = getLocationById(locationId);
      if (location) {
        // Set the location as selected
        setSelectedLocation(location);

        // Animate to the location
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            ...location.coordinates,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 1000);
        }, 500);

        // Clear filter to show all locations
        setSelectedFilter('all');
      }
    }
  }, [route?.params?.locationId]);

  const handleLocationPress = (location: SailingLocation) => {
    // Haptic feedback for marker selection
    haptics.selection();

    setSelectedLocation(location);

    // Center map on selected location
    mapRef.current?.animateToRegion({
      ...location.coordinates,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 1000);
  };

  const handleFilterChange = (filter: SailingLocationFilter['type']) => {
    // Haptic feedback for filter change
    haptics.selection();

    setSelectedFilter(filter);
    setShowFilters(false);

    // If filtering to specific type, zoom to show those locations
    const locations = getLocationsByType(filter);
    if (locations.length > 0 && mapRef.current) {
      // Calculate region to show all filtered locations
      const coordinates = locations.map(loc => loc.coordinates);
      
      if (coordinates.length === 1) {
        // Single location - zoom in close
        mapRef.current.animateToRegion({
          ...coordinates[0],
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1000);
      } else {
        // Multiple locations - fit all
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    }
  };


  const handleCloseModal = () => {
    setSelectedLocation(null);
  };

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = sailingLocations.filter(location =>
      location.name.toLowerCase().includes(lowerQuery) ||
      location.description?.toLowerCase().includes(lowerQuery) ||
      location.address?.toLowerCase().includes(lowerQuery)
    );

    setSearchResults(results);
  };

  const handleSearchResultPress = (location: SailingLocation) => {
    // Haptic feedback for search result selection
    haptics.selection();

    setSelectedLocation(location);
    setSearchQuery('');
    setShowSearch(false);

    // Center map on selected location
    mapRef.current?.animateToRegion({
      ...location.coordinates,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 1000);
  };

  // Center on user location
  const handleMyLocationPress = () => {
    // Haptic feedback for button press
    haptics.buttonPress();

    // The MapView component already handles user location with showsUserLocation
    // This button provides a manual trigger to center on user location
    if (mapRef.current) {
      // Note: In a production app, you'd get the actual user coordinates here
      // For now, we'll zoom to the initial region
      mapRef.current.animateToRegion(initialRegion, 1000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-Screen Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={initialRegion}
          mapType="standard"
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          showsBuildings={false}
          showsIndoors={false}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={false}
          rotateEnabled={true}
          onPress={(event) => {
            // Only deselect if tapping on the map itself, not on markers
            if (event.nativeEvent.action !== 'marker-press') {
              setSelectedLocation(null);
            }
          }}
        >
          {filteredLocations.map((location) => {
            const isSelected = selectedLocation?.id === location.id;
            return (
              <Marker
                key={location.id}
                coordinate={location.coordinates}
                onPress={() => handleLocationPress(location)}
                tracksViewChanges={isSelected} // Track changes only for selected marker (for label)
                zIndex={isSelected ? 1000 : 1} // Bring selected marker to front
              >
                <SailingLocationMarker
                  location={location}
                  isSelected={isSelected}
                />
              </Marker>
            );
          })}
        </MapView>

        {/* Back Button - always show, use navigation.goBack() as fallback when no onBack prop */}
        <FloatingBackButton onPress={onBack || (() => navigation?.goBack())} />

        {/* Top Floating Buttons */}
        <View style={[styles.topButtonsContainer, { top: insets.top + 8 }]}>
          {/* Filter Button */}
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={colors.primary} />
            <Text style={styles.topButtonText}>
              {selectedFilter === 'all' ? 'Filters' : locationFilters.find(f => f.type === selectedFilter)?.label}
            </Text>
          </TouchableOpacity>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Search size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* My Location Button */}
        <TouchableOpacity
          style={[styles.myLocationButton, { bottom: TAB_BAR_BOTTOM_PADDING }]}
          onPress={handleMyLocationPress}
        >
          <Crosshair size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        >
          <View style={[styles.filterModal, { top: insets.top + 60 }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.filterModalTitle}>Filter Locations</Text>

            <ScrollView style={styles.filterOptions}>
              {locationFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.type}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter.type && styles.filterOptionSelected
                  ]}
                  onPress={() => {
                    handleFilterChange(filter.type);
                    setShowFilters(false);
                  }}
                >
                  <View style={styles.filterOptionContent}>
                    <Text style={[
                      styles.filterOptionLabel,
                      selectedFilter === filter.type && styles.filterOptionLabelSelected
                    ]}>
                      {filter.label}
                    </Text>
                    <Text style={styles.filterOptionDescription}>
                      {filter.description}
                    </Text>
                  </View>
                  {selectedFilter === filter.type && (
                    <View style={styles.filterCheckmark} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSearch(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSearch(false)}
        >
          <View style={[styles.searchModal, { top: insets.top + 60 }]} onStartShouldSetResponder={() => true}>
            <View style={styles.searchBar}>
              <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search venues, locations..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            {searchQuery.length > 0 && searchResults.length > 0 && (
              <ScrollView style={styles.searchResultsScroll}>
                {searchResults.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={styles.searchResultItem}
                    onPress={() => handleSearchResultPress(location)}
                  >
                    <Text style={styles.searchResultName}>{location.name}</Text>
                    <Text style={styles.searchResultType} numberOfLines={1}>
                      {location.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {searchQuery.length > 0 && searchResults.length === 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No venues found</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Location Detail Modal */}
      {selectedLocation && (
        <LocationDetailModal
          location={selectedLocation}
          onClose={handleCloseModal}
          onScheduleNavigate={(date, event, championship) => {
            // Navigate to Schedule screen with championship, then close modal
            navigation.navigate('MainTabs', {
              screen: 'Schedule',
              params: {
                date: date,
                eventId: event,
                championship: championship
              }
            });
            setTimeout(() => {
              setSelectedLocation(null);
            }, 100);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Map (Full-screen)
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Top Floating Buttons
  topButtonsContainer: {
    position: 'absolute',
    left: 60, // Account for back button
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    zIndex: 100,
  },
  topButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...shadows.cardMedium,
    elevation: 8,
    gap: 6,
  },
  topButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // Filter Modal
  filterModal: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    maxHeight: height * 0.7,
    ...shadows.cardLarge,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  filterOptions: {
    maxHeight: height * 0.6,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  filterOptionSelected: {
    backgroundColor: colors.primaryLight || '#E3F2FD',
  },
  filterOptionContent: {
    flex: 1,
  },
  filterOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  filterOptionLabelSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  filterOptionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },

  // Search Modal
  searchModal: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    maxHeight: height * 0.7,
    ...shadows.cardLarge,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  searchResultsScroll: {
    maxHeight: height * 0.5,
  },
  searchResultItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  searchResultType: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  noResults: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 15,
    color: colors.textSecondary,
  },

  // My Location Button (Bottom-right)
  myLocationButton: {
    position: 'absolute',
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cardMedium,
    elevation: 8,
  },
});