import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, SlideInRight, useSharedValue, withSpring } from 'react-native-reanimated';
import { 
  Cloud, 
  Wind, 
  Thermometer, 
  Eye, 
  Waves,
  Compass,
  Activity,
  TrendingUp,
  Lock,
  Crown,
  Star,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Zap,
  WifiOff
} from 'lucide-react-native';
import { ErrorBoundary, LoadingSpinner, SkeletonLoader, SimpleError, OfflineError } from '../../components/shared';
import { haptics } from '../../utils/haptics';
import { offlineManager } from '../../services/offlineManager';
import type { WeatherScreenProps } from '../../types/navigation';
import { 
  colors, 
  typography, 
  spacing, 
  shadows,
  sponsorThemes,
  createSponsorTheme,
  getWeatherColor
} from '../../constants/theme';

const { width } = Dimensions.get('window');

// TypeScript interfaces for Weather data
interface MarineWeatherData {
  location: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  waveHeight: number;
  waveDirection: number;
  wavePeriod: number;
  currentSpeed: number;
  currentDirection: number;
  tideHeight: number;
  tideDirection: 'rising' | 'falling';
  conditions: string;
  sailingConditions: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
}

interface WindAnalysis {
  currentTrend: 'increasing' | 'decreasing' | 'steady';
  forecast: Array<{
    time: string;
    speed: number;
    direction: number;
    gusts: number;
  }>;
  raceImpact: 'favorable' | 'challenging' | 'postponement_risk';
}

interface WaveCurrentData {
  significantWaveHeight: number;
  dominantWavePeriod: number;
  waveDirection: number;
  surfaceCurrentSpeed: number;
  surfaceCurrentDirection: number;
  tidalCurrentSpeed: number;
  tidalCurrentDirection: number;
}

interface HourlyForecast {
  time: string;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  precipitation: number;
  conditions: string;
  icon: string;
}

interface WeatherSponsor {
  id: string;
  name: string;
  position: 'header' | 'inline' | 'forecast';
  content: string;
  theme?: keyof typeof sponsorThemes;
  isPremium?: boolean;
}

interface UserSubscription {
  tier: 'free' | 'participant' | 'premium';
  hasAccess: {
    detailedForecast: boolean;
    windAnalysis: boolean;
    waveData: boolean;
    hourlyForecast: boolean;
  };
}

// Mock data
const mockWeatherData: MarineWeatherData = {
  location: 'Royal Hong Kong Yacht Club',
  timestamp: '2027-03-15T15:30:00Z',
  temperature: 24,
  humidity: 68,
  pressure: 1018,
  visibility: 15,
  uvIndex: 6,
  windSpeed: 12,
  windDirection: 220,
  windGust: 16,
  waveHeight: 0.8,
  waveDirection: 200,
  wavePeriod: 4.2,
  currentSpeed: 0.3,
  currentDirection: 180,
  tideHeight: 1.2,
  tideDirection: 'rising',
  conditions: 'Partly Cloudy',
  sailingConditions: 'good',
};

const mockWindAnalysis: WindAnalysis = {
  currentTrend: 'increasing',
  forecast: [
    { time: '16:00', speed: 14, direction: 225, gusts: 18 },
    { time: '17:00', speed: 16, direction: 230, gusts: 20 },
    { time: '18:00', speed: 15, direction: 235, gusts: 19 },
    { time: '19:00', speed: 13, direction: 240, gusts: 17 },
  ],
  raceImpact: 'favorable',
};

const mockWaveCurrentData: WaveCurrentData = {
  significantWaveHeight: 0.8,
  dominantWavePeriod: 4.2,
  waveDirection: 200,
  surfaceCurrentSpeed: 0.3,
  surfaceCurrentDirection: 180,
  tidalCurrentSpeed: 0.5,
  tidalCurrentDirection: 170,
};

