/**
 * Simple auth types matching the actual implementation
 */

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