import type {RaceArea} from '../config/raceAreas';
import {getNearestTideStation} from './tideStationService';
import {RACE_AREA_TIDE_MAP} from '../config/raceAreaTides';
import {multiSourceWeather, type ConsensusReading} from './multiSourceWeatherService';

// Configuration
export const WEATHER_CONFIG = {
  useOpenWeatherMap: true, // Use OpenWeatherMap as primary source
  useOpenMeteo: false, // DISABLED - Open-Meteo shows unrealistic wind speeds
  showConfidence: false,  // No confidence needed with single source
  openWeatherMapApiKey: '6e0536f7e1f58b0bae02b8d1b207487f' // HKDW API key (Active)
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
    console.log(`🌊 [OPENWEATHERMAP] Fetching wind data for ${area.key}`);

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

      console.log(`🌊 [OPENWEATHERMAP] Current wind for ${area.key}: ${currentWind.speedKts.toFixed(1)}kt @ ${currentWind.dirDeg}°`);

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
      console.error(`🌊 [OPENWEATHERMAP] Failed for ${area.key}:`, error);

      // If OpenWeatherMap fails and Open-Meteo is disabled, throw error
      if (!WEATHER_CONFIG.useOpenMeteo) {
        throw new Error(`Weather data unavailable: ${error}`);
      }
    }
  }

  // Fallback to Open-Meteo if configured (but it's disabled by default now)
  if (WEATHER_CONFIG.useOpenMeteo) {
    console.log(`🔍 [FALLBACK] Using Open-Meteo for ${area.key}`);
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

    console.log(`🌊 [TIDE CALC] Time: ${timeStr}, Hours since epoch: ${hours}`);

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
            console.log('✅ HKO tide data fetched successfully');
            // Process real HKO data if available
            return {};
          }
        }
      } catch (e) {
        console.log('⚠️ HKO endpoint failed, trying next...', e.message);
        continue;
      }
    }

    console.log('⚠️ HKO tide API unavailable, returning empty for synthetic fallback');
    return {};
  } catch (error) {
    console.log('⚠️ HKO tide fetch error, returning empty for synthetic fallback:', error.message);
    return {};
  }
}

