import { useUserStore } from '../stores/userStore';
import { Championship, ChampionshipCompetitor, MOCK_CHAMPIONSHIPS, COUNTRY_FLAGS } from '../data/mockChampionshipData';
import { externalUrls } from '../config/externalUrls';

// Type for user store state getter
type UserStoreType = typeof useUserStore;

// Cloud function response types
interface CloudFunctionRaceScore {
  points: number | null;
  position: number | null;
  isDiscarded: boolean;
  status: string;
}

interface CloudFunctionStanding {
  position: number;
  sailNumber: string;
  helmName: string;
  crewName: string | null;
  club: string | null;
  totalPoints: number | null;
  netPoints: number | null;
  raceScores: CloudFunctionRaceScore[];
}

interface CloudFunctionMetadata {
  scrapedAt: string;
  source: string;
  totalRaces: number;
  completedRaces: number;
  totalCompetitors: number;
  scoringSystem: string;
  lastRaceDate: string | null;
}

interface CloudFunctionResponse {
  eventId: string;
  eventName: string;
  lastUpdated: string;
  races: any[];
  overallStandings: CloudFunctionStanding[];
  divisions: any[];
  metadata: CloudFunctionMetadata;
}

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
  finishPosition?: number; // Alias for position
  points: number;
  status: 'racing' | 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'retired';
  penalties?: Penalty[];
  splits?: RaceSplit[];
  isProvisional: boolean;
  lastUpdated: string;
  courseProgress?: number; // Progress through the course (0-100%)
  gapToLeader?: string; // Time gap to leader
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
  status?: 'racing' | 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'retired';
  lastMark?: string;
  nextMark?: string;
  distanceToFinish?: number;
  estimatedFinishTime?: string;
  lastUpdate: string;
  courseProgress?: number; // Progress through the course (0-100%)
  // Live tracking properties
  heading?: number; // Compass heading in degrees
  speed?: number; // Speed in knots
  trail?: Array<{ latitude: number; longitude: number; timestamp: string }>; // Position history
}

// Type alias for live race position tracking
export type LiveRacePosition = FleetPosition;

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

// Event ID mapping
const EVENT_ID_MAP: Record<string, string> = {
  'asia-pacific-2026': '13241',
  'dragon-world-2026': '13242',
  'dragon-worlds-2027': '13242',
};

// Reverse mapping for Championship ID lookup
const CHAMPIONSHIP_ID_MAP: Record<string, string> = {
  '13241': 'asia-pacific-2026',
  '13242': 'dragon-world-2026',
};

class ResultsService {
  private config: ResultsServiceConfig;
  private userStore: UserStoreType;
  private websocket: WebSocket | null = null;
  private listeners: { [event: string]: Function[] } = {};

  // Cache for championship data
  private cache: Map<string, Championship> = new Map();
  private lastFetchTime: Map<string, number> = new Map();
  private cacheDuration = 300000; // 5 minutes in milliseconds

  // Dev mode toggle to force mock data
  private forceMockData: boolean = false;

  constructor(userStore: UserStoreType) {
    this.userStore = userStore;
    this.config = {
      baseUrl: process.env.EXPO_PUBLIC_RESULTS_API_URL || 'https://api.dragonworlds2027.com',
      apiKey: process.env.EXPO_PUBLIC_RESULTS_API_KEY || 'demo_key',
      websocketUrl: process.env.EXPO_PUBLIC_RESULTS_WS_URL || 'wss://ws.dragonworlds2027.com',
      updateInterval: 5000 // 5 seconds
    };
  }

