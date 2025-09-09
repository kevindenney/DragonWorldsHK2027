import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { weatherManager } from '../services/weatherManager';
import { subscriptionService } from '../services/subscriptionService';
import { errorHandler, handleWeatherAPIError } from '../services/errorHandler';

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
}

export interface MarineCondition {
  waveHeight: number;
  swellPeriod: number;
  swellDirection: number;
  tideHeight: number;
  tideTime: string;
  tideType: 'high' | 'low';
  current: {
    speed: number;
    direction: number;
  };
  seaTemperature: number;
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
  
  // Freemium model state
  dailyQueries: number;
  maxDailyQueries: number;
  premiumUnlocked: boolean;
  trialActive: boolean;
  trialExpiresAt: string | null;

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
      
      // Freemium model state
      dailyQueries: 0,
      maxDailyQueries: 10,
      premiumUnlocked: false,
      trialActive: false,
      trialExpiresAt: null,

      // Actions
      updateWeather: (conditions: WeatherCondition, marine: MarineCondition) => {
        set({
          currentConditions: conditions,
          currentMarine: marine,
          lastUpdate: new Date().toISOString(),
          error: null
        });
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
        premiumUnlocked: state.premiumUnlocked
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