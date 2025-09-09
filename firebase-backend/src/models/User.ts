import { Timestamp } from 'firebase-admin/firestore';

/**
 * User role enum
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin'
}

/**
 * User status enum
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

/**
 * Authentication provider enum
 */
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
  GITHUB = 'github'
}

/**
 * OAuth provider data interface
 */
export interface IOAuthProviderData {
  providerId: string;
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  linkedAt: Timestamp;
  lastUsed: Timestamp;
  metadata?: {
    scope?: string[];
    locale?: string;
    verified_email?: boolean;
    family_name?: string;
    given_name?: string;
    hd?: string; // Google hosted domain
    [key: string]: any;
  };
}

/**
 * Linked provider account interface
 */
export interface ILinkedProvider {
  provider: AuthProvider;
  providerId: string;
  providerUid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  linkedAt: Timestamp;
  lastUsed: Timestamp;
  isVerified: boolean;
  isPrimary: boolean;
  canUnlink: boolean;
  metadata?: any;
}

/**
 * OAuth account linking request interface
 */
export interface IOAuthLinkingRequest {
  userId: string;
  provider: AuthProvider;
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
  linkExistingAccount?: boolean;
}

/**
 * Provider-specific profile data
 */
export interface IProviderProfile {
  google?: {
    id: string;
    verified_email: boolean;
    given_name?: string;
    family_name?: string;
    locale?: string;
    hd?: string; // Hosted domain
  };
  apple?: {
    sub: string;
    email_verified?: string;
    is_private_email?: string;
    real_user_status?: number;
  };
  facebook?: {
    id: string;
    first_name?: string;
    last_name?: string;
    verified?: boolean;
    locale?: string;
  };
  github?: {
    id: number;
    login: string;
    name?: string;
    company?: string;
    location?: string;
    bio?: string;
    public_repos?: number;
    followers?: number;
    following?: number;
  };
}

/**
 * Base user interface (what we store in Firestore)
 */
export interface IUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  role: UserRole;
  status: UserStatus;
  providers: AuthProvider[];
  
  // OAuth provider data
  linkedProviders: ILinkedProvider[];
  providerProfiles: IProviderProfile;
  primaryProvider: AuthProvider;
  
  // Profile information
  profile: {
    bio?: string;
    website?: string;
    location?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    timezone?: string;
    language?: string;
  };
  
  // Preferences
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisible: boolean;
      emailVisible: boolean;
      phoneVisible: boolean;
      allowProviderLinking: boolean;
      allowDataSync: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
    oauth: {
      autoSyncProfile: boolean;
      allowMultipleAccounts: boolean;
      preferredProvider?: AuthProvider;
    };
  };
  
  // Metadata
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLoginAt?: Timestamp;
    lastActiveAt?: Timestamp;
    loginCount: number;
    ipAddress?: string;
    userAgent?: string;
  };
  
  // Custom claims for Firebase Auth
  customClaims?: {
    role: UserRole;
    permissions: string[];
    [key: string]: any;
  };
  
  // Additional data
  tags?: string[];
  notes?: string; // Admin notes
  isDeleted: boolean;
}

/**
 * User creation interface (for creating new users)
 */
export interface ICreateUser {
  email: string;
  password?: string; // Optional for OAuth-only users
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  role?: UserRole;
  profile?: Partial<IUser['profile']>;
  preferences?: Partial<IUser['preferences']>;
  provider?: AuthProvider;
  providerData?: IOAuthProviderData;
}

/**
 * OAuth user creation interface
 */
export interface ICreateOAuthUser {
  provider: AuthProvider;
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
  userData: {
    email: string;
    displayName: string;
    photoURL?: string;
    emailVerified?: boolean;
  };
  providerData: any;
  role?: UserRole;
}

/**
 * User update interface (for updating existing users)
 */
