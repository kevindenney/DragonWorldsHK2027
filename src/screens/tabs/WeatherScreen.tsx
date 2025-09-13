import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOSText } from '../../components/ios/IOSText';
import { 
  Cloud, 
  Droplets, 
  Wind, 
  Waves, 
  Compass,
  Calendar
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
import type { WeatherScreenProps } from '../../types/navigation';

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
  
  // Weather store hooks
  const { refreshWeather } = useWeatherStore();
  const currentWeather = useCurrentWeather();
  const currentMarine = useCurrentMarine();
  const isLoading = useWeatherLoading();
  const error = useWeatherError();
  
  const tideData = generateTideData();
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshWeather();
    } catch (err) {
      console.error('Weather refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshWeather]);

  const getCurrentDateHeader = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('en-US', options);
  };

  // Fallback data for demonstration
  const weatherData = currentWeather || {
    temperature: 24,
    windSpeed: 12,
    windDirection: 180,
    windGust: 15,
    humidity: 71,
    visibility: 10,
    pressure: 1013,
    conditions: 'Partly Cloudy'
  };

  const marineData = currentMarine || {
    waveHeight: 1.4,
    tideHeight: 0.8,
    current: { speed: 0.3, direction: 45 }
  };

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
        <View style={styles.metricsContainer}>
          <WeatherMetricRow
            icon={Droplets}
            label="Precipitation"
            value="15%"
            showSeparator={true}
          />
          
          <WeatherMetricRow
            icon={Droplets}
            label="Humidity"
            value={`${weatherData.humidity}%`}
            showSeparator={true}
          />
          
          <WeatherMetricRow
            icon={Wind}
            label="Wind"
            value={`${weatherData.windSpeed} kts ${formatWindDirection(weatherData.windDirection)}`}
            showSeparator={true}
          />
          
          <WeatherMetricRow
            icon={Waves}
            label="Waves"
            value={`${marineData.waveHeight}m`}
            showSeparator={true}
          />
          
          <WeatherMetricRow
            icon={Compass}
            label="Tide"
            value={`+${marineData.tideHeight}m`}
            showSeparator={false}
          />
        </View>

        {/* Weather Summary */}
        <View style={styles.weatherSummary}>
          <IOSText textStyle="title3" weight="semibold" style={styles.summaryTitle}>
            Current Conditions
          </IOSText>
          
          <View style={styles.summaryContent}>
            <View style={styles.temperatureSection}>
              <IOSText textStyle="largeTitle" weight="bold" style={styles.temperature}>
                {weatherData.temperature}°C
              </IOSText>
              <IOSText textStyle="body" color="secondaryLabel" style={styles.conditions}>
                {weatherData.conditions}
              </IOSText>
            </View>
            
            <View style={styles.iconSection}>
              <Cloud size={60} color="#007AFF" />
            </View>
          </View>
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
});