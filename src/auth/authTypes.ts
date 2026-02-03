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

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  role: 'participant' | 'official' | 'admin';
  status: UserStatus;
  providers: string[];
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
  sailingProfile?: SailingProfile;
}

export interface UserPreferences {
  notifications: boolean;
  newsletter: boolean;
  language: 'en' | 'zh';
  theme?: 'light' | 'dark';
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
  EMAIL: 'email'
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