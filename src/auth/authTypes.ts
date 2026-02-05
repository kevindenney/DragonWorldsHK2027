/**
 * Clean, isolated authentication type definitions
 * No external dependencies to prevent circular imports
 */

// Import UserStatus enum to avoid circular dependencies
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

// Define role type that is compatible with UserRole enum values
export type UserRoleType = 'user' | 'admin' | 'superadmin' | 'participant' | 'official';

export interface LinkedProvider {
  providerId: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

export interface UserProfile {
  location?: string;
  bio?: string;
  website?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  name?: string; // Alias for displayName
  photoURL?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  role: UserRoleType;
  status: UserStatus;
  providers: string[];
  linkedProviders?: LinkedProvider[];
  profile?: UserProfile;
  sailNumber?: string; // Convenience property for sailors
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
  sailingProfile?: SailingProfile;
}

export interface UserPreferences {
  notifications?: boolean;
  newsletter?: boolean;
  language?: 'en' | 'zh';
  theme?: 'light' | 'dark';
  // Additional preferences used in auth screens
  weatherAlerts?: boolean;
  raceNotifications?: boolean;
  socialUpdates?: boolean;
  marketingEmails?: boolean;
}

/**
 * Sailing profile information for sailors
 */
export interface SailingProfile {
  sailNumber?: string;      // e.g., "d59"
  boatClass?: string;       // e.g., "Dragon"
  yachtClub?: string;       // e.g., "Royal Hong Kong Yacht Club"
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
  confirmPassword?: string;
}

// AuthProvider as plain object (removed 'as const' to avoid Hermes property descriptor conflicts)
export const AuthProvider = {
  GOOGLE: 'google',
  APPLE: 'apple',
  FACEBOOK: 'facebook',
  EMAIL: 'email',
  GITHUB: 'github'
};

// Type derived from the const object
export type AuthProviderType = typeof AuthProvider[keyof typeof AuthProvider];

// DEBUG: Log what we're exporting

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginWithProvider: (provider: AuthProviderType) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resendEmailVerification?: () => Promise<void>;
  clearError: () => void;
}