import {
  EventDocument,
  OfficialNotification,
  SearchFilters,
  SearchQuery,
  SearchResult,
  RegattaCategory,
  DocumentType,
  NotificationType
} from '../types/noticeBoard';
import { getCategoryForDocument, getCategoryForNotification } from './categoryUtils';

/**
 * Search through documents and notifications using advanced filters
 */
export class SearchEngine {
  private documents: EventDocument[] = [];
  private notifications: OfficialNotification[] = [];

  constructor(documents: EventDocument[] = [], notifications: OfficialNotification[] = []) {
    this.documents = documents;
    this.notifications = notifications;
  }

  /**
   * Update the search index with new data
   */
  updateIndex(documents: EventDocument[], notifications: OfficialNotification[]): void {
    this.documents = documents;
    this.notifications = notifications;
  }

  /**
   * Perform search with advanced filtering
   */
  search(query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];

    // Search documents
    const filteredDocs = this.filterDocuments(query.filters);
    const docResults = this.searchDocuments(filteredDocs, query.text);
    results.push(...docResults);

    // Search notifications
    const filteredNotifications = this.filterNotifications(query.filters);
    const notificationResults = this.searchNotifications(filteredNotifications, query.text);
    results.push(...notificationResults);

    // Sort and limit results
    const sortedResults = this.sortResults(results, query.sortBy, query.sortOrder);
    
    if (query.limit) {
      const start = query.offset || 0;
      return sortedResults.slice(start, start + query.limit);
    }

