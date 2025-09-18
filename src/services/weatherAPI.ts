import AsyncStorage from '@react-native-async-storage/async-storage';
import { RACING_AREA_LAT as CENTRAL_RACING_LAT, RACING_AREA_LON as CENTRAL_RACING_LON, HK_GENERAL } from '../constants/raceCoordinates';

// TypeScript interfaces for weather API responses
export interface OpenMeteoMarineResponse {
  location: {
    lat: number;
    lon: number;
  };
  data: {
    wind: OpenMeteoWindData[];
    wave: WaveData[];
    weather: WeatherData[];
    tide?: TideData[];
  };
  metadata: {
    updated: string;
    source: 'open-meteo';
    model: string;
    resolution: string;
  };
}

export interface OpenMeteoWindData {
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

export interface OpenWeatherMapResponse {
  location: {
    lat: number;
    lon: number;
  };
  current: {
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  };
  hourly: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
  metadata: {
    updated: string;
    source: 'openweathermap';
  };
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
  private openWeatherMapKey: string;
  private noaaKey: string;
  private cache: WeatherCache = {};
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes
  
  // Hong Kong coordinates for Dragon Worlds
  private readonly HK_LAT = HK_GENERAL.latitude;
  private readonly HK_LON = HK_GENERAL.longitude;
  private readonly RACING_AREA_LAT = CENTRAL_RACING_LAT;
  private readonly RACING_AREA_LON = CENTRAL_RACING_LON;

  constructor(
    openWeatherMapKey: string = process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY || '',
    noaaKey: string = process.env.EXPO_PUBLIC_NOAA_API_KEY || ''
  ) {
    this.openWeatherMapKey = openWeatherMapKey;
    this.noaaKey = noaaKey;
    this.loadCache();
  }

  // Open-Meteo Marine API integration for marine weather (free)
  async getOpenMeteoMarineData(
    lat: number = this.RACING_AREA_LAT,
    lon: number = this.RACING_AREA_LON
  ): Promise<OpenMeteoMarineResponse> {
    const cacheKey = `openmeteo_marine_${lat}_${lon}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const marineParams = [
        'wave_height',
        'wave_direction', 
        'wave_period',
        'swell_wave_height',
        'swell_wave_direction',
        'swell_wave_period'
      ].join(',');

      const response = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=${marineParams}&` +
        `timezone=Asia%2FHong_Kong&forecast_days=7`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'DragonWorlds2027/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Open-Meteo Marine API error: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      const processedData = this.processOpenMeteoMarineData(rawData, lat, lon);
      
      this.setCache(cacheKey, processedData);
      return processedData;
      
    } catch (error) {
      console.error('Open-Meteo Marine API error:', error);
      throw {
        source: 'open-meteo',
        error: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error && 'status' in error ? (error as any).status : undefined
      } as WeatherAPIError;
    }
  }

