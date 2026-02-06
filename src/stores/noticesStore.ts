import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Notices Store - Notices-specific preferences and read tracking
 *
 * NOTE: Event selection has been moved to src/stores/eventStore.ts
 * This store tracks seen notices per event and unread count for badge display.
 */

// Types for notices preferences
export interface NoticesPreferences {
  // Future preferences can be added here:
  // selectedCategory?: RegattaCategory | 'all';
  // searchHistory?: string[];
  // favoriteNotices?: string[];
}

interface NoticesState {
  // State
  preferences: NoticesPreferences;
  // Per-event seen notice IDs (since notices differ by event)
  seenNoticeIdsByEvent: Record<string, string[]>;
  // Unread count for badge display
  unreadCount: number;
  // Last time the user viewed the notices screen
  lastViewedAt: number | null;

  // Actions
  resetPreferences: () => void;
  markNoticesAsSeen: (eventId: string, noticeIds: string[]) => void;
  updateUnreadCount: (eventId: string, allNoticeIds: string[]) => void;
  clearUnread: () => void;
  resetStore: () => void;
}

// Default preferences
const defaultPreferences: NoticesPreferences = {};

export const useNoticesStore = create<NoticesState>()(
  persist(
    (set, get) => ({
      // Initial State
      preferences: defaultPreferences,
      seenNoticeIdsByEvent: {},
      unreadCount: 0,
      lastViewedAt: null,

      // Actions
      resetPreferences: () => {
        set({
          preferences: defaultPreferences
        });
      },

      markNoticesAsSeen: (eventId: string, noticeIds: string[]) => {
        const currentSeenByEvent = get().seenNoticeIdsByEvent;
        const currentSeen = currentSeenByEvent[eventId] || [];
        const combinedIds = [...currentSeen, ...noticeIds];
        // Remove duplicates
        const newSeen = combinedIds.filter((id, index) => combinedIds.indexOf(id) === index);
        set({
          seenNoticeIdsByEvent: {
            ...currentSeenByEvent,
            [eventId]: newSeen,
          },
          unreadCount: 0,
          lastViewedAt: Date.now(),
        });
      },

      updateUnreadCount: (eventId: string, allNoticeIds: string[]) => {
        const seenByEvent = get().seenNoticeIdsByEvent;
        const seenIds = new Set(seenByEvent[eventId] || []);
        const unseenCount = allNoticeIds.filter(id => !seenIds.has(id)).length;

        // Only update if there are actually new unseen notices
        if (unseenCount > 0) {
          set({ unreadCount: unseenCount });
        }
      },

      clearUnread: () => {
        set({ unreadCount: 0 });
      },

      resetStore: () => {
        set({
          preferences: defaultPreferences,
          seenNoticeIdsByEvent: {},
          unreadCount: 0,
          lastViewedAt: null,
        });
      },
    }),
    {
      name: 'dragon-worlds-notices',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain fields
      partialize: (state) => ({
        preferences: state.preferences,
        seenNoticeIdsByEvent: state.seenNoticeIdsByEvent,
        lastViewedAt: state.lastViewedAt,
      }),
    }
  )
);

// Selectors for easy access
export const useNoticesPreferences = () => useNoticesStore(state => state.preferences);
export const useNoticesUnreadCount = () => useNoticesStore(state => state.unreadCount);
export const useSeenNoticeIdsByEvent = () => useNoticesStore(state => state.seenNoticeIdsByEvent);

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
