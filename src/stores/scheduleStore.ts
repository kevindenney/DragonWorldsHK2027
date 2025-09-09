import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TypeScript interfaces
export interface Event {
  id: string;
  title: string;
  type: EventType;
  status: 'upcoming' | 'in-progress' | 'completed' | 'weather-hold' | 'cancelled';
  startTime: string;
  endTime?: string;
  date: string;
  location: {
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  description: string;
  participants?: number;
  sponsorAreas?: {
    titlePrefix?: string;
    locationSuffix?: string;
  };
}

export interface Race {
  id: string;
  eventId: string;
  raceNumber: number;
  className: string;
  status: 'scheduled' | 'starting' | 'racing' | 'finished' | 'abandoned';
  startTime: string;
  estimatedDuration: number; // in minutes
  course: string;
  windConditions?: {
    speed: number;
    direction: number;
  };
  participants: string[]; // competitor IDs
  results?: RaceResult[];
}

export interface RaceResult {
  sailNumber: string;
  position: number;
  finishTime?: string;
  points: number;
  disqualified?: boolean;
  didNotFinish?: boolean;
}

export type EventType = 'racing' | 'social' | 'meeting' | 'training';

export type SelectedEvent = 'Asia Pacific' | 'World Championship';

interface ScheduleState {
  // State
  events: Event[];
  races: Race[];
  selectedEvent: SelectedEvent;
  loading: boolean;
  lastSync: string | null;
  error: string | null;

  // Actions
  setSelectedEvent: (event: SelectedEvent) => void;
  updateEvents: (events: Event[]) => void;
  updateRaces: (races: Race[]) => void;
  refreshSchedule: () => Promise<void>;
  getEventsByDay: (date: string) => Event[];
  getCurrentRaces: () => Race[];
  getEventById: (id: string) => Event | undefined;
  getRaceById: (id: string) => Race | undefined;
  updateEventStatus: (eventId: string, status: Event['status']) => void;
  updateRaceStatus: (raceId: string, status: Race['status']) => void;
  addEvent: (event: Event) => void;
  removeEvent: (eventId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearEvents: () => void;
}

// Mock API functions
const fetchEventsFromAPI = async (selectedEvent: SelectedEvent): Promise<Event[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Skippers Meeting',
      type: 'meeting',
      status: 'upcoming',
      startTime: '09:00',
      date: '2024-11-21',
      location: {
        name: 'RHKYC Race Room',
        coordinates: { latitude: 22.2783, longitude: 114.1757 }
      },
      description: 'Mandatory attendance for all competitors. Race 3 & 4 briefing.',
      participants: 47
    },
    {
      id: '2',
      title: 'Race 3',
      type: 'racing',
      status: 'in-progress',
      startTime: '11:00',
      endTime: '13:30',
      date: '2024-11-21',
      location: {
        name: 'Racing Area (8nm out)',
        coordinates: { latitude: 22.3500, longitude: 114.2500 }
      },
      description: 'Fleet racing in 15kts NE wind, building conditions.',
      participants: 47
    }
  ];
  
  return mockEvents;
};

const fetchRacesFromAPI = async (): Promise<Race[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const mockRaces: Race[] = [
    {
      id: 'race-3',
      eventId: '2',
      raceNumber: 3,
      className: 'Dragon',
      status: 'racing',
      startTime: '11:00',
      estimatedDuration: 90,
      course: 'Windward-Leeward',
      windConditions: { speed: 15, direction: 45 },
      participants: ['HKG59', 'GBR8', 'AUS12']
    }
  ];
  
  return mockRaces;
};

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      // Initial State
      events: [],
      races: [],
      selectedEvent: 'World Championship',
      loading: false,
      lastSync: null,
      error: null,

      // Actions
      setSelectedEvent: (event: SelectedEvent) => {
        set({ selectedEvent: event });
        // Trigger refresh when event changes
        get().refreshSchedule();
      },

      updateEvents: (events: Event[]) => {
        set({ 
          events,
          lastSync: new Date().toISOString(),
          error: null
        });
      },

      updateRaces: (races: Race[]) => {
        set({ races });
      },

      refreshSchedule: async () => {
        const { selectedEvent } = get();
        
        set({ loading: true, error: null });
        
        try {
          const [events, races] = await Promise.all([
            fetchEventsFromAPI(selectedEvent),
            fetchRacesFromAPI()
          ]);
          
          set({
            events,
            races,
            lastSync: new Date().toISOString(),
            loading: false,
            error: null
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh schedule'
          });
        }
      },

      getEventsByDay: (date: string) => {
        const { events } = get();
        return events.filter(event => event.date === date);
      },

      getCurrentRaces: () => {
        const { races } = get();
        return races.filter(race => 
          race.status === 'starting' || 
          race.status === 'racing'
        );
      },

      getEventById: (id: string) => {
        const { events } = get();
        return events.find(event => event.id === id);
      },

      getRaceById: (id: string) => {
        const { races } = get();
        return races.find(race => race.id === id);
      },

      updateEventStatus: (eventId: string, status: Event['status']) => {
        set(state => ({
          events: state.events.map(event =>
            event.id === eventId ? { ...event, status } : event
          )
        }));
      },

      updateRaceStatus: (raceId: string, status: Race['status']) => {
        set(state => ({
          races: state.races.map(race =>
            race.id === raceId ? { ...race, status } : race
          )
        }));
      },

      addEvent: (event: Event) => {
        set(state => ({
          events: [...state.events, event]
        }));
      },

      removeEvent: (eventId: string) => {
        set(state => ({
          events: state.events.filter(event => event.id !== eventId)
        }));
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearEvents: () => {
        set({ 
          events: [], 
          races: [], 
          lastSync: null, 
          error: null 
        });
      }
    }),
    {
      name: 'dragon-worlds-schedule',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        events: state.events,
        races: state.races,
        selectedEvent: state.selectedEvent,
        lastSync: state.lastSync
      })
    }
  )
);

// Selectors for better performance
export const useEvents = () => useScheduleStore(state => state.events);
export const useRaces = () => useScheduleStore(state => state.races);
export const useSelectedEvent = () => useScheduleStore(state => state.selectedEvent);
export const useScheduleLoading = () => useScheduleStore(state => state.loading);
export const useScheduleError = () => useScheduleStore(state => state.error);
export const useCurrentRaces = () => useScheduleStore(state => state.getCurrentRaces());

// Computed selectors
export const useTodaysEvents = () => 
  useScheduleStore(state => {
    const today = new Date().toISOString().split('T')[0];
    return state.getEventsByDay(today);
  });

export const useUpcomingEvents = () =>
  useScheduleStore(state => 
    state.events
      .filter(event => event.status === 'upcoming')
      .sort((a, b) => new Date(a.date + 'T' + a.startTime).getTime() - 
                     new Date(b.date + 'T' + b.startTime).getTime())
  );