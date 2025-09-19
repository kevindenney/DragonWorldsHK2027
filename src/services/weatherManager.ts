import { weatherAPI, WeatherAPIError } from './weatherAPI';
import { subscriptionService, SubscriptionTier } from './subscriptionService';
// Note: Import weatherStore dynamically to avoid circular dependency
import AsyncStorage from '@react-native-async-storage/async-storage';

// TypeScript interfaces for weather management
export interface ProcessedWeatherData {
  current: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    windGust?: number;
    visibility: number;
    pressure: number;
    humidity: number;
    conditions: string;
  };
  marine: {
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
  };
  forecast: WeatherForecastPeriod[];
  alerts: WeatherAlert[];
  metadata: {
    sources: string[];
    lastUpdate: string;
    accessLevel: 'free' | 'basic' | 'professional' | 'premium';
    reliability: number; // 0-100%
  };
}

export interface WeatherForecastPeriod {
  time: string;
  weather: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    windGust?: number;
    conditions: string;
    visibility: number;
  };
  marine?: {
    waveHeight: number;
    waveDirection: number;
    current: number;
  };
  racing?: {
    suitability: 'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous';
    windCategory: 'light' | 'moderate' | 'fresh' | 'strong' | 'gale';
    tacticalNotes?: string[];
  };
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  title: string;
  message: string;
  validFrom: string;
  validTo: string;
  areas: string[];
  source: 'hko' | 'noaa' | 'predictwind' | 'system';
  racingImpact?: {
    likelihood: 'low' | 'medium' | 'high';
    impact: string;
    recommendation: string;
  };
}

export interface UpdateSchedule {
  interval: number; // minutes
  isActive: boolean;
  nextUpdate: string;
  priority: 'low' | 'normal' | 'high';
}

export interface DataAccessRules {
  tier: SubscriptionTier['id'];
  allowedSources: string[];
  forecastHours: number;
  includeMarineData: boolean;
  includeRacingAnalysis: boolean;
  includeAlerts: boolean;
  updateFrequency: number; // minutes
}

// Weather manager class for orchestrating weather data
export class WeatherManager {
  private updateSchedule: UpdateSchedule;
  private isUpdating = false;
  private updateTimer: NodeJS.Timeout | null = null;
  private failureCount = 0;
  private maxRetries = 3;
  
  constructor() {
    this.updateSchedule = {
      interval: 15, // Default 15 minutes
      isActive: false,
      nextUpdate: new Date().toISOString(),
      priority: 'normal'
    };
    
    this.loadUpdateSchedule();
  }

  // Main weather data orchestration method
  async updateWeatherData(forceUpdate = false): Promise<{
    success: boolean;
    data?: ProcessedWeatherData;
    error?: string;
  }> {
    if (this.isUpdating && !forceUpdate) {
      return { success: false, error: 'Update already in progress' };
    }

    this.isUpdating = true;

    try {
      // Check subscription access
      const accessRules = this.getDataAccessRules();
      
      // Check if user has remaining queries (for free/basic users)
      const { useWeatherStore } = await import('../stores/weatherStore');
      const weatherStore = useWeatherStore.getState();
      if (!weatherStore.incrementQuery() && !forceUpdate) {
        return { 
          success: false, 
          error: 'Daily query limit reached. Please upgrade your subscription.' 
        };
      }

      // Fetch data from multiple sources
      const weatherData = await weatherAPI.getWeatherData();
      
      // Process and filter data based on subscription level
      const processedData = await this.processWeatherData(weatherData, accessRules);
      
      // Update the weather store
      weatherStore.updateWeather(processedData.current, processedData.marine);
      weatherStore.updateForecasts(this.convertToStoreFormat(processedData.forecast));
      weatherStore.updateAlerts(this.convertAlertsToStoreFormat(processedData.alerts));

      // Check for and trigger weather alerts
      await this.checkAndTriggerAlerts(processedData.alerts);
      
      // Update schedule for next refresh
      this.updateNextRefreshTime();
      this.failureCount = 0;
      
      return { success: true, data: processedData };
      
    } catch (error) {
      this.failureCount++;
      const errorMessage = error instanceof Error ? error.message : 'Weather update failed';
      
      // Exponential backoff on failures
      this.updateSchedule.interval = Math.min(60, this.updateSchedule.interval * 1.5);
      
      // Try fallback data if available
      const fallbackData = await this.getFallbackData();
      if (fallbackData) {
        return { success: true, data: fallbackData };
      }
      
      return { success: false, error: errorMessage };
      
    } finally {
      this.isUpdating = false;
    }
  }

