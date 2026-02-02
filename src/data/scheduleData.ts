// scheduleData.ts - Complete event calendar data for Dragon World 2027 app

export interface Activity {
  time: string;
  activity: string;
  type: 'racing' | 'social' | 'meeting' | 'registration' | 'technical' | 'administrative' | 'media';
  location: string;
  detail?: string;
  mapLocationId?: string;
  prerequisites?: string[];           // Required activities before this one
  relatedActivities?: string[];      // Related/follow-up activities
  dressCode?: string;                // Dress code requirements
  bringItems?: string[];             // Items to bring
  contactPerson?: string;            // Contact for questions
  maxParticipants?: number;          // Capacity limits
  registrationRequired?: boolean;    // Whether registration needed
  calendarTitle?: string;            // Custom calendar event title
  calendarDescription?: string;      // Calendar event description
}

export interface Day {
  id: string;
  date: string;
  title: string;
  activities: Activity[];
}

export interface EventSchedule {
  id: string;
  title: string;
  dates: string;
  venue: string;
  description: string;
  clubSpotUrl?: string;
  days: Day[];
}

export const eventSchedules = {
  worldChampionship: {
    id: 'world-championship',
    title: "2027 Dragon World Championship",
    dates: "November 19-30, 2026",
    venue: "Royal Hong Kong Yacht Club, Kellett Island",
    description: "The premier international Dragon class sailing world championship",
    clubSpotUrl: "https://theclubspot.com/regatta/zyQIfeVjhb",
    days: [
      {
        id: 'day-1',
        date: "Thursday, November 19, 2026",
        title: "Early Measurement (Optional)",
        activities: [
          {
            time: "10:00-18:00",
            activity: "Measurement & Registration (Optional)",
            type: "technical" as const,
            location: "RHKYC Kellett Island",
            detail: "May also be used for measurement & registration. The Technical Committee will advise if this is the case.",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      },
      {
        id: 'day-2',
        date: "Friday, November 20, 2026",
        title: "Early Measurement (Optional)",
        activities: [
          {
            time: "10:00-18:00",
            activity: "Measurement & Registration (Optional)",
            type: "technical" as const,
            location: "RHKYC Kellett Island",
            detail: "May also be used for measurement & registration. The Technical Committee will advise if this is the case.",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      },
      {
        id: 'day-3',
        date: "Saturday, November 21, 2026",
        title: "Measurement & Registration",
        activities: [
          {
            time: "10:00-18:00",
            activity: "Measurement & Registration",
            type: "registration" as const,
            location: "RHKYC Kellett Island",
            detail: "Official measurement and registration. Bring measurement certificate, insurance, and safety equipment.",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      },
      {
        id: 'day-4',
        date: "Sunday, November 22, 2026",
        title: "Registration & Opening",
        activities: [
          {
            time: "10:00-18:00",
            activity: "Measurement & Registration",
            type: "registration" as const,
            location: "RHKYC Kellett Island",
            detail: "Final measurement and registration day.",
            mapLocationId: "rhkyc_kellett"
          },
          {
            time: "10:00-11:00",
            activity: "Skippers Briefing",
            type: "meeting" as const,
            location: "Clearwater Bay Golf & Country Club",
            detail: "Mandatory briefing covering race format, safety procedures, and local conditions.",
            mapLocationId: "clearwater_bay_marina"
          },
          {
            time: "18:00-20:00",
            activity: "Opening Cocktails",
            type: "social" as const,
            location: "RHKYC Kellett Island",
            detail: "Official championship opening reception.",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      },
      {
        id: 'day-5',
        date: "Monday, November 23, 2026",
        title: "Racing Day 1",
        activities: [
          {
            time: "11:00",
            activity: "Racing - First Warning Signal",
            type: "racing" as const,
            location: "Race Course",
            detail: "First race day. One race scheduled.",
            mapLocationId: "ninepins_race_course"
          }
        ]
      },
      {
        id: 'day-6',
        date: "Tuesday, November 24, 2026",
        title: "Racing Day 2",
        activities: [
          {
            time: "11:00",
            activity: "Racing - First Warning Signal",
            type: "racing" as const,
            location: "Race Course",
            detail: "Two races scheduled.",
            mapLocationId: "ninepins_race_course"
          }
        ]
      },
      {
        id: 'day-7',
        date: "Wednesday, November 25, 2026",
        title: "Racing Day 3",
        activities: [
          {
            time: "11:00",
            activity: "Racing - First Warning Signal",
            type: "racing" as const,
            location: "Race Course",
            detail: "Two races scheduled.",
            mapLocationId: "ninepins_race_course"
          },
          {
            time: "TBC",
            activity: "Official World Championship Dinner",
            type: "social" as const,
            location: "TBC",
            detail: "Venue and time to be confirmed.",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      },
      {
        id: 'day-8',
        date: "Thursday, November 26, 2026",
        title: "Lay Day",
        activities: [
          {
            time: "All Day",
            activity: "Lay Day",
            type: "administrative" as const,
            location: "N/A",
            detail: "Lay Day. Race Committee will notify if there is racing to complete a minimum regatta series."
          }
        ]
      },
      {
        id: 'day-9',
        date: "Friday, November 27, 2026",
        title: "Racing Day 4",
        activities: [
          {
            time: "11:00",
            activity: "Racing - First Warning Signal",
            type: "racing" as const,
            location: "Race Course",
            detail: "Two races scheduled.",
            mapLocationId: "ninepins_race_course"
          }
        ]
      },
      {
        id: 'day-10',
        date: "Saturday, November 28, 2026",
        title: "Racing Day 5",
        activities: [
          {
            time: "11:00",
            activity: "Racing - First Warning Signal",
            type: "racing" as const,
            location: "Race Course",
            detail: "Two races scheduled.",
            mapLocationId: "ninepins_race_course"
          }
        ]
      },
      {
        id: 'day-11',
        date: "Sunday, November 29, 2026",
        title: "Final Racing Day",
        activities: [
          {
            time: "11:00",
            activity: "Racing - First Warning Signal",
            type: "racing" as const,
            location: "Race Course",
            detail: "Final race day. One race scheduled. No warning signal after 1500hrs.",
            mapLocationId: "ninepins_race_course"
          },
          {
            time: "TBC",
            activity: "Prizegiving",
            type: "social" as const,
            location: "TBC",
            detail: "Venue and time to be confirmed."
          },
          {
            time: "TBC",
            activity: "Closing Ceremony Dinner",
            type: "social" as const,
            location: "TBC",
            detail: "To be confirmed."
          }
        ]
      },
      {
        id: 'day-12',
        date: "Monday, November 30, 2026",
        title: "Departure Day",
        activities: [
          {
            time: "10:00-18:00",
            activity: "Haul Out and Departure",
            type: "technical" as const,
            location: "RHKYC Kellett Island",
            detail: "Boat haul-out and departure assistance.",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      }
    ]
  },
  
  asiaPacificChampionships: {
    id: 'asia-pacific-championships',
    title: "2026 Asia Pacific Championship",
    dates: "November 17-21, 2026",
    venue: "Royal Hong Kong Yacht Club, Kellett Island",
    description: "Regional championship for Asia Pacific Dragon sailors",
    clubSpotUrl: "https://theclubspot.com/regatta/p75RuY5UZc",
    days: [
      {
        id: 'ap-day-1',
        date: "Tuesday, November 17, 2026",
        title: "Registration & Measurement Day 1",
        activities: [
          {
            time: "10:00-18:00",
            activity: "Registration & Measurement",
            type: "registration" as const,
            location: "RHKYC Kellett Island",
            detail: "Competitor registration and boat measurement. Bring measurement certificate and safety equipment.",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      },
      {
        id: 'ap-day-2',
        date: "Wednesday, November 18, 2026",
        title: "Registration & Measurement Day 2",
        activities: [
          {
            time: "10:00-18:00",
            activity: "Registration & Measurement",
            type: "registration" as const,
            location: "RHKYC Kellett Island",
            detail: "Continuing registration and measurement.",
            mapLocationId: "rhkyc_kellett"
          },
          {
            time: "10:00-11:00",
            activity: "Skippers Briefing",
            type: "meeting" as const,
            location: "Clearwater Bay Golf & Country Club",
            detail: "Mandatory briefing covering race format and local conditions.",
            mapLocationId: "clearwater_bay_marina"
          },
          {
            time: "18:00-20:00",
            activity: "Opening Cocktails",
            type: "social" as const,
            location: "RHKYC Kellett Island",
            detail: "Welcome reception for all competitors.",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      },
      {
        id: 'ap-day-3',
        date: "Thursday, November 19, 2026",
        title: "Racing Day 1",
        activities: [
          {
            time: "11:00",
            activity: "Racing - First Warning Signal",
            type: "racing" as const,
            location: "Race Course",
            detail: "First racing day of the APAC Championship.",
            mapLocationId: "ninepins_race_course"
          }
        ]
      },
      {
        id: 'ap-day-4',
        date: "Friday, November 20, 2026",
        title: "Racing Day 2",
        activities: [
          {
            time: "11:00",
            activity: "Racing - First Warning Signal",
            type: "racing" as const,
            location: "Race Course",
            detail: "Second racing day.",
            mapLocationId: "ninepins_race_course"
          }
        ]
      },
      {
        id: 'ap-day-5',
        date: "Saturday, November 21, 2026",
        title: "Final Racing Day",
        activities: [
          {
            time: "11:00",
            activity: "Racing - First Warning Signal",
            type: "racing" as const,
            location: "Race Course",
            detail: "Final racing day of APAC Championship.",
            mapLocationId: "ninepins_race_course"
          },
          {
            time: "TBC",
            activity: "Prizegiving Ceremony",
            type: "social" as const,
            location: "RHKYC Kellett Island",
            detail: "Awards ceremony for APAC Championship. Time to be confirmed.",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      }
    ]
  }
};

// Activity type mappings for icons and colors
export const activityTypes = {
  racing: {
    icon: 'Sailboat',
    color: '#2E7D8E',
    label: 'Racing'
  },
  social: {
    icon: 'Users',
    color: '#E74C3C',
    label: 'Social Event'
  },
  meeting: {
    icon: 'MessageSquare',
    color: '#8E44AD',
    label: 'Meeting/Briefing'
  },
  registration: {
    icon: 'ClipboardList',
    color: '#F39C12',
    label: 'Registration'
  },
  technical: {
    icon: 'Settings',
    color: '#27AE60',
    label: 'Technical/Measurement'
  },
  administrative: {
    icon: 'FileText',
    color: '#7F8C8D',
    label: 'Administrative'
  },
  media: {
    icon: 'Camera',
    color: '#3498DB',
    label: 'Media/Press'
  }
} as const;

export type ActivityType = keyof typeof activityTypes;

export default eventSchedules;