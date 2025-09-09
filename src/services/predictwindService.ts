import { errorHandler, handleAPIError } from './errorHandler';
import { deploymentConfig, isProduction } from '../config/deploymentConfig';

// PredictWind API types based on professional sailing requirements
export interface PredictWindCurrentConditions {
  windSpeed: number; // knots
  windDirection: number; // degrees
  windDirectionText: string; // e.g., "NE"
  gustSpeed: number; // knots
  temperature: number; // celsius
  humidity: number; // percentage
  pressure: number; // hPa
  visibility: number; // nautical miles
  conditions: string; // e.g., "Partly Cloudy"
  feelsLike: number; // celsius
  dewPoint: number; // celsius
  confidence: 'high' | 'medium' | 'low';
  modelConsensus: number; // how many models agree (0-3)
  lastUpdated: string; // ISO timestamp
}

export interface PredictWindProfessionalAnalysis {
  windShear: {
    direction: number; // degrees of backing/veering
    altitude: number; // feet
    description: string; // e.g., "Backing 10° at 500ft"
  };
  pressureGradient: {
    value: number; // mb/100km
    direction: string; // direction of gradient
  };
  windShiftPrediction: {
    timeMinutes: number; // minutes until next shift
    direction: number; // degrees of shift
    confidence: 'high' | 'medium' | 'low';
  };
  racingAnalysis: {
    favors: 'left' | 'right' | 'neutral'; // which side of course
    tacticalWindow: string; // time window for tactical advantage
    optimalAngles: {
      upwind: number;
      downwind: number;
    };
  };
  laylineCalculations: {
    port: number;
    starboard: number;
  };
}

export interface PredictWindWaveAnalysis {
  waveHeight: number; // meters
  wavePeriod: number; // seconds
  waveDirection: number; // degrees
  waveDirectionText: string;
  seaState: 'calm' | 'slight' | 'moderate' | 'rough' | 'very-rough';
  currentSpeed: number; // knots
  currentDirection: number; // degrees
  currentDirectionText: string;
  tideStatus: 'rising' | 'falling' | 'high' | 'low';
  nextTideTime: string; // ISO timestamp
  waveCurrentInteraction: 'slight' | 'moderate' | 'significant';
  racingImpact: {
    optimalAngles: string;
    tacticalAdvantage: string;
  };
}

export interface PredictWindHourlyForecast {
  time: string; // ISO timestamp
  windSpeed: number;
  windDirection: number;
  windDirectionText: string;
  gustSpeed: number;
  temperature: number;
  conditions: string;
  raceQuality: 'excellent' | 'good' | 'fair' | 'poor';
  raceQualityScore: number; // 0-100
  tacticalNotes?: string;
}

export interface PredictWindRacingForecast {
  optimal6HourWindow: {
    startTime: string;
    endTime: string;
    averageWindSpeed: number;
    consistency: 'very-stable' | 'stable' | 'variable' | 'unstable';
    raceQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  hourlyData: PredictWindHourlyForecast[];
  extendedForecast: Array<{
    date: string;
    conditions: string;
    windRange: [number, number]; // min, max
    raceability: 'excellent' | 'good' | 'challenging' | 'questionable';
  }>;
}

export interface PredictWindSubscriptionStatus {
  hasAccess: boolean;
  accessLevel: 'free' | 'basic' | 'professional' | 'elite';
  isParticipantAccess: boolean; // Free during championship
  expiryDate?: string;
  features: {
    hourlyForecast: boolean;
    professionalAnalysis: boolean;
    racingAnalysis: boolean;
    windShiftPrediction: boolean;
    currentAnalysis: boolean;
    historicalData: boolean;
    multipleModels: boolean;
    customAlerts: boolean;
  };
}

export interface PredictWindLocationData {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isRacingArea: boolean;
  weatherStationDistance: number; // km to nearest station
  dataQuality: 'high' | 'medium' | 'low';
}

// Location constants for Hong Kong racing areas
export const HK_RACING_LOCATIONS: Record<string, PredictWindLocationData> = {
  'racing-area': {
    name: 'Racing Area',
    latitude: 22.257832,
    longitude: 114.307768,
    timezone: 'Asia/Hong_Kong',
    isRacingArea: true,
    weatherStationDistance: 2.3,
    dataQuality: 'high'
  },
  'rhkyc': {
    name: 'Royal Hong Kong Yacht Club',
    latitude: 22.287,
    longitude: 114.194,
    timezone: 'Asia/Hong_Kong',
    isRacingArea: false,
    weatherStationDistance: 1.1,
    dataQuality: 'high'
  },
  'clearwater-bay': {
    name: 'Clearwater Bay',
    latitude: 22.306,
    longitude: 114.312,
    timezone: 'Asia/Hong_Kong',
    isRacingArea: false,
    weatherStationDistance: 3.8,
    dataQuality: 'medium'
  }
};

class PredictWindService {
  private apiKey: string;
  private baseUrl: string;
  private subscriptionStatus: PredictWindSubscriptionStatus | null = null;

