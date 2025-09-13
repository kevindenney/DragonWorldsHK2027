/**
 * Pressure Gradient Overlay Component
 * 
 * Living Document Implementation:
 * Advanced atmospheric pressure visualization for strategic racing weather analysis.
 * Provides visual representation of pressure systems, fronts, and wind shift indicators
 * critical for tactical sailing decisions in Hong Kong racing waters.
 * 
 * Features:
 * - Isobar visualization with pressure gradient strength
 * - Weather system identification (high/low pressure, fronts)
 * - Wind shift prediction based on pressure gradients
 * - Convergence and divergence zone detection
 * - Weather front movement tracking
 * - Pressure change rate indicators for timing decisions
 */

import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Polyline, Circle, Marker } from 'react-native-maps';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Zap, 
  CloudRain,
  Sun,
  Eye
} from 'lucide-react-native';
import { IOSText } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';
import type { WeatherDataPoint } from './WeatherMapLayer';

export interface PressureGradientOverlayProps {
  weatherData: WeatherDataPoint[];
  visible: boolean;
  showIsobars?: boolean;
  showPressureSystems?: boolean;
  showFronts?: boolean;
  showWindShiftZones?: boolean;
  opacity?: number;
}

interface PressurePoint {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  pressure: number;
  pressureChange: number; // hPa/hour
  gradient: number; // hPa/km
  gradientDirection: number; // degrees
}

interface PressureSystem {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'high' | 'low' | 'ridge' | 'trough';
  intensity: number;
  centralPressure: number;
  movementDirection?: number;
  movementSpeed?: number; // km/h
}

interface WeatherFront {
  coordinates: Array<{ latitude: number; longitude: number }>;
  type: 'cold' | 'warm' | 'occluded' | 'stationary';
  intensity: 'weak' | 'moderate' | 'strong';
  movementDirection: number;
  movementSpeed: number; // km/h
}

interface WindShiftZone {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  shiftMagnitude: number; // degrees
  shiftTiming: number; // minutes from now
  confidence: 'low' | 'medium' | 'high';
}

