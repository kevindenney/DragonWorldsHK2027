import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  FadeInDown, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor
} from '../../utils/reanimatedWrapper';
import { 
  MapPin, 
  Wind, 
  Waves, 
  Navigation, 
  TrendingUp,
  TrendingDown,
  Eye,
  Thermometer,
  Gauge,
  ArrowUp,
  ArrowDown,
  Activity,
  AlertCircle
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { 
  darkSkyColors, 
  darkSkyTypography, 
  darkSkySpacing,
  racingConditionUtils 
} from '../../constants/darkSkyTheme';

const { width } = Dimensions.get('window');

interface CourseLocation {
  name: string;
  coordinates: { lat: number; lng: number };
  type: 'start' | 'windward' | 'leeward' | 'finish';
  distanceFromStart: number; // nautical miles
}

interface HyperLocalCondition {
  location: CourseLocation;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  waveHeight: number;
  waveDirection: number;
  current: {
    speed: number;
    direction: number;
  };
  temperature: number;
  pressure: number;
  visibility: number;
  timestamp: string;
  confidence: 'high' | 'medium' | 'low';
}

interface CourseVariation {
  parameter: 'wind' | 'wave' | 'current';
  variation: number; // percentage variation across course
  impact: 'minimal' | 'moderate' | 'significant';
  tacticalAdvice: string;
}

interface HyperLocalConditionsCardProps {
  courseConditions: HyperLocalCondition[];
  selectedLocation?: CourseLocation;
  onLocationSelect?: (location: CourseLocation) => void;
  showCourseVariations?: boolean;
  raceDistance?: number; // nautical miles
}

export const HyperLocalConditionsCard: React.FC<HyperLocalConditionsCardProps> = ({
  courseConditions,
  selectedLocation,
  onLocationSelect,
  showCourseVariations = true,
  raceDistance = 1.0
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const animatedValue = useSharedValue(0);

  // Calculate course variations
  const courseVariations = useMemo((): CourseVariation[] => {
    if (courseConditions.length < 2) return [];

    const variations: CourseVariation[] = [];
    
    // Wind speed variation
    const windSpeeds = courseConditions.map(c => c.windSpeed);
    const windSpeedRange = Math.max(...windSpeeds) - Math.min(...windSpeeds);
    const windSpeedVariation = (windSpeedRange / Math.max(...windSpeeds)) * 100;
    
    if (windSpeedVariation > 5) {
      variations.push({
        parameter: 'wind',
        variation: windSpeedVariation,
        impact: windSpeedVariation > 20 ? 'significant' : windSpeedVariation > 10 ? 'moderate' : 'minimal',
        tacticalAdvice: windSpeedVariation > 20 ? 
          'Major wind gradient - sail to pressure' : 
          'Moderate wind variation - consider position'
      });
    }

    // Wave height variation
    const waveHeights = courseConditions.map(c => c.waveHeight);
    const waveRange = Math.max(...waveHeights) - Math.min(...waveHeights);
    const waveVariation = (waveRange / Math.max(...waveHeights)) * 100;
    
    if (waveVariation > 15) {
      variations.push({
        parameter: 'wave',
        variation: waveVariation,
        impact: waveVariation > 40 ? 'significant' : waveVariation > 25 ? 'moderate' : 'minimal',
        tacticalAdvice: waveVariation > 40 ? 
          'Major sea state differences across course' : 
          'Some wave variation - consider boat handling'
      });
    }

    // Current variation
    const currentSpeeds = courseConditions.map(c => c.current.speed);
    const currentRange = Math.max(...currentSpeeds) - Math.min(...currentSpeeds);
    const currentVariation = currentRange > 0 ? (currentRange / Math.max(...currentSpeeds)) * 100 : 0;
    
    if (currentVariation > 10) {
      variations.push({
        parameter: 'current',
        variation: currentVariation,
        impact: currentVariation > 30 ? 'significant' : currentVariation > 20 ? 'moderate' : 'minimal',
        tacticalAdvice: currentVariation > 30 ? 
          'Strong current gradient - major tactical factor' : 
          'Current variation exists - factor into layline calls'
      });
    }

    return variations;
  }, [courseConditions]);

  // Get condition assessment for selected location
  const selectedConditionAssessment = useMemo(() => {
    if (!selectedLocation) return null;
    
    const condition = courseConditions.find(c => c.location.name === selectedLocation.name);
    if (!condition) return null;
    
    return racingConditionUtils.assessWindConditions(
      condition.windSpeed,
      condition.windDirection,
      condition.windGust - condition.windSpeed
    );
  }, [selectedLocation, courseConditions]);

  React.useEffect(() => {
    animatedValue.value = withSpring(viewMode === 'detailed' ? 1 : 0);
  }, [viewMode]);

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      animatedValue.value,
      [0, 1],
      [darkSkyColors.cardBackground, darkSkyColors.backgroundTertiary]
    )
  }));

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence) {
      case 'high': return darkSkyColors.success;
      case 'medium': return darkSkyColors.warning;
      case 'low': return darkSkyColors.error;
      default: return darkSkyColors.textMuted;
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'start': return <Activity color={darkSkyColors.raceActive} size={16} />;
      case 'windward': return <ArrowUp color={darkSkyColors.accent} size={16} />;
      case 'leeward': return <ArrowDown color={darkSkyColors.portAdvantage} size={16} />;
      case 'finish': return <TrendingUp color={darkSkyColors.success} size={16} />;
      default: return <MapPin color={darkSkyColors.textMuted} size={16} />;
    }
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'significant': return darkSkyColors.error;
      case 'moderate': return darkSkyColors.warning;
      case 'minimal': return darkSkyColors.success;
      default: return darkSkyColors.textMuted;
    }
  };

  const formatDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <View style={styles.titleSection}>
          <MapPin color={darkSkyColors.accent} size={20} />
          <Text style={styles.title}>Hyper-Local Conditions</Text>
          <TouchableOpacity 
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
          >
            <Text style={styles.viewToggleText}>
              {viewMode === 'overview' ? 'Detailed' : 'Overview'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {raceDistance.toFixed(1)}nm course • {courseConditions.length} monitoring points
        </Text>
      </Animated.View>

      {/* Course locations */}
      <Animated.View style={styles.locationsContainer} entering={FadeInDown.delay(200)}>
        {courseConditions.map((condition, index) => {
          const isSelected = selectedLocation?.name === condition.location.name;
          const assessment = racingConditionUtils.assessWindConditions(
            condition.windSpeed,
            condition.windDirection,
            condition.windGust - condition.windSpeed
          );
          
          return (
            <TouchableOpacity
              key={condition.location.name}
              style={[
                styles.locationCard,
                isSelected && styles.locationCardSelected,
                { borderLeftColor: assessment.color }
              ]}
              onPress={() => onLocationSelect?.(condition.location)}
            >
              <Animated.View entering={SlideInRight.delay(index * 100)}>
                <View style={styles.locationHeader}>
                  {getLocationIcon(condition.location.type)}
                  <Text style={styles.locationName}>
                    {condition.location.name}
                  </Text>
                  <View style={[styles.confidenceIndicator, { backgroundColor: getConfidenceColor(condition.confidence) }]} />
                </View>
                
                <View style={styles.locationMetrics}>
                  <View style={styles.metric}>
                    <Wind color={assessment.color} size={14} />
                    <Text style={[styles.metricValue, { color: assessment.color }]}>
                      {Math.round(condition.windSpeed)}
                    </Text>
                    <Text style={styles.metricUnit}>kts</Text>
                  </View>
                  
                  <View style={styles.metric}>
                    <Navigation color={darkSkyColors.textSecondary} size={14} />
                    <Text style={styles.metricValue}>
                      {formatDirection(condition.windDirection)}
                    </Text>
                  </View>
                  
                  {viewMode === 'detailed' && (
                    <>
                      <View style={styles.metric}>
                        <Waves color={darkSkyColors.waveModerate} size={14} />
                        <Text style={styles.metricValue}>
                          {condition.waveHeight.toFixed(1)}m
                        </Text>
                      </View>
                      
                      <View style={styles.metric}>
                        <ArrowUp 
                          color={darkSkyColors.accent} 
                          size={14}
                          style={{ transform: [{ rotate: `${condition.current.direction}deg` }] }}
                        />
                        <Text style={styles.metricValue}>
                          {condition.current.speed.toFixed(1)}
                        </Text>
                        <Text style={styles.metricUnit}>kts</Text>
                      </View>
                    </>
                  )}
                </View>
                
                {isSelected && selectedConditionAssessment && (
                  <Animated.View style={styles.conditionDetail} entering={FadeInDown.delay(300)}>
                    <Text style={[styles.conditionDescription, { color: selectedConditionAssessment.color }]}>
                      {selectedConditionAssessment.description}
                    </Text>
                    <Text style={styles.tacticalAdvice}>
                      {selectedConditionAssessment.tacticalAdvice}
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Course variations */}
      {showCourseVariations && courseVariations.length > 0 && (
        <Animated.View style={styles.variationsSection} entering={FadeInDown.delay(400)}>
          <Text style={styles.variationsTitle}>Course Variations</Text>
          {courseVariations.map((variation, index) => (
            <Animated.View 
              key={variation.parameter}
              style={[styles.variationCard, { borderLeftColor: getImpactColor(variation.impact) }]}
              entering={SlideInRight.delay(500 + index * 100)}
            >
              <View style={styles.variationHeader}>
                <View style={styles.variationIcon}>
                  {variation.parameter === 'wind' && <Wind color={getImpactColor(variation.impact)} size={16} />}
                  {variation.parameter === 'wave' && <Waves color={getImpactColor(variation.impact)} size={16} />}
                  {variation.parameter === 'current' && <Navigation color={getImpactColor(variation.impact)} size={16} />}
                </View>
                <Text style={styles.variationParameter}>
                  {variation.parameter.charAt(0).toUpperCase() + variation.parameter.slice(1)} Variation
                </Text>
                <Text style={[styles.variationValue, { color: getImpactColor(variation.impact) }]}>
                  {variation.variation.toFixed(0)}%
                </Text>
              </View>
              <Text style={styles.variationAdvice}>
                {variation.tacticalAdvice}
              </Text>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Data freshness indicator */}
      <Animated.View style={styles.dataFreshness} entering={FadeInDown.delay(600)}>
        <Eye color={darkSkyColors.textMuted} size={14} />
        <Text style={styles.dataFreshnessText}>
          Last updated: {new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: darkSkySpacing.cardRadius,
    padding: darkSkySpacing.cardPadding,
    margin: darkSkySpacing.cardMargin,
  },
  
  header: {
    marginBottom: darkSkySpacing.lg,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: darkSkySpacing.xs,
  },
  title: {
    ...darkSkyTypography.bodyLarge,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginLeft: darkSkySpacing.sm,
  },
  viewToggle: {
    backgroundColor: darkSkyColors.accent + '20',
    paddingHorizontal: darkSkySpacing.sm,
    paddingVertical: darkSkySpacing.xs,
    borderRadius: darkSkySpacing.sm,
  },
  viewToggleText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.accent,
    fontWeight: '600',
  },
  subtitle: {
    ...darkSkyTypography.bodySmall,
    color: darkSkyColors.textTertiary,
  },

  locationsContainer: {
    marginBottom: darkSkySpacing.lg,
  },
  locationCard: {
    backgroundColor: darkSkyColors.backgroundSecondary,
    borderRadius: darkSkySpacing.md,
    padding: darkSkySpacing.md,
    marginBottom: darkSkySpacing.sm,
    borderLeftWidth: 4,
  },
  locationCardSelected: {
    backgroundColor: darkSkyColors.backgroundTertiary,
    borderWidth: 1,
    borderColor: darkSkyColors.accent + '40',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: darkSkySpacing.sm,
  },
  locationName: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginLeft: darkSkySpacing.sm,
  },
  confidenceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  locationMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    ...darkSkyTypography.bodySmall,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
    marginLeft: darkSkySpacing.xs,
  },
  metricUnit: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textTertiary,
    marginLeft: 2,
  },

  conditionDetail: {
    marginTop: darkSkySpacing.md,
    paddingTop: darkSkySpacing.sm,
    borderTopWidth: 1,
    borderTopColor: darkSkyColors.cardBorder,
  },
  conditionDescription: {
    ...darkSkyTypography.bodySmall,
    fontWeight: '600',
    marginBottom: darkSkySpacing.xs,
  },
  tacticalAdvice: {
    ...darkSkyTypography.bodySmall,
    color: darkSkyColors.textSecondary,
    lineHeight: 16,
  },

  variationsSection: {
    marginBottom: darkSkySpacing.lg,
  },
  variationsTitle: {
    ...darkSkyTypography.bodyMedium,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
    marginBottom: darkSkySpacing.md,
  },
  variationCard: {
    backgroundColor: darkSkyColors.backgroundSecondary,
    borderRadius: darkSkySpacing.sm,
    padding: darkSkySpacing.md,
    marginBottom: darkSkySpacing.sm,
    borderLeftWidth: 3,
  },
  variationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: darkSkySpacing.xs,
  },
  variationIcon: {
    marginRight: darkSkySpacing.sm,
  },
  variationParameter: {
    ...darkSkyTypography.bodySmall,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  variationValue: {
    ...darkSkyTypography.bodySmall,
    fontWeight: '700',
  },
  variationAdvice: {
    ...darkSkyTypography.bodySmall,
    color: darkSkyColors.textSecondary,
    lineHeight: 16,
  },

  dataFreshness: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: darkSkySpacing.sm,
    borderTopWidth: 1,
    borderTopColor: darkSkyColors.cardBorder,
  },
  dataFreshnessText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textMuted,
    flex: 1,
    marginLeft: darkSkySpacing.xs,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: darkSkyColors.success,
    marginRight: darkSkySpacing.xs,
  },
  liveText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.success,
    fontWeight: '600',
    fontSize: 10,
  },
});