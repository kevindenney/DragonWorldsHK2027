import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Cloud, 
  Thermometer, 
  Wind, 
  Eye,
  RefreshCw,
  BarChart3
} from 'lucide-react-native';
import { colors, spacing } from '../../constants/theme';
import {
  useWeatherStore,
  useCurrentWeather,
  useCurrentMarine,
  useWeatherForecasts,
} from '../../stores/weatherStore';

const { width } = Dimensions.get('window');

interface DarkSkyWeatherScreenProps {
  navigation: any;
}

export const DarkSkyWeatherScreen: React.FC<DarkSkyWeatherScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  
  // Get real weather data
  const { refreshWeather } = useWeatherStore();
  const currentWeather = useCurrentWeather();
  const currentMarine = useCurrentMarine();
  const forecasts = useWeatherForecasts();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWeather();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  const toggleView = () => {
    setViewMode(viewMode === 'overview' ? 'detailed' : 'overview');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* SUCCESS BANNER - Proves the new screen is loading */}
      <View style={styles.successBanner}>
        <Text style={styles.successTitle}>🎉 NEW DARK SKY WEATHER SCREEN LOADED! 🎉</Text>
        <Text style={styles.successSubtitle}>You're now seeing the brand new weather interface!</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Racing Controls */}
        <View style={styles.controlsCard}>
          <Text style={styles.cardTitle}>Racing Controls</Text>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, refreshing && styles.controlButtonDisabled]}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw color={refreshing ? colors.textMuted : colors.primary} size={20} />
              <Text style={styles.controlText}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={toggleView}>
              <BarChart3 color={colors.primary} size={20} />
              <Text style={styles.controlText}>
                View: {viewMode}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Weather Card */}
        {currentWeather && (
          <View style={styles.weatherCard}>
            <Text style={styles.cardTitle}>Current Conditions</Text>
            
            <View style={styles.mainWeather}>
              <View style={styles.temperatureSection}>
                <Text style={styles.temperature}>{currentWeather.temperature}°C</Text>
                <Text style={styles.conditions}>{currentWeather.conditions}</Text>
                <Text style={styles.feelsLike}>
                  Feels like {currentWeather.feelsLike || currentWeather.temperature}°C
                </Text>
              </View>
              
              <View style={styles.weatherIcon}>
                <Cloud color={colors.primary} size={60} />
              </View>
            </View>

            <View style={styles.weatherDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Wind color={colors.primary} size={20} />
                  <Text style={styles.detailValue}>{currentWeather.windSpeed} kts</Text>
                  <Text style={styles.detailLabel}>Wind Speed</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>{currentWeather.windDirection}°</Text>
                  <Text style={styles.detailLabel}>Wind Direction</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Eye color={colors.primary} size={20} />
                  <Text style={styles.detailValue}>{currentWeather.visibility} km</Text>
                  <Text style={styles.detailLabel}>Visibility</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>{currentWeather.humidity}%</Text>
                  <Text style={styles.detailLabel}>Humidity</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>{currentWeather.pressure} hPa</Text>
                  <Text style={styles.detailLabel}>Pressure</Text>
                </View>
                
                {currentWeather.windGust && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailValue}>{currentWeather.windGust} kts</Text>
                    <Text style={styles.detailLabel}>Gusts</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Marine Conditions */}
        {currentMarine && viewMode === 'detailed' && (
          <View style={styles.weatherCard}>
            <Text style={styles.cardTitle}>Marine Conditions</Text>
            
            <View style={styles.marineGrid}>
              <View style={styles.marineItem}>
                <Text style={styles.marineValue}>{currentMarine.waveHeight || 0}m</Text>
                <Text style={styles.marineLabel}>Wave Height</Text>
              </View>
              
              <View style={styles.marineItem}>
                <Text style={styles.marineValue}>{currentMarine.current?.speed || 0} kts</Text>
                <Text style={styles.marineLabel}>Current</Text>
              </View>
              
              <View style={styles.marineItem}>
                <Text style={styles.marineValue}>{currentMarine.tide?.height || 0}m</Text>
                <Text style={styles.marineLabel}>Tide</Text>
              </View>
            </View>
          </View>
        )}

        {/* Hourly Forecast */}
        {forecasts.length > 0 && (
          <View style={styles.weatherCard}>
            <Text style={styles.cardTitle}>Hourly Forecast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
              {forecasts.slice(0, 12).map((forecast, index) => (
                <View key={index} style={styles.forecastItem}>
                  <Text style={styles.forecastTime}>
                    {new Date(forecast.time).getHours()}:00
                  </Text>
                  <Cloud color={colors.primary} size={24} />
                  <Text style={styles.forecastTemp}>
                    {forecast.weather.temperature}°
                  </Text>
                  <Text style={styles.forecastWind}>
                    {forecast.weather.windSpeed} kts
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Data Source Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            🌊 Dragon Worlds Weather System
          </Text>
          <Text style={styles.infoSubtext}>
            Real-time data from OpenWeatherMap & Open-Meteo APIs
          </Text>
          <Text style={styles.infoSubtext}>
            Location: Hong Kong Racing Area (22.35°N, 114.25°E)
          </Text>
          {currentWeather && (
            <Text style={styles.updateTime}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1c', // Dark Sky dark background
  },
  successBanner: {
    backgroundColor: '#00ff00',
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 12,
    color: '#000000',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  controlsCard: {
    backgroundColor: '#2c2c2e',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#48484a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3a3a3c',
    minWidth: 100,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlText: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 4,
    textAlign: 'center',
  },
  weatherCard: {
    backgroundColor: '#2c2c2e',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#48484a',
  },
  mainWeather: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  temperatureSection: {
    flex: 1,
  },
  temperature: {
    fontSize: 48,
    fontWeight: '200',
    color: '#ffffff',
  },
  conditions: {
    fontSize: 16,
    color: '#e5e5e7',
    marginTop: 4,
  },
  feelsLike: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 2,
  },
  weatherIcon: {
    alignItems: 'center',
  },
  weatherDetails: {
    borderTopWidth: 1,
    borderTopColor: '#48484a',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  marineGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marineItem: {
    alignItems: 'center',
    flex: 1,
  },
  marineValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007aff',
  },
  marineLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4,
  },
  forecastScroll: {
    marginTop: 8,
  },
  forecastItem: {
    alignItems: 'center',
    padding: 12,
    marginRight: 8,
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
    minWidth: 80,
  },
  forecastTime: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 8,
  },
  forecastWind: {
    fontSize: 12,
    color: '#007aff',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#2c2c2e',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#48484a',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007aff',
    textAlign: 'center',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 4,
  },
  updateTime: {
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 8,
  },
});