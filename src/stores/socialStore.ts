import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WhatsAppService, {
  WhatsAppGroup as WhatsAppGroupService,
  UserGroupMembership,
  GroupAccessRequest,
  RaceComment
} from '../services/whatsappService';
import { useUserStore } from './userStore';

// TypeScript interfaces
export interface WhatsAppGroup {
  id: string;
  title: string;
  description: string;
  category: GroupCategory;
  memberCount: number;
  activeMemberCount?: number;
  isActive?: boolean;
  isVIP?: boolean;
  isInviteOnly?: boolean;
  verificationStatus?: VerificationStatus;
  sponsorPrefix?: string;
  joinUrl?: string;
  createdAt: string;
  lastActivity?: string;
  rules?: string[];
  admins: string[];
}

export interface GroupMember {
  id: string;
  name: string;
  sailNumber?: string;
  country?: string;
  role: 'member' | 'admin' | 'moderator';
  joinedAt: string;
  isVerified: boolean;
  participantType?: 'competitor' | 'support' | 'official' | 'spectator';
}

export interface ActiveDiscussion {
  id: string;
  groupId: string;
  title: string;
  type: 'race-commentary' | 'general' | 'event-specific' | 'technical';
  participantCount: number;
  lastMessage?: {
    author: string;
    content: string;
    timestamp: string;
  };
  isLive: boolean;
}

export interface SailingConnection {
  id: string;
  name: string;
  sailNumber?: string;
  country: string;
  role: 'competitor' | 'coach' | 'support' | 'official' | 'media';
  teamAffiliation?: string;
  connectedAt: string;
  mutualGroups: string[];
  isVerified: boolean;
}

export interface GroupInteraction {
  groupId: string;
  type: 'view' | 'join' | 'leave' | 'message' | 'share';
  timestamp: string;
  metadata?: Record<string, any>;
}

export type GroupCategory = 
  | 'active-racing' 
  | 'spectators-families' 
  | 'vip-hospitality' 
  | 'hong-kong-local' 
  | 'technical-support'
  | 'media-press';

export type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'declined';

interface SocialState {
  // State
  whatsappGroups: WhatsAppGroup[];
  joinedGroups: string[];
  userMemberships: UserGroupMembership[];
  accessRequests: GroupAccessRequest[];
  activeDiscussions: ActiveDiscussion[];
  groupComments: { [groupId: string]: RaceComment[] };
  connections: SailingConnection[];
  groupInteractions: GroupInteraction[];
  loading: boolean;
  error: string | null;
  lastSync: string | null;

  // Group management
  availableCategories: GroupCategory[];
  groupInvitations: string[];
  blockedGroups: string[];

  // Actions
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  requestGroupAccess: (groupId: string, message?: string) => Promise<void>;
  loadGroupComments: (groupId: string) => Promise<void>;
  postComment: (groupId: string, message: string) => Promise<void>;
  updateGroupStatus: (groupId: string, updates: Partial<WhatsAppGroup>) => void;
  trackGroupInteraction: (interaction: GroupInteraction) => void;
  refreshGroups: () => Promise<void>;
  
  // Group discovery and filtering
  getGroupsByCategory: (category: GroupCategory) => WhatsAppGroup[];
  getJoinedGroups: () => WhatsAppGroup[];
  getAvailableGroups: () => WhatsAppGroup[];
  searchGroups: (query: string) => WhatsAppGroup[];
  
  // Discussion management
  updateActiveDiscussions: (discussions: ActiveDiscussion[]) => void;
  joinDiscussion: (discussionId: string) => void;
  leaveDiscussion: (discussionId: string) => void;
  
  // Connection management
  addConnection: (connection: SailingConnection) => void;
  removeConnection: (connectionId: string) => void;
  updateConnection: (connectionId: string, updates: Partial<SailingConnection>) => void;
  getConnectionsByRole: (role: SailingConnection['role']) => SailingConnection[];
  
  // Group invitations
  sendGroupInvitation: (groupId: string, recipientId: string) => Promise<void>;
  respondToInvitation: (groupId: string, accept: boolean) => void;
  
