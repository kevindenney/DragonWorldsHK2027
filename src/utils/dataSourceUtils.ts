import { DataSource } from '../screens/modals/WeatherDetailModal';

// Re-export DataSource for consumers of this module
export { DataSource };

// Mapping of source names to their metadata
const SOURCE_METADATA: Record<string, Omit<DataSource, 'lastUpdated'>> = {
  'Open‑Meteo Weather': {
    name: 'Open‑Meteo Weather',
    url: 'https://open-meteo.com/en/docs',
    quality: 'high',
    description: 'Comprehensive weather data including temperature, wind, and atmospheric conditions'
  },
  'Open‑Meteo Marine': {
    name: 'Open‑Meteo Marine',
    url: 'https://open-meteo.com/en/docs/marine-weather-api',
    quality: 'high',
    description: 'Wave heights, swell periods, and marine forecasts'
  },
  'NOAA Tides': {
    name: 'NOAA Tides & Currents',
    url: 'https://tidesandcurrents.noaa.gov/',
    quality: 'high',
    description: 'Official tide predictions for Hong Kong waters'
  },
  'Hong Kong Observatory': {
    name: 'Hong Kong Observatory',
    url: 'https://www.hko.gov.hk/en/wxinfo/ts/index.htm',
    quality: 'high',
    description: 'Local conditions and weather warnings for Hong Kong'
  },
  'HKO Wind Stations': {
    name: 'HKO Wind Monitoring Network',
    url: 'https://www.hko.gov.hk/en/wxinfo/rainfall/rf.htm',
    quality: 'high',
    description: 'Real-time wind measurements from Hong Kong Observatory stations'
  },
  'Marine Department HK': {
    name: 'Hong Kong Marine Department',
    url: 'https://www.mardep.gov.hk/en/pub_services/ocean_hydro.html',
    quality: 'high',
    description: 'Marine weather and oceanographic data for Hong Kong waters'
  },
  'Global Wave Model': {
    name: 'NOAA WaveWatch III',
    url: 'https://polar.ncep.noaa.gov/waves/',
    quality: 'high',
    description: 'Global wave model forecasts and hindcasts'
  }
};

/**
 * Converts weather store active sources to DataSource format for the detail modal
 */
export const convertActiveSourcesToDataSources = (activeSources: {
  temperature?: { source: string; at: string };
  wind?: { source: string; at: string };
  waves?: { source: string; at: string };
  tide?: { source: string; at: string };
}) => {
  const result: {
    weather?: DataSource;
    marine?: DataSource;
    tide?: DataSource;
  } = {};

  // Weather data (temperature/wind)
  const weatherSource = activeSources.temperature || activeSources.wind;
  if (weatherSource) {
    const metadata = SOURCE_METADATA[weatherSource.source];
    if (metadata) {
      result.weather = {
        ...metadata,
        lastUpdated: weatherSource.at
      };
    }
  }

  // Marine data (waves)
  if (activeSources.waves) {
    const metadata = SOURCE_METADATA[activeSources.waves.source];
    if (metadata) {
      result.marine = {
        ...metadata,
        lastUpdated: activeSources.waves.at
      };
    }
  }

  // Tide data
  if (activeSources.tide) {
    const metadata = SOURCE_METADATA[activeSources.tide.source];
    if (metadata) {
      result.tide = {
        ...metadata,
        lastUpdated: activeSources.tide.at
      };
    }
  }

  return result;
};

/**
 * Creates a data source object from raw source information
 */
export const createDataSource = (
  sourceName: string,
  lastUpdated: string = new Date().toISOString()
): DataSource | undefined => {
  const metadata = SOURCE_METADATA[sourceName];
  if (!metadata) {
    return undefined;
  }

  return {
    ...metadata,
    lastUpdated
  };
};

/**
 * Gets all available data source metadata
 */
export const getAllDataSourceMetadata = () => SOURCE_METADATA;

// Station-specific data source mappings
const STATION_SOURCE_METADATA: Record<string, Omit<DataSource, 'lastUpdated'>> = {
  // Open-Meteo Weather stations
  'Open‑Meteo Weather': {
    name: 'Open‑Meteo Weather',
    url: 'https://open-meteo.com/en/docs',
    quality: 'high',
    description: 'Comprehensive weather data from global meteorological models'
  },
  // Hong Kong Observatory stations
  'Hong Kong Observatory': {
    name: 'Hong Kong Observatory',
    url: 'https://www.hko.gov.hk/en/wxinfo/ts/index.htm',
    quality: 'high',
    description: 'Official weather measurements from Hong Kong Observatory'
  },
  // Marine Department stations
  'Marine Department': {
    name: 'Marine Department',
    url: 'https://www.mardep.gov.hk/en/weather/index.html',
    quality: 'high',
    description: 'Marine weather data from Hong Kong Marine Department'
  },
  // Survey & Mapping Office tide stations
  'Survey & Mapping Office': {
    name: 'Survey & Mapping Office',
    url: 'https://www.smo.gov.hk/en/marine/tide.htm',
    quality: 'high',
    description: 'Official tide predictions from Survey & Mapping Office'
  },
  // Hong Kong Observatory Marine Division
  'HKO Marine Division': {
    name: 'HKO Marine Division',
    url: 'https://www.hko.gov.hk/en/wxinfo/marine/index.htm',
    quality: 'high',
    description: 'Marine weather data from Hong Kong Observatory Marine Division'
  },
  // Global Wave Model for wave stations
  'Global Wave Model': {
    name: 'NOAA WaveWatch III',
    url: 'https://polar.ncep.noaa.gov/waves/',
    quality: 'high',
    description: 'Global wave model forecasts and hindcasts'
  }
};

/**
 * Gets data source for specific weather stations
 */
export const getStationDataSource = (
  stationType: 'wind' | 'wave' | 'tide',
  stationName: string,
  lastUpdated: string = new Date().toISOString()
): DataSource => {
  // Map station types to their specific data sources
  let sourceName: string;

  switch (stationType) {
    case 'wind':
      // Wind stations use Open-Meteo Weather as primary, HKO for official stations
      sourceName = stationName.includes('HKO') || stationName.includes('Observatory') ?
        'HKO Wind Stations' : 'Open‑Meteo Weather';
      break;
    case 'wave':
      // Wave stations use marine weather models
      sourceName = stationName.includes('Marine') ?
        'Marine Department HK' : 'Global Wave Model';
      break;
    case 'tide':
      // Tide stations use NOAA or HKO marine data
      sourceName = 'NOAA Tides';
      break;
    default:
      sourceName = 'Hong Kong Observatory';
  }

  // Override for specific known stations
  if (stationName.toLowerCase().includes('marine')) {
    sourceName = 'Marine Department';
  } else if (stationName.toLowerCase().includes('victoria harbour')) {
    sourceName = 'HKO Marine Division';
  }

  const metadata = STATION_SOURCE_METADATA[sourceName];

  return {
    ...metadata,
    lastUpdated
  };
};

/**
 * Gets all station source metadata
 */
export const getAllStationSourceMetadata = () => STATION_SOURCE_METADATA;