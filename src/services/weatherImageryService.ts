/**
 * Weather Imagery Service
 *
 * Provides weather radar and satellite imagery for visual weather data display.
 * Supports multiple data sources with fallbacks for comprehensive weather visualization.
 *
 * Features:
 * - Real-time weather radar data
 * - Satellite imagery (visible and infrared)
 * - Historical weather data playback
 * - Optimized tile loading for Hong Kong region
 * - Caching for performance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HK_GENERAL } from '../constants/raceCoordinates';

// Weather imagery interfaces
export interface WeatherTile {
  url: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  timestamp: string;
  opacity: number;
  zIndex: number;
}

export interface RadarFrame {
  timestamp: string;
  tiles: WeatherTile[];
  precipitationIntensity: 'light' | 'moderate' | 'heavy' | 'extreme';
  coverage: number; // percentage of area with precipitation
}

export interface SatelliteFrame {
  timestamp: string;
  tiles: WeatherTile[];
  cloudCoverage: number; // percentage cloud cover
  type: 'visible' | 'infrared' | 'water_vapor';
}

export interface WeatherAnimation {
  frames: (RadarFrame | SatelliteFrame)[];
  duration: number; // total animation duration in ms
  frameInterval: number; // interval between frames in ms
  loop: boolean;
}

export interface WeatherImageryCache {
  [key: string]: {
    data: WeatherTile[] | WeatherAnimation;
    timestamp: number;
    expiresIn: number;
  };
}

// Hong Kong weather imagery bounds for optimization
const HK_WEATHER_BOUNDS = {
  north: 22.6,
  south: 22.0,
  east: 114.6,
  west: 113.8
};

export class WeatherImageryService {
  private cache: WeatherImageryCache = {};
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes for radar data
  private satelliteCacheExpiry = 30 * 60 * 1000; // 30 minutes for satellite data

  // API endpoints and configurations
  private readonly RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';
  private readonly OPENWEATHER_MAP_LAYER = 'https://tile.openweathermap.org/map';
  private readonly WINDY_API = 'https://api.windy.com/api/map-tiles/v1';

  constructor() {
    this.loadCache();
  }

  /**
   * Get current weather radar data for Hong Kong region
   */
  async getRadarData(options?: {
    frames?: number;
    animated?: boolean;
  }): Promise<RadarFrame[]> {
    const cacheKey = `radar_hk_${options?.frames || 1}_${options?.animated || false}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached && Array.isArray(cached)) {
      console.log('📡 Using cached radar data');
      return cached as RadarFrame[];
    }

    try {
      console.log('📡 Fetching fresh radar data from RainViewer...');

      // Get available radar maps from RainViewer (free)
      const response = await fetch(this.RAINVIEWER_API, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DragonWorlds2027/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`RainViewer API error: ${response.status}`);
      }

      const data = await response.json();
      const radarFrames = this.processRainViewerData(data, options);

      this.setCache(cacheKey, radarFrames, this.cacheExpiry);
      return radarFrames;

    } catch (error) {
      console.error('❌ Failed to fetch radar data:', error);

      // Return fallback empty radar frame
      return [{
        timestamp: new Date().toISOString(),
        tiles: [],
        precipitationIntensity: 'light',
        coverage: 0
      }];
    }
  }

  /**
   * Get satellite imagery for Hong Kong region
   */
  async getSatelliteData(type: 'visible' | 'infrared' | 'water_vapor' = 'visible'): Promise<SatelliteFrame[]> {
    const cacheKey = `satellite_hk_${type}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached && Array.isArray(cached)) {
      console.log('🛰️ Using cached satellite data');
      return cached as SatelliteFrame[];
    }

    try {
      console.log(`🛰️ Fetching ${type} satellite data...`);

      // Use OpenWeatherMap satellite layers (requires API key)
      const satelliteFrames = await this.fetchOpenWeatherMapSatellite(type);

      this.setCache(cacheKey, satelliteFrames, this.satelliteCacheExpiry);
      return satelliteFrames;

    } catch (error) {
      console.error('❌ Failed to fetch satellite data:', error);

      // Return fallback empty satellite frame
      return [{
        timestamp: new Date().toISOString(),
        tiles: [],
        cloudCoverage: 0,
        type
      }];
    }
  }

  /**
   * Get animated weather radar sequence
   */
  async getRadarAnimation(frames: number = 10): Promise<WeatherAnimation> {
    const cacheKey = `radar_animation_${frames}`;

    const cached = this.getFromCache(cacheKey);
    if (cached && 'frames' in cached) {
      console.log('🎬 Using cached radar animation');
      return cached as WeatherAnimation;
    }

    try {
      const radarFrames = await this.getRadarData({ frames, animated: true });

      const animation: WeatherAnimation = {
        frames: radarFrames,
        duration: frames * 1000, // 1 second per frame
        frameInterval: 1000,
        loop: true
      };

      this.setCache(cacheKey, animation, this.cacheExpiry);
      return animation;

    } catch (error) {
      console.error('❌ Failed to create radar animation:', error);

      return {
        frames: [],
        duration: 0,
        frameInterval: 1000,
        loop: false
      };
    }
  }

  /**
   * Get weather tiles for specific layer type
   */
  async getWeatherTiles(
    layer: 'precipitation' | 'clouds' | 'temperature' | 'wind' | 'pressure',
    zoom: number = 6
  ): Promise<WeatherTile[]> {
    const cacheKey = `tiles_${layer}_z${zoom}`;

    const cached = this.getFromCache(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached as WeatherTile[];
    }

    try {
      const tiles = await this.fetchWeatherTiles(layer, zoom);
      this.setCache(cacheKey, tiles, this.cacheExpiry);
      return tiles;

    } catch (error) {
      console.error(`❌ Failed to fetch ${layer} tiles:`, error);
      return [];
    }
  }

  /**
   * Process RainViewer API response into RadarFrame format
   */
  private processRainViewerData(data: any, options?: { frames?: number }): RadarFrame[] {
    const frames: RadarFrame[] = [];
    const radarData = data.radar || {};
    const past = radarData.past || [];
    const nowcast = radarData.nowcast || [];

    // Combine historical and forecast frames
    const allFrames = [...past, ...nowcast];
    const framesToProcess = options?.frames ? allFrames.slice(-options.frames) : allFrames.slice(-6);

    framesToProcess.forEach((frameData: any) => {
      const timestamp = new Date(frameData.time * 1000).toISOString();

      // Generate tile URLs for Hong Kong region
      const tiles = this.generateRainViewerTiles(frameData.path, 6); // zoom level 6 for HK

      frames.push({
        timestamp,
        tiles,
        precipitationIntensity: this.calculatePrecipitationIntensity(frameData.path),
        coverage: Math.random() * 100 // Placeholder - would calculate from actual data
      });
    });

    return frames;
  }

  /**
   * Generate RainViewer tile URLs for Hong Kong region
   */
  private generateRainViewerTiles(path: string, zoom: number): WeatherTile[] {
    const tiles: WeatherTile[] = [];
    const baseUrl = 'https://tilecache.rainviewer.com';

    // Calculate tile bounds for Hong Kong area
    const tileBounds = this.calculateTileBounds(HK_WEATHER_BOUNDS, zoom);

    tileBounds.forEach((bounds, index) => {
      tiles.push({
        url: `${baseUrl}${path}/256/${zoom}/${bounds.x}/${bounds.y}/4/1_1.png`,
        bounds: {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west
        },
        timestamp: new Date().toISOString(),
        opacity: 0.7,
        zIndex: 1000 + index
      });
    });

    return tiles;
  }

  /**
   * Fetch OpenWeatherMap satellite data
   */
  private async fetchOpenWeatherMapSatellite(type: string): Promise<SatelliteFrame[]> {
    // This would integrate with OpenWeatherMap's satellite API
    // For now, return a placeholder structure

    const layerMap = {
      'visible': 'clouds_new',
      'infrared': 'temp_new',
      'water_vapor': 'clouds_new'
    };

    const layer = layerMap[type as keyof typeof layerMap] || 'clouds_new';
    const tiles = await this.fetchWeatherTiles(layer as any, 6);

    return [{
      timestamp: new Date().toISOString(),
      tiles,
      cloudCoverage: Math.random() * 100,
      type: type as 'visible' | 'infrared' | 'water_vapor'
    }];
  }

  /**
   * Fetch weather tiles for specific layer
   */
  private async fetchWeatherTiles(layer: string, zoom: number): Promise<WeatherTile[]> {
    const tiles: WeatherTile[] = [];

    // Calculate tile grid for Hong Kong region
    const tileBounds = this.calculateTileBounds(HK_WEATHER_BOUNDS, zoom);

    tileBounds.forEach((bounds, index) => {
      // Use a placeholder URL structure - would be replaced with actual API endpoints
      tiles.push({
        url: `${this.OPENWEATHER_MAP_LAYER}/${layer}/${zoom}/${bounds.x}/${bounds.y}.png`,
        bounds: {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west
        },
        timestamp: new Date().toISOString(),
        opacity: 0.6,
        zIndex: 500 + index
      });
    });

    return tiles;
  }

  /**
   * Calculate tile bounds for given geographic bounds and zoom level
   */
  private calculateTileBounds(geoBounds: typeof HK_WEATHER_BOUNDS, zoom: number) {
    // Simplified tile calculation - would use proper Web Mercator projection
    const tileBounds = [];

    // Calculate number of tiles needed to cover Hong Kong
    const n = Math.pow(2, zoom);
    const latRange = geoBounds.north - geoBounds.south;
    const lonRange = geoBounds.east - geoBounds.west;

    // Generate a 2x2 grid of tiles covering Hong Kong
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        const west = geoBounds.west + (lonRange / 2) * x;
        const east = geoBounds.west + (lonRange / 2) * (x + 1);
        const south = geoBounds.south + (latRange / 2) * y;
        const north = geoBounds.south + (latRange / 2) * (y + 1);

        tileBounds.push({
          x: Math.floor((west + 180) / 360 * n),
          y: Math.floor((1 - Math.log(Math.tan(north * Math.PI / 180) + 1 / Math.cos(north * Math.PI / 180)) / Math.PI) / 2 * n),
          north,
          south,
          east,
          west
        });
      }
    }

    return tileBounds;
  }

  /**
   * Calculate precipitation intensity from radar data
   */
  private calculatePrecipitationIntensity(path: string): 'light' | 'moderate' | 'heavy' | 'extreme' {
    // Placeholder logic - would analyze actual radar data
    const hash = path.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const intensity = Math.abs(hash) % 4;
    return ['light', 'moderate', 'heavy', 'extreme'][intensity] as any;
  }

  /**
   * Cache management methods
   */
  private async loadCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('weather_imagery_cache');
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load weather imagery cache:', error);
      this.cache = {};
    }
  }

  private async saveCache(): Promise<void> {
    try {
      await AsyncStorage.setItem('weather_imagery_cache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save weather imagery cache:', error);
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

  /**
   * Utility methods
   */
  public clearCache(): void {
    this.cache = {};
    AsyncStorage.removeItem('weather_imagery_cache');
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
   * Check if weather imagery is available for Hong Kong region
   */
  public async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.RAINVIEWER_API);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const weatherImageryService = new WeatherImageryService();
export default weatherImageryService;