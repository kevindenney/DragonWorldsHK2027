/**
 * Safe MapScreen implementation for Expo Go
 * This version uses WebView exclusively to avoid react-native-maps issues
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { Filter, X, MapPin, Building2, Anchor, ShoppingBag, Hotel, Eye, Compass } from 'lucide-react-native';
import { LocationDetailModal } from '../components/maps/LocationDetailModal';
import {
  locationFilters,
  getLocationsByType
} from '../data/sailingLocations';
import {
  SailingLocation,
  SailingLocationFilter
} from '../types/sailingLocation';
import { dragonChampionshipsLightTheme } from '../constants/dragonChampionshipsTheme';
import type { MapScreenProps } from '../types/navigation';

// Filter configuration with colors and icons
const FILTER_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  all: { color: '#6B7280', icon: MapPin, label: 'All Venues' },
  championship: { color: '#DC2626', icon: Building2, label: 'Championship' },
  marinas: { color: '#0891B2', icon: Anchor, label: 'Marinas & Clubs' },
  stores: { color: '#EA580C', icon: ShoppingBag, label: 'Gear & Supplies' },
  accommodation: { color: '#7C3AED', icon: Hotel, label: 'Hotels' },
  spectator: { color: '#10B981', icon: Eye, label: 'Spectator Points' },
  tourism: { color: '#EC4899', icon: Compass, label: 'Tourism' },
};

const { colors, spacing, shadows } = dragonChampionshipsLightTheme;


export const MapScreen: React.FC<MapScreenProps> = () => {
  const navigation = useNavigation<any>();
  const [selectedFilter, setSelectedFilter] = useState<SailingLocationFilter['type']>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SailingLocation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get filtered locations based on current filter
  const filteredLocations = getLocationsByType(selectedFilter);

  const handleFilterChange = (filter: SailingLocationFilter['type']) => {
    setSelectedFilter(filter);
    setShowFilters(false);
  };

  const getCurrentFilterConfig = () => {
    return FILTER_CONFIG[selectedFilter] || FILTER_CONFIG.all;
  };

  // Get count for each filter type
  const getFilterCount = (filterType: string) => {
    return getLocationsByType(filterType as SailingLocationFilter['type']).length;
  };

  const generateMapHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
            const center = [22.2720, 114.2200];

            map = L.map('map', {
              center: center,
              zoom: 12,
              zoomControl: true
            });

            // Add OpenStreetMap tiles (no attribution to avoid bottom bar)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '',
              maxZoom: 19
            }).addTo(map);

            // Hide attribution control
            map.attributionControl.setPrefix('');

            // Add sailing locations as markers
            const locations = ${JSON.stringify(filteredLocations)};

            // Helper function to create circle marker icon
            function createCircleIcon(color) {
              return L.divIcon({
                className: 'custom-div-icon',
                html: '<div style="background-color: ' + color + '; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              });
            }

            locations.forEach((location) => {
              const markerColor = {
                'championship_hq': '#DC2626',
                'race_course': '#2563EB',
                'venue': '#2563EB',
                'marina': '#0891B2',
                'yacht_club': '#0891B2',
                'chandlery': '#EA580C',
                'gear_store': '#D97706',
                'hotel': '#7C3AED',
                'spectator_point': '#10B981',
                'tourism': '#EC4899'
              }[location.type] || '#6B7280';

              const marker = L.marker(
                [location.coordinates.latitude, location.coordinates.longitude],
                { icon: createCircleIcon(markerColor) }
              ).addTo(map);

              marker.on('click', () => {
                showLocationInfo(location);
                selectedMarker = marker;
              });

              markers.push(marker);
            });

            // Fit bounds to show all markers
            if (locations.length > 0) {
              const bounds = L.latLngBounds(
                locations.map(loc => [loc.coordinates.latitude, loc.coordinates.longitude])
              );
              map.fitBounds(bounds, { padding: [50, 50] });
            }
          }

          function showLocationInfo(location) {
            document.getElementById('locationTitle').textContent = location.name;
            document.getElementById('locationType').textContent = location.type.replace('-', ' ');
            document.getElementById('locationInfo').classList.add('active');

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

          document.addEventListener('DOMContentLoaded', initMap);
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

        {/* Floating Filter Chip - shows current filter */}
        <TouchableOpacity
          style={[
            styles.floatingFilterChip,
            { borderColor: getCurrentFilterConfig().color }
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <View style={[styles.filterChipDot, { backgroundColor: getCurrentFilterConfig().color }]} />
          <Text style={styles.filterChipText}>
            {getCurrentFilterConfig().label}
          </Text>
          <Text style={styles.filterChipCount}>({filteredLocations.length})</Text>
          <Filter size={16} color={colors.textSecondary} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        {/* Floating Filter Panel */}
        {showFilters && (
          <View style={styles.floatingFilterPanel}>
            {/* Header with close button */}
            <View style={styles.filterPanelHeader}>
              <Text style={styles.filterPanelTitle}>Filter Venues</Text>
              <TouchableOpacity
                style={styles.filterCloseButton}
                onPress={() => setShowFilters(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Filter Options */}
            <View style={styles.filterOptionsGrid}>
              {locationFilters.map((filter) => {
                const config = FILTER_CONFIG[filter.type] || FILTER_CONFIG.all;
                const IconComponent = config.icon;
                const isSelected = selectedFilter === filter.type;
                const count = getFilterCount(filter.type);

                return (
                  <TouchableOpacity
                    key={filter.type}
                    style={[
                      styles.filterOption,
                      isSelected && { backgroundColor: config.color + '15', borderColor: config.color }
                    ]}
                    onPress={() => handleFilterChange(filter.type as SailingLocationFilter['type'])}
                  >
                    <View style={styles.filterOptionTop}>
                      <View style={[styles.filterIconContainer, { backgroundColor: config.color + '20' }]}>
                        <IconComponent size={18} color={config.color} />
                      </View>
                      <Text style={[
                        styles.filterCount,
                        isSelected && { color: config.color }
                      ]}>
                        {count}
                      </Text>
                    </View>
                    <Text style={[
                      styles.filterLabel,
                      isSelected && { color: config.color, fontWeight: '600' }
                    ]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
            // Navigate to Schedule screen first
            navigation.navigate('MainTabs', {
              screen: 'Schedule',
              params: {
                date: date,
                eventId: eventId
              }
            });
            // Close modal after navigation is triggered
            setTimeout(() => {
              setShowDetailModal(false);
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
  floatingFilterChip: {
    position: 'absolute',
    top: 110, // Below the zoom controls
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    ...shadows.cardMedium,
    zIndex: 1000,
  },
  filterChipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  filterChipText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  floatingFilterPanel: {
    position: 'absolute',
    top: 110, // Below the zoom controls
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadows.cardLarge,
    zIndex: 999,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#E5E5E5',
  },
  filterPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  filterCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterOption: {
    width: '31%',
    marginHorizontal: '1%',
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterOptionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
});


export default MapScreen;