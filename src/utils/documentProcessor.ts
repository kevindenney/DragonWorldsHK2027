import { 
  EventDocument, 
  DocumentKeyData, 
  DocumentType, 
  RegattaCategory,
  DocumentOptions 
} from '../types/noticeBoard';
import { getCategoryForDocument } from './categoryUtils';

/**
 * Document processing utility for extracting key information from sailing documents
 */
export class DocumentProcessor {
  /**
   * Extract key data from a document based on its type
   */
  static extractKeyData(document: EventDocument, content?: string): DocumentKeyData {
    const category = getCategoryForDocument(document);
    
    switch (category) {
      case RegattaCategory.PRE_EVENT:
        return this.extractPreEventData(document, content);
      case RegattaCategory.DAILY_OPERATIONS:
        return this.extractDailyOperationsData(document, content);
      case RegattaCategory.COMPETITION_MANAGEMENT:
        return this.extractCompetitionData(document, content);
      case RegattaCategory.PROTESTS_HEARINGS:
        return this.extractProtestData(document, content);
      case RegattaCategory.SAFETY_REGULATORY:
        return this.extractSafetyData(document, content);
      case RegattaCategory.ADMINISTRATIVE:
        return this.extractAdministrativeData(document, content);
      default:
        return this.extractGenericData(document, content);
    }
  }

  /**
   * Extract key data from pre-event documents
   */
  private static extractPreEventData(document: EventDocument, content?: string): DocumentKeyData {
    const extractedFields: Record<string, any> = {};
    let summary = document.description || '';
    let actionRequired: string | undefined;
    let deadline: string | undefined;

    switch (document.type) {
      case 'notice_of_race':
        extractedFields.entryDeadline = this.extractDate(content, ['entry deadline', 'registration deadline']);
        extractedFields.entryFee = this.extractCurrency(content);
        extractedFields.raceClasses = this.extractClasses(content);
        extractedFields.scoringSystem = this.extractText(content, ['scoring', 'point system']);
        extractedFields.numberOfRaces = this.extractNumber(content, ['races', 'race schedule']);
        summary = `Notice of Race with entry deadline ${extractedFields.entryDeadline || 'TBD'}`;
        actionRequired = 'Complete registration before deadline';
        deadline = extractedFields.entryDeadline;
        break;

      case 'sailing_instructions':
        extractedFields.raceSchedule = this.extractSchedule(content);
        extractedFields.courseTypes = this.extractText(content, ['course', 'windward', 'leeward']);
        extractedFields.timeLimits = this.extractTime(content, ['time limit']);
        extractedFields.protestProcedures = this.extractText(content, ['protest', 'hearing']);
        summary = `Sailing Instructions with ${extractedFields.raceSchedule?.length || 0} scheduled races`;
        actionRequired = 'Review before racing begins';
        break;

      case 'entry_form':
        extractedFields.requiredDocuments = this.extractDocumentList(content);
        extractedFields.paymentMethods = this.extractText(content, ['payment', 'fee']);
        extractedFields.deadlines = this.extractAllDates(content);
        summary = 'Entry form with required documentation';
        actionRequired = 'Complete and submit with required documents';
        deadline = extractedFields.deadlines?.[0];
        break;

      case 'measurement_requirements':
        extractedFields.measurementItems = this.extractMeasurements(content);
        extractedFields.inspectionSchedule = this.extractSchedule(content);
        extractedFields.certificateRequirements = this.extractText(content, ['certificate', 'measurement']);
        summary = 'Measurement requirements and inspection procedures';
        actionRequired = 'Schedule measurement inspection';
        break;
    }

    return {
      extractedFields,
      summary,
      actionRequired,
      deadline,
      effectiveDate: document.uploadedAt,
      targetAudience: ['all_participants'],
      relatedDocuments: [],
      changesSinceLastVersion: []
    };
  }

