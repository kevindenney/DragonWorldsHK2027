import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Note: Import weatherManager dynamically to avoid circular dependency
import { subscriptionService } from '../services/subscriptionService';
import { errorHandler, handleWeatherAPIError } from '../services/errorHandler';
import { WeatherUnits, TemperatureUnit, WindSpeedUnit, PressureUnit } from '../components/weather/UnitConverter';
import type {
  HKOWeatherBuoy,
  HKOTideStation,
  HKODriftingBuoy,
  HKOMarineForecastArea,
  HKOMarineWarning
} from '../services/hkoAPI';

// TypeScript interfaces
export interface WeatherCondition {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  visibility: number;
  pressure: number;
  humidity: number;
  conditions: string; // e.g., "Partly Cloudy"
  uvIndex?: number;
  lastUpdated?: string;
  feelsLike?: number;
}

export interface MarineCondition {
  waveHeight: number;
  swellPeriod: number;
  swellDirection: number;
  tideHeight: number;
  tideTime?: string;
  tideType?: 'high' | 'low';
  current: {
    speed: number;
    direction: number;
  };
  seaTemperature?: number;
  // Additional properties for location weather service
  wavePeriod?: number;
  waveDirection?: number;
  tideTrend?: 'rising' | 'falling';
  waterTemperature?: number;
  lastUpdated?: string;
  // Tide object for convenience
  tide?: {
    height: number;
    trend?: 'rising' | 'falling';
    nextHigh?: { time: string; height: number };
    nextLow?: { time: string; height: number };
  };
}

export interface WeatherForecast {
  id: string;
  time: string;
  date: string;
  weather: WeatherCondition;
  marine: MarineCondition;
  racingConditions: {
    suitability: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
    windCategory: 'light' | 'moderate' | 'fresh' | 'strong' | 'gale';
    warnings: string[];
    recommendations: string[];
  };
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  title: string;
  message: string;
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  validFrom: string;
  validTo: string;
  areas: string[];
}

export interface SubscriptionTier {
  id: string;
  name: string;
  features: string[];
  maxForecasts: number;
  detailLevel: 'basic' | 'professional' | 'premium';
  alerts: boolean;
  marineData: boolean;
  racingAnalysis: boolean;
}

export type ParticipantStatus = 'competitor' | 'support' | 'spectator' | 'official' | 'media';

// Location-based forecasting interfaces
export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  id: string;
  name: string;
  coordinate: LocationCoordinate;
  type: 'marina' | 'race-area' | 'harbor' | 'city' | 'custom' | 'bay';
  description?: string;
}

export interface HourlyForecastData {
  time: string;
  hour: number;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  tideHeight: number;
  precipitation: number;
  conditions: string;
  humidity: number;
}

export interface DailyForecastData {
  id: string;
  date: string;
  dayName: string;
  dayShort: string;
  high: number;
  low: number;
  conditions: string;
  precipitationChance: number;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  highTideTime: string;
  lowTideTime: string;
  tideRange: number;
  sailingConditions: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
  uvIndex: number;
  humidity: number;
}

export interface LocationBasedForecast {
  location: LocationData;
  currentWeather: WeatherCondition;
  currentMarine: MarineCondition;
  hourlyForecast: HourlyForecastData[];
  dailyForecast: DailyForecastData[];
  lastUpdate: string;
}

interface WeatherState {
  // State
  currentConditions: WeatherCondition | null;
  currentMarine: MarineCondition | null;
  forecasts: WeatherForecast[];
  alerts: WeatherAlert[];
  subscriptionStatus: 'free' | 'basic' | 'professional' | 'elite';
  participantAccess: ParticipantStatus | null;
  lastUpdate: string | null;
  loading: boolean;
  error: string | null;

  // Location-based forecasting state
  selectedLocation: LocationData | null;
  locationForecasts: Map<string, LocationBasedForecast>;
  recentLocations: LocationData[];
  favoriteLocations: LocationData[];
  hourlyForecast: HourlyForecastData[];
  dailyForecast: DailyForecastData[];
  isLocationLoading: boolean;

  // HKO Real-time Data State
  hkoWeatherBuoys: HKOWeatherBuoy[];
  hkoTideStations: HKOTideStation[];
  hkoDriftingBuoys: HKODriftingBuoy[];
  hkoMarineAreas: HKOMarineForecastArea[];
  hkoMarineWarnings: HKOMarineWarning[];
  hkoDataUpdateTime: string | null;
  hkoPollingActive: boolean;

  // Active sources per metric
  activeSources: {
    temperature?: { source: string; at: string };
    wind?: { source: string; at: string };
    waves?: { source: string; at: string };
    tide?: { source: string; at: string };
  };

  // Freemium model state
  dailyQueries: number;
  maxDailyQueries: number;
  premiumUnlocked: boolean;
  trialActive: boolean;
  trialExpiresAt: string | null;

  // Unit preferences state
  units: WeatherUnits;
  selectedDayId: string | null;

