import type { UserState } from '../../stores/userStore';

export interface SinoProperty {
  id: string;
  name: string;
  brand: 'Conrad' | 'Peninsula' | 'Marco_Polo' | 'Gateway' | 'Harbour_Plaza';
  type: 'hotel' | 'restaurant' | 'shopping' | 'office' | 'residential';
  category: 'luxury' | 'premium' | 'business' | 'lifestyle';
  location: {
    address: string;
    district: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  amenities: SinoAmenity[];
  services: SinoService[];
  contact: {
    phone: string;
    email: string;
    website: string;
    concierge?: string;
  };
  availability: {
    [date: string]: {
      rooms?: number;
      tables?: number;
      events?: boolean;
    };
  };
  pricing: {
    currency: 'HKD' | 'USD';
    ranges: {
      [category: string]: {
        min: number;
        max: number;
        unit: 'per_night' | 'per_person' | 'per_hour' | 'per_event';
      };
    };
  };
  vipAccess: boolean;
  eventPartnership: boolean;
  distance?: number;
}

export interface SinoAmenity {
  id: string;
  name: string;
  description: string;
  category: 'accommodation' | 'dining' | 'wellness' | 'business' | 'recreation' | 'transport';
  isComplimentary: boolean;
  hours?: {
    open: string;
    close: string;
    days: string[];
  };
  bookingRequired: boolean;
  vipOnly: boolean;
}

export interface SinoService {
  id: string;
  name: string;
  description: string;
  category: 'concierge' | 'dining' | 'accommodation' | 'events' | 'transport' | 'wellness';
  provider: string;
  duration: number; // minutes
  capacity: number;
  pricing: {
    amount: number;
    currency: 'HKD' | 'USD';
    unit: 'per_person' | 'per_group' | 'per_hour' | 'fixed';
  };
  availability: {
    [date: string]: string[]; // available time slots
  };
  requirements: string[];
  cancellationPolicy: string;
  vipOnly: boolean;
}

export interface HospitalityBooking {
  id: string;
  type: 'accommodation' | 'dining' | 'experience' | 'transport' | 'event';
  propertyId: string;
  serviceId?: string;
  guest: {
    name: string;
    email: string;
    phone: string;
    specialRequests?: string[];
    dietaryRestrictions?: string[];
    accessibilityNeeds?: string[];
  };
  booking: {
    checkIn?: string;
    checkOut?: string;
    date?: string;
    time?: string;
    duration?: number;
    guests: number;
    children?: number;
  };
  status: 'requested' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  confirmationCode: string;
  totalAmount: number;
  currency: 'HKD' | 'USD';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialArrangements?: string[];
  conciergeNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConciergeRequest {
  id: string;
  type: 'restaurant_reservation' | 'transportation' | 'cultural_tour' | 'shopping_assistance' | 'event_tickets' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'received' | 'in_progress' | 'completed' | 'cancelled';
  guest: {
    name: string;
    propertyId?: string;
    roomNumber?: string;
    phone: string;
    email: string;
  };
  request: {
    title: string;
    description: string;
    preferences?: string[];
    budget?: {
      min: number;
      max: number;
      currency: 'HKD' | 'USD';
    };
    timeframe: {
      preferred: string;
      flexible: boolean;
      deadline?: string;
    };
  };
  assignment: {
    concierge: string;
    assignedAt: string;
    estimatedCompletion: string;
  };
  resolution?: {
    solution: string;
    alternatives?: string[];
    cost?: number;
    bookingReferences?: string[];
    completedAt: string;
  };
  feedback?: {
    rating: number;
    comments: string;
    submittedAt: string;
  };
}

export interface SinoServiceConfig {
  baseUrl: string;
  apiKey: string;
  partnerId: string;
  conciergeHours: string;
}

class SinoGroupService {
  private config: SinoServiceConfig;
  private userState: UserState;

  constructor(userState: UserState) {
    this.userState = userState;
    this.config = {
      baseUrl: process.env.EXPO_PUBLIC_SINO_API_URL || 'https://api.sino.com/hospitality',
      apiKey: process.env.EXPO_PUBLIC_SINO_API_KEY || 'demo_key',
      partnerId: 'dragon_worlds_2027',
      conciergeHours: '24/7 during championship week'
    };
  }

