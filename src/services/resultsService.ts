import { UserStore } from '../stores/userStore';

export interface RaceResult {
  id: string;
  raceNumber: number;
  sailNumber: string;
  helmName: string;
  country: string;
  finishTime?: string;
  elapsedTime?: string;
  correctedTime?: string;
  position?: number;
  points: number;
  status: 'racing' | 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'retired';
  penalties?: Penalty[];
  splits?: RaceSplit[];
  isProvisional: boolean;
  lastUpdated: string;
}

export interface Penalty {
  id: string;
  type: 'time' | 'points' | 'disqualification';
  rule: string;
  description: string;
  timeAdded?: number; // seconds
  pointsPenalty?: number;
  appliedAt: string;
  appealable: boolean;
}

export interface RaceSplit {
  id: string;
  markName: string;
  position: number;
  timestamp: string;
  timeFromLeader: number; // seconds
  splitTime?: number; // time between marks
}

export interface ChampionshipStandings {
  sailNumber: string;
  helmName: string;
  country: string;
  club?: string;
  totalPoints: number;
  netPoints: number;
  position: number;
  raceResults: { [raceNumber: number]: RaceResultSummary };
  trend: 'up' | 'down' | 'same';
  trendChange?: number;
  isQualified: boolean;
  racesCompleted: number;
  bestResults: number[];
  worstResult?: number;
}

export interface RaceResultSummary {
  position?: number;
  points: number;
  status: RaceResult['status'];
  isDiscarded: boolean;
}

export interface LiveRaceData {
  raceId: string;
  raceNumber: number;
  status: 'not_started' | 'sequence' | 'racing' | 'finished' | 'abandoned' | 'postponed';
  startTime?: string;
  finishTime?: string;
  estimatedFinishTime?: string;
  course: RaceCourse;
  weather: RaceWeatherConditions;
  fleet: FleetPosition[];
  leaders: RaceResult[];
  lastUpdate: string;
  sequencePhase?: StartSequencePhase;
  nextRaceScheduled?: string;
}

export interface RaceCourse {
  name: string;
  distance: number; // nautical miles
  marks: CourseMark[];
  windDirection: number; // degrees
  description: string;
}

export interface CourseMark {
  name: string;
  position: number; // order in course
  latitude: number;
  longitude: number;
  roundingDirection: 'port' | 'starboard';
  isGate?: boolean;
}

export interface RaceWeatherConditions {
  windSpeed: number;
  windDirection: number;
  gustSpeed?: number;
  waveHeight?: number;
  current?: {
    speed: number;
    direction: number;
  };
  visibility: number;
  temperature: number;
  recordedAt: string;
}

export interface FleetPosition {
  sailNumber: string;
  helmName: string;
  latitude?: number;
  longitude?: number;
  position?: number;
  lastMark?: string;
  nextMark?: string;
  distanceToFinish?: number;
  estimatedFinishTime?: string;
  lastUpdate: string;
}

export interface StartSequencePhase {
  phase: 'warning' | 'preparatory' | 'start';
  timeRemaining: number; // seconds
  signals: StartSignal[];
}

export interface StartSignal {
  time: string;
  type: 'sound' | 'flag' | 'visual';
  description: string;
}

export interface RaceSchedule {
  id: string;
  raceNumber: number;
  scheduledStart: string;
  actualStart?: string;
  course: string;
  division?: string;
  status: 'scheduled' | 'delayed' | 'racing' | 'finished' | 'abandoned';
  delayReason?: string;
  estimatedStart?: string;
  windLimits: {
    minimum: number;
    maximum: number;
  };
  tideInfo?: {
    highTide: string;
    lowTide: string;
    current: string;
  };
}

export interface ResultsServiceConfig {
  baseUrl: string;
  apiKey: string;
  websocketUrl: string;
  updateInterval: number; // milliseconds
}

class ResultsService {
  private config: ResultsServiceConfig;
  private userStore: typeof UserStore;
  private websocket: WebSocket | null = null;
  private listeners: { [event: string]: Function[] } = {};

