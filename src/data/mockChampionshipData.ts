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
    shortName: '2026 Asia Pacific Championship',
    startDate: 'Nov 17-21, 2026',
    endDate: 'Nov 21, 2026',
    location: 'Hong Kong',
    status: 'upcoming',
    totalRaces: 7,
    completedRaces: 0,
    totalBoats: 0,
    lastUpdated: '',
    competitors: []
  },
  {
    id: 'dragon-world-2026',
    name: 'Dragon World Championship',
    shortName: '2027 Dragon World Championship',
    startDate: 'Nov 22-29, 2027',
    endDate: 'Nov 29, 2027',
    location: 'Hong Kong',
    status: 'upcoming',
    totalRaces: 12,
    completedRaces: 0,
    totalBoats: 0,
    lastUpdated: '',
    competitors: []
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