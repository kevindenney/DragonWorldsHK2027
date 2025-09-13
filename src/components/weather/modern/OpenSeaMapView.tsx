import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { 
  UrlTile, 
  MapType, 
  Region,
  PROVIDER_DEFAULT 
} from 'react-native-maps';

interface OpenSeaMapViewProps {
  initialRegion?: Region;
  showSeamarks?: boolean;
  showDepthContours?: boolean;
  showHarbors?: boolean;
  mapType?: MapType;
  onRegionChange?: (region: Region) => void;
  children?: React.ReactNode;
}

export interface OpenSeaMapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  getMapBoundaries: () => Promise<{ northEast: any; southWest: any }>;
}

// OpenSeaMap tile servers
const TILE_SERVERS = {
  // OpenSeaMap seamark overlay (navigation aids, buoys, lights, etc.)
  seamark: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
  
  // OpenStreetMap base tiles (can use multiple subdomains for load balancing)
  osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  
  // Alternative nautical chart providers
  // Note: Some may require API keys
  harbors: 'https://tiles.openseamap.org/harbours/{z}/{x}/{y}.png',
  
  // Depth contours and bathymetry
  depth: 'https://tiles.openseamap.org/depth/{z}/{x}/{y}.png',
};

export const OpenSeaMapView = forwardRef<OpenSeaMapViewRef, OpenSeaMapViewProps>(
  (
    {
      initialRegion,
      showSeamarks = true,
      showDepthContours = false,
      showHarbors = false,
      mapType = 'standard',
      onRegionChange,
      children,
    },
    ref
  ) => {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region: Region, duration: number = 1000) => {
        mapRef.current?.animateToRegion(region, duration);
      },
      getMapBoundaries: async () => {
        if (mapRef.current) {
          return await mapRef.current.getMapBoundaries();
        }
        throw new Error('Map ref not available');
      },
    }));

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          mapType={mapType}
          showsUserLocation
          showsCompass
          showsScale
          showsMyLocationButton
          onRegionChangeComplete={onRegionChange}
          maxZoomLevel={18}
          minZoomLevel={5}
        >
          {/* Base OSM layer - Optional, as react-native-maps provides its own base map */}
          {/* Uncomment if you want to use OSM tiles as base instead of default provider */}
          {/*
          <UrlTile
            urlTemplate={TILE_SERVERS.osm}
            zIndex={0}
            tileSize={256}
            shouldReplaceMapContent={true}
          />
          */}

          {/* OpenSeaMap Seamark Overlay - Navigation aids, buoys, lights */}
          {showSeamarks && (
            <UrlTile
              urlTemplate={TILE_SERVERS.seamark}
              zIndex={1}
              tileSize={256}
              opacity={0.8}
              shouldReplaceMapContent={false}
              maximumZ={18}
              minimumZ={5}
              flipY={false}
            />
          )}

          {/* Depth Contours Overlay */}
          {showDepthContours && (
            <UrlTile
              urlTemplate={TILE_SERVERS.depth}
              zIndex={2}
              tileSize={256}
              opacity={0.6}
              shouldReplaceMapContent={false}
            />
          )}

          {/* Harbors Overlay */}
          {showHarbors && (
            <UrlTile
              urlTemplate={TILE_SERVERS.harbors}
              zIndex={3}
              tileSize={256}
              opacity={0.7}
              shouldReplaceMapContent={false}
            />
          )}

          {/* Render children (markers, polygons, etc.) */}
          {children}
        </MapView>
      </View>
    );
  }
);

OpenSeaMapView.displayName = 'OpenSeaMapView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

// Export utility functions for working with nautical data
export const NauticalUtils = {
  // Convert knots to m/s
  knotsToMs: (knots: number): number => knots * 0.514444,
  
  // Convert m/s to knots
  msToKnots: (ms: number): number => ms * 1.94384,
  
  // Convert nautical miles to kilometers
  nmToKm: (nm: number): number => nm * 1.852,
  
  // Convert kilometers to nautical miles
  kmToNm: (km: number): number => km / 1.852,
  
  // Format bearing to compass direction
  bearingToCompass: (bearing: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  },
  
  // Calculate distance between two coordinates in nautical miles
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3440.065; // Radius of Earth in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },
  
  // Calculate bearing between two coordinates
  calculateBearing: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  },
};