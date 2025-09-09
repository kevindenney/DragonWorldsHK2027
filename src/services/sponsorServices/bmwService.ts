import { UserStore } from '../../stores/userStore';

export interface BMWVehicle {
  id: string;
  model: string;
  series: '3_Series' | '5_Series' | '7_Series' | 'X3' | 'X5' | 'X7' | 'i4' | 'iX' | 'i7';
  type: 'sedan' | 'suv' | 'electric' | 'luxury';
  capacity: {
    passengers: number;
    luggage: number; // pieces
    sailBags: number; // special consideration for sailing equipment
  };
  features: string[];
  availability: {
    [date: string]: {
      available: boolean;
      timeSlots: string[];
    };
  };
  pricing: {
    hourly: number;
    halfDay: number;
    fullDay: number;
    airport: number;
    currency: 'HKD';
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
    pickupPoints: string[];
  };
  driverIncluded: boolean;
  fuelType: 'petrol' | 'electric' | 'hybrid';
  emissions: {
    co2: number; // g/km
    rating: 'A' | 'B' | 'C' | 'D';
  };
}

export interface TransportBooking {
  id: string;
  type: 'point_to_point' | 'hourly_charter' | 'daily_charter' | 'airport_transfer' | 'event_shuttle';
  vehicleId: string;
  passenger: {
    name: string;
    phone: string;
    email: string;
    specialRequests?: string[];
    accessibilityNeeds?: string[];
  };
  schedule: {
    pickup: {
      datetime: string;
      location: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      contactName?: string;
      contactPhone?: string;
    };
    dropoff: {
      datetime?: string;
      location: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    stops?: Array<{
      location: string;
      duration: number; // minutes
      purpose: string;
    }>;
  };
  status: 'requested' | 'confirmed' | 'driver_assigned' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  driver?: {
    name: string;
    phone: string;
    licenseNumber: string;
    rating: number;
    vehicleRegistration: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
    };
    estimatedArrival?: string;
  };
  pricing: {
    baseAmount: number;
    extras: Array<{
      item: string;
      amount: number;
    }>;
    totalAmount: number;
    currency: 'HKD';
  };
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'refunded';
  confirmationCode: string;
  specialServices: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BMWService {
  id: string;
  name: string;
  description: string;
  category: 'transport' | 'concierge' | 'experience' | 'maintenance';
  duration: number; // minutes
  pricing: {
    amount: number;
    currency: 'HKD';
    unit: 'per_hour' | 'per_service' | 'per_person';
  };
  availability: {
    [date: string]: string[];
  };
  requirements: string[];
  vipOnly: boolean;
  eventSpecific: boolean;
}

export interface BMWExperience {
  id: string;
  name: string;
  description: string;
  type: 'driving_experience' | 'factory_tour' | 'test_drive' | 'luxury_experience';
  duration: number; // minutes
  capacity: number;
  location: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  includes: string[];
  requirements: string[];
  pricing: {
    amount: number;
    currency: 'HKD';
    unit: 'per_person' | 'per_group';
  };
  availability: {
    [date: string]: Array<{
      time: string;
      spotsAvailable: number;
    }>;
  };
  ageRestriction: {
    minimum: number;
    drivingLicense: boolean;
  };
}

export interface BMWServiceConfig {
  baseUrl: string;
  apiKey: string;
  partnerId: string;
  region: 'Hong_Kong';
  emergencyContact: string;
}

class BMWService {
  private config: BMWServiceConfig;
  private userStore: typeof UserStore;

  constructor(userStore: typeof UserStore) {
    this.userStore = userStore;
    this.config = {
      baseUrl: process.env.EXPO_PUBLIC_BMW_API_URL || 'https://api.bmw.com.hk/mobility',
      apiKey: process.env.EXPO_PUBLIC_BMW_API_KEY || 'demo_key',
      partnerId: 'dragon_worlds_2027',
      region: 'Hong_Kong',
      emergencyContact: '+852 2345 6789'
    };
  }

