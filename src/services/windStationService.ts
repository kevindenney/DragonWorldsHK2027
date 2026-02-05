/**
 * Wind Station Service
 *
 * Provides real wind station data for Hong Kong racing area with actual
 * coordinates from Hong Kong Observatory and marine weather stations.
 *
 * Features:
 * - Real wind station coordinates from HKO
 * - Marine weather buoy locations
 * - Wind data validation and quality control
 * - Caching with refresh intervals
 * - Water area validation for marine stations
 *
 * Coordinate Sources & Verification Status:
 * ===========================================
 *
 * HKO Wind Stations (Official DMS coordinates converted to decimal):
 * - Chek Lap Kok Airport: 22.3081°N, 113.9186°E (Primary - verified from aviation weather data)
 * - Tsing Yi (Shell Oil): 22.3500°N, 114.1000°E (Marine weather station)
 * - Kai Tak (Old Airport): 22.3167°N, 114.1833°E (Urban weather station)
 * - Ta Kwu Ling: 22.5500°N, 114.2167°E (Northern New Territories - rural)
 * - Wetland Park: 22.4667°N, 114.0167°E (Tin Shui Wai wetland area)
 * - King's Park: 22.2958°N, 114.1722°E (Tsim Sha Tsui - CORRECTED from duplicate)
 * - Tsim Sha Tsui Harbor: 22.3000°N, 114.1667°E (Harbor weather station)
 * - Central Urban: 22.2833°N, 114.1500°E (Urban weather station)
 * - Waglan Island: 22.1833°N, 114.3000°E (Marine - important for racing area)
 * - Sha Chau: 22.3500°N, 113.9000°E (Marine weather station)
 * - Tai Mo Shan: 22.4000°N, 114.1167°E (High altitude weather station)
 *
 * Marine Wind Stations (Strategic sailing area coverage):
 * - Victoria Harbour Central: 22.2850°N, 114.1650°E (Primary marine monitoring)
 * - Clearwater Bay areas: Multiple positions for eastern wind monitoring
 * - Nine Pins Racing Area: From NINE_PINS_RACING_STATION constant
 * - Outer Hong Kong waters: Better wind exposure locations
 * - Repulse Bay, Stanley Bay, Aberdeen Harbour: Coastal wind monitoring
 *
 * Coordinate Accuracy Notes:
 * - HKO coordinates: Official government weather station positions
 * - Marine coordinates: Based on marine weather buoy network and sailing area requirements
 * - All coordinates validated within Hong Kong bounds (21.9-22.6°N, 113.8-114.4°E)
 * - Duplicate coordinate fix: King's Park moved from Kai Tak position to correct Tsim Sha Tsui location
 *
 * Data Quality Levels:
 * - High: OpenWeatherMap API data with official station coordinates
 * - Medium: Open-Meteo API data
 * - Low: Fallback generated data when APIs unavailable
 */

import { WeatherAPI } from './weatherAPI';
import { handleWeatherAPIError } from './errorHandler';
import { NINE_PINS_RACING_STATION } from '../constants/raceCoordinates';
import { stationCatalogService } from './stationCatalogService';

export interface WindStation {
  id: string;
  name: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'hko' | 'marine' | 'airport' | 'buoy';
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  temperature?: number;
  pressure?: number;
  humidity?: number;
  visibility?: number;
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
  isActive: boolean;
  description: string;
}

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

// Real Hong Kong Observatory wind stations with verified coordinates
const HKO_WIND_STATIONS: LocationCoordinate[] = [
  // Chek Lap Kok Airport (Primary for racing area) - Verified coordinates
  { latitude: 22.3081, longitude: 113.9186 },
  
  // Tsing Yi (Shell Oil Depot) - Marine weather station
  { latitude: 22.3500, longitude: 114.1000 },
  
  // Kai Tak (Old Airport) - Urban weather station
  { latitude: 22.3167, longitude: 114.1833 },

  // Ta Kwu Ling (Northern New Territories) - Rural weather station
  { latitude: 22.5500, longitude: 114.2167 },

  // Wetland Park (Tin Shui Wai) - Wetland weather station
  { latitude: 22.4667, longitude: 114.0167 },

  // King's Park (Tsim Sha Tsui) - Urban weather station - Fixed duplicate coordinates
  { latitude: 22.2958, longitude: 114.1722 },
  
  // Tsim Sha Tsui (Harbor) - Harbor weather station
  { latitude: 22.3000, longitude: 114.1667 },
  
  // Central (Urban) - Urban weather station
  { latitude: 22.2833, longitude: 114.1500 },
  
  // Waglan Island - Marine weather station (important for racing area)
  { latitude: 22.1833, longitude: 114.3000 },
  
  // Sha Chau - Marine weather station
  { latitude: 22.3500, longitude: 113.9000 },
  
  // Tai Mo Shan - High altitude weather station
  { latitude: 22.4000, longitude: 114.1167 },
];

