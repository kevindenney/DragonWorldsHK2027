import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from './analyticsService';
import { subscriptionService, SubscriptionTier } from './subscriptionService';

// A/B Testing interfaces for Phase 6
export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  objective: 'conversion_rate' | 'engagement' | 'retention' | 'revenue' | 'user_acquisition';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  targetMetric: string;
  variants: ABVariant[];
  trafficAllocation: number; // 0-100 percentage of users to include
  segmentation: TestSegmentation;
  statisticalSettings: StatisticalSettings;
  results?: TestResults;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  trafficSplit: number; // 0-100 percentage within test
  configuration: VariantConfiguration;
  metrics: VariantMetrics;
  screenshot?: string;
}

export interface VariantConfiguration {
  type: 'ui_change' | 'feature_toggle' | 'content_change' | 'flow_change' | 'pricing_change';
  changes: ConfigurationChange[];
  targeting?: VariantTargeting;
}

export interface ConfigurationChange {
  component: string;
  property: string;
  value: any;
  description: string;
}

export interface VariantTargeting {
  userTypes: string[];
  subscriptionTiers: SubscriptionTier[];
  regions: string[];
  deviceTypes: ('ios' | 'android' | 'web')[];
  customAttributes: Record<string, any>;
}

export interface VariantMetrics {
  impressions: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  engagement: {
    clickThroughRate: number;
    timeSpent: number;
    bounceRate: number;
    completionRate: number;
  };
  userFeedback: {
    positiveResponses: number;
    negativeResponses: number;
    averageRating: number;
  };
}

export interface TestSegmentation {
  includeUsers: UserSegment[];
  excludeUsers: UserSegment[];
  sampleSize: number;
  minimumDuration: number; // days
  maximumDuration: number; // days
}

export interface UserSegment {
  criteria: 'subscription_tier' | 'user_type' | 'sailing_experience' | 'region' | 'device_type' | 'app_version' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  values: any[];
  description: string;
}

export interface StatisticalSettings {
  confidenceLevel: number; // 95, 99, etc.
  minimumDetectableEffect: number; // percentage
  statisticalPower: number; // 0.8, 0.9, etc.
  testType: 'two_tailed' | 'one_tailed';
  multipleComparisonsCorrection: boolean;
  sequentialTesting: boolean;
}

export interface TestResults {
  status: 'running' | 'completed' | 'inconclusive' | 'stopped_early';
  winner?: string; // variant ID
  confidence: number;
  pValue: number;
  effectSize: number;
  statisticalSignificance: boolean;
  practicalSignificance: boolean;
  summary: ResultsSummary;
  variantComparisons: VariantComparison[];
  recommendations: string[];
  generatedAt: string;
}

export interface ResultsSummary {
  testDuration: number; // days
  totalParticipants: number;
  totalConversions: number;
  overallConversionRate: number;
  revenueImpact: number;
  keyInsights: string[];
}

export interface VariantComparison {
  variantA: string;
  variantB: string;
  metric: string;
  difference: number; // percentage difference
  confidenceInterval: [number, number];
  significance: boolean;
}

export interface TestParticipation {
  userId: string;
  testId: string;
  variantId: string;
  enrolledAt: string;
  firstExposure: string;
  lastExposure?: string;
  converted: boolean;
  conversionDate?: string;
  conversionValue?: number;
  exposureCount: number;
  metadata?: Record<string, any>;
}

export interface ConversionEvent {
  id: string;
  userId: string;
  testId: string;
  variantId: string;
  eventType: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp: string;
}

export interface TestTemplate {
  id: string;
  name: string;
  category: 'onboarding' | 'subscription' | 'engagement' | 'retention' | 'monetization';
  description: string;
  variants: Partial<ABVariant>[];
  defaultSettings: Partial<ABTest>;
  tags: string[];
}

export interface TestingStrategy {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  testQueue: string[]; // test IDs in execution order
  schedule: {
    concurrent: boolean;
    maxConcurrentTests: number;
    testDuration: number;
    cooldownPeriod: number;
  };
  successCriteria: SuccessCriteria[];
}

