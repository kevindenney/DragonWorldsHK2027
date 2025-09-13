import { UserStore } from '../stores/userStore';

export interface WhatsAppGroup {
  id: string;
  name: string;
  description: string;
  type: 'participant' | 'spectator' | 'vip' | 'official' | 'general';
  accessLevel: 'open' | 'verified' | 'invite_only' | 'vip_only';
  memberCount: number;
  maxMembers?: number;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
  groupLink?: string;
  inviteCode?: string;
  moderators: string[];
  tags: string[];
  sponsor?: 'HSBC' | 'Sino_Group' | 'BMW' | 'Garmin';
  verificationRequired: {
    hsbc?: boolean;
    sino?: boolean;
    sailingCredentials?: boolean;
    eventRegistration?: boolean;
  };
  features: {
    liveCommentary: boolean;
    raceUpdates: boolean;
    weatherAlerts: boolean;
    socialChat: boolean;
    photoSharing: boolean;
    eventAnnouncements: boolean;
  };
}

export interface UserGroupMembership {
  groupId: string;
  userId: string;
  status: 'member' | 'pending' | 'invited' | 'banned' | 'left';
  joinedAt?: string;
  role: 'member' | 'moderator' | 'admin';
  permissions: {
    canPost: boolean;
    canInvite: boolean;
    canModerate: boolean;
  };
  muteUntil?: string;
  lastSeen?: string;
}

export interface GroupAccessRequest {
  id: string;
  groupId: string;
  userId: string;
  requestType: 'join_request' | 'invite_request' | 'verification_request';
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  verificationData?: {
    sailingCredentials?: any;
    hsbcAccount?: any;
    sinoGuestStatus?: any;
    eventRegistration?: any;
  };
  message?: string;
  adminNotes?: string;
}

export interface RaceComment {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  userType: 'participant' | 'spectator' | 'vip' | 'official';
  message: string;
  timestamp: string;
  type: 'text' | 'photo' | 'race_update' | 'weather_alert' | 'announcement';
  raceId?: string;
  attachments?: {
    type: 'photo' | 'video' | 'location';
    url: string;
    thumbnail?: string;
  }[];
  reactions: {
    [emoji: string]: string[]; // emoji -> array of user IDs
  };
  replies?: RaceComment[];
  isOfficial?: boolean;
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: string;
}

export interface WhatsAppServiceConfig {
  baseUrl: string;
  apiKey: string;
  businessAccountId: string;
  webhookSecret: string;
  maxGroupSize: number;
}

class WhatsAppService {
  private config: WhatsAppServiceConfig;
  private userStore?: typeof UserStore;

  constructor(userStore?: typeof UserStore) {
    this.userStore = userStore;
    this.config = {
      baseUrl: process.env.EXPO_PUBLIC_WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      apiKey: process.env.EXPO_PUBLIC_WHATSAPP_API_KEY || 'demo_key',
      businessAccountId: process.env.EXPO_PUBLIC_WHATSAPP_BUSINESS_ID || 'demo_business_id',
      webhookSecret: process.env.EXPO_PUBLIC_WHATSAPP_WEBHOOK_SECRET || 'demo_secret',
      maxGroupSize: 256
    };
  }

