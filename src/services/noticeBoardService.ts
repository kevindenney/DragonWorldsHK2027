import { 
  NoticeBoardEvent, 
  EventDocument, 
  OfficialNotification, 
  SailingInstruction, 
  NoticeOfRace, 
  Competitor, 
  ProtestSubmission, 
  Hearing, 
  ScoringInquiry, 
  OnWaterPenalty,
  CourseChange,
  WeatherNotice,
  RegistrationStatus,
  ProtestDecision,
  NoticeBoardServiceConfig 
} from '../types/noticeBoard';
import { UserStore } from '../stores/userStore';
import { RealDataService } from './realDataService';
import { CCR2024NoticesService, ActionForm } from './ccr2024NoticesService';

export class NoticeBoardService {
  private config: NoticeBoardServiceConfig;
  private userStore: typeof UserStore;
  private cache: Map<string, any> = new Map();
  private lastFetchTime: Map<string, number> = new Map();
  private useDemoData: boolean;
  private realDataService: RealDataService;
  private ccrNoticesService: CCR2024NoticesService;
  private dataSource: 'demo' | 'racing_rules' | 'ccr2024' = 'demo';

  constructor(userStore: typeof UserStore, useDemoData: boolean = true, dataSource: 'demo' | 'racing_rules' | 'ccr2024' = 'demo') {
    this.userStore = userStore;
    this.useDemoData = useDemoData;
    this.dataSource = dataSource;
    this.realDataService = new RealDataService();
    this.ccrNoticesService = new CCR2024NoticesService();
    this.config = {
      baseUrl: 'https://www.racingrulesofsailing.org',
      cacheDuration: 300000, // 5 minutes
      autoRefreshInterval: 60000, // 1 minute
      offlineRetentionDays: 7
    };
  }

