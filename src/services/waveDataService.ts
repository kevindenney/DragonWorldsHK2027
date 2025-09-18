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

// Water area boundaries for Hong Kong - Enhanced and more accurate marine areas
const WATER_AREAS = [
  // Clearwater Bay - PRIMARY for wave monitoring (most exposed to open sea)
  {
    name: 'Clearwater Bay',
    bounds: {
      north: 22.285,
      south: 22.245,
      east: 114.315,
      west: 114.275
    }
  },
  // Victoria Harbour - Expanded to cover more harbor area
  {
    name: 'Victoria Harbour',
    bounds: {
      north: 22.295,
      south: 22.270,
      east: 114.190,
      west: 114.150
    }
  },
  // Nine Pins Racing Area - Important racing water boundaries
  {
    name: 'Nine Pins Racing Area',
    bounds: {
      north: 22.275,
      south: 22.250,
      east: 114.335,
      west: 114.315
    }
  },
  // Eastern Waters - New broader area for better wave exposure
  {
    name: 'Eastern Waters',
    bounds: {
      north: 22.330,
      south: 22.170,
      east: 114.250,
      west: 114.200
    }
  },
  // Southern Waters - Expanded coverage for open water waves
  {
    name: 'Southern Waters',
    bounds: {
      north: 22.250,
      south: 22.170,
      east: 114.230,
      west: 114.170
    }
  },
  // Repulse Bay - Slightly expanded for better wave monitoring
  {
    name: 'Repulse Bay',
    bounds: {
      north: 22.245,
      south: 22.220,
      east: 114.215,
      west: 114.190
    }
  },
  // Stanley Bay - Extended to cover more open water
  {
    name: 'Stanley Bay',
    bounds: {
      north: 22.230,
      south: 22.200,
      east: 114.230,
      west: 114.200
    }
  },
  // Aberdeen Harbour - Expanded for harbor wave monitoring
  {
    name: 'Aberdeen Harbour',
    bounds: {
      north: 22.260,
      south: 22.235,
      east: 114.170,
      west: 114.145
    }
  },
  // Western Waters - New area for western wave coverage
  {
    name: 'Western Waters',
    bounds: {
      north: 22.295,
      south: 22.270,
      east: 114.155,
      west: 114.130
    }
  }
];

// Predefined wave station locations over water - verified marine coordinates
const WAVE_STATION_LOCATIONS: LocationCoordinate[] = [
  // Clearwater Bay marine area - PRIMARY for wave monitoring (more exposed to open sea)
  { latitude: 22.275, longitude: 114.295 }, // Clearwater Bay outer waters (PRIMARY - best wave exposure)
  { latitude: 22.268, longitude: 114.305 }, // Sai Kung outer waters
  { latitude: 22.250, longitude: 114.310 }, // Eastern Clearwater Bay

  // Nine Pins Racing Area - secondary for racing data
  { latitude: NINE_PINS_RACING_STATION.latitude, longitude: NINE_PINS_RACING_STATION.longitude },

  // Victoria Harbour marine stations - corrected to deep water areas
  { latitude: 22.285, longitude: 114.175 }, // Central Harbour deep water
  { latitude: 22.280, longitude: 114.185 }, // East Victoria Harbour
  { latitude: 22.290, longitude: 114.170 }, // West Victoria Harbour channel

  // Outer Hong Kong waters - better for wave measurement
  { latitude: 22.200, longitude: 114.180 }, // South Hong Kong waters (good wave exposure)
  { latitude: 22.180, longitude: 114.200 }, // Southeast waters
  { latitude: 22.320, longitude: 114.220 }, // Eastern waters near Lei Yue Mun

  // Repulse Bay marine stations - verified water coordinates
  { latitude: 22.235, longitude: 114.200 }, // Repulse Bay center (deep water)
  { latitude: 22.225, longitude: 114.210 }, // Repulse Bay outer area

  // Stanley marine stations - open water areas
  { latitude: 22.215, longitude: 114.215 }, // Stanley Bay outer waters
  { latitude: 22.205, longitude: 114.225 }, // Stanley southeast waters

  // Aberdeen outer marine stations - harbor approaches
  { latitude: 22.248, longitude: 114.158 }, // Aberdeen Harbour entrance
  { latitude: 22.240, longitude: 114.165 }, // Aberdeen outer waters
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