  /**
   * Get available WhatsApp groups based on user type and verification status
   */
  async getAvailableGroups(): Promise<WhatsAppGroup[]> {
    try {
      const user = this.userStore?.getState();
      
      // Demo groups for Dragon Worlds HK 2027
      const allGroups: WhatsAppGroup[] = [
        // Participant Groups
        {
          id: 'dragon_worlds_participants',
          name: 'Dragon Worlds 2027 - Participants',
          description: 'Official group for registered competitors in Dragon Worlds HK 2027. Race updates, weather, and competitor discussions.',
          type: 'participant',
          accessLevel: 'verified',
          memberCount: 89,
          maxMembers: 120,
          isActive: true,
          createdAt: '2024-11-01T00:00:00Z',
          lastActivity: new Date().toISOString(),
          moderators: ['race_director', 'sailing_coordinator'],
          tags: ['official', 'competitors', 'race-updates'],
          verificationRequired: {
            eventRegistration: true,
            sailingCredentials: true
          },
          features: {
            liveCommentary: true,
            raceUpdates: true,
            weatherAlerts: true,
            socialChat: true,
            photoSharing: true,
            eventAnnouncements: true
          }
        },
        {
          id: 'dragon_worlds_fleet_captains',
          name: 'Fleet Captains & Officials',
          description: 'Private group for fleet captains, race officials, and event organizers.',
          type: 'official',
          accessLevel: 'invite_only',
          memberCount: 12,
          maxMembers: 20,
          isActive: true,
          createdAt: '2024-10-15T00:00:00Z',
          lastActivity: new Date().toISOString(),
          moderators: ['race_director'],
          tags: ['officials', 'private', 'coordination'],
          verificationRequired: {
            eventRegistration: true,
            sailingCredentials: true
          },
          features: {
            liveCommentary: false,
            raceUpdates: true,
            weatherAlerts: true,
            socialChat: true,
            photoSharing: false,
            eventAnnouncements: true
          }
        },

        // VIP Groups
        {
          id: 'hsbc_premier_vip',
          name: 'HSBC Premier VIP Experience',
          description: 'Exclusive group for HSBC Premier clients attending Dragon Worlds. VIP services, hospitality updates, and premium experiences.',
          type: 'vip',
          accessLevel: 'vip_only',
          memberCount: 24,
          maxMembers: 50,
          isActive: true,
          createdAt: '2024-11-01T00:00:00Z',
          lastActivity: new Date().toISOString(),
          sponsor: 'HSBC',
          moderators: ['hsbc_concierge', 'event_coordinator'],
          tags: ['vip', 'hsbc', 'premier', 'hospitality'],
          verificationRequired: {
            hsbc: true
          },
          features: {
            liveCommentary: true,
            raceUpdates: true,
            weatherAlerts: false,
            socialChat: true,
            photoSharing: true,
            eventAnnouncements: true
          }
        },
        {
          id: 'sino_group_guests',
          name: 'Sino Group VIP Hospitality',
          description: 'Premium hospitality group for Sino Group guests. Luxury experiences, concierge services, and exclusive access.',
          type: 'vip',
          accessLevel: 'vip_only',
          memberCount: 18,
          maxMembers: 40,
          isActive: true,
          createdAt: '2024-11-01T00:00:00Z',
          lastActivity: new Date().toISOString(),
          sponsor: 'Sino_Group',
          moderators: ['sino_concierge', 'hospitality_manager'],
          tags: ['vip', 'sino', 'luxury', 'concierge'],
          verificationRequired: {
            sino: true
          },
          features: {
            liveCommentary: true,
            raceUpdates: true,
            weatherAlerts: false,
            socialChat: true,
            photoSharing: true,
            eventAnnouncements: true
          }
        },

        // Spectator Groups
        {
          id: 'dragon_worlds_spectators',
          name: 'Dragon Worlds 2027 - Spectators',
          description: 'Open group for sailing fans and spectators following Dragon Worlds HK 2027. Race commentary and community discussion.',
          type: 'spectator',
          accessLevel: 'open',
          memberCount: 342,
          maxMembers: 500,
          isActive: true,
          createdAt: '2024-11-01T00:00:00Z',
          lastActivity: new Date().toISOString(),
          moderators: ['community_manager', 'sailing_enthusiast'],
          tags: ['spectators', 'fans', 'community', 'open'],
          verificationRequired: {},
          features: {
            liveCommentary: true,
            raceUpdates: true,
            weatherAlerts: false,
            socialChat: true,
            photoSharing: true,
            eventAnnouncements: true
          }
        },
        {
          id: 'sailing_photographers',
          name: 'Dragon Worlds Photography',
          description: 'Group for photographers and media covering the event. Share photos, coordinate coverage, and discuss sailing photography.',
          type: 'spectator',
          accessLevel: 'verified',
          memberCount: 28,
          maxMembers: 50,
          isActive: true,
          createdAt: '2024-10-20T00:00:00Z',
          lastActivity: new Date().toISOString(),
          moderators: ['lead_photographer'],
          tags: ['photography', 'media', 'coverage'],
          verificationRequired: {},
          features: {
            liveCommentary: false,
            raceUpdates: true,
            weatherAlerts: false,
            socialChat: true,
            photoSharing: true,
            eventAnnouncements: false
          }
        },

        // General Groups
        {
          id: 'hong_kong_sailing',
          name: 'Hong Kong Sailing Community',
          description: 'General group for the Hong Kong sailing community. Discuss local sailing, events, and connect with fellow sailors.',
          type: 'general',
          accessLevel: 'open',
          memberCount: 156,
          isActive: true,
          createdAt: '2024-09-01T00:00:00Z',
          lastActivity: new Date().toISOString(),
          moderators: ['community_admin'],
          tags: ['community', 'hong-kong', 'sailing', 'general'],
          verificationRequired: {},
          features: {
            liveCommentary: false,
            raceUpdates: false,
            weatherAlerts: true,
            socialChat: true,
            photoSharing: true,
            eventAnnouncements: false
          }
        }
      ];

      // Filter groups based on user access
      return allGroups.filter(group => this.canUserAccessGroup(group, user));
    } catch (error) {
      console.error('Error fetching WhatsApp groups:', error);
      throw new Error('Failed to load WhatsApp groups');
    }
  }

