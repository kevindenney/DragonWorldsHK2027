/**
 * RadarOverlay Component
 *
 * Displays weather radar data as overlay tiles on React Native Maps.
 * Supports animated radar sequences and real-time precipitation visualization.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';
import { weatherImageryService, type RadarFrame, type WeatherAnimation } from '../../services/weatherImageryService';

interface RadarOverlayProps {
  /** Reference to the map view */
  mapRef?: React.RefObject<MapView>;
  /** Whether the radar overlay is visible */
  visible?: boolean;
  /** Opacity of the radar overlay (0-1) */
  opacity?: number;
  /** Whether to show animated radar sequence */
  animated?: boolean;
  /** Number of frames for animation */
  animationFrames?: number;
  /** Animation speed in milliseconds per frame */
  animationSpeed?: number;
  /** Z-index for layer ordering */
  zIndex?: number;
  /** Callback when radar data is loaded */
  onDataLoaded?: (frames: RadarFrame[]) => void;
  /** Callback when loading state changes */
  onLoadingChange?: (loading: boolean) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

export const RadarOverlay: React.FC<RadarOverlayProps> = ({
  visible = true,
  opacity = 0.7,
  animated = false,
  animationFrames = 10,
  animationSpeed = 1000,
  zIndex = 1000,
  onDataLoaded,
  onLoadingChange,
  onError
}) => {
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Load radar data on mount and when animation settings change
  useEffect(() => {
    loadRadarData();
  }, [animated, animationFrames]);

  // Handle animation cycling
  useEffect(() => {
    if (animated && radarFrames.length > 1) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [animated, radarFrames, animationSpeed]);

  const loadRadarData = async () => {
    setLoading(true);
    setError(null);
    onLoadingChange?.(true);

    try {

      let frames: RadarFrame[];
      if (animated) {
        const animation = await weatherImageryService.getRadarAnimation(animationFrames);
        frames = animation.frames as RadarFrame[];
      } else {
        frames = await weatherImageryService.getRadarData({ frames: 1 });
      }

      setRadarFrames(frames);
      setCurrentFrameIndex(0);
      onDataLoaded?.(frames);


    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load radar data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const startAnimation = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    animationRef.current = setInterval(() => {
      setCurrentFrameIndex(prevIndex =>
        prevIndex >= radarFrames.length - 1 ? 0 : prevIndex + 1
      );
    }, animationSpeed);
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  };

  const refreshRadarData = async () => {
    // Force refresh by clearing cache and reloading
    weatherImageryService.clearCache();
    await loadRadarData();
  };

  // Get current frame to display
  const currentFrame = radarFrames[currentFrameIndex];

  // Add detailed logging about what's happening with the overlay
  React.useEffect(() => {

    if (currentFrame && currentFrame.tiles.length > 0) {
      currentFrame.tiles.forEach((tile, index) => {
      });
    } else {
    }
  }, [visible, radarFrames, currentFrameIndex, currentFrame, loading, error]);

  if (!visible) {
    return null;
  }

  if (loading) {
    return null;
  }

  if (error) {
    return null;
  }

  if (!currentFrame) {
    return null;
  }

  if (currentFrame.tiles.length === 0) {
    return null;
  }


  return (
    <View style={styles.container}>
      {currentFrame.tiles.map((tile, index) => {
        return (
          <UrlTile
            key={`radar-tile-${currentFrameIndex}-${index}`}
            urlTemplate={tile.url}
            maximumZ={10}
            minimumZ={3}
            flipY={false}
            zIndex={zIndex + index}
            opacity={opacity}
          />
        );
      })}
    </View>
  );
};

// Export additional radar utilities
export const RadarOverlayController = {
  /**
   * Get precipitation intensity color
   */
  getIntensityColor: (intensity: RadarFrame['precipitationIntensity']): string => {
    const colors = {
      light: '#4CAF50',     // Green
      moderate: '#FF9800',  // Orange
      heavy: '#F44336',     // Red
      extreme: '#9C27B0'    // Purple
    };
    return colors[intensity];
  },

  /**
   * Get intensity description
   */
  getIntensityDescription: (intensity: RadarFrame['precipitationIntensity']): string => {
    const descriptions = {
      light: 'Light rain',
      moderate: 'Moderate rain',
      heavy: 'Heavy rain',
      extreme: 'Extreme precipitation'
    };
    return descriptions[intensity];
  },

  /**
   * Calculate frame timestamp for animation
   */
  getFrameTimestamp: (frame: RadarFrame): string => {
    const date = new Date(frame.timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  },

  /**
   * Check if radar shows active precipitation
   */
  hasActivePrecipitation: (frame: RadarFrame): boolean => {
    return frame.coverage > 0 && frame.precipitationIntensity !== 'light';
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

export default RadarOverlay;