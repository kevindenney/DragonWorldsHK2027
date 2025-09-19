/**
 * Multi-Source Weather Service
 *
 * Provides weather data from multiple sources with consensus logic to improve
 * accuracy and align better with commercial services like Windy and Windfinder.
 *
 * Sources:
 * 1. Open-Meteo (ICON model) - Current primary source
 * 2. OpenWeatherMap (Multiple models blended) - Better alignment with Windy
 * 3. Visual Crossing (Commercial-grade) - Future integration
 * 4. Hong Kong Observatory - Local validation (future)
 */

export interface WeatherReading {
  source: string;
  timestamp: string;
  windSpeedKts: number;
  windDirectionDeg: number;
  windGustKts: number | null;
  temperature?: number;
  confidence: number; // 0-1 scale
  model?: string;
}

export interface ConsensusReading {
  windSpeedKts: number;
  windDirectionDeg: number;
  windGustKts: number | null;
  confidence: number;
  sources: WeatherReading[];
  variance: {
    speedRange: [number, number];
    directionRange: [number, number];
    agreement: 'high' | 'medium' | 'low';
  };
}

export interface WeatherSourceConfig {
  name: string;
  enabled: boolean;
  weight: number; // 0-1, how much to trust this source
  apiKey?: string;
}

const DEFAULT_CONFIG: Record<string, WeatherSourceConfig> = {
  openMeteo: {
    name: 'Open-Meteo',
    enabled: true,
    weight: 0.6
  },
  openWeatherMap: {
    name: 'OpenWeatherMap',
    enabled: false, // Requires API key
    weight: 0.8
  },
  visualCrossing: {
    name: 'Visual Crossing',
    enabled: false, // Requires API key
    weight: 0.9
  }
};

/**
 * Utility functions
 */
const mpsToKts = (mps: number): number => mps * 1.943844;

function makeHttpRequest(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const req = https.get(url, { headers }, (res: any) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`JSON parse error: ${error}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Weather source implementations
 */
class OpenMeteoSource {
  async getWeather(lat: number, lon: number): Promise<WeatherReading | null> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m&` +
        `timezone=Asia%2FHong_Kong&forecast_days=1`;

      const response = await makeHttpRequest(url, {
        'User-Agent': 'DragonWorlds2027-MultiSource/1.0'
      });

      const hourly = response.hourly;
      const currentIndex = new Date().getHours(); // Current hour

      const windSpeed = hourly.wind_speed_10m[currentIndex];
      const windDir = hourly.wind_direction_10m[currentIndex];
      const windGust = hourly.wind_gusts_10m[currentIndex];
      const temp = hourly.temperature_2m[currentIndex];

      return {
        source: 'Open-Meteo',
        timestamp: new Date().toISOString(),
        windSpeedKts: mpsToKts(windSpeed),
        windDirectionDeg: windDir,
        windGustKts: windGust ? mpsToKts(windGust) : null,
        temperature: temp,
        confidence: 0.7, // Medium confidence - known to run hot
        model: 'ICON'
      };
    } catch (error) {
      console.error('Open-Meteo fetch failed:', error);
      return null;
    }
  }
}

class OpenWeatherMapSource {
  constructor(private apiKey: string) {}

  async getWeather(lat: number, lon: number): Promise<WeatherReading | null> {
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      console.log('OpenWeatherMap: API key not provided');
      return null;
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?` +
        `lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;

      const response = await makeHttpRequest(url);

      return {
        source: 'OpenWeatherMap',
        timestamp: new Date().toISOString(),
        windSpeedKts: mpsToKts(response.wind.speed),
        windDirectionDeg: response.wind.deg,
        windGustKts: response.wind.gust ? mpsToKts(response.wind.gust) : null,
        temperature: response.main.temp,
        confidence: 0.8, // High confidence - blended models
        model: 'Multiple'
      };
    } catch (error) {
      console.error('OpenWeatherMap fetch failed:', error);
      return null;
    }
  }
}

/**
 * Multi-Source Weather Service
 */
export class MultiSourceWeatherService {
  private config: Record<string, WeatherSourceConfig>;
  private sources: { [key: string]: any } = {};

  constructor(config: Partial<Record<string, WeatherSourceConfig>> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeSources();
  }

  private initializeSources() {
    // Initialize Open-Meteo (always available)
    this.sources.openMeteo = new OpenMeteoSource();

    // Initialize OpenWeatherMap if API key provided
    if (this.config.openWeatherMap?.apiKey) {
      this.sources.openWeatherMap = new OpenWeatherMapSource(this.config.openWeatherMap.apiKey);
      this.config.openWeatherMap.enabled = true;
    }
  }

