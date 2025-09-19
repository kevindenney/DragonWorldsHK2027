import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getAreaBundle, type AreaBundle} from '../services/areaForecastService';
import {RACE_AREAS} from '../config/raceAreas';
import {RACE_AREA_TIDE_MAP} from '../config/raceAreaTides';

interface WeatherStore {
  bundles: Record<string, AreaBundle>;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAreaBundle: (areaKey: string, ttlMin?: number) => Promise<AreaBundle>;
  fetchAllBundles: () => Promise<void>;
  clearCache: () => Promise<void>;
}

export const useSevenDayWeatherStore = create<WeatherStore>((set, get) => ({
  bundles: {},
  loading: false,
  error: null,

  fetchAreaBundle: async (areaKey: string, ttlMin = -1) => { // Force cache invalidation with -1 default
    const cacheKey = `sevenDay:${areaKey}`;

    try {
      // FORCE CACHE INVALIDATION for debugging tide inconsistency
      console.log(`🔍 [CACHE DEBUG] === CACHE DEBUGGING FOR TIDE INCONSISTENCY ===`);
      console.log(`🔍 [CACHE DEBUG] Fetching bundle for ${areaKey}, TTL: ${ttlMin}min (negative = force fresh)`);

      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const {savedAt, payload} = JSON.parse(cached);
        const age = (Date.now() - savedAt) / 60000; // minutes
        console.log(`🔍 [CACHE DEBUG] Found cached data for ${areaKey}:`);
        console.log(`🔍 [CACHE DEBUG] - Age: ${age.toFixed(1)}min`);
        console.log(`🔍 [CACHE DEBUG] - Cached tide height: ${payload.current?.tide?.heightM}m`);
        console.log(`🔍 [CACHE DEBUG] - Cached tide trend: ${payload.current?.tide?.trend}`);
        console.log(`🔍 [CACHE DEBUG] - Cached station: ${payload.current?.tide?.stationName}`);

        // Force fresh data if ttlMin is negative (debugging mode)
        if (ttlMin >= 0 && age < ttlMin) {
          console.log(`🔍 [CACHE DEBUG] 🔄 Using cached bundle for ${areaKey}, age: ${age.toFixed(1)} min`);
          set(state => ({
            bundles: {...state.bundles, [areaKey]: payload}
          }));
          return payload;
        } else {
          console.log(`🔍 [CACHE DEBUG] 🚫 FORCING FRESH DATA - Cache ${ttlMin < 0 ? 'invalidated (debug mode)' : 'expired'} for ${areaKey}`);
          // Clear the cached data to force fresh fetch
          await AsyncStorage.removeItem(cacheKey);
        }
      } else {
        console.log(`🔍 [CACHE DEBUG] ✨ No cached data found for ${areaKey} - will fetch fresh`);
      }

      // Fetch fresh data
      console.log(`🔍 [STORE DEBUG] Starting fresh fetch for ${areaKey}`);
      set({loading: true, error: null});

      const area = RACE_AREAS.find(a => a.key === areaKey);
      if (!area) {
        throw new Error(`Unknown area key: ${areaKey}`);
      }

      const mappedStation = RACE_AREA_TIDE_MAP[areaKey];
      console.log(`🔍 [STORE DEBUG] About to call getAreaBundle for ${areaKey}, station:`, mappedStation);
      const bundle = await getAreaBundle(area, mappedStation, true);
      console.log(`🔍 [STORE DEBUG] getAreaBundle returned for ${areaKey}, tide height:`, bundle.current.tide.heightM);

      // Save to cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        savedAt: Date.now(),
        payload: bundle
      }));

      // Update store
      set(state => ({
        bundles: {...state.bundles, [areaKey]: bundle},
        loading: false
      }));

      return bundle;
    } catch (error) {
      console.error(`Failed to fetch bundle for ${areaKey}:`, error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather data'
      });

      // Return cached data if available (even if stale)
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const {payload} = JSON.parse(cached);
        return payload;
      }

      throw error;
    }
  },

  fetchAllBundles: async () => {
    set({loading: true, error: null});

    try {
      // Fetch all area bundles in parallel
      const promises = RACE_AREAS.map(area =>
        get().fetchAreaBundle(area.key).catch(err => {
          console.error(`Failed to fetch ${area.key}:`, err);
          return null;
        })
      );

      await Promise.all(promises);
      set({loading: false});
    } catch (error) {
      console.error('Failed to fetch all bundles:', error);
      set({
        loading: false,
        error: 'Failed to fetch weather data for all areas'
      });
    }
  },

  clearCache: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const weatherKeys = keys.filter(k => k.startsWith('sevenDay:'));
      await AsyncStorage.multiRemove(weatherKeys);
      set({bundles: {}});
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}));