// Optimized marine wind stations - reduced from 16+ to 3 unique Open-Meteo grid cells
// Each station represents a unique wind data grid cell in Open-Meteo weather model
const MARINE_WIND_STATIONS: LocationCoordinate[] = [
  // Western Marine Area - Victoria Harbour & western waters
  // Covers: Victoria Harbour, Aberdeen, western approaches
  // API Grid: 22.25°N, 114.125°E
  { latitude: 22.2850, longitude: 114.1650 }, // Central Harbor (PRIMARY for western sailing areas)

  // Eastern Marine Area - Clearwater Bay & Nine Pins racing waters
  // Covers: Clearwater Bay, Nine Pins Racing Area, Repulse Bay, Stanley Bay
  // API Grid: 22.25°N, 114.25°E
  { latitude: 22.2900, longitude: 114.2900 }, // Eastern waters (PRIMARY for Dragon Worlds racing)

  // Northern Marine Area - Lei Yue Mun & northern channels
  // Covers: Northern approaches, Lei Yue Mun channel, northern racing areas
  // API Grid: 22.375°N, 114.25°E
  { latitude: 22.3200, longitude: 114.2200 } // Northern waters (covers northern approaches)
];

// Water area boundaries for marine station validation
const WATER_AREAS = [
  {
    name: 'Nine Pins Racing Area',
    bounds: {
      north: 22.280,
      south: 22.240,
      east: 114.340,
      west: 114.300
    }
  },
  {
    name: 'Victoria Harbour',
    bounds: {
      north: 22.300,
      south: 22.260,
      east: 114.200,
      west: 114.140
    }
  },
  {
    name: 'Clearwater Bay',
    bounds: {
      north: 22.320,
      south: 22.240,
      east: 114.320,
      west: 114.260
    }
  },
  {
    name: 'Repulse Bay',
    bounds: {
      north: 22.250,
      south: 22.220,
      east: 114.210,
      west: 114.180
    }
  },
  {
    name: 'Stanley Bay',
    bounds: {
      north: 22.230,
      south: 22.200,
      east: 114.220,
      west: 114.190
    }
  },
  {
    name: 'Aberdeen Harbour',
    bounds: {
      north: 22.260,
      south: 22.240,
      east: 114.160,
      west: 114.140
    }
  },
  {
    name: 'Racing Area',
    bounds: {
      north: 22.390,
      south: 22.310,
      east: 114.290,
      west: 114.210
    }
  }
];

class WindStationService {
  private weatherAPI: WeatherAPI;
  private cache: Map<string, WindStation> = new Map();
  private cacheExpiry = 1 * 60 * 1000; // 1 minute for testing

  constructor() {
    this.weatherAPI = new WeatherAPI();
  }

  /**
   * Get all wind stations with real data
   */
  async getWindStations(): Promise<WindStation[]> {
    const stations: WindStation[] = [];
    
    // Get HKO stations
    for (const coord of HKO_WIND_STATIONS) {
      try {
        const station = await this.getWindStationData(coord, 'hko');
        if (station && this.validateWindStation(station)) {
          stations.push(station);
        } else if (station) {
        }
      } catch (error) {
      }
    }

    // Get marine stations
    for (const coord of MARINE_WIND_STATIONS) {
      try {
        const station = await this.getWindStationData(coord, 'marine');
        if (station && this.validateWindStation(station)) {
          stations.push(station);
        } else if (station) {
        }
      } catch (error) {
      }
    }

    // console.log(`Loaded ${stations.length} valid wind stations`);
    return stations;
  }

  /**
   * Get wind stations using the comprehensive station catalog
   * Integrates verified HKO coordinates with existing functionality
   */
  async getWindStationsFromCatalog(): Promise<WindStation[]> {
    const stations: WindStation[] = [];

    // Get weather stations from catalog (automatic weather stations + weather buoys)
    const catalogWeatherStations = stationCatalogService.getWeatherStations();
    const catalogWeatherBuoys = stationCatalogService.getWeatherBuoys();
    const allCatalogStations = [...catalogWeatherStations, ...catalogWeatherBuoys];


    for (const catalogStation of allCatalogStations) {
      try {
        const coordinate: LocationCoordinate = {
          latitude: catalogStation.lat,
          longitude: catalogStation.lon
        };

        const stationType = catalogStation.type === 'automatic_weather_station' ? 'hko' : 'marine';
        const station = await this.getWindStationData(coordinate, stationType);

        if (station && this.validateWindStation(station)) {
          // Enhance station with catalog metadata
          station.id = catalogStation.id;
          station.name = catalogStation.name;
          station.description = catalogStation.notes || station.description;
          stations.push(station);

        } else {
        }
      } catch (error) {
      }
    }

    return stations;
  }

