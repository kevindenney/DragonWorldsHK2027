import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeInUp, SlideInRight } from '../../utils/reanimatedWrapper';
import { 
  Target, 
  Compass, 
  TrendingUp, 
  TrendingDown,
  Wind,
  Waves,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  ArrowRight,
  Clock
} from 'lucide-react-native';
import { IOSText, IOSButton } from '../ios';
import { colors, typography, spacing, shadows } from '../../constants/theme';
import type { WeatherCondition, MarineCondition } from '../../stores/weatherStore';
import type { WeatherDataPoint } from './WeatherMapLayer';

interface StartLineData {
  port: { latitude: number; longitude: number };
  starboard: { latitude: number; longitude: number };
  bearing: number;
  length: number;
}

interface RaceAreaBounds {
  center: { latitude: number; longitude: number };
  bounds: Array<{ latitude: number; longitude: number }>;
}

interface RacingTacticalPanelProps {
  currentWeather: WeatherCondition;
  currentMarine?: MarineCondition | null;
  startLineData: StartLineData;
  raceArea: RaceAreaBounds;
  selectedPoint?: WeatherDataPoint | null;
  onClose: () => void;
  timeToStart?: number; // minutes
}

interface TacticalAnalysis {
  startLineBias: {
    favoredEnd: 'port' | 'starboard' | 'neutral';
    biasAngle: number;
    confidence: 'high' | 'medium' | 'low';
    recommendation: string;
  };
  windAnalysis: {
    stability: 'stable' | 'shifting' | 'oscillating' | 'unstable';
    trend: 'increasing' | 'decreasing' | 'steady';
    shiftPrediction: number; // degrees
    riskLevel: 'low' | 'medium' | 'high';
  };
  tacticalAdvice: {
    strategyRecommendation: string;
    riskFactors: string[];
    opportunities: string[];
    timing: string;
  };
  currentImpact: {
    significance: 'minimal' | 'moderate' | 'major';
    direction: number;
    speed: number;
    racingEffect: string;
  };
}

