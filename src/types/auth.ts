import { User as FirebaseUser } from 'firebase/auth';

/**
 * Authentication provider types
 */
export enum AuthProviderType {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
  GITHUB = 'github',
}

// Removed AuthProvider alias to avoid naming conflicts with new auth system

/**
 * User role types
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin',
}

/**
 * User status types
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

/**
 * Linked OAuth provider interface
 */
export interface LinkedProvider {
  provider: AuthProviderType;
  providerId: string;
  providerUid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  linkedAt: string;
  lastUsed: string;
  isVerified: boolean;
  isPrimary: boolean;
  canUnlink: boolean;
  metadata?: any;
}

/**
 * User profile interface
 */
export interface UserProfile {
  bio?: string;
  website?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  timezone?: string;
  language?: string;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
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
    preferredProvider?: AuthProviderType;
  };
}

/**
 * User metadata interface
 */
export interface UserMetadata {
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
  loginCount: number;
}

/**
 * Complete user interface
 */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  role: UserRole;
  status: UserStatus;
  providers: AuthProviderType[];
  linkedProviders: LinkedProvider[];
  primaryProvider: AuthProviderType;
  profile: UserProfile;
  preferences: UserPreferences;
  metadata: UserMetadata;
  tags?: string[];
}

/**
 * Authentication state interface
 */
export interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  lastActivity: number | null;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data interface
 */
export interface RegistrationData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  acceptTerms: boolean;
}

/**
 * Registration credentials interface (alias for RegistrationData)
 */
export type RegisterCredentials = RegistrationData;

/**
 * Password reset request interface
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password change request interface
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * OAuth login response interface
 */
export interface OAuthLoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  };
}

/**
 * Profile update request interface
 */
export interface ProfileUpdateRequest {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
}

/**
 * Account linking request interface
 */
export interface AccountLinkingRequest {
  provider: AuthProviderType;
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
  linkExistingAccount?: boolean;
}

/**
 * Authentication error types
 */
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Firebase Auth error codes mapping
 */
/**
 * Validation result interface  
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Authentication context type interface
 */
export interface AuthContextType extends AuthState {
  // Authentication actions
  signIn: (credentials: LoginCredentials) => Promise<User>;
  signUp: (registrationData: RegistrationData) => Promise<User>;
  signOut: () => Promise<void>;
  signInWithGoogle: (method?: 'popup' | 'redirect') => Promise<User>;
  signInWithApple: () => Promise<User>;
  
  // Account management
  sendPasswordResetEmail: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  updateProfile: (profile: ProfileUpdateRequest) => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  refreshUser: () => Promise<void>;
  getUserToken: (forceRefresh?: boolean) => Promise<string | null>;
}

export const AuthErrorCodes = {
  // Email/Password errors
  'auth/email-already-in-use': 'This email is already registered',
  'auth/invalid-email': 'Invalid email address',
  'auth/operation-not-allowed': 'Operation not allowed',
  'auth/weak-password': 'Password is too weak',
  'auth/user-disabled': 'User account has been disabled',
  'auth/user-not-found': 'No user found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/invalid-credential': 'Invalid credentials provided',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later',
  
  // Token errors
  'auth/id-token-expired': 'Authentication token has expired',
  'auth/id-token-revoked': 'Authentication token has been revoked',
  'auth/invalid-id-token': 'Invalid authentication token',
  
  // OAuth errors
  'auth/account-exists-with-different-credential': 'Account already exists with different credentials',
  'auth/auth-domain-config-required': 'Auth domain configuration required',
  'auth/cancelled-popup-request': 'Authentication popup was cancelled',
  'auth/popup-blocked': 'Authentication popup was blocked',
  'auth/popup-closed-by-user': 'Authentication popup was closed',
  'auth/unauthorized-domain': 'Domain is not authorized for OAuth',
  
  // Network errors
  'auth/network-request-failed': 'Network error. Please check your connection',
  
  // Default
  'auth/unknown': 'An unknown error occurred',
} as const;

export type AuthErrorCode = keyof typeof AuthErrorCodes;

/**
 * Social login provider configuration
 */
export interface SocialLoginConfig {
  enabled: boolean;
  name: string;
  icon: string;
  color: string;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  providers: {
    email: boolean;
    google: SocialLoginConfig;
    apple: SocialLoginConfig;
    facebook: SocialLoginConfig;
    github: SocialLoginConfig;
  };
  features: {
    registration: boolean;
    emailVerification: boolean;
    passwordReset: boolean;
    socialLogin: boolean;
    accountLinking: boolean;
    providerUnlinking: boolean;
  };
  validation: {
    passwordMinLength: number;
    passwordRequirements: {
      uppercase: boolean;
      lowercase: boolean;
      numbers: boolean;
      symbols: boolean;
    };
    displayNameMinLength: number;
    displayNameMaxLength: number;
  };
}