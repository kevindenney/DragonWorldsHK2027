import { Sponsor, SponsorshipProgram } from '../types/sponsor';

export const dragonWorldsSponsors: Sponsor[] = [
  // LEAD SPONSOR
  {
    id: 'rolex',
    name: 'Rolex',
    tier: 'lead',
    description: 'A Crown for Every Achievement - Official Timekeeper of Dragon Worlds HK 2027',
    website: 'https://www.rolex.com',
    primaryColor: '#006A4E',
    isTitle: true,
    contact: {
      phone: '+852 2921 9888',
      email: 'hongkong@rolex.com',
      address: 'Rolex Hong Kong, Prince\'s Building, Central'
    },
    business: {
      sector: 'Luxury Timepieces',
      established: 1905,
      headquarters: 'Geneva, Switzerland',
      description: 'Rolex has been the official timekeeper of prestigious sailing events worldwide, supporting the pursuit of excellence in competitive sailing.'
    },
    locations: [
      {
        name: 'Rolex Boutique Central',
        address: 'Shop G04-06, Prince\'s Building, 10 Chater Road, Central',
        phone: '+852 2921 9888',
        website: 'https://www.rolex.com/rolex-dealers/hong-kong',
        hours: {
          'Monday': '10:00 AM - 8:00 PM',
          'Tuesday': '10:00 AM - 8:00 PM',
          'Wednesday': '10:00 AM - 8:00 PM',
          'Thursday': '10:00 AM - 8:00 PM',
          'Friday': '10:00 AM - 8:00 PM',
          'Saturday': '10:00 AM - 8:00 PM',
          'Sunday': '11:00 AM - 7:00 PM'
        }
      },
      {
        name: 'Rolex Boutique Tsim Sha Tsui',
        address: 'Shop LG1-28, Harbour City, 3-27 Canton Road, Tsim Sha Tsui',
        phone: '+852 2375 2828',
        hours: {
          'Monday': '10:00 AM - 10:00 PM',
          'Tuesday': '10:00 AM - 10:00 PM',
          'Wednesday': '10:00 AM - 10:00 PM',
          'Thursday': '10:00 AM - 10:00 PM',
          'Friday': '10:00 AM - 10:00 PM',
          'Saturday': '10:00 AM - 10:00 PM',
          'Sunday': '10:00 AM - 10:00 PM'
        }
      }
    ],
    offers: [
      {
        id: 'rolex_vip_experience',
        title: 'Dragon Worlds VIP Watch Experience',
        description: 'Private viewing of the latest Yacht-Master collection with expert consultation',
        type: 'experience',
        validUntil: '2027-12-31',
        howToRedeem: 'Present Dragon Worlds participant credentials at any Rolex boutique',
        termsAndConditions: [
          'Valid for registered participants and crew only',
          'Appointment required - call ahead',
          'Valid ID required'
        ]
      },
      {
        id: 'rolex_sailing_collection',
        title: 'Complimentary Yacht-Master Servicing',
        description: 'Free professional servicing for Rolex Yacht-Master timepieces',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Visit authorized Rolex service center with proof of participation',
        termsAndConditions: [
          'Valid for genuine Rolex timepieces only',
          'Standard servicing only',
          'Excludes major repairs'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'rolex_masters_exhibition',
        title: 'Rolex Masters of Time Exhibition',
        description: 'Exclusive exhibition showcasing the history of Rolex in sailing and yachting',
        type: 'cultural',
        sponsorId: 'rolex',
        website: 'https://www.rolex.com/events',
        bookingRequired: true,
        duration: '2 hours',
        priceRange: 'free',
        bestTime: 'Weekday afternoons'
      }
    ]
  },

  // PREMIERE SPONSORS
  {
    id: 'hsbc',
    name: 'HSBC',
    tier: 'premiere',
    description: 'The World\'s Local Bank - Premier Banking Partner for International Sailors',
    website: 'https://www.hsbc.com.hk',
    primaryColor: '#DC143C',
    contact: {
      phone: '+852 2233 3000',
      email: 'premier@hsbc.com.hk'
    },
    business: {
      sector: 'Financial Services',
      established: 1865,
      headquarters: 'London, UK',
      description: 'HSBC provides comprehensive banking services to international visitors and sailing professionals worldwide.'
    },
    offers: [
      {
        id: 'hsbc_premier_sailing',
        title: 'Premier Banking for Sailors',
        description: 'Exclusive banking package with no minimum balance and complimentary services',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Visit HSBC Premier Centre with sailing credentials',
        termsAndConditions: [
          'Valid for Dragon Worlds participants and crew',
          'Free currency exchange up to HKD 50,000',
          'No account fees during championship period'
        ]
      },
      {
        id: 'hsbc_global_transfers',
        title: 'Free International Transfers',
        description: 'Complimentary wire transfers to over 40 countries',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Use HSBC mobile app or visit any branch',
        termsAndConditions: [
          'Requires HSBC account opening',
          'Standard transfer limits apply',
          'Beneficiary charges may apply'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'hsbc_vip_banking',
        title: 'VIP Banking Lounge Access',
        description: 'Complimentary access to HSBC Premier lounges with refreshments and Wi-Fi',
        type: 'business',
        sponsorId: 'hsbc',
        bookingRequired: false,
        duration: 'Flexible',
        priceRange: 'free',
        bestTime: 'Business hours'
      }
    ]
  },

  {
    id: 'lee_kum_kee',
    name: 'Lee Kum Kee',
    tier: 'premiere',
    description: 'Sauce Makes the Taste - Authentic Hong Kong Flavors Since 1888',
    website: 'https://www.lkk.com',
    primaryColor: '#FF0000',
    contact: {
      phone: '+852 2873 8888',
      email: 'info@lkk.com'
    },
    business: {
      sector: 'Food & Condiments',
      established: 1888,
      headquarters: 'Hong Kong',
      description: 'Lee Kum Kee is a household name globally, bringing authentic Asian flavors to tables worldwide.'
    },
    offers: [
      {
        id: 'lkk_cooking_class',
        title: 'Authentic Cantonese Cooking Workshop',
        description: 'Learn to cook traditional Hong Kong dishes with Lee Kum Kee sauces',
        type: 'experience',
        validUntil: '2027-12-31',
        howToRedeem: 'Book online with participant code DW2027',
        termsAndConditions: [
          'Limited to 20 participants per session',
          'English and Cantonese instruction available',
          'All ingredients provided'
        ]
      },
      {
        id: 'lkk_product_gift',
        title: 'Authentic Sauce Collection',
        description: 'Complimentary gift set of premium Lee Kum Kee sauces',
        type: 'product',
        validUntil: '2027-12-31',
        howToRedeem: 'Collect at Lee Kum Kee visitor center',
        termsAndConditions: [
          'One gift set per participant',
          'Valid ID required',
          'Subject to availability'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'lkk_heritage_tour',
        title: 'Lee Kum Kee Heritage Experience',
        description: 'Interactive tour of Lee Kum Kee\'s history and traditional sauce-making process',
        type: 'cultural',
        sponsorId: 'lee_kum_kee',
        website: 'https://www.lkk.com/heritage',
        bookingRequired: true,
        duration: '90 minutes',
        priceRange: 'free',
        bestTime: 'Weekday mornings'
      },
      {
        id: 'lkk_dining_recommendations',
        title: 'Authentic Hong Kong Restaurant Guide',
        description: 'Curated list of traditional restaurants using Lee Kum Kee products',
        type: 'dining',
        sponsorId: 'lee_kum_kee',
        bookingRequired: false,
        priceRange: '$$',
        bestTime: 'Dinner time'
      }
    ]
  },

  // MAJOR SPONSORS
  {
    id: 'sino_group',
    name: 'Sino Group',
    tier: 'major',
    description: 'Building Hong Kong\'s Future - Premium Property and Hospitality',
    website: 'https://www.sino.com',
    primaryColor: '#1f4788',
    contact: {
      phone: '+852 2833 8888',
      email: 'info@sino.com'
    },
    business: {
      sector: 'Property Development & Hospitality',
      established: 1971,
      headquarters: 'Hong Kong',
      description: 'Sino Group is a leading property developer and hotel operator in Hong Kong and China.'
    },
    offers: [
      {
        id: 'sino_hotel_discount',
        title: 'Exclusive Hotel Rates',
        description: '30% discount at all Sino Group hotels including Conrad Hong Kong',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Book directly with promo code DRAGONWORLDS2027',
        termsAndConditions: [
          'Subject to availability',
          'Cannot be combined with other offers',
          'Valid for stays during championship period'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'sino_property_tour',
        title: 'Hong Kong Skyline Architecture Tour',
        description: 'Guided tour of iconic Sino Group developments and their architectural significance',
        type: 'sightseeing',
        sponsorId: 'sino_group',
        bookingRequired: true,
        duration: '3 hours',
        priceRange: 'free',
        bestTime: 'Weekend afternoons'
      }
    ]
  },

  {
    id: 'hopewell',
    name: 'Hopewell Holdings',
    tier: 'major',
    description: 'Infrastructure Excellence - Building Hong Kong\'s Connections',
    website: 'https://www.hopewellhk.com',
    primaryColor: '#0066CC',
    contact: {
      phone: '+852 2862 0123'
    },
    business: {
      sector: 'Infrastructure & Property',
      established: 1972,
      headquarters: 'Hong Kong',
      description: 'Hopewell Holdings is renowned for major infrastructure projects including highways and power plants.'
    },
    offers: [
      {
        id: 'hopewell_infrastructure_tour',
        title: 'Hong Kong Infrastructure Heritage Tour',
        description: 'Behind-the-scenes look at Hong Kong\'s major infrastructure projects',
        type: 'experience',
        validUntil: '2027-12-31',
        howToRedeem: 'Register online with participant credentials',
        termsAndConditions: [
          'Safety briefing required',
          'Hard hats provided',
          'Age restrictions may apply'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'hopewell_bridge_experience',
        title: 'Hopewell Centre Sky Bridge',
        description: 'Exclusive access to panoramic views from Hopewell Centre',
        type: 'sightseeing',
        sponsorId: 'hopewell',
        bookingRequired: true,
        duration: '45 minutes',
        priceRange: 'free',
        bestTime: 'Sunset hours'
      }
    ]
  },

  {
    id: 'conrad_hotels',
    name: 'Conrad Hotels & Resorts',
    tier: 'major',
    description: 'Inspired by Travel - Luxury Hospitality Partner',
    website: 'https://www.conradhotels.com',
    primaryColor: '#8B4513',
    contact: {
      phone: '+852 2521 3838',
      email: 'conrad.hongkong@conradhotels.com'
    },
    business: {
      sector: 'Luxury Hospitality',
      established: 1982,
      headquarters: 'McLean, Virginia, USA',
      description: 'Conrad Hotels & Resorts offers luxury accommodations in major business centers worldwide.'
    },
    offers: [
      {
        id: 'conrad_spa_package',
        title: 'Recovery Spa Package',
        description: 'Post-racing recovery with massage and wellness treatments',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Book spa appointments with sailing credentials',
        termsAndConditions: [
          '20% discount on all spa services',
          'Advance booking required',
          'Subject to therapist availability'
        ]
      },
      {
        id: 'conrad_dining_credit',
        title: 'Dining Experience Credit',
        description: 'HKD 500 dining credit at Conrad Hong Kong restaurants',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Present participant badge when dining',
        termsAndConditions: [
          'Minimum spend of HKD 800 required',
          'Valid for dinner only',
          'Not applicable to room service'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'conrad_afternoon_tea',
        title: 'Signature Afternoon Tea Experience',
        description: 'Traditional British afternoon tea with Hong Kong influences',
        type: 'dining',
        sponsorId: 'conrad_hotels',
        website: 'https://www.conradhotels.com/conrad-hong-kong',
        bookingRequired: true,
        duration: '2 hours',
        priceRange: '$$$',
        bestTime: 'Mid-afternoon'
      }
    ]
  },

  // SUPPORTING SPONSORS
  {
    id: 'hktb',
    name: 'Hong Kong Tourism Board',
    tier: 'supporting',
    description: 'Discover Hong Kong - Your Gateway to Asia',
    website: 'https://www.discoverhongkong.com',
    primaryColor: '#FF6B35',
    contact: {
      phone: '+852 2807 6177',
      email: 'info@hktb.com'
    },
    business: {
      sector: 'Tourism Promotion',
      established: 2001,
      headquarters: 'Hong Kong',
      description: 'HKTB promotes Hong Kong as a world-class tourist destination.'
    },
    offers: [
      {
        id: 'hktb_attractions_pass',
        title: 'Hong Kong Attractions Pass',
        description: 'Complimentary access to major Hong Kong attractions',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Collect at HKTB visitor centers with sailing credentials',
        termsAndConditions: [
          'Valid for 7 days from first use',
          'Includes transportation',
          'Some attractions require advance booking'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'hktb_heritage_walk',
        title: 'Hong Kong Heritage Discovery Walk',
        description: 'Guided walking tours of historic Hong Kong neighborhoods',
        type: 'cultural',
        sponsorId: 'hktb',
        website: 'https://www.discoverhongkong.com/heritage',
        bookingRequired: true,
        duration: '3 hours',
        priceRange: 'free',
        bestTime: 'Morning or late afternoon'
      },
      {
        id: 'hktb_food_tours',
        title: 'Authentic Hong Kong Food Tours',
        description: 'Street food and local restaurant tours with expert guides',
        type: 'dining',
        sponsorId: 'hktb',
        bookingRequired: true,
        duration: '4 hours',
        priceRange: '$$',
        bestTime: 'Evening'
      }
    ]
  },

  {
    id: 'gaw_capital',
    name: 'Gaw Capital Partners',
    tier: 'supporting',
    description: 'Gateway Real Estate Investment and Development',
    website: 'https://www.gaw.com',
    primaryColor: '#2C5F2D',
    contact: {
      phone: '+852 2847 7200',
      email: 'info@gaw.com'
    },
    business: {
      sector: 'Real Estate Investment',
      established: 2005,
      headquarters: 'Hong Kong',
      description: 'Gaw Capital Partners is a leading real estate private equity firm focused on the Asia Pacific region.'
    },
    offers: [
      {
        id: 'gaw_property_insights',
        title: 'Hong Kong Real Estate Market Briefing',
        description: 'Exclusive market insights session for international visitors',
        type: 'experience',
        validUntil: '2027-12-31',
        howToRedeem: 'Register online for quarterly briefing sessions',
        termsAndConditions: [
          'Limited to 30 participants',
          'Professional networking event',
          'Light refreshments provided'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'gaw_skyline_tour',
        title: 'Hong Kong Skyline Development Tour',
        description: 'Architectural tour of major developments and urban planning innovations',
        type: 'sightseeing',
        sponsorId: 'gaw_capital',
        bookingRequired: true,
        duration: '2.5 hours',
        priceRange: 'free',
        bestTime: 'Weekend mornings'
      }
    ]
  },

  {
    id: 'sun_hung_kai',
    name: 'Sun Hung Kai Finance',
    tier: 'supporting',
    description: 'Financial Excellence - Investment and Advisory Services',
    website: 'https://www.shkf.com',
    primaryColor: '#003366',
    contact: {
      phone: '+852 2533 4455',
      email: 'info@shkf.com'
    },
    business: {
      sector: 'Financial Services',
      established: 1969,
      headquarters: 'Hong Kong',
      description: 'Sun Hung Kai Finance provides comprehensive financial services including investment banking and asset management.'
    },
    offers: [
      {
        id: 'shkf_investment_consultation',
        title: 'Complimentary Investment Consultation',
        description: 'Professional financial planning and investment advice session',
        type: 'service',
        validUntil: '2027-12-31',
        howToRedeem: 'Schedule appointment with wealth management team',
        termsAndConditions: [
          'Minimum portfolio requirement waived',
          '60-minute consultation',
          'No obligation to invest'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'shkf_finance_seminar',
        title: 'Hong Kong Financial Market Seminar',
        description: 'Educational seminar on Hong Kong\'s role as an international financial center',
        type: 'business',
        sponsorId: 'sun_hung_kai',
        bookingRequired: true,
        duration: '2 hours',
        priceRange: 'free',
        bestTime: 'Weekday evenings'
      }
    ]
  },

  {
    id: 'kee_wah',
    name: 'Kee Wah Bakery',
    tier: 'supporting',
    description: 'Traditional Hong Kong Confectionery Since 1938',
    website: 'https://www.keewah.com',
    primaryColor: '#DC143C',
    contact: {
      phone: '+852 2572 0828',
      email: 'enquiry@keewah.com'
    },
    business: {
      sector: 'Food & Confectionery',
      established: 1938,
      headquarters: 'Hong Kong',
      description: 'Kee Wah Bakery is famous for traditional Hong Kong pastries, mooncakes, and gift items.'
    },
    offers: [
      {
        id: 'kee_wah_gift_box',
        title: 'Traditional Hong Kong Pastry Gift Box',
        description: 'Complimentary selection of traditional Hong Kong cookies and pastries',
        type: 'product',
        validUntil: '2027-12-31',
        howToRedeem: 'Visit any Kee Wah store with participant credentials',
        termsAndConditions: [
          'One gift box per participant',
          'While supplies last',
          'Cannot be exchanged for cash'
        ]
      },
      {
        id: 'kee_wah_discount',
        title: '20% Store Discount',
        description: 'Discount on all Kee Wah products including seasonal specialties',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Show sailing credentials at checkout',
        termsAndConditions: [
          'Cannot be combined with other offers',
          'Valid on regular-priced items only',
          'Excluding limited edition items'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'kee_wah_workshop',
        title: 'Traditional Pastry Making Workshop',
        description: 'Learn to make authentic Hong Kong-style egg rolls and cookies',
        type: 'cultural',
        sponsorId: 'kee_wah',
        bookingRequired: true,
        duration: '2 hours',
        priceRange: '$',
        bestTime: 'Weekend mornings'
      }
    ]
  },

  {
    id: 'tng_watches',
    name: 'TNG Watches',
    tier: 'supporting',
    description: 'Precision Timepieces for Modern Sailors',
    website: 'https://www.tngwatches.com',
    primaryColor: '#2F4F4F',
    contact: {
      phone: '+852 2234 5678',
      email: 'info@tngwatches.com'
    },
    business: {
      sector: 'Timepieces & Accessories',
      established: 1995,
      headquarters: 'Hong Kong',
      description: 'TNG Watches specializes in marine chronometers and sailing timepieces.'
    },
    offers: [
      {
        id: 'tng_sailing_watch_discount',
        title: 'Sailing Watch Collection Discount',
        description: '25% discount on marine chronometers and sailing watches',
        type: 'discount',
        validUntil: '2027-12-31',
        howToRedeem: 'Visit TNG showroom with sailing credentials',
        termsAndConditions: [
          'Valid on sailing collection only',
          'Includes complimentary engraving',
          'Full warranty included'
        ]
      }
    ],
    hongKongActivities: [
      {
        id: 'tng_watchmaking_demo',
        title: 'Precision Watchmaking Demonstration',
        description: 'Behind-the-scenes look at Swiss and Japanese watchmaking techniques',
        type: 'cultural',
        sponsorId: 'tng_watches',
        bookingRequired: true,
        duration: '90 minutes',
        priceRange: 'free',
        bestTime: 'Weekday afternoons'
      }
    ]
  }
];

export const dragonWorldsSponsorshipProgram: SponsorshipProgram = {
  eventId: 'dragon-worlds-2027',
  title: 'Dragon World Championships Hong Kong 2027 - Sponsorship Program',
  description: 'Celebrating excellence in international dragon boat racing with world-class partners',
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