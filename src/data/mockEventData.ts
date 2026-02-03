import {
  NoticeBoardEvent,
  EventDocument,
  OfficialNotification,
  ProtestSubmission,
  Hearing,
  ScoringInquiry,
  OnWaterPenalty,
  CourseChange,
  WeatherNotice,
  RegattaCategory
} from '../types/noticeBoard';

export interface EventInfo {
  id: string;
  name: string;
  shortName: string;
  organizer: string;
  venue: string;
  location: string;
  dates: {
    start: string;
    end: string;
  };
  entryCount: number;
  countries: string[];
  classes: string[];
  description: string;
}

// Event info for both internal IDs and racingrulesofsailing.org event IDs
const APAC_INFO: EventInfo = {
  id: 'asia-pacific-2026',
  name: 'Asia Pacific Dragon Championships 2026',
  shortName: '2026 Asia Pacific Championship',
  organizer: 'Royal Hong Kong Yacht Club',
  venue: 'Clearwater Bay, Hong Kong SAR',
  location: 'Hong Kong, China',
  dates: {
    start: '2026-11-17T09:00:00.000Z',
    end: '2026-11-21T18:00:00.000Z'
  },
  entryCount: 58,
  countries: ['HKG', 'AUS', 'JPN', 'SIN', 'NZL', 'THA', 'MYS', 'KOR'],
  classes: ['Dragon'],
  description: 'The premier Dragon sailing championship for the Asia-Pacific region'
};

const WORLDS_INFO: EventInfo = {
  id: 'dragon-worlds-2027',
  name: '2027 Dragon World Championship',
  shortName: '2027 Dragon World Championship',
  organizer: 'Royal Hong Kong Yacht Club',
  venue: 'Clearwater Bay, Hong Kong SAR',
  location: 'Hong Kong, China',
  dates: {
    start: '2026-11-21T09:00:00.000Z',
    end: '2026-11-29T18:00:00.000Z'
  },
  entryCount: 97,
  countries: ['HKG', 'AUS', 'GBR', 'USA', 'GER', 'ITA', 'FRA', 'NED', 'SWE', 'NOR', 'DEN', 'JPN', 'SIN', 'NZL', 'BRA'],
  classes: ['Dragon'],
  description: 'The pinnacle of international Dragon class sailing competition'
};

export const EVENT_INFO: Record<string, EventInfo> = {
  // Internal event IDs
  'asia-pacific-2026': APAC_INFO,
  'dragon-worlds-2027': WORLDS_INFO,
  // Legacy ID (backwards compatibility)
  'dragon-worlds-2026': { ...WORLDS_INFO, id: 'dragon-worlds-2026' },
  // racingrulesofsailing.org event IDs
  '13241': { ...APAC_INFO, id: '13241' },
  '13242': { ...WORLDS_INFO, id: '13242' },
};

// Map racingrulesofsailing.org event IDs to internal IDs
export const EVENT_ID_MAP: Record<string, string> = {
  '13241': 'asia-pacific-2026',
  '13242': 'dragon-worlds-2027',
  'asia-pacific-2026': 'asia-pacific-2026',
  'dragon-worlds-2027': 'dragon-worlds-2027',
  // Legacy mapping
  'dragon-worlds-2026': 'dragon-worlds-2027',
};

// Get normalized event ID (returns internal ID)
export const getNormalizedEventId = (eventId: string): string => {
  return EVENT_ID_MAP[eventId] || eventId;
};

