/**
 * Global Event Store
 *
 * Zustand store with AsyncStorage persistence for global event selection.
 * This replaces the repeated segmented controls across 9 screens with
 * a single source of truth for which championship the user is viewing.
 */

import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EventId,
  DEFAULT_EVENT_ID,
  normalizeEventId,
  getEventById,
  EventDefinition,
  EVENTS,
} from '../constants/events';

// Default: User participates in both events
const DEFAULT_PARTICIPATING_EVENTS: EventId[] = [
  EVENTS.APAC_2026.id,
  EVENTS.WORLDS_2027.id,
];

interface EventState {
  // State
  selectedEventId: EventId;
  participatingEventIds: EventId[]; // Events the user is participating in

  // Actions
  setSelectedEvent: (eventId: string) => void;
  toggleParticipation: (eventId: string) => void;
  setParticipatingEvents: (eventIds: string[]) => void;
  isParticipating: (eventId: string) => boolean;
  resetToDefault: () => void;
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      // Initial State - defaults to APAC 2026 for viewing, participating in both
      selectedEventId: DEFAULT_EVENT_ID,
      participatingEventIds: DEFAULT_PARTICIPATING_EVENTS,

      // Actions
      setSelectedEvent: (eventId: string) => {
        const normalizedId = normalizeEventId(eventId);
        set({ selectedEventId: normalizedId });
      },

      toggleParticipation: (eventId: string) => {
        const normalizedId = normalizeEventId(eventId);
        const currentParticipating = get().participatingEventIds;

        if (currentParticipating.includes(normalizedId)) {
          // Remove from participating (but keep at least one)
          if (currentParticipating.length > 1) {
            set({ participatingEventIds: currentParticipating.filter(id => id !== normalizedId) });
          }
        } else {
          // Add to participating
          set({ participatingEventIds: [...currentParticipating, normalizedId] });
        }
      },

      setParticipatingEvents: (eventIds: string[]) => {
        const normalizedIds = eventIds.map(normalizeEventId);
        set({ participatingEventIds: normalizedIds });
      },

      isParticipating: (eventId: string) => {
        const normalizedId = normalizeEventId(eventId);
        return get().participatingEventIds.includes(normalizedId);
      },

      resetToDefault: () => {
        set({
          selectedEventId: DEFAULT_EVENT_ID,
          participatingEventIds: DEFAULT_PARTICIPATING_EVENTS,
        });
      },
    }),
    {
      name: 'dragon-worlds-event-selection',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedEventId: state.selectedEventId,
        participatingEventIds: state.participatingEventIds,
      }),
      // Migrate from old noticesStore if needed
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure the event ID is normalized after rehydration
          const normalized = normalizeEventId(state.selectedEventId);
          if (normalized !== state.selectedEventId) {
            state.setSelectedEvent(normalized);
          }
          // Ensure participating events are set (migration for existing users)
          if (!state.participatingEventIds || state.participatingEventIds.length === 0) {
            state.setParticipatingEvents(DEFAULT_PARTICIPATING_EVENTS);
          }
        }
      },
    }
  )
);

// ============================================
// Convenience Hooks
// ============================================

/**
 * Hook to get the currently selected event ID
 */
export const useSelectedEvent = (): EventId => {
  return useEventStore((state) => state.selectedEventId);
};

/**
 * Hook to get the currently selected event definition with full metadata
 */
export const useSelectedEventDefinition = (): EventDefinition => {
  const eventId = useEventStore((state) => state.selectedEventId);
  return getEventById(eventId);
};

/**
 * Hook to get the setter function for changing the selected event
 */
export const useSetSelectedEvent = () => {
  return useEventStore((state) => state.setSelectedEvent);
};

/**
 * Hook to check if the store has been hydrated from AsyncStorage
 */
export const useEventStoreHydrated = (): boolean => {
  const [hasHydrated, setHasHydrated] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = useEventStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    // Check if already hydrated
    const isAlreadyHydrated = useEventStore.persist.hasHydrated();
    if (isAlreadyHydrated) {
      setHasHydrated(true);
    }

    return unsubscribe;
  }, []);

  return hasHydrated;
};

/**
 * Hook to get participating event IDs
 */
export const useParticipatingEvents = (): EventId[] => {
  return useEventStore((state) => state.participatingEventIds);
};

/**
 * Hook to check if user is participating in a specific event
 */
export const useIsParticipating = (eventId: string): boolean => {
  const participatingEventIds = useEventStore((state) => state.participatingEventIds);
  const normalizedId = normalizeEventId(eventId);
  return participatingEventIds.includes(normalizedId);
};

/**
 * Hook to get toggle participation function
 */
export const useToggleParticipation = () => {
  return useEventStore((state) => state.toggleParticipation);
};

/**
 * Combined hook that returns the selected event and setter
 * Useful for components that need both read and write access
 */
export const useEventSelection = () => {
  const selectedEventId = useSelectedEvent();
  const setSelectedEvent = useSetSelectedEvent();
  const eventDefinition = getEventById(selectedEventId);
  const isHydrated = useEventStoreHydrated();
  const participatingEventIds = useParticipatingEvents();
  const toggleParticipation = useToggleParticipation();

  return {
    selectedEventId,
    setSelectedEvent,
    eventDefinition,
    isHydrated,
    participatingEventIds,
    toggleParticipation,
  };
};
