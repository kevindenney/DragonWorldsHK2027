/**
 * Wave Height Visualization Component
 * 
 * Living Document Implementation:
 * Advanced wave and swell visualization for tactical racing analysis in Hong Kong waters.
 * Provides comprehensive wave height mapping with swell direction indicators, sea state
 * analysis, and tactical recommendations for racing sailors.
 * 
 * Features:
 * - Color-coded wave height visualization using Douglas Sea Scale
 * - Animated swell direction arrows with period indicators
 * - Wind wave vs. swell separation for tactical analysis
 * - Sea state categorization for sail selection guidance
 * - Breaking wave warnings in shallow areas
 * - Fetch analysis for predictive wave modeling
 */

import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Circle, Marker, Polygon } from '../../utils/mapComponentStubs';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  interpolate,
  Easing,
} from '../../utils/reanimatedWrapper';
import { Waves, TrendingUp, AlertTriangle, Navigation } from 'lucide-react-native';
import { IOSText } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';
import type { WeatherDataPoint } from './WeatherMapLayer';

export interface WaveHeightVisualizationProps {
  weatherData: WeatherDataPoint[];
  visible: boolean;
  showSwellArrows?: boolean;
  showSeaState?: boolean;
  showBreakingZones?: boolean;
  showWaveContours?: boolean;
  opacity?: number;
}

interface WaveAnalysis {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  waveHeight: number;
  swellHeight: number;
  windWaveHeight: number;
  swellDirection: number;
  swellPeriod: number;
  seaState: number; // Douglas Sea Scale 0-9
  seaStateDescription: string;
  dominantWaveType: 'wind-waves' | 'swell' | 'mixed';
  breakingRisk: boolean;
}

interface BreakingZone {
  coordinates: Array<{ latitude: number; longitude: number }>;
  severity: 'caution' | 'danger';
  waveHeight: number;
  depth: number; // estimated depth in meters
}

/**
 * Douglas Sea Scale for sea state classification
 */
const DOUGLAS_SEA_SCALE = [
  { code: 0, description: 'Calm (glassy)', height: [0, 0], color: '#E8F4FD' },
  { code: 1, description: 'Calm (rippled)', height: [0, 0.1], color: '#D1E9F6' },
  { code: 2, description: 'Smooth (wavelets)', height: [0.1, 0.5], color: '#A8D4EA' },
  { code: 3, description: 'Slight', height: [0.5, 1.25], color: '#7FBFDD' },
  { code: 4, description: 'Moderate', height: [1.25, 2.5], color: '#5AA9D0' },
  { code: 5, description: 'Rough', height: [2.5, 4], color: '#3593C3' },
  { code: 6, description: 'Very rough', height: [4, 6], color: '#1E7DB6' },
  { code: 7, description: 'High', height: [6, 9], color: '#FF8C42' },
  { code: 8, description: 'Very high', height: [9, 14], color: '#FF6B35' },
  { code: 9, description: 'Phenomenal', height: [14, 100], color: '#FF4444' },
];

/**
 * Get Douglas Sea Scale for wave height
 */
const getSeaScale = (waveHeight: number): typeof DOUGLAS_SEA_SCALE[0] => {
  return DOUGLAS_SEA_SCALE.find(scale => 
    waveHeight >= scale.height[0] && waveHeight < scale.height[1]
  ) || DOUGLAS_SEA_SCALE[0];
};

/**
 * Calculate tactical sailing recommendations based on sea state
 */
const getTacticalRecommendation = (seaState: number, waveHeight: number): string => {
  if (seaState <= 2) return 'Ideal: Light air sails, focus on wind shifts';
  if (seaState <= 4) return 'Good: Standard racing setup, watch for boat speed';
  if (seaState <= 6) return 'Challenging: Reduce sail area, focus on groove';
  return 'Extreme: Safety first, consider postponement';
};

