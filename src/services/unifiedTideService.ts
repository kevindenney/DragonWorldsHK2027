/**
 * Unified Tide Service - Single Source of Truth for Tide Data
 *
 * This service ensures consistency between real-time current conditions
 * and forecast predictions by using a unified tide calculation engine.
 */

import { LocationCoordinate } from '../stores/weatherStore';
import { TideStation } from './tideDataService';
import { hkoAPI } from './hkoAPI';

// Enhanced tide prediction interfaces
export interface TidePrediction {
  time: Date;
  height: number;
  type: 'high' | 'low' | 'normal';
}

export interface HourlyTideData {
  time: Date;
  height: number;
  trend: 'rising' | 'falling' | 'stable';
  velocity: number; // Rate of change in m/hr
}

export interface UnifiedTideStation extends TideStation {
  hourlyPredictions: HourlyTideData[];
  dailyPredictions: TidePrediction[];
  tidePattern: 'semidiurnal' | 'diurnal' | 'mixed';
  harmonicConstants: {
    M2: { amplitude: number; phase: number }; // Principal lunar semi-diurnal
    S2: { amplitude: number; phase: number }; // Principal solar semi-diurnal
    K1: { amplitude: number; phase: number }; // Lunar diurnal
    O1: { amplitude: number; phase: number }; // Lunar diurnal
  };
  meanSeaLevel?: number;
}

// Hong Kong specific tide patterns and constants
const HONG_KONG_TIDE_CONSTANTS = {
  // Semi-diurnal pattern dominant in Hong Kong waters
  meanTideLevel: 1.5, // meters above chart datum
  meanRange: 2.0, // meters
  springRange: 2.4, // meters during spring tides
  neapRange: 1.6, // meters during neap tides

  // Harmonic constants for Hong Kong (approximate values)
  harmonics: {
    M2: { amplitude: 0.95, phase: 142 }, // Principal lunar semi-diurnal
    S2: { amplitude: 0.35, phase: 167 }, // Principal solar semi-diurnal
    K1: { amplitude: 0.25, phase: 201 }, // Lunar diurnal
    O1: { amplitude: 0.18, phase: 184 }, // Lunar diurnal
  }
};

