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

export const EVENT_INFO: Record<string, EventInfo> = {
  'asia-pacific-2026': {
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
  },
  'dragon-worlds-2026': {
    id: 'dragon-worlds-2026',
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
  }
};

export const generateEventDocuments = (eventId: string): EventDocument[] => {
  const eventInfo = EVENT_INFO[eventId];
  const isWorldChampionships = eventId === 'dragon-worlds-2026';

  const commonDocs: EventDocument[] = [
    {
      id: `${eventId}_nor`,
      title: 'Notice of Race',
      type: 'notice_of_race',
      category: RegattaCategory.PRE_EVENT,
      url: 'https://www.sailing.org/tools/documents/AppendixKNoticeofRace-[25919].pdf',
      fileType: 'pdf',
      size: 2456789,
      uploadedAt: new Date('2026-09-15T10:00:00.000Z').toISOString(),
      lastModified: new Date('2026-10-01T14:30:00.000Z').toISOString(),
      downloadCount: isWorldChampionships ? 324 : 156,
      isRequired: true,
      language: 'English',
      description: `Official Notice of Race template for ${eventInfo.name}`,
      version: '1.2',
      priority: 'critical',
      status: 'published'
    },
    {
      id: `${eventId}_si`,
      title: 'Sailing Instructions',
      type: 'sailing_instructions',
      category: RegattaCategory.COMPETITION_MANAGEMENT,
      url: 'https://www.sailing.org/tools/documents/AppendixLSailingInstructions-[25920].pdf',
      fileType: 'pdf',
      size: 3876543,
      uploadedAt: new Date('2026-11-10T16:00:00.000Z').toISOString(),
      lastModified: new Date('2026-11-15T09:45:00.000Z').toISOString(),
      downloadCount: isWorldChampionships ? 287 : 134,
      isRequired: true,
      language: 'English',
      description: 'Complete sailing instructions including course details and race procedures',
      version: '2.1',
      priority: 'critical',
      status: 'published'
    },
    {
      id: `${eventId}_schedule`,
      title: 'Race Schedule',
      type: 'race_schedule',
      category: RegattaCategory.DAILY_OPERATIONS,
      url: 'https://www.sailing.org/tools/documents/RRS2021-2024-[25918].pdf#page=25',
      fileType: 'pdf',
      size: 456789,
      uploadedAt: new Date('2026-11-16T08:00:00.000Z').toISOString(),
      isRequired: false,
      language: 'English',
      description: `Daily racing schedule and course layout for ${eventInfo.shortName}`,
      version: '1.0',
      priority: 'high',
      status: 'published'
    },
    {
      id: `${eventId}_measurement`,
      title: 'Measurement Requirements',
      type: 'measurement_requirements',
      category: RegattaCategory.SAFETY_REGULATORY,
      url: 'https://www.sailing.org/tools/documents/EquipmentRulesofSailing2021-2024-[25921].pdf',
      fileType: 'pdf',
      size: 1234567,
      uploadedAt: new Date('2026-09-01T12:00:00.000Z').toISOString(),
      downloadCount: isWorldChampionships ? 198 : 89,
      isRequired: true,
      language: 'English',
      description: 'Dragon class measurement requirements and certification procedures',
      version: '1.0',
      priority: 'high',
      status: 'published'
    },
    {
      id: `${eventId}_protest_procedures`,
      title: 'Protest Procedures and Forms',
      type: 'protest_info',
      category: RegattaCategory.PROTESTS_HEARINGS,
      url: 'https://www.sailing.org/tools/documents/RRS2021-2024-[25918].pdf#page=89',
      fileType: 'pdf',
      size: 567890,
      uploadedAt: new Date('2026-10-15T10:00:00.000Z').toISOString(),
      downloadCount: isWorldChampionships ? 156 : 67,
      isRequired: false,
      language: 'English',
      description: 'Official protest forms, procedures, and International Jury guidelines',
      version: '1.0',
      priority: 'medium',
      status: 'published'
    }
  ];

  if (isWorldChampionships) {
    commonDocs.push(
      {
        id: `${eventId}_charter`,
        title: 'Charter Boat Information',
        type: 'venue_info',
        category: RegattaCategory.ADMINISTRATIVE,
        url: 'https://www.sailing.org/tools/documents/RegulationRegatta-[26789].pdf#page=12',
        fileType: 'pdf',
        size: 876543,
        uploadedAt: new Date('2026-08-15T14:00:00.000Z').toISOString(),
        lastModified: new Date('2026-10-20T11:30:00.000Z').toISOString(),
        downloadCount: 145,
        isRequired: false,
        language: 'English',
        description: 'Charter boat requirements and crew qualification guidelines',
        version: '1.3',
        priority: 'medium',
        status: 'published'
      },
      {
        id: `${eventId}_shipping`,
        title: 'International Shipping Guide',
        type: 'venue_info',
        category: RegattaCategory.ADMINISTRATIVE,
        url: 'https://www.sailing.org/tools/documents/SafetyRecommendations-[24839].pdf#page=8',
        fileType: 'pdf',
        size: 1543210,
        uploadedAt: new Date('2026-07-30T10:00:00.000Z').toISOString(),
        downloadCount: 87,
        isRequired: false,
        language: 'English',
        description: 'Safety recommendations for international boat transportation and setup',
        version: '1.0',
        priority: 'medium',
        status: 'published'
      },
      {
        id: `${eventId}_safety`,
        title: 'Safety Equipment Requirements',
        type: 'safety_notice',
        category: RegattaCategory.SAFETY_REGULATORY,
        url: 'https://www.sailing.org/tools/documents/OffshoreSRS2022-2026-[27653].pdf',
        fileType: 'pdf',
        size: 987654,
        uploadedAt: new Date('2026-08-01T09:00:00.000Z').toISOString(),
        downloadCount: 203,
        isRequired: true,
        language: 'English',
        description: 'Offshore Special Regulations and safety equipment requirements',
        version: '1.0',
        priority: 'high',
        status: 'published'
      }
    );
  }

  return commonDocs;
};

