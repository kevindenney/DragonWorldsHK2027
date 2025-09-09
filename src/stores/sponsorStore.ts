import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TypeScript interfaces
export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  logoLight?: string; // For dark mode
  website?: string;
  description: string;
  category: SponsorCategory;
  tier: SponsorTier;
  color?: string; // Brand color
  services?: SponsorService[];
  isActive: boolean;
  contract: {
    startDate: string;
    endDate: string;
    renewalDate?: string;
  };
  contacts: SponsorContact[];
}

export interface SponsorService {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  targetAudience: 'all' | 'competitors' | 'vip' | 'spectators';
  availability: {
    startDate: string;
    endDate: string;
    times?: string[];
    locations?: string[];
  };
  bookingRequired: boolean;
  contactInfo?: string;
  terms?: string;
}

export interface SponsorContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  isPublic: boolean; // Can be shown to participants
}

export interface SponsorConfiguration {
  eventId: string;
  titleSponsor: string; // Sponsor ID
  majorSponsors: string[]; // Sponsor IDs
  alignedPartners: string[]; // Sponsor IDs
  serviceProviders: Record<ServiceType, string[]>; // Service type -> Sponsor IDs
  brandingConfig: {
    primaryColor?: string;
    accentColor?: string;
    logoPlacement: LogoPlacement[];
  };
}

export interface LogoPlacement {
  location: 'header' | 'footer' | 'navigation' | 'services' | 'weather' | 'results';
  sponsorId: string;
  size: 'small' | 'medium' | 'large';
  priority: number; // Display order
}

export type SponsorCategory = 
  | 'title-sponsor'
  | 'major-sponsor'
  | 'official-partner'
  | 'service-provider'
  | 'media-partner'
  | 'technology-partner';

export type SponsorTier = 
  | 'platinum'
  | 'gold' 
  | 'silver'
  | 'bronze'
  | 'supporting';

export type ServiceType =
  | 'banking'
  | 'hospitality'
  | 'transportation'
  | 'marine-services'
  | 'weather'
  | 'technology'
  | 'dining'
  | 'accommodation'
  | 'retail'
  | 'medical';

interface SponsorState {
  // State
  sponsors: Sponsor[];
  configurations: SponsorConfiguration[];
  activeConfiguration: SponsorConfiguration | null;
  services: SponsorService[];
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;

  // Actions
  updateSponsorConfig: (config: SponsorConfiguration) => void;
  addSponsor: (sponsor: Sponsor) => void;
  updateSponsor: (sponsorId: string, updates: Partial<Sponsor>) => void;
  removeSponsor: (sponsorId: string) => void;
  
  // Sponsor retrieval
  getSponsorByType: (category: SponsorCategory) => Sponsor[];
  getSponsorById: (id: string) => Sponsor | undefined;
  getTitleSponsor: () => Sponsor | undefined;
  getMajorSponsors: () => Sponsor[];
  getAlignedPartners: () => Sponsor[];
  
  // Service management
  getSponsorServices: (sponsorId?: string, targetAudience?: SponsorService['targetAudience']) => SponsorService[];
  addSponsorService: (sponsorId: string, service: SponsorService) => void;
  updateSponsorService: (sponsorId: string, serviceId: string, updates: Partial<SponsorService>) => void;
  getServicesByType: (type: ServiceType) => SponsorService[];
  
  // Branding
  getBrandingConfig: () => SponsorConfiguration['brandingConfig'] | null;
  getLogosByLocation: (location: LogoPlacement['location']) => LogoPlacement[];
  getPrimaryBrandColor: () => string;
  getAccentBrandColor: () => string;
  
  // Configuration management
  setActiveConfiguration: (configId: string) => void;
  createEventConfiguration: (eventId: string) => SponsorConfiguration;
  updateBrandingConfig: (updates: Partial<SponsorConfiguration['brandingConfig']>) => void;
  
  // Contact management
  getSponsorContacts: (sponsorId: string, publicOnly?: boolean) => SponsorContact[];
  updateSponsorContact: (sponsorId: string, contactId: string, updates: Partial<SponsorContact>) => void;
  
  // Utility actions
  refreshSponsorData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSponsorData: () => void;
}

// Default branding configuration
const defaultBrandingConfig = {
  primaryColor: '#0066CC',
  accentColor: '#FF6B35',
  logoPlacement: [
    { location: 'header' as const, sponsorId: 'rolex', size: 'medium' as const, priority: 1 },
    { location: 'services' as const, sponsorId: 'hsbc', size: 'small' as const, priority: 2 }
  ]
};

