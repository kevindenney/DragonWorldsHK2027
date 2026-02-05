import { UserStore } from '../../stores/userStore';

export interface HSBCLocation {
  id: string;
  type: 'branch' | 'atm' | 'premier_center' | 'private_banking';
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  services: HSBCServiceInfo[];
  hours: {
    [key: string]: string; // day of week -> hours
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  accessibility: {
    wheelchairAccess: boolean;
    parkingAvailable: boolean;
    languages: string[];
  };
  premiereAccess: boolean;
  privateAccess: boolean;
}

export interface HSBCServiceInfo {
  id: string;
  name: string;
  description: string;
  category: 'banking' | 'currency' | 'investment' | 'lending' | 'cards' | 'international';
  availableAt: ('branch' | 'atm' | 'premier_center' | 'online' | 'mobile')[];
  requiresAccount: boolean;
  premiereOnly: boolean;
  estimatedTime: number; // minutes
  documentation?: string[];
}

export interface CurrencyExchange {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  spread: number; // percentage
  minimumAmount: number;
  maximumAmount: number;
  availableAt: string[]; // location IDs
  lastUpdated: string;
}

export interface HSBCAccountInfo {
  accountNumber: string;
  accountType: 'current' | 'savings' | 'premier' | 'advance' | 'private';
  balance: number;
  currency: string;
  lastTransaction: string;
  premiereStatus: {
    isPremiere: boolean;
    tier: 'jade' | 'premier' | 'advance' | null;
    benefits: string[];
    relationshipManager?: {
      name: string;
      phone: string;
      email: string;
    };
  };
  internationalServices: {
    globalView: boolean;
    globalTransfers: boolean;
    currencyAccount: string[];
  };
}

export interface HSBCServiceRequest {
  id: string;
  serviceType: 'currency_exchange' | 'account_opening' | 'investment_consultation' | 'loan_application' | 'card_replacement';
  status: 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  requestedAt: string;
  scheduledAt?: string;
  completedAt?: string;
  location?: HSBCLocation;
  details: {
    amount?: number;
    currency?: string;
    appointmentType?: string;
    urgency?: 'low' | 'medium' | 'high';
    notes?: string;
  };
  estimatedDuration: number; // minutes
  confirmationCode?: string;
}

export interface HSBCServiceConfig {
  baseUrl: string;
  apiKey: string;
  partnerId: string;
  region: 'Hong_Kong';
}

class HSBCService {
  private config: HSBCServiceConfig;
  private userStore: typeof UserStore;

  constructor(userStore: typeof UserStore) {
    this.userStore = userStore;
    this.config = {
      baseUrl: process.env.EXPO_PUBLIC_HSBC_API_URL || 'https://api.hsbc.com.hk/open-banking',
      apiKey: process.env.EXPO_PUBLIC_HSBC_API_KEY || 'demo_key',
      partnerId: 'dragon_worlds_2027',
      region: 'Hong_Kong'
    };
  }

