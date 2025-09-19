/**
 * HKO Real-time Data Layer Controls
 *
 * Simplified interface focused on Hong Kong Observatory's real-time marine data.
 * No more toggle buttons - displays HKO infrastructure with real-time status indicators.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Text, ActivityIndicator } from 'react-native';
import { Anchor, Waves, MapPin, AlertTriangle, CheckCircle2, Clock } from 'lucide-react-native';

interface HKOLayerControlsProps {
  // HKO data status
  buoyCount?: number;
  tideStationCount?: number;
  driftingBuoyCount?: number;
  marineAreaCount?: number;
  activeWarnings?: number;

  // Real-time status
  isPollingActive?: boolean;
  lastUpdateTime?: string | null;

  // Data loading states
  loading?: boolean;
  error?: boolean;

  // Callbacks
  onRefreshData?: () => void;
  onTogglePolling?: () => void;
  onViewDetails?: () => void;
}

export const WeatherLayerControls: React.FC<HKOLayerControlsProps> = ({
  buoyCount = 0,
  tideStationCount = 0,
  driftingBuoyCount = 0,
  marineAreaCount = 0,
  activeWarnings = 0,
  isPollingActive = false,
  lastUpdateTime = null,
  loading = false,
  error = false,
  onRefreshData,
  onTogglePolling,
  onViewDetails
}) => {
  const formatUpdateTime = (timeString: string | null) => {
    if (!timeString) return 'No data';
    const now = new Date();
    const updateTime = new Date(timeString);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  return (
    <View style={styles.container}>
      {/* HKO Data Status Panel */}
      <View style={styles.statusPanel}>
        <View style={styles.statusHeader}>
          <View style={styles.statusTitleRow}>
            <Anchor size={18} color="#007AFF" />
            <Text style={styles.statusTitle}>HKO Marine Data</Text>
            <View style={[
              styles.statusIndicator,
              isPollingActive ? styles.statusActive : styles.statusInactive
            ]} />
          </View>
          <Text style={styles.updateTime}>
            {formatUpdateTime(lastUpdateTime)}
          </Text>
        </View>

        <View style={styles.countsRow}>
          <View style={styles.countItem}>
            <Anchor size={14} color="#8E8E93" />
            <Text style={styles.countText}>{buoyCount}</Text>
            <Text style={styles.countLabel}>Buoys</Text>
          </View>

          <View style={styles.countItem}>
            <Waves size={14} color="#8E8E93" />
            <Text style={styles.countText}>{tideStationCount}</Text>
            <Text style={styles.countLabel}>Tides</Text>
          </View>

          <View style={styles.countItem}>
            <MapPin size={14} color="#8E8E93" />
            <Text style={styles.countText}>{driftingBuoyCount}</Text>
            <Text style={styles.countLabel}>Drift</Text>
          </View>

          {activeWarnings > 0 && (
            <View style={styles.warningItem}>
              <AlertTriangle size={14} color="#FF9500" />
              <Text style={styles.warningText}>{activeWarnings}</Text>
              <Text style={styles.warningLabel}>Warnings</Text>
            </View>
          )}
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        {/* Refresh Data Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            loading && styles.controlButtonDisabled
          ]}
          onPress={onRefreshData}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <CheckCircle2 size={18} color="#007AFF" />
          )}
        </TouchableOpacity>

        {/* Toggle Polling Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            isPollingActive && styles.controlButtonActive
          ]}
          onPress={onTogglePolling}
          activeOpacity={0.7}
        >
          <Clock
            size={18}
            color={isPollingActive ? '#34C759' : '#8E8E93'}
          />
        </TouchableOpacity>

        {/* View Details Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onViewDetails}
          activeOpacity={0.7}
        >
          <MapPin size={18} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 8,
  },
  statusPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 240,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusHeader: {
    marginBottom: 8,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#34C759',
  },
  statusInactive: {
    backgroundColor: '#8E8E93',
  },
  updateTime: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  countsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  countItem: {
    alignItems: 'center',
    gap: 2,
  },
  countText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  countLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  warningItem: {
    alignItems: 'center',
    gap: 2,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
  },
  warningLabel: {
    fontSize: 10,
    color: '#FF9500',
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  controlButtonActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
});

export default WeatherLayerControls;