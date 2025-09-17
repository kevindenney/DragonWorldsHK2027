import { SailingLocation, SailingLocationFilter } from '../types/sailingLocation';
import { NINEPINS_RACE_COURSE_CENTER } from '../constants/raceCoordinates';

export const sailingLocations: SailingLocation[] = [
  {
    id: 'ninepins_race_course',
    name: 'Ninepins Islands Race Course',
    type: 'race_course',
    coordinates: NINEPINS_RACE_COURSE_CENTER,
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
      latitude: 22.235564460556006,
      longitude: 114.18759759688173
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
      latitude: 22.36865419872724,
      longitude: 114.26880214675447
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
      latitude: 22.270688597647208,
      longitude: 114.30269259475433
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
  
  // === MARINAS ===
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
  },

  {
    id: 'peninsula_hong_kong',
    name: 'The Peninsula Hong Kong',
    type: 'hotel',
    coordinates: {
      latitude: 22.2954,
      longitude: 114.1728
    },
    description: 'Hong Kong\'s grand dame luxury hotel since 1928, located on the iconic Tsim Sha Tsui waterfront with unparalleled harbor views.',
    championshipRole: 'Historic luxury accommodation with premier harbor access',
    importance: 'primary',
    championshipSpecific: true,

    address: 'Salisbury Road, Tsim Sha Tsui, Kowloon, Hong Kong',

    facilities: [
      '300 luxury rooms and suites',
      'Harbor view suites',
      'Rooftop helipad',
      'Fleet of Rolls-Royce cars',
      'Award-winning restaurants',
      'Luxury spa and fitness center',
      'Business center',
      '24-hour concierge services'
    ],

    contact: {
      phone: '+852 2920 2888',
      email: 'phk@peninsula.com',
      website: 'www.peninsula.com'
    },

    racerInfo: 'Premier luxury accommodation on Tsim Sha Tsui waterfront. Concierge services experienced with sailing requirements. Helicopter transfers available to venues. Harbor views ideal for race watching.',
    spectatorInfo: 'Historic luxury hotel with unparalleled harbor views from lobby and restaurants. Perfect location for watching harbor sailing events. Award-winning afternoon tea with harbor views.',

    championshipEvents: [
      {
        date: '2027-11-20',
        time: '18:30',
        event: 'VIP Welcome Cocktails',
        description: 'Exclusive championship welcome reception for VIP guests'
      }
    ],

    transportation: [
      {
        type: 'walking',
        route: 'To Tsim Sha Tsui Promenade',
        cost: 'Free',
        notes: '2-minute walk to waterfront viewing'
      },
      {
        type: 'mtr',
        route: 'Tsim Sha Tsui Station (Exit L2)',
        schedule: '05:00-01:00 daily',
        cost: 'HK$10-25 from Central',
        notes: '3-minute walk from MTR'
      },
      {
        type: 'ferry',
        route: 'Star Ferry Terminal (adjacent)',
        schedule: 'Every 10-20 minutes',
        cost: 'HK$3.40',
        notes: 'Historic ferry service to Central/Wan Chai'
      }
    ],

    operatingHours: '24 hours'
  },

  {
    id: 'crowne_plaza_kowloon_east',
    name: 'Crowne Plaza Hong Kong Kowloon East by IHG',
    type: 'hotel',
    coordinates: {
      latitude: 22.3089,
      longitude: 114.2267
    },
    description: 'Modern business hotel in the heart of Kowloon East with excellent connectivity to Hong Kong\'s sailing venues.',
    championshipRole: 'Contemporary business hotel with convenient access to eastern sailing venues',
    importance: 'secondary',
    championshipSpecific: false,

    address: '3 Tong Tak Street, Tseung Kwan O, New Territories, Hong Kong',

    facilities: [
      '359 contemporary rooms and suites',
      'Harbor view rooms available',
      'Executive club lounge',
      'Fitness center and indoor pool',
      'Multiple dining options',
      'Business center',
      'Meeting and event facilities',
      'Shopping mall access'
    ],

    contact: {
      phone: '+852 3983 0388',
      email: 'info.cpkowlooneast@ihg.com',
      website: 'www.crowneplaza.com/hongkong-kowlooneast'
    },

    racerInfo: 'Modern business hotel with excellent connectivity to eastern Hong Kong sailing areas. Close to marinas in Sai Kung region. Business facilities for team meetings and equipment storage.',
    spectatorInfo: 'Contemporary hotel in developing Kowloon East area. Shopping and dining complex attached. Good value accommodation with harbor access.',

    transportation: [
      {
        type: 'mtr',
        route: 'Tseung Kwan O Station (Exit A2)',
        schedule: '05:00-01:00 daily',
        cost: 'HK$15-30 from Central',
        notes: '5-minute walk from MTR station'
      },
      {
        type: 'bus',
        route: 'Multiple routes to Sai Kung sailing areas',
        schedule: 'Regular service',
        cost: 'HK$8-15',
        notes: 'Direct access to eastern sailing venues'
      },
      {
        type: 'taxi',
        route: 'To Central Hong Kong',
        cost: 'HK$150-250',
        notes: '30-45 minutes depending on traffic'
      }
    ],

    operatingHours: '24 hours'
  },

  // === TOURISM ATTRACTIONS ===
  {
    id: 'victoria_peak',
    name: 'Victoria Peak & Sky Terrace 428',
    type: 'tourism',
    coordinates: {
      latitude: 22.2716,
      longitude: 114.1472
    },
    description: 'Hong Kong\'s most iconic landmark offering 360-degree panoramic views of the harbor, skyline, and racing areas. Perfect for regatta spectating.',
    championshipRole: 'Premier viewing location for harbor racing and city overview',
    importance: 'primary',
    championshipSpecific: false,

    address: 'The Peak Tower, 128 Peak Road, The Peak',

    facilities: [
      'Sky Terrace 428 viewing platform',
      'Peak Tram transportation',
      'Restaurants and cafes',
      'Souvenir shops',
      'Photography services',
      'Lookout pavilions'
    ],

    contact: {
      phone: '+852 2849 0668',
      website: 'www.thepeak.com.hk'
    },

    racerInfo: 'Spectacular views of Victoria Harbor and racing areas. Peak Tram provides easy access from Central. Best viewing during clear weather conditions.',
    spectatorInfo: 'World-renowned attraction with unparalleled harbor views. Ideal for watching sailing events from above. Sunset viewing highly recommended during regatta week.',

    transportation: [
      {
        type: 'mtr',
        route: 'Central Station to Peak Tram Lower Terminus',
        schedule: 'Peak Tram: 07:00-00:00 daily',
        cost: 'HK$69 round-trip adults, HK$40 children',
        notes: '10-minute walk from Central MTR to Peak Tram'
      },
      {
        type: 'bus',
        route: 'Bus 15 from Central to The Peak',
        schedule: 'Every 20-30 minutes',
        cost: 'HK$10.60',
        notes: 'Scenic alternative to Peak Tram'
      }
    ],

    operatingHours: 'Sky Terrace: 10:00-23:00 daily, Peak Tram: 07:00-00:00'
  },

  {
    id: 'avenue_of_stars',
    name: 'Avenue of Stars & Symphony of Lights',
    type: 'tourism',
    coordinates: {
      latitude: 22.2938,
      longitude: 114.1719
    },
    description: 'Tsim Sha Tsui waterfront promenade celebrating Hong Kong\'s film industry, featuring the world\'s largest permanent light and sound show at 8pm nightly.',
    championshipRole: 'Prime harbor viewing location and nightly entertainment venue',
    importance: 'primary',
    championshipSpecific: false,

    address: 'Tsim Sha Tsui Promenade, Kowloon',

    facilities: [
      'Celebrity handprints and statues',
      'Harbor viewing areas',
      'Photography platforms',
      'Seating areas',
      'Information panels',
      'Accessibility features'
    ],

    racerInfo: 'Excellent harbor views for watching sailing action. Close to ferry terminals for easy harbor access. Perfect location for evening relaxation after racing.',
    spectatorInfo: 'World-famous promenade with stunning harbor views. Nightly Symphony of Lights show at 8pm. Ideal for harbor photography and sailing event viewing.',

    championshipEvents: [
      {
        date: '2027-11-21',
        time: '20:00',
        event: 'Symphony of Lights',
        description: 'Nightly multimedia light show visible from promenade'
      }
    ],

    transportation: [
      {
        type: 'mtr',
        route: 'Tsim Sha Tsui Station (Exit L2)',
        schedule: '05:00-01:00 daily',
        cost: 'HK$10-25 from Central',
        notes: '5-minute walk to promenade'
      },
      {
        type: 'ferry',
        route: 'Star Ferry from Central/Wan Chai',
        schedule: 'Every 10-20 minutes',
        cost: 'HK$3.40',
        notes: 'Historic ferry service with harbor views'
      }
    ],

    operatingHours: '24 hours (Symphony of Lights: 20:00 daily)'
  },

  {
    id: 'star_ferry_terminal',
    name: 'Star Ferry Terminal',
    type: 'tourism',
    coordinates: {
      latitude: 22.2939,
      longitude: 114.1720
    },
    description: 'Historic ferry service operating since 1888, offering scenic harbor crossings and charming glimpses of old Hong Kong character.',
    championshipRole: 'Historic transportation and harbor viewing experience',
    importance: 'secondary',
    championshipSpecific: false,

    address: 'Star Ferry Pier, Tsim Sha Tsui, Kowloon',

    facilities: [
      'Historic ferry terminals',
      'Scenic harbor crossing',
      'Photography opportunities',
      'Waiting areas',
      'Tourist information',
      'Harbor views'
    ],

    racerInfo: 'Scenic harbor crossing with sailing venue views. Historic transportation connecting major districts. Great for harbor exploration between racing days.',
    spectatorInfo: 'Iconic Hong Kong experience with spectacular harbor views during crossing. Perfect for photography and experiencing local maritime heritage.',

    transportation: [
      {
        type: 'walking',
        route: 'From Avenue of Stars',
        cost: 'Free',
        notes: 'Adjacent to promenade'
      },
      {
        type: 'ferry',
        route: 'To Central, Wan Chai, Hung Hom',
        schedule: 'Every 10-20 minutes',
        cost: 'HK$3.40',
        notes: 'Historic harbor crossing service'
      }
    ],

    operatingHours: 'Daily 06:30-23:30'
  },

  {
    id: 'west_kowloon_cultural_district',
    name: 'Hong Kong Palace Museum & M+ (West Kowloon)',
    type: 'tourism',
    coordinates: {
      latitude: 22.3026,
      longitude: 114.1627
    },
    description: 'World-class cultural district featuring Hong Kong Palace Museum and M+ contemporary art museum, highlighted on DragonWorld2027.com as must-visit attractions.',
    championshipRole: 'Premier cultural attractions for regatta participants and families',
    importance: 'primary',
    championshipSpecific: true,

    address: '8 Museum Drive, West Kowloon Cultural District',

    facilities: [
      'Hong Kong Palace Museum',
      'M+ contemporary art museum',
      'Freespace performance venue',
      'Art Park outdoor space',
      'Waterfront promenade',
      'Dining and retail'
    ],

    contact: {
      phone: '+852 2200 0217',
      website: 'www.westkowloon.hk'
    },

    racerInfo: 'World-class cultural attractions for downtime between racing. Family-friendly venues with harbor proximity. Educational and entertaining for international visitors.',
    spectatorInfo: 'Premier cultural destination with stunning architecture and exhibitions. Perfect for family activities during regatta week. Waterfront location with harbor views.',

    transportation: [
      {
        type: 'mtr',
        route: 'Kowloon Station (Exit C2 or D1)',
        schedule: '05:00-01:00 daily',
        cost: 'HK$15-30 from Central',
        notes: '10-15 minute walk from MTR'
      },
      {
        type: 'bus',
        route: 'Multiple routes to West Kowloon',
        schedule: 'Regular service',
        cost: 'HK$8-15',
        notes: 'Direct bus connections'
      }
    ],

    operatingHours: 'Museums: 10:00-18:00 (closed Tuesdays), District: 24 hours'
  },

  {
    id: 'temple_street_night_market',
    name: 'Temple Street Night Market',
    type: 'tourism',
    coordinates: {
      latitude: 22.3113,
      longitude: 114.1711
    },
    description: 'Hong Kong\'s most famous night market offering authentic street food, shopping, and local culture experience in the heart of Yau Ma Tei.',
    championshipRole: 'Authentic local dining and cultural experience for evening entertainment',
    importance: 'secondary',
    championshipSpecific: false,

    address: 'Temple Street, Yau Ma Tei, Kowloon',

    facilities: [
      'Street food stalls',
      'Shopping vendors',
      'Fortune telling',
      'Street performances',
      'Local restaurants',
      'Cultural atmosphere'
    ],

    racerInfo: 'Authentic Hong Kong street food and culture experience. Perfect for evening dining after racing. Affordable local cuisine and souvenir shopping.',
    spectatorInfo: 'Iconic night market experience with local street food and shopping. Vibrant atmosphere ideal for evening entertainment during regatta week.',

    transportation: [
      {
        type: 'mtr',
        route: 'Yau Ma Tei Station (Exit C)',
        schedule: '05:00-01:00 daily',
        cost: 'HK$10-20 from Central',
        notes: '5-minute walk from MTR'
      },
      {
        type: 'taxi',
        route: 'From Central Hong Kong',
        cost: 'HK$50-80',
        notes: '15-20 minutes depending on traffic'
      }
    ],

    operatingHours: 'Market: 18:00-00:00 daily'
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
    label: 'Champ',
    description: 'Competition venues and headquarters'
  },
  {
    type: 'marinas',
    label: 'Marina',
    description: 'Marinas and yacht clubs'
  },
  {
    type: 'stores',
    label: 'Gear',
    description: 'Chandleries and gear stores'
  },
  {
    type: 'accommodation',
    label: 'Hotels',
    description: 'Hotels and accommodation'
  },
  {
    type: 'spectator',
    label: 'View',
    description: 'Viewing points and public areas'
  },
  {
    type: 'tourism',
    label: 'Tour',
    description: 'Tourist attractions and cultural sites'
  }
];

