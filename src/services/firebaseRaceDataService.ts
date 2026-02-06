/**
 * Firebase Race Data Service
 * Connects to Firestore to fetch live race data scraped from racingrulesofsailing.org
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { firestore, isFirestoreReady } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RaceResult {
  position: number;
  sailNumber: string;
  helmName: string;
  crewName?: string;
  points: number;
  finishTime?: string;
  status: 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'bfd' | 'ret' | 'dnc';
}

export interface Race {
  raceNumber: number;
  raceDate?: string;
  results: RaceResult[];
  conditions?: {
    windSpeed?: string;
    windDirection?: string;
    course?: string;
  };
}

export interface Standing {
  position: number;
  sailNumber: string;
  helmName: string;
  crewName?: string;
  club?: string;
  totalPoints: number;
  netPoints: number;
  raceScores: Array<{
    points: number;
    position?: number;
    isDiscarded: boolean;
    status: string;
  }>;
}

export interface Competitor {
  id: string;
  sailNumber: string;
  boatName?: string;
  helmName: string;
  crewMembers: string[];
  club?: string;
  country?: string;
  division?: string;
  registrationStatus: string;
}

export interface EventData {
  id: string;
  name: string;
  organizer: string;
  venue: string;
  dates: {
    start: string;
    end: string;
  };
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  totalRaces: number;
  completedRaces: number;
  totalCompetitors: number;
  entryCount?: number;
  description?: string;
  lastUpdated: Timestamp;
}

export interface Notice {
  id: string;
  eventId: string;
  type: 'announcement' | 'protest' | 'course_change' | 'weather' | 'general';
  priority: 'emergency' | 'high' | 'normal' | 'info';
  title: string;
  content: string;
  publishedAt: string;
  author: string;
  authorRole: string;
  tags: string[];
  isRead?: boolean;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  url: string;
  fileType: string;
  uploadedAt: string;
  category: string;
}

class FirebaseRaceDataService {
  private cache: Map<string, any> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private subscriptions: Map<string, Unsubscribe> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly OFFLINE_CACHE_KEY = 'race_data_offline_cache';

  /**
   * Get event data
   */
  async getEvent(eventId: string): Promise<EventData | null> {
    const cacheKey = `event_${eventId}`;
    
    // Check memory cache
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const eventDoc = await getDoc(doc(firestore, 'events', eventId));
      
      if (!eventDoc.exists()) {
        return this.getOfflineData(cacheKey);
      }

      const eventData = eventDoc.data() as EventData;
      eventData.id = eventDoc.id;
      
      // Cache the result
      this.setCache(cacheKey, eventData);
      await this.saveOfflineData(cacheKey, eventData);
      
      return eventData;
    } catch (error) {
      return this.getOfflineData(cacheKey);
    }
  }

  /**
   * Get race results for specific races
   */
  async getRaceResults(eventId: string, raceNumbers?: number[]): Promise<Race[]> {
    const cacheKey = `races_${eventId}_${raceNumbers?.join(',') || 'all'}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      let q = query(
        collection(firestore, `events/${eventId}/races`),
        orderBy('raceNumber', 'asc')
      );

      const snapshot = await getDocs(q);
      const races: Race[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!raceNumbers || raceNumbers.includes(data.raceNumber)) {
          races.push(data as Race);
        }
      });
      
      this.setCache(cacheKey, races);
      await this.saveOfflineData(cacheKey, races);
      
      return races;
    } catch (error) {
      return this.getOfflineData(cacheKey) || [];
    }
  }

  /**
   * Get overall standings
   */
  async getStandings(eventId: string, division?: string): Promise<Standing[]> {
    const cacheKey = `standings_${eventId}_${division || 'all'}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const standingsCollection = collection(firestore, `events/${eventId}/standings`);
      const snapshot = await getDocs(query(standingsCollection, orderBy('position', 'asc')));
      
      const standings: Standing[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Standing;
        if (!division || (data as any).division === division) {
          standings.push(data);
        }
      });
      
      this.setCache(cacheKey, standings);
      await this.saveOfflineData(cacheKey, standings);
      
      return standings;
    } catch (error) {
      return this.getOfflineData(cacheKey) || [];
    }
  }

  /**
   * Get competitor list
   */
  async getCompetitors(eventId: string): Promise<Competitor[]> {
    const cacheKey = `competitors_${eventId}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const competitorsCollection = collection(firestore, `events/${eventId}/competitors`);
      const snapshot = await getDocs(query(competitorsCollection, orderBy('sailNumber', 'asc')));
      
      const competitors: Competitor[] = [];
      snapshot.forEach((doc) => {
        competitors.push({ id: doc.id, ...doc.data() } as Competitor);
      });
      
      this.setCache(cacheKey, competitors);
      await this.saveOfflineData(cacheKey, competitors);
      
      return competitors;
    } catch (error) {
      return this.getOfflineData(cacheKey) || [];
    }
  }

  /**
   * Get notices
   */
  async getNotices(eventId: string, noticeType?: string): Promise<Notice[]> {
    const cacheKey = `notices_${eventId}_${noticeType || 'all'}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      let q = query(
        collection(firestore, 'notices'),
        where('eventId', '==', eventId),
        orderBy('publishedAt', 'desc'),
        limit(50)
      );

      if (noticeType) {
        q = query(
          collection(firestore, 'notices'),
          where('eventId', '==', eventId),
          where('type', '==', noticeType),
          orderBy('publishedAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const notices: Notice[] = [];
      
      snapshot.forEach((doc) => {
        notices.push({ id: doc.id, ...doc.data() } as Notice);
      });
      
      this.setCache(cacheKey, notices);
      await this.saveOfflineData(cacheKey, notices);
      
      return notices;
    } catch (error) {
      return this.getOfflineData(cacheKey) || [];
    }
  }

  /**
   * Get documents
   */
  async getDocuments(eventId: string): Promise<Document[]> {
    const cacheKey = `documents_${eventId}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const docsCollection = collection(firestore, `events/${eventId}/documents`);
      const snapshot = await getDocs(query(docsCollection, orderBy('uploadedAt', 'desc')));
      
      const documents: Document[] = [];
      snapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() } as Document);
      });
      
      this.setCache(cacheKey, documents);
      await this.saveOfflineData(cacheKey, documents);
      
      return documents;
    } catch (error) {
      return this.getOfflineData(cacheKey) || [];
    }
  }

  /**
   * Subscribe to real-time standings updates
   */
  subscribeToStandings(
    eventId: string, 
    onUpdate: (standings: Standing[]) => void
  ): Unsubscribe {
    const subscriptionKey = `standings_${eventId}`;
    
    // Unsubscribe from existing subscription if any
    this.unsubscribe(subscriptionKey);

    if (!firestore) {
      return () => {};
    }

    const q = query(
      collection(firestore, `events/${eventId}/standings`),
      orderBy('position', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const standings: Standing[] = [];
      snapshot.forEach((doc) => {
        standings.push(doc.data() as Standing);
      });
      onUpdate(standings);
      
      // Update cache
      const cacheKey = `standings_${eventId}_all`;
      this.setCache(cacheKey, standings);
    }, (error) => {
    });

    this.subscriptions.set(subscriptionKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to real-time notices updates
   */
  subscribeToNotices(
    eventId: string, 
    onUpdate: (notices: Notice[]) => void
  ): Unsubscribe {
    const subscriptionKey = `notices_${eventId}`;
    
    // Unsubscribe from existing subscription if any
    this.unsubscribe(subscriptionKey);

    if (!firestore) {
      return () => {};
    }

    const q = query(
      collection(firestore, 'notices'),
      where('eventId', '==', eventId),
      orderBy('publishedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notices: Notice[] = [];
      snapshot.forEach((doc) => {
        notices.push({ id: doc.id, ...doc.data() } as Notice);
      });
      onUpdate(notices);
      
      // Update cache
      const cacheKey = `notices_${eventId}_all`;
      this.setCache(cacheKey, notices);
    }, (error) => {
    });

    this.subscriptions.set(subscriptionKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(key: string): void {
    const unsubscribe = this.subscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Save data for offline access
   */
  private async saveOfflineData(key: string, data: any): Promise<void> {
    try {
      const offlineCache = await this.getOfflineCache();
      offlineCache[key] = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(this.OFFLINE_CACHE_KEY, JSON.stringify(offlineCache));
    } catch (error) {
    }
  }

  /**
   * Get offline data
   */
  private async getOfflineData(key: string): Promise<any> {
    try {
      const offlineCache = await this.getOfflineCache();
      const cached = offlineCache[key];
      
      if (cached && cached.data) {
        return cached.data;
      }
    } catch (error) {
    }
    
    return null;
  }

  /**
   * Get offline cache
   */
  private async getOfflineCache(): Promise<any> {
    try {
      const cached = await AsyncStorage.getItem(this.OFFLINE_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Clear offline cache
   */
  async clearOfflineCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_CACHE_KEY);
    } catch (error) {
    }
  }

  /**
   * Generate mock China Coast Race Week data for testing
   */
  generateMockRaceData(): {
    eventData: EventData;
    standings: Standing[];
    competitors: Competitor[];
  } {
    const mockEventData: EventData = {
      id: 'dragon-worlds-2027',
      name: 'Dragon World Championships 2027',
      organizer: 'Royal Hong Kong Yacht Club',
      venue: 'Hong Kong',
      dates: {
        start: '2025-10-12T00:00:00Z',
        end: '2025-10-17T00:00:00Z'
      },
      status: 'active',
      entryCount: 42,
      completedRaces: 8,
      totalRaces: 12,
      totalCompetitors: 42,
      lastUpdated: Timestamp.now(),
      description: 'Dragon World Championships featuring top sailors from around the world'
    };

    const mockCompetitors: Competitor[] = [
      {
        id: 'den-7',
        sailNumber: 'DEN 7',
        boatName: 'Valkyrie',
        helmName: 'Lars Hansen',
        crewMembers: ['Mikkel Jensen'],
        club: 'Royal Danish YC (DEN)',
        country: 'Denmark',
        division: 'Red',
        registrationStatus: 'confirmed'
      },
      {
        id: 'gbr-888',
        sailNumber: 'GBR 888',
        boatName: 'Phoenix',
        helmName: 'James Thompson',
        crewMembers: ['Sarah Mitchell'],
        club: 'Royal Thames YC (GBR)',
        country: 'Great Britain',
        division: 'Red',
        registrationStatus: 'confirmed'
      },
      {
        id: 'aus-42',
        sailNumber: 'AUS 42',
        boatName: 'Thunder Bay',
        helmName: 'Michael Chen',
        crewMembers: ['Lisa Wong'],
        club: 'Royal Sydney YS (AUS)',
        country: 'Australia',
        division: 'Blue',
        registrationStatus: 'confirmed'
      },
      {
        id: 'hkg-123',
        sailNumber: 'HKG 123',
        boatName: 'Dragon Spirit',
        helmName: 'William Lee',
        crewMembers: ['Amanda Chan'],
        club: 'Royal Hong Kong YC',
        country: 'Hong Kong',
        division: 'Blue',
        registrationStatus: 'confirmed'
      },
      {
        id: 'nzl-55',
        sailNumber: 'NZL 55',
        boatName: 'Kiwi Express',
        helmName: 'Andrew Taylor',
        crewMembers: ['Emma Roberts'],
        club: 'Royal New Zealand YS',
        country: 'New Zealand',
        division: 'Yellow',
        registrationStatus: 'confirmed'
      },
      {
        id: 'usa-99',
        sailNumber: 'USA 99',
        boatName: 'Liberty',
        helmName: 'Robert Johnson',
        crewMembers: ['Jennifer Davis'],
        club: 'New York YC (USA)',
        country: 'United States',
        division: 'Yellow',
        registrationStatus: 'confirmed'
      }
    ];

    const mockStandings: Standing[] = [
      {
        position: 1,
        sailNumber: 'DEN 7',
        helmName: 'Lars Hansen',
        crewName: 'Mikkel Jensen',
        club: 'Royal Danish YC (DEN)',
        totalPoints: 24,
        netPoints: 18,
        raceScores: [
          { points: 1, position: 1, isDiscarded: false, status: 'finished' },
          { points: 3, position: 3, isDiscarded: false, status: 'finished' },
          { points: 1, position: 1, isDiscarded: false, status: 'finished' },
          { points: 2, position: 2, isDiscarded: false, status: 'finished' },
          { points: 6, position: 6, isDiscarded: true, status: 'finished' },
          { points: 1, position: 1, isDiscarded: false, status: 'finished' },
          { points: 4, position: 4, isDiscarded: false, status: 'finished' },
          { points: 6, position: 6, isDiscarded: false, status: 'finished' }
        ]
      },
      {
        position: 2,
        sailNumber: 'GBR 888',
        helmName: 'James Thompson',
        crewName: 'Sarah Mitchell',
        club: 'Royal Thames YC (GBR)',
        totalPoints: 28,
        netPoints: 20,
        raceScores: [
          { points: 2, position: 2, isDiscarded: false, status: 'finished' },
          { points: 1, position: 1, isDiscarded: false, status: 'finished' },
          { points: 4, position: 4, isDiscarded: false, status: 'finished' },
          { points: 1, position: 1, isDiscarded: false, status: 'finished' },
          { points: 2, position: 2, isDiscarded: false, status: 'finished' },
          { points: 8, position: 8, isDiscarded: true, status: 'finished' },
          { points: 3, position: 3, isDiscarded: false, status: 'finished' },
          { points: 7, position: 7, isDiscarded: false, status: 'finished' }
        ]
      },
      {
        position: 3,
        sailNumber: 'AUS 42',
        helmName: 'Michael Chen',
        crewName: 'Lisa Wong',
        club: 'Royal Sydney YS (AUS)',
        totalPoints: 35,
        netPoints: 25,
        raceScores: [
          { points: 4, position: 4, isDiscarded: false, status: 'finished' },
          { points: 2, position: 2, isDiscarded: false, status: 'finished' },
          { points: 3, position: 3, isDiscarded: false, status: 'finished' },
          { points: 5, position: 5, isDiscarded: false, status: 'finished' },
          { points: 3, position: 3, isDiscarded: false, status: 'finished' },
          { points: 2, position: 2, isDiscarded: false, status: 'finished' },
          { points: 6, position: 6, isDiscarded: false, status: 'finished' },
          { points: 10, position: 10, isDiscarded: true, status: 'finished' }
        ]
      },
      {
        position: 4,
        sailNumber: 'HKG 123',
        helmName: 'William Lee',
        crewName: 'Amanda Chan',
        club: 'Royal Hong Kong YC',
        totalPoints: 42,
        netPoints: 32,
        raceScores: [
          { points: 3, position: 3, isDiscarded: false, status: 'finished' },
          { points: 5, position: 5, isDiscarded: false, status: 'finished' },
          { points: 2, position: 2, isDiscarded: false, status: 'finished' },
          { points: 7, position: 7, isDiscarded: false, status: 'finished' },
          { points: 4, position: 4, isDiscarded: false, status: 'finished' },
          { points: 3, position: 3, isDiscarded: false, status: 'finished' },
          { points: 8, position: 8, isDiscarded: false, status: 'finished' },
          { points: 10, position: 10, isDiscarded: true, status: 'finished' }
        ]
      },
      {
        position: 5,
        sailNumber: 'NZL 55',
        helmName: 'Andrew Taylor',
        crewName: 'Emma Roberts',
        club: 'Royal New Zealand YS',
        totalPoints: 48,
        netPoints: 38,
        raceScores: [
          { points: 5, position: 5, isDiscarded: false, status: 'finished' },
          { points: 4, position: 4, isDiscarded: false, status: 'finished' },
          { points: 6, position: 6, isDiscarded: false, status: 'finished' },
          { points: 3, position: 3, isDiscarded: false, status: 'finished' },
          { points: 7, position: 7, isDiscarded: false, status: 'finished' },
          { points: 5, position: 5, isDiscarded: false, status: 'finished' },
          { points: 8, position: 8, isDiscarded: false, status: 'finished' },
          { points: 10, position: 10, isDiscarded: true, status: 'finished' }
        ]
      },
      {
        position: 6,
        sailNumber: 'USA 99',
        helmName: 'Robert Johnson',
        crewName: 'Jennifer Davis',
        club: 'New York YC (USA)',
        totalPoints: 52,
        netPoints: 42,
        raceScores: [
          { points: 6, position: 6, isDiscarded: false, status: 'finished' },
          { points: 7, position: 7, isDiscarded: false, status: 'finished' },
          { points: 5, position: 5, isDiscarded: false, status: 'finished' },
          { points: 6, position: 6, isDiscarded: false, status: 'finished' },
          { points: 5, position: 5, isDiscarded: false, status: 'finished' },
          { points: 7, position: 7, isDiscarded: false, status: 'finished' },
          { points: 6, position: 6, isDiscarded: false, status: 'finished' },
          { points: 10, position: 10, isDiscarded: true, status: 'finished' }
        ]
      }
    ];

    return {
      eventData: mockEventData,
      standings: mockStandings,
      competitors: mockCompetitors
    };
  }

  /**
   * Get mock data when Firestore is unavailable
   */
  async getMockData(eventId: string, type: 'event' | 'standings' | 'competitors') {
    const mockData = this.generateMockRaceData();
    
    switch (type) {
      case 'event':
        return mockData.eventData;
      case 'standings':
        return mockData.standings;
      case 'competitors':
        return mockData.competitors;
      default:
        return null;
    }
  }

  /**
   * Fetch CCR 2024 results from Firestore (scraped by Cloud Functions)
   */
  async fetchCCR2024FromFirestore(): Promise<{
    eventData: any;
    standings: Standing[];
    competitors: Competitor[];
  }> {
    
    try {
      if (!isFirestoreReady()) {
        throw new Error('Firestore not ready');
      }
      
      const raceResultsRef = doc(firestore!, 'raceResults', 'ccr2024');
      const docSnap = await getDoc(raceResultsRef);
      
      if (!docSnap.exists()) {
        throw new Error('CCR 2024 results not found in Firestore');
      }
      
      const data = docSnap.data();
      
      // Convert Firestore format to app format
      const allBoats: any[] = [];
      
      // Process each division
      for (const [divisionId, divisionData] of Object.entries(data.divisions || {})) {
        const division = divisionData as any;
        if (division.boats && Array.isArray(division.boats)) {
          division.boats.forEach((boat: any, index: number) => {
            allBoats.push({
              position: allBoats.length + 1,
              sailNumber: boat.sailNumber || `${divisionId.toUpperCase()}-${index + 1}`,
              boatName: boat.boatName,
              helmName: boat.skipper || 'TBD',
              crewName: Array.isArray(boat.crew) ? boat.crew.join(', ') : (boat.crew || 'TBD'),
              yachtClub: boat.yachtClub || 'TBD',
              totalPoints: boat.totalPoints || 0,
              netPoints: boat.netPoints || boat.totalPoints || 0,
              raceResults: boat.raceResults || [],
              division: divisionId
            });
          });
        }
      }
      
      // Sort by net points for overall standings
      allBoats.sort((a, b) => a.netPoints - b.netPoints);
      allBoats.forEach((boat, index) => {
        boat.position = index + 1;
      });
      
      const standings = allBoats.map((boat: any) => ({
        position: boat.position,
        sailNumber: boat.sailNumber,
        helmName: boat.helmName,
        crewName: boat.crewName,
        club: boat.yachtClub,
        totalPoints: boat.totalPoints,
        netPoints: boat.netPoints,
        raceScores: boat.raceResults.map((result: number, raceIndex: number) => ({
          points: result,
          position: result,
          isDiscarded: boat.discardedRaces?.includes(raceIndex) || false,
          status: 'finished'
        }))
      }));
      
      const competitors: Competitor[] = allBoats.map((boat: any) => ({
        id: boat.sailNumber,
        sailNumber: boat.sailNumber,
        boatName: boat.boatName || '',
        helmName: boat.helmName,
        crewMembers: boat.crewName ? [boat.crewName] : [],
        club: boat.yachtClub,
        country: 'HKG',
        registrationStatus: 'confirmed'
      }));
      
      return {
        eventData: {
          id: 'ccr-2024',
          name: data.eventData?.name || 'China Coast Regatta 2024',
          location: data.eventData?.location || 'Hong Kong',
          startDate: data.eventData?.startDate || '2024-10-11',
          endDate: data.eventData?.endDate || '2024-10-13',
          status: data.eventData?.status || 'completed',
          totalRaces: data.eventData?.totalRaces || 7,
          racesCompleted: data.eventData?.racesCompleted || 7,
          totalCompetitors: competitors.length,
          lastUpdated: Timestamp.now()
        },
        standings,
        competitors
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Scrape China Coast Regatta 2024 results and convert to our format
   */
  async scrapeCCR2024Results(): Promise<{
    eventData: EventData;
    standings: Standing[];
    competitors: Competitor[];
  }> {
    
    try {
      // Dynamically import the scraping service to avoid circular dependencies
      const { ccr2024ScrapingService } = await import('./ccr2024ScrapingService');
      
      // Scrape the results
      const ccrData = await ccr2024ScrapingService.scrapeAllResults();
      
      // Convert to our display format
      const displayFormat = ccr2024ScrapingService.convertToDisplayFormat(ccrData);
      
      
      return {
        eventData: {
          id: displayFormat.eventData.id,
          name: displayFormat.eventData.name,
          organizer: 'China Coast Regatta',
          venue: displayFormat.eventData.location,
          dates: {
            start: displayFormat.eventData.startDate,
            end: displayFormat.eventData.endDate
          },
          totalRaces: displayFormat.eventData.totalRaces,
          completedRaces: displayFormat.eventData.racesCompleted,
          totalCompetitors: displayFormat.competitors.length,
          lastUpdated: Timestamp.now()
        },
        standings: displayFormat.standings.map((standing: any, index: number) => {
          // Calculate net points with drops for series with 5+ races
          const raceResults = standing.raceResults || [];
          const numRaces = raceResults.length;
          let netPoints = standing.totalPoints;
          let discardedIndices: number[] = [];
          
          // Apply discard rules: 1 drop after 5 races, 2 drops after 10 races
          if (numRaces >= 5) {
            const sortedResults = [...raceResults]
              .map((points, index) => ({ points, index }))
              .sort((a, b) => b.points - a.points); // Sort descending (worst first)
            
            const numDrops = numRaces >= 10 ? 2 : 1;
            const droppedRaces = sortedResults.slice(0, numDrops);
            discardedIndices = droppedRaces.map(d => d.index);
            
            // Calculate net points by dropping worst races
            netPoints = raceResults.reduce((sum: number, points: number, idx: number) => {
              const isDropped = discardedIndices.includes(idx);
              return isDropped ? sum : sum + points;
            }, 0);
          }
          
          return {
            position: standing.position,
            sailNumber: standing.sailNumber,
            helmName: standing.helmName,
            crewName: standing.crewName,
            club: standing.yachtClub,
            totalPoints: standing.totalPoints,
            netPoints: netPoints,
            raceScores: standing.raceResults.map((result: number, raceIndex: number) => ({
              points: result,
              position: result,
              isDiscarded: discardedIndices.includes(raceIndex),
              status: 'finished'
            }))
          };
        }),
        competitors: displayFormat.competitors.map((competitor: any) => ({
          id: competitor.id,
          sailNumber: competitor.sailNumber,
          boatName: competitor.boatName || '',
          helmName: competitor.helmName,
          crewMembers: competitor.crewName ? [competitor.crewName] : [],
          club: competitor.yachtClub,
          country: competitor.country,
          division: '',
          registrationStatus: competitor.status
        }))
      };
      
    } catch (error) {
      
      // Fall back to Dragon Worlds mock data if scraping fails
      return this.generateMockRaceData();
    }
  }

  /**
   * Enhanced data sync that tries CCR 2024 scraping first
   */
  async triggerDataSync(eventId: string): Promise<boolean> {
    
    try {
      // Try scraping CCR 2024 data first
      if (eventId.includes('dragon-worlds') || eventId.includes('ccr')) {
        const scrapedData = await this.scrapeCCR2024Results();
        
        // Cache the scraped data
        this.setCache(`event_${eventId}`, scrapedData.eventData);
        this.setCache(`standings_${eventId}`, scrapedData.standings);  
        this.setCache(`competitors_${eventId}`, scrapedData.competitors);
        
        // Save offline for future use
        await this.saveOfflineData(`event_${eventId}`, scrapedData.eventData);
        await this.saveOfflineData(`standings_${eventId}`, scrapedData.standings);
        await this.saveOfflineData(`competitors_${eventId}`, scrapedData.competitors);
        
        return true;
      }
      
      // For other events, try Firestore
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }
      
      // Check if event exists in Firestore
      const eventDoc = await getDoc(doc(firestore, 'events', eventId));
      if (eventDoc.exists()) {
        return true;
      }
      
      return false;
      
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const firebaseRaceDataService = new FirebaseRaceDataService();
export default firebaseRaceDataService;