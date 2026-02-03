import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService, SubscriptionTier } from './subscriptionService';
import { retentionManager } from './retentionManager';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';

// Loyalty and rewards interfaces for Phase 6
export interface LoyaltyPoints {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  currentTier: LoyaltyTier;
  pointsToNextTier: number;
  lastUpdated: string;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minimumPoints: number;
  benefits: LoyaltyBenefit[];
  icon: string;
  color: string;
  description: string;
  multiplier: number; // Points multiplier for this tier
}

export interface LoyaltyBenefit {
  id: string;
  type: 'discount' | 'free_access' | 'priority_support' | 'exclusive_content' | 'merchandise' | 'coaching';
  name: string;
  description: string;
  value: number;
  maxUsage: number;
  isRecurring: boolean;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'penalty';
  amount: number;
  source: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
}

export interface SailingReward {
  id: string;
  name: string;
  description: string;
  category: 'subscription' | 'coaching' | 'equipment' | 'event_access' | 'experience' | 'digital';
  pointsCost: number;
  realValue: number;
  currency: string;
  availability: {
    stock: number;
    maxPerUser: number;
    startDate: string;
    endDate: string;
  };
  eligibility: {
    minimumTier: string;
    subscriptionTiers: SubscriptionTier[];
    sailingExperience?: string[];
    regions?: string[];
  };
  partner?: {
    name: string;
    logo: string;
    commissionRate: number;
  };
  isDigital: boolean;
  isExclusive: boolean;
  redemptions: number;
}

export interface SeasonalChallenge {
  id: string;
  name: string;
  description: string;
  category: 'sailing' | 'social' | 'learning' | 'weather' | 'championship';
  requirements: ChallengeRequirement[];
  rewards: {
    points: number;
    badge?: string;
    exclusiveReward?: string;
  };
  startDate: string;
  endDate: string;
  participantCount: number;
  completionRate: number;
  isActive: boolean;
}

export interface ChallengeRequirement {
  type: 'weather_checks' | 'races_logged' | 'social_connections' | 'forum_posts' | 'achievements_unlocked';
  target: number;
  description: string;
}

export interface LoyaltyRedemption {
  id: string;
  userId: string;
  rewardId: string;
  pointsSpent: number;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  redemptionCode?: string;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface ReferralProgram {
  id: string;
  referrerId: string;
  refereeId: string;
  status: 'pending' | 'qualified' | 'rewarded';
  referralCode: string;
  rewards: {
    referrer: { points: number; bonus?: string };
    referee: { points: number; bonus?: string };
  };
  qualificationCriteria: {
    subscriptionRequired: boolean;
    minimumUsageDays: number;
  };
  createdAt: string;
  qualifiedAt?: string;
  rewardedAt?: string;
}

// Advanced Loyalty Service for Phase 6
export class LoyaltyService {
  private loyaltyPoints: Map<string, LoyaltyPoints> = new Map();
  private pointsTransactions: PointsTransaction[] = [];
  private sailingRewards: SailingReward[] = [];
  private loyaltyTiers: LoyaltyTier[] = [];
  private seasonalChallenges: SeasonalChallenge[] = [];
  private loyaltyRedemptions: LoyaltyRedemption[] = [];
  private referralPrograms: ReferralProgram[] = [];

  constructor() {
    this.initializeLoyaltyTiers();
    this.initializeSailingRewards();
    this.initializeSeasonalChallenges();
    this.loadLoyaltyData();
  }

