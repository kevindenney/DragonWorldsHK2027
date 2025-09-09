import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResultsService, {
  LiveRaceData,
  ChampionshipStandings,
  RaceSchedule,
  RaceResult as ServiceRaceResult
} from '../services/resultsService';
import { useUserStore } from './userStore';

// TypeScript interfaces
export interface Competitor {
  id: string;
  sailNumber: string;
  country: string;
  countryCode: string; // ISO country code
  skipper: string;
  crew?: string[];
  teamName?: string;
  yacht: {
    name?: string;
    builder?: string;
    year?: number;
    sailmaker?: string;
  };
  isVerified: boolean;
  participantType: 'competitor' | 'reserve' | 'withdrawn';
  registrationDate: string;
}

export interface RaceResult {
  id: string;
  raceId: string;
  raceNumber: number;
  sailNumber: string;
  competitorId: string;
  position: number | null; // null for DNS, DNF, DSQ
  points: number;
  finishTime?: string;
  correctedTime?: string;
  status: 'finished' | 'dnf' | 'dns' | 'dsq' | 'ret' | 'ocs';
  penalty?: {
    type: 'time' | 'points' | 'disqualification';
    amount: number;
    reason: string;
  };
  splits?: RaceSplit[];
}

export interface RaceSplit {
  mark: string;
  time: string;
  position: number;
  timeBehindLeader: number;
}

export interface Race {
  id: string;
  number: number;
  name: string;
  date: string;
  startTime: string;
  status: 'scheduled' | 'starting' | 'racing' | 'finished' | 'abandoned';
  course: string;
  windConditions?: {
    speed: number;
    direction: number;
    conditions: string;
  };
  results: RaceResult[];
  isDiscardable: boolean;
}

export interface SeriesStanding {
  position: number;
  sailNumber: string;
  competitorId: string;
  totalPoints: number;
  netPoints: number;
  raceScores: (number | string)[]; // Numbers or codes like 'DNF', 'DSQ'
  discards: number[];
  tieBreaker?: string;
}

export interface Championship {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  raceCount: number;
  discardCount: number;
  scoringSystem: 'low-point' | 'high-point' | 'bonus-point';
  classes: string[];
}

interface ResultsState {
  // Service
  resultsService: ResultsService;
  
  // State
  championship: Championship | null;
  competitors: Competitor[];
  races: Race[];
  overallStandings: SeriesStanding[];
  championshipStandings: ChampionshipStandings[];
  raceResults: RaceResult[];
  currentRace: Race | null;
  liveRaceData: LiveRaceData | null;
  raceSchedule: RaceSchedule[];
  personalResults: {
    sailor: ChampionshipStandings;
    recentRaces: ServiceRaceResult[];
    nextRace?: RaceSchedule;
  } | null;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  
  // Filters and views
  selectedClass: string | 'all';
  standingsView: 'overall' | 'after-discards' | 'current-race';
  
  // Actions
  updateStandings: (standings: SeriesStanding[]) => void;
  updateChampionshipStandings: (standings: ChampionshipStandings[]) => void;
  addRaceResult: (result: RaceResult) => void;
  updateRaceResults: (raceId: string, results: RaceResult[]) => void;
  updateCompetitorInfo: (competitorId: string, updates: Partial<Competitor>) => void;
  setCurrentRace: (race: Race | null) => void;
  setLiveRaceData: (data: LiveRaceData | null) => void;
  refreshResults: () => Promise<void>;
  refreshLiveData: () => Promise<void>;
  refreshSchedule: () => Promise<void>;
  refreshPersonalResults: () => Promise<void>;
  startLiveUpdates: () => void;
  stopLiveUpdates: () => void;
  
  // Results calculation
  calculateStandings: () => SeriesStanding[];
  getCompetitorResults: (competitorId: string) => RaceResult[];
  getCompetitorStanding: (competitorId: string) => SeriesStanding | undefined;
  getRaceLeaderboard: (raceId: string) => RaceResult[];
  
  // Competitor management
  addCompetitor: (competitor: Competitor) => void;
  updateCompetitor: (competitorId: string, updates: Partial<Competitor>) => void;
  getCompetitorById: (id: string) => Competitor | undefined;
  getCompetitorBySailNumber: (sailNumber: string) => Competitor | undefined;
  
  // Race management
  addRace: (race: Race) => void;
  updateRace: (raceId: string, updates: Partial<Race>) => void;
  getRaceById: (id: string) => Race | undefined;
  getCompletedRaces: () => Race[];
  
  // Scoring
  calculateRacePoints: (position: number, participantCount: number) => number;
  applyDiscards: (results: RaceResult[]) => RaceResult[];
  resolveTieBreaker: (standings: SeriesStanding[]) => SeriesStanding[];
  