  // Station visibility state
  nauticalMapVisible: boolean;
  windStationsVisible: boolean;
  waveStationsVisible: boolean;
  tideStationsVisible: boolean;

  // Actions
  updateWeather: (conditions: WeatherCondition, marine: MarineCondition) => void;
  updateForecasts: (forecasts: WeatherForecast[]) => void;
  updateAlerts: (alerts: WeatherAlert[]) => void;
  checkSubscriptionAccess: (feature: string) => boolean;
  setParticipantStatus: (status: ParticipantStatus) => void;
  setSubscriptionStatus: (status: WeatherState['subscriptionStatus']) => void;
  toggleSubscription: (tier: string) => Promise<void>;
  refreshWeather: () => Promise<void>;
  incrementQuery: () => boolean; // Returns false if limit exceeded
  resetDailyQueries: () => void;
  startTrial: () => void;
  checkTrialStatus: () => boolean;
  getAccessLevel: () => 'free' | 'participant' | 'premium';
  canAccessFeature: (feature: WeatherFeature) => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Location-based forecasting actions
  setSelectedLocation: (location: LocationData) => void;
  fetchWeatherData: (coordinate: LocationCoordinate, options?: { date?: Date; time?: Date }) => Promise<void>;
  addRecentLocation: (location: LocationData) => void;
  addFavoriteLocation: (location: LocationData) => void;
  removeFavoriteLocation: (locationId: string) => void;
  updateHourlyForecast: (data: HourlyForecastData[]) => void;
  updateDailyForecast: (data: DailyForecastData[]) => void;
  getLocationForecast: (locationId: string) => LocationBasedForecast | null;
  clearLocationCache: () => void;
  
  // Unit preferences actions
  setUnits: (units: WeatherUnits) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setWindSpeedUnit: (unit: WindSpeedUnit) => void;
  setPressureUnit: (unit: PressureUnit) => void;
  
  // Day selection actions
  setSelectedDayId: (dayId: string | null) => void;

  // Station visibility actions
  toggleNauticalMap: () => void;
  toggleWindStations: () => void;
  toggleWaveStations: () => void;
  toggleTideStations: () => void;
  // Additional map layer toggles
  toggleNauticalMapVisible: () => void;
  toggleRadarVisible: () => void;
  toggleSatelliteVisible: () => void;
  // Visibility state
  radarVisible: boolean;
  satelliteVisible: boolean;

  // HKO Real-time Data Actions
  updateHKOWeatherBuoys: (buoys: HKOWeatherBuoy[]) => void;
  updateHKOTideStations: (stations: HKOTideStation[]) => void;
  updateHKODriftingBuoys: (buoys: HKODriftingBuoy[]) => void;
  updateHKOMarineAreas: (areas: HKOMarineForecastArea[]) => void;
  updateHKOWarnings: (warnings: HKOMarineWarning[]) => void;
  startHKOPolling: () => void;
  stopHKOPolling: () => void;
  fetchHKOData: () => Promise<void>;
}

export type WeatherFeature = 
  | 'basicForecast' 
  | 'detailedAnalysis' 
  | 'marineConditions' 
  | 'racingInsights'
  | 'alerts'
  | '6hourForecast'
  | '24hourForecast'
  | 'professionalAnalysis';

// Sample data generation functions for development
const generateSampleHourlyData = (): HourlyForecastData[] => {
  const data: HourlyForecastData[] = [];
  const baseTemp = 25;
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const hour = (now.getHours() + i) % 24;
    const timeStr = hour === 0 ? '12 AM' : 
                   hour === 12 ? '12 PM' : 
                   hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
    
    const tempVariation = Math.sin((hour - 6) * Math.PI / 12) * 8;
    const randomVariation = (Math.random() - 0.5) * 3;
    
    data.push({
      time: timeStr,
      hour: hour,
      temperature: Math.round(baseTemp + tempVariation + randomVariation),
      windSpeed: Math.round(8 + Math.sin(hour * Math.PI / 12) * 4 + Math.random() * 3),
      windDirection: 180 + Math.sin(hour * Math.PI / 8) * 45,
      waveHeight: 1.2 + Math.sin(hour * Math.PI / 6) * 0.4 + Math.random() * 0.2,
      tideHeight: Math.sin(hour * Math.PI / 6.2) * 1.5,
      precipitation: Math.random() * 30,
      conditions: i < 8 ? 'Partly Cloudy' : i < 16 ? 'Sunny' : 'Clear',
      humidity: 60 + Math.random() * 25
    });
  }
  
  return data;
};