  /**
   * Get HSBC locations near user or event venues
   */
  async getLocations(userLocation?: { latitude: number; longitude: number }): Promise<HSBCLocation[]> {
    try {
      // Demo HSBC locations in Hong Kong
      const locations: HSBCLocation[] = [
        {
          id: 'hsbc_central',
          type: 'premier_center',
          name: 'HSBC Premier Centre - Central',
          address: '1 Queen\'s Road Central, Central, Hong Kong',
          coordinates: { latitude: 22.2816, longitude: 114.1581 },
          services: await this.getAvailableServices(),
          hours: {
            'Monday': '9:00 AM - 6:00 PM',
            'Tuesday': '9:00 AM - 6:00 PM',
            'Wednesday': '9:00 AM - 6:00 PM',
            'Thursday': '9:00 AM - 6:00 PM',
            'Friday': '9:00 AM - 6:00 PM',
            'Saturday': '9:00 AM - 1:00 PM',
            'Sunday': 'Closed'
          },
          contact: {
            phone: '+852 2233 3000',
            email: 'premier.central@hsbc.com.hk',
            website: 'https://www.hsbc.com.hk'
          },
          accessibility: {
            wheelchairAccess: true,
            parkingAvailable: true,
            languages: ['English', 'Cantonese', 'Mandarin', 'Japanese']
          },
          premiereAccess: true,
          privateAccess: false
        },
        {
          id: 'hsbc_admiralty',
          type: 'branch',
          name: 'HSBC Admiralty Branch',
          address: 'Admiralty Centre, 18 Harcourt Road, Admiralty',
          coordinates: { latitude: 22.2783, longitude: 114.1650 },
          services: await this.getAvailableServices(),
          hours: {
            'Monday': '9:00 AM - 5:00 PM',
            'Tuesday': '9:00 AM - 5:00 PM',
            'Wednesday': '9:00 AM - 5:00 PM',
            'Thursday': '9:00 AM - 5:00 PM',
            'Friday': '9:00 AM - 5:00 PM',
            'Saturday': '9:00 AM - 1:00 PM',
            'Sunday': 'Closed'
          },
          contact: {
            phone: '+852 2822 1111',
            website: 'https://www.hsbc.com.hk'
          },
          accessibility: {
            wheelchairAccess: true,
            parkingAvailable: false,
            languages: ['English', 'Cantonese', 'Mandarin']
          },
          premiereAccess: false,
          privateAccess: false
        },
        {
          id: 'hsbc_atm_marina',
          type: 'atm',
          name: 'HSBC ATM - Aberdeen Marina',
          address: 'Aberdeen Marina Club, 20 Sham Wan Road, Aberdeen',
          coordinates: { latitude: 22.2474, longitude: 114.1555 },
          services: [
            {
              id: 'atm_withdrawal',
              name: 'Cash Withdrawal',
              description: '24/7 cash withdrawal service',
              category: 'banking',
              availableAt: ['atm'],
              requiresAccount: true,
              premiereOnly: false,
              estimatedTime: 2
            },
            {
              id: 'atm_balance',
              name: 'Balance Inquiry',
              description: 'Check account balance',
              category: 'banking',
              availableAt: ['atm'],
              requiresAccount: true,
              premiereOnly: false,
              estimatedTime: 1
            }
          ],
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
            phone: '+852 2233 3000'
          },
          accessibility: {
            wheelchairAccess: true,
            parkingAvailable: true,
            languages: ['English', 'Chinese']
          },
          premiereAccess: false,
          privateAccess: false
        },
        {
          id: 'hsbc_tsim_sha_tsui',
          type: 'premier_center',
          name: 'HSBC Premier Centre - Tsim Sha Tsui',
          address: 'Harbour City, 3 Canton Road, Tsim Sha Tsui',
          coordinates: { latitude: 22.2950, longitude: 114.1690 },
          services: await this.getAvailableServices(),
          hours: {
            'Monday': '9:00 AM - 7:00 PM',
            'Tuesday': '9:00 AM - 7:00 PM',
            'Wednesday': '9:00 AM - 7:00 PM',
            'Thursday': '9:00 AM - 7:00 PM',
            'Friday': '9:00 AM - 7:00 PM',
            'Saturday': '9:00 AM - 5:00 PM',
            'Sunday': '10:00 AM - 6:00 PM'
          },
          contact: {
            phone: '+852 2288 6888',
            email: 'premier.tst@hsbc.com.hk'
          },
          accessibility: {
            wheelchairAccess: true,
            parkingAvailable: true,
            languages: ['English', 'Cantonese', 'Mandarin', 'Japanese', 'Korean']
          },
          premiereAccess: true,
          privateAccess: false
        }
      ];


      return locations;
    } catch (error) {
      throw new Error('Failed to load HSBC locations');
    }
  }

