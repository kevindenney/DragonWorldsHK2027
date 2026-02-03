/**
 * Location Weather Service
 * 
 * Provides location-specific weather data for predefined sailing locations.
 * Each location has its own weather stations and data points.
 */

import { WeatherCondition, MarineCondition } from '../stores/weatherStore';
import { LocationData } from '../components/weather/LocationPickerModal';
import { WindStation } from './windStationService';
import { WaveStation } from './waveDataService';
import { TideStation } from './tideDataService';

export interface LocationWeatherData {
  location: LocationData;
  weather: WeatherCondition;
  marine: MarineCondition;
  windStations: WindStation[];
  waveStations: WaveStation[];
  tideStations: TideStation[];
  lastUpdated: string;
}

// Predefined sailing locations with their weather characteristics
const SAILING_LOCATIONS: LocationData[] = [
  {
    id: 'hung-hom',
    name: 'Hung Hom',
    coordinate: { latitude: 22.176863619628413, longitude: 114.16033681486007 },
    type: 'harbor',
    description: 'Hung Hom waters',
    country: 'Hong Kong'
  },
  {
    id: 'middle-island',
    name: 'Middle Island',
    coordinate: { latitude: 22.232366382833174, longitude: 114.17859939894664 },
    type: 'harbor',
    description: 'Waters near Middle Island',
    country: 'Hong Kong'
  },
  {
    id: 'victoria-harbor',
    name: 'Victoria Harbor',
    coordinate: { latitude: 22.303612873304136, longitude: 114.20317897832376 },
    type: 'harbor',
    description: 'Hong Kong\'s iconic harbor',
    country: 'Hong Kong'
  },
  {
    id: 'shelter-cove',
    name: 'Shelter Cove',
    coordinate: { latitude: 22.340971816349295, longitude: 114.28637430456698 },
    type: 'harbor',
    description: 'Shelter Cove waters',
    country: 'Hong Kong'
  },
  {
    id: 'clearwater-bay-race-area',
    name: 'Clearwater Bay Race Area',
    coordinate: { latitude: 22.255796757885822, longitude: 114.32596534115692 },
    type: 'race-area',
    description: 'Dragon Worlds 2027 center of race area',
    country: 'Hong Kong',
    region: 'South China Sea'
  }
];

class LocationWeatherService {
  private locationDataCache = new Map<string, LocationWeatherData>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  /**
   * Get weather data for a specific location
   */
  async getLocationWeatherData(locationId: string): Promise<LocationWeatherData | null> {
    const location = SAILING_LOCATIONS.find(loc => loc.id === locationId);
    if (!location) {
      return null;
    }

    // Check cache
    const cached = this.locationDataCache.get(locationId);
    if (cached && Date.now() - new Date(cached.lastUpdated).getTime() < this.cacheExpiry) {
      return cached;
    }

    // Generate fresh data
    const weatherData = await this.generateLocationWeatherData(location);
    this.locationDataCache.set(locationId, weatherData);
    
    return weatherData;
  }

  /**
   * Get all available sailing locations
   */
  getSailingLocations(): LocationData[] {
    return SAILING_LOCATIONS;
  }