  // Filters
  setSelectedClass: (className: string | 'all') => void;
  setStandingsView: (view: ResultsState['standingsView']) => void;
  filterCompetitorsByClass: (className: string) => Competitor[];
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearResults: () => void;
}

// Sailing scoring system
const calculateLowPointScore = (position: number | null, participantCount: number, status: RaceResult['status']): number => {
  switch (status) {
    case 'finished':
      return position || participantCount + 1;
    case 'dnf':
    case 'ret':
      return participantCount + 1;
    case 'dns':
      return participantCount + 1;
    case 'dsq':
    case 'ocs':
      return participantCount + 1;
    default:
      return participantCount + 1;
  }
};

// Mock API functions
const fetchResultsFromAPI = async (): Promise<{
  competitors: Competitor[];
  races: Race[];
  championship: Championship;
}> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockCompetitors: Competitor[] = [
    {
      id: 'comp-1',
      sailNumber: 'HKG 59',
      country: 'Hong Kong',
      countryCode: 'HK',
      skipper: 'B. Van Olphen',
      crew: ['J. Smith'],
      yacht: { name: 'Dragon Fire', builder: 'Petticrows', year: 2018 },
      isVerified: true,
      participantType: 'competitor',
      registrationDate: '2024-10-15T00:00:00Z'
    },
    {
      id: 'comp-2',
      sailNumber: 'GBR 8',
      country: 'Great Britain',
      countryCode: 'GB',
      skipper: 'J. Wilson',
      crew: ['M. Taylor', 'S. Brown'],
      yacht: { name: 'Celtic Spirit', builder: 'Bordy', year: 2020 },
      isVerified: true,
      participantType: 'competitor',
      registrationDate: '2024-10-12T00:00:00Z'
    },
    {
      id: 'comp-3',
      sailNumber: 'AUS 12',
      country: 'Australia',
      countryCode: 'AU',
      skipper: 'S. Mitchell',
      crew: ['P. Johnson'],
      yacht: { name: 'Southern Cross', builder: 'Petticrows', year: 2019 },
      isVerified: true,
      participantType: 'competitor',
      registrationDate: '2024-10-10T00:00:00Z'
    }
  ];
  
  const mockRaces: Race[] = [
    {
      id: 'race-1',
      number: 1,
      name: 'Race 1',
      date: '2024-11-20',
      startTime: '11:00',
      status: 'finished',
      course: 'Windward-Leeward',
      windConditions: { speed: 12, direction: 45, conditions: 'Moderate' },
      results: [
        {
          id: 'result-1-1',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'GBR 8',
          competitorId: 'comp-2',
          position: 1,
          points: 1,
          finishTime: '12:45:32',
          status: 'finished'
        },
        {
          id: 'result-1-2',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'HKG 59',
          competitorId: 'comp-1',
          position: 2,
          points: 2,
          finishTime: '12:45:45',
          status: 'finished'
        }
      ],
      isDiscardable: true
    }
  ];
  
  const mockChampionship: Championship = {
    id: 'dragon-worlds-2027',
    name: 'Dragon World Championships 2027',
    startDate: '2024-11-18',
    endDate: '2024-11-24',
    venue: 'Hong Kong',
    raceCount: 12,
    discardCount: 2,
    scoringSystem: 'low-point',
    classes: ['Dragon']
  };
  
  return { competitors: mockCompetitors, races: mockRaces, championship: mockChampionship };
};

