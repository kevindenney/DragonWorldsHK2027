import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  CollectionReference, 
  DocumentReference,
  serverTimestamp,
  Timestamp,
  Firestore
} from 'firebase/firestore';

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  USERS: 'users',
  RACES: 'races',
  RESULTS: 'results',
  TEAMS: 'teams',
  EVENTS: 'events',
  NOTIFICATIONS: 'notifications',
  SOCIAL_POSTS: 'socialPosts',
} as const;

/**
 * Sailing profile information for sailors
 */
export interface SailingProfile {
  sailNumber?: string;      // e.g., "d59"
  boatClass?: string;       // e.g., "Dragon"
  yachtClub?: string;       // e.g., "Royal Hong Kong Yacht Club"
}

/**
 * User document interface
 */
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: 'participant' | 'organizer' | 'admin';
  teamId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  emailVerified: boolean;
  providers: string[];
  preferences?: {
    notifications: boolean;
    newsletter: boolean;
    language: string;
  };
  sailingProfile?: SailingProfile;
}

/**
 * Race document interface
 */
export interface RaceDocument {
  id: string;
  name: string;
  date: Timestamp;
  location: {
    latitude: number;
    longitude: number;
    venue: string;
    city: string;
  };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  course: {
    marks: Array<{
      latitude: number;
      longitude: number;
      type: 'start' | 'mark' | 'gate' | 'finish';
      name: string;
    }>;
    windDirection?: number;
    windSpeed?: number;
  };
  participants: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Type-safe collection references - only available if Firestore is initialized
 */
export const collections = firestore ? {
  users: collection(firestore, COLLECTIONS.USERS) as CollectionReference<UserDocument>,
  races: collection(firestore, COLLECTIONS.RACES) as CollectionReference<RaceDocument>,
} : null;

/**
 * Type-safe document references - with null checks
 */
export const getDocRef = {
  user: (uid: string) => {
    if (!firestore || !collections) throw new Error('Firestore not available');
    return doc(collections.users, uid) as DocumentReference<UserDocument>;
  },
  race: (raceId: string) => {
    if (!firestore || !collections) throw new Error('Firestore not available');
    return doc(collections.races, raceId) as DocumentReference<RaceDocument>;
  },
};

/**
 * Helper to add server timestamp
 */
export const withTimestamp = <T extends Record<string, any>>(data: T) => ({
  ...data,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

/**
 * Helper to update timestamp
 */
export const withUpdatedTimestamp = <T extends Record<string, any>>(data: T) => ({
  ...data,
  updatedAt: serverTimestamp(),
});

/**
 * Initialize Firestore (called on app start)
 */
export const initializeFirestore = async () => {
  try {
    // Enable offline persistence for mobile
    if (typeof window !== 'undefined' && 'navigator' in window && 'onLine' in navigator) {
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  collections,
  getDocRef,
  withTimestamp,
  withUpdatedTimestamp,
  initializeFirestore,
};