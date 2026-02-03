import { OfficialNotification, EventDocument } from '../types/noticeBoard';

/**
 * China Coast Race Week Notice Board Scraping Service
 * Scrapes notices from chinacoastraceweek.com/onb and formats them for the app
 */
export class CCR2024NoticesService {
  private baseUrl = 'https://www.chinacoastraceweek.com';
  private onbUrl = `${this.baseUrl}/onb`;
  private cache: Map<string, any> = new Map();
  private lastFetchTime: number = 0;
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch and parse notices from China Coast Race Week
   */
  async fetchNotices(): Promise<OfficialNotification[]> {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        return this.cache.get('notices') || [];
      }

      
      // In a real app, we would use a web scraping service or API
      // For now, we'll return structured demo data that matches what would be scraped
      const notices = await this.scrapeNotices();
      
      // Cache the results
      this.cache.set('notices', notices);
      this.lastFetchTime = Date.now();
      
      return notices;
      
    } catch (error) {
      // Return cached data if available
      return this.cache.get('notices') || [];
    }
  }

  /**
   * Scrape notices from the CCR website
   * Note: In production, this would use a proper web scraping solution
   */
  private async scrapeNotices(): Promise<OfficialNotification[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Demo data that represents what would be scraped from the CCR website
    const mockScrapedNotices: OfficialNotification[] = [
      {
        id: 'ccr_notice_001',
        title: 'Race Committee Meeting - 0830 Hours',
        content: 'Daily race committee meeting has been moved from 0800 to 0830 due to tide conditions. All competitors welcome to attend at the RHKYC Race Office.',
        type: 'announcement',
        priority: 'medium',
        publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
        author: 'Race Committee',
        authorRole: 'race_committee',
        tags: ['meeting', 'schedule'],
        isRead: false,
        source: 'ccr2024',
        attachments: []
      },
      {
        id: 'ccr_notice_002',
        title: 'Strong Wind Warning - Racing May Be Postponed',
        content: 'Weather forecast shows winds increasing to 25-30 knots with gusts to 35 knots this afternoon. Racing committee will assess conditions at 1200 hours and may postpone if safety limits are exceeded.',
        type: 'weather',
        priority: 'urgent',
        publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        author: 'Principal Race Officer',
        authorRole: 'race_committee',
        tags: ['weather', 'safety', 'postponement'],
        isRead: false,
        source: 'ccr2024',
        affectedRaces: [3, 4, 5],
        attachments: [
          {
            id: 'weather_forecast_001',
            title: 'Weather Forecast Update',
            url: `${this.baseUrl}/documents/weather-update-001.pdf`,
            type: 'pdf',
            size: 156789
          }
        ]
      },
      {
        id: 'ccr_notice_003',
        title: 'Protest Time Limit Extended - Race 2',
        content: 'Due to the late finish time of Race 2 (completed at 1745), the protest time limit has been extended to 1930 hours today. All protests must be submitted to the Race Office by this time.',
        type: 'protest',
        priority: 'high',
        publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
        author: 'Protest Committee Chairman',
        authorRole: 'protest_committee',
        tags: ['protest', 'time-limit', 'race-2'],
        isRead: false,
        source: 'ccr2024',
        affectedRaces: [2],
        attachments: []
      },
      {
        id: 'ccr_notice_004',
        title: 'Equipment Check - Mandatory Safety Items',
        content: 'Random equipment checks will be conducted after racing today. Boats selected will be notified at the dock. Please ensure all mandatory safety equipment is aboard and in good condition.',
        type: 'equipment',
        priority: 'medium',
        publishedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), // 6 hours ago
        author: 'Technical Committee',
        authorRole: 'technical_committee',
        tags: ['equipment', 'safety', 'inspection'],
        isRead: false,
        source: 'ccr2024',
        attachments: [
          {
            id: 'safety_checklist_001',
            title: 'Mandatory Safety Equipment Checklist',
            url: `${this.baseUrl}/documents/safety-equipment-checklist.pdf`,
            type: 'pdf',
            size: 234567
          }
        ]
      },
      {
        id: 'ccr_notice_005',
        title: 'Prize Giving Ceremony - Location Updated',
        content: 'The prize giving ceremony scheduled for Saturday evening has been moved from the Clipper Lounge to the Main Ballroom due to increased attendance. Cocktails at 1830, ceremony begins at 1930.',
        type: 'social',
        priority: 'low',
        publishedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 hours ago
        author: 'Event Coordinator',
        authorRole: 'event_organizer',
        tags: ['prize-giving', 'social', 'location-change'],
        isRead: false,
        source: 'ccr2024',
        attachments: []
      },
      {
        id: 'ccr_notice_006',
        title: 'Course Change - Race 3 Today',
        content: 'Due to wind shift of 40 degrees left, Race 3 course has been changed to windward-leeward configuration. New course will be W-L-W-L, 4 legs total. Start sequence remains unchanged.',
        type: 'course_change',
        priority: 'urgent',
        publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        author: 'Race Committee',
        authorRole: 'race_committee',
        tags: ['course-change', 'wind-shift', 'race-3'],
        isRead: false,
        source: 'ccr2024',
        affectedRaces: [3],
        attachments: [
          {
            id: 'course_diagram_003',
            title: 'Race 3 Course Diagram',
            url: `${this.baseUrl}/documents/course-diagram-race3.pdf`,
            type: 'pdf',
            size: 445678
          }
        ]
      },
      {
        id: 'ccr_notice_007',
        title: 'Hearing Schedule - Protest Cases',
        content: 'Protest hearings will be held at 1900 hours in the Protest Room. Cases: HKG 123 vs GBR 456 (Rule 11), AUS 789 vs USA 321 (Rule 14). Parties must be present 15 minutes before scheduled time.',
        type: 'protest',
        priority: 'high',
        publishedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 90 minutes ago
        author: 'Protest Committee',
        authorRole: 'protest_committee',
        tags: ['hearing', 'protest', 'schedule'],
        isRead: false,
        source: 'ccr2024',
        attachments: []
      }
    ];

    return mockScrapedNotices;
  }

  /**
   * Get available action forms for sailors
   */
  getAvailableActions(): ActionForm[] {
    return [
      {
        id: 'hearing_request',
        title: 'Request Hearing',
        description: 'Submit a formal hearing request',
        icon: 'gavel',
        url: `${this.baseUrl}/forms/hearing-request`,
        requiredFields: ['competitor_name', 'sail_number', 'incident_description', 'requested_time']
      },
      {
        id: 'question',
        title: 'Ask Question',
        description: 'Submit a question to race committee',
        icon: 'help-circle',
        url: `${this.baseUrl}/forms/question`,
        requiredFields: ['competitor_name', 'sail_number', 'question_text', 'urgency']
      },
      {
        id: 'equipment_substitution',
        title: 'Equipment Substitution',
        description: 'Request equipment substitution approval',
        icon: 'settings',
        url: `${this.baseUrl}/forms/equipment-substitution`,
        requiredFields: ['competitor_name', 'sail_number', 'original_equipment', 'substitute_equipment', 'reason']
      },
      {
        id: 'redress_request',
        title: 'Request Redress',
        description: 'Submit a request for redress',
        icon: 'alert-triangle',
        url: `${this.baseUrl}/forms/redress`,
        requiredFields: ['competitor_name', 'sail_number', 'race_number', 'incident_description', 'requested_redress']
      },
      {
        id: 'measurement_query',
        title: 'Measurement Query',
        description: 'Question about measurement requirements',
        icon: 'ruler',
        url: `${this.baseUrl}/forms/measurement-query`,
        requiredFields: ['competitor_name', 'sail_number', 'query_description']
      }
    ];
  }

  /**
   * Submit an action form
   */
  async submitActionForm(actionId: string, formData: Record<string, any>): Promise<boolean> {
    try {
      
      // In a real implementation, this would submit to the CCR website
      // For now, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return true;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return (Date.now() - this.lastFetchTime) < this.cacheDuration;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.lastFetchTime = 0;
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { hasCache: boolean; lastFetch: Date | null; isValid: boolean } {
    return {
      hasCache: this.cache.has('notices'),
      lastFetch: this.lastFetchTime > 0 ? new Date(this.lastFetchTime) : null,
      isValid: this.isCacheValid()
    };
  }
}

/**
 * Action form interface
 */
export interface ActionForm {
  id: string;
  title: string;
  description: string;
  icon: string;
  url: string;
  requiredFields: string[];
}

export default CCR2024NoticesService;