export interface SuccessCriteria {
  metric: string;
  target: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
  description: string;
}

// Enhanced A/B Testing Service for Phase 6
export class ABTestingService {
  private activeTests: Map<string, ABTest> = new Map();
  private testParticipants: Map<string, TestParticipation[]> = new Map();
  private conversionEvents: ConversionEvent[] = [];
  private testTemplates: TestTemplate[] = [];
  private testingStrategies: TestingStrategy[] = [];
  private userVariantCache: Map<string, Map<string, string>> = new Map();

  constructor() {
    this.initializeTestTemplates();
    this.initializeTestingStrategies();
    this.loadABTestData();
    this.startTestProcessing();
  }

  // Initialize test templates
  private initializeTestTemplates(): void {
    this.testTemplates = [
      {
        id: 'subscription_paywall_v1',
        name: 'Subscription Paywall Optimization',
        category: 'subscription',
        description: 'Test different paywall presentations to improve conversion',
        variants: [
          {
            name: 'Current Paywall',
            description: 'Existing subscription modal design',
            isControl: true,
            trafficSplit: 50,
            configuration: {
              type: 'ui_change',
              changes: [
                {
                  component: 'SubscriptionModal',
                  property: 'design',
                  value: 'current',
                  description: 'Current modal design'
                }
              ]
            }
          },
          {
            name: 'Value-Focused Paywall',
            description: 'Emphasizes value proposition and savings',
            isControl: false,
            trafficSplit: 50,
            configuration: {
              type: 'ui_change',
              changes: [
                {
                  component: 'SubscriptionModal',
                  property: 'design',
                  value: 'value_focused',
                  description: 'Highlight savings and value proposition'
                },
                {
                  component: 'SubscriptionModal',
                  property: 'pricing_display',
                  value: 'annual_emphasis',
                  description: 'Emphasize annual savings'
                }
              ]
            }
          }
        ],
        defaultSettings: {
          objective: 'conversion_rate',
          targetMetric: 'subscription_conversion',
          trafficAllocation: 100,
          statisticalSettings: {
            confidenceLevel: 95,
            minimumDetectableEffect: 10,
            statisticalPower: 0.8,
            testType: 'two_tailed',
            multipleComparisonsCorrection: false,
            sequentialTesting: true
          }
        },
        tags: ['subscription', 'paywall', 'conversion', 'ui']
      },
      {
        id: 'onboarding_flow_v1',
        name: 'Onboarding Flow Optimization',
        category: 'onboarding',
        description: 'Test simplified vs. detailed onboarding flow',
        variants: [
          {
            name: 'Standard Onboarding',
            description: 'Current multi-step onboarding',
            isControl: true,
            trafficSplit: 50
          },
          {
            name: 'Simplified Onboarding',
            description: 'Streamlined 3-step onboarding',
            isControl: false,
            trafficSplit: 50
          }
        ],
        defaultSettings: {
          objective: 'engagement',
          targetMetric: 'onboarding_completion'
        },
        tags: ['onboarding', 'user_experience', 'engagement']
      },
      {
        id: 'weather_feature_prominence_v1',
        name: 'Weather Feature Prominence',
        category: 'engagement',
        description: 'Test different ways to highlight weather features',
        variants: [
          {
            name: 'Current Layout',
            description: 'Standard weather widget placement',
            isControl: true,
            trafficSplit: 33
          },
          {
            name: 'Prominent Weather',
            description: 'Larger weather widget with animations',
            isControl: false,
            trafficSplit: 33
          },
          {
            name: 'Weather-First Design',
            description: 'Weather as primary screen element',
            isControl: false,
            trafficSplit: 34
          }
        ],
        defaultSettings: {
          objective: 'engagement',
          targetMetric: 'weather_engagement'
        },
        tags: ['weather', 'engagement', 'ui', 'feature_discovery']
      },
      {
        id: 'loyalty_program_intro_v1',
        name: 'Loyalty Program Introduction',
        category: 'retention',
        description: 'Test different ways to introduce loyalty program',
        variants: [
          {
            name: 'Modal Introduction',
            description: 'Full-screen modal explaining benefits',
            isControl: true,
            trafficSplit: 50
          },
          {
            name: 'Progressive Introduction',
            description: 'Gradual introduction through tooltips',
            isControl: false,
            trafficSplit: 50
          }
        ],
        defaultSettings: {
          objective: 'engagement',
          targetMetric: 'loyalty_program_adoption'
        },
        tags: ['loyalty', 'retention', 'gamification']
      }
    ];
  }

