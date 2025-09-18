/**
 * SatelliteOverlay Component
 *
 * Displays satellite imagery as overlay tiles on React Native Maps.
 * Supports visible, infrared, and water vapor satellite views.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';
import { weatherImageryService, type SatelliteFrame } from '../../services/weatherImageryService';

interface SatelliteOverlayProps {
  /** Reference to the map view */
  mapRef?: React.RefObject<MapView>;
  /** Whether the satellite overlay is visible */
  visible?: boolean;
  /** Type of satellite imagery */
  type?: 'visible' | 'infrared' | 'water_vapor';
  /** Opacity of the satellite overlay (0-1) */
  opacity?: number;
  /** Z-index for layer ordering */
  zIndex?: number;
  /** Callback when satellite data is loaded */
  onDataLoaded?: (frames: SatelliteFrame[]) => void;
  /** Callback when loading state changes */
  onLoadingChange?: (loading: boolean) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

export const SatelliteOverlay: React.FC<SatelliteOverlayProps> = ({
  visible = true,
  type = 'visible',
  opacity = 0.6,
  zIndex = 800,
  onDataLoaded,
  onLoadingChange,
  onError
}) => {
  const [satelliteFrames, setSatelliteFrames] = useState<SatelliteFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load satellite data when type changes
  useEffect(() => {
    loadSatelliteData();
  }, [type]);

  const loadSatelliteData = async () => {
    setLoading(true);
    setError(null);
    onLoadingChange?.(true);

    try {
      console.log(`🛰️ Loading ${type} satellite data...`);

      const frames = await weatherImageryService.getSatelliteData(type);
      setSatelliteFrames(frames);
      onDataLoaded?.(frames);

      console.log(`✅ Loaded ${frames.length} satellite frames (${type})`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load satellite data';
      console.error('❌ Satellite data loading failed:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const refreshSatelliteData = async () => {
    // Force refresh by clearing cache and reloading
    weatherImageryService.clearCache();
    await loadSatelliteData();
  };

  // Get current frame to display (typically just one for satellite)
  const currentFrame = satelliteFrames[0];

  if (!visible || !currentFrame || currentFrame.tiles.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {currentFrame.tiles.map((tile, index) => (
        <UrlTile
          key={`satellite-tile-${type}-${index}`}
          urlTemplate={tile.url}
          maximumZ={10}
          minimumZ={3}
          flipY={false}
          zIndex={zIndex + index}
          opacity={opacity}
        />
      ))}
    </View>
  );
};

// Export satellite utilities
export const SatelliteOverlayController = {
  /**
   * Get satellite type description
   */
  getTypeDescription: (type: SatelliteFrame['type']): string => {
    const descriptions = {
      visible: 'Visible Light',
      infrared: 'Infrared',
      water_vapor: 'Water Vapor'
    };
    return descriptions[type];
  },

  /**
   * Get satellite type color scheme
   */
  getTypeColorScheme: (type: SatelliteFrame['type']): string => {
    const schemes = {
      visible: 'Natural color satellite imagery showing clouds and land features',
      infrared: 'Temperature-based imagery showing cloud tops and surface temperatures',
      water_vapor: 'Atmospheric moisture content visualization'
    };
    return schemes[type];
  },

  /**
   * Get cloud coverage description
   */
  getCloudCoverageDescription: (coverage: number): string => {
    if (coverage < 10) return 'Clear skies';
    if (coverage < 25) return 'Few clouds';
    if (coverage < 50) return 'Scattered clouds';
    if (coverage < 75) return 'Broken clouds';
    return 'Overcast';
  },

  /**
   * Get cloud coverage color
   */
  getCloudCoverageColor: (coverage: number): string => {
    if (coverage < 10) return '#87CEEB';  // Sky blue
    if (coverage < 25) return '#B0C4DE';  // Light steel blue
    if (coverage < 50) return '#D3D3D3';  // Light gray
    if (coverage < 75) return '#A9A9A9';  // Dark gray
    return '#696969';                     // Dim gray
  },

  /**
   * Check if satellite shows good visibility conditions
   */
  hasGoodVisibility: (frame: SatelliteFrame): boolean => {
    return frame.cloudCoverage < 50 && frame.type === 'visible';
  },

  /**
   * Get optimal satellite type for racing conditions
   */
  getOptimalTypeForRacing: (): 'visible' | 'infrared' | 'water_vapor' => {
    const hour = new Date().getHours();

    // Use infrared at night when visible light isn't useful
    if (hour < 6 || hour > 18) {
      return 'infrared';
    }

    // Use visible during day for best cloud detail
    return 'visible';
  },

  /**
   * Calculate frame age in minutes
   */
  getFrameAge: (frame: SatelliteFrame): number => {
    const now = new Date();
    const frameTime = new Date(frame.timestamp);
    return Math.floor((now.getTime() - frameTime.getTime()) / (1000 * 60));
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none'
  }
});

export default SatelliteOverlay;