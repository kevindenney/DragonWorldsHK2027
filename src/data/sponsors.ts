import { Sponsor, SponsorshipProgram } from '../types/sponsor';

export const dragonWorldsSponsors: Sponsor[] = [
  // === ORGANISER ===
  {
    id: 'sfhk',
    name: 'Sailing Federation of Hong Kong, China',
    tier: 'organiser',
    description: 'Official organiser of the 2027 Hong Kong Dragon World Championship - Promoting sailing excellence in Hong Kong and China',
    website: 'https://www.sailing.org.hk',
    primaryColor: '#E31B23',
    isTitle: true,
    contact: {
      phone: '+852 2504 8159',
      email: 'info@sailing.org.hk',
      address: 'Room 1001, Olympic House, 1 Stadium Path, So Kon Po, Causeway Bay'
    },
    business: {
      sector: 'National Sailing Federation',
      established: 1947,
      headquarters: 'Hong Kong',
      description: 'The Sailing Federation of Hong Kong, China is the national governing body for sailing in Hong Kong, responsible for developing and promoting the sport at all levels.'
    },
    locations: [
      {
        name: 'SFHK Office',
        address: 'Room 1001, Olympic House, 1 Stadium Path, So Kon Po, Causeway Bay',
        phone: '+852 2504 8159',
        website: 'https://www.sailing.org.hk',
        hours: {
          'Monday': '09:00 AM - 6:00 PM',
          'Tuesday': '09:00 AM - 6:00 PM',
          'Wednesday': '09:00 AM - 6:00 PM',
          'Thursday': '09:00 AM - 6:00 PM',
          'Friday': '09:00 AM - 6:00 PM',
          'Saturday': 'Closed',
          'Sunday': 'Closed'
        }
      }
    ],
    offers: [],
    hongKongActivities: []
  },

  // === CO-ORGANISERS ===
  {
    id: 'rhkyc',
    name: 'Royal Hong Kong Yacht Club',
    tier: 'co-organiser',
    description: 'Asia\'s premier yacht club and host venue for the 2027 Dragon World Championship',
    website: 'https://www.rhkyc.org.hk',
    primaryColor: '#1E3A5F',
    contact: {
      phone: '+852 2832 2817',
      email: 'office@rhkyc.org.hk',
      address: 'Kellett Island, Causeway Bay, Hong Kong'
    },
    business: {
      sector: 'Yacht Club',
      established: 1894,
      headquarters: 'Hong Kong',
      description: 'The Royal Hong Kong Yacht Club is one of the oldest and most prestigious yacht clubs in Asia, hosting major international sailing events.'
    },
    locations: [
      {
        name: 'RHKYC Kellett Island',
        address: 'Kellett Island, Causeway Bay, Hong Kong',
        phone: '+852 2832 2817',
        website: 'https://www.rhkyc.org.hk',
        hours: {
          'Monday': '07:00 AM - 11:00 PM',
          'Tuesday': '07:00 AM - 11:00 PM',
          'Wednesday': '07:00 AM - 11:00 PM',
          'Thursday': '07:00 AM - 11:00 PM',
          'Friday': '07:00 AM - 11:00 PM',
          'Saturday': '07:00 AM - 11:00 PM',
          'Sunday': '07:00 AM - 11:00 PM'
        }
      }
    ],
    offers: [],
    hongKongActivities: []
  },
  {
    id: 'ida',
    name: 'International Dragon Association',
    tier: 'co-organiser',
    description: 'The international governing body for Dragon class sailing worldwide',
    website: 'https://internationaldragonsailing.net',
    primaryColor: '#0066CC',
    contact: {
      email: 'secretary@intdragon.net'
    },
    business: {
      sector: 'International Class Association',
      established: 1929,
      headquarters: 'International',
      description: 'The International Dragon Association governs Dragon class sailing globally, maintaining class rules and promoting international competition.'
    },
    locations: [],
    offers: [],
    hongKongActivities: []
  },
  {
    id: 'hkda',
    name: 'Hong Kong Dragon Association',
    tier: 'co-organiser',
    description: 'Promoting Dragon class sailing in Hong Kong and the Asia Pacific region',
    website: 'https://www.rhkyc.org.hk/sailing/classes/classes/dragon',
    primaryColor: '#0066CC',
    contact: {
      email: 'info@hkdragon.org',
      address: 'Royal Hong Kong Yacht Club, Kellett Island, Causeway Bay'
    },
    business: {
      sector: 'Class Association',
      established: 1970,
      headquarters: 'Hong Kong',
      description: 'The Hong Kong Dragon Association promotes Dragon class sailing in Hong Kong and serves as the local representative of the International Dragon Association.'
    },
    locations: [],
    offers: [],
    hongKongActivities: []
  },

  // === PARTNERS ===
  {
    id: 'hopewell_hotel',
    name: 'Hopewell Hotel',
    tier: 'partner',
    description: 'Official Hospitality Partner for the 2027 Hong Kong Dragon World Championship - Experience exceptional hospitality in the heart of Hong Kong',
    website: 'https://www.hopewellhotel.com',
    bookingUrl: 'https://www.secure-hotel-booking.com/d-edge/Hopewell-Hotel/J16P/en-US/RoomSelection?arrivalDate=2026-11-17&departureDate=2026-11-18&SelectedAdultCount=1&rateAction=highlight&rateId=700116&promoCode=MGDWC',
    primaryColor: '#1E3A5F',
    contact: {
      phone: '+852 2861 1111',
      email: 'reservations@hopewellhotel.com',
      address: '183 Queen\'s Road East, Wan Chai, Hong Kong'
    },
    business: {
      sector: 'Luxury Hospitality',
      established: 1980,
      headquarters: 'Hong Kong',
      description: 'Hopewell Hotel is the official hospitality partner for the 2027 Hong Kong Dragon World Championship. This prestigious event marks a historic milestone as the first Dragon World Championship to be held in Asia, giving Hong Kong a remarkable chance to showcase its vibrant maritime tourism on an international stage.'
    },
    locations: [
      {
        name: 'Hopewell Hotel Hong Kong',
        address: '183 Queen\'s Road East, Wan Chai, Hong Kong',
        phone: '+852 2861 1111',
        website: 'https://www.hopewellhotel.com',
        hours: {
          'Monday': '24 hours',
          'Tuesday': '24 hours',
          'Wednesday': '24 hours',
          'Thursday': '24 hours',
          'Friday': '24 hours',
          'Saturday': '24 hours',
          'Sunday': '24 hours'
        }
      },
      {
        name: 'Hopewell Concierge Desk - RHKYC',
        address: 'Royal Hong Kong Yacht Club, Kellett Island',
        phone: '+852 2861 1188',
        hours: {
          'Monday': '09:00 AM - 8:00 PM',
          'Tuesday': '09:00 AM - 8:00 PM',
          'Wednesday': '09:00 AM - 8:00 PM',
          'Thursday': '09:00 AM - 8:00 PM',
          'Friday': '09:00 AM - 8:00 PM',
          'Saturday': '09:00 AM - 8:00 PM',
          'Sunday': '09:00 AM - 8:00 PM'
        }
      }
    ],
    offers: [
      {
        id: 'hopewell_competitor_rate',
        title: 'Dragon Worlds Championship Rate',
        description: 'Exclusive championship rate for all Dragon Worlds participants with promo code MGDWC. Includes complimentary breakfast and late checkout.',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Book directly at hopewellhotel.com using promo code MGDWC or use the direct booking link in the app',
        termsAndConditions: [
          'Valid for registered participants and their guests',
          'Subject to availability',
          'Complimentary upgrade subject to availability',
          'Late checkout until 2:00 PM included',
          'Use promo code: MGDWC'
        ]
      },
      {
        id: 'hopewell_spa_recovery',
        title: 'Sailor\'s Recovery Spa Package',
        description: 'Post-racing recovery massage and wellness treatments designed for athletes',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Book through hotel spa with participant credentials',
        termsAndConditions: [
          '50% discount on all spa treatments',
          'Includes access to fitness center and pool',
          'Advance booking recommended'
        ]
      },
      {
        id: 'hopewell_transfer',
        title: 'Complimentary Yacht Club Shuttle',
        description: 'Free shuttle service between hotel and Royal Hong Kong Yacht Club',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Book through hotel concierge',
        termsAndConditions: [
          'Available every 30 minutes during championship',
          'Runs from 6:00 AM to 10:00 PM',
          'First come, first served basis'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'hopewell_skybar_sunset',
        title: 'Hopewell Sky Bar Sunset Experience',
        description: 'Exclusive sunset cocktails at the 62nd floor sky bar with 360-degree views of Hong Kong',
        type: 'dining',
        sponsorId: 'hopewell_hotel',
        website: 'https://www.hopewellhotel.com/skybar',
        bookingRequired: true,
        duration: '2 hours',
        priceRange: '$$',
        bestTime: 'Sunset (5:30 PM - 7:30 PM)'
      },
      {
        id: 'hopewell_cooking_class',
        title: 'Hong Kong Dim Sum Masterclass',
        description: 'Learn to make authentic Cantonese dim sum with the hotel\'s executive chef',
        type: 'cultural',
        sponsorId: 'hopewell_hotel',
        bookingRequired: true,
        duration: '3 hours',
        priceRange: '$$',
        bestTime: 'Weekend mornings'
      }
    ]
  },

  {
    id: 'hktb',
    name: 'Hong Kong Tourism Board',
    tier: 'partner',
    description: 'Discover Hong Kong - Official Tourism Partner of Dragon Worlds HK 2027',
    website: 'https://www.discoverhongkong.com',
    primaryColor: '#E31B23',
    contact: {
      phone: '+852 2807 6177',
      email: 'info@hktb.com',
      address: '11/F, Citicorp Centre, 18 Whitfield Road, North Point'
    },
    business: {
      sector: 'Tourism Promotion',
      established: 2001,
      headquarters: 'Hong Kong',
      description: 'The Hong Kong Tourism Board promotes Hong Kong as a world-class destination, showcasing its unique blend of East and West cultures, stunning natural beauty, and vibrant city life.'
    },
    locations: [
      {
        name: 'HKTB Visitor Centre - Star Ferry',
        address: 'Star Ferry Pier, Tsim Sha Tsui, Kowloon',
        phone: '+852 2508 1234',
        website: 'https://www.discoverhongkong.com',
        hours: {
          'Monday': '08:00 AM - 8:00 PM',
          'Tuesday': '08:00 AM - 8:00 PM',
          'Wednesday': '08:00 AM - 8:00 PM',
          'Thursday': '08:00 AM - 8:00 PM',
          'Friday': '08:00 AM - 8:00 PM',
          'Saturday': '08:00 AM - 8:00 PM',
          'Sunday': '08:00 AM - 8:00 PM'
        }
      },
      {
        name: 'HKTB Information Desk - Airport',
        address: 'Hong Kong International Airport, Arrivals Hall',
        phone: '+852 2508 1234',
        hours: {
          'Monday': '07:00 AM - 11:00 PM',
          'Tuesday': '07:00 AM - 11:00 PM',
          'Wednesday': '07:00 AM - 11:00 PM',
          'Thursday': '07:00 AM - 11:00 PM',
          'Friday': '07:00 AM - 11:00 PM',
          'Saturday': '07:00 AM - 11:00 PM',
          'Sunday': '07:00 AM - 11:00 PM'
        }
      },
      {
        name: 'Dragon Worlds Welcome Desk - RHKYC',
        address: 'Royal Hong Kong Yacht Club, Kellett Island',
        phone: '+852 2508 1234',
        hours: {
          'Monday': '09:00 AM - 6:00 PM',
          'Tuesday': '09:00 AM - 6:00 PM',
          'Wednesday': '09:00 AM - 6:00 PM',
          'Thursday': '09:00 AM - 6:00 PM',
          'Friday': '09:00 AM - 6:00 PM',
          'Saturday': '09:00 AM - 6:00 PM',
          'Sunday': '09:00 AM - 6:00 PM'
        }
      }
    ],
    offers: [
      {
        id: 'hktb_attractions_pass',
        title: 'Dragon Worlds Hong Kong Pass',
        description: 'Complimentary 7-day attractions pass including Ocean Park, Peak Tram, and Big Buddha cable car',
        type: 'experience',
        validUntil: '2027-12-31',
        howToRedeem: 'Collect at HKTB visitor centers with Dragon Worlds credentials',
        termsAndConditions: [
          'Valid for 7 days from first use',
          'Includes unlimited MTR rides',
          'One pass per registered participant'
        ]
      },
      {
        id: 'hktb_dining_card',
        title: 'Hong Kong Dining Privileges Card',
        description: 'Exclusive discounts at over 200 partner restaurants across Hong Kong',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Download via Discover Hong Kong app with participant code',
        termsAndConditions: [
          '10-25% discount at participating restaurants',
          'Valid for dine-in only',
          'Cannot be combined with other promotions'
        ]
      },
      {
        id: 'hktb_shopping_voucher',
        title: 'Hong Kong Shopping Rewards',
        description: 'HKD 500 shopping vouchers for major Hong Kong malls and outlets',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Collect at HKTB visitor centers',
        termsAndConditions: [
          'Minimum spend of HKD 1,000 required',
          'Valid at participating malls',
          'One set per participant'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'hktb_harbour_cruise',
        title: 'Victoria Harbour Sailing Experience',
        description: 'Private chartered junk boat cruise around Victoria Harbour with local seafood dinner',
        type: 'sightseeing',
        sponsorId: 'hktb',
        website: 'https://www.discoverhongkong.com/harbour',
        bookingRequired: true,
        duration: '3 hours',
        priceRange: 'free',
        bestTime: 'Evening (7:00 PM departure)'
      },
      {
        id: 'hktb_heritage_walk',
        title: 'Hong Kong Heritage Discovery Walk',
        description: 'Guided walking tours through historic neighborhoods including Sheung Wan, Central, and Tai O',
        type: 'cultural',
        sponsorId: 'hktb',
        website: 'https://www.discoverhongkong.com/heritage',
        bookingRequired: true,
        duration: '3.5 hours',
        priceRange: 'free',
        bestTime: 'Morning or late afternoon'
      },
      {
        id: 'hktb_food_tour',
        title: 'Authentic Hong Kong Street Food Tour',
        description: 'Explore the best of Hong Kong\'s culinary scene from dai pai dongs to hidden local gems',
        type: 'dining',
        sponsorId: 'hktb',
        bookingRequired: true,
        duration: '4 hours',
        priceRange: '$',
        bestTime: 'Evening'
      }
    ]
  },

  {
    id: 'yanmar',
    name: 'Yanmar',
    tier: 'partner',
    description: 'A Sustainable Future - Official Marine Engine Partner of Dragon Worlds HK 2027',
    website: 'https://www.yanmar.com',
    primaryColor: '#E60012',
    contact: {
      phone: '+852 2833 3133',
      email: 'marine@yanmar.com.hk',
      address: 'Yanmar Hong Kong, 18/F, Tower 2, Admiralty Centre, 18 Harcourt Road'
    },
    business: {
      sector: 'Marine Engines & Equipment',
      established: 1912,
      headquarters: 'Osaka, Japan',
      description: 'Yanmar is a global leader in marine diesel engines, committed to sustainable solutions for the marine industry. Their cutting-edge technology powers vessels worldwide, from recreational boats to commercial fishing fleets.'
    },
    locations: [
      {
        name: 'Yanmar Marine Service Centre',
        address: 'Aberdeen Marina Club, 8 Shum Wan Road, Aberdeen',
        phone: '+852 2833 3133',
        website: 'https://www.yanmar.com/marine',
        hours: {
          'Monday': '08:00 AM - 6:00 PM',
          'Tuesday': '08:00 AM - 6:00 PM',
          'Wednesday': '08:00 AM - 6:00 PM',
          'Thursday': '08:00 AM - 6:00 PM',
          'Friday': '08:00 AM - 6:00 PM',
          'Saturday': '08:00 AM - 1:00 PM',
          'Sunday': 'Emergency only'
        }
      },
      {
        name: 'Yanmar Technical Support - RHKYC',
        address: 'Royal Hong Kong Yacht Club, Kellett Island',
        phone: '+852 2833 3188',
        hours: {
          'Monday': '07:00 AM - 7:00 PM',
          'Tuesday': '07:00 AM - 7:00 PM',
          'Wednesday': '07:00 AM - 7:00 PM',
          'Thursday': '07:00 AM - 7:00 PM',
          'Friday': '07:00 AM - 7:00 PM',
          'Saturday': '07:00 AM - 7:00 PM',
          'Sunday': '07:00 AM - 7:00 PM'
        }
      }
    ],
    offers: [
      {
        id: 'yanmar_engine_service',
        title: 'Free Engine Health Check',
        description: 'Complimentary engine diagnostic and health check for all competing vessels',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Schedule appointment at Yanmar service center or on-site at RHKYC',
        termsAndConditions: [
          'Available for Yanmar and other major engine brands',
          'Includes written report and recommendations',
          'Parts and labor for repairs quoted separately'
        ]
      },
      {
        id: 'yanmar_parts_discount',
        title: '25% Discount on Genuine Parts',
        description: 'Special discount on all genuine Yanmar parts and accessories',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Present Dragon Worlds credentials at service center',
        termsAndConditions: [
          'Valid for genuine Yanmar parts only',
          'Includes filters, belts, and impellers',
          'Cannot be combined with other offers'
        ]
      },
      {
        id: 'yanmar_training',
        title: 'Marine Diesel Maintenance Workshop',
        description: 'Hands-on workshop teaching essential diesel engine maintenance for sailors',
        type: 'experience',
        validUntil: '2027-12-31',
        howToRedeem: 'Register online at Yanmar Dragon Worlds page',
        termsAndConditions: [
          'Limited to 20 participants per session',
          'Certificate of completion provided',
          'Tools and materials included'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'yanmar_factory_tour',
        title: 'Yanmar Technology Showcase',
        description: 'Interactive exhibition featuring the latest in sustainable marine propulsion technology',
        type: 'cultural',
        sponsorId: 'yanmar',
        website: 'https://www.yanmar.com/dragonworlds',
        bookingRequired: false,
        duration: '1 hour',
        priceRange: 'free',
        bestTime: 'Any time during championship week'
      },
      {
        id: 'yanmar_captain_talk',
        title: 'Captain\'s Technical Seminar',
        description: 'Expert-led seminar on optimizing marine engine performance for racing conditions',
        type: 'business',
        sponsorId: 'yanmar',
        bookingRequired: true,
        duration: '2 hours',
        priceRange: 'free',
        bestTime: 'Championship rest day'
      }
    ]
  },

  {
    id: 'central_oceans',
    name: 'Central Oceans',
    tier: 'partner',
    description: 'Official Freight Partner for the 2027 Dragon World Championship - Specialists in yacht and sailboat shipping',
    website: 'https://www.centraloceans.com',
    primaryColor: '#0066CC',
    contact: {
      email: 'info@centraloceans.com',
      website: 'https://www.centraloceans.com'
    },
    business: {
      sector: 'Marine Freight & Logistics',
      established: 2008,
      headquarters: 'Hong Kong',
      description: 'Central Oceans specializes in the market of oversized, complicated and project-related cargoes. Our dedicated team of international transport specialists offers innovative tailored solutions to guarantee safe delivery of your freight.'
    },
    locations: [],
    offers: [
      {
        id: 'central_oceans_shipping',
        title: 'Dragon Shipping Package',
        description: 'Subsidized shipping and logistics for transporting your Dragon to and from Hong Kong',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Contact Central Oceans directly referencing Dragon World Championship 2027',
        termsAndConditions: [
          'RHKYC and sponsors subsidize shipping costs',
          'Full container load (FCL) and custom crating available',
          'Contact for personalized quote'
        ]
      }
    ],
    hongKongActivities: []
  },
  {
    id: 'clearwater_bay',
    name: 'Clearwater Bay Golf and Country Club',
    tier: 'partner',
    description: 'Official Marina Venue Partner with direct access to the Ninepins racing area',
    website: 'https://www.cwbgcc.com',
    primaryColor: '#006633',
    contact: {
      phone: '+852 2335 3885',
      email: 'marina@cwbgcc.com',
      address: '139 Tai Au Mun Road, Clearwater Bay, N.T.'
    },
    business: {
      sector: 'Golf & Marina',
      established: 1982,
      headquarters: 'Hong Kong',
      description: 'Hong Kong\'s most scenic marina with crystal clear waters. Championship venue providing direct access to Ninepins racing area with 300 wet berths and comprehensive marine services.'
    },
    locations: [
      {
        name: 'Clearwater Bay Marina',
        address: '139 Tai Au Mun Road, Clearwater Bay, N.T.',
        phone: '+852 2335 3885',
        website: 'https://www.cwbgcc.com',
        hours: {
          'Monday': '06:00 AM - 7:00 PM',
          'Tuesday': '06:00 AM - 7:00 PM',
          'Wednesday': '06:00 AM - 7:00 PM',
          'Thursday': '06:00 AM - 7:00 PM',
          'Friday': '06:00 AM - 7:00 PM',
          'Saturday': '06:00 AM - 7:00 PM',
          'Sunday': '06:00 AM - 7:00 PM'
        }
      }
    ],
    offers: [],
    hongKongActivities: []
  },
  {
    id: 'sailors_for_the_sea',
    name: 'Sailors for the Sea',
    tier: 'partner',
    description: 'Sustainability Partner - Promoting clean regattas and ocean conservation',
    website: 'https://sailorsforthesea.org',
    primaryColor: '#0077B6',
    contact: {
      email: 'info@sailorsforthesea.org',
      website: 'https://sailorsforthesea.org'
    },
    business: {
      sector: 'Environmental Non-Profit',
      established: 2004,
      headquarters: 'Newport, Rhode Island, USA',
      description: 'Sailors for the Sea is the leading ocean conservation organization engaging the sailing and boating community in protecting the ocean. Their Clean Regattas program helps events reduce their environmental impact.'
    },
    locations: [],
    offers: [],
    hongKongActivities: []
  },
  {
    id: 'code_zero',
    name: 'Code Zero',
    tier: 'supporting',
    description: 'Performance Sailing Apparel - Official Clothing Partner of Dragon Worlds HK 2027',
    website: 'https://www.code-zero.com',
    primaryColor: '#000000',
    contact: {
      phone: '+852 2527 8899',
      email: 'ahoy@code-zero.com',
      address: 'Code Zero Flagship Store, Pacific Place, Admiralty'
    },
    business: {
      sector: 'Technical Sailing Apparel',
      established: 2008,
      headquarters: 'Denmark',
      description: 'Code Zero creates premium technical sailing apparel designed for performance and style. Our gear is worn by professional sailors and weekend warriors alike, combining cutting-edge fabrics with contemporary design.'
    },
    locations: [
      {
        name: 'Code Zero Flagship Store',
        address: 'Shop 331, Pacific Place, 88 Queensway, Admiralty',
        phone: '+852 2527 8899',
        website: 'https://www.code-zero.com',
        hours: {
          'Monday': '10:00 AM - 8:00 PM',
          'Tuesday': '10:00 AM - 8:00 PM',
          'Wednesday': '10:00 AM - 8:00 PM',
          'Thursday': '10:00 AM - 8:00 PM',
          'Friday': '10:00 AM - 9:00 PM',
          'Saturday': '10:00 AM - 9:00 PM',
          'Sunday': '11:00 AM - 7:00 PM'
        }
      },
      {
        name: 'Code Zero Pop-Up - RHKYC',
        address: 'Royal Hong Kong Yacht Club, Kellett Island',
        phone: '+852 2527 8899',
        hours: {
          'Monday': '08:00 AM - 8:00 PM',
          'Tuesday': '08:00 AM - 8:00 PM',
          'Wednesday': '08:00 AM - 8:00 PM',
          'Thursday': '08:00 AM - 8:00 PM',
          'Friday': '08:00 AM - 8:00 PM',
          'Saturday': '08:00 AM - 8:00 PM',
          'Sunday': '08:00 AM - 8:00 PM'
        }
      },
      {
        name: 'Code Zero Outlet - Stanley',
        address: 'Murray House, Stanley Plaza',
        phone: '+852 2813 2288',
        hours: {
          'Monday': '10:00 AM - 7:00 PM',
          'Tuesday': '10:00 AM - 7:00 PM',
          'Wednesday': '10:00 AM - 7:00 PM',
          'Thursday': '10:00 AM - 7:00 PM',
          'Friday': '10:00 AM - 7:00 PM',
          'Saturday': '10:00 AM - 8:00 PM',
          'Sunday': '10:00 AM - 8:00 PM'
        }
      }
    ],
    offers: [
      {
        id: 'code_zero_team_discount',
        title: '30% Team Apparel Discount',
        description: 'Exclusive discount on all Code Zero sailing gear including foul weather gear, base layers, and accessories',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Show Dragon Worlds credentials at any Code Zero store',
        termsAndConditions: [
          'Valid on full-priced items only',
          'Includes custom team embroidery options',
          'Cannot be combined with other promotions'
        ]
      },
      {
        id: 'code_zero_limited_edition',
        title: 'Dragon Worlds 2027 Limited Edition Collection',
        description: 'Exclusive access to the limited edition Dragon Worlds HK 2027 apparel collection',
        type: 'product',
        validUntil: '2027-12-31',
        howToRedeem: 'Pre-order at Code Zero stores or Dragon Worlds registration',
        termsAndConditions: [
          'Limited quantities available',
          'Pre-orders receive priority',
          'Includes commemorative packaging'
        ]
      },
      {
        id: 'code_zero_repair',
        title: 'Free Gear Repair Service',
        description: 'Complimentary repair service for Code Zero gear during championship week',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Bring gear to Code Zero pop-up at RHKYC',
        termsAndConditions: [
          'Valid for Code Zero branded items only',
          'Minor repairs completed same day',
          'Major repairs subject to parts availability'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'code_zero_fashion_show',
        title: 'Code Zero Sailing Fashion Show',
        description: 'Preview the latest Code Zero collection with professional sailors as models',
        type: 'social',
        sponsorId: 'code_zero',
        website: 'https://www.code-zero.com/dragonworlds',
        bookingRequired: true,
        duration: '2 hours',
        priceRange: 'free',
        bestTime: 'Championship opening night'
      },
      {
        id: 'code_zero_design_tour',
        title: 'Sailing Apparel Design Workshop',
        description: 'Behind-the-scenes look at technical sailing apparel design with Code Zero designers',
        type: 'cultural',
        sponsorId: 'code_zero',
        bookingRequired: true,
        duration: '1.5 hours',
        priceRange: 'free',
        bestTime: 'Championship rest day afternoon'
      }
    ]
  }
];

export const dragonWorldsSponsorshipProgram: SponsorshipProgram = {
  eventId: 'dragon-worlds-2027',
  title: 'Dragon World Championships Hong Kong 2027 - Sponsorship Program',
  description: 'Celebrating excellence in international Dragon class sailing with world-class partners',
  startDate: '2027-01-01',
  endDate: '2027-12-31',
  sponsors: dragonWorldsSponsors
};

// Helper functions for sponsor data
export const getSponsorsByTier = (tier: string) => {
  return dragonWorldsSponsors.filter(sponsor => sponsor.tier === tier);
};

// New tier structure matching official website
export const getOrganiser = () => getSponsorsByTier('organiser');
export const getCoOrganisers = () => getSponsorsByTier('co-organiser');
export const getPartners = () => getSponsorsByTier('partner');

// Legacy tier helpers (for backwards compatibility)
export const getLeadSponsors = () => getSponsorsByTier('organiser');
export const getPremiereSponsors = () => getSponsorsByTier('co-organiser');
export const getMajorSponsors = () => getSponsorsByTier('partner');
export const getSupportingSponsors = () => getSponsorsByTier('supporting');

export const getAllHongKongActivities = () => {
  return dragonWorldsSponsors.flatMap(sponsor =>
    sponsor.hongKongActivities.map(activity => ({
      ...activity,
      sponsorName: sponsor.name,
      sponsorTier: sponsor.tier
    }))
  );
};

export const getActivitiesByType = (type: string) => {
  return getAllHongKongActivities().filter(activity => activity.type === type);
};