  // Initialize testing strategies
  private initializeTestingStrategies(): void {
    this.testingStrategies = [
      {
        id: 'conversion_optimization_q1',
        name: 'Q1 Conversion Optimization Strategy',
        description: 'Focus on subscription conversion and user acquisition',
        priority: 'high',
        testQueue: ['subscription_paywall_v1', 'onboarding_flow_v1'],
        schedule: {
          concurrent: false,
          maxConcurrentTests: 1,
          testDuration: 14,
          cooldownPeriod: 3
        },
        successCriteria: [
          {
            metric: 'conversion_rate',
            target: 15,
            comparison: 'greater_than',
            description: 'Achieve >15% subscription conversion rate'
          },
          {
            metric: 'user_acquisition_cost',
            target: 50,
            comparison: 'less_than',
            description: 'Reduce user acquisition cost to <$50'
          }
        ]
      },
      {
        id: 'engagement_boost_strategy',
        name: 'User Engagement Enhancement',
        description: 'Increase daily and weekly active users through feature optimization',
        priority: 'medium',
        testQueue: ['weather_feature_prominence_v1', 'loyalty_program_intro_v1'],
        schedule: {
          concurrent: true,
          maxConcurrentTests: 2,
          testDuration: 21,
          cooldownPeriod: 7
        },
        successCriteria: [
          {
            metric: 'daily_active_users',
            target: 25,
            comparison: 'greater_than',
            description: 'Increase DAU by 25%'
          },
          {
            metric: 'session_duration',
            target: 20,
            comparison: 'greater_than',
            description: 'Increase average session duration by 20%'
          }
        ]
      }
    ];
  }

  // Create and launch A/B test
  async createTest(testConfig: Partial<ABTest>): Promise<ABTest> {
    try {
      const test: ABTest = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: testConfig.name || 'Untitled Test',
        description: testConfig.description || '',
        hypothesis: testConfig.hypothesis || '',
        objective: testConfig.objective || 'conversion_rate',
        status: 'draft',
        startDate: testConfig.startDate || new Date().toISOString(),
        endDate: testConfig.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        targetMetric: testConfig.targetMetric || 'conversion',
        variants: testConfig.variants || [],
        trafficAllocation: testConfig.trafficAllocation || 100,
        segmentation: testConfig.segmentation || {
          includeUsers: [],
          excludeUsers: [],
          sampleSize: 1000,
          minimumDuration: 7,
          maximumDuration: 30
        },
        statisticalSettings: testConfig.statisticalSettings || {
          confidenceLevel: 95,
          minimumDetectableEffect: 10,
          statisticalPower: 0.8,
          testType: 'two_tailed',
          multipleComparisonsCorrection: false,
          sequentialTesting: true
        },
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      // Validate test configuration
      this.validateTestConfiguration(test);

      // Initialize variant metrics
      test.variants.forEach(variant => {
        variant.metrics = {
          impressions: 0,
          conversions: 0,
          conversionRate: 0,
          revenue: 0,
          engagement: {
            clickThroughRate: 0,
            timeSpent: 0,
            bounceRate: 0,
            completionRate: 0
          },
          userFeedback: {
            positiveResponses: 0,
            negativeResponses: 0,
            averageRating: 0
          }
        };
      });

      this.activeTests.set(test.id, test);
      await this.saveABTestData();

      // Track analytics
      await analyticsService.trackEvent('ab_test_created', {
        test_id: test.id,
        test_name: test.name,
        objective: test.objective,
        variants_count: test.variants.length,
        traffic_allocation: test.trafficAllocation
      });

      return test;

    } catch (error) {
      console.error('Failed to create A/B test:', error);
      throw new Error('A/B test creation failed');
    }
  }