  /**
   * Extract key data from daily operations documents
   */
  private static extractDailyOperationsData(document: EventDocument, content?: string): DocumentKeyData {
    const extractedFields: Record<string, any> = {};
    let summary = document.description || '';
    let actionRequired: string | undefined;

    switch (document.type) {
      case 'race_schedule':
        extractedFields.races = this.extractRaceSchedule(content);
        extractedFields.warningSignals = this.extractTimes(content, ['warning', 'signal']);
        extractedFields.raceAreas = this.extractText(content, ['area', 'course area']);
        summary = `Race schedule with ${extractedFields.races?.length || 0} races planned`;
        actionRequired = 'Check start times and course assignments';
        break;

      case 'course_info':
        extractedFields.courseLayout = this.extractText(content, ['course', 'mark', 'layout']);
        extractedFields.markDescriptions = this.extractMarks(content);
        extractedFields.courseLengths = this.extractDistances(content);
        extractedFields.windDirection = this.extractWindInfo(content);
        summary = 'Course information and mark descriptions';
        actionRequired = 'Study course layout before racing';
        break;

      case 'weather_forecast':
        extractedFields.windSpeed = this.extractWindSpeed(content);
        extractedFields.windDirection = this.extractWindDirection(content);
        extractedFields.waveConditions = this.extractText(content, ['wave', 'sea state']);
        extractedFields.visibility = this.extractNumber(content, ['visibility']);
        extractedFields.temperature = this.extractTemperature(content);
        summary = `Weather forecast: ${extractedFields.windSpeed} knots from ${extractedFields.windDirection}`;
        break;

      case 'daily_briefing':
        extractedFields.keyAnnouncements = this.extractAnnouncements(content);
        extractedFields.scheduleChanges = this.extractChanges(content);
        extractedFields.safetyUpdates = this.extractText(content, ['safety', 'emergency']);
        summary = 'Daily briefing with key updates and announcements';
        actionRequired = 'Attend briefing or review key points';
        break;
    }

    return {
      extractedFields,
      summary,
      actionRequired,
      effectiveDate: document.uploadedAt,
      targetAudience: ['all_participants'],
      relatedDocuments: [],
      changesSinceLastVersion: []
    };
  }

  /**
   * Extract key data from competition management documents
   */
  private static extractCompetitionData(document: EventDocument, content?: string): DocumentKeyData {
    const extractedFields: Record<string, any> = {};
    let summary = document.description || '';

    switch (document.type) {
      case 'live_scoring':
        extractedFields.currentStandings = this.extractStandings(content);
        extractedFields.raceResults = this.extractResults(content);
        extractedFields.pointsCalculation = this.extractText(content, ['points', 'scoring']);
        summary = 'Live scoring and current race standings';
        break;

      case 'results':
        extractedFields.finalResults = this.extractResults(content);
        extractedFields.seriesStandings = this.extractStandings(content);
        extractedFields.disqualifications = this.extractDSQs(content);
        summary = 'Official race results and series standings';
        break;

      case 'boat_rotations':
        extractedFields.rotationSchedule = this.extractRotations(content);
        extractedFields.boatAssignments = this.extractAssignments(content);
        summary = 'Boat rotation schedule and assignments';
        break;

      case 'equipment_assignments':
        extractedFields.equipmentList = this.extractEquipment(content);
        extractedFields.assignments = this.extractAssignments(content);
        summary = 'Equipment assignments and specifications';
        break;
    }

    return {
      extractedFields,
      summary,
      effectiveDate: document.uploadedAt,
      targetAudience: ['participants', 'coaches'],
      relatedDocuments: [],
      changesSinceLastVersion: []
    };
  }

