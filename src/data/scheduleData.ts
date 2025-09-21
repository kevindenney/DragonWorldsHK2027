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
  days: Day[];
}

export const eventSchedules = {
  worldChampionship: {
    id: 'world-championship',
    title: "2027 Dragon World Championship",
    dates: "November 21-29, 2026",
    venue: "Royal Hong Kong Yacht Club, Port Shelter",
    description: "The premier international Dragon class sailing world championship",
    days: [
      {
        id: 'day-1',
        date: "Friday, November 21, 2026",
        title: "Arrival Day",
        activities: [
          {
            time: "09:00-18:00",
            activity: "Registration Opens (Race Office)",
            type: "registration" as const,
            location: "Race Office",
            detail: "Complete competitor check-in, collect race documents, and receive event merchandise",
            mapLocationId: "rhkyc_kellett"
          },
          {
            time: "10:00-17:00",
            activity: "Boat Measurement & Equipment Inspection",
            type: "technical" as const,
            location: "Measurement Dock",
            detail: "Official measurement and safety equipment inspection. Bring measurement certificate and safety gear",
            mapLocationId: "rhkyc_kellett"
          },
          {
            time: "14:00-17:00",
            activity: "Charter Boat Assignment (if applicable)",
            type: "registration" as const,
            location: "Charter Desk",
            detail: "Charter boat allocation and equipment handover for international teams",
            mapLocationId: "rhkyc_kellett"
          },
          {
            time: "18:00-20:00",
            activity: "Welcome Reception - Opening Ceremony",
            type: "social" as const,
            location: "Club Terrace",
            detail: "Official championship opening with welcome cocktails and team introductions. Dress code: Smart casual",
            mapLocationId: "rhkyc_kellett"
          },
          {
            time: "20:00",
            activity: "Skippers' Meeting #1 - Race Format Briefing",
            type: "meeting" as const,
            location: "Main Hall",
            detail: "Mandatory briefing covering race format, safety procedures, and local conditions",
            mapLocationId: "clearwater_bay_marina"
          }
        ]
      },
      {
        id: 'day-2',
        date: "Saturday, November 22, 2026",
        title: "Preparation Day",
        activities: [
          { 
            time: "08:00-12:00", 
            activity: "Registration Continues",
            type: "registration" as const,
            location: "Race Office"
          },
          { 
            time: "09:00-12:00", 
            activity: "Boat Measurement & Sail Measurement",
            type: "technical" as const,
            location: "Measurement Area"
          },
          {
            time: "10:00-16:00",
            activity: "Official Practice Race Window",
            type: "racing" as const,
            location: "Racing Area Alpha",
            detail: "Open practice sailing in championship race area. Wind conditions typically 10-15 knots from NE",
            mapLocationId: "ninepins_race_course"
          },
          {
            time: "13:00-14:00",
            activity: "Practice Race Briefing",
            type: "meeting" as const,
            location: "Briefing Room",
            detail: "Course configuration and starting sequence for practice race. Weather update included",
            mapLocationId: "clearwater_bay_marina"
          },
          {
            time: "14:30",
            activity: "Warning Signal for Practice Race",
            type: "racing" as const,
            location: "Racing Area Alpha",
            detail: "Official practice race start. Course: Windward-Leeward, 3 laps",
            mapLocationId: "ninepins_race_course"
          },
          { 
            time: "17:00", 
            activity: "Daily Debrief (Race Office)",
            type: "meeting" as const,
            location: "Race Office"
          },
          {
            time: "19:00",
            activity: "Competitors' Dinner & International Dragon Association Meeting",
            type: "social" as const,
            location: "Club Dining Room",
            detail: "Welcome dinner for all competitors followed by IDA annual meeting. Buffet style, included in entry fee",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      },
      {
        id: 'day-3',
        date: "Sunday, November 23, 2026",
        title: "Qualifying Series Day 1",
        activities: [
          { 
            time: "09:00", 
            activity: "Final Registration Closes",
            type: "registration" as const,
            location: "Race Office"
          },
          {
            time: "10:00",
            activity: "Skippers' Meeting #2 - Weather & Course Briefing",
            type: "meeting" as const,
            location: "Main Hall",
            detail: "Daily weather forecast, course selection, and race management procedures",
            mapLocationId: "clearwater_bay_marina"
          },
          {
            time: "11:30",
            activity: "First Warning Signal",
            type: "racing" as const,
            location: "Racing Area Alpha",
            detail: "First race of qualifying series. Target: 3 races, back-to-back starts",
            mapLocationId: "ninepins_race_course"
          },
          {
            time: "12:00-17:00",
            activity: "Qualifying Series Races 1-3",
            type: "racing" as const,
            location: "Racing Area Alpha",
            detail: "Championship qualifying races. Course configurations depend on wind conditions",
            mapLocationId: "ninepins_race_course"
          },
          {
            time: "18:00",
            activity: "Protest Time Limit Expires",
            type: "administrative" as const,
            location: "Protest Room",
            detail: "Protest filing deadline: 60 minutes after last finisher. Forms available at Race Office",
            mapLocationId: "clearwater_bay_marina"
          },
          { 
            time: "19:00", 
            activity: "Daily Results Posted",
            type: "administrative" as const,
            location: "Results Board"
          },
          {
            time: "20:00",
            activity: "Welcome Cocktail Party (Host Yacht Club)",
            type: "social" as const,
            location: "Club Terrace",
            detail: "RHKYC hosts welcome cocktails for all competitors. Light refreshments and local entertainment",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      },
      {
        id: 'day-4',
        date: "Monday, November 24, 2026",
        title: "Qualifying Series Day 2",
        activities: [
          { 
            time: "09:30", 
            activity: "Daily Weather & Course Briefing",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "11:00", 
            activity: "First Warning Signal",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "11:30-16:30", 
            activity: "Qualifying Series Races 4-6",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "17:30", 
            activity: "Protest Time Limit Expires",
            type: "administrative" as const,
            location: "Protest Room"
          },
          { 
            time: "18:30", 
            activity: "Results Posted & Fleet Division Announcement",
            type: "administrative" as const,
            location: "Results Board"
          },
          { 
            time: "19:30", 
            activity: "Cultural Evening - Hong Kong Traditional Performance",
            type: "social" as const,
            location: "Club Terrace"
          }
        ]
      },
      {
        id: 'day-5',
        date: "Tuesday, November 25, 2026",
        title: "Qualifying Series Day 3",
        activities: [
          { 
            time: "09:30", 
            activity: "Daily Briefing",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "11:00", 
            activity: "First Warning Signal",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "11:30-16:30", 
            activity: "Qualifying Series Races 7-9",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "17:30", 
            activity: "Protest Time Limit Expires",
            type: "administrative" as const,
            location: "Protest Room"
          },
          { 
            time: "18:30", 
            activity: "Final Qualifying Results & Gold/Silver Fleet Divisions",
            type: "administrative" as const,
            location: "Results Board"
          },
          { 
            time: "20:00", 
            activity: "Mid-Championship Gala Dinner",
            type: "social" as const,
            location: "Grand Ballroom"
          }
        ]
      },
      {
        id: 'day-6',
        date: "Wednesday, November 26, 2026",
        title: "Finals Series Day 1",
        activities: [
          { 
            time: "09:30", 
            activity: "Gold & Silver Fleet Briefings",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "11:00", 
            activity: "First Warning Signal - Gold Fleet",
            type: "racing" as const,
            location: "Racing Area Alpha & Beta"
          },
          { 
            time: "11:30-17:00", 
            activity: "Finals Series Races 1-3 (Gold & Silver Fleets)",
            type: "racing" as const,
            location: "Racing Area Alpha & Beta"
          },
          {
            time: "18:00",
            activity: "Protest Time Limit Expires",
            type: "administrative" as const,
            location: "Protest Room",
            detail: "Protest filing deadline: 60 minutes after last finisher. Forms available at Race Office",
            mapLocationId: "clearwater_bay_marina"
          },
          { 
            time: "19:00", 
            activity: "Results Posted",
            type: "administrative" as const,
            location: "Results Board"
          }
        ]
      },
      {
        id: 'day-7',
        date: "Thursday, November 27, 2026",
        title: "Finals Series Day 2",
        activities: [
          { 
            time: "09:30", 
            activity: "Daily Briefing - Medal Race Qualification Update",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "11:00", 
            activity: "First Warning Signal",
            type: "racing" as const,
            location: "Racing Area Alpha & Beta"
          },
          { 
            time: "11:30-16:30", 
            activity: "Finals Series Races 4-6 (Gold & Silver Fleets)",
            type: "racing" as const,
            location: "Racing Area Alpha & Beta"
          },
          { 
            time: "17:30", 
            activity: "Protest Time Limit Expires",
            type: "administrative" as const,
            location: "Protest Room"
          },
          { 
            time: "18:30", 
            activity: "Medal Race Qualification Announced",
            type: "administrative" as const,
            location: "Results Board"
          },
          { 
            time: "20:00", 
            activity: "Sponsors' Reception & Awards Ceremony Rehearsal",
            type: "social" as const,
            location: "Club Terrace"
          }
        ]
      },
      {
        id: 'day-8',
        date: "Friday, November 28, 2026",
        title: "Finals Series Day 3 & Medal Races",
        activities: [
          { 
            time: "09:30", 
            activity: "Final Daily Briefing",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "11:00", 
            activity: "First Warning Signal - Final Series Race",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "11:30-14:30", 
            activity: "Final Fleet Races (if needed)",
            type: "racing" as const,
            location: "Racing Area Alpha & Beta"
          },
          { 
            time: "15:30", 
            activity: "Medal Race Briefing",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "16:00", 
            activity: "Medal Race Warning Signal (Top 10 boats)",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "16:30", 
            activity: "Medal Race Finish",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "17:30", 
            activity: "Final Results Posted",
            type: "administrative" as const,
            location: "Results Board"
          },
          { 
            time: "18:00", 
            activity: "Press Conference (Top 3 finishers)",
            type: "media" as const,
            location: "Press Room"
          },
          { 
            time: "20:00", 
            activity: "Championship Gala Dinner & Prize Giving Ceremony",
            type: "social" as const,
            location: "Grand Ballroom"
          }
        ]
      },
      {
        id: 'day-9',
        date: "Saturday, November 29, 2026",
        title: "Departure Day",
        activities: [
          { 
            time: "09:00-12:00", 
            activity: "Boat Haul-Out & Equipment Return",
            type: "technical" as const,
            location: "Marina"
          },
          { 
            time: "10:00-14:00", 
            activity: "Departure Assistance",
            type: "administrative" as const,
            location: "Concierge Desk"
          },
          { 
            time: "11:00", 
            activity: "Final Farewell Gathering",
            type: "social" as const,
            location: "Club Terrace"
          },
          { 
            time: "14:00", 
            activity: "Official Event Conclusion",
            type: "administrative" as const,
            location: "Main Entrance"
          }
        ]
      }
    ]
  },
  
  asiaPacificChampionships: {
    id: 'asia-pacific-championships',
    title: "2026 Asia Pacific Championship",
    dates: "November 14-17, 2026",
    venue: "Royal Hong Kong Yacht Club, Port Shelter",
    description: "Regional championship for Asia Pacific Dragon sailors",
    days: [
      {
        id: 'ap-day-1',
        date: "Thursday, November 12, 2026",
        title: "Early Arrival (Optional)",
        activities: [
          {
            time: "14:00-18:00",
            activity: "Early Registration Opens",
            type: "registration" as const,
            location: "Race Office",
            detail: "Optional early check-in for teams arriving ahead of schedule. Collect welcome packets and event information",
            mapLocationId: "rhkyc_kellett"
          },
          {
            time: "15:00-17:00",
            activity: "Boat Inspection & Charter Assignment",
            type: "technical" as const,
            location: "Marina",
            detail: "Charter boat allocation and basic inspection for early arrivals. Bring charter documentation",
            mapLocationId: "rhkyc_kellett"
          },
          {
            time: "18:00",
            activity: "Informal Welcome Drinks",
            type: "social" as const,
            location: "Club Bar",
            detail: "Casual welcome drinks for early arrivals. Meet fellow competitors and local sailing community",
            mapLocationId: "rhkyc_kellett"
          }
        ]
      },
      {
        id: 'ap-day-2',
        date: "Friday, November 13, 2026",
        title: "Official Arrival & Practice",
        activities: [
          {
            time: "08:00-17:00",
            activity: "Registration Opens",
            type: "registration" as const,
            location: "Race Office",
            detail: "Complete competitor registration, collect race documents, and receive event credentials",
            mapLocationId: "rhkyc_kellett",
            registrationRequired: false,
            contactPerson: "Registration Team - regatta@rhkyc.org.hk",
            bringItems: ["Sailing license", "Passport/ID", "Medical certificate"],
            calendarTitle: "Registration Opens - 2026 Asia Pacific Championship",
            calendarDescription: "Complete your registration for the 2026 Asia Pacific Championship. Bring all required documentation."
          },
          {
            time: "09:00-16:00",
            activity: "Boat Measurement & Equipment Check",
            type: "technical" as const,
            location: "Measurement Area",
            detail: "Official boat measurement and safety equipment inspection. Bring measurement certificate and safety gear",
            mapLocationId: "rhkyc_kellett",
            prerequisites: ["Valid registration confirmation"],
            contactPerson: "Chief Measurer - measurement@rhkyc.org.hk",
            bringItems: ["Measurement certificate", "Safety equipment", "Boat registration documents", "Sail numbers"],
            registrationRequired: true,
            calendarTitle: "Boat Measurement & Equipment Check",
            calendarDescription: "Mandatory boat measurement and safety inspection. Ensure all equipment is ready for inspection."
          },
          {
            time: "11:00-15:00",
            activity: "Open Practice Sailing Window",
            type: "racing" as const,
            location: "Racing Area Alpha",
            detail: "Free practice sailing in the championship racing area. Familiarize yourself with local conditions",
            mapLocationId: "ninepins_race_course"
          },
          {
            time: "16:00",
            activity: "Course Familiarization Briefing",
            type: "meeting" as const,
            location: "Briefing Room",
            detail: "Local sailing conditions, course layouts, and safety procedures. Mandatory attendance",
            mapLocationId: "clearwater_bay_marina",
            prerequisites: ["Completed registration", "Passed boat measurement"],
            contactPerson: "Race Director - raceoffice@rhkyc.org.hk",
            registrationRequired: true,
            maxParticipants: 150,
            bringItems: ["Notebook", "Course maps (will be provided)"],
            calendarTitle: "MANDATORY: Course Familiarization Briefing",
            calendarDescription: "Essential briefing covering local conditions and safety procedures. Attendance is mandatory for all competitors."
          },
          {
            time: "17:30",
            activity: "Practice Race (Optional)",
            type: "racing" as const,
            location: "Racing Area Alpha",
            detail: "Optional practice race to test starting procedures and course configuration",
            mapLocationId: "ninepins_race_course"
          },
          {
            time: "19:00",
            activity: "Opening Dinner - Local Hong Kong Cuisine",
            type: "social" as const,
            location: "Club Dining Room",
            detail: "Welcome dinner featuring authentic Hong Kong cuisine. Included in entry fee. Dress code: Smart casual",
            mapLocationId: "rhkyc_kellett",
            dressCode: "Smart casual - no shorts or sandals",
            maxParticipants: 200,
            registrationRequired: false,
            contactPerson: "Events Coordinator - events@rhkyc.org.hk",
            bringItems: ["Appetite for authentic dim sum and local delicacies"],
            calendarTitle: "Opening Dinner - Hong Kong Cuisine Experience",
            calendarDescription: "Welcome dinner featuring the best of Hong Kong's culinary traditions. Included in your entry fee. Smart casual dress code."
          }
        ]
      },
      {
        id: 'ap-day-3',
        date: "Saturday, November 14, 2026",
        title: "Championship Day 1",
        activities: [
          { 
            time: "09:00", 
            activity: "Registration Closes",
            type: "registration" as const,
            location: "Race Office"
          },
          {
            time: "09:30",
            activity: "Competitors' Briefing - Race Format & Local Conditions",
            type: "meeting" as const,
            location: "Main Hall",
            detail: "Critical pre-racing briefing covering weather conditions, course configuration, and race management procedures",
            mapLocationId: "clearwater_bay_marina",
            prerequisites: ["Completed registration", "Passed boat measurement", "Attended course familiarization"],
            contactPerson: "Race Director - raceoffice@rhkyc.org.hk",
            registrationRequired: true,
            maxParticipants: 150,
            bringItems: ["Notebook", "Race instructions", "Weather radio"],
            calendarTitle: "MANDATORY: Competitors' Race Briefing",
            calendarDescription: "Essential pre-race briefing. Mandatory attendance for all competitors. Latest weather and course updates."
          },
          { 
            time: "11:00", 
            activity: "First Warning Signal",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "11:30-16:30", 
            activity: "Races 1-3",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "17:30", 
            activity: "Protest Time Limit",
            type: "administrative" as const,
            location: "Protest Room"
          },
          { 
            time: "18:30", 
            activity: "Results Posted",
            type: "administrative" as const,
            location: "Results Board"
          },
          { 
            time: "19:30", 
            activity: "Competitors' BBQ & Live Music",
            type: "social" as const,
            location: "Marina Deck"
          }
        ]
      },
      {
        id: 'ap-day-4',
        date: "Sunday, November 15, 2026",
        title: "Championship Day 2",
        activities: [
          { 
            time: "09:30", 
            activity: "Daily Weather Briefing",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "10:30", 
            activity: "First Warning Signal",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "11:00-16:00", 
            activity: "Races 4-6",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "17:00", 
            activity: "Protest Time Limit",
            type: "administrative" as const,
            location: "Protest Room"
          },
          { 
            time: "18:00", 
            activity: "Results Posted",
            type: "administrative" as const,
            location: "Results Board"
          },
          { 
            time: "19:00", 
            activity: "Cultural Night - Dragon Boat Demonstration & Local Traditions",
            type: "social" as const,
            location: "Club Terrace"
          }
        ]
      },
      {
        id: 'ap-day-5',
        date: "Monday, November 16, 2026",
        title: "Championship Day 3 & Finals",
        activities: [
          { 
            time: "09:30", 
            activity: "Final Day Briefing",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "10:30", 
            activity: "First Warning Signal",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "11:00-15:00", 
            activity: "Races 7-9 (if needed)",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "15:30", 
            activity: "Medal Race Briefing (Top 10)",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "16:00", 
            activity: "Medal Race Warning Signal",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "16:30", 
            activity: "Medal Race Finish",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "17:30", 
            activity: "Final Results & Protest Time Limit",
            type: "administrative" as const,
            location: "Protest Room"
          },
          {
            time: "19:00",
            activity: "Prize Giving Ceremony & Farewell Dinner",
            type: "social" as const,
            location: "Club Dining Room",
            detail: "Official awards ceremony followed by farewell dinner. Recognition of all competitors and sponsors",
            mapLocationId: "rhkyc_kellett",
            dressCode: "Formal - blazer and tie recommended",
            maxParticipants: 200,
            registrationRequired: false,
            contactPerson: "Events Coordinator - events@rhkyc.org.hk",
            bringItems: ["Camera for memories", "Formal attire"],
            relatedActivities: ["Medal race finish", "Final results posting"],
            calendarTitle: "Prize Giving Ceremony & Farewell Dinner",
            calendarDescription: "Celebration of championship results with formal awards ceremony and farewell dinner. Formal dress code."
          },
          { 
            time: "21:00", 
            activity: "World Championship Preview Presentation",
            type: "meeting" as const,
            location: "Main Hall"
          }
        ]
      },
      {
        id: 'ap-day-6',
        date: "Tuesday, November 17, 2026",
        title: "Departure",
        activities: [
          { 
            time: "09:00-12:00", 
            activity: "Boat Haul-Out",
            type: "technical" as const,
            location: "Marina"
          },
          { 
            time: "10:00", 
            activity: "Equipment Storage for World Championship (if applicable)",
            type: "administrative" as const,
            location: "Storage Area"
          },
          { 
            time: "11:00", 
            activity: "Final Team Photo",
            type: "social" as const,
            location: "Club Entrance"
          },
          { 
            time: "12:00", 
            activity: "Event Conclusion & Check-Out",
            type: "administrative" as const,
            location: "Reception"
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