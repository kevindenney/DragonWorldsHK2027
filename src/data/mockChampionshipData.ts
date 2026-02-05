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

// Mock competitors for Asia Pacific Championship (7 races, 1 discard)
// Fleet size: 12 boats, so DNF/DNS = 13 points
const APAC_COMPETITORS: ChampionshipCompetitor[] = [
  {
    position: 1,
    sailNumber: 'HKG 59',
    helmName: 'Sarah Chen',
    crewName: 'Michael Wong',
    countryCode: 'HK',
    countryFlag: '🇭🇰',
    yachtClub: 'Royal Hong Kong Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 13, // 1+3+2+2+1+4 = 13 (discarding 5)
    raceResults: [1, 3, 2, 5, 2, 1, 4],
    discards: [5],
  },
  {
    position: 2,
    sailNumber: 'AUS 123',
    helmName: 'James Wilson',
    crewName: 'Emily Foster',
    countryCode: 'AU',
    countryFlag: '🇦🇺',
    yachtClub: 'Royal Sydney Yacht Squadron',
    racingClass: 'Dragon',
    totalPoints: 15, // 2+1+4+3+3+2 = 15 (discarding 6)
    raceResults: [2, 1, 4, 3, 3, 2, 6],
    discards: [6],
  },
  {
    position: 3,
    sailNumber: 'GBR 456',
    helmName: 'Emma Thompson',
    crewName: 'Oliver Clarke',
    countryCode: 'GB',
    countryFlag: '🇬🇧',
    yachtClub: 'Royal Thames Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 21, // 4+2+1+6+5+3 = 21 (discarding 8)
    raceResults: [4, 2, 1, 6, 5, 3, 8],
    discards: [8],
  },
  {
    position: 4,
    sailNumber: 'NZL 321',
    helmName: 'Kate Anderson',
    crewName: 'Tom Richardson',
    countryCode: 'NZ',
    countryFlag: '🇳🇿',
    yachtClub: 'Royal New Zealand Yacht Squadron',
    racingClass: 'Dragon',
    totalPoints: 25, // 3+5+6+2+4+5 = 25 (discarding 7)
    raceResults: [3, 5, 6, 2, 4, 5, 7],
    discards: [7],
  },
  {
    position: 5,
    sailNumber: 'DEN 88',
    helmName: 'Lars Petersen',
    crewName: 'Mette Hansen',
    countryCode: 'DK',
    countryFlag: '🇩🇰',
    yachtClub: 'Kongelig Dansk Yachtklub',
    racingClass: 'Dragon',
    totalPoints: 28, // 5+4+3+6+4+6 = 28 (discarding 8)
    raceResults: [5, 4, 3, 8, 6, 4, 6],
    discards: [8],
  },
  {
    position: 6,
    sailNumber: 'SIN 77',
    helmName: 'David Tan',
    crewName: 'Rachel Lim',
    countryCode: 'SG',
    countryFlag: '🇸🇬',
    yachtClub: 'Republic of Singapore Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 34, // 6+6+5+4+7+6 = 34 (discarding 9)
    raceResults: [6, 6, 5, 4, 7, 6, 9],
    discards: [9],
  },
  {
    position: 7,
    sailNumber: 'USA 789',
    helmName: 'Michael Johnson',
    crewName: 'Sarah Davis',
    countryCode: 'US',
    countryFlag: '🇺🇸',
    yachtClub: 'San Diego Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 34, // 7+7+7+1+7+5 = 34 (discarding 8) - TIE with SIN 77!
    raceResults: [7, 7, 8, 7, 1, 7, 5],
    discards: [8],
  },
  {
    position: 8,
    sailNumber: 'FRA 147',
    helmName: 'Pierre Dubois',
    crewName: 'Marie Laurent',
    countryCode: 'FR',
    countryFlag: '🇫🇷',
    yachtClub: 'Yacht Club de France',
    racingClass: 'Dragon',
    totalPoints: 41, // 8+8+7+8+8+2 = 41 (discarding 9)
    raceResults: [8, 8, 7, 9, 8, 8, 2],
    discards: [9],
  },
  {
    position: 9,
    sailNumber: 'JPN 55',
    helmName: 'Yuki Tanaka',
    crewName: 'Kenji Yamamoto',
    countryCode: 'JP',
    countryFlag: '🇯🇵',
    yachtClub: 'Hayama Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 40, // 9+9+1+9+9+3 = 40 (discarding 9) - had a great race 3!
    raceResults: [9, 9, 9, 1, 9, 9, 3],
    discards: [9],
  },
  {
    position: 10,
    sailNumber: 'NED 101',
    helmName: 'Jan van der Berg',
    crewName: 'Anna de Vries',
    countryCode: 'NL',
    countryFlag: '🇳🇱',
    yachtClub: 'Koninklijke Watersportvereniging',
    racingClass: 'Dragon',
    totalPoints: 44, // 10+10+10+10+3+1 = 44 (discarding 13=DNF) - had gear failure race 5
    raceResults: [10, 10, 10, 10, 13, 10, 1], // 13 = DNF in race 5
    discards: [13],
  },
  {
    position: 11,
    sailNumber: 'HKG 42',
    helmName: 'Thomas Lee',
    crewName: 'Jessica Chan',
    countryCode: 'HK',
    countryFlag: '🇭🇰',
    yachtClub: 'Aberdeen Boat Club',
    racingClass: 'Dragon',
    totalPoints: 55, // 11+11+11+11+11+10 = 65 (discarding 13=DNS) - missed start race 2
    raceResults: [11, 13, 11, 11, 11, 11, 10], // 13 = DNS in race 2
    discards: [13],
  },
  {
    position: 12,
    sailNumber: 'KOR 33',
    helmName: 'Kim Sung-ho',
    crewName: 'Park Ji-young',
    countryCode: 'KR',
    countryFlag: '🇰🇷',
    yachtClub: 'Busan Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 59, // 12+12+12+12+12+11 = 71 (discarding 13=OCS) - OCS in race 4
    raceResults: [12, 12, 12, 13, 12, 12, 11], // 13 = OCS in race 4
    discards: [13],
  },
];

