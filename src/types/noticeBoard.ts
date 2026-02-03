// Regatta Category System - 7 main categories (including media)
export enum RegattaCategory {
  PRE_EVENT = 'pre_event',
  DAILY_OPERATIONS = 'daily_operations',
  COMPETITION_MANAGEMENT = 'competition_management',
  PROTESTS_HEARINGS = 'protests_hearings',
  SAFETY_REGULATORY = 'safety_regulatory',
  ADMINISTRATIVE = 'administrative',
  MEDIA_ANNOUNCEMENTS = 'media_announcements'
}

// Enhanced document type system
export type DocumentType =
  // Pre-event documents
  | 'notice_of_race' | 'sailing_instructions' | 'entry_form' | 'measurement_requirements'
  // Daily operations
  | 'race_schedule' | 'course_info' | 'weather_forecast' | 'daily_briefing'
  // Competition management
  | 'live_scoring' | 'results' | 'boat_rotations' | 'equipment_assignments'
  // Protests & hearings
  | 'protest_info' | 'hearing_schedule' | 'decisions' | 'appeals'
  // Safety & regulatory
  | 'safety_notice' | 'rule_amendments' | 'equipment_regulations' | 'emergency_procedures'
  // Administrative
  | 'general_notices' | 'contact_info' | 'venue_info' | 'other'
  // Media & announcements
  | 'podcast' | 'video' | 'press_release' | 'media_advisory';

// Document key data extraction structure
export interface DocumentKeyData {
  extractedFields: Record<string, any>;
  summary: string;
  actionRequired?: string;
  deadline?: string;
  effectiveDate?: string;
  targetAudience?: string[];
  relatedDocuments?: string[];
  changesSinceLastVersion?: string[];
}

// Download and sharing options
export interface DocumentOptions {
  formats: ('pdf' | 'print' | 'mobile' | 'offline')[];
  bundleWith?: string[];
  printOptimized: boolean;
  offlineAccess: boolean;
  shareRestrictions?: 'none' | 'registered_only' | 'officials_only';
}

// Enhanced document structure
export interface EventDocument {
  id: string;
  title: string;
  type: DocumentType;
  category: RegattaCategory;
  url: string;
  fileType: 'pdf' | 'html' | 'doc' | 'txt';
  size?: number;
  uploadedAt: string;
  lastModified?: string;
  downloadCount?: number;
  isRequired: boolean;
  language?: string;
  description?: string;
  version: string;
  keyData?: DocumentKeyData;
  downloadOptions?: DocumentOptions;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'published' | 'amended' | 'superseded';
}

// Enhanced notification types aligned with regatta categories
export type NotificationType =
  // Pre-event
  | 'entry_update' | 'measurement_reminder' | 'registration_deadline'
  // Daily operations
  | 'weather' | 'course_change' | 'schedule_update' | 'daily_briefing'
  // Competition management
  | 'results' | 'scoring_update' | 'equipment_change' | 'boat_rotation'
  // Protests & hearings
  | 'protest' | 'hearing_schedule' | 'decision_published' | 'appeal_notice'
  // Safety & regulatory
  | 'emergency' | 'safety_warning' | 'rule_change' | 'equipment_inspection'
  // Administrative
  | 'announcement' | 'venue_info' | 'contact_update' | 'general'
  // Media & announcements
  | 'podcast_episode' | 'video_release' | 'press_release' | 'media_interview';

// Enhanced notification metadata
export interface NotificationMetadata {
  readBy: string[];
  bookmarkedBy: string[];
  sharedCount: number;
  importance: 'info' | 'action_required' | 'urgent' | 'critical';
  category: RegattaCategory;
  subcategory?: string;
  keyPoints?: string[];
  relatedNotifications?: string[];
  followUpRequired?: boolean;
  followUpDeadline?: string;
}

export interface OfficialNotification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publishedAt: string;
  expiresAt?: string;
  author: string;
  authorRole: 'race_committee' | 'protest_committee' | 'technical_committee' | 'organizer' | 'safety_officer';
  tags: string[];
  isRead: boolean;
  affectedRaces?: number[];
  attachments?: EventDocument[];
  metadata?: NotificationMetadata;
  version: string;
  amendmentHistory?: Array<{
    version: string;
    changes: string;
    amendedAt: string;
    amendedBy: string;
  }>;
}

