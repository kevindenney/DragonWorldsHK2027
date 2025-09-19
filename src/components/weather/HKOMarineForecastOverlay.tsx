import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Polygon, Marker } from 'react-native-maps';
import { Wind, Waves, Eye, AlertTriangle } from 'lucide-react-native';
import { useHKOMarineAreas } from '../../stores/weatherStore';
import { HKOMarineForecastArea } from '../../services/hkoAPI';

interface HKOMarineForecastOverlayProps {
  visible: boolean;
  showWarnings?: boolean;
  showWindData?: boolean;
  showWaveData?: boolean;
  opacity?: number;
}

interface ForecastAreaProps {
  forecast: HKOMarineForecastArea;
  showDetails: boolean;
  onPress: () => void;
}

const ForecastArea: React.FC<ForecastAreaProps> = ({ forecast, showDetails, onPress }) => {
  // Generate polygon coordinates for the forecast area
  const getAreaPolygon = () => {
    const centerLat = forecast.center.latitude;
    const centerLng = forecast.center.longitude;
    const radius = 0.05; // Approximate area radius in degrees

    // Generate a rough polygon around the center point
    const points = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const lat = centerLat + radius * Math.cos(angle);
      const lng = centerLng + radius * Math.sin(angle);
      points.push({ latitude: lat, longitude: lng });
    }
    return points;
  };

  // Get color based on wind conditions
  const getAreaColor = () => {
    const windSpeed = forecast.forecast?.windSpeed || 0;
    if (windSpeed >= 34) return '#DC2626'; // Gale force - Red
    if (windSpeed >= 25) return '#F59E0B'; // Strong wind - Orange
    if (windSpeed >= 17) return '#EAB308'; // Fresh wind - Yellow
    if (windSpeed >= 11) return '#22C55E'; // Moderate wind - Green
    return '#3B82F6'; // Light wind - Blue
  };

  const getWarningLevel = () => {
    const windSpeed = forecast.forecast?.windSpeed || 0;
    if (windSpeed >= 34) return 'GALE';
    if (windSpeed >= 25) return 'STRONG';
    if (windSpeed >= 17) return 'FRESH';
    return 'NORMAL';
  };

  return (
    <>
      {/* Area polygon */}
      <Polygon
        coordinates={getAreaPolygon()}
        strokeColor={getAreaColor()}
        strokeWidth={2}
        fillColor={`${getAreaColor()}30`} // 30% opacity
        tappable={true}
        onPress={onPress}
      />

      {/* Center marker with forecast info */}
      <Marker
        coordinate={forecast.center}
        title={forecast.name}
        description={`Wind: ${forecast.forecast?.windSpeed || 0}kts`}
        onPress={onPress}
      >
        <View style={[styles.areaMarker, { backgroundColor: getAreaColor() }]}>
          <Wind size={16} color="#FFFFFF" />
          <Text style={styles.areaMarkerText}>{forecast.forecast?.windSpeed || 0}kt</Text>
        </View>
      </Marker>

      {/* Warning indicator for gale conditions */}
      {(forecast.forecast?.windSpeed || 0) >= 34 && (
        <Marker coordinate={forecast.center}>
          <View style={styles.warningMarker}>
            <AlertTriangle size={20} color="#DC2626" />
          </View>
        </Marker>
      )}
    </>
  );
};

export const HKOMarineForecastOverlay: React.FC<HKOMarineForecastOverlayProps> = ({
  visible,
  showWarnings = true,
  showWindData = true,
  showWaveData = true,
  opacity = 0.7
}) => {
  const hkoMarineAreas = useHKOMarineAreas();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [forecastDetails, setForecastDetails] = useState<HKOMarineForecastArea | null>(null);

  useEffect(() => {
    if (selectedArea) {
      const selected = hkoMarineAreas.find(f => f.id === selectedArea);
      setForecastDetails(selected || null);
    } else {
      setForecastDetails(null);
    }
  }, [selectedArea, hkoMarineAreas]);

  if (!visible) return null;

  const handleAreaPress = (areaId: string) => {
    setSelectedArea(selectedArea === areaId ? null : areaId);
  };

  // Get overall warning level for Hong Kong waters
  const getOverallWarningLevel = () => {
    const maxWindSpeed = Math.max(
      ...hkoMarineAreas.map(f => f.windSpeed || 0)
    );
    if (maxWindSpeed >= 34) return 'GALE WARNING';
    if (maxWindSpeed >= 25) return 'STRONG WIND WARNING';
    return 'NORMAL CONDITIONS';
  };

  const warningLevel = getOverallWarningLevel();
  const isWarningActive = warningLevel !== 'NORMAL CONDITIONS';

  return (
    <>
      {/* Marine forecast areas */}
      {hkoMarineAreas.map((forecast) => (
        <ForecastArea
          key={forecast.id}
          forecast={forecast}
          showDetails={selectedArea === forecast.id}
          onPress={() => handleAreaPress(forecast.id)}
        />
      ))}

      {/* Warning banner */}
      {showWarnings && isWarningActive && (
        <View style={styles.warningBanner}>
          <View style={styles.warningHeader}>
            <AlertTriangle size={20} color="#DC2626" />
            <Text style={styles.warningTitle}>{warningLevel}</Text>
          </View>
          <Text style={styles.warningText}>
            Marine conditions require caution. Check individual forecast areas.
          </Text>
        </View>
      )}

      {/* Forecast details panel */}
      {forecastDetails && (
        <View style={styles.detailsPanel}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>{forecastDetails.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedArea(null)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailsContent}>
            {/* Wind conditions */}
            {showWindData && (
              <View style={styles.detailRow}>
                <Wind size={16} color="#3B82F6" />
                <Text style={styles.detailLabel}>Wind:</Text>
                <Text style={styles.detailValue}>
                  {forecastDetails.forecast?.windSpeed || 0}kts {forecastDetails.forecast?.windDirection || 0}°
                </Text>
              </View>
            )}

            {/* Wave conditions */}
            {showWaveData && forecastDetails.forecast?.waveHeight && (
              <View style={styles.detailRow}>
                <Waves size={16} color="#06B6D4" />
                <Text style={styles.detailLabel}>Waves:</Text>
                <Text style={styles.detailValue}>{forecastDetails.forecast?.waveHeight || 0}m</Text>
              </View>
            )}

            {/* Visibility */}
            {forecastDetails.forecast?.visibility && (
              <View style={styles.detailRow}>
                <Eye size={16} color="#10B981" />
                <Text style={styles.detailLabel}>Visibility:</Text>
                <Text style={styles.detailValue}>{forecastDetails.forecast?.visibility || 0}km</Text>
              </View>
            )}

            {/* General conditions */}
            <View style={styles.conditionsSection}>
              <Text style={styles.conditionsLabel}>Conditions:</Text>
              <Text style={styles.conditionsText}>{forecastDetails.forecast?.weather || 'Unknown'}</Text>
            </View>

            {/* Last updated */}
            <Text style={styles.lastUpdated}>
              Updated: {new Date(forecastDetails.updateTime).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Marine Forecast Areas</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.legendText}>Gale (≥34kt)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Strong (25-33kt)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendText}>Moderate (11-24kt)</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  areaMarker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  areaMarkerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  warningMarker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  warningBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  warningText: {
    fontSize: 12,
    color: '#7F1D1D',
  },
  detailsPanel: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  detailsContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    minWidth: 60,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  conditionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  conditionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  conditionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'right',
  },
  legend: {
    position: 'absolute',
    top: 280,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 140,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});

export default HKOMarineForecastOverlay;