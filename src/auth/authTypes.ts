/**
 * Clean, isolated authentication type definitions
 * No external dependencies to prevent circular imports
 */

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  role: 'participant' | 'official' | 'admin';
  providers: string[];
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications: boolean;
  newsletter: boolean;
  language: 'en' | 'zh';
  theme?: 'light' | 'dark';
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
console.log('🔍 [authTypes] Exporting AuthProvider as object:', AuthProvider);
console.log('🔍 [authTypes] AuthProvider.GOOGLE:', AuthProvider.GOOGLE);
console.log('🔍 [authTypes] AuthProvider.APPLE:', AuthProvider.APPLE);
console.log('🔍 [authTypes] AuthProvider.FACEBOOK:', AuthProvider.FACEBOOK);

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
  clearError: () => void;
}