// Mock API functions
const fetchSponsorsFromAPI = async (): Promise<{
  sponsors: Sponsor[];
  configurations: SponsorConfiguration[];
  services: SponsorService[];
}> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const mockSponsors: Sponsor[] = [
    {
      id: 'rolex',
      name: 'Rolex',
      logo: '/assets/sponsors/rolex-logo.png',
      website: 'https://rolex.com',
      description: 'Official timekeeper and title sponsor',
      category: 'title-sponsor',
      tier: 'platinum',
      color: '#006341',
      isActive: true,
      contract: {
        startDate: '2024-01-01',
        endDate: '2027-12-31'
      },
      contacts: [
        {
          id: 'rolex-contact-1',
          name: 'Sarah Johnson',
          role: 'Sponsorship Manager',
          email: 'sarah.johnson@rolex.com',
          phone: '+41-22-302-2200',
          isPublic: true
        }
      ]
    },
    {
      id: 'hsbc',
      name: 'HSBC',
      logo: '/assets/sponsors/hsbc-logo.png',
      website: 'https://hsbc.com',
      description: 'Premier banking services provider',
      category: 'major-sponsor',
      tier: 'gold',
      color: '#DB0011',
      isActive: true,
      contract: {
        startDate: '2024-01-01',
        endDate: '2026-12-31'
      },
      contacts: [
        {
          id: 'hsbc-contact-1',
          name: 'Michael Chen',
          role: 'Relationship Manager',
          email: 'michael.chen@hsbc.com.hk',
          phone: '+852-2822-1111',
          isPublic: true
        }
      ]
    },
    {
      id: 'conrad-hk',
      name: 'Conrad Hong Kong',
      logo: '/assets/sponsors/conrad-logo.png',
      website: 'https://conradhongkong.com',
      description: 'Official hospitality partner',
      category: 'service-provider',
      tier: 'gold',
      color: '#8B4513',
      isActive: true,
      contract: {
        startDate: '2024-01-01',
        endDate: '2025-12-31'
      },
      contacts: [
        {
          id: 'conrad-contact-1',
          name: 'Lisa Wong',
          role: 'Events Manager',
          email: 'lisa.wong@conradhotels.com',
          phone: '+852-2521-3838',
          isPublic: true
        }
      ]
    }
  ];
  
  const mockServices: SponsorService[] = [
    {
      id: 'hsbc-banking',
      name: 'Premier Banking Services',
      description: 'Currency exchange, transfers, ATM access',
      type: 'banking',
      targetAudience: 'all',
      availability: {
        startDate: '2024-11-18',
        endDate: '2024-11-24',
        times: ['09:00-17:00'],
        locations: ['RHKYC', 'Conrad HK']
      },
      bookingRequired: false,
      contactInfo: 'HSBC Premier Hotline: +852-2233-3322'
    },
    {
      id: 'conrad-dining',
      name: 'VIP Dining Reservations',
      description: 'Exclusive restaurant bookings and private dining',
      type: 'dining',
      targetAudience: 'vip',
      availability: {
        startDate: '2024-11-18',
        endDate: '2024-11-24',
        times: ['19:00-23:00'],
        locations: ['Conrad Hong Kong']
      },
      bookingRequired: true,
      contactInfo: 'Concierge: +852-2521-3838',
      terms: 'Advance booking required. Dress code applies.'
    }
  ];
  
  const mockConfigurations: SponsorConfiguration[] = [
    {
      eventId: 'dragon-worlds-2027',
      titleSponsor: 'rolex',
      majorSponsors: ['hsbc', 'conrad-hk'],
      alignedPartners: [],
      serviceProviders: {
        banking: ['hsbc'],
        hospitality: ['conrad-hk'],
        transportation: [],
        'marine-services': [],
        weather: [],
        technology: [],
        dining: ['conrad-hk'],
        accommodation: ['conrad-hk'],
        retail: [],
        medical: []
      },
      brandingConfig: defaultBrandingConfig
    }
  ];
  
  return { sponsors: mockSponsors, configurations: mockConfigurations, services: mockServices };
};

