import { 
  RegattaCategory, 
  CategoryInfo, 
  DocumentType, 
  NotificationType,
  EventDocument,
  OfficialNotification 
} from '../types/noticeBoard';

// Category configuration with display information and mapping
export const CATEGORY_CONFIG: Record<RegattaCategory, CategoryInfo> = {
  [RegattaCategory.PRE_EVENT]: {
    category: RegattaCategory.PRE_EVENT,
    displayName: 'Pre-Event Documents',
    description: 'Notice of Race, Sailing Instructions, Entry Forms, and Measurement Requirements',
    icon: 'file-text',
    color: '#007AFF',
    documentCount: 0,
    notificationCount: 0,
    unreadCount: 0,
    lastUpdated: '',
    isExpanded: true,
    priority: 1
  },
  [RegattaCategory.DAILY_OPERATIONS]: {
    category: RegattaCategory.DAILY_OPERATIONS,
    displayName: 'Daily Operations',
    description: 'Race Schedule, Course Information, Weather Forecasts, and Daily Briefings',
    icon: 'calendar',
    color: '#34C759',
    documentCount: 0,
    notificationCount: 0,
    unreadCount: 0,
    lastUpdated: '',
    isExpanded: true,
    priority: 2
  },
  [RegattaCategory.COMPETITION_MANAGEMENT]: {
    category: RegattaCategory.COMPETITION_MANAGEMENT,
    displayName: 'Competition Management',
    description: 'Live Scoring, Results, Boat Rotations, and Equipment Assignments',
    icon: 'trophy',
    color: '#FF9500',
    documentCount: 0,
    notificationCount: 0,
    unreadCount: 0,
    lastUpdated: '',
    isExpanded: true,
    priority: 3
  },
  [RegattaCategory.PROTESTS_HEARINGS]: {
    category: RegattaCategory.PROTESTS_HEARINGS,
    displayName: 'Protests & Hearings',
    description: 'Protest Information, Hearing Schedule, Decisions, and Appeals',
    icon: 'scale',
    color: '#FF3B30',
    documentCount: 0,
    notificationCount: 0,
    unreadCount: 0,
    lastUpdated: '',
    isExpanded: false,
    priority: 4
  },
  [RegattaCategory.SAFETY_REGULATORY]: {
    category: RegattaCategory.SAFETY_REGULATORY,
    displayName: 'Safety & Regulatory',
    description: 'Safety Notices, Rule Amendments, Equipment Regulations, and Emergency Procedures',
    icon: 'shield',
    color: '#FF2D92',
    documentCount: 0,
    notificationCount: 0,
    unreadCount: 0,
    lastUpdated: '',
    isExpanded: false,
    priority: 5
  },
  [RegattaCategory.ADMINISTRATIVE]: {
    category: RegattaCategory.ADMINISTRATIVE,
    displayName: 'Administrative',
    description: 'General Notices, Contact Information, Venue Details, and Other Updates',
    icon: 'settings',
    color: '#8E8E93',
    documentCount: 0,
    notificationCount: 0,
    unreadCount: 0,
    lastUpdated: '',
    isExpanded: false,
    priority: 6
  }
};

