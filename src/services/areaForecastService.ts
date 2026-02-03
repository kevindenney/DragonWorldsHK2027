import type {RaceArea} from '../config/raceAreas';
import {getNearestTideStation} from './tideStationService';
import {RACE_AREA_TIDE_MAP} from '../config/raceAreaTides';
import {multiSourceWeather, type ConsensusReading} from './multiSourceWeatherService';
import {unifiedTideService} from './unifiedTideService';

// Configuration
export const WEATHER_CONFIG = {
  useOpenWeatherMap: true, // Use OpenWeatherMap as primary source
  useOpenMeteo: false, // DISABLED - Open-Meteo shows unrealistic wind speeds
  showConfidence: false,  // No confidence needed with single source
  openWeatherMapApiKey: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '' // Set in .env file
};

// Helper functions
const mpsToKts = (v: number) => v * 1.943844;

const buildHKHourlyKeys = (n: number): string[] => {
  const keys: string[] = [];
  const now = new Date();
  // Round down to current hour
  now.setMinutes(0, 0, 0);

  for (let i = 0; i < n; i++) {
    const d = new Date(now.getTime() + i * 3600000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    keys.push(`${year}-${month}-${day}T${hour}:00`);
  }
  return keys;
};

const latestIndexHK = (times: string[]): number => {
  const nowHK = new Date().toISOString().slice(0, 13) + ':00';
  let latest = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] <= nowHK) latest = i;
    else break;
  }
  return latest;
};

const trend3 = (
  arr: (number | null)[],
  lastN: number,
  epsilon: number
): 'up' | 'down' | 'flat' => {
  const recent = arr.slice(-lastN).filter(v => v !== null) as number[];
  if (recent.length < 2) return 'flat';

  const first = recent[0];
  const last = recent[recent.length - 1];
  const change = last - first;
  const changePerHour = change / (recent.length - 1);

  if (changePerHour > epsilon) return 'up';
  if (changePerHour < -epsilon) return 'down';
  return 'flat';
};

const coalesceCurrent = (arr: (number | null)[], times: string[]): number | null => {
  const idx = latestIndexHK(times);
  // Try current hour
  if (arr[idx] !== null) return arr[idx];
  // Try next hour
  if (idx + 1 < arr.length && arr[idx + 1] !== null) return arr[idx + 1];
  // Try previous hour
  if (idx > 0 && arr[idx - 1] !== null) return arr[idx - 1];
  return null;
};