    return sortedResults;
  }

  /**
   * Filter documents based on search filters
   */
  private filterDocuments(filters: SearchFilters): EventDocument[] {
    return this.documents.filter(doc => {
      // Category filter
      if (filters.categories.length > 0) {
        const docCategory = getCategoryForDocument(doc);
        if (!filters.categories.includes(docCategory)) return false;
      }

      // Document type filter
      if (filters.documentTypes.length > 0) {
        if (!filters.documentTypes.includes(doc.type)) return false;
      }

      // Priority filter
      if (filters.priorities.length > 0) {
        if (!filters.priorities.includes(doc.priority)) return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const docDate = new Date(doc.uploadedAt);
        if (filters.dateRange.start && docDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && docDate > new Date(filters.dateRange.end)) return false;
      }

      // Language filter
      if (filters.languages.length > 0 && doc.language) {
        if (!filters.languages.includes(doc.language)) return false;
      }

      // Required documents filter
      if (filters.hasAttachments && !doc.isRequired) return false;

      // Action required filter
      if (filters.requiresAction && !doc.keyData?.actionRequired) return false;

      return true;
    });
  }

  /**
   * Filter notifications based on search filters
   */
  private filterNotifications(filters: SearchFilters): OfficialNotification[] {
    return this.notifications.filter(notification => {
      // Category filter
      if (filters.categories.length > 0) {
        const notificationCategory = getCategoryForNotification(notification);
        if (!filters.categories.includes(notificationCategory)) return false;
      }

      // Notification type filter
      if (filters.notificationTypes.length > 0) {
        if (!filters.notificationTypes.includes(notification.type)) return false;
      }

      // Priority filter
      if (filters.priorities.length > 0) {
        if (!filters.priorities.includes(notification.priority)) return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const notificationDate = new Date(notification.publishedAt);
        if (filters.dateRange.start && notificationDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && notificationDate > new Date(filters.dateRange.end)) return false;
      }

      // Author filter
      if (filters.authors.length > 0) {
        if (!filters.authors.includes(notification.author)) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          notification.tags.some(notificationTag => 
            notificationTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      // Read status filter
      if (filters.readStatus === 'read' && !notification.isRead) return false;
      if (filters.readStatus === 'unread' && notification.isRead) return false;

      // Attachments filter
      if (filters.hasAttachments && (!notification.attachments || notification.attachments.length === 0)) return false;

      // Action required filter
      if (filters.requiresAction && !notification.metadata?.followUpRequired) return false;

      return true;
    });
  }

  /**
   * Search documents by text content
   */
  private searchDocuments(documents: EventDocument[], searchText: string): SearchResult[] {
    if (!searchText.trim()) {
      return documents.map(doc => this.documentToSearchResult(doc, 1.0));
    }

    const searchTerms = searchText.toLowerCase().split(/\s+/);
    const results: SearchResult[] = [];

    documents.forEach(doc => {
      let relevanceScore = 0;
      let highlightedText = '';

      // Search in title (highest weight)
      const titleMatches = this.countMatches(doc.title.toLowerCase(), searchTerms);
      relevanceScore += titleMatches * 3;

      // Search in description (medium weight)
      if (doc.description) {
        const descMatches = this.countMatches(doc.description.toLowerCase(), searchTerms);
        relevanceScore += descMatches * 2;
        if (descMatches > 0) {
          highlightedText = this.highlightMatches(doc.description, searchTerms);
        }
      }

      // Search in key data summary (medium weight)
      if (doc.keyData?.summary) {
        const summaryMatches = this.countMatches(doc.keyData.summary.toLowerCase(), searchTerms);
        relevanceScore += summaryMatches * 2;
        if (summaryMatches > 0 && !highlightedText) {
          highlightedText = this.highlightMatches(doc.keyData.summary, searchTerms);
        }
      }

      // Search in extracted fields (low weight)
      if (doc.keyData?.extractedFields) {
        const fieldsText = Object.values(doc.keyData.extractedFields).join(' ').toLowerCase();
        const fieldsMatches = this.countMatches(fieldsText, searchTerms);
        relevanceScore += fieldsMatches * 1;
      }

      if (relevanceScore > 0) {
        const result = this.documentToSearchResult(doc, relevanceScore);
        if (highlightedText) {
          result.highlightedText = highlightedText;
        }
        results.push(result);
      }
    });

    return results;
  }

  /**
   * Search notifications by text content
   */
  private searchNotifications(notifications: OfficialNotification[], searchText: string): SearchResult[] {
    if (!searchText.trim()) {
      return notifications.map(notification => this.notificationToSearchResult(notification, 1.0));
    }

    const searchTerms = searchText.toLowerCase().split(/\s+/);
    const results: SearchResult[] = [];

    notifications.forEach(notification => {
      let relevanceScore = 0;
      let highlightedText = '';

      // Search in title (highest weight)
      const titleMatches = this.countMatches(notification.title.toLowerCase(), searchTerms);
      relevanceScore += titleMatches * 3;

      // Search in content (medium weight)
      const contentMatches = this.countMatches(notification.content.toLowerCase(), searchTerms);
      relevanceScore += contentMatches * 2;
      if (contentMatches > 0) {
        highlightedText = this.highlightMatches(notification.content, searchTerms);
      }

      // Search in tags (low weight)
      const tagsText = notification.tags.join(' ').toLowerCase();
      const tagsMatches = this.countMatches(tagsText, searchTerms);
      relevanceScore += tagsMatches * 1;

      // Search in key points (medium weight)
      if (notification.metadata?.keyPoints) {
        const keyPointsText = notification.metadata.keyPoints.join(' ').toLowerCase();
        const keyPointsMatches = this.countMatches(keyPointsText, searchTerms);
        relevanceScore += keyPointsMatches * 2;
      }

      if (relevanceScore > 0) {
        const result = this.notificationToSearchResult(notification, relevanceScore);
        if (highlightedText) {
          result.highlightedText = highlightedText;
        }
        results.push(result);
      }
    });

    return results;
  }

  /**
   * Count matches of search terms in text
   */
  private countMatches(text: string, searchTerms: string[]): number {
    return searchTerms.reduce((count, term) => {
      const matches = (text.match(new RegExp(term, 'gi')) || []).length;
      return count + matches;
    }, 0);
  }

  /**
   * Highlight search terms in text
   */
  private highlightMatches(text: string, searchTerms: string[], maxLength: number = 200): string {
    let highlighted = text;
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '**$1**');
    });

    // Truncate if too long
    if (highlighted.length > maxLength) {
      // Try to find the first highlighted term and center around it
      const firstHighlight = highlighted.indexOf('**');
      if (firstHighlight > -1) {
        const start = Math.max(0, firstHighlight - 50);
        const end = Math.min(highlighted.length, start + maxLength);
        highlighted = (start > 0 ? '...' : '') + 
                     highlighted.substring(start, end) + 
                     (end < highlighted.length ? '...' : '');
      } else {
        highlighted = highlighted.substring(0, maxLength) + '...';
      }
    }

    return highlighted;
  }

  /**
   * Convert document to search result
   */
  private documentToSearchResult(doc: EventDocument, relevanceScore: number): SearchResult {
    return {
      id: doc.id,
      type: 'document',
      title: doc.title,
      snippet: doc.description || doc.keyData?.summary || '',
      category: getCategoryForDocument(doc),
      priority: doc.priority,
      publishedAt: doc.uploadedAt,
      relevanceScore
    };
  }

  /**
   * Convert notification to search result
   */
  private notificationToSearchResult(notification: OfficialNotification, relevanceScore: number): SearchResult {
    return {
      id: notification.id,
      type: 'notification',
      title: notification.title,
      snippet: notification.content.substring(0, 200) + (notification.content.length > 200 ? '...' : ''),
      category: getCategoryForNotification(notification),
      priority: notification.priority,
      publishedAt: notification.publishedAt,
      relevanceScore
    };
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], sortBy: string, sortOrder: 'asc' | 'desc'): SearchResult[] {
    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = b.relevanceScore - a.relevanceScore;
          break;
        case 'date':
          comparison = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { 'critical': 5, 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
          comparison = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                      (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = b.relevanceScore - a.relevanceScore;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }
}

/**
 * Create default search filters
 */
export function createDefaultFilters(): SearchFilters {
  return {
    categories: [],
    documentTypes: [],
    notificationTypes: [],
    priorities: [],
    dateRange: {},
    authors: [],
    tags: [],
    readStatus: 'all',
    hasAttachments: false,
    requiresAction: false,
    languages: []
  };
}

/**
 * Parse search query string for advanced search features
 */
export function parseSearchQuery(query: string): { text: string; filters: Partial<SearchFilters> } {
  const filters: Partial<SearchFilters> = {};
  let cleanText = query;

  // Extract category filters: category:pre_event
  const categoryMatch = query.match(/category:(\w+)/gi);
  if (categoryMatch) {
    filters.categories = categoryMatch.map(match => 
      match.split(':')[1].toUpperCase() as RegattaCategory
    );
    cleanText = cleanText.replace(/category:\w+/gi, '').trim();
  }

  // Extract priority filters: priority:urgent
  const priorityMatch = query.match(/priority:(\w+)/gi);
  if (priorityMatch) {
    filters.priorities = priorityMatch.map(match => 
      match.split(':')[1].toLowerCase()
    ) as any[];
    cleanText = cleanText.replace(/priority:\w+/gi, '').trim();
  }

  // Extract author filters: author:"Race Committee"
  const authorMatch = query.match(/author:"([^"]+)"/gi);
  if (authorMatch) {
    filters.authors = authorMatch.map(match => 
      match.match(/"([^"]+)"/)?.[1] || ''
    ).filter(Boolean);
    cleanText = cleanText.replace(/author:"[^"]+"/gi, '').trim();
  }

  // Extract tag filters: tag:weather
  const tagMatch = query.match(/tag:(\w+)/gi);
  if (tagMatch) {
    filters.tags = tagMatch.map(match => match.split(':')[1]);
    cleanText = cleanText.replace(/tag:\w+/gi, '').trim();
  }

  // Extract read status: is:unread
  const readMatch = query.match(/is:(read|unread)/gi);
  if (readMatch) {
    filters.readStatus = readMatch[0].split(':')[1].toLowerCase() as 'read' | 'unread';
    cleanText = cleanText.replace(/is:(read|unread)/gi, '').trim();
  }

  return {
    text: cleanText.trim(),
    filters
  };
}