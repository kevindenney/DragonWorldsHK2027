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
   * TODO: User to provide the actual ClubSpot URL for Dragon Worlds 2027
   */
  clubSpot: {
    entrySystem: 'https://clubspot.app', // Placeholder - update with actual event URL
    baseUrl: 'https://clubspot.app',
  },

  /**
   * Racing Rules of Sailing
   * Official World Sailing Racing Rules reference
   * TODO: User to provide preferred Racing Rules URL
   */
  racingRules: {
    // World Sailing official rules page
    officialUrl: 'https://www.sailing.org/inside-world-sailing/rules-regulations/racing-rules-of-sailing/',
    // Alternative: direct PDF link if available
    pdfUrl: '', // TODO: Add direct PDF link if preferred
  },

  /**
   * Dragon Worlds Podcast
   * Official podcast for Dragon World Championships
   * TODO: User to provide the Spotify podcast URL
   */
  podcast: {
    spotify: 'https://open.spotify.com/show/', // Placeholder - update with actual podcast URL
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
