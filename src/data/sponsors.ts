import { Sponsor, SponsorshipProgram } from '../types/sponsor';

export const dragonWorldsSponsors: Sponsor[] = [
  // TITLE SPONSOR
  {
    id: 'hsbc',
    name: 'HSBC',
    tier: 'lead',
    description: 'The World\'s Local Bank - Proud Title Sponsor of Dragon Worlds HK 2027',
    website: 'https://www.hsbc.com.hk',
    primaryColor: '#DB0011',
    isTitle: true,
    contact: {
      phone: '+852 2233 3000',
      email: 'premier@hsbc.com.hk',
      address: 'HSBC Main Building, 1 Queen\'s Road Central, Hong Kong'
    },
    business: {
      sector: 'Financial Services',
      established: 1865,
      headquarters: 'London, UK (Founded in Hong Kong)',
      description: 'HSBC is one of the world\'s largest banking and financial services organisations. Founded in Hong Kong in 1865, HSBC has been an integral part of the city\'s development as a global financial center.'
    },
    locations: [
      {
        name: 'HSBC Main Building',
        address: '1 Queen\'s Road Central, Hong Kong',
        phone: '+852 2822 1111',
        website: 'https://www.hsbc.com.hk',
        hours: {
          'Monday': '09:00 AM - 5:00 PM',
          'Tuesday': '09:00 AM - 5:00 PM',
          'Wednesday': '09:00 AM - 5:00 PM',
          'Thursday': '09:00 AM - 5:00 PM',
          'Friday': '09:00 AM - 5:00 PM',
          'Saturday': '09:00 AM - 1:00 PM',
          'Sunday': 'Closed'
        }
      },
      {
        name: 'HSBC Premier Centre - Causeway Bay',
        address: 'Times Square, 1 Matheson Street, Causeway Bay',
        phone: '+852 2233 3322',
        hours: {
          'Monday': '09:00 AM - 6:00 PM',
          'Tuesday': '09:00 AM - 6:00 PM',
          'Wednesday': '09:00 AM - 6:00 PM',
          'Thursday': '09:00 AM - 6:00 PM',
          'Friday': '09:00 AM - 6:00 PM',
          'Saturday': '09:00 AM - 1:00 PM',
          'Sunday': 'Closed'
        }
      },
      {
        name: 'HSBC Regatta Information Desk',
        address: 'Royal Hong Kong Yacht Club, Kellett Island, Causeway Bay',
        phone: '+852 2233 3000',
        hours: {
          'Monday': '08:00 AM - 6:00 PM',
          'Tuesday': '08:00 AM - 6:00 PM',
          'Wednesday': '08:00 AM - 6:00 PM',
          'Thursday': '08:00 AM - 6:00 PM',
          'Friday': '08:00 AM - 6:00 PM',
          'Saturday': '08:00 AM - 4:00 PM',
          'Sunday': '08:00 AM - 4:00 PM'
        }
      }
    ],
    offers: [
      {
        id: 'hsbc_premier_sailing',
        title: 'Premier Sailing Account Package',
        description: 'Exclusive banking package with zero account fees, free international transfers, and priority currency exchange for all Dragon Worlds participants',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Visit any HSBC Premier Centre with your Dragon Worlds participant credentials',
        termsAndConditions: [
          'Valid for Dragon Worlds participants and crew only',
          'Free currency exchange up to HKD 100,000',
          'No account maintenance fees during championship period',
          'Complimentary travel insurance included'
        ]
      },
      {
        id: 'hsbc_global_transfers',
        title: 'Free International Wire Transfers',
        description: 'Unlimited complimentary wire transfers to over 40 countries during the championship period',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Use HSBC mobile app or visit any branch with participant credentials',
        termsAndConditions: [
          'Maximum transfer limit of USD 50,000 per transaction',
          'Available to all registered participants',
          'Beneficiary bank charges may apply'
        ]
      },
      {
        id: 'hsbc_lounge_access',
        title: 'VIP Airport Lounge Access',
        description: 'Complimentary access to HSBC Premier Lounges at Hong Kong International Airport',
        type: 'experience',
        validUntil: '2027-12-31',
        howToRedeem: 'Present participant badge and boarding pass at lounge entrance',
        termsAndConditions: [
          'Valid for up to 4 guests per participant',
          'Available 3 hours before flight departure',
          'Food and beverages included'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'hsbc_rooftop_reception',
        title: 'HSBC Dragon Worlds Welcome Reception',
        description: 'Exclusive welcome cocktail reception at the iconic HSBC Main Building rooftop with panoramic Victoria Harbour views',
        type: 'social',
        sponsorId: 'hsbc',
        website: 'https://www.hsbc.com.hk/dragonworlds',
        bookingRequired: true,
        duration: '3 hours',
        priceRange: 'free',
        bestTime: 'Championship opening evening'
      },
      {
        id: 'hsbc_finance_tour',
        title: 'Hong Kong Financial District Walking Tour',
        description: 'Guided tour exploring Hong Kong\'s evolution as a global financial hub, including HSBC\'s historic headquarters',
        type: 'cultural',
        sponsorId: 'hsbc',
        bookingRequired: true,
        duration: '2 hours',
        priceRange: 'free',
        bestTime: 'Weekday mornings'
      }
    ]
  },

  // PREMIERE SPONSORS
  {
    id: 'hopewell_hotel',
    name: 'Hopewell Hotel',
    tier: 'premiere',
    description: 'Your Home Away From Home - Official Accommodation Partner of Dragon Worlds HK 2027',
    website: 'https://www.hopewellhotel.com',
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
      description: 'Hopewell Hotel offers world-class accommodation in the heart of Hong Kong, with stunning harbour views and convenient access to the yacht club and racing venues.'
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
        title: 'Dragon Worlds Competitor Rate',
        description: '35% discount on all room categories with complimentary breakfast and late checkout',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Book directly using promo code DRAGON2027',
        termsAndConditions: [
          'Valid for registered participants and their guests',
          'Subject to availability',
          'Complimentary upgrade subject to availability',
          'Late checkout until 2:00 PM included'
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
    tier: 'premiere',
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
    tier: 'premiere',
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
    id: 'code_zero',
    name: 'Code Zero',
    tier: 'premiere',
    description: 'Performance Sailing Apparel - Official Clothing Partner of Dragon Worlds HK 2027',
    website: 'https://www.codezero.com',
    primaryColor: '#000000',
    contact: {
      phone: '+852 2527 8899',
      email: 'hk@codezero.com',
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
        website: 'https://www.codezero.com',
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
        website: 'https://www.codezero.com/dragonworlds',
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

export const getLeadSponsors = () => getSponsorsByTier('lead');
export const getPremiereSponsors = () => getSponsorsByTier('premiere');
export const getMajorSponsors = () => getSponsorsByTier('major');
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
