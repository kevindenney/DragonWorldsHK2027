import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Race {
  id: string;
  name: string;
  startTime: Date;
  status: 'upcoming' | 'active' | 'completed';
  course: string;
}

export interface Boat {
  id: string;
  sailNumber: string;
  skipper: string;
  crew?: string;
  class: string;
}

export interface Result {
  raceId: string;
  boatId: string;
  position: number;
  finishTime?: Date;
  points: number;
}

interface RegattaState {
  races: Race[];
  boats: Boat[];
  results: Result[];
  selectedRace: Race | null;
  
  // Actions
  setRaces: (races: Race[]) => void;
  setBoats: (boats: Boat[]) => void;
  setResults: (results: Result[]) => void;
  setSelectedRace: (race: Race | null) => void;
  addRace: (race: Race) => void;
  updateRace: (id: string, updates: Partial<Race>) => void;
  addResult: (result: Result) => void;
}

export const useRegattaStore = create<RegattaState>()(
  persist(
    (set, get) => ({
      races: [],
      boats: [],
      results: [],
      selectedRace: null,
      
      setRaces: (races) => set({ races }),
      setBoats: (boats) => set({ boats }),
      setResults: (results) => set({ results }),
      setSelectedRace: (race) => set({ selectedRace: race }),
      
      addRace: (race) => set((state) => ({
        races: [...state.races, race]
      })),
      
      updateRace: (id, updates) => set((state) => ({
        races: state.races.map(race => 
          race.id === id ? { ...race, ...updates } : race
        )
      })),
      
      addResult: (result) => set((state) => ({
        results: [...state.results, result]
      })),
    }),
    {
      name: 'regatta-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);