import { FirestoreService } from '../services/firebaseService';
import { AnalyticsService } from '../services/analyticsService';

export interface RaceData {
  id?: string;
  name: string;
  date: Date;
  location: string;
  status: 'upcoming' | 'active' | 'completed';
  participants: string[];
  sailingConditions?: {
    windSpeed: number;
    windDirection: number;
    weather: string;
  };
  results?: {
    position: number;
    participantId: string;
    finishTime: Date;
  }[];
}

export interface ParticipantData {
  id?: string;
  name: string;
  email: string;
  country: string;
  sailNumber?: string;
  boatClass: string;
  registrationDate: Date;
  races: string[];
}

export interface WeatherData {
  id?: string;
  timestamp: Date;
  location: string;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  pressure: number;
  humidity: number;
  conditions: string;
}

export class DragonWorldsComponent {
  private static readonly COLLECTION_RACES = 'races';
  private static readonly COLLECTION_PARTICIPANTS = 'participants';
  private static readonly COLLECTION_WEATHER = 'weather';

  static async createRace(raceData: Omit<RaceData, 'id'>): Promise<string> {
    try {
      const docRef = await FirestoreService.create(this.COLLECTION_RACES, raceData);
      
      AnalyticsService.logDragonWorldsEvent('race_created', {
        race_name: raceData.name,
        race_date: raceData.date.toISOString(),
        location: raceData.location
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating race:', error);
      throw error;
    }
  }

  static async getRace(raceId: string): Promise<RaceData | null> {
    try {
      return await FirestoreService.read<RaceData>(this.COLLECTION_RACES, raceId);
    } catch (error) {
      console.error('Error fetching race:', error);
      throw error;
    }
  }

  static async getAllRaces(): Promise<RaceData[]> {
    try {
      return await FirestoreService.getCollection<RaceData>(this.COLLECTION_RACES);
    } catch (error) {
      console.error('Error fetching all races:', error);
      throw error;
    }
  }

  static async getUpcomingRaces(): Promise<RaceData[]> {
    try {
      return await FirestoreService.query<RaceData>(
        this.COLLECTION_RACES,
        [{ field: 'status', operator: '==', value: 'upcoming' }],
        'date',
        'asc'
      );
    } catch (error) {
      console.error('Error fetching upcoming races:', error);
      throw error;
    }
  }

  static async updateRaceStatus(raceId: string, status: RaceData['status']): Promise<void> {
    try {
      await FirestoreService.update<RaceData>(this.COLLECTION_RACES, raceId, { status });
      
      AnalyticsService.logDragonWorldsEvent('race_status_updated', {
        race_id: raceId,
        new_status: status
      });
    } catch (error) {
      console.error('Error updating race status:', error);
      throw error;
    }
  }

  static async registerParticipant(participantData: Omit<ParticipantData, 'id'>): Promise<string> {
    try {
      const docRef = await FirestoreService.create(this.COLLECTION_PARTICIPANTS, participantData);
      
      AnalyticsService.logDragonWorldsEvent('participant_registered', {
        participant_name: participantData.name,
        country: participantData.country,
        boat_class: participantData.boatClass
      });

      return docRef.id;
    } catch (error) {
      console.error('Error registering participant:', error);
      throw error;
    }
  }

  static async getParticipant(participantId: string): Promise<ParticipantData | null> {
    try {
      return await FirestoreService.read<ParticipantData>(this.COLLECTION_PARTICIPANTS, participantId);
    } catch (error) {
      console.error('Error fetching participant:', error);
      throw error;
    }
  }

  static async getParticipantsByCountry(country: string): Promise<ParticipantData[]> {
    try {
      return await FirestoreService.query<ParticipantData>(
        this.COLLECTION_PARTICIPANTS,
        [{ field: 'country', operator: '==', value: country }]
      );
    } catch (error) {
      console.error('Error fetching participants by country:', error);
      throw error;
    }
  }

  static async addParticipantToRace(participantId: string, raceId: string): Promise<void> {
    try {
      const participant = await this.getParticipant(participantId);
      const race = await this.getRace(raceId);

      if (!participant || !race) {
        throw new Error('Participant or race not found');
      }

      const updatedRaces = [...participant.races, raceId];
      const updatedParticipants = [...race.participants, participantId];

      await Promise.all([
        FirestoreService.update<ParticipantData>(this.COLLECTION_PARTICIPANTS, participantId, { races: updatedRaces }),
        FirestoreService.update<RaceData>(this.COLLECTION_RACES, raceId, { participants: updatedParticipants })
      ]);

      AnalyticsService.logDragonWorldsEvent('participant_added_to_race', {
        participant_id: participantId,
        race_id: raceId,
        race_name: race.name
      });
    } catch (error) {
      console.error('Error adding participant to race:', error);
      throw error;
    }
  }

  static async recordWeatherData(weatherData: Omit<WeatherData, 'id'>): Promise<string> {
    try {
      const docRef = await FirestoreService.create(this.COLLECTION_WEATHER, weatherData);
      
      AnalyticsService.logDragonWorldsEvent('weather_data_recorded', {
        location: weatherData.location,
        wind_speed: weatherData.windSpeed,
        conditions: weatherData.conditions
      });

      return docRef.id;
    } catch (error) {
      console.error('Error recording weather data:', error);
      throw error;
    }
  }

  static async getLatestWeather(location: string): Promise<WeatherData | null> {
    try {
      const weatherData = await FirestoreService.query<WeatherData>(
        this.COLLECTION_WEATHER,
        [{ field: 'location', operator: '==', value: location }],
        'timestamp',
        'desc',
        1
      );

      return weatherData.length > 0 ? weatherData[0] : null;
    } catch (error) {
      console.error('Error fetching latest weather:', error);
      throw error;
    }
  }

  static async getRaceResults(raceId: string): Promise<RaceData['results'] | null> {
    try {
      const race = await this.getRace(raceId);
      return race?.results || null;
    } catch (error) {
      console.error('Error fetching race results:', error);
      throw error;
    }
  }

  static async updateRaceResults(raceId: string, results: RaceData['results']): Promise<void> {
    try {
      await FirestoreService.update<RaceData>(this.COLLECTION_RACES, raceId, { results });
      
      AnalyticsService.logDragonWorldsEvent('race_results_updated', {
        race_id: raceId,
        participants_count: results?.length || 0
      });
    } catch (error) {
      console.error('Error updating race results:', error);
      throw error;
    }
  }
}