  // Moderation
  reportGroup: (groupId: string, reason: string) => Promise<void>;
  blockGroup: (groupId: string) => void;
  unblockGroup: (groupId: string) => void;
  
  // Analytics
  getGroupStats: (groupId: string) => {
    memberGrowth: number;
    activityLevel: 'low' | 'medium' | 'high';
    engagementScore: number;
  };
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSocialData: () => void;
}

// Initialize WhatsApp service
let whatsappService: WhatsAppService;

// Convert service group format to store format
const convertServiceGroupToStoreGroup = (serviceGroup: WhatsAppGroupService): WhatsAppGroup => {
  const categoryMap: { [key: string]: GroupCategory } = {
    'participant': 'active-racing',
    'spectator': 'spectators-families',
    'vip': 'vip-hospitality',
    'official': 'technical-support',
    'general': 'hong-kong-local'
  };

  return {
    id: serviceGroup.id,
    title: serviceGroup.name,
    description: serviceGroup.description,
    category: categoryMap[serviceGroup.type] || 'hong-kong-local',
    memberCount: serviceGroup.memberCount,
    activeMemberCount: serviceGroup.isActive ? Math.floor(serviceGroup.memberCount * 0.3) : 0,
    isActive: serviceGroup.isActive,
    isVIP: serviceGroup.type === 'vip',
    isInviteOnly: serviceGroup.accessLevel === 'invite_only' || serviceGroup.accessLevel === 'vip_only',
    verificationStatus: serviceGroup.accessLevel === 'verified' ? 'verified' : 'unverified',
    sponsorPrefix: serviceGroup.sponsor?.replace('_', ' '),
    joinUrl: serviceGroup.groupLink,
    createdAt: serviceGroup.createdAt,
    lastActivity: serviceGroup.lastActivity,
    rules: Object.values(serviceGroup.verificationRequired).some(Boolean) ? 
      ['Verification required', 'Event participants only'] : undefined,
    admins: serviceGroup.moderators
  };
};

// Fetch groups using the WhatsApp service
const fetchGroupsFromAPI = async (): Promise<WhatsAppGroup[]> => {
  if (!whatsappService) {
    whatsappService = new WhatsAppService();
  }
  
  const serviceGroups = await whatsappService.getAvailableGroups();
  return serviceGroups.map(convertServiceGroupToStoreGroup);
};