  /**
   * Get weather readings from all enabled sources
   */
  async getAllReadings(lat: number, lon: number): Promise<WeatherReading[]> {
    console.log('🌐 [MULTI-SOURCE] Fetching from all enabled sources...');

    const promises: Promise<WeatherReading | null>[] = [];

    // Fetch from all enabled sources
    Object.entries(this.config).forEach(([key, config]) => {
      if (config.enabled && this.sources[key]) {
        console.log(`🌐 [MULTI-SOURCE] Querying ${config.name}...`);
        promises.push(this.sources[key].getWeather(lat, lon));
      }
    });

    const results = await Promise.all(promises);
    const validReadings = results.filter((r): r is WeatherReading => r !== null);

    console.log(`🌐 [MULTI-SOURCE] Got ${validReadings.length} valid readings from ${promises.length} sources`);
    validReadings.forEach(reading => {
      console.log(`🌐 [MULTI-SOURCE] ${reading.source}: ${reading.windSpeedKts.toFixed(1)}kt @ ${reading.windDirectionDeg}°`);
    });

    return validReadings;
  }

  /**
   * Calculate consensus reading from multiple sources
   */
  calculateConsensus(readings: WeatherReading[]): ConsensusReading {
    if (readings.length === 0) {
      throw new Error('No weather readings available for consensus');
    }

    if (readings.length === 1) {
      const reading = readings[0];
      return {
        windSpeedKts: reading.windSpeedKts,
        windDirectionDeg: reading.windDirectionDeg,
        windGustKts: reading.windGustKts,
        confidence: reading.confidence,
        sources: readings,
        variance: {
          speedRange: [reading.windSpeedKts, reading.windSpeedKts],
          directionRange: [reading.windDirectionDeg, reading.windDirectionDeg],
          agreement: 'high'
        }
      };
    }

    // Calculate weighted averages
    let totalWeight = 0;
    let weightedSpeed = 0;
    let weightedDirection = 0;
    let weightedGusts = 0;
    let gustCount = 0;

    const speeds = readings.map(r => r.windSpeedKts);
    const directions = readings.map(r => r.windDirectionDeg);
    const gusts = readings.filter(r => r.windGustKts !== null).map(r => r.windGustKts!);

    readings.forEach(reading => {
      const sourceConfig = Object.values(this.config).find(c => c.name === reading.source);
      const weight = sourceConfig ? sourceConfig.weight * reading.confidence : reading.confidence;

      totalWeight += weight;
      weightedSpeed += reading.windSpeedKts * weight;
      weightedDirection += reading.windDirectionDeg * weight;

      if (reading.windGustKts !== null) {
        weightedGusts += reading.windGustKts * weight;
        gustCount += weight;
      }
    });

    const consensusSpeed = weightedSpeed / totalWeight;
    const consensusDirection = weightedDirection / totalWeight;
    const consensusGusts = gustCount > 0 ? weightedGusts / gustCount : null;

    // Calculate variance and agreement
    const speedRange: [number, number] = [Math.min(...speeds), Math.max(...speeds)];
    const directionRange: [number, number] = [Math.min(...directions), Math.max(...directions)];

    const speedVariance = speedRange[1] - speedRange[0];
    const agreement = speedVariance < 5 ? 'high' : speedVariance < 10 ? 'medium' : 'low';

    // Overall confidence based on agreement and source confidence
    const avgConfidence = readings.reduce((sum, r) => sum + r.confidence, 0) / readings.length;
    const agreementBonus = agreement === 'high' ? 0.2 : agreement === 'medium' ? 0.1 : 0;
    const finalConfidence = Math.min(1, avgConfidence + agreementBonus);

    console.log(`🌐 [CONSENSUS] Speed: ${consensusSpeed.toFixed(1)}kt (${speedVariance.toFixed(1)}kt variance, ${agreement} agreement)`);

    return {
      windSpeedKts: consensusSpeed,
      windDirectionDeg: Math.round(consensusDirection),
      windGustKts: consensusGusts ? Math.round(consensusGusts) : null,
      confidence: finalConfidence,
      sources: readings,
      variance: {
        speedRange,
        directionRange,
        agreement
      }
    };
  }

  /**
   * Get consensus weather reading for a location
   */
  async getConsensusWeather(lat: number, lon: number): Promise<ConsensusReading> {
    const readings = await this.getAllReadings(lat, lon);
    return this.calculateConsensus(readings);
  }

  /**
   * Configure API keys for additional sources
   */
  setApiKey(source: 'openWeatherMap' | 'visualCrossing', apiKey: string) {
    if (this.config[source]) {
      this.config[source].apiKey = apiKey;
      this.initializeSources(); // Reinitialize with new API key
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Record<string, WeatherSourceConfig> {
    return { ...this.config };
  }
}

// Export singleton instance
export const multiSourceWeather = new MultiSourceWeatherService();