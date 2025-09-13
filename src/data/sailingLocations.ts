import { SailingLocation, SailingLocationFilter } from '../types/sailingLocation';

export const sailingLocations: SailingLocation[] = [
  {
    id: 'ninepins_race_course',
    name: 'Ninepins Islands Race Course',
    type: 'race_course',
    coordinates: {
      latitude: 22.1878,
      longitude: 114.3442
    },
    description: 'Primary offshore racing area for Dragon World Championship 2027. Site of historic 2015 Etchells World Championship.',
    championshipRole: 'Main race course with multiple configurations up to 8nm long',
    importance: 'primary',
    championshipSpecific: true,
    
    racerInfo: 'Premier offshore racing area with excellent wind conditions. Multiple course configurations available. Race area boundaries clearly marked with GPS coordinates provided in daily sailing instructions.',
    spectatorInfo: 'Best viewing from charter boats or Clearwater Bay shoreline. Public ferry charters available during major race days. Bring binoculars for distant racing action.',
    
    championshipEvents: [
      {
        date: '2027-11-22',
        time: '11:00',
        event: 'Practice Race 1',
        description: 'First practice race on championship course'
      },
      {
        date: '2027-11-24',
        time: '11:00',
        event: 'Qualifying Series Races 1-3',
        description: 'Opening races of championship series'
      }
    ],
    
    transportation: [
      {
        type: 'ferry',
        route: 'Charter boats from Clearwater Bay Marina',
        schedule: 'Race days: 09:30, 10:00, 10:30 departures',
        cost: 'HK$200 per person',
        notes: 'Advance booking required'
      }
    ]
  },
  
  {
    id: 'rhkyc_kellett',
    name: 'Royal Hong Kong Yacht Club - Kellett Island',
    type: 'championship_hq',
    coordinates: {
      latitude: 22.2845,
      longitude: 114.1822
    },
    description: 'Historic yacht club (est. 1908) and Dragon World Championship 2027 headquarters. Asia\'s premier yacht club and regatta organizer.',
    championshipRole: 'Championship headquarters for registration, measurement, daily briefings, and awards ceremonies',
    importance: 'primary',
    championshipSpecific: true,
    
    address: 'Kellett Island, Causeway Bay, Hong Kong',
    
    facilities: [
      'Boat measurement area',
      'Registration office', 
      'Race office',
      'Daily briefing room',
      'Competitors\' lounge',
      'Equipment storage',
      'Boat launching facilities',
      'Dining facilities',
      'Awards ceremony venue'
    ],
    
    contact: {
      phone: '+852 2832 2817',
      email: 'office@rhkyc.org.hk',
      website: 'www.rhkyc.org.hk'
    },
    
    racerInfo: 'All competitors must complete registration and boat measurement here. Daily skippers\' briefings at 09:30. Secure boat storage available. Professional marine services on-site.',
    spectatorInfo: 'Clubhouse terrace offers excellent views of racing action. Restaurant open to guests. Historic club with maritime artifacts and racing memorabilia.',
    
    championshipEvents: [
      {
        date: '2027-11-21',
        time: '09:00',
        event: 'Registration Opens',
        description: 'Competitor registration and boat measurement begins'
      },
      {
        date: '2027-11-22',
        time: '09:30',
        event: 'Daily Briefings',
        description: 'Daily skippers\' briefings throughout championship week'
      }
    ],
    
    transportation: [
      {
        type: 'mtr',
        route: 'Causeway Bay Station (Exit E)',
        schedule: '05:00-01:00 daily',
        cost: 'HK$10-25 from Central',
        notes: '5-minute walk from MTR station'
      },
      {
        type: 'taxi',
        route: 'From Hong Kong International Airport',
        cost: 'HK$400-500',
        notes: '45-60 minutes depending on traffic'
      }
    ],
    
    operatingHours: 'Championship week: 07:00-20:00 daily'
  },
  
  // Additional RHKYC Locations
  {
    id: 'rhkyc_middle_island',
    name: 'Royal Hong Kong Yacht Club - Middle Island',
    type: 'yacht_club',
    coordinates: {
      latitude: 22.2447,
      longitude: 114.1953
    },
    description: 'RHKYC\'s dinghy sailing center and Hong Kong Race Week venue. Premier sailing training facility.',
    championshipRole: 'Youth sailing programs and dinghy racing headquarters',
    importance: 'secondary',
    championshipSpecific: false,
    
    address: 'Middle Island, South of Hong Kong Island',
    
    facilities: [
      'Dinghy storage (200+ boats)',
      'Sailing school facilities',
      'Rowing center',
      'Beach access',
      'Changing rooms',
      'Equipment storage',
      'Youth training programs'
    ],
    
    contact: {
      phone: '+852 2832 2817',
      email: 'sailing@rhkyc.org.hk',
      website: 'www.rhkyc.org.hk'
    },
    
    racerInfo: 'Hong Kong Race Week venue (January 27-February 1, 2026). Dinghy racing and youth sailing programs. Access by club sampan service.',
    spectatorInfo: 'Beautiful southern Hong Kong Island location with panoramic views. Accessible by club ferry from Seaview Promenade.',
    
    transportation: [
      {
        type: 'ferry',
        route: 'Club sampan from Repulse Bay or Deep Water Bay',
        schedule: 'Regular service during events',
        cost: 'Club members and guests only',
        notes: 'Advance arrangement required'
      }
    ],
    
    operatingHours: 'Daylight hours, events dependent'
  },
  
  {
    id: 'rhkyc_shelter_cove',
    name: 'Royal Hong Kong Yacht Club - Shelter Cove',
    type: 'yacht_club',
    coordinates: {
      latitude: 22.3719,
      longitude: 114.2656
    },
    description: 'RHKYC\'s cruising base in scenic Sai Kung with 130 swing moorings and marina facilities.',
    championshipRole: 'Cruising yacht base and offshore racing preparation',
    importance: 'secondary',
    championshipSpecific: false,
    
    address: 'Shelter Cove, Sai Kung, N.T.',
    
    facilities: [
      '130 swing moorings',
      'Marina berths',
      'Hardstand storage',
      'Boat maintenance',
      'Clubhouse',
      'Restaurant',
      'Fuel dock',
      'Provisions'
    ],
    
    contact: {
      phone: '+852 2719 9682',
      email: 'sheltercove@rhkyc.org.hk',
      website: 'www.rhkyc.org.hk'
    },
    
    racerInfo: 'Base for cruising boats and offshore racing preparation. Secure moorings and boat services. Strategic location for Sai Kung area events.',
    spectatorInfo: 'Scenic Sai Kung location with restaurant facilities. Beautiful views of eastern waters and Sai Kung Country Park.',
    
    transportation: [
      {
        type: 'bus',
        route: 'Bus 92, 94, 96R to Sai Kung',
        schedule: 'Regular service to Sai Kung town',
        cost: 'HK$8-12',
        notes: 'Then taxi or walking to Shelter Cove'
      },
      {
        type: 'taxi',
        route: 'From Central Hong Kong',
        cost: 'HK$250-350',
        notes: '60-90 minutes depending on traffic'
      }
    ],
    
    operatingHours: 'Daily 07:00-19:00'
  },

  {
    id: 'clearwater_bay_marina',
    name: 'Clearwater Bay Golf & Country Club Marina',
    type: 'venue',
    coordinates: {
      latitude: 22.2595,
      longitude: 114.2962
    },
    description: 'Hong Kong\'s most scenic marina with crystal clear waters. Championship venue providing direct access to Ninepins racing area.',
    championshipRole: 'Primary marina venue for boat storage, launching, and race area access',
    importance: 'primary',
    championshipSpecific: true,
    
    address: '139 Tai Au Mun Road, Clearwater Bay, N.T.',
    
    facilities: [
      '300 wet berths',
      'Drystack storage (120 boats)',
      'Boat launching ramp',
      'Fuel station',
      'Marine services',
      'Clubhouse with dining',
      '18-hole golf course',
      'Swimming pool',
      'Tennis courts'
    ],
    
    racerInfo: 'Direct access to Ninepins race course (8nm). Secure boat storage and launching facilities. Marine services including rigging, repairs, and equipment. Fuel and provisions available.',
    spectatorInfo: 'Premium clubhouse with panoramic views of racing area. Golf course access for members and guests. Excellent dining with harbor views. Swimming and tennis facilities.',
    
    championshipEvents: [
      {
        date: '2027-11-21',
        time: '08:00',
        event: 'Boat Arrival & Storage',
        description: 'Container unloading and boat setup begins'
      },
      {
        date: '2027-11-24',
        time: '10:00',
        event: 'Race Start Sequence',
        description: 'Boats depart for Ninepins race course'
      }
    ],
    
    transportation: [
      {
        type: 'bus',
        route: 'Bus 91 from Diamond Hill MTR',
        schedule: 'Every 20-30 minutes',
        cost: 'HK$10.20',
        notes: '45-minute journey to Clearwater Bay'
      },
      {
        type: 'taxi',
        route: 'From Central Hong Kong',
        cost: 'HK$200-300',
        notes: '45-60 minutes depending on traffic'
      }
    ],
    
    operatingHours: 'Championship week: 06:00-19:00 daily'
  },
  
  {
    id: 'tsim_sha_tsui_promenade',
    name: 'Tsim Sha Tsui Promenade',
    type: 'spectator_point',
    coordinates: {
      latitude: 22.2947,
      longitude: 114.1694
    },
    description: 'Hong Kong\'s premier waterfront promenade offering spectacular harbor views and easy access to sailing action.',
    championshipRole: 'Primary spectator viewing area for harbor racing and boat parades',
    importance: 'primary',
    championshipSpecific: false,
    
    address: 'Tsim Sha Tsui, Kowloon, Hong Kong',
    
    facilities: [
      'Waterfront promenade',
      'Viewing benches',
      'Restaurants and cafes',
      'Shopping areas',
      'Cultural attractions',
      'Public restrooms',
      'Easy MTR access'
    ],
    
    spectatorInfo: 'Best mainland viewing point for harbor sailing events. Unobstructed water views with Hong Kong Island skyline backdrop. Numerous dining options and shopping. Free public access.',
    racerInfo: 'Visible from harbor racing events. Popular location for team photos with Hong Kong skyline.',
    
    transportation: [
      {
        type: 'mtr',
        route: 'Tsim Sha Tsui Station (Exit L3)',
        schedule: '05:00-01:00 daily',
        cost: 'HK$10-25 from Central',
        notes: 'Direct exit to promenade'
      },
      {
        type: 'ferry',
        route: 'Star Ferry from Central/Wan Chai',
        schedule: 'Every 10-20 minutes',
        cost: 'HK$3.40',
        notes: 'Historic ferry service with harbor views'
      }
    ],
    
    operatingHours: '24 hours (restaurants vary)'
  },
  
  {
    id: 'stanley_main_beach',
    name: 'Stanley Main Beach',
    type: 'spectator_point',
    coordinates: {
      latitude: 22.2167,
      longitude: 114.2122
    },
    description: 'Southern Hong Kong\'s most popular beach with excellent views toward the Ninepins racing area.',
    championshipRole: 'Spectator viewing point for offshore racing with beach amenities',
    importance: 'secondary',
    championshipSpecific: false,
    
    address: 'Stanley, Hong Kong Island',
    
    facilities: [
      'Sandy beach',
      'Beach volleyball courts',
      'Restaurants and bars',
      'Stanley Market',
      'Public restrooms',
      'Parking areas',
      'Water sports rentals'
    ],
    
    spectatorInfo: 'Relaxed beach setting with distant views of offshore racing. Combine sailing viewing with beach activities, shopping at Stanley Market, and dining. Family-friendly environment.',
    racerInfo: 'Visible during southern leg of Around the Island Race and offshore events.',
    
    transportation: [
      {
        type: 'bus',
        route: 'Bus 6, 6A, 6X, 260 from Central',
        schedule: 'Every 15-30 minutes',
        cost: 'HK$8.80-12.80',
        notes: '30-45 minute scenic route'
      },
      {
        type: 'taxi',
        route: 'From Central Hong Kong',
        cost: 'HK$100-150',
        notes: '25-35 minutes via Aberdeen Tunnel'
      }
    ],
    
    operatingHours: '24 hours (beach facilities 06:00-22:00)'
  },

  // === MARINAS ===
  {
    id: 'aberdeen_marina_club',
    name: 'Aberdeen Marina Club',
    type: 'marina',
    coordinates: {
      latitude: 22.2441,
      longitude: 114.1563
    },
    description: 'Central Hong Kong marina with 170 wet berths and comprehensive marine services.',
    championshipRole: 'Alternative marina with central Hong Kong location',
    importance: 'secondary',
    championshipSpecific: false,
    
    address: '8 Shum Wan Road, Aberdeen, Hong Kong',
    
    facilities: [
      '170 wet berths (30-100ft)',
      'Enclosed dry berths',
      'Fuel station',
      'Marine repair services',
      '24-hour security',
      'Clubhouse facilities',
      'Restaurant'
    ],
    
    contact: {
      phone: '+852 2555 8321',
      email: 'info@aberdeenmarina.com.hk',
      website: 'www.aberdeenmarina.com.hk'
    },
    
    racerInfo: 'Central Hong Kong location with professional marine services. Easy access to Aberdeen Boat Club for racing. Secure boat storage with 24-hour security.',
    spectatorInfo: 'Aberdeen Harbour location with traditional fishing village atmosphere. Close to Aberdeen floating restaurants and Ocean Park.',
    
    transportation: [
      {
        type: 'bus',
        route: 'Bus 70, 75, 90, 97 from Central',
        schedule: 'Every 10-20 minutes',
        cost: 'HK$6.80-8.50',
        notes: '25-30 minutes to Aberdeen'
      },
      {
        type: 'taxi',
        route: 'From Central Hong Kong',
        cost: 'HK$80-120',
        notes: '20-30 minutes via Aberdeen Tunnel'
      }
    ],
    
    operatingHours: '24 hours access, office 08:00-18:00'
  },

  {
    id: 'club_marina_cove',
    name: 'Club Marina Cove',
    type: 'marina',
    coordinates: {
      latitude: 22.3847,
      longitude: 114.2708
    },
    description: 'Premium marina in Sai Kung with 360 berths, host of Hong Kong International Boat Show since 1982.',
    championshipRole: 'Alternative venue for larger yachts and support vessels',
    importance: 'secondary',
    championshipSpecific: false,
    
    address: '380 Hiram\'s Highway, Sai Kung, N.T.',
    
    facilities: [
      '360 wet berths (up to 100ft)',
      'Marina services',
      'Boat show facilities',
      'Clubhouse',
      'Swimming pool',
      'Tennis courts',
      'Restaurants',
      'Marine chandlery'
    ],
    
    contact: {
      phone: '+852 2719 8888',
      email: 'info@clubmarinacove.com',
      website: 'www.clubmarinacove.com'
    },
    
    racerInfo: 'Professional marina services and large boat capacity. Host venue for Hong Kong International Boat Show. Marine chandlery and repair facilities.',
    spectatorInfo: 'Sai Kung "Back Garden of Hong Kong" with clear waters and nearby beaches. Excellent dining and recreational facilities.',
    
    transportation: [
      {
        type: 'bus',
        route: 'Bus 92, 94, 96R to Sai Kung',
        schedule: 'Every 15-30 minutes',
        cost: 'HK$8-12',
        notes: 'Then short taxi ride to marina'
      },
      {
        type: 'taxi',
        route: 'From Central Hong Kong',
        cost: 'HK$280-380',
        notes: '60-90 minutes depending on traffic'
      }
    ],
    
    operatingHours: 'Marina: 24 hours, Facilities: 08:00-22:00'
  },

  {
    id: 'hebe_haven_yacht_club',
    name: 'Hebe Haven Yacht Club',
    type: 'yacht_club',
    coordinates: {
      latitude: 22.3794,
      longitude: 114.2750
    },
    description: 'Friendly community yacht club established 1963 with 213 swing moorings in scenic Sai Kung.',
    championshipRole: 'Community sailing base with local racing programs',
    importance: 'tertiary',
    championshipSpecific: false,
    
    address: 'Hiram\'s Highway, Pak Sha Wan, Sai Kung, N.T.',
    
    facilities: [
      '213 swing moorings',
      '53 walk-on berths',
      'Dry dock facilities',
      'Sailing courses',
      'Youth programs',
      'Clubhouse',
      'Restaurant'
    ],
    
    contact: {
      phone: '+852 2719 9682',
      email: 'info@hhyc.org.hk',
      website: 'www.hhyc.org.hk'
    },
    
    racerInfo: 'Active sailing community with regular racing programs. Focus on speed boats and sailing boats. Community-oriented club environment.',
    spectatorInfo: 'Near Pak Sha Wan Pier with beautiful Sai Kung scenery. Community-focused club with regular social events.',
    
    transportation: [
      {
        type: 'bus',
        route: 'Bus 92, 94 to Sai Kung, then local transport',
        schedule: 'Regular service',
        cost: 'HK$10-15 total',
        notes: 'Short taxi or walk from Sai Kung bus terminal'
      }
    ],
    
    operatingHours: 'Club hours vary, events dependent'
  },

  // === CHANDLERIES & MARINE STORES ===
  {
    id: 'simpson_marine_aberdeen',
    name: 'Simpson Marine Chandlery',
    type: 'chandlery',
    coordinates: {
      latitude: 22.2460,
      longitude: 114.1580
    },
    description: 'Hong Kong\'s largest marine equipment supplier with comprehensive chandlery and technical services.',
    championshipRole: 'Primary marine equipment supplier for racing boats',
    importance: 'primary',
    championshipSpecific: true,
    
    address: '11-19 Shum Wan Road, Aberdeen, Hong Kong',
    
    facilities: [
      'Marine equipment store',
      'Technical service center',
      'Boat parts warehouse',
      'Racing equipment specialists',
      'Rigging services',
      'Electronics installation',
      'Emergency parts service'
    ],
    
    contact: {
      phone: '+852 2555 8321',
      email: 'chandlery@simpsonmarine.com',
      website: 'www.simpsonmarine.com'
    },
    
    racerInfo: 'Premier chandlery with race-specific equipment and expert technical support. Emergency parts service during championship week. Rigging and electronics specialists.',
    spectatorInfo: 'Marine equipment showroom open to public. Educational displays of sailing technology and boat equipment.',
    
    transportation: [
      {
        type: 'bus',
        route: 'Bus 70, 75, 90 to Aberdeen',
        schedule: 'Every 10-15 minutes',
        cost: 'HK$6.80',
        notes: 'Short walk from Aberdeen bus station'
      }
    ],
    
    operatingHours: 'Mon-Sat 09:00-18:00, Sun 10:00-17:00'
  },

  {
    id: 'asia_yachting_central',
    name: 'Asia Yachting Chandlery',
    type: 'chandlery',
    coordinates: {
      latitude: 22.2855,
      longitude: 114.1577
    },
    description: 'Premium marine supplies store in Central with high-end sailing equipment and accessories.',
    championshipRole: 'Premium marine equipment and sailing accessories',
    importance: 'secondary',
    championshipSpecific: false,
    
    address: 'Shop 3006, IFC Mall, Central, Hong Kong',
    
    facilities: [
      'Premium sailing equipment',
      'Navigation instruments',
      'Safety equipment',
      'Sailing accessories',
      'Technical advice',
      'Equipment fitting service'
    ],
    
    contact: {
      phone: '+852 2234 7110',
      email: 'info@asiayachting.com.hk',
      website: 'www.asiayachting.com.hk'
    },
    
    racerInfo: 'High-end sailing equipment and precision instruments. Expert technical advice for competitive sailing. Premium brands and latest technology.',
    spectatorInfo: 'Premium sailing gear showroom in Central\'s IFC Mall. Educational displays of sailing equipment and technology.',
    
    transportation: [
      {
        type: 'mtr',
        route: 'Central Station (Exit A)',
        schedule: '05:00-01:00 daily',
        cost: 'Direct MTR access',
        notes: 'Inside IFC Mall complex'
      }
    ],
    
    operatingHours: 'Daily 10:00-20:00'
  },

  // === SAILING GEAR STORES ===
  {
    id: 'patagonia_ifc',
    name: 'Patagonia Hong Kong - IFC',
    type: 'gear_store',
    coordinates: {
      latitude: 22.2855,
      longitude: 114.1577
    },
    description: 'Premium outdoor and sailing gear store in Central\'s IFC Mall, featuring technical sailing apparel.',
    championshipRole: 'Technical sailing apparel and outdoor gear',
    importance: 'secondary',
    championshipSpecific: false,
    
    address: 'Shop 3012, IFC Mall, Central, Hong Kong',
    
    facilities: [
      'Sailing jackets and foul weather gear',
      'Base layers and thermal wear',
      'Sailing gloves and footwear',
      'Outdoor accessories',
      'Technical clothing',
      'Sustainable materials'
    ],
    
    contact: {
      phone: '+852 2234 7892',
      email: 'hongkong@patagonia.com',
      website: 'www.patagonia.com.hk'
    },
    
    racerInfo: 'High-performance sailing apparel designed for challenging conditions. Technical base layers and foul weather gear. Sustainable and durable materials.',
    spectatorInfo: 'Premium outdoor clothing store with sailing and adventure gear. Educational focus on environmental sustainability.',
    
    transportation: [
      {
        type: 'mtr',
        route: 'Central Station (Direct access)',
        schedule: '05:00-01:00 daily',
        cost: 'Direct MTR access',
        notes: 'Inside IFC Mall'
      }
    ],
    
    operatingHours: 'Daily 10:00-22:00'
  },

  {
    id: 'patagonia_causeway_bay',
    name: 'Patagonia Causeway Bay',
    type: 'gear_store',
    coordinates: {
      latitude: 22.2783,
      longitude: 114.1822
    },
    description: 'Patagonia store in Causeway Bay Times Square, convenient to RHKYC Kellett Island.',
    championshipRole: 'Sailing apparel convenient to championship headquarters',
    importance: 'secondary',
    championshipSpecific: true,
    
    address: 'Shop 1203, Times Square, Causeway Bay',
    
    facilities: [
      'Complete sailing apparel range',
      'Foul weather gear',
      'Base layers and accessories',
      'Outdoor equipment',
      'Technical clothing',
      'Repair services'
    ],
    
    contact: {
      phone: '+852 2506 1928',
      email: 'causewaybay@patagonia.com',
      website: 'www.patagonia.com.hk'
    },
    
    racerInfo: 'Full range of sailing apparel within walking distance of RHKYC Kellett Island. Championship gear and emergency clothing needs.',
    spectatorInfo: 'Convenient location near RHKYC for sailing gear and outdoor clothing. Times Square shopping complex.',
    
    transportation: [
      {
        type: 'mtr',
        route: 'Causeway Bay Station (Exit A)',
        schedule: '05:00-01:00 daily',
        cost: 'HK$10-15 from Central',
        notes: '5-minute walk to RHKYC'
      }
    ],
    
    operatingHours: 'Daily 10:00-22:00'
  },

  // === HOTELS ===
  {
    id: 'conrad_hong_kong',
    name: 'Conrad Hong Kong',
    type: 'hotel',
    coordinates: {
      latitude: 22.2772,
      longitude: 114.1653
    },
    description: 'Luxury 5-star hotel in Admiralty with harbor views, walking distance to RHKYC Kellett Island.',
    championshipRole: 'Premium accommodation for championship participants',
    importance: 'primary',
    championshipSpecific: true,
    
    address: 'Pacific Place, 88 Queensway, Admiralty, Hong Kong',
    
    facilities: [
      '513 luxury rooms and suites',
      'Harbor view rooms',
      'Executive lounge',
      'Fitness center and spa',
      'Multiple restaurants',
      'Business center',
      'Concierge services'
    ],
    
    contact: {
      phone: '+852 2521 3838',
      email: 'info.hongkong@conradhotels.com',
      website: 'www.conradhongkong.com'
    },
    
    racerInfo: 'Premier accommodation within walking distance of RHKYC. Concierge services familiar with sailing requirements. Secure equipment storage available.',
    spectatorInfo: 'Luxury harbor view accommodation with easy access to sailing venues. Premium dining and spa facilities.',
    
    championshipEvents: [
      {
        date: '2027-11-20',
        time: '19:00',
        event: 'Welcome Reception',
        description: 'Championship welcome cocktail reception'
      }
    ],
    
    transportation: [
      {
        type: 'walking',
        route: 'To RHKYC Kellett Island',
        cost: 'Free',
        notes: '8-minute walk through Pacific Place'
      },
      {
        type: 'mtr',
        route: 'Admiralty Station (Direct access)',
        schedule: '05:00-01:00 daily',
        cost: 'Direct access',
        notes: 'Connected to Pacific Place'
      }
    ],
    
    operatingHours: '24 hours'
  },

  {
    id: 'upper_house',
    name: 'The Upper House',
    type: 'hotel',
    coordinates: {
      latitude: 22.2781,
      longitude: 114.1661
    },
    description: 'Boutique luxury hotel in Admiralty with contemporary design and harbor views.',
    championshipRole: 'Boutique luxury accommodation for VIP participants',
    importance: 'secondary',
    championshipSpecific: true,
    
    address: 'Pacific Place, 88 Queensway, Admiralty, Hong Kong',
    
    facilities: [
      '117 luxury rooms and suites',
      'Sky lounge with panoramic views',
      'Fitness center',
      'Business facilities',
      'Personal service',
      'Contemporary design'
    ],
    
    contact: {
      phone: '+852 2918 1838',
      email: 'info@upperhouse.com',
      website: 'www.upperhouse.com'
    },
    
    racerInfo: 'Intimate luxury hotel with personalized service. Close to RHKYC with concierge assistance for sailing needs.',
    spectatorInfo: 'Sophisticated boutique hotel with contemporary Asian design. Sky lounge with spectacular harbor views.',
    
    transportation: [
      {
        type: 'walking',
        route: 'To RHKYC Kellett Island',
        cost: 'Free',
        notes: '10-minute walk'
      }
    ],
    
    operatingHours: '24 hours'
  }
];

