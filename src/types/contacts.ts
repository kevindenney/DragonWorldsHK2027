export type ContactRole =
  | 'principal-race-officer'
  | 'chief-judge'
  | 'regatta-director'
  | 'safety-officer'
  | 'measurement-committee'
  | 'equipment-support'
  | 'it-support'
  | 'yacht-club-office'
  | 'marina-office'
  | 'event-headquarters'
  | 'coast-guard'
  | 'marine-police'
  | 'hospital'
  | 'event-medical'
  | 'race-official'
  | 'mark-boat-crew'
  | 'shore-support'
  | 'event-coordinator';

export type ContactCategory =
  | 'race-management'
  | 'emergency-contacts'
  | 'technical-support'
  | 'host-organization'
  | 'officials-volunteers';

export type CommunicationChannelType = 
  | 'vhf' 
  | 'website' 
  | 'social' 
  | 'physical'
  | 'app'
  | 'notice-board';

export interface KeyContact {
  id: string;
  role: ContactRole;
  name: string;
  phone?: string;
  email?: string;
  organization?: string;
  category: ContactCategory;
  isEmergency: boolean;
  availability?: string;
  vhfChannel?: string;
  description?: string;
  location?: string;
  hours?: string;
  isFavorite?: boolean;
  lastContacted?: string;
}

export interface EmergencyContact extends KeyContact {
  priority: 'critical' | 'urgent' | 'important';
  quickDial: boolean;
  internationalFormat?: string;
  alternativeNumbers?: string[];
  emergencyType: 'medical' | 'marine-rescue' | 'security' | 'weather' | 'technical';
}

export interface CommunicationChannel {
  id: string;
  type: CommunicationChannelType;
  name: string;
  details: string;
  url?: string;
  vhfChannel?: string;
  location?: string;
  hours?: string;
  isOfficial: boolean;
  category: 'official' | 'social' | 'technical' | 'emergency';
  icon?: string;
}

export interface WhatsAppGroupCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sailingSpecific: boolean;
}

export interface SailingWhatsAppGroups {
  competitionCommunication: {
    raceCommittee: string;
    competitorsGeneral: string;
    weatherConditions: string;
    resultsScoring: string;
  };
  classSpecific: {
    oneDesignClasses: string[];
    cruisingDivision: string;
    multiHullDivision: string;
    youthJuniorSailors: string;
  };
  supportSocial: {
    crewExchange: string;
    socialEvents: string;
    transportation: string;
    equipmentTrade: string;
  };
  officialsVolunteers: {
    raceOfficials: string;
    markBoatCrew: string;
    shoreSupport: string;
  };
}

export interface ContactsSearchFilters {
  category?: ContactCategory;
  isEmergency?: boolean;
  hasPhone?: boolean;
  hasEmail?: boolean;
  isAvailable?: boolean;
  isFavorite?: boolean;
}

export interface ContactInteraction {
  contactId: string;
  type: 'call' | 'email' | 'message' | 'view';
  timestamp: string;
  success?: boolean;
  notes?: string;
}