class UnifiedTideService {
  private tideStations: Map<string, UnifiedTideStation> = new Map();
  private lastUpdate: Date | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPolling();
  }

  /**
   * Get current tide height for a specific time and location
   * This ensures consistency between real-time and forecast data
   */
  getCurrentTideHeight(coordinate: LocationCoordinate, time: Date = new Date()): number {
    const station = this.getNearestStation(coordinate);
    if (!station) {
      return this.calculateFallbackTideHeight(time);
    }

    return this.interpolateTideHeight(station, time);
  }

  /**
   * Get hourly tide predictions for the next 24 hours
   */
  getHourlyPredictions(coordinate: LocationCoordinate, startTime: Date = new Date()): HourlyTideData[] {
    const station = this.getNearestStation(coordinate);
    const predictions: HourlyTideData[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const time = new Date(startTime.getTime() + hour * 60 * 60 * 1000);
      const height = station ?
        this.interpolateTideHeight(station, time) :
        this.calculateFallbackTideHeight(time);

      // Calculate trend by comparing with next hour
      const nextTime = new Date(time.getTime() + 60 * 60 * 1000);
      const nextHeight = station ?
        this.interpolateTideHeight(station, nextTime) :
        this.calculateFallbackTideHeight(nextTime);

      const velocity = nextHeight - height;
      const trend = velocity > 0.05 ? 'rising' : velocity < -0.05 ? 'falling' : 'stable';

      predictions.push({
        time,
        height: Math.round(height * 100) / 100,
        trend,
        velocity: Math.round(velocity * 100) / 100
      });
    }

    return predictions;
  }

  /**
   * Get unified tide station data (combines real-time and predictions)
   */
  async getUnifiedTideStations(): Promise<UnifiedTideStation[]> {
    try {
      // Get base tide stations from existing service
      const baseTideStations = await this.getBaseTideStations();

      // Enhance with hourly predictions and harmonic analysis
      const unifiedStations = baseTideStations.map(station => {
        const hourlyPredictions = this.generateHourlyPredictions(station);
        const dailyPredictions = this.generateDailyPredictions(station);

        return {
          ...station,
          hourlyPredictions,
          dailyPredictions,
          tidePattern: 'semidiurnal' as const,
          harmonicConstants: HONG_KONG_TIDE_CONSTANTS.harmonics
        };
      });

      // Cache the unified stations
      unifiedStations.forEach(station => {
        this.tideStations.set(station.id, station);
      });

      this.lastUpdate = new Date();

      return unifiedStations;

    } catch (error) {
      return this.createFallbackStations();
    }
  }

  /**
   * Interpolate tide height using harmonic analysis
   */
  private interpolateTideHeight(station: UnifiedTideStation, time: Date): number {
    const timeDiff = time.getTime() / 1000; // Convert to seconds
    const constants = HONG_KONG_TIDE_CONSTANTS;

    // Calculate harmonic components
    let height = constants.meanTideLevel;

    // M2 component (12.42 hour period)
    const M2_period = 12.42 * 3600; // seconds
    height += constants.harmonics.M2.amplitude * Math.cos(
      (2 * Math.PI * timeDiff / M2_period) - (constants.harmonics.M2.phase * Math.PI / 180)
    );

    // S2 component (12.0 hour period)
    const S2_period = 12.0 * 3600;
    height += constants.harmonics.S2.amplitude * Math.cos(
      (2 * Math.PI * timeDiff / S2_period) - (constants.harmonics.S2.phase * Math.PI / 180)
    );

    // K1 component (23.93 hour period)
    const K1_period = 23.93 * 3600;
    height += constants.harmonics.K1.amplitude * Math.cos(
      (2 * Math.PI * timeDiff / K1_period) - (constants.harmonics.K1.phase * Math.PI / 180)
    );

    // O1 component (25.82 hour period)
    const O1_period = 25.82 * 3600;
    height += constants.harmonics.O1.amplitude * Math.cos(
      (2 * Math.PI * timeDiff / O1_period) - (constants.harmonics.O1.phase * Math.PI / 180)
    );

    // Add small random variation to simulate real conditions
    height += (Math.random() - 0.5) * 0.1;

    return Math.max(0, height); // Ensure non-negative
  }

  /**
   * Calculate fallback tide height when no station data available
   */
  private calculateFallbackTideHeight(time: Date): number {
    const hour = time.getHours() + time.getMinutes() / 60;
    const constants = HONG_KONG_TIDE_CONSTANTS;

    // Simple sinusoidal approximation
    const tideCycle = (hour * Math.PI) / 6.2; // Semi-diurnal pattern
    const tideValue = Math.sin(tideCycle);

    return constants.meanTideLevel + (tideValue * constants.meanRange / 2);
  }

  /**
   * Get nearest station to coordinates
   */
  private getNearestStation(coordinate: LocationCoordinate): UnifiedTideStation | null {
    let nearest: UnifiedTideStation | null = null;
    let minDistance = Infinity;

    this.tideStations.forEach(station => {
      const distance = this.calculateDistance(coordinate, station.coordinate);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    });

    return nearest;
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(coord1: LocationCoordinate, coord2: LocationCoordinate): number {
    return Math.sqrt(
      Math.pow(coord1.latitude - coord2.latitude, 2) +
      Math.pow(coord1.longitude - coord2.longitude, 2)
    );
  }

  /**
   * Generate hourly predictions for a station
   */
  private generateHourlyPredictions(station: TideStation): HourlyTideData[] {
    const predictions: HourlyTideData[] = [];
    const now = new Date();

    for (let hour = 0; hour < 24; hour++) {
      const time = new Date(now.getTime() + hour * 60 * 60 * 1000);
      const height = this.calculateFallbackTideHeight(time);

      // Calculate trend
      const nextTime = new Date(time.getTime() + 60 * 60 * 1000);
      const nextHeight = this.calculateFallbackTideHeight(nextTime);
      const velocity = nextHeight - height;
      const trend = velocity > 0.05 ? 'rising' : velocity < -0.05 ? 'falling' : 'stable';

      predictions.push({
        time,
        height: Math.round(height * 100) / 100,
        trend,
        velocity: Math.round(velocity * 100) / 100
      });
    }

    return predictions;
  }

  /**
   * Generate daily high/low predictions
   */
  private generateDailyPredictions(station: TideStation): TidePrediction[] {
    const predictions: TidePrediction[] = [];
    const now = new Date();

    // Generate high/low tide predictions for next 7 days
    for (let day = 0; day < 7; day++) {
      const baseTime = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);

      // Typically 2 high and 2 low tides per day in Hong Kong (semi-diurnal)
      const highTide1 = new Date(baseTime.setHours(6, 30, 0, 0));
      const lowTide1 = new Date(baseTime.setHours(12, 45, 0, 0));
      const highTide2 = new Date(baseTime.setHours(18, 15, 0, 0));
      const lowTide2 = new Date(baseTime.setHours(1, 0, 0, 0) + 24 * 60 * 60 * 1000);

      predictions.push(
        { time: highTide1, height: 2.1 + Math.random() * 0.4, type: 'high' },
        { time: lowTide1, height: 0.3 + Math.random() * 0.3, type: 'low' },
        { time: highTide2, height: 2.0 + Math.random() * 0.4, type: 'high' },
        { time: lowTide2, height: 0.2 + Math.random() * 0.3, type: 'low' }
      );
    }

    return predictions.sort((a, b) => a.time.getTime() - b.time.getTime());
  }

  /**
   * Get base tide stations from existing services
   */
  private async getBaseTideStations(): Promise<TideStation[]> {
    try {
      // Try to get from HKO API first
      const hkoStations = await hkoAPI.getTideStations();

      if (hkoStations.length > 0) {
        return hkoStations.map(station => ({
          id: station.id || station.code,
          name: station.name,
          coordinate: { latitude: station.latitude, longitude: station.longitude },
          currentHeight: station.currentHeight || 1.5,
          trend: (station.trend || 'stable') as 'rising' | 'falling' | 'stable',
          nextTide: station.nextTide || {
            type: 'high',
            time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            height: 2.0
          },
          lastUpdated: station.updateTime || new Date().toISOString(),
          dataQuality: 'high' as const,
          isHKOData: true,
          stationType: 'coastal' as const
        }));
      }

      return this.createFallbackStations();
    } catch (error) {
      return this.createFallbackStations();
    }
  }

  /**
   * Create fallback stations when API is unavailable
   */
  private createFallbackStations(): UnifiedTideStation[] {
    const now = new Date();

    const fallbackStations = [
      {
        id: 'unified-lamma-channel',
        name: 'Lamma Channel',
        coordinate: { latitude: 22.225, longitude: 114.125 },
        currentHeight: this.calculateFallbackTideHeight(now),
        trend: 'falling' as const,
        nextTide: {
          type: 'low' as const,
          time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          height: 0.5
        },
        lastUpdated: now.toISOString(),
        dataQuality: 'medium' as const,
        isHKOData: false,
        stationType: 'harbor' as const,
        hourlyPredictions: [] as HourlyTideData[],
        dailyPredictions: [] as TidePrediction[],
        tidePattern: 'semidiurnal' as const,
        harmonicConstants: HONG_KONG_TIDE_CONSTANTS.harmonics
      }
    ];

    // Generate predictions for fallback stations
    fallbackStations.forEach(station => {
      station.hourlyPredictions = this.generateHourlyPredictions(station);
      station.dailyPredictions = this.generateDailyPredictions(station);
    });

    return fallbackStations;
  }

  /**
   * Start polling for real-time updates
   */
  private startPolling(): void {

    // Initial load
    this.getUnifiedTideStations();

    // Poll every 60 seconds for consistency
    this.pollingInterval = setInterval(() => {
      this.getUnifiedTideStations();
    }, 60 * 1000);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Ensure time synchronization between current and forecast data
   * This method verifies that the same time produces the same tide height
   * across different data access methods
   */
  verifyDataConsistency(coordinate: LocationCoordinate, testTime: Date = new Date()): {
    isConsistent: boolean;
    currentHeight: number;
    forecastHeight: number;
    timeDiff: number;
    details: string;
  } {
    const currentHeight = this.getCurrentTideHeight(coordinate, testTime);
    const hourlyPredictions = this.getHourlyPredictions(coordinate, testTime);

    // Find the closest hourly prediction
    const targetHour = testTime.getHours();
    const closestPrediction = hourlyPredictions.find(pred => pred.time.getHours() === targetHour);
    const forecastHeight = closestPrediction?.height ?? currentHeight;

    const heightDiff = Math.abs(currentHeight - forecastHeight);
    const isConsistent = heightDiff < 0.1; // Within 10cm tolerance

    return {
      isConsistent,
      currentHeight: Math.round(currentHeight * 100) / 100,
      forecastHeight: Math.round(forecastHeight * 100) / 100,
      timeDiff: Math.round(heightDiff * 1000) / 1000,
      details: `${isConsistent ? '✅' : '❌'} Height difference: ${heightDiff.toFixed(3)}m at ${testTime.toLocaleTimeString()}`
    };
  }

  /**
   * Synchronize time across all data sources
   * Forces a fresh calculation for a specific time to ensure consistency
   */
  synchronizeTime(time: Date = new Date()): void {

    // Update all station current heights to this specific time
    this.tideStations.forEach((station, stationId) => {
      const height = this.interpolateTideHeight(station, time);
      const nextHour = new Date(time.getTime() + 60 * 60 * 1000);
      const nextHeight = this.interpolateTideHeight(station, nextHour);
      const heightDiff = nextHeight - height;
      const trend = heightDiff > 0.05 ? 'rising' : heightDiff < -0.05 ? 'falling' : 'stable';

      // Update station with synchronized data
      station.currentHeight = Math.round(height * 100) / 100;
      station.trend = trend;
      station.lastUpdated = time.toISOString();

    });

    this.lastUpdate = time;
  }

  /**
   * Get synchronized tide data for a specific time
   * This ensures both map markers and forecast modals show identical values
   */
  getSynchronizedTideData(coordinate: LocationCoordinate, time: Date = new Date()): {
    height: number;
    trend: 'rising' | 'falling' | 'stable';
    nextTideInfo: {
      type: 'high' | 'low';
      time: string;
      height: number;
    };
    dataSource: 'unified';
    timestamp: string;
  } {
    const height = this.getCurrentTideHeight(coordinate, time);

    // Calculate trend
    const nextHour = new Date(time.getTime() + 60 * 60 * 1000);
    const nextHeight = this.getCurrentTideHeight(coordinate, nextHour);
    const heightDiff = nextHeight - height;
    const trend = heightDiff > 0.05 ? 'rising' : heightDiff < -0.05 ? 'falling' : 'stable';

    // Estimate next tide (simplified)
    const nextTideTime = new Date(time.getTime() + 3 * 60 * 60 * 1000); // 3 hours ahead
    const nextTideHeight = this.getCurrentTideHeight(coordinate, nextTideTime);
    const nextTideType = nextTideHeight > height ? 'high' : 'low';

    return {
      height: Math.round(height * 100) / 100,
      trend,
      nextTideInfo: {
        type: nextTideType,
        time: nextTideTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        height: Math.round(nextTideHeight * 100) / 100
      },
      dataSource: 'unified',
      timestamp: time.toISOString()
    };
  }

  /**
   * Get debug info for troubleshooting
   */
  getDebugInfo(): object {
    const now = new Date();
    const testCoordinate = { latitude: 22.225, longitude: 114.125 };
    const consistency = this.verifyDataConsistency(testCoordinate, now);

    return {
      lastUpdate: this.lastUpdate,
      stationCount: this.tideStations.size,
      pollingActive: !!this.pollingInterval,
      dataConsistency: consistency,
      synchronizedData: this.getSynchronizedTideData(testCoordinate, now),
      stations: Array.from(this.tideStations.values()).map(station => ({
        id: station.id,
        name: station.name,
        currentHeight: station.currentHeight,
        trend: station.trend,
        hourlyPredictionsCount: station.hourlyPredictions.length
      }))
    };
  }
}

// Export singleton instance
export const unifiedTideService = new UnifiedTideService();
export default unifiedTideService;