// Align tide data to Open-Meteo hourly times
function getTideSeriesAlignedToOM(
  stationCode: string,
  omHourlyTimes: string[],
  hkoData: Record<string, HKOTidePoint[]>
): (number | null)[] {
  console.log(`🔍 [TIDE DEBUG] getTideSeriesAlignedToOM called for station: ${stationCode}`);
  console.log(`🔍 [TIDE DEBUG] HKO data keys:`, Object.keys(hkoData));
  console.log(`🔍 [TIDE DEBUG] OM times count:`, omHourlyTimes.length);

  const stationData = hkoData[stationCode];
  console.log(`🔍 [TIDE DEBUG] Station data exists:`, !!stationData);
  console.log(`🔍 [TIDE DEBUG] Station data length:`, stationData?.length || 0);

  if (!stationData || stationData.length === 0) {
    // Use synthetic tide model when real data is unavailable
    console.log(`🌊 Using synthetic tide model for ${stationCode}`);
    const syntheticData = generateSyntheticTideData(stationCode, omHourlyTimes);
    console.log(`🌊 Generated ${syntheticData.length} synthetic tide points`);
    console.log(`🌊 First few tide heights:`, syntheticData.slice(0, 3).map(d => d.height));
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
  console.log(`🔍 [BUNDLE DEBUG] Starting getAreaBundle for ${area.key}`);
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
    console.log(`🔍 [BUNDLE DEBUG] Fetching marine data for ${area.key}`);
    const marineRes = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${area.lat}&longitude=${area.lon}&hourly=wave_height,wave_direction,wave_period&timezone=Asia%2FHong_Kong&forecast_days=7`);
    const marineData = await marineRes.json();
    console.log(`🔍 [BUNDLE DEBUG] Marine data parsed for ${area.key}`);

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
    console.log(`🔍 [BUNDLE DEBUG] FORCE SYNTHETIC - Skipping HKO API for ${area.key}`);
    const hkoData = {}; // Force empty to trigger synthetic model
    console.log(`🔍 [BUNDLE DEBUG] Using empty HKO data to force synthetic for ${area.key}`);

    console.log(`🔍 [BUNDLE DEBUG] Tide station for ${area.key}:`, tideStation);
    const tideHeights = tideStation
      ? getTideSeriesAlignedToOM(tideStation.code, omTimes, hkoData)
      : omTimes.map(() => null);
    console.log(`🔍 [BUNDLE DEBUG] Final tide heights for ${area.key}:`, tideHeights.slice(0, 3));

    // 3. Use temperature and cloud data from OpenWeatherMap
    const temperatureC = tempFromOWM || [];
    const cloudPct = cloudFromOWM || [];

    // 4. Build wave arrays
    const waveHeightM = marineData.hourly?.wave_height || omTimes.map(() => null);
    const wavePeriodS = marineData.hourly?.wave_period || omTimes.map(() => null);
    const waveDirDeg = marineData.hourly?.wave_direction || omTimes.map(() => null);

    // DEBUG: Log wind data processing
    console.log(`🌪️ [WIND DEBUG] === WIND DATA INTEGRATION FOR ${area.key} ===`);
    console.log(`🌪️ [WIND DEBUG] Using ${WEATHER_CONFIG.useMultiSource ? 'MULTI-SOURCE' : 'SINGLE-SOURCE'} wind data`);
    console.log(`🌪️ [WIND DEBUG] Current wind speed: ${currentWind.speedKts.toFixed(1)} kt`);
    console.log(`🌪️ [WIND DEBUG] Current wind gust: ${currentWind.gustKts?.toFixed(1)} kt`);
    console.log(`🌪️ [WIND DEBUG] Current wind direction: ${currentWind.dirDeg}°`);
    if (currentWind.confidence) {
      console.log(`🌪️ [WIND DEBUG] Consensus confidence: ${(currentWind.confidence * 100).toFixed(0)}%`);
      console.log(`🌪️ [WIND DEBUG] Source agreement: ${currentWind.variance?.agreement}`);
      console.log(`🌪️ [WIND DEBUG] Sources used: ${currentWind.sources?.join(', ')}`);
    }
    if (currentWind.gustKts && currentWind.speedKts) {
      const gustFactor = currentWind.gustKts / currentWind.speedKts;
      console.log(`🌪️ [WIND DEBUG] Gust factor: ${gustFactor.toFixed(2)} (${((gustFactor - 1) * 100).toFixed(0)}% stronger)`);
    }

    const currentWave = {
      heightM: coalesceCurrent(waveHeightM, omTimes),
      periodS: coalesceCurrent(wavePeriodS, omTimes),
      dirDeg: coalesceCurrent(waveDirDeg, omTimes),
      trend: trend3(waveHeightM, 3, 0.05) // 0.05 m/h threshold
    };

    // === DEBUGGING: UNIFIED TIDE SERVICE INTEGRATION ===
    console.log(`🔧 [UNIFIED DEBUG] === STARTING UNIFIED TIDE SERVICE INTEGRATION FOR ${area.key} ===`);

    let unifiedHeight = 1.5; // fallback
    let unifiedTrend: 'up' | 'down' | 'flat' = 'flat';
    let serviceStatus = 'unknown';
    let errorDetails = null;

    try {
      console.log(`🔧 [UNIFIED DEBUG] Step 1: Attempting dynamic import of unifiedTideService...`);
      const { unifiedTideService } = await import('./unifiedTideService');
      console.log(`🔧 [UNIFIED DEBUG] ✅ Step 1 SUCCESS: unifiedTideService imported successfully`);

      console.log(`🔧 [UNIFIED DEBUG] Step 2: Checking service methods...`);
      console.log(`🔧 [UNIFIED DEBUG] - getCurrentTideHeight: ${typeof unifiedTideService.getCurrentTideHeight}`);
      console.log(`🔧 [UNIFIED DEBUG] - synchronizeTime: ${typeof unifiedTideService.synchronizeTime}`);

      const areaCoordinate = { latitude: area.lat, longitude: area.lon };
      const now = new Date();

      console.log(`🔧 [UNIFIED DEBUG] Step 3: Synchronizing time...`);
      console.log(`🔧 [UNIFIED DEBUG] - Coordinate: ${areaCoordinate.latitude}, ${areaCoordinate.longitude}`);
      console.log(`🔧 [UNIFIED DEBUG] - Time: ${now.toISOString()}`);

      unifiedTideService.synchronizeTime(now);
      console.log(`🔧 [UNIFIED DEBUG] ✅ Step 3 SUCCESS: Time synchronized`);

      console.log(`🔧 [UNIFIED DEBUG] Step 4: Getting current tide height...`);
      unifiedHeight = unifiedTideService.getCurrentTideHeight(areaCoordinate, now);
      console.log(`🔧 [UNIFIED DEBUG] ✅ Step 4 SUCCESS: Current height = ${unifiedHeight.toFixed(3)}m`);

      console.log(`🔧 [UNIFIED DEBUG] Step 5: Calculating trend...`);
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const nextHeight = unifiedTideService.getCurrentTideHeight(areaCoordinate, nextHour);
      const heightDiff = nextHeight - unifiedHeight;
      unifiedTrend = heightDiff > 0.05 ? 'up' : heightDiff < -0.05 ? 'down' : 'flat';

      console.log(`🔧 [UNIFIED DEBUG] ✅ Step 5 SUCCESS: Trend calculation complete`);
      console.log(`🔧 [UNIFIED DEBUG] - Next hour height: ${nextHeight.toFixed(3)}m`);
      console.log(`🔧 [UNIFIED DEBUG] - Height difference: ${heightDiff.toFixed(3)}m`);
      console.log(`🔧 [UNIFIED DEBUG] - Calculated trend: ${unifiedTrend}`);

      serviceStatus = 'success';

    } catch (error) {
      console.error(`🔧 [UNIFIED DEBUG] ❌ UNIFIED SERVICE FAILED:`, error);
      errorDetails = error instanceof Error ? error.message : String(error);
      serviceStatus = 'failed';

      // Fallback to old method
      console.log(`🔧 [UNIFIED DEBUG] 🔄 Falling back to old tide calculation method...`);
      const fallbackHeight = coalesceCurrent(tideHeights, omTimes);
      unifiedHeight = fallbackHeight || 1.5;
      unifiedTrend = trend3(tideHeights, 3, 0.1) as 'up' | 'down' | 'flat' || 'flat';
      console.log(`🔧 [UNIFIED DEBUG] 🔄 Fallback result: ${unifiedHeight.toFixed(1)}m, trend: ${unifiedTrend}`);
    }

    // Compare with old method for debugging
    const oldMethodHeight = coalesceCurrent(tideHeights, omTimes) || 1.5;
    const oldMethodTrend = trend3(tideHeights, 3, 0.1) as 'up' | 'down' | 'flat' || 'flat';

    console.log(`🔧 [UNIFIED DEBUG] === FINAL COMPARISON FOR ${area.key} ===`);
    console.log(`🔧 [UNIFIED DEBUG] Service Status: ${serviceStatus}`);
    console.log(`🔧 [UNIFIED DEBUG] Unified Method: ${unifiedHeight.toFixed(1)}m, ${unifiedTrend}`);
    console.log(`🔧 [UNIFIED DEBUG] Old Method: ${oldMethodHeight.toFixed(1)}m, ${oldMethodTrend}`);
    console.log(`🔧 [UNIFIED DEBUG] Difference: ${Math.abs(unifiedHeight - oldMethodHeight).toFixed(3)}m`);
    if (errorDetails) {
      console.log(`🔧 [UNIFIED DEBUG] Error Details: ${errorDetails}`);
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
    console.error(`🔍 [BUNDLE DEBUG] Failed to get area bundle for ${area.key}:`, error);
    console.error(`🔍 [BUNDLE DEBUG] Error type:`, typeof error);
    console.error(`🔍 [BUNDLE DEBUG] Error message:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
}