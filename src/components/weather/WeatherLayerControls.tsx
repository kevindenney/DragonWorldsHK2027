/**
 * WeatherLayerControls Component
 *
 * Provides UI controls for toggling weather overlay layers (radar, satellite).
 * Includes layer selection, opacity adjustment, and animation controls.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Cloud, CloudRain, Satellite, Play, Pause, RotateCcw, Layers } from 'lucide-react-native';
import { RadarOverlayController } from './RadarOverlay';
import { SatelliteOverlayController } from './SatelliteOverlay';

interface WeatherLayerControlsProps {
  /** Whether radar layer is visible */
  radarVisible?: boolean;
  /** Whether satellite layer is visible */
  satelliteVisible?: boolean;
  /** Current satellite type */
  satelliteType?: 'visible' | 'infrared' | 'water_vapor';
  /** Whether radar animation is playing */
  radarAnimated?: boolean;
  /** Radar opacity (0-1) */
  radarOpacity?: number;
  /** Satellite opacity (0-1) */
  satelliteOpacity?: number;
  /** Whether controls are collapsed/minimized */
  collapsed?: boolean;
  /** Callback when radar visibility changes */
  onRadarVisibilityChange?: (visible: boolean) => void;
  /** Callback when satellite visibility changes */
  onSatelliteVisibilityChange?: (visible: boolean) => void;
  /** Callback when satellite type changes */
  onSatelliteTypeChange?: (type: 'visible' | 'infrared' | 'water_vapor') => void;
  /** Callback when radar animation changes */
  onRadarAnimationChange?: (animated: boolean) => void;
  /** Callback when radar opacity changes */
  onRadarOpacityChange?: (opacity: number) => void;
  /** Callback when satellite opacity changes */
  onSatelliteOpacityChange?: (opacity: number) => void;
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Callback when refresh is requested */
  onRefresh?: () => void;
}