  /**
   * Get championship data with caching
   * @param eventId - The event ID (e.g., 'asia-pacific-2026' or '13241')
   * @param forceRefresh - Bypass cache and fetch fresh data
   * @returns Championship data, or null if unavailable
   * @throws Error if network fails and no cache is available
   *
   * NOTE: This method does NOT fall back to mock data on errors.
   * - Empty results (no races posted yet) → returns Championship with 0 competitors
   * - Network/API errors → throws error (UI should show error state)
   * - Dev mode with forceMockData → returns bundled mock data (for testing only)
   */
  async getChampionship(eventId: string, forceRefresh: boolean = false): Promise<Championship> {
    // Normalize event ID (support both app event IDs and cloud function event IDs)
    const cloudEventId = EVENT_ID_MAP[eventId] || eventId;
    const cacheKey = cloudEventId;

    // Dev mode: force mock data if enabled (for UI testing only)
    if (__DEV__ && this.forceMockData) {
      console.log('[ResultsService] Dev mode: returning mock data');
      // Update last fetch time for consistency with timestamp display
      this.lastFetchTime.set(cacheKey, Date.now());
      return this.getBundledChampionship(cloudEventId);
    }

    // Check cache validity
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`[ResultsService] Returning cached data for ${eventId}`);
        return cached;
      }
    }

    try {
      console.log(`[ResultsService] Fetching live results for ${eventId}...`);
      const championship = await this.fetchLiveResults(cloudEventId);

      // Update cache
      this.cache.set(cacheKey, championship);
      this.lastFetchTime.set(cacheKey, Date.now());

      console.log(`[ResultsService] Got ${championship.competitors.length} competitors for ${eventId}`);
      return championship;
    } catch (error) {
      console.error(`[ResultsService] Error fetching ${eventId}:`, error);

      // Return cached data if available (even if expired) - this is acceptable
      // because it's real data from a previous successful fetch
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        console.log(`[ResultsService] Returning expired cache for ${eventId}`);
        return cachedData;
      }

      // DO NOT fall back to mock data - propagate the error so UI can show error state
      // This prevents users from seeing fake results when there's a real network issue
      throw error;
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(eventId: string): boolean {
    const lastFetch = this.lastFetchTime.get(eventId);
    if (!lastFetch) return false;
    return Date.now() - lastFetch < this.cacheDuration;
  }

  /**
   * Fetch live results from cloud function
   */
  private async fetchLiveResults(eventId: string): Promise<Championship> {
    const url = `${externalUrls.cloudFunctions.scrapeRaceData}?eventId=${eventId}&type=results&useCache=true`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: CloudFunctionResponse = await response.json();
    return this.transformToChampionship(data, eventId);
  }

  /**
   * Transform cloud function response to app's Championship type
   */
  private transformToChampionship(response: CloudFunctionResponse, eventId: string): Championship {
    const championshipId = CHAMPIONSHIP_ID_MAP[eventId] || eventId;
    const bundled = MOCK_CHAMPIONSHIPS.find(c => c.id === championshipId);

    // Extract country code from sail number (e.g., "HKG 59" -> "HKG" -> "HK")
    const getCountryCode = (sailNumber: string): string => {
      const match = sailNumber.match(/^([A-Z]{2,3})/);
      if (!match) return 'XX';
      const code = match[1];
      // Convert 3-letter to 2-letter if needed
      const codeMap: Record<string, string> = {
        'HKG': 'HK', 'GBR': 'GB', 'AUS': 'AU', 'USA': 'US', 'NZL': 'NZ',
        'SIN': 'SG', 'JPN': 'JP', 'FRA': 'FR', 'GER': 'DE', 'ITA': 'IT',
        'ESP': 'ES', 'NED': 'NL', 'DEN': 'DK', 'SWE': 'SE', 'NOR': 'NO',
      };
      return codeMap[code] || code.substring(0, 2);
    };

    const competitors: ChampionshipCompetitor[] = response.overallStandings.map((standing) => {
      const countryCode = getCountryCode(standing.sailNumber);
      const countryFlag = COUNTRY_FLAGS[countryCode] || '🏳️';

      // Extract race results (positions)
      const raceResults = standing.raceScores.map(score =>
        score.position || score.points || 0
      );

      // Extract discards (race results that are discarded)
      const discards = standing.raceScores
        .filter(score => score.isDiscarded)
        .map(score => score.position || score.points || 0);

      return {
        position: standing.position,
        sailNumber: standing.sailNumber,
        helmName: standing.helmName,
        crewName: standing.crewName || undefined,
        countryCode: countryCode,
        countryFlag: countryFlag,
        yachtClub: standing.club || 'Unknown Club',
        racingClass: 'Dragon', // Default for Dragon class events
        totalPoints: standing.netPoints || standing.totalPoints || 0,
        raceResults: raceResults,
        discards: discards.length > 0 ? discards : undefined,
      };
    });

    return {
      id: championshipId,
      name: response.eventName || bundled?.name || 'Championship',
      shortName: bundled?.shortName || response.eventName || 'Championship',
      startDate: bundled?.startDate || '',
      endDate: bundled?.endDate || '',
      location: bundled?.location || 'Hong Kong',
      status: this.determineStatus(response.metadata),
      totalRaces: response.metadata.totalRaces || bundled?.totalRaces || 0,
      completedRaces: response.metadata.completedRaces || 0,
      totalBoats: competitors.length || response.metadata.totalCompetitors || 0,
      lastUpdated: response.lastUpdated,
      competitors: competitors,
    };
  }

  /**
   * Determine championship status from metadata
   */
  private determineStatus(metadata: CloudFunctionMetadata): 'upcoming' | 'ongoing' | 'completed' {
    if (metadata.completedRaces === 0) {
      return 'upcoming';
    }
    if (metadata.completedRaces >= metadata.totalRaces && metadata.totalRaces > 0) {
      return 'completed';
    }
    return 'ongoing';
  }

  /**
   * Get bundled championship data (fallback)
   */
  private getBundledChampionship(eventId: string): Championship {
    const championshipId = CHAMPIONSHIP_ID_MAP[eventId] || eventId;
    const bundled = MOCK_CHAMPIONSHIPS.find(c => c.id === championshipId);

    if (bundled) {
      return bundled;
    }

    // Return first championship if no match found
    return MOCK_CHAMPIONSHIPS[0];
  }

  /**
   * Clear cache for a specific event or all events
   */
  clearCache(eventId?: string): void {
    if (eventId) {
      const cloudEventId = EVENT_ID_MAP[eventId] || eventId;
      this.cache.delete(cloudEventId);
      this.lastFetchTime.delete(cloudEventId);
    } else {
      this.cache.clear();
      this.lastFetchTime.clear();
    }
  }

  /**
   * Forces the results service to use bundled mock data instead of API data.
   * This is useful for UI testing and development when the live API is unavailable.
   *
   * @param enabled - Whether to force mock data (true) or use normal API behavior (false)
   * @note Only works in development builds (__DEV__). No-op in production.
   * @note Clears the cache when toggled to ensure fresh data on next fetch.
   *
   * @example
   * // Enable mock data for testing
   * resultsService.setForceMockData(true);
   *
   * // Disable to return to normal behavior
   * resultsService.setForceMockData(false);
   */
  setForceMockData(enabled: boolean): void {
    if (__DEV__) {
      this.forceMockData = enabled;
      // Clear cache when toggling to ensure fresh data on next fetch
      this.clearCache();
    }
  }

  /**
   * Returns whether mock data is currently being forced.
   *
   * @returns true if mock data is being forced, false otherwise
   * @note Always returns false in production builds.
   *
   * @example
   * if (resultsService.getForceMockData()) {
   *   console.log('Using mock data');
   * }
   */
  getForceMockData(): boolean {
    return this.forceMockData;
  }

  /**
   * Gets the timestamp of the last successful data fetch for a specific event.
   * Useful for displaying "last updated" information in the UI.
   *
   * @param eventId - The championship event ID (e.g., 'asia-pacific-2026' or '13241')
   * @returns Unix timestamp in milliseconds of last fetch, or null if never fetched
   *
   * @example
   * const lastFetch = resultsService.getLastFetchTime('asia-pacific-2026');
   * if (lastFetch) {
   *   console.log(`Last updated: ${formatRelativeTime(lastFetch)}`);
   * }
   */
  getLastFetchTime(eventId: string): number | null {
    const cloudEventId = EVENT_ID_MAP[eventId] || eventId;
    return this.lastFetchTime.get(cloudEventId) || null;
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
        const results: number[] = [];

        // Generate results for 6 races
        for (let race = 1; race <= 6; race++) {
          const position = Math.max(1, Math.min(20, index + 1 + Math.floor(Math.random() * 10) - 5));
          const points = position <= 15 ? position : position + 5;

          raceResults[race] = {
            position,
            points,
            status: 'finished' as const,
            isDiscarded: false
          };
          results.push(points);
        }

        // Calculate totals
        const sortedResults = [...results].sort((a, b) => a - b);
        const bestResults = sortedResults.slice(0, 5); // Drop worst result
        const totalPoints = results.reduce((sum, points) => sum + points, 0);
        const netPoints = bestResults.reduce((sum, points) => sum + points, 0);

        // Determine trend based on position
        const trend: 'up' | 'down' | 'same' = index < 3 ? 'up' : index > 6 ? 'down' : 'same';

        return {
          sailNumber: sailor.sailNumber,
          helmName: sailor.helmName,
          country: sailor.country,
          club: sailor.club,
          totalPoints,
          netPoints,
          position: index + 1,
          raceResults,
          trend,
          trendChange: Math.floor(Math.random() * 3),
          isQualified: netPoints < 100,
          racesCompleted: 6,
          bestResults,
          worstResult: Math.max(...results)
        };
      }).sort((a, b) => a.netPoints - b.netPoints).map((sailor, index): ChampionshipStandings => ({
        ...sailor,
        position: index + 1
      }));
    } catch (error) {
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
        }
      }, this.config.updateInterval);

      // Store interval for cleanup
      this.listeners['liveUpdate'] = [() => clearInterval(updateInterval)];
      
    } catch (error) {
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

// Create singleton instance for easy import
export const resultsService = new ResultsService(useUserStore);

export default ResultsService;