export interface IUpdateUser {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  profile?: Partial<IUser['profile']>;
  preferences?: Partial<IUser['preferences']>;
  role?: UserRole;
  status?: UserStatus;
  tags?: string[];
  notes?: string;
  linkedProviders?: ILinkedProvider[];
  providerProfiles?: Partial<IProviderProfile>;
  primaryProvider?: AuthProvider;
}

/**
 * Public user profile interface (what we expose to other users)
 */
export interface IPublicUserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  website?: string;
  location?: string;
  joinedAt: Timestamp;
  isOnline?: boolean;
}

/**
 * User authentication response interface
 */
export interface IUserAuthResponse {
  user: IUserResponse;
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  };
}

/**
 * User response interface (what we send to the client)
 */
export interface IUserResponse {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  role: UserRole;
  status: UserStatus;
  providers: AuthProvider[];
  linkedProviders: ILinkedProvider[];
  providerProfiles: IProviderProfile;
  primaryProvider: AuthProvider;
  profile: IUser['profile'];
  preferences: IUser['preferences'];
  metadata: {
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    lastActiveAt?: string;
    loginCount: number;
  };
  tags?: string[];
}

/**
 * User list response interface
 */
export interface IUserListResponse {
  users: IUserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters?: {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  };
}

/**
 * User session interface
 */
export interface IUserSession {
  sessionId: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    platform?: string;
    browser?: string;
  };
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
  lastActivityAt: Timestamp;
}

/**
 * User activity log interface
 */
export interface IUserActivity {
  id: string;
  userId: string;
  action: string;
  description: string;
  metadata?: any;
  ip?: string;
  userAgent?: string;
  createdAt: Timestamp;
}

/**
 * User default values
 */
export const USER_DEFAULTS = {
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
  providers: [AuthProvider.EMAIL],
  linkedProviders: [] as ILinkedProvider[],
  providerProfiles: {} as IProviderProfile,
  primaryProvider: AuthProvider.EMAIL,
  profile: {
    timezone: 'UTC',
    language: 'en'
  },
  preferences: {
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profileVisible: true,
      emailVisible: false,
      phoneVisible: false,
      allowProviderLinking: true,
      allowDataSync: true
    },
    theme: 'auto' as const,
    oauth: {
      autoSyncProfile: true,
      allowMultipleAccounts: true
    }
  },
  metadata: {
    loginCount: 0
  },
  isDeleted: false
};

/**
 * User permissions
 */
export const USER_PERMISSIONS = {
  [UserRole.USER]: [
    'user:read:own',
    'user:update:own',
    'profile:read',
    'profile:update:own'
  ],
  [UserRole.ADMIN]: [
    'user:read:own',
    'user:update:own',
    'user:read:any',
    'user:update:any',
    'user:delete:any',
    'profile:read',
    'profile:update:own',
    'profile:update:any',
    'admin:read',
    'admin:write'
  ],
  [UserRole.SUPER_ADMIN]: [
    '*' // All permissions
  ]
};

/**
 * User validation helpers
 */
export const UserValidation = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhoneNumber: (phoneNumber: string): boolean => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  },

  isValidDisplayName: (displayName: string): boolean => {
    return displayName.length >= 1 && displayName.length <= 100;
  },

  isValidRole: (role: string): role is UserRole => {
    return Object.values(UserRole).includes(role as UserRole);
  },

  isValidStatus: (status: string): status is UserStatus => {
    return Object.values(UserStatus).includes(status as UserStatus);
  },

  hasPermission: (userRole: UserRole, permission: string): boolean => {
    const permissions = USER_PERMISSIONS[userRole] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }
};

/**
 * User transformation helpers
 */
