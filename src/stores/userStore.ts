import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService } from '../services/subscriptionService';
import { errorHandler, handleAPIError, handleSubscriptionError } from '../services/errorHandler';

// New types for enhanced onboarding
export type UserType = 'participant' | 'spectator' | 'vip';
export type OnboardingUserType = 'participant' | 'spectator' | 'official' | 'media';

// TypeScript interfaces
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  country: string;
  countryCode: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  sailingExperience: SailingExperience;
  participantStatus: ParticipantStatus;
  verificationStatus: VerificationStatus;
  lastLogin: string;
  createdAt: string;
  
  // Enhanced onboarding fields
  userType?: UserType;
  onboardingType?: OnboardingUserType;
  needsVerification?: boolean;
  joinedAt?: string;
  preferences?: UserPreferences;
}

export interface SailingExperience {
  yearsExperience: number;
  sailNumber?: string;
  boatClass: string[];
  clubs: SailingClub[];
  certifications: SailingCertification[];
  achievements: Achievement[];
  roles: SailingRole[];
  currentTeam?: string;
}

export interface SailingClub {
  id: string;
  name: string;
  country: string;
  membershipNumber?: string;
  memberSince: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface SailingCertification {
  id: string;
  name: string;
  issuingBody: string;
  level: string;
  dateIssued: string;
  expiryDate?: string;
  certificateNumber?: string;
  isVerified: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  eventName: string;
  position: number;
  year: string;
  category: 'regatta' | 'championship' | 'certification' | 'milestone';
  isVerified: boolean;
}

export interface UserPreferences {
  language: string;
  timeZone: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  display: DisplayPreferences;
  sailing: SailingPreferences;
}

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  raceAlerts: boolean;
  weatherAlerts: boolean;
  socialUpdates: boolean;
  sponsorOffers: boolean;
  systemUpdates: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'participants' | 'private';
  showSailNumber: boolean;
  showClubAffiliation: boolean;
  showAchievements: boolean;
  allowContactFromParticipants: boolean;
  shareDataWithSponsors: boolean;
  includeInDirectory: boolean;
}

export interface DisplayPreferences {
  theme: 'light' | 'dark' | 'auto';
  units: 'metric' | 'imperial';
  windUnits: 'knots' | 'mph' | 'kph' | 'mps';
  temperatureUnit: 'celsius' | 'fahrenheit';
  timeFormat: '12h' | '24h';
  compactMode: boolean;
}

export interface SailingPreferences {
  favoriteClasses: string[];
  interestedRegions: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  sailingInterests: SailingInterest[];
  weatherAlertThresholds: {
    windSpeed: number;
    waveHeight: number;
  };
}

export interface Subscription {
  id: string;
  type: 'basic' | 'professional' | 'elite';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate: string;
  renewalDate?: string;
  paymentMethod?: string;
  isAutoRenew: boolean;
}

export interface SailingConnection {
  id: string;
  userId: string;
  name: string;
  sailNumber?: string;
  country: string;
  relationship: 'teammate' | 'competitor' | 'coach' | 'friend' | 'club-member';
  connectedAt: string;
  mutualConnections: number;
  isVerified: boolean;
}

export type ParticipantStatus = 'competitor' | 'support-crew' | 'coach' | 'official' | 'media' | 'spectator' | 'vendor';
export type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'rejected';
export type SailingRole = 'skipper' | 'crew' | 'tactician' | 'coach' | 'boat-captain' | 'shore-team';
export type SailingInterest = 'fleet-racing' | 'match-racing' | 'team-racing' | 'cruising' | 'ocean-racing';

interface UserState {
  // State
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  subscriptions: Subscription[];
  sailingNetwork: SailingConnection[];
  achievements: Achievement[];
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  lastSync: string | null;
  
  // Enhanced state for onboarding
  userType: UserType | null;
  needsOnboarding: boolean;