// Mock competitors for Dragon World Championship (12 races, 2 discards)
// Fleet size: 15 boats, so DNF/DNS = 16 points
const WORLDS_COMPETITORS: ChampionshipCompetitor[] = [
  {
    position: 1,
    sailNumber: 'GBR 789',
    helmName: 'William Scott',
    crewName: 'Charlotte Brown',
    countryCode: 'GB',
    countryFlag: '🇬🇧',
    yachtClub: 'Royal Yacht Squadron',
    racingClass: 'Dragon',
    totalPoints: 20, // 1+2+3+1+2+1+3+2+1+4 = 20 (discarding 5,4)
    raceResults: [1, 2, 3, 1, 4, 2, 1, 3, 2, 5, 1, 4],
    discards: [5, 4],
  },
  {
    position: 2,
    sailNumber: 'HKG 59',
    helmName: 'Sarah Chen',
    crewName: 'Michael Wong',
    countryCode: 'HK',
    countryFlag: '🇭🇰',
    yachtClub: 'Royal Hong Kong Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 22, // 2+1+1+3+2+3+1+4+3+2 = 22 (discarding 5,4)
    raceResults: [2, 1, 1, 3, 2, 4, 3, 1, 4, 3, 5, 2],
    discards: [5, 4],
  },
  {
    position: 3,
    sailNumber: 'DEN 88',
    helmName: 'Lars Petersen',
    crewName: 'Mette Hansen',
    countryCode: 'DK',
    countryFlag: '🇩🇰',
    yachtClub: 'Kongelig Dansk Yachtklub',
    racingClass: 'Dragon',
    totalPoints: 29, // 3+3+2+4+1+3+2+3+4+4 = 29 (discarding 6,5)
    raceResults: [3, 3, 2, 4, 1, 3, 5, 2, 3, 4, 4, 6],
    discards: [6, 5],
  },
  {
    position: 4,
    sailNumber: 'AUS 123',
    helmName: 'James Wilson',
    crewName: 'Emily Foster',
    countryCode: 'AU',
    countryFlag: '🇦🇺',
    yachtClub: 'Royal Sydney Yacht Squadron',
    racingClass: 'Dragon',
    totalPoints: 34, // 4+4+5+2+5+1+4+5+1+3 = 34 (discarding 8,6)
    raceResults: [4, 4, 5, 2, 5, 1, 4, 5, 1, 6, 3, 8],
    discards: [8, 6],
  },
  {
    position: 5,
    sailNumber: 'NZL 321',
    helmName: 'Kate Anderson',
    crewName: 'Tom Richardson',
    countryCode: 'NZ',
    countryFlag: '🇳🇿',
    yachtClub: 'Royal New Zealand Yacht Squadron',
    racingClass: 'Dragon',
    totalPoints: 42, // 5+5+4+5+3+5+4+6+2+3 = 42 (discarding 6,6)
    raceResults: [5, 5, 4, 5, 3, 5, 6, 4, 6, 2, 6, 3],
    discards: [6, 6],
  },
  {
    position: 6,
    sailNumber: 'FRA 147',
    helmName: 'Pierre Dubois',
    crewName: 'Marie Laurent',
    countryCode: 'FR',
    countryFlag: '🇫🇷',
    yachtClub: 'Yacht Club de France',
    racingClass: 'Dragon',
    totalPoints: 51, // 6+6+6+6+6+6+2+6+5+2 = 51 (discarding 7,7)
    raceResults: [6, 6, 6, 6, 6, 6, 2, 6, 5, 7, 2, 7],
    discards: [7, 7],
  },
  {
    position: 7,
    sailNumber: 'USA 789',
    helmName: 'Michael Johnson',
    crewName: 'Sarah Davis',
    countryCode: 'US',
    countryFlag: '🇺🇸',
    yachtClub: 'San Diego Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 58, // 7+7+7+7+7+7+7+7+1+1 = 58 (discarding 7,7) - two wins!
    raceResults: [7, 7, 7, 7, 7, 7, 7, 7, 7, 1, 7, 1],
    discards: [7, 7],
  },
  {
    position: 8,
    sailNumber: 'GBR 456',
    helmName: 'Emma Thompson',
    crewName: 'Oliver Clarke',
    countryCode: 'GB',
    countryFlag: '🇬🇧',
    yachtClub: 'Royal Thames Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 77, // 8*10+5 = 85 (discarding 8,8) - consistent mid-fleet
    raceResults: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 5],
    discards: [8, 8],
  },
  {
    position: 9,
    sailNumber: 'SIN 77',
    helmName: 'David Tan',
    crewName: 'Rachel Lim',
    countryCode: 'SG',
    countryFlag: '🇸🇬',
    yachtClub: 'Republic of Singapore Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 81, // 9+9+9+16+9+9+9+9+9+9 = 81 (discarding 16=DNF, 9) - DNF race 4
    raceResults: [9, 9, 9, 16, 9, 9, 9, 9, 9, 9, 9, 9], // 16 = DNF in race 4
    discards: [16, 9],
  },
  {
    position: 10,
    sailNumber: 'NED 101',
    helmName: 'Jan van der Berg',
    crewName: 'Anna de Vries',
    countryCode: 'NL',
    countryFlag: '🇳🇱',
    yachtClub: 'Koninklijke Watersportvereniging',
    racingClass: 'Dragon',
    totalPoints: 88, // 10*10-2 = 98 (discarding 10,10) - had a great comeback race 11
    raceResults: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 2, 10],
    discards: [10, 10],
  },
  {
    position: 11,
    sailNumber: 'JPN 55',
    helmName: 'Yuki Tanaka',
    crewName: 'Kenji Yamamoto',
    countryCode: 'JP',
    countryFlag: '🇯🇵',
    yachtClub: 'Hayama Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 98, // 11*10-2 = 108 (discarding 11,11) - struggled all series
    raceResults: [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    discards: [11, 11],
  },
  {
    position: 12,
    sailNumber: 'HKG 42',
    helmName: 'Thomas Lee',
    crewName: 'Jessica Chan',
    countryCode: 'HK',
    countryFlag: '🇭🇰',
    yachtClub: 'Aberdeen Boat Club',
    racingClass: 'Dragon',
    totalPoints: 104, // discarding two 16s (DNS/DNF)
    raceResults: [12, 16, 12, 12, 12, 12, 12, 16, 12, 12, 12, 12], // Two DNS/DNF
    discards: [16, 16],
  },
  {
    position: 13,
    sailNumber: 'KOR 33',
    helmName: 'Kim Sung-ho',
    crewName: 'Park Ji-young',
    countryCode: 'KR',
    countryFlag: '🇰🇷',
    yachtClub: 'Busan Yacht Club',
    racingClass: 'Dragon',
    totalPoints: 113, // discarding one 16 and one 13
    raceResults: [13, 13, 13, 16, 13, 13, 13, 13, 13, 13, 13, 13], // OCS race 4
    discards: [16, 13],
  },
  {
    position: 14,
    sailNumber: 'ITA 222',
    helmName: 'Marco Rossi',
    crewName: 'Giulia Bianchi',
    countryCode: 'IT',
    countryFlag: '🇮🇹',
    yachtClub: 'Yacht Club Italiano',
    racingClass: 'Dragon',
    totalPoints: 126, // discarding 16,16 (two DNFs)
    raceResults: [14, 14, 16, 14, 14, 16, 14, 14, 14, 14, 14, 14], // Two DNFs
    discards: [16, 16],
  },
  {
    position: 15,
    sailNumber: 'ESP 111',
    helmName: 'Carlos Garcia',
    crewName: 'Isabel Martinez',
    countryCode: 'ES',
    countryFlag: '🇪🇸',
    yachtClub: 'Real Club Nautico de Barcelona',
    racingClass: 'Dragon',
    totalPoints: 138, // discarding 16,16 (DNS race 1, RET race 6)
    raceResults: [16, 15, 15, 15, 15, 16, 15, 15, 15, 15, 15, 15], // DNS and RET
    discards: [16, 16],
  },
];

export const MOCK_CHAMPIONSHIPS: Championship[] = [
  {
    id: 'asia-pacific-2026',
    name: 'Asia Pacific Championship',
    shortName: '2026 Asia Pacific Championship',
    startDate: 'Nov 17-21, 2026',
    endDate: 'Nov 21, 2026',
    location: 'Hong Kong',
    status: 'ongoing',
    totalRaces: 7,
    completedRaces: 7,
    totalBoats: 12,
    lastUpdated: new Date().toISOString(),
    competitors: APAC_COMPETITORS,
  },
  {
    id: 'dragon-world-2026',
    name: 'Dragon World Championship',
    shortName: '2027 Dragon World Championship',
    startDate: 'Nov 22-29, 2027',
    endDate: 'Nov 29, 2027',
    location: 'Hong Kong',
    status: 'ongoing',
    totalRaces: 12,
    completedRaces: 12,
    totalBoats: 15,
    lastUpdated: new Date().toISOString(),
    competitors: WORLDS_COMPETITORS,
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
  'KR': '🇰🇷',
  'IT': '🇮🇹',
  'ES': '🇪🇸',
  'DE': '🇩🇪',
  'SE': '🇸🇪',
  'NO': '🇳🇴',
};