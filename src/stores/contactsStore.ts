import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Alert } from 'react-native';
import type { 
  KeyContact, 
  EmergencyContact, 
  CommunicationChannel, 
  ContactsSearchFilters,
  ContactInteraction,
  ContactCategory,
  ContactRole
} from '../types/contacts';

interface ContactsState {
  // State
  keyContacts: KeyContact[];
  emergencyContacts: EmergencyContact[];
  communicationChannels: CommunicationChannel[];
  favoriteContacts: string[];
  recentContacts: string[];
  contactInteractions: ContactInteraction[];
  searchQuery: string;
  activeFilters: ContactsSearchFilters;
  loading: boolean;
  error: string | null;
  lastSync: string | null;

  // Actions
  addContact: (contact: KeyContact) => void;
  updateContact: (contactId: string, updates: Partial<KeyContact>) => void;
  removeContact: (contactId: string) => void;
  toggleFavorite: (contactId: string) => void;
  
  // Emergency contacts
  addEmergencyContact: (contact: EmergencyContact) => void;
  callEmergencyContact: (contactId: string) => Promise<void>;
  
  // Communication channels
  addCommunicationChannel: (channel: CommunicationChannel) => void;
  openCommunicationChannel: (channelId: string) => Promise<void>;
  
  // Search and filtering
  setSearchQuery: (query: string) => void;
  setFilters: (filters: ContactsSearchFilters) => void;
  clearFilters: () => void;
  getFilteredContacts: () => KeyContact[];
  getFilteredEmergencyContacts: () => EmergencyContact[];
  
  // Contact interactions
  trackContactInteraction: (interaction: ContactInteraction) => void;
  callContact: (contactId: string) => Promise<void>;
  emailContact: (contactId: string) => Promise<void>;
  
  // Utility actions
  searchContacts: (query: string) => (KeyContact | EmergencyContact)[];
  getContactsByCategory: (category: ContactCategory) => KeyContact[];
  getContactsByRole: (role: ContactRole) => KeyContact[];
  
  // Data management
  initializeDefaultContacts: () => void;
  refreshContacts: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearContactsData: () => void;
}

// Default emergency contacts for Dragon Worlds HK 2027
const defaultEmergencyContacts: EmergencyContact[] = [
  {
    id: 'coast-guard-hk',
    role: 'coast-guard',
    name: 'Hong Kong Coast Guard',
    phone: '999',
    organization: 'Government Flying Service',
    category: 'emergency-contacts',
    isEmergency: true,
    priority: 'critical',
    quickDial: true,
    emergencyType: 'marine-rescue',
    description: 'Marine rescue and emergency response',
    vhfChannel: 'Channel 16',
    internationalFormat: '+852-999',
    availability: '24/7'
  },
  {
    id: 'marine-police-hk',
    role: 'marine-police',
    name: 'Marine Police',
    phone: '999',
    organization: 'Hong Kong Police Force',
    category: 'emergency-contacts',
    isEmergency: true,
    priority: 'critical',
    quickDial: true,
    emergencyType: 'security',
    description: 'Marine law enforcement and emergency assistance',
    vhfChannel: 'Channel 67',
    internationalFormat: '+852-999',
    availability: '24/7'
  },
  {
    id: 'hospital-hk',
    role: 'hospital',
    name: 'Queen Mary Hospital',
    phone: '+852-2255-3838',
    organization: 'Hospital Authority',
    category: 'emergency-contacts',
    isEmergency: true,
    priority: 'urgent',
    quickDial: true,
    emergencyType: 'medical',
    description: 'Major trauma and emergency medical center',
    location: 'Pokfulam, Hong Kong Island',
    availability: '24/7 Emergency Department'
  }
];