export const useSponsorStore = create<SponsorState>()(
  persist(
    (set, get) => ({
      // Initial State
      sponsors: [],
      configurations: [],
      activeConfiguration: null,
      services: [],
      loading: false,
      error: null,
      lastUpdate: null,

      // Actions
      updateSponsorConfig: (config: SponsorConfiguration) => {
        set(state => ({
          configurations: state.configurations.map(c =>
            c.eventId === config.eventId ? config : c
          ),
          activeConfiguration: state.activeConfiguration?.eventId === config.eventId ? config : state.activeConfiguration
        }));
      },

      addSponsor: (sponsor: Sponsor) => {
        set(state => ({
          sponsors: [...state.sponsors, sponsor]
        }));
      },

      updateSponsor: (sponsorId: string, updates: Partial<Sponsor>) => {
        set(state => ({
          sponsors: state.sponsors.map(sponsor =>
            sponsor.id === sponsorId ? { ...sponsor, ...updates } : sponsor
          )
        }));
      },

      removeSponsor: (sponsorId: string) => {
        set(state => ({
          sponsors: state.sponsors.filter(sponsor => sponsor.id !== sponsorId)
        }));
      },

      // Sponsor retrieval
      getSponsorByType: (category: SponsorCategory) => {
        const { sponsors } = get();
        return sponsors.filter(sponsor => sponsor.category === category && sponsor.isActive);
      },

      getSponsorById: (id: string) => {
        const { sponsors } = get();
        return sponsors.find(sponsor => sponsor.id === id && sponsor.isActive);
      },

      getTitleSponsor: () => {
        const { activeConfiguration, sponsors } = get();
        if (!activeConfiguration) return undefined;
        
        return sponsors.find(sponsor => 
          sponsor.id === activeConfiguration.titleSponsor && sponsor.isActive
        );
      },

      getMajorSponsors: () => {
        const { activeConfiguration, sponsors } = get();
        if (!activeConfiguration) return [];
        
        return sponsors.filter(sponsor =>
          activeConfiguration.majorSponsors.includes(sponsor.id) && sponsor.isActive
        );
      },

      getAlignedPartners: () => {
        const { activeConfiguration, sponsors } = get();
        if (!activeConfiguration) return [];
        
        return sponsors.filter(sponsor =>
          activeConfiguration.alignedPartners.includes(sponsor.id) && sponsor.isActive
        );
      },

      // Service management
      getSponsorServices: (sponsorId?: string, targetAudience?: SponsorService['targetAudience']) => {
        const { services, sponsors } = get();
        let filteredServices = services;
        
        if (sponsorId) {
          const sponsor = sponsors.find(s => s.id === sponsorId);
          if (!sponsor) return [];
          filteredServices = sponsor.services || [];
        }
        
        if (targetAudience) {
          filteredServices = filteredServices.filter(service =>
            service.targetAudience === targetAudience || service.targetAudience === 'all'
          );
        }
        
        return filteredServices;
      },

      addSponsorService: (sponsorId: string, service: SponsorService) => {
        set(state => ({
          sponsors: state.sponsors.map(sponsor =>
            sponsor.id === sponsorId
              ? { ...sponsor, services: [...(sponsor.services || []), service] }
              : sponsor
          ),
          services: [...state.services, service]
        }));
      },

      updateSponsorService: (sponsorId: string, serviceId: string, updates: Partial<SponsorService>) => {
        set(state => ({
          sponsors: state.sponsors.map(sponsor =>
            sponsor.id === sponsorId
              ? {
                  ...sponsor,
                  services: (sponsor.services || []).map(service =>
                    service.id === serviceId ? { ...service, ...updates } : service
                  )
                }
              : sponsor
          ),
          services: state.services.map(service =>
            service.id === serviceId ? { ...service, ...updates } : service
          )
        }));
      },

      getServicesByType: (type: ServiceType) => {
        const { services } = get();
        return services.filter(service => service.type === type);
      },

      // Branding
      getBrandingConfig: () => {
        const { activeConfiguration } = get();
        return activeConfiguration?.brandingConfig || null;
      },

      getLogosByLocation: (location: LogoPlacement['location']) => {
        const { activeConfiguration } = get();
        if (!activeConfiguration) return [];
        
        return activeConfiguration.brandingConfig.logoPlacement
          .filter(logo => logo.location === location)
          .sort((a, b) => a.priority - b.priority);
      },

      getPrimaryBrandColor: () => {
        const { activeConfiguration } = get();
        return activeConfiguration?.brandingConfig.primaryColor || '#0066CC';
      },

      getAccentBrandColor: () => {
        const { activeConfiguration } = get();
        return activeConfiguration?.brandingConfig.accentColor || '#FF6B35';
      },

      // Configuration management
      setActiveConfiguration: (configId: string) => {
        const { configurations } = get();
        const config = configurations.find(c => c.eventId === configId);
        if (config) {
          set({ activeConfiguration: config });
        }
      },

      createEventConfiguration: (eventId: string) => {
        const newConfig: SponsorConfiguration = {
          eventId,
          titleSponsor: '',
          majorSponsors: [],
          alignedPartners: [],
          serviceProviders: {
            banking: [],
            hospitality: [],
            transportation: [],
            'marine-services': [],
            weather: [],
            technology: [],
            dining: [],
            accommodation: [],
            retail: [],
            medical: []
          },
          brandingConfig: defaultBrandingConfig
        };
        
        set(state => ({
          configurations: [...state.configurations, newConfig],
          activeConfiguration: newConfig
        }));
        
        return newConfig;
      },

      updateBrandingConfig: (updates: Partial<SponsorConfiguration['brandingConfig']>) => {
        const { activeConfiguration } = get();
        if (!activeConfiguration) return;
        
        const updatedConfig = {
          ...activeConfiguration,
          brandingConfig: { ...activeConfiguration.brandingConfig, ...updates }
        };
        
        get().updateSponsorConfig(updatedConfig);
      },

      // Contact management
      getSponsorContacts: (sponsorId: string, publicOnly = true) => {
        const { sponsors } = get();
        const sponsor = sponsors.find(s => s.id === sponsorId);
        if (!sponsor) return [];
        
        return publicOnly
          ? sponsor.contacts.filter(contact => contact.isPublic)
          : sponsor.contacts;
      },

      updateSponsorContact: (sponsorId: string, contactId: string, updates: Partial<SponsorContact>) => {
        set(state => ({
          sponsors: state.sponsors.map(sponsor =>
            sponsor.id === sponsorId
              ? {
                  ...sponsor,
                  contacts: sponsor.contacts.map(contact =>
                    contact.id === contactId ? { ...contact, ...updates } : contact
                  )
                }
              : sponsor
          )
        }));
      },

      // Utility actions
      refreshSponsorData: async () => {
        set({ loading: true, error: null });
        
        try {
          const { sponsors, configurations, services } = await fetchSponsorsFromAPI();
          
          set({
            sponsors,
            configurations,
            services,
            activeConfiguration: configurations[0] || null,
            lastUpdate: new Date().toISOString(),
            loading: false,
            error: null
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh sponsor data'
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearSponsorData: () => {
        set({
          sponsors: [],
          configurations: [],
          activeConfiguration: null,
          services: [],
          lastUpdate: null,
          error: null
        });
      }
    }),
    {
      name: 'dragon-worlds-sponsors',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sponsors: state.sponsors,
        configurations: state.configurations,
        activeConfiguration: state.activeConfiguration,
        services: state.services,
        lastUpdate: state.lastUpdate
      })
    }
  )
);

// Selectors
export const useSponsors = () => useSponsorStore(state => state.sponsors);
export const useActiveConfiguration = () => useSponsorStore(state => state.activeConfiguration);
export const useSponsorServices = () => useSponsorStore(state => state.services);
export const useSponsorLoading = () => useSponsorStore(state => state.loading);
export const useSponsorError = () => useSponsorStore(state => state.error);

// Computed selectors
export const useTitleSponsor = () => useSponsorStore(state => state.getTitleSponsor());
export const useMajorSponsors = () => useSponsorStore(state => state.getMajorSponsors());
export const useAlignedPartners = () => useSponsorStore(state => state.getAlignedPartners());
export const useBrandingConfig = () => useSponsorStore(state => state.getBrandingConfig());
export const usePrimaryBrandColor = () => useSponsorStore(state => state.getPrimaryBrandColor());
export const useAccentBrandColor = () => useSponsorStore(state => state.getAccentBrandColor());

export const useServicesByType = (type: ServiceType) =>
  useSponsorStore(state => state.getServicesByType(type));

export const useLogosByLocation = (location: LogoPlacement['location']) =>
  useSponsorStore(state => state.getLogosByLocation(location));

export const useSponsorContacts = (sponsorId: string, publicOnly = true) =>
  useSponsorStore(state => state.getSponsorContacts(sponsorId, publicOnly));