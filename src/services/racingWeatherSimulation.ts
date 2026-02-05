/**
 * Racing Weather Simulation Service
 * 
 * Living Document Implementation:
 * Provides realistic weather simulation for Hong Kong racing waters to demonstrate
 * the racing weather map functionality. Uses actual meteorological patterns and
 * seasonal variations typical of the South China Sea.
 * 
 * Features:
 * - Realistic wind patterns with thermal effects
 * - Tidal simulation based on Hong Kong Observatory data
 * - Sea breeze and land breeze cycles
 * - Monsoon influence and weather systems
 * - Spatial variation across the racing area
 */

import { WeatherCondition, MarineCondition } from '../stores/weatherStore';
import type { WeatherDataPoint } from '../components/weather/WeatherMapLayer';
import { NINEPINS_RACE_COURSE_CENTER, CLEARWATER_BAY_MARINA as CLEARWATER_BAY_COORDS } from '../constants/raceCoordinates';

// Hong Kong Racing Area Constants
const RACING_AREA_CENTER = NINEPINS_RACE_COURSE_CENTER;

const CLEARWATER_BAY_MARINA = CLEARWATER_BAY_COORDS;

/**
 * Weather Pattern Types for Hong Kong
 */
export interface HongKongWeatherPattern {
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  monsoon: 'northeast' | 'southwest' | 'transition';
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  seaBreeze: boolean;
  thermalEffect: number; // 0-1 scale
}

/**
 * Get Current Weather Pattern
 * Determines the meteorological context for simulation
 */
export const getCurrentWeatherPattern = (): HongKongWeatherPattern => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const hour = now.getHours();
  
  // Determine season (Hong Kong climate)
  let season: HongKongWeatherPattern['season'];
  if (month >= 12 || month <= 2) season = 'winter';
  else if (month >= 3 && month <= 5) season = 'spring';
  else if (month >= 6 && month <= 8) season = 'summer';
  else season = 'autumn';
  
  // Determine monsoon
  let monsoon: HongKongWeatherPattern['monsoon'];
  if (month >= 11 || month <= 3) monsoon = 'northeast';
  else if (month >= 5 && month <= 9) monsoon = 'southwest';
  else monsoon = 'transition';
  
  // Determine time of day
  let timeOfDay: HongKongWeatherPattern['timeOfDay'];
  if (hour >= 5 && hour < 8) timeOfDay = 'dawn';
  else if (hour >= 8 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 20) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  // Sea breeze typically develops in afternoon during warmer months
  const seaBreeze = (month >= 4 && month <= 10) && (hour >= 11 && hour <= 18);
  
  // Thermal effect strongest in afternoon
  const thermalEffect = timeOfDay === 'afternoon' ? 0.8 : 
                       timeOfDay === 'morning' ? 0.4 : 0.1;
  
  return { season, monsoon, timeOfDay, seaBreeze, thermalEffect };
};

/**
 * Generate Hong Kong Racing Weather Conditions
 * Creates realistic current conditions based on local patterns
 */
export const generateHongKongWeatherConditions = (): WeatherCondition => {
  const pattern = getCurrentWeatherPattern();
  
  // Base wind patterns by monsoon
  let baseWindSpeed: number;
  let baseWindDirection: number;
  
  switch (pattern.monsoon) {
    case 'northeast':
      // Winter monsoon: Strong, steady NE winds
      baseWindSpeed = 15 + Math.random() * 8; // 15-23 kts
      baseWindDirection = 45 + (Math.random() - 0.5) * 30; // NE ±15°
      break;
    case 'southwest':
      // Summer monsoon: Moderate SW winds with afternoon sea breeze
      baseWindSpeed = 8 + Math.random() * 10; // 8-18 kts
      baseWindDirection = 225 + (Math.random() - 0.5) * 40; // SW ±20°
      break;
    default:
      // Transition: Variable and lighter
      baseWindSpeed = 5 + Math.random() * 12; // 5-17 kts
      baseWindDirection = Math.random() * 360; // Variable
  }
  
  // Apply sea breeze effect
  if (pattern.seaBreeze) {
    // Sea breeze adds southerly component and increases speed
    baseWindDirection = (baseWindDirection + 180) * 0.3 + baseWindDirection * 0.7;
    baseWindSpeed += 3 + Math.random() * 4; // +3-7 kts boost
  }
  
  // Apply thermal effects
  baseWindSpeed *= (1 + pattern.thermalEffect * 0.3);
  
  // Temperature based on season and time
  let baseTemp: number;
  switch (pattern.season) {
    case 'winter': baseTemp = 18 + Math.random() * 8; break;  // 18-26°C
    case 'spring': baseTemp = 22 + Math.random() * 8; break;  // 22-30°C
    case 'summer': baseTemp = 27 + Math.random() * 6; break;  // 27-33°C
    case 'autumn': baseTemp = 24 + Math.random() * 7; break;  // 24-31°C
  }
  
  // Time of day temperature adjustment
  if (pattern.timeOfDay === 'dawn' || pattern.timeOfDay === 'night') {
    baseTemp -= 3 + Math.random() * 2;
  } else if (pattern.timeOfDay === 'afternoon') {
    baseTemp += 2 + Math.random() * 3;
  }
  
  return {
    temperature: Math.round(baseTemp * 10) / 10,
    windSpeed: Math.round(baseWindSpeed * 10) / 10,
    windDirection: Math.round(baseWindDirection) % 360,
    windGust: baseWindSpeed + 2 + Math.random() * 6,
    visibility: 8 + Math.random() * 7, // 8-15 km (typically good in HK)
    pressure: 1013 + (Math.random() - 0.5) * 20, // ±10 hPa variation
    humidity: 65 + Math.random() * 25, // 65-90% (high humidity in HK)
    conditions: getWeatherConditions(pattern)
  };
};

