import { z } from 'zod';
import { 
  UserRole, 
  UserStatus, 
  AuthProvider,
  User,
  UserProfile,
  UserPreferences,
  UserMetadata,
  LinkedProvider
} from './auth';

/**
 * Zod schema for UserProfile validation
 */
export const UserProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD format
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().length(2).optional(), // ISO 639-1 language codes
}).strict();

/**
 * Zod schema for UserPreferences validation
 */
export const UserPreferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  privacy: z.object({
    profileVisible: z.boolean(),
    emailVisible: z.boolean(),
    phoneVisible: z.boolean(),
    allowProviderLinking: z.boolean(),
    allowDataSync: z.boolean(),
  }),
  theme: z.enum(['light', 'dark', 'auto']),
  oauth: z.object({
    autoSyncProfile: z.boolean(),
    allowMultipleAccounts: z.boolean(),
    preferredProvider: z.nativeEnum(AuthProvider).optional(),
  }),
}).strict();

/**
 * Zod schema for LinkedProvider validation
 */
export const LinkedProviderSchema = z.object({
  provider: z.nativeEnum(AuthProvider),
  providerId: z.string().min(1),
  providerUid: z.string().min(1),
  email: z.string().email().optional(),
  displayName: z.string().max(100).optional(),
  photoURL: z.string().url().optional(),
  linkedAt: z.string(),
  lastUsed: z.string(),
  isVerified: z.boolean(),
  isPrimary: z.boolean(),
  canUnlink: z.boolean(),
  metadata: z.record(z.any()).optional(),
}).strict();

/**
 * Zod schema for UserMetadata validation
 */
export const UserMetadataSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLoginAt: z.string().optional(),
  lastActiveAt: z.string().optional(),
  loginCount: z.number().int().min(0),
}).strict();

/**
 * Zod schema for User validation (for Firestore documents)
 */
export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  photoURL: z.string().url().optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(), // E.164 format
  emailVerified: z.boolean(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  providers: z.array(z.nativeEnum(AuthProvider)),
  linkedProviders: z.array(LinkedProviderSchema),
  primaryProvider: z.nativeEnum(AuthProvider),
  profile: UserProfileSchema,
  preferences: UserPreferencesSchema,
  metadata: UserMetadataSchema,
  tags: z.array(z.string().max(50)).optional(),
}).strict();

/**
 * Schema for creating a new user profile
 */
export const CreateUserProfileSchema = UserSchema.omit({
  uid: true,
  metadata: true,
}).extend({
  uid: z.string().min(1), // Required but handled separately
  metadata: UserMetadataSchema.partial().extend({
    createdAt: z.string(),
    updatedAt: z.string(),
    loginCount: z.literal(0),
  }),
});

/**
 * Schema for updating user profile
 */
export const UpdateUserProfileSchema = UserSchema.omit({
  uid: true,
  metadata: true,
  emailVerified: true, // Cannot be updated directly
}).partial().extend({
  metadata: UserMetadataSchema.partial().extend({
    updatedAt: z.string(),
  }),
});

/**
 * Schema for updating user preferences only
 */
export const UpdatePreferencesSchema = UserPreferencesSchema.partial();

/**
 * Schema for updating user profile info only
 */
export const UpdateProfileInfoSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  photoURL: z.string().url().optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  profile: UserProfileSchema.partial().optional(),
});

/**
 * Firestore document interfaces
 */