export const useResultsStore = create<ResultsState>()(
  persist(
    (set, get) => ({
      // Initialize Results Service
      resultsService: new ResultsService(useUserStore),
      
      // Initial State
      championship: null,
      competitors: [],
      races: [],
      overallStandings: [],
      championshipStandings: [],
      raceResults: [],
      currentRace: null,
      liveRaceData: null,
      raceSchedule: [],
      personalResults: null,
      loading: false,
      error: null,
      lastUpdate: null,
      
      selectedClass: 'all',
      standingsView: 'after-discards',

      // Actions
      updateStandings: (standings: SeriesStanding[]) => {
        set({ overallStandings: standings });
      },

      updateChampionshipStandings: (standings: ChampionshipStandings[]) => {
        set({ championshipStandings: standings });
      },

      addRaceResult: (result: RaceResult) => {
        set(state => ({
          raceResults: [...state.raceResults.filter(r => r.id !== result.id), result]
        }));
      },

      updateRaceResults: (raceId: string, results: RaceResult[]) => {
        set(state => ({
          raceResults: [
            ...state.raceResults.filter(r => r.raceId !== raceId),
            ...results
          ],
          races: state.races.map(race =>
            race.id === raceId ? { ...race, results } : race
          )
        }));
        
        // Recalculate standings
        get().calculateStandings();
      },

      updateCompetitorInfo: (competitorId: string, updates: Partial<Competitor>) => {
        set(state => ({
          competitors: state.competitors.map(comp =>
            comp.id === competitorId ? { ...comp, ...updates } : comp
          )
        }));
      },

      setCurrentRace: (race: Race | null) => {
        set({ currentRace: race });
      },

      setLiveRaceData: (data: LiveRaceData | null) => {
        set({ liveRaceData: data });
      },

      refreshLiveData: async () => {
        try {
          const liveData = await get().resultsService.getLiveRaceData();
          set({ liveRaceData: liveData, lastUpdate: new Date().toISOString() });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh live data'
          });
        }
      },

      refreshSchedule: async () => {
        set({ loading: true, error: null });
        
        try {
          const schedule = await get().resultsService.getRaceSchedule();
          set({ 
            raceSchedule: schedule,
            lastUpdate: new Date().toISOString(),
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

      refreshPersonalResults: async () => {
        try {
          const personalResults = await get().resultsService.getPersonalResults();
          set({ 
            personalResults,
            lastUpdate: new Date().toISOString()
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh personal results'
          });
        }
      },

      startLiveUpdates: () => {
        const { resultsService, setLiveRaceData } = get();
        resultsService.startLiveUpdates((liveData) => {
          setLiveRaceData(liveData);
        });
      },

      stopLiveUpdates: () => {
        const { resultsService } = get();
        resultsService.stopLiveUpdates();
      },

      refreshResults: async () => {
        set({ loading: true, error: null });
        
        try {
          const { resultsService } = get();
          
          // Load championship standings and schedule in parallel
          const [
            championshipStandings,
            schedule,
            { competitors, races, championship }
          ] = await Promise.all([
            resultsService.getChampionshipStandings(),
            resultsService.getRaceSchedule(),
            fetchResultsFromAPI() // Keep existing mock data for now
          ]);
          
          // Flatten all race results
          const allResults = races.flatMap(race => race.results);
          
          set({
            competitors,
            races,
            championship,
            championshipStandings,
            raceSchedule: schedule,
            raceResults: allResults,
            lastUpdate: new Date().toISOString(),
            loading: false,
            error: null
          });
          
          // Calculate standings and load personal results
          get().calculateStandings();
          get().refreshPersonalResults();
          
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh results'
          });
        }
      },

      // Results calculation
      calculateStandings: () => {
        const { competitors, raceResults, championship } = get();
        
        if (!championship || competitors.length === 0) {
          set({ overallStandings: [] });
          return [];
        }
        
        const standings: SeriesStanding[] = competitors.map(competitor => {
          const competitorResults = raceResults.filter(r => r.competitorId === competitor.id);
          const raceScores = competitorResults.map(r => r.status === 'finished' ? r.points : r.status.toUpperCase());
          
          // Calculate total and net points with discards
          const pointsOnly = competitorResults
            .filter(r => r.status === 'finished')
            .map(r => r.points)
            .sort((a, b) => a - b);
          
          const totalPoints = pointsOnly.reduce((sum, points) => sum + points, 0);
          const discardCount = Math.min(championship.discardCount, Math.max(0, pointsOnly.length - 3));
          const discards = pointsOnly.slice(0, discardCount);
          const netPoints = totalPoints - discards.reduce((sum, points) => sum + points, 0);
          
          return {
            position: 0, // Will be set after sorting
            sailNumber: competitor.sailNumber,
            competitorId: competitor.id,
            totalPoints,
            netPoints,
            raceScores,
            discards
          };
        });
        
        // Sort by net points (low point system)
        standings.sort((a, b) => a.netPoints - b.netPoints);
        
        // Assign positions
        standings.forEach((standing, index) => {
          standing.position = index + 1;
        });
        
        set({ overallStandings: standings });
        return standings;
      },

      getCompetitorResults: (competitorId: string) => {
        const { raceResults } = get();
        return raceResults.filter(result => result.competitorId === competitorId);
      },

      getCompetitorStanding: (competitorId: string) => {
        const { overallStandings } = get();
        return overallStandings.find(standing => standing.competitorId === competitorId);
      },

      getRaceLeaderboard: (raceId: string) => {
        const { raceResults } = get();
        return raceResults
          .filter(result => result.raceId === raceId)
          .sort((a, b) => (a.position || 999) - (b.position || 999));
      },

      // Competitor management
      addCompetitor: (competitor: Competitor) => {
        set(state => ({
          competitors: [...state.competitors, competitor]
        }));
      },

      updateCompetitor: (competitorId: string, updates: Partial<Competitor>) => {
        set(state => ({
          competitors: state.competitors.map(comp =>
            comp.id === competitorId ? { ...comp, ...updates } : comp
          )
        }));
      },

      getCompetitorById: (id: string) => {
        const { competitors } = get();
        return competitors.find(comp => comp.id === id);
      },

      getCompetitorBySailNumber: (sailNumber: string) => {
        const { competitors } = get();
        return competitors.find(comp => comp.sailNumber === sailNumber);
      },

      // Race management
      addRace: (race: Race) => {
        set(state => ({
          races: [...state.races, race]
        }));
      },

      updateRace: (raceId: string, updates: Partial<Race>) => {
        set(state => ({
          races: state.races.map(race =>
            race.id === raceId ? { ...race, ...updates } : race
          )
        }));
      },

      getRaceById: (id: string) => {
        const { races } = get();
        return races.find(race => race.id === id);
      },

      getCompletedRaces: () => {
        const { races } = get();
        return races.filter(race => race.status === 'finished');
      },

      // Scoring
      calculateRacePoints: (position: number, participantCount: number) => {
        return calculateLowPointScore(position, participantCount, 'finished');
      },

      applyDiscards: (results: RaceResult[]) => {
        const { championship } = get();
        if (!championship) return results;
        
        // Sort results by points (best first)
        const sortedResults = [...results].sort((a, b) => a.points - b.points);
        
        // Apply discards to worst results
        const discardCount = Math.min(championship.discardCount, Math.max(0, results.length - 3));
        const discardedResults = sortedResults.slice(-discardCount);
        
        return results.map(result => ({
          ...result,
          isDiscarded: discardedResults.some(dr => dr.id === result.id)
        })) as RaceResult[];
      },

      resolveTieBreaker: (standings: SeriesStanding[]) => {
        // Implement sailing tie-breaking rules
        return standings.sort((a, b) => {
          if (a.netPoints !== b.netPoints) {
            return a.netPoints - b.netPoints;
          }
          
          // Tie-breaker: most first places, then most second places, etc.
          const aResults = a.raceScores.filter(score => typeof score === 'number') as number[];
          const bResults = b.raceScores.filter(score => typeof score === 'number') as number[];
          
          for (let pos = 1; pos <= Math.max(aResults.length, bResults.length); pos++) {
            const aCount = aResults.filter(score => score === pos).length;
            const bCount = bResults.filter(score => score === pos).length;
            
            if (aCount !== bCount) {
              return bCount - aCount; // More better finishes wins
            }
          }
          
          return 0; // Still tied
        });
      },

      // Filters
      setSelectedClass: (className: string | 'all') => {
        set({ selectedClass: className });
      },

      setStandingsView: (view: ResultsState['standingsView']) => {
        set({ standingsView: view });
      },

      filterCompetitorsByClass: (className: string) => {
        const { competitors } = get();
        if (className === 'all') return competitors;
        
        // For Dragon class, all competitors are in same class
        return competitors.filter(comp => comp.participantType === 'competitor');
      },

      // Utility actions
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearResults: () => {
        set({
          competitors: [],
          races: [],
          overallStandings: [],
          raceResults: [],
          currentRace: null,
          championship: null,
          lastUpdate: null,
          error: null
        });
      }
    }),
    {
      name: 'dragon-worlds-results',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        competitors: state.competitors,
        races: state.races,
        overallStandings: state.overallStandings,
        championshipStandings: state.championshipStandings,
        raceResults: state.raceResults,
        championship: state.championship,
        raceSchedule: state.raceSchedule,
        personalResults: state.personalResults,
        selectedClass: state.selectedClass,
        standingsView: state.standingsView,
        lastUpdate: state.lastUpdate
      })
    }
  )
);