export const generateEventDocuments = (eventId: string): EventDocument[] => {
  const normalizedId = getNormalizedEventId(eventId);
  const eventInfo = EVENT_INFO[eventId] || EVENT_INFO[normalizedId];
  const isWorldChampionships = normalizedId === 'dragon-worlds-2027' || eventId === '13242';

  // Actual document IDs from racingrulesofsailing.org
  // APAC 2026 (13241): NoR = 170687, Public Links = 168654
  // Worlds 2027 (13242): NoR = 170709, Public Links = 168655
  const rrosBaseUrl = 'https://www.racingrulesofsailing.org';
  const norDocId = isWorldChampionships ? '170709' : '170687';
  const publicLinksDocId = isWorldChampionships ? '168655' : '168654';

  // Only return the two REAL documents that exist on racingrulesofsailing.org
  // Do NOT add documents until they are actually published
  return [
    {
      id: `${eventId}_nor`,
      title: 'Notice of Race',
      type: 'notice_of_race',
      category: RegattaCategory.PRE_EVENT,
      url: `${rrosBaseUrl}/documents/${norDocId}`,
      fileType: 'pdf',
      size: 2456789,
      uploadedAt: isWorldChampionships
        ? new Date('2025-12-10T00:00:00.000Z').toISOString()
        : new Date('2025-12-09T00:00:00.000Z').toISOString(),
      lastModified: isWorldChampionships
        ? new Date('2025-12-10T00:00:00.000Z').toISOString()
        : new Date('2025-12-09T00:00:00.000Z').toISOString(),
      downloadCount: isWorldChampionships ? 324 : 156,
      isRequired: true,
      language: 'English',
      description: `Official Notice of Race for the ${eventInfo?.name || 'Dragon Championship'}`,
      version: '1.0',
      priority: 'critical',
      status: 'published'
    },
    {
      id: `${eventId}_public_links`,
      title: 'Notice of Public Links',
      type: 'general_notices',
      category: RegattaCategory.PRE_EVENT,
      url: `${rrosBaseUrl}/documents/${publicLinksDocId}`,
      fileType: 'pdf',
      size: 456789,
      uploadedAt: new Date('2025-11-17T00:00:00.000Z').toISOString(),
      lastModified: new Date('2025-11-17T00:00:00.000Z').toISOString(),
      downloadCount: isWorldChampionships ? 287 : 134,
      isRequired: true,
      language: 'English',
      description: 'Official public links and QR codes for race forms including Submit Request for Hearing, Submit Scoring Inquiry, and more',
      version: '1.0',
      priority: 'high',
      status: 'published'
    }
  ];
};

export const generateEventNotifications = (eventId: string): OfficialNotification[] => {
  // No official notifications yet - only return notifications when they are
  // actually published on racingrulesofsailing.org
  // Do NOT add mock/demo notifications here
  return [];
};

export const generateEventProtests = (eventId: string): ProtestSubmission[] => {
  const normalizedId = getNormalizedEventId(eventId);
  const isWorldChampionships = normalizedId === 'dragon-worlds-2027' || eventId === '13242';

  if (!isWorldChampionships) return []; // No protests yet for Asia Pacific

  return [
    {
      id: `${eventId}_protest_1`,
      protestingBoat: 'GBR 823',
      protestedBoat: 'AUS 456',
      incident: {
        raceNumber: 2,
        timeOfIncident: '14:25:30',
        location: 'Windward mark rounding - Mark 1',
        description: 'AUS 456 failed to keep clear when overlapped to leeward during mark rounding. Contact occurred resulting in damage to GBR 823 port spreader.',
        witnessBoats: ['HKG 789', 'USA 321']
      },
      rules: {
        alleged: ['Rule 11', 'Rule 14'],
        description: 'Leeward boat failed to keep clear, contact occurred causing damage'
      },
      submittedAt: new Date('2026-11-23T17:45:00.000Z').toISOString(),
      submittedBy: 'Simon Mitchell',
      status: 'scheduled',
      hearingTime: new Date('2026-11-24T09:30:00.000Z').toISOString(),
      documents: []
    }
  ];
};

export const generateEventHearings = (eventId: string): Hearing[] => {
  const normalizedId = getNormalizedEventId(eventId);
  const isWorldChampionships = normalizedId === 'dragon-worlds-2027' || eventId === '13242';

  if (!isWorldChampionships) return [];

  return [
    {
      id: `${eventId}_hearing_1`,
      protestId: `${eventId}_protest_1`,
      scheduledTime: new Date('2026-11-24T09:30:00.000Z').toISOString(),
      location: 'Protest Room, Royal Hong Kong Yacht Club',
      protestingBoat: 'GBR 823',
      protestedBoat: 'AUS 456',
      judges: ['Judge Helen Wong', 'Judge Peter Smith', 'Judge Yuki Tanaka'],
      status: 'scheduled',
      estimatedDuration: 45,
      rules: ['Rule 11', 'Rule 14'],
      witnesses: ['HKG 789', 'USA 321']
    }
  ];
};

export const generateEventScoringInquiries = (eventId: string): ScoringInquiry[] => {
  return [
    {
      id: `${eventId}_inquiry_1`,
      sailNumber: 'HKG 789',
      raceNumber: 1,
      inquiry: 'Believe my finish position was recorded incorrectly. Video evidence shows I finished 5th, not 7th as recorded.',
      submittedAt: new Date('2026-11-22T18:30:00.000Z').toISOString(),
      submittedBy: 'Chen Wei Ming',
      status: 'resolved',
      response: 'After review of finish line video footage, position corrected from 7th to 5th place.',
      resolvedAt: new Date('2026-11-22T20:15:00.000Z').toISOString(),
      scoreChange: {
        from: 7,
        to: 5,
        reason: 'Finish line video review correction'
      }
    }
  ];
};