  /**
   * Get available HSBC services
   */
  async getAvailableServices(): Promise<HSBCServiceInfo[]> {
    return [
      {
        id: 'currency_exchange',
        name: 'Currency Exchange',
        description: 'Exchange foreign currency with competitive rates',
        category: 'currency',
        availableAt: ['branch', 'premier_center'],
        requiresAccount: false,
        premiereOnly: false,
        estimatedTime: 15,
        documentation: ['Valid ID', 'Purpose of exchange (for large amounts)']
      },
      {
        id: 'account_opening',
        name: 'Account Opening',
        description: 'Open new personal or business accounts',
        category: 'banking',
        availableAt: ['branch', 'premier_center'],
        requiresAccount: false,
        premiereOnly: false,
        estimatedTime: 45,
        documentation: ['Valid passport', 'Proof of address', 'Employment proof']
      },
      {
        id: 'premier_consultation',
        name: 'Premier Banking Consultation',
        description: 'Personalized banking advice and portfolio review',
        category: 'investment',
        availableAt: ['premier_center'],
        requiresAccount: true,
        premiereOnly: true,
        estimatedTime: 60,
        documentation: ['Account information', 'Investment objectives']
      },
      {
        id: 'global_transfers',
        name: 'International Transfers',
        description: 'Send money worldwide with HSBC Global View',
        category: 'international',
        availableAt: ['branch', 'premier_center', 'online', 'mobile'],
        requiresAccount: true,
        premiereOnly: false,
        estimatedTime: 10,
        documentation: ['Recipient details', 'Purpose of transfer']
      },
      {
        id: 'card_services',
        name: 'Card Services',
        description: 'Credit card applications, replacements, and upgrades',
        category: 'cards',
        availableAt: ['branch', 'premier_center', 'online'],
        requiresAccount: false,
        premiereOnly: false,
        estimatedTime: 20,
        documentation: ['Valid ID', 'Income proof (for new applications)']
      },
      {
        id: 'investment_advisory',
        name: 'Investment Advisory',
        description: 'Professional investment advice and wealth planning',
        category: 'investment',
        availableAt: ['premier_center'],
        requiresAccount: true,
        premiereOnly: true,
        estimatedTime: 90,
        documentation: ['Financial statements', 'Investment experience', 'Risk tolerance assessment']
      }
    ];
  }

  /**
   * Get current currency exchange rates
   */
  async getCurrencyRates(): Promise<CurrencyExchange[]> {
    try {
      // Demo currency rates - in real implementation, fetch from HSBC API
      const rates: CurrencyExchange[] = [
        {
          fromCurrency: 'USD',
          toCurrency: 'HKD',
          rate: 7.8125,
          spread: 0.25,
          minimumAmount: 100,
          maximumAmount: 50000,
          availableAt: ['hsbc_central', 'hsbc_admiralty', 'hsbc_tsim_sha_tsui'],
          lastUpdated: new Date().toISOString()
        },
        {
          fromCurrency: 'EUR',
          toCurrency: 'HKD',
          rate: 8.4521,
          spread: 0.30,
          minimumAmount: 100,
          maximumAmount: 50000,
          availableAt: ['hsbc_central', 'hsbc_tsim_sha_tsui'],
          lastUpdated: new Date().toISOString()
        },
        {
          fromCurrency: 'GBP',
          toCurrency: 'HKD',
          rate: 9.8456,
          spread: 0.35,
          minimumAmount: 100,
          maximumAmount: 50000,
          availableAt: ['hsbc_central', 'hsbc_tsim_sha_tsui'],
          lastUpdated: new Date().toISOString()
        },
        {
          fromCurrency: 'JPY',
          toCurrency: 'HKD',
          rate: 0.0521,
          spread: 0.40,
          minimumAmount: 10000,
          maximumAmount: 5000000,
          availableAt: ['hsbc_central', 'hsbc_admiralty', 'hsbc_tsim_sha_tsui'],
          lastUpdated: new Date().toISOString()
        },
        {
          fromCurrency: 'AUD',
          toCurrency: 'HKD',
          rate: 5.1234,
          spread: 0.45,
          minimumAmount: 100,
          maximumAmount: 50000,
          availableAt: ['hsbc_central', 'hsbc_tsim_sha_tsui'],
          lastUpdated: new Date().toISOString()
        },
        {
          fromCurrency: 'SGD',
          toCurrency: 'HKD',
          rate: 5.8123,
          spread: 0.20,
          minimumAmount: 100,
          maximumAmount: 50000,
          availableAt: ['hsbc_central', 'hsbc_admiralty', 'hsbc_tsim_sha_tsui'],
          lastUpdated: new Date().toISOString()
        }
      ];

      return rates;
    } catch (error) {
      throw new Error('Failed to load currency exchange rates');
    }
  }