  constructor(userStore: typeof UserStore) {
    this.userStore = userStore;
    this.config = {
      baseUrl: process.env.EXPO_PUBLIC_RESULTS_API_URL || 'https://api.dragonworlds2027.com',
      apiKey: process.env.EXPO_PUBLIC_RESULTS_API_KEY || 'demo_key',
      websocketUrl: process.env.EXPO_PUBLIC_RESULTS_WS_URL || 'wss://ws.dragonworlds2027.com',
      updateInterval: 5000 // 5 seconds
    };
  }

  /**
   * Get live race data for current race
   */
  async getLiveRaceData(): Promise<LiveRaceData | null> {
    try {
      // Demo data for live race
      const currentTime = new Date();
      const raceStart = new Date(currentTime.getTime() - 45 * 60 * 1000); // Started 45 minutes ago
      
      return {
        raceId: 'race_3_day_2',
        raceNumber: 3,
        status: 'racing',
        startTime: raceStart.toISOString(),
        estimatedFinishTime: new Date(currentTime.getTime() + 30 * 60 * 1000).toISOString(),
        course: {
          name: 'Triangle Course',
          distance: 2.8,
          marks: [
            {
              name: 'Start Line',
              position: 0,
              latitude: 22.285,
              longitude: 114.165,
              roundingDirection: 'starboard'
            },
            {
              name: 'Windward Mark',
              position: 1,
              latitude: 22.295,
              longitude: 114.175,
              roundingDirection: 'port'
            },
            {
              name: 'Wing Mark',
              position: 2,
              latitude: 22.290,
              longitude: 114.155,
              roundingDirection: 'port'
            },
            {
              name: 'Leeward Gate',
              position: 3,
              latitude: 22.280,
              longitude: 114.160,
              roundingDirection: 'starboard',
              isGate: true
            }
          ],
          windDirection: 45,
          description: 'Triangle course with leeward gate finish'
        },
        weather: {
          windSpeed: 14,
          windDirection: 45,
          gustSpeed: 18,
          waveHeight: 1.2,
          visibility: 12,
          temperature: 24,
          recordedAt: new Date().toISOString()
        },
        fleet: this.generateDemoFleetPositions(),
        leaders: await this.getCurrentRaceResults(3, 10),
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching live race data:', error);
      return null;
    }
  }

  /**
   * Get results for a specific race
   */
  async getRaceResults(raceNumber: number): Promise<RaceResult[]> {
    try {
      return this.generateDemoRaceResults(raceNumber);
    } catch (error) {
      console.error('Error fetching race results:', error);
      throw new Error('Failed to load race results');
    }
  }

  /**
   * Get current race results (top N boats)
   */
  async getCurrentRaceResults(raceNumber: number, limit: number = 10): Promise<RaceResult[]> {
    try {
      const allResults = await this.getRaceResults(raceNumber);
      return allResults
        .filter(r => r.status === 'finished' || r.status === 'racing')
        .sort((a, b) => (a.position || 999) - (b.position || 999))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching current race results:', error);
      throw new Error('Failed to load current race results');
    }
  }

  /**
   * Get championship standings
   */
  async getChampionshipStandings(): Promise<ChampionshipStandings[]> {
    try {
      // Generate demo championship standings
      const sailors = [
        { sailNumber: 'HKG 59', helmName: 'Sarah Chen', country: 'HKG', club: 'Royal Hong Kong YC' },
        { sailNumber: 'AUS 123', helmName: 'James Wilson', country: 'AUS', club: 'Royal Sydney YS' },
        { sailNumber: 'GBR 456', helmName: 'Emma Thompson', country: 'GBR', club: 'Royal Yacht Squadron' },
        { sailNumber: 'USA 789', helmName: 'Michael Johnson', country: 'USA', club: 'San Diego YC' },
        { sailNumber: 'NZL 321', helmName: 'Kate Anderson', country: 'NZL', club: 'Royal NZ YS' },
        { sailNumber: 'SIN 654', helmName: 'Li Wei', country: 'SIN', club: 'Singapore SC' },
        { sailNumber: 'JPN 987', helmName: 'Yuki Tanaka', country: 'JPN', club: 'Hayama Marina' },
        { sailNumber: 'FRA 147', helmName: 'Pierre Dubois', country: 'FRA', club: 'YC de France' },
        { sailNumber: 'ITA 258', helmName: 'Marco Rossi', country: 'ITA', club: 'YC Italiano' },
        { sailNumber: 'GER 369', helmName: 'Klaus Weber', country: 'GER', club: 'Hamburger SV' }
      ];

      return sailors.map((sailor, index) => {
        const raceResults: { [raceNumber: number]: RaceResultSummary } = {};
        const results = [];
        
        // Generate results for 6 races
        for (let race = 1; race <= 6; race++) {
          const position = Math.max(1, Math.min(20, index + 1 + Math.floor(Math.random() * 10) - 5));
          const points = position <= 15 ? position : position + 5;
          
          raceResults[race] = {
            position,
            points,
            status: 'finished',
            isDiscarded: false
          };
          results.push(points);
        }

        // Calculate totals
        const sortedResults = [...results].sort((a, b) => a - b);
        const bestResults = sortedResults.slice(0, 5); // Drop worst result
        const totalPoints = results.reduce((sum, points) => sum + points, 0);
        const netPoints = bestResults.reduce((sum, points) => sum + points, 0);

        return {
          sailNumber: sailor.sailNumber,
          helmName: sailor.helmName,
          country: sailor.country,
          club: sailor.club,
          totalPoints,
          netPoints,
          position: index + 1,
          raceResults,
          trend: index < 3 ? 'up' : index > 6 ? 'down' : 'same',
          trendChange: Math.floor(Math.random() * 3),
          isQualified: netPoints < 100,
          racesCompleted: 6,
          bestResults,
          worstResult: Math.max(...results)
        };
      }).sort((a, b) => a.netPoints - b.netPoints).map((sailor, index) => ({
        ...sailor,
        position: index + 1
      }));
    } catch (error) {
      console.error('Error fetching championship standings:', error);
      throw new Error('Failed to load championship standings');
    }
  }

  /**
   * Get race schedule
   */
  async getRaceSchedule(): Promise<RaceSchedule[]> {
    try {
      const today = new Date();
      const schedule: RaceSchedule[] = [];

      for (let day = 0; day < 5; day++) {
        const raceDate = new Date(today.getTime() + day * 24 * 60 * 60 * 1000);
        
        // 2 races per day
        for (let raceOfDay = 1; raceOfDay <= 2; raceOfDay++) {
          const raceNumber = day * 2 + raceOfDay;
          const startTime = new Date(raceDate);
          startTime.setHours(raceOfDay === 1 ? 13 : 15, raceOfDay === 1 ? 0 : 30, 0, 0);

          let status: RaceSchedule['status'] = 'scheduled';
          if (raceNumber <= 3) status = 'finished';
          else if (raceNumber === 4) status = 'racing';

          schedule.push({
            id: `race_${raceNumber}`,
            raceNumber,
            scheduledStart: startTime.toISOString(),
            actualStart: status === 'finished' || status === 'racing' ? 
              new Date(startTime.getTime() + Math.random() * 15 * 60 * 1000).toISOString() : 
              undefined,
            course: raceOfDay === 1 ? 'Triangle Course' : 'Windward-Leeward',
            division: 'Open',
            status,
            windLimits: {
              minimum: 8,
              maximum: 25
            },
            tideInfo: {
              highTide: '14:30',
              lowTide: '20:45',
              current: '0.8 knots NE'
            }
          });
        }
      }

      return schedule;
    } catch (error) {
      console.error('Error fetching race schedule:', error);
      throw new Error('Failed to load race schedule');
    }
  }

  /**
   * Start real-time updates via WebSocket
   */
  startLiveUpdates(onUpdate: (data: LiveRaceData) => void): void {
    try {
      // In a real implementation, this would connect to a WebSocket
      // For demo, we'll simulate updates with polling
      
      const updateInterval = setInterval(async () => {
        try {
          const liveData = await this.getLiveRaceData();
          if (liveData) {
            onUpdate(liveData);
          }
        } catch (error) {
          console.error('Error in live update:', error);
        }
      }, this.config.updateInterval);

      // Store interval for cleanup
      this.listeners['liveUpdate'] = [() => clearInterval(updateInterval)];
      
    } catch (error) {
      console.error('Error starting live updates:', error);
    }
  }

  /**
   * Stop real-time updates
   */
  stopLiveUpdates(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    // Clear all intervals
    this.listeners['liveUpdate']?.forEach(cleanup => cleanup());
    delete this.listeners['liveUpdate'];
  }

  /**
   * Get user's personal results (if participant)
   */
  async getPersonalResults(): Promise<{
    sailor: ChampionshipStandings;
    recentRaces: RaceResult[];
    nextRace?: RaceSchedule;
  } | null> {
    try {
      const user = this.userStore.getState();
      
      if (user.userType !== 'participant') {
        return null;
      }

      // For demo, assume user is "HKG 59"
      const standings = await this.getChampionshipStandings();
      const sailor = standings.find(s => s.sailNumber === 'HKG 59');
      
      if (!sailor) return null;

      const recentRaces = await this.getRaceResults(3); // Most recent race
      const schedule = await this.getRaceSchedule();
      const nextRace = schedule.find(r => r.status === 'scheduled');

      return {
        sailor,
        recentRaces: recentRaces.filter(r => r.sailNumber === sailor.sailNumber),
        nextRace
      };
    } catch (error) {
      console.error('Error fetching personal results:', error);
      throw new Error('Failed to load personal results');
    }
  }

  /**
   * Generate demo race results
   */
  private generateDemoRaceResults(raceNumber: number): RaceResult[] {
    const sailors = [
      { sailNumber: 'HKG 59', helmName: 'Sarah Chen', country: 'HKG' },
      { sailNumber: 'AUS 123', helmName: 'James Wilson', country: 'AUS' },
      { sailNumber: 'GBR 456', helmName: 'Emma Thompson', country: 'GBR' },
      { sailNumber: 'USA 789', helmName: 'Michael Johnson', country: 'USA' },
      { sailNumber: 'NZL 321', helmName: 'Kate Anderson', country: 'NZL' }
    ];

    return sailors.map((sailor, index) => {
      const position = index + 1;
      const finishTime = new Date();
      finishTime.setMinutes(finishTime.getMinutes() - (30 - index * 2));

      return {
        id: `${raceNumber}_${sailor.sailNumber}`,
        raceNumber,
        sailNumber: sailor.sailNumber,
        helmName: sailor.helmName,
        country: sailor.country,
        finishTime: finishTime.toISOString(),
        elapsedTime: `${35 + index * 2}:${String(15 + index * 3).padStart(2, '0')}`,
        correctedTime: `${35 + index * 2}:${String(10 + index * 2).padStart(2, '0')}`,
        position,
        points: position,
        status: 'finished',
        penalties: index === 2 ? [{
          id: 'penalty_1',
          type: 'time',
          rule: 'Rule 14',
          description: 'Contact with another boat',
          timeAdded: 300, // 5 minutes
          appliedAt: finishTime.toISOString(),
          appealable: true
        }] : [],
        isProvisional: raceNumber >= 3,
        lastUpdated: new Date().toISOString()
      };
    });
  }

  /**
   * Generate demo fleet positions
   */
  private generateDemoFleetPositions(): FleetPosition[] {
    const sailors = [
      { sailNumber: 'HKG 59', helmName: 'Sarah Chen' },
      { sailNumber: 'AUS 123', helmName: 'James Wilson' },
      { sailNumber: 'GBR 456', helmName: 'Emma Thompson' },
      { sailNumber: 'USA 789', helmName: 'Michael Johnson' },
      { sailNumber: 'NZL 321', helmName: 'Kate Anderson' }
    ];

    return sailors.map((sailor, index) => ({
      sailNumber: sailor.sailNumber,
      helmName: sailor.helmName,
      latitude: 22.285 + (Math.random() - 0.5) * 0.02,
      longitude: 114.165 + (Math.random() - 0.5) * 0.02,
      position: index + 1,
      lastMark: 'Windward Mark',
      nextMark: 'Wing Mark',
      distanceToFinish: 1.2 - (index * 0.2),
      estimatedFinishTime: new Date(Date.now() + (20 - index * 3) * 60 * 1000).toISOString(),
      lastUpdate: new Date().toISOString()
    }));
  }
}

export default ResultsService;