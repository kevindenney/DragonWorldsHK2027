/**
 * RegattaFlow Session Store
 *
 * Zustand store for managing and persisting RegattaFlow session state.
 * Sessions are cached in AsyncStorage and auto-refreshed when needed.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugZustandStore } from '../utils/hermesDebugger';
import type { RegattaFlowStore, RegattaFlowSession } from '../types/regattaFlow';

/**
 * Zustand store debugger (no-op in production)
 */
const storeDebugger = debugZustandStore('regattaFlowStore');
storeDebugger.beforeCreate();

/**
 * RegattaFlow session store
 */
export const useRegattaFlowStore = create<RegattaFlowStore>()(
  persist(
    (set) => ({
      // Initial state
      session: null,
      isLoading: false,
      error: null,
      lastRefreshAttempt: null,

      // Actions
      setSession: (session: RegattaFlowSession | null) => {
        set({
          session,
          error: null,
        });
      },

      clearSession: () => {
        set({
          session: null,
          error: null,
          lastRefreshAttempt: null,
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      updateLastRefreshAttempt: () => {
        set({ lastRefreshAttempt: Date.now() });
      },
    }),
    {
      name: 'regattaflow-session-storage',
      storage: (() => {
        storeDebugger.beforePersist();
        try {
          const storage = createJSONStorage(() => AsyncStorage);
          storeDebugger.afterPersist();
          return storage;
        } catch (error) {
          throw error;
        }
      })(),
      // Only persist session data, not loading/error states
      partialize: (state) => ({
        session: state.session,
        lastRefreshAttempt: state.lastRefreshAttempt,
      }),
    }
  )
);

// Post-creation debugging
storeDebugger.afterCreate();

/**
 * Store selectors for optimized re-renders
 */
export const regattaFlowSelectors = {
  session: (state: RegattaFlowStore) => state.session,
  isLoading: (state: RegattaFlowStore) => state.isLoading,
  error: (state: RegattaFlowStore) => state.error,
  lastRefreshAttempt: (state: RegattaFlowStore) => state.lastRefreshAttempt,
};

export default useRegattaFlowStore;