  /**
   * Get available BMW vehicles for transport
   */
  async getAvailableVehicles(): Promise<BMWVehicle[]> {
    try {
      const vehicles: BMWVehicle[] = [
        {
          id: 'bmw_7_series_001',
          model: 'BMW 740Li',
          series: '7_Series',
          type: 'luxury',
          capacity: {
            passengers: 4,
            luggage: 3,
            sailBags: 2
          },
          features: [
            'Executive Lounge Seating',
            'Massage Seats',
            'Premium Sound System',
            'Wi-Fi Hotspot',
            'Climate Control',
            'Privacy Glass',
            'Champagne Cooler',
            'iPad Entertainment'
          ],
          availability: this.generateVehicleAvailability(),
          pricing: {
            hourly: 1200,
            halfDay: 4800,
            fullDay: 8800,
            airport: 1800,
            currency: 'HKD'
          },
          location: {
            latitude: 22.2816,
            longitude: 114.1581,
            address: 'BMW Service Center Central',
            pickupPoints: [
              'Conrad Hong Kong',
              'Peninsula Hong Kong',
              'Hong Kong Convention Centre',
              'Aberdeen Marina Club',
              'BMW Service Center Central'
            ]
          },
          driverIncluded: true,
          fuelType: 'hybrid',
          emissions: {
            co2: 45,
            rating: 'A'
          }
        },
        {
          id: 'bmw_x7_001',
          model: 'BMW X7 xDrive40i',
          series: 'X7',
          type: 'suv',
          capacity: {
            passengers: 7,
            luggage: 6,
            sailBags: 4
          },
          features: [
            '3-Row Seating',
            'Panoramic Sunroof',
            'Premium Sound System',
            'All-Wheel Drive',
            'Advanced Safety Features',
            'Cargo Management',
            'Trailer Hitch (for boat trailers)',
            'Weather Protection'
          ],
          availability: this.generateVehicleAvailability(),
          pricing: {
            hourly: 1000,
            halfDay: 4200,
            fullDay: 7800,
            airport: 1600,
            currency: 'HKD'
          },
          location: {
            latitude: 22.2500,
            longitude: 114.1600,
            address: 'BMW Aberdeen Service',
            pickupPoints: [
              'Aberdeen Marina Club',
              'Royal Hong Kong Yacht Club',
              'Middle Island Marina',
              'Conrad Hong Kong',
              'Hong Kong International Airport'
            ]
          },
          driverIncluded: true,
          fuelType: 'petrol',
          emissions: {
            co2: 198,
            rating: 'C'
          }
        },
        {
          id: 'bmw_ix_001',
          model: 'BMW iX xDrive50',
          series: 'iX',
          type: 'electric',
          capacity: {
            passengers: 5,
            luggage: 4,
            sailBags: 3
          },
          features: [
            'Fully Electric',
            '500km Range',
            'Fast Charging',
            'Sustainable Materials',
            'Advanced Driver Assistance',
            'Curved Display',
            'Crystal Gear Selector',
            'Air Suspension'
          ],
          availability: this.generateVehicleAvailability(),
          pricing: {
            hourly: 900,
            halfDay: 3800,
            fullDay: 7200,
            airport: 1400,
            currency: 'HKD'
          },
          location: {
            latitude: 22.2950,
            longitude: 114.1690,
            address: 'BMW Tsim Sha Tsui',
            pickupPoints: [
              'Peninsula Hong Kong',
              'Marco Polo Hong Kong',
              'Hong Kong Space Museum',
              'Star Ferry Terminal',
              'BMW Tsim Sha Tsui'
            ]
          },
          driverIncluded: true,
          fuelType: 'electric',
          emissions: {
            co2: 0,
            rating: 'A'
          }
        },
        {
          id: 'bmw_5_series_001',
          model: 'BMW 530e',
          series: '5_Series',
          type: 'sedan',
          capacity: {
            passengers: 5,
            luggage: 3,
            sailBags: 2
          },
          features: [
            'Plug-in Hybrid',
            'Business Class Interior',
            'Professional Navigation',
            'Parking Assistant',
            'Adaptive Cruise Control',
            'Lane Departure Warning',
            'USB Charging Ports',
            'Premium Audio'
          ],
          availability: this.generateVehicleAvailability(),
          pricing: {
            hourly: 700,
            halfDay: 3000,
            fullDay: 5600,
            airport: 1200,
            currency: 'HKD'
          },
          location: {
            latitude: 22.2760,
            longitude: 114.1820,
            address: 'BMW Wan Chai Service',
            pickupPoints: [
              'Hong Kong Convention Centre',
              'Grand Hyatt Hong Kong',
              'Wan Chai Ferry Terminal',
              'Hong Kong Academy for Sailing',
              'BMW Wan Chai Service'
            ]
          },
          driverIncluded: true,
          fuelType: 'hybrid',
          emissions: {
            co2: 41,
            rating: 'A'
          }
        }
      ];

      return vehicles;
    } catch (error) {
      console.error('Error fetching BMW vehicles:', error);
      throw new Error('Failed to load BMW vehicles');
    }
  }