export const WaveHeightVisualization: React.FC<WaveHeightVisualizationProps> = ({
  weatherData,
  visible,
  showSwellArrows = true,
  showSeaState = true,
  showBreakingZones = true,
  showWaveContours = true,
  opacity = 0.7
}) => {
  // Animation values
  const swellAnimation = useSharedValue(0);
  const breakingAnimation = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Continuous swell movement animation
      swellAnimation.value = withRepeat(
        withTiming(1, { 
          duration: 6000, 
          easing: Easing.linear 
        }),
        -1,
        false
      );

      // Breaking wave warning pulse
      breakingAnimation.value = withRepeat(
        withTiming(1.3, { duration: 1500 }),
        -1,
        true
      );
    }
  }, [visible, swellAnimation, breakingAnimation]);

  // Analyze wave data for enhanced visualization
  const waveAnalysis: WaveAnalysis[] = useMemo(() => {
    if (!weatherData.length) return [];

    return weatherData.map(point => {
      // Separate wind waves from swell (simplified model)
      const windWaveHeight = Math.min(point.waveHeight, point.windSpeed * 0.08); // Rough approximation
      const swellHeight = Math.max(0, point.waveHeight - windWaveHeight);
      
      // Determine sea state
      const seaScale = getSeaScale(point.waveHeight);
      
      // Determine dominant wave type
      let dominantWaveType: WaveAnalysis['dominantWaveType'];
      if (swellHeight > windWaveHeight * 1.5) dominantWaveType = 'swell';
      else if (windWaveHeight > swellHeight * 1.5) dominantWaveType = 'wind-waves';
      else dominantWaveType = 'mixed';

      // Assess breaking risk (simplified - based on wave height and estimated shallow areas)
      const distanceFromShore = Math.sqrt(
        Math.pow((point.coordinate.latitude - 22.2783) * 111, 2) +
        Math.pow((point.coordinate.longitude - 114.1757) * 111, 2)
      );
      const estimatedDepth = Math.max(5, distanceFromShore * 2); // Very rough depth estimate
      const breakingRisk = point.waveHeight > estimatedDepth * 0.8; // Breaking when H > 0.8 * depth

      return {
        coordinate: point.coordinate,
        waveHeight: point.waveHeight,
        swellHeight,
        windWaveHeight,
        swellDirection: point.currentDirection + 45, // Approximate swell direction
        swellPeriod: 4 + point.waveHeight * 1.5, // Estimated swell period
        seaState: seaScale.code,
        seaStateDescription: seaScale.description,
        dominantWaveType,
        breakingRisk
      };
    });
  }, [weatherData]);

  // Generate wave height contours
  const waveContours = useMemo(() => {
    if (!showWaveContours || !waveAnalysis.length) return [];

    const contours: Array<{
      coordinates: Array<{ latitude: number; longitude: number }>;
      waveHeight: number;
      color: string;
      seaState: number;
    }> = [];

    // Group points by sea state for contour generation
    const seaStateGroups: Record<number, WaveAnalysis[]> = {};
    
    waveAnalysis.forEach(analysis => {
      if (!seaStateGroups[analysis.seaState]) {
        seaStateGroups[analysis.seaState] = [];
      }
      seaStateGroups[analysis.seaState].push(analysis);
    });

    // Create simplified contour areas for each sea state
    Object.entries(seaStateGroups).forEach(([seaState, points]) => {
      if (points.length < 3) return;

      const seaScale = DOUGLAS_SEA_SCALE[parseInt(seaState)];
      
      // Create convex hull approximation
      const centerLat = points.reduce((sum, p) => sum + p.coordinate.latitude, 0) / points.length;
      const centerLon = points.reduce((sum, p) => sum + p.coordinate.longitude, 0) / points.length;
      
      const sortedPoints = points.sort((a, b) => {
        const angleA = Math.atan2(a.coordinate.latitude - centerLat, a.coordinate.longitude - centerLon);
        const angleB = Math.atan2(b.coordinate.latitude - centerLat, b.coordinate.longitude - centerLon);
        return angleA - angleB;
      });

      contours.push({
        coordinates: sortedPoints.map(p => p.coordinate),
        waveHeight: points[0].waveHeight,
        color: seaScale.color,
        seaState: parseInt(seaState)
      });
    });

    return contours;
  }, [waveAnalysis, showWaveContours]);

  // Identify breaking zones
  const breakingZones: BreakingZone[] = useMemo(() => {
    if (!showBreakingZones) return [];

    const breakingPoints = waveAnalysis.filter(analysis => analysis.breakingRisk);
    const zones: BreakingZone[] = [];

    // Group nearby breaking points into zones
    const processedPoints = new Set<number>();
    
    breakingPoints.forEach((point, index) => {
      if (processedPoints.has(index)) return;

      const zonePoints = [point];
      processedPoints.add(index);

      // Find nearby breaking points
      breakingPoints.forEach((otherPoint, otherIndex) => {
        if (otherIndex === index || processedPoints.has(otherIndex)) return;

        const distance = Math.sqrt(
          Math.pow((point.coordinate.latitude - otherPoint.coordinate.latitude) * 111, 2) +
          Math.pow((point.coordinate.longitude - otherPoint.coordinate.longitude) * 111, 2)
        );

        if (distance < 0.5) { // Within 500m
          zonePoints.push(otherPoint);
          processedPoints.add(otherIndex);
        }
      });

      if (zonePoints.length >= 2) {
        const maxWaveHeight = Math.max(...zonePoints.map(p => p.waveHeight));
        
        zones.push({
          coordinates: zonePoints.map(p => p.coordinate),
          severity: maxWaveHeight > 2.5 ? 'danger' : 'caution',
          waveHeight: maxWaveHeight,
          depth: 10 // Estimated shallow depth
        });
      }
    });

    return zones;
  }, [waveAnalysis, showBreakingZones]);

  // Animated styles
  const swellArrowStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      swellAnimation.value,
      [0, 1],
      [0, 10]
    );
    return {
      transform: [{ translateX }],
      opacity: interpolate(
        swellAnimation.value,
        [0, 0.5, 1],
        [0.6, 1, 0.6]
      )
    };
  });

  const breakingPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breakingAnimation.value }],
  }));

  if (!visible) return null;

  return (
    <>
      {/* Wave Height Contours */}
      {waveContours.map((contour, index) => (
        <Polygon
          key={`wave-contour-${index}`}
          coordinates={contour.coordinates}
          fillColor={`${contour.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`}
          strokeColor={contour.color}
          strokeWidth={1}
        />
      ))}

      {/* Wave Height Circles */}
      {showSeaState && waveAnalysis.filter((_, index) => index % 3 === 0).map((analysis, index) => {
        const seaScale = getSeaScale(analysis.waveHeight);
        
        return (
          <Circle
            key={`wave-circle-${index}`}
            center={analysis.coordinate}
            radius={30 + analysis.waveHeight * 20} // Scale radius with wave height
            fillColor={`${seaScale.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`}
            strokeColor={seaScale.color}
            strokeWidth={1}
          />
        );
      })}

      {/* Swell Direction Arrows */}
      {showSwellArrows && waveAnalysis.filter((_, index) => index % 4 === 0 && _.swellHeight > 0.3).map((analysis, index) => (
        <Marker
          key={`swell-arrow-${index}`}
          coordinate={analysis.coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <Animated.View 
            style={[
              styles.swellArrow,
              swellArrowStyle,
              {
                transform: [
                  { rotate: `${analysis.swellDirection}deg` },
                  ...swellArrowStyle.transform
                ]
              }
            ]}
          >
            <Navigation size={14} color={colors.info} />
            
            {/* Swell period indicator */}
            <View style={styles.swellPeriodLabel}>
              <IOSText style={styles.swellPeriodText}>
                {analysis.swellPeriod.toFixed(0)}s
              </IOSText>
            </View>
          </Animated.View>
        </Marker>
      ))}

      {/* Breaking Wave Zones */}
      {breakingZones.map((zone, index) => (
        <React.Fragment key={`breaking-zone-${index}`}>
          {zone.coordinates.map((coord, coordIndex) => (
            <Marker
              key={`breaking-marker-${index}-${coordIndex}`}
              coordinate={coord}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <Animated.View style={[styles.breakingWarning, breakingPulseStyle]}>
                <AlertTriangle 
                  size={16} 
                  color={zone.severity === 'danger' ? colors.error : colors.warning} 
                />
              </Animated.View>
            </Marker>
          ))}
        </React.Fragment>
      ))}

      {/* Sea State Analysis Points */}
      {showSeaState && waveAnalysis.filter((_, index) => index % 6 === 0).map((analysis, index) => (
        <Marker
          key={`sea-state-${index}`}
          coordinate={analysis.coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.seaStateMarker}>
            <View style={styles.seaStateIndicator}>
              <Waves size={12} color={colors.primary} />
              <IOSText style={styles.seaStateNumber}>
                {analysis.seaState}
              </IOSText>
            </View>
            
            <View style={styles.waveDataBubble}>
              <IOSText style={styles.waveHeight}>
                {analysis.waveHeight.toFixed(1)}m
              </IOSText>
              <IOSText style={styles.seaStateDesc}>
                {analysis.seaStateDescription}
              </IOSText>
              <IOSText style={styles.waveType}>
                {analysis.dominantWaveType.replace('-', ' ')}
              </IOSText>
            </View>
          </View>
        </Marker>
      ))}

      {/* Wave Analysis Legend */}
      <Marker
        coordinate={{ latitude: 22.3100, longitude: 114.3000 }}
        anchor={{ x: 1, y: 0 }}
        tracksViewChanges={false}
      >
        <View style={styles.waveLegend}>
          <IOSText style={styles.legendTitle}>Sea State (Douglas Scale)</IOSText>
          
          <View style={styles.legendRow}>
            <View style={[styles.seaStateColorBox, { backgroundColor: DOUGLAS_SEA_SCALE[2].color }]} />
            <IOSText style={styles.legendText}>0-2: Smooth</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <View style={[styles.seaStateColorBox, { backgroundColor: DOUGLAS_SEA_SCALE[4].color }]} />
            <IOSText style={styles.legendText}>3-4: Moderate</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <View style={[styles.seaStateColorBox, { backgroundColor: DOUGLAS_SEA_SCALE[6].color }]} />
            <IOSText style={styles.legendText}>5-6: Rough</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <View style={[styles.seaStateColorBox, { backgroundColor: DOUGLAS_SEA_SCALE[7].color }]} />
            <IOSText style={styles.legendText}>7+: High</IOSText>
          </View>
          
          <View style={styles.legendSeparator} />
          
          <View style={styles.legendRow}>
            <Navigation size={10} color={colors.info} />
            <IOSText style={styles.legendText}>Swell Direction</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <AlertTriangle size={10} color={colors.warning} />
            <IOSText style={styles.legendText}>Breaking Waves</IOSText>
          </View>
        </View>
      </Marker>

      {/* Tactical Recommendations */}
      <Marker
        coordinate={{ latitude: 22.3900, longitude: 114.3000 }}
        anchor={{ x: 1, y: 1 }}
        tracksViewChanges={false}
      >
        <View style={styles.tacticalLegend}>
          <IOSText style={styles.legendTitle}>Racing Conditions</IOSText>
          
          {waveAnalysis.length > 0 && (
            <>
              <IOSText style={styles.tacticalText}>
                Avg Sea State: {Math.round(waveAnalysis.reduce((sum, a) => sum + a.seaState, 0) / waveAnalysis.length)}
              </IOSText>
              <IOSText style={styles.tacticalText}>
                Max Waves: {Math.max(...waveAnalysis.map(a => a.waveHeight)).toFixed(1)}m
              </IOSText>
              <IOSText style={styles.tacticalRecommendation}>
                {getTacticalRecommendation(
                  Math.round(waveAnalysis.reduce((sum, a) => sum + a.seaState, 0) / waveAnalysis.length),
                  Math.max(...waveAnalysis.map(a => a.waveHeight))
                )}
              </IOSText>
            </>
          )}
        </View>
      </Marker>
    </>
  );
};