  constructor() {
    this.apiKey = this.getApiKey();
    this.baseUrl = deploymentConfig.weatherApiUrl || 'https://api.predictwind.com/forecast';
  }

  private getApiKey(): string {
    // In production, this would come from secure environment variables
    return isProduction() 
      ? process.env.PREDICTWIND_API_KEY || 'prod_key_here'
      : 'dev_predictwind_key_12345';
  }

  // Check subscription status and access level
  async getSubscriptionStatus(): Promise<PredictWindSubscriptionStatus> {
    if (this.subscriptionStatus) {
      return this.subscriptionStatus;
    }

    try {
      // For championship participants, provide free professional access
      const isChampionshipActive = this.isChampionshipPeriod();
      
      if (isChampionshipActive) {
        this.subscriptionStatus = {
          hasAccess: true,
          accessLevel: 'professional',
          isParticipantAccess: true,
          expiryDate: '2027-11-29T23:59:59Z',
          features: {
            hourlyForecast: true,
            professionalAnalysis: true,
            racingAnalysis: true,
            windShiftPrediction: true,
            currentAnalysis: true,
            historicalData: false,
            multipleModels: true,
            customAlerts: true
          }
        };
      } else {
        // Post-championship: subscription required
        this.subscriptionStatus = {
          hasAccess: false,
          accessLevel: 'free',
          isParticipantAccess: false,
          features: {
            hourlyForecast: false,
            professionalAnalysis: false,
            racingAnalysis: false,
            windShiftPrediction: false,
            currentAnalysis: false,
            historicalData: false,
            multipleModels: false,
            customAlerts: false
          }
        };
      }

      return this.subscriptionStatus;
    } catch (error) {
      handleAPIError(error, 'predictwindService.getSubscriptionStatus');
      throw error;
    }
  }

  private isChampionshipPeriod(): boolean {
    const now = new Date();
    const championshipStart = new Date('2027-11-15'); // Championship period start
    const championshipEnd = new Date('2027-11-29');   // Championship period end
    
    return now >= championshipStart && now <= championshipEnd;
  }

  // Get current weather conditions
  async getCurrentConditions(locationId: string = 'racing-area'): Promise<PredictWindCurrentConditions> {
    const location = HK_RACING_LOCATIONS[locationId];
    if (!location) {
      throw new Error(`Invalid location ID: ${locationId}`);
    }

    try {
      const subscriptionStatus = await this.getSubscriptionStatus();
      
      // Simulate API call with mock data based on subscription level
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockConditions: PredictWindCurrentConditions = {
        windSpeed: 15,
        windDirection: 45,
        windDirectionText: 'NE',
        gustSpeed: 18,
        temperature: 22,
        humidity: 68,
        pressure: 1015,
        visibility: 8,
        conditions: 'Partly Cloudy',
        feelsLike: 24,
        dewPoint: 16,
        confidence: subscriptionStatus.hasAccess ? 'high' : 'medium',
        modelConsensus: subscriptionStatus.hasAccess ? 3 : 1,
        lastUpdated: new Date().toISOString()
      };

      return mockConditions;
    } catch (error) {
      handleAPIError(error, 'predictwindService.getCurrentConditions');
      throw error;
    }
  }

