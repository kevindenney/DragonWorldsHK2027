import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Filter } from 'lucide-react-native';

import { SailingLocationMarker } from '../components/maps/SailingLocationMarker';
import { LocationDetailModal } from '../components/maps/LocationDetailModal';
import { IOSSegmentedControl } from '../components/ios';
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

export const MapScreen: React.FC<MapScreenProps> = ({ navigation, route }) => {
  const mapRef = useRef<MapView>(null);
  const [selectedFilter, setSelectedFilter] = useState<SailingLocationFilter['type']>('all');
  const [selectedLocation, setSelectedLocation] = useState<SailingLocation | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
    setSelectedLocation(location);
    
    // Center map on selected location
    mapRef.current?.animateToRegion({
      ...location.coordinates,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 1000);
  };

  const handleFilterChange = (filter: SailingLocationFilter['type']) => {
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

  const getCurrentFilterLabel = () => {
    const filter = locationFilters.find(f => f.type === selectedFilter);
    return filter?.label || 'All Locations';
  };

  const getFilteredLocationCount = () => {
    return filteredLocations.length;
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={initialRegion}
          mapType="standard"
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
          onPress={(event) => {
            // Only deselect if tapping on the map itself, not on markers
            if (event.nativeEvent.action !== 'marker-press') {
              setSelectedLocation(null);
            }
          }}
        >
          {filteredLocations.map((location) => (
            <Marker
              key={location.id}
              coordinate={location.coordinates}
              onPress={() => handleLocationPress(location)}
              tracksViewChanges={false} // Optimize performance
            >
              <SailingLocationMarker
                location={location}
                isSelected={selectedLocation?.id === location.id}
                onPress={handleLocationPress}
              />
            </Marker>
          ))}
        </MapView>

        {/* Floating Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={colors.white} />
        </TouchableOpacity>

        {/* Filter Controls */}
        {showFilters && (
          <View style={styles.filterDropdown}>
            <IOSSegmentedControl
              options={locationFilters.map(filter => ({
                label: filter.label,
                value: filter.type
              }))}
              selectedValue={selectedFilter}
              onValueChange={handleFilterChange}
            />
          </View>
        )}

        {/* Map Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend</Text>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendMarker, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.legendText}>Championship HQ</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendMarker, { backgroundColor: '#2563EB' }]} />
            <Text style={styles.legendText}>Race Course</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendMarker, { backgroundColor: '#0891B2' }]} />
            <Text style={styles.legendText}>Marinas</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendMarker, { backgroundColor: '#EA580C' }]} />
            <Text style={styles.legendText}>Chandleries</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendMarker, { backgroundColor: '#D97706' }]} />
            <Text style={styles.legendText}>Gear Stores</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendMarker, { backgroundColor: '#7C3AED' }]} />
            <Text style={styles.legendText}>Hotels</Text>
          </View>

          <View style={styles.legendDivider} />
          
          <View style={styles.legendItem}>
            <View style={styles.championshipIndicator} />
            <Text style={styles.legendText}>Championship 2027</Text>
          </View>
        </View>

      </View>

      {/* Location Detail Modal */}
      {selectedLocation && (
        <LocationDetailModal
          location={selectedLocation}
          onClose={handleCloseModal}
          onNavigate={(location) => {
            // Could integrate with external navigation apps here
            console.log('Navigate to:', location.name);
          }}
          onScheduleNavigate={(date, event) => {
            // Navigate to schedule screen with specific event
            navigation.navigate('Schedule', {
              highlightDate: date,
              highlightEvent: event
            });
            setSelectedLocation(null); // Close modal after navigation
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  filterButton: {
    position: 'absolute',
    top: 50,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cardMedium,
    elevation: 8,
  },
  filterDropdown: {
    position: 'absolute',
    top: 100,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.cardMedium,
    elevation: 8,
  },
  legend: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minWidth: 160,
    ...shadows.cardMedium,
  },
  legendTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  legendText: {
    ...typography.caption,
    color: colors.text,
  },
  legendDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  championshipIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginRight: spacing.sm,
  },
});