export type SponsorTier = 'lead' | 'premiere' | 'major' | 'supporting' | 'organiser' | 'co-organiser' | 'partner';

export interface SponsorLocation {
  name: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  website?: string;
  hours?: {
    [key: string]: string; // day of week -> hours
  };
}

export interface SponsorOffer {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'service' | 'experience' | 'product';
  validUntil?: string;
  termsAndConditions?: string[];
  howToRedeem: string;
  locations?: string[]; // location IDs where offer is valid
}

export interface HongKongActivity {
  id: string;
  title: string;
  description: string;
  type: 'cultural' | 'dining' | 'shopping' | 'sightseeing' | 'entertainment' | 'business' | 'social';
  sponsorId: string;
  website?: string;
  bookingRequired: boolean;
  duration?: string;
  priceRange?: 'free' | '$' | '$$' | '$$$' | '$$$$';
  bestTime?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  tier: SponsorTier;
  description: string;
  logo?: string; // URL or local asset path
  website?: string;
  primaryColor?: string; // Brand color for theming
  bookingUrl?: string; // URL for booking services

  // Contact information
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  };

  // Business information
  business: {
    sector: string;
    established?: number;
    headquarters?: string;
    description: string;
  };

  // Locations (for sponsors with physical presence)
  locations?: SponsorLocation[];

  // Offers and deals for event participants
  offers: SponsorOffer[];

  // Hong Kong activities and experiences
  hongKongActivities: HongKongActivity[];

  // Special recognition
  isTitle?: boolean; // For title sponsor
  isPresenting?: boolean; // For presenting sponsor
  specialRecognition?: string; // Any special naming rights
}

export interface SponsorshipProgram {
  eventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  sponsors: Sponsor[];
}