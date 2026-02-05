import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notificationService';
import { subscriptionService } from './subscriptionService';
import { errorHandler } from './errorHandler';
import { weatherManager } from './weatherManager';

// Retention and engagement interfaces
export interface PersonalRacingCalendar {
  id: string;
  userId: string;
  events: CalendarEvent[];
  weatherAlerts: WeatherAlertPreference[];
  reminderSettings: {
    raceReminders: boolean;
    weatherUpdates: boolean;
    trainingReminders: boolean;
    socialUpdates: boolean;
  };
  timezone: string;
}

export interface CalendarEvent {
  id: string;
  type: 'race' | 'regatta' | 'training' | 'social' | 'maintenance';
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: {
    name: string;
    coordinates?: { lat: number; lon: number };
  };
  weatherMonitoring: boolean;
  participants?: string[];
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  results?: {
    position?: number;
    notes?: string;
    conditions?: string;
  };
}

export interface WeatherAlertPreference {
  eventId: string;
  enabled: boolean;
  thresholds: {
    windSpeed?: number;
    gustSpeed?: number;
    waveHeight?: number;
    visibility?: number;
  };
  notifyBefore: number; // hours before event
}

export interface SailingConnection {
  id: string;
  userId: string;
  connectedUserId: string;
  relationship: 'crew_member' | 'skipper' | 'sailing_buddy' | 'competitor' | 'coach';
  status: 'pending' | 'accepted' | 'blocked';
  connectedAt: string;
  sharedEvents: string[];
  communicationPreferences: {
    shareCalendar: boolean;
    shareResults: boolean;
    shareWeatherAlerts: boolean;
  };
}

export interface PerformanceMetric {
  eventId: string;
  userId: string;
  date: string;
  metrics: {
    position?: number;
    totalCompetitors?: number;
    windConditions?: {
      averageSpeed: number;
      averageDirection: number;
      gustiness: number;
    };
    tacticalDecisions?: {
      startLine: 'port' | 'starboard' | 'middle';
      firstLeg: 'left' | 'right' | 'middle';
      markRoundings: number;
    };
    selfAssessment?: {
      boatHandling: number; // 1-10
      tactics: number;
      startLine: number;
      conditions: number;
    };
  };
  notes?: string;
}

export interface Achievement {
  id: string;
  type: 'race_result' | 'consistency' | 'improvement' | 'participation' | 'social' | 'weather_usage';
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  points: number;
  criteria: Record<string, any>;
}

export interface ChampionshipMemory {
  id: string;
  eventId: string;
  userId: string;
  type: 'photo' | 'note' | 'result' | 'weather_moment' | 'social_moment';
  title: string;
  content: {
    text?: string;
    imageUri?: string;
    weatherData?: any;
    location?: { lat: number; lon: number };
  };
  createdAt: string;
  tags: string[];
  visibility: 'private' | 'friends' | 'public';
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  type: 'race_result' | 'achievement' | 'weather_alert' | 'social_activity' | 'milestone';
  timestamp: string;
  content: {
    title: string;
    description: string;
    data?: any;
  };
  interactions: {
    likes: string[]; // user IDs
    comments: {
      userId: string;
      text: string;
      timestamp: string;
    }[];
  };
  visibility: 'private' | 'friends' | 'public';
}

// Retention manager service class
export class RetentionManager {
  private racingCalendars: Map<string, PersonalRacingCalendar> = new Map();
  private connections: Map<string, SailingConnection[]> = new Map();
  private performanceMetrics: Map<string, PerformanceMetric[]> = new Map();
  private achievements: Map<string, Achievement[]> = new Map();
  private memories: Map<string, ChampionshipMemory[]> = new Map();
  private activityFeed: Map<string, ActivityFeedItem[]> = new Map();
  
  constructor() {
    this.loadRetentionData();
    this.setupDefaultAchievements();
  }

  // Initialize retention manager
  async initialize(): Promise<void> {
    try {
      await this.loadRetentionData();
      await this.scheduleEngagementTasks();
    } catch (error) {
    }
  }

