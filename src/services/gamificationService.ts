import AsyncStorage from '@react-native-async-storage/async-storage';
import { loyaltyService } from './loyaltyService';
import { retentionManager } from './retentionManager';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';

// Gamification interfaces for Phase 6
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'sailing' | 'weather' | 'social' | 'championship' | 'learning' | 'milestone';
  type: 'progress' | 'streak' | 'milestone' | 'rare' | 'hidden' | 'seasonal';
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  unlockedBy: number; // Number of users who have unlocked this
  isVisible: boolean;
  isActive: boolean;
  seasonId?: string;
  expiresAt?: string;
}

export interface AchievementRequirement {
  type: 'weather_checks' | 'races_logged' | 'connections_made' | 'time_spent' | 'feature_usage' | 'subscription_tier' | 'consecutive_days' | 'total_distance' | 'race_position';
  target: number;
  period?: 'day' | 'week' | 'month' | 'season' | 'lifetime';
  metadata?: Record<string, any>;
}

export interface AchievementReward {
  type: 'points' | 'badge' | 'title' | 'feature_unlock' | 'discount' | 'exclusive_content';
  value: string | number;
  description: string;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  completedAt?: string;
  currentStreak?: number;
  bestStreak?: number;
  metadata?: Record<string, any>;
}

export interface Leaderboard {
  id: string;
  name: string;
  description: string;
  category: 'overall' | 'weather_expertise' | 'racing_performance' | 'social_influence' | 'championship_preparation' | 'learning_progress';
  type: 'points' | 'achievements' | 'streaks' | 'custom_metric';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'all_time';
  maxEntries: number;
  isPublic: boolean;
  isActive: boolean;
  refreshInterval: number; // minutes
  lastRefresh: string;
  entries: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatar?: string;
  score: number;
  rank: number;
  change: number; // Position change since last refresh
  metadata?: Record<string, any>;
  country?: string;
  sailingClub?: string;
  subscriptionTier?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'achievement' | 'tier' | 'seasonal' | 'championship' | 'social' | 'expert';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedBy: number;
  isVisible: boolean;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: string;
  source: string; // What earned this badge
  isDisplayed: boolean; // Whether user shows this on their profile
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'championship';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  startDate: string;
  endDate: string;
  participants: string[];
  completions: number;
  isActive: boolean;
  isRepeatable: boolean;
}

export interface ChallengeRequirement {
  type: 'weather_checks' | 'races_completed' | 'social_interactions' | 'learning_modules' | 'consecutive_usage';
  target: number;
  description: string;
  currentProgress?: number;
}

export interface ChallengeReward {
  type: 'points' | 'achievement' | 'badge' | 'exclusive_access' | 'discount';
  value: string | number;
  description: string;
}

export interface UserProgress {
  userId: string;
  level: number;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  totalAchievements: number;
  rareAchievements: number;
  achievementScore: number;
  currentStreak: number;
  longestStreak: number;
  badges: UserBadge[];
  titles: string[];
  activeTitle?: string;
  stats: UserStats;
}

export interface UserStats {
  weatherChecks: number;
  racesLogged: number;
  socialConnections: number;
  timeSpentHours: number;
  achievementScore: number;
  leaderboardPositions: Record<string, number>;
  favoriteFeatures: string[];
  activityHeatmap: Record<string, number>; // Date -> activity count
}

// Advanced Gamification Service for Phase 6
export class GamificationService {
  private achievements: Achievement[] = [];
  private userAchievements: Map<string, UserAchievement[]> = new Map();
  private leaderboards: Leaderboard[] = [];
  private badges: Badge[] = [];
  private userBadges: Map<string, UserBadge[]> = new Map();
  private challenges: Challenge[] = [];
  private userProgress: Map<string, UserProgress> = new Map();

  constructor() {
    this.initializeAchievements();
    this.initializeLeaderboards();
    this.initializeBadges();
    this.initializeChallenges();
    this.loadGamificationData();
    this.startPeriodicUpdates();
  }

