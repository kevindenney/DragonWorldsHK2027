import AsyncStorage from '@react-native-async-storage/async-storage';
import { weatherManager } from './weatherManager';
import { retentionManager } from './retentionManager';
import { analyticsService } from './analyticsService';
import { subscriptionService, SubscriptionTier } from './subscriptionService';
import { loyaltyService } from './loyaltyService';

// AI Racing Assistant interfaces for Phase 6
export interface RacingInsight {
  id: string;
  type: 'tactical' | 'strategic' | 'weather' | 'performance' | 'equipment' | 'training';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number; // 0-100
  relevanceScore: number; // 0-100
  applicableConditions: WeatherCondition[];
  dataPoints: string[];
  actionItems: ActionItem[];
  validFrom: string;
  validTo: string;
  isPersonalized: boolean;
}

export interface ActionItem {
  id: string;
  description: string;
  category: 'preparation' | 'technique' | 'equipment' | 'strategy';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeToComplete: string;
  prerequisites?: string[];
}

export interface WeatherCondition {
  windSpeedRange: [number, number]; // knots
  windDirectionRange?: [number, number]; // degrees
  waveHeightRange?: [number, number]; // meters
  visibility?: number; // km
  temperature?: [number, number]; // celsius
}

export interface PerformanceAnalysis {
  userId: string;
  analysisDate: string;
  overallScore: number; // 0-100
  categories: {
    startLine: PerformanceCategory;
    upwindTactics: PerformanceCategory;
    markRoundings: PerformanceCategory;
    downwindTactics: PerformanceCategory;
    boatHandling: PerformanceCategory;
    weatherReading: PerformanceCategory;
  };
  trends: PerformanceTrend[];
  recommendations: RacingInsight[];
  nextFocusAreas: string[];
}

export interface PerformanceCategory {
  score: number;
  improvement: number; // Change from last analysis
  strengths: string[];
  weaknesses: string[];
  specificRecommendations: string[];
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'declining';
  changeRate: number;
  timeframe: string;
  dataPoints: { date: string; value: number }[];
}

export interface TacticalRecommendation {
  id: string;
  scenario: RacingScenario;
  recommendation: string;
  reasoning: string;
  confidence: number;
  alternatives: string[];
  riskLevel: 'low' | 'medium' | 'high';
  expectedOutcome: string;
  conditions: WeatherCondition;
}

export interface RacingScenario {
  phase: 'pre_start' | 'start' | 'first_beat' | 'first_reach' | 'second_beat' | 'finish';
  position: 'leading' | 'middle' | 'trailing';
  fleetSize: number;
  weatherConditions: WeatherCondition;
  courseConfiguration: string;
}

export interface TrainingPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  duration: number; // weeks
  focusAreas: string[];
  weeklySchedule: TrainingWeek[];
  progressTracking: ProgressMetric[];
  aiGenerated: boolean;
  createdAt: string;
  isActive: boolean;
}

export interface TrainingWeek {
  weekNumber: number;
  sessions: TrainingSession[];
  goals: string[];
  assessmentCriteria: string[];
}

export interface TrainingSession {
  id: string;
  type: 'on_water' | 'simulator' | 'physical' | 'theory' | 'video_analysis';
  name: string;
  description: string;
  duration: number; // minutes
  objectives: string[];
  equipment: string[];
  conditions: WeatherCondition;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ProgressMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trackingMethod: string;
}

export interface WindPrediction {
  timestamp: string;
  location: { lat: number; lon: number };
  prediction: {
    windSpeed: number;
    windDirection: number;
    confidence: number;
    timeHorizon: number; // minutes ahead
  };
  tacticalImplications: string[];
  recommendedActions: string[];
}

export interface RacePreparationChecklist {
  id: string;
  eventId: string;
  userId: string;
  categories: ChecklistCategory[];
  completionPercentage: number;
  lastUpdated: string;
  aiRecommendations: string[];
  isCustomized: boolean;
}

export interface ChecklistCategory {
  name: string;
  items: ChecklistItem[];
  isComplete: boolean;
  importance: 'essential' | 'recommended' | 'optional';
}

export interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  aiGenerated: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Enhanced Racing Assistant Service for Phase 6
export class RacingAssistantService {
  private userAnalyses: Map<string, PerformanceAnalysis[]> = new Map();
  private tacticalRecommendations: TacticalRecommendation[] = [];
  private trainingPlans: Map<string, TrainingPlan[]> = new Map();
  private windPredictions: WindPrediction[] = [];
  private raceChecklists: Map<string, RacePreparationChecklist[]> = new Map();
  private insightCache: Map<string, RacingInsight[]> = new Map();

  constructor() {
    this.initializeTacticalDatabase();
    this.loadRacingData();
    this.startAIProcessing();
  }

  // Initialize tactical recommendation database
  private initializeTacticalDatabase(): void {
    this.tacticalRecommendations = [
      // Pre-start scenarios
      {
        id: 'prestart_favored_end',
        scenario: {
          phase: 'pre_start',
          position: 'middle',
          fleetSize: 50,
          weatherConditions: {
            windSpeedRange: [8, 15],
            windDirectionRange: [180, 270]
          },
          courseConfiguration: 'windward_leeward'
        },
        recommendation: 'Position yourself near the favored end of the start line with clear air ahead',
        reasoning: 'In moderate conditions with a clear wind shift pattern, the favored end provides the shortest distance to the first mark',
        confidence: 85,
        alternatives: [
          'Start in the middle for tactical flexibility',
          'Use a port tack start if heavily congested on starboard'
        ],
        riskLevel: 'medium',
        expectedOutcome: '10-15% better position at first mark',
        conditions: {
          windSpeedRange: [8, 15],
          windDirectionRange: [180, 270]
        }
      },
      {
        id: 'start_aggressive_acceleration',
        scenario: {
          phase: 'start',
          position: 'middle',
          fleetSize: 30,
          weatherConditions: {
            windSpeedRange: [12, 20],
            waveHeightRange: [0.5, 1.5]
          },
          courseConfiguration: 'triangle'
        },
        recommendation: 'Focus on aggressive acceleration off the line rather than perfect positioning',
        reasoning: 'In stronger wind conditions, boat speed off the line is more critical than exact positioning',
        confidence: 90,
        alternatives: [
          'Conservative start with clean air priority',
          'Pin end start for immediate tack opportunity'
        ],
        riskLevel: 'medium',
        expectedOutcome: 'Top 25% at first cross',
        conditions: {
          windSpeedRange: [12, 20],
          waveHeightRange: [0.5, 1.5]
        }
      },
      // First beat tactics
      {
        id: 'beat_lift_tack',
        scenario: {
          phase: 'first_beat',
          position: 'trailing',
          fleetSize: 40,
          weatherConditions: {
            windSpeedRange: [6, 12],
            windDirectionRange: [170, 190]
          },
          courseConfiguration: 'windward_leeward'
        },
        recommendation: 'Tack on the first significant lift to maximize height gain',
        reasoning: 'In oscillating conditions, sailing lifted angles provides better VMG and positioning options',
        confidence: 80,
        alternatives: [
          'Continue on current tack if in pressure',
          'Tack to match leaders if they shift'
        ],
        riskLevel: 'low',
        expectedOutcome: 'Gain 3-5 boat lengths',
        conditions: {
          windSpeedRange: [6, 12],
          windDirectionRange: [170, 190]
        }
      },
      // Mark rounding tactics
      {
        id: 'windward_mark_inside',
        scenario: {
          phase: 'first_reach',
          position: 'middle',
          fleetSize: 35,
          weatherConditions: {
            windSpeedRange: [10, 18],
            windDirectionRange: [200, 220]
          },
          courseConfiguration: 'triangle'
        },
        recommendation: 'Approach the windward mark wide to maintain inside position for the reach',
        reasoning: 'Wide approach allows for better angle on the reach and avoids congestion at the mark',
        confidence: 75,
        alternatives: [
          'Tight rounding if clearly ahead',
          'Two-boat length circle if behind'
        ],
        riskLevel: 'low',
        expectedOutcome: 'Maintain or gain 1-2 positions',
        conditions: {
          windSpeedRange: [10, 18],
          windDirectionRange: [200, 220]
        }
      }
    ];
  }