  // Personal Racing Calendar Management
  async createRacingCalendar(userId: string): Promise<PersonalRacingCalendar> {
    const calendar: PersonalRacingCalendar = {
      id: this.generateId(),
      userId,
      events: [],
      weatherAlerts: [],
      reminderSettings: {
        raceReminders: true,
        weatherUpdates: true,
        trainingReminders: false,
        socialUpdates: true
      },
      timezone: 'Asia/Hong_Kong'
    };

    this.racingCalendars.set(userId, calendar);
    await this.saveRetentionData();
    return calendar;
  }

  async addCalendarEvent(userId: string, event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    let calendar = this.racingCalendars.get(userId);
    if (!calendar) {
      calendar = await this.createRacingCalendar(userId);
    }

    const calendarEvent: CalendarEvent = {
      id: this.generateId(),
      ...event
    };

    calendar.events.push(calendarEvent);

    // Set up weather monitoring if enabled
    if (calendarEvent.weatherMonitoring) {
      await this.setupWeatherAlertsForEvent(userId, calendarEvent);
    }

    // Schedule reminders
    await this.scheduleEventReminders(userId, calendarEvent);

    await this.saveRetentionData();
    return calendarEvent;
  }

  async updateEventResults(userId: string, eventId: string, results: CalendarEvent['results']): Promise<void> {
    const calendar = this.racingCalendars.get(userId);
    if (!calendar) return;

    const event = calendar.events.find(e => e.id === eventId);
    if (!event) return;

    event.results = results;
    event.status = 'completed';

    // Create performance metric
    await this.recordPerformanceMetric(userId, eventId, results);

    // Check for achievements
    await this.checkAndAwardAchievements(userId);

    // Add to activity feed
    await this.addActivityFeedItem(userId, {
      type: 'race_result',
      content: {
        title: `Finished ${event.title}`,
        description: results.position 
          ? `Placed ${results.position}${this.getOrdinalSuffix(results.position)}`
          : 'Race completed',
        data: { eventId, results }
      },
      visibility: 'friends'
    });

    await this.saveRetentionData();
  }

  private async setupWeatherAlertsForEvent(userId: string, event: CalendarEvent): Promise<void> {
    const weatherAlert: WeatherAlertPreference = {
      eventId: event.id,
      enabled: true,
      thresholds: {
        windSpeed: 25, // knots
        gustSpeed: 35,
        waveHeight: 2.5, // meters
        visibility: 2 // km
      },
      notifyBefore: 24 // 24 hours before
    };

    const calendar = this.racingCalendars.get(userId);
    if (calendar) {
      calendar.weatherAlerts.push(weatherAlert);
    }

    // Schedule weather monitoring
    const alertTime = new Date(event.startDate);
    alertTime.setHours(alertTime.getHours() - weatherAlert.notifyBefore);

    if (alertTime > new Date()) {
      setTimeout(async () => {
        await this.checkWeatherConditionsForEvent(userId, event, weatherAlert);
      }, alertTime.getTime() - Date.now());
    }
  }

  private async checkWeatherConditionsForEvent(
    userId: string,
    event: CalendarEvent,
    alertPrefs: WeatherAlertPreference
  ): Promise<void> {
    try {
      if (!event.location.coordinates) return;

      const weatherResult = await weatherManager.updateWeatherData(true);
      if (!weatherResult.success || !weatherResult.data) return;

      const currentConditions = weatherResult.data.current;
      let alertsToSend: string[] = [];

      // Check thresholds
      if (alertPrefs.thresholds.windSpeed && currentConditions.windSpeed > alertPrefs.thresholds.windSpeed) {
        alertsToSend.push(`High winds: ${currentConditions.windSpeed} knots`);
      }

      if (alertsToSend.length > 0) {
        await notificationService.sendWeatherAlert({
          id: this.generateId(),
          type: 'race_condition',
          severity: 'moderate',
          title: `Weather Alert: ${event.title}`,
          message: `Challenging conditions expected: ${alertsToSend.join(', ')}`,
          threshold: alertPrefs.thresholds.windSpeed || 0,
          currentValue: currentConditions.windSpeed,
          location: event.location.name,
          validFrom: new Date().toISOString(),
          validTo: event.endDate,
          requiresSubscription: false
        });
      }

    } catch (error) {
    }
  }