  // Initialize achievements
  private initializeAchievements(): void {
    this.achievements = [
      // Weather-related achievements
      {
        id: 'first_forecast',
        name: 'Weather Watcher',
        description: 'Check your first weather forecast',
        category: 'weather',
        type: 'milestone',
        icon: '🌤️',
        rarity: 'common',
        points: 50,
        requirements: [{ type: 'weather_checks', target: 1 }],
        rewards: [
          { type: 'points', value: 50, description: '50 loyalty points' },
          { type: 'badge', value: 'weather_novice', description: 'Weather Novice badge' }
        ],
        unlockedBy: 0,
        isVisible: true,
        isActive: true
      },
      {
        id: 'weather_streak_7',
        name: 'Weather Streak Champion',
        description: 'Check weather conditions for 7 consecutive days',
        category: 'weather',
        type: 'streak',
        icon: '🔥',
        rarity: 'uncommon',
        points: 200,
        requirements: [{ type: 'consecutive_days', target: 7, metadata: { activity: 'weather_check' } }],
        rewards: [
          { type: 'points', value: 200, description: '200 loyalty points' },
          { type: 'feature_unlock', value: 'advanced_weather_alerts', description: 'Advanced weather alerts' }
        ],
        unlockedBy: 0,
        isVisible: true,
        isActive: true
      },
      {
        id: 'meteorologist',
        name: 'Master Meteorologist',
        description: 'Check weather conditions 500 times',
        category: 'weather',
        type: 'progress',
        icon: '⛈️',
        rarity: 'rare',
        points: 1000,
        requirements: [{ type: 'weather_checks', target: 500, period: 'lifetime' }],
        rewards: [
          { type: 'points', value: 1000, description: '1000 loyalty points' },
          { type: 'title', value: 'Master Meteorologist', description: 'Exclusive title' },
          { type: 'discount', value: 25, description: '25% off TacticalWind premium' }
        ],
        unlockedBy: 0,
        isVisible: true,
        isActive: true
      },

      // Racing-related achievements
      {
        id: 'first_race',
        name: 'Racing Debut',
        description: 'Log your first sailing race or session',
        category: 'sailing',
        type: 'milestone',
        icon: '🏁',
        rarity: 'common',
        points: 100,
        requirements: [{ type: 'races_logged', target: 1 }],
        rewards: [
          { type: 'points', value: 100, description: '100 loyalty points' },
          { type: 'badge', value: 'racing_rookie', description: 'Racing Rookie badge' }
        ],
        unlockedBy: 0,
        isVisible: true,
        isActive: true
      },
      {
        id: 'racing_veteran',
        name: 'Racing Veteran',
        description: 'Log 50 sailing races or sessions',
        category: 'sailing',
        type: 'progress',
        icon: '⛵',
        rarity: 'uncommon',
        points: 500,
        requirements: [{ type: 'races_logged', target: 50, period: 'lifetime' }],
        rewards: [
          { type: 'points', value: 500, description: '500 loyalty points' },
          { type: 'badge', value: 'racing_veteran', description: 'Racing Veteran badge' },
          { type: 'exclusive_content', value: 'veteran_insights', description: 'Access to veteran sailing insights' }
        ],
        unlockedBy: 0,
        isVisible: true,
        isActive: true
      },
      {
        id: 'podium_finisher',
        name: 'Podium Finisher',
        description: 'Achieve a top-3 finish in a race',
        category: 'sailing',
        type: 'milestone',
        icon: '🏆',
        rarity: 'rare',
        points: 750,
        requirements: [{ type: 'race_position', target: 3 }],
        rewards: [
          { type: 'points', value: 750, description: '750 loyalty points' },
          { type: 'badge', value: 'podium_finisher', description: 'Podium Finisher badge' },
          { type: 'title', value: 'Podium Finisher', description: 'Exclusive title' }
        ],
        unlockedBy: 0,
        isVisible: true,
        isActive: true
      },

      // Social achievements
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Connect with 10 fellow sailors',
        category: 'social',
        type: 'progress',
        icon: '🦋',
        rarity: 'uncommon',
        points: 300,
        requirements: [{ type: 'connections_made', target: 10, period: 'lifetime' }],
        rewards: [
          { type: 'points', value: 300, description: '300 loyalty points' },
          { type: 'feature_unlock', value: 'premium_social_features', description: 'Premium social features' }
        ],
        unlockedBy: 0,
        isVisible: true,
        isActive: true
      },
      {
        id: 'crew_captain',
        name: 'Crew Captain',
        description: 'Build a network of 50 sailing connections',
        category: 'social',
        type: 'progress',
        icon: '👥',
        rarity: 'rare',
        points: 1000,
        requirements: [{ type: 'connections_made', target: 50, period: 'lifetime' }],
        rewards: [
          { type: 'points', value: 1000, description: '1000 loyalty points' },
          { type: 'badge', value: 'crew_captain', description: 'Crew Captain badge' },
          { type: 'title', value: 'Crew Captain', description: 'Leadership title' }
        ],
        unlockedBy: 0,
        isVisible: true,
        isActive: true
      },

      // Championship achievements
      {
        id: 'dragon_worlds_participant',
        name: 'Dragon Worlds Participant',
        description: 'Verified as a Dragon Worlds 2027 participant',
        category: 'championship',
        type: 'milestone',
        icon: '🐉',
        rarity: 'epic',
        points: 2000,
        requirements: [{ type: 'subscription_tier', target: 1, metadata: { participant_verified: true } }],
        rewards: [
          { type: 'points', value: 2000, description: '2000 loyalty points' },
          { type: 'badge', value: 'dragon_worlds_participant', description: 'Exclusive participant badge' },
          { type: 'title', value: 'Dragon Worlds Sailor', description: 'Championship title' },
          { type: 'exclusive_content', value: 'participant_only_content', description: 'Participant-only content access' }
        ],
        unlockedBy: 0,
        isVisible: true,
        isActive: true
      },

      // Hidden/Rare achievements
      {
        id: 'night_owl',
        name: 'Night Owl Sailor',
        description: 'Check weather conditions at midnight 10 times',
        category: 'weather',
        type: 'hidden',
        icon: '🦉',
        rarity: 'rare',
        points: 500,
        requirements: [{ type: 'weather_checks', target: 10, metadata: { time_range: '23:00-01:00' } }],
        rewards: [
          { type: 'points', value: 500, description: '500 loyalty points' },
          { type: 'badge', value: 'night_owl', description: 'Night Owl badge' }
        ],
        unlockedBy: 0,
        isVisible: false, // Hidden achievement
        isActive: true
      },
      {
        id: 'dedication_streak',
        name: 'Dedication Master',
        description: 'Use the app for 30 consecutive days',
        category: 'milestone',
        type: 'streak',
        icon: '💎',
        rarity: 'legendary',
        points: 3000,
        requirements: [{ type: 'consecutive_days', target: 30, metadata: { activity: 'app_usage' } }],
        rewards: [
          { type: 'points', value: 3000, description: '3000 loyalty points' },
          { type: 'badge', value: 'dedication_master', description: 'Dedication Master badge' },
          { type: 'title', value: 'Dedication Master', description: 'Legendary title' },
          { type: 'discount', value: 50, description: '50% off next subscription renewal' }
        ],
        unlockedBy: 0,
        isVisible: true,
        isActive: true
      }
    ];
  }

  // Initialize leaderboards
  private initializeLeaderboards(): void {
    this.leaderboards = [
      {
        id: 'overall_points',
        name: 'Overall Champion',
        description: 'Top sailors by total loyalty points earned',
        category: 'overall',
        type: 'points',
        timeframe: 'all_time',
        maxEntries: 100,
        isPublic: true,
        isActive: true,
        refreshInterval: 60, // 1 hour
        lastRefresh: new Date().toISOString(),
        entries: []
      },
      {
        id: 'weekly_achievers',
        name: 'Weekly Achievers',
        description: 'Most achievements unlocked this week',
        category: 'overall',
        type: 'achievements',
        timeframe: 'weekly',
        maxEntries: 50,
        isPublic: true,
        isActive: true,
        refreshInterval: 60,
        lastRefresh: new Date().toISOString(),
        entries: []
      },
      {
        id: 'weather_experts',
        name: 'Weather Experts',
        description: 'Top weather forecasting enthusiasts',
        category: 'weather_expertise',
        type: 'custom_metric',
        timeframe: 'monthly',
        maxEntries: 25,
        isPublic: true,
        isActive: true,
        refreshInterval: 240, // 4 hours
        lastRefresh: new Date().toISOString(),
        entries: []
      },
      {
        id: 'racing_champions',
        name: 'Racing Champions',
        description: 'Best racing performance and consistency',
        category: 'racing_performance',
        type: 'custom_metric',
        timeframe: 'seasonal',
        maxEntries: 30,
        isPublic: true,
        isActive: true,
        refreshInterval: 480, // 8 hours
        lastRefresh: new Date().toISOString(),
        entries: []
      },
      {
        id: 'social_influencers',
        name: 'Social Influencers',
        description: 'Most connected and influential community members',
        category: 'social_influence',
        type: 'custom_metric',
        timeframe: 'monthly',
        maxEntries: 20,
        isPublic: true,
        isActive: true,
        refreshInterval: 360, // 6 hours
        lastRefresh: new Date().toISOString(),
        entries: []
      },
      {
        id: 'daily_streaks',
        name: 'Streak Masters',
        description: 'Longest active daily usage streaks',
        category: 'overall',
        type: 'streaks',
        timeframe: 'all_time',
        maxEntries: 25,
        isPublic: true,
        isActive: true,
        refreshInterval: 1440, // 24 hours
        lastRefresh: new Date().toISOString(),
        entries: []
      }
    ];
  }

  // Initialize badges
  private initializeBadges(): void {
    this.badges = [
      {
        id: 'weather_novice',
        name: 'Weather Novice',
        description: 'Started tracking weather conditions',
        icon: '🌤️',
        color: '#3B82F6',
        category: 'achievement',
        rarity: 'common',
        earnedBy: 0,
        isVisible: true
      },
      {
        id: 'racing_rookie',
        name: 'Racing Rookie',
        description: 'Logged first sailing session',
        icon: '🏁',
        color: '#10B981',
        category: 'achievement',
        rarity: 'common',
        earnedBy: 0,
        isVisible: true
      },
      {
        id: 'podium_finisher',
        name: 'Podium Finisher',
        description: 'Achieved top-3 race finish',
        icon: '🏆',
        color: '#F59E0B',
        category: 'achievement',
        rarity: 'rare',
        earnedBy: 0,
        isVisible: true
      },
      {
        id: 'dragon_worlds_participant',
        name: 'Dragon Worlds Participant',
        description: 'Verified championship participant',
        icon: '🐉',
        color: '#8B5CF6',
        category: 'championship',
        rarity: 'epic',
        earnedBy: 0,
        isVisible: true
      },
      {
        id: 'dedication_master',
        name: 'Dedication Master',
        description: 'Used app for 30 consecutive days',
        icon: '💎',
        color: '#EC4899',
        category: 'achievement',
        rarity: 'legendary',
        earnedBy: 0,
        isVisible: true
      },
      {
        id: 'crew_captain',
        name: 'Crew Captain',
        description: 'Built extensive sailing network',
        icon: '👥',
        color: '#06B6D4',
        category: 'social',
        rarity: 'rare',
        earnedBy: 0,
        isVisible: true
      }
    ];
  }

  // Initialize challenges
  private initializeChallenges(): void {
    this.challenges = [
      {
        id: 'daily_weather_check',
        name: 'Daily Weather Check',
        description: 'Check weather conditions today',
        category: 'daily',
        difficulty: 'easy',
        requirements: [
          {
            type: 'weather_checks',
            target: 1,
            description: 'Check weather conditions once today'
          }
        ],
        rewards: [
          { type: 'points', value: 50, description: '50 loyalty points' }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        participants: [],
        completions: 0,
        isActive: true,
        isRepeatable: true
      },
      {
        id: 'weekly_social_connection',
        name: 'Weekly Social Connection',
        description: 'Make 3 new sailing connections this week',
        category: 'weekly',
        difficulty: 'medium',
        requirements: [
          {
            type: 'social_interactions',
            target: 3,
            description: 'Connect with 3 new sailors'
          }
        ],
        rewards: [
          { type: 'points', value: 300, description: '300 loyalty points' },
          { type: 'badge', value: 'social_connector', description: 'Social Connector badge' }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        participants: [],
        completions: 0,
        isActive: true,
        isRepeatable: true
      },
      {
        id: 'championship_preparation',
        name: 'Championship Preparation',
        description: 'Complete all preparation activities for Dragon Worlds 2027',
        category: 'championship',
        difficulty: 'expert',
        requirements: [
          {
            type: 'weather_checks',
            target: 30,
            description: 'Check weather 30 times this month'
          },
          {
            type: 'races_completed',
            target: 5,
            description: 'Log 5 sailing sessions'
          },
          {
            type: 'social_interactions',
            target: 10,
            description: 'Connect with 10 sailors'
          }
        ],
        rewards: [
          { type: 'points', value: 2000, description: '2000 loyalty points' },
          { type: 'achievement', value: 'championship_ready', description: 'Championship Ready achievement' },
          { type: 'exclusive_access', value: 'vip_content', description: 'Exclusive championship content' }
        ],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        participants: [],
        completions: 0,
        isActive: true,
        isRepeatable: false
      }
    ];
  }

  // Track user activity and update progress
  async trackActivity(
    userId: string, 
    activityType: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get or create user progress
      let userProgress = this.userProgress.get(userId);
      if (!userProgress) {
        userProgress = await this.createUserProgress(userId);
      }

      // Update user stats
      this.updateUserStats(userProgress, activityType, metadata);

      // Check achievement progress
      await this.checkAchievementProgress(userId, activityType, metadata);

      // Check challenge progress
      await this.checkChallengeProgress(userId, activityType, metadata);

      // Update XP and level
      const xpGained = this.calculateXPForActivity(activityType);
      await this.awardXP(userId, xpGained);

      // Save progress
      this.userProgress.set(userId, userProgress);
      await this.saveGamificationData();

      // Track analytics
      await analyticsService.trackEvent('gamification_activity_tracked', {
        user_id: userId,
        activity_type: activityType,
        xp_gained: xpGained,
        user_level: userProgress.level,
        metadata
      });

    } catch (error) {
    }
  }

  // Award achievement to user
  async awardAchievement(userId: string, achievementId: string): Promise<void> {
    try {
      const achievement = this.achievements.find(a => a.id === achievementId);
      if (!achievement) return;

      // Check if user already has this achievement
      const userAchievements = this.userAchievements.get(userId) || [];
      const existingAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
      
      if (existingAchievement && existingAchievement.isCompleted) {
        return; // Already earned
      }

      // Award achievement
      const userAchievement: UserAchievement = {
        userId,
        achievementId,
        progress: achievement.requirements[0].target,
        maxProgress: achievement.requirements[0].target,
        isCompleted: true,
        completedAt: new Date().toISOString()
      };

      if (existingAchievement) {
        existingAchievement.isCompleted = true;
        existingAchievement.completedAt = new Date().toISOString();
        existingAchievement.progress = existingAchievement.maxProgress;
      } else {
        userAchievements.push(userAchievement);
        this.userAchievements.set(userId, userAchievements);
      }

      // Update achievement unlock count
      achievement.unlockedBy++;

      // Award rewards
      for (const reward of achievement.rewards) {
        await this.processAchievementReward(userId, reward, achievement);
      }

      // Update user progress
      const userProgress = this.userProgress.get(userId);
      if (userProgress) {
        userProgress.totalAchievements++;
        if (achievement.rarity === 'rare' || achievement.rarity === 'epic' || achievement.rarity === 'legendary') {
          userProgress.rareAchievements++;
        }
        userProgress.achievementScore += achievement.points;
      }

      // Send notification
      await notificationService.sendRaceNotification({
        id: `achievement_${achievementId}_${userId}`,
        type: 'results_posted',
        raceId: 'achievement',
        title: `🏆 Achievement Unlocked!`,
        message: `You've earned "${achievement.name}"! ${achievement.description}`,
        scheduledTime: new Date().toISOString(),
        requiresSubscription: false
      });

      // Award badges if included in rewards
      const badgeRewards = achievement.rewards.filter(r => r.type === 'badge');
      for (const badgeReward of badgeRewards) {
        await this.awardBadge(userId, badgeReward.value as string);
      }

      await this.saveGamificationData();

      // Track analytics
      await analyticsService.trackEvent('achievement_unlocked', {
        user_id: userId,
        achievement_id: achievementId,
        achievement_rarity: achievement.rarity,
        points_awarded: achievement.points,
        total_achievements: userProgress?.totalAchievements || 0
      });

    } catch (error) {
    }
  }

  // Award badge to user
  async awardBadge(userId: string, badgeId: string): Promise<void> {
    try {
      const badge = this.badges.find(b => b.id === badgeId);
      if (!badge) return;

      const userBadges = this.userBadges.get(userId) || [];
      const existingBadge = userBadges.find(ub => ub.badgeId === badgeId);
      
      if (existingBadge) return; // Already earned

      const userBadge: UserBadge = {
        userId,
        badgeId,
        earnedAt: new Date().toISOString(),
        source: 'achievement',
        isDisplayed: true
      };

      userBadges.push(userBadge);
      this.userBadges.set(userId, userBadges);

      // Update badge earned count
      badge.earnedBy++;

      // Update user progress
      const userProgress = this.userProgress.get(userId);
      if (userProgress) {
        userProgress.badges.push(userBadge);
      }

      await this.saveGamificationData();

    } catch (error) {
    }
  }

  // Update leaderboards
  async updateLeaderboards(): Promise<void> {
    try {
      for (const leaderboard of this.leaderboards) {
        if (!leaderboard.isActive) continue;

        const now = new Date();
        const lastRefresh = new Date(leaderboard.lastRefresh);
        const minutesSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60);

        if (minutesSinceRefresh >= leaderboard.refreshInterval) {
          await this.refreshLeaderboard(leaderboard);
          leaderboard.lastRefresh = now.toISOString();
        }
      }

      await this.saveGamificationData();

    } catch (error) {
    }
  }

  // Get user's current progress
  getUserProgress(userId: string): UserProgress | null {
    return this.userProgress.get(userId) || null;
  }

  // Get user's achievements
  getUserAchievements(userId: string, includeHidden: boolean = false): Achievement[] {
    const userAchievements = this.userAchievements.get(userId) || [];
    const completedIds = userAchievements.filter(ua => ua.isCompleted).map(ua => ua.achievementId);
    
    return this.achievements.filter(achievement => 
      completedIds.includes(achievement.id) && 
      (includeHidden || achievement.isVisible)
    );
  }

  // Get available achievements for user
  getAvailableAchievements(userId: string): Achievement[] {
    const userAchievements = this.userAchievements.get(userId) || [];
    const completedIds = userAchievements.filter(ua => ua.isCompleted).map(ua => ua.achievementId);
    
    return this.achievements.filter(achievement => 
      !completedIds.includes(achievement.id) && 
      achievement.isVisible && 
      achievement.isActive
    );
  }

  // Get leaderboards
  getLeaderboards(): Leaderboard[] {
    return this.leaderboards.filter(lb => lb.isPublic && lb.isActive);
  }

  // Get user's leaderboard position
  getUserLeaderboardPosition(userId: string, leaderboardId: string): number {
    const leaderboard = this.leaderboards.find(lb => lb.id === leaderboardId);
    if (!leaderboard) return -1;

    const entry = leaderboard.entries.find(e => e.userId === userId);
    return entry ? entry.rank : -1;
  }

  // Helper methods
  private async createUserProgress(userId: string): Promise<UserProgress> {
    const progress: UserProgress = {
      userId,
      level: 1,
      totalXP: 0,
      currentLevelXP: 0,
      nextLevelXP: 100,
      totalAchievements: 0,
      rareAchievements: 0,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
      titles: [],
      stats: {
        weatherChecks: 0,
        racesLogged: 0,
        socialConnections: 0,
        timeSpentHours: 0,
        achievementScore: 0,
        leaderboardPositions: {},
        favoriteFeatures: [],
        activityHeatmap: {}
      }
    };

    this.userProgress.set(userId, progress);
    return progress;
  }

  private updateUserStats(
    userProgress: UserProgress, 
    activityType: string, 
    metadata?: Record<string, any>
  ): void {
    const today = new Date().toISOString().split('T')[0];
    
    // Update activity heatmap
    userProgress.stats.activityHeatmap[today] = (userProgress.stats.activityHeatmap[today] || 0) + 1;

    // Update specific stats based on activity type
    switch (activityType) {
      case 'weather_check':
        userProgress.stats.weatherChecks++;
        break;
      case 'race_logged':
        userProgress.stats.racesLogged++;
        break;
      case 'social_connection':
        userProgress.stats.socialConnections++;
        break;
      case 'time_spent':
        userProgress.stats.timeSpentHours += (metadata?.hours || 0);
        break;
    }
  }

  private calculateXPForActivity(activityType: string): number {
    const xpMap: Record<string, number> = {
      'weather_check': 5,
      'race_logged': 25,
      'social_connection': 15,
      'achievement_unlocked': 50,
      'challenge_completed': 100,
      'daily_login': 10,
      'feature_usage': 3
    };

    return xpMap[activityType] || 1;
  }

  private async awardXP(userId: string, xp: number): Promise<void> {
    const userProgress = this.userProgress.get(userId);
    if (!userProgress) return;

    userProgress.totalXP += xp;
    userProgress.currentLevelXP += xp;

    // Check for level up
    while (userProgress.currentLevelXP >= userProgress.nextLevelXP) {
      userProgress.currentLevelXP -= userProgress.nextLevelXP;
      userProgress.level++;
      userProgress.nextLevelXP = this.calculateNextLevelXP(userProgress.level);

      // Award loyalty points for level up
      await loyaltyService.awardPoints(userId, userProgress.level * 50, 'level_up', `Reached level ${userProgress.level}`);

      // Send level up notification
      await notificationService.sendRaceNotification({
        id: `level_up_${userId}_${userProgress.level}`,
        type: 'results_posted',
        raceId: 'gamification',
        title: `🎉 Level Up!`,
        message: `Congratulations! You've reached Level ${userProgress.level}!`,
        scheduledTime: new Date().toISOString(),
        requiresSubscription: false
      });
    }
  }

  private calculateNextLevelXP(level: number): number {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  }

  private async checkAchievementProgress(
    userId: string, 
    activityType: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    const userAchievements = this.userAchievements.get(userId) || [];

    for (const achievement of this.achievements) {
      if (!achievement.isActive) continue;

      const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
      if (userAchievement && userAchievement.isCompleted) continue;

      // Check if activity matches achievement requirements
      for (const requirement of achievement.requirements) {
        if (this.doesActivityMatchRequirement(activityType, requirement, metadata)) {
          await this.updateAchievementProgress(userId, achievement, requirement);
        }
      }
    }
  }

  private async checkChallengeProgress(
    userId: string, 
    activityType: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    // Implementation would track individual challenge progress
    // Similar to achievement progress tracking
  }

  private doesActivityMatchRequirement(
    activityType: string, 
    requirement: AchievementRequirement, 
    metadata?: Record<string, any>
  ): boolean {
    const activityMapping: Record<string, string[]> = {
      'weather_checks': ['weather_check', 'marine_forecast', 'wind_analysis'],
      'races_logged': ['race_logged', 'sailing_session', 'regatta_participation'],
      'connections_made': ['social_connection', 'crew_invitation', 'club_join'],
      'time_spent': ['session_duration', 'app_usage'],
      'feature_usage': ['feature_click', 'screen_view', 'interaction']
    };

    return activityMapping[requirement.type]?.includes(activityType) || false;
  }

  private async updateAchievementProgress(
    userId: string, 
    achievement: Achievement, 
    requirement: AchievementRequirement
  ): Promise<void> {
    let userAchievements = this.userAchievements.get(userId) || [];
    let userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);

    if (!userAchievement) {
      userAchievement = {
        userId,
        achievementId: achievement.id,
        progress: 0,
        maxProgress: requirement.target,
        isCompleted: false
      };
      userAchievements.push(userAchievement);
      this.userAchievements.set(userId, userAchievements);
    }

    userAchievement.progress = Math.min(userAchievement.progress + 1, userAchievement.maxProgress);

    if (userAchievement.progress >= userAchievement.maxProgress) {
      await this.awardAchievement(userId, achievement.id);
    }
  }

  private async processAchievementReward(
    userId: string, 
    reward: AchievementReward, 
    achievement: Achievement
  ): Promise<void> {
    switch (reward.type) {
      case 'points':
        await loyaltyService.awardPoints(
          userId, 
          reward.value as number, 
          'achievement', 
          `Achievement: ${achievement.name}`
        );
        break;
      case 'badge':
        await this.awardBadge(userId, reward.value as string);
        break;
      case 'title':
        const userProgress = this.userProgress.get(userId);
        if (userProgress && !userProgress.titles.includes(reward.value as string)) {
          userProgress.titles.push(reward.value as string);
        }
        break;
      // Other reward types would be implemented here
    }
  }

  private async refreshLeaderboard(leaderboard: Leaderboard): Promise<void> {
    const entries: LeaderboardEntry[] = [];

    // Get all user progress data
    for (const [userId, userProgress] of this.userProgress.entries()) {
      const score = this.calculateLeaderboardScore(userProgress, leaderboard);
      if (score > 0) {
        entries.push({
          userId,
          displayName: `Sailor ${userId.slice(-4)}`, // Would get from user profile
          score,
          rank: 0,
          change: 0,
          subscriptionTier: 'basic' // Would get from user subscription
        });
      }
    }

    // Sort and rank entries
    entries.sort((a, b) => b.score - a.score);
    entries.forEach((entry, index) => {
      const oldEntry = leaderboard.entries.find(e => e.userId === entry.userId);
      const oldRank = oldEntry?.rank || entries.length + 1;
      
      entry.rank = index + 1;
      entry.change = oldRank - entry.rank;
    });

    // Keep only top entries
    leaderboard.entries = entries.slice(0, leaderboard.maxEntries);
  }

  private calculateLeaderboardScore(userProgress: UserProgress, leaderboard: Leaderboard): number {
    switch (leaderboard.type) {
      case 'points':
        return userProgress.totalXP;
      case 'achievements':
        return userProgress.totalAchievements;
      case 'streaks':
        return userProgress.longestStreak;
      case 'custom_metric':
        return this.calculateCustomMetricScore(userProgress, leaderboard.category);
      default:
        return 0;
    }
  }

  private calculateCustomMetricScore(userProgress: UserProgress, category: string): number {
    switch (category) {
      case 'weather_expertise':
        return userProgress.stats.weatherChecks * 2 + userProgress.stats.achievementScore * 0.1;
      case 'racing_performance':
        return userProgress.stats.racesLogged * 5 + userProgress.rareAchievements * 100;
      case 'social_influence':
        return userProgress.stats.socialConnections * 10 + userProgress.totalAchievements;
      default:
        return userProgress.totalXP;
    }
  }

  // Start periodic updates
  private startPeriodicUpdates(): void {
    // Update leaderboards every hour
    setInterval(() => {
      this.updateLeaderboards();
    }, 60 * 60 * 1000);

    // Generate daily challenges
    setInterval(() => {
      this.generateDailyChallenges();
    }, 24 * 60 * 60 * 1000);
  }

  private async generateDailyChallenges(): Promise<void> {
    // Implementation would create new daily challenges
  }

  // Data persistence
  private async loadGamificationData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('gamification_data');
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed.userAchievements) {
          this.userAchievements = new Map(Object.entries(parsed.userAchievements));
        }
        if (parsed.userBadges) {
          this.userBadges = new Map(Object.entries(parsed.userBadges));
        }
        if (parsed.userProgress) {
          this.userProgress = new Map(Object.entries(parsed.userProgress));
        }
        if (parsed.leaderboards) {
          this.leaderboards = parsed.leaderboards;
        }
        if (parsed.challenges) {
          this.challenges = parsed.challenges;
        }
      }
    } catch (error) {
    }
  }

  private async saveGamificationData(): Promise<void> {
    try {
      const data = {
        userAchievements: Object.fromEntries(this.userAchievements),
        userBadges: Object.fromEntries(this.userBadges),
        userProgress: Object.fromEntries(this.userProgress),
        leaderboards: this.leaderboards,
        challenges: this.challenges
      };
      
      await AsyncStorage.setItem('gamification_data', JSON.stringify(data));
    } catch (error) {
    }
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();