const generateSampleDailyData = async (coordinate?: LocationCoordinate): Promise<DailyForecastData[]> => {

  const days = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  const conditions = ['Partly cloudy', 'Sunny', 'Mostly sunny', 'Cloudy', 'Rain', 'Partly cloudy', 'Sunny', 'Thunderstorms'];
  const sailingConditions = ['good', 'excellent', 'good', 'moderate', 'poor', 'good', 'excellent', 'dangerous'] as const;

  // Default coordinate for Hong Kong waters if none provided
  const defaultCoordinate = coordinate || { latitude: 22.225, longitude: 114.125 };

  // Import unified tide service dynamically to avoid circular dependency
  let unifiedTideService;
  try {
    const module = await import('../services/unifiedTideService');
    unifiedTideService = module.unifiedTideService;
  } catch (error) {
    unifiedTideService = null;
  }

  return days.map((day, index) => {
    const baseTemp = 87 - index * 1;
    const tempVariation = Math.random() * 4 - 2;
    const dayDate = new Date(Date.now() + index * 24 * 60 * 60 * 1000);

    // Get unified tide data for this day
    let highTideTime = `${Math.floor(6 + index * 0.8) % 12 || 12}:${30 + index * 10}${index % 2 ? 'AM' : 'PM'}`;
    let lowTideTime = `${Math.floor(12 + index * 0.8) % 12 || 12}:${15 + index * 5}${index % 2 ? 'PM' : 'AM'}`;
    let tideRange = 1.8 + Math.random() * 0.8;

    if (unifiedTideService) {
      try {
        // Get high tide time (typically around 6 AM and 6 PM)
        const morningHighTide = new Date(dayDate);
        morningHighTide.setHours(6, 30 + index * 10, 0);

        const eveningHighTide = new Date(dayDate);
        eveningHighTide.setHours(18, 15 + index * 15, 0);

        // Get low tide time (typically around 12 PM and 12 AM)
        const noonLowTide = new Date(dayDate);
        noonLowTide.setHours(12, 45 + index * 5, 0);

        // Use the morning high tide and noon low tide for display
        highTideTime = morningHighTide.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        lowTideTime = noonLowTide.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        // Calculate tide range from unified service
        const highTideHeight = unifiedTideService.getCurrentTideHeight(defaultCoordinate, morningHighTide);
        const lowTideHeight = unifiedTideService.getCurrentTideHeight(defaultCoordinate, noonLowTide);
        tideRange = Math.abs(highTideHeight - lowTideHeight);


      } catch (error) {
      }
    }

    return {
      id: `day-${index}`,
      date: dayDate.toISOString(),
      dayName: day === 'Thu' ? 'Today' : day,
      dayShort: day,
      high: Math.round(baseTemp + tempVariation),
      low: Math.round(baseTemp - 5 + tempVariation),
      conditions: conditions[index],
      precipitationChance: index === 4 ? 80 : Math.round(Math.random() * 30),
      windSpeed: Math.round(7 + Math.random() * 15),
      windDirection: 180 + (Math.random() - 0.5) * 60,
      waveHeight: 1.2 + Math.random() * 1.3,
      highTideTime,
      lowTideTime,
      tideRange: Math.round(tideRange * 100) / 100,
      sailingConditions: sailingConditions[index],
      uvIndex: Math.round(5 + Math.random() * 5),
      humidity: Math.round(65 + Math.random() * 20)
    };
  });
};

// Subscription tier definitions
const subscriptionTiers: Record<string, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'Free',
    features: ['basicForecast'],
    maxForecasts: 3,
    detailLevel: 'basic',
    alerts: false,
    marineData: false,
    racingAnalysis: false
  },
  basic: {
    id: 'basic',
    name: 'Basic Sailing',
    features: ['basicForecast', '6hourForecast', 'alerts'],
    maxForecasts: 12,
    detailLevel: 'basic',
    alerts: true,
    marineData: false,
    racingAnalysis: false
  },
  professional: {
    id: 'professional',
    name: 'Professional Racing',
    features: ['basicForecast', '6hourForecast', '24hourForecast', 'detailedAnalysis', 'marineConditions', 'alerts'],
    maxForecasts: 48,
    detailLevel: 'professional',
    alerts: true,
    marineData: true,
    racingAnalysis: true
  },
  elite: {
    id: 'elite',
    name: 'Elite Sailor',
    features: ['basicForecast', '6hourForecast', '24hourForecast', 'detailedAnalysis', 'marineConditions', 'racingInsights', 'alerts', 'professionalAnalysis'],
    maxForecasts: 168, // 7 days
    detailLevel: 'premium',
    alerts: true,
    marineData: true,
    racingAnalysis: true
  }
};


