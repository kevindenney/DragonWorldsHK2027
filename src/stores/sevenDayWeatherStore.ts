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

      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const {savedAt, payload} = JSON.parse(cached);
        const age = (Date.now() - savedAt) / 60000; // minutes

        // Force fresh data if ttlMin is negative (debugging mode)
        if (ttlMin >= 0 && age < ttlMin) {
          set(state => ({
            bundles: {...state.bundles, [areaKey]: payload}
          }));
          return payload;
        } else {
          // Clear the cached data to force fresh fetch
          await AsyncStorage.removeItem(cacheKey);
        }
      } else {
      }

      // Fetch fresh data
      set({loading: true, error: null});

      const area = RACE_AREAS.find(a => a.key === areaKey);
      if (!area) {
        throw new Error(`Unknown area key: ${areaKey}`);
      }

      const mappedStation = RACE_AREA_TIDE_MAP[areaKey];
      const bundle = await getAreaBundle(area, mappedStation, true);

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
          return null;
        })
      );

      await Promise.all(promises);
      set({loading: false});
    } catch (error) {
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
    }
  }
}));