  // Process raw weather data based on subscription access
  private async processWeatherData(
    rawData: any, 
    accessRules: DataAccessRules
  ): Promise<ProcessedWeatherData> {
    const sources = Object.keys(rawData.data);
    const reliability = this.calculateReliability(rawData.data, rawData.errors);
    
    // Combine data from multiple sources, prioritizing PredictWind for sailing
    const current = this.combineCurrentConditions(rawData.data, accessRules);
    const marine = this.combineMarineConditions(rawData.data, accessRules);
    const forecast = await this.generateForecast(rawData.data, accessRules);
    const alerts = await this.processAlerts(rawData.data, accessRules);

    return {
      current,
      marine,
      forecast,
      alerts,
      metadata: {
        sources,
        lastUpdate: new Date().toISOString(),
        accessLevel: this.mapTierToAccessLevel(accessRules.tier),
        reliability
      }
    };
  }

  // Combine current conditions from multiple sources
  private combineCurrentConditions(data: any, rules: DataAccessRules) {
    // Prioritize Open-Meteo Weather for comprehensive data, then HKO for local conditions
    const openMeteoWeather = data.openmeteo_weather?.data?.weather?.[0];
    const openMeteoWind = data.openmeteo_weather?.data?.wind?.[0];
    const hko = data.hko?.regionalWeather;

    return {
      temperature: openMeteoWeather?.temperature || hko?.temperature || 25,
      windSpeed: openMeteoWind?.windSpeed || hko?.windSpeed || 0,
      windDirection: openMeteoWind?.windDirection || hko?.windDirection || 0,
      windGust: openMeteoWind?.windGust,
      visibility: openMeteoWind?.visibility || hko?.visibility || 10,
      pressure: openMeteoWind?.pressure || hko?.pressure || 1013,
      humidity: openMeteoWeather?.humidity || hko?.humidity || 70,
      conditions: openMeteoWeather?.conditions || hko?.conditions || 'Unknown'
    };
  }