  // Initialize loyalty tiers
  private initializeLoyaltyTiers(): void {
    this.loyaltyTiers = [
      {
        id: 'crew',
        name: 'Crew Member',
        minimumPoints: 0,
        icon: '⚓',
        color: '#3B82F6',
        description: 'Welcome aboard! Start your sailing journey with us.',
        multiplier: 1.0,
        benefits: [
          {
            id: 'welcome_bonus',
            type: 'discount',
            name: '10% Off First Purchase',
            description: '10% discount on your first subscription upgrade',
            value: 10,
            maxUsage: 1,
            isRecurring: false
          }
        ]
      },
      {
        id: 'helmsman',
        name: 'Helmsman',
        minimumPoints: 500,
        icon: '🧭',
        color: '#10B981',
        description: 'You\'re getting the hang of it! Enjoy enhanced benefits.',
        multiplier: 1.2,
        benefits: [
          {
            id: 'priority_support',
            type: 'priority_support',
            name: 'Priority Customer Support',
            description: 'Get faster response times from our support team',
            value: 0,
            maxUsage: -1,
            isRecurring: true
          },
          {
            id: 'monthly_weather_bonus',
            type: 'free_access',
            name: 'Bonus Weather Queries',
            description: '50 extra weather queries per month',
            value: 50,
            maxUsage: 1,
            isRecurring: true
          }
        ]
      },
      {
        id: 'skipper',
        name: 'Skipper',
        minimumPoints: 1500,
        icon: '🚢',
        color: '#F59E0B',
        description: 'Experienced sailor with valuable insights and perks.',
        multiplier: 1.5,
        benefits: [
          {
            id: 'coaching_discount',
            type: 'discount',
            name: '25% Off Coaching Sessions',
            description: 'Discount on personal coaching and training sessions',
            value: 25,
            maxUsage: 3,
            isRecurring: true
          },
          {
            id: 'exclusive_content',
            type: 'exclusive_content',
            name: 'Skipper Exclusive Content',
            description: 'Access to advanced sailing tactics and strategies',
            value: 0,
            maxUsage: -1,
            isRecurring: true
          }
        ]
      },
      {
        id: 'commodore',
        name: 'Commodore',
        minimumPoints: 5000,
        icon: '👑',
        color: '#8B5CF6',
        description: 'Elite sailor with premium privileges and exclusive access.',
        multiplier: 2.0,
        benefits: [
          {
            id: 'free_vip_access',
            type: 'free_access',
            name: 'Free VIP Event Access',
            description: 'Complimentary VIP access to one championship event per year',
            value: 199,
            maxUsage: 1,
            isRecurring: true
          },
          {
            id: 'personal_concierge',
            type: 'priority_support',
            name: 'Personal Concierge Service',
            description: 'Dedicated account manager for all your sailing needs',
            value: 0,
            maxUsage: -1,
            isRecurring: true
          },
          {
            id: 'merchandise_allowance',
            type: 'merchandise',
            name: 'Annual Merchandise Credit',
            description: '$200 annual credit for sailing gear and merchandise',
            value: 200,
            maxUsage: 1,
            isRecurring: true
          }
        ]
      }
    ];
  }