  // Analyze user performance and generate insights
  async analyzePerformance(userId: string, raceData?: any): Promise<PerformanceAnalysis> {
    try {
      // Get user's racing history from retention manager
      const userCalendar = retentionManager.getRacingCalendar(userId);
      const completedRaces = userCalendar?.events.filter(e => e.status === 'completed') || [];

      // Calculate performance scores
      const performanceAnalysis: PerformanceAnalysis = {
        userId,
        analysisDate: new Date().toISOString(),
        overallScore: await this.calculateOverallScore(userId, completedRaces),
        categories: {
          startLine: await this.analyzeStartLinePerformance(userId, completedRaces),
          upwindTactics: await this.analyzeUpwindPerformance(userId, completedRaces),
          markRoundings: await this.analyzeMarkRoundingPerformance(userId, completedRaces),
          downwindTactics: await this.analyzeDownwindPerformance(userId, completedRaces),
          boatHandling: await this.analyzeBoatHandlingPerformance(userId, completedRaces),
          weatherReading: await this.analyzeWeatherReadingPerformance(userId, completedRaces)
        },
        trends: await this.calculatePerformanceTrends(userId, completedRaces),
        recommendations: await this.generatePersonalizedInsights(userId, completedRaces),
        nextFocusAreas: []
      };

      // Determine next focus areas based on weakest categories
      const categoryScores = Object.entries(performanceAnalysis.categories)
        .map(([name, category]) => ({ name, score: category.score }))
        .sort((a, b) => a.score - b.score);

      performanceAnalysis.nextFocusAreas = categoryScores
        .slice(0, 2)
        .map(category => category.name);

      // Cache the analysis
      let userAnalyses = this.userAnalyses.get(userId) || [];
      userAnalyses.unshift(performanceAnalysis);
      if (userAnalyses.length > 10) {
        userAnalyses = userAnalyses.slice(0, 10); // Keep last 10 analyses
      }
      this.userAnalyses.set(userId, userAnalyses);

      await this.saveRacingData();

      // Track analytics
      await analyticsService.trackEvent('racing_assistant_analysis', {
        user_id: userId,
        overall_score: performanceAnalysis.overallScore,
        focus_areas: performanceAnalysis.nextFocusAreas,
        recommendations_count: performanceAnalysis.recommendations.length
      });

      // Award loyalty points for using AI insights
      await loyaltyService.awardPoints(
        userId,
        100,
        'ai_analysis',
        'Used AI racing performance analysis'
      );

      return performanceAnalysis;

    } catch (error) {
      throw new Error('Performance analysis failed');
    }
  }

  // Generate tactical recommendations for current conditions
  async getTacticalRecommendations(
    userId: string,
    currentConditions: WeatherCondition,
    racePhase: RacingScenario['phase'],
    position: RacingScenario['position']
  ): Promise<TacticalRecommendation[]> {
    try {
      const userTier = subscriptionService.getSubscriptionStatus()?.currentTier || 'free';
      
      // Filter recommendations based on subscription tier
      const maxRecommendations = this.getMaxRecommendations(userTier);

      // Find matching tactical recommendations
      const matchingRecommendations = this.tacticalRecommendations.filter(rec => 
        rec.scenario.phase === racePhase &&
        rec.scenario.position === position &&
        this.matchesWeatherConditions(rec.conditions, currentConditions)
      );

      // Sort by confidence and relevance
      matchingRecommendations.sort((a, b) => b.confidence - a.confidence);

      // Limit based on subscription tier
      const limitedRecommendations = matchingRecommendations.slice(0, maxRecommendations);

      // Track analytics
      await analyticsService.trackEvent('tactical_recommendations_requested', {
        user_id: userId,
        race_phase: racePhase,
        position,
        recommendations_count: limitedRecommendations.length,
        subscription_tier: userTier
      });

      return limitedRecommendations;

    } catch (error) {
      return [];
    }
  }