  // Sailing Network Connection Management
  async sendConnectionRequest(
    fromUserId: string, 
    toUserId: string, 
    relationship: SailingConnection['relationship']
  ): Promise<SailingConnection> {
    const connection: SailingConnection = {
      id: this.generateId(),
      userId: fromUserId,
      connectedUserId: toUserId,
      relationship,
      status: 'pending',
      connectedAt: new Date().toISOString(),
      sharedEvents: [],
      communicationPreferences: {
        shareCalendar: false,
        shareResults: true,
        shareWeatherAlerts: false
      }
    };

    let userConnections = this.connections.get(fromUserId) || [];
    userConnections.push(connection);
    this.connections.set(fromUserId, userConnections);

    // Send notification to target user
    await notificationService.sendRaceNotification({
      id: this.generateId(),
      type: 'race_start', // Reusing type for connection request
      raceId: 'connection',
      title: 'New Connection Request',
      message: `Someone wants to connect as your ${relationship.replace('_', ' ')}`,
      scheduledTime: new Date().toISOString(),
      requiresSubscription: false
    });

    await this.saveRetentionData();
    return connection;
  }

  async acceptConnectionRequest(connectionId: string): Promise<void> {
    // Find and update connection
    for (const [userId, connections] of this.connections.entries()) {
      const connection = connections.find(c => c.id === connectionId);
      if (connection) {
        connection.status = 'accepted';

        // Create reciprocal connection
        const reciprocalConnection: SailingConnection = {
          ...connection,
          id: this.generateId(),
          userId: connection.connectedUserId,
          connectedUserId: connection.userId
        };

        let reciprocalConnections = this.connections.get(connection.connectedUserId) || [];
        reciprocalConnections.push(reciprocalConnection);
        this.connections.set(connection.connectedUserId, reciprocalConnections);

        // Add to activity feed
        await this.addActivityFeedItem(userId, {
          type: 'social_activity',
          content: {
            title: 'New Sailing Connection',
            description: `Connected as ${connection.relationship.replace('_', ' ')}`,
            data: { connectionId }
          },
          visibility: 'friends'
        });

        break;
      }
    }

    await this.saveRetentionData();
  }

  // Performance Tracking
  async recordPerformanceMetric(
    userId: string, 
    eventId: string, 
    results: CalendarEvent['results']
  ): Promise<void> {
    const metric: PerformanceMetric = {
      eventId,
      userId,
      date: new Date().toISOString(),
      metrics: {
        position: results?.position,
        // Would integrate with actual race data
        totalCompetitors: 50, // Mock data
        windConditions: {
          averageSpeed: 15,
          averageDirection: 220,
          gustiness: 3
        }
      },
      notes: results?.notes
    };

    let userMetrics = this.performanceMetrics.get(userId) || [];
    userMetrics.unshift(metric);
    this.performanceMetrics.set(userId, userMetrics);

    await this.saveRetentionData();
  }

  async getPerformanceAnalysis(userId: string, months: number = 12): Promise<{
    averagePosition: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    bestResult: PerformanceMetric | null;
    consistencyScore: number;
    totalRaces: number;
  }> {
    const userMetrics = this.performanceMetrics.get(userId) || [];
    const cutoffDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);
    const recentMetrics = userMetrics.filter(m => new Date(m.date) >= cutoffDate);

    if (recentMetrics.length === 0) {
      return {
        averagePosition: 0,
        improvementTrend: 'stable',
        bestResult: null,
        consistencyScore: 0,
        totalRaces: 0
      };
    }

    const positions = recentMetrics
      .filter(m => m.metrics.position)
      .map(m => m.metrics.position!);

    const averagePosition = positions.length > 0 
      ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length
      : 0;

    const bestResult = recentMetrics.reduce((best, current) => {
      if (!best || !current.metrics.position) return current;
      if (!best.metrics.position || current.metrics.position < best.metrics.position) {
        return current;
      }
      return best;
    }, recentMetrics[0]);

    // Calculate improvement trend (simplified)
    let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (positions.length >= 3) {
      const firstHalf = positions.slice(0, Math.floor(positions.length / 2));
      const secondHalf = positions.slice(Math.floor(positions.length / 2));
      const firstAvg = firstHalf.reduce((sum, pos) => sum + pos, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, pos) => sum + pos, 0) / secondHalf.length;
      
