import { logger } from '@firebase/logger';
import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';

export interface ProcessedDocument {
  id: string;
  eventId: string;
  title: string;
  type: 'sailing_instructions' | 'notice_of_race' | 'schedule' | 'amendment' | 'results' | 'other';
  category: string;
  priority: 'high' | 'medium' | 'low';
  url: string;
  fileType: 'pdf' | 'doc' | 'html' | 'txt' | 'unknown';
  source: 'china-coast-race-week' | 'racing-rules-of-sailing';
  discoveredAt: string;
  contentProcessed?: boolean;
  contentLength?: number;
  processedAt?: string;
  processingError?: string;
  sourceUrl?: string;
}

export interface DocumentContent {
  documentId: string;
  eventId: string;
  content: string;
  extractedData?: {
    rules: string[];
    amendments: Array<{
      id: string;
      text: string;
      extractedAt: string;
    }>;
    schedules: string[];
    courses: string[];
    communications: string[];
  };
  metadata?: {
    pages?: number;
    size?: number;
    downloadedAt?: string;
  };
  processedAt: string;
}

export interface DocumentSearchResult {
  document: ProcessedDocument;
  content?: DocumentContent;
  relevanceScore?: number;
  matchedTerms?: string[];
}

export class DocumentProcessingService {
  private cache: Map<string, ProcessedDocument[]> = new Map();
  private contentCache: Map<string, DocumentContent> = new Map();
  private lastFetchTime: Map<string, number> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all documents for an event
   */
  async getEventDocuments(eventId: string): Promise<ProcessedDocument[]> {
    try {
      const cacheKey = `documents_${eventId}`;
      
      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;
      }

      logger.log('📄 Fetching documents for event:', eventId);
      
      const documentsRef = collection(db, 'events', eventId, 'documents');
      const q = query(
        documentsRef,
        orderBy('priority', 'desc'),
        orderBy('discoveredAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const documents: ProcessedDocument[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          discoveredAt: data.discoveredAt?.toDate?.()?.toISOString() || data.discoveredAt,
          processedAt: data.processedAt?.toDate?.()?.toISOString() || data.processedAt,
        } as ProcessedDocument);
      });
      
      // Cache results
      this.cache.set(cacheKey, documents);
      this.lastFetchTime.set(cacheKey, Date.now());
      
      logger.log(`📄 Found ${documents.length} documents for ${eventId}`);
      return documents;
      
    } catch (error) {
      logger.error('❌ Error fetching event documents:', error);
      return [];
    }
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(eventId: string, category: string): Promise<ProcessedDocument[]> {
    try {
      const allDocuments = await this.getEventDocuments(eventId);
      return allDocuments.filter(doc => doc.category === category);
    } catch (error) {
      logger.error('❌ Error fetching documents by category:', error);
      return [];
    }
  }

  /**
   * Get documents by type
   */
  async getDocumentsByType(eventId: string, type: ProcessedDocument['type']): Promise<ProcessedDocument[]> {
    try {
      const allDocuments = await this.getEventDocuments(eventId);
      return allDocuments.filter(doc => doc.type === type);
    } catch (error) {
      logger.error('❌ Error fetching documents by type:', error);
      return [];
    }
  }

  /**
   * Get high priority documents (sailing instructions, notices of race, amendments)
   */
  async getHighPriorityDocuments(eventId: string): Promise<ProcessedDocument[]> {
    try {
      const allDocuments = await this.getEventDocuments(eventId);
      return allDocuments.filter(doc => doc.priority === 'high');
    } catch (error) {
      logger.error('❌ Error fetching high priority documents:', error);
      return [];
    }
  }

  /**
   * Get document content (full text and extracted data)
   */
  async getDocumentContent(documentId: string): Promise<DocumentContent | null> {
    try {
      // Check cache first
      if (this.contentCache.has(documentId)) {
        return this.contentCache.get(documentId)!;
      }

      logger.log('📄 Fetching document content for:', documentId);
      
      const contentRef = doc(db, 'document_content', documentId);
      const contentSnap = await getDoc(contentRef);
      
      if (!contentSnap.exists()) {
        logger.warn('📄 No content found for document:', documentId);
        return null;
      }
      
      const data = contentSnap.data();
      const content: DocumentContent = {
        documentId,
        eventId: data.eventId,
        content: data.content,
        extractedData: data.extractedData,
        metadata: data.metadata,
        processedAt: data.processedAt?.toDate?.()?.toISOString() || data.processedAt,
      };
      
      // Cache content
      this.contentCache.set(documentId, content);
      
      logger.log(`📄 Retrieved content for ${documentId} (${content.content.length} characters)`);
      return content;
      
    } catch (error) {
      logger.error('❌ Error fetching document content:', error);
      return null;
    }
  }

  /**
   * Search documents by title and content
   */
  async searchDocuments(
    eventId: string, 
    searchTerm: string, 
    options: {
      includeContent?: boolean;
      categories?: string[];
      types?: ProcessedDocument['type'][];
      minRelevance?: number;
    } = {}
  ): Promise<DocumentSearchResult[]> {
    try {
      const { includeContent = false, categories, types, minRelevance = 0 } = options;
      
      logger.log('🔍 Searching documents for:', searchTerm);
      
      let documents = await this.getEventDocuments(eventId);
      
      // Filter by categories if specified
      if (categories && categories.length > 0) {
        documents = documents.filter(doc => categories.includes(doc.category));
      }
      
      // Filter by types if specified
      if (types && types.length > 0) {
        documents = documents.filter(doc => types.includes(doc.type));
      }
      
      const results: DocumentSearchResult[] = [];
      const searchTermLower = searchTerm.toLowerCase();
      
      for (const document of documents) {
        let relevanceScore = 0;
        const matchedTerms: string[] = [];
        
        // Search in title
        if (document.title.toLowerCase().includes(searchTermLower)) {
          relevanceScore += 10;
          matchedTerms.push('title');
        }
        
        // Search in category
        if (document.category.toLowerCase().includes(searchTermLower)) {
          relevanceScore += 5;
          matchedTerms.push('category');
        }
        
        // Search in type
        if (document.type.toLowerCase().includes(searchTermLower)) {
          relevanceScore += 7;
          matchedTerms.push('type');
        }
        
        // Search in content if requested and available
        let content: DocumentContent | null = null;
        if (includeContent && document.contentProcessed) {
          content = await this.getDocumentContent(document.id);
          if (content && content.content.toLowerCase().includes(searchTermLower)) {
            relevanceScore += 3;
            matchedTerms.push('content');
          }
          
          // Search in extracted rules
          if (content?.extractedData?.rules) {
            const matchingRules = content.extractedData.rules.filter(rule => 
              rule.toLowerCase().includes(searchTermLower)
            );
            if (matchingRules.length > 0) {
              relevanceScore += matchingRules.length * 2;
              matchedTerms.push('rules');
            }
          }
        }
        
        // Add to results if meets minimum relevance
        if (relevanceScore >= minRelevance) {
          results.push({
            document,
            content,
            relevanceScore,
            matchedTerms
          });
        }
      }
      
      // Sort by relevance score
      results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      
      logger.log(`🔍 Found ${results.length} matching documents`);
      return results;
      
    } catch (error) {
      logger.error('❌ Error searching documents:', error);
      return [];
    }
  }

  /**
   * Get sailing instructions with extracted rules and amendments
   */
  async getSailingInstructions(eventId: string): Promise<{
    document: ProcessedDocument | null;
    content: DocumentContent | null;
    rules: string[];
    amendments: Array<{ id: string; text: string; extractedAt: string }>;
  }> {
    try {
      const sailingInstructionDocs = await this.getDocumentsByType(eventId, 'sailing_instructions');
      
      if (sailingInstructionDocs.length === 0) {
        return {
          document: null,
          content: null,
          rules: [],
          amendments: []
        };
      }
      
      // Get the most recent sailing instructions document
      const document = sailingInstructionDocs[0];
      const content = await this.getDocumentContent(document.id);
      
      return {
        document,
        content,
        rules: content?.extractedData?.rules || [],
        amendments: content?.extractedData?.amendments || []
      };
      
    } catch (error) {
      logger.error('❌ Error fetching sailing instructions:', error);
      return {
        document: null,
        content: null,
        rules: [],
        amendments: []
      };
    }
  }

  /**
   * Subscribe to real-time document updates
   */
  subscribeToDocuments(
    eventId: string, 
    callback: (documents: ProcessedDocument[]) => void
  ): () => void {
    try {
      const documentsRef = collection(db, 'events', eventId, 'documents');
      const q = query(
        documentsRef,
        orderBy('priority', 'desc'),
        orderBy('discoveredAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const documents: ProcessedDocument[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          documents.push({
            id: doc.id,
            ...data,
            discoveredAt: data.discoveredAt?.toDate?.()?.toISOString() || data.discoveredAt,
            processedAt: data.processedAt?.toDate?.()?.toISOString() || data.processedAt,
          } as ProcessedDocument);
        });
        
        // Update cache
        const cacheKey = `documents_${eventId}`;
        this.cache.set(cacheKey, documents);
        this.lastFetchTime.set(cacheKey, Date.now());
        
        callback(documents);
      });
      
      return unsubscribe;
      
    } catch (error) {
      logger.error('❌ Error subscribing to documents:', error);
      return () => {};
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStatistics(eventId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    withContent: number;
    lastUpdated: string | null;
  }> {
    try {
      const documents = await this.getEventDocuments(eventId);
      
      const stats = {
        total: documents.length,
        byType: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        withContent: 0,
        lastUpdated: null as string | null
      };
      
      let latestDate = '';
      
      documents.forEach(doc => {
        // Count by type
        stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
        
        // Count by category
        stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
        
        // Count by priority
        stats.byPriority[doc.priority] = (stats.byPriority[doc.priority] || 0) + 1;
        
        // Count documents with content
        if (doc.contentProcessed) {
          stats.withContent++;
        }
        
        // Track latest update
        const docDate = doc.processedAt || doc.discoveredAt;
        if (docDate && docDate > latestDate) {
          latestDate = docDate;
        }
      });
      
      stats.lastUpdated = latestDate || null;
      
      return stats;
      
    } catch (error) {
      logger.error('❌ Error getting document statistics:', error);
      return {
        total: 0,
        byType: {},
        byCategory: {},
        byPriority: {},
        withContent: 0,
        lastUpdated: null
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.contentCache.clear();
    this.lastFetchTime.clear();
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const lastFetch = this.lastFetchTime.get(key);
    if (!lastFetch) return false;
    
    return (Date.now() - lastFetch) < this.cacheDuration;
  }

  /**
   * Get available document categories
   */
  getAvailableCategories(): string[] {
    return [
      'Sailing Instructions',
      'Official Notices',
      'Schedules',
      'Results',
      'Amendments',
      'Registration',
      'General Documents',
      'Embedded Documents'
    ];
  }

  /**
   * Get available document types
   */
  getAvailableTypes(): ProcessedDocument['type'][] {
    return [
      'sailing_instructions',
      'notice_of_race',
      'schedule',
      'amendment',
      'results',
      'other'
    ];
  }
}

export const documentProcessingService = new DocumentProcessingService();