  /**
   * Extract key data from protest and hearing documents
   */
  private static extractProtestData(document: EventDocument, content?: string): DocumentKeyData {
    const extractedFields: Record<string, any> = {};
    let summary = document.description || '';
    let actionRequired: string | undefined;
    let deadline: string | undefined;

    switch (document.type) {
      case 'protest_info':
        extractedFields.protestDeadlines = this.extractProtestDeadlines(content);
        extractedFields.protestProcedures = this.extractText(content, ['protest', 'procedure']);
        extractedFields.requiredDocuments = this.extractDocumentList(content);
        summary = 'Protest filing information and procedures';
        actionRequired = 'File protests within time limit';
        deadline = extractedFields.protestDeadlines?.[0];
        break;

      case 'hearing_schedule':
        extractedFields.hearings = this.extractHearings(content);
        extractedFields.protestCommittee = this.extractCommittee(content);
        extractedFields.location = this.extractText(content, ['location', 'room']);
        summary = `Hearing schedule with ${extractedFields.hearings?.length || 0} hearings`;
        actionRequired = 'Attend scheduled hearings';
        break;

      case 'decisions':
        extractedFields.decisions = this.extractDecisions(content);
        extractedFields.penalties = this.extractPenalties(content);
        extractedFields.appeals = this.extractText(content, ['appeal', 'deadline']);
        summary = 'Protest decisions and penalties';
        break;

      case 'appeals':
        extractedFields.appealProcedures = this.extractText(content, ['appeal', 'procedure']);
        extractedFields.appealDeadlines = this.extractAllDates(content);
        summary = 'Appeal procedures and deadlines';
        actionRequired = 'Submit appeals within deadline';
        deadline = extractedFields.appealDeadlines?.[0];
        break;
    }

    return {
      extractedFields,
      summary,
      actionRequired,
      deadline,
      effectiveDate: document.uploadedAt,
      targetAudience: ['participants', 'protest_committee'],
      relatedDocuments: [],
      changesSinceLastVersion: []
    };
  }

  /**
   * Extract key data from safety and regulatory documents
   */
  private static extractSafetyData(document: EventDocument, content?: string): DocumentKeyData {
    const extractedFields: Record<string, any> = {};
    let summary = document.description || '';
    let actionRequired: string | undefined;

    switch (document.type) {
      case 'safety_notice':
        extractedFields.safetyRequirements = this.extractSafetyRequirements(content);
        extractedFields.emergencyProcedures = this.extractText(content, ['emergency', 'procedure']);
        extractedFields.contactNumbers = this.extractContacts(content);
        summary = 'Safety notice with emergency procedures';
        actionRequired = 'Review safety requirements and procedures';
        break;

      case 'rule_amendments':
        extractedFields.amendments = this.extractAmendments(content);
        extractedFields.effectiveDate = this.extractDate(content, ['effective', 'in force']);
        extractedFields.affectedRules = this.extractRuleNumbers(content);
        summary = 'Rule amendments and changes';
        actionRequired = 'Review and comply with amended rules';
        break;

      case 'equipment_regulations':
        extractedFields.equipmentSpecs = this.extractEquipmentSpecs(content);
        extractedFields.inspectionRequirements = this.extractText(content, ['inspection', 'check']);
        extractedFields.approvedEquipment = this.extractApprovedEquipment(content);
        summary = 'Equipment regulations and specifications';
        actionRequired = 'Ensure equipment compliance';
        break;

      case 'emergency_procedures':
        extractedFields.emergencyContacts = this.extractContacts(content);
        extractedFields.evacuationProcedures = this.extractText(content, ['evacuation', 'emergency']);
        extractedFields.medicalFacilities = this.extractText(content, ['medical', 'hospital']);
        summary = 'Emergency procedures and contact information';
        actionRequired = 'Familiarize with emergency procedures';
        break;
    }

    return {
      extractedFields,
      summary,
      actionRequired,
      effectiveDate: document.uploadedAt,
      targetAudience: ['all_participants', 'officials'],
      relatedDocuments: [],
      changesSinceLastVersion: []
    };
  }