  // Combine marine conditions (restricted by subscription level)
  private combineMarineConditions(data: any, rules: DataAccessRules) {
    const marine = {
      waveHeight: 0,
      swellPeriod: 0,
      swellDirection: 0,
      tideHeight: 0,
      tideTime: '00:00',
      tideType: 'high' as const,
      current: { speed: 0, direction: 0 },
      seaTemperature: 22
    };

    if (rules.includeMarineData) {
      const openmeteo = data.openmeteo?.data?.wave?.[0];
      const noaa = data.noaa?.tides?.[0];
      
      if (openmeteo) {
        marine.waveHeight = openmeteo.waveHeight;
        marine.swellPeriod = openmeteo.swellPeriod;
        marine.swellDirection = openmeteo.swellDirection;
      }
      
      if (noaa) {
        marine.tideHeight = noaa.height;
        marine.tideTime = new Date(noaa.time).toLocaleTimeString('en-HK', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        marine.tideType = noaa.type;
      }
    }

    return marine;
  }

  // Generate forecast based on subscription level
  private async generateForecast(data: any, rules: DataAccessRules): Promise<WeatherForecastPeriod[]> {
    const forecast: WeatherForecastPeriod[] = [];
    const maxHours = rules.forecastHours;

    // Get forecast data from available sources
    const openMeteoForecast = data.openmeteo_weather?.data?.forecast || [];
    const hkoForecast = data.hko?.forecast?.periods || [];

    // Limit forecast based on subscription
    const limitedForecast = openMeteoForecast.slice(0, Math.ceil(maxHours / 1)); // Hourly data

    for (const item of limitedForecast) {
      const forecastPeriod: WeatherForecastPeriod = {
        time: item.time,
        weather: {
          temperature: item.temperature,
          windSpeed: item.windSpeed,
          windDirection: item.windDirection,
          windGust: item.windGust,
          conditions: item.conditions || 'Unknown',
          visibility: item.visibility || 10
        }
      };

      // Add marine data for professional+ subscriptions
      if (rules.includeMarineData && data.openmeteo?.data?.wave) {
        const waveData = data.openmeteo.data.wave.find((w: any) =>
          new Date(w.time).getTime() === new Date(item.time).getTime()
        );
        if (waveData) {
          forecastPeriod.marine = {
            waveHeight: waveData.waveHeight,
            waveDirection: waveData.waveDirection,
            current: 0 // Open-Meteo doesn't provide current data
          };
        }
      }

      // Add racing analysis for professional+ subscriptions
      if (rules.includeRacingAnalysis) {
        forecastPeriod.racing = this.generateRacingAnalysis({
          windSpeed: item.windSpeed,
          windGust: item.windGust
        });
      }

      forecast.push(forecastPeriod);
    }

    return forecast;
  }

  // Generate racing analysis for wind conditions
  private generateRacingAnalysis(windData: any) {
    const windSpeed = windData.windSpeed;
    const windGust = windData.windGust || windSpeed;
    const gustFactor = windGust / windSpeed;
    
    let suitability: WeatherForecastPeriod['racing']['suitability'] = 'good';
    let windCategory: WeatherForecastPeriod['racing']['windCategory'] = 'moderate';
    const tacticalNotes: string[] = [];
    
    // Determine wind category and suitability
    if (windSpeed < 6) {
      windCategory = 'light';
      suitability = 'moderate';
      tacticalNotes.push('Light air racing - position and boat handling critical');
    } else if (windSpeed < 15) {
      windCategory = 'moderate';
      suitability = 'excellent';
      tacticalNotes.push('Ideal racing conditions');
    } else if (windSpeed < 25) {
      windCategory = 'fresh';
      suitability = 'good';
      tacticalNotes.push('Strong winds - crew work and boat control important');
    } else if (windSpeed < 35) {
      windCategory = 'strong';
      suitability = 'poor';
      tacticalNotes.push('Heavy conditions - consider shortened course');
    } else {
      windCategory = 'gale';
      suitability = 'dangerous';
      tacticalNotes.push('Dangerous conditions - racing likely postponed');
    }
    
    // Add gust warnings
    if (gustFactor > 1.3) {
      tacticalNotes.push('Significant gusting expected - be prepared for shifts');
    }
    
    return {
      suitability,
      windCategory,
      tacticalNotes
    };
  }

  // Process weather alerts
  private async processAlerts(data: any, rules: DataAccessRules): Promise<WeatherAlert[]> {
    if (!rules.includeAlerts) return [];
    
    const alerts: WeatherAlert[] = [];
    
    // Process HKO warnings
    if (data.hko?.warnings) {
      for (const warning of data.hko.warnings) {
        alerts.push({
          id: `hko_${warning.type}_${Date.now()}`,
          type: this.mapHKOWarningType(warning.level),
          severity: this.mapHKOSeverity(warning.level),
          title: warning.type,
          message: warning.message,
          validFrom: warning.validFrom,
          validTo: warning.validTo,
          areas: ['Hong Kong'],
          source: 'hko',
          racingImpact: this.assessRacingImpact(warning)
        });
      }
    }
    
    // Generate system alerts based on conditions
    const systemAlerts = await this.generateSystemAlerts(data);
    alerts.push(...systemAlerts);
    
    return alerts;
  }

  // Generate system alerts for racing conditions
  private async generateSystemAlerts(data: any): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    const openMeteoWind = data.openmeteo_weather?.data?.wind?.[0];
    const hkoCurrent = data.hko?.regionalWeather;

    const windSpeed = openMeteoWind?.windSpeed || hkoCurrent?.windSpeed;

    if (!windSpeed) return alerts;

    // High wind warning
    if (windSpeed > 25) {
      alerts.push({
        id: `system_wind_${Date.now()}`,
        type: 'warning',
        severity: 'high',
        title: 'Strong Wind Warning',
        message: `Wind speeds of ${windSpeed} knots forecast. Racing conditions may be dangerous.`,
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        areas: ['Racing Area'],
        source: 'system',
        racingImpact: {
          likelihood: 'high',
          impact: 'Racing may be postponed or cancelled',
          recommendation: 'Monitor conditions closely and prepare for course changes'
        }
      });
    }

    // Light wind advisory
    if (windSpeed < 5) {
      alerts.push({
        id: `system_light_${Date.now()}`,
        type: 'advisory',
        severity: 'low',
        title: 'Light Wind Advisory',
        message: `Light winds of ${windSpeed} knots forecast. Expect tactical racing conditions.`,
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        areas: ['Racing Area'],
        source: 'system',
        racingImpact: {
          likelihood: 'medium',
          impact: 'Longer race times expected',
          recommendation: 'Focus on boat handling and positioning'
        }
      });
    }

    return alerts;
  }