  /**
   * Check if user can access a specific group
   */
  private canUserAccessGroup(group: WhatsAppGroup, user: any): boolean {
    // Open groups are accessible to everyone
    if (group.accessLevel === 'open') {
      return true;
    }

    // VIP-only groups require VIP status
    if (group.accessLevel === 'vip_only' && user?.userType !== 'vip') {
      return false;
    }

    // Check sponsor-specific requirements
    if (group.sponsor === 'HSBC' && group.verificationRequired.hsbc) {
      return user?.profile?.hsbc?.isPremier === true;
    }

    if (group.sponsor === 'Sino_Group' && group.verificationRequired.sino) {
      return user?.profile?.sino?.isGuest === true;
    }

    // Check event registration requirement
    if (group.verificationRequired.eventRegistration && user?.userType !== 'participant') {
      return false;
    }

    // Check sailing credentials requirement
    if (group.verificationRequired.sailingCredentials) {
      return user?.profile?.sailing?.hasCredentials === true || user?.userType === 'participant';
    }

    return true;
  }

  /**
   * Request access to a group
   */
  async requestGroupAccess(groupId: string, message?: string): Promise<GroupAccessRequest> {
    try {
      const user = this.userStore?.getState();
      
      const request: GroupAccessRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        groupId,
        userId: user?.id || 'demo_user',
        requestType: 'join_request',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        message,
        verificationData: {
          sailingCredentials: user?.profile?.sailing,
          hsbcAccount: user?.profile?.hsbc,
          sinoGuestStatus: user?.profile?.sino,
          eventRegistration: user?.userType === 'participant'
        }
      };

      // In a real implementation, this would send the request to WhatsApp Business API
      console.log('Group access request created:', request);
      
      return request;
    } catch (error) {
      console.error('Error requesting group access:', error);
      throw new Error('Failed to request group access');
    }
  }

  /**
   * Join a group directly (for open groups)
   */
  async joinGroup(groupId: string): Promise<UserGroupMembership> {
    try {
      const user = this.userStore?.getState();
      
      const membership: UserGroupMembership = {
        groupId,
        userId: user?.id || 'demo_user',
        status: 'member',
        joinedAt: new Date().toISOString(),
        role: 'member',
        permissions: {
          canPost: true,
          canInvite: false,
          canModerate: false
        }
      };

      // In a real implementation, this would use WhatsApp Business API
      console.log('Joined group:', membership);
      
      return membership;
    } catch (error) {
      console.error('Error joining group:', error);
      throw new Error('Failed to join group');
    }
  }

  /**
   * Get user's group memberships
   */
  async getUserGroups(): Promise<UserGroupMembership[]> {
    try {
      const user = this.userStore?.getState();
      
      // Demo memberships based on user type
      const memberships: UserGroupMembership[] = [];
      
      if (user?.userType === 'participant') {
        memberships.push({
          groupId: 'dragon_worlds_participants',
          userId: user?.id || 'demo_user',
          status: 'member',
          joinedAt: '2024-11-01T10:00:00Z',
          role: 'member',
          permissions: {
            canPost: true,
            canInvite: false,
            canModerate: false
          }
        });
      }
      
      if (user?.userType === 'vip' && user?.profile?.hsbc?.isPremier) {
        memberships.push({
          groupId: 'hsbc_premier_vip',
          userId: user?.id || 'demo_user',
          status: 'member',
          joinedAt: '2024-11-01T12:00:00Z',
          role: 'member',
          permissions: {
            canPost: true,
            canInvite: false,
            canModerate: false
          }
        });
      }

      // Everyone can join spectator groups
      memberships.push({
        groupId: 'dragon_worlds_spectators',
        userId: user?.id || 'demo_user',
        status: 'member',
        joinedAt: '2024-11-02T08:00:00Z',
        role: 'member',
        permissions: {
          canPost: true,
          canInvite: false,
          canModerate: false
        }
      });

      return memberships;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw new Error('Failed to load user groups');
    }
  }

  /**
   * Get recent comments from user's groups
   */
  async getGroupComments(groupId: string, limit: number = 50): Promise<RaceComment[]> {
    try {
      // Demo comments for different groups
      const demoComments: RaceComment[] = [
        {
          id: 'comment_1',
          groupId,
          userId: 'user_race_director',
          username: 'Race Director',
          userType: 'official',
          message: '📢 Race 3 starting in 15 minutes! Wind conditions: 12-15 knots from the northeast.',
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          type: 'announcement',
          reactions: { '⛵': ['user_1', 'user_2'], '👍': ['user_3'] },
          isOfficial: true,
          isPinned: true
        },
        {
          id: 'comment_2',
          groupId,
          userId: 'user_participant_1',
          username: 'Sarah Chen',
          userType: 'participant',
          message: 'Great conditions out there! Wind shift on the right side of the course 🌊',
          timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          type: 'text',
          reactions: { '💨': ['user_4', 'user_5'] }
        },
        {
          id: 'comment_3',
          groupId,
          userId: 'user_spectator_1',
          username: 'Mike Wong',
          userType: 'spectator',
          message: 'Amazing start sequence! Can someone share the current standings?',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          type: 'text',
          reactions: { '❓': ['user_6'] }
        },
        {
          id: 'comment_4',
          groupId,
          userId: 'user_weather_bot',
          username: 'PredictWind Bot',
          userType: 'official',
          message: '🌤️ Weather Update: Wind backing to ENE 10-14 knots. Next weather window in 2 hours.',
          timestamp: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
          type: 'weather_alert',
          isOfficial: true
        }
      ];

      return demoComments.slice(0, limit);
    } catch (error) {
      console.error('Error fetching group comments:', error);
      throw new Error('Failed to load group comments');
    }
  }

  /**
   * Post a comment to a group
   */
  async postComment(groupId: string, message: string, type: 'text' | 'photo' = 'text'): Promise<RaceComment> {
    try {
      const user = this.userStore?.getState();
      
      const comment: RaceComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        groupId,
        userId: user?.id || 'demo_user',
        username: user?.profile?.name || 'Anonymous',
        userType: user?.userType || 'spectator',
        message,
        timestamp: new Date().toISOString(),
        type,
        reactions: {}
      };

      // In a real implementation, this would use WhatsApp Business API
      console.log('Comment posted:', comment);
      
      return comment;
    } catch (error) {
      console.error('Error posting comment:', error);
      throw new Error('Failed to post comment');
    }
  }

  /**
   * Generate invite link for a group
   */
  async generateInviteLink(groupId: string): Promise<string> {
    try {
      // In a real implementation, this would generate a WhatsApp group invite link
      const inviteCode = Math.random().toString(36).substr(2, 12);
      return `https://chat.whatsapp.com/${inviteCode}`;
    } catch (error) {
      console.error('Error generating invite link:', error);
      throw new Error('Failed to generate invite link');
    }
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId: string): Promise<void> {
    try {
      const user = this.userStore?.getState();
      
      // In a real implementation, this would use WhatsApp Business API
      console.log(`User ${user?.id} left group ${groupId}`);
    } catch (error) {
      console.error('Error leaving group:', error);
      throw new Error('Failed to leave group');
    }
  }
}

export default WhatsAppService;