export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface TransportInfo {
  type: 'mtr' | 'bus' | 'taxi' | 'ferry' | 'walking';
  route: string;
  schedule?: string;
  cost?: string;
  notes?: string;
}

export interface ChampionshipEvent {
  date: string;
  time: string;
  event: string;
  description?: string;
}

export type SailingLocationType = 
  | 'championship_hq'      // RHKYC Kellett Island
  | 'race_course'          // Ninepins Islands
  | 'venue'                // Championship venues
  | 'marina'               // Marinas and yacht clubs
  | 'yacht_club'           // Additional yacht clubs
  | 'chandlery'            // Marine equipment stores
  | 'gear_store'           // Sailing gear and apparel stores
  | 'hotel'                // Hotels and accommodation
  | 'support_service'      // Support services (weather, marine dept)
  | 'transport_hub'        // Ferry terminals and transport
  | 'spectator_point';     // Viewing locations

export interface SailingLocation {
  id: string;
  name: string;
  type: SailingLocationType;
  coordinates: Coordinates;
  description: string;
  
  // Championship-specific information
  championshipRole: string;
  facilities?: string[];
  championshipEvents?: ChampionshipEvent[];
  
  // Contact and access information
  contact?: ContactInfo;
  address?: string;
  transportation?: TransportInfo[];
  
  // Specific information for different user types
  racerInfo?: string;
  spectatorInfo?: string;
  
  // Additional metadata
  importance: 'primary' | 'secondary' | 'tertiary';
  operatingHours?: string;
  championshipSpecific?: boolean;
}

export interface SailingLocationFilter {
  type: 'all' | 'championship' | 'racing' | 'spectator';
  label: string;
  description: string;
}

export interface LocationDetailModalProps {
  location: SailingLocation;
  onClose: () => void;
  onNavigate?: (location: SailingLocation) => void;
}

export interface SailingLocationMarkerProps {
  location: SailingLocation;
  isSelected: boolean;
  onPress: (location: SailingLocation) => void;
}