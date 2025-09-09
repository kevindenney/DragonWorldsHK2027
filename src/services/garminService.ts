import { UserStore } from '../stores/userStore';

export interface GarminChartData {
  chartId: string;
  name: string;
  region: string;
  coverage: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  depth: {
    unit: 'meters' | 'feet';
    contours: number[];
  };
  features: string[];
  lastUpdated: string;
}

export interface RaceAreaBoundary {
  id: string;
  name: string;
  type: 'start_line' | 'finish_line' | 'mark' | 'boundary' | 'prohibited_area';
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  description?: string;
}

export interface SponsorLocation {
  id: string;
  name: string;
  sponsor: 'HSBC' | 'Sino_Group' | 'BMW' | 'Garmin';
  type: 'ATM' | 'branch' | 'hotel' | 'restaurant' | 'service_center' | 'hospitality';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
  services: string[];
  hours: {
    [key: string]: string; // day of week -> hours
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  vipAccess?: boolean;
  premiereAccess?: boolean;
}

export interface NavigationRoute {
  id: string;
  from: {
    latitude: number;
    longitude: number;
  };
  to: {
    latitude: number;
    longitude: number;
  };
  waypoints: Array<{
    latitude: number;
    longitude: number;
    name?: string;
    type?: 'turn' | 'landmark' | 'caution';
  }>;
  distance: number; // in nautical miles
  estimatedTime: number; // in minutes
  safetyNotes: string[];
  tideConsiderations?: string[];
}

export interface GarminServiceConfig {
  baseUrl: string;
  apiKey: string;
  region: 'Hong_Kong';
  chartLicense: string;
}

class GarminService {
  private config: GarminServiceConfig;
  private userStore: typeof UserStore;

  constructor(userStore: typeof UserStore) {
    this.userStore = userStore;
    this.config = {
      baseUrl: process.env.EXPO_PUBLIC_GARMIN_API_URL || 'https://api.garmin.com/marine/v1',
      apiKey: process.env.EXPO_PUBLIC_GARMIN_API_KEY || 'demo_key',
      region: 'Hong_Kong',
      chartLicense: 'DW_HK_2027_LIMITED'
    };
  }

  /**
   * Get available marine charts for Hong Kong racing areas
   */
  async getAvailableCharts(): Promise<GarminChartData[]> {
    try {
      // Demo data for development - replace with actual API call
      return [
        {
          chartId: 'HK_RACING_2024',
          name: 'Hong Kong Racing Areas - Dragon Worlds 2027',
          region: 'Hong Kong SAR',
          coverage: {
            north: 22.3193,
            south: 22.2400,
            east: 114.1800,
            west: 114.1200
          },
          depth: {
            unit: 'meters',
            contours: [5, 10, 15, 20, 30, 50, 100]
          },
          features: [
            'Racing marks and boundaries',
            'Safety zones',
            'Prohibited areas',
            'Marina and harbor facilities',
            'Tide stations'
          ],
          lastUpdated: '2024-12-01T00:00:00Z'
        },
        {
          chartId: 'HK_VICTORIA_HARBOR',
          name: 'Victoria Harbour Navigation',
          region: 'Hong Kong SAR',
          coverage: {
            north: 22.2950,
            south: 22.2750,
            east: 114.1850,
            west: 114.1550
          },
          depth: {
            unit: 'meters',
            contours: [3, 5, 10, 15, 25]
          },
          features: [
            'Harbor navigation',
            'Ferry routes',
            'Commercial shipping lanes',
            'Marina access'
          ],
          lastUpdated: '2024-12-01T00:00:00Z'
        }
      ];
    } catch (error) {
      console.error('Error fetching Garmin charts:', error);
      throw new Error('Failed to load marine charts');
    }
  }