/**
 * Get Weather Conditions Description
 */
const getWeatherConditions = (pattern: HongKongWeatherPattern): string => {
  if (pattern.season === 'summer' && Math.random() < 0.3) {
    return 'Partly Cloudy - Thunderstorms Possible';
  } else if (pattern.season === 'winter' && Math.random() < 0.2) {
    return 'Hazy - Reduced Visibility';
  } else if (pattern.seaBreeze) {
    return 'Clear - Sea Breeze Active';
  } else {
    const conditions = ['Clear', 'Partly Cloudy', 'Mostly Sunny', 'Fair'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }
};

/**
 * Generate Hong Kong Marine Conditions
 * Creates realistic marine conditions for racing waters
 */
export const generateHongKongMarineConditions = (windSpeed: number): MarineCondition => {
  const pattern = getCurrentWeatherPattern();
  
  // Wave height based on wind speed and fetch (limited by nearby land)
  // Hong Kong waters are semi-enclosed, so waves are typically smaller
  const waveHeight = Math.min(2.0, windSpeed * 0.08 + Math.random() * 0.3);
  
  // Swell period - shorter in enclosed waters
  const swellPeriod = 3 + waveHeight * 1.5 + Math.random() * 2;
  
  // Swell direction - generally follows wind but with some persistence
  const swellDirection = (pattern.monsoon === 'northeast' ? 45 : 225) + 
                        (Math.random() - 0.5) * 40;
  
  // Tidal simulation for Hong Kong (semi-diurnal with ~2m range)
  const now = new Date();
  const hoursSinceHighTide = (now.getHours() + now.getMinutes() / 60) % 12.4;
  const tideHeight = Math.sin((hoursSinceHighTide / 12.4) * Math.PI * 2) * 1.2;
  
  // Next tide calculation
  const hoursToNextTide = hoursSinceHighTide > 6.2 ? 
    12.4 - hoursSinceHighTide : 6.2 - hoursSinceHighTide;
  const nextTideTime = new Date(now.getTime() + hoursToNextTide * 60 * 60 * 1000)
    .toISOString();
  
  // Tidal current in Hong Kong waters
  const currentSpeed = Math.abs(tideHeight) * 0.8 + Math.random() * 0.5; // 0-1.5 kts
  const currentDirection = tideHeight > 0 ? 
    90 + (Math.random() - 0.5) * 60 :  // Flood tide - generally eastward
    270 + (Math.random() - 0.5) * 60;  // Ebb tide - generally westward
  
  return {
    waveHeight: Math.round(waveHeight * 10) / 10,
    swellPeriod: Math.round(swellPeriod * 10) / 10,
    swellDirection: Math.round(swellDirection) % 360,
    tideHeight: Math.round(tideHeight * 10) / 10,
    tideTime: nextTideTime,
    tideType: tideHeight > 0 ? 'high' : 'low',
    current: {
      speed: Math.round(currentSpeed * 10) / 10,
      direction: Math.round(currentDirection) % 360
    }
  };
};

/**
 * Generate Spatial Weather Variation
 * Creates realistic spatial variation across the racing area
 */
export const generateSpatialWeatherData = (
  baseConditions: WeatherCondition,
  marinConditions: MarineCondition
): WeatherDataPoint[] => {
  const dataPoints: WeatherDataPoint[] = [];
  const gridSize = 8; // 8x8 grid for ~500m resolution
  const stepLat = 0.08 / gridSize;
  const stepLon = 0.08 / gridSize;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = RACING_AREA_CENTER.latitude - 0.04 + (i * stepLat);
      const lon = RACING_AREA_CENTER.longitude - 0.04 + (j * stepLon);
      
      // Distance from shore affects wind and wave patterns
      const distanceFromShore = Math.sqrt(
        Math.pow((lat - CLEARWATER_BAY_MARINA.latitude) * 111, 2) +
        Math.pow((lon - CLEARWATER_BAY_MARINA.longitude) * 111 * Math.cos(lat * Math.PI / 180), 2)
      );
      
      // Apply spatial variations
      const shoreEffect = Math.max(0, 1 - distanceFromShore / 8); // Stronger near shore
      const openWaterEffect = 1 - shoreEffect;
      
      // Wind variation: lighter near shore due to land interference
      const windSpeedVariation = -shoreEffect * 2 + (Math.random() - 0.5) * 3;
      const windDirectionVariation = shoreEffect * 15 + (Math.random() - 0.5) * 20;
      
      // Wave variation: smaller near shore, larger in open water
      const waveVariation = openWaterEffect * 0.3 + (Math.random() - 0.5) * 0.2;
      
      // Temperature variation: land influence
      const tempVariation = shoreEffect * 1.5 + (Math.random() - 0.5) * 1;
      
      // Tidal variation based on bathymetry (deeper water = less tidal effect)
      const tidalVariation = -openWaterEffect * 0.1 + (Math.random() - 0.5) * 0.1;
      
      dataPoints.push({
        coordinate: { latitude: lat, longitude: lon },
        windSpeed: Math.max(0, baseConditions.windSpeed + windSpeedVariation),
        windDirection: (baseConditions.windDirection + windDirectionVariation + 360) % 360,
        waveHeight: Math.max(0.1, marinConditions.waveHeight + waveVariation),
        tideHeight: marinConditions.tideHeight + tidalVariation,
        currentSpeed: marinConditions.current.speed + (Math.random() - 0.5) * 0.3,
        currentDirection: (marinConditions.current.direction + (Math.random() - 0.5) * 30 + 360) % 360,
        temperature: baseConditions.temperature + tempVariation,
        intensity: 0.3 + openWaterEffect * 0.4 + Math.random() * 0.3
      });
    }
  }
  
  return dataPoints;
};

