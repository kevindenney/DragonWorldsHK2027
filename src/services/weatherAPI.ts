import AsyncStorage from '@react-native-async-storage/async-storage';

// TypeScript interfaces for weather API responses
export interface PredictWindResponse {
  location: {
    lat: number;
    lon: number;
  };
  data: {
    wind: PredictWindData[];
    wave: WaveData[];
    weather: WeatherData[];
    tide?: TideData[];
  };
  metadata: {
    updated: string;
    source: 'predictwind';
    model: string;
    resolution: string;
  };
}

export interface PredictWindData {
  time: string;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  pressure: number;
  temperature: number;
  humidity: number;
  visibility: number;
  conditions: string;
}

export interface WaveData {
  time: string;
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  swellHeight: number;
  swellPeriod: number;
  swellDirection: number;
}

export interface WeatherData {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  visibility: number;
  cloudCover: number;
  precipitation: number;
  conditions: string;
  icon: string;
}

export interface TideData {
  time: string;
  height: number;
  type: 'high' | 'low';
}

export interface NOAAResponse {
  metadata: {
    station: string;
    updated: string;
    source: 'noaa';
  };
  tides: TideData[];
  weather?: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    conditions: string;
  };
}

export interface HKObservatoryResponse {
  regionalWeather: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    conditions: string;
  };
  forecast: {
    periods: {
      time: string;
      temperature: {
        high: number;
        low: number;
      };
      windSpeed: number;
      windDirection: number;
      conditions: string;
      precipitationChance: number;
    }[];
  };
  warnings: {
    type: string;
    level: number;
    message: string;
    validFrom: string;
    validTo: string;
  }[];
  metadata: {
    updated: string;
    source: 'hko';
  };
}

export interface WeatherAPIError {
  source: string;
  error: string;
  code?: number;
  retryAfter?: number;
}

export interface WeatherCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiresIn: number;
  };
}

// Weather API client class
export class WeatherAPI {
  private predictWindKey: string;
  private noaaKey: string;
  private cache: WeatherCache = {};
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes
  
  // Hong Kong coordinates for Dragon Worlds
  private readonly HK_LAT = 22.2783;
  private readonly HK_LON = 114.1757;
  private readonly RACING_AREA_LAT = 22.3500;
  private readonly RACING_AREA_LON = 114.2500;

  constructor(
    predictWindKey: string = process.env.EXPO_PUBLIC_PREDICTWIND_API_KEY || '',
    noaaKey: string = process.env.EXPO_PUBLIC_NOAA_API_KEY || ''
  ) {
    this.predictWindKey = predictWindKey;
    this.noaaKey = noaaKey;
    this.loadCache();
  }