export const RacingTacticalPanel: React.FC<RacingTacticalPanelProps> = ({
  currentWeather,
  currentMarine,
  startLineData,
  raceArea,
  selectedPoint,
  onClose,
  timeToStart = 45
}) => {
  // Calculate comprehensive tactical analysis
  const tacticalAnalysis = useMemo((): TacticalAnalysis => {
    const windDirection = currentWeather.windDirection;
    const windSpeed = currentWeather.windSpeed;
    const startLineBearing = startLineData.bearing;
    
    // Calculate start line bias
    const windAngleToLine = Math.abs(windDirection - startLineBearing);
    const normalizedAngle = windAngleToLine > 180 ? 360 - windAngleToLine : windAngleToLine;
    
    let favoredEnd: 'port' | 'starboard' | 'neutral';
    let biasAngle = normalizedAngle;
    
    if (normalizedAngle < 10) {
      favoredEnd = 'neutral';
    } else if (normalizedAngle < 90) {
      // Right-hand shift favors starboard end
      favoredEnd = windDirection > startLineBearing ? 'starboard' : 'port';
    } else {
      // Left-hand shift favors port end  
      favoredEnd = windDirection > startLineBearing ? 'port' : 'starboard';
      biasAngle = 180 - normalizedAngle;
    }
    
    const confidence = biasAngle > 15 ? 'high' : biasAngle > 8 ? 'medium' : 'low';
    
    // Wind stability analysis
    const gustFactor = currentWeather.windGust ? 
      (currentWeather.windGust - windSpeed) / windSpeed : 0;
    
    let stability: 'stable' | 'shifting' | 'oscillating' | 'unstable';
    let riskLevel: 'low' | 'medium' | 'high';
    
    if (gustFactor > 0.4) {
      stability = 'unstable';
      riskLevel = 'high';
    } else if (gustFactor > 0.2) {
      stability = 'shifting';
      riskLevel = 'medium';
    } else if (windSpeed > 15 && windSpeed < 25) {
      stability = 'stable';
      riskLevel = 'low';
    } else {
      stability = 'oscillating';
      riskLevel = windSpeed > 25 ? 'high' : 'medium';
    }
    
    // Current impact assessment
    const currentSpeed = currentMarine?.current?.speed || 0;
    const currentDirection = currentMarine?.current?.direction || 0;
    
    let currentSignificance: 'minimal' | 'moderate' | 'major';
    if (currentSpeed < 0.5) currentSignificance = 'minimal';
    else if (currentSpeed < 1.2) currentSignificance = 'moderate';
    else currentSignificance = 'major';
    
    // Generate tactical recommendations
    const generateRecommendations = (): {
      strategyRecommendation: string;
      riskFactors: string[];
      opportunities: string[];
      timing: string;
    } => {
      const recommendations = {
        strategyRecommendation: '',
        riskFactors: [] as string[],
        opportunities: [] as string[],
        timing: ''
      };
      
      // Strategy based on wind conditions
      if (windSpeed < 8) {
        recommendations.strategyRecommendation = `Light air strategy: Focus on clear air and current awareness. Avoid disturbed air near other boats.`;
        recommendations.riskFactors.push('Wind shadows from other boats');
        recommendations.riskFactors.push('Current becomes more significant');
        recommendations.opportunities.push('Tactical boat handling advantage');
      } else if (windSpeed > 20) {
        recommendations.strategyRecommendation = `Heavy air strategy: Conservative approach, focus on boat speed over positioning.`;
        recommendations.riskFactors.push('Gear failure risk in gusty conditions');
        recommendations.riskFactors.push('Boat handling errors more costly');
        recommendations.opportunities.push('Separation opportunities in gusts');
      } else {
        recommendations.strategyRecommendation = `Moderate conditions: Balance positioning and speed. ${favoredEnd} end favored by ${biasAngle.toFixed(0)}°.`;
        recommendations.opportunities.push('Good conditions for tactical sailing');
      }
      
      // Start line bias recommendations
      if (biasAngle > 10) {
        recommendations.opportunities.push(`${favoredEnd} end strongly favored`);
        if (favoredEnd === 'starboard') {
          recommendations.strategyRecommendation += ` Start near starboard end for immediate right-of-way advantage.`;
        } else {
          recommendations.strategyRecommendation += ` Port end offers clear air and shorter distance to first shift.`;
        }
      }
      
      // Current considerations
      if (currentSignificance !== 'minimal') {
        const currentAngleToWind = Math.abs(currentDirection - windDirection);
        if (currentAngleToWind < 45 || currentAngleToWind > 315) {
          recommendations.opportunities.push('Current assists upwind progress');
        } else if (currentAngleToWind > 135 && currentAngleToWind < 225) {
          recommendations.riskFactors.push('Current hinders upwind progress');
        } else {
          recommendations.riskFactors.push('Cross-current affects laylines');
        }
      }
      
      // Timing recommendations
      const minutesToStart = timeToStart;
      if (minutesToStart > 30) {
        recommendations.timing = 'Monitor conditions closely - still time for significant changes';
      } else if (minutesToStart > 10) {
        recommendations.timing = 'Final tactical decisions should be made - conditions stabilizing';
      } else {
        recommendations.timing = 'Execute planned strategy - avoid last-minute changes';
      }
      
      return recommendations;
    };
    
    return {
      startLineBias: {
        favoredEnd,
        biasAngle,
        confidence,
        recommendation: `${favoredEnd.toUpperCase()} end favored by ${biasAngle.toFixed(1)}° (${confidence} confidence)`
      },
      windAnalysis: {
        stability,
        trend: gustFactor > 0.1 ? 'increasing' : 'steady',
        shiftPrediction: Math.sin(Date.now() / 60000) * 10, // Simulate prediction
        riskLevel
      },
      tacticalAdvice: generateRecommendations(),
      currentImpact: {
        significance: currentSignificance,
        direction: currentDirection,
        speed: currentSpeed,
        racingEffect: currentSignificance === 'minimal' ? 
          'Negligible tactical impact' : 
          `${currentSignificance} impact - factor into layline calculations`
      }
    };
  }, [currentWeather, currentMarine, startLineData, timeToStart]);
  
  // Get status color for different indicators
  const getStatusColor = (level: string): string => {
    switch (level) {
      case 'high':
      case 'major':
      case 'unstable':
        return colors.error;
      case 'medium':
      case 'moderate':
      case 'shifting':
        return colors.warning;
      case 'low':
      case 'minimal':
      case 'stable':
        return colors.success;
      default:
        return colors.textMuted;
    }
  };
  
  // Get confidence icon
  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle size={16} color={colors.success} />;
      case 'medium':
        return <Info size={16} color={colors.warning} />;
      default:
        return <AlertTriangle size={16} color={colors.error} />;
    }
  };

  return (
    <Animated.View style={styles.container} entering={FadeInUp.duration(300)}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Target size={20} color={colors.primary} />
          <IOSText style={styles.headerTitle}>Tactical Analysis</IOSText>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.timeToStart}>
            <Clock size={14} color={colors.accent} />
            <IOSText style={styles.timeToStartText}>
              {timeToStart}m to start
            </IOSText>
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Start Line Analysis */}
        <Animated.View style={styles.analysisCard} entering={SlideInRight.delay(100)}>
          <View style={styles.cardHeader}>
            <Compass size={18} color={colors.primary} />
            <IOSText style={styles.cardTitle}>Start Line Bias</IOSText>
            {getConfidenceIcon(tacticalAnalysis.startLineBias.confidence)}
          </View>
          
          <View style={styles.biasVisualization}>
            <View style={styles.startLine}>
              <View style={[
                styles.lineEnd, 
                { 
                  backgroundColor: tacticalAnalysis.startLineBias.favoredEnd === 'port' ? 
                    colors.success : colors.textMuted 
                }
              ]}>
                <IOSText style={styles.lineEndText}>P</IOSText>
              </View>
              
              <View style={styles.lineCenter}>
                <IOSText style={styles.biasAngleText}>
                  {tacticalAnalysis.startLineBias.biasAngle.toFixed(1)}°
                </IOSText>
                <Navigation 
                  size={16} 
                  color={colors.accent}
                  style={{ 
                    transform: [{ rotate: `${currentWeather.windDirection}deg` }] 
                  }}
                />
              </View>
              
              <View style={[
                styles.lineEnd, 
                { 
                  backgroundColor: tacticalAnalysis.startLineBias.favoredEnd === 'starboard' ? 
                    colors.success : colors.textMuted 
                }
              ]}>
                <IOSText style={styles.lineEndText}>S</IOSText>
              </View>
            </View>
          </View>
          
          <IOSText style={styles.recommendationText}>
            {tacticalAnalysis.startLineBias.recommendation}
          </IOSText>
        </Animated.View>

        {/* Wind Analysis */}
        <Animated.View style={styles.analysisCard} entering={SlideInRight.delay(200)}>
          <View style={styles.cardHeader}>
            <Wind size={18} color={colors.info} />
            <IOSText style={styles.cardTitle}>Wind Conditions</IOSText>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(tacticalAnalysis.windAnalysis.riskLevel) + '20' }
            ]}>
              <IOSText style={[
                styles.statusText,
                { color: getStatusColor(tacticalAnalysis.windAnalysis.riskLevel) }
              ]}>
                {tacticalAnalysis.windAnalysis.riskLevel.toUpperCase()}
              </IOSText>
            </View>
          </View>
          
          <View style={styles.windMetrics}>
            <View style={styles.metricItem}>
              <IOSText style={styles.metricLabel}>Speed</IOSText>
              <IOSText style={styles.metricValue}>
                {currentWeather.windSpeed.toFixed(1)} kts
              </IOSText>
              {currentWeather.windGust && (
                <IOSText style={styles.metricGust}>
                  G{currentWeather.windGust.toFixed(0)}
                </IOSText>
              )}
            </View>
            
            <View style={styles.metricItem}>
              <IOSText style={styles.metricLabel}>Direction</IOSText>
              <IOSText style={styles.metricValue}>
                {currentWeather.windDirection.toFixed(0)}°
              </IOSText>
            </View>
            
            <View style={styles.metricItem}>
              <IOSText style={styles.metricLabel}>Stability</IOSText>
              <IOSText style={[
                styles.metricValue,
                { color: getStatusColor(tacticalAnalysis.windAnalysis.stability) }
              ]}>
                {tacticalAnalysis.windAnalysis.stability}
              </IOSText>
            </View>
          </View>
        </Animated.View>

        {/* Current Impact */}
        {currentMarine && tacticalAnalysis.currentImpact.significance !== 'minimal' && (
          <Animated.View style={styles.analysisCard} entering={SlideInRight.delay(300)}>
            <View style={styles.cardHeader}>
              <Waves size={18} color={colors.accent} />
              <IOSText style={styles.cardTitle}>Current Impact</IOSText>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(tacticalAnalysis.currentImpact.significance) + '20' }
              ]}>
                <IOSText style={[
                  styles.statusText,
                  { color: getStatusColor(tacticalAnalysis.currentImpact.significance) }
                ]}>
                  {tacticalAnalysis.currentImpact.significance.toUpperCase()}
                </IOSText>
              </View>
            </View>
            
            <View style={styles.currentMetrics}>
              <View style={styles.metricItem}>
                <IOSText style={styles.metricLabel}>Speed</IOSText>
                <IOSText style={styles.metricValue}>
                  {tacticalAnalysis.currentImpact.speed.toFixed(1)} kts
                </IOSText>
              </View>
              
              <View style={styles.metricItem}>
                <IOSText style={styles.metricLabel}>Set</IOSText>
                <IOSText style={styles.metricValue}>
                  {tacticalAnalysis.currentImpact.direction.toFixed(0)}°
                </IOSText>
              </View>
            </View>
            
            <IOSText style={styles.currentEffectText}>
              {tacticalAnalysis.currentImpact.racingEffect}
            </IOSText>
          </Animated.View>
        )}

        {/* Selected Point Analysis */}
        {selectedPoint && (
          <Animated.View style={styles.analysisCard} entering={SlideInRight.delay(400)}>
            <View style={styles.cardHeader}>
              <Target size={18} color={colors.secondary} />
              <IOSText style={styles.cardTitle}>Selected Location</IOSText>
            </View>
            
            <View style={styles.selectedPointData}>
              <View style={styles.pointMetrics}>
                <View style={styles.metricItem}>
                  <IOSText style={styles.metricLabel}>Wind</IOSText>
                  <IOSText style={styles.metricValue}>
                    {selectedPoint.windSpeed.toFixed(1)} kts @ {selectedPoint.windDirection.toFixed(0)}°
                  </IOSText>
                </View>
                
                <View style={styles.metricItem}>
                  <IOSText style={styles.metricLabel}>Waves</IOSText>
                  <IOSText style={styles.metricValue}>
                    {selectedPoint.waveHeight.toFixed(1)}m
                  </IOSText>
                </View>
                
                <View style={styles.metricItem}>
                  <IOSText style={styles.metricLabel}>Current</IOSText>
                  <IOSText style={styles.metricValue}>
                    {selectedPoint.currentSpeed.toFixed(1)} kts @ {selectedPoint.currentDirection.toFixed(0)}°
                  </IOSText>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Tactical Recommendations */}
        <Animated.View style={styles.recommendationsCard} entering={SlideInRight.delay(500)}>
          <View style={styles.cardHeader}>
            <TrendingUp size={18} color={colors.success} />
            <IOSText style={styles.cardTitle}>Race Strategy</IOSText>
          </View>
          
          <IOSText style={styles.strategyText}>
            {tacticalAnalysis.tacticalAdvice.strategyRecommendation}
          </IOSText>
          
          {tacticalAnalysis.tacticalAdvice.opportunities.length > 0 && (
            <View style={styles.adviceSection}>
              <IOSText style={styles.adviceSectionTitle}>Opportunities</IOSText>
              {tacticalAnalysis.tacticalAdvice.opportunities.map((opportunity, index) => (
                <View key={index} style={styles.adviceItem}>
                  <CheckCircle size={12} color={colors.success} />
                  <IOSText style={styles.adviceText}>{opportunity}</IOSText>
                </View>
              ))}
            </View>
          )}
          
          {tacticalAnalysis.tacticalAdvice.riskFactors.length > 0 && (
            <View style={styles.adviceSection}>
              <IOSText style={styles.adviceSectionTitle}>Risk Factors</IOSText>
              {tacticalAnalysis.tacticalAdvice.riskFactors.map((risk, index) => (
                <View key={index} style={styles.adviceItem}>
                  <AlertTriangle size={12} color={colors.warning} />
                  <IOSText style={styles.adviceText}>{risk}</IOSText>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.timingSection}>
            <Clock size={14} color={colors.accent} />
            <IOSText style={styles.timingText}>
              {tacticalAnalysis.tacticalAdvice.timing}
            </IOSText>
          </View>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerTitle: {
    ...typography.h6,
    color: colors.text,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timeToStart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
    marginRight: spacing.sm,
  },

  timeToStartText: {
    ...typography.caption,
    color: colors.accent,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },

  closeButton: {
    padding: spacing.xs,
    borderRadius: spacing.sm,
  },

  content: {
    flex: 1,
    padding: spacing.md,
  },

  analysisCard: {
    backgroundColor: colors.background,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },

  recommendationsCard: {
    backgroundColor: colors.background,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.success + '30',
    ...shadows.medium,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  cardTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },

  statusIndicator: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },

  statusText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },

  biasVisualization: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  startLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    justifyContent: 'space-between',
  },

  lineEnd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  lineEndText: {
    ...typography.body1,
    color: colors.background,
    fontWeight: '700',
  },

  lineCenter: {
    alignItems: 'center',
  },

  biasAngleText: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },

  recommendationText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  windMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },

  currentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },

  metricItem: {
    alignItems: 'center',
  },

  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs / 2,
  },

  metricValue: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },

  metricGust: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs / 2,
    fontWeight: '600',
  },

  currentEffectText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  selectedPointData: {
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    padding: spacing.sm,
  },

  pointMetrics: {
    flexDirection: 'column',
    gap: spacing.sm,
  },

  strategyText: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  adviceSection: {
    marginBottom: spacing.md,
  },

  adviceSectionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },

  adviceText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 18,
  },

  timingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '10',
    padding: spacing.sm,
    borderRadius: spacing.sm,
    marginTop: spacing.sm,
  },

  timingText: {
    ...typography.body2,
    color: colors.text,
    marginLeft: spacing.sm,
    fontWeight: '500',
    flex: 1,
  },
});