  // Authentication
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (userData: Partial<UserProfile>, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // Enhanced onboarding methods
  setUserType: (userType: UserType) => void;
  setProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: (userType: UserType, profile: Partial<UserProfile>) => void;
  
  // Profile management
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<void>;
  verifyParticipant: (credentials: any) => Promise<void>;
  
  // Preferences
  setPreferences: (updates: Partial<UserPreferences>) => void;
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => void;
  updateDisplayPreferences: (updates: Partial<DisplayPreferences>) => void;
  updateSailingPreferences: (updates: Partial<SailingPreferences>) => void;
  
  // Sailing credentials
  addSailingClub: (club: SailingClub) => void;
  removeSailingClub: (clubId: string) => void;
  addCertification: (certification: SailingCertification) => void;
  updateCertification: (certId: string, updates: Partial<SailingCertification>) => void;
  addAchievement: (achievement: Achievement) => void;
  
  // Connections
  addConnection: (connection: SailingConnection) => void;
  removeConnection: (connectionId: string) => void;
  updateConnection: (connectionId: string, updates: Partial<SailingConnection>) => void;
  getConnectionsByType: (relationship: SailingConnection['relationship']) => SailingConnection[];
  
  // Subscriptions
  addSubscription: (subscriptionTierId: string) => Promise<void>;
  updateSubscription: (subscriptionId: string, updates: Partial<Subscription>) => void;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
  getActiveSubscription: () => Subscription | undefined;
  
  // Achievement tracking
  trackAchievement: (achievementData: Partial<Achievement>) => void;
  unlockAchievement: (achievementId: string) => void;
  getAchievementsByCategory: (category: Achievement['category']) => Achievement[];
  
  // Data management
  refreshUserData: () => Promise<void>;
  exportUserData: () => Promise<string>;
  deleteAccount: () => Promise<void>;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearUserData: () => void;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  language: 'en',
  timeZone: 'Asia/Hong_Kong',
  notifications: {
    pushNotifications: true,
    emailNotifications: true,
    raceAlerts: true,
    weatherAlerts: true,
    socialUpdates: false,
    sponsorOffers: false,
    systemUpdates: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  },
  privacy: {
    profileVisibility: 'participants',
    showSailNumber: true,
    showClubAffiliation: true,
    showAchievements: true,
    allowContactFromParticipants: true,
    shareDataWithSponsors: false,
    includeInDirectory: true
  },
  display: {
    theme: 'auto',
    units: 'metric',
    windUnits: 'knots',
    temperatureUnit: 'celsius',
    timeFormat: '24h',
    compactMode: false
  },
  sailing: {
    favoriteClasses: ['Dragon'],
    interestedRegions: ['Asia Pacific'],
    experienceLevel: 'intermediate',
    sailingInterests: ['fleet-racing'],
    weatherAlertThresholds: {
      windSpeed: 25,
      waveHeight: 2.0
    }
  }
};

// Mock API functions
const authenticateUser = async (email: string, password: string): Promise<UserProfile> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock authentication
  if (email === 'test@dragonworlds.com' && password === 'password') {
    return {
      id: 'user-123',
      email,
      firstName: 'John',
      lastName: 'Sailor',
      displayName: 'John Sailor',
      country: 'Hong Kong',
      countryCode: 'HK',
      sailingExperience: {
        yearsExperience: 15,
        sailNumber: 'HKG 42',
        boatClass: ['Dragon', 'J/70'],
        clubs: [
          {
            id: 'rhkyc',
            name: 'Royal Hong Kong Yacht Club',
            country: 'Hong Kong',
            membershipNumber: 'M12345',
            memberSince: '2010-01-01',
            isActive: true,
            isVerified: true
          }
        ],
        certifications: [
          {
            id: 'cert-1',
            name: 'Yachtmaster',
            issuingBody: 'RYA',
            level: 'Offshore',
            dateIssued: '2015-06-01',
            isVerified: true
          }
        ],
        achievements: [],
        roles: ['skipper', 'tactician'],
        currentTeam: 'Dragon Racing HK'
      },
      participantStatus: 'competitor',
      verificationStatus: 'verified',
      lastLogin: new Date().toISOString(),
      createdAt: '2020-01-01T00:00:00Z'
    };
  }
  
  throw new Error('Invalid credentials');
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial State
      profile: null,
      preferences: null,
      subscriptions: [],
      sailingNetwork: [],
      achievements: [],
      isAuthenticated: false,
      loading: false,
      error: null,
      lastSync: null,
      
      // Enhanced onboarding state
      userType: null,
      needsOnboarding: true,

