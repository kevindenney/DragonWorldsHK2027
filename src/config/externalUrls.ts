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
   * ClubSpot - Online Entry System
   * Used for competitor registration and entry management
   */
  clubSpot: {
    // Base URLs
    baseUrl: 'https://theclubspot.com',

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
    // General World Sailing rules page
    officialUrl: 'https://www.sailing.org/inside-world-sailing/rules-regulations/racing-rules-of-sailing/',

    // APAC 2026 - Event #13241
    apac: {
      eventNumber: '13241',
      eventLinks: 'https://www.racingrulesofsailing.org/events/13241/event_links?name=2026%2520HONG%2520KONG%2520DRAGON%2520ASIA%2520PACIFIC%2520CHAMPIONSHIP',
    },

    // Worlds 2027 - Event #13242
    worlds: {
      eventNumber: '13242',
      eventLinks: 'https://www.racingrulesofsailing.org/events/13242/event_links?name=2027%2520HONG%2520KONG%2520DRAGON%2520WORLD%2520CHAMPIONSHIP',
    },
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
