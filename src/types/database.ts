import { z } from 'zod';
import {
  UserRole,
  UserStatus,
  AuthProviderType,
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
    preferredProvider: z.nativeEnum(AuthProviderType).optional(),
  }),
}).strict();

/**
 * Zod schema for LinkedProvider validation
 */
export const LinkedProviderSchema = z.object({
  provider: z.nativeEnum(AuthProviderType),
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
  metadata: z.record(z.string(), z.any()).optional(),
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
  providers: z.array(z.nativeEnum(AuthProviderType)),
  linkedProviders: z.array(LinkedProviderSchema),
  primaryProvider: z.nativeEnum(AuthProviderType),
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
 * Note: emailVerified can be updated by auth services after Firebase confirms verification
 */
export const UpdateUserProfileSchema = UserSchema.omit({
  uid: true,
}).partial();

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
    data: z.record(z.string(), z.any()).optional(),
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
  metadata: z.record(z.string(), z.any()).optional(),
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
  data: z.record(z.string(), z.any()).optional(),
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
  uid: z.string().optional(), // User ID for linking preferences
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
  const parsed = UserSchema.parse(data);
  return parsed as User;
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

/**
 * Racing and Regatta Database Types
 * Types for managing regatta results, competitors, and race data
 */

/**
 * Racing event/regatta schema
 */
export const RacingEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']),
  eventType: z.enum(['regatta', 'championship', 'series', 'race']),
  organizerName: z.string(),
  organizerEmail: z.string().email().optional(),
  websiteUrl: z.string().url().optional(),
  totalRaces: z.number().int().min(1),
  racesCompleted: z.number().int().min(0),
  classes: z.array(z.string()), // Racing classes in this event
  venue: z.object({
    name: z.string(),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
    description: z.string().optional(),
  }),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    lastResultsUpdate: z.string().optional(),
    dataSource: z.string().optional(), // e.g. 'scraped', 'manual', 'api'
  }),
});

export interface RacingEvent extends z.infer<typeof RacingEventSchema> {}

/**
 * Competitor/Boat schema
 */
export const CompetitorSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  sailNumber: z.string(),
  boatName: z.string().optional(),
  boatType: z.string().optional(),
  helmName: z.string(),
  crewName: z.string().optional(),
  yachtClub: z.string().optional(),
  country: z.string().length(3).optional(), // ISO country code
  racingClass: z.string(),
  status: z.enum(['active', 'retired', 'dnf', 'dsq', 'dns']),
  metadata: z.object({
    registeredAt: z.string(),
    updatedAt: z.string(),
    notes: z.string().optional(),
  }).optional(),
});

export interface Competitor extends z.infer<typeof CompetitorSchema> {}

/**
 * Race standings/results schema  
 */
export const RaceStandingSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  competitorId: z.string(),
  sailNumber: z.string(), // Denormalized for easy display
  boatName: z.string().optional(), // Denormalized for easy display
  helmName: z.string(), // Denormalized for easy display
  crewName: z.string().optional(), // Denormalized for easy display
  yachtClub: z.string().optional(), // Denormalized for easy display
  racingClass: z.string(),
  position: z.number().int().min(1),
  totalPoints: z.number().min(0),
  raceResults: z.array(z.union([
    z.number().int().min(1), // Normal finishing position
    z.literal('DNF'), // Did Not Finish
    z.literal('DNS'), // Did Not Start
    z.literal('DSQ'), // Disqualified
    z.literal('RET'), // Retired
  ])),
  status: z.enum(['active', 'retired', 'disqualified']),
  metadata: z.object({
    calculatedAt: z.string(),
    lastRaceUpdate: z.string().optional(),
  }).optional(),
});

export interface RaceStanding extends z.infer<typeof RaceStandingSchema> {}

/**
 * Individual race result schema
 */
export const IndividualRaceSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  raceNumber: z.number().int().min(1),
  raceName: z.string().optional(),
  raceDate: z.string(),
  racingClass: z.string(),
  conditions: z.object({
    windSpeed: z.number().optional(),
    windDirection: z.number().optional(), // degrees
    temperature: z.number().optional(),
    description: z.string().optional(),
  }).optional(),
  results: z.array(z.object({
    competitorId: z.string(),
    sailNumber: z.string(),
    position: z.union([
      z.number().int().min(1),
      z.literal('DNF'),
      z.literal('DNS'),
      z.literal('DSQ'),
      z.literal('RET'),
    ]),
    elapsedTime: z.string().optional(), // Format: HH:MM:SS
    correctedTime: z.string().optional(),
    points: z.number().min(0),
  })),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']),
  metadata: z.object({
    startTime: z.string().optional(),
    finishTime: z.string().optional(),
    updatedAt: z.string(),
  }),
});

export interface IndividualRace extends z.infer<typeof IndividualRaceSchema> {}

/**
 * Data source tracking for scraped/external data
 */
export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['scraping', 'api', 'manual', 'import']),
  baseUrl: z.string().url().optional(),
  lastUpdate: z.string(),
  status: z.enum(['active', 'inactive', 'error']),
  errorMessage: z.string().optional(),
  updateFrequency: z.number().optional(), // minutes
  metadata: z.record(z.string(), z.any()).optional(),
});

export interface DataSource extends z.infer<typeof DataSourceSchema> {}

/**
 * Extended collection names for racing data
 */
export enum RacingCollectionName {
  EVENTS = 'racing_events',
  COMPETITORS = 'competitors',
  STANDINGS = 'race_standings',
  INDIVIDUAL_RACES = 'individual_races',
  DATA_SOURCES = 'data_sources',
  SCRAPED_DATA_CACHE = 'scraped_data_cache',
}

/**
 * Validation helper functions for racing data
 */
export const validateRacingEvent = (data: unknown): RacingEvent => {
  return RacingEventSchema.parse(data);
};

export const validateCompetitor = (data: unknown): Competitor => {
  return CompetitorSchema.parse(data);
};

export const validateRaceStanding = (data: unknown): RaceStanding => {
  return RaceStandingSchema.parse(data);
};

export const validateIndividualRace = (data: unknown): IndividualRace => {
  return IndividualRaceSchema.parse(data);
};

export const validateDataSource = (data: unknown): DataSource => {
  return DataSourceSchema.parse(data);
};

/**
 * Default values for racing data creation
 */
export const createDefaultRacingEvent = (overrides: Partial<RacingEvent> = {}): Partial<RacingEvent> => {
  const now = new Date().toISOString();
  return {
    status: 'upcoming',
    eventType: 'regatta',
    racesCompleted: 0,
    classes: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
    },
    ...overrides,
  };
};

/**
 * Utility functions for race data
 */
export const calculateTotalPoints = (raceResults: (number | string)[]): number => {
  return raceResults.reduce<number>((total, result) => {
    if (typeof result === 'number') {
      return total + result;
    }
    // Handle special cases - assign penalty points
    switch (result) {
      case 'DNF':
      case 'DNS':
      case 'DSQ':
        return total + 999; // High penalty
      case 'RET':
        return total + 888; // Lower penalty than DNF
      default:
        return total;
    }
  }, 0);
};

export const formatRaceResult = (result: number | string): string => {
  if (typeof result === 'number') {
    return result.toString();
  }
  return result;
};

export const isValidSailNumber = (sailNumber: string): boolean => {
  // Basic validation - can be extended based on class rules
  return sailNumber.length > 0 && sailNumber.length <= 20;
};