      // Authentication
      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null });
        
        try {
          const userProfile = await authenticateUser(email, password);
          
          // Load subscription data after authentication
          const subscriptionStatus = subscriptionService.getSubscriptionStatus();
          const subscriptions: Subscription[] = [];
          
          if (subscriptionStatus) {
            subscriptions.push({
              id: `sub_${subscriptionStatus.currentTier}`,
              type: subscriptionStatus.currentTier,
              status: subscriptionStatus.status,
              startDate: subscriptionStatus.startDate,
              endDate: subscriptionStatus.endDate,
              isAutoRenew: subscriptionStatus.isAutoRenew
            });
          }
          
          set({
            profile: userProfile,
            preferences: defaultPreferences,
            subscriptions,
            isAuthenticated: true,
            loading: false,
            error: null,
            lastSync: new Date().toISOString()
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          handleAPIError(error, 'userStore.signIn');
          
          set({
            loading: false,
            error: errorMessage,
            isAuthenticated: false
          });
        }
      },

      signOut: () => {
        set({
          profile: null,
          preferences: null,
          subscriptions: [],
          sailingNetwork: [],
          achievements: [],
          isAuthenticated: false,
          error: null,
          lastSync: null,
          userType: null,
          needsOnboarding: true
        });
      },

      signUp: async (userData: Partial<UserProfile>, password: string) => {
        set({ loading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const newProfile: UserProfile = {
            id: `user-${Date.now()}`,
            email: userData.email || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`,
            country: userData.country || '',
            countryCode: userData.countryCode || '',
            sailingExperience: userData.sailingExperience || {
              yearsExperience: 0,
              boatClass: [],
              clubs: [],
              certifications: [],
              achievements: [],
              roles: []
            },
            participantStatus: userData.participantStatus || 'spectator',
            verificationStatus: 'unverified',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };
          
          set({
            profile: newProfile,
            preferences: defaultPreferences,
            isAuthenticated: true,
            loading: false,
            error: null
          });
        } catch (error) {
          set({
            loading: false,
            error: 'Failed to create account'
          });
        }
      },

      resetPassword: async (email: string) => {
        set({ loading: true });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({ loading: false, error: null });
        } catch (error) {
          set({
            loading: false,
            error: 'Failed to send reset email'
          });
        }
      },

      // Enhanced onboarding methods
      setUserType: (userType: UserType) => {
        set({ userType });
      },

      setProfile: (profileUpdates: Partial<UserProfile>) => {
        set(state => ({
          profile: state.profile 
            ? { ...state.profile, ...profileUpdates }
            : {
                id: `temp_${Date.now()}`,
                email: '',
                firstName: '',
                lastName: '',
                displayName: '',
                country: '',
                countryCode: '',
                sailingExperience: {
                  yearsExperience: 0,
                  boatClass: [],
                  clubs: [],
                  certifications: [],
                  achievements: [],
                  roles: []
                },
                participantStatus: 'spectator',
                verificationStatus: 'unverified',
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                ...profileUpdates
              }
        }));
      },

      completeOnboarding: (userType: UserType, profileData: Partial<UserProfile>) => {
        set(state => ({
          userType,
          needsOnboarding: false,
          profile: state.profile 
            ? { ...state.profile, userType, ...profileData }
            : {
                id: `user_${Date.now()}`,
                email: profileData.email || '',
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                displayName: profileData.displayName || '',
                country: profileData.country || 'Hong Kong',
                countryCode: profileData.countryCode || 'HK',
                sailingExperience: profileData.sailingExperience || {
                  yearsExperience: 0,
                  boatClass: [],
                  clubs: [],
                  certifications: [],
                  achievements: [],
                  roles: []
                },
                participantStatus: profileData.participantStatus || 'spectator',
                verificationStatus: profileData.verificationStatus || 'unverified',
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                userType,
                ...profileData
              },
          preferences: state.preferences || defaultPreferences,
          isAuthenticated: true,
          lastSync: new Date().toISOString()
        }));
      },

      // Profile management
      updateProfile: async (updates: Partial<UserProfile>) => {
        set({ loading: true });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
            loading: false,
            error: null,
            lastSync: new Date().toISOString()
          }));
        } catch (error) {
          set({
            loading: false,
            error: 'Failed to update profile'
          });
        }
      },

      uploadAvatar: async (imageUri: string) => {
        set({ loading: true });
        
        try {
          // Simulate upload
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          set(state => ({
            profile: state.profile ? { ...state.profile, avatar: imageUri } : null,
            loading: false,
            error: null
          }));
        } catch (error) {
          set({
            loading: false,
            error: 'Failed to upload avatar'
          });
        }
      },

      verifyParticipant: async (credentials: any) => {
        set({ loading: true });
        
        try {
          const profile = get().profile;
          if (!profile) {
            throw new Error('User profile not found');
          }
          
          const result = await subscriptionService.verifyParticipant(
            'dragon-worlds-2027',
            'competitor',
            credentials,
            profile.sailingExperience?.sailNumber
          );
          
          if (result.success) {
            set(state => ({
              profile: state.profile 
                ? { ...state.profile, verificationStatus: 'verified' as const }
                : null,
              loading: false,
              error: null
            }));
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Verification failed';
          handleAPIError(error, 'userStore.verifyParticipant');
          
          set({
            loading: false,
            error: errorMessage
          });
        }
      },

      // Preferences
      setPreferences: (updates: Partial<UserPreferences>) => {
        set(state => ({
          preferences: state.preferences 
            ? { ...state.preferences, ...updates }
            : { ...defaultPreferences, ...updates }
        }));
      },

      updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => {
        set(state => ({
          preferences: state.preferences
            ? {
                ...state.preferences,
                notifications: { ...state.preferences.notifications, ...updates }
              }
            : defaultPreferences
        }));
      },

      updatePrivacySettings: (updates: Partial<PrivacySettings>) => {
        set(state => ({
          preferences: state.preferences
            ? {
                ...state.preferences,
                privacy: { ...state.preferences.privacy, ...updates }
              }
            : defaultPreferences
        }));
      },

      updateDisplayPreferences: (updates: Partial<DisplayPreferences>) => {
        set(state => ({
          preferences: state.preferences
            ? {
                ...state.preferences,
                display: { ...state.preferences.display, ...updates }
              }
            : defaultPreferences
        }));
      },

      updateSailingPreferences: (updates: Partial<SailingPreferences>) => {
        set(state => ({
          preferences: state.preferences
            ? {
                ...state.preferences,
                sailing: { ...state.preferences.sailing, ...updates }
              }
            : defaultPreferences
        }));
      },

      // Sailing credentials
      addSailingClub: (club: SailingClub) => {
        set(state => ({
          profile: state.profile
            ? {
                ...state.profile,
                sailingExperience: {
                  ...state.profile.sailingExperience,
                  clubs: [...state.profile.sailingExperience.clubs, club]
                }
              }
            : null
        }));
      },

      removeSailingClub: (clubId: string) => {
        set(state => ({
          profile: state.profile
            ? {
                ...state.profile,
                sailingExperience: {
                  ...state.profile.sailingExperience,
                  clubs: state.profile.sailingExperience.clubs.filter(club => club.id !== clubId)
                }
              }
            : null
        }));
      },

      addCertification: (certification: SailingCertification) => {
        set(state => ({
          profile: state.profile
            ? {
                ...state.profile,
                sailingExperience: {
                  ...state.profile.sailingExperience,
                  certifications: [...state.profile.sailingExperience.certifications, certification]
                }
              }
            : null
        }));
      },

      updateCertification: (certId: string, updates: Partial<SailingCertification>) => {
        set(state => ({
          profile: state.profile
            ? {
                ...state.profile,
                sailingExperience: {
                  ...state.profile.sailingExperience,
                  certifications: state.profile.sailingExperience.certifications.map(cert =>
                    cert.id === certId ? { ...cert, ...updates } : cert
                  )
                }
              }
            : null
        }));
      },

      addAchievement: (achievement: Achievement) => {
        set(state => ({
          achievements: [...state.achievements, achievement],
          profile: state.profile
            ? {
                ...state.profile,
                sailingExperience: {
                  ...state.profile.sailingExperience,
                  achievements: [...state.profile.sailingExperience.achievements, achievement]
                }
              }
            : null
        }));
      },

      // Connections
      addConnection: (connection: SailingConnection) => {
        set(state => ({
          sailingNetwork: [...state.sailingNetwork, connection]
        }));
      },

      removeConnection: (connectionId: string) => {
        set(state => ({
          sailingNetwork: state.sailingNetwork.filter(conn => conn.id !== connectionId)
        }));
      },

      updateConnection: (connectionId: string, updates: Partial<SailingConnection>) => {
        set(state => ({
          sailingNetwork: state.sailingNetwork.map(conn =>
            conn.id === connectionId ? { ...conn, ...updates } : conn
          )
        }));
      },

      getConnectionsByType: (relationship: SailingConnection['relationship']) => {
        const { sailingNetwork } = get();
        return sailingNetwork.filter(conn => conn.relationship === relationship);
      },

      // Subscriptions
      addSubscription: async (subscriptionTierId: string) => {
        set({ loading: true });
        
        try {
          const result = await subscriptionService.purchaseSubscription(subscriptionTierId as any);
          
          if (result.success) {
            const subscriptionStatus = subscriptionService.getSubscriptionStatus();
            if (subscriptionStatus) {
              const subscription: Subscription = {
                id: `sub_${Date.now()}`,
                type: subscriptionStatus.currentTier,
                status: subscriptionStatus.status,
                startDate: subscriptionStatus.startDate,
                endDate: subscriptionStatus.endDate,
                isAutoRenew: subscriptionStatus.isAutoRenew
              };
              
              set(state => ({
                subscriptions: [...state.subscriptions, subscription],
                loading: false,
                error: null
              }));
            }
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add subscription';
          handleSubscriptionError(error, 'userStore.addSubscription');
          
          set({
            loading: false,
            error: errorMessage
          });
        }
      },

      updateSubscription: (subscriptionId: string, updates: Partial<Subscription>) => {
        set(state => ({
          subscriptions: state.subscriptions.map(sub =>
            sub.id === subscriptionId ? { ...sub, ...updates } : sub
          )
        }));
      },

      cancelSubscription: async (subscriptionId: string) => {
        set({ loading: true });
        
        try {
          // In a real implementation, this would call the subscription service cancel method
          set(state => ({
            subscriptions: state.subscriptions.map(sub =>
              sub.id === subscriptionId 
                ? { ...sub, status: 'cancelled' as const, isAutoRenew: false }
                : sub
            ),
            loading: false,
            error: null
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
          handleSubscriptionError(error, 'userStore.cancelSubscription');
          
          set({
            loading: false,
            error: errorMessage
          });
        }
      },

      getActiveSubscription: () => {
        try {
          const subscriptionStatus = subscriptionService.getSubscriptionStatus();
          if (subscriptionStatus && subscriptionStatus.status === 'active') {
            return {
              id: `sub_${subscriptionStatus.currentTier}`,
              type: subscriptionStatus.currentTier,
              status: subscriptionStatus.status,
              startDate: subscriptionStatus.startDate,
              endDate: subscriptionStatus.endDate,
              isAutoRenew: subscriptionStatus.isAutoRenew
            } as Subscription;
          }
          return undefined;
        } catch (error) {
          errorHandler.logError({
            type: 'subscription',
            severity: 'low',
            message: 'Failed to get active subscription',
            source: 'userStore.getActiveSubscription',
            retryable: false
          });
          return undefined;
        }
      },

      // Achievement tracking
      trackAchievement: (achievementData: Partial<Achievement>) => {
        const newAchievement: Achievement = {
          id: `achievement-${Date.now()}`,
          title: achievementData.title || '',
          description: achievementData.description || '',
          eventName: achievementData.eventName || '',
          position: achievementData.position || 0,
          year: achievementData.year || new Date().getFullYear().toString(),
          category: achievementData.category || 'milestone',
          isVerified: false,
          ...achievementData
        };
        
        get().addAchievement(newAchievement);
      },

      unlockAchievement: (achievementId: string) => {
        set(state => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === achievementId 
              ? { ...achievement, isVerified: true }
              : achievement
          )
        }));
      },

      getAchievementsByCategory: (category: Achievement['category']) => {
        const { achievements } = get();
        return achievements.filter(achievement => achievement.category === category);
      },

      // Data management
      refreshUserData: async () => {
        const { profile } = get();
        if (!profile) return;
        
        set({ loading: true });
        
        try {
          // Refresh subscription status from service
          const subscriptionStatus = subscriptionService.getSubscriptionStatus();
          const participantVerification = subscriptionService.getParticipantVerification();
          
          // Update user state with latest subscription information
          const updatedSubscriptions: Subscription[] = [];
          if (subscriptionStatus) {
            updatedSubscriptions.push({
              id: `sub_${subscriptionStatus.currentTier}`,
              type: subscriptionStatus.currentTier,
              status: subscriptionStatus.status,
              startDate: subscriptionStatus.startDate,
              endDate: subscriptionStatus.endDate,
              isAutoRenew: subscriptionStatus.isAutoRenew
            });
          }
          
          // Update verification status if applicable
          const updatedProfile = participantVerification 
            ? { ...profile, verificationStatus: participantVerification.status as VerificationStatus }
            : profile;
          
          set({
            profile: updatedProfile,
            subscriptions: updatedSubscriptions,
            loading: false,
            error: null,
            lastSync: new Date().toISOString()
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh user data';
          handleAPIError(error, 'userStore.refreshUserData');
          
          set({
            loading: false,
            error: errorMessage
          });
        }
      },

      exportUserData: async () => {
        const { profile, preferences, subscriptions, sailingNetwork, achievements } = get();
        
        const exportData = {
          profile,
          preferences,
          subscriptions,
          sailingNetwork,
          achievements,
          exportedAt: new Date().toISOString()
        };
        
        return JSON.stringify(exportData, null, 2);
      },

      deleteAccount: async () => {
        set({ loading: true });
        
        try {
          // Simulate account deletion
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          get().clearUserData();
        } catch (error) {
          set({
            loading: false,
            error: 'Failed to delete account'
          });
        }
      },

      // Utility actions
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
        
        if (error) {
          errorHandler.logError({
            type: 'general',
            severity: 'medium',
            message: error,
            source: 'userStore.setError',
            retryable: false,
            userFacing: true
          });
        }
      },

      clearUserData: () => {
        set({
          profile: null,
          preferences: null,
          subscriptions: [],
          sailingNetwork: [],
          achievements: [],
          isAuthenticated: false,
          error: null,
          lastSync: null
        });
      }
    }),
    {
      name: 'dragon-worlds-user',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        preferences: state.preferences,
        subscriptions: state.subscriptions,
        sailingNetwork: state.sailingNetwork,
        achievements: state.achievements,
        isAuthenticated: state.isAuthenticated,
        lastSync: state.lastSync,
        userType: state.userType,
        needsOnboarding: state.needsOnboarding
      })
    }
  )
);

// Selectors
export const useUserProfile = () => useUserStore(state => state.profile);
export const useUserPreferences = () => useUserStore(state => state.preferences);
export const useIsAuthenticated = () => useUserStore(state => state.isAuthenticated);
export const useSailingNetwork = () => useUserStore(state => state.sailingNetwork);
export const useUserAchievements = () => useUserStore(state => state.achievements);
export const useUserLoading = () => useUserStore(state => state.loading);
export const useUserError = () => useUserStore(state => state.error);

// Computed selectors
export const useActiveSubscription = () => useUserStore(state => state.getActiveSubscription());
export const useConnectionsByType = (relationship: SailingConnection['relationship']) =>
  useUserStore(state => state.getConnectionsByType(relationship));
export const useAchievementsByCategory = (category: Achievement['category']) =>
  useUserStore(state => state.getAchievementsByCategory(category));

export const useUserSailingExperience = () => 
  useUserStore(state => state.profile?.sailingExperience);

export const useVerificationStatus = () =>
  useUserStore(state => state.profile?.verificationStatus);

export const useParticipantStatus = () =>
  useUserStore(state => state.profile?.participantStatus);

// Enhanced selectors for onboarding
export const useUserType = () => useUserStore(state => state.userType);
export const useNeedsOnboarding = () => useUserStore(state => state.needsOnboarding);
export const useOnboardingType = () => useUserStore(state => state.profile?.onboardingType);
export const useNeedsVerification = () => useUserStore(state => state.profile?.needsVerification);