// Default sailing-specific WhatsApp groups for Dragon Worlds HK 2027
const defaultSailingGroups: WhatsAppGroup[] = [
  // Competition Communication Groups
  {
    id: 'race-committee-comms',
    title: 'Race Committee Communications',
    description: 'Official race updates, course changes, postponements, and daily race briefings',
    category: 'active-racing',
    memberCount: 45,
    activeMemberCount: 38,
    isActive: true,
    isVIP: false,
    isInviteOnly: true,
    verificationStatus: 'verified',
    joinUrl: 'https://chat.whatsapp.com/race-committee-comms',
    createdAt: new Date('2027-02-01').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Officials and competitors only', 'Race-related communications only'],
    admins: ['race-officer', 'chief-judge']
  },
  {
    id: 'competitors-general',
    title: 'Dragon Worlds 2027 - Competitors',
    description: 'General discussion for all Dragon Worlds competitors, fleet announcements, and networking',
    category: 'active-racing',
    memberCount: 286,
    activeMemberCount: 195,
    isActive: true,
    isVIP: false,
    isInviteOnly: false,
    verificationStatus: 'verified',
    joinUrl: 'https://chat.whatsapp.com/competitors-general',
    createdAt: new Date('2027-01-15').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Registered competitors only', 'Be respectful', 'No spam'],
    admins: ['regatta-director', 'competitors-rep']
  },
  {
    id: 'weather-conditions',
    title: 'Weather & Sea Conditions',
    description: 'Real-time weather updates, sea state reports, and sailing condition discussions',
    category: 'active-racing',
    memberCount: 324,
    activeMemberCount: 267,
    isActive: true,
    isVIP: false,
    isInviteOnly: false,
    verificationStatus: 'unverified',
    joinUrl: 'https://chat.whatsapp.com/weather-conditions',
    createdAt: new Date('2027-01-20').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Weather-related content only', 'Share reliable sources'],
    admins: ['weather-officer', 'safety-officer']
  },
  {
    id: 'results-scoring',
    title: 'Results & Scoring',
    description: 'Live results, protest updates, redress announcements, and scoring clarifications',
    category: 'active-racing',
    memberCount: 198,
    activeMemberCount: 156,
    isActive: true,
    isVIP: false,
    isInviteOnly: true,
    verificationStatus: 'verified',
    joinUrl: 'https://chat.whatsapp.com/results-scoring',
    createdAt: new Date('2027-02-01').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Race results discussions only', 'No protest discussions'],
    admins: ['scoring-officer', 'chief-judge']
  },

  // Class-Specific Groups
  {
    id: 'dragon-class-fleet',
    title: 'Dragon Class Fleet',
    description: 'Dragon class specific discussions, boat setup, tuning tips, and class regulations',
    category: 'active-racing',
    memberCount: 156,
    activeMemberCount: 89,
    isActive: true,
    isVIP: false,
    isInviteOnly: false,
    verificationStatus: 'verified',
    sponsorPrefix: 'Dragon Class',
    joinUrl: 'https://chat.whatsapp.com/dragon-class-fleet',
    createdAt: new Date('2027-01-10').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Dragon class sailors only', 'Technical discussions welcome'],
    admins: ['class-captain', 'technical-rep']
  },
  {
    id: 'youth-junior-sailors',
    title: 'Youth & Junior Sailors',
    description: 'Young sailors networking, mentorship, and youth sailing development discussions',
    category: 'active-racing',
    memberCount: 67,
    activeMemberCount: 52,
    isActive: true,
    isVIP: false,
    isInviteOnly: false,
    verificationStatus: 'unverified',
    joinUrl: 'https://chat.whatsapp.com/youth-junior-sailors',
    createdAt: new Date('2027-01-25').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Under 25 competitors only', 'Supportive environment'],
    admins: ['youth-coordinator', 'junior-rep']
  },

  // Support & Social Groups
  {
    id: 'crew-exchange',
    title: 'Crew Exchange',
    description: 'Find crew positions, boat positions, and crew networking for the regatta',
    category: 'spectators-families',
    memberCount: 89,
    activeMemberCount: 34,
    isActive: true,
    isVIP: false,
    isInviteOnly: false,
    verificationStatus: 'unverified',
    joinUrl: 'https://chat.whatsapp.com/crew-exchange',
    createdAt: new Date('2027-01-20').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Crew-related posts only', 'Be professional'],
    admins: ['event-coordinator']
  },
  {
    id: 'social-events',
    title: 'Social Events & Parties',
    description: 'Social gatherings, evening events, prize ceremonies, and after-race celebrations',
    category: 'spectators-families',
    memberCount: 245,
    activeMemberCount: 123,
    isActive: true,
    isVIP: false,
    isInviteOnly: false,
    verificationStatus: 'unverified',
    joinUrl: 'https://chat.whatsapp.com/social-events',
    createdAt: new Date('2027-01-15').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Social events only', 'Family-friendly content'],
    admins: ['social-coordinator']
  },
  {
    id: 'transportation-logistics',
    title: 'Transportation & Logistics',
    description: 'Shared rides, boat transport, equipment shipping, and logistics coordination',
    category: 'spectators-families',
    memberCount: 134,
    activeMemberCount: 67,
    isActive: true,
    isVIP: false,
    isInviteOnly: false,
    verificationStatus: 'unverified',
    joinUrl: 'https://chat.whatsapp.com/transportation-logistics',
    createdAt: new Date('2027-01-18').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Transport-related only', 'Share costs fairly'],
    admins: ['logistics-coordinator']
  },
  {
    id: 'equipment-trade',
    title: 'Equipment Buy/Sell/Trade',
    description: 'Sailing gear marketplace, equipment exchange, and gear recommendations',
    category: 'spectators-families',
    memberCount: 178,
    activeMemberCount: 89,
    isActive: true,
    isVIP: false,
    isInviteOnly: false,
    verificationStatus: 'unverified',
    joinUrl: 'https://chat.whatsapp.com/equipment-trade',
    createdAt: new Date('2027-01-12').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Equipment-related only', 'Fair pricing', 'Photos required'],
    admins: ['equipment-coordinator']
  },

  // VIP & Hospitality Groups
  {
    id: 'vip-hospitality',
    title: 'HSBC VIP Hospitality',
    description: 'Exclusive VIP events, hospitality schedule, and premium guest services',
    category: 'vip-hospitality',
    memberCount: 45,
    activeMemberCount: 38,
    isActive: true,
    isVIP: true,
    isInviteOnly: true,
    verificationStatus: 'verified',
    sponsorPrefix: 'HSBC',
    joinUrl: 'https://chat.whatsapp.com/vip-hospitality',
    createdAt: new Date('2027-02-01').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['VIP guests only', 'Invitation required'],
    admins: ['vip-coordinator', 'hsbc-rep']
  },
  {
    id: 'sponsors-supporters',
    title: 'Sponsors & Supporters',
    description: 'Sponsor networking, corporate hospitality, and business development opportunities',
    category: 'vip-hospitality',
    memberCount: 67,
    activeMemberCount: 23,
    isActive: false,
    isVIP: true,
    isInviteOnly: true,
    verificationStatus: 'verified',
    joinUrl: 'https://chat.whatsapp.com/sponsors-supporters',
    createdAt: new Date('2027-01-28').toISOString(),
    lastActivity: new Date(Date.now() - 86400000).toISOString(),
    rules: ['Sponsors and major supporters only'],
    admins: ['sponsor-relations']
  },

  // Hong Kong Local Groups
  {
    id: 'hk-local-sailing',
    title: 'Hong Kong Local Sailing',
    description: 'Local Hong Kong sailing community, marina information, and local conditions',
    category: 'hong-kong-local',
    memberCount: 189,
    activeMemberCount: 145,
    isActive: true,
    isVIP: false,
    isInviteOnly: false,
    verificationStatus: 'unverified',
    joinUrl: 'https://chat.whatsapp.com/hk-local-sailing',
    createdAt: new Date('2026-12-15').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Hong Kong sailing focus', 'Local knowledge sharing'],
    admins: ['hk-sailing-rep', 'rhkyc-member']
  },
  {
    id: 'hk-tourism-dining',
    title: 'HK Tourism & Dining',
    description: 'Hong Kong restaurants, tourist attractions, and local recommendations for visitors',
    category: 'hong-kong-local',
    memberCount: 234,
    activeMemberCount: 112,
    isActive: true,
    isVIP: false,
    isInviteOnly: false,
    verificationStatus: 'unverified',
    joinUrl: 'https://chat.whatsapp.com/hk-tourism-dining',
    createdAt: new Date('2027-01-10').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Hong Kong recommendations only', 'Be helpful'],
    admins: ['tourism-volunteer']
  },

  // Technical Support Groups
  {
    id: 'technical-support',
    title: 'Technical Support',
    description: 'Boat measurement, equipment checks, technical regulations, and rule clarifications',
    category: 'technical-support',
    memberCount: 78,
    activeMemberCount: 45,
    isActive: true,
    isVIP: false,
    isInviteOnly: true,
    verificationStatus: 'verified',
    joinUrl: 'https://chat.whatsapp.com/technical-support',
    createdAt: new Date('2027-01-30').toISOString(),
    lastActivity: new Date().toISOString(),
    rules: ['Technical questions only', 'Official responses from measurers'],
    admins: ['chief-measurer', 'technical-committee']
  },
  {
    id: 'it-scoring-support',
    title: 'IT & Scoring Support',
    description: 'Registration issues, scoring system help, and technology support',
    category: 'technical-support',
    memberCount: 56,
    activeMemberCount: 23,
    isActive: false,
    isVIP: false,
    isInviteOnly: true,
    verificationStatus: 'verified',
    joinUrl: 'https://chat.whatsapp.com/it-scoring-support',
    createdAt: new Date('2027-01-28').toISOString(),
    lastActivity: new Date(Date.now() - 172800000).toISOString(),
    rules: ['IT support only', 'Be patient with volunteers'],
    admins: ['it-coordinator']
  }
];