export interface FirestoreUser extends Omit<User, 'metadata'> {
  metadata: UserMetadata & {
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Collection names enum for consistency
 */
export enum CollectionName {
  USERS = 'users',
  USER_SESSIONS = 'user_sessions',
  USER_ACTIVITY = 'user_activity',
  USER_NOTIFICATIONS = 'user_notifications',
  USER_PREFERENCES = 'user_preferences',
  REGATTA_PARTICIPANTS = 'regatta_participants',
  WEATHER_FAVORITES = 'weather_favorites',
  USER_SUBSCRIPTIONS = 'user_subscriptions',
}

/**
 * User session tracking for analytics
 */
export const UserSessionSchema = z.object({
  uid: z.string(),
  sessionId: z.string(),
  deviceInfo: z.object({
    platform: z.string(),
    version: z.string(),
    model: z.string().optional(),
  }),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  actions: z.array(z.object({
    action: z.string(),
    timestamp: z.string(),
    data: z.record(z.any()).optional(),
  })).optional(),
});

export interface UserSession extends z.infer<typeof UserSessionSchema> {}

/**
 * User activity tracking
 */
export const UserActivitySchema = z.object({
  uid: z.string(),
  action: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export interface UserActivity extends z.infer<typeof UserActivitySchema> {}

/**
 * User notification settings and history
 */
export const UserNotificationSchema = z.object({
  uid: z.string(),
  notificationId: z.string(),
  type: z.enum(['race_update', 'weather_alert', 'system', 'marketing']),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  sentAt: z.string(),
  readAt: z.string().optional(),
  deliveredAt: z.string().optional(),
  channel: z.enum(['push', 'email', 'sms', 'in_app']),
  status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']),
});

export interface UserNotification extends z.infer<typeof UserNotificationSchema> {}

/**
 * Sailing-specific user data
 */
export const SailingProfileSchema = z.object({
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    dateObtained: z.string(),
    expiryDate: z.string().optional(),
  })).optional(),
  preferredBoatTypes: z.array(z.string()).optional(),
  homePort: z.string().optional(),
  sailingClub: z.string().optional(),
  competitionHistory: z.array(z.object({
    eventName: z.string(),
    date: z.string(),
    position: z.number().optional(),
    boatClass: z.string().optional(),
  })).optional(),
});

export interface SailingProfile extends z.infer<typeof SailingProfileSchema> {}

/**
 * Enhanced user profile with sailing-specific data
 */
export const EnhancedUserProfileSchema = UserProfileSchema.extend({
  sailing: SailingProfileSchema.optional(),
});

/**
 * Weather preferences for users
 */
export const WeatherPreferencesSchema = z.object({
  units: z.object({
    temperature: z.enum(['celsius', 'fahrenheit']),
    windSpeed: z.enum(['knots', 'kmh', 'mph', 'ms']),
    pressure: z.enum(['hPa', 'inHg', 'mmHg']),
    distance: z.enum(['nautical', 'metric', 'imperial']),
  }),
  alerts: z.object({
    enabled: z.boolean(),
    windSpeedThreshold: z.number().min(0).max(100),
    temperatureThreshold: z.object({
      min: z.number(),
      max: z.number(),
    }),
    severeWeatherAlerts: z.boolean(),
  }),
  favoriteLocations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
    addedAt: z.string(),
  })),
});

export interface WeatherPreferences extends z.infer<typeof WeatherPreferencesSchema> {}

/**
 * Default values for user creation
 */
export const defaultUserPreferences: UserPreferences = {
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  privacy: {
    profileVisible: true,
    emailVisible: false,
    phoneVisible: false,
    allowProviderLinking: true,
    allowDataSync: true,
  },
  theme: 'auto',
  oauth: {
    autoSyncProfile: true,
    allowMultipleAccounts: false,
  },
};

export const defaultUserProfile: UserProfile = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: 'en',
};

export const defaultWeatherPreferences: WeatherPreferences = {
  units: {
    temperature: 'celsius',
    windSpeed: 'knots',
    pressure: 'hPa',
    distance: 'nautical',
  },
  alerts: {
    enabled: true,
    windSpeedThreshold: 25,
    temperatureThreshold: {
      min: 5,
      max: 35,
    },
    severeWeatherAlerts: true,
  },
  favoriteLocations: [],
};

/**
 * Validation helper functions
 */
export const validateUserProfile = (data: unknown): UserProfile => {
  return UserProfileSchema.parse(data);
};

export const validateUserPreferences = (data: unknown): UserPreferences => {
  return UserPreferencesSchema.parse(data);
};

export const validateUser = (data: unknown): User => {
  return UserSchema.parse(data);
};

export const validateCreateUserProfile = (data: unknown) => {
  return CreateUserProfileSchema.parse(data);
};

export const validateUpdateUserProfile = (data: unknown) => {
  return UpdateUserProfileSchema.parse(data);
};

export const validateWeatherPreferences = (data: unknown): WeatherPreferences => {
  return WeatherPreferencesSchema.parse(data);
};

/**
 * Type exports for use in other files
 */
export type CreateUserProfile = z.infer<typeof CreateUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;
export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;
export type UpdateProfileInfo = z.infer<typeof UpdateProfileInfoSchema>;
export type EnhancedUserProfile = z.infer<typeof EnhancedUserProfileSchema>;

/**
 * Firestore timestamp conversion helpers
 */
export const toFirestoreTimestamp = (date: Date = new Date()): string => {
  return date.toISOString();
};

export const fromFirestoreTimestamp = (timestamp: string): Date => {
  return new Date(timestamp);
};