export interface SailingInstruction {
  id: string;
  section: string;
  title: string;
  content: string;
  ruleReference?: string;
  amendments: Amendment[];
  effective: boolean;
  lastUpdated: string;
}

export interface Amendment {
  id: string;
  originalText: string;
  amendedText: string;
  reason: string;
  amendedAt: string;
  effectiveFrom: string;
}

export interface NoticeOfRace {
  id: string;
  eventName: string;
  organizer: string;
  venue: string;
  dates: {
    start: string;
    end: string;
  };
  registrationDeadline: string;
  entryFee: {
    amount: number;
    currency: string;
    lateFee?: number;
  };
  classes: ClassInfo[];
  eligibility: string[];
  contacts: ContactInfo[];
  documents: EventDocument[];
  lastUpdated: string;
}

export interface ClassInfo {
  name: string;
  eligibilityRules: string;
  measurementRequirements: string[];
  maxEntries?: number;
  entryFee?: {
    amount: number;
    currency: string;
  };
}

export interface ContactInfo {
  role: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Competitor {
  id: string;
  sailNumber: string;
  helmName: string;
  crewNames: string[];
  country: string;
  club: string;
  className: string;
  boatName?: string;
  registrationStatus: 'pending' | 'confirmed' | 'paid' | 'incomplete';
  entryDate: string;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  documentsSubmitted: boolean;
  measurementCompleted: boolean;
  specialRequirements?: string[];
  emergencyContact?: ContactInfo;
}

export interface ProtestSubmission {
  id: string;
  protestingBoat: string;
  protestedBoat: string;
  incident: {
    raceNumber: number;
    timeOfIncident: string;
    location: string;
    description: string;
    witnessBoats: string[];
  };
  rules: {
    alleged: string[];
    description: string;
  };
  submittedAt: string;
  submittedBy: string;
  status: 'submitted' | 'scheduled' | 'heard' | 'decided' | 'appealed';
  hearingTime?: string;
  decision?: ProtestDecision;
  documents: EventDocument[];
}

export interface ProtestDecision {
  id: string;
  protestId: string;
  decision: 'protest_upheld' | 'protest_dismissed' | 'protest_invalid';
  penalty?: {
    type: 'disqualification' | 'time_penalty' | 'points_penalty' | 'warning';
    details: string;
    raceAffected: number;
  };
  reasoning: string;
  decidedAt: string;
  judges: string[];
  appealable: boolean;
  appealDeadline?: string;
}

export interface Hearing {
  id: string;
  protestId: string;
  scheduledTime: string;
  location: string;
  protestingBoat: string;
  protestedBoat: string;
  judges: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'postponed';
  estimatedDuration: number;
  rules: string[];
  witnesses?: string[];
}

export interface ScoringInquiry {
  id: string;
  sailNumber: string;
  raceNumber: number;
  inquiry: string;
  submittedAt: string;
  submittedBy: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  response?: string;
  resolvedAt?: string;
  scoreChange?: {
    from: number;
    to: number;
    reason: string;
  };
}

export interface OnWaterPenalty {
  id: string;
  sailNumber: string;
  raceNumber: number;
  penaltyType: 'one_turn' | 'two_turns' | 'twenty_percent' | 'dsq' | 'ocs' | 'bfd';
  rule: string;
  timeAssessed: string;
  location: string;
  description: string;
  assessedBy: string;
  acknowledged: boolean;
  scoreAdjustment?: number;
}

export interface RegistrationStatus {
  competitorId: string;
  status: 'incomplete' | 'pending_review' | 'approved' | 'rejected';
  checklist: {
    entryForm: boolean;
    payment: boolean;
    measurementCertificate: boolean;
    insurance: boolean;
    waiver: boolean;
    parentalConsent?: boolean;
  };
  missingDocuments: string[];
  paymentDue?: {
    amount: number;
    currency: string;
    dueDate: string;
  };
  lastUpdated: string;
}

export interface CourseChange {
  id: string;
  raceNumber: number;
  changeType: 'course_change' | 'mark_position' | 'start_time' | 'cancellation';
  description: string;
  reason: string;
  effectiveTime: string;
  announcedAt: string;
  newInstructions?: string;
  mapReference?: string;
}

export interface WeatherNotice {
  id: string;
  type: 'forecast_update' | 'warning' | 'racing_suspended' | 'racing_resumed';
  title: string;
  description: string;
  conditions: {
    windSpeed: {
      current: number;
      forecast: number;
      gusts?: number;
    };
    visibility: number;
    temperature: number;
    pressure?: number;
  };
  validFrom: string;
  validUntil?: string;
  actionRequired?: string;
  issuedBy: string;
  severity: 'info' | 'advisory' | 'warning' | 'emergency';
}

// Media item for podcasts, videos, and other media content
export interface MediaItem {
  id: string;
  type: 'podcast' | 'video' | 'press_release' | 'interview' | 'gallery';
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds for audio/video
  publishedAt: string;
  author?: string;
  platform?: 'spotify' | 'youtube' | 'apple_podcasts' | 'vimeo' | 'external';
  tags: string[];
  isNew: boolean;
  episodeNumber?: number;
  seriesName?: string;
}

export interface NoticeBoardEvent {
  id: string;
  name: string;
  organizer: string;
  venue: string;
  dates: {
    start: string;
    end: string;
  };
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  entryCount: number;
  classes: string[];
  languages: string[];
  lastUpdated: string;
  noticeBoard: {
    documents: EventDocument[];
    notifications: OfficialNotification[];
    protests: ProtestSubmission[];
    hearings: Hearing[];
    scoringInquiries: ScoringInquiry[];
    penalties: OnWaterPenalty[];
    courseChanges: CourseChange[];
    weatherNotices: WeatherNotice[];
    mediaItems: MediaItem[];
  };
}

export interface NoticeBoardServiceConfig {
  baseUrl: string;
  cacheDuration: number;
  autoRefreshInterval: number;
  offlineRetentionDays: number;
}

// Enhanced category management interfaces
export interface CategoryInfo {
  category: RegattaCategory;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  documentCount: number;
  notificationCount: number;
  unreadCount: number;
  lastUpdated: string;
  isExpanded: boolean;
  priority: number;
}

// Advanced search and filtering
export interface SearchFilters {
  categories: RegattaCategory[];
  documentTypes: DocumentType[];
  notificationTypes: NotificationType[];
  priorities: ('low' | 'medium' | 'high' | 'urgent' | 'critical')[];
  dateRange: {
    start?: string;
    end?: string;
  };
  authors: string[];
  tags: string[];
  readStatus: 'all' | 'read' | 'unread';
  hasAttachments: boolean;
  requiresAction: boolean;
  languages: string[];
}

export interface SearchQuery {
  text: string;
  filters: SearchFilters;
  sortBy: 'date' | 'priority' | 'category' | 'relevance' | 'title';
  sortOrder: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  type: 'document' | 'notification' | 'protest' | 'hearing';
  title: string;
  snippet: string;
  category: RegattaCategory;
  priority: string;
  publishedAt: string;
  relevanceScore: number;
  highlightedText?: string;
}

// User preferences for notice board
export interface UserPreferences {
  defaultView: 'overview' | 'categories' | 'timeline';
  expandedCategories: RegattaCategory[];
  notificationSettings: {
    pushEnabled: boolean;
    emailDigest: 'none' | 'daily' | 'weekly';
    urgentOnly: boolean;
    categories: RegattaCategory[];
  };
  displaySettings: {
    compactView: boolean;
    showThumbnails: boolean;
    autoRefresh: boolean;
    offlineMode: boolean;
  };
  searchHistory: string[];
  bookmarkedItems: string[];
  hiddenItems: string[];
}

// Real-time update management
export interface UpdateNotification {
  id: string;
  type: 'new' | 'updated' | 'deleted';
  category: RegattaCategory;
  itemId: string;
  itemType: 'document' | 'notification' | 'protest' | 'hearing';
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  timestamp: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

// Download and export management
export interface DownloadRequest {
  id: string;
  type: 'single' | 'category' | 'bundle' | 'search_results';
  items: string[];
  format: 'pdf' | 'zip' | 'print' | 'mobile';
  options: {
    includeAttachments: boolean;
    combineDocuments: boolean;
    addTableOfContents: boolean;
    includeMetadata: boolean;
  };
  status: 'pending' | 'processing' | 'ready' | 'expired' | 'failed';
  createdAt: string;
  expiresAt: string;
  downloadUrl?: string;
  fileSize?: number;
}