const fetchActiveDiscussions = async (): Promise<ActiveDiscussion[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'race3-live',
      groupId: 'race-committee-comms',
      title: 'Race 3 Live Commentary',
      type: 'race-commentary',
      participantCount: 147,
      lastMessage: {
        author: '@RaceCommittee',
        content: 'Wind building to 15 knots from the southeast, race starting in 10 minutes',
        timestamp: new Date().toISOString()
      },
      isLive: true
    },
    {
      id: 'weather-discussion',
      groupId: 'weather-conditions',
      title: 'Current Weather Discussion',
      type: 'general',
      participantCount: 89,
      lastMessage: {
        author: '@WeatherGuru',
        content: 'Sea state improving, 1-2m swells expected this afternoon',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      isLive: false
    }
  ];
};

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      // Initial State
      whatsappGroups: [],
      joinedGroups: [],
      userMemberships: [],
      accessRequests: [],
      activeDiscussions: [],
      groupComments: {},
      connections: [],
      groupInteractions: [],
      loading: false,
      error: null,
      lastSync: null,
      
      availableCategories: [
        'active-racing',
        'spectators-families', 
        'vip-hospitality',
        'hong-kong-local',
        'technical-support',
        'media-press'
      ],
      groupInvitations: [],
      blockedGroups: [],

      // Actions
      joinGroup: async (groupId: string) => {
        set({ loading: true });
        
        try {
          if (!whatsappService) {
            whatsappService = new WhatsAppService();
          }

          const membership = await whatsappService.joinGroup(groupId);
          
          set(state => ({
            joinedGroups: [...state.joinedGroups, groupId],
            userMemberships: [...state.userMemberships, membership],
            loading: false,
            error: null
          }));
          
          // Track interaction
          get().trackGroupInteraction({
            groupId,
            type: 'join',
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to join group'
          });
        }
      },

      leaveGroup: async (groupId: string) => {
        set({ loading: true });
        
        try {
          if (!whatsappService) {
            whatsappService = new WhatsAppService();
          }

          await whatsappService.leaveGroup(groupId);
          
          set(state => ({
            joinedGroups: state.joinedGroups.filter(id => id !== groupId),
            userMemberships: state.userMemberships.filter(m => m.groupId !== groupId),
            groupComments: {
              ...state.groupComments,
              [groupId]: []
            },
            loading: false,
            error: null
          }));
          
          // Track interaction
          get().trackGroupInteraction({
            groupId,
            type: 'leave',
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          set({
            loading: false,
            error: 'Failed to leave group'
          });
        }
      },

      requestGroupAccess: async (groupId: string, message?: string) => {
        set({ loading: true });
        
        try {
          if (!whatsappService) {
            whatsappService = new WhatsAppService();
          }

          const request = await whatsappService.requestGroupAccess(groupId, message);
          
          set(state => ({
            accessRequests: [...state.accessRequests, request],
            loading: false,
            error: null
          }));
          
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to request access'
          });
        }
      },

      loadGroupComments: async (groupId: string) => {
        try {
          if (!whatsappService) {
            whatsappService = new WhatsAppService();
          }

          const comments = await whatsappService.getGroupComments(groupId, 50);
          
          set(state => ({
            groupComments: {
              ...state.groupComments,
              [groupId]: comments
            }
          }));
          
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load comments'
          });
        }
      },

      postComment: async (groupId: string, message: string) => {
        try {
          if (!whatsappService) {
            whatsappService = new WhatsAppService();
          }

          const comment = await whatsappService.postComment(groupId, message);
          
          set(state => ({
            groupComments: {
              ...state.groupComments,
              [groupId]: [comment, ...(state.groupComments[groupId] || [])]
            }
          }));
          
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to post comment'
          });
        }
      },

      updateGroupStatus: (groupId: string, updates: Partial<WhatsAppGroup>) => {
        set(state => ({
          whatsappGroups: state.whatsappGroups.map(group =>
            group.id === groupId ? { ...group, ...updates } : group
          )
        }));
      },

      trackGroupInteraction: (interaction: GroupInteraction) => {
        set(state => ({
          groupInteractions: [...state.groupInteractions, interaction]
        }));
      },

      refreshGroups: async () => {
        set({ loading: true, error: null });
        
        try {
          if (!whatsappService) {
            whatsappService = new WhatsAppService();
          }

          const [groups, discussions, userMemberships] = await Promise.all([
            // Use sailing groups if API fails or for demo
            Promise.resolve(defaultSailingGroups),
            fetchActiveDiscussions(),
            whatsappService ? whatsappService.getUserGroups() : Promise.resolve([])
          ]);
          
          const joinedGroupIds = userMemberships.map(m => m.groupId);
          
          set({
            whatsappGroups: groups,
            activeDiscussions: discussions,
            userMemberships,
            joinedGroups: joinedGroupIds,
            lastSync: new Date().toISOString(),
            loading: false,
            error: null
          });
        } catch (error) {
          set({
            loading: false,
            error: 'Failed to refresh groups'
          });
        }
      },

      // Group discovery and filtering
      getGroupsByCategory: (category: GroupCategory) => {
        const { whatsappGroups } = get();
        return whatsappGroups.filter(group => group.category === category);
      },

      getJoinedGroups: () => {
        const { whatsappGroups, joinedGroups } = get();
        return whatsappGroups.filter(group => joinedGroups.includes(group.id));
      },

      getAvailableGroups: () => {
        const { whatsappGroups, joinedGroups, blockedGroups } = get();
        return whatsappGroups.filter(group => 
          !joinedGroups.includes(group.id) && 
          !blockedGroups.includes(group.id)
        );
      },

      searchGroups: (query: string) => {
        const { whatsappGroups } = get();
        const lowercaseQuery = query.toLowerCase();
        
        return whatsappGroups.filter(group =>
          group.title.toLowerCase().includes(lowercaseQuery) ||
          group.description.toLowerCase().includes(lowercaseQuery)
        );
      },

      // Discussion management
      updateActiveDiscussions: (discussions: ActiveDiscussion[]) => {
        set({ activeDiscussions: discussions });
      },

      joinDiscussion: (discussionId: string) => {
        const { trackGroupInteraction, activeDiscussions } = get();
        const discussion = activeDiscussions.find(d => d.id === discussionId);
        
        if (discussion) {
          trackGroupInteraction({
            groupId: discussion.groupId,
            type: 'join',
            timestamp: new Date().toISOString(),
            metadata: { discussionId }
          });
        }
      },

      leaveDiscussion: (discussionId: string) => {
        const { trackGroupInteraction, activeDiscussions } = get();
        const discussion = activeDiscussions.find(d => d.id === discussionId);
        
        if (discussion) {
          trackGroupInteraction({
            groupId: discussion.groupId,
            type: 'leave',
            timestamp: new Date().toISOString(),
            metadata: { discussionId }
          });
        }
      },

      // Connection management
      addConnection: (connection: SailingConnection) => {
        set(state => ({
          connections: [...state.connections, connection]
        }));
      },

      removeConnection: (connectionId: string) => {
        set(state => ({
          connections: state.connections.filter(conn => conn.id !== connectionId)
        }));
      },

      updateConnection: (connectionId: string, updates: Partial<SailingConnection>) => {
        set(state => ({
          connections: state.connections.map(conn =>
            conn.id === connectionId ? { ...conn, ...updates } : conn
          )
        }));
      },

      getConnectionsByRole: (role: SailingConnection['role']) => {
        const { connections } = get();
        return connections.filter(conn => conn.role === role);
      },

      // Group invitations
      sendGroupInvitation: async (groupId: string, recipientId: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        // Implementation would send invitation
      },

      respondToInvitation: (groupId: string, accept: boolean) => {
        set(state => ({
          groupInvitations: state.groupInvitations.filter(id => id !== groupId)
        }));
        
        if (accept) {
          get().joinGroup(groupId);
        }
      },

      // Moderation
      reportGroup: async (groupId: string, reason: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        // Implementation would submit report
      },

      blockGroup: (groupId: string) => {
        set(state => ({
          blockedGroups: [...state.blockedGroups, groupId],
          joinedGroups: state.joinedGroups.filter(id => id !== groupId)
        }));
      },

      unblockGroup: (groupId: string) => {
        set(state => ({
          blockedGroups: state.blockedGroups.filter(id => id !== groupId)
        }));
      },

      // Analytics
      getGroupStats: (groupId: string) => {
        const { whatsappGroups, groupInteractions } = get();
        const group = whatsappGroups.find(g => g.id === groupId);
        const interactions = groupInteractions.filter(i => i.groupId === groupId);
        
        if (!group) {
          return { memberGrowth: 0, activityLevel: 'low' as const, engagementScore: 0 };
        }
        
        const memberGrowth = group.memberCount > 100 ? 15 : group.memberCount > 50 ? 8 : 3;
        const activityLevel = group.isActive ? 'high' as const : 
                             group.memberCount > 100 ? 'medium' as const : 'low' as const;
        const engagementScore = Math.min(100, interactions.length * 5 + memberGrowth);
        
        return { memberGrowth, activityLevel, engagementScore };
      },

      // Utility actions
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearSocialData: () => {
        set({
          whatsappGroups: [],
          joinedGroups: [],
          activeDiscussions: [],
          connections: [],
          groupInteractions: [],
          groupInvitations: [],
          blockedGroups: [],
          lastSync: null,
          error: null
        });
      }
    }),
    {
      name: 'dragon-worlds-social',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        whatsappGroups: state.whatsappGroups,
        joinedGroups: state.joinedGroups,
        userMemberships: state.userMemberships,
        accessRequests: state.accessRequests,
        connections: state.connections,
        groupInteractions: state.groupInteractions.slice(-100), // Keep last 100 interactions
        blockedGroups: state.blockedGroups,
        lastSync: state.lastSync
      })
    }
  )
);