export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentConditions: null,
      currentMarine: null,
      forecasts: [],
      alerts: [],
      subscriptionStatus: 'free',
      participantAccess: null,
      lastUpdate: null,
      loading: false,
      error: null,
      
      // Location-based forecasting state
      selectedLocation: null,
      locationForecasts: new Map(),
      recentLocations: [],
      favoriteLocations: [],
      hourlyForecast: [],
      dailyForecast: [],
      isLocationLoading: false,

      activeSources: {},
      
      // Freemium model state
      dailyQueries: 0,
      maxDailyQueries: 10,
      premiumUnlocked: false,
      trialActive: false,
      trialExpiresAt: null,
      
      // Unit preferences state
      units: {
        temperature: 'C',
        windSpeed: 'kts',
        pressure: 'hPa',
        distance: 'metric'
      },
      selectedDayId: null,

      // Station visibility state
      nauticalMapVisible: false,
      windStationsVisible: false,
      waveStationsVisible: false,
      tideStationsVisible: false,
      radarVisible: false,
      satelliteVisible: false,

      // HKO Real-time Data Initial State
      hkoWeatherBuoys: [],
      hkoTideStations: [],
      hkoDriftingBuoys: [],
      hkoMarineAreas: [],
      hkoMarineWarnings: [],
      hkoDataUpdateTime: null,
      hkoPollingActive: false,

      // Actions
      updateWeather: (conditions: WeatherCondition, marine: MarineCondition) => {
        set({
          currentConditions: conditions,
          currentMarine: marine,
          lastUpdate: new Date().toISOString(),
          error: null
        });

        // Cache critical weather data for offline use
        try {
          const { offlineManager } = require('../services/offlineManager');
          const criticalData = {
            temperature: conditions.temperature,
            windSpeed: conditions.windSpeed,
            windDirection: conditions.windDirection,
            humidity: conditions.humidity,
            conditions: conditions.conditions,
            marine: {
              waveHeight: marine.waveHeight,
              tideHeight: marine.tideHeight,
              current: marine.current
            },
            timestamp: new Date().toISOString()
          };
          offlineManager.cacheData('critical_weather', criticalData, {
            priority: 'critical',
            expiresIn: 180 // 3 hours for weather data
          });
        } catch (error) {
        }
      },

      updateForecasts: (forecasts: WeatherForecast[]) => {
        set({ forecasts });
      },

      updateAlerts: (alerts: WeatherAlert[]) => {
        set({ alerts });
      },

      checkSubscriptionAccess: (feature: string) => {
        try {
          return subscriptionService.hasFeatureAccess(feature);
        } catch (error) {
          errorHandler.logError({
            type: 'subscription',
            severity: 'medium',
            message: `Failed to check subscription access for feature: ${feature}`,
            source: 'weatherStore.checkSubscriptionAccess',
            retryable: false
          });
          return false;
        }
      },

      setParticipantStatus: (status: ParticipantStatus) => {
        set({ participantAccess: status });
      },

      setSubscriptionStatus: (status: WeatherState['subscriptionStatus']) => {
        set({ subscriptionStatus: status, premiumUnlocked: status !== 'free' });
      },

      toggleSubscription: async (tier: string) => {
        set({ loading: true });
        
        try {
          const result = await subscriptionService.purchaseSubscription(tier as any);
          
          if (result.success) {
            const effectiveLevel = subscriptionService.getEffectiveSubscriptionLevel();
            set({
              subscriptionStatus: effectiveLevel,
              premiumUnlocked: effectiveLevel !== 'free',
              loading: false,
              error: null
            });
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update subscription';
          errorHandler.logError({
            type: 'subscription',
            severity: 'high',
            message: errorMessage,
            source: 'weatherStore.toggleSubscription',
            retryable: true
          });
          
          set({
            loading: false,
            error: errorMessage
          });
        }
      },

      refreshWeather: async () => {
        const { incrementQuery } = get();
        
        // Check query limit for free users
        if (!incrementQuery()) {
          set({ error: 'Daily query limit reached. Upgrade to continue.' });
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          const { weatherManager } = await import('../services/weatherManager');
          const result = await weatherManager.updateWeatherData();
          
          if (result.success && result.data) {
            // The weatherManager already updates the store internally,
            // so we just need to indicate success here
            set({
              lastUpdate: new Date().toISOString(),
              loading: false,
              error: null
            });
          } else {
            throw new Error(result.error || 'Weather data unavailable');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh weather';
          handleWeatherAPIError(error, 'weatherStore.refreshWeather');
          
          set({
            loading: false,
            error: errorMessage
          });
        }
      },

      incrementQuery: () => {
        try {
          const { dailyQueries, maxDailyQueries } = get();
          const effectiveLevel = subscriptionService.getEffectiveSubscriptionLevel();
          const currentTier = subscriptionService.getCurrentTier();
          
          // Premium users have unlimited queries
          if (effectiveLevel !== 'free' || currentTier.limits.weatherQueries === -1) {
            return true;
          }
          
          if (dailyQueries >= maxDailyQueries) {
            return false;
          }
          
          set(state => ({ dailyQueries: state.dailyQueries + 1 }));
          return true;
        } catch (error) {
          errorHandler.logError({
            type: 'subscription',
            severity: 'medium',
            message: 'Failed to check query limits',
            source: 'weatherStore.incrementQuery',
            retryable: false
          });
          // Default to allowing the query to avoid blocking users
          return true;
        }
      },

      resetDailyQueries: () => {
        set({ dailyQueries: 0 });
      },

      startTrial: async () => {
        try {
          const result = await subscriptionService.startFreeTrial('professional');
          
          if (result.success) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7-day trial
            
            set({
              trialActive: true,
              trialExpiresAt: expiresAt.toISOString(),
              premiumUnlocked: true,
              subscriptionStatus: 'professional'
            });
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to start trial';
          errorHandler.logError({
            type: 'subscription',
            severity: 'medium',
            message: errorMessage,
            source: 'weatherStore.startTrial',
            retryable: true
          });
          
          set({ error: errorMessage });
        }
      },

      checkTrialStatus: () => {
        try {
          const subscriptionStatus = subscriptionService.getSubscriptionStatus();
          const isTrialActive = subscriptionStatus?.status === 'trial';
          
          if (isTrialActive && subscriptionStatus?.trialEndsAt) {
            const now = new Date();
            const expires = new Date(subscriptionStatus.trialEndsAt);
            
            if (now >= expires) {
              set({
                trialActive: false,
                trialExpiresAt: null,
                premiumUnlocked: false,
                subscriptionStatus: 'free'
              });
              return false;
            }
            
            set({
              trialActive: true,
              trialExpiresAt: subscriptionStatus.trialEndsAt,
              premiumUnlocked: true
            });
            return true;
          }
          
          return false;
        } catch (error) {
          errorHandler.logError({
            type: 'subscription',
            severity: 'low',
            message: 'Failed to check trial status',
            source: 'weatherStore.checkTrialStatus',
            retryable: false
          });
          return false;
        }
      },

      getAccessLevel: () => {
        try {
          const effectiveLevel = subscriptionService.getEffectiveSubscriptionLevel();
          const participantVerification = subscriptionService.getParticipantVerification();
          
          if (effectiveLevel !== 'free') return 'premium';
          if (participantVerification?.status === 'verified') return 'participant';
          return 'free';
        } catch (error) {
          errorHandler.logError({
            type: 'subscription',
            severity: 'low',
            message: 'Failed to get access level',
            source: 'weatherStore.getAccessLevel',
            retryable: false
          });
          return 'free';
        }
      },

      canAccessFeature: (feature: WeatherFeature) => {
        try {
          // Map weather features to subscription feature IDs
          const featureMap: Record<WeatherFeature, string> = {
            basicForecast: 'basic-weather',
            detailedAnalysis: 'extended-forecast',
            marineConditions: 'marine-conditions',
            racingInsights: 'racing-analysis',
            alerts: 'weather-alerts',
            '6hourForecast': 'extended-forecast',
            '24hourForecast': 'marine-conditions',
            professionalAnalysis: 'premium-analysis'
          };
          
          const featureId = featureMap[feature];
          return featureId ? subscriptionService.hasFeatureAccess(featureId) : false;
        } catch (error) {
          errorHandler.logError({
            type: 'subscription',
            severity: 'medium',
            message: `Failed to check feature access for: ${feature}`,
            source: 'weatherStore.canAccessFeature',
            retryable: false
          });
          return false;
        }
      },

      // Location-based forecasting actions
      setSelectedLocation: (location: LocationData) => {
        set({ selectedLocation: location });
        // Add to recent locations
        const { recentLocations } = get();
        const filtered = recentLocations.filter(l => l.id !== location.id);
        const updated = [location, ...filtered].slice(0, 10); // Keep last 10
        set({ recentLocations: updated });
      },

      fetchWeatherData: async (coordinate: LocationCoordinate, options?: { date?: Date; time?: Date }) => {
        const { incrementQuery } = get();
        
        if (!incrementQuery()) {
          set({ error: 'Daily query limit reached. Upgrade to continue.' });
          return;
        }
        
        set({ isLocationLoading: true, error: null });
        
        try {
          const { weatherAPI } = await import('../services/weatherAPI');

          let apiResult: any;
          if (options?.date) {
            apiResult = await weatherAPI.getWeatherDataForDate(options.date, { lat: coordinate.latitude, lon: coordinate.longitude });
          } else if (options?.time) {
            apiResult = await weatherAPI.getWeatherDataForTime(options.time, { lat: coordinate.latitude, lon: coordinate.longitude });
          } else {
            apiResult = await weatherAPI.getWeatherData({ lat: coordinate.latitude, lon: coordinate.longitude });
          }

          const nowIso = new Date().toISOString();
          const nextActive: WeatherState['activeSources'] = { ...get().activeSources };
          const present = (k: string) => apiResult?.data && k in apiResult.data;

          // Prioritize Open-Meteo Weather API for temperature and wind
          if (present('openmeteo_weather')) {
            nextActive.temperature = { source: 'Open‑Meteo Weather', at: nowIso };
            nextActive.wind = { source: 'Open‑Meteo Weather', at: nowIso };
          } else if (present('hko')) {
            nextActive.temperature = { source: 'Hong Kong Observatory', at: nowIso };
            nextActive.wind = { source: 'Hong Kong Observatory', at: nowIso };
          }

          // Open-Meteo Marine for waves
          if (present('openmeteo')) {
            nextActive.waves = { source: 'Open‑Meteo Marine', at: nowIso };
          }

          // NOAA for tides
          if (present('noaa')) {
            nextActive.tide = { source: 'NOAA Tides', at: nowIso };
          }

          // Build hourly forecast from available sources - prioritize Open-Meteo Weather
          const hourlyData: HourlyForecastData[] = [];
          const openMeteoWeather = apiResult?.data?.openmeteo_weather;
          const openMeteoMarine = apiResult?.data?.openmeteo;
          const ow = apiResult?.data?.ow; // OpenWeatherMap fallback

          // Use Open-Meteo Weather data if available (primary source)
          if (openMeteoWeather?.data?.weather?.length) {
            const weatherSlice = openMeteoWeather.data.weather.slice(0, 24);
            const windSlice = openMeteoWeather.data.wind.slice(0, 24);

            weatherSlice.forEach((w: any, index: number) => {
              const wind = windSlice[index] || {};
              const ts = new Date(w.time).getTime();
              hourlyData.push({
                time: new Date(ts).toISOString(),
                hour: new Date(ts).getHours(),
                temperature: w.temperature ?? 28,
                windSpeed: wind.windSpeed ?? 8,
                windDirection: wind.windDirection ?? 180,
                waveHeight: openMeteoMarine?.data?.wave?.[index]?.waveHeight ?? 1.2,
                tideHeight: 0,
                precipitation: w.precipitation ?? 0,
                conditions: w.conditions ?? 'Clear',
                humidity: w.humidity ?? 70,
              });
            });
          } else if (Array.isArray(ow?.hourly) && ow.hourly.length) {
            // Fall back to OpenWeatherMap if Open-Meteo Weather unavailable
            const owHourly = ow.hourly.slice(0, 24);
            owHourly.forEach((h: any) => {
              const ts = (h.dt || h.time || Math.floor(Date.now() / 1000)) * 1000;
              hourlyData.push({
                time: new Date(ts).toISOString(),
                hour: new Date(ts).getHours(),
                temperature: typeof h.temp === 'number' ? h.temp : (h.temperature ?? 28),
                windSpeed: typeof h.wind_speed === 'number' ? h.wind_speed : (h.windSpeed ?? 8),
                windDirection: typeof h.wind_deg === 'number' ? h.wind_deg : (h.windDirection ?? 180),
                waveHeight: openMeteoMarine?.data?.wave?.length ? (openMeteoMarine.data.wave[hourlyData.length]?.waveHeight ?? 1.2) : 1.2,
                tideHeight: 0,
                precipitation: h.pop ?? h.precipitation ?? 0,
                conditions: h.weather?.[0]?.main ?? 'Clear',
                humidity: h.humidity ?? 70,
              });
            });
          } else if (openMeteoMarine?.data?.wave?.length) {
            const waveHours = openMeteoMarine.data.wave.slice(0, 24);
            waveHours.forEach((w: any) => {
              const ts = new Date(w.time).getTime();
              hourlyData.push({
                time: new Date(ts).toISOString(),
                hour: new Date(ts).getHours(),
                temperature: 28,
                windSpeed: 8,
                windDirection: 180,
                waveHeight: w.waveHeight ?? 1.2,
                tideHeight: 0,
                precipitation: 0,
                conditions: 'Clear',
                humidity: 70,
              });
            });
          }

          const ensureHourly = hourlyData.length ? hourlyData : generateSampleHourlyData();
          const dailyData = await generateSampleDailyData(coordinate);

          set({
            hourlyForecast: ensureHourly,
            dailyForecast: dailyData,
            isLocationLoading: false,
            lastUpdate: new Date().toISOString(),
            activeSources: nextActive,
          });
        } catch (error) {
          const errorMessage = handleWeatherAPIError(error, 'weatherStore.fetchWeatherData');
          set({
            isLocationLoading: false,
            error: errorMessage
          });
        }
      },

      addRecentLocation: (location: LocationData) => {
        const { recentLocations } = get();
        const filtered = recentLocations.filter(l => l.id !== location.id);
        const updated = [location, ...filtered].slice(0, 10);
        set({ recentLocations: updated });
      },

      addFavoriteLocation: (location: LocationData) => {
        const { favoriteLocations } = get();
        if (!favoriteLocations.find(l => l.id === location.id)) {
          set({ favoriteLocations: [...favoriteLocations, location] });
        }
      },

      removeFavoriteLocation: (locationId: string) => {
        const { favoriteLocations } = get();
        set({ favoriteLocations: favoriteLocations.filter(l => l.id !== locationId) });
      },

      updateHourlyForecast: (data: HourlyForecastData[]) => {
        set({ hourlyForecast: data });
      },

      updateDailyForecast: (data: DailyForecastData[]) => {
        set({ dailyForecast: data });
      },

      getLocationForecast: (locationId: string) => {
        const { locationForecasts } = get();
        return locationForecasts.get(locationId) || null;
      },

      clearLocationCache: () => {
        set({ locationForecasts: new Map() });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
        
        if (error) {
          errorHandler.logError({
            type: 'weather',
            severity: 'medium',
            message: error,
            source: 'weatherStore.setError',
            retryable: false,
            userFacing: true
          });
        }
      },

      // Unit preferences actions
      setUnits: (units: WeatherUnits) => {
        set({ units });
      },

      setTemperatureUnit: (unit: TemperatureUnit) => {
        set(state => ({ 
          units: { ...state.units, temperature: unit } 
        }));
      },

      setWindSpeedUnit: (unit: WindSpeedUnit) => {
        set(state => ({ 
          units: { ...state.units, windSpeed: unit } 
        }));
      },

      setPressureUnit: (unit: PressureUnit) => {
        set(state => ({ 
          units: { ...state.units, pressure: unit } 
        }));
      },


      // Day selection actions
      setSelectedDayId: (dayId: string | null) => {
        set({ selectedDayId: dayId });
      },

      // Station visibility actions
      toggleNauticalMap: () => {
        set(state => ({ nauticalMapVisible: !state.nauticalMapVisible }));
      },

      toggleWindStations: () => {
        set(state => ({ windStationsVisible: !state.windStationsVisible }));
      },

      toggleWaveStations: () => {
        set(state => ({ waveStationsVisible: !state.waveStationsVisible }));
      },

      toggleTideStations: () => {
        set(state => ({ tideStationsVisible: !state.tideStationsVisible }));
      },

      // Additional map layer toggles
      toggleNauticalMapVisible: () => {
        set(state => ({ nauticalMapVisible: !state.nauticalMapVisible }));
      },

      toggleRadarVisible: () => {
        set(state => ({ radarVisible: !state.radarVisible }));
      },

      toggleSatelliteVisible: () => {
        set(state => ({ satelliteVisible: !state.satelliteVisible }));
      },

      // HKO Real-time Data Action Implementations
      updateHKOWeatherBuoys: (buoys: HKOWeatherBuoy[]) => {
        set({
          hkoWeatherBuoys: buoys,
          hkoDataUpdateTime: new Date().toISOString()
        });
      },

      updateHKOTideStations: (stations: HKOTideStation[]) => {
        set({
          hkoTideStations: stations,
          hkoDataUpdateTime: new Date().toISOString()
        });
      },

      updateHKODriftingBuoys: (buoys: HKODriftingBuoy[]) => {
        set({
          hkoDriftingBuoys: buoys,
          hkoDataUpdateTime: new Date().toISOString()
        });
      },

      updateHKOMarineAreas: (areas: HKOMarineForecastArea[]) => {
        set({
          hkoMarineAreas: areas,
          hkoDataUpdateTime: new Date().toISOString()
        });
      },

      updateHKOWarnings: (warnings: HKOMarineWarning[]) => {
        set({
          hkoMarineWarnings: warnings,
          hkoDataUpdateTime: new Date().toISOString()
        });
      },

      startHKOPolling: () => {
        const { hkoAPI } = require('../services/hkoAPI');

        set({ hkoPollingActive: true });

        // Start polling for different data types
        hkoAPI.startPolling('buoys', (buoys: HKOWeatherBuoy[]) => {
          get().updateHKOWeatherBuoys(buoys);
        }, 10000); // 10 seconds

        hkoAPI.startPolling('tides', (stations: HKOTideStation[]) => {
          get().updateHKOTideStations(stations);
        }, 30000); // 30 seconds for tide data

        hkoAPI.startPolling('warnings', (warnings: HKOMarineWarning[]) => {
          get().updateHKOWarnings(warnings);
        }, 60000); // 1 minute for warnings
      },

      stopHKOPolling: () => {
        const { hkoAPI } = require('../services/hkoAPI');

        hkoAPI.stopAllPolling();
        set({ hkoPollingActive: false });
      },

      fetchHKOData: async () => {
        const { hkoAPI } = require('../services/hkoAPI');

        set({ loading: true, error: null });

        try {
          const [buoys, stations, driftingBuoys, areas, warnings] = await Promise.all([
            hkoAPI.getWeatherBuoys(),
            hkoAPI.getTideStations(),
            hkoAPI.getDriftingBuoys(),
            hkoAPI.getMarineForecastAreas(),
            hkoAPI.getWeatherWarnings()
          ]);

          set({
            hkoWeatherBuoys: buoys,
            hkoTideStations: stations,
            hkoDriftingBuoys: driftingBuoys,
            hkoMarineAreas: areas,
            hkoMarineWarnings: warnings,
            hkoDataUpdateTime: new Date().toISOString(),
            loading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch HKO data',
            loading: false
          });
        }
      }
    }),
    {
      name: 'dragon-worlds-weather',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentConditions: state.currentConditions,
        currentMarine: state.currentMarine,
        forecasts: state.forecasts,
        subscriptionStatus: state.subscriptionStatus,
        participantAccess: state.participantAccess,
        lastUpdate: state.lastUpdate,
        dailyQueries: state.dailyQueries,
        trialActive: state.trialActive,
        trialExpiresAt: state.trialExpiresAt,
        premiumUnlocked: state.premiumUnlocked,
        // Location-based state
        selectedLocation: state.selectedLocation,
        recentLocations: state.recentLocations,
        favoriteLocations: state.favoriteLocations,
        hourlyForecast: state.hourlyForecast,
        dailyForecast: state.dailyForecast,
        // Unit preferences state
        units: state.units,
        selectedDayId: state.selectedDayId,
        // Station visibility state
        nauticalMapVisible: state.nauticalMapVisible,
        windStationsVisible: state.windStationsVisible,
        waveStationsVisible: state.waveStationsVisible,
        tideStationsVisible: state.tideStationsVisible,
        // HKO Real-time data (cache for offline use)
        hkoWeatherBuoys: state.hkoWeatherBuoys,
        hkoTideStations: state.hkoTideStations,
        hkoMarineAreas: state.hkoMarineAreas,
        hkoMarineWarnings: state.hkoMarineWarnings,
        hkoDataUpdateTime: state.hkoDataUpdateTime
      })
    }
  )
);