// Default key contacts
const defaultKeyContacts: KeyContact[] = [
  {
    id: 'pro-dragon-worlds',
    role: 'principal-race-officer',
    name: 'TBD - Principal Race Officer',
    email: 'pro@dragonworlds2027.com',
    organization: 'Dragon Worlds HK 2027',
    category: 'race-management',
    isEmergency: false,
    vhfChannel: 'Channel 72',
    description: 'Overall race management and course decisions',
    availability: 'Race days 08:00-18:00'
  },
  {
    id: 'chief-judge',
    role: 'chief-judge',
    name: 'TBD - Chief Judge',
    email: 'judge@dragonworlds2027.com',
    organization: 'Dragon Worlds HK 2027',
    category: 'race-management',
    isEmergency: false,
    description: 'Protest hearings and racing rules interpretation',
    availability: 'Race days and protest hearings'
  },
  {
    id: 'safety-officer',
    role: 'safety-officer',
    name: 'TBD - Safety Officer',
    phone: '+852-XXXX-XXXX',
    email: 'safety@dragonworlds2027.com',
    organization: 'Dragon Worlds HK 2027',
    category: 'race-management',
    isEmergency: true,
    vhfChannel: 'Channel 08',
    description: 'Safety on water and emergency coordination',
    availability: '24/7 during event'
  },
  {
    id: 'rhkyc-office',
    role: 'yacht-club-office',
    name: 'Royal Hong Kong Yacht Club',
    phone: '+852-2832-2817',
    email: 'info@rhkyc.org.hk',
    organization: 'RHKYC',
    category: 'host-organization',
    isEmergency: false,
    location: 'Kellett Island, Causeway Bay',
    hours: 'Monday-Sunday 08:00-20:00'
  },
  // Dragon Worlds Committee
  {
    id: 'dragon-worlds-general',
    role: 'event-coordinator',
    name: 'Dragon Worlds Committee',
    email: 'info@dragonworld2027.com',
    organization: 'Hong Kong Dragon Association',
    category: 'host-organization',
    isEmergency: false,
    description: 'General event enquiries',
    location: 'Royal Hong Kong Yacht Club, Kellett Island, Causeway Bay, Hong Kong'
  },
  {
    id: 'bram-van-olphen',
    role: 'event-coordinator',
    name: 'Bram Van Olphen',
    email: 'bram@dragonworld2027.com',
    organization: 'Dragon Worlds Committee',
    category: 'host-organization',
    isEmergency: false,
    description: 'Liaison Logistics'
  },
  {
    id: 'ken-wong',
    role: 'event-coordinator',
    name: 'Ken Wong',
    email: 'ken@dragonworld2027.com',
    organization: 'Dragon Worlds Committee',
    category: 'host-organization',
    isEmergency: false,
    description: 'Class Secretary & Liaison Volunteers'
  },
  {
    id: 'nick-bilcliffe',
    role: 'event-coordinator',
    name: 'Nick Bilcliffe',
    email: 'nick@dragonworld2027.com',
    organization: 'Dragon Worlds Committee',
    category: 'host-organization',
    isEmergency: false,
    description: 'Liaison HKDA, IDA and International Sailors'
  },
  {
    id: 'victor-pang',
    role: 'event-coordinator',
    name: 'Victor Pang',
    email: 'victor@dragonworld2027.com',
    organization: 'Dragon Worlds Committee',
    category: 'host-organization',
    isEmergency: false,
    description: 'Liaison Social Program'
  },
  {
    id: 'ronnie-chan',
    role: 'event-coordinator',
    name: 'Ronnie Chan',
    email: 'ronnie@dragonworld2027.com',
    organization: 'Dragon Worlds Committee',
    category: 'host-organization',
    isEmergency: false,
    description: 'Liaison Sponsorship'
  }
];