  /**
   * Book transport service
   */
  async bookTransport(
    vehicleId: string,
    bookingDetails: Omit<TransportBooking, 'id' | 'status' | 'confirmationCode' | 'createdAt' | 'updatedAt' | 'pricing'>
  ): Promise<TransportBooking> {
    try {
      const vehicles = await this.getAvailableVehicles();
      const vehicle = vehicles.find(v => v.id === vehicleId);
      
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Calculate pricing
      const duration = this.calculateTripDuration(bookingDetails.schedule);
      const baseAmount = this.calculatePricing(vehicle, bookingDetails.type, duration);
      
      const booking: TransportBooking = {
        ...bookingDetails,
        id: `bmw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vehicleId,
        status: 'requested',
        pricing: {
          baseAmount,
          extras: this.calculateExtras(bookingDetails.specialServices),
          totalAmount: baseAmount + this.calculateExtras(bookingDetails.specialServices).reduce((sum, extra) => sum + extra.amount, 0),
          currency: 'HKD'
        },
        paymentStatus: 'pending',
        confirmationCode: `BMW${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // In real implementation, this would call BMW's booking API
      console.log('BMW transport booking created:', booking);
      
      return booking;
    } catch (error) {
      console.error('Error booking transport:', error);
      throw new Error('Failed to book BMW transport');
    }
  }

  /**
   * Get available BMW experiences
   */
  async getExperiences(): Promise<BMWExperience[]> {
    try {
      const experiences: BMWExperience[] = [
        {
          id: 'bmw_sailing_experience',
          name: 'BMW Sailing & Driving Experience',
          description: 'Unique combination of sailing and luxury driving in Hong Kong',
          type: 'luxury_experience',
          duration: 480, // 8 hours
          capacity: 8,
          location: {
            name: 'Aberdeen Marina Club',
            address: '20 Sham Wan Road, Aberdeen',
            coordinates: { latitude: 22.2474, longitude: 114.1555 }
          },
          includes: [
            'Professional sailing instruction',
            'BMW luxury vehicle experience',
            'Gourmet lunch at marina restaurant',
            'Professional photography service',
            'BMW branded sailing gear',
            'Certificate of participation'
          ],
          requirements: [
            'Valid ID',
            'Basic swimming ability',
            'Valid driving license (for driving portion)',
            'Weather contingency understanding'
          ],
          pricing: {
            amount: 4500,
            currency: 'HKD',
            unit: 'per_person'
          },
          availability: this.generateExperienceAvailability(),
          ageRestriction: {
            minimum: 18,
            drivingLicense: true
          }
        },
        {
          id: 'bmw_electric_tour',
          name: 'BMW Electric Hong Kong Tour',
          description: 'Sustainable luxury tour of Hong Kong in BMW electric vehicles',
          type: 'driving_experience',
          duration: 360, // 6 hours
          capacity: 12,
          location: {
            name: 'BMW Experience Center',
            address: '123 Electric Avenue, Central',
            coordinates: { latitude: 22.2816, longitude: 114.1581 }
          },
          includes: [
            'BMW iX or i7 vehicle experience',
            'Professional tour guide',
            'Sustainable lunch at eco-restaurant',
            'Charging station education',
            'Hong Kong sustainability insights',
            'BMW electric vehicle literature'
          ],
          requirements: [
            'Valid driving license',
            'Environmental consciousness',
            'Basic English or Chinese'
          ],
          pricing: {
            amount: 2800,
            currency: 'HKD',
            unit: 'per_person'
          },
          availability: this.generateExperienceAvailability(),
          ageRestriction: {
            minimum: 21,
            drivingLicense: true
          }
        },
        {
          id: 'bmw_heritage_tour',
          name: 'BMW Heritage & Craftsmanship Experience',
          description: 'Learn about BMW heritage while exploring Hong Kong craftsmanship',
          type: 'luxury_experience',
          duration: 240, // 4 hours
          capacity: 6,
          location: {
            name: 'BMW Heritage Center',
            address: 'Heritage Building, Admiralty',
            coordinates: { latitude: 22.2783, longitude: 114.1650 }
          },
          includes: [
            'BMW heritage presentation',
            'Local craftsman workshops visit',
            'Traditional tea ceremony',
            'BMW model display and history',
            'Artisan-crafted BMW accessories',
            'Cultural exchange discussion'
          ],
          requirements: [
            'Interest in automotive heritage',
            'Cultural appreciation',
            'Valid ID'
          ],
          pricing: {
            amount: 1800,
            currency: 'HKD',
            unit: 'per_person'
          },
          availability: this.generateExperienceAvailability(),
          ageRestriction: {
            minimum: 16,
            drivingLicense: false
          }
        }
      ];

      return experiences;
    } catch (error) {
      console.error('Error fetching BMW experiences:', error);
      throw new Error('Failed to load BMW experiences');
    }
  }

  /**
   * Get available BMW services
   */
  async getServices(): Promise<BMWService[]> {
    return [
      {
        id: 'airport_transfer',
        name: 'Premium Airport Transfer',
        description: 'Luxury transfer to/from Hong Kong International Airport',
        category: 'transport',
        duration: 90,
        pricing: {
          amount: 1500,
          currency: 'HKD',
          unit: 'per_service'
        },
        availability: this.generateServiceAvailability(),
        requirements: ['Flight details', '24-hour advance booking'],
        vipOnly: false,
        eventSpecific: true
      },
      {
        id: 'race_day_shuttle',
        name: 'Race Day Shuttle Service',
        description: 'Dedicated shuttle between hotels and racing venues',
        category: 'transport',
        duration: 45,
        pricing: {
          amount: 800,
          currency: 'HKD',
          unit: 'per_service'
        },
        availability: this.generateServiceAvailability(),
        requirements: ['Event credentials', 'Schedule confirmation'],
        vipOnly: false,
        eventSpecific: true
      },
      {
        id: 'equipment_transport',
        name: 'Sailing Equipment Transport',
        description: 'Specialized transport for sailing gear and equipment',
        category: 'transport',
        duration: 60,
        pricing: {
          amount: 600,
          currency: 'HKD',
          unit: 'per_service'
        },
        availability: this.generateServiceAvailability(),
        requirements: ['Equipment inventory', 'Insurance coverage'],
        vipOnly: false,
        eventSpecific: true
      },
      {
        id: 'vip_concierge_drive',
        name: 'VIP Concierge Driver Service',
        description: 'Personal driver and concierge for full-day assistance',
        category: 'concierge',
        duration: 480, // 8 hours
        pricing: {
          amount: 3500,
          currency: 'HKD',
          unit: 'per_service'
        },
        availability: this.generateServiceAvailability(),
        requirements: ['VIP status verification', '48-hour advance booking'],
        vipOnly: true,
        eventSpecific: false
      },
      {
        id: 'emergency_assistance',
        name: '24/7 Emergency Assistance',
        description: 'Round-the-clock emergency transport and assistance',
        category: 'concierge',
        duration: 60,
        pricing: {
          amount: 1200,
          currency: 'HKD',
          unit: 'per_service'
        },
        availability: this.generate24HourAvailability(),
        requirements: ['Emergency contact verification'],
        vipOnly: false,
        eventSpecific: true
      }
    ];
  }

  /**
   * Get BMW partnership benefits for Dragon Worlds
   */
  async getEventBenefits(): Promise<{
    title: string;
    description: string;
    benefits: string[];
    eligibility: string;
    howToAccess: string;
  }> {
    return {
      title: 'BMW Mobility Partner - Dragon Worlds 2027',
      description: 'Premium mobility solutions and exclusive automotive experiences for championship participants',
      benefits: [
        '20% discount on all BMW transport services',
        'Priority booking for airport transfers',
        'Complimentary equipment transport for registered sailors',
        'Free BMW electric vehicle test drives',
        'Access to exclusive BMW sailing & driving experiences',
        'VIP treatment at all BMW service centers',
        '24/7 emergency transport assistance',
        'Professional chauffeur services for team celebrations',
        'Sustainable transport options with electric vehicles',
        'BMW merchandise and sailing collaboration gear'
      ],
      eligibility: 'Available to registered Dragon Worlds participants, officials, crew members, and VIP guests',
      howToAccess: 'Book through Dragon Worlds app or contact BMW Event Concierge at +852 2345 6789'
    };
  }

  /**
   * Track transport booking in real-time
   */
  async trackBooking(bookingId: string): Promise<{
    status: TransportBooking['status'];
    driver?: TransportBooking['driver'];
    estimatedArrival?: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
    };
    updates: Array<{
      timestamp: string;
      status: string;
      message: string;
    }>;
  }> {
    try {
      // Demo tracking data - in real implementation, would fetch from BMW API
      return {
        status: 'en_route',
        driver: {
          name: 'David Chan',
          phone: '+852 9876 5432',
          licenseNumber: 'HK123456',
          rating: 4.9,
          vehicleRegistration: 'BMW 001',
          currentLocation: {
            latitude: 22.2900,
            longitude: 114.1750
          },
          estimatedArrival: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        },
        estimatedArrival: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        currentLocation: {
          latitude: 22.2900,
          longitude: 114.1750
        },
        updates: [
          {
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            status: 'confirmed',
            message: 'Booking confirmed and driver assigned'
          },
          {
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            status: 'driver_assigned',
            message: 'Driver David Chan assigned to your booking'
          },
          {
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            status: 'en_route',
            message: 'Driver is en route to pickup location'
          }
        ]
      };
    } catch (error) {
      console.error('Error tracking booking:', error);
      throw new Error('Failed to track booking');
    }
  }

  /**
   * Generate vehicle availability
   */
  private generateVehicleAvailability(): { [date: string]: { available: boolean; timeSlots: string[] } } {
    const availability: { [date: string]: { available: boolean; timeSlots: string[] } } = {};
    const startDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      const timeSlots: string[] = [];
      const isAvailable = Math.random() > 0.2; // 80% availability
      
      if (isAvailable) {
        for (let hour = 6; hour < 23; hour++) {
          if (Math.random() > 0.3) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
          }
        }
      }
      
      availability[dateKey] = {
        available: isAvailable,
        timeSlots
      };
    }
    