  // Generate personalized training plan
  async generateTrainingPlan(
    userId: string,
    duration: number = 8,
    focusAreas: string[] = []
  ): Promise<TrainingPlan> {
    try {
      // Get user's performance analysis
      const userAnalyses = this.userAnalyses.get(userId) || [];
      const latestAnalysis = userAnalyses[0];

      // Determine focus areas from performance analysis if not provided
      if (focusAreas.length === 0 && latestAnalysis) {
        focusAreas = latestAnalysis.nextFocusAreas;
      }

      // Generate training plan
      const trainingPlan: TrainingPlan = {
        id: `plan_${Date.now()}_${userId}`,
        userId,
        name: `AI-Generated ${duration}-Week Training Plan`,
        description: `Personalized training plan focusing on ${focusAreas.join(', ')}`,
        duration,
        focusAreas,
        weeklySchedule: [],
        progressTracking: this.generateProgressMetrics(focusAreas),
        aiGenerated: true,
        createdAt: new Date().toISOString(),
        isActive: false
      };

      // Generate weekly schedule
      for (let week = 1; week <= duration; week++) {
        const trainingWeek: TrainingWeek = {
          weekNumber: week,
          sessions: await this.generateWeeklyTrainingSessions(week, focusAreas, latestAnalysis),
          goals: this.generateWeeklyGoals(week, focusAreas),
          assessmentCriteria: this.generateAssessmentCriteria(week, focusAreas)
        };
        trainingPlan.weeklySchedule.push(trainingWeek);
      }

      // Save training plan
      let userPlans = this.trainingPlans.get(userId) || [];
      userPlans.unshift(trainingPlan);
      this.trainingPlans.set(userId, userPlans);

      await this.saveRacingData();

      // Track analytics
      await analyticsService.trackEvent('ai_training_plan_generated', {
        user_id: userId,
        duration,
        focus_areas: focusAreas,
        sessions_count: trainingPlan.weeklySchedule.reduce((total, week) => total + week.sessions.length, 0)
      });

      return trainingPlan;

    } catch (error) {
      throw new Error('Training plan generation failed');
    }
  }

  // Generate wind predictions and tactical implications
  async getWindPredictions(
    location: { lat: number; lon: number },
    timeHorizon: number = 60
  ): Promise<WindPrediction[]> {
    try {
      // Get weather data from weather manager
      const weatherData = await weatherManager.updateWeatherData({ location });
      
      const predictions: WindPrediction[] = [];

      // Generate predictions for next few hours
      for (let i = 15; i <= timeHorizon; i += 15) {
        const prediction: WindPrediction = {
          timestamp: new Date(Date.now() + i * 60 * 1000).toISOString(),
          location,
          prediction: {
            windSpeed: this.predictWindSpeed(weatherData.current.windSpeed, i),
            windDirection: this.predictWindDirection(weatherData.current.windDirection, i),
            confidence: Math.max(90 - i / 4, 40), // Confidence decreases with time
            timeHorizon: i
          },
          tacticalImplications: this.generateTacticalImplications(weatherData, i),
          recommendedActions: this.generateRecommendedActions(weatherData, i)
        };
        predictions.push(prediction);
      }

      this.windPredictions = predictions;
      return predictions;

    } catch (error) {
      return [];
    }
  }

  // Generate race preparation checklist
  async generateRaceChecklist(
    userId: string,
    eventId: string,
    raceType: string = 'fleet_race'
  ): Promise<RacePreparationChecklist> {
    try {
      const checklist: RacePreparationChecklist = {
        id: `checklist_${Date.now()}_${userId}`,
        eventId,
        userId,
        categories: [
          {
            name: 'Boat Preparation',
            importance: 'essential',
            isComplete: false,
            items: [
              {
                id: 'hull_check',
                description: 'Inspect hull for damage and clean if necessary',
                isCompleted: false,
                aiGenerated: true,
                difficulty: 'easy'
              },
              {
                id: 'sail_inspection',
                description: 'Check sails for wear, proper attachment, and optimal trim settings',
                isCompleted: false,
                aiGenerated: true,
                difficulty: 'medium'
              },
              {
                id: 'rigging_check',
                description: 'Inspect rigging tension, cleats, and control lines',
                isCompleted: false,
                aiGenerated: true,
                difficulty: 'medium'
              }
            ]
          },
          {
            name: 'Weather Analysis',
            importance: 'essential',
            isComplete: false,
            items: [
              {
                id: 'forecast_review',
                description: 'Study detailed weather forecast for race period',
                isCompleted: false,
                aiGenerated: true,
                difficulty: 'medium'
              },
              {
                id: 'wind_patterns',
                description: 'Analyze expected wind patterns and shifts',
                isCompleted: false,
                aiGenerated: true,
                difficulty: 'hard'
              },
              {
                id: 'current_conditions',
                description: 'Assess current conditions and trends',
                isCompleted: false,
                aiGenerated: true,
                difficulty: 'easy'
              }
            ]
          },
          {
            name: 'Tactical Planning',
            importance: 'recommended',
            isComplete: false,
            items: [
              {
                id: 'course_study',
                description: 'Study course layout and mark positions',
                isCompleted: false,
                aiGenerated: true,
                difficulty: 'medium'
              },
              {
                id: 'strategy_planning',
                description: 'Plan start line strategy and first beat tactics',
                isCompleted: false,
                aiGenerated: true,
                difficulty: 'hard'
              },
              {
                id: 'competitor_analysis',
                description: 'Review key competitors and their typical strategies',
                isCompleted: false,
                aiGenerated: true,
                difficulty: 'medium'
              }
            ]
          }
        ],
        completionPercentage: 0,
        lastUpdated: new Date().toISOString(),
        aiRecommendations: [
          'Focus on weather analysis - conditions expected to be challenging',
          'Pay special attention to rigging - stronger winds predicted',
          'Consider conservative start strategy given fleet size'
        ],
        isCustomized: false
      };

      // Save checklist
      let userChecklists = this.raceChecklists.get(userId) || [];
      userChecklists.unshift(checklist);
      this.raceChecklists.set(userId, userChecklists);

      await this.saveRacingData();

      return checklist;

    } catch (error) {
      throw new Error('Race checklist generation failed');
    }
  }