// OpenWeatherMap-only wind data fetching
async function getWindData(area: RaceArea): Promise<{
  windSpeedKts: number[];
  windGustKts: (number | null)[];
  windDirDeg: number[];
  temperatureC?: number[];
  cloudPct?: number[];
  currentWind: {
    speedKts: number;
    gustKts: number | null;
    dirDeg: number;
    trend: 'up' | 'down' | 'flat';
    confidence?: number;
    sources?: string[];
    variance?: {
      speedRange: [number, number];
      agreement: 'high' | 'medium' | 'low';
    };
  };
  omTimes: string[];
}> {
  if (WEATHER_CONFIG.useOpenWeatherMap && WEATHER_CONFIG.openWeatherMapApiKey) {

    try {
      // Fetch current weather from OpenWeatherMap
      const owmRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?` +
        `lat=${area.lat}&lon=${area.lon}&` +
        `appid=${WEATHER_CONFIG.openWeatherMapApiKey}&units=metric`
      );
      const owmData = await owmRes.json();

      if (owmData.cod !== 200) {
        throw new Error(`OpenWeatherMap error: ${owmData.message}`);
      }

      // Also fetch 5-day forecast for trends
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?` +
        `lat=${area.lat}&lon=${area.lon}&` +
        `appid=${WEATHER_CONFIG.openWeatherMapApiKey}&units=metric`
      );
      const forecastData = await forecastRes.json();

      // Build hourly arrays from forecast (3-hour intervals, interpolate)
      const times: string[] = [];
      const windSpeedKts: number[] = [];
      const windGustKts: (number | null)[] = [];
      const windDirDeg: number[] = [];
      const temperatureC: number[] = [];
      const cloudPct: number[] = [];

      // Current data first
      const now = new Date();
      times.push(now.toISOString().slice(0, 13) + ':00');
      windSpeedKts.push(mpsToKts(owmData.wind.speed));
      windGustKts.push(owmData.wind.gust ? mpsToKts(owmData.wind.gust) : null);
      windDirDeg.push(owmData.wind.deg || 0);
      temperatureC.push(owmData.main.temp);
      cloudPct.push(owmData.clouds?.all || 0);

      // Add forecast data (OpenWeatherMap provides 5-day/3-hour forecast)
      if (forecastData.list) {
        forecastData.list.slice(0, 40).forEach((item: any) => {
          const time = new Date(item.dt * 1000);
          times.push(time.toISOString().slice(0, 13) + ':00');
          windSpeedKts.push(mpsToKts(item.wind.speed));
          windGustKts.push(item.wind.gust ? mpsToKts(item.wind.gust) : null);
          windDirDeg.push(item.wind.deg || 0);
          temperatureC.push(item.main.temp);
          cloudPct.push(item.clouds?.all || 0);
        });
      }

      // Calculate trend
      const speedTrend = trend3(windSpeedKts.slice(0, 8), 3, 1.5);

      const currentWind = {
        speedKts: mpsToKts(owmData.wind.speed),
        gustKts: owmData.wind.gust ? mpsToKts(owmData.wind.gust) : null,
        dirDeg: owmData.wind.deg || 0,
        trend: speedTrend,
        sources: ['OpenWeatherMap']
      };


      return {
        windSpeedKts,
        windGustKts,
        windDirDeg,
        temperatureC,
        cloudPct,
        currentWind,
        omTimes: times
      };

    } catch (error) {

      // If OpenWeatherMap fails and Open-Meteo is disabled, throw error
      if (!WEATHER_CONFIG.useOpenMeteo) {
        throw new Error(`Weather data unavailable: ${error}`);
      }
    }
  }

  // Fallback to Open-Meteo if configured (but it's disabled by default now)
  if (WEATHER_CONFIG.useOpenMeteo) {
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${area.lat}&longitude=${area.lon}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m,cloud_cover&timezone=Asia%2FHong_Kong&forecast_days=7`);
    const weatherData = await weatherRes.json();
    const omTimes = weatherData.hourly.time || buildHKHourlyKeys(72);

    const windSpeedKts = weatherData.hourly.wind_speed_10m?.map((v: number) => mpsToKts(v)) || [];
    const windGustKts = weatherData.hourly.wind_gusts_10m?.map((v: number) => v ? mpsToKts(v) : null) || [];
    const windDirDeg = weatherData.hourly.wind_direction_10m || [];

    const currentSpeedKts = coalesceCurrent(windSpeedKts, omTimes) || 0;
    const currentGustKts = coalesceCurrent(windGustKts, omTimes);
    const currentDirDeg = coalesceCurrent(windDirDeg, omTimes) || 0;
    const speedTrend = trend3(windSpeedKts, 3, 1.5);

    const currentWind = {
      speedKts: currentSpeedKts,
      gustKts: currentGustKts,
      dirDeg: currentDirDeg,
      trend: speedTrend
    };

    return {
      windSpeedKts,
      windGustKts,
      windDirDeg,
      currentWind,
      omTimes
    };
  }

  // If all sources are disabled, return empty data
  throw new Error('No weather data sources configured');
}

// Tide data interfaces
interface HKOTidePoint {
  time: string; // "2024-01-15 00:00"
  height: number;
}

interface HKOTideStation {
  stationCode: string;
  data: HKOTidePoint[];
}

// Generate synthetic tide data based on harmonic tidal model
function generateSyntheticTideData(stationCode: string, times: string[]): HKOTidePoint[] {
  // Semi-diurnal tide model for Hong Kong waters
  // M2 (principal lunar semi-diurnal) constituent dominates
  const M2_PERIOD = 12.42; // hours
  const AMPHIDROMES: Record<string, {amplitude: number; phase: number}> = {
    'TMW': {amplitude: 1.8, phase: 0.2},      // Tai Miu Wan
    'QUB': {amplitude: 1.6, phase: 0.15},     // Quarry Bay
    'CCH': {amplitude: 2.1, phase: 0.25},     // Cheung Chau
    'WAG': {amplitude: 1.9, phase: 0.18}      // Waglan Island
  };

  const config = AMPHIDROMES[stationCode] || {amplitude: 1.7, phase: 0.2};

  return times.map(timeStr => {
    const date = new Date(timeStr);
    const hours = date.getTime() / (1000 * 60 * 60);


    // M2 tidal component
    const m2Phase = (2 * Math.PI * hours / M2_PERIOD) + config.phase;
    const m2Height = config.amplitude * Math.cos(m2Phase);

    // Add S2 (solar semi-diurnal) component - smaller amplitude
    const s2Phase = (2 * Math.PI * hours / 12.0) + (config.phase * 0.8);
    const s2Height = config.amplitude * 0.3 * Math.cos(s2Phase);

    // Mean sea level offset
    const meanLevel = 1.2;

    const totalHeight = meanLevel + m2Height + s2Height;

    return {
      time: timeStr.replace('T', ' ').slice(0, 16),
      height: Math.max(0, totalHeight)
    };
  });
}

// Fetch HKO predicted tide data with synthetic fallback
async function fetchHkoPredictedTide(): Promise<Record<string, HKOTidePoint[]>> {
  try {
    // Try multiple HKO API endpoints
    const endpoints = [
      'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=HHOT&rformat=json&lang=en',
      'https://data.weather.gov.hk/weatherAPI/opendata/tide.php?dataType=json&lang=en'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const json = await response.json();
          if (json && typeof json === 'object') {
            // Process real HKO data if available
            return {};
          }
        }
      } catch (e) {
        continue;
      }
    }

    return {};
  } catch (error) {
    return {};
  }
}

// Align tide data to Open-Meteo hourly times
function getTideSeriesAlignedToOM(
  stationCode: string,
  omHourlyTimes: string[],
  hkoData: Record<string, HKOTidePoint[]>
): (number | null)[] {

  const stationData = hkoData[stationCode];

  if (!stationData || stationData.length === 0) {
    // Use synthetic tide model when real data is unavailable
    const syntheticData = generateSyntheticTideData(stationCode, omHourlyTimes);
    return syntheticData.map(d => d.height);
  }

  return omHourlyTimes.map(omTime => {
    // Convert OM time to HKO format for comparison
    const omDate = new Date(omTime);
    const hkoFormat = `${omDate.getFullYear()}-${String(omDate.getMonth() + 1).padStart(2, '0')}-${String(omDate.getDate()).padStart(2, '0')} ${String(omDate.getHours()).padStart(2, '0')}:00`;

    const point = stationData.find(p => p.time === hkoFormat);
    return point ? point.height : null;
  });
}

// Main bundle type
export interface AreaBundle {
  meta: {
    areaKey: string;
    lat: number;
    lon: number;
    generatedAt: number;
    sources: {
      windWave: string;
      tide: string;
    };
  };
  current: {
    wind: {
      speedKts: number;
      gustKts: number | null;
      dirDeg: number;
      trend: 'up' | 'down' | 'flat';
      confidence?: number; // 0-1 scale for multi-source consensus
      sources?: string[]; // List of sources used in consensus
      variance?: {
        speedRange: [number, number];
        agreement: 'high' | 'medium' | 'low';
      };
    };
    wave: {
      heightM: number | null;
      periodS: number | null;
      dirDeg: number | null;
      trend: 'up' | 'down' | 'flat';
    };
    tide: {
      heightM: number | null;
      trend: 'up' | 'down' | 'flat' | null;
      stationName: string | null;
      stationDistanceKm: number | null;
    };
  };
  hourly: {
    times: string[];
    windSpeedKts: number[];
    windDirDeg: number[];
    waveHeightM: (number | null)[];
    wavePeriodS: (number | null)[];
    waveDirDeg: (number | null)[];
    tideHeightM: (number | null)[];
    temperatureC: number[];
    cloudPct: number[];
  };
}

// Main function to get area bundle
export async function getAreaBundle(
  area: RaceArea,
  mapped?: {code: string; name: string},
  nearestFallback: boolean = true
): Promise<AreaBundle> {
  try {
    // 1. Fetch wind data from OpenWeatherMap
    const windDataResult = await getWindData(area);
    const {
      windSpeedKts,
      windGustKts,
      windDirDeg,
      temperatureC: tempFromOWM,
      cloudPct: cloudFromOWM,
      currentWind,
      omTimes
    } = windDataResult;

    // 2. Fetch marine data in parallel with wind data processing
    const marineRes = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${area.lat}&longitude=${area.lon}&hourly=wave_height,wave_direction,wave_period&timezone=Asia%2FHong_Kong&forecast_days=7`);
    const marineData = await marineRes.json();

    // 3. Determine tide station
    const mappedStation = mapped || RACE_AREA_TIDE_MAP[area.key];
    let tideStation = mappedStation;
    let distanceKm = 0;

    if (!tideStation && nearestFallback) {
      const nearest = getNearestTideStation(area.lat, area.lon);
      if (nearest) {
        tideStation = {code: nearest.code, name: nearest.name};
        distanceKm = nearest.distanceKm;
      }
    }

    // 4. Fetch HKO tide data and align (TEMPORARY: Skip HKO API and force synthetic)
    const hkoData = {}; // Force empty to trigger synthetic model

    const tideHeights = tideStation
      ? getTideSeriesAlignedToOM(tideStation.code, omTimes, hkoData)
      : omTimes.map(() => null);

    // 3. Use temperature and cloud data from OpenWeatherMap
    const temperatureC = tempFromOWM || [];
    const cloudPct = cloudFromOWM || [];

    // 4. Build wave arrays
    const waveHeightM = marineData.hourly?.wave_height || omTimes.map(() => null);
    const wavePeriodS = marineData.hourly?.wave_period || omTimes.map(() => null);
    const waveDirDeg = marineData.hourly?.wave_direction || omTimes.map(() => null);

    // DEBUG: Log wind data processing
    if (currentWind.confidence) {
    }
    if (currentWind.gustKts && currentWind.speedKts) {
      const gustFactor = currentWind.gustKts / currentWind.speedKts;
    }

    const currentWave = {
      heightM: coalesceCurrent(waveHeightM, omTimes),
      periodS: coalesceCurrent(wavePeriodS, omTimes),
      dirDeg: coalesceCurrent(waveDirDeg, omTimes),
      trend: trend3(waveHeightM, 3, 0.05) // 0.05 m/h threshold
    };

    // === DEBUGGING: UNIFIED TIDE SERVICE INTEGRATION ===

    let unifiedHeight = 1.5; // fallback
    let unifiedTrend: 'up' | 'down' | 'flat' = 'flat';
    let serviceStatus = 'unknown';
    let errorDetails = null;

    try {
      if (!unifiedTideService) {
        throw new Error('Unified tide service is not initialized');
      }


      const areaCoordinate = { latitude: area.lat, longitude: area.lon };
      const now = new Date();


      unifiedTideService.synchronizeTime(now);

      unifiedHeight = unifiedTideService.getCurrentTideHeight(areaCoordinate, now);

      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const nextHeight = unifiedTideService.getCurrentTideHeight(areaCoordinate, nextHour);
      const heightDiff = nextHeight - unifiedHeight;
      unifiedTrend = heightDiff > 0.05 ? 'up' : heightDiff < -0.05 ? 'down' : 'flat';


      serviceStatus = 'success';

    } catch (error) {
      errorDetails = error instanceof Error ? error.message : String(error);
      serviceStatus = 'failed';

      // Fallback to old method
      const fallbackHeight = coalesceCurrent(tideHeights, omTimes);
      unifiedHeight = fallbackHeight || 1.5;
      unifiedTrend = trend3(tideHeights, 3, 0.1) as 'up' | 'down' | 'flat' || 'flat';
    }

    // Compare with old method for debugging
    const oldMethodHeight = coalesceCurrent(tideHeights, omTimes) || 1.5;
    const oldMethodTrend = trend3(tideHeights, 3, 0.1) as 'up' | 'down' | 'flat' || 'flat';

    if (errorDetails) {
    }

    const currentTide = {
      heightM: unifiedHeight, // Use unified service for consistency
      trend: unifiedTrend as 'up' | 'down' | 'flat' | null,
      stationName: tideStation?.name || (serviceStatus === 'success' ? 'Unified Model' : 'Fallback Model'),
      stationDistanceKm: distanceKm || null
    };

    // 7. Return AreaBundle
    return {
      meta: {
        areaKey: area.key,
        lat: area.lat,
        lon: area.lon,
        generatedAt: Date.now(),
        sources: {
          windWave: WEATHER_CONFIG.useOpenWeatherMap ? 'OpenWeatherMap' : 'Open-Meteo',
          tide: 'HKO HHOT'
        }
      },
      current: {
        wind: currentWind,
        wave: currentWave,
        tide: currentTide
      },
      hourly: {
        times: omTimes,
        windSpeedKts,
        windDirDeg,
        waveHeightM,
        wavePeriodS,
        waveDirDeg,
        tideHeightM: tideHeights,
        temperatureC,
        cloudPct
      }
    };
  } catch (error) {
    throw error;
  }
}