  /**
   * Extract key data from administrative documents
   */
  private static extractAdministrativeData(document: EventDocument, content?: string): DocumentKeyData {
    const extractedFields: Record<string, any> = {};
    let summary = document.description || '';

    switch (document.type) {
      case 'general_notices':
        extractedFields.announcements = this.extractAnnouncements(content);
        extractedFields.updates = this.extractUpdates(content);
        summary = 'General notices and announcements';
        break;

      case 'contact_info':
        extractedFields.contacts = this.extractContacts(content);
        extractedFields.roles = this.extractRoles(content);
        extractedFields.officeHours = this.extractOfficeHours(content);
        summary = 'Contact information for event officials';
        break;

      case 'venue_info':
        extractedFields.facilities = this.extractFacilities(content);
        extractedFields.directions = this.extractText(content, ['direction', 'location', 'address']);
        extractedFields.parking = this.extractText(content, ['parking', 'transport']);
        summary = 'Venue information and facilities';
        break;

      default:
        extractedFields.content = this.extractGenericContent(content);
        summary = 'Administrative document';
        break;
    }

    return {
      extractedFields,
      summary,
      effectiveDate: document.uploadedAt,
      targetAudience: ['all_participants'],
      relatedDocuments: [],
      changesSinceLastVersion: []
    };
  }

  /**
   * Extract generic data for unknown document types
   */
  private static extractGenericData(document: EventDocument, content?: string): DocumentKeyData {
    return {
      extractedFields: {
        content: content || document.description || 'No content available'
      },
      summary: document.description || document.title,
      effectiveDate: document.uploadedAt,
      targetAudience: ['all_participants'],
      relatedDocuments: [],
      changesSinceLastVersion: []
    };
  }

  // Helper methods for text extraction
  private static extractDate(content: string = '', keywords: string[]): string | undefined {
    const datePattern = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{2,4}\b/gi;
    const matches = content.match(datePattern);
    return matches?.[0];
  }

  private static extractAllDates(content: string = ''): string[] {
    const datePattern = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{2,4}\b/gi;
    return content.match(datePattern) || [];
  }

  private static extractCurrency(content: string = ''): string | undefined {
    const currencyPattern = /[$£€¥₹]\s*\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(USD|EUR|GBP|HKD|SGD)/gi;
    const matches = content.match(currencyPattern);
    return matches?.[0];
  }

  private static extractNumber(content: string = '', context: string[]): number | undefined {
    const contextPattern = new RegExp(`(${context.join('|')})\\s*:?\\s*(\\d+)`, 'gi');
    const match = content.match(contextPattern);
    if (match) {
      const numberMatch = match[0].match(/\d+/);
      return numberMatch ? parseInt(numberMatch[0]) : undefined;
    }
    return undefined;
  }

  private static extractText(content: string = '', keywords: string[]): string {
    const pattern = new RegExp(`(${keywords.join('|')})[^.]*\\.`, 'gi');
    const matches = content.match(pattern);
    return matches?.join(' ') || '';
  }

  private static extractTime(content: string = '', keywords: string[]): string | undefined {
    const timePattern = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/gi;
    const matches = content.match(timePattern);
    return matches?.[0];
  }

  private static extractTimes(content: string = '', keywords: string[]): string[] {
    const timePattern = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/gi;
    return content.match(timePattern) || [];
  }

  private static extractClasses(content: string = ''): string[] {
    const classPattern = /\b(Dragon|Laser|470|49er|Nacra|RS|Optimist|Finn|Star|Flying Dutchman)\b/gi;
    return content.match(classPattern) || [];
  }

  private static extractSchedule(content: string = ''): Array<{ date: string; time: string; event: string }> {
    // Simplified schedule extraction
    const lines = content.split('\n');
    const schedule: Array<{ date: string; time: string; event: string }> = [];
    
    lines.forEach(line => {
      const dateMatch = line.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/);
      const timeMatch = line.match(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/);
      
      if (dateMatch && timeMatch) {
        schedule.push({
          date: dateMatch[0],
          time: timeMatch[0],
          event: line.trim()
        });
      }
    });
    