  /**
   * Get Sino Group properties available for event guests
   */
  async getProperties(): Promise<SinoProperty[]> {
    try {
      const properties: SinoProperty[] = [
        {
          id: 'conrad_hong_kong',
          name: 'Conrad Hong Kong',
          brand: 'Conrad',
          type: 'hotel',
          category: 'luxury',
          location: {
            address: 'Pacific Place, 88 Queensway, Admiralty',
            district: 'Admiralty',
            coordinates: { latitude: 22.2793, longitude: 114.1722 }
          },
          amenities: [
            {
              id: 'golden_leaf_restaurant',
              name: 'Golden Leaf',
              description: 'Award-winning Cantonese cuisine',
              category: 'dining',
              isComplimentary: false,
              hours: {
                open: '12:00 PM',
                close: '10:30 PM',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              },
              bookingRequired: true,
              vipOnly: false
            },
            {
              id: 'spa_wellness',
              name: 'Spa & Wellness Center',
              description: 'Full-service spa with harbour views',
              category: 'wellness',
              isComplimentary: false,
              hours: {
                open: '6:00 AM',
                close: '10:00 PM',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              },
              bookingRequired: true,
              vipOnly: false
            },
            {
              id: 'executive_lounge',
              name: 'Executive Lounge',
              description: 'Exclusive lounge for VIP guests',
              category: 'business',
              isComplimentary: true,
              hours: {
                open: '6:00 AM',
                close: '11:00 PM',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              },
              bookingRequired: false,
              vipOnly: true
            }
          ],
          services: await this.getPropertyServices('conrad_hong_kong'),
          contact: {
            phone: '+852 2521 3838',
            email: 'reservations.conrad@sino.com',
            website: 'https://www.conradhongkong.com',
            concierge: '+852 2521 3838 ext. 3000'
          },
          availability: this.generateAvailability(),
          pricing: {
            currency: 'HKD',
            ranges: {
              'Deluxe Room': { min: 3500, max: 4500, unit: 'per_night' },
              'Executive Suite': { min: 6000, max: 8000, unit: 'per_night' },
              'Presidential Suite': { min: 15000, max: 25000, unit: 'per_night' }
            }
          },
          vipAccess: true,
          eventPartnership: true
        },
        {
          id: 'peninsula_hong_kong',
          name: 'The Peninsula Hong Kong',
          brand: 'Peninsula',
          type: 'hotel',
          category: 'luxury',
          location: {
            address: 'Salisbury Road, Tsim Sha Tsui',
            district: 'Tsim Sha Tsui',
            coordinates: { latitude: 22.2950, longitude: 114.1722 }
          },
          amenities: [
            {
              id: 'afternoon_tea',
              name: 'Legendary Afternoon Tea',
              description: 'World-famous afternoon tea service',
              category: 'dining',
              isComplimentary: false,
              hours: {
                open: '2:00 PM',
                close: '6:00 PM',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              },
              bookingRequired: true,
              vipOnly: false
            },
            {
              id: 'rolls_royce_fleet',
              name: 'Rolls-Royce Fleet',
              description: 'Chauffeur service in Rolls-Royce vehicles',
              category: 'transport',
              isComplimentary: false,
              hours: {
                open: '24 Hours',
                close: '24 Hours',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              },
              bookingRequired: true,
              vipOnly: true
            },
            {
              id: 'espa_peninsula',
              name: 'ESPA at The Peninsula',
              description: 'Luxury spa and wellness sanctuary',
              category: 'wellness',
              isComplimentary: false,
              hours: {
                open: '6:00 AM',
                close: '11:00 PM',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              },
              bookingRequired: true,
              vipOnly: false
            }
          ],
          services: await this.getPropertyServices('peninsula_hong_kong'),
          contact: {
            phone: '+852 2920 2888',
            email: 'reservations.peninsula@sino.com',
            website: 'https://www.peninsula.com/hong-kong',
            concierge: '+852 2920 2888 ext. 2000'
          },
          availability: this.generateAvailability(),
          pricing: {
            currency: 'HKD',
            ranges: {
              'Superior Room': { min: 4000, max: 5500, unit: 'per_night' },
              'Deluxe Suite': { min: 8000, max: 12000, unit: 'per_night' },
              'Peninsula Suite': { min: 20000, max: 35000, unit: 'per_night' }
            }
          },
          vipAccess: true,
          eventPartnership: true
        },
        {
          id: 'marco_polo_hongkong',
          name: 'Marco Polo Hongkong Hotel',
          brand: 'Marco_Polo',
          type: 'hotel',
          category: 'premium',
          location: {
            address: 'Harbour City, 3 Canton Road, Tsim Sha Tsui',
            district: 'Tsim Sha Tsui',
            coordinates: { latitude: 22.2940, longitude: 114.1680 }
          },
          amenities: [
            {
              id: 'continental_club',
              name: 'Continental Club',
              description: 'Executive club lounge with harbour views',
              category: 'business',
              isComplimentary: true,
              hours: {
                open: '6:00 AM',
                close: '10:00 PM',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              },
              bookingRequired: false,
              vipOnly: true
            },
            {
              id: 'cucina_restaurant',
              name: 'Cucina',
              description: 'Italian fine dining with harbour views',
              category: 'dining',
              isComplimentary: false,
              hours: {
                open: '12:00 PM',
                close: '11:00 PM',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              },
              bookingRequired: true,
              vipOnly: false
            }
          ],
          services: await this.getPropertyServices('marco_polo_hongkong'),
          contact: {
            phone: '+852 2113 0088',
            email: 'reservations.marcopolo@sino.com',
            website: 'https://www.marcopolohotels.com',
            concierge: '+852 2113 0088 ext. 1000'
          },
          availability: this.generateAvailability(),
          pricing: {
            currency: 'HKD',
            ranges: {
              'Harbour View Room': { min: 2500, max: 3500, unit: 'per_night' },
              'Continental Club Room': { min: 3200, max: 4200, unit: 'per_night' },
              'Marco Polo Suite': { min: 5500, max: 8500, unit: 'per_night' }
            }
          },
          vipAccess: false,
          eventPartnership: true
        }
      ];

      return properties;
    } catch (error) {
      throw new Error('Failed to load Sino Group properties');
    }
  }