  // PredictWind API integration for professional marine weather
  async getPredictWindData(
    lat: number = this.RACING_AREA_LAT,
    lon: number = this.RACING_AREA_LON
  ): Promise<PredictWindResponse> {
    const cacheKey = `predictwind_${lat}_${lon}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://api.predictwind.com/v1/weather?lat=${lat}&lon=${lon}&model=gfs&key=${this.predictWindKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'DragonWorlds2027/1.0'
          },
          timeout: 15000
        }
      );

      if (!response.ok) {
        throw new Error(`PredictWind API error: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      const processedData = this.processPredictWindData(rawData);
      
      this.setCache(cacheKey, processedData);
      return processedData;
      
    } catch (error) {
      console.error('PredictWind API error:', error);
      throw {
        source: 'predictwind',
        error: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error && 'status' in error ? (error as any).status : undefined
      } as WeatherAPIError;
    }
  }

  // NOAA API for tide data and backup weather
  async getNOAAData(
    stationId: string = '1611400' // Hong Kong station
  ): Promise<NOAAResponse> {
    const cacheKey = `noaa_${stationId}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const tideResponse = await fetch(
        `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?` +
        `date=today&station=${stationId}&product=predictions&datum=MLLW&time_zone=lst_ldt&` +
        `units=metric&format=json&application=DragonWorlds`,
        { timeout: 10000 }
      );

      if (!tideResponse.ok) {
        throw new Error(`NOAA API error: ${tideResponse.status}`);
      }

      const tideData = await tideResponse.json();
      const processedData = this.processNOAAData(tideData);
      
      this.setCache(cacheKey, processedData);
      return processedData;
      
    } catch (error) {
      console.error('NOAA API error:', error);
      throw {
        source: 'noaa',
        error: error instanceof Error ? error.message : 'NOAA API unavailable'
      } as WeatherAPIError;
    }
  }

  // Hong Kong Observatory API for local conditions
  async getHKObservatoryData(): Promise<HKObservatoryResponse> {
    const cacheKey = 'hko_current';
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // HKO provides JSON data feeds
      const [currentResponse, forecastResponse, warningResponse] = await Promise.allSettled([
        fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en', { timeout: 8000 }),
        fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=en', { timeout: 8000 }),
        fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en', { timeout: 8000 })
      ]);

      const currentData = currentResponse.status === 'fulfilled' && currentResponse.value.ok
        ? await currentResponse.value.json()
        : null;
        
      const forecastData = forecastResponse.status === 'fulfilled' && forecastResponse.value.ok
        ? await forecastResponse.value.json()
        : null;
        
      const warningData = warningResponse.status === 'fulfilled' && warningResponse.value.ok
        ? await warningResponse.value.json()
        : null;

      const processedData = this.processHKOData(currentData, forecastData, warningData);
      
      this.setCache(cacheKey, processedData, 5 * 60 * 1000); // 5-minute cache for local data
      return processedData;
      
    } catch (error) {
      console.error('HKO API error:', error);
      throw {
        source: 'hko',
        error: error instanceof Error ? error.message : 'HKO API unavailable'
      } as WeatherAPIError;
    }
  }

  // Fetch comprehensive weather data with fallbacks
  async getWeatherData(location?: { lat: number; lon: number }) {
    const errors: WeatherAPIError[] = [];
    const results: any = {};

    // Try PredictWind first (most comprehensive for sailing)
    try {
      results.predictwind = await this.getPredictWindData(location?.lat, location?.lon);
    } catch (error) {
      errors.push(error as WeatherAPIError);
    }

    // Get NOAA tide data
    try {
      results.noaa = await this.getNOAAData();
    } catch (error) {
      errors.push(error as WeatherAPIError);
    }

    // Get HK Observatory local data
    try {
      results.hko = await this.getHKObservatoryData();
    } catch (error) {
      errors.push(error as WeatherAPIError);
    }

    // If all sources failed, throw an aggregated error
    if (Object.keys(results).length === 0) {
      throw {
        source: 'all',
        error: 'All weather data sources unavailable',
        details: errors
      };
    }

    return {
      data: results,
      errors: errors.length > 0 ? errors : null,
      timestamp: new Date().toISOString()
    };
  }

  // Data processing methods
  private processPredictWindData(rawData: any): PredictWindResponse {
    return {
      location: {
        lat: rawData.location?.lat || this.RACING_AREA_LAT,
        lon: rawData.location?.lon || this.RACING_AREA_LON
      },
      data: {
        wind: rawData.wind?.map((item: any) => ({
          time: item.time,
          windSpeed: Math.round(item.speed * 1.94384), // Convert m/s to knots
          windDirection: Math.round(item.direction),
          windGust: item.gust ? Math.round(item.gust * 1.94384) : undefined,
          pressure: Math.round(item.pressure),
          temperature: Math.round(item.temperature),
          humidity: Math.round(item.humidity),
          visibility: Math.round(item.visibility / 1000), // Convert m to km
          conditions: item.conditions || 'Unknown'
        })) || [],
        wave: rawData.wave?.map((item: any) => ({
          time: item.time,
          waveHeight: Math.round(item.height * 100) / 100,
          wavePeriod: Math.round(item.period),
          waveDirection: Math.round(item.direction),
          swellHeight: Math.round((item.swellHeight || 0) * 100) / 100,
          swellPeriod: Math.round(item.swellPeriod || 0),
          swellDirection: Math.round(item.swellDirection || 0)
        })) || [],
        weather: rawData.weather?.map((item: any) => ({
          time: item.time,
          temperature: Math.round(item.temperature),
          feelsLike: Math.round(item.feelsLike || item.temperature),
          humidity: Math.round(item.humidity),
          pressure: Math.round(item.pressure),
          visibility: Math.round(item.visibility / 1000),
          cloudCover: Math.round(item.cloudCover || 0),
          precipitation: Math.round((item.precipitation || 0) * 100) / 100,
          conditions: item.conditions || 'Unknown',
          icon: item.icon || 'unknown'
        })) || []
      },
      metadata: {
        updated: new Date().toISOString(),
        source: 'predictwind',
        model: rawData.model || 'gfs',
        resolution: rawData.resolution || '0.25°'
      }
    };
  }

  private processNOAAData(rawData: any): NOAAResponse {
    return {
      metadata: {
        station: rawData.metadata?.name || 'Hong Kong',
        updated: new Date().toISOString(),
        source: 'noaa'
      },
      tides: rawData.predictions?.map((item: any) => ({
        time: item.t,
        height: Math.round(parseFloat(item.v) * 100) / 100,
        type: parseFloat(item.v) > 0 ? 'high' as const : 'low' as const
      })) || []
    };
  }

  private processHKOData(current: any, forecast: any, warnings: any): HKObservatoryResponse {
    return {
      regionalWeather: {
        temperature: Math.round(current?.temperature?.[0]?.value || 25),
        humidity: Math.round(current?.humidity?.[0]?.value || 70),
        pressure: Math.round(current?.pressure?.[0]?.value || 1013),
        windSpeed: Math.round((current?.windSpeed?.[0]?.value || 0) * 1.94384), // m/s to knots
        windDirection: Math.round(current?.windDirection?.[0]?.value || 0),
        visibility: Math.round(current?.visibility?.[0]?.value || 10),
        conditions: current?.icon?.[0]?.value || 'Unknown'
      },
      forecast: {
        periods: forecast?.weatherForecast?.slice(0, 7).map((item: any) => ({
          time: item.forecastDate,
          temperature: {
            high: Math.round(item.forecastMaxtemp?.value || 28),
            low: Math.round(item.forecastMintemp?.value || 22)
          },
          windSpeed: Math.round((item.forecastWind?.value || 0) * 1.94384),
          windDirection: Math.round(item.forecastWindDirection?.value || 0),
          conditions: item.forecastWeather || 'Unknown',
          precipitationChance: Math.round(item.PSR?.value || 0)
        })) || []
      },
      warnings: warnings?.details?.map((item: any) => ({
        type: item.warningStatementCode,
        level: item.severity || 1,
        message: item.contents,
        validFrom: item.issueTime,
        validTo: item.expireTime
      })) || [],
      metadata: {
        updated: current?.updateTime || new Date().toISOString(),
        source: 'hko'
      }
    };
  }

  // Cache management
  private async loadCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('weather_cache');
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load weather cache:', error);
      this.cache = {};
    }
  }

  private async saveCache(): Promise<void> {
    try {
      await AsyncStorage.setItem('weather_cache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save weather cache:', error);
    }
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache[key];
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.expiresIn) {
      delete this.cache[key];
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, expiresIn: number = this.cacheExpiry): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      expiresIn
    };
    this.saveCache(); // Fire and forget
  }

  // Utility methods
  public clearCache(): void {
    this.cache = {};
    AsyncStorage.removeItem('weather_cache');
  }

  public getCacheStatus(): { size: number; keys: string[]; oldestEntry: number } {
    const keys = Object.keys(this.cache);
    const oldest = keys.length > 0 
      ? Math.min(...keys.map(key => this.cache[key].timestamp))
      : Date.now();
    
    return {
      size: keys.length,
      keys,
      oldestEntry: oldest
    };
  }
}

// Export singleton instance
export const weatherAPI = new WeatherAPI();

// Export types for use in other modules
export type {
  PredictWindResponse,
  PredictWindData,
  WaveData,
  WeatherData,
  TideData,
  NOAAResponse,
  HKObservatoryResponse,
  WeatherAPIError
};