  // Get professional wind analysis (premium feature)
  async getProfessionalAnalysis(locationId: string = 'racing-area'): Promise<PredictWindProfessionalAnalysis> {
    const subscriptionStatus = await this.getSubscriptionStatus();
    
    if (!subscriptionStatus.features.professionalAnalysis) {
      throw new Error('Professional analysis requires subscription');
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockAnalysis: PredictWindProfessionalAnalysis = {
        windShear: {
          direction: 10,
          altitude: 500,
          description: 'Backing 10° at 500ft'
        },
        pressureGradient: {
          value: 2.1,
          direction: 'northeast'
        },
        windShiftPrediction: {
          timeMinutes: 45,
          direction: 15,
          confidence: 'high'
        },
        racingAnalysis: {
          favors: 'right',
          tacticalWindow: 'Next 45 minutes',
          optimalAngles: {
            upwind: 120,
            downwind: 140
          }
        },
        laylineCalculations: {
          port: 110,
          starboard: 130
        }
      };

      return mockAnalysis;
    } catch (error) {
      handleAPIError(error, 'predictwindService.getProfessionalAnalysis');
      throw error;
    }
  }

  // Get wave and current analysis
  async getWaveAnalysis(locationId: string = 'racing-area'): Promise<PredictWindWaveAnalysis> {
    const subscriptionStatus = await this.getSubscriptionStatus();
    
    if (!subscriptionStatus.features.currentAnalysis) {
      throw new Error('Wave analysis requires subscription');
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 900));
      
      const mockWaveData: PredictWindWaveAnalysis = {
        waveHeight: 0.8,
        wavePeriod: 4,
        waveDirection: 45,
        waveDirectionText: 'NE',
        seaState: 'slight',
        currentSpeed: 0.7,
        currentDirection: 225,
        currentDirectionText: 'SW',
        tideStatus: 'rising',
        nextTideTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        waveCurrentInteraction: 'slight',
        racingImpact: {
          optimalAngles: '110°-130°',
          tacticalAdvantage: 'Port tack advantage in current'
        }
      };