const styles = StyleSheet.create({
  swellArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.info,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  swellPeriodLabel: {
    position: 'absolute',
    bottom: -15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },

  swellPeriodText: {
    ...typography.caption,
    fontSize: 8,
    color: colors.background,
    fontWeight: '600',
  },

  breakingWarning: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.warning,
  },

  seaStateMarker: {
    alignItems: 'center',
  },

  seaStateIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  seaStateNumber: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: colors.primary,
    position: 'absolute',
    bottom: 2,
  },

  waveDataBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.xs,
    borderRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.xs,
    minWidth: 100,
    alignItems: 'center',
  },

  waveHeight: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },

  seaStateDesc: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },

  waveType: {
    ...typography.caption,
    fontSize: 8,
    color: colors.textMuted,
    textAlign: 'center',
  },

  waveLegend: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 140,
  },

  tacticalLegend: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 160,
  },

  legendTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  legendText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },

  seaStateColorBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  legendSeparator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },

  tacticalText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },

  tacticalRecommendation: {
    ...typography.caption,
    fontSize: 9,
    color: colors.info,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

/**
 * Living Document Export Notes:
 * 
 * This WaveHeightVisualization component provides comprehensive wave analysis:
 * 
 * - Douglas Sea Scale Integration: International standard for sea state classification
 * - Swell vs Wind Wave Separation: Critical for understanding wave characteristics
 * - Breaking Wave Detection: Safety warnings for shallow water areas
 * - Tactical Racing Analysis: Sail selection and boat handling recommendations
 * - Animated Swell Indicators: Real-time visualization of swell direction and period
 * 
 * Future enhancements:
 * - Integration with wave buoy data for real measurements
 * - Historical wave pattern analysis for trend prediction
 * - 3D wave visualization showing wave steepness and breaking tendency
 * - Integration with yacht polar diagrams for performance optimization
 * - Real-time wave period measurement from racing boat sensors
 */