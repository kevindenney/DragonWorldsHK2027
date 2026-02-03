/**
 * ClubSpotService - Service for fetching entrant data from ClubSpot
 *
 * Supports both live data fetching via Firebase Cloud Function
 * and demo data fallback for development/offline scenarios.
 */

import type { Competitor } from '../types/noticeBoard';
import { externalUrls } from '../config/externalUrls';

export interface ClubSpotConfig {
  baseUrl: string;
  cacheDuration: number;
  useDemoData: boolean;
  cloudFunctionUrl: string;
}

export interface DataSourceInfo {
  isLive: boolean;
  lastFetched: Date | null;
  source: 'live' | 'cache' | 'demo';
  error?: string;
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

// Bundled initial data - shown immediately while live data loads
const BUNDLED_ENTRANTS: Record<string, Competitor[]> = {
  // APAC 2026 - bundled from ClubSpot scrape 2026-02-02
  'p75RuY5UZc': [
    { id: 'bundled_1', sailNumber: 'AUS 219', helmName: 'Sandy Anderson', crewNames: ['Susan Parker', 'Caroline Gibson', 'Robyn Johnston'], country: 'AUS', club: 'Royal Freshwater Bay Yacht Club', className: 'Dragon', boatName: 'Blue Marlin', registrationStatus: 'confirmed', entryDate: '2026-02-02T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_2', sailNumber: 'GBR 192', helmName: 'Graham Bailey', crewNames: [], country: 'GBR', club: 'RYS', className: 'Dragon', boatName: 'Bluebottle', registrationStatus: 'confirmed', entryDate: '2026-02-01T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_3', sailNumber: 'NED 449', helmName: 'Huib Bannier', crewNames: [], country: 'NED', club: 'WV Aalsmeer', className: 'Dragon', boatName: 'Felicity Shagwell', registrationStatus: 'confirmed', entryDate: '2026-01-31T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_4', sailNumber: 'NED 440', helmName: 'Marc Blees', crewNames: ['Peter Niekerk van', 'Felix Jacobsen'], country: 'NED', club: 'NYYC', className: 'Dragon', boatName: 'Lady in red', registrationStatus: 'confirmed', entryDate: '2026-01-30T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_5', sailNumber: 'SUI 5', helmName: 'Andreas Brechbuhl', crewNames: ['Peter Baer', 'Matthias Wacker'], country: 'SUI', club: '', className: 'Dragon', boatName: 'Sai Mui', registrationStatus: 'confirmed', entryDate: '2026-01-29T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_6', sailNumber: 'HKG TBD', helmName: 'Ida Cheung', crewNames: [], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'Davinloong', registrationStatus: 'confirmed', entryDate: '2026-01-28T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_7', sailNumber: 'DEN 410', helmName: 'Jens Christensen', crewNames: [], country: 'DEN', club: 'KDY / HS', className: 'Dragon', boatName: 'Out of Bounce', registrationStatus: 'confirmed', entryDate: '2026-01-27T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_8', sailNumber: 'HKG TBD', helmName: 'Martin Cresswell', crewNames: [], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'Elfje', registrationStatus: 'confirmed', entryDate: '2026-01-26T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_9', sailNumber: 'GER TBD', helmName: 'Jan Eckert', crewNames: ['Torvar Mirsky', 'Frederico Melo'], country: 'GER', club: 'SNG', className: 'Dragon', boatName: 'Gingko Racing', registrationStatus: 'confirmed', entryDate: '2026-01-25T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_10', sailNumber: 'GER 1207', helmName: 'Nicola Friesen', crewNames: [], country: 'GER', club: 'NRV', className: 'Dragon', boatName: 'Khaleesi', registrationStatus: 'confirmed', entryDate: '2026-01-24T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_11', sailNumber: 'HUN 63', helmName: 'Lorand Gombos', crewNames: [], country: 'HUN', club: 'Hungária Yacht Club', className: 'Dragon', boatName: 'Nyári Mikulás', registrationStatus: 'confirmed', entryDate: '2026-01-23T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_12', sailNumber: 'GBR 833', helmName: 'Grant Gordon', crewNames: ['Luke Patience', 'Ruairidh Scott', 'Faye Chatterton'], country: 'GBR', club: 'Royal Yacht Squadron', className: 'Dragon', boatName: 'Louise Racing', registrationStatus: 'confirmed', entryDate: '2026-01-22T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_13', sailNumber: 'EST TBD', helmName: 'Margus Haud', crewNames: ['Martin Käerdi', 'Ilmar Rosme'], country: 'EST', club: 'KJK', className: 'Dragon', boatName: 'LAINE', registrationStatus: 'confirmed', entryDate: '2026-01-21T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_14', sailNumber: 'NED 447', helmName: 'Arne Hubregtse', crewNames: [], country: 'NED', club: 'WV Zierikzee', className: 'Dragon', boatName: 'Flin', registrationStatus: 'confirmed', entryDate: '2026-01-20T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_15', sailNumber: 'DEN TBD', helmName: 'Bo Sejr Johansen', crewNames: ['Theis Palm', 'Kasper Harsberg'], country: 'DEN', club: 'Hornbaek', className: 'Dragon', boatName: 'Deja Vu ver. 3.0', registrationStatus: 'confirmed', entryDate: '2026-01-19T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_16', sailNumber: 'HUN 57', helmName: 'Ferenc Kis-Szölgyémi', crewNames: ['Károly Vezér', 'Farkas Litkey'], country: 'HUN', club: 'AMVK', className: 'Dragon', boatName: 'HANNI', registrationStatus: 'confirmed', entryDate: '2026-01-18T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_17', sailNumber: 'UAE 58', helmName: 'Jeroen Leenen', crewNames: [], country: 'UAE', club: 'DOSC', className: 'Dragon', boatName: 'Desert Storm', registrationStatus: 'confirmed', entryDate: '2026-01-17T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_18', sailNumber: 'HKG 18', helmName: 'Patrick Li', crewNames: ['Nick Sin', 'Felicia Leung', 'Ke Ying Tan'], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-01-16T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_19', sailNumber: 'AUS TBD', helmName: 'David Lynn', crewNames: [], country: 'AUS', club: 'Royal Freshwater Bay Yacht Club', className: 'Dragon', boatName: 'Relentless', registrationStatus: 'confirmed', entryDate: '2026-01-15T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_20', sailNumber: 'IRL 232', helmName: 'Jamie McWilliam', crewNames: [], country: 'IRL', club: 'RHKYC', className: 'Dragon', boatName: 'LALALAM', registrationStatus: 'confirmed', entryDate: '2026-01-14T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_21', sailNumber: 'GER 1263', helmName: 'Christopher Opielok', crewNames: [], country: 'GER', club: 'RHKYC RORC NRV', className: 'Dragon', boatName: 'Rockall', registrationStatus: 'confirmed', entryDate: '2026-01-13T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_22', sailNumber: 'HKG 8', helmName: 'Victor Pang', crewNames: [], country: 'HKG', club: 'Royal Hong Kong Yacht Club', className: 'Dragon', boatName: 'Kam Loong', registrationStatus: 'confirmed', entryDate: '2026-01-12T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_23', sailNumber: 'AUT 358', helmName: 'Claas Von Thülen', crewNames: ['Michael Lipp', 'Leo Pilgerstorfer'], country: 'AUT', club: 'ASC, UYCAs, DTYC', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-01-11T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_24', sailNumber: 'SWE 416', helmName: 'Martin Pålsson', crewNames: [], country: 'SWE', club: 'GKSS', className: 'Dragon', boatName: 'Nono', registrationStatus: 'confirmed', entryDate: '2026-01-10T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_25', sailNumber: 'GER 1223', helmName: 'Axel Schulz', crewNames: ['Mario Kühl', 'Daniel Bauer'], country: 'GER', club: 'VsAW / SCE', className: 'Dragon', boatName: 'Blue Defender', registrationStatus: 'confirmed', entryDate: '2026-01-09T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_26', sailNumber: 'SWE 800', helmName: 'Jan Secher', crewNames: ['Richard Sydenham', 'Gerard Mitchell'], country: 'SWE', club: 'Marstrands Segelsällskap', className: 'Dragon', boatName: 'Miss Behavior', registrationStatus: 'confirmed', entryDate: '2026-01-08T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_27', sailNumber: 'GER TBD', helmName: 'Christian Seegers', crewNames: ['Daniel Paysen', 'Jan Maiwald'], country: 'GER', club: 'NRV', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-01-07T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_28', sailNumber: 'USA 325', helmName: 'William Swigart', crewNames: ['David Caesar', 'Arthur Anosov'], country: 'USA', club: 'Newport Harbor YC / RHKYC', className: 'Dragon', boatName: 'Magic', registrationStatus: 'confirmed', entryDate: '2026-01-06T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_29', sailNumber: 'GBR 832', helmName: 'David Tabb', crewNames: [], country: 'GBR', club: 'Parkstone Yacht Club', className: 'Dragon', boatName: '', registrationStatus: 'confirmed', entryDate: '2026-01-05T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_30', sailNumber: 'GER 11', helmName: 'Christoph Toepfer', crewNames: ['Diego Negri', 'Markus Koy'], country: 'GER', club: 'Norddeutscher Regatta Verein', className: 'Dragon', boatName: 'Aurora', registrationStatus: 'confirmed', entryDate: '2026-01-04T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_31', sailNumber: 'HKG 12', helmName: 'Christian Low', crewNames: ['Anthony Byrne', 'Hubert Feng', 'Katy Tong'], country: 'HKG', club: 'NA', className: 'Dragon', boatName: 'Eaux Vives', registrationStatus: 'confirmed', entryDate: '2026-01-03T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_32', sailNumber: 'SWE 345', helmName: 'Jacob Wallenberg', crewNames: [], country: 'SWE', club: 'Royal Swedish Yacht Club, KSSS', className: 'Dragon', boatName: 'MING', registrationStatus: 'confirmed', entryDate: '2026-01-02T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_33', sailNumber: 'GER 1146', helmName: 'Ferdinand Ziegelmayer', crewNames: ['Peter Eckhardt', 'Philip Walkenbach'], country: 'GER', club: 'NRV', className: 'Dragon', boatName: 'Dörte', registrationStatus: 'confirmed', entryDate: '2026-01-01T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
    { id: 'bundled_34', sailNumber: 'HKG 59', helmName: 'Abraham van Olphen', crewNames: ['Kevin Denney', 'Glenn Cooke'], country: 'HKG', club: 'RHKYC', className: 'Dragon', boatName: 'DRAGONFLY', registrationStatus: 'confirmed', entryDate: '2025-12-31T00:00:00Z', paymentStatus: 'paid', documentsSubmitted: true, measurementCompleted: false },
  ],
  // Worlds 2027 - placeholder until entries open
  'zyQIfeVjhb': [],
};

export class ClubSpotService {
  private config: ClubSpotConfig;
  private cache: Map<string, Competitor[]> = new Map();
  private lastFetchTime: Map<string, number> = new Map();
  private dataSourceInfo: Map<string, DataSourceInfo> = new Map();

  constructor(config?: Partial<ClubSpotConfig>) {
    this.config = {
      baseUrl: externalUrls.clubSpot.baseUrl || 'https://theclubspot.com',
      cacheDuration: 300000, // 5 minutes
      useDemoData: false, // Default to live data
      cloudFunctionUrl: externalUrls.cloudFunctions?.scrapeClubSpot || '',
      ...config
    };

    // Pre-populate cache with bundled data
    for (const [regattaId, entrants] of Object.entries(BUNDLED_ENTRANTS)) {
      if (entrants.length > 0) {
        const cacheKey = `${regattaId}_bundled`;
        this.cache.set(cacheKey, entrants);
        this.dataSourceInfo.set(cacheKey, {
          isLive: false,
          lastFetched: new Date(),
          source: 'cache'
        });
      }
    }
  }

  /**
   * Get bundled entrants for immediate display
   */
  getBundledEntrants(regattaId: string): Competitor[] {
    return BUNDLED_ENTRANTS[regattaId] || [];
  }

  /**
   * Fetch entrants for a specific regatta
   * @param regattaId - ClubSpot regatta ID (e.g., 'KGHzb6NBqO')
   * @param eventId - Internal event ID for context
   * @param forceRefresh - Skip cache and fetch fresh data
   */
  async getEntrants(regattaId: string, eventId: string, forceRefresh = false): Promise<Competitor[]> {

    const cacheKey = `${regattaId}_${eventId}`;

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh && this.isCacheValid(cacheKey)) {
        const cachedInfo = this.dataSourceInfo.get(cacheKey);
        if (cachedInfo) {
          this.dataSourceInfo.set(cacheKey, { ...cachedInfo, source: 'cache' });
        }
        return this.cache.get(cacheKey) || [];
      }

      let entrants: Competitor[];

      if (this.config.useDemoData) {
        entrants = this.generateDemoEntrants(eventId);
        this.dataSourceInfo.set(cacheKey, {
          isLive: false,
          lastFetched: new Date(),
          source: 'demo'
        });
      } else {
        try {
          entrants = await this.fetchRealEntrants(regattaId);
          this.dataSourceInfo.set(cacheKey, {
            isLive: true,
            lastFetched: new Date(),
            source: 'live'
          });
        } catch (fetchError) {

          // Try to use cached data first
          if (this.cache.has(cacheKey)) {
            const cachedEntrants = this.cache.get(cacheKey) || [];
            this.dataSourceInfo.set(cacheKey, {
              isLive: false,
              lastFetched: this.lastFetchTime.get(cacheKey) ? new Date(this.lastFetchTime.get(cacheKey)!) : null,
              source: 'cache',
              error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
            });
            return cachedEntrants;
          }

          // Fall back to demo data
          entrants = this.generateDemoEntrants(eventId);
          this.dataSourceInfo.set(cacheKey, {
            isLive: false,
            lastFetched: new Date(),
            source: 'demo',
            error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
          });
        }
      }

      // Cache the results
      this.cache.set(cacheKey, entrants);
      this.lastFetchTime.set(cacheKey, Date.now());

      return entrants;
    } catch (error) {
      this.dataSourceInfo.set(cacheKey, {
        isLive: false,
        lastFetched: new Date(),
        source: 'demo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Return demo data as fallback
      return this.generateDemoEntrants(eventId);
    }
  }

  /**
   * Get data source information for a regatta
   */
  getDataSourceInfo(regattaId: string, eventId: string): DataSourceInfo | null {
    const cacheKey = `${regattaId}_${eventId}`;
    return this.dataSourceInfo.get(cacheKey) || null;
  }

  /**
   * Fetch real entrants from ClubSpot via Firebase Cloud Function
   */
  private async fetchRealEntrants(regattaId: string): Promise<Competitor[]> {
    const functionUrl = this.config.cloudFunctionUrl;

    if (!functionUrl) {
      throw new Error('Cloud Function URL not configured');
    }


    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${functionUrl}?regattaId=${regattaId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloud Function failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Cloud Function returned unsuccessful response');
      }


      // Transform and validate the response
      const entrants = this.transformCloudFunctionResponse(data.entrants || []);

      return entrants;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - ClubSpot service did not respond in time');
      }

      throw error;
    }
  }

