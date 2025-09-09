import { act, renderHook } from '@testing-library/react-native';
import { useSponsorStore } from '../sponsorStore';
import { MockDataFactory, StoreTestUtils } from '../../testing/testingSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('SponsorStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      const { clearSponsorData } = useSponsorStore.getState();
      clearSponsorData();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      expect(result.current.sponsors).toEqual([]);
      expect(result.current.configurations).toEqual([]);
      expect(result.current.activeConfiguration).toBeNull();
      expect(result.current.services).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdate).toBeNull();
    });
  });

  describe('Sponsor Management', () => {
    it('should add sponsors', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const mockSponsor = {
        id: 'test-sponsor',
        name: 'Test Sponsor',
        logo: '/assets/test-logo.png',
        description: 'Test sponsor description',
        category: 'major-sponsor' as const,
        tier: 'gold' as const,
        color: '#FF0000',
        isActive: true,
        contract: {
          startDate: '2024-01-01',
          endDate: '2025-12-31'
        },
        contacts: []
      };

      act(() => {
        result.current.addSponsor(mockSponsor);
      });

      expect(result.current.sponsors).toHaveLength(1);
      expect(result.current.sponsors[0]).toEqual(mockSponsor);
    });

    it('should update sponsor info', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const mockSponsor = {
        id: 'test-sponsor',
        name: 'Test Sponsor',
        logo: '/assets/test-logo.png',
        description: 'Original description',
        category: 'major-sponsor' as const,
        tier: 'silver' as const,
        isActive: false,
        contract: {
          startDate: '2024-01-01',
          endDate: '2025-12-31'
        },
        contacts: []
      };

      act(() => {
        result.current.addSponsor(mockSponsor);
      });

      act(() => {
        result.current.updateSponsor('test-sponsor', {
          description: 'Updated description',
          tier: 'gold',
          isActive: true
        });
      });

      const updatedSponsor = result.current.sponsors.find(s => s.id === 'test-sponsor');
      expect(updatedSponsor?.description).toBe('Updated description');
      expect(updatedSponsor?.tier).toBe('gold');
      expect(updatedSponsor?.isActive).toBe(true);
    });

    it('should remove sponsors', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const mockSponsor = {
        id: 'test-sponsor',
        name: 'Test Sponsor',
        logo: '/assets/test-logo.png',
        description: 'Test sponsor',
        category: 'major-sponsor' as const,
        tier: 'gold' as const,
        isActive: true,
        contract: {
          startDate: '2024-01-01',
          endDate: '2025-12-31'
        },
        contacts: []
      };

      act(() => {
        result.current.addSponsor(mockSponsor);
      });

      expect(result.current.sponsors).toHaveLength(1);

      act(() => {
        result.current.removeSponsor('test-sponsor');
      });

      expect(result.current.sponsors).toHaveLength(0);
    });

    it('should get sponsor by ID', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const mockSponsor = {
        id: 'test-sponsor',
        name: 'Test Sponsor',
        logo: '/assets/test-logo.png',
        description: 'Test sponsor',
        category: 'major-sponsor' as const,
        tier: 'gold' as const,
        isActive: true,
        contract: {
          startDate: '2024-01-01',
          endDate: '2025-12-31'
        },
        contacts: []
      };

      act(() => {
        result.current.addSponsor(mockSponsor);
      });

      const foundSponsor = result.current.getSponsorById('test-sponsor');
      expect(foundSponsor).toEqual(mockSponsor);

      const notFound = result.current.getSponsorById('non-existent');
      expect(notFound).toBeUndefined();
    });

    it('should get sponsors by type', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const sponsors = [
        {
          id: 'title-1',
          name: 'Title Sponsor',
          logo: '/assets/title.png',
          description: 'Title sponsor',
          category: 'title-sponsor' as const,
          tier: 'platinum' as const,
          isActive: true,
          contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
          contacts: []
        },
        {
          id: 'major-1',
          name: 'Major Sponsor 1',
          logo: '/assets/major1.png',
          description: 'Major sponsor 1',
          category: 'major-sponsor' as const,
          tier: 'gold' as const,
          isActive: true,
          contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
          contacts: []
        },
        {
          id: 'major-2',
          name: 'Major Sponsor 2',
          logo: '/assets/major2.png',
          description: 'Major sponsor 2',
          category: 'major-sponsor' as const,
          tier: 'gold' as const,
          isActive: true,
          contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
          contacts: []
        }
      ];

      act(() => {
        sponsors.forEach(sponsor => result.current.addSponsor(sponsor));
      });

      const titleSponsors = result.current.getSponsorByType('title-sponsor');
      expect(titleSponsors).toHaveLength(1);
      expect(titleSponsors[0].id).toBe('title-1');

      const majorSponsors = result.current.getSponsorByType('major-sponsor');
      expect(majorSponsors).toHaveLength(2);
    });
  });

  describe('Configuration Management', () => {
    it('should create event configuration', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const config = result.current.createEventConfiguration('test-event');
      
      expect(config.eventId).toBe('test-event');
      expect(result.current.configurations).toHaveLength(1);
      expect(result.current.activeConfiguration).toEqual(config);
    });

    it('should update sponsor configuration', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const originalConfig = result.current.createEventConfiguration('test-event');
      
      const updatedConfig = {
        ...originalConfig,
        titleSponsor: 'rolex',
        majorSponsors: ['hsbc', 'conrad']
      };

      act(() => {
        result.current.updateSponsorConfig(updatedConfig);
      });

      expect(result.current.activeConfiguration?.titleSponsor).toBe('rolex');
      expect(result.current.activeConfiguration?.majorSponsors).toEqual(['hsbc', 'conrad']);
    });

    it('should set active configuration', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const config1 = result.current.createEventConfiguration('event-1');
      const config2 = result.current.createEventConfiguration('event-2');

      expect(result.current.activeConfiguration?.eventId).toBe('event-2');

      act(() => {
        result.current.setActiveConfiguration('event-1');
      });

      expect(result.current.activeConfiguration?.eventId).toBe('event-1');
    });

    it('should update branding configuration', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      result.current.createEventConfiguration('test-event');
      
      act(() => {
        result.current.updateBrandingConfig({
          primaryColor: '#FF0000',
          accentColor: '#00FF00'
        });
      });

      expect(result.current.activeConfiguration?.brandingConfig.primaryColor).toBe('#FF0000');
      expect(result.current.activeConfiguration?.brandingConfig.accentColor).toBe('#00FF00');
    });
  });

  describe('Configuration-based Sponsor Retrieval', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useSponsorStore());
      
      // Set up sponsors
      const sponsors = [
        {
          id: 'rolex',
          name: 'Rolex',
          logo: '/assets/rolex.png',
          description: 'Title sponsor',
          category: 'title-sponsor' as const,
          tier: 'platinum' as const,
          isActive: true,
          contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
          contacts: []
        },
        {
          id: 'hsbc',
          name: 'HSBC',
          logo: '/assets/hsbc.png',
          description: 'Major sponsor',
          category: 'major-sponsor' as const,
          tier: 'gold' as const,
          isActive: true,
          contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
          contacts: []
        },
        {
          id: 'partner-1',
          name: 'Partner 1',
          logo: '/assets/partner1.png',
          description: 'Aligned partner',
          category: 'official-partner' as const,
          tier: 'silver' as const,
          isActive: true,
          contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
          contacts: []
        }
      ];

      act(() => {
        sponsors.forEach(sponsor => result.current.addSponsor(sponsor));
        
        const config = result.current.createEventConfiguration('test-event');
        const updatedConfig = {
          ...config,
          titleSponsor: 'rolex',
          majorSponsors: ['hsbc'],
          alignedPartners: ['partner-1']
        };
        result.current.updateSponsorConfig(updatedConfig);
      });
    });

    it('should get title sponsor', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const titleSponsor = result.current.getTitleSponsor();
      expect(titleSponsor?.id).toBe('rolex');
    });

    it('should get major sponsors', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const majorSponsors = result.current.getMajorSponsors();
      expect(majorSponsors).toHaveLength(1);
      expect(majorSponsors[0].id).toBe('hsbc');
    });

    it('should get aligned partners', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const partners = result.current.getAlignedPartners();
      expect(partners).toHaveLength(1);
      expect(partners[0].id).toBe('partner-1');
    });
  });

  describe('Service Management', () => {
    it('should add sponsor services', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const mockSponsor = {
        id: 'test-sponsor',
        name: 'Test Sponsor',
        logo: '/assets/test.png',
        description: 'Test sponsor',
        category: 'service-provider' as const,
        tier: 'gold' as const,
        isActive: true,
        contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
        contacts: []
      };

      const mockService = {
        id: 'test-service',
        name: 'Test Service',
        description: 'Test service description',
        type: 'banking' as const,
        targetAudience: 'all' as const,
        availability: {
          startDate: '2024-11-18',
          endDate: '2024-11-24'
        },
        bookingRequired: false
      };

      act(() => {
        result.current.addSponsor(mockSponsor);
        result.current.addSponsorService('test-sponsor', mockService);
      });

      expect(result.current.services).toHaveLength(1);
      expect(result.current.services[0]).toEqual(mockService);
      
      const sponsorServices = result.current.getSponsorServices('test-sponsor');
      expect(sponsorServices).toHaveLength(1);
    });

    it('should update sponsor services', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const mockSponsor = {
        id: 'test-sponsor',
        name: 'Test Sponsor',
        logo: '/assets/test.png',
        description: 'Test sponsor',
        category: 'service-provider' as const,
        tier: 'gold' as const,
        isActive: true,
        contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
        contacts: []
      };

      const mockService = {
        id: 'test-service',
        name: 'Test Service',
        description: 'Original description',
        type: 'banking' as const,
        targetAudience: 'all' as const,
        availability: {
          startDate: '2024-11-18',
          endDate: '2024-11-24'
        },
        bookingRequired: false
      };

      act(() => {
        result.current.addSponsor(mockSponsor);
        result.current.addSponsorService('test-sponsor', mockService);
      });

      act(() => {
        result.current.updateSponsorService('test-sponsor', 'test-service', {
          description: 'Updated description',
          bookingRequired: true
        });
      });

      const updatedService = result.current.services.find(s => s.id === 'test-service');
      expect(updatedService?.description).toBe('Updated description');
      expect(updatedService?.bookingRequired).toBe(true);
    });

    it('should get services by type', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const services = [
        {
          id: 'banking-1',
          name: 'Banking Service 1',
          description: 'Banking service',
          type: 'banking' as const,
          targetAudience: 'all' as const,
          availability: { startDate: '2024-11-18', endDate: '2024-11-24' },
          bookingRequired: false
        },
        {
          id: 'dining-1',
          name: 'Dining Service 1',
          description: 'Dining service',
          type: 'dining' as const,
          targetAudience: 'vip' as const,
          availability: { startDate: '2024-11-18', endDate: '2024-11-24' },
          bookingRequired: true
        },
        {
          id: 'banking-2',
          name: 'Banking Service 2',
          description: 'Another banking service',
          type: 'banking' as const,
          targetAudience: 'competitors' as const,
          availability: { startDate: '2024-11-18', endDate: '2024-11-24' },
          bookingRequired: false
        }
      ];

      act(() => {
        useSponsorStore.setState({ services });
      });

      const bankingServices = result.current.getServicesByType('banking');
      expect(bankingServices).toHaveLength(2);

      const diningServices = result.current.getServicesByType('dining');
      expect(diningServices).toHaveLength(1);
    });

    it('should filter services by target audience', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const services = [
        {
          id: 'service-all',
          name: 'Service for All',
          description: 'Available to all',
          type: 'banking' as const,
          targetAudience: 'all' as const,
          availability: { startDate: '2024-11-18', endDate: '2024-11-24' },
          bookingRequired: false
        },
        {
          id: 'service-vip',
          name: 'VIP Service',
          description: 'VIP only',
          type: 'dining' as const,
          targetAudience: 'vip' as const,
          availability: { startDate: '2024-11-18', endDate: '2024-11-24' },
          bookingRequired: true
        },
        {
          id: 'service-competitors',
          name: 'Competitor Service',
          description: 'Competitors only',
          type: 'marine-services' as const,
          targetAudience: 'competitors' as const,
          availability: { startDate: '2024-11-18', endDate: '2024-11-24' },
          bookingRequired: false
        }
      ];

      act(() => {
        useSponsorStore.setState({ services });
      });

      const allServices = result.current.getSponsorServices(undefined, 'all');
      expect(allServices).toHaveLength(1); // Only the 'all' targeted service

      const vipServices = result.current.getSponsorServices(undefined, 'vip');
      expect(vipServices).toHaveLength(2); // 'vip' and 'all' targeted services
    });
  });

  describe('Branding', () => {
    it('should get branding configuration', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      result.current.createEventConfiguration('test-event');
      
      const brandingConfig = result.current.getBrandingConfig();
      expect(brandingConfig).toBeTruthy();
      expect(brandingConfig?.primaryColor).toBeDefined();
      expect(brandingConfig?.logoPlacement).toBeDefined();
    });

    it('should get logos by location', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const config = result.current.createEventConfiguration('test-event');
      const updatedConfig = {
        ...config,
        brandingConfig: {
          ...config.brandingConfig,
          logoPlacement: [
            { location: 'header' as const, sponsorId: 'rolex', size: 'large' as const, priority: 1 },
            { location: 'header' as const, sponsorId: 'hsbc', size: 'medium' as const, priority: 2 },
            { location: 'footer' as const, sponsorId: 'partner', size: 'small' as const, priority: 1 }
          ]
        }
      };

      act(() => {
        result.current.updateSponsorConfig(updatedConfig);
      });

      const headerLogos = result.current.getLogosByLocation('header');
      expect(headerLogos).toHaveLength(2);
      expect(headerLogos[0].priority).toBe(1); // Should be sorted by priority
      expect(headerLogos[1].priority).toBe(2);

      const footerLogos = result.current.getLogosByLocation('footer');
      expect(footerLogos).toHaveLength(1);
    });

    it('should get brand colors', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      result.current.createEventConfiguration('test-event');
      
      act(() => {
        result.current.updateBrandingConfig({
          primaryColor: '#FF0000',
          accentColor: '#00FF00'
        });
      });

      const primaryColor = result.current.getPrimaryBrandColor();
      const accentColor = result.current.getAccentBrandColor();
      
      expect(primaryColor).toBe('#FF0000');
      expect(accentColor).toBe('#00FF00');
    });

    it('should return default colors when no configuration', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const primaryColor = result.current.getPrimaryBrandColor();
      const accentColor = result.current.getAccentBrandColor();
      
      expect(primaryColor).toBe('#0066CC');
      expect(accentColor).toBe('#FF6B35');
    });
  });

  describe('Contact Management', () => {
    it('should get sponsor contacts', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const mockSponsor = {
        id: 'test-sponsor',
        name: 'Test Sponsor',
        logo: '/assets/test.png',
        description: 'Test sponsor',
        category: 'major-sponsor' as const,
        tier: 'gold' as const,
        isActive: true,
        contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
        contacts: [
          {
            id: 'contact-1',
            name: 'Public Contact',
            role: 'Manager',
            email: 'public@test.com',
            isPublic: true
          },
          {
            id: 'contact-2',
            name: 'Private Contact',
            role: 'Internal',
            email: 'private@test.com',
            isPublic: false
          }
        ]
      };

      act(() => {
        result.current.addSponsor(mockSponsor);
      });

      const publicContacts = result.current.getSponsorContacts('test-sponsor', true);
      expect(publicContacts).toHaveLength(1);
      expect(publicContacts[0].name).toBe('Public Contact');

      const allContacts = result.current.getSponsorContacts('test-sponsor', false);
      expect(allContacts).toHaveLength(2);
    });

    it('should update sponsor contacts', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const mockSponsor = {
        id: 'test-sponsor',
        name: 'Test Sponsor',
        logo: '/assets/test.png',
        description: 'Test sponsor',
        category: 'major-sponsor' as const,
        tier: 'gold' as const,
        isActive: true,
        contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
        contacts: [
          {
            id: 'contact-1',
            name: 'Original Name',
            role: 'Manager',
            email: 'original@test.com',
            isPublic: false
          }
        ]
      };

      act(() => {
        result.current.addSponsor(mockSponsor);
      });

      act(() => {
        result.current.updateSponsorContact('test-sponsor', 'contact-1', {
          name: 'Updated Name',
          isPublic: true
        });
      });

      const contacts = result.current.getSponsorContacts('test-sponsor', false);
      const updatedContact = contacts.find(c => c.id === 'contact-1');
      
      expect(updatedContact?.name).toBe('Updated Name');
      expect(updatedContact?.isPublic).toBe(true);
    });
  });

  describe('Loading and Error States', () => {
    it('should manage loading state', () => {
      const { result } = renderHook(() => useSponsorStore());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it('should manage error state', () => {
      const { result } = renderHook(() => useSponsorStore());

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });
  });

  describe('Data Persistence', () => {
    it('should handle store rehydration', async () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const mockSponsor = {
        id: 'persistent-sponsor',
        name: 'Persistent Sponsor',
        logo: '/assets/persistent.png',
        description: 'Persisted sponsor',
        category: 'major-sponsor' as const,
        tier: 'gold' as const,
        isActive: true,
        contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
        contacts: []
      };

      act(() => {
        result.current.addSponsor(mockSponsor);
        result.current.createEventConfiguration('persistent-event');
      });

      // Simulate store rehydration
      const storeSnapshot = StoreTestUtils.createStoreSnapshot(useSponsorStore);
      
      expect(storeSnapshot.sponsors).toHaveLength(1);
      expect(storeSnapshot.configurations).toHaveLength(1);
      expect(storeSnapshot.activeConfiguration?.eventId).toBe('persistent-event');
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid updates efficiently', () => {
      const { result } = renderHook(() => useSponsorStore());
      
      const startTime = performance.now();
      
      // Perform 20 rapid sponsor updates
      for (let i = 0; i < 20; i++) {
        act(() => {
          const mockSponsor = {
            id: `sponsor-${i}`,
            name: `Sponsor ${i}`,
            logo: `/assets/sponsor-${i}.png`,
            description: `Sponsor ${i} description`,
            category: 'major-sponsor' as const,
            tier: 'gold' as const,
            isActive: true,
            contract: { startDate: '2024-01-01', endDate: '2025-12-31' },
            contacts: []
          };
          result.current.addSponsor(mockSponsor);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all updates in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
      expect(result.current.sponsors).toHaveLength(20);
    });
  });
});