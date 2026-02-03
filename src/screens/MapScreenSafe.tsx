/**
 * Safe MapScreen implementation for Expo Go
 * This version uses WebView exclusively to avoid react-native-maps issues
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Filter, MapPin } from 'lucide-react-native';
import { IOSSegmentedControl } from '../components/ios';
import { LocationDetailModal } from '../components/maps/LocationDetailModal';
import {
  sailingLocations,
  locationFilters,
  getLocationsByType
} from '../data/sailingLocations';
import {
  SailingLocation,
  SailingLocationFilter
} from '../types/sailingLocation';
import { dragonChampionshipsLightTheme } from '../constants/dragonChampionshipsTheme';
import type { MapScreenProps } from '../types/navigation';
import WeatherConditionsOverlay from '../components/weather/WeatherConditionsOverlay';

const { colors, spacing, typography, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width, height } = Dimensions.get('window');


export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState<SailingLocationFilter['type']>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SailingLocation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Split filters into two logical groups
  const primaryFilters = locationFilters.filter(filter =>
    ['all', 'championship', 'marinas', 'stores'].includes(filter.type)
  );
  const secondaryFilters = locationFilters.filter(filter =>
    ['accommodation', 'spectator', 'tourism'].includes(filter.type)
  );

  // Get filtered locations based on current filter
  const filteredLocations = getLocationsByType(selectedFilter);

  const handleFilterChange = (filter: SailingLocationFilter['type']) => {
    setSelectedFilter(filter);
    setShowFilters(false);
  };

  const getCurrentFilterLabel = () => {
    const filter = locationFilters.find(f => f.type === selectedFilter);
    return filter?.label || 'All Locations';
  };

  const generateMapHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
          #map { height: 100vh; width: 100%; }
          .location-info {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: none;
            z-index: 1000;
          }
          .location-info.active { display: block; }
          .location-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 4px;
          }
          .location-type {
            font-size: 14px;
            color: #666;
            text-transform: capitalize;
          }
          .close-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 24px;
            height: 24px;
            background: #f0f0f0;
            border-radius: 50%;
            border: none;
            font-size: 16px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div id="locationInfo" class="location-info">
          <button class="close-btn" onclick="closeInfo()">×</button>
          <div class="location-title" id="locationTitle"></div>
          <div class="location-type" id="locationType"></div>
        </div>
        <script>
          let map;
          let markers = [];
          let selectedMarker = null;

          function initMap() {
            // Hong Kong sailing area center
            const center = { lat: 22.2720, lng: 114.2200 };

            map = new google.maps.Map(document.getElementById("map"), {
              zoom: 12,
              center: center,
              mapTypeId: "roadmap",
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              scaleControl: true,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: false
            });

            // Add sailing locations as markers
            const locations = ${JSON.stringify(filteredLocations)};


            // Helper function to create SVG circle marker
            function createSVGCircle(color) {
              const svg = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="' + color + '" />' +
                '</svg>';
              return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
            }

            locations.forEach((location, index) => {
              const markerColor = {
                'championship_hq': '#DC2626',    // Red - Championship HQ
                'race_course': '#2563EB',         // Blue - Race Course
                'venue': '#2563EB',               // Blue - Championship Venues
                'marina': '#0891B2',              // Cyan - Marinas
                'yacht_club': '#0891B2',          // Cyan - Yacht Clubs
                'chandlery': '#EA580C',           // Orange - Chandleries
                'gear_store': '#D97706',          // Amber - Gear Stores
                'hotel': '#7C3AED',               // Purple - Hotels
                'spectator_point': '#10B981',     // Green - Spectator Points
                'tourism': '#EC4899'              // Pink - Tourism Attractions
              }[location.type] || '#6B7280';


              // Create marker with SVG icon instead of SymbolPath
              const markerOptions = {
                position: {
                  lat: location.coordinates.latitude,
                  lng: location.coordinates.longitude
                },
                map: map,
                title: location.name,
                icon: {
                  url: createSVGCircle(markerColor),
                  scaledSize: new google.maps.Size(24, 24),
                  anchor: new google.maps.Point(12, 12)
                }
              };

              // Only add labels for primary locations to reduce clutter
              if (location.importance === 'primary') {
                markerOptions.label = {
                  text: location.name.split(' ')[0], // First word only
                  color: '#000000',
                  fontSize: '10px',
                  fontWeight: 'bold'
                };
              }

              const marker = new google.maps.Marker(markerOptions);

              marker.addListener('click', () => {
                showLocationInfo(location);
                selectedMarker = marker;
              });

              markers.push(marker);
            });


            // Fit bounds to show all markers
            if (locations.length > 0) {
              const bounds = new google.maps.LatLngBounds();
              locations.forEach(loc => {
                bounds.extend(new google.maps.LatLng(
                  loc.coordinates.latitude,
                  loc.coordinates.longitude
                ));
              });
              map.fitBounds(bounds, { padding: 50 });
            }
          }

          function showLocationInfo(location) {
            document.getElementById('locationTitle').textContent = location.name;
            document.getElementById('locationType').textContent = location.type.replace('-', ' ');
            document.getElementById('locationInfo').classList.add('active');

            // Send message to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'locationSelected',
              location: location
            }));
          }

          function closeInfo() {
            document.getElementById('locationInfo').classList.remove('active');
            selectedMarker = null;

            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'locationDeselected'
            }));
          }

        </script>
        <script async defer
          src="https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&callback=initMap">
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      {/* Map Container */}
      <View style={styles.mapContainer}>
        <WebView
          style={styles.map}
          source={{ html: generateMapHTML() }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'locationSelected') {
                setSelectedLocation(data.location);
                setShowDetailModal(true);
              } else if (data.type === 'locationDeselected') {
                setSelectedLocation(null);
                setShowDetailModal(false);
              }
            } catch (error) {
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />

        {/* Legend Overlay */}
        <ScrollView style={styles.legendContainer} showsVerticalScrollIndicator={false}>
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

            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: '#EC4899' }]} />
              <Text style={styles.legendText}>Tourism</Text>
            </View>
          </View>
        </ScrollView>

        {/* Floating Filter Button */}
        <TouchableOpacity
          style={styles.floatingFilterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Floating Filter Panel */}
        {showFilters && (
          <View style={styles.floatingFilterPanel}>
            <View style={styles.filterPanelHeader}>
              <Text style={styles.filterPanelTitle}>Filter Locations</Text>
              <Text style={styles.filterPanelSubtitle}>
                {getCurrentFilterLabel()} ({filteredLocations.length})
              </Text>
            </View>

            {/* Primary Filters Row */}
            <IOSSegmentedControl
              options={primaryFilters.map(filter => ({
                label: filter.label,
                value: filter.type
              }))}
              selectedValue={primaryFilters.some(f => f.type === selectedFilter) ? selectedFilter : ''}
              onValueChange={handleFilterChange}
              style={styles.segmentedControl}
            />

            {/* Secondary Filters Row */}
            <IOSSegmentedControl
              options={secondaryFilters.map(filter => ({
                label: filter.label,
                value: filter.type
              }))}
              selectedValue={secondaryFilters.some(f => f.type === selectedFilter) ? selectedFilter : ''}
              onValueChange={handleFilterChange}
              style={[styles.segmentedControl, styles.secondaryFilterRow]}
            />
          </View>
        )}
      </View>

      {/* Location Detail Modal */}
      {selectedLocation && showDetailModal && (
        <LocationDetailModal
          location={selectedLocation}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLocation(null);
          }}
          onScheduleNavigate={(date, eventId) => {
            // TODO: Implement navigation to schedule screen
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
  floatingFilterButton: {
    position: 'absolute',
    top: spacing.xxl + 20,
    right: spacing.lg,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cardLarge,
    zIndex: 1000,
  },
  floatingFilterPanel: {
    position: 'absolute',
    top: spacing.xxl + 20,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.cardLarge,
    zIndex: 999,
  },
  filterPanelHeader: {
    marginBottom: spacing.md,
  },
  filterPanelTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
  },
  filterPanelSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  segmentedControl: {
    marginTop: spacing.sm,
  },
  secondaryFilterRow: {
    marginTop: spacing.xs,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  legendContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    maxHeight: 200,
  },
  legend: {
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
});


export default MapScreen;