  // Get data access rules based on subscription
  private getDataAccessRules(): DataAccessRules {
    const effectiveLevel = subscriptionService.getEffectiveSubscriptionLevel();
    
    const rules: Record<SubscriptionTier['id'], DataAccessRules> = {
      free: {
        tier: 'free',
        allowedSources: ['hko', 'openmeteo', 'openmeteo_weather'],
        forecastHours: 3,
        includeMarineData: false,
        includeRacingAnalysis: false,
        includeAlerts: false,
        updateFrequency: 30
      },
      basic: {
        tier: 'basic',
        allowedSources: ['hko', 'noaa', 'openmeteo', 'openmeteo_weather'],
        forecastHours: 12,
        includeMarineData: true,
        includeRacingAnalysis: false,
        includeAlerts: true,
        updateFrequency: 20
      },
      professional: {
        tier: 'professional',
        allowedSources: ['hko', 'noaa', 'openmeteo', 'openmeteo_weather'],
        forecastHours: 48,
        includeMarineData: true,
        includeRacingAnalysis: true,
        includeAlerts: true,
        updateFrequency: 10
      },
      elite: {
        tier: 'elite',
        allowedSources: ['hko', 'noaa', 'openmeteo', 'openmeteo_weather'],
        forecastHours: 168,
        includeMarineData: true,
        includeRacingAnalysis: true,
        includeAlerts: true,
        updateFrequency: 5
      }
    };
    
    return rules[effectiveLevel];
  }

  // Auto-update management
  startAutoUpdate(): void {
    this.stopAutoUpdate();
    this.updateSchedule.isActive = true;
    this.scheduleNextUpdate();
  }

  stopAutoUpdate(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    this.updateSchedule.isActive = false;
  }

  private scheduleNextUpdate(): void {
    if (!this.updateSchedule.isActive) return;
    
    const accessRules = this.getDataAccessRules();
    const interval = accessRules.updateFrequency * 60 * 1000; // Convert to milliseconds
    
    this.updateTimer = setTimeout(() => {
      this.updateWeatherData().then(() => {
        if (this.updateSchedule.isActive) {
          this.scheduleNextUpdate();
        }
      });
    }, interval);
    
    this.updateSchedule.nextUpdate = new Date(Date.now() + interval).toISOString();
    this.saveUpdateSchedule();
  }

  private updateNextRefreshTime(): void {
    const accessRules = this.getDataAccessRules();
    const interval = accessRules.updateFrequency * 60 * 1000;
    this.updateSchedule.nextUpdate = new Date(Date.now() + interval).toISOString();
    this.updateSchedule.interval = accessRules.updateFrequency;
  }

  // Alert management
  private async checkAndTriggerAlerts(alerts: WeatherAlert[]): Promise<void> {
    for (const alert of alerts) {
      if (alert.severity === 'high' || alert.severity === 'extreme') {
        // Trigger high-priority notifications
        // This would integrate with notification service
        console.log(`High priority weather alert: ${alert.title}`);
      }
    }
  }

