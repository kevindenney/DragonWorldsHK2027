/**
 * Mock Championship Data for Dragon World Championships
 * Realistic sailing regatta data with proper scoring and participants
 */

export interface Championship {
  id: string;
  name: string;
  shortName: string;
  startDate: string;
  endDate: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  totalRaces: number;
  completedRaces: number;
  totalBoats: number;
  lastUpdated: string;
  competitors: ChampionshipCompetitor[];
}

export interface ChampionshipCompetitor {
  position: number;
  sailNumber: string;
  helmName: string;
  crewName?: string;
  countryCode: string;
  countryFlag: string;
  yachtClub: string;
  racingClass: string;
  totalPoints: number;
  raceResults: number[];
  discards?: number[];
}

export const MOCK_CHAMPIONSHIPS: Championship[] = [
  {
    id: 'asia-pacific-2026',
    name: 'Asia Pacific Championship',
    shortName: 'Asia Pacific Championship',
    startDate: 'Nov 17-21, 2026',
    endDate: 'Nov 21, 2026',
    location: 'Hong Kong',
    status: 'completed',
    totalRaces: 7,
    completedRaces: 7,
    totalBoats: 45,
    lastUpdated: '9:41:37 PM',
    competitors: [
      {
        position: 1,
        sailNumber: 'JPN 12',
        helmName: 'Takeshi Yamamoto',
        crewName: 'Hiroshi Tanaka',
        countryCode: 'JP',
        countryFlag: '🇯🇵',
        yachtClub: 'Kanagawa YC "Shonan"',
        racingClass: 'IRC Racer 1',
        totalPoints: 18,
        raceResults: [2, 1, 3, 4, 1, 2, 5],
        discards: [5]
      },
      {
        position: 2,
        sailNumber: 'AUS 88',
        helmName: 'Sarah Mitchell',
        crewName: 'James Connor',
        countryCode: 'AU',
        countryFlag: '🇦🇺',
        yachtClub: 'Royal Sydney YS "Storm"',
        racingClass: 'IRC Racer 2',
        totalPoints: 22,
        raceResults: [1, 3, 2, 6, 3, 1, 6],
        discards: [6]
      },
      {
        position: 3,
        sailNumber: 'HKG 168',
        helmName: 'David Wong',
        crewName: 'Lisa Chen',
        countryCode: 'HK',
        countryFlag: '🇭🇰',
        yachtClub: 'Aberdeen BC "Phoenix"',
        racingClass: 'One Design',
        totalPoints: 26,
        raceResults: [3, 2, 1, 7, 4, 3, 6],
        discards: [7]
      },
      {
        position: 4,
        sailNumber: 'SGP 777',
        helmName: 'Marcus Lim',
        crewName: 'Rachel Ng',
        countryCode: 'SG',
        countryFlag: '🇸🇬',
        yachtClub: 'Changi SC "Marina"',
        racingClass: 'IRC Racer 3',
        totalPoints: 31,
        raceResults: [4, 5, 4, 3, 2, 8, 5],
        discards: [8]
      },
      {
        position: 5,
        sailNumber: 'KOR 55',
        helmName: 'Kim Min-jun',
        crewName: 'Park So-young',
        countryCode: 'KR',
        countryFlag: '🇰🇷',
        yachtClub: 'Busan YC "Dragon"',
        racingClass: 'IRC Racer 1',
        totalPoints: 35,
        raceResults: [6, 4, 5, 2, 7, 4, 7],
        discards: [7]
      }
    ]
  },
  {
    id: 'dragon-world-2026',
    name: 'Dragon World Championship',
    shortName: 'Dragon World Championship',
    startDate: 'Nov 22-29, 2026',
    endDate: 'Nov 29, 2026',
    location: 'Hong Kong',
    status: 'ongoing',
    totalRaces: 12,
    completedRaces: 7,
    totalBoats: 62,
    lastUpdated: '9:41:37 PM',
    competitors: [
      {
        position: 1,
        sailNumber: 'GBR 001',
        helmName: 'Stuart Childerley',
        crewName: 'British Dragons',
        countryCode: 'GB',
        countryFlag: '🇬🇧',
        yachtClub: 'Royal Hong Kong YC "Andiamo"',
        racingClass: 'IRC Racer 3',
        totalPoints: 15,
        raceResults: [1, 2, 1, 3, 2, 1, 5],
        discards: [5]
      },
      {
        position: 2,
        sailNumber: 'HKG 888',
        helmName: 'Lowell Chang',
        crewName: 'Rachel Green',
        countryCode: 'HK',
        countryFlag: '🇭🇰',
        yachtClub: 'Royal Hong Kong YC "Andiamo"',
        racingClass: 'IRC CAPE 31',
        totalPoints: 22,
        raceResults: [2, 1, 3, 2, 4, 3, 7],
        discards: [7]
      },
      {
        position: 3,
        sailNumber: 'NED 777',
        helmName: 'Joop Doomernik',
        crewName: 'Netherlands Team',
        countryCode: 'NL',
        countryFlag: '🇳🇱',
        yachtClub: 'Royal Hong Kong YC "Andiamo"',
        racingClass: 'Hong Kong Kettle',
        totalPoints: 28,
        raceResults: [3, 3, 2, 1, 6, 5, 8],
        discards: [8]
      },
      {
        position: 4,
        sailNumber: 'AUS 123',
        helmName: 'James Mitchell',
        crewName: 'Diana Chan',
        countryCode: 'AU',
        countryFlag: '🇦🇺',
        yachtClub: 'Royal Hong Kong YC "Andiamo"',
        racingClass: 'IRC Racer 0',
        totalPoints: 32,
        raceResults: [4, 4, 4, 5, 1, 6, 8],
        discards: [8]
      },
      {
        position: 5,
        sailNumber: 'USA 246',
        helmName: 'Michael Rodriguez',
        crewName: 'Emily Watson',
        countryCode: 'US',
        countryFlag: '🇺🇸',
        yachtClub: 'St. Francis YC "Liberty"',
        racingClass: 'IRC Racer 2',
        totalPoints: 38,
        raceResults: [5, 6, 5, 4, 3, 8, 7],
        discards: [8]
      },
      {
        position: 6,
        sailNumber: 'DEN 432',
        helmName: 'Lars Nielsen',
        crewName: 'Anna Christiansen',
        countryCode: 'DK',
        countryFlag: '🇩🇰',
        yachtClub: 'Royal Danish YC "Viking"',
        racingClass: 'IRC Racer 1',
        totalPoints: 41,
        raceResults: [7, 5, 6, 6, 5, 4, 8],
        discards: [8]
      },
      {
        position: 7,
        sailNumber: 'NZL 99',
        helmName: 'Emma Thompson',
        crewName: 'Tom Bradley',
        countryCode: 'NZ',
        countryFlag: '🇳🇿',
        yachtClub: 'Royal NZ YS "Black Pearl"',
        racingClass: 'One Design',
        totalPoints: 44,
        raceResults: [6, 7, 7, 7, 7, 2, 8],
        discards: [8]
      },
      {
        position: 8,
        sailNumber: 'FRA 156',
        helmName: 'Pierre Dubois',
        crewName: 'Marie Laurent',
        countryCode: 'FR',
        countryFlag: '🇫🇷',
        yachtClub: 'Yacht Club de France "Mistral"',
        racingClass: 'IRC Racer 4',
        totalPoints: 47,
        raceResults: [8, 8, 8, 8, 8, 7, 2],
        discards: [8]
      }
    ]
  }
];

// Racing class color mappings for badges
export const RACING_CLASS_COLORS: Record<string, string> = {
  'IRC Racer 0': '#FF6B35',
  'IRC Racer 1': '#007AFF',
  'IRC Racer 2': '#34C759',
  'IRC Racer 3': '#FF9500',
  'IRC Racer 4': '#5856D6',
  'IRC CAPE 31': '#00C896',
  'Hong Kong Kettle': '#FFD700',
  'One Design': '#8E8E93'
};

// Country flag emoji mappings
export const COUNTRY_FLAGS: Record<string, string> = {
  'GB': '🇬🇧',
  'HK': '🇭🇰',
  'NL': '🇳🇱',
  'AU': '🇦🇺',
  'US': '🇺🇸',
  'DK': '🇩🇰',
  'NZ': '🇳🇿',
  'FR': '🇫🇷',
  'JP': '🇯🇵',
  'SG': '🇸🇬',
  'KR': '🇰🇷'
};