      if (secondAvg < firstAvg - 1) improvementTrend = 'improving';
      else if (secondAvg > firstAvg + 1) improvementTrend = 'declining';
    }

    // Calculate consistency (lower standard deviation = higher consistency)
    const consistency = positions.length > 1 ? this.calculateConsistency(positions) : 0;

    return {
      averagePosition,
      improvementTrend,
      bestResult,
      consistencyScore: consistency,
      totalRaces: recentMetrics.length
    };
  }

  // Achievement System
  private setupDefaultAchievements(): void {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first_race',
        type: 'participation',
        title: 'First Race',
        description: 'Complete your first recorded race',
        icon: '🏁',
        earnedAt: '',
        rarity: 'common',
        points: 10,
        criteria: { races_completed: 1 }
      },
      {
        id: 'weather_watcher',
        type: 'weather_usage',
        title: 'Weather Watcher',
        description: 'Check weather conditions 50 times',
        icon: '🌊',
        earnedAt: '',
        rarity: 'uncommon',
        points: 25,
        criteria: { weather_checks: 50 }
      },
      {
        id: 'podium_finish',
        type: 'race_result',
        title: 'Podium Finish',
        description: 'Finish in the top 3',
        icon: '🏆',
        earnedAt: '',
        rarity: 'rare',
        points: 50,
        criteria: { best_position: 3 }
      },
      {
        id: 'social_sailor',
        type: 'social',
        title: 'Social Sailor',
        description: 'Connect with 10 other sailors',
        icon: '⛵',
        earnedAt: '',
        rarity: 'uncommon',
        points: 30,
        criteria: { connections: 10 }
      },
      {
        id: 'dragon_worlds_participant',
        type: 'participation',
        title: 'Dragon Worlds Participant',
        description: 'Participate in Dragon World Championships',
        icon: '🐉',
        earnedAt: '',
        rarity: 'legendary',
        points: 100,
        criteria: { dragon_worlds_participant: true }
      }
    ];

    // Initialize achievements for users
    // This would typically be done per user, simplified here
  }

  async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    const userAchievements = this.achievements.get(userId) || [];
    const newAchievements: Achievement[] = [];

    // Get user stats
    const performance = await this.getPerformanceAnalysis(userId);
    const connections = this.connections.get(userId) || [];
    const userMetrics = this.performanceMetrics.get(userId) || [];

    // Check each achievement type
    if (performance.totalRaces >= 1 && !userAchievements.find(a => a.id === 'first_race')) {
      const achievement = this.cloneAchievement('first_race');
      achievement.earnedAt = new Date().toISOString();
      newAchievements.push(achievement);
    }

    if (performance.bestResult?.metrics.position && performance.bestResult.metrics.position <= 3 && 
        !userAchievements.find(a => a.id === 'podium_finish')) {
      const achievement = this.cloneAchievement('podium_finish');
      achievement.earnedAt = new Date().toISOString();
      newAchievements.push(achievement);
    }

    if (connections.filter(c => c.status === 'accepted').length >= 10 && 
        !userAchievements.find(a => a.id === 'social_sailor')) {
      const achievement = this.cloneAchievement('social_sailor');
      achievement.earnedAt = new Date().toISOString();
      newAchievements.push(achievement);
    }

    // Award new achievements
    if (newAchievements.length > 0) {
      userAchievements.push(...newAchievements);
      this.achievements.set(userId, userAchievements);

      // Send notifications
      for (const achievement of newAchievements) {
        await notificationService.sendRaceNotification({
          id: this.generateId(),
          type: 'results_posted',
          raceId: 'achievement',
          title: `Achievement Unlocked! ${achievement.icon}`,
          message: `${achievement.title}: ${achievement.description}`,
          scheduledTime: new Date().toISOString(),
          requiresSubscription: false
        });

        // Add to activity feed
        await this.addActivityFeedItem(userId, {
          type: 'achievement',
          content: {
            title: `Achievement Unlocked: ${achievement.title}`,
            description: achievement.description,
            data: achievement
          },
          visibility: 'public'
        });
      }

      await this.saveRetentionData();
    }

    return newAchievements;
  }

  // Championship Memories
  async createMemory(
    userId: string,
    memory: Omit<ChampionshipMemory, 'id' | 'createdAt'>
  ): Promise<ChampionshipMemory> {
    const championshipMemory: ChampionshipMemory = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      ...memory
    };

    let userMemories = this.memories.get(userId) || [];
    userMemories.unshift(championshipMemory);
    this.memories.set(userId, userMemories);

    // Add to activity feed if public
    if (memory.visibility === 'public') {
      await this.addActivityFeedItem(userId, {
        type: 'social_activity',
        content: {
          title: 'New Championship Memory',
          description: memory.title,
          data: championshipMemory
        },
        visibility: memory.visibility
      });
    }

    await this.saveRetentionData();
    return championshipMemory;
  }

  async getMemories(userId: string, eventId?: string): Promise<ChampionshipMemory[]> {
    const userMemories = this.memories.get(userId) || [];
    
    if (eventId) {
      return userMemories.filter(m => m.eventId === eventId);
    }
    
    return userMemories;
  }

  // Activity Feed Management
  private async addActivityFeedItem(
    userId: string,
    item: Omit<ActivityFeedItem, 'id' | 'userId' | 'timestamp' | 'interactions'>
  ): Promise<void> {
    const feedItem: ActivityFeedItem = {
      id: this.generateId(),
      userId,
      timestamp: new Date().toISOString(),
      interactions: { likes: [], comments: [] },
      ...item
    };

    let userFeed = this.activityFeed.get(userId) || [];
    userFeed.unshift(feedItem);
    
    // Keep last 100 items
    if (userFeed.length > 100) {
      userFeed = userFeed.slice(0, 100);
    }
    
    this.activityFeed.set(userId, userFeed);
  }

  async getFriendActivity(userId: string, limit: number = 20): Promise<ActivityFeedItem[]> {
    const connections = this.connections.get(userId) || [];
    const friendIds = connections
      .filter(c => c.status === 'accepted')
      .map(c => c.connectedUserId);

    let allActivity: ActivityFeedItem[] = [];
    
    for (const friendId of friendIds) {
      const friendActivity = this.activityFeed.get(friendId) || [];
      allActivity.push(...friendActivity.filter(item => 
        item.visibility === 'public' || item.visibility === 'friends'
      ));
    }

    // Sort by timestamp and limit
    allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return allActivity.slice(0, limit);
  }

  // Milestone and Anniversary Notifications
  async scheduleEngagementTasks(): Promise<void> {
    // Schedule daily checks for milestones and anniversaries
    setInterval(async () => {
      await this.checkMilestones();
      await this.checkAnniversaries();
    }, 24 * 60 * 60 * 1000); // Daily

    // Initial check
    await this.checkMilestones();
    await this.checkAnniversaries();
  }

  private async checkMilestones(): Promise<void> {
    for (const [userId, metrics] of this.performanceMetrics.entries()) {
      const raceCount = metrics.length;
      
      // Milestone achievements (10, 25, 50, 100 races)
      const milestones = [10, 25, 50, 100];
      for (const milestone of milestones) {
        if (raceCount === milestone) {
          await notificationService.sendRaceNotification({
            id: this.generateId(),
            type: 'results_posted',
            raceId: 'milestone',
            title: `🎉 Milestone Reached!`,
            message: `Congratulations on completing ${milestone} races! Keep sailing!`,
            scheduledTime: new Date().toISOString(),
            requiresSubscription: false
          });
        }
      }
    }
  }

  private async checkAnniversaries(): Promise<void> {
    const today = new Date();
    
    for (const [userId, calendar] of this.racingCalendars.entries()) {
      const firstRace = calendar.events
        .filter(e => e.status === 'completed')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

      if (firstRace) {
        const firstRaceDate = new Date(firstRace.startDate);
        const yearsAgo = today.getFullYear() - firstRaceDate.getFullYear();
        
        if (yearsAgo > 0 && 
            today.getMonth() === firstRaceDate.getMonth() && 
            today.getDate() === firstRaceDate.getDate()) {
          
          await notificationService.sendRaceNotification({
            id: this.generateId(),
            type: 'results_posted',
            raceId: 'anniversary',
            title: `🎂 Sailing Anniversary!`,
            message: `${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} ago you completed your first race. Happy anniversary!`,
            scheduledTime: new Date().toISOString(),
            requiresSubscription: false
          });
        }
      }
    }
  }

  // Helper methods
  private async scheduleEventReminders(userId: string, event: CalendarEvent): Promise<void> {
    const calendar = this.racingCalendars.get(userId);
    if (!calendar || !calendar.reminderSettings.raceReminders) return;

    const eventDate = new Date(event.startDate);
    const now = new Date();

    // 1 day reminder
    const oneDayBefore = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
    if (oneDayBefore > now) {
      setTimeout(async () => {
        await notificationService.sendRaceNotification({
          id: this.generateId(),
          type: 'race_start',
          raceId: event.id,
          title: `Tomorrow: ${event.title}`,
          message: `Your ${event.type} starts tomorrow at ${event.location.name}`,
          scheduledTime: event.startDate,
          location: event.location.name,
          requiresSubscription: false
        });
      }, oneDayBefore.getTime() - now.getTime());
    }
  }

  private calculateConsistency(positions: number[]): number {
    if (positions.length < 2) return 0;
    
    const mean = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
    const variance = positions.reduce((sum, pos) => sum + Math.pow(pos - mean, 2), 0) / positions.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to 0-100 score (lower std dev = higher consistency)
    return Math.max(0, 100 - stdDev * 10);
  }

  private cloneAchievement(achievementId: string): Achievement {
    // In a real implementation, this would come from a database
    const achievements = {
      'first_race': {
        id: 'first_race',
        type: 'participation' as const,
        title: 'First Race',
        description: 'Complete your first recorded race',
        icon: '🏁',
        earnedAt: '',
        rarity: 'common' as const,
        points: 10,
        criteria: { races_completed: 1 }
      },
      'podium_finish': {
        id: 'podium_finish',
        type: 'race_result' as const,
        title: 'Podium Finish',
        description: 'Finish in the top 3',
        icon: '🏆',
        earnedAt: '',
        rarity: 'rare' as const,
        points: 50,
        criteria: { best_position: 3 }
      },
      'social_sailor': {
        id: 'social_sailor',
        type: 'social' as const,
        title: 'Social Sailor',
        description: 'Connect with 10 other sailors',
        icon: '⛵',
        earnedAt: '',
        rarity: 'uncommon' as const,
        points: 30,
        criteria: { connections: 10 }
      }
    };

    return { ...achievements[achievementId as keyof typeof achievements] };
  }

  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  private generateId(): string {
    return `ret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage management
  private async loadRetentionData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('retention_data');
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed.racingCalendars) {
          this.racingCalendars = new Map(Object.entries(parsed.racingCalendars));
        }
        if (parsed.connections) {
          this.connections = new Map(Object.entries(parsed.connections));
        }
        if (parsed.performanceMetrics) {
          this.performanceMetrics = new Map(Object.entries(parsed.performanceMetrics));
        }
        if (parsed.achievements) {
          this.achievements = new Map(Object.entries(parsed.achievements));
        }
        if (parsed.memories) {
          this.memories = new Map(Object.entries(parsed.memories));
        }
        if (parsed.activityFeed) {
          this.activityFeed = new Map(Object.entries(parsed.activityFeed));
        }
      }
    } catch (error) {
    }
  }

  private async saveRetentionData(): Promise<void> {
    try {
      const data = {
        racingCalendars: Object.fromEntries(this.racingCalendars),
        connections: Object.fromEntries(this.connections),
        performanceMetrics: Object.fromEntries(this.performanceMetrics),
        achievements: Object.fromEntries(this.achievements),
        memories: Object.fromEntries(this.memories),
        activityFeed: Object.fromEntries(this.activityFeed)
      };
      
      await AsyncStorage.setItem('retention_data', JSON.stringify(data));
    } catch (error) {
    }
  }

  // Public utility methods
  getRacingCalendar(userId: string): PersonalRacingCalendar | null {
    return this.racingCalendars.get(userId) || null;
  }

  getUserConnections(userId: string): SailingConnection[] {
    return this.connections.get(userId) || [];
  }

  getUserAchievements(userId: string): Achievement[] {
    return this.achievements.get(userId) || [];
  }

  clearUserData(userId: string): void {
    this.racingCalendars.delete(userId);
    this.connections.delete(userId);
    this.performanceMetrics.delete(userId);
    this.achievements.delete(userId);
    this.memories.delete(userId);
    this.activityFeed.delete(userId);
  }
}

// Export singleton instance
export const retentionManager = new RetentionManager();