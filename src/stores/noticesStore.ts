import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Notices Store - Notices-specific preferences
 *
 * NOTE: Event selection has been moved to src/stores/eventStore.ts
 * This store now only contains notices-specific preferences.
 */

// Types for notices preferences
export interface NoticesPreferences {
  // Future preferences can be added here:
  // selectedCategory?: RegattaCategory | 'all';
  // searchHistory?: string[];
  // favoriteNotices?: string[];
  // readNoticeIds?: string[];
}

interface NoticesState {
  // State
  preferences: NoticesPreferences;

  // Actions
  resetPreferences: () => void;
}

// Default preferences
const defaultPreferences: NoticesPreferences = {};

export const useNoticesStore = create<NoticesState>()(
  persist(
    (set) => ({
      // Initial State
      preferences: defaultPreferences,

      // Actions
      resetPreferences: () => {
        set({
          preferences: defaultPreferences
        });
      }
    }),
    {
      name: 'dragon-worlds-notices',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferences: state.preferences
      })
    }
  )
);

// Selectors for easy access
export const useNoticesPreferences = () => useNoticesStore(state => state.preferences);

// Hook to check if the store has been hydrated
export const useNoticesStoreHydrated = () => {
  const [hasHydrated, setHasHydrated] = React.useState(false);

  React.useEffect(() => {

    const unsubscribe = useNoticesStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    // Also check if already hydrated
    const isAlreadyHydrated = useNoticesStore.persist.hasHydrated();
    if (isAlreadyHydrated) {
      setHasHydrated(true);
    }

    return unsubscribe;
  }, []);

  return hasHydrated;
};