  /**
   * Generate weather data for a specific location
   */
  private async generateLocationWeatherData(location: LocationData): Promise<LocationWeatherData> {
    const { coordinate } = location;
    
    
    // Generate base weather conditions based on location characteristics
    const weather = this.generateWeatherConditions(location);
    const marine = this.generateMarineConditions(location, weather.windSpeed);
    
    // Generate stations for this location
    const windStations = this.generateWindStations(location);
    const waveStations = this.generateWaveStations(location);
    const tideStations = this.generateTideStations(location);


    return {
      location,
      weather,
      marine,
      windStations,
      waveStations,
      tideStations,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate weather conditions based on location type and characteristics
   */
  private generateWeatherConditions(location: LocationData): WeatherCondition {
    const baseTemp = 28; // Base temperature for Hong Kong
    const now = new Date();
    const hour = now.getHours();
    
    // Location-specific variations
    let tempVariation = 0;
    let windVariation = 0;
    let humidityVariation = 0;
    
    switch (location.type) {
      case 'race-area':
        // Open water - more consistent conditions
        tempVariation = -1; // Slightly cooler over water
        windVariation = 2; // Stronger winds
        humidityVariation = 5; // Higher humidity
        break;
      case 'marina':
        // Protected marina - calmer conditions
        tempVariation = 1; // Slightly warmer
        windVariation = -3; // Lighter winds
        humidityVariation = -5; // Lower humidity
        break;
      case 'harbor':
        // Urban harbor - mixed conditions
        tempVariation = 2; // Warmer due to urban heat
        windVariation = -1; // Slightly lighter winds
        humidityVariation = -3; // Lower humidity
        break;
      case 'bay':
        // Bay - moderate conditions
        tempVariation = 0;
        windVariation = 0;
        humidityVariation = 2;
        break;
    }

    // Time-based variations
    const timeVariation = Math.sin((hour - 6) * Math.PI / 12) * 2; // Daily cycle
    
    // Random variations
    const randomTemp = (Math.random() - 0.5) * 2;
    const randomWind = (Math.random() - 0.5) * 4;
    const randomHumidity = (Math.random() - 0.5) * 10;

    return {
      temperature: Math.round(baseTemp + tempVariation + timeVariation + randomTemp),
      conditions: this.getWeatherCondition(location.type, hour),
      humidity: Math.max(30, Math.min(95, 70 + humidityVariation + randomHumidity)),
      pressure: 1013 + (Math.random() - 0.5) * 20,
      visibility: location.type === 'race-area' ? 15 + Math.random() * 5 : 10 + Math.random() * 5,
      windSpeed: Math.max(0, 8 + windVariation + randomWind),
      windDirection: Math.random() * 360,
      uvIndex: Math.min(11, Math.max(0, 6 + Math.sin((hour - 6) * Math.PI / 12) * 4 + Math.random() * 2)),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate marine conditions based on weather and location
   */
  private generateMarineConditions(location: LocationData, windSpeed: number): MarineCondition {
    const baseWaveHeight = windSpeed * 0.15; // Wave height based on wind
    const baseTideHeight = 1.5 + Math.sin(Date.now() / (12 * 60 * 60 * 1000)) * 1.2; // Tidal cycle
    
    // Location-specific marine conditions
    let waveVariation = 0;
    let tideVariation = 0;
    let currentVariation = 0;
    
    switch (location.type) {
      case 'race-area':
        // Open water - larger waves, stronger currents
        waveVariation = 0.3;
        tideVariation = 0.2;
        currentVariation = 0.5;
        break;
      case 'marina':
        // Protected marina - smaller waves, weaker currents
        waveVariation = -0.5;
        tideVariation = -0.3;
        currentVariation = -0.3;
        break;
      case 'harbor':
        // Harbor - moderate conditions
        waveVariation = -0.2;
        tideVariation = 0;
        currentVariation = 0;
        break;
      case 'bay':
        // Bay - moderate to large waves
        waveVariation = 0.1;
        tideVariation = 0.1;
        currentVariation = 0.2;
        break;
    }

    return {
      waveHeight: Math.max(0.1, baseWaveHeight + waveVariation + (Math.random() - 0.5) * 0.3),
      wavePeriod: 6 + Math.random() * 4,
      waveDirection: Math.random() * 360,
      tideHeight: Math.max(0, baseTideHeight + tideVariation + (Math.random() - 0.5) * 0.2),
      tideTrend: Math.random() > 0.5 ? 'rising' : 'falling',
      current: {
        speed: Math.max(0, 0.5 + currentVariation + (Math.random() - 0.5) * 0.4),
        direction: Math.random() * 360
      },
      waterTemperature: 26 + (Math.random() - 0.5) * 2,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate wind stations for a location
   */
  private generateWindStations(location: LocationData): WindStation[] {
    const stations: WindStation[] = [];
    const { coordinate } = location;
    
    // Create 2-4 wind stations around the location
    const numStations = location.type === 'race-area' ? 4 : 2;
    
    for (let i = 0; i < numStations; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.01; // ~500m radius
      const offsetLon = (Math.random() - 0.5) * 0.01;
      
      stations.push({
        id: `wind-${location.id}-${i}`,
        name: `${location.name} Wind Station ${i + 1}`,
        coordinate: {
          latitude: coordinate.latitude + offsetLat,
          longitude: coordinate.longitude + offsetLon
        },
        type: 'marine',
        windSpeed: 8 + Math.random() * 8,
        windDirection: Math.random() * 360,
        windGust: 12 + Math.random() * 6,
        temperature: 26 + Math.random() * 4,
        pressure: 1010 + Math.random() * 20,
        humidity: 60 + Math.random() * 30,
        visibility: 10 + Math.random() * 10,
        lastUpdated: new Date().toISOString(),
        dataQuality: 'high',
        isActive: true,
        description: `Wind monitoring station for ${location.name}`
      });
    }
    
    return stations;
  }

  /**
   * Generate wave stations for a location
   */
  private generateWaveStations(location: LocationData): WaveStation[] {
    const stations: WaveStation[] = [];
    const { coordinate } = location;
    
    // Only create wave stations for water-based locations
    if (['race-area', 'bay', 'harbor'].includes(location.type)) {
      const numStations = location.type === 'race-area' ? 3 : 1;
      
      for (let i = 0; i < numStations; i++) {
        const offsetLat = (Math.random() - 0.5) * 0.008;
        const offsetLon = (Math.random() - 0.5) * 0.008;
        
        stations.push({
          id: `wave-${location.id}-${i}`,
          name: `${location.name} Wave Station ${i + 1}`,
          coordinate: {
            latitude: coordinate.latitude + offsetLat,
            longitude: coordinate.longitude + offsetLon
          },
          waveHeight: 0.5 + Math.random() * 2.5,
          wavePeriod: 6 + Math.random() * 6,
          waveDirection: Math.random() * 360,
          swellHeight: 0.3 + Math.random() * 1.5,
          swellPeriod: 8 + Math.random() * 8,
          swellDirection: Math.random() * 360,
          lastUpdated: new Date().toISOString(),
          dataQuality: 'high'
        });
      }
    }
    
    return stations;
  }

  /**
   * Generate tide stations for a location
   */
  private generateTideStations(location: LocationData): TideStation[] {
    const stations: TideStation[] = [];
    const { coordinate } = location;
    
    // Create 1-2 tide stations for water-based locations
    if (['race-area', 'bay', 'harbor', 'marina'].includes(location.type)) {
      const numStations = location.type === 'race-area' ? 2 : 1;
      
      for (let i = 0; i < numStations; i++) {
        const offsetLat = (Math.random() - 0.5) * 0.005;
        const offsetLon = (Math.random() - 0.5) * 0.005;
        
        stations.push({
          id: `tide-${location.id}-${i}`,
          name: `${location.name} Tide Station ${i + 1}`,
          coordinate: {
            latitude: coordinate.latitude + offsetLat,
            longitude: coordinate.longitude + offsetLon
          },
          currentHeight: 1.0 + Math.random() * 2.0,
          trend: Math.random() > 0.5 ? 'rising' : 'falling',
          nextHigh: this.calculateNextTide('high'),
          nextLow: this.calculateNextTide('low'),
          lastUpdated: new Date().toISOString(),
          dataQuality: 'high'
        });
      }
    }
    
    return stations;
  }

  /**
   * Get weather condition based on location type and time
   */
  private getWeatherCondition(locationType: string, hour: number): string {
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Overcast'];
    
    // Race areas tend to have clearer conditions
    if (locationType === 'race-area') {
      return conditions[Math.random() < 0.6 ? 0 : 1];
    }
    
    // Urban areas have more varied conditions
    if (locationType === 'harbor') {
      return conditions[Math.floor(Math.random() * conditions.length)];
    }
    
    // Default to clear/partly cloudy
    return conditions[Math.random() < 0.7 ? 0 : 1];
  }

  /**
   * Calculate next tide time
   */
  private calculateNextTide(type: 'high' | 'low'): string {
    const now = new Date();
    const nextTide = new Date(now.getTime() + (6 + Math.random() * 6) * 60 * 60 * 1000);
    return nextTide.toISOString();
  }
}

// Export singleton instance
export const locationWeatherService = new LocationWeatherService();