export const locationFilters: SailingLocationFilter[] = [
  {
    type: 'all',
    label: 'All',
    description: 'Show all sailing venues and services'
  },
  {
    type: 'championship',
    label: 'Championship',
    description: 'Competition venues and headquarters'
  },
  {
    type: 'marinas',
    label: 'Marinas',
    description: 'Marinas and yacht clubs'
  },
  {
    type: 'stores',
    label: 'Stores',
    description: 'Chandleries and gear stores'
  },
  {
    type: 'accommodation',
    label: 'Hotels',
    description: 'Hotels and accommodation'
  },
  {
    type: 'spectator',
    label: 'Spectator',
    description: 'Viewing points and public areas'
  }
];

// Helper functions for filtering locations
export const getLocationsByType = (type: SailingLocationFilter['type']) => {
  if (type === 'all') return sailingLocations;
  
  switch (type) {
    case 'championship':
      return sailingLocations.filter(location => 
        location.type === 'championship_hq' || 
        location.type === 'venue' || 
        location.type === 'race_course'
      );
    case 'marinas':
      return sailingLocations.filter(location => 
        location.type === 'marina' || 
        location.type === 'yacht_club'
      );
    case 'stores':
      return sailingLocations.filter(location => 
        location.type === 'chandlery' || 
        location.type === 'gear_store'
      );
    case 'accommodation':
      return sailingLocations.filter(location => 
        location.type === 'hotel'
      );
    case 'spectator':
      return sailingLocations.filter(location => 
        location.type === 'spectator_point'
      );
    default:
      return sailingLocations;
  }
};

export const getLocationById = (id: string) => {
  return sailingLocations.find(location => location.id === id);
};

export const getPrimaryLocations = () => {
  return sailingLocations.filter(location => location.importance === 'primary');
};

export const getChampionshipLocations = () => {
  return sailingLocations.filter(location => location.championshipSpecific);
};