  /**
   * Get services available at a specific property
   */
  async getPropertyServices(propertyId: string): Promise<SinoService[]> {
    const baseServices: SinoService[] = [
      {
        id: 'concierge_general',
        name: 'General Concierge Service',
        description: 'Personal assistance for any requests',
        category: 'concierge',
        provider: 'In-house Concierge Team',
        duration: 30,
        capacity: 1,
        pricing: {
          amount: 0,
          currency: 'HKD',
          unit: 'per_person'
        },
        availability: this.generateServiceAvailability(),
        requirements: ['Guest registration'],
        cancellationPolicy: 'Flexible cancellation',
        vipOnly: false
      },
      {
        id: 'dining_reservation',
        name: 'Restaurant Reservations',
        description: 'Book tables at premium Hong Kong restaurants',
        category: 'dining',
        provider: 'Concierge Team',
        duration: 15,
        capacity: 8,
        pricing: {
          amount: 0,
          currency: 'HKD',
          unit: 'per_group'
        },
        availability: this.generateServiceAvailability(),
        requirements: ['Group size', 'Dietary preferences', 'Preferred time'],
        cancellationPolicy: '24-hour advance notice required',
        vipOnly: false
      },
      {
        id: 'cultural_tour',
        name: 'Private Cultural Tour',
        description: 'Guided tour of Hong Kong cultural highlights',
        category: 'concierge',
        provider: 'Professional Tour Guide',
        duration: 240,
        capacity: 6,
        pricing: {
          amount: 2500,
          currency: 'HKD',
          unit: 'per_group'
        },
        availability: this.generateServiceAvailability(),
        requirements: ['Valid ID', 'Comfortable walking shoes'],
        cancellationPolicy: '48-hour advance notice for full refund',
        vipOnly: false
      }
    ];

    // Add property-specific services
    switch (propertyId) {
      case 'conrad_hong_kong':
        baseServices.push({
          id: 'spa_treatment',
          name: 'Signature Spa Treatment',
          description: 'Rejuvenating spa experience with harbour views',
          category: 'wellness',
          provider: 'Conrad Spa',
          duration: 120,
          capacity: 2,
          pricing: {
            amount: 1800,
            currency: 'HKD',
            unit: 'per_person'
          },
          availability: this.generateServiceAvailability(),
          requirements: ['Health questionnaire', 'Advance booking'],
          cancellationPolicy: '24-hour advance notice for full refund',
          vipOnly: false
        });
        break;
        
      case 'peninsula_hong_kong':
        baseServices.push(
          {
            id: 'rolls_royce_transfer',
            name: 'Rolls-Royce Airport Transfer',
            description: 'Luxury airport transfer in Rolls-Royce',
            category: 'transport',
            provider: 'Peninsula Fleet',
            duration: 90,
            capacity: 3,
            pricing: {
              amount: 3500,
              currency: 'HKD',
              unit: 'per_group'
            },
            availability: this.generateServiceAvailability(),
            requirements: ['Flight details', 'Passenger names'],
            cancellationPolicy: '6-hour advance notice required',
            vipOnly: true
          },
          {
            id: 'afternoon_tea_experience',
            name: 'Traditional Afternoon Tea',
            description: 'World-famous Peninsula afternoon tea',
            category: 'dining',
            provider: 'The Lobby Restaurant',
            duration: 120,
            capacity: 4,
            pricing: {
              amount: 588,
              currency: 'HKD',
              unit: 'per_person'
            },
            availability: this.generateServiceAvailability(),
            requirements: ['Smart casual dress code'],
            cancellationPolicy: '24-hour advance notice required',
            vipOnly: false
          }
        );
        break;
    }

    return baseServices;
  }