// Document type to category mapping
export const DOCUMENT_TYPE_TO_CATEGORY: Record<DocumentType, RegattaCategory> = {
  // Pre-event documents
  'notice_of_race': RegattaCategory.PRE_EVENT,
  'sailing_instructions': RegattaCategory.PRE_EVENT,
  'entry_form': RegattaCategory.PRE_EVENT,
  'measurement_requirements': RegattaCategory.PRE_EVENT,
  
  // Daily operations
  'race_schedule': RegattaCategory.DAILY_OPERATIONS,
  'course_info': RegattaCategory.DAILY_OPERATIONS,
  'weather_forecast': RegattaCategory.DAILY_OPERATIONS,
  'daily_briefing': RegattaCategory.DAILY_OPERATIONS,
  
  // Competition management
  'live_scoring': RegattaCategory.COMPETITION_MANAGEMENT,
  'results': RegattaCategory.COMPETITION_MANAGEMENT,
  'boat_rotations': RegattaCategory.COMPETITION_MANAGEMENT,
  'equipment_assignments': RegattaCategory.COMPETITION_MANAGEMENT,
  
  // Protests & hearings
  'protest_info': RegattaCategory.PROTESTS_HEARINGS,
  'hearing_schedule': RegattaCategory.PROTESTS_HEARINGS,
  'decisions': RegattaCategory.PROTESTS_HEARINGS,
  'appeals': RegattaCategory.PROTESTS_HEARINGS,
  
  // Safety & regulatory
  'safety_notice': RegattaCategory.SAFETY_REGULATORY,
  'rule_amendments': RegattaCategory.SAFETY_REGULATORY,
  'equipment_regulations': RegattaCategory.SAFETY_REGULATORY,
  'emergency_procedures': RegattaCategory.SAFETY_REGULATORY,
  
  // Administrative
  'general_notices': RegattaCategory.ADMINISTRATIVE,
  'contact_info': RegattaCategory.ADMINISTRATIVE,
  'venue_info': RegattaCategory.ADMINISTRATIVE,
  'other': RegattaCategory.ADMINISTRATIVE
};

// Notification type to category mapping
export const NOTIFICATION_TYPE_TO_CATEGORY: Record<NotificationType, RegattaCategory> = {
  // Pre-event
  'entry_update': RegattaCategory.PRE_EVENT,
  'measurement_reminder': RegattaCategory.PRE_EVENT,
  'registration_deadline': RegattaCategory.PRE_EVENT,
  
  // Daily operations
  'weather': RegattaCategory.DAILY_OPERATIONS,
  'course_change': RegattaCategory.DAILY_OPERATIONS,
  'schedule_update': RegattaCategory.DAILY_OPERATIONS,
  'daily_briefing': RegattaCategory.DAILY_OPERATIONS,
  
  // Competition management
  'results': RegattaCategory.COMPETITION_MANAGEMENT,
  'scoring_update': RegattaCategory.COMPETITION_MANAGEMENT,
  'equipment_change': RegattaCategory.COMPETITION_MANAGEMENT,
  'boat_rotation': RegattaCategory.COMPETITION_MANAGEMENT,
  
  // Protests & hearings
  'protest': RegattaCategory.PROTESTS_HEARINGS,
  'hearing_schedule': RegattaCategory.PROTESTS_HEARINGS,
  'decision_published': RegattaCategory.PROTESTS_HEARINGS,
  'appeal_notice': RegattaCategory.PROTESTS_HEARINGS,
  
  // Safety & regulatory
  'emergency': RegattaCategory.SAFETY_REGULATORY,
  'safety_warning': RegattaCategory.SAFETY_REGULATORY,
  'rule_change': RegattaCategory.SAFETY_REGULATORY,
  'equipment_inspection': RegattaCategory.SAFETY_REGULATORY,
  
  // Administrative
  'announcement': RegattaCategory.ADMINISTRATIVE,
  'venue_info': RegattaCategory.ADMINISTRATIVE,
  'contact_update': RegattaCategory.ADMINISTRATIVE,
  'general': RegattaCategory.ADMINISTRATIVE
};

/**
 * Get category information for a given category
 */
export function getCategoryInfo(category: RegattaCategory): CategoryInfo {
  return { ...CATEGORY_CONFIG[category] };
}

/**
 * Get all categories sorted by priority
 */
export function getAllCategories(): CategoryInfo[] {
  return Object.values(CATEGORY_CONFIG).sort((a, b) => a.priority - b.priority);
}

/**
 * Determine category for a document based on its type
 */
export function getCategoryForDocument(document: EventDocument): RegattaCategory {
  return DOCUMENT_TYPE_TO_CATEGORY[document.type] || RegattaCategory.ADMINISTRATIVE;
}