// Default communication channels
const defaultCommunicationChannels: CommunicationChannel[] = [
  {
    id: 'official-website',
    type: 'website',
    name: 'Official Event Website',
    details: 'Live results, notices, and event information',
    url: 'https://dragonworlds2027.com',
    isOfficial: true,
    category: 'official'
  },
  {
    id: 'notice-board',
    type: 'physical',
    name: 'Official Notice Board',
    details: 'Physical notice board at RHKYC',
    location: 'Royal Hong Kong Yacht Club - Main Clubhouse',
    isOfficial: true,
    category: 'official'
  },
  {
    id: 'race-committee-vhf',
    type: 'vhf',
    name: 'Race Committee',
    details: 'Primary race management communications',
    vhfChannel: 'Channel 72',
    isOfficial: true,
    category: 'official'
  },
  {
    id: 'safety-vhf',
    type: 'vhf',
    name: 'Safety Channel',
    details: 'Safety communications and emergencies',
    vhfChannel: 'Channel 08',
    isOfficial: true,
    category: 'emergency'
  }
];

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      // Initial State
      keyContacts: [],
      emergencyContacts: [],
      communicationChannels: [],
      favoriteContacts: [],
      recentContacts: [],
      contactInteractions: [],
      searchQuery: '',
      activeFilters: {},
      loading: false,
      error: null,
      lastSync: null,

      // Actions
      addContact: (contact: KeyContact) => {
        set(state => ({
          keyContacts: [...state.keyContacts, contact]
        }));
      },

      updateContact: (contactId: string, updates: Partial<KeyContact>) => {
        set(state => ({
          keyContacts: state.keyContacts.map(contact =>
            contact.id === contactId ? { ...contact, ...updates } : contact
          )
        }));
      },

      removeContact: (contactId: string) => {
        set(state => ({
          keyContacts: state.keyContacts.filter(contact => contact.id !== contactId),
          favoriteContacts: state.favoriteContacts.filter(id => id !== contactId),
          recentContacts: state.recentContacts.filter(id => id !== contactId)
        }));
      },

      toggleFavorite: (contactId: string) => {
        set(state => {
          const isFavorite = state.favoriteContacts.includes(contactId);
          return {
            favoriteContacts: isFavorite
              ? state.favoriteContacts.filter(id => id !== contactId)
              : [...state.favoriteContacts, contactId]
          };
        });
      },

      // Emergency contacts
      addEmergencyContact: (contact: EmergencyContact) => {
        set(state => ({
          emergencyContacts: [...state.emergencyContacts, contact]
        }));
      },

      callEmergencyContact: async (contactId: string) => {
        const { emergencyContacts, trackContactInteraction } = get();
        const contact = emergencyContacts.find(c => c.id === contactId);
        
        if (contact && contact.phone) {
          try {
            const phoneUrl = `tel:${contact.phone}`;
            const canOpen = await Linking.canOpenURL(phoneUrl);
            
            if (canOpen) {
              await Linking.openURL(phoneUrl);
              trackContactInteraction({
                contactId,
                type: 'call',
                timestamp: new Date().toISOString(),
                success: true
              });
            } else {
              throw new Error('Cannot open phone dialer');
            }
          } catch (error) {
            Alert.alert('Error', 'Unable to make phone call');
            trackContactInteraction({
              contactId,
              type: 'call',
              timestamp: new Date().toISOString(),
              success: false,
              notes: 'Failed to open dialer'
            });
          }
        }
      },

      // Communication channels
      addCommunicationChannel: (channel: CommunicationChannel) => {
        set(state => ({
          communicationChannels: [...state.communicationChannels, channel]
        }));
      },

      openCommunicationChannel: async (channelId: string) => {
        const { communicationChannels } = get();
        const channel = communicationChannels.find(c => c.id === channelId);
        
        if (channel && channel.url) {
          try {
            const canOpen = await Linking.canOpenURL(channel.url);
            if (canOpen) {
              await Linking.openURL(channel.url);
            } else {
              throw new Error('Cannot open URL');
            }
          } catch (error) {
            Alert.alert('Error', 'Unable to open communication channel');
          }
        }
      },

      // Search and filtering
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      setFilters: (filters: ContactsSearchFilters) => {
        set({ activeFilters: filters });
      },

      clearFilters: () => {
        set({ activeFilters: {}, searchQuery: '' });
      },

      getFilteredContacts: () => {
        const { keyContacts, searchQuery, activeFilters, favoriteContacts } = get();
        let filtered = [...keyContacts];

        // Apply search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(contact =>
            contact.name.toLowerCase().includes(query) ||
            contact.role.toLowerCase().includes(query) ||
            contact.organization?.toLowerCase().includes(query) ||
            contact.description?.toLowerCase().includes(query)
          );
        }

        // Apply filters
        if (activeFilters.category) {
          filtered = filtered.filter(contact => contact.category === activeFilters.category);
        }
        if (activeFilters.isEmergency !== undefined) {
          filtered = filtered.filter(contact => contact.isEmergency === activeFilters.isEmergency);
        }
        if (activeFilters.hasPhone) {
          filtered = filtered.filter(contact => !!contact.phone);
        }
        if (activeFilters.hasEmail) {
          filtered = filtered.filter(contact => !!contact.email);
        }
        if (activeFilters.isFavorite) {
          filtered = filtered.filter(contact => favoriteContacts.includes(contact.id));
        }

        return filtered;
      },

      getFilteredEmergencyContacts: () => {
        const { emergencyContacts, searchQuery } = get();
        let filtered = [...emergencyContacts];

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(contact =>
            contact.name.toLowerCase().includes(query) ||
            contact.emergencyType.toLowerCase().includes(query) ||
            contact.description?.toLowerCase().includes(query)
          );
        }

        return filtered.sort((a, b) => {
          const priorityOrder = { critical: 0, urgent: 1, important: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      },

      // Contact interactions
      trackContactInteraction: (interaction: ContactInteraction) => {
        set(state => ({
          contactInteractions: [...state.contactInteractions, interaction],
          recentContacts: [
            interaction.contactId,
            ...state.recentContacts.filter(id => id !== interaction.contactId)
          ].slice(0, 10) // Keep only last 10 recent contacts
        }));
      },

      callContact: async (contactId: string) => {
        const { keyContacts, trackContactInteraction } = get();
        const contact = keyContacts.find(c => c.id === contactId);
        
        if (contact && contact.phone) {
          try {
            const phoneUrl = `tel:${contact.phone}`;
            const canOpen = await Linking.canOpenURL(phoneUrl);
            
            if (canOpen) {
              await Linking.openURL(phoneUrl);
              trackContactInteraction({
                contactId,
                type: 'call',
                timestamp: new Date().toISOString(),
                success: true
              });
            } else {
              throw new Error('Cannot open phone dialer');
            }
          } catch (error) {
            Alert.alert('Error', 'Unable to make phone call');
            trackContactInteraction({
              contactId,
              type: 'call',
              timestamp: new Date().toISOString(),
              success: false,
              notes: 'Failed to open dialer'
            });
          }
        }
      },

      emailContact: async (contactId: string) => {
        const { keyContacts, trackContactInteraction } = get();
        const contact = keyContacts.find(c => c.id === contactId);
        
        if (contact && contact.email) {
          try {
            const emailUrl = `mailto:${contact.email}`;
            const canOpen = await Linking.canOpenURL(emailUrl);
            
            if (canOpen) {
              await Linking.openURL(emailUrl);
              trackContactInteraction({
                contactId,
                type: 'email',
                timestamp: new Date().toISOString(),
                success: true
              });
            } else {
              throw new Error('Cannot open email client');
            }
          } catch (error) {
            Alert.alert('Error', 'Unable to open email client');
            trackContactInteraction({
              contactId,
              type: 'email',
              timestamp: new Date().toISOString(),
              success: false,
              notes: 'Failed to open email client'
            });
          }
        }
      },

      // Utility actions
      searchContacts: (query: string) => {
        const { keyContacts, emergencyContacts } = get();
        const allContacts = [...keyContacts, ...emergencyContacts];
        const lowercaseQuery = query.toLowerCase();
        
        return allContacts.filter(contact =>
          contact.name.toLowerCase().includes(lowercaseQuery) ||
          contact.role.toLowerCase().includes(lowercaseQuery) ||
          contact.organization?.toLowerCase().includes(lowercaseQuery)
        );
      },

      getContactsByCategory: (category: ContactCategory) => {
        const { keyContacts } = get();
        return keyContacts.filter(contact => contact.category === category);
      },

      getContactsByRole: (role: ContactRole) => {
        const { keyContacts } = get();
        return keyContacts.filter(contact => contact.role === role);
      },

      // Data management
      initializeDefaultContacts: () => {
        set({
          keyContacts: defaultKeyContacts,
          emergencyContacts: defaultEmergencyContacts,
          communicationChannels: defaultCommunicationChannels,
          lastSync: new Date().toISOString()
        });
      },

      refreshContacts: async () => {
        set({ loading: true, error: null });
        
        try {
          // Simulate API call - in real app, this would fetch from server
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({
            lastSync: new Date().toISOString(),
            loading: false,
            error: null
          });
        } catch (error) {
          set({
            loading: false,
            error: 'Failed to refresh contacts'
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearContactsData: () => {
        set({
          keyContacts: [],
          emergencyContacts: [],
          communicationChannels: [],
          favoriteContacts: [],
          recentContacts: [],
          contactInteractions: [],
          searchQuery: '',
          activeFilters: {},
          lastSync: null,
          error: null
        });
      }
    }),
    {
      name: 'dragon-worlds-contacts',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        keyContacts: state.keyContacts,
        emergencyContacts: state.emergencyContacts,
        communicationChannels: state.communicationChannels,
        favoriteContacts: state.favoriteContacts,
        recentContacts: state.recentContacts,
        contactInteractions: state.contactInteractions.slice(-50), // Keep last 50 interactions
        lastSync: state.lastSync
      })
    }
  )
);

