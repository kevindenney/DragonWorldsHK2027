import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for notices preferences
export interface NoticesPreferences {
  selectedEventId: string;
  // Future preferences can be added here:
  // selectedCategory?: RegattaCategory | 'all';
  // searchHistory?: string[];
  // favoriteNotices?: string[];
}

interface NoticesState {
  // State
  preferences: NoticesPreferences;

  // Actions
  setSelectedEventId: (eventId: string) => void;
  resetPreferences: () => void;
}

// Default preferences with Asia Pacific Championships as default
const defaultPreferences: NoticesPreferences = {
  selectedEventId: 'asia-pacific-2026', // Default to Asia Pacific Championships
};

export const useNoticesStore = create<NoticesState>()(
  persist(
    (set, get) => ({
      // Initial State
      preferences: defaultPreferences,

      // Actions
      setSelectedEventId: (eventId: string) => {
        set(state => ({
          preferences: {
            ...state.preferences,
            selectedEventId: eventId
          }
        }));
      },

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
export const useSelectedEventId = () => useNoticesStore(state => state.preferences.selectedEventId);
export const useNoticesPreferences = () => useNoticesStore(state => state.preferences);

// Hook to check if the store has been hydrated
export const useNoticesStoreHydrated = () => {
  const [hasHydrated, setHasHydrated] = React.useState(false);

  React.useEffect(() => {
    console.log('[NoticesStore] Setting up hydration listener');

    const unsubscribe = useNoticesStore.persist.onFinishHydration(() => {
      console.log('[NoticesStore] Hydration finished');
      setHasHydrated(true);
    });

    // Also check if already hydrated
    const isAlreadyHydrated = useNoticesStore.persist.hasHydrated();
    console.log('[NoticesStore] Already hydrated?', isAlreadyHydrated);
    if (isAlreadyHydrated) {
      setHasHydrated(true);
    }

    return unsubscribe;
  }, []);

  return hasHydrated;
};