  // OpenWeatherMap API integration for comprehensive weather
  async getOpenWeatherMapData(
    lat: number = this.RACING_AREA_LAT,
    lon: number = this.RACING_AREA_LON
  ): Promise<OpenWeatherMapResponse> {
    const cacheKey = `openweathermap_${lat}_${lon}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Using cached OpenWeatherMap data for', { lat, lon });
      return cached;
    }

    if (!this.openWeatherMapKey) {
      console.warn('⚠️ OpenWeatherMap API key not configured - skipping weather data');
      throw {
        source: 'openweathermap',
        error: 'OpenWeatherMap API key not configured'
      } as WeatherAPIError;
    }

    // Log API key status (first/last 4 chars only for security)
    const keyPreview = this.openWeatherMapKey.length > 8 
      ? `${this.openWeatherMapKey.slice(0, 4)}...${this.openWeatherMapKey.slice(-4)}`
      : 'KEY_TOO_SHORT';
    console.log('🔑 OpenWeatherMap API key status:', { 
      keyLength: this.openWeatherMapKey.length,
      keyPreview,
      endpoint: 'onecall (2.5)'
    });

    try {
      const url = `https://api.openweathermap.org/data/2.5/onecall?` +
        `lat=${lat}&lon=${lon}&` +
        `appid=${this.openWeatherMapKey}&` +
        `units=metric&exclude=minutely,daily,alerts`;
      
      console.log('🌤️ Fetching OpenWeatherMap current data:', { lat, lon, url: url.replace(this.openWeatherMapKey, 'API_KEY_HIDDEN') });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DragonWorlds2027/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenWeatherMap API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          possibleCause: response.status === 401 ? 'Invalid API key or plan limitation' :
                        response.status === 403 ? 'API plan does not include this endpoint' :
                        response.status === 404 ? 'Endpoint not found - check API version' :
                        'Unknown error'
        });
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const rawData = await response.json();
      const processedData = this.processOpenWeatherMapData(rawData, lat, lon);
      
      this.setCache(cacheKey, processedData);
      return processedData;
      
    } catch (error) {
      console.error('OpenWeatherMap API error:', error);
      throw {
        source: 'openweathermap',
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
        fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en'),
        fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=en'),
        fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en')
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

    // Try OpenWeatherMap first (if API key available and valid)
    if (this.openWeatherMapKey && this.openWeatherMapKey !== 'c089357aed2f67847d4a8425d3e122fa') {
      try {
        results.openweathermap = await this.getOpenWeatherMapData(location?.lat, location?.lon);
      } catch (error) {
        console.log('⚠️ OpenWeatherMap failed, continuing with other sources:', error);
        errors.push(error as WeatherAPIError);
      }
    } else {
      console.log('⚠️ Skipping OpenWeatherMap due to invalid/default API key, using free alternatives');
    }

    // Get Open-Meteo marine data (free, no API key needed)
    try {
      results.openmeteo = await this.getOpenMeteoMarineData(location?.lat, location?.lon);
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

  // Enhanced date-based weather data fetching
  async getWeatherDataForDate(
    date: Date, 
    location?: { lat: number; lon: number }
  ) {
    const errors: WeatherAPIError[] = [];
    const results: any = {};

    console.log(`📅 Fetching weather data for ${date.toDateString()} at ${location?.lat}, ${location?.lon}`);

    // For historical data, use OpenWeatherMap "timemachine" ONLY when within last 5 days
    // to avoid plan/endpoint limitations. Otherwise, skip quietly and rely on fallbacks.
    if (this.openWeatherMapKey) {
      const now = new Date();
      const diffMs = Math.abs(now.getTime() - date.getTime());
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const withinFiveDays = diffDays <= 5.01; // small cushion

      if (withinFiveDays) {
        try {
          console.log('📊 Attempting OpenWeatherMap historical fetch (within 5-day window)');
          results.openweathermap = await this.getOpenWeatherMapHistoricalData(date, location?.lat, location?.lon);
        } catch (error) {
          // Degrade gracefully: record error but don't block other sources
          const err = error as WeatherAPIError;
          console.warn('⚠️ OpenWeatherMap historical failed, using fallback sources:', err.error);
          errors.push(err);
          // Add a user-friendly error message
          errors.push({
            source: 'openweathermap_historical',
            error: 'Historical data error: Erro...',
            code: 403,
            details: 'OpenWeatherMap historical data requires a paid subscription ($40+/month). Using free alternative data sources instead.'
          } as WeatherAPIError);
        }
      } else {
        console.log('ℹ️ Date is beyond 5-day window - skipping OpenWeatherMap and using free data sources');
        // Don't attempt the call at all if beyond 5 days
      }
    } else {
      console.log('ℹ️ No OpenWeatherMap API key configured - using free data sources only');
    }

    // For marine data, we'll use Open-Meteo with date parameter
    try {
      results.openmeteo = await this.getOpenMeteoMarineDataForDate(date, location?.lat, location?.lon);
    } catch (error) {
      errors.push(error as WeatherAPIError);
    }

    // Get NOAA tide data for specific date
    try {
      results.noaa = await this.getNOAADataForDate(date);
    } catch (error) {
      errors.push(error as WeatherAPIError);
    }

    return {
      data: results,
      errors: errors.length > 0 ? errors : null,
      timestamp: new Date().toISOString(),
      requestedDate: date.toISOString()
    };
  }

  // Enhanced time-based weather data fetching (hourly forecasts)
  async getWeatherDataForTime(
    time: Date, 
    location?: { lat: number; lon: number }
  ) {
    const errors: WeatherAPIError[] = [];
    const results: any = {};

    console.log(`⏰ Fetching weather data for ${time.toTimeString()} at ${location?.lat}, ${location?.lon}`);

    // Get hourly forecast data
    if (this.openWeatherMapKey) {
      try {
        results.openweathermap = await this.getOpenWeatherMapHourlyData(time, location?.lat, location?.lon);
      } catch (error) {
        errors.push(error as WeatherAPIError);
      }
    }

    // Get hourly marine data
    try {
      results.openmeteo = await this.getOpenMeteoMarineDataForTime(time, location?.lat, location?.lon);
    } catch (error) {
      errors.push(error as WeatherAPIError);
    }

    return {
      data: results,
      errors: errors.length > 0 ? errors : null,
      timestamp: new Date().toISOString(),
      requestedTime: time.toISOString()
    };
  }

  // Historical weather data from OpenWeatherMap
  private async getOpenWeatherMapHistoricalData(
    date: Date, 
    lat: number = this.RACING_AREA_LAT, 
    lon: number = this.RACING_AREA_LON
  ) {
    const cacheKey = `openweathermap_historical_${lat}_${lon}_${date.toISOString().split('T')[0]}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Using cached OpenWeatherMap historical data for', { date: date.toISOString(), lat, lon });
      return cached;
    }

    // Validate API key first
    if (!this.openWeatherMapKey) {
      console.warn('⚠️ OpenWeatherMap API key not configured - cannot fetch historical data');
      throw {
        source: 'openweathermap_historical',
        error: 'API key not configured',
        details: 'Please set EXPO_PUBLIC_OPENWEATHERMAP_API_KEY in your .env file'
      } as WeatherAPIError;
    }

    try {
      // Convert date to Unix timestamp
      const unixTime = Math.floor(date.getTime() / 1000);
      const now = Math.floor(Date.now() / 1000);
      const daysAgo = (now - unixTime) / (60 * 60 * 24);
      
      console.log('📅 Historical data request:', {
        requestedDate: date.toISOString(),
        unixTime,
        daysAgo: daysAgo.toFixed(1),
        isWithin5Days: daysAgo <= 5
      });

      // Note: timemachine endpoint requires paid subscription
      const url = `https://api.openweathermap.org/data/2.5/onecall/timemachine?` +
        `lat=${lat}&lon=${lon}&dt=${unixTime}&` +
        `appid=${this.openWeatherMapKey}&units=metric`;
      
      console.log('🕐 Fetching OpenWeatherMap historical data:', { 
        date: date.toISOString(),
        lat, 
        lon,
        endpoint: 'timemachine (requires paid plan)',
        url: url.replace(this.openWeatherMapKey, 'API_KEY_HIDDEN')
      });
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenWeatherMap historical API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          requestedDate: date.toISOString(),
          daysAgo: daysAgo.toFixed(1),
          possibleCause: response.status === 401 ? 'Invalid API key or FREE plan (timemachine requires $40+/month subscription)' :
                        response.status === 403 ? 'Your API plan does not include historical data access' :
                        response.status === 404 ? 'Historical data not available for this date/location' :
                        response.status === 400 ? 'Invalid date or coordinates' :
                        'Unknown error - check API documentation'
        });
        throw new Error(`OpenWeatherMap historical API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Historical data fetched successfully');
      const processedData = this.processOpenWeatherMapData(data, lat, lon);
      
      // Cache the result
      this.setCache(cacheKey, processedData);
      return processedData;
      
    } catch (error) {
      console.error('OpenWeatherMap historical data error:', error);
      throw {
        source: 'openweathermap_historical',
        error: 'Historical weather data unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as WeatherAPIError;
    }
  }

  // Hourly weather data from OpenWeatherMap
  private async getOpenWeatherMapHourlyData(
    time: Date, 
    lat: number = this.RACING_AREA_LAT, 
    lon: number = this.RACING_AREA_LON
  ) {
    const cacheKey = `openweathermap_hourly_${lat}_${lon}_${time.getHours()}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?` +
        `lat=${lat}&lon=${lon}&exclude=minutely,daily,alerts&` +
        `appid=${this.openWeatherMapKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`OpenWeatherMap hourly API error: ${response.status}`);
      }

      const data = await response.json();
      const processedData = this.processOpenWeatherMapData(data, lat, lon);
      
      // Cache the result
      this.setCache(cacheKey, processedData);
      return processedData;
      
    } catch (error) {
      console.error('OpenWeatherMap hourly data error:', error);
      throw {
        source: 'openweathermap_hourly',
        error: 'Hourly weather data unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as WeatherAPIError;
    }
  }

  // Date-specific marine data from Open-Meteo
  private async getOpenMeteoMarineDataForDate(
    date: Date, 
    lat: number = this.RACING_AREA_LAT, 
    lon: number = this.RACING_AREA_LON
  ) {
    const cacheKey = `openmeteo_marine_date_${lat}_${lon}_${date.toISOString().split('T')[0]}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const marineParams = [
        'wave_height',
        'wave_direction', 
        'wave_period',
        'swell_wave_height',
        'swell_wave_direction',
        'swell_wave_period'
      ].join(',');

      const startDate = date.toISOString().split('T')[0];
      const endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=${marineParams}&` +
        `start_date=${startDate}&end_date=${endDate}&` +
        `timezone=Asia%2FHong_Kong`
      );

      if (!response.ok) {
        throw new Error(`Open-Meteo marine date API error: ${response.status}`);
      }

      const data = await response.json();
      const processedData = this.processOpenMeteoMarineData(data, lat, lon);
      
      // Cache the result
      this.setCache(cacheKey, processedData);
      return processedData;
      
    } catch (error) {
      console.error('Open-Meteo marine date data error:', error);
      throw {
        source: 'openmeteo_marine_date',
        error: 'Date-specific marine data unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as WeatherAPIError;
    }
  }

  // Time-specific marine data from Open-Meteo
  private async getOpenMeteoMarineDataForTime(
    time: Date, 
    lat: number = this.RACING_AREA_LAT, 
    lon: number = this.RACING_AREA_LON
  ) {
    const cacheKey = `openmeteo_marine_time_${lat}_${lon}_${time.getHours()}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const marineParams = [
        'wave_height',
        'wave_direction', 
        'wave_period',
        'swell_wave_height',
        'swell_wave_direction',
        'swell_wave_period'
      ].join(',');

      const response = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=${marineParams}&` +
        `timezone=Asia%2FHong_Kong&forecast_days=1`
      );

      if (!response.ok) {
        throw new Error(`Open-Meteo marine time API error: ${response.status}`);
      }

      const data = await response.json();
      const processedData = this.processOpenMeteoMarineData(data, lat, lon);
      
      // Cache the result
      this.setCache(cacheKey, processedData);
      return processedData;
      
    } catch (error) {
      console.error('Open-Meteo marine time data error:', error);
      throw {
        source: 'openmeteo_marine_time',
        error: 'Time-specific marine data unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as WeatherAPIError;
    }
  }

  // Date-specific NOAA tide data
  private async getNOAADataForDate(date: Date) {
    const cacheKey = `noaa_date_${date.toISOString().split('T')[0]}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // For now, we'll use the same NOAA data but in a real implementation,
      // this would fetch historical tide data for the specific date
      const data = await this.getNOAAData();
      
      // Cache the result
      this.setCache(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('NOAA date data error:', error);
      throw {
        source: 'noaa_date',
        error: 'Date-specific tide data unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as WeatherAPIError;
    }
  }

  // Data processing methods
  private processOpenMeteoMarineData(rawData: any, lat: number, lon: number): OpenMeteoMarineResponse {
    const hourlyData = rawData.hourly || {};
    const times = Array.isArray(hourlyData.time) ? hourlyData.time : [];

    return {
      location: {
        lat: lat,
        lon: lon
      },
      data: {
        wind: [], // Will be populated from weather API
        wave: times.map((time: string, index: number) => ({
          time,
          waveHeight: Math.round((hourlyData.wave_height?.[index] || 0) * 100) / 100,
          wavePeriod: Math.round(hourlyData.wave_period?.[index] || 8),
          waveDirection: Math.round(hourlyData.wave_direction?.[index] || 0),
          swellHeight: Math.round((hourlyData.swell_wave_height?.[index] || 0) * 100) / 100,
          swellPeriod: Math.round(hourlyData.swell_wave_period?.[index] || 0),
          swellDirection: Math.round(hourlyData.swell_wave_direction?.[index] || 0)
        })),
        weather: []
      },
      metadata: {
        updated: new Date().toISOString(),
        source: 'open-meteo',
        model: 'ICON Wave',
        resolution: '11km'
      }
    };
  }

  private processOpenWeatherMapData(rawData: any, lat: number, lon: number): OpenWeatherMapResponse {
    return {
      location: {
        lat: lat,
        lon: lon
      },
      current: {
        temp: Math.round(rawData.current?.temp || 25),
        feels_like: Math.round(rawData.current?.feels_like || 25),
        pressure: Math.round(rawData.current?.pressure || 1013),
        humidity: Math.round(rawData.current?.humidity || 70),
        visibility: Math.round((rawData.current?.visibility || 10000) / 1000), // Convert m to km
        wind_speed: Math.round((rawData.current?.wind_speed || 0) * 1.94384), // Convert m/s to knots
        wind_deg: Math.round(rawData.current?.wind_deg || 0),
        wind_gust: rawData.current?.wind_gust ? Math.round(rawData.current.wind_gust * 1.94384) : undefined,
        weather: rawData.current?.weather || []
      },
      hourly: (rawData.hourly || []).slice(0, 48).map((hour: any) => ({
        dt: hour.dt,
        temp: Math.round(hour.temp || 25),
        feels_like: Math.round(hour.feels_like || 25),
        pressure: Math.round(hour.pressure || 1013),
        humidity: Math.round(hour.humidity || 70),
        wind_speed: Math.round((hour.wind_speed || 0) * 1.94384), // Convert m/s to knots
        wind_deg: Math.round(hour.wind_deg || 0),
        wind_gust: hour.wind_gust ? Math.round(hour.wind_gust * 1.94384) : undefined,
        weather: hour.weather || []
      })),
      metadata: {
        updated: new Date().toISOString(),
        source: 'openweathermap'
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

  /**
   * Get weather radar imagery data
   * Integrates with WeatherImageryService for radar visualization
   */
  async getWeatherRadarData(options?: {
    frames?: number;
    animated?: boolean;
    lat?: number;
    lon?: number;
  }) {
    const { frames = 6, animated = false, lat = this.RACING_AREA_LAT, lon = this.RACING_AREA_LON } = options || {};

    const cacheKey = `weather_radar_${lat}_${lon}_${frames}_${animated}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📡 Using cached radar data');
      return cached;
    }

    try {
      console.log('📡 Fetching weather radar data...');

      // Use RainViewer API for radar data
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DragonWorlds2027/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`RainViewer API error: ${response.status}`);
      }

      const data = await response.json();
      const radarData = this.processRadarData(data, { frames, animated, lat, lon });

      this.setCache(cacheKey, radarData, 5 * 60 * 1000); // 5-minute cache
      return radarData;

    } catch (error) {
      console.error('❌ Failed to fetch radar data:', error);
      throw {
        source: 'rainviewer',
        error: error instanceof Error ? error.message : 'Radar data unavailable'
      } as WeatherAPIError;
    }
  }

  /**
   * Get weather satellite imagery data
   */
  async getWeatherSatelliteData(options?: {
    type?: 'visible' | 'infrared' | 'water_vapor';
    lat?: number;
    lon?: number;
  }) {
    const { type = 'visible', lat = this.RACING_AREA_LAT, lon = this.RACING_AREA_LON } = options || {};

    const cacheKey = `weather_satellite_${type}_${lat}_${lon}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('🛰️ Using cached satellite data');
      return cached;
    }

    try {
      console.log(`🛰️ Fetching ${type} satellite data...`);

      // Note: This would integrate with OpenWeatherMap satellite layers
      // For now, return structured data for the imagery service
      const satelliteData = {
        type,
        timestamp: new Date().toISOString(),
        coverage: Math.random() * 100, // Placeholder
        tiles: [
          {
            url: `https://tile.openweathermap.org/map/clouds_new/6/${Math.floor((lon + 180) / 360 * 64)}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 64)}.png`,
            bounds: {
              north: lat + 0.5,
              south: lat - 0.5,
              east: lon + 0.5,
              west: lon - 0.5
            },
            opacity: 0.6,
            zIndex: 800
          }
        ],
        metadata: {
          source: 'openweathermap',
          updated: new Date().toISOString(),
          resolution: '1km'
        }
      };

      this.setCache(cacheKey, satelliteData, 30 * 60 * 1000); // 30-minute cache
      return satelliteData;

    } catch (error) {
      console.error('❌ Failed to fetch satellite data:', error);
      throw {
        source: 'satellite',
        error: error instanceof Error ? error.message : 'Satellite data unavailable'
      } as WeatherAPIError;
    }
  }

  /**
   * Get weather tiles for map overlay
   */
  async getWeatherTiles(layer: 'precipitation' | 'clouds' | 'temperature' | 'wind' | 'pressure', zoom: number = 6) {
    const cacheKey = `weather_tiles_${layer}_z${zoom}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Map layer names to OpenWeatherMap layer IDs
      const layerMap = {
        'precipitation': 'precipitation_new',
        'clouds': 'clouds_new',
        'temperature': 'temp_new',
        'wind': 'wind_new',
        'pressure': 'pressure_new'
      };

      const layerId = layerMap[layer];
      const apiKey = this.openWeatherMapKey;

      if (!apiKey) {
        throw new Error('OpenWeatherMap API key required for weather tiles');
      }

      // Generate tile URLs for Hong Kong region
      const tiles = [];
      const bounds = {
        north: 22.6,
        south: 22.0,
        east: 114.6,
        west: 113.8
      };

      // Calculate tile coordinates for the bounds
      const n = Math.pow(2, zoom);
      const tileXMin = Math.floor((bounds.west + 180) / 360 * n);
      const tileXMax = Math.floor((bounds.east + 180) / 360 * n);
      const tileYMin = Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * n);
      const tileYMax = Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * n);

      for (let x = tileXMin; x <= tileXMax; x++) {
        for (let y = tileYMin; y <= tileYMax; y++) {
          tiles.push({
            url: `https://tile.openweathermap.org/map/${layerId}/${zoom}/${x}/${y}.png?appid=${apiKey}`,
            x,
            y,
            zoom,
            bounds: {
              north: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI,
              south: Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI,
              west: x / n * 360 - 180,
              east: (x + 1) / n * 360 - 180
            }
          });
        }
      }

      const tilesData = {
        layer,
        zoom,
        tiles,
        timestamp: new Date().toISOString(),
        coverage: bounds
      };

      this.setCache(cacheKey, tilesData, 10 * 60 * 1000); // 10-minute cache
      return tilesData;

    } catch (error) {
      console.error(`❌ Failed to fetch ${layer} tiles:`, error);
      throw {
        source: 'weather_tiles',
        error: error instanceof Error ? error.message : 'Weather tiles unavailable'
      } as WeatherAPIError;
    }
  }

  /**
   * Process radar data from RainViewer API
   */
  private processRadarData(data: any, options: { frames: number; animated: boolean; lat: number; lon: number }) {
    const { frames, animated, lat, lon } = options;
    const radarData = data.radar || {};
    const past = radarData.past || [];
    const nowcast = radarData.nowcast || [];

    // Combine historical and forecast frames
    const allFrames = [...past, ...nowcast];
    const framesToProcess = frames ? allFrames.slice(-frames) : allFrames.slice(-6);

    const processedFrames = framesToProcess.map((frameData: any) => ({
      timestamp: new Date(frameData.time * 1000).toISOString(),
      path: frameData.path,
      tiles: [
        {
          url: `https://tilecache.rainviewer.com${frameData.path}/256/6/${Math.floor((lon + 180) / 360 * 64)}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 64)}/4/1_1.png`,
          bounds: {
            north: lat + 0.5,
            south: lat - 0.5,
            east: lon + 0.5,
            west: lon - 0.5
          },
          opacity: 0.7,
          zIndex: 1000
        }
      ],
      intensity: 'moderate' as const,
      coverage: Math.random() * 100 // Would calculate from actual data
    }));

    return {
      frames: processedFrames,
      animated,
      duration: animated ? processedFrames.length * 1000 : 0,
      metadata: {
        source: 'rainviewer',
        updated: new Date().toISOString(),
        frameCount: processedFrames.length
      }
    };
  }
}

// Export singleton instance
export const weatherAPI = new WeatherAPI();