// Selectors
export const useKeyContacts = () => useContactsStore(state => state.keyContacts);
export const useEmergencyContacts = () => useContactsStore(state => state.emergencyContacts);
export const useCommunicationChannels = () => useContactsStore(state => state.communicationChannels);
export const useFavoriteContacts = () => useContactsStore(state => state.favoriteContacts);
export const useRecentContacts = () => useContactsStore(state => state.recentContacts);
export const useContactsLoading = () => useContactsStore(state => state.loading);
export const useContactsError = () => useContactsStore(state => state.error);

// Computed selectors with custom equality functions to prevent unnecessary re-renders
export const useFilteredContacts = () => useContactsStore(
  state => state.getFilteredContacts(),
  (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((contact, index) => contact.id === b[index]?.id);
  }
);

export const useFilteredEmergencyContacts = () => useContactsStore(
  state => state.getFilteredEmergencyContacts(),
  (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((contact, index) => contact.id === b[index]?.id);
  }
);

export const useContactsByCategory = (category: ContactCategory) =>
  useContactsStore(state => state.getContactsByCategory(category));

export const useEmergencyContactsByType = (emergencyType: EmergencyContact['emergencyType']) =>
  useContactsStore(state => 
    state.emergencyContacts.filter(contact => contact.emergencyType === emergencyType)
  );