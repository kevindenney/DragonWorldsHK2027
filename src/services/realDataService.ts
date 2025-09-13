import { NoticeBoardEvent, EventDocument, Competitor, OfficialNotification } from '../types/noticeBoard';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
  QuerySnapshot,
  DocumentData 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Real data service for Firebase/Firestore integration
 * This service handles real-time data from Firestore and manages user notice status
 */
export class RealDataService {
  private apiBaseUrl: string;
  private listeners: Map<string, () => void> = new Map();

  constructor() {
    // Use Firebase Cloud Functions URL for manual triggering
    const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
    const region = process.env.EXPO_PUBLIC_FIREBASE_REGION || 'us-central1';
    
    if (projectId) {
      this.apiBaseUrl = `https://${region}-${projectId}.cloudfunctions.net`;
    } else {
      // Fallback for development
      this.apiBaseUrl = 'http://localhost:5001/your-project/us-central1';
      console.warn('⚠️ EXPO_PUBLIC_FIREBASE_PROJECT_ID not set, using local emulator URL');
    }
    
    console.log('🔥 Firebase Functions API URL:', this.apiBaseUrl);
  }

  /**
   * Subscribe to real-time notices from Firestore
   */
  subscribeToNotices(
    eventId: string, 
    onNoticesUpdate: (notices: OfficialNotification[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      console.log('🔔 Subscribing to real-time notices for event:', eventId);
      
      const noticesQuery = query(
        collection(db, 'notices'),
        where('eventId', '==', eventId),
        orderBy('publishedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        noticesQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const notices: OfficialNotification[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            notices.push({
              id: doc.id,
              title: data.title,
              content: data.content,
              type: data.type || 'announcement',
              priority: data.priority || 'normal',
              publishedAt: data.publishedAt instanceof Timestamp 
                ? data.publishedAt.toDate().toISOString()
                : data.publishedAt,
              author: data.author || 'Race Committee',
              authorRole: data.authorRole || 'race_committee',
              tags: data.tags || [],
              isRead: false, // Will be updated by user status
              affectedRaces: data.affectedRaces,
              sourceUrl: data.sourceUrl
            });
          });

          console.log(`✅ Received ${notices.length} notices from Firestore`);
          onNoticesUpdate(notices);
        },
        (error) => {
          console.error('❌ Error in notices subscription:', error);
          if (onError) onError(error);
        }
      );

      // Store unsubscribe function
      const listenerId = `notices_${eventId}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return unsubscribe;
      
    } catch (error) {
      console.error('❌ Error setting up notices subscription:', error);
      if (onError) onError(error as Error);
      return () => {};
    }
  }

  /**
   * Trigger manual refresh of notice board data
   */
  async triggerManualRefresh(eventId: string): Promise<boolean> {
    try {
      console.log('🔄 Triggering manual notice board refresh...');
      
      const apiUrl = `${this.apiBaseUrl}/scrapeNoticeBoard?eventId=${eventId}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Manual refresh completed: ${result.noticesCount} notices`);
      return true;
      
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      return false;
    }
  }

  /**
   * Get user's read status for notices
   */
  async getUserNoticeStatus(userId: string, noticeId: string): Promise<{isRead: boolean, isBookmarked: boolean} | null> {
    try {
      const statusDoc = await getDoc(doc(db, 'userNoticeStatus', `${userId}_${noticeId}`));
      
      if (statusDoc.exists()) {
        const data = statusDoc.data();
        return {
          isRead: data.isRead || false,
          isBookmarked: data.isBookmarked || false
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user notice status:', error);
      return null;
    }
  }

  /**
   * Update user's read status for a notice
   */
  async markNoticeAsRead(userId: string, noticeId: string): Promise<void> {
    try {
      const statusRef = doc(db, 'userNoticeStatus', `${userId}_${noticeId}`);
      await setDoc(statusRef, {
        userId,
        noticeId,
        isRead: true,
        readAt: Timestamp.now(),
        isBookmarked: false
      }, { merge: true });
      
      console.log(`✅ Marked notice ${noticeId} as read for user ${userId}`);
    } catch (error) {
      console.error('Error marking notice as read:', error);
      throw error;
    }
  }

  /**
   * Toggle bookmark status for a notice
   */
  async toggleNoticeBookmark(userId: string, noticeId: string): Promise<boolean> {
    try {
      const statusRef = doc(db, 'userNoticeStatus', `${userId}_${noticeId}`);
      const statusDoc = await getDoc(statusRef);
      
      const currentBookmark = statusDoc.exists() ? statusDoc.data()?.isBookmarked || false : false;
      const newBookmarkStatus = !currentBookmark;
      
      await setDoc(statusRef, {
        userId,
        noticeId,
        isBookmarked: newBookmarkStatus,
        bookmarkedAt: newBookmarkStatus ? Timestamp.now() : null
      }, { merge: true });
      
      console.log(`✅ ${newBookmarkStatus ? 'Bookmarked' : 'Unbookmarked'} notice ${noticeId} for user ${userId}`);
      return newBookmarkStatus;
    } catch (error) {
      console.error('Error toggling notice bookmark:', error);
      throw error;
    }
  }

  /**
   * Get all bookmarked notices for a user
   */
  subscribeToUserBookmarks(
    userId: string,
    onBookmarksUpdate: (bookmarkedNoticeIds: string[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const bookmarksQuery = query(
        collection(db, 'userNoticeStatus'),
        where('userId', '==', userId),
        where('isBookmarked', '==', true)
      );

      const unsubscribe = onSnapshot(
        bookmarksQuery,
        (snapshot) => {
          const bookmarkedIds = snapshot.docs.map(doc => doc.data().noticeId);
          onBookmarksUpdate(bookmarkedIds);
        },
        (error) => {
          console.error('Error in bookmarks subscription:', error);
          if (onError) onError(error);
        }
      );

      const listenerId = `bookmarks_${userId}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up bookmarks subscription:', error);
      if (onError) onError(error as Error);
      return () => {};
    }
  }

  /**
   * Clean up all active listeners
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribe, listenerId) => {
      unsubscribe();
      console.log(`🧹 Cleaned up listener: ${listenerId}`);
    });
    this.listeners.clear();
  }

  /**
   * Legacy method: Fetch event data using HTTP API (fallback)
   */
  async fetchEventData(eventId: string): Promise<NoticeBoardEvent | null> {
    try {
      console.log('🌐 Fetching event data via HTTP API (fallback mode)');
      
      const apiUrl = `${this.apiBaseUrl}/scrapeRaceData?eventId=${eventId}&type=event`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('🔄 HTTP API not available, falling back to demo data');
        return null;
      }

      const data = await response.json();
      return this.transformApiResponse(data, eventId);
      
    } catch (error) {
      console.error('❌ HTTP API fallback failed:', error);
      return null;
    }
  }

  /**
   * Fetch race results data
   */
  async fetchRaceResults(eventId: string): Promise<any[]> {
    try {
      const apiUrl = `${this.apiBaseUrl}/scrapeRaceData?eventId=${eventId}&type=results`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.races || [];
      
    } catch (error) {
      console.error('Error fetching race results:', error);
      return [];
    }
  }

  /**
   * Fetch competitor data  
   */
  async fetchCompetitors(eventId: string): Promise<any[]> {
    try {
      const apiUrl = `${this.apiBaseUrl}/scrapeRaceData?eventId=${eventId}&type=competitors`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.competitors || [];
      
    } catch (error) {
      console.error('Error fetching competitors:', error);
      return [];
    }
  }

  /**
   * Fetch documents data
   */
  async fetchDocuments(eventId: string): Promise<any[]> {
    try {
      const apiUrl = `${this.apiBaseUrl}/scrapeRaceData?eventId=${eventId}&type=documents`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.documents || [];
      
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  /**
   * Transform API response to match our NoticeBoardEvent interface
   */
  private transformApiResponse(data: any, eventId: string): NoticeBoardEvent {
    // The serverless API returns data in a format close to our interface
    // but we may need to transform some fields
    
    const transformedEvent: NoticeBoardEvent = {
      id: data.id || eventId,
      name: data.name || 'Unknown Event',
      organizer: data.organizer || 'Unknown Organizer',
      venue: data.venue || 'Unknown Venue',
      dates: data.dates || {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      status: data.status || 'upcoming',
      entryCount: data.entryCount || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      
      // Transform documents to match our interface
      documents: (data.documents || []).map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        url: doc.url,
        fileType: doc.fileType || 'pdf',
        uploadedAt: doc.uploadedAt || doc.lastModified || new Date().toISOString(),
        lastModified: doc.lastModified || new Date().toISOString(),
        size: doc.size,
        isRequired: doc.isRequired || false,
        category: doc.category || 'document'
      })),
      
      // Transform other data arrays
      notifications: data.notifications || [],
      protests: data.protests || [],
      hearings: data.hearings || [],
      scoringInquiries: data.scoringInquiries || [],
      penalties: data.penalties || [],
      courseChanges: data.courseChanges || [],
      weatherNotices: data.weatherNotices || []
    };

    // Add metadata if this was a fallback response
    if (data._fallback) {
      console.log('📄 Using fallback data from API due to scraping error:', data._error);
    }

    return transformedEvent;
  }

  /**
   * DEPRECATED: Parse HTML from racingrulesofsailing.org event page
   * This method is now replaced by the serverless API
   */
  private parseEventHTML(html: string, eventId: string): NoticeBoardEvent {
    // HTML parsing would extract:
    
    // 1. Event metadata from page headers
    const eventName = this.extractTextBetween(html, '<h1>', '</h1>') || 'Unknown Event';
    const venue = this.extractVenue(html);
    const dates = this.extractEventDates(html);
    
    // 2. Results tables
    const standings = this.extractStandings(html);
    const raceResults = this.extractRaceResults(html);
    
    // 3. Document links
    const documents = this.extractDocuments(html);
    
    // 4. Competitor list
    const competitors = this.extractCompetitors(html);

    return {
      id: eventId,
      name: eventName,
      organizer: this.extractOrganizer(html),
      venue: venue,
      dates: dates,
      status: this.determineEventStatus(dates),
      entryCount: competitors.length,
      lastUpdated: new Date().toISOString(),
      documents: documents,
      notifications: [],
      protests: [],
      hearings: [],
      scoringInquiries: [],
      penalties: [],
      courseChanges: [],
      weatherNotices: []
    };
  }

  /**
   * Extract text between two HTML tags
   */
  private extractTextBetween(html: string, startTag: string, endTag: string): string | null {
    const startIndex = html.indexOf(startTag);
    if (startIndex === -1) return null;
    
    const contentStart = startIndex + startTag.length;
    const endIndex = html.indexOf(endTag, contentStart);
    if (endIndex === -1) return null;
    
    return html.substring(contentStart, endIndex).trim();
  }

  /**
   * Extract venue information
   */
  private extractVenue(html: string): string {
    // Look for venue patterns in HTML
    const venuePatterns = [
      /<span[^>]*class="venue"[^>]*>(.*?)<\/span>/i,
      /<div[^>]*class="location"[^>]*>(.*?)<\/div>/i,
      /<p[^>]*class="venue"[^>]*>(.*?)<\/p>/i
    ];
    
    for (const pattern of venuePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Unknown Venue';
  }

  /**
   * Extract event dates
   */
  private extractEventDates(html: string): { start: string; end: string } {
    // Look for date patterns
    const datePatterns = [
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\s*-\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,
      /(\w+ \d{1,2}, \d{4})\s*-\s*(\w+ \d{1,2}, \d{4})/g
    ];
    
    for (const pattern of datePatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[2]) {
        return {
          start: new Date(match[1]).toISOString(),
          end: new Date(match[2]).toISOString()
        };
      }
    }
    
    // Default to dates in the future
    const start = new Date();
    start.setDate(start.getDate() + 30);
    const end = new Date(start);
    end.setDate(end.getDate() + 5);
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  /**
   * Extract race standings from results tables
   */
  private extractStandings(html: string): any[] {
    // Look for tables with class patterns like "results", "standings", etc.
    const tablePattern = /<table[^>]*class="[^"]*(?:results|standings)[^"]*"[^>]*>(.*?)<\/table>/gi;
    const standings: any[] = [];
    
    let match;
    while ((match = tablePattern.exec(html)) !== null) {
      const tableContent = match[1];
      const rows = this.extractTableRows(tableContent);
      standings.push(...rows);
    }
    
    return standings;
  }

  /**
   * Extract individual race results
   */
  private extractRaceResults(html: string): any[] {
    // Similar to standings but for individual races
    return [];
  }

  /**
   * Extract documents (PDFs, sailing instructions, etc.)
   */
  private extractDocuments(html: string): EventDocument[] {
    const documents: EventDocument[] = [];
    const linkPattern = /<a[^>]*href="([^"]*\.pdf)"[^>]*>(.*?)<\/a>/gi;
    
    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      documents.push({
        id: `doc_${documents.length + 1}`,
        title: match[2].trim(),
        type: 'sailing_instructions',
        url: this.resolveUrl(match[1]),
        fileType: 'pdf',
        uploadedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        size: 0, // Would need HEAD request to get size
        isRequired: false,
        category: 'document'
      });
    }
    
    return documents;
  }

  /**
   * Extract competitor list
   */
  private extractCompetitors(html: string): Competitor[] {
    const competitors: Competitor[] = [];
    // Parse competitor tables
    return competitors;
  }

  /**
   * Extract table rows from HTML table content
   */
  private extractTableRows(tableContent: string): any[] {
    const rows: any[] = [];
    const rowPattern = /<tr[^>]*>(.*?)<\/tr>/gi;
    
    let match;
    while ((match = rowPattern.exec(tableContent)) !== null) {
      const cells = this.extractTableCells(match[1]);
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    
    return rows;
  }

  /**
   * Extract table cells from HTML row content
   */
  private extractTableCells(rowContent: string): string[] {
    const cells: string[] = [];
    const cellPattern = /<t[hd][^>]*>(.*?)<\/t[hd]>/gi;
    
    let match;
    while ((match = cellPattern.exec(rowContent)) !== null) {
      cells.push(match[1].replace(/<[^>]*>/g, '').trim());
    }
    
    return cells;
  }

  /**
   * Resolve relative URLs to absolute URLs
   */
  private resolveUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }
    return `${this.baseUrl}/${url}`;
  }

  /**
   * Extract organizer information
   */
  private extractOrganizer(html: string): string {
    // Look for organizer patterns
    return 'Unknown Organizer';
  }

  /**
   * Determine event status based on dates
   */
  private determineEventStatus(dates: { start: string; end: string }): 'upcoming' | 'active' | 'completed' {
    const now = new Date();
    const startDate = new Date(dates.start);
    const endDate = new Date(dates.end);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'active';
  }
}