  // Get personalized racing insights
  async getPersonalizedInsights(userId: string): Promise<RacingInsight[]> {
    try {
      // Check cache first
      const cached = this.insightCache.get(userId);
      if (cached && cached.length > 0) {
        return cached;
      }

      // Generate new insights
      const insights: RacingInsight[] = [];
      const userAnalyses = this.userAnalyses.get(userId) || [];
      const latestAnalysis = userAnalyses[0];

      if (latestAnalysis) {
        // Generate insights based on performance analysis
        insights.push(...await this.generateInsightsFromAnalysis(latestAnalysis));
      }

      // Add weather-based insights
      insights.push(...await this.generateWeatherInsights());

      // Add tactical insights
      insights.push(...await this.generateTacticalInsights());

      // Sort by relevance and priority
      insights.sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.relevanceScore - a.relevanceScore;
      });

      // Cache insights
      this.insightCache.set(userId, insights.slice(0, 10));

      // Track analytics
      await analyticsService.trackEvent('racing_insights_generated', {
        user_id: userId,
        insights_count: insights.length,
        high_priority_count: insights.filter(i => i.priority === 'high' || i.priority === 'critical').length
      });

      return insights.slice(0, 10);

    } catch (error) {
      return [];
    }
  }

  // Helper methods for performance analysis
  private async calculateOverallScore(userId: string, races: any[]): Promise<number> {
    if (races.length === 0) return 50; // Default score for new users

    let totalScore = 0;
    let raceCount = 0;

    races.forEach(race => {
      if (race.results?.position) {
        // Mock calculation based on position (would use actual race data)
        const positionScore = Math.max(100 - race.results.position * 2, 20);
        totalScore += positionScore;
        raceCount++;
      }
    });

    return raceCount > 0 ? Math.round(totalScore / raceCount) : 50;
  }

  private async analyzeStartLinePerformance(userId: string, races: any[]): Promise<PerformanceCategory> {
    // Mock analysis - would use actual race data and telemetry
    return {
      score: 75,
      improvement: 5,
      strengths: ['Consistent timing', 'Good acceleration'],
      weaknesses: ['Line bias assessment', 'Traffic management'],
      specificRecommendations: [
        'Practice identifying favored end earlier',
        'Work on acceleration drills in traffic',
        'Study wind patterns at start line'
      ]
    };
  }

  private async analyzeUpwindPerformance(userId: string, races: any[]): Promise<PerformanceCategory> {
    return {
      score: 68,
      improvement: -2,
      strengths: ['Good boat speed', 'Consistent pointing'],
      weaknesses: ['Shift recognition', 'Tacking decisions'],
      specificRecommendations: [
        'Practice wind shift exercises',
        'Improve tacking timing and technique',
        'Study weather patterns more carefully'
      ]
    };
  }

  private async analyzeMarkRoundingPerformance(userId: string, races: any[]): Promise<PerformanceCategory> {
    return {
      score: 82,
      improvement: 8,
      strengths: ['Clean roundings', 'Good positioning'],
      weaknesses: ['Approach timing', 'Traffic anticipation'],
      specificRecommendations: [
        'Work on approach angles in different conditions',
        'Practice mark rounding in fleet situations'
      ]
    };
  }

  private async analyzeDownwindPerformance(userId: string, races: any[]): Promise<PerformanceCategory> {
    return {
      score: 71,
      improvement: 3,
      strengths: ['Good jibing technique', 'Wave riding'],
      weaknesses: ['Pressure hunting', 'Angle optimization'],
      specificRecommendations: [
        'Practice pressure identification exercises',
        'Work on optimal downwind angles',
        'Improve jibe timing in waves'
      ]
    };
  }

  private async analyzeBoatHandlingPerformance(userId: string, races: any[]): Promise<PerformanceCategory> {
    return {
      score: 79,
      improvement: 6,
      strengths: ['Smooth tacking', 'Good trim'],
      weaknesses: ['Heavy air technique', 'Crew coordination'],
      specificRecommendations: [
        'Practice heavy air boat handling',
        'Work on crew communication',
        'Focus on depowering techniques'
      ]
    };
  }

  private async analyzeWeatherReadingPerformance(userId: string, races: any[]): Promise<PerformanceCategory> {
    return {
      score: 65,
      improvement: 1,
      strengths: ['Basic pattern recognition', 'Pressure awareness'],
      weaknesses: ['Shift timing', 'Long-term planning'],
      specificRecommendations: [
        'Study meteorology fundamentals',
        'Practice forecasting exercises',
        'Learn to read cloud formations and water surface'
      ]
    };
  }

  // Additional helper methods
  private async calculatePerformanceTrends(userId: string, races: any[]): Promise<PerformanceTrend[]> {
    // Mock trend calculation
    return [
      {
        metric: 'Start Line Performance',
        direction: 'improving',
        changeRate: 5.2,
        timeframe: '3 months',
        dataPoints: races.slice(0, 5).map((race, index) => ({
          date: race.startDate,
          value: 70 + index * 2
        }))
      }
    ];
  }

  private async generatePersonalizedInsights(userId: string, races: any[]): Promise<RacingInsight[]> {
    const insights: RacingInsight[] = [
      {
        id: 'start_line_improvement',
        type: 'tactical',
        priority: 'high',
        title: 'Start Line Strategy Enhancement',
        description: 'Your recent races show opportunities to improve start line positioning and timing',
        confidence: 85,
        relevanceScore: 90,
        applicableConditions: [{ windSpeedRange: [8, 20] }],
        dataPoints: ['Last 5 races', 'Start line timing', 'Position analysis'],
        actionItems: [
          {
            id: 'start_practice',
            description: 'Practice start line approaches in different wind conditions',
            category: 'technique',
            effort: 'medium',
            impact: 'high',
            timeToComplete: '2 weeks',
            prerequisites: ['Basic boat handling skills']
          }
        ],
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isPersonalized: true
      }
    ];

    return insights;
  }

  // Weather and tactical prediction methods
  private predictWindSpeed(currentSpeed: number, minutesAhead: number): number {
    // Simple prediction model - would use ML in production
    const variation = Math.sin(minutesAhead / 30) * 2;
    return Math.max(0, currentSpeed + variation);
  }

  private predictWindDirection(currentDirection: number, minutesAhead: number): number {
    // Simple oscillation model
    const shift = Math.sin(minutesAhead / 20) * 10;
    return (currentDirection + shift + 360) % 360;
  }

  private generateTacticalImplications(weatherData: any, timeHorizon: number): string[] {
    const implications: string[] = [];

    if (timeHorizon <= 30) {
      implications.push('Consider tacking on next shift');
      implications.push('Watch for pressure changes on water surface');
    } else {
      implications.push('Plan for potential wind direction changes');
      implications.push('Consider longer-term strategic positioning');
    }

    return implications;
  }

  private generateRecommendedActions(weatherData: any, timeHorizon: number): string[] {
    return [
      'Monitor wind angle changes',
      'Prepare for sail trim adjustments',
      'Watch competitor movements'
    ];
  }

  // Training plan generation methods
  private async generateWeeklyTrainingSessions(
    week: number,
    focusAreas: string[],
    analysis: PerformanceAnalysis | undefined
  ): Promise<TrainingSession[]> {
    const sessions: TrainingSession[] = [];

    // Base sessions for all weeks
    sessions.push({
      id: `session_${week}_1`,
      type: 'on_water',
      name: 'Boat Handling Fundamentals',
      description: 'Focus on tacking, jibing, and boat speed optimization',
      duration: 120,
      objectives: ['Improve tacking efficiency', 'Optimize boat trim', 'Practice mark roundings'],
      equipment: ['Dragon boat', 'Full sail inventory'],
      conditions: { windSpeedRange: [8, 15] },
      difficulty: week <= 2 ? 'intermediate' : 'advanced'
    });

    // Add focus area specific sessions
    if (focusAreas.includes('startLine')) {
      sessions.push({
        id: `session_${week}_start`,
        type: 'on_water',
        name: 'Start Line Mastery',
        description: 'Practice start line approaches and timing',
        duration: 90,
        objectives: ['Perfect start timing', 'Line bias identification', 'Traffic management'],
        equipment: ['Practice boats', 'Start line setup'],
        conditions: { windSpeedRange: [6, 20] },
        difficulty: 'advanced'
      });
    }

    return sessions;
  }

  private generateWeeklyGoals(week: number, focusAreas: string[]): string[] {
    const goals = [`Week ${week}: Fundamental skills development`];
    
    if (focusAreas.includes('weatherReading')) {
      goals.push('Improve weather pattern recognition');
    }
    
    if (focusAreas.includes('boatHandling')) {
      goals.push('Enhance boat handling precision');
    }

    return goals;
  }

  private generateAssessmentCriteria(week: number, focusAreas: string[]): string[] {
    return [
      'Technique execution quality',
      'Consistency across conditions',
      'Decision-making speed and accuracy'
    ];
  }

  private generateProgressMetrics(focusAreas: string[]): ProgressMetric[] {
    const metrics: ProgressMetric[] = [
      {
        name: 'Overall Performance Score',
        currentValue: 0,
        targetValue: 85,
        unit: 'points',
        trackingMethod: 'Race results analysis'
      }
    ];

    if (focusAreas.includes('startLine')) {
      metrics.push({
        name: 'Start Line Position',
        currentValue: 0,
        targetValue: 3,
        unit: 'average position',
        trackingMethod: 'Video analysis'
      });
    }

    return metrics;
  }

  // Insight generation methods
  private async generateInsightsFromAnalysis(analysis: PerformanceAnalysis): Promise<RacingInsight[]> {
    const insights: RacingInsight[] = [];

    // Find weakest category
    const weakestCategory = Object.entries(analysis.categories)
      .sort((a, b) => a[1].score - b[1].score)[0];

    insights.push({
      id: `improvement_${weakestCategory[0]}`,
      type: 'performance',
      priority: 'high',
      title: `${weakestCategory[0]} Improvement Opportunity`,
      description: `Your ${weakestCategory[0]} performance (${weakestCategory[1].score}/100) shows room for improvement`,
      confidence: 90,
      relevanceScore: 95,
      applicableConditions: [{ windSpeedRange: [0, 50] }],
      dataPoints: ['Performance analysis', 'Race history'],
      actionItems: weakestCategory[1].specificRecommendations.map((rec, index) => ({
        id: `action_${index}`,
        description: rec,
        category: 'technique',
        effort: 'medium',
        impact: 'high',
        timeToComplete: '1-2 weeks'
      })),
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      isPersonalized: true
    });

    return insights;
  }

  private async generateWeatherInsights(): Promise<RacingInsight[]> {
    // Mock weather-based insights
    return [
      {
        id: 'weather_pattern_insight',
        type: 'weather',
        priority: 'medium',
        title: 'Seasonal Wind Pattern Alert',
        description: 'Current seasonal patterns favor right side of course in afternoon races',
        confidence: 75,
        relevanceScore: 80,
        applicableConditions: [{ windSpeedRange: [10, 18], windDirectionRange: [180, 270] }],
        dataPoints: ['Historical weather data', 'Local patterns'],
        actionItems: [
          {
            id: 'weather_study',
            description: 'Study local wind patterns for next 2 weeks',
            category: 'strategy',
            effort: 'low',
            impact: 'medium',
            timeToComplete: '1 week'
          }
        ],
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        isPersonalized: false
      }
    ];
  }

  private async generateTacticalInsights(): Promise<RacingInsight[]> {
    return [
      {
        id: 'tactical_trend_insight',
        type: 'tactical',
        priority: 'medium',
        title: 'Fleet Behavior Analysis',
        description: 'Most competitors favor starboard tack starts - consider port tack opportunity',
        confidence: 70,
        relevanceScore: 85,
        applicableConditions: [{ windSpeedRange: [8, 16] }],
        dataPoints: ['Fleet behavior analysis', 'Start line statistics'],
        actionItems: [
          {
            id: 'port_tack_practice',
            description: 'Practice port tack starts in training',
            category: 'technique',
            effort: 'medium',
            impact: 'high',
            timeToComplete: '2 weeks'
          }
        ],
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        isPersonalized: false
      }
    ];
  }

  // Utility methods
  private matchesWeatherConditions(required: WeatherCondition, actual: WeatherCondition): boolean {
    // Check wind speed range
    const actualWindSpeed = (actual.windSpeedRange[0] + actual.windSpeedRange[1]) / 2;
    const requiredWindSpeed = (required.windSpeedRange[0] + required.windSpeedRange[1]) / 2;
    
    return Math.abs(actualWindSpeed - requiredWindSpeed) <= 5; // 5 knot tolerance
  }

  private getMaxRecommendations(tier: SubscriptionTier): number {
    switch (tier) {
      case 'elite': return 10;
      case 'professional': return 6;
      case 'basic': return 3;
      case 'free': return 1;
      default: return 1;
    }
  }

  // AI processing initialization
  private startAIProcessing(): void {
    // Update insights cache every 2 hours
    setInterval(() => {
      this.updateInsightsCache();
    }, 2 * 60 * 60 * 1000);

    // Process performance analytics daily
    setInterval(() => {
      this.processPerformanceAnalytics();
    }, 24 * 60 * 60 * 1000);
  }

  private async updateInsightsCache(): Promise<void> {
    // Clear cache to force regeneration
    this.insightCache.clear();
  }

  private async processPerformanceAnalytics(): Promise<void> {
    // Process analytics for all users (would be done server-side in production)
  }

  // Data persistence
  private async loadRacingData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('racing_assistant_data');
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed.userAnalyses) {
          this.userAnalyses = new Map(Object.entries(parsed.userAnalyses));
        }
        if (parsed.trainingPlans) {
          this.trainingPlans = new Map(Object.entries(parsed.trainingPlans));
        }
        if (parsed.raceChecklists) {
          this.raceChecklists = new Map(Object.entries(parsed.raceChecklists));
        }
      }
    } catch (error) {
    }
  }

  private async saveRacingData(): Promise<void> {
    try {
      const data = {
        userAnalyses: Object.fromEntries(this.userAnalyses),
        trainingPlans: Object.fromEntries(this.trainingPlans),
        raceChecklists: Object.fromEntries(this.raceChecklists)
      };
      
      await AsyncStorage.setItem('racing_assistant_data', JSON.stringify(data));
    } catch (error) {
    }
  }

  // Public getters
  getUserAnalyses(userId: string): PerformanceAnalysis[] {
    return this.userAnalyses.get(userId) || [];
  }

  getUserTrainingPlans(userId: string): TrainingPlan[] {
    return this.trainingPlans.get(userId) || [];
  }

  getUserChecklists(userId: string): RacePreparationChecklist[] {
    return this.raceChecklists.get(userId) || [];
  }

  getLatestWindPredictions(): WindPrediction[] {
    return this.windPredictions;
  }
}

// Export singleton instance
export const racingAssistantService = new RacingAssistantService();

// Export types
export type {
  RacingInsight,
  ActionItem,
  WeatherCondition,
  PerformanceAnalysis,
  PerformanceCategory,
  PerformanceTrend,
  TacticalRecommendation,
  RacingScenario,
  TrainingPlan,
  TrainingWeek,
  TrainingSession,
  WindPrediction,
  RacePreparationChecklist,
  ChecklistCategory,
  ChecklistItem
};