// Selectors
export const useCurrentWeather = () => useWeatherStore(state => state.currentConditions);
export const useCurrentMarine = () => useWeatherStore(state => state.currentMarine);
export const useWeatherForecasts = () => useWeatherStore(state => state.forecasts);
export const useWeatherAlerts = () => useWeatherStore(state => state.alerts);
export const useSubscriptionStatus = () => useWeatherStore(state => state.subscriptionStatus);
export const useWeatherLoading = () => useWeatherStore(state => state.loading);
export const useWeatherError = () => useWeatherStore(state => state.error);

// Computed selectors
export const useAccessLevel = () => useWeatherStore(state => state.getAccessLevel());
export const useCanAccessFeature = (feature: WeatherFeature) => 
  useWeatherStore(state => state.canAccessFeature(feature));
export const useTrialStatus = () => useWeatherStore(state => ({ 
  active: state.trialActive, 
  expiresAt: state.trialExpiresAt 
}));
export const useQueryStatus = () => useWeatherStore(state => ({
  used: state.dailyQueries,
  limit: state.maxDailyQueries,
  remaining: state.maxDailyQueries - state.dailyQueries
}));

// Location-based selectors
export const useSelectedLocation = () => useWeatherStore(state => state.selectedLocation);
export const useRecentLocations = () => useWeatherStore(state => state.recentLocations);
export const useFavoriteLocations = () => useWeatherStore(state => state.favoriteLocations);
export const useHourlyForecast = () => useWeatherStore(state => state.hourlyForecast);
export const useDailyForecast = () => useWeatherStore(state => state.dailyForecast);
export const useLocationLoading = () => useWeatherStore(state => state.isLocationLoading);

