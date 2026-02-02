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
  primaryColor: '#DB0011',
  accentColor: '#1E3A5F',
  logoPlacement: [
    { location: 'header' as const, sponsorId: 'hsbc', size: 'medium' as const, priority: 1 },
    { location: 'services' as const, sponsorId: 'hopewell_hotel', size: 'small' as const, priority: 2 }
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
      id: 'hsbc',
      name: 'HSBC',
      logo: '/assets/sponsors/hsbc-logo.png',
      website: 'https://hsbc.com.hk',
      description: 'The World\'s Local Bank - Proud Title Sponsor',
      category: 'title-sponsor',
      tier: 'platinum',
      color: '#DB0011',
      isActive: true,
      contract: {
        startDate: '2024-01-01',
        endDate: '2027-12-31'
      },
      contacts: [
        {
          id: 'hsbc-contact-1',
          name: 'Michael Chen',
          role: 'Sponsorship Manager',
          email: 'michael.chen@hsbc.com.hk',
          phone: '+852-2233-3000',
          isPublic: true
        }
      ]
    },
    {
      id: 'hopewell_hotel',
      name: 'Hopewell Hotel',
      logo: '/assets/sponsors/hopewell-logo.png',
      website: 'https://hopewellhotel.com',
      description: 'Official Accommodation Partner',
      category: 'major-sponsor',
      tier: 'gold',
      color: '#1E3A5F',
      isActive: true,
      contract: {
        startDate: '2024-01-01',
        endDate: '2027-12-31'
      },
      contacts: [
        {
          id: 'hopewell-contact-1',
          name: 'Lisa Wong',
          role: 'Events Manager',
          email: 'events@hopewellhotel.com',
          phone: '+852-2861-1111',
          isPublic: true
        }
      ]
    },
    {
      id: 'hktb',
      name: 'Hong Kong Tourism Board',
      logo: '/assets/sponsors/hktb-logo.png',
      website: 'https://discoverhongkong.com',
      description: 'Official Tourism Partner',
      category: 'major-sponsor',
      tier: 'gold',
      color: '#E31B23',
      isActive: true,
      contract: {
        startDate: '2024-01-01',
        endDate: '2027-12-31'
      },
      contacts: [
        {
          id: 'hktb-contact-1',
          name: 'Sarah Lam',
          role: 'Events Coordinator',
          email: 'events@hktb.com',
          phone: '+852-2807-6177',
          isPublic: true
        }
      ]
    },
    {
      id: 'yanmar',
      name: 'Yanmar',
      logo: '/assets/sponsors/yanmar-logo.png',
      website: 'https://yanmar.com',
      description: 'Official Marine Engine Partner',
      category: 'major-sponsor',
      tier: 'gold',
      color: '#E60012',
      isActive: true,
      contract: {
        startDate: '2024-01-01',
        endDate: '2027-12-31'
      },
      contacts: [
        {
          id: 'yanmar-contact-1',
          name: 'Kenji Tanaka',
          role: 'Marine Division Manager',
          email: 'marine@yanmar.com.hk',
          phone: '+852-2833-3133',
          isPublic: true
        }
      ]
    },
    {
      id: 'code_zero',
      name: 'Code Zero',
      logo: '/assets/sponsors/codezero-logo.png',
      website: 'https://codezero.com',
      description: 'Official Clothing Partner',
      category: 'major-sponsor',
      tier: 'gold',
      color: '#000000',
      isActive: true,
      contract: {
        startDate: '2024-01-01',
        endDate: '2027-12-31'
      },
      contacts: [
        {
          id: 'codezero-contact-1',
          name: 'Emma Nielsen',
          role: 'Partnerships Manager',
          email: 'partnerships@codezero.com',
          phone: '+852-2527-8899',
          isPublic: true
        }
      ]
    }
  ];
  
  const mockServices: SponsorService[] = [
    {
      id: 'hsbc-banking',
      name: 'Premier Banking Services',
      description: 'Currency exchange, transfers, ATM access for all participants',
      type: 'banking',
      targetAudience: 'all',
      availability: {
        startDate: '2027-11-18',
        endDate: '2027-11-28',
        times: ['09:00-17:00'],
        locations: ['RHKYC', 'Hopewell Hotel']
      },
      bookingRequired: false,
      contactInfo: 'HSBC Premier Hotline: +852-2233-3322'
    },
    {
      id: 'hopewell-accommodation',
      name: 'Competitor Accommodation',
      description: 'Exclusive rates and yacht club shuttle service',
      type: 'accommodation',
      targetAudience: 'all',
      availability: {
        startDate: '2027-11-15',
        endDate: '2027-11-30',
        times: ['24 hours'],
        locations: ['Hopewell Hotel']
      },
      bookingRequired: true,
      contactInfo: 'Reservations: +852-2861-1111',
      terms: 'Use code DRAGON2027 for 35% discount.'
    },
    {
      id: 'yanmar-service',
      name: 'Marine Engine Support',
      description: 'Free engine diagnostics and technical support',
      type: 'marine-services',
      targetAudience: 'all',
      availability: {
        startDate: '2027-11-18',
        endDate: '2027-11-28',
        times: ['07:00-19:00'],
        locations: ['RHKYC Marina']
      },
      bookingRequired: false,
      contactInfo: 'Yanmar Support: +852-2833-3188'
    },
    {
      id: 'codezero-retail',
      name: 'Sailing Apparel Shop',
      description: 'Performance gear with 30% competitor discount',
      type: 'retail',
      targetAudience: 'all',
      availability: {
        startDate: '2027-11-18',
        endDate: '2027-11-28',
        times: ['08:00-20:00'],
        locations: ['RHKYC Pop-up', 'Pacific Place']
      },
      bookingRequired: false,
      contactInfo: 'Code Zero: +852-2527-8899'
    }
  ];
  
  const mockConfigurations: SponsorConfiguration[] = [
    {
      eventId: 'dragon-worlds-2027',
      titleSponsor: 'hsbc',
      majorSponsors: ['hopewell_hotel', 'hktb', 'yanmar', 'code_zero'],
      alignedPartners: [],
      serviceProviders: {
        banking: ['hsbc'],
        hospitality: ['hopewell_hotel'],
        transportation: ['hktb'],
        'marine-services': ['yanmar'],
        weather: [],
        technology: [],
        dining: ['hopewell_hotel'],
        accommodation: ['hopewell_hotel'],
        retail: ['code_zero'],
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