/**
 * Racing Weather Simulation Service
 * Main service class for generating realistic racing weather data
 */
export class RacingWeatherSimulation {
  private lastUpdate: Date = new Date(0);
  private updateInterval: number = 5 * 60 * 1000; // 5 minutes
  
  private cachedConditions: WeatherCondition | null = null;
  private cachedMarine: MarineCondition | null = null;
  private cachedSpatialData: WeatherDataPoint[] = [];
  
  /**
   * Get Current Simulated Conditions
   */
  public getCurrentConditions(): { 
    weather: WeatherCondition; 
    marine: MarineCondition; 
    spatialData: WeatherDataPoint[] 
  } {
    const now = new Date();
    
    // Check if we need to update
    if (now.getTime() - this.lastUpdate.getTime() > this.updateInterval || !this.cachedConditions) {
      this.updateSimulation();
      this.lastUpdate = now;
    }
    
    return {
      weather: this.cachedConditions!,
      marine: this.cachedMarine!,
      spatialData: this.cachedSpatialData
    };
  }
  
  /**
   * Force Update Simulation
   */
  public forceUpdate(): void {
    this.updateSimulation();
    this.lastUpdate = new Date();
  }
  
  /**
   * Update Simulation Data
   */
  private updateSimulation(): void {
    this.cachedConditions = generateHongKongWeatherConditions();
    this.cachedMarine = generateHongKongMarineConditions(this.cachedConditions.windSpeed);
    this.cachedSpatialData = generateSpatialWeatherData(
      this.cachedConditions, 
      this.cachedMarine
    );
  }
  
  /**
   * Get Weather Pattern Info
   */
  public getWeatherPattern(): HongKongWeatherPattern {
    return getCurrentWeatherPattern();
  }
}

// Export singleton instance
export const racingWeatherSimulation = new RacingWeatherSimulation();

/**
 * Living Document Export Notes:
 * 
 * This service provides realistic weather simulation for the Dragon Worlds Hong Kong 2027
 * racing area, incorporating:
 * 
 * - Seasonal monsoon patterns (NE winter, SW summer)
 * - Diurnal thermal cycles and sea breeze effects
 * - Spatial variation due to topography and bathymetry
 * - Realistic tidal patterns for Hong Kong waters
 * - Marine conditions appropriate for semi-enclosed racing area
 * 
 * Future enhancements:
 * - Integration with actual Hong Kong Observatory API
 * - Historical weather pattern analysis
 * - Real-time weather buoy data integration
 * - Advanced mesoscale modeling for micro-climates
 */