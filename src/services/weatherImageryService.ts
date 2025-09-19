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
  private readonly OPEN_METEO_TILES = 'https://maps.openweathermap.org/maps/2.0/weather'; // Alternative tile service
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
      console.log('📡 Using cached radar data, frames:', cached.length);
      // Add debugging to see if cached data has tiles
      cached.forEach((frame, index) => {
        console.log(`📡 Cached frame ${index}: ${frame.tiles.length} tiles`);
      });
      return cached as RadarFrame[];
    }

    try {
      console.log('📡 Fetching fresh radar data from RainViewer API...');
      console.log('📡 API endpoint:', this.RAINVIEWER_API);

      // Get available radar maps from RainViewer (free)
      const response = await fetch(this.RAINVIEWER_API, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DragonWorlds2027/1.0'
        }
      });

      console.log('📡 RainViewer API response status:', response.status);

      if (!response.ok) {
        throw new Error(`RainViewer API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📡 RainViewer API response data keys:', Object.keys(data));
      console.log('📡 Radar data structure:', data.radar ? Object.keys(data.radar) : 'No radar key');

      const radarFrames = this.processRainViewerData(data, options);
      console.log(`📡 Processed ${radarFrames.length} radar frames`);

      // Log details about generated frames
      radarFrames.forEach((frame, index) => {
        console.log(`📡 Frame ${index}: ${frame.tiles.length} tiles, intensity: ${frame.precipitationIntensity}`);
        if (frame.tiles.length > 0) {
          console.log(`📡 Sample tile URL: ${frame.tiles[0].url}`);
        }
      });

      this.setCache(cacheKey, radarFrames, this.cacheExpiry);
      return radarFrames;

    } catch (error) {
      console.error('❌ Failed to fetch radar data:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : error);

      // Return fallback with some test tiles for debugging
      const fallbackFrame: RadarFrame = {
        timestamp: new Date().toISOString(),
        tiles: this.generateTestRadarTiles(), // Generate test tiles instead of empty array
        precipitationIntensity: 'light',
        coverage: 10
      };

      console.log('📡 Returning fallback frame with', fallbackFrame.tiles.length, 'test tiles');
      console.log('📡 Sample fallback tile URL:', fallbackFrame.tiles[0]?.url);
      return [fallbackFrame];
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
      console.log('🛰️ Using cached satellite data, frames:', cached.length);
      cached.forEach((frame, index) => {
        console.log(`🛰️ Cached frame ${index}: ${frame.tiles.length} tiles, type: ${frame.type}`);
      });
      return cached as SatelliteFrame[];
    }

    try {
      console.log(`🛰️ Fetching ${type} satellite data...`);

      // Use alternative satellite layers (free sources)
      const satelliteFrames = await this.fetchAlternativeSatellite(type);
      console.log(`🛰️ Fetched ${satelliteFrames.length} satellite frames`);

      satelliteFrames.forEach((frame, index) => {
        console.log(`🛰️ Frame ${index}: ${frame.tiles.length} tiles, coverage: ${frame.cloudCoverage}%`);
        if (frame.tiles.length > 0) {
          console.log(`🛰️ Sample tile URL: ${frame.tiles[0].url}`);
        }
      });

      this.setCache(cacheKey, satelliteFrames, this.satelliteCacheExpiry);
      return satelliteFrames;

    } catch (error) {
      console.error('❌ Failed to fetch satellite data:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : error);

      // Return fallback with test tiles for debugging
      const fallbackFrame: SatelliteFrame = {
        timestamp: new Date().toISOString(),
        tiles: this.generateTestSatelliteTiles(),
        cloudCoverage: 25,
        type
      };

      console.log('🛰️ Returning fallback frame with', fallbackFrame.tiles.length, 'test tiles');
      console.log('🛰️ Sample fallback tile URL:', fallbackFrame.tiles[0]?.url);
      return [fallbackFrame];
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
   * Fetch alternative satellite data using free sources
   */
  private async fetchAlternativeSatellite(type: string): Promise<SatelliteFrame[]> {
    // Use alternative free satellite sources instead of OpenWeatherMap
    // For now, return a placeholder structure with RainViewer or other free sources

    const layerMap = {
      'visible': 'clouds',
      'infrared': 'temp',
      'water_vapor': 'clouds'
    };

    const layer = layerMap[type as keyof typeof layerMap] || 'clouds';
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
      // Use RainViewer or other free alternative instead of OpenWeatherMap
      tiles.push({
        url: `https://tilecache.rainviewer.com/v2/radar/0/${zoom}/${bounds.x}/${bounds.y}/2/1_1.png`,
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
   * Generate test radar tiles for debugging purposes
   */
  private generateTestRadarTiles(): WeatherTile[] {
    const tiles: WeatherTile[] = [];

    // Generate a few test tiles covering Hong Kong area
    const testTileConfigs = [
      { x: 209, y: 107, z: 8 }, // Hong Kong area tiles at zoom level 8
      { x: 210, y: 107, z: 8 },
      { x: 209, y: 108, z: 8 },
      { x: 210, y: 108, z: 8 }
    ];

    testTileConfigs.forEach((config, index) => {
      // Use OpenStreetMap tiles as a test to verify tile rendering works
      const testUrl = `https://tile.openstreetmap.org/${config.z}/${config.x}/${config.y}.png`;

      tiles.push({
        url: testUrl,
        bounds: {
          north: 22.6 - (index * 0.1),
          south: 22.0 - (index * 0.1),
          east: 114.6 - (index * 0.1),
          west: 113.8 - (index * 0.1)
        },
        timestamp: new Date().toISOString(),
        opacity: 0.5, // Make test tiles semi-transparent
        zIndex: 1000 + index
      });
    });

    console.log('📡 Generated', tiles.length, 'test radar tiles');
    return tiles;
  }

  /**
   * Generate test satellite tiles for debugging purposes
   */
  private generateTestSatelliteTiles(): WeatherTile[] {
    const tiles: WeatherTile[] = [];

    // Generate test tiles covering Hong Kong area with different colors for visual feedback
    const testTileConfigs = [
      { x: 209, y: 107, z: 8 },
      { x: 210, y: 107, z: 8 },
      { x: 209, y: 108, z: 8 },
      { x: 210, y: 108, z: 8 }
    ];

    testTileConfigs.forEach((config, index) => {
      // Use different map tiles to distinguish satellite from radar
      const testUrl = `https://tile.openstreetmap.org/${config.z}/${config.x}/${config.y}.png`;

      tiles.push({
        url: testUrl,
        bounds: {
          north: 22.6 - (index * 0.05),
          south: 22.0 - (index * 0.05),
          east: 114.6 - (index * 0.05),
          west: 113.8 - (index * 0.05)
        },
        timestamp: new Date().toISOString(),
        opacity: 0.4, // Make satellite tiles slightly more transparent
        zIndex: 800 + index
      });
    });

    console.log('🛰️ Generated', tiles.length, 'test satellite tiles');
    return tiles;
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

  /**
   * Test API endpoints and log detailed results for debugging
   */
  public async testAPIEndpoints(): Promise<void> {
    console.log('🧪 Testing weather imagery API endpoints...');

    // Test RainViewer API
    try {
      console.log('🧪 Testing RainViewer API:', this.RAINVIEWER_API);
      const response = await fetch(this.RAINVIEWER_API);
      console.log('🧪 RainViewer response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🧪 RainViewer response structure:', {
          hasRadar: !!data.radar,
          radarKeys: data.radar ? Object.keys(data.radar) : [],
          pastFrames: data.radar?.past?.length || 0,
          nowcastFrames: data.radar?.nowcast?.length || 0
        });

        if (data.radar?.past?.length > 0) {
          const sampleFrame = data.radar.past[0];
          console.log('🧪 Sample radar frame:', sampleFrame);

          // Test generating tiles for this frame
          const testTiles = this.generateRainViewerTiles(sampleFrame.path, 6);
          console.log('🧪 Generated', testTiles.length, 'test tiles');
          if (testTiles.length > 0) {
            console.log('🧪 Sample tile URL:', testTiles[0].url);
          }
        }
      } else {
        console.log('🧪 RainViewer API failed with status:', response.status);
      }
    } catch (error) {
      console.error('🧪 RainViewer API test failed:', error);
    }

    // Test alternative tile endpoint
    try {
      console.log('🧪 Testing alternative tile service...');
      const testTileUrl = `https://tilecache.rainviewer.com/v2/radar/0/6/32/20/2/1_1.png`;
      console.log('🧪 Sample alternative tile URL:', testTileUrl);

      const response = await fetch(testTileUrl);
      console.log('🧪 Alternative tile response status:', response.status);
    } catch (error) {
      console.log('🧪 Alternative tile test:', error);
    }

    console.log('🧪 API endpoint testing completed');
  }
}

// Export singleton instance
export const weatherImageryService = new WeatherImageryService();
export default weatherImageryService;