export const generateEventNotifications = (eventId: string): OfficialNotification[] => {
  const eventInfo = EVENT_INFO[eventId];
  const isWorldChampionships = eventId === 'dragon-worlds-2026';
  const baseDate = new Date(eventInfo.dates.start);

  const eventWebsite = isWorldChampionships ? 'https://dragonworldshk2027.com' : 'https://asiapacificdragon2026.com';

  const notifications: OfficialNotification[] = [
    {
      id: `${eventId}_weather_update`,
      title: 'Hong Kong November Weather Outlook',
      content: `Latest meteorological forecast for ${eventInfo.shortName}: Moderate to fresh northeast monsoon winds expected, 15-25 knots. Temperature range 18-25°C with excellent visibility. Ideal sailing conditions anticipated for Clearwater Bay racing area.`,
      type: 'weather',
      priority: 'high',
      publishedAt: new Date(baseDate.getTime() - 86400000 * 2).toISOString(),
      author: 'Hong Kong Observatory',
      authorRole: 'race_committee',
      tags: ['weather', 'forecast', 'conditions'],
      isRead: false,
      version: '1.0',
      sourceUrl: `${eventWebsite}/weather-updates`
    },
    {
      id: `${eventId}_course_briefing`,
      title: 'Race Course Information - South China Sea',
      content: `Racing will take place in the waters near the Ninepins Islands, up to 8 nautical miles from Clearwater Bay. Course length optimized for moderate to fresh northeast monsoon conditions. Daily course briefings at 0900 local time.`,
      type: 'course_change',
      priority: 'high',
      publishedAt: new Date(baseDate.getTime() - 86400000 * 3).toISOString(),
      author: 'Principal Race Officer',
      authorRole: 'race_committee',
      tags: ['course', 'briefing', 'location'],
      isRead: false,
      version: '1.0',
      sourceUrl: `${eventWebsite}/racing-area`
    },
    {
      id: `${eventId}_registration_update`,
      title: `Registration Status - ${eventInfo.entryCount} Entries Confirmed`,
      content: `Registration update: ${eventInfo.entryCount} boats from ${eventInfo.countries.length} countries confirmed. Final registration closes 48 hours before first race. Measurement inspection schedule available on notice board.`,
      type: 'entry_update',
      priority: 'medium',
      publishedAt: new Date(baseDate.getTime() - 86400000 * 5).toISOString(),
      author: 'Registration Committee',
      authorRole: 'organizer',
      tags: ['registration', 'entries', 'measurement'],
      isRead: true,
      version: '1.0',
      sourceUrl: `${eventWebsite}/registration`
    },
    {
      id: `${eventId}_protest_hearing`,
      title: 'Protest Hearing Schedule',
      content: 'Protest hearings will commence at 1800 hours in the protest room. All parties must be present 15 minutes prior to scheduled time. Late arrivals may result in hearing proceeding without representation.',
      type: 'protest',
      priority: 'high',
      publishedAt: new Date(baseDate.getTime() - 86400000 * 1).toISOString(),
      author: 'International Jury',
      authorRole: 'race_committee',
      tags: ['protest', 'hearing', 'schedule'],
      isRead: false,
      version: '1.0',
      sourceUrl: `${eventWebsite}/protests`,
      metadata: {
        category: RegattaCategory.PROTESTS_HEARINGS
      }
    }
  ];

  if (isWorldChampionships) {
    notifications.unshift(
      {
        id: `${eventId}_charter_boats`,
        title: 'Charter Boats - Final Availability Update',
        content: 'Charter boat update: 8 Dragon boats still available for charter (USD 3,500-9,000 range). Contact RHKYC charter coordinator for immediate booking. Includes full racing equipment package and local delivery to Clearwater Bay marina.',
        type: 'venue_info',
        priority: 'high',
        publishedAt: new Date(baseDate.getTime() - 86400000 * 1).toISOString(),
        author: 'Charter Coordinator',
        authorRole: 'organizer',
        tags: ['charter', 'boats', 'availability'],
        isRead: false,
        version: '1.0',
        sourceUrl: `${eventWebsite}/charter-boats`
      },
      {
        id: `${eventId}_shipping_deadline`,
        title: 'International Shipping - Final Call',
        content: 'Final reminder: International boat shipping deadline is November 1st for guaranteed delivery. RHKYC logistics team providing full support for customs clearance and marina delivery. Contact shipping coordinator immediately for assistance.',
        type: 'announcement',
        priority: 'urgent',
        publishedAt: new Date(baseDate.getTime() - 86400000 * 4).toISOString(),
        author: 'Logistics Coordinator',
        authorRole: 'organizer',
        tags: ['shipping', 'deadline', 'international'],
        isRead: false,
        version: '1.0',
        sourceUrl: `${eventWebsite}/logistics-shipping`
      }
    );
  }

  return notifications;
};

export const generateEventProtests = (eventId: string): ProtestSubmission[] => {
  const isWorldChampionships = eventId === 'dragon-worlds-2026';

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
  const isWorldChampionships = eventId === 'dragon-worlds-2026';

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
  const isWorldChampionships = eventId === 'dragon-worlds-2026';

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
  const eventInfo = EVENT_INFO[eventId];

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
      weatherNotices: generateEventWeatherNotices(eventId)
    }
  };
};

export const AVAILABLE_EVENTS = Object.keys(EVENT_INFO);
export const DEFAULT_EVENT_ID = 'asia-pacific-2026';