export const UserTransformers = {
  /**
   * Convert Firestore user document to IUser
   */
  fromFirestore: (doc: any): IUser => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      metadata: {
        ...data.metadata,
        createdAt: data.metadata?.createdAt,
        updatedAt: data.metadata?.updatedAt,
        lastLoginAt: data.metadata?.lastLoginAt,
        lastActiveAt: data.metadata?.lastActiveAt
      }
    };
  },

  /**
   * Convert IUser to Firestore document data
   */
  toFirestore: (user: Partial<IUser>): any => {
    const { uid, ...data } = user;
    return {
      ...data,
      metadata: {
        ...data.metadata,
        updatedAt: Timestamp.now()
      }
    };
  },

  /**
   * Convert IUser to public response format
   */
  toPublicResponse: (user: IUser): IUserResponse => {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      emailVerified: user.emailVerified,
      role: user.role,
      status: user.status,
      providers: user.providers,
      linkedProviders: user.linkedProviders || [],
      providerProfiles: user.providerProfiles || {},
      primaryProvider: user.primaryProvider,
      profile: user.profile,
      preferences: user.preferences,
      metadata: {
        createdAt: user.metadata.createdAt.toDate().toISOString(),
        updatedAt: user.metadata.updatedAt.toDate().toISOString(),
        lastLoginAt: user.metadata.lastLoginAt?.toDate().toISOString(),
        lastActiveAt: user.metadata.lastActiveAt?.toDate().toISOString(),
        loginCount: user.metadata.loginCount
      },
      tags: user.tags
    };
  },

  /**
   * Convert OAuth provider data to linked provider
   */
  oauthToLinkedProvider: (provider: AuthProvider, oauthData: IOAuthProviderData, isPrimary = false): ILinkedProvider => {
    return {
      provider,
      providerId: oauthData.providerId,
      providerUid: oauthData.uid,
      email: oauthData.email,
      displayName: oauthData.displayName,
      photoURL: oauthData.photoURL,
      linkedAt: oauthData.linkedAt,
      lastUsed: oauthData.lastUsed,
      isVerified: oauthData.metadata?.verified_email || false,
      isPrimary,
      canUnlink: true,
      metadata: oauthData.metadata
    };
  },

  /**
   * Create provider profile from OAuth data
   */
  createProviderProfile: (provider: AuthProvider, oauthData: any): Partial<IProviderProfile> => {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return {
          google: {
            id: oauthData.sub || oauthData.id,
            verified_email: oauthData.email_verified || false,
            given_name: oauthData.given_name,
            family_name: oauthData.family_name,
            locale: oauthData.locale,
            hd: oauthData.hd
          }
        };
      case AuthProvider.APPLE:
        return {
          apple: {
            sub: oauthData.sub,
            email_verified: oauthData.email_verified,
            is_private_email: oauthData.is_private_email,
            real_user_status: oauthData.real_user_status
          }
        };
      case AuthProvider.FACEBOOK:
        return {
          facebook: {
            id: oauthData.id,
            first_name: oauthData.first_name,
            last_name: oauthData.last_name,
            verified: oauthData.verified,
            locale: oauthData.locale
          }
        };
      case AuthProvider.GITHUB:
        return {
          github: {
            id: oauthData.id,
            login: oauthData.login,
            name: oauthData.name,
            company: oauthData.company,
            location: oauthData.location,
            bio: oauthData.bio,
            public_repos: oauthData.public_repos,
            followers: oauthData.followers,
            following: oauthData.following
          }
        };
      default:
        return {};
    }
  },

  /**
   * Convert IUser to public profile format
   */
  toPublicProfile: (user: IUser): IPublicUserProfile => {
    return {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      bio: user.profile.bio,
      website: user.profile.website,
      location: user.profile.location,
      joinedAt: user.metadata.createdAt
    };
  }
};

/**
 * OAuth provider validation and utility functions
 */