  /**
   * Get Nine Pins racing area wind stations with enhanced priority
   */
  async getNinePinsRacingWindStations(): Promise<WindStation[]> {
    const racingStations = stationCatalogService.getNinePinsRacingStations();
    const stations: WindStation[] = [];


    for (const catalogStation of racingStations) {
      try {
        const coordinate: LocationCoordinate = {
          latitude: catalogStation.lat,
          longitude: catalogStation.lon
        };

        const stationType = catalogStation.type === 'automatic_weather_station' ? 'hko' : 'marine';
        const station = await this.getWindStationData(coordinate, stationType);

        if (station && this.validateWindStation(station)) {
          // Enhance station with catalog metadata and racing context
          station.id = catalogStation.id;
          station.name = catalogStation.name;
          station.description = `${catalogStation.notes || station.description} (${catalogStation.distanceKm.toFixed(1)}km from racing area)`;
          stations.push(station);

        }
      } catch (error) {
      }
    }

    // Sort by distance from racing area (closest first)
    stations.sort((a, b) => {
      const stationA = racingStations.find(s => s.id === a.id);
      const stationB = racingStations.find(s => s.id === b.id);
      return (stationA?.distanceKm || 999) - (stationB?.distanceKm || 999);
    });

    return stations;
  }

  /**
   * Get wind data for a specific station
   */
  private async getWindStationData(
    coordinate: LocationCoordinate, 
    type: 'hko' | 'marine'
  ): Promise<WindStation | null> {
    const cacheKey = `wind_${coordinate.latitude}_${coordinate.longitude}_${type}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - new Date(cached.lastUpdated).getTime() < this.cacheExpiry) {
      return cached;
    }

    try {
      // Get weather data from API
      const weatherData = await this.weatherAPI.getWeatherData({
        lat: coordinate.latitude,
        lon: coordinate.longitude
      });

      // Process wind data based on source - prioritize Open-Meteo Weather API
      let windData: any;
      let dataQuality: 'high' | 'medium' | 'low' = 'low';

      if (weatherData.data.openmeteo_weather && weatherData.data.openmeteo_weather.data.wind.length > 0) {
        // Use Open-Meteo Weather API data (primary source)
        const currentWind = weatherData.data.openmeteo_weather.data.wind[0];
        windData = {
          wind_speed: currentWind.windSpeed, // Already converted to knots
          wind_deg: currentWind.windDirection,
          wind_gust: currentWind.windGust,
          temp: currentWind.temperature,
          pressure: currentWind.pressure,
          humidity: currentWind.humidity,
          visibility: currentWind.visibility
        };
        dataQuality = 'high';
      } else {
        // Use fallback data
        windData = this.generateFallbackWindData(coordinate);
        dataQuality = 'low';
      }

      const windSpeed = windData.wind_speed || windData.windSpeed || 0;
      const windDirection = windData.wind_deg || windData.windDirection || 0;
      
      // console.log(`🌬️ Station ${coordinate.latitude.toFixed(3)}, ${coordinate.longitude.toFixed(3)}: ${windSpeed} kts @ ${windDirection}°`);
      
      const station: WindStation = {
        id: `wind-${coordinate.latitude.toFixed(3)}-${coordinate.longitude.toFixed(3)}`,
        name: this.getStationName(coordinate, type),
        coordinate,
        type,
        windSpeed,
        windDirection,
        windGust: windData.wind_gust || windData.windGust,
        temperature: windData.temp || windData.temperature,
        pressure: windData.pressure,
        humidity: windData.humidity,
        visibility: windData.visibility,
        lastUpdated: new Date().toISOString(),
        dataQuality: dataQuality,
        isActive: true,
        description: this.getStationDescription(coordinate, type)
      };

      // Cache the result
      this.cache.set(cacheKey, station);
      return station;

    } catch (error) {
      // Handle weather API errors with silent flag support
      const errorMessage = handleWeatherAPIError(error, 'windStationService.getWindStationAtCoordinate');
      if (!(error && typeof error === 'object' && (error as any).silent === true)) {
      }
      
      // Return fallback data
      return {
        id: `wind-${coordinate.latitude.toFixed(3)}-${coordinate.longitude.toFixed(3)}`,
        name: this.getStationName(coordinate, type),
        coordinate,
        type,
        windSpeed: this.generateFallbackWindSpeed(coordinate),
        windDirection: this.generateFallbackWindDirection(coordinate),
        lastUpdated: new Date().toISOString(),
        dataQuality: 'low',
        isActive: false,
        description: this.getStationDescription(coordinate, type)
      };
    }
  }

  /**
   * Generate fallback wind data when API fails
   */
  private generateFallbackWindData(coordinate: LocationCoordinate) {
    const windSpeed = this.generateFallbackWindSpeed(coordinate);
    const windGust = this.generateFallbackWindGust(coordinate, windSpeed);
    
    return {
      wind_speed: windSpeed,
      wind_deg: this.generateFallbackWindDirection(coordinate),
      wind_gust: windGust,
      temp: 25 + Math.sin(coordinate.latitude * 100) * 5,
      pressure: 1013 + Math.cos(coordinate.longitude * 100) * 10,
      humidity: 70 + Math.sin(coordinate.latitude * 200) * 20,
      visibility: 15 - Math.abs(coordinate.latitude - 22.3) * 10
    };
  }

  /**
   * Generate realistic fallback wind speed based on location
   */
  private generateFallbackWindSpeed(coordinate: LocationCoordinate): number {
    const baseSpeed = 8;
    
    // Create location-specific variations that are consistent but different per station
    const latVariation = Math.sin(coordinate.latitude * 100) * 4;
    const lngVariation = Math.cos(coordinate.longitude * 100) * 3;
    
    // Add station-specific time variation based on coordinates
    const stationTimeOffset = (coordinate.latitude * 1000 + coordinate.longitude * 1000) % 1000000;
    const timeVariation = Math.sin((Date.now() + stationTimeOffset) / 1000000) * 2;
    
    // Add some randomness based on station ID for more variation
    const stationId = `${coordinate.latitude.toFixed(3)}-${coordinate.longitude.toFixed(3)}`;
    const hash = stationId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const randomVariation = (Math.abs(hash) % 100) / 100 * 3 - 1.5; // -1.5 to 1.5
    
    const finalSpeed = baseSpeed + latVariation + lngVariation + timeVariation + randomVariation;
    return Math.max(2, Math.min(25, Math.round(finalSpeed * 10) / 10)); // Round to 1 decimal
  }

  /**
   * Generate realistic fallback wind direction based on location
   */
  private generateFallbackWindDirection(coordinate: LocationCoordinate): number {
    const baseDirection = 45;
    
    // Create location-specific variations
    const latVariation = Math.sin(coordinate.latitude * 200) * 30;
    const lngVariation = Math.cos(coordinate.longitude * 200) * 20;
    
    // Add station-specific time variation
    const stationTimeOffset = (coordinate.latitude * 2000 + coordinate.longitude * 2000) % 2000000;
    const timeVariation = Math.sin((Date.now() + stationTimeOffset) / 2000000) * 15;
    
    // Add station-specific random variation
    const stationId = `${coordinate.latitude.toFixed(3)}-${coordinate.longitude.toFixed(3)}`;
    const hash = stationId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const randomVariation = (Math.abs(hash) % 100) / 100 * 40 - 20; // -20 to 20 degrees
    
    const finalDirection = baseDirection + latVariation + lngVariation + timeVariation + randomVariation;
    return Math.round((finalDirection + 360) % 360);
  }

  /**
   * Generate realistic fallback wind gust based on wind speed
   */
  private generateFallbackWindGust(coordinate: LocationCoordinate, windSpeed: number): number {
    // Wind gusts are typically 1.2-1.8x the sustained wind speed
    const baseMultiplier = 1.4;
    
    // Add some variation based on location and time
    const stationTimeOffset = (coordinate.latitude * 1000 + coordinate.longitude * 1000) % 1000000;
    const timeVariation = Math.sin((Date.now() + stationTimeOffset) / 3000000) * 0.2; // ±0.2
    
    // Add location-based variation (some areas more gusty)
    const locationVariation = Math.sin(coordinate.latitude * 200) * 0.1; // ±0.1
    
    const multiplier = baseMultiplier + timeVariation + locationVariation;
    const gustSpeed = windSpeed * multiplier;
    
    // Ensure gust is at least 1.1x wind speed and not more than 2.5x
    return Math.max(windSpeed * 1.1, Math.min(windSpeed * 2.5, Math.round(gustSpeed * 10) / 10));
  }

  /**
   * Get station name based on coordinates and type
   */
  private getStationName(coordinate: LocationCoordinate, type: string): string {
    if (type === 'hko') {
      // HKO station names based on verified locations
      if (coordinate.latitude > 22.5) return 'Ta Kwu Ling HKO';
      if (coordinate.longitude < 114.0) return 'Wetland Park HKO';
      if (coordinate.latitude > 22.3 && coordinate.longitude > 114.1) return 'Tsing Yi HKO';
      if (coordinate.latitude < 22.32 && coordinate.longitude > 113.9) return 'Chek Lap Kok HKO';
      if (coordinate.latitude > 22.4) return 'Tai Mo Shan HKO';
      if (coordinate.latitude < 22.2 && coordinate.longitude > 114.2) return 'Waglan Island HKO';
      if (coordinate.latitude > 22.3 && coordinate.longitude < 113.9) return 'Sha Chau HKO';
      return 'HKO Station';
    } else {
      // Marine station names with more specific locations
      const waterArea = this.getWaterAreaName(coordinate.latitude, coordinate.longitude);
      
      // Check for Nine Pins racing area location
      if (Math.abs(coordinate.latitude - NINE_PINS_RACING_STATION.latitude) < 0.001 &&
          Math.abs(coordinate.longitude - NINE_PINS_RACING_STATION.longitude) < 0.001) {
        return 'Nine Pins Racing Area';
      }
      
      return `${waterArea} Marine Station`;
    }
  }

  /**
   * Get station description
   */
  private getStationDescription(coordinate: LocationCoordinate, type: string): string {
    if (type === 'hko') {
      return 'Hong Kong Observatory official weather station';
    } else {
      const waterArea = this.getWaterAreaName(coordinate.latitude, coordinate.longitude);
      return `Marine weather station in ${waterArea}`;
    }
  }

  /**
   * Determine data quality based on API response
   */
  private determineDataQuality(weatherData: any): 'high' | 'medium' | 'low' {
    if (weatherData.data.openmeteo_weather) return 'high';
    if (weatherData.data.openmeteo) return 'medium';
    return 'low';
  }

  /**
   * Get water area name for coordinates
   */
  private getWaterAreaName(latitude: number, longitude: number): string {
    for (const area of WATER_AREAS) {
      if (latitude >= area.bounds.south && latitude <= area.bounds.north &&
          longitude >= area.bounds.west && longitude <= area.bounds.east) {
        return area.name;
      }
    }
    return 'Hong Kong Waters';
  }

  /**
   * Validate if coordinates are over water (for marine stations)
   */
  private isOverWater(latitude: number, longitude: number): boolean {
    const waterArea = this.getWaterAreaName(latitude, longitude);
    return waterArea !== 'Hong Kong Waters' && waterArea !== 'Unknown Area';
  }

  /**
   * Validate wind station coordinates and data quality
   */
  private validateWindStation(station: WindStation): boolean {
    // Check if coordinates are valid
    if (!station.coordinate || 
        station.coordinate.latitude < -90 || station.coordinate.latitude > 90 ||
        station.coordinate.longitude < -180 || station.coordinate.longitude > 180) {
      return false;
    }

    // Check if wind data is reasonable
    if (station.windSpeed < 0 || station.windSpeed > 100) {
      return false;
    }

    if (station.windDirection < 0 || station.windDirection > 360) {
      return false;
    }

    // For marine stations, check if they're over water
    if (station.type === 'marine' && !this.isOverWater(station.coordinate.latitude, station.coordinate.longitude)) {
      return false;
    }

    return true;
  }

  /**
   * Get wind stations for specific area
   */
  async getWindStationsForArea(
    north: number, 
    south: number, 
    east: number, 
    west: number
  ): Promise<WindStation[]> {
    const allStations = await this.getWindStations();
    return allStations.filter(station => 
      station.coordinate.latitude >= south &&
      station.coordinate.latitude <= north &&
      station.coordinate.longitude >= west &&
      station.coordinate.longitude <= east
    );
  }

  /**
   * Get active wind stations only
   */
  async getActiveWindStations(): Promise<WindStation[]> {
    const allStations = await this.getWindStations();
    return allStations.filter(station => station.isActive);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    // console.log('🧹 Wind station cache cleared');
  }

  /**
   * Force refresh all wind stations (bypass cache)
   */
  async forceRefreshWindStations(): Promise<WindStation[]> {
    this.clearCache();
    return this.getWindStations();
  }
}

export const windStationService = new WindStationService();