  // Initialize sailing rewards
  private initializeSailingRewards(): void {
    this.sailingRewards = [
      {
        id: 'subscription_discount_month',
        name: '1 Month Free Subscription',
        description: 'Get one month free on your current subscription tier',
        category: 'subscription',
        pointsCost: 1000,
        realValue: 24.99,
        currency: 'USD',
        availability: {
          stock: -1,
          maxPerUser: 2,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        eligibility: {
          minimumTier: 'helmsman',
          subscriptionTiers: ['basic', 'professional', 'elite']
        },
        isDigital: true,
        isExclusive: false,
        redemptions: 0
      },
      {
        id: 'tactical_wind_premium',
        name: 'TacticalWind Premium Access',
        description: '3 months of premium tactical wind routing',
        category: 'digital',
        pointsCost: 2500,
        realValue: 119.99,
        currency: 'USD',
        availability: {
          stock: -1,
          maxPerUser: 1,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        eligibility: {
          minimumTier: 'skipper',
          subscriptionTiers: ['professional', 'elite'],
          sailingExperience: ['advanced', 'professional']
        },
        partner: {
          name: 'TacticalWind',
          logo: 'tacticalwind-logo.png',
          commissionRate: 0.15
        },
        isDigital: true,
        isExclusive: false,
        redemptions: 0
      },
      {
        id: 'dragon_class_coaching',
        name: 'Dragon Class Expert Coaching Session',
        description: '2-hour personal coaching session with Dragon class champion',
        category: 'coaching',
        pointsCost: 5000,
        realValue: 299.99,
        currency: 'USD',
        availability: {
          stock: 50,
          maxPerUser: 2,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
        },
        eligibility: {
          minimumTier: 'skipper',
          subscriptionTiers: ['professional', 'elite'],
          sailingExperience: ['intermediate', 'advanced', 'professional']
        },
        partner: {
          name: 'Dragon Racing Academy',
          logo: 'dragon-academy-logo.png',
          commissionRate: 0.25
        },
        isDigital: false,
        isExclusive: true,
        redemptions: 0
      },
      {
        id: 'gill_sailing_gear',
        name: 'Premium Gill Sailing Gear Package',
        description: 'Professional sailing jacket, gloves, and accessories',
        category: 'equipment',
        pointsCost: 4000,
        realValue: 399.99,
        currency: 'USD',
        availability: {
          stock: 100,
          maxPerUser: 1,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        },
        eligibility: {
          minimumTier: 'helmsman',
          subscriptionTiers: ['basic', 'professional', 'elite']
        },
        partner: {
          name: 'Gill Marine',
          logo: 'gill-logo.png',
          commissionRate: 0.20
        },
        isDigital: false,
        isExclusive: false,
        redemptions: 0
      },
      {
        id: 'championship_vip_experience',
        name: 'Dragon Worlds 2027 VIP Experience',
        description: 'Complete VIP package including accommodation and exclusive access',
        category: 'experience',
        pointsCost: 15000,
        realValue: 1999.99,
        currency: 'USD',
        availability: {
          stock: 25,
          maxPerUser: 1,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        eligibility: {
          minimumTier: 'commodore',
          subscriptionTiers: ['elite'],
          sailingExperience: ['advanced', 'professional']
        },
        isDigital: false,
        isExclusive: true,
        redemptions: 0
      },
      {
        id: 'custom_weather_alerts',
        name: 'Custom Weather Alert System',
        description: 'Personalized weather monitoring for your favorite sailing locations',
        category: 'digital',
        pointsCost: 750,
        realValue: 49.99,
        currency: 'USD',
        availability: {
          stock: -1,
          maxPerUser: 3,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        eligibility: {
          minimumTier: 'crew',
          subscriptionTiers: ['basic', 'professional', 'elite']
        },
        isDigital: true,
        isExclusive: false,
        redemptions: 0
      }
    ];
  }

  // Initialize seasonal challenges
  private initializeSeasonalChallenges(): void {
    this.seasonalChallenges = [
      {
        id: 'championship_preparation',
        name: 'Championship Preparation Challenge',
        description: 'Get ready for Dragon Worlds 2027 by completing sailing activities',
        category: 'championship',
        requirements: [
          {
            type: 'weather_checks',
            target: 50,
            description: 'Check weather conditions 50 times'
          },
          {
            type: 'races_logged',
            target: 10,
            description: 'Log 10 sailing sessions or races'
          },
          {
            type: 'social_connections',
            target: 5,
            description: 'Connect with 5 other sailors'
          }
        ],
        rewards: {
          points: 2000,
          badge: 'Championship Ready',
          exclusiveReward: 'championship_preparation_badge'
        },
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        participantCount: 0,
        completionRate: 0,
        isActive: true
      },
      {
        id: 'weather_warrior',
        name: 'Weather Warrior',
        description: 'Master the art of weather forecasting for sailing',
        category: 'weather',
        requirements: [
          {
            type: 'weather_checks',
            target: 100,
            description: 'Check weather 100 times in 30 days'
          },
          {
            type: 'achievements_unlocked',
            target: 3,
            description: 'Unlock 3 weather-related achievements'
          }
        ],
        rewards: {
          points: 1500,
          badge: 'Weather Master',
          exclusiveReward: 'advanced_weather_features'
        },
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        participantCount: 0,
        completionRate: 0,
        isActive: true
      },
      {
        id: 'social_sailor',
        name: 'Social Sailor Challenge',
        description: 'Build your sailing network and community connections',
        category: 'social',
        requirements: [
          {
            type: 'social_connections',
            target: 15,
            description: 'Connect with 15 sailors from different clubs'
          },
          {
            type: 'forum_posts',
            target: 20,
            description: 'Participate in community discussions'
          }
        ],
        rewards: {
          points: 1000,
          badge: 'Community Builder',
          exclusiveReward: 'premium_social_features'
        },
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        participantCount: 0,
        completionRate: 0,
        isActive: true
      }
    ];
  }

  // Award points for various activities
  async awardPoints(
    userId: string, 
    amount: number, 
    source: string, 
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      let userPoints = this.loyaltyPoints.get(userId);
      
      if (!userPoints) {
        userPoints = await this.createUserLoyaltyProfile(userId);
      }

      // Apply tier multiplier
      const multipliedAmount = Math.round(amount * userPoints.currentTier.multiplier);

      // Create transaction
      const transaction: PointsTransaction = {
        id: `pts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'earned',
        amount: multipliedAmount,
        source,
        description,
        metadata,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year expiry
      };

      this.pointsTransactions.push(transaction);

      // Update user points
      userPoints.totalPoints += multipliedAmount;
      userPoints.availablePoints += multipliedAmount;
      userPoints.lifetimePoints += multipliedAmount;
      userPoints.lastUpdated = new Date().toISOString();

      // Check for tier upgrade
      const newTier = this.calculateUserTier(userPoints.lifetimePoints);
      if (newTier.id !== userPoints.currentTier.id) {
        await this.upgradeTier(userId, newTier);
      }

      this.loyaltyPoints.set(userId, userPoints);
      await this.saveLoyaltyData();

      // Track analytics
      await analyticsService.trackEvent('loyalty_points_awarded', {
        user_id: userId,
        points_amount: multipliedAmount,
        source,
        tier: userPoints.currentTier.id,
        total_points: userPoints.totalPoints
      });

      // Check challenge progress
      await this.updateChallengeProgress(userId, source, multipliedAmount);

    } catch (error) {
    }
  }

  // Redeem reward
  async redeemReward(
    userId: string, 
    rewardId: string
  ): Promise<{ success: boolean; message: string; redemptionId?: string }> {
    try {
      const reward = this.sailingRewards.find(r => r.id === rewardId);
      if (!reward) {
        return { success: false, message: 'Reward not found' };
      }

      const userPoints = this.loyaltyPoints.get(userId);
      if (!userPoints) {
        return { success: false, message: 'User loyalty profile not found' };
      }

      // Check eligibility
      if (userPoints.currentTier.minimumPoints < this.loyaltyTiers.find(t => t.id === reward.eligibility.minimumTier)!.minimumPoints) {
        return { success: false, message: 'Insufficient tier level for this reward' };
      }

      if (userPoints.availablePoints < reward.pointsCost) {
        return { success: false, message: 'Insufficient points' };
      }

      // Check availability
      if (reward.availability.stock === 0) {
        return { success: false, message: 'Reward out of stock' };
      }

      const userRedemptions = this.loyaltyRedemptions.filter(
        r => r.userId === userId && r.rewardId === rewardId && r.status === 'completed'
      ).length;

      if (userRedemptions >= reward.availability.maxPerUser) {
        return { success: false, message: 'Maximum redemptions reached for this reward' };
      }

      // Process redemption
      const redemption: LoyaltyRedemption = {
        id: `rdm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        rewardId,
        pointsSpent: reward.pointsCost,
        status: 'pending',
        redemptionCode: this.generateRedemptionCode(),
        createdAt: new Date().toISOString()
      };

      // Deduct points
      userPoints.availablePoints -= reward.pointsCost;
      userPoints.lastUpdated = new Date().toISOString();

      // Update reward stock
      if (reward.availability.stock > 0) {
        reward.availability.stock--;
      }

      reward.redemptions++;

      // Create transaction
      const transaction: PointsTransaction = {
        id: `pts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'redeemed',
        amount: -reward.pointsCost,
        source: 'reward_redemption',
        description: `Redeemed: ${reward.name}`,
        metadata: { rewardId, redemptionId: redemption.id },
        createdAt: new Date().toISOString()
      };

      this.pointsTransactions.push(transaction);
      this.loyaltyRedemptions.push(redemption);
      this.loyaltyPoints.set(userId, userPoints);

      await this.saveLoyaltyData();

      // Process the actual reward (would integrate with external systems)
      await this.processReward(redemption, reward);

      // Track analytics
      await analyticsService.trackEvent('loyalty_reward_redeemed', {
        user_id: userId,
        reward_id: rewardId,
        points_spent: reward.pointsCost,
        reward_category: reward.category,
        reward_value: reward.realValue
      });

      // Send notification
      await notificationService.sendRaceNotification({
        id: redemption.id,
        type: 'results_posted',
        raceId: 'loyalty',
        title: '🎁 Reward Redeemed!',
        message: `You've successfully redeemed ${reward.name}. Your redemption code is ${redemption.redemptionCode}`,
        scheduledTime: new Date().toISOString(),
        requiresSubscription: false
      });

      return {
        success: true,
        message: 'Reward redeemed successfully',
        redemptionId: redemption.id
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to redeem reward'
      };
    }
  }

  // Create referral program
  async createReferral(referrerId: string): Promise<{ success: boolean; referralCode: string }> {
    const referralCode = `SAIL${referrerId.slice(-4).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    try {
      await analyticsService.trackEvent('referral_code_generated', {
        referrer_id: referrerId,
        referral_code: referralCode
      });

      return { success: true, referralCode };
    } catch (error) {
      return { success: false, referralCode: '' };
    }
  }

  // Process referral
  async processReferral(
    refereeId: string, 
    referralCode: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Extract referrer ID from code (simplified)
      const referrerId = `user_${referralCode.slice(4, 8)}`;

      const referral: ReferralProgram = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        referrerId,
        refereeId,
        status: 'pending',
        referralCode,
        rewards: {
          referrer: { points: 1000, bonus: 'referral_master_badge' },
          referee: { points: 500, bonus: 'welcome_bonus' }
        },
        qualificationCriteria: {
          subscriptionRequired: true,
          minimumUsageDays: 7
        },
        createdAt: new Date().toISOString()
      };

      this.referralPrograms.push(referral);
      
      // Award immediate referee bonus
      await this.awardPoints(refereeId, 250, 'referral_signup', 'Welcome bonus for joining through referral');

      await this.saveLoyaltyData();

      return { success: true, message: 'Referral processed successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to process referral' };
    }
  }

  // Helper methods
  private async createUserLoyaltyProfile(userId: string): Promise<LoyaltyPoints> {
    const userPoints: LoyaltyPoints = {
      userId,
      totalPoints: 0,
      availablePoints: 0,
      lifetimePoints: 0,
      currentTier: this.loyaltyTiers[0], // Start with first tier
      pointsToNextTier: this.loyaltyTiers[1].minimumPoints,
      lastUpdated: new Date().toISOString()
    };

    this.loyaltyPoints.set(userId, userPoints);
    return userPoints;
  }

  private calculateUserTier(lifetimePoints: number): LoyaltyTier {
    for (let i = this.loyaltyTiers.length - 1; i >= 0; i--) {
      if (lifetimePoints >= this.loyaltyTiers[i].minimumPoints) {
        return this.loyaltyTiers[i];
      }
    }
    return this.loyaltyTiers[0];
  }

  private async upgradeTier(userId: string, newTier: LoyaltyTier): Promise<void> {
    // Send tier upgrade notification
    await notificationService.sendRaceNotification({
      id: `tier_upgrade_${userId}`,
      type: 'results_posted',
      raceId: 'loyalty',
      title: `🎉 Tier Upgrade! ${newTier.icon}`,
      message: `Congratulations! You've been promoted to ${newTier.name}. Enjoy your new benefits!`,
      scheduledTime: new Date().toISOString(),
      requiresSubscription: false
    });

    // Award tier upgrade bonus
    await this.awardPoints(userId, 500, 'tier_upgrade', `Bonus for reaching ${newTier.name} tier`);
  }