// Unit preferences selectors
export const useWeatherUnits = () => useWeatherStore(state => state.units);
export const useTemperatureUnit = () => useWeatherStore(state => state.units.temperature);
export const useWindSpeedUnit = () => useWeatherStore(state => state.units.windSpeed);
export const usePressureUnit = () => useWeatherStore(state => state.units.pressure);

// Day selection selectors
export const useSelectedDayId = () => useWeatherStore(state => state.selectedDayId);

// Station visibility selectors
export const useNauticalMapVisible = () => useWeatherStore(state => state.nauticalMapVisible);
export const useWindStationsVisible = () => useWeatherStore(state => state.windStationsVisible);
export const useWaveStationsVisible = () => useWeatherStore(state => state.waveStationsVisible);
export const useTideStationsVisible = () => useWeatherStore(state => state.tideStationsVisible);

// HKO Real-time Data Selectors
export const useHKOWeatherBuoys = () => useWeatherStore(state => state.hkoWeatherBuoys);
export const useHKOTideStations = () => useWeatherStore(state => state.hkoTideStations);
export const useHKODriftingBuoys = () => useWeatherStore(state => state.hkoDriftingBuoys);
export const useHKOMarineAreas = () => useWeatherStore(state => state.hkoMarineAreas);
export const useHKOMarineWarnings = () => useWeatherStore(state => state.hkoMarineWarnings);
export const useHKODataUpdateTime = () => useWeatherStore(state => state.hkoDataUpdateTime);
export const useHKOPollingActive = () => useWeatherStore(state => state.hkoPollingActive);

// HKO Computed Selectors
export const useHKOActiveWarnings = () => useWeatherStore(state =>
  state.hkoMarineWarnings.filter(warning => {
    const now = new Date();
    const validFrom = new Date(warning.validFrom);
    const validTo = new Date(warning.validTo);
    return now >= validFrom && now <= validTo;
  })
);

export const useHKOStationCounts = () => useWeatherStore(state => ({
  buoys: state.hkoWeatherBuoys.length,
  tideStations: state.hkoTideStations.length,
  driftingBuoys: state.hkoDriftingBuoys.length,
  marineAreas: state.hkoMarineAreas.length,
  warnings: state.hkoMarineWarnings.length,
  activeWarnings: state.hkoMarineWarnings.filter(w => {
    const now = new Date();
    return now >= new Date(w.validFrom) && now <= new Date(w.validTo);
  }).length
}));