// Selectors
export const useCompetitors = () => useResultsStore(state => state.competitors);
export const useRaces = () => useResultsStore(state => state.races);
export const useOverallStandings = () => useResultsStore(state => state.overallStandings);
export const useChampionshipStandings = () => useResultsStore(state => state.championshipStandings);
export const useLiveRaceData = () => useResultsStore(state => state.liveRaceData);
export const useRaceSchedule = () => useResultsStore(state => state.raceSchedule);
export const usePersonalResults = () => useResultsStore(state => state.personalResults);
export const useCurrentRace = () => useResultsStore(state => state.currentRace);
export const useResultsLoading = () => useResultsStore(state => state.loading);
export const useResultsError = () => useResultsStore(state => state.error);

// Computed selectors
export const useTopStandings = (count: number = 10) =>
  useResultsStore(state => state.overallStandings.slice(0, count));

export const useCompetitorStanding = (competitorId: string) =>
  useResultsStore(state => state.getCompetitorStanding(competitorId));

export const useRaceLeaderboard = (raceId: string) =>
  useResultsStore(state => state.getRaceLeaderboard(raceId));

export const useCompletedRaces = () =>
  useResultsStore(state => state.getCompletedRaces());

export const useChampionshipInfo = () =>
  useResultsStore(state => state.championship);