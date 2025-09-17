import { WeatherAPI } from './weatherAPI';
import { LocationCoordinate } from '../stores/weatherStore';
import { NINE_PINS_RACING_STATION } from '../constants/raceCoordinates';

// Wave station interface
export interface WaveStation {
  id: string;
  name: string;
  coordinate: LocationCoordinate;
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  swellHeight: number;
  swellPeriod: number;
  swellDirection: number;
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
}

// Water area boundaries for Hong Kong
const WATER_AREAS = [
  // Nine Pins Racing Area - PRIMARY racing water area
  {
    name: 'Nine Pins Racing Area',
    bounds: {
      north: 22.280,
      south: 22.240,
      east: 114.340,
      west: 114.300
    }
  },
  // Victoria Harbour
  {
    name: 'Victoria Harbour',
    bounds: {
      north: 22.300,
      south: 22.260,
      east: 114.200,
      west: 114.140
    }
  },
  // Clearwater Bay
  {
    name: 'Clearwater Bay',
    bounds: {
      north: 22.320,
      south: 22.240,
      east: 114.320,
      west: 114.260
    }
  },
  // Repulse Bay
  {
    name: 'Repulse Bay',
    bounds: {
      north: 22.250,
      south: 22.220,
      east: 114.210,
      west: 114.180
    }
  },
  // Stanley Bay
  {
    name: 'Stanley Bay',
    bounds: {
      north: 22.230,
      south: 22.200,
      east: 114.220,
      west: 114.190
    }
  },
  // Aberdeen Harbour
  {
    name: 'Aberdeen Harbour',
    bounds: {
      north: 22.260,
      south: 22.240,
      east: 114.160,
      west: 114.140
    }
  }
];

// Predefined wave station locations over water
const WAVE_STATION_LOCATIONS: LocationCoordinate[] = [
  // Nine Pins Racing Area - PRIMARY racing weather station
  { latitude: NINE_PINS_RACING_STATION.latitude, longitude: NINE_PINS_RACING_STATION.longitude },

  // Victoria Harbour stations
  { latitude: 22.285, longitude: 114.175 },
  { latitude: 22.275, longitude: 114.165 },
  { latitude: 22.270, longitude: 114.180 },

  // Clearwater Bay stations
  { latitude: 22.290, longitude: 114.290 },
  { latitude: 22.280, longitude: 114.300 },
  { latitude: 22.260, longitude: 114.285 },

  // Repulse Bay stations
  { latitude: 22.240, longitude: 114.195 },
  { latitude: 22.235, longitude: 114.200 },

  // Stanley Bay stations
  { latitude: 22.220, longitude: 114.210 },
  { latitude: 22.215, longitude: 114.205 },

  // Aberdeen Harbour stations
  { latitude: 22.250, longitude: 114.155 },
  { latitude: 22.245, longitude: 114.150 }
];