// Helper function to validate location data
const isValidLocation = (location: SailingLocation): boolean => {
  return (
    location &&
    typeof location.id === 'string' &&
    location.id.length > 0 &&
    typeof location.name === 'string' &&
    location.name.length > 0 &&
    location.coordinates &&
    typeof location.coordinates === 'object' &&
    typeof location.coordinates.latitude === 'number' &&
    typeof location.coordinates.longitude === 'number' &&
    !isNaN(location.coordinates.latitude) &&
    !isNaN(location.coordinates.longitude) &&
    location.coordinates.latitude >= -90 &&
    location.coordinates.latitude <= 90 &&
    location.coordinates.longitude >= -180 &&
    location.coordinates.longitude <= 180
  );
};

// Helper functions for filtering locations
export const getLocationsByType = (type: SailingLocationFilter['type']) => {
  let filteredLocations: SailingLocation[];

  if (type === 'all') {
    filteredLocations = sailingLocations;
  } else {
    switch (type) {
      case 'championship':
        filteredLocations = sailingLocations.filter(location =>
          location.type === 'championship_hq' ||
          location.type === 'venue' ||
          location.type === 'race_course'
        );
        break;
      case 'marinas':
        filteredLocations = sailingLocations.filter(location =>
          location.type === 'marina' ||
          location.type === 'yacht_club'
        );
        break;
      case 'stores':
        filteredLocations = sailingLocations.filter(location =>
          location.type === 'chandlery' ||
          location.type === 'gear_store'
        );
        break;
      case 'accommodation':
        filteredLocations = sailingLocations.filter(location =>
          location.type === 'hotel'
        );
        break;
      case 'spectator':
        filteredLocations = sailingLocations.filter(location =>
          location.type === 'spectator_point'
        );
        break;
      case 'tourism':
        filteredLocations = sailingLocations.filter(location =>
          location.type === 'tourism'
        );
        break;
      default:
        filteredLocations = sailingLocations;
    }
  }

  // Validate all locations before returning
  const validLocations = filteredLocations.filter(isValidLocation);

  if (validLocations.length !== filteredLocations.length) {
    const invalidCount = filteredLocations.length - validLocations.length;
    console.warn(`⚠️ [sailingLocations] Filtered out ${invalidCount} invalid location(s) for type: ${type}`);
  }

  return validLocations;
};

export const getLocationById = (id: string) => {
  const location = sailingLocations.find(location => location.id === id);
  if (location && !isValidLocation(location)) {
    console.warn(`⚠️ [sailingLocations] Invalid location found for ID: ${id}`);
    return undefined;
  }
  return location;
};

export const getPrimaryLocations = () => {
  const locations = sailingLocations.filter(location => location.importance === 'primary');
  return locations.filter(isValidLocation);
};

export const getChampionshipLocations = () => {
  const locations = sailingLocations.filter(location => location.championshipSpecific);
  return locations.filter(isValidLocation);
};