    return schedule;
  }

  // Additional helper methods would be implemented here for specific extraction needs
  private static extractDocumentList(content: string = ''): string[] { return []; }
  private static extractMeasurements(content: string = ''): any[] { return []; }
  private static extractRaceSchedule(content: string = ''): any[] { return []; }
  private static extractMarks(content: string = ''): any[] { return []; }
  private static extractDistances(content: string = ''): any[] { return []; }
  private static extractWindInfo(content: string = ''): string { return ''; }
  private static extractWindSpeed(content: string = ''): string { return ''; }
  private static extractWindDirection(content: string = ''): string { return ''; }
  private static extractTemperature(content: string = ''): string { return ''; }
  private static extractAnnouncements(content: string = ''): string[] { return []; }
  private static extractChanges(content: string = ''): string[] { return []; }
  private static extractStandings(content: string = ''): any[] { return []; }
  private static extractResults(content: string = ''): any[] { return []; }
  private static extractDSQs(content: string = ''): any[] { return []; }
  private static extractRotations(content: string = ''): any[] { return []; }
  private static extractAssignments(content: string = ''): any[] { return []; }
  private static extractEquipment(content: string = ''): any[] { return []; }
  private static extractProtestDeadlines(content: string = ''): string[] { return []; }
  private static extractHearings(content: string = ''): any[] { return []; }
  private static extractCommittee(content: string = ''): string[] { return []; }
  private static extractDecisions(content: string = ''): any[] { return []; }
  private static extractPenalties(content: string = ''): any[] { return []; }
  private static extractSafetyRequirements(content: string = ''): string[] { return []; }
  private static extractContacts(content: string = ''): any[] { return []; }
  private static extractAmendments(content: string = ''): any[] { return []; }
  private static extractRuleNumbers(content: string = ''): string[] { return []; }
  private static extractEquipmentSpecs(content: string = ''): any[] { return []; }
  private static extractApprovedEquipment(content: string = ''): string[] { return []; }
  private static extractUpdates(content: string = ''): string[] { return []; }
  private static extractRoles(content: string = ''): any[] { return []; }
  private static extractOfficeHours(content: string = ''): string { return ''; }
  private static extractFacilities(content: string = ''): string[] { return []; }
  private static extractGenericContent(content: string = ''): string { return content || ''; }

  /**
   * Generate download options based on document type and category
   */
  static generateDownloadOptions(document: EventDocument): DocumentOptions {
    const category = getCategoryForDocument(document);
    
    return {
      formats: ['pdf', 'print', 'mobile'],
      bundleWith: this.getRelatedDocumentTypes(document.type),
      printOptimized: true,
      offlineAccess: this.isEssentialDocument(document.type),
      shareRestrictions: this.getShareRestrictions(category)
    };
  }

  private static getRelatedDocumentTypes(type: DocumentType): string[] {
    const related: Record<string, string[]> = {
      'notice_of_race': ['sailing_instructions', 'entry_form'],
      'sailing_instructions': ['notice_of_race', 'race_schedule'],
      'race_schedule': ['sailing_instructions', 'course_info'],
      'protest_info': ['hearing_schedule', 'decisions'],
      'safety_notice': ['emergency_procedures', 'equipment_regulations']
    };
    
    return related[type] || [];
  }

  private static isEssentialDocument(type: DocumentType): boolean {
    const essential = [
      'notice_of_race', 'sailing_instructions', 'race_schedule', 
      'safety_notice', 'emergency_procedures'
    ];
    return essential.includes(type);
  }

  private static getShareRestrictions(category: RegattaCategory): 'none' | 'registered_only' | 'officials_only' {
    if (category === RegattaCategory.PROTESTS_HEARINGS) {
      return 'registered_only';
    }
    if (category === RegattaCategory.SAFETY_REGULATORY) {
      return 'registered_only';
    }
    return 'none';
  }
}

export default DocumentProcessor;