class WaveDataService {
  private weatherAPI: WeatherAPI;
  private waveStations: Map<string, WaveStation> = new Map();
  private lastUpdate: Date | null = null;
  private updateInterval: number = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.weatherAPI = new WeatherAPI();
  }

  /**
   * Check if coordinates are over water using predefined water areas
   */
  private isOverWater(lat: number, lon: number): boolean {
    return WATER_AREAS.some(area => 
      lat >= area.bounds.south && 
      lat <= area.bounds.north && 
      lon >= area.bounds.west && 
      lon <= area.bounds.east
    );
  }

  /**
   * Get water area name for coordinates
   */
  private getWaterAreaName(lat: number, lon: number): string {
    const area = WATER_AREAS.find(area => 
      lat >= area.bounds.south && 
      lat <= area.bounds.north && 
      lon >= area.bounds.west && 
      lon <= area.bounds.east
    );
    return area?.name || 'Unknown Water Area';
  }

  /**
   * Fetch wave data for a specific location
   */
  private async fetchWaveDataForLocation(coordinate: LocationCoordinate): Promise<WaveStation | null> {
    try {
      console.log(`Fetching wave data for ${coordinate.latitude}, ${coordinate.longitude}`);
      const marineData = await this.weatherAPI.getOpenMeteoMarineData(coordinate.latitude, coordinate.longitude);
      
      if (!marineData?.data?.wave?.length) {
        console.warn(`No wave data available for ${coordinate.latitude}, ${coordinate.longitude}`);
        return null;
      }

      const currentWave = marineData.data.wave[0]; // Get current wave data
      const waterArea = this.getWaterAreaName(coordinate.latitude, coordinate.longitude);
      
      const station: WaveStation = {
        id: `wave-${coordinate.latitude.toFixed(3)}-${coordinate.longitude.toFixed(3)}`,
        name: `${waterArea} Station`,
        coordinate,
        waveHeight: currentWave.waveHeight,
        wavePeriod: currentWave.wavePeriod,
        waveDirection: currentWave.waveDirection,
        swellHeight: currentWave.swellHeight,
        swellPeriod: currentWave.swellPeriod,
        swellDirection: currentWave.swellDirection,
        lastUpdated: new Date().toISOString(),
        dataQuality: 'high'
      };

      console.log(`Successfully fetched real wave data for ${waterArea}:`, station);
      return station;
    } catch (error) {
      console.error(`Failed to fetch wave data for ${coordinate.latitude}, ${coordinate.longitude}:`, error);
      return null;
    }
  }

  /**
   * Get all wave stations with real data
   */
  async getWaveStations(): Promise<WaveStation[]> {
    const now = new Date();
    
    // Return cached data if recent
    if (this.lastUpdate && (now.getTime() - this.lastUpdate.getTime()) < this.updateInterval) {
      return Array.from(this.waveStations.values());
    }

    // Fetch fresh data for all water-based locations
    const stations: WaveStation[] = [];
    const validLocations = WAVE_STATION_LOCATIONS.filter(loc => this.isOverWater(loc.latitude, loc.longitude));

    // Fetch data for all valid locations in parallel
    const waveDataPromises = validLocations.map(location => 
      this.fetchWaveDataForLocation(location)
    );

    const results = await Promise.allSettled(waveDataPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const station = result.value;
        this.waveStations.set(station.id, station);
        stations.push(station);
      } else {
        // Create fallback station with simulated data
        const location = validLocations[index];
        const waterArea = this.getWaterAreaName(location.latitude, location.longitude);
        
        const fallbackStation: WaveStation = {
          id: `wave-${location.latitude.toFixed(3)}-${location.longitude.toFixed(3)}`,
          name: `${waterArea} Station (Simulated)`,
          coordinate: location,
          waveHeight: 1.0 + Math.random() * 1.5, // 1.0-2.5m
          wavePeriod: 6 + Math.random() * 4, // 6-10s
          waveDirection: Math.random() * 360,
          swellHeight: 0.5 + Math.random() * 1.0, // 0.5-1.5m
          swellPeriod: 8 + Math.random() * 6, // 8-14s
          swellDirection: Math.random() * 360,
          lastUpdated: new Date().toISOString(),
          dataQuality: 'low'
        };
        
        this.waveStations.set(fallbackStation.id, fallbackStation);
        stations.push(fallbackStation);
      }
    });

    this.lastUpdate = now;
    return stations;
  }

  /**
   * Get wave stations for a specific water area
   */
  async getWaveStationsForArea(areaName: string): Promise<WaveStation[]> {
    const allStations = await this.getWaveStations();
    return allStations.filter(station => 
      station.name.includes(areaName)
    );
  }

  /**
   * Get wave data for a specific coordinate (if over water)
   */
  async getWaveDataForCoordinate(coordinate: LocationCoordinate): Promise<WaveStation | null> {
    if (!this.isOverWater(coordinate.latitude, coordinate.longitude)) {
      return null;
    }

    return await this.fetchWaveDataForLocation(coordinate);
  }

  /**
   * Validate if coordinates are over water
   */
  validateWaterLocation(coordinate: LocationCoordinate): boolean {
    return this.isOverWater(coordinate.latitude, coordinate.longitude);
  }

  /**
   * Get all water areas
   */
  getWaterAreas() {
    return WATER_AREAS;
  }

  /**
   * Force refresh of all wave data
   */
  async refreshWaveData(): Promise<WaveStation[]> {
    this.lastUpdate = null;
    return await this.getWaveStations();
  }
}

// Export singleton instance
export const waveDataService = new WaveDataService();
export default waveDataService;