/**
 * Determine category for a notification based on its type
 */
export function getCategoryForNotification(notification: OfficialNotification): RegattaCategory {
  return NOTIFICATION_TYPE_TO_CATEGORY[notification.type] || RegattaCategory.ADMINISTRATIVE;
}

/**
 * Update category counts based on provided items
 */
export function updateCategoryCounts(
  documents: EventDocument[],
  notifications: OfficialNotification[]
): Record<RegattaCategory, CategoryInfo> {
  const updatedCategories = { ...CATEGORY_CONFIG };
  
  // Reset counts
  Object.values(updatedCategories).forEach(category => {
    category.documentCount = 0;
    category.notificationCount = 0;
    category.unreadCount = 0;
  });
  
  // Count documents
  documents.forEach(doc => {
    const category = getCategoryForDocument(doc);
    updatedCategories[category].documentCount++;
    updatedCategories[category].lastUpdated = doc.lastModified || doc.uploadedAt;
  });
  
  // Count notifications
  notifications.forEach(notification => {
    const category = getCategoryForNotification(notification);
    updatedCategories[category].notificationCount++;
    if (!notification.isRead) {
      updatedCategories[category].unreadCount++;
    }
    
    // Update last updated timestamp
    const publishedDate = new Date(notification.publishedAt);
    const currentLastUpdate = updatedCategories[category].lastUpdated;
    if (!currentLastUpdate || publishedDate > new Date(currentLastUpdate)) {
      updatedCategories[category].lastUpdated = notification.publishedAt;
    }
  });
  
  return updatedCategories;
}

/**
 * Filter items by category
 */
export function filterByCategory<T extends { type: DocumentType | NotificationType }>(
  items: T[],
  category: RegattaCategory,
  isDocument: boolean = true
): T[] {
  return items.filter(item => {
    const itemCategory = isDocument 
      ? DOCUMENT_TYPE_TO_CATEGORY[item.type as DocumentType]
      : NOTIFICATION_TYPE_TO_CATEGORY[item.type as NotificationType];
    return itemCategory === category;
  });
}

/**
 * Get priority-based sorting for mixed content
 */
export function getPriorityWeight(priority: string): number {
  switch (priority) {
    case 'critical': return 5;
    case 'urgent': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

/**
 * Sort categories by unread count and priority
 */
export function sortCategoriesByRelevance(categories: CategoryInfo[]): CategoryInfo[] {
  return categories.sort((a, b) => {
    // First sort by unread count (descending)
    if (a.unreadCount !== b.unreadCount) {
      return b.unreadCount - a.unreadCount;
    }
    // Then by total notification count (descending)
    if (a.notificationCount !== b.notificationCount) {
      return b.notificationCount - a.notificationCount;
    }
    // Finally by category priority (ascending)
    return a.priority - b.priority;
  });
}

/**
 * Generate category summary text
 */
export function getCategorySummary(category: CategoryInfo): string {
  const { documentCount, notificationCount, unreadCount } = category;
  const parts: string[] = [];
  
  if (documentCount > 0) {
    parts.push(`${documentCount} document${documentCount === 1 ? '' : 's'}`);
  }
  
  if (notificationCount > 0) {
    parts.push(`${notificationCount} notice${notificationCount === 1 ? '' : 's'}`);
    if (unreadCount > 0) {
      parts.push(`(${unreadCount} unread)`);
    }
  }
  
  return parts.length > 0 ? parts.join(', ') : 'No items';
}

/**
 * Check if category has urgent items
 */
export function hasUrgentItems(
  category: RegattaCategory,
  notifications: OfficialNotification[]
): boolean {
  return notifications.some(notification => 
    getCategoryForNotification(notification) === category &&
    (notification.priority === 'urgent' || notification.priority === 'high') &&
    !notification.isRead
  );
}