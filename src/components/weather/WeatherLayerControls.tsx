/**
 * WeatherLayerControls Component
 *
 * Provides transparent floating buttons for toggling weather overlays and station layers.
 * Matches the original iOS-style overlay button design.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Radar, Satellite, Map, Wind, Waves, Activity } from 'lucide-react-native';

interface WeatherLayerControlsProps {
  // Overlay visibility states
  nauticalMapVisible?: boolean;
  radarVisible?: boolean;
  satelliteVisible?: boolean;

  // Station visibility states
  windStationsVisible?: boolean;
  waveStationsVisible?: boolean;
  tideStationsVisible?: boolean;

  // Toggle callbacks
  onNauticalMapToggle?: () => void;
  onRadarToggle?: () => void;
  onSatelliteToggle?: () => void;
  onWindStationsToggle?: () => void;
  onWaveStationsToggle?: () => void;
  onTideStationsToggle?: () => void;
}

export const WeatherLayerControls: React.FC<WeatherLayerControlsProps> = ({
  nauticalMapVisible = false,
  radarVisible = false,
  satelliteVisible = false,
  windStationsVisible = false,
  waveStationsVisible = false,
  tideStationsVisible = false,

  onNauticalMapToggle,
  onRadarToggle,
  onSatelliteToggle,
  onWindStationsToggle,
  onWaveStationsToggle,
  onTideStationsToggle
}) => {
  return (
    <View style={styles.container}>
      {/* Nautical Map */}
      <TouchableOpacity
        style={[
          styles.overlayButton,
          nauticalMapVisible && styles.overlayButtonActive
        ]}
        onPress={onNauticalMapToggle}
        activeOpacity={0.7}
      >
        <Map
          size={20}
          color={nauticalMapVisible ? '#007AFF' : '#8E8E93'}
        />
      </TouchableOpacity>

      {/* Radar */}
      <TouchableOpacity
        style={[
          styles.overlayButton,
          radarVisible && styles.overlayButtonActive
        ]}
        onPress={onRadarToggle}
        activeOpacity={0.7}
      >
        <Radar
          size={20}
          color={radarVisible ? '#007AFF' : '#8E8E93'}
        />
      </TouchableOpacity>

      {/* Satellite */}
      <TouchableOpacity
        style={[
          styles.overlayButton,
          satelliteVisible && styles.overlayButtonActive
        ]}
        onPress={onSatelliteToggle}
        activeOpacity={0.7}
      >
        <Satellite
          size={20}
          color={satelliteVisible ? '#007AFF' : '#8E8E93'}
        />
      </TouchableOpacity>

      {/* Wind Stations */}
      <TouchableOpacity
        style={[
          styles.overlayButton,
          windStationsVisible && styles.overlayButtonActive
        ]}
        onPress={onWindStationsToggle}
        activeOpacity={0.7}
      >
        <Wind
          size={20}
          color={windStationsVisible ? '#007AFF' : '#8E8E93'}
        />
      </TouchableOpacity>

      {/* Wave Stations */}
      <TouchableOpacity
        style={[
          styles.overlayButton,
          waveStationsVisible && styles.overlayButtonActive
        ]}
        onPress={onWaveStationsToggle}
        activeOpacity={0.7}
      >
        <Waves
          size={20}
          color={waveStationsVisible ? '#007AFF' : '#8E8E93'}
        />
      </TouchableOpacity>

      {/* Tide Stations */}
      <TouchableOpacity
        style={[
          styles.overlayButton,
          tideStationsVisible && styles.overlayButtonActive
        ]}
        onPress={onTideStationsToggle}
        activeOpacity={0.7}
      >
        <Activity
          size={20}
          color={tideStationsVisible ? '#007AFF' : '#8E8E93'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  overlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  overlayButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
});

export default WeatherLayerControls;