    return availability;
  }

  /**
   * Generate experience availability
   */
  private generateExperienceAvailability(): { [date: string]: Array<{ time: string; spotsAvailable: number }> } {
    const availability: { [date: string]: Array<{ time: string; spotsAvailable: number }> } = {};
    const startDate = new Date();
    
    for (let i = 0; i < 21; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      const sessions = [];
      
      // Morning session
      if (Math.random() > 0.4) {
        sessions.push({
          time: '09:00',
          spotsAvailable: Math.floor(Math.random() * 8) + 2
        });
      }
      
      // Afternoon session  
      if (Math.random() > 0.3) {
        sessions.push({
          time: '14:00',
          spotsAvailable: Math.floor(Math.random() * 6) + 1
        });
      }
      
      availability[dateKey] = sessions;
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
      for (let hour = 6; hour < 22; hour++) {
        if (Math.random() > 0.4) {
          timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
      }
      
      availability[dateKey] = timeSlots;
    }
    
    return availability;
  }

  /**
   * Generate 24-hour availability
   */
  private generate24HourAvailability(): { [date: string]: string[] } {
    const availability: { [date: string]: string[] } = {};
    const startDate = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      availability[dateKey] = ['24/7'];
    }
    
    return availability;
  }

  /**
   * Calculate trip duration
   */
  private calculateTripDuration(schedule: TransportBooking['schedule']): number {
    if (schedule.dropoff.datetime && schedule.pickup.datetime) {
      return Math.ceil((new Date(schedule.dropoff.datetime).getTime() - new Date(schedule.pickup.datetime).getTime()) / 60000);
    }
    return 60; // Default 1 hour
  }