  /**
   * Get race area boundaries and marks
   */
  async getRaceAreaBoundaries(): Promise<RaceAreaBoundary[]> {
    try {
      // Demo data for Dragon Worlds racing areas
      return [
        {
          id: 'start_line_main',
          name: 'Main Start Line',
          type: 'start_line',
          coordinates: [
            { latitude: 22.2850, longitude: 114.1650 },
            { latitude: 22.2860, longitude: 114.1670 }
          ],
          description: 'Primary start line for Dragon class racing'
        },
        {
          id: 'finish_line_main',
          name: 'Main Finish Line',
          type: 'finish_line',
          coordinates: [
            { latitude: 22.2820, longitude: 114.1720 },
            { latitude: 22.2830, longitude: 114.1740 }
          ],
          description: 'Primary finish line for all races'
        },
        {
          id: 'mark_windward',
          name: 'Windward Mark',
          type: 'mark',
          coordinates: [
            { latitude: 22.2900, longitude: 114.1700 }
          ],
          description: 'Primary windward mark - Yellow inflatable'
        },
        {
          id: 'mark_leeward',
          name: 'Leeward Mark',
          type: 'mark',
          coordinates: [
            { latitude: 22.2800, longitude: 114.1650 }
          ],
          description: 'Primary leeward mark - Orange inflatable'
        },
        {
          id: 'prohibited_commercial',
          name: 'Commercial Shipping Lane',
          type: 'prohibited_area',
          coordinates: [
            { latitude: 22.2750, longitude: 114.1600 },
            { latitude: 22.2750, longitude: 114.1800 },
            { latitude: 22.2700, longitude: 114.1800 },
            { latitude: 22.2700, longitude: 114.1600 }
          ],
          description: 'Prohibited area - Commercial shipping lane'
        }
      ];
    } catch (error) {
      console.error('Error fetching race boundaries:', error);
      throw new Error('Failed to load race area data');
    }
  }

  /**
   * Get sponsor locations with services
   */
  async getSponsorLocations(): Promise<SponsorLocation[]> {
    try {
      const user = this.userStore.getState();
      
      return [
        // HSBC Locations
        {
          id: 'hsbc_central',
          name: 'HSBC Central Branch',
          sponsor: 'HSBC',
          type: 'branch',
          coordinates: { latitude: 22.2816, longitude: 114.1581 },
          address: '1 Queen\'s Road Central, Hong Kong',
          services: ['Currency Exchange', 'Premier Banking', 'ATM', 'Safety Deposit'],
          hours: {
            'Monday': '9:00 AM - 4:30 PM',
            'Tuesday': '9:00 AM - 4:30 PM',
            'Wednesday': '9:00 AM - 4:30 PM',
            'Thursday': '9:00 AM - 4:30 PM',
            'Friday': '9:00 AM - 4:30 PM',
            'Saturday': '9:00 AM - 12:30 PM',
            'Sunday': 'Closed'
          },
          contact: {
            phone: '+852 2233 3000',
            website: 'hsbc.com.hk'
          },
          premiereAccess: user.userType === 'vip' || user.profile?.hsbc?.isPremier
        },
        {
          id: 'hsbc_atm_marina',
          name: 'HSBC ATM - Aberdeen Marina',
          sponsor: 'HSBC',
          type: 'ATM',
          coordinates: { latitude: 22.2474, longitude: 114.1555 },
          address: 'Aberdeen Marina Club, 20 Sham Wan Road',
          services: ['24/7 ATM', 'Cash Withdrawal', 'Balance Inquiry'],
          hours: {
            'Monday': '24 Hours',
            'Tuesday': '24 Hours',
            'Wednesday': '24 Hours',
            'Thursday': '24 Hours',
            'Friday': '24 Hours',
            'Saturday': '24 Hours',
            'Sunday': '24 Hours'
          }
        },
        
        // Sino Group Locations
        {
          id: 'sino_conrad',
          name: 'Conrad Hong Kong',
          sponsor: 'Sino_Group',
          type: 'hotel',
          coordinates: { latitude: 22.2793, longitude: 114.1722 },
          address: 'Pacific Place, 88 Queensway, Hong Kong',
          services: ['Luxury Accommodation', 'Concierge', 'Spa', 'Fine Dining'],
          hours: {
            'Monday': '24 Hours',
            'Tuesday': '24 Hours',
            'Wednesday': '24 Hours',
            'Thursday': '24 Hours',
            'Friday': '24 Hours',
            'Saturday': '24 Hours',
            'Sunday': '24 Hours'
          },
          contact: {
            phone: '+852 2521 3838',
            website: 'conradhongkong.com'
          },
          vipAccess: user.userType === 'vip'
        },
        {
          id: 'sino_peninsula',
          name: 'The Peninsula Hong Kong',
          sponsor: 'Sino_Group',
          type: 'hotel',
          coordinates: { latitude: 22.2950, longitude: 114.1722 },
          address: 'Salisbury Road, Tsim Sha Tsui, Hong Kong',
          services: ['Luxury Accommodation', 'Rolls-Royce Service', 'Fine Dining', 'Spa'],
          hours: {
            'Monday': '24 Hours',
            'Tuesday': '24 Hours',
            'Wednesday': '24 Hours',
            'Thursday': '24 Hours',
            'Friday': '24 Hours',
            'Saturday': '24 Hours',
            'Sunday': '24 Hours'
          },
          contact: {
            phone: '+852 2920 2888',
            website: 'peninsula.com'
          },
          vipAccess: true
        },

        // BMW Locations
        {
          id: 'bmw_central',
          name: 'BMW Service Center Central',
          sponsor: 'BMW',
          type: 'service_center',
          coordinates: { latitude: 22.2760, longitude: 114.1820 },
          address: '123 Des Voeux Road Central, Hong Kong',
          services: ['Luxury Transport', 'Airport Transfer', 'City Tours', 'Executive Service'],
          hours: {
            'Monday': '8:00 AM - 6:00 PM',
            'Tuesday': '8:00 AM - 6:00 PM',
            'Wednesday': '8:00 AM - 6:00 PM',
            'Thursday': '8:00 AM - 6:00 PM',
            'Friday': '8:00 AM - 6:00 PM',
            'Saturday': '9:00 AM - 5:00 PM',
            'Sunday': '10:00 AM - 4:00 PM'
          },
          contact: {
            phone: '+852 2234 5678',
            website: 'bmw.com.hk'
          }
        },

        // Garmin Locations
        {
          id: 'garmin_marine',
          name: 'Garmin Marine Center',
          sponsor: 'Garmin',
          type: 'service_center',
          coordinates: { latitude: 22.2500, longitude: 114.1600 },
          address: 'Aberdeen Marina Club, Marine Services',
          services: ['GPS Navigation', 'Chart Updates', 'Marine Electronics', 'Technical Support'],
          hours: {
            'Monday': '9:00 AM - 6:00 PM',
            'Tuesday': '9:00 AM - 6:00 PM',
            'Wednesday': '9:00 AM - 6:00 PM',
            'Thursday': '9:00 AM - 6:00 PM',
            'Friday': '9:00 AM - 6:00 PM',
            'Saturday': '9:00 AM - 5:00 PM',
            'Sunday': '10:00 AM - 4:00 PM'
          },
          contact: {
            phone: '+852 2345 6789',
            website: 'garmin.com.hk'
          }
        }
      ];
    } catch (error) {
      console.error('Error fetching sponsor locations:', error);
      throw new Error('Failed to load sponsor locations');
    }
  }

