import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOSText } from '../../components/ios/IOSText';
import {
  Cloud,
  Droplets,
  Wind,
  Waves,
  Compass,
  Calendar,
  WifiOff,
  Clock
} from 'lucide-react-native';
import { SimpleTideChart } from '../../components/weather/SimpleTideChart';
import { WeatherMetricRow } from '../../components/weather/WeatherMetricRow';
import {
  useWeatherStore,
  useCurrentWeather,
  useCurrentMarine,
  useWeatherLoading,
  useWeatherError
} from '../../stores/weatherStore';
import { offlineManager } from '../../services/offlineManager';
import { OfflineError } from '../../components/shared/OfflineError';
import type { WeatherScreenProps } from '../../types/navigation';
import type { OfflineStatus } from '../../services/offlineManager';

// Mock data structure for the design
const generateTideData = () => [
  { time: '03:00', height: 0.8 },
  { time: '06:00', height: 1.2 },
  { time: '09:00', height: 0.9 },
  { time: '12:00', height: 0.4 },
  { time: '15:00', height: 0.6 },
  { time: '18:00', height: 1.1 },
  { time: '21:00', height: 0.7 },
];

const formatWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

export function WeatherScreen({ navigation }: WeatherScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
  const [cachedWeatherData, setCachedWeatherData] = useState<any>(null);

  // Weather store hooks
  const { refreshWeather } = useWeatherStore();
  const currentWeather = useCurrentWeather();
  const currentMarine = useCurrentMarine();
  const isLoading = useWeatherLoading();
  const error = useWeatherError();
  
  const tideData = generateTideData();

  // Initialize offline monitoring
  useEffect(() => {
    const unsubscribe = offlineManager.onStatusChange((status) => {
      setOfflineStatus(status);
    });

    // Load cached weather data on mount
    const loadCachedData = async () => {
      try {
        const cachedData = await offlineManager.getCriticalWeatherData();
        setCachedWeatherData(cachedData);
      } catch (error) {
      }
    };

    loadCachedData();
    return unsubscribe;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (offlineStatus?.isConnected) {
        await refreshWeather();
      } else {
        // Show offline message but still try to refresh cached data
        const cachedData = await offlineManager.getCriticalWeatherData();
        setCachedWeatherData(cachedData);
      }
    } catch (err) {
    } finally {
      setRefreshing(false);
    }
  }, [refreshWeather, offlineStatus]);

  const getCurrentDateHeader = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('en-US', options);
  };

  // Determine data source and offline status
  const isOffline = offlineStatus && !offlineStatus.isConnected;
  const hasCurrentData = currentWeather && currentMarine;
  const hasCachedData = cachedWeatherData && !cachedWeatherData.isOfflineData;

  // Use current data if available, otherwise use cached data, finally fallback data
  const weatherData = currentWeather || (hasCachedData ? cachedWeatherData : {
    temperature: null,
    windSpeed: null,
    windDirection: null,
    windGust: null,
    humidity: null,
    visibility: null,
    pressure: null,
    conditions: isOffline ? 'Weather data unavailable offline' : 'Loading...'
  });

  const marineData = currentMarine || (hasCachedData && cachedWeatherData.marine ? cachedWeatherData.marine : {
    waveHeight: null,
    tideHeight: null,
    current: { speed: null, direction: null }
  });

  // Determine data status for UI indicators
  const getDataStatus = () => {
    if (hasCurrentData && !isOffline) return 'current';
    if (hasCachedData && isOffline) return 'cached';
    if (isOffline) return 'offline';
    return 'loading';
  };

  const dataStatus = getDataStatus();

  // If completely offline with no cached data, show offline error
  if (isOffline && dataStatus === 'offline') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <OfflineError
          onRetry={onRefresh}
          message="Weather data is unavailable offline. Connect to the internet to get current conditions."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Weather Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Calendar size={20} color="#10B981" />
          <IOSText textStyle="title3" weight="semibold" style={styles.dateTitle}>
            {getCurrentDateHeader()}
          </IOSText>
        </View>

        {/* Offline Status Indicator */}
        {isOffline && (
          <View style={styles.offlineIndicator}>
            <WifiOff size={16} color="#FF6B35" />
            <IOSText textStyle="caption1" style={styles.offlineText}>
              Offline
            </IOSText>
          </View>
        )}

        {/* Data Status Indicator */}
        {dataStatus === 'cached' && (
          <View style={styles.dataStatusIndicator}>
            <Clock size={16} color="#FF9500" />
            <IOSText textStyle="caption1" style={styles.cachedText}>
              Cached Data
            </IOSText>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Tide Trend Chart */}
        <SimpleTideChart 
          tideData={tideData}
          currentHeight={marineData.tideHeight}
        />

        {/* Weather Metrics */}
        <View style={[styles.metricsContainer, isOffline && styles.offlineContent]}>
          <WeatherMetricRow
            icon={Droplets}
            label="Precipitation"
            value="15%"
            showSeparator={true}
          />

          <WeatherMetricRow
            icon={Droplets}
            label="Humidity"
            value={weatherData.humidity ? `${weatherData.humidity}%` : 'N/A'}
            showSeparator={true}
          />

          <WeatherMetricRow
            icon={Wind}
            label="Wind"
            value={weatherData.windSpeed && weatherData.windDirection
              ? `${weatherData.windSpeed} kts ${formatWindDirection(weatherData.windDirection)}`
              : 'N/A'}
            showSeparator={true}
          />

          <WeatherMetricRow
            icon={Waves}
            label="Waves"
            value={marineData.waveHeight ? `${marineData.waveHeight}m` : 'N/A'}
            showSeparator={true}
          />

          <WeatherMetricRow
            icon={Compass}
            label="Tide"
            value={marineData.tideHeight ? `+${marineData.tideHeight}m` : 'N/A'}
            showSeparator={false}
          />
        </View>

        {/* Weather Summary */}
        <View style={[styles.weatherSummary, isOffline && styles.offlineContent]}>
          <IOSText textStyle="title3" weight="semibold" style={styles.summaryTitle}>
            Current Conditions
          </IOSText>

          <View style={styles.summaryContent}>
            <View style={styles.temperatureSection}>
              <IOSText textStyle="largeTitle" weight="bold" style={styles.temperature}>
                {weatherData.temperature ? `${weatherData.temperature}°C` : 'N/A'}
              </IOSText>
              <IOSText textStyle="body" color="secondaryLabel" style={styles.conditions}>
                {weatherData.conditions}
              </IOSText>
            </View>

            <View style={styles.iconSection}>
              <Cloud size={60} color={isOffline ? "#8E8E93" : "#007AFF"} />
            </View>
          </View>

          {/* Data freshness indicator */}
          {(dataStatus === 'cached' || isOffline) && (
            <View style={styles.dataFreshnessIndicator}>
              <IOSText textStyle="caption2" color="secondaryLabel" style={styles.freshnessText}>
                {dataStatus === 'cached'
                  ? 'Using cached data - may not be current'
                  : 'Connect to internet for current conditions'}
              </IOSText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C7C7CC',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTitle: {
    color: '#000000',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dataStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  cachedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  offlineContent: {
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  metricsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  weatherSummary: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryTitle: {
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  temperatureSection: {
    flex: 1,
  },
  temperature: {
    color: '#007AFF',
    marginBottom: 4,
  },
  conditions: {
    color: '#8E8E93',
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataFreshnessIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    alignItems: 'center',
  },
  freshnessText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});