  /**
   * Calculate pricing based on booking type
   */
  private calculatePricing(vehicle: BMWVehicle, type: TransportBooking['type'], duration: number): number {
    switch (type) {
      case 'airport_transfer':
        return vehicle.pricing.airport;
      case 'hourly_charter':
        return Math.ceil(duration / 60) * vehicle.pricing.hourly;
      case 'daily_charter':
        return vehicle.pricing.fullDay;
      case 'point_to_point':
        return Math.max(vehicle.pricing.hourly, duration > 240 ? vehicle.pricing.halfDay : vehicle.pricing.hourly);
      default:
        return vehicle.pricing.hourly;
    }
  }

  /**
   * Calculate extra charges
   */
  private calculateExtras(specialServices: string[]): Array<{ item: string; amount: number }> {
    const extras: Array<{ item: string; amount: number }> = [];
    
    specialServices.forEach(service => {
      switch (service) {
        case 'child_seat':
          extras.push({ item: 'Child Safety Seat', amount: 150 });
          break;
        case 'wheelchair_access':
          extras.push({ item: 'Wheelchair Accessibility', amount: 0 });
          break;
        case 'extra_luggage':
          extras.push({ item: 'Extra Luggage Space', amount: 200 });
          break;
        case 'refreshments':
          extras.push({ item: 'In-Vehicle Refreshments', amount: 300 });
          break;
        case 'wifi':
          extras.push({ item: 'Premium Wi-Fi', amount: 100 });
          break;
        case 'phone_chargers':
          extras.push({ item: 'Device Charging Cables', amount: 50 });
          break;
      }
    });
    
    return extras;
  }
}

export default BMWService;