export const generateEventPenalties = (eventId: string): OnWaterPenalty[] => {
  const normalizedId = getNormalizedEventId(eventId);
  const isWorldChampionships = normalizedId === 'dragon-worlds-2027' || eventId === '13242';

  const penalties: OnWaterPenalty[] = [
    {
      id: `${eventId}_penalty_1`,
      sailNumber: 'USA 234',
      raceNumber: 2,
      penaltyType: 'two_turns',
      rule: 'Rule 10',
      timeAssessed: '14:05:30',
      location: 'Start area - Committee boat end',
      description: 'Port-starboard incident at start, took penalty turns immediately',
      assessedBy: 'Race Committee',
      acknowledged: true,
      scoreAdjustment: 0
    }
  ];

  if (isWorldChampionships) {
    penalties.push(
      {
        id: `${eventId}_penalty_2`,
        sailNumber: 'GER 567',
        raceNumber: 3,
        penaltyType: 'ocs',
        rule: 'Rule 29.1',
        timeAssessed: '14:00:00',
        location: 'Start line',
        description: 'On course side at start signal, returned to restart',
        assessedBy: 'Race Committee',
        acknowledged: false,
        scoreAdjustment: 0
      }
    );
  }

  return penalties;
};

export const generateEventCourseChanges = (eventId: string): CourseChange[] => {
  return [
    {
      id: `${eventId}_course_change_1`,
      raceNumber: 3,
      changeType: 'course_change',
      description: 'Course shortened to windward-leeward due to increasing wind conditions',
      reason: 'Wind has increased to 28-32 knots with gusts to 38 knots',
      effectiveTime: new Date('2026-11-23T13:45:00.000Z').toISOString(),
      announcedAt: new Date('2026-11-23T13:30:00.000Z').toISOString(),
      newInstructions: 'Race 3 will be shortened to 2 laps of windward-leeward course. Finish line at leeward gate.'
    }
  ];
};

export const generateEventWeatherNotices = (eventId: string): WeatherNotice[] => {
  return [
    {
      id: `${eventId}_weather_1`,
      type: 'forecast_update',
      title: 'Northeast Monsoon Strengthening',
      description: 'Northeast monsoon expected to strengthen bringing fresh to strong winds 20-30 knots with higher gusts',
      conditions: {
        windSpeed: {
          current: 18,
          forecast: 28,
          gusts: 35
        },
        visibility: 10,
        temperature: 22,
        pressure: 1022
      },
      validFrom: new Date('2026-11-23T12:00:00.000Z').toISOString(),
      validUntil: new Date('2026-11-23T18:00:00.000Z').toISOString(),
      actionRequired: 'Monitor conditions closely, be prepared for course modifications',
      issuedBy: 'Hong Kong Observatory',
      severity: 'advisory'
    }
  ];
};

export const generateMockEvent = (eventId: string): NoticeBoardEvent => {
  // Support both internal IDs and racingrulesofsailing.org event IDs
  const normalizedId = getNormalizedEventId(eventId);
  const eventInfo = EVENT_INFO[eventId] || EVENT_INFO[normalizedId];

  if (!eventInfo) {
    throw new Error(`Unknown event ID: ${eventId}`);
  }

  return {
    id: eventId,
    name: eventInfo.name,
    organizer: eventInfo.organizer,
    venue: eventInfo.venue,
    dates: eventInfo.dates,
    status: 'upcoming',
    entryCount: eventInfo.entryCount,
    classes: eventInfo.classes,
    languages: ['English', 'Chinese (Traditional)'],
    lastUpdated: new Date(eventInfo.dates.start).toISOString(),
    noticeBoard: {
      documents: generateEventDocuments(eventId),
      notifications: generateEventNotifications(eventId),
      protests: generateEventProtests(eventId),
      hearings: generateEventHearings(eventId),
      scoringInquiries: generateEventScoringInquiries(eventId),
      penalties: generateEventPenalties(eventId),
      courseChanges: generateEventCourseChanges(eventId),
      weatherNotices: generateEventWeatherNotices(eventId),
      mediaItems: []
    }
  };
};

// All available event IDs (internal + racingrulesofsailing.org)
export const AVAILABLE_EVENTS = Object.keys(EVENT_INFO);

// Canonical internal event IDs
export const INTERNAL_EVENT_IDS = ['asia-pacific-2026', 'dragon-worlds-2027'];

// racingrulesofsailing.org event IDs
export const RROS_EVENT_IDS = {
  APAC: '13241',
  WORLDS: '13242',
};

export const DEFAULT_EVENT_ID = 'asia-pacific-2026';