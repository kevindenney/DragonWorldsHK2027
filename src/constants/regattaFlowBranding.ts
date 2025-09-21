/**
 * RegattaFlow Company Branding System
 *
 * Centralized branding constants for RegattaFlow company integration
 * Used for company attribution, contact info, and white-label features
 */

export const REGATTA_FLOW_BRANDING = {
  // Company Identity
  name: 'RegattaFlow',
  tagline: 'Powering the future of sailing technology',
  description: 'RegattaFlow is a subsidiary of OceanFlow. RegattaFlow specializes in creating cutting-edge mobile applications for yacht clubs, sailing associations, and championship regattas worldwide.',
  parentCompany: {
    name: 'OceanFlow',
    description: 'OceanFlow builds AI apps for the freight business for freight forwarders, dry bulk, rail, air, and trucking companies.',
    website: 'https://oceanflow.io',
  },

  // Contact Information
  contact: {
    website: 'https://oceanflow.io/regattaflow',
    email: 'regatta@oceanflow.io',
    support: 'support@oceanflow.io',
    phone: '+1 (555) 123-4567', // Placeholder
  },

  // Brand Colors
  colors: {
    primary: '#1e3a8a', // Navy Blue
    accent: '#0891b2',  // Teal
    success: '#34C759', // Green
    text: '#1C1C1E',
    textMuted: '#6C757D',
    background: '#F2F2F7',
    surface: '#FFFFFF',
  },

  // Social & Links
  social: {
    linkedin: 'https://linkedin.com/company/regattaflow',
    twitter: 'https://twitter.com/regattaflow',
    github: 'https://github.com/regattaflow',
  },

  // Services
  services: {
    customApps: 'Custom Regatta Applications',
    weatherIntegration: 'Real-time Weather Integration',
    liveTracking: 'Live Race Tracking',
    spectatorFeatures: 'Spectator Engagement',
    multiPlatform: 'iOS, Android & Web Development',
  },

  // Pricing Tiers (for reference)
  pricing: {
    starter: {
      name: 'Starter Package',
      description: 'Basic regatta app with essential features',
    },
    professional: {
      name: 'Professional Package',
      description: 'Custom design with advanced features',
    },
    championship: {
      name: 'Championship Package',
      description: 'Full feature suite for major events',
    },
    enterprise: {
      name: 'Enterprise Partnership',
      description: 'Ongoing development partnership',
    },
  },

  // Portfolio
  portfolio: [
    {
      name: 'Dragon World Championships HK 2027',
      description: 'Official championship app with real-time weather, race tracking, and spectator features',
      features: ['Real-time weather data', 'Live race results', 'Interactive sailing charts', 'Push notifications'],
    },
  ],

  // Version Info
  version: '1.0.0',
  founded: '2024',

  // Attribution Text Options
  attribution: {
    powered: 'Powered by RegattaFlow',
    developed: 'App developed by RegattaFlow',
    full: 'This app was developed by RegattaFlow - specialists in sailing technology solutions',
  },
} as const;

// Helper function to get appropriate attribution text
export const getAttributionText = (style: 'powered' | 'developed' | 'full' = 'powered') => {
  return REGATTA_FLOW_BRANDING.attribution[style];
};

// Helper function to get contact email
export const getContactEmail = () => {
  return REGATTA_FLOW_BRANDING.contact.email;
};

// Helper function to get website URL
export const getWebsiteUrl = () => {
  return REGATTA_FLOW_BRANDING.contact.website;
};