  private async updateChallengeProgress(userId: string, source: string, points: number): Promise<void> {
    // Update challenge progress based on activity source
    for (const challenge of this.seasonalChallenges) {
      if (!challenge.isActive) continue;

      for (const requirement of challenge.requirements) {
        if (this.isActivityMatchingRequirement(source, requirement.type)) {
          // Check if user has completed this challenge
          const userProgress = await this.getChallengeProgress(userId, challenge.id);
          // Implementation would track progress and award completion rewards
        }
      }
    }
  }

  private isActivityMatchingRequirement(source: string, requirementType: ChallengeRequirement['type']): boolean {
    const mapping: Record<ChallengeRequirement['type'], string[]> = {
      'weather_checks': ['weather_check', 'marine_forecast', 'wind_analysis'],
      'races_logged': ['race_completion', 'sailing_session', 'regatta_participation'],
      'social_connections': ['connection_made', 'crew_invitation', 'club_join'],
      'forum_posts': ['forum_post', 'comment_made', 'discussion_started'],
      'achievements_unlocked': ['achievement_earned', 'milestone_reached', 'badge_unlocked']
    };

    return mapping[requirementType]?.includes(source) || false;
  }

  private async getChallengeProgress(userId: string, challengeId: string): Promise<any> {
    // Implementation would track individual user progress on challenges
    return {};
  }