      return mockWaveData;
    } catch (error) {
      handleAPIError(error, 'predictwindService.getWaveAnalysis');
      throw error;
    }
  }

  // Get racing-specific forecast
  async getRacingForecast(locationId: string = 'racing-area'): Promise<PredictWindRacingForecast> {
    const subscriptionStatus = await this.getSubscriptionStatus();
    
    if (!subscriptionStatus.features.racingAnalysis) {
      throw new Error('Racing analysis requires subscription');
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const now = new Date();
      const hourlyData: PredictWindHourlyForecast[] = [];
      
      for (let i = 0; i < 12; i++) {
        const time = new Date(now.getTime() + i * 60 * 60 * 1000);
        hourlyData.push({
          time: time.toISOString(),
          windSpeed: 15 + Math.sin(i * 0.5) * 3, // Realistic wind variation
          windDirection: 45 + Math.sin(i * 0.3) * 15,
          windDirectionText: this.degreeToCompass(45 + Math.sin(i * 0.3) * 15),
          gustSpeed: 18 + Math.sin(i * 0.7) * 4,
          temperature: 22 - (i * 0.3),
          conditions: i < 6 ? 'Partly Cloudy' : i < 9 ? 'Cloudy' : 'Clear',
          raceQuality: this.calculateRaceQuality(15 + Math.sin(i * 0.5) * 3),
          raceQualityScore: Math.round(85 - Math.abs(Math.sin(i * 0.4)) * 20),
          tacticalNotes: i === 3 ? 'Expected wind shift window' : undefined
        });
      }

      const mockForecast: PredictWindRacingForecast = {
        optimal6HourWindow: {
          startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
          averageWindSpeed: 16,
          consistency: 'stable',
          raceQuality: 'excellent'
        },
        hourlyData,
        extendedForecast: [
          { date: 'Tomorrow', conditions: 'Partly Cloudy', windRange: [12, 18], raceability: 'excellent' },
          { date: 'Day 2', conditions: 'Sunny', windRange: [10, 16], raceability: 'good' },
          { date: 'Day 3', conditions: 'Cloudy', windRange: [18, 25], raceability: 'challenging' }
        ]
      };

      return mockForecast;
    } catch (error) {
      handleAPIError(error, 'predictwindService.getRacingForecast');
      throw error;
    }
  }

  // Get basic weather for free tier
  async getBasicWeather(locationId: string = 'racing-area'): Promise<Partial<PredictWindCurrentConditions>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const basicWeather = {
        windSpeed: 15,
        windDirection: 45,
        windDirectionText: 'NE',
        temperature: 22,
        conditions: 'Partly Cloudy',
        lastUpdated: new Date().toISOString(),
        confidence: 'medium' as const,
        modelConsensus: 1
      };

      return basicWeather;
    } catch (error) {
      handleAPIError(error, 'predictwindService.getBasicWeather');
      throw error;
    }
  }

  // Set up weather alerts for specific conditions
  async setupWeatherAlert(conditions: {
    windSpeedThreshold: number;
    waveHeightThreshold: number;
    locations: string[];
  }): Promise<{ alertId: string; status: 'active' | 'pending' }> {
    const subscriptionStatus = await this.getSubscriptionStatus();
    
    if (!subscriptionStatus.features.customAlerts) {
      throw new Error('Custom alerts require subscription');
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        alertId: `alert_${Date.now()}`,
        status: 'active'
      };
    } catch (error) {
      handleAPIError(error, 'predictwindService.setupWeatherAlert');
      throw error;
    }
  }

  // Utility methods
  private degreeToCompass(degree: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
  }

  private calculateRaceQuality(windSpeed: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (windSpeed >= 10 && windSpeed <= 20) return 'excellent';
    if (windSpeed >= 8 && windSpeed <= 25) return 'good';
    if (windSpeed >= 5 && windSpeed <= 30) return 'fair';
    return 'poor';
  }

  // Invalidate cached subscription status (for testing)
  invalidateSubscriptionCache(): void {
    this.subscriptionStatus = null;
  }
}

// Export singleton instance
export const predictWindService = new PredictWindService();

// Utility functions for weather data formatting
export const formatWindSpeed = (knots: number, unit: 'knots' | 'mph' | 'kph' | 'mps' = 'knots'): string => {
  switch (unit) {
    case 'mph':
      return `${Math.round(knots * 1.151)} mph`;
    case 'kph':
      return `${Math.round(knots * 1.852)} kph`;
    case 'mps':
      return `${Math.round(knots * 0.514)} m/s`;
    default:
      return `${Math.round(knots)} kts`;
  }
};

export const formatTemperature = (celsius: number, unit: 'celsius' | 'fahrenheit' = 'celsius'): string => {
  if (unit === 'fahrenheit') {
    return `${Math.round(celsius * 9/5 + 32)}°F`;
  }
  return `${Math.round(celsius)}°C`;
};

export const getRaceQualityColor = (quality: string): string => {
  switch (quality) {
    case 'excellent': return '#22c55e'; // green
    case 'good': return '#3b82f6'; // blue
    case 'fair': return '#f59e0b'; // amber
    case 'poor': return '#ef4444'; // red
    default: return '#6b7280'; // gray
  }
};

export default predictWindService;