const mockHourlyForecast: HourlyForecast[] = [
  { time: '16:00', temperature: 25, windSpeed: 14, windDirection: 225, windGusts: 18, precipitation: 0, conditions: 'Sunny', icon: '☀️' },
  { time: '17:00', temperature: 24, windSpeed: 16, windDirection: 230, windGusts: 20, precipitation: 0, conditions: 'Partly Cloudy', icon: '⛅' },
  { time: '18:00', temperature: 23, windSpeed: 15, windDirection: 235, windGusts: 19, precipitation: 10, conditions: 'Light Clouds', icon: '☁️' },
  { time: '19:00', temperature: 22, windSpeed: 13, windDirection: 240, windGusts: 17, precipitation: 0, conditions: 'Clear', icon: '🌅' },
  { time: '20:00', temperature: 21, windSpeed: 11, windDirection: 245, windGusts: 15, precipitation: 0, conditions: 'Clear', icon: '🌙' },
  { time: '21:00', temperature: 20, windSpeed: 10, windDirection: 250, windGusts: 14, precipitation: 0, conditions: 'Clear', icon: '🌙' },
];

const mockWeatherSponsors: WeatherSponsor[] = [
  {
    id: '1',
    name: 'Garmin Marine',
    position: 'header',
    content: 'Professional Weather Solutions',
    theme: 'omega',
    isPremium: true,
  },
  {
    id: '2',
    name: 'Windy.com',
    position: 'forecast',
    content: 'Powered by Professional Weather Data',
    isPremium: false,
  },
];

const mockUserSubscription: UserSubscription = {
  tier: 'participant',
  hasAccess: {
    detailedForecast: true,
    windAnalysis: true,
    waveData: false, // Premium only
    hourlyForecast: true,
  },
};