  private async processReward(redemption: LoyaltyRedemption, reward: SailingReward): Promise<void> {
    // Implementation would integrate with external reward fulfillment systems
    setTimeout(async () => {
      redemption.status = 'completed';
      redemption.completedAt = new Date().toISOString();
      await this.saveLoyaltyData();
    }, 2000);
  }

  private generateRedemptionCode(): string {
    return `RDM${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  // Public getters
  getUserLoyaltyPoints(userId: string): LoyaltyPoints | null {
    return this.loyaltyPoints.get(userId) || null;
  }

  getAvailableRewards(userTier?: string): SailingReward[] {
    return this.sailingRewards.filter(reward => {
      if (userTier) {
        const requiredTier = this.loyaltyTiers.find(t => t.id === reward.eligibility.minimumTier);
        const currentTier = this.loyaltyTiers.find(t => t.id === userTier);
        return currentTier && requiredTier && currentTier.minimumPoints >= requiredTier.minimumPoints;
      }
      return true;
    });
  }

  getActiveSeasonalChallenges(): SeasonalChallenge[] {
    return this.seasonalChallenges.filter(challenge => 
      challenge.isActive && 
      new Date() >= new Date(challenge.startDate) &&
      new Date() <= new Date(challenge.endDate)
    );
  }

  getLoyaltyTiers(): LoyaltyTier[] {
    return [...this.loyaltyTiers];
  }

  getUserTransactions(userId: string): PointsTransaction[] {
    return this.pointsTransactions.filter(t => t.userId === userId);
  }

  // Data persistence
  private async loadLoyaltyData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('loyalty_data');
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed.loyaltyPoints) {
          this.loyaltyPoints = new Map(Object.entries(parsed.loyaltyPoints));
        }
        if (parsed.pointsTransactions) {
          this.pointsTransactions = parsed.pointsTransactions;
        }
        if (parsed.loyaltyRedemptions) {
          this.loyaltyRedemptions = parsed.loyaltyRedemptions;
        }
        if (parsed.referralPrograms) {
          this.referralPrograms = parsed.referralPrograms;
        }
      }
    } catch (error) {
    }
  }

  private async saveLoyaltyData(): Promise<void> {
    try {
      const data = {
        loyaltyPoints: Object.fromEntries(this.loyaltyPoints),
        pointsTransactions: this.pointsTransactions,
        loyaltyRedemptions: this.loyaltyRedemptions,
        referralPrograms: this.referralPrograms
      };
      
      await AsyncStorage.setItem('loyalty_data', JSON.stringify(data));
    } catch (error) {
    }
  }
}

// Export singleton instance
export const loyaltyService = new LoyaltyService();

// Export types
export type {
  LoyaltyPoints,
  LoyaltyTier,
  LoyaltyBenefit,
  PointsTransaction,
  SailingReward,
  SeasonalChallenge,
  ChallengeRequirement,
  LoyaltyRedemption,
  ReferralProgram
};