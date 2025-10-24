/**
 * ClubSpotService - Service for fetching entrant data from ClubSpot
 *
 * Phase 1: Demo data support for immediate development
 * Phase 2: Real ClubSpot scraping with authentication
 */

import type { Competitor } from '../types/noticeBoard';

export interface ClubSpotConfig {
  baseUrl: string;
  cacheDuration: number;
  useDemoData: boolean;
}

export interface ClubSpotEntrant {
  id: string;
  sailors: string[];
  boatClass: string;
  sailNumber: string;
  boatName: string;
  boatType: string;
  handicapRating?: number;
  club: string;
  country: string;
  registrationStatus: 'pending' | 'confirmed' | 'paid' | 'incomplete';
  paymentStatus: 'pending' | 'paid' | 'overdue';
  entryDate: string;
}

export class ClubSpotService {
  private config: ClubSpotConfig;
  private cache: Map<string, Competitor[]> = new Map();
  private lastFetchTime: Map<string, number> = new Map();

  constructor(config?: Partial<ClubSpotConfig>) {
    this.config = {
      baseUrl: 'https://theclubspot.com',
      cacheDuration: 300000, // 5 minutes
      useDemoData: true,
      ...config
    };
  }

  /**
   * Fetch entrants for a specific regatta
   * @param regattaId - ClubSpot regatta ID (e.g., 'KGHzb6NBqO')
   * @param eventId - Internal event ID for context
   */
  async getEntrants(regattaId: string, eventId: string): Promise<Competitor[]> {
    console.log(`[ClubSpotService] Fetching entrants for regatta: ${regattaId}, event: ${eventId}`);

    try {
      const cacheKey = `${regattaId}_${eventId}`;

      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        console.log('[ClubSpotService] Returning cached data');
        return this.cache.get(cacheKey) || [];
      }

      let entrants: Competitor[];

      if (this.config.useDemoData) {
        console.log('[ClubSpotService] Generating demo data');
        entrants = this.generateDemoEntrants(eventId);
      } else {
        console.log('[ClubSpotService] Fetching real data from ClubSpot');
        entrants = await this.fetchRealEntrants(regattaId);
      }

      // Cache the results
      this.cache.set(cacheKey, entrants);
      this.lastFetchTime.set(cacheKey, Date.now());

      return entrants;
    } catch (error) {
      console.error('[ClubSpotService] Error fetching entrants:', error);
      // Return demo data as fallback
      return this.generateDemoEntrants(eventId);
    }
  }

  /**
   * Fetch real entrants from ClubSpot API
   * Phase 2: Implement real ClubSpot integration
   */
  private async fetchRealEntrants(regattaId: string): Promise<Competitor[]> {
    // TODO: Phase 2 - Implement real ClubSpot scraping
    // This would:
    // 1. Handle authentication/session tokens
    // 2. Make Parse.js API calls or scrape HTML
    // 3. Parse the entrant data
    // 4. Convert to Competitor format

    console.warn('[ClubSpotService] Real ClubSpot integration not yet implemented');
    throw new Error('Real data fetching not implemented yet');
  }

  /**
   * Generate demo entrants for testing
   */
  private generateDemoEntrants(eventId: string): Competitor[] {
    const competitors: Competitor[] = [];

    // Different data sets for different events
    const isWorldChampionship = eventId.includes('world');
    const entryCount = isWorldChampionship ? 87 : 45;

    const countries = ['HKG', 'AUS', 'GBR', 'USA', 'NZL', 'SIN', 'JPN', 'GER', 'ITA', 'FRA', 'NED', 'ESP', 'CAN', 'DEN', 'SWE'];
    const clubs = [
      'Royal Hong Kong YC',
      'Royal Sydney YS',
      'Royal Yacht Squadron',
      'San Diego YC',
      'Royal NZ YS',
      'Singapore SC',
      'Hayama Marina YC',
      'Hamburger SV',
      'YC Italiano',
      'YC de France',
      'Royal Netherlands YC',
      'Real Club Náutico Barcelona',
      'Royal Canadian YC',
      'Royal Danish YC',
      'GKSS'
    ];

    const helmNames = [
      'John Smith', 'Sarah Chen', 'Michael Wong', 'Emma Thompson', 'David Lee',
      'Sophie Martin', 'James Wilson', 'Olivia Brown', 'Robert Taylor', 'Emily Davis',
      'William Anderson', 'Charlotte Thomas', 'Daniel White', 'Isabella Garcia', 'Matthew Martinez',
      'Amelia Robinson', 'Andrew Clark', 'Sophia Rodriguez', 'Christopher Lewis', 'Mia Walker'
    ];

    const boatNames = [
      'Dragon\'s Breath', 'Sea Serpent', 'Flying Dutchman', 'Wind Dancer', 'Storm Rider',
      'Ocean Spirit', 'Blue Horizon', 'Silver Arrow', 'Golden Dragon', 'Phoenix Rising',
      'Tsunami', 'White Lightning', 'Thunderbolt', 'Sea Wolf', 'Victory',
      'Endeavour', 'Quest', 'Maverick', 'Intrepid', 'Valiant'
    ];

    for (let i = 1; i <= entryCount; i++) {
      const country = countries[Math.floor(Math.random() * countries.length)];
      const club = clubs[Math.floor(Math.random() * clubs.length)];
      const helmName = helmNames[Math.floor(Math.random() * helmNames.length)];
      const boatName = boatNames[Math.floor(Math.random() * boatNames.length)];

      // Generate realistic registration statuses
      let registrationStatus: Competitor['registrationStatus'];
      const rand = Math.random();
      if (rand < 0.70) {
        registrationStatus = 'confirmed';
      } else if (rand < 0.85) {
        registrationStatus = 'paid';
      } else if (rand < 0.95) {
        registrationStatus = 'pending';
      } else {
        registrationStatus = 'incomplete';
      }

      competitors.push({
        id: `clubspot_${eventId}_${i}`,
        sailNumber: `${country} ${String(i).padStart(3, '0')}`,
        helmName: `${helmName} (${boatName})`,
        crewNames: [
          `Crew ${String.fromCharCode(65 + (i % 26))} ${i}`,
          `Crew ${String.fromCharCode(66 + (i % 26))} ${i}`
        ],
        country,
        club,
        className: 'Dragon',
        registrationStatus,
        entryDate: new Date(Date.now() - Math.random() * 86400000 * 90).toISOString(), // Random date in last 90 days
        paymentStatus: Math.random() > 0.1 ? 'paid' : 'pending',
        documentsSubmitted: Math.random() > 0.15,
        measurementCompleted: Math.random() > 0.2
      });
    }

    // Sort by country then sail number for better UX
    return competitors.sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.sailNumber.localeCompare(b.sailNumber);
    });
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(key: string): boolean {
    const lastFetch = this.lastFetchTime.get(key);
    if (!lastFetch) return false;

    return (Date.now() - lastFetch) < this.config.cacheDuration;
  }

  /**
   * Clear cache for a specific regatta or all
   */
  clearCache(regattaId?: string): void {
    if (regattaId) {
      // Clear specific regatta cache
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(regattaId));
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.lastFetchTime.delete(key);
      });
      console.log(`[ClubSpotService] Cleared cache for regatta: ${regattaId}`);
    } else {
      // Clear all cache
      this.cache.clear();
      this.lastFetchTime.clear();
      console.log('[ClubSpotService] Cleared all cache');
    }
  }

  /**
   * Toggle between demo and real data
   */
  setUseDemoData(useDemoData: boolean): void {
    this.config.useDemoData = useDemoData;
    this.clearCache();
    console.log(`[ClubSpotService] Switched to ${useDemoData ? 'demo' : 'real'} data mode`);
  }

  /**
   * Get service configuration
   */
  getConfig(): ClubSpotConfig {
    return { ...this.config };
  }
}

export default ClubSpotService;