// Selectors
export const useWhatsAppGroups = () => useSocialStore(state => state.whatsappGroups);
export const useJoinedGroups = () => useSocialStore(state => {
  const { whatsappGroups, joinedGroups } = state;
  return whatsappGroups.filter(group => joinedGroups.includes(group.id));
}, (a, b) => {
  // Custom equality function to prevent unnecessary re-renders
  return a.length === b.length && a.every((group, index) => group.id === b[index]?.id);
});
export const useActiveDiscussions = () => useSocialStore(state => state.activeDiscussions);
export const useSailingConnections = () => useSocialStore(state => state.connections);
export const useSocialLoading = () => useSocialStore(state => state.loading);
export const useSocialError = () => useSocialStore(state => state.error);

// Computed selectors
export const useGroupsByCategory = (category: GroupCategory) =>
  useSocialStore(state => state.getGroupsByCategory(category));

export const useAvailableGroups = () => 
  useSocialStore(state => {
    const { whatsappGroups, joinedGroups, blockedGroups } = state;
    return whatsappGroups.filter(group => 
      !joinedGroups.includes(group.id) && 
      !blockedGroups.includes(group.id)
    );
  }, (a, b) => {
    // Custom equality function to prevent unnecessary re-renders
    return a.length === b.length && a.every((group, index) => group.id === b[index]?.id);
  });

export const useConnectionsByRole = (role: SailingConnection['role']) =>
  useSocialStore(state => state.getConnectionsByRole(role));

export const useLiveDiscussions = () =>
  useSocialStore(state => state.activeDiscussions.filter(d => d.isLive));

export const useGroupStats = (groupId: string) =>
  useSocialStore(state => state.getGroupStats(groupId));