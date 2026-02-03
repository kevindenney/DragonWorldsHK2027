/**
 * Centralized External URLs Configuration
 *
 * This file contains all external URLs used throughout the app.
 * Update these URLs to point to the correct resources.
 *
 * Note: URLs marked as "TODO" need to be provided by the user.
 */

export const externalUrls = {
  /**
   * Firebase Cloud Functions
   * Backend API endpoints for data scraping and processing
   */
  cloudFunctions: {
    // ClubSpot entrants scraping endpoint (Cloud Run URL for public access)
    scrapeClubSpot: 'https://scrapeclubspotentrants-3w5luutuya-uc.a.run.app',
    // Race data scraping endpoint (Cloud Run URL)
    scrapeRaceData: 'https://scraperacedata-3w5luutuya-uc.a.run.app',
  },

  /**
   * ClubSpot - Online Entry System
   * Used for competitor registration and entry management
   */
  clubSpot: {
    // Base URLs
    baseUrl: 'https://theclubspot.com',

    // Regatta IDs for API calls
    regattaIds: {
      apac: 'p75RuY5UZc',
      worlds: 'zyQIfeVjhb',
    },

    // APAC 2026 Championship
    apac: {
      regattaPage: 'https://theclubspot.com/regatta/p75RuY5UZc',
      entryLink: 'https://theclubspot.com/register/regatta/p75RuY5UZc/class',
      entryList: 'https://theclubspot.com/regatta/p75RuY5UZc/#entry-list',
    },

    // Worlds 2027 Championship
    worlds: {
      regattaPage: 'https://theclubspot.com/regatta/zyQIfeVjhb',
      entryLink: 'https://theclubspot.com/register/regatta/zyQIfeVjhb/class',
      entryList: 'https://theclubspot.com/regatta/zyQIfeVjhb/#entry-list',
      shop: 'https://theclubspot.com/shop/regatta/zyQIfeVjhb', // Ceremony tickets & merchandise
    },
  },

  /**
   * Racing Rules of Sailing (RRoS)
   * Event-specific racing rules pages
   */
  racingRules: {
    // Official Racing Rules of Sailing page - use racingrulesofsailing.org (sailing.org redirects)
    officialUrl: 'https://www.racingrulesofsailing.org/rules',
    baseUrl: 'https://www.racingrulesofsailing.org',

    // APAC 2026 - Event #13241
    apac: {
      eventId: '13241',
      eventNumber: '13241',
      eventLinks: 'https://www.racingrulesofsailing.org/events/13241/event_links?name=2026%2520HONG%2520KONG%2520DRAGON%2520ASIA%2520PACIFIC%2520CHAMPIONSHIP',
      documents: 'https://www.racingrulesofsailing.org/documents/13241/event',
      schedules: 'https://www.racingrulesofsailing.org/schedules/13241/event',
      decisions: 'https://www.racingrulesofsailing.org/decisions/13241/event',
      forms: {
        question: 'https://www.racingrulesofsailing.org/questions/new?event_id=13241',
        crewSubstitution: 'https://www.racingrulesofsailing.org/crew_substitutions/new?event_id=13241',
        equipmentSubstitution: 'https://www.racingrulesofsailing.org/equipment_substitutions/new?event_id=13241',
        scoringInquiry: 'https://www.racingrulesofsailing.org/scoring_inquiries/new?event_id=13241',
        protest: 'https://www.racingrulesofsailing.org/protests/new?event_id=13241',
      },
    },

    // Worlds 2027 - Event #13242
    worlds: {
      eventId: '13242',
      eventNumber: '13242',
      eventLinks: 'https://www.racingrulesofsailing.org/events/13242/event_links?name=2027%2520HONG%2520KONG%2520DRAGON%2520WORLD%2520CHAMPIONSHIP',
      documents: 'https://www.racingrulesofsailing.org/documents/13242/event',
      schedules: 'https://www.racingrulesofsailing.org/schedules/13242/event',
      decisions: 'https://www.racingrulesofsailing.org/decisions/13242/event',
      forms: {
        question: 'https://www.racingrulesofsailing.org/questions/new?event_id=13242',
        crewSubstitution: 'https://www.racingrulesofsailing.org/crew_substitutions/new?event_id=13242',
        equipmentSubstitution: 'https://www.racingrulesofsailing.org/equipment_substitutions/new?event_id=13242',
        scoringInquiry: 'https://www.racingrulesofsailing.org/scoring_inquiries/new?event_id=13242',
        protest: 'https://www.racingrulesofsailing.org/protests/new?event_id=13242',
      },
    },

    // Helper to build URLs dynamically
    getDocumentsUrl: (eventId: string) => `https://www.racingrulesofsailing.org/documents/${eventId}/event`,
    getSchedulesUrl: (eventId: string) => `https://www.racingrulesofsailing.org/schedules/${eventId}/event`,
    getDecisionsUrl: (eventId: string) => `https://www.racingrulesofsailing.org/decisions/${eventId}/event`,
    getProtestFormUrl: (eventId: string) => `https://www.racingrulesofsailing.org/protests/new?event_id=${eventId}`,
    getQuestionFormUrl: (eventId: string) => `https://www.racingrulesofsailing.org/questions/new?event_id=${eventId}`,
  },

  /**
   * Dragon Worlds Podcast
   * Official podcast for Dragon World Championships
   */
  podcast: {
    spotify: 'https://open.spotify.com/episode/22sImt7qEH1E0ldiVmoBQ9',
    // Additional podcast platforms can be added here
    applePodcasts: '',
    googlePodcasts: '',
  },

  /**
   * Social Media Links
   * Official Dragon Worlds social media accounts
   */
  socialMedia: {
    facebook: 'https://www.facebook.com/dragonworldshk2027',
    instagram: 'https://www.instagram.com/dragonworldshk2027',
    twitter: '',
    youtube: '',
  },

  /**
   * Event Information
   * Links to official event information and resources
   */
  eventInfo: {
    officialWebsite: 'https://dragonworlds2027.com', // Placeholder
    noticesToCompetitors: '',
    sailingInstructions: '',
    eventDocuments: '',
  },

  /**
   * Hong Kong Sailing Resources
   * Local sailing resources and information
   */
  hongKongResources: {
    marineWeather: 'https://www.hko.gov.hk/en/marine/marine.htm',
    tideTables: 'https://www.hko.gov.hk/en/tide/ttext.htm',
    vesselTraffic: '',
  },

  /**
   * Emergency Contacts
   * Important emergency contact links and numbers
   */
  emergency: {
    hkMarinePolice: 'tel:+852-2233-7999',
    coastGuard: '',
    emergencyServices: 'tel:999',
  },
};

/**
 * Helper function to check if a URL is configured (not a placeholder)
 */
export function isUrlConfigured(url: string): boolean {
  if (!url) return false;
  // Check for common placeholder patterns
  const placeholders = ['TODO', 'placeholder', 'update', 'coming-soon'];
  const lowerUrl = url.toLowerCase();
  return !placeholders.some(p => lowerUrl.includes(p)) && url.length > 10;
}

/**
 * Helper function to open external URLs
 */
export function getExternalUrl(
  category: keyof typeof externalUrls,
  subcategory: string
): string | null {
  const categoryUrls = externalUrls[category];
  if (!categoryUrls || typeof categoryUrls !== 'object') return null;

  const url = (categoryUrls as Record<string, string>)[subcategory];
  return isUrlConfigured(url) ? url : null;
}

export default externalUrls;