  /**
   * Calculate navigation route between two points
   */
  async calculateRoute(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): Promise<NavigationRoute> {
    try {
      // Demo route calculation - replace with actual Garmin routing API
      const distance = this.calculateDistance(from, to);
      const estimatedTime = (distance / 5) * 60; // Assuming 5 knots average speed
      
      return {
        id: `route_${Date.now()}`,
        from,
        to,
        waypoints: [
          from,
          {
            latitude: (from.latitude + to.latitude) / 2,
            longitude: (from.longitude + to.longitude) / 2,
            name: 'Midpoint',
            type: 'landmark'
          },
          to
        ],
        distance,
        estimatedTime,
        safetyNotes: [
          'Check tide conditions before departure',
          'Monitor VHF Channel 16 for race updates',
          'Be aware of commercial traffic in main channels'
        ],
        tideConsiderations: [
          'High tide: +2.1m at 14:30',
          'Low tide: +0.3m at 20:45'
        ]
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      throw new Error('Failed to calculate navigation route');
    }
  }

  /**
   * Calculate distance between two points in nautical miles
   */
  private calculateDistance(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get user-specific chart access based on subscription
   */
  async getChartAccess(): Promise<{
    hasAccess: boolean;
    accessLevel: 'basic' | 'professional' | 'premium';
    availableFeatures: string[];
  }> {
    const user = this.userStore.getState();
    
    // Participants get professional access during championship
    if (user.userType === 'participant') {
      return {
        hasAccess: true,
        accessLevel: 'professional',
        availableFeatures: [
          'High-resolution charts',
          'Real-time updates',
          'Race area overlays',
          'Safety zone markers',
          'Tide predictions',
          'Current data'
        ]
      };
    }
    
    // VIP users get premium access
    if (user.userType === 'vip') {
      return {
        hasAccess: true,
        accessLevel: 'premium',
        availableFeatures: [
          'All professional features',
          'Private marina access',
          'VIP service locations',
          'Concierge routing',
          'Priority navigation'
        ]
      };
    }
    
    // Basic access for spectators
    return {
      hasAccess: true,
      accessLevel: 'basic',
      availableFeatures: [
        'Basic navigation',
        'Public locations',
        'General safety information'
      ]
    };
  }
}

export default GarminService;