  /**
   * Get user's HSBC account information (if connected)
   */
  async getAccountInfo(): Promise<HSBCAccountInfo | null> {
    try {
      const user = this.userStore.getState();
      
      // Check if user has connected HSBC account
      if (!user.profile?.hsbc?.isConnected) {
        return null;
      }

      // Demo account info - in real implementation, fetch from HSBC API
      return {
        accountNumber: '***-***-123456',
        accountType: user.profile.hsbc.isPremier ? 'premier' : 'advance',
        balance: 85432.50,
        currency: 'HKD',
        lastTransaction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        premiereStatus: {
          isPremiere: user.profile.hsbc.isPremier || false,
          tier: user.profile.hsbc.isPremier ? 'premier' : 'advance',
          benefits: [
            'No minimum balance',
            'Free international transfers',
            'Dedicated relationship manager',
            'Priority banking',
            'Investment advisory services'
          ],
          relationshipManager: user.profile.hsbc.isPremier ? {
            name: 'Sarah Wong',
            phone: '+852 2233 3001',
            email: 'sarah.wong@hsbc.com.hk'
          } : undefined
        },
        internationalServices: {
          globalView: true,
          globalTransfers: true,
          currencyAccount: ['USD', 'EUR', 'GBP', 'JPY', 'AUD']
        }
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Request a banking service
   */
  async requestService(
    serviceId: string,
    locationId: string,
    details: HSBCServiceRequest['details'],
    preferredTime?: string
  ): Promise<HSBCServiceRequest> {
    try {
      const user = this.userStore.getState();
      const locations = await this.getLocations();
      const location = locations.find(l => l.id === locationId);
      const services = await this.getAvailableServices();
      const service = services.find(s => s.id === serviceId);
      
      if (!location || !service) {
        throw new Error('Invalid service or location');
      }

      const request: HSBCServiceRequest = {
        id: `hsbc_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        serviceType: serviceId as HSBCServiceRequest['serviceType'],
        status: 'requested',
        requestedAt: new Date().toISOString(),
        scheduledAt: preferredTime,
        location,
        details,
        estimatedDuration: service.estimatedTime,
        confirmationCode: `HSBC${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      };

      // In real implementation, this would call HSBC's appointment API
      
      return request;
    } catch (error) {
      throw new Error('Failed to request banking service');
    }
  }

  /**
   * Connect user's HSBC account
   */
  async connectAccount(accountNumber: string, verificationCode: string): Promise<boolean> {
    try {
      // In real implementation, this would use HSBC's OAuth or account linking API
      const user = this.userStore.getState();
      
      // Demo verification
      if (accountNumber.includes('123456') && verificationCode === '123456') {
        // Update user profile with HSBC connection
        // This would be handled by the user store in practice
        return true;
      }
      
      return false;
    } catch (error) {
      throw new Error('Failed to connect HSBC account');
    }
  }

  /**
   * Get Premier Banking benefits for event participants
   */
  async getEventBenefits(): Promise<{
    title: string;
    description: string;
    benefits: string[];
    eligibility: string;
    howToApply: string;
  }> {
    return {
      title: 'HSBC Premier - Dragon Worlds 2027 Exclusive',
      description: 'Special banking privileges for international sailors and VIP guests',
      benefits: [
        'No minimum balance requirement during championship week',
        'Complimentary currency exchange (up to HKD 50,000)',
        'Priority banking with dedicated relationship manager',
        'Free international wire transfers',
        'Access to Premier Centres with extended hours',
        'VIP airport banking services',
        'Investment advisory consultation',
        'Global View multi-currency account access'
      ],
      eligibility: 'Open to registered Dragon Worlds participants, crew, officials, and VIP guests',
      howToApply: 'Visit any HSBC Premier Centre with event credentials and valid passport'
    };
  }

}

export default HSBCService;