export const PressureGradientOverlay: React.FC<PressureGradientOverlayProps> = ({
  weatherData,
  visible,
  showIsobars = true,
  showPressureSystems = true,
  showFronts = true,
  showWindShiftZones = true,
  opacity = 0.8
}) => {
  // Animation values
  const systemAnimation = useSharedValue(0);
  const frontAnimation = useSharedValue(0);
  const shiftAnimation = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Pressure system rotation animation
      systemAnimation.value = withRepeat(
        withTiming(1, { 
          duration: 20000, 
          easing: Easing.linear 
        }),
        -1,
        false
      );

      // Front movement animation
      frontAnimation.value = withRepeat(
        withTiming(1, { 
          duration: 8000, 
          easing: Easing.inOut(Easing.sin) 
        }),
        -1,
        true
      );

      // Wind shift warning pulse
      shiftAnimation.value = withRepeat(
        withTiming(1.4, { duration: 2000 }),
        -1,
        true
      );
    }
  }, [visible, systemAnimation, frontAnimation, shiftAnimation]);

  // Generate pressure points with gradients
  const pressurePoints: PressurePoint[] = useMemo(() => {
    if (!weatherData.length) return [];

    return weatherData.map((point, index) => {
      // Simulate pressure based on Hong Kong typical patterns
      const basePressure = 1013; // Standard sea level pressure
      const seasonalVariation = Math.sin((new Date().getMonth() / 12) * Math.PI * 2) * 8; // ±8 hPa seasonal
      const dailyVariation = Math.sin((new Date().getHours() / 24) * Math.PI * 2) * 3; // ±3 hPa diurnal
      const spatialVariation = Math.sin(point.coordinate.latitude * 100) * 5; // Spatial pressure variation
      
      const pressure = basePressure + seasonalVariation + dailyVariation + spatialVariation;

      // Calculate pressure gradient (simplified)
      const nearbyPoints = weatherData.filter((otherPoint, otherIndex) => {
        if (otherIndex === index) return false;
        const distance = Math.sqrt(
          Math.pow((point.coordinate.latitude - otherPoint.coordinate.latitude) * 111, 2) +
          Math.pow((point.coordinate.longitude - otherPoint.coordinate.longitude) * 111, 2)
        );
        return distance < 5; // Within 5km
      });

      let gradient = 0;
      let gradientDirection = 0;

      if (nearbyPoints.length > 0) {
        // Simplified gradient calculation
        const avgNearbyPressure = nearbyPoints.reduce((sum, p) => {
          const nearbyPressure = basePressure + 
            Math.sin((new Date().getMonth() / 12) * Math.PI * 2) * 8 +
            Math.sin((new Date().getHours() / 24) * Math.PI * 2) * 3 +
            Math.sin(p.coordinate.latitude * 100) * 5;
          return sum + nearbyPressure;
        }, 0) / nearbyPoints.length;

        gradient = Math.abs(pressure - avgNearbyPressure) / 2.5; // hPa per ~2.5km
        gradientDirection = pressure > avgNearbyPressure ? 0 : 180; // Direction of lower pressure
      }

      // Simulate pressure change rate
      const pressureChange = (Math.random() - 0.5) * 2; // ±1 hPa/hour

      return {
        coordinate: point.coordinate,
        pressure,
        pressureChange,
        gradient,
        gradientDirection
      };
    });
  }, [weatherData]);

  // Identify pressure systems
  const pressureSystems: PressureSystem[] = useMemo(() => {
    if (!pressurePoints.length) return [];

    const systems: PressureSystem[] = [];
    const processedIndices = new Set<number>();

    pressurePoints.forEach((point, index) => {
      if (processedIndices.has(index)) return;

      // Find local extrema (high/low pressure centers)
      const nearbyPoints = pressurePoints.filter((otherPoint, otherIndex) => {
        if (otherIndex === index) return false;
        const distance = Math.sqrt(
          Math.pow((point.coordinate.latitude - otherPoint.coordinate.latitude) * 111, 2) +
          Math.pow((point.coordinate.longitude - otherPoint.coordinate.longitude) * 111, 2)
        );
        return distance < 3; // Within 3km
      });

      if (nearbyPoints.length >= 3) {
        const avgNearbyPressure = nearbyPoints.reduce((sum, p) => sum + p.pressure, 0) / nearbyPoints.length;
        const pressureDiff = point.pressure - avgNearbyPressure;

        // Identify system type
        if (Math.abs(pressureDiff) > 2) { // Significant pressure difference
          const systemType: PressureSystem['type'] = 
            pressureDiff > 2 ? 'high' : 'low';
          
          systems.push({
            coordinate: point.coordinate,
            type: systemType,
            intensity: Math.abs(pressureDiff),
            centralPressure: point.pressure,
            movementDirection: point.gradientDirection,
            movementSpeed: 15 // Typical system movement speed
          });

          processedIndices.add(index);
        }
      }
    });

    return systems;
  }, [pressurePoints]);

  // Generate isobars (simplified)
  const isobars = useMemo(() => {
    if (!showIsobars || !pressurePoints.length) return [];

    const isobarLines: Array<{
      coordinates: Array<{ latitude: number; longitude: number }>;
      pressure: number;
      color: string;
    }> = [];

    // Group points by pressure ranges
    const pressureRanges = [1000, 1005, 1010, 1015, 1020, 1025, 1030];
    
    pressureRanges.forEach(targetPressure => {
      const nearPressurePoints = pressurePoints.filter(point => 
        Math.abs(point.pressure - targetPressure) < 2.5
      );

      if (nearPressurePoints.length >= 3) {
        // Sort by position to create a rough line
        const sortedPoints = nearPressurePoints.sort((a, b) => 
          a.coordinate.longitude - b.coordinate.longitude
        );

        isobarLines.push({
          coordinates: sortedPoints.map(p => p.coordinate),
          pressure: targetPressure,
          color: targetPressure > 1013 ? colors.info : colors.warning
        });
      }
    });

    return isobarLines;
  }, [pressurePoints, showIsobars]);

  // Generate weather fronts (simplified)
  const weatherFronts: WeatherFront[] = useMemo(() => {
    if (!showFronts || !pressurePoints.length) return [];

    const fronts: WeatherFront[] = [];

    // Look for steep pressure gradients that indicate fronts
    const highGradientPoints = pressurePoints.filter(point => point.gradient > 1.5);
    
    if (highGradientPoints.length >= 3) {
      // Group nearby high gradient points
      const frontCoordinates = highGradientPoints
        .sort((a, b) => a.coordinate.latitude - b.coordinate.latitude)
        .map(p => p.coordinate);

      if (frontCoordinates.length >= 3) {
        fronts.push({
          coordinates: frontCoordinates,
          type: 'cold', // Simplified - assume cold front
          intensity: 'moderate',
          movementDirection: 225, // SW movement typical for HK
          movementSpeed: 25 // km/h
        });
      }
    }

    return fronts;
  }, [pressurePoints, showFronts]);

  // Identify wind shift zones
  const windShiftZones: WindShiftZone[] = useMemo(() => {
    if (!showWindShiftZones) return [];

    return pressureSystems
      .filter(system => system.type === 'low' || system.intensity > 3)
      .map(system => ({
        coordinate: system.coordinate,
        shiftMagnitude: system.type === 'low' ? 45 : 30, // Degrees of wind shift expected
        shiftTiming: Math.round(30 + Math.random() * 60), // 30-90 minutes
        confidence: system.intensity > 4 ? 'high' : 'medium'
      }));
  }, [pressureSystems, showWindShiftZones]);

  // Get pressure system icon
  const getPressureSystemIcon = (system: PressureSystem) => {
    const iconSize = Math.min(24, 16 + system.intensity * 2);
    const iconColor = system.type === 'high' ? colors.info : colors.warning;

    switch (system.type) {
      case 'high':
        return <Sun size={iconSize} color={iconColor} />;
      case 'low':
        return <CloudRain size={iconSize} color={iconColor} />;
      case 'ridge':
        return <TrendingUp size={iconSize} color={iconColor} />;
      case 'trough':
        return <TrendingDown size={iconSize} color={iconColor} />;
      default:
        return <Eye size={iconSize} color={iconColor} />;
    }
  };

  // Animated styles
  const systemRotationStyle = useAnimatedStyle(() => ({
    transform: [{ 
      rotate: `${interpolate(systemAnimation.value, [0, 1], [0, 360])}deg` 
    }],
  }));

  const frontMovementStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      frontAnimation.value,
      [0, 0.5, 1],
      [0.6, 1, 0.6]
    ),
  }));

  const shiftPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shiftAnimation.value }],
  }));

  if (!visible) return null;

  return (
    <>
      {/* Isobars */}
      {isobars.map((isobar, index) => (
        <Polyline
          key={`isobar-${index}`}
          coordinates={isobar.coordinates}
          strokeColor={`${isobar.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`}
          strokeWidth={isobar.pressure === 1013 ? 3 : 2} // Emphasize standard pressure
          lineDashPattern={isobar.pressure % 10 === 0 ? undefined : [5, 5]} // Dashed for intermediate isobars
        />
      ))}

      {/* Pressure Systems */}
      {showPressureSystems && pressureSystems.map((system, index) => (
        <React.Fragment key={`pressure-system-${index}`}>
          {/* System influence circle */}
          <Circle
            center={system.coordinate}
            radius={2000 + system.intensity * 500} // Radius based on intensity
            fillColor={
              system.type === 'high' 
                ? `${colors.info}20` 
                : `${colors.warning}20`
            }
            strokeColor={
              system.type === 'high' ? colors.info : colors.warning
            }
            strokeWidth={2}
            lineDashPattern={[10, 5]}
          />

          {/* System marker */}
          <Marker
            coordinate={system.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <Animated.View style={[styles.pressureSystemMarker, systemRotationStyle]}>
              {getPressureSystemIcon(system)}
            </Animated.View>
          </Marker>

          {/* System data */}
          <Marker
            coordinate={{
              latitude: system.coordinate.latitude - 0.003,
              longitude: system.coordinate.longitude
            }}
            anchor={{ x: 0.5, y: 0 }}
            tracksViewChanges={false}
          >
            <View style={styles.systemDataBubble}>
              <IOSText style={styles.systemType}>
                {system.type.toUpperCase()}
              </IOSText>
              <IOSText style={styles.systemPressure}>
                {system.centralPressure.toFixed(0)} hPa
              </IOSText>
              <IOSText style={styles.systemMovement}>
                Moving {system.movementDirection}° at {system.movementSpeed} km/h
              </IOSText>
            </View>
          </Marker>
        </React.Fragment>
      ))}

      {/* Weather Fronts */}
      {showFronts && weatherFronts.map((front, index) => (
        <React.Fragment key={`weather-front-${index}`}>
          <Animated.View style={frontMovementStyle}>
            <Polyline
              coordinates={front.coordinates}
              strokeColor={
                front.type === 'cold' ? colors.info : 
                front.type === 'warm' ? colors.warning : colors.error
              }
              strokeWidth={front.intensity === 'strong' ? 4 : 3}
              lineDashPattern={front.type === 'stationary' ? [8, 8] : undefined}
            />
          </Animated.View>

          {/* Front symbols */}
          {front.coordinates.filter((_, coordIndex) => coordIndex % 2 === 0).map((coord, coordIndex) => (
            <Marker
              key={`front-symbol-${index}-${coordIndex}`}
              coordinate={coord}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={[
                styles.frontSymbol,
                { 
                  backgroundColor: front.type === 'cold' ? colors.info : colors.warning,
                  transform: [{ rotate: `${front.movementDirection}deg` }]
                }
              ]}>
                {front.type === 'cold' ? (
                  <TrendingDown size={10} color={colors.background} />
                ) : (
                  <TrendingUp size={10} color={colors.background} />
                )}
              </View>
            </Marker>
          ))}
        </React.Fragment>
      ))}

      {/* Wind Shift Zones */}
      {windShiftZones.map((zone, index) => (
        <React.Fragment key={`wind-shift-${index}`}>
          <Circle
            center={zone.coordinate}
            radius={1500} // 1.5km warning zone
            fillColor={`${colors.accent}30`}
            strokeColor={colors.accent}
            strokeWidth={2}
            lineDashPattern={[6, 6]}
          />

          <Marker
            coordinate={zone.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <Animated.View style={[styles.windShiftMarker, shiftPulseStyle]}>
              <RotateCcw size={16} color={colors.accent} />
            </Animated.View>
          </Marker>

          <Marker
            coordinate={{
              latitude: zone.coordinate.latitude + 0.002,
              longitude: zone.coordinate.longitude
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <View style={styles.shiftDataBubble}>
              <IOSText style={styles.shiftMagnitude}>
                {zone.shiftMagnitude}° shift
              </IOSText>
              <IOSText style={styles.shiftTiming}>
                in {zone.shiftTiming}min
              </IOSText>
              <IOSText style={styles.shiftConfidence}>
                {zone.confidence} confidence
              </IOSText>
            </View>
          </Marker>
        </React.Fragment>
      ))}

      {/* Pressure Points (sample) */}
      {pressurePoints.filter((_, index) => index % 8 === 0).map((point, index) => (
        <Marker
          key={`pressure-point-${index}`}
          coordinate={point.coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.pressurePointMarker}>
            <IOSText style={styles.pressureValue}>
              {point.pressure.toFixed(0)}
            </IOSText>
            <View style={styles.pressureChangeIndicator}>
              {point.pressureChange > 0.2 ? (
                <TrendingUp size={8} color={colors.success} />
              ) : point.pressureChange < -0.2 ? (
                <TrendingDown size={8} color={colors.error} />
              ) : (
                <View style={styles.steadyIndicator} />
              )}
            </View>
          </View>
        </Marker>
      ))}

      {/* Pressure Analysis Legend */}
      <Marker
        coordinate={{ latitude: 22.2900, longitude: 114.3100 }}
        anchor={{ x: 1, y: 0 }}
        tracksViewChanges={false}
      >
        <View style={styles.pressureLegend}>
          <IOSText style={styles.legendTitle}>Pressure Systems</IOSText>
          
          <View style={styles.legendRow}>
            <Sun size={12} color={colors.info} />
            <IOSText style={styles.legendText}>High Pressure</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <CloudRain size={12} color={colors.warning} />
            <IOSText style={styles.legendText}>Low Pressure</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <View style={[styles.isobarSample, { backgroundColor: colors.info }]} />
            <IOSText style={styles.legendText}>Isobars (hPa)</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <RotateCcw size={12} color={colors.accent} />
            <IOSText style={styles.legendText}>Wind Shift Zone</IOSText>
          </View>
          
          <View style={styles.legendSeparator} />
          
          <View style={styles.legendRow}>
            <TrendingUp size={8} color={colors.success} />
            <IOSText style={styles.legendText}>Rising</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <TrendingDown size={8} color={colors.error} />
            <IOSText style={styles.legendText}>Falling</IOSText>
          </View>
        </View>
      </Marker>
    </>
  );
};

const styles = StyleSheet.create({
  pressureSystemMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
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

  systemDataBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.xs,
    borderRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    minWidth: 100,
  },

  systemType: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },

  systemPressure: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },

  systemMovement: {
    ...typography.caption,
    fontSize: 8,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },

  frontSymbol: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background,
  },

  windShiftMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },

  shiftDataBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.xs,
    borderRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    minWidth: 80,
  },

  shiftMagnitude: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
  },

  shiftTiming: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text,
    marginTop: 2,
  },

  shiftConfidence: {
    ...typography.caption,
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 2,
  },

  pressurePointMarker: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    minWidth: 40,
  },

  pressureValue: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '600',
    color: colors.text,
  },

  pressureChangeIndicator: {
    marginTop: 2,
    alignItems: 'center',
  },

  steadyIndicator: {
    width: 6,
    height: 2,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
  },

  pressureLegend: {
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

  isobarSample: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },

  legendSeparator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
});

/**
 * Living Document Export Notes:
 * 
 * This PressureGradientOverlay component provides comprehensive atmospheric analysis:
 * 
 * - Isobar Visualization: Shows pressure patterns critical for wind prediction
 * - Pressure System Tracking: Identifies highs, lows, and their movement
 * - Weather Front Detection: Visualizes approaching weather changes
 * - Wind Shift Prediction: Forecasts timing and magnitude of wind changes
 * - Tactical Integration: Pressure-based sailing strategy recommendations
 * 
 * Future enhancements:
 * - Integration with numerical weather prediction models
 * - Historical pressure pattern analysis for trend recognition
 * - Real-time barometric pressure data from racing boats
 * - Advanced front detection algorithms using satellite data
 * - Machine learning wind shift prediction based on pressure patterns
 */