  // Launch A/B test
  async launchTest(testId: string): Promise<void> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'draft') {
        throw new Error('Test can only be launched from draft status');
      }

      // Final validation before launch
      this.validateTestForLaunch(test);

      // Update test status
      test.status = 'active';
      test.startDate = new Date().toISOString();
      test.lastModified = new Date().toISOString();

      await this.saveABTestData();

      // Track analytics
      await analyticsService.trackEvent('ab_test_launched', {
        test_id: test.id,
        test_name: test.name,
        start_date: test.startDate,
        expected_end_date: test.endDate
      });

      console.log(`A/B test "${test.name}" launched successfully`);

    } catch (error) {
      console.error('Failed to launch A/B test:', error);
      throw error;
    }
  }

  // Get user's test variant
  async getUserVariant(userId: string, testId: string): Promise<string | null> {
    try {
      // Check cache first
      const userCache = this.userVariantCache.get(userId);
      if (userCache && userCache.has(testId)) {
        return userCache.get(testId) || null;
      }

      const test = this.activeTests.get(testId);
      if (!test || test.status !== 'active') {
        return null;
      }

      // Check if user is eligible for test
      const isEligible = await this.isUserEligibleForTest(userId, test);
      if (!isEligible) {
        return null;
      }

      // Check if user is already enrolled
      const existingParticipation = await this.getUserTestParticipation(userId, testId);
      if (existingParticipation) {
        this.cacheUserVariant(userId, testId, existingParticipation.variantId);
        return existingParticipation.variantId;
      }

      // Enroll user in test
      const variantId = await this.enrollUserInTest(userId, test);
      if (variantId) {
        this.cacheUserVariant(userId, testId, variantId);
        return variantId;
      }

      return null;

    } catch (error) {
      console.error('Failed to get user variant:', error);
      return null;
    }
  }

  // Track test exposure
  async trackExposure(userId: string, testId: string, variantId: string): Promise<void> {
    try {
      const test = this.activeTests.get(testId);
      if (!test || test.status !== 'active') {
        return;
      }

      const variant = test.variants.find(v => v.id === variantId);
      if (!variant) {
        return;
      }

      // Update variant metrics
      variant.metrics.impressions++;

      // Update user participation
      const participation = await this.getUserTestParticipation(userId, testId);
      if (participation) {
        participation.exposureCount++;
        participation.lastExposure = new Date().toISOString();
      }

      await this.saveABTestData();

      // Track analytics
      await analyticsService.trackEvent('ab_test_exposure', {
        user_id: userId,
        test_id: testId,
        variant_id: variantId,
        test_name: test.name,
        variant_name: variant.name
      });

    } catch (error) {
      console.error('Failed to track test exposure:', error);
    }
  }

  // Track conversion event
  async trackConversion(
    userId: string, 
    testId: string, 
    eventType: string, 
    value?: number,
    properties?: Record<string, any>
  ): Promise<void> {
    try {
      const participation = await this.getUserTestParticipation(userId, testId);
      if (!participation) {
        return;
      }

      const test = this.activeTests.get(testId);
      if (!test || test.status !== 'active') {
        return;
      }

      const variant = test.variants.find(v => v.id === participation.variantId);
      if (!variant) {
        return;
      }

      // Record conversion event
      const conversionEvent: ConversionEvent = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        testId,
        variantId: participation.variantId,
        eventType,
        value,
        properties,
        timestamp: new Date().toISOString()
      };

      this.conversionEvents.push(conversionEvent);

      // Update participation record
      if (!participation.converted) {
        participation.converted = true;
        participation.conversionDate = new Date().toISOString();
        participation.conversionValue = value;

        // Update variant metrics
        variant.metrics.conversions++;
        variant.metrics.conversionRate = variant.metrics.impressions > 0 
          ? (variant.metrics.conversions / variant.metrics.impressions) * 100
          : 0;

        if (value) {
          variant.metrics.revenue += value;
        }
      }

      await this.saveABTestData();

      // Track analytics
      await analyticsService.trackEvent('ab_test_conversion', {
        user_id: userId,
        test_id: testId,
        variant_id: participation.variantId,
        event_type: eventType,
        conversion_value: value,
        test_name: test.name,
        variant_name: variant.name
      });

    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  }

  // Analyze test results
  async analyzeTestResults(testId: string): Promise<TestResults> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const results = await this.calculateTestResults(test);
      
      // Update test with results
      test.results = results;
      test.lastModified = new Date().toISOString();

      await this.saveABTestData();

      // Track analytics
      await analyticsService.trackEvent('ab_test_analyzed', {
        test_id: testId,
        test_name: test.name,
        statistical_significance: results.statisticalSignificance,
        winning_variant: results.winner,
        effect_size: results.effectSize
      });

      return results;

    } catch (error) {
      console.error('Failed to analyze test results:', error);
      throw new Error('Test analysis failed');
    }
  }

  // Stop test early
  async stopTest(testId: string, reason: string): Promise<void> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'active') {
        throw new Error('Only active tests can be stopped');
      }

      // Analyze results before stopping
      const results = await this.analyzeTestResults(testId);
      results.status = 'stopped_early';

      test.status = 'completed';
      test.endDate = new Date().toISOString();
      test.lastModified = new Date().toISOString();

      await this.saveABTestData();

      // Track analytics
      await analyticsService.trackEvent('ab_test_stopped', {
        test_id: testId,
        test_name: test.name,
        reason,
        duration_days: Math.floor((new Date().getTime() - new Date(test.startDate).getTime()) / (24 * 60 * 60 * 1000))
      });

    } catch (error) {
      console.error('Failed to stop test:', error);
      throw error;
    }
  }

  // Helper methods
  private validateTestConfiguration(test: ABTest): void {
    if (test.variants.length < 2) {
      throw new Error('Test must have at least 2 variants');
    }

    const totalTrafficSplit = test.variants.reduce((sum, variant) => sum + variant.trafficSplit, 0);
    if (Math.abs(totalTrafficSplit - 100) > 0.1) {
      throw new Error('Variant traffic splits must sum to 100%');
    }

    const controlVariants = test.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error('Test must have exactly one control variant');
    }
  }

  private validateTestForLaunch(test: ABTest): void {
    if (test.variants.length === 0) {
      throw new Error('Test must have variants configured');
    }

    if (!test.targetMetric) {
      throw new Error('Test must have a target metric defined');
    }

    if (new Date(test.endDate) <= new Date()) {
      throw new Error('Test end date must be in the future');
    }
  }

  private async isUserEligibleForTest(userId: string, test: ABTest): Promise<boolean> {
    try {
      // Check traffic allocation
      const userHash = this.hashUserId(userId, test.id);
      if (userHash > test.trafficAllocation) {
        return false;
      }

      // Check segmentation criteria
      const userProfile = await this.getUserProfile(userId);
      
      // Check inclusion criteria
      for (const segment of test.segmentation.includeUsers) {
        if (!this.evaluateSegmentCriteria(userProfile, segment)) {
          return false;
        }
      }

      // Check exclusion criteria
      for (const segment of test.segmentation.excludeUsers) {
        if (this.evaluateSegmentCriteria(userProfile, segment)) {
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Failed to check user eligibility:', error);
      return false;
    }
  }

  private async enrollUserInTest(userId: string, test: ABTest): Promise<string | null> {
    try {
      // Assign variant based on user hash and traffic splits
      const variantId = this.assignVariant(userId, test);
      
      if (!variantId) {
        return null;
      }

      // Create participation record
      const participation: TestParticipation = {
        userId,
        testId: test.id,
        variantId,
        enrolledAt: new Date().toISOString(),
        firstExposure: new Date().toISOString(),
        converted: false,
        exposureCount: 1
      };

      // Store participation
      let userParticipations = this.testParticipants.get(userId) || [];
      userParticipations.push(participation);
      this.testParticipants.set(userId, userParticipations);

      await this.saveABTestData();

      // Track analytics
      await analyticsService.trackEvent('ab_test_enrollment', {
        user_id: userId,
        test_id: test.id,
        variant_id: variantId,
        test_name: test.name
      });

      return variantId;

    } catch (error) {
      console.error('Failed to enroll user in test:', error);
      return null;
    }
  }

  private assignVariant(userId: string, test: ABTest): string | null {
    const userHash = this.hashUserId(userId, test.id);
    let cumulativeWeight = 0;

    for (const variant of test.variants) {
      cumulativeWeight += variant.trafficSplit;
      if (userHash <= cumulativeWeight) {
        return variant.id;
      }
    }

    return test.variants[0]?.id || null;
  }

  private hashUserId(userId: string, testId: string): number {
    // Simple hash function for consistent variant assignment
    const str = `${userId}_${testId}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) % 100;
  }

  private async getUserTestParticipation(userId: string, testId: string): Promise<TestParticipation | null> {
    const userParticipations = this.testParticipants.get(userId) || [];
    return userParticipations.find(p => p.testId === testId) || null;
  }

  private cacheUserVariant(userId: string, testId: string, variantId: string): void {
    let userCache = this.userVariantCache.get(userId);
    if (!userCache) {
      userCache = new Map();
      this.userVariantCache.set(userId, userCache);
    }
    userCache.set(testId, variantId);
  }

  private async getUserProfile(userId: string): Promise<any> {
    // Mock user profile - would integrate with actual user store
    return {
      subscriptionTier: 'basic',
      userType: 'participant',
      sailingExperience: 'intermediate',
      region: 'HK',
      deviceType: 'ios',
      appVersion: '1.0.0'
    };
  }

  private evaluateSegmentCriteria(userProfile: any, segment: UserSegment): boolean {
    const userValue = userProfile[segment.criteria];
    
    switch (segment.operator) {
      case 'equals':
        return segment.values.includes(userValue);
      case 'not_equals':
        return !segment.values.includes(userValue);
      case 'in':
        return segment.values.includes(userValue);
      case 'not_in':
        return !segment.values.includes(userValue);
      case 'greater_than':
        return userValue > segment.values[0];
      case 'less_than':
        return userValue < segment.values[0];
      default:
        return false;
    }
  }

  private async calculateTestResults(test: ABTest): Promise<TestResults> {
    const controlVariant = test.variants.find(v => v.isControl);
    const treatmentVariants = test.variants.filter(v => !v.isControl);
    
    if (!controlVariant) {
      throw new Error('No control variant found');
    }

    // Calculate statistical significance
    const statisticalSignificance = this.calculateStatisticalSignificance(test);
    const winner = this.determineWinner(test);
    const effectSize = this.calculateEffectSize(controlVariant, treatmentVariants);

    // Calculate summary metrics
    const totalParticipants = test.variants.reduce((sum, v) => sum + v.metrics.impressions, 0);
    const totalConversions = test.variants.reduce((sum, v) => sum + v.metrics.conversions, 0);
    const overallConversionRate = totalParticipants > 0 ? (totalConversions / totalParticipants) * 100 : 0;
    const revenueImpact = test.variants.reduce((sum, v) => sum + v.metrics.revenue, 0);

    const testDurationMs = new Date().getTime() - new Date(test.startDate).getTime();
    const testDurationDays = Math.floor(testDurationMs / (24 * 60 * 60 * 1000));

    return {
      status: 'completed',
      winner: winner?.id,
      confidence: test.statisticalSettings.confidenceLevel,
      pValue: this.calculatePValue(controlVariant, treatmentVariants),
      effectSize,
      statisticalSignificance,
      practicalSignificance: effectSize > test.statisticalSettings.minimumDetectableEffect,
      summary: {
        testDuration: testDurationDays,
        totalParticipants,
        totalConversions,
        overallConversionRate,
        revenueImpact,
        keyInsights: this.generateKeyInsights(test, winner)
      },
      variantComparisons: this.generateVariantComparisons(test),
      recommendations: this.generateRecommendations(test, winner),
      generatedAt: new Date().toISOString()
    };
  }

  private calculateStatisticalSignificance(test: ABTest): boolean {
    // Simplified statistical significance calculation
    const controlVariant = test.variants.find(v => v.isControl);
    const treatmentVariants = test.variants.filter(v => !v.isControl);
    
    if (!controlVariant || treatmentVariants.length === 0) {
      return false;
    }

    // Use chi-square test for conversion rate comparison
    for (const treatment of treatmentVariants) {
      const pValue = this.calculatePValue(controlVariant, [treatment]);
      const alpha = (100 - test.statisticalSettings.confidenceLevel) / 100;
      
      if (pValue < alpha) {
        return true;
      }
    }

    return false;
  }

  private determineWinner(test: ABTest): ABVariant | null {
    let bestVariant: ABVariant | null = null;
    let bestMetric = -1;

    for (const variant of test.variants) {
      let metricValue = 0;

      switch (test.objective) {
        case 'conversion_rate':
          metricValue = variant.metrics.conversionRate;
          break;
        case 'revenue':
          metricValue = variant.metrics.revenue;
          break;
        case 'engagement':
          metricValue = variant.metrics.engagement.clickThroughRate;
          break;
        default:
          metricValue = variant.metrics.conversionRate;
      }

      if (metricValue > bestMetric) {
        bestMetric = metricValue;
        bestVariant = variant;
      }
    }

    return bestVariant;
  }

  private calculateEffectSize(control: ABVariant, treatments: ABVariant[]): number {
    if (treatments.length === 0) return 0;

    const bestTreatment = treatments.reduce((best, current) => 
      current.metrics.conversionRate > best.metrics.conversionRate ? current : best
    );

    const controlRate = control.metrics.conversionRate;
    const treatmentRate = bestTreatment.metrics.conversionRate;

    return controlRate > 0 ? ((treatmentRate - controlRate) / controlRate) * 100 : 0;
  }

  private calculatePValue(control: ABVariant, treatments: ABVariant[]): number {
    // Simplified p-value calculation (would use proper statistical library in production)
    const controlConversions = control.metrics.conversions;
    const controlImpressions = control.metrics.impressions;
    
    if (treatments.length === 0 || controlImpressions === 0) return 1;

    const treatment = treatments[0];
    const treatmentConversions = treatment.metrics.conversions;
    const treatmentImpressions = treatment.metrics.impressions;

    if (treatmentImpressions === 0) return 1;

    // Mock p-value calculation
    const controlRate = controlConversions / controlImpressions;
    const treatmentRate = treatmentConversions / treatmentImpressions;
    const difference = Math.abs(treatmentRate - controlRate);

    // Simplified calculation - would use proper statistical test
    return Math.max(0.01, 0.5 - difference * 10);
  }

  private generateKeyInsights(test: ABTest, winner: ABVariant | null): string[] {
    const insights: string[] = [];

    if (winner) {
      if (winner.isControl) {
        insights.push('Control variant performed best - current implementation is optimal');
      } else {
        insights.push(`${winner.name} variant achieved highest ${test.objective}`);
      }

      insights.push(`Best performing variant had ${winner.metrics.conversionRate.toFixed(2)}% conversion rate`);
      
      if (winner.metrics.revenue > 0) {
        insights.push(`Generated $${winner.metrics.revenue.toFixed(2)} in attributed revenue`);
      }
    }

    const totalParticipants = test.variants.reduce((sum, v) => sum + v.metrics.impressions, 0);
    insights.push(`Test reached ${totalParticipants} participants across all variants`);

    return insights;
  }

  private generateVariantComparisons(test: ABTest): VariantComparison[] {
    const comparisons: VariantComparison[] = [];
    const controlVariant = test.variants.find(v => v.isControl);
    
    if (!controlVariant) return comparisons;

    test.variants.filter(v => !v.isControl).forEach(variant => {
      const difference = variant.metrics.conversionRate - controlVariant.metrics.conversionRate;
      const percentDifference = controlVariant.metrics.conversionRate > 0 
        ? (difference / controlVariant.metrics.conversionRate) * 100
        : 0;

      comparisons.push({
        variantA: controlVariant.id,
        variantB: variant.id,
        metric: 'conversion_rate',
        difference: percentDifference,
        confidenceInterval: [percentDifference - 5, percentDifference + 5], // Simplified CI
        significance: Math.abs(percentDifference) > test.statisticalSettings.minimumDetectableEffect
      });
    });

    return comparisons;
  }

  private generateRecommendations(test: ABTest, winner: ABVariant | null): string[] {
    const recommendations: string[] = [];

    if (winner && !winner.isControl) {
      recommendations.push(`Implement ${winner.name} variant as the new default`);
      recommendations.push('Monitor performance after implementation for sustained improvement');
    } else {
      recommendations.push('Consider testing more significant changes to achieve meaningful impact');
      recommendations.push('Analyze user feedback and behavior patterns for additional insights');
    }

    const totalParticipants = test.variants.reduce((sum, v) => sum + v.metrics.impressions, 0);
    if (totalParticipants < test.segmentation.sampleSize) {
      recommendations.push('Consider running test longer to reach target sample size');
    }

    return recommendations;
  }

  // Test processing
  private startTestProcessing(): void {
    // Check test completion daily
    setInterval(() => {
      this.checkTestCompletion();
    }, 24 * 60 * 60 * 1000);

    // Update test metrics hourly
    setInterval(() => {
      this.updateTestMetrics();
    }, 60 * 60 * 1000);
  }

  private async checkTestCompletion(): Promise<void> {
    for (const [testId, test] of this.activeTests.entries()) {
      if (test.status === 'active') {
        const now = new Date();
        const endDate = new Date(test.endDate);
        
        if (now >= endDate) {
          await this.stopTest(testId, 'Test duration completed');
        }
      }
    }
  }

  private async updateTestMetrics(): Promise<void> {
    // Update cached metrics and check for early stopping criteria
    for (const [testId, test] of this.activeTests.entries()) {
      if (test.status === 'active') {
        // Check if test has reached statistical significance early
        const results = await this.calculateTestResults(test);
        if (results.statisticalSignificance && results.effectSize > test.statisticalSettings.minimumDetectableEffect * 1.5) {
          // Consider early stopping if effect is very strong
          console.log(`Test ${testId} shows strong results - consider early stopping`);
        }
      }
    }
  }

  // Data persistence
  private async loadABTestData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('ab_testing_data');
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed.activeTests) {
          this.activeTests = new Map(Object.entries(parsed.activeTests));
        }
        if (parsed.testParticipants) {
          this.testParticipants = new Map(Object.entries(parsed.testParticipants));
        }
        if (parsed.conversionEvents) {
          this.conversionEvents = parsed.conversionEvents;
        }
      }
    } catch (error) {
      console.warn('Failed to load A/B testing data:', error);
    }
  }

  private async saveABTestData(): Promise<void> {
    try {
      const data = {
        activeTests: Object.fromEntries(this.activeTests),
        testParticipants: Object.fromEntries(this.testParticipants),
        conversionEvents: this.conversionEvents.slice(-1000) // Keep last 1000 events
      };
      
      await AsyncStorage.setItem('ab_testing_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save A/B testing data:', error);
    }
  }

  // Public getters
  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values()).filter(test => test.status === 'active');
  }

  getTestTemplates(): TestTemplate[] {
    return [...this.testTemplates];
  }

  getTestingStrategies(): TestingStrategy[] {
    return [...this.testingStrategies];
  }

  getTestResults(testId: string): TestResults | null {
    const test = this.activeTests.get(testId);
    return test?.results || null;
  }

  getUserTestParticipations(userId: string): TestParticipation[] {
    return this.testParticipants.get(userId) || [];
  }
}

// Export singleton instance
export const abTestingService = new ABTestingService();

// Export types
export type {
  ABTest,
  ABVariant,
  VariantConfiguration,
  ConfigurationChange,
  VariantTargeting,
  VariantMetrics,
  TestSegmentation,
  UserSegment,
  StatisticalSettings,
  TestResults,
  ResultsSummary,
  VariantComparison,
  TestParticipation,
  ConversionEvent,
  TestTemplate,
  TestingStrategy,
  SuccessCriteria
};