export function WeatherScreen({ navigation }: WeatherScreenProps) {
  const [selectedForecastIndex, setSelectedForecastIndex] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<MarineWeatherData | null>(mockWeatherData);
  
  const refreshScale = useSharedValue(1);

  // Monitor offline status
  useEffect(() => {
    const unsubscribe = offlineManager.onStatusChange((status) => {
      setIsOffline(!status.isConnected);
    });
    
    return unsubscribe;
  }, []);

  // Load weather data
  const loadWeatherData = useCallback(async (showLoader: boolean = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isOffline) {
        const cachedData = await offlineManager.getCriticalWeatherData();
        if (cachedData && !cachedData.isOfflineData) {
          setWeatherData(cachedData);
        } else {
          setError('Weather data unavailable offline');
        }
      } else {
        setWeatherData(mockWeatherData);
        // Cache the data for offline use
        await offlineManager.cacheData('critical_weather', mockWeatherData, {
          priority: 'critical',
          expiresIn: 60
        });
      }
    } catch (err) {
      console.error('Failed to load weather data:', err);
      setError('Failed to load weather data');
      await haptics.errorAction();
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isOffline]);

  // Initial load
  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    await haptics.pullToRefresh();
    refreshScale.value = withSpring(1.1, {}, () => {
      refreshScale.value = withSpring(1);
    });
    
    setRefreshing(true);
    await loadWeatherData(false);
  }, [loadWeatherData, refreshScale]);

  // Enhanced button press with haptics
  const handleButtonPress = useCallback(async (action: () => void, hapticType: 'light' | 'medium' | 'success' = 'light') => {
    switch (hapticType) {
      case 'light':
        await haptics.buttonPress();
        break;
      case 'medium':
        await haptics.buttonLongPress();
        break;
      case 'success':
        await haptics.successAction();
        break;
    }
    action();
  }, []);

  // Enhanced forecast selection with haptics and accessibility
  const handleForecastSelection = useCallback(async (index: number) => {
    await haptics.selection();
    setSelectedForecastIndex(index);
  }, []);

  // Upgrade modal with haptics
  const handleUpgradePress = useCallback(async () => {
    await haptics.modalOpen();
    setShowUpgradeModal(true);
  }, []);

  const getSponsorTheme = (themeName?: keyof typeof sponsorThemes) => {
    if (!themeName) return colors;
    return createSponsorTheme(sponsorThemes[themeName]);
  };

  const renderSponsorArea = (sponsor: WeatherSponsor) => {
    const sponsorColors = getSponsorTheme(sponsor.theme);
    
    return (
      <View 
        key={sponsor.id}
        style={[
          styles.sponsorArea,
          { backgroundColor: sponsorColors.background }
        ]}
      >
        <View style={styles.sponsorContent}>
          <Star color={sponsorColors.primary} size={16} />
          <Text style={[styles.sponsorText, { color: sponsorColors.text }]}>
            {sponsor.name} - {sponsor.content}
          </Text>
          {sponsor.isPremium && (
            <Crown color={colors.secondary} size={16} style={{ marginLeft: spacing.xs }} />
          )}
        </View>
      </View>
    );
  };

  const renderAccessBanner = () => {
    const isParticipant = mockUserSubscription.tier === 'participant';
    const isPremium = mockUserSubscription.tier === 'premium';
    
    return (
      <View style={[
        styles.accessBanner,
        { backgroundColor: isPremium ? colors.secondary + '20' : isParticipant ? colors.primary + '20' : colors.warning + '20' }
      ]}>
        <View style={styles.accessContent}>
          {isPremium ? (
            <Crown color={colors.secondary} size={20} />
          ) : isParticipant ? (
            <Activity color={colors.primary} size={20} />
          ) : (
            <Lock color={colors.warning} size={20} />
          )}
          <Text style={styles.accessTitle}>
            {isPremium ? 'Premium Weather Access' : isParticipant ? 'Participant Access' : 'Basic Weather'}
          </Text>
        </View>
        <Text style={styles.accessDescription}>
          {isPremium 
            ? 'Full access to all professional marine weather data'
            : isParticipant 
            ? 'Enhanced weather data for race participants'
            : 'Upgrade for detailed forecasts and analysis'
          }
        </Text>
        {!isPremium && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => handleButtonPress(() => handleUpgradePress(), 'medium')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isParticipant ? 'Upgrade to Premium subscription' : 'Become a Participant'}
            accessibilityHint="Opens subscription options"
          >
            <Text style={styles.upgradeButtonText}>
              {isParticipant ? 'Upgrade to Premium' : 'Become a Participant'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCurrentConditions = () => {
    if (isLoading && !weatherData) {
      return (
        <Animated.View style={styles.currentConditions} entering={FadeInDown.delay(100)}>
          <View style={styles.sectionHeader}>
            <SkeletonLoader width={24} height={24} style={{ borderRadius: 12 }} />
            <SkeletonLoader width={180} height={20} style={{ marginLeft: spacing.sm }} />
            <SkeletonLoader width={16} height={16} style={{ borderRadius: 8 }} />
          </View>
          <View style={styles.mainWeatherCard}>
            <View style={styles.temperatureSection}>
              <SkeletonLoader width={100} height={48} style={{ marginBottom: spacing.sm }} />
              <SkeletonLoader width={120} height={20} style={{ marginBottom: spacing.xs }} />
              <SkeletonLoader width={80} height={14} />
            </View>
            <SkeletonLoader width={80} height={80} style={{ borderRadius: 40, marginLeft: spacing.lg }} />
          </View>
          <View style={styles.detailsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.detailCard}>
                <SkeletonLoader width={20} height={20} style={{ borderRadius: 10, marginBottom: spacing.sm }} />
                <SkeletonLoader width={60} height={20} style={{ marginBottom: spacing.xs }} />
                <SkeletonLoader width={40} height={14} style={{ marginBottom: spacing.xs }} />
                <SkeletonLoader width={50} height={14} />
              </View>
            ))}
          </View>
        </Animated.View>
      );
    }

    if (!weatherData) return null;

    return (
      <Animated.View style={styles.currentConditions} entering={FadeInDown.delay(100)}>
        <View style={styles.sectionHeader}>
          <Cloud color={colors.primary} size={24} />
          <Text 
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
          >
            Current Conditions
          </Text>
          {isOffline && <WifiOff color={colors.warning} size={16} />}
          {!isOffline && <RefreshCw color={colors.textMuted} size={16} />}
        </View>

        <View style={styles.mainWeatherCard}>
          <View style={styles.temperatureSection}>
            <Text 
              style={styles.temperature}
              accessible={true}
              accessibilityLabel={`Temperature: ${weatherData.temperature} degrees Celsius`}
            >
              {weatherData.temperature}°C
            </Text>
            <Text 
              style={styles.conditions}
              accessible={true}
              accessibilityLabel={`Weather conditions: ${weatherData.conditions}`}
            >
              {weatherData.conditions}
            </Text>
            <Text 
              style={styles.lastUpdated}
              accessible={true}
              accessibilityLabel={`Last updated at ${new Date().toLocaleTimeString()}`}
            >
              Updated {new Date().toLocaleTimeString()}
              {isOffline && ' (Cached)'}
            </Text>
          </View>
          <View style={styles.weatherIcon}>
            <Cloud color={colors.info} size={80} />
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailCard}>
            <Wind color={colors.primary} size={20} />
            <Text 
              style={styles.detailValue}
              accessible={true}
              accessibilityLabel={`Wind speed: ${weatherData.windSpeed} knots`}
            >
              {weatherData.windSpeed} kts
            </Text>
            <Text style={styles.detailLabel}>Wind</Text>
            <Text 
              style={styles.detailExtra}
              accessible={true}
              accessibilityLabel={`Wind direction: ${weatherData.windDirection} degrees Southwest`}
            >
              {weatherData.windDirection}° SW
            </Text>
          </View>
          <View style={styles.detailCard}>
            <Zap color={colors.warning} size={20} />
            <Text 
              style={styles.detailValue}
              accessible={true}
              accessibilityLabel={`Wind gusts: ${weatherData.windGust} knots`}
            >
              {weatherData.windGust} kts
            </Text>
            <Text style={styles.detailLabel}>Gusts</Text>
            <Text style={styles.detailExtra}>Max</Text>
          </View>
          <View style={styles.detailCard}>
            <Eye color={colors.accent} size={20} />
            <Text 
              style={styles.detailValue}
              accessible={true}
              accessibilityLabel={`Visibility: ${weatherData.visibility} kilometers`}
            >
              {weatherData.visibility} km
            </Text>
            <Text style={styles.detailLabel}>Visibility</Text>
            <Text style={styles.detailExtra}>Excellent</Text>
          </View>
          <View style={styles.detailCard}>
            <Thermometer color={colors.error} size={20} />
            <Text 
              style={styles.detailValue}
              accessible={true}
              accessibilityLabel={`Humidity: ${weatherData.humidity} percent`}
            >
              {weatherData.humidity}%
            </Text>
            <Text style={styles.detailLabel}>Humidity</Text>
            <Text style={styles.detailExtra}>Comfortable</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderWindAnalysis = () => {
    const hasAccess = mockUserSubscription.hasAccess.windAnalysis;
    
    return (
      <View style={styles.windAnalysis}>
        <View style={styles.sectionHeader}>
          <BarChart3 color={colors.accent} size={24} />
          <Text style={styles.sectionTitle}>Professional Wind Analysis</Text>
          {!hasAccess && <Lock color={colors.textMuted} size={16} />}
        </View>

        {hasAccess ? (
          <>
            <View style={styles.windTrendCard}>
              <View style={styles.trendHeader}>
                <Text style={styles.trendTitle}>Wind Trend</Text>
                <View style={[
                  styles.trendBadge,
                  { backgroundColor: getWeatherColor(mockWindAnalysis.currentTrend === 'increasing' ? 'moderate' : 'light') + '20' }
                ]}>
                  {mockWindAnalysis.currentTrend === 'increasing' ? (
                    <ArrowUp color={colors.warning} size={16} />
                  ) : (
                    <ArrowDown color={colors.success} size={16} />
                  )}
                  <Text style={styles.trendText}>{mockWindAnalysis.currentTrend}</Text>
                </View>
              </View>
              
              <View style={styles.windForecastChart}>
                {mockWindAnalysis.forecast.map((item, index) => (
                  <View key={index} style={styles.windForecastItem}>
                    <Text style={styles.forecastTime}>{item.time}</Text>
                    <View style={[styles.windBar, { height: (item.speed / 20) * 60 }]} />
                    <Text style={styles.windValue}>{item.speed}</Text>
                    <Compass color={colors.textMuted} size={12} style={{ transform: [{ rotate: `${item.direction}deg` }] }} />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.raceImpactCard}>
              <Text style={styles.impactTitle}>Race Impact Assessment</Text>
              <View style={[
                styles.impactBadge,
                { backgroundColor: colors.success + '20' }
              ]}>
                <Text style={[styles.impactText, { color: colors.success }]}>
                  {mockWindAnalysis.raceImpact.toUpperCase()}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.lockedContent}>
            <Lock color={colors.textMuted} size={32} />
            <Text style={styles.lockedText}>Professional wind analysis available for participants</Text>
            <TouchableOpacity style={styles.unlockButton}>
              <Text style={styles.unlockButtonText}>Unlock Analysis</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderWaveCurrentAnalysis = () => {
    const hasAccess = mockUserSubscription.hasAccess.waveData;
    
    return (
      <View style={styles.waveCurrentAnalysis}>
        <View style={styles.sectionHeader}>
          <Waves color={colors.info} size={24} />
          <Text style={styles.sectionTitle}>Wave & Current Analysis</Text>
          <Crown color={colors.secondary} size={16} />
        </View>

        {hasAccess ? (
          <View style={styles.waveCurrentGrid}>
            <View style={styles.waveCurrentCard}>
              <Text style={styles.waveCurrentTitle}>Wave Conditions</Text>
              <Text style={styles.waveCurrentValue}>{mockWaveCurrentData.significantWaveHeight}m</Text>
              <Text style={styles.waveCurrentLabel}>Significant Height</Text>
              <Text style={styles.waveCurrentExtra}>{mockWaveCurrentData.dominantWavePeriod}s period</Text>
            </View>
            <View style={styles.waveCurrentCard}>
              <Text style={styles.waveCurrentTitle}>Surface Current</Text>
              <Text style={styles.waveCurrentValue}>{mockWaveCurrentData.surfaceCurrentSpeed} kts</Text>
              <Text style={styles.waveCurrentLabel}>Speed</Text>
              <Text style={styles.waveCurrentExtra}>{mockWaveCurrentData.surfaceCurrentDirection}° direction</Text>
            </View>
          </View>
        ) : (
          <View style={styles.premiumContent}>
            <Crown color={colors.secondary} size={32} />
            <Text style={styles.premiumText}>Premium wave and current analysis</Text>
            <Text style={styles.premiumSubtext}>Detailed marine data for professional racing</Text>
            <TouchableOpacity style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderHourlyForecast = () => {
    const hasAccess = mockUserSubscription.hasAccess.hourlyForecast;
    
    return (
      <View style={styles.hourlyForecast}>
        <View style={styles.sectionHeader}>
          <TrendingUp color={colors.secondary} size={24} />
          <Text style={styles.sectionTitle}>6-Hour Forecast</Text>
        </View>

        {hasAccess ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
            {mockHourlyForecast.map((hour, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.hourlyCard,
                  selectedForecastIndex === index && styles.hourlyCardSelected
                ]}
                onPress={() => handleForecastSelection(index)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${hour.time}, ${hour.temperature} degrees, ${hour.windSpeed} knots wind, ${hour.conditions}`}
                accessibilityState={{ selected: selectedForecastIndex === index }}
              >
                <Text 
                  style={styles.hourlyTime}
                  accessible={false}
                >
                  {hour.time}
                </Text>
                <Text 
                  style={styles.hourlyIcon}
                  accessible={false}
                >
                  {hour.icon}
                </Text>
                <Text 
                  style={styles.hourlyTemp}
                  accessible={false}
                >
                  {hour.temperature}°
                </Text>
                <Text 
                  style={styles.hourlyWind}
                  accessible={false}
                >
                  {hour.windSpeed}kts
                </Text>
                <Wind 
                  color={colors.primary} 
                  size={12} 
                  style={{ transform: [{ rotate: `${hour.windDirection}deg` }] }} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.limitedForecast}>
            <Text style={styles.limitedText}>Basic 3-hour forecast available</Text>
            <TouchableOpacity style={styles.expandButton}>
              <Text style={styles.expandButtonText}>Unlock 6-Hour Forecast</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const headerSponsor = mockWeatherSponsors.find(s => s.position === 'header');
  const forecastSponsor = mockWeatherSponsors.find(s => s.position === 'forecast');

  // Show loading screen on initial load
  if (isLoading && !weatherData && !error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner 
            size="large" 
            text="Loading weather data..." 
            showBackground={true}
            testID="weather-loading"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !weatherData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {headerSponsor && renderSponsorArea(headerSponsor)}
        {isOffline ? (
          <OfflineError 
            onRetry={() => loadWeatherData()}
            testID="weather-offline-error"
          />
        ) : (
          <SimpleError
            message={error}
            onRetry={() => loadWeatherData()}
            testID="weather-error"
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Weather screen error:', error, errorInfo);
        haptics.errorAction();
      }}
      testID="weather-error-boundary"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header Sponsor */}
        {headerSponsor && renderSponsorArea(headerSponsor)}
        
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
          accessible={true}
          accessibilityLabel="Weather information scroll view"
        >
          {/* Offline indicator */}
          {isOffline && (
            <Animated.View 
              style={styles.offlineIndicator}
              entering={SlideInRight.duration(300)}
            >
              <WifiOff color={colors.warning} size={16} />
              <Text style={styles.offlineText}>You're offline - showing cached data</Text>
            </Animated.View>
          )}

          {/* Participant Access Banner */}
          {renderAccessBanner()}

          {/* Current Conditions */}
          {renderCurrentConditions()}

          {/* Professional Wind Analysis */}
          {renderWindAnalysis()}

          {/* Wave & Current Analysis */}
          {renderWaveCurrentAnalysis()}

          {/* 6-Hour Forecast */}
          {renderHourlyForecast()}

          {/* Forecast Sponsor */}
          {forecastSponsor && renderSponsorArea(forecastSponsor)}
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  offlineText: {
    ...typography.body2,
    color: colors.warning,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },

  // Sponsor Areas
  sponsorArea: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sponsorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsorText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },

  // Access Banner (Freemium)
  accessBanner: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  accessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  accessTitle: {
    ...typography.h6,
    color: colors.text,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  accessDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    ...typography.button,
    color: colors.background,
    fontSize: 14,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },

  // Current Conditions
  currentConditions: {
    marginTop: spacing.md,
  },
  mainWeatherCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    ...shadows.card,
  },
  temperatureSection: {
    flex: 1,
  },
  temperature: {
    ...typography.h1,
    fontSize: 48,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  conditions: {
    ...typography.h6,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  lastUpdated: {
    ...typography.caption,
    color: colors.textMuted,
  },
  weatherIcon: {
    marginLeft: spacing.lg,
  },
  
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  detailCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.small,
  },
  detailValue: {
    ...typography.h6,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs / 2,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  detailExtra: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
    textAlign: 'center',
  },

  // Wind Analysis
  windAnalysis: {
    marginTop: spacing.lg,
  },
  windTrendCard: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    ...shadows.card,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  trendTitle: {
    ...typography.h6,
    color: colors.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: spacing.sm,
  },
  trendText: {
    ...typography.caption,
    color: colors.text,
    marginLeft: spacing.xs / 2,
    fontWeight: '600',
  },
  windForecastChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  windForecastItem: {
    alignItems: 'center',
    flex: 1,
  },
  forecastTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  windBar: {
    backgroundColor: colors.primary,
    width: 8,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  windValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  raceImpactCard: {
    backgroundColor: colors.background,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  impactTitle: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  impactBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  impactText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: '700',
  },

  // Locked/Premium Content
  lockedContent: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.7,
  },
  lockedText: {
    ...typography.body2,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  unlockButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
  },
  unlockButtonText: {
    ...typography.button,
    color: colors.background,
    fontSize: 14,
  },
  premiumContent: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary + '40',
  },
  premiumText: {
    ...typography.h6,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  premiumSubtext: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  premiumButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
  },
  premiumButtonText: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
  },

  // Wave & Current Analysis
  waveCurrentAnalysis: {
    marginTop: spacing.lg,
  },
  waveCurrentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  waveCurrentCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    ...shadows.card,
  },
  waveCurrentTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  waveCurrentValue: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  waveCurrentLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  waveCurrentExtra: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Hourly Forecast
  hourlyForecast: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  forecastScroll: {
    paddingLeft: spacing.md,
  },
  hourlyCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: spacing.sm,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.small,
  },
  hourlyCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  hourlyTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  hourlyIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  hourlyTemp: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  hourlyWind: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  limitedForecast: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  limitedText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  expandButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
  },
  expandButtonText: {
    ...typography.button,
    color: colors.background,
    fontSize: 14,
  },
});