  /**
   * Get event data by event ID
   */
  async getEvent(eventId: string): Promise<NoticeBoardEvent | null> {
    try {
      const cacheKey = `event_${eventId}`;
      
      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      let event: NoticeBoardEvent;
      
      if (this.useDemoData) {
        // Return demo data for development/testing
        event = this.generateDemoEvent(eventId);
      } else {
        // Fetch real data from racingrulesofsailing.org
        event = await this.fetchRealEventData(eventId);
      }
      
      // Cache the result
      this.cache.set(cacheKey, event);
      this.lastFetchTime.set(cacheKey, Date.now());
      
      return event;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }

  /**
   * Get all event documents
   */
  async getEventDocuments(eventId: string): Promise<EventDocument[]> {
    try {
      const event = await this.getEvent(eventId);
      return event?.noticeBoard.documents || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  /**
   * Get official notifications
   */
  async getNotifications(eventId: string): Promise<OfficialNotification[]> {
    try {
      let notifications: OfficialNotification[] = [];

      // Get notifications based on data source
      if (this.dataSource === 'ccr2024') {
        // Fetch from CCR2024 service
        notifications = await this.ccrNoticesService.fetchNotices();
      } else {
        // Use existing logic for demo/racing rules data
        const event = await this.getEvent(eventId);
        notifications = event?.noticeBoard.notifications || [];
      }

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get sailing instructions
   */
  async getSailingInstructions(eventId: string): Promise<SailingInstruction[]> {
    try {
      // In a real implementation, this would parse the sailing instructions document
      return this.generateDemoSailingInstructions();
    } catch (error) {
      console.error('Error fetching sailing instructions:', error);
      return [];
    }
  }

  /**
   * Get notice of race
   */
  async getNoticeOfRace(eventId: string): Promise<NoticeOfRace | null> {
    try {
      return this.generateDemoNoticeOfRace(eventId);
    } catch (error) {
      console.error('Error fetching notice of race:', error);
      return null;
    }
  }

  /**
   * Get entry list
   */
  async getEntryList(eventId: string): Promise<Competitor[]> {
    try {
      const event = await this.getEvent(eventId);
      // For demo, generate competitor list based on entry count
      return this.generateDemoCompetitors(event?.entryCount || 50);
    } catch (error) {
      console.error('Error fetching entry list:', error);
      return [];
    }
  }

  /**
   * Get protest submissions
   */
  async getProtests(eventId: string): Promise<ProtestSubmission[]> {
    try {
      const event = await this.getEvent(eventId);
      return event?.noticeBoard.protests || [];
    } catch (error) {
      console.error('Error fetching protests:', error);
      return [];
    }
  }

  /**
   * Get hearing schedule
   */
  async getHearings(eventId: string): Promise<Hearing[]> {
    try {
      const event = await this.getEvent(eventId);
      return event?.noticeBoard.hearings || [];
    } catch (error) {
      console.error('Error fetching hearings:', error);
      return [];
    }
  }

  /**
   * Submit a protest
   */
  async submitProtest(eventId: string, protest: Omit<ProtestSubmission, 'id' | 'submittedAt' | 'status'>): Promise<ProtestSubmission> {
    try {
      const newProtest: ProtestSubmission = {
        ...protest,
        id: `protest_${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };

      // In a real implementation, this would submit to the API
      console.log('Submitting protest:', newProtest);
      
      return newProtest;
    } catch (error) {
      console.error('Error submitting protest:', error);
      throw new Error('Failed to submit protest');
    }
  }

  /**
   * Get scoring inquiries
   */
  async getScoringInquiries(eventId: string): Promise<ScoringInquiry[]> {
    try {
      const event = await this.getEvent(eventId);
      return event?.noticeBoard.scoringInquiries || [];
    } catch (error) {
      console.error('Error fetching scoring inquiries:', error);
      return [];
    }
  }

  /**
   * Get on-water penalties
   */
  async getOnWaterPenalties(eventId: string): Promise<OnWaterPenalty[]> {
    try {
      const event = await this.getEvent(eventId);
      return event?.noticeBoard.penalties || [];
    } catch (error) {
      console.error('Error fetching penalties:', error);
      return [];
    }
  }

  /**
   * Get registration status for current user
   */
  async getRegistrationStatus(eventId: string): Promise<RegistrationStatus | null> {
    try {
      const user = this.userStore.getState();
      
      if (user.userType !== 'participant') {
        return null;
      }

      return this.generateDemoRegistrationStatus();
    } catch (error) {
      console.error('Error fetching registration status:', error);
      return null;
    }
  }

  /**
   * Fetch real event data from racingrulesofsailing.org
   */
  private async fetchRealEventData(eventId: string): Promise<NoticeBoardEvent> {
    try {
      console.log('🌐 Attempting to fetch real data from racingrulesofsailing.org...');
      
      // Try to fetch real data using the RealDataService
      const realData = await this.realDataService.fetchEventData(eventId);
      
      if (realData) {
        console.log('✅ Successfully fetched real data');
        return realData;
      } else {
        console.log('⚠️ Real data not available, falling back to demo data');
        return this.generateDemoEvent(eventId);
      }
      
    } catch (error) {
      console.error('Error fetching real event data:', error);
      console.log('⚠️ Error occurred, falling back to demo data');
      return this.generateDemoEvent(eventId);
    }
  }

  /**
   * Parse HTML content from racingrulesofsailing.org
   */
  private parseRacingRulesHTML(html: string, eventId: string): NoticeBoardEvent {
    // This would parse the HTML to extract:
    // - Event details (name, dates, venue)
    // - Race results and standings
    // - Document links (sailing instructions, notices)
    // - Competitor lists
    // - Protest information
    
    // For now, return demo data structure
    return this.generateDemoEvent(eventId);
  }

  /**
   * Extract race results from HTML table
   */
  private extractRaceResults(html: string): any[] {
    // Parse HTML tables containing race results
    // Extract boat names, sail numbers, points, positions
    return [];
  }

  /**
   * Extract document URLs from the page
   */
  private extractDocumentUrls(html: string): EventDocument[] {
    // Find PDF links for sailing instructions, notices, etc.
    return this.generateDemoDocuments();
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const lastFetch = this.lastFetchTime.get(key);
    if (!lastFetch) return false;
    
    return (Date.now() - lastFetch) < this.config.cacheDuration;
  }

  /**
   * Toggle between demo and real data
   */
  setUseDemoData(useDemoData: boolean): void {
    this.useDemoData = useDemoData;
    // Clear cache when switching modes
    this.cache.clear();
    this.lastFetchTime.clear();
  }

  /**
   * Set data source
   */
  setDataSource(source: 'demo' | 'racing_rules' | 'ccr2024'): void {
    this.dataSource = source;
    // Clear cache when switching sources
    this.cache.clear();
    this.lastFetchTime.clear();
    console.log(`📡 Switched notice board data source to: ${source}`);
  }

  /**
   * Get current data source
   */
  getDataSource(): 'demo' | 'racing_rules' | 'ccr2024' {
    return this.dataSource;
  }

  /**
   * Get available action forms (CCR specific)
   */
  getAvailableActions(): ActionForm[] {
    if (this.dataSource === 'ccr2024') {
      return this.ccrNoticesService.getAvailableActions();
    }
    // Return generic actions for other sources
    return [
      {
        id: 'protest',
        title: 'File Protest',
        description: 'Submit a formal protest',
        icon: 'gavel',
        url: '',
        requiredFields: ['incident_description', 'rule_violated']
      },
      {
        id: 'question',
        title: 'Ask Question',
        description: 'Contact race committee with questions',
        icon: 'help-circle',
        url: '',
        requiredFields: ['question_text']
      }
    ];
  }

  /**
   * Submit an action form
   */
  async submitActionForm(actionId: string, formData: Record<string, any>): Promise<boolean> {
    try {
      if (this.dataSource === 'ccr2024') {
        return await this.ccrNoticesService.submitActionForm(actionId, formData);
      }
      
      // Handle generic form submissions
      console.log(`📝 Submitting generic ${actionId} form:`, formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
      
    } catch (error) {
      console.error(`❌ Error submitting ${actionId} form:`, error);
      return false;
    }
  }

  /**
   * Get service status information
   */
  getServiceStatus(): {
    dataSource: string;
    cacheStatus: any;
    lastUpdate: Date | null;
  } {
    const cacheStatus = this.dataSource === 'ccr2024' 
      ? this.ccrNoticesService.getCacheStatus()
      : { hasCache: false, lastFetch: null, isValid: false };

    return {
      dataSource: this.dataSource,
      cacheStatus,
      lastUpdate: cacheStatus.lastFetch
    };
  }

  /**
   * Generate demo event data
   */
  private generateDemoEvent(eventId: string): NoticeBoardEvent {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30); // Event in 30 days
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 5);

    return {
      id: eventId,
      name: 'Dragon Worlds Hong Kong 2027',
      organizer: 'Royal Hong Kong Yacht Club',
      venue: 'Hong Kong',
      dates: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      status: 'upcoming',
      entryCount: 87,
      classes: ['Dragon'],
      languages: ['English', 'Chinese (Traditional)', 'Spanish', 'French'],
      lastUpdated: new Date().toISOString(),
      noticeBoard: {
        documents: this.generateDemoDocuments(),
        notifications: this.generateDemoNotifications(),
        protests: this.generateDemoProtests(),
        hearings: this.generateDemoHearings(),
        scoringInquiries: this.generateDemoScoringInquiries(),
        penalties: this.generateDemoPenalties(),
        courseChanges: this.generateDemoCourseChanges(),
        weatherNotices: this.generateDemoWeatherNotices()
      }
    };
  }

  /**
   * Generate demo documents
   */
  private generateDemoDocuments(): EventDocument[] {
    return [
      {
        id: 'doc_1',
        title: 'Notice of Race',
        type: 'notice_of_race',
        url: `${this.config.baseUrl}/documents/notice_of_race.pdf`,
        fileType: 'pdf',
        size: 2456789,
        uploadedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        lastModified: new Date(Date.now() - 86400000 * 2).toISOString(),
        downloadCount: 156,
        isRequired: true,
        language: 'English',
        description: 'Official Notice of Race for Dragon Worlds Hong Kong 2027',
        category: 'Official Documents'
      },
      {
        id: 'doc_2',
        title: 'Sailing Instructions',
        type: 'sailing_instructions',
        url: `${this.config.baseUrl}/documents/sailing_instructions.pdf`,
        fileType: 'pdf',
        size: 1876543,
        uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        isRequired: true,
        language: 'English',
        description: 'Complete sailing instructions and race procedures',
        category: 'Official Documents'
      },
      {
        id: 'doc_3',
        title: 'Daily Schedule',
        type: 'schedule',
        url: `${this.config.baseUrl}/documents/daily_schedule.pdf`,
        fileType: 'pdf',
        size: 456789,
        uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        isRequired: false,
        language: 'English',
        description: 'Updated daily racing schedule',
        category: 'Schedules'
      },
      {
        id: 'doc_4',
        title: 'Dragon Class Rules',
        type: 'classification',
        url: `${this.config.baseUrl}/documents/dragon_class_rules.pdf`,
        fileType: 'pdf',
        size: 3456789,
        uploadedAt: new Date(Date.now() - 86400000 * 45).toISOString(),
        isRequired: true,
        language: 'English',
        description: 'International Dragon Class Rules and Measurement Requirements',
        category: 'Class Rules'
      },
      {
        id: 'doc_5',
        title: 'Entry Form',
        type: 'authorization',
        url: `${this.config.baseUrl}/documents/entry_form.pdf`,
        fileType: 'pdf',
        size: 234567,
        uploadedAt: new Date(Date.now() - 86400000 * 60).toISOString(),
        isRequired: true,
        language: 'English',
        description: 'Official entry form and waiver',
        category: 'Registration'
      }
    ];
  }

  /**
   * Generate demo notifications
   */
  private generateDemoNotifications(): OfficialNotification[] {
    return [
      {
        id: 'notif_1',
        title: 'Race Committee Meeting Moved',
        content: 'The daily race committee meeting has been moved from 0800 to 0830 due to tide conditions. All competitors are welcome to attend.',
        type: 'announcement',
        priority: 'medium',
        publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        author: 'Principal Race Officer',
        authorRole: 'race_committee',
        tags: ['schedule', 'meeting'],
        isRead: false
      },
      {
        id: 'notif_2',
        title: 'Strong Wind Warning',
        content: 'Winds are forecast to increase to 25-30 knots this afternoon. Racing may be postponed if conditions exceed safety limits.',
        type: 'weather',
        priority: 'high',
        publishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        author: 'Race Committee',
        authorRole: 'race_committee',
        tags: ['weather', 'safety'],
        isRead: false,
        affectedRaces: [3, 4]
      },
      {
        id: 'notif_3',
        title: 'Protest Time Limit Extended',
        content: 'Due to the late finish of Race 2, the protest time limit has been extended to 1930 hours.',
        type: 'protest',
        priority: 'medium',
        publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        author: 'Protest Committee Chair',
        authorRole: 'protest_committee',
        tags: ['protest', 'time-limit'],
        isRead: true
      }
    ];
  }

  /**
   * Generate demo protests
   */
  private generateDemoProtests(): ProtestSubmission[] {
    return [
      {
        id: 'protest_1',
        protestingBoat: 'HKG 123',
        protestedBoat: 'GBR 456',
        incident: {
          raceNumber: 2,
          timeOfIncident: '14:25:30',
          location: 'Windward mark rounding',
          description: 'GBR 456 failed to keep clear when overlapped to leeward',
          witnessBoats: ['AUS 789', 'USA 321']
        },
        rules: {
          alleged: ['Rule 11', 'Rule 14'],
          description: 'Leeward boat failed to keep clear, contact occurred'
        },
        submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        submittedBy: 'John Smith',
        status: 'scheduled',
        hearingTime: new Date(Date.now() + 3600000 * 2).toISOString(),
        documents: []
      }
    ];
  }

  /**
   * Generate demo hearings
   */
  private generateDemoHearings(): Hearing[] {
    return [
      {
        id: 'hearing_1',
        protestId: 'protest_1',
        scheduledTime: new Date(Date.now() + 3600000 * 2).toISOString(),
        location: 'Protest Room, RHKYC',
        protestingBoat: 'HKG 123',
        protestedBoat: 'GBR 456',
        judges: ['Judge A', 'Judge B', 'Judge C'],
        status: 'scheduled',
        estimatedDuration: 30,
        rules: ['Rule 11', 'Rule 14'],
        witnesses: ['AUS 789', 'USA 321']
      }
    ];
  }

  /**
   * Generate demo scoring inquiries
   */
  private generateDemoScoringInquiries(): ScoringInquiry[] {
    return [
      {
        id: 'inquiry_1',
        sailNumber: 'HKG 789',
        raceNumber: 1,
        inquiry: 'Believe my finish position was recorded incorrectly. I finished 5th, not 7th.',
        submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        submittedBy: 'Sarah Lee',
        status: 'resolved',
        response: 'After review of finish video, position corrected to 5th place.',
        resolvedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        scoreChange: {
          from: 7,
          to: 5,
          reason: 'Finish line video review'
        }
      }
    ];
  }

  /**
   * Generate demo penalties
   */
  private generateDemoPenalties(): OnWaterPenalty[] {
    return [
      {
        id: 'penalty_1',
        sailNumber: 'USA 234',
        raceNumber: 2,
        penaltyType: 'two_turns',
        rule: 'Rule 10',
        timeAssessed: '14:15:45',
        location: 'Start area',
        description: 'Port-starboard incident at start',
        assessedBy: 'Race Committee',
        acknowledged: true,
        scoreAdjustment: 0
      },
      {
        id: 'penalty_2',
        sailNumber: 'GER 567',
        raceNumber: 2,
        penaltyType: 'ocs',
        rule: 'Rule 29.1',
        timeAssessed: '14:00:00',
        location: 'Start line',
        description: 'On course side at start',
        assessedBy: 'Race Committee',
        acknowledged: false,
        scoreAdjustment: 0
      }
    ];
  }

  /**
   * Generate demo course changes
   */
  private generateDemoCourseChanges(): CourseChange[] {
    return [
      {
        id: 'change_1',
        raceNumber: 3,
        changeType: 'course_change',
        description: 'Course changed to windward-leeward due to wind shift',
        reason: 'Wind has shifted 40 degrees to the left',
        effectiveTime: new Date(Date.now() + 3600000 * 1).toISOString(),
        announcedAt: new Date().toISOString(),
        newInstructions: 'Course will be W-L-W-L, 4 legs total'
      }
    ];
  }

  /**
   * Generate demo weather notices
   */
  private generateDemoWeatherNotices(): WeatherNotice[] {
    return [
      {
        id: 'weather_1',
        type: 'warning',
        title: 'Strong Wind Warning',
        description: 'Winds increasing to 25-30 knots with gusts to 35 knots expected',
        conditions: {
          windSpeed: {
            current: 18,
            forecast: 28,
            gusts: 35
          },
          visibility: 8,
          temperature: 24,
          pressure: 1018
        },
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 3600000 * 6).toISOString(),
        actionRequired: 'Consider postponement if winds exceed 30 knots',
        issuedBy: 'Race Committee',
        severity: 'warning'
      }
    ];
  }

  /**
   * Generate demo sailing instructions
   */
  private generateDemoSailingInstructions(): SailingInstruction[] {
    return [
      {
        id: 'si_1',
        section: '1',
        title: 'Rules',
        content: 'Racing will be governed by the Racing Rules of Sailing 2025-2028.',
        ruleReference: 'RRS 2025-2028',
        amendments: [],
        effective: true,
        lastUpdated: new Date(Date.now() - 86400000 * 7).toISOString()
      },
      {
        id: 'si_2',
        section: '2',
        title: 'Notice to Competitors',
        content: 'Notices to competitors will be posted on the official notice board located at the Race Office.',
        amendments: [
          {
            id: 'amend_1',
            originalText: 'Notices will be posted on the physical notice board only.',
            amendedText: 'Notices will be posted on both the physical notice board and the mobile app.',
            reason: 'Digital notice board implementation',
            amendedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            effectiveFrom: new Date(Date.now() - 86400000 * 2).toISOString()
          }
        ],
        effective: true,
        lastUpdated: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];
  }

  /**
   * Generate demo notice of race
   */
  private generateDemoNoticeOfRace(eventId: string): NoticeOfRace {
    return {
      id: eventId,
      eventName: 'Dragon Worlds Hong Kong 2027',
      organizer: 'Royal Hong Kong Yacht Club',
      venue: 'Hong Kong',
      dates: {
        start: new Date(Date.now() + 86400000 * 30).toISOString(),
        end: new Date(Date.now() + 86400000 * 35).toISOString()
      },
      registrationDeadline: new Date(Date.now() + 86400000 * 14).toISOString(),
      entryFee: {
        amount: 1200,
        currency: 'HKD',
        lateFee: 200
      },
      classes: [
        {
          name: 'Dragon',
          eligibilityRules: 'Open to all Dragon class boats with valid measurement certificate',
          measurementRequirements: [
            'Valid IDA measurement certificate',
            'Current insurance certificate',
            'Safety equipment as per class rules'
          ],
          maxEntries: 100,
          entryFee: {
            amount: 1200,
            currency: 'HKD'
          }
        }
      ],
      eligibility: [
        'Open to all Dragon class boats',
        'Valid IDA measurement certificate required',
        'Minimum age 16 for helm'
      ],
      contacts: [
        {
          role: 'Regatta Director',
          name: 'Michael Chen',
          email: 'regatta@rhkyc.org.hk',
          phone: '+852 2832 2817'
        },
        {
          role: 'Registration',
          name: 'Sarah Wong',
          email: 'registration@rhkyc.org.hk',
          phone: '+852 2832 2818'
        }
      ],
      documents: this.generateDemoDocuments(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate demo competitors
   */
  private generateDemoCompetitors(count: number): Competitor[] {
    const competitors: Competitor[] = [];
    const countries = ['HKG', 'AUS', 'GBR', 'USA', 'NZL', 'SIN', 'JPN', 'GER', 'ITA', 'FRA'];
    const clubs = [
      'Royal Hong Kong YC', 'Royal Sydney YS', 'Royal Yacht Squadron', 'San Diego YC',
      'Royal NZ YS', 'Singapore SC', 'Hayama Marina', 'Hamburger SV', 'YC Italiano', 'YC de France'
    ];
    
    for (let i = 1; i <= count; i++) {
      const country = countries[Math.floor(Math.random() * countries.length)];
      const club = clubs[Math.floor(Math.random() * clubs.length)];
      
      competitors.push({
        id: `comp_${i}`,
        sailNumber: `${country} ${String(i).padStart(3, '0')}`,
        helmName: `Sailor ${i}`,
        crewNames: [`Crew ${i}A`, `Crew ${i}B`],
        country,
        club,
        className: 'Dragon',
        registrationStatus: Math.random() > 0.1 ? 'confirmed' : 'pending',
        entryDate: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString(),
        paymentStatus: Math.random() > 0.05 ? 'paid' : 'pending',
        documentsSubmitted: Math.random() > 0.15,
        measurementCompleted: Math.random() > 0.1
      });
    }
    
    return competitors;
  }

  /**
   * Generate demo registration status
   */
  private generateDemoRegistrationStatus(): RegistrationStatus {
    return {
      competitorId: 'comp_user',
      status: 'pending_review',
      checklist: {
        entryForm: true,
        payment: true,
        measurementCertificate: true,
        insurance: false,
        waiver: true,
        parentalConsent: false
      },
      missingDocuments: ['Insurance certificate'],
      paymentDue: {
        amount: 200,
        currency: 'HKD',
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString()
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

export default NoticeBoardService;