/**
 * Simple auth types matching the actual implementation
 */

/**
 * Sailing profile information for sailors
 */
export interface SailingProfile {
  sailNumber?: string;      // e.g., "d59"
  boatClass?: string;       // e.g., "Dragon"
  yachtClub?: string;       // e.g., "Royal Hong Kong Yacht Club"
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  role: string; // participant, organizer, admin
  providers: string[];
  createdAt: Date;
  updatedAt: Date;
  preferences?: any;
  sailingProfile?: SailingProfile;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName?: string;
}

export type AuthProviderType = 
  | 'email'
  | 'google'
  | 'apple'
  | 'facebook'
  | 'github';