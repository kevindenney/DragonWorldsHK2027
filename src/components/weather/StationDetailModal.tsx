/**
 * Station Detail Modal
 *
 * Displays detailed information about weather monitoring stations including
 * current conditions, forecast data, historical trends, and station metadata.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  MapPin,
  Clock,
  TrendingUp,
  Wind,
  Waves,
  Activity,
  Eye,
  Thermometer,
  Droplets,
  Gauge,
  CheckCircle,
  AlertCircle
} from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import type { StationMarkerData } from './StationMarkers';
import type { TideStation } from '../../constants/hkTideStations';
import type { WaveStation } from '../../constants/hkWaveStations';
import type { WindStation } from '../../services/windStationService';

interface StationDetailModalProps {
  visible: boolean;
  station: StationMarkerData | null;
  onClose: () => void;
}

interface StationForecastData {
  time: string;
  value: number;
  condition?: string;
}

interface StationMetrics {
  current: {
    value: number;
    unit: string;
    timestamp: string;
    trend?: 'up' | 'down' | 'stable';
  };
  forecast: StationForecastData[];
  historical: {
    min: number;
    max: number;
    avg: number;
    period: string;
  };
}

const { width: screenWidth } = Dimensions.get('window');

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  visible,
  station,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'forecast' | 'history'>('current');
  const [stationMetrics, setStationMetrics] = useState<StationMetrics | null>(null);

  useEffect(() => {
    if (station && visible) {
      loadStationData(station);
    }
  }, [station, visible]);

  const loadStationData = async (stationData: StationMarkerData) => {
    // Generate mock data based on station type
    // In real implementation, this would fetch from weather APIs
    const mockMetrics = generateMockStationData(stationData);
    setStationMetrics(mockMetrics);
  };

  const generateMockStationData = (stationData: StationMarkerData): StationMetrics => {
    const now = new Date();
    const baseValue = getBaseValueForStationType(stationData.type);
    const variation = (Math.random() - 0.5) * 2;

    // Generate forecast data (next 24 hours)
    const forecast: StationForecastData[] = [];
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hourlyVariation = Math.sin(i * Math.PI / 12) * 2 + (Math.random() - 0.5);

      forecast.push({
        time: time.toLocaleTimeString('en-US', { hour: 'numeric' }),
        value: Math.max(0, baseValue + variation + hourlyVariation),
        condition: i % 6 === 0 ? getConditionForType(stationData.type) : undefined
      });
    }

    return {
      current: {
        value: baseValue + variation,
        unit: getUnitForStationType(stationData.type),
        timestamp: now.toISOString(),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      },
      forecast,
      historical: {
        min: baseValue - 5,
        max: baseValue + 8,
        avg: baseValue + 1,
        period: 'Last 30 days'
      }
    };
  };

  const getBaseValueForStationType = (type: string): number => {
    switch (type) {
      case 'wind':
        return 12; // knots
      case 'wave':
        return 1.5; // meters
      case 'tide':
        return 0.8; // meters
      default:
        return 10;
    }
  };

  const getUnitForStationType = (type: string): string => {
    switch (type) {
      case 'wind':
        return 'kts';
      case 'wave':
        return 'm';
      case 'tide':
        return 'm';
      default:
        return '';
    }
  };

  const getConditionForType = (type: string): string => {
    switch (type) {
      case 'wind':
        return ['Light', 'Moderate', 'Fresh', 'Strong'][Math.floor(Math.random() * 4)];
      case 'wave':
        return ['Calm', 'Slight', 'Moderate', 'Rough'][Math.floor(Math.random() * 4)];
      case 'tide':
        return ['Rising', 'Falling', 'High', 'Low'][Math.floor(Math.random() * 4)];
      default:
        return 'Normal';
    }
  };

  const getStationIcon = () => {
    if (!station) return null;

    const iconSize = 24;
    const iconColor = '#007AFF';

    switch (station.type) {
      case 'wind':
        return <Wind size={iconSize} color={iconColor} />;
      case 'wave':
        return <Waves size={iconSize} color={iconColor} />;
      case 'tide':
        return <Activity size={iconSize} color={iconColor} />;
      default:
        return <MapPin size={iconSize} color={iconColor} />;
    }
  };

  const getStationTypeLabel = () => {
    if (!station) return '';
    return station.type.charAt(0).toUpperCase() + station.type.slice(1) + ' Station';
  };

  const formatCoordinate = (lat: number, lon: number) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
  };

  const getTrendIcon = (trend?: string) => {
    if (!trend) return null;

    switch (trend) {
      case 'up':
        return <TrendingUp size={16} color="#34C759" />;
      case 'down':
        return <TrendingUp size={16} color="#FF3B30" style={{ transform: [{ rotate: '180deg' }] }} />;
      default:
        return <Gauge size={16} color="#FF9500" />;
    }
  };

  if (!station) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {getStationIcon()}
            <View style={styles.headerText}>
              <IOSText textStyle="headline" weight="semibold">
                {station.name}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                {getStationTypeLabel()}
              </IOSText>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Station Info */}
        <View style={styles.stationInfo}>
          <View style={styles.infoRow}>
            <MapPin size={16} color="#8E8E93" />
            <IOSText textStyle="footnote" color="secondaryLabel" style={styles.infoText}>
              {formatCoordinate(station.lat, station.lon)}
            </IOSText>
          </View>
          <View style={styles.infoRow}>
            {station.verified ? (
              <CheckCircle size={16} color="#34C759" />
            ) : (
              <AlertCircle size={16} color="#FF9500" />
            )}
            <IOSText textStyle="footnote" color="secondaryLabel" style={styles.infoText}>
              {station.verified ? 'Verified Location' : 'Estimated Location'}
            </IOSText>
          </View>
          {stationMetrics && (
            <View style={styles.infoRow}>
              <Clock size={16} color="#8E8E93" />
              <IOSText textStyle="footnote" color="secondaryLabel" style={styles.infoText}>
                Updated {new Date(stationMetrics.current.timestamp).toLocaleTimeString()}
              </IOSText>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {(['current', 'forecast', 'history'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <IOSText
                textStyle="subheadline"
                weight={activeTab === tab ? 'semibold' : 'regular'}
                style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </IOSText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'current' && (
            <CurrentConditionsTab station={station} metrics={stationMetrics} />
          )}
          {activeTab === 'forecast' && (
            <ForecastTab station={station} metrics={stationMetrics} />
          )}
          {activeTab === 'history' && (
            <HistoryTab station={station} metrics={stationMetrics} />
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Tab Components
const CurrentConditionsTab: React.FC<{
  station: StationMarkerData;
  metrics: StationMetrics | null;
}> = ({ station, metrics }) => {
  if (!metrics) {
    return (
      <View style={styles.loadingContainer}>
        <IOSText textStyle="body">Loading current conditions...</IOSText>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {/* Main Metric */}
      <View style={styles.mainMetricCard}>
        <View style={styles.mainMetricHeader}>
          <IOSText textStyle="title2" weight="semibold">
            Current {station.type.charAt(0).toUpperCase() + station.type.slice(1)}
          </IOSText>
          {getTrendIcon(metrics.current.trend)}
        </View>
        <View style={styles.mainMetricValue}>
          <IOSText textStyle="largeTitle" weight="bold" style={styles.valueText}>
            {metrics.current.value.toFixed(1)}
          </IOSText>
          <IOSText textStyle="title3" color="secondaryLabel" style={styles.unitText}>
            {metrics.current.unit}
          </IOSText>
        </View>
      </View>

      {/* Additional Metrics */}
      <View style={styles.additionalMetrics}>
        <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
          Related Conditions
        </IOSText>

        {station.type === 'wind' && <WindConditions station={station.data} />}
        {station.type === 'wave' && <WaveConditions station={station.data} />}
        {station.type === 'tide' && <TideConditions station={station.data} />}
      </View>
    </View>
  );
};

const ForecastTab: React.FC<{
  station: StationMarkerData;
  metrics: StationMetrics | null;
}> = ({ station, metrics }) => {
  if (!metrics) {
    return (
      <View style={styles.loadingContainer}>
        <IOSText textStyle="body">Loading forecast...</IOSText>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
        24-Hour Forecast
      </IOSText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
        {metrics.forecast.map((item, index) => (
          <View key={index} style={styles.forecastItem}>
            <IOSText textStyle="caption1" color="secondaryLabel">
              {item.time}
            </IOSText>
            <IOSText textStyle="subheadline" weight="semibold" style={styles.forecastValue}>
              {item.value.toFixed(1)}
            </IOSText>
            <IOSText textStyle="caption2" color="secondaryLabel">
              {metrics.current.unit}
            </IOSText>
            {item.condition && (
              <IOSText textStyle="caption2" color="secondaryLabel" style={styles.forecastCondition}>
                {item.condition}
              </IOSText>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const HistoryTab: React.FC<{
  station: StationMarkerData;
  metrics: StationMetrics | null;
}> = ({ station, metrics }) => {
  if (!metrics) {
    return (
      <View style={styles.loadingContainer}>
        <IOSText textStyle="body">Loading historical data...</IOSText>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
        Historical Summary
      </IOSText>
      <IOSText textStyle="footnote" color="secondaryLabel" style={styles.periodText}>
        {metrics.historical.period}
      </IOSText>

      <View style={styles.historyGrid}>
        <View style={styles.historyItem}>
          <IOSText textStyle="caption1" color="secondaryLabel">Minimum</IOSText>
          <IOSText textStyle="title3" weight="semibold">
            {metrics.historical.min.toFixed(1)} {metrics.current.unit}
          </IOSText>
        </View>
        <View style={styles.historyItem}>
          <IOSText textStyle="caption1" color="secondaryLabel">Maximum</IOSText>
          <IOSText textStyle="title3" weight="semibold">
            {metrics.historical.max.toFixed(1)} {metrics.current.unit}
          </IOSText>
        </View>
        <View style={styles.historyItem}>
          <IOSText textStyle="caption1" color="secondaryLabel">Average</IOSText>
          <IOSText textStyle="title3" weight="semibold">
            {metrics.historical.avg.toFixed(1)} {metrics.current.unit}
          </IOSText>
        </View>
      </View>
    </View>
  );
};

// Condition Components
const WindConditions: React.FC<{ station: WindStation }> = ({ station }) => (
  <View style={styles.conditionsGrid}>
    <View style={styles.conditionItem}>
      <Wind size={20} color="#FF9500" />
      <IOSText textStyle="caption1" color="secondaryLabel">Direction</IOSText>
      <IOSText textStyle="subheadline" weight="semibold">
        {station.windDirection}°
      </IOSText>
    </View>
    {station.windGust && (
      <View style={styles.conditionItem}>
        <TrendingUp size={20} color="#FF3B30" />
        <IOSText textStyle="caption1" color="secondaryLabel">Gusts</IOSText>
        <IOSText textStyle="subheadline" weight="semibold">
          {station.windGust} kts
        </IOSText>
      </View>
    )}
    {station.temperature && (
      <View style={styles.conditionItem}>
        <Thermometer size={20} color="#007AFF" />
        <IOSText textStyle="caption1" color="secondaryLabel">Temperature</IOSText>
        <IOSText textStyle="subheadline" weight="semibold">
          {station.temperature}°C
        </IOSText>
      </View>
    )}
  </View>
);

const WaveConditions: React.FC<{ station: WaveStation }> = ({ station }) => (
  <View style={styles.conditionsGrid}>
    <View style={styles.conditionItem}>
      <Waves size={20} color="#34C759" />
      <IOSText textStyle="caption1" color="secondaryLabel">Type</IOSText>
      <IOSText textStyle="subheadline" weight="semibold">
        {station.type.charAt(0).toUpperCase() + station.type.slice(1)}
      </IOSText>
    </View>
    <View style={styles.conditionItem}>
      <Eye size={20} color="#8E8E93" />
      <IOSText textStyle="caption1" color="secondaryLabel">Status</IOSText>
      <IOSText textStyle="subheadline" weight="semibold">
        {station.verified ? 'Active' : 'Estimated'}
      </IOSText>
    </View>
  </View>
);

const TideConditions: React.FC<{ station: TideStation }> = ({ station }) => (
  <View style={styles.conditionsGrid}>
    <View style={styles.conditionItem}>
      <Activity size={20} color="#007AFF" />
      <IOSText textStyle="caption1" color="secondaryLabel">Operator</IOSText>
      <IOSText textStyle="subheadline" weight="semibold">
        {station.operator}
      </IOSText>
    </View>
    <View style={styles.conditionItem}>
      <CheckCircle size={20} color={station.verified ? "#34C759" : "#FF9500"} />
      <IOSText textStyle="caption1" color="secondaryLabel">Source</IOSText>
      <IOSText textStyle="subheadline" weight="semibold">
        {station.verified ? 'Official' : 'Research'}
      </IOSText>
    </View>
  </View>
);

const getTrendIcon = (trend?: string) => {
  if (!trend) return null;

  switch (trend) {
    case 'up':
      return <TrendingUp size={16} color="#34C759" />;
    case 'down':
      return <TrendingUp size={16} color="#FF3B30" style={{ transform: [{ rotate: '180deg' }] }} />;
    default:
      return <Gauge size={16} color="#FF9500" />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C7C7CC'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerText: {
    marginLeft: 12,
    flex: 1
  },
  closeButton: {
    padding: 4
  },
  stationInfo: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C7C7CC'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  infoText: {
    marginLeft: 8
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C7C7CC'
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabButtonActive: {
    borderBottomColor: '#007AFF'
  },
  tabText: {
    color: '#8E8E93'
  },
  tabTextActive: {
    color: '#007AFF'
  },
  content: {
    flex: 1
  },
  tabContent: {
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  mainMetricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  mainMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  mainMetricValue: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  valueText: {
    color: '#007AFF'
  },
  unitText: {
    marginLeft: 8
  },
  additionalMetrics: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  sectionTitle: {
    marginBottom: 16
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  conditionItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 16
  },
  forecastScroll: {
    marginTop: 16
  },
  forecastItem: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  forecastValue: {
    marginTop: 4,
    marginBottom: 2
  },
  forecastCondition: {
    marginTop: 4,
    textAlign: 'center'
  },
  periodText: {
    marginBottom: 16
  },
  historyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  historyItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  }
});