export const WeatherLayerControls: React.FC<WeatherLayerControlsProps> = ({
  radarVisible = false,
  satelliteVisible = false,
  satelliteType = 'visible',
  radarAnimated = false,
  radarOpacity = 0.7,
  satelliteOpacity = 0.6,
  collapsed = false,
  onRadarVisibilityChange,
  onSatelliteVisibilityChange,
  onSatelliteTypeChange,
  onRadarAnimationChange,
  onRadarOpacityChange,
  onSatelliteOpacityChange,
  onCollapsedChange,
  onRefresh
}) => {
  const [showOpacityControls, setShowOpacityControls] = useState(false);

  const handleToggleCollapsed = () => {
    console.log('🔄 Weather layer controls toggle pressed, collapsed:', collapsed);
    onCollapsedChange?.(!collapsed);
  };

  const handleRadarToggle = () => {
    onRadarVisibilityChange?.(!radarVisible);
  };

  const handleSatelliteToggle = () => {
    onSatelliteVisibilityChange?.(!satelliteVisible);
  };

  const handleSatelliteTypeChange = () => {
    const types: Array<'visible' | 'infrared' | 'water_vapor'> = ['visible', 'infrared', 'water_vapor'];
    const currentIndex = types.indexOf(satelliteType);
    const nextIndex = (currentIndex + 1) % types.length;
    onSatelliteTypeChange?.(types[nextIndex]);
  };

  const handleRadarAnimationToggle = () => {
    onRadarAnimationChange?.(!radarAnimated);
  };

  const handleRefresh = () => {
    onRefresh?.();
  };


  const getSatelliteIcon = () => {
    switch (satelliteType) {
      case 'infrared':
        return <Satellite size={18} color="#FF5722" />;
      case 'water_vapor':
        return <Satellite size={18} color="#2196F3" />;
      default:
        return <Satellite size={18} color="#4CAF50" />;
    }
  };

  const getSatelliteTypeLabel = () => {
    switch (satelliteType) {
      case 'infrared':
        return 'IR';
      case 'water_vapor':
        return 'WV';
      default:
        return 'VIS';
    }
  };

  if (collapsed) {
    return (
      <View style={styles.collapsedContainer}>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={handleToggleCollapsed}
          activeOpacity={0.7}
        >
          <Layers size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Layers size={16} color="#FFF" />
          <Text style={styles.headerTitle}>Weather Layers</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleToggleCollapsed}
            activeOpacity={0.7}
          >
            <Text style={styles.collapseText}>−</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weather Layer Controls */}
      <View style={styles.controlsContainer}>
        {/* Radar Controls */}
        <View style={styles.layerGroup}>
          <TouchableOpacity
            style={[styles.layerButton, radarVisible && styles.layerButtonActive]}
            onPress={handleRadarToggle}
            activeOpacity={0.7}
          >
            <CloudRain size={18} color={radarVisible ? "#FFF" : "#00C864"} />
            <Text style={[styles.layerButtonText, radarVisible && styles.layerButtonTextActive]}>
              Radar
            </Text>
          </TouchableOpacity>

          {radarVisible && (
            <TouchableOpacity
              style={[styles.animationButton, radarAnimated && styles.animationButtonActive]}
              onPress={handleRadarAnimationToggle}
              activeOpacity={0.7}
            >
              {radarAnimated ? (
                <Pause size={14} color="#FFF" />
              ) : (
                <Play size={14} color="#00C864" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Satellite Controls */}
        <View style={styles.layerGroup}>
          <TouchableOpacity
            style={[styles.layerButton, satelliteVisible && styles.layerButtonActive]}
            onPress={handleSatelliteToggle}
            activeOpacity={0.7}
          >
            {getSatelliteIcon()}
            <Text style={[styles.layerButtonText, satelliteVisible && styles.layerButtonTextActive]}>
              Satellite
            </Text>
          </TouchableOpacity>

          {satelliteVisible && (
            <TouchableOpacity
              style={styles.typeButton}
              onPress={handleSatelliteTypeChange}
              activeOpacity={0.7}
            >
              <Text style={styles.typeButtonText}>{getSatelliteTypeLabel()}</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>

      {/* Opacity Controls */}
      {(radarVisible || satelliteVisible) && (
        <View style={styles.opacityContainer}>
          <TouchableOpacity
            style={styles.opacityToggle}
            onPress={() => setShowOpacityControls(!showOpacityControls)}
            activeOpacity={0.7}
          >
            <Text style={styles.opacityToggleText}>
              Opacity {showOpacityControls ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showOpacityControls && (
            <View style={styles.opacityControls}>
              {radarVisible && (
                <View style={styles.opacityRow}>
                  <Text style={styles.opacityLabel}>Radar</Text>
                  <View style={styles.opacityButtons}>
                    {[0.3, 0.5, 0.7, 0.9].map(value => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.opacityButton,
                          Math.abs(radarOpacity - value) < 0.1 && styles.opacityButtonActive
                        ]}
                        onPress={() => onRadarOpacityChange?.(value)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.opacityButtonText}>
                          {Math.round(value * 100)}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {satelliteVisible && (
                <View style={styles.opacityRow}>
                  <Text style={styles.opacityLabel}>Satellite</Text>
                  <View style={styles.opacityButtons}>
                    {[0.3, 0.5, 0.7, 0.9].map(value => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.opacityButton,
                          Math.abs(satelliteOpacity - value) < 0.1 && styles.opacityButtonActive
                        ]}
                        onPress={() => onSatelliteOpacityChange?.(value)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.opacityButtonText}>
                          {Math.round(value * 100)}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Weather Legend */}
      {radarVisible && (
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Precipitation</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: RadarOverlayController.getIntensityColor('light') }]} />
              <Text style={styles.legendText}>Light</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: RadarOverlayController.getIntensityColor('moderate') }]} />
              <Text style={styles.legendText}>Moderate</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: RadarOverlayController.getIntensityColor('heavy') }]} />
              <Text style={styles.legendText}>Heavy</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: RadarOverlayController.getIntensityColor('extreme') }]} />
              <Text style={styles.legendText}>Extreme</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden'
  },
  collapsedContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    zIndex: 1000,
    elevation: 5,
    pointerEvents: 'auto'
  },
  expandButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerButton: {
    padding: 4,
    marginLeft: 8
  },
  collapseText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  controlsContainer: {
    padding: 12
  },
  layerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    flex: 1
  },
  layerButtonActive: {
    backgroundColor: '#00C864'
  },
  layerButtonText: {
    color: '#00C864',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6
  },
  layerButtonTextActive: {
    color: '#FFF'
  },
  animationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    padding: 6
  },
  animationButtonActive: {
    backgroundColor: '#00C864'
  },
  typeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  typeButtonText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600'
  },
  opacityContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  opacityToggle: {
    padding: 12,
    alignItems: 'center'
  },
  opacityToggleText: {
    color: '#FFF',
    fontSize: 12
  },
  opacityControls: {
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  opacityRow: {
    marginBottom: 8
  },
  opacityLabel: {
    color: '#FFF',
    fontSize: 11,
    marginBottom: 4
  },
  opacityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  opacityButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center'
  },
  opacityButtonActive: {
    backgroundColor: '#00C864'
  },
  opacityButtonText: {
    color: '#FFF',
    fontSize: 10
  },
  legendContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12
  },
  legendTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  legendItem: {
    alignItems: 'center'
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 2
  },
  legendText: {
    color: '#FFF',
    fontSize: 9
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12,
    marginHorizontal: 8
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginHorizontal: 8,
    opacity: 0.8
  }
});

export default WeatherLayerControls;