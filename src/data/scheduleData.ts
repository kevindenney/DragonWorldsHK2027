// scheduleData.ts - Complete event calendar data for Dragon World 2027 app

export interface Activity {
  time: string;
  activity: string;
  type: 'racing' | 'social' | 'meeting' | 'registration' | 'technical' | 'administrative' | 'media';
  location: string;
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
    title: "Hong Kong Dragon World Championship 2027",
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
            location: "Race Office"
          },
          { 
            time: "10:00-17:00", 
            activity: "Boat Measurement & Equipment Inspection",
            type: "technical" as const,
            location: "Measurement Dock"
          },
          { 
            time: "14:00-17:00", 
            activity: "Charter Boat Assignment (if applicable)",
            type: "registration" as const,
            location: "Charter Desk"
          },
          { 
            time: "18:00-20:00", 
            activity: "Welcome Reception - Opening Ceremony",
            type: "social" as const,
            location: "Club Terrace"
          },
          { 
            time: "20:00", 
            activity: "Skippers' Meeting #1 - Race Format Briefing",
            type: "meeting" as const,
            location: "Main Hall"
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
            location: "Racing Area Alpha"
          },
          { 
            time: "13:00-14:00", 
            activity: "Practice Race Briefing",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "14:30", 
            activity: "Warning Signal for Practice Race",
            type: "racing" as const,
            location: "Racing Area Alpha"
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
            location: "Club Dining Room"
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
            location: "Main Hall"
          },
          { 
            time: "11:30", 
            activity: "First Warning Signal",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "12:00-17:00", 
            activity: "Qualifying Series Races 1-3",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "18:00", 
            activity: "Protest Time Limit Expires",
            type: "administrative" as const,
            location: "Protest Room"
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
            location: "Club Terrace"
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
            location: "Protest Room"
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
    title: "2026 Asia Pacific Championships",
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
            location: "Race Office"
          },
          { 
            time: "15:00-17:00", 
            activity: "Boat Inspection & Charter Assignment",
            type: "technical" as const,
            location: "Marina"
          },
          { 
            time: "18:00", 
            activity: "Informal Welcome Drinks",
            type: "social" as const,
            location: "Club Bar"
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
            location: "Race Office"
          },
          { 
            time: "09:00-16:00", 
            activity: "Boat Measurement & Equipment Check",
            type: "technical" as const,
            location: "Measurement Area"
          },
          { 
            time: "11:00-15:00", 
            activity: "Open Practice Sailing Window",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "16:00", 
            activity: "Course Familiarization Briefing",
            type: "meeting" as const,
            location: "Briefing Room"
          },
          { 
            time: "17:30", 
            activity: "Practice Race (Optional)",
            type: "racing" as const,
            location: "Racing Area Alpha"
          },
          { 
            time: "19:00", 
            activity: "Opening Dinner - Local Hong Kong Cuisine",
            type: "social" as const,
            location: "Club Dining Room"
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
            location: "Main Hall"
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
            location: "Club Dining Room"
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