  /**
   * Transform Cloud Function response to Competitor format
   */
  private transformCloudFunctionResponse(entrants: any[]): Competitor[] {
    return entrants.map((entrant, index) => ({
      id: entrant.id || `clubspot_${index}`,
      sailNumber: entrant.sailNumber || '',
      helmName: entrant.helmName || '',
      crewNames: entrant.crewNames || [],
      country: entrant.country || '',
      club: entrant.club || '',
      className: entrant.className || 'Dragon',
      boatName: entrant.boatName || '',
      registrationStatus: this.normalizeRegistrationStatus(entrant.registrationStatus),
      entryDate: entrant.entryDate || new Date().toISOString(),
      paymentStatus: this.normalizePaymentStatus(entrant.paymentStatus),
      documentsSubmitted: entrant.documentsSubmitted || false,
      measurementCompleted: entrant.measurementCompleted || false
    }));
  }

  /**
   * Normalize registration status to valid Competitor status
   */
  private normalizeRegistrationStatus(status: string | undefined): Competitor['registrationStatus'] {
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedStatus.includes('confirmed') || normalizedStatus.includes('approved')) {
      return 'confirmed';
    }
    if (normalizedStatus.includes('paid')) {
      return 'paid';
    }
    if (normalizedStatus.includes('incomplete')) {
      return 'incomplete';
    }
    return 'pending';
  }

  /**
   * Normalize payment status to valid Competitor payment status
   */
  private normalizePaymentStatus(status: string | undefined): Competitor['paymentStatus'] {
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedStatus.includes('paid') || normalizedStatus.includes('complete')) {
      return 'paid';
    }
    if (normalizedStatus.includes('overdue')) {
      return 'overdue';
    }
    return 'pending';
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
    } else {
      // Clear all cache
      this.cache.clear();
      this.lastFetchTime.clear();
    }
  }

  /**
   * Toggle between demo and real data
   */
  setUseDemoData(useDemoData: boolean): void {
    this.config.useDemoData = useDemoData;
    this.clearCache();
  }

  /**
   * Get service configuration
   */
  getConfig(): ClubSpotConfig {
    return { ...this.config };
  }
}

export default ClubSpotService;