  /**
   * Make a hospitality booking
   */
  async makeBooking(
    propertyId: string,
    serviceId: string | undefined,
    guestInfo: HospitalityBooking['guest'],
    bookingDetails: HospitalityBooking['booking'],
    specialRequests?: string[]
  ): Promise<HospitalityBooking> {
    try {
      const user = this.userState;
      
      const booking: HospitalityBooking = {
        id: `sino_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: serviceId ? 'experience' : 'accommodation',
        propertyId,
        serviceId,
        guest: guestInfo,
        booking: bookingDetails,
        status: 'requested',
        confirmationCode: `SINO${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        totalAmount: this.calculateBookingAmount(propertyId, serviceId, bookingDetails),
        currency: 'HKD',
        paymentStatus: 'pending',
        specialArrangements: specialRequests,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // In real implementation, this would call Sino's booking API
      
      return booking;
    } catch (error) {
      throw new Error('Failed to create booking');
    }
  }

  /**
   * Submit concierge request
   */
  async submitConciergeRequest(
    request: Omit<ConciergeRequest, 'id' | 'status' | 'assignment' | 'createdAt' | 'updatedAt'>
  ): Promise<ConciergeRequest> {
    try {
      const conciergeRequest: ConciergeRequest = {
        ...request,
        id: `concierge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'received',
        assignment: {
          concierge: 'Sarah Chen - Senior Concierge',
          assignedAt: new Date().toISOString(),
          estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      };

      // In real implementation, this would call Sino's concierge API
      
      return conciergeRequest;
    } catch (error) {
      throw new Error('Failed to submit concierge request');
    }
  }

  /**
   * Get VIP benefits for Dragon Worlds participants
   */
  async getVIPBenefits(): Promise<{
    title: string;
    description: string;
    benefits: string[];
    eligibility: string;
    howToRedeem: string;
  }> {
    return {
      title: 'Sino Group VIP Experience - Dragon Worlds 2027',
      description: 'Exclusive hospitality benefits for sailing championship participants and VIP guests',
      benefits: [
        'Complimentary room upgrade (subject to availability)',
        '24/7 dedicated concierge service',
        'Priority restaurant reservations at all Sino properties',
        'Complimentary airport transfers in luxury vehicles',
        'Access to executive lounges and private areas',
        'Special rates for spa and wellness services',
        'Cultural tour experiences with professional guides',
        'Private dining arrangements for team celebrations',
        'Flexible check-in/check-out times',
        'Complimentary laundry and pressing services'
      ],
      eligibility: 'Available to registered Dragon Worlds participants, officials, and accredited VIP guests',
      howToRedeem: 'Present event credentials at any Sino Group property or contact our dedicated event concierge'
    };
  }

  /**
   * Get cultural recommendations
   */
  async getCulturalRecommendations(): Promise<{
    attractions: Array<{
      name: string;
      description: string;
      category: string;
      duration: string;
      highlights: string[];
    }>;
    experiences: Array<{
      name: string;
      description: string;
      duration: string;
      price: string;
      included: string[];
    }>;
  }> {
    return {
      attractions: [
        {
          name: 'Victoria Peak',
          description: 'Hong Kong\'s most iconic attraction with panoramic city views',
          category: 'Sightseeing',
          duration: '3-4 hours',
          highlights: [
            'Sky Terrace 428 observation deck',
            'Historic Peak Tram journey',
            'Shopping and dining at The Peak Galleria',
            'Nature walks around the peak'
          ]
        },
        {
          name: 'Star Ferry & Symphony of Lights',
          description: 'Historic ferry crossing with multimedia light show',
          category: 'Cultural Experience',
          duration: '2-3 hours',
          highlights: [
            'Historic Star Ferry crossing',
            'World\'s largest permanent light show',
            'Harbour views from Tsim Sha Tsui Promenade',
            'Avenue of Stars walkway'
          ]
        },
        {
          name: 'Man Mo Temple',
          description: 'Historic Taoist temple dedicated to literature and war gods',
          category: 'Cultural Heritage',
          duration: '1-2 hours',
          highlights: [
            '150-year-old temple architecture',
            'Giant incense coils',
            'Traditional fortune telling',
            'Nearby antique shops on Hollywood Road'
          ]
        }
      ],
      experiences: [
        {
          name: 'Private Junk Boat Charter',
          description: 'Traditional Chinese junk boat cruise around Victoria Harbour',
          duration: '4 hours',
          price: 'From HKD 15,000 per boat',
          included: [
            'Professional captain and crew',
            'Gourmet catering and beverages',
            'Sound system and entertainment',
            'Photography service',
            'Flexible itinerary planning'
          ]
        },
        {
          name: 'Michelin-Starred Dining Experience',
          description: 'Curated dining tour of Hong Kong\'s best restaurants',
          duration: '6 hours',
          price: 'From HKD 3,500 per person',
          included: [
            'Private transportation',
            'Multi-course meals at 3 venues',
            'Wine pairings',
            'Food culture guide',
            'Recipe cards and souvenirs'
          ]
        },
        {
          name: 'Traditional Markets & Street Food Tour',
          description: 'Authentic local experience through traditional markets',
          duration: '3 hours',
          price: 'From HKD 1,200 per person',
          included: [
            'Professional local guide',
            'Market visits and street food tastings',
            'Cultural insights and history',
            'Cooking demonstration',
            'Take-home spice collection'
          ]
        }
      ]
    };
  }

  /**
   * Generate availability for properties
   */
  private generateAvailability(): { [date: string]: { rooms?: number; tables?: number; events?: boolean } } {
    const availability: { [date: string]: any } = {};
    const startDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      availability[dateKey] = {
        rooms: Math.floor(Math.random() * 20) + 5,
        tables: Math.floor(Math.random() * 15) + 3,
        events: Math.random() > 0.3
      };
    }
    
    return availability;
  }

  /**
   * Generate service availability
   */
  private generateServiceAvailability(): { [date: string]: string[] } {
    const availability: { [date: string]: string[] } = {};
    const startDate = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      const timeSlots: string[] = [];
      for (let hour = 9; hour < 20; hour += 2) {
        if (Math.random() > 0.3) {
          timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
      }
      
      availability[dateKey] = timeSlots;
    }
    
    return availability;
  }

  /**
   * Calculate booking amount
   */
  private calculateBookingAmount(propertyId: string, serviceId: string | undefined, bookingDetails: HospitalityBooking['booking']): number {
    // Demo calculation - in real implementation, would use actual pricing
    let baseAmount = 0;
    
    if (serviceId) {
      // Service booking
      switch (serviceId) {
        case 'spa_treatment':
          baseAmount = 1800 * (bookingDetails.guests || 1);
          break;
        case 'rolls_royce_transfer':
          baseAmount = 3500;
          break;
        case 'afternoon_tea_experience':
          baseAmount = 588 * (bookingDetails.guests || 1);
          break;
        case 'cultural_tour':
          baseAmount = 2500;
          break;
        default:
          baseAmount = 1000;
      }
    } else {
      // Accommodation booking
      const nights = bookingDetails.checkIn && bookingDetails.checkOut ? 
        Math.ceil((new Date(bookingDetails.checkOut).getTime() - new Date(bookingDetails.checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 1;
      
      switch (propertyId) {
        case 'conrad_hong_kong':
          baseAmount = 4000 * nights;
          break;
        case 'peninsula_hong_kong':
          baseAmount = 5000 * nights;
          break;
        case 'marco_polo_hongkong':
          baseAmount = 3000 * nights;
          break;
        default:
          baseAmount = 2500 * nights;
      }
    }
    
    return baseAmount;
  }
}

export default SinoGroupService;