  // Utility methods
  private calculateReliability(data: any, errors: WeatherAPIError[] | null): number {
    let reliability = 100;
    
    // Reduce reliability based on failed sources
    if (errors && errors.length > 0) {
      reliability -= errors.length * 20;
    }
    
    // Increase reliability if we have multiple sources
    const sourceCount = Object.keys(data).length;
    if (sourceCount > 1) {
      reliability = Math.min(100, reliability + 10);
    }
    
    return Math.max(0, reliability);
  }

  private mapTierToAccessLevel(tier: SubscriptionTier['id']): ProcessedWeatherData['metadata']['accessLevel'] {
    const mapping: Record<SubscriptionTier['id'], ProcessedWeatherData['metadata']['accessLevel']> = {
      free: 'free',
      basic: 'basic',
      professional: 'professional',
      elite: 'premium'
    };
    
    return mapping[tier];
  }

  private mapHKOWarningType(level: number): WeatherAlert['type'] {
    return level >= 3 ? 'warning' : 'watch';
  }

  private mapHKOSeverity(level: number): WeatherAlert['severity'] {
    if (level >= 4) return 'extreme';
    if (level >= 3) return 'high';
    if (level >= 2) return 'moderate';
    return 'low';
  }

  private assessRacingImpact(warning: any) {
    // Mock racing impact assessment
    return {
      likelihood: 'medium' as const,
      impact: 'May affect racing schedule',
      recommendation: 'Monitor conditions and be prepared for changes'
    };
  }

  // Convert to store formats
  private convertToStoreFormat(forecast: WeatherForecastPeriod[]) {
    return forecast.map(period => ({
      id: `forecast_${period.time}`,
      time: period.time,
      date: new Date(period.time).toISOString().split('T')[0],
      weather: {
        temperature: period.weather.temperature,
        windSpeed: period.weather.windSpeed,
        windDirection: period.weather.windDirection,
        windGust: period.weather.windGust,
        visibility: period.weather.visibility,
        pressure: 1013, // Default
        humidity: 70, // Default
        conditions: period.weather.conditions
      },
      marine: period.marine ? {
        waveHeight: period.marine.waveHeight,
        swellPeriod: 8, // Default
        swellDirection: period.marine.waveDirection,
        tideHeight: 1.5, // Default
        tideTime: '12:00',
        tideType: 'high' as const,
        current: { speed: period.marine.current, direction: 0 },
        seaTemperature: 22
      } : {
        waveHeight: 1,
        swellPeriod: 8,
        swellDirection: 0,
        tideHeight: 1.5,
        tideTime: '12:00',
        tideType: 'high' as const,
        current: { speed: 0, direction: 0 },
        seaTemperature: 22
      },
      racingConditions: {
        suitability: period.racing?.suitability || 'good',
        windCategory: period.racing?.windCategory || 'moderate',
        warnings: [],
        recommendations: period.racing?.tacticalNotes || []
      }
    }));
  }

  private convertAlertsToStoreFormat(alerts: WeatherAlert[]) {
    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      validFrom: alert.validFrom,
      validTo: alert.validTo,
      areas: alert.areas
    }));
  }

  // Fallback data for offline scenarios
  private async getFallbackData(): Promise<ProcessedWeatherData | null> {
    try {
      const cached = await AsyncStorage.getItem('weather_fallback');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  // Persistence
  private async loadUpdateSchedule(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('weather_update_schedule');
      if (saved) {
        this.updateSchedule = { ...this.updateSchedule, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load update schedule:', error);
    }
  }

  private async saveUpdateSchedule(): Promise<void> {
    try {
      await AsyncStorage.setItem('weather_update_schedule', JSON.stringify(this.updateSchedule));
    } catch (error) {
      console.warn('Failed to save update schedule:', error);
    }
  }

  // Public getters
  getUpdateSchedule(): UpdateSchedule {
    return { ...this.updateSchedule };
  }

  isAutoUpdateActive(): boolean {
    return this.updateSchedule.isActive;
  }
}

// Export singleton instance
export const weatherManager = new WeatherManager();

// Export types
export type {
  ProcessedWeatherData,
  WeatherForecastPeriod,
  WeatherAlert,
  UpdateSchedule,
  DataAccessRules
};