export const OAuthProviderUtils = {
  /**
   * Check if provider can be unlinked
   */
  canUnlinkProvider: (user: IUser, provider: AuthProvider): boolean => {
    const linkedProviders = user.linkedProviders.filter(p => p.provider !== provider);
    const hasPassword = user.providers.includes(AuthProvider.EMAIL);
    return linkedProviders.length > 0 || hasPassword;
  },

  /**
   * Get primary provider
   */
  getPrimaryProvider: (user: IUser): ILinkedProvider | null => {
    return user.linkedProviders.find(p => p.isPrimary) || null;
  },

  /**
   * Check if provider is already linked
   */
  isProviderLinked: (user: IUser, provider: AuthProvider): boolean => {
    return user.linkedProviders.some(p => p.provider === provider);
  },

  /**
   * Get provider by type
   */
  getProviderByType: (user: IUser, provider: AuthProvider): ILinkedProvider | null => {
    return user.linkedProviders.find(p => p.provider === provider) || null;
  },

  /**
   * Update provider last used timestamp
   */
  updateProviderLastUsed: (linkedProviders: ILinkedProvider[], provider: AuthProvider): ILinkedProvider[] => {
    return linkedProviders.map(p => 
      p.provider === provider 
        ? { ...p, lastUsed: Timestamp.now() }
        : p
    );
  },

  /**
   * Set primary provider
   */
  setPrimaryProvider: (linkedProviders: ILinkedProvider[], provider: AuthProvider): ILinkedProvider[] => {
    return linkedProviders.map(p => ({
      ...p,
      isPrimary: p.provider === provider
    }));
  },

  /**
   * Remove provider from linked providers
   */
  removeProvider: (linkedProviders: ILinkedProvider[], provider: AuthProvider): ILinkedProvider[] => {
    return linkedProviders.filter(p => p.provider !== provider);
  },

  /**
   * Validate OAuth provider data
   */
  validateOAuthData: (provider: AuthProvider, data: any): boolean => {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return !!(data.sub || data.id) && !!data.email;
      case AuthProvider.APPLE:
        return !!data.sub;
      case AuthProvider.FACEBOOK:
        return !!data.id;
      case AuthProvider.GITHUB:
        return !!data.id && !!data.login;
      default:
        return false;
    }
  },

  /**
   * Extract user info from OAuth provider data
   */
  extractUserInfo: (provider: AuthProvider, data: any) => {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return {
          uid: data.sub || data.id,
          email: data.email,
          displayName: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim(),
          photoURL: data.picture,
          emailVerified: data.email_verified || false
        };
      case AuthProvider.APPLE:
        return {
          uid: data.sub,
          email: data.email,
          displayName: data.name ? `${data.name.firstName || ''} ${data.name.lastName || ''}`.trim() : data.email?.split('@')[0],
          photoURL: undefined,
          emailVerified: data.email_verified === 'true'
        };
      case AuthProvider.FACEBOOK:
        return {
          uid: data.id,
          email: data.email,
          displayName: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          photoURL: data.picture?.data?.url,
          emailVerified: data.verified || false
        };
      case AuthProvider.GITHUB:
        return {
          uid: data.id.toString(),
          email: data.email,
          displayName: data.name || data.login,
          photoURL: data.avatar_url,
          emailVerified: !!data.email
        };
      default:
        return {
          uid: '',
          email: '',
          displayName: '',
          photoURL: undefined,
          emailVerified: false
        };
    }
  }
};

/**
 * Provider-specific configuration
 */
export const OAUTH_PROVIDER_CONFIG = {
  [AuthProvider.GOOGLE]: {
    name: 'Google',
    icon: 'google',
    color: '#4285f4',
    scopes: ['openid', 'email', 'profile'],
    requiredFields: ['sub', 'email']
  },
  [AuthProvider.APPLE]: {
    name: 'Apple',
    icon: 'apple',
    color: '#000000',
    scopes: ['email', 'name'],
    requiredFields: ['sub']
  },
  [AuthProvider.FACEBOOK]: {
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877f2',
    scopes: ['email', 'public_profile'],
    requiredFields: ['id']
  },
  [AuthProvider.GITHUB]: {
    name: 'GitHub',
    icon: 'github',
    color: '#333333',
    scopes: ['user:email', 'read:user'],
    requiredFields: ['id', 'login']
  }
};