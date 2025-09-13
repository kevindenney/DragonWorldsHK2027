import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Heatmap, Circle } from 'react-native-maps';
import { Wind, Navigation, TrendingUp, ArrowUp } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle,
  interpolateColor 
} from 'react-native-reanimated';
import { IOSText } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';
import type { WeatherDataPoint } from './WeatherMapLayer';

interface WindPatternHeatmapProps {
  weatherData: WeatherDataPoint[];
  visible: boolean;
  showWindBarbsMode?: boolean;
  showGustIndicators?: boolean;
  animateWindFlow?: boolean;
  showPressureGradient?: boolean;
}

interface WindBarb {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  windSpeed: number;
  windDirection: number;
  gustSpeed?: number;
  pressure?: number;
}

interface WindShear {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  shearIntensity: number;
  shearDirection: number;
  convergence: boolean;
}

export const WindPatternHeatmap: React.FC<WindPatternHeatmapProps> = ({
  weatherData,
  visible,
  showWindBarbsMode = true,
  showGustIndicators = true,
  animateWindFlow = true,
  showPressureGradient = false
}) => {
  // Animation values
  const windFlowAnimation = useSharedValue(0);
  const gustPulseAnimation = useSharedValue(1);

  React.useEffect(() => {
    if (animateWindFlow && visible) {
      windFlowAnimation.value = withRepeat(
        withTiming(1, { duration: 3000 }),
        -1,
        false
      );
    }

    if (showGustIndicators && visible) {
      gustPulseAnimation.value = withRepeat(
        withTiming(1.3, { duration: 1500 }),
        -1,
        true
      );
    }
  }, [animateWindFlow, showGustIndicators, visible, windFlowAnimation, gustPulseAnimation]);

  // Generate heatmap data points for wind intensity
  const heatmapData = useMemo(() => {
    if (!visible || !weatherData.length) return [];
    
    return weatherData.map(point => ({
      latitude: point.coordinate.latitude,
      longitude: point.coordinate.longitude,
      weight: Math.min(1, point.windSpeed / 30), // Normalize wind speed to 0-1
    }));
  }, [weatherData, visible]);

  // Generate wind barbs for detailed wind display
  const windBarbs: WindBarb[] = useMemo(() => {
    if (!weatherData.length) return [];
    
    // Sample every 3rd point to avoid cluttering
    const sampledData = weatherData.filter((_, index) => index % 3 === 0);
    
    return sampledData.map(point => ({
      coordinate: point.coordinate,
      windSpeed: point.windSpeed,
      windDirection: point.windDirection,
      gustSpeed: point.windSpeed + Math.random() * 5, // Simulate gusts
      pressure: 1013 + Math.sin(point.coordinate.latitude * 100) * 10 // Simulate pressure variation
    }));
  }, [weatherData]);

  // Detect wind shear zones
  const windShearZones: WindShear[] = useMemo(() => {
    if (!weatherData.length) return [];
    
    const shearZones: WindShear[] = [];
    const gridSize = 10; // Check every 10th point
    
    for (let i = gridSize; i < weatherData.length - gridSize; i += gridSize) {
      const currentPoint = weatherData[i];
      const surroundingPoints = weatherData.slice(i - gridSize, i + gridSize + 1);
      
      // Calculate wind shear by comparing direction differences
      const directionDifferences = surroundingPoints.map(point => 
        Math.abs(point.windDirection - currentPoint.windDirection)
      );
      
      const maxDirectionDiff = Math.max(...directionDifferences);
      const speedVariance = Math.max(...surroundingPoints.map(p => p.windSpeed)) - 
                           Math.min(...surroundingPoints.map(p => p.windSpeed));
      
      // Identify significant shear zones
      if (maxDirectionDiff > 30 || speedVariance > 5) {
        shearZones.push({
          coordinate: currentPoint.coordinate,
          shearIntensity: (maxDirectionDiff + speedVariance * 6) / 100, // Normalize
          shearDirection: currentPoint.windDirection,
          convergence: speedVariance > maxDirectionDiff / 6
        });
      }
    }
    
    return shearZones;
  }, [weatherData]);

  // Get wind barb style based on wind speed (Beaufort scale visualization)
  const getWindBarbStyle = (windSpeed: number): any => {
    let barbColor: string;
    let barbSize: number;
    
    if (windSpeed < 3) {
      barbColor = colors.textMuted;
      barbSize = 12;
    } else if (windSpeed < 8) {
      barbColor = colors.success;
      barbSize = 14;
    } else if (windSpeed < 15) {
      barbColor = colors.primary;
      barbSize = 16;
    } else if (windSpeed < 25) {
      barbColor = colors.warning;
      barbSize = 18;
    } else {
      barbColor = colors.error;
      barbSize = 20;
    }
    
    return { color: barbColor, size: barbSize };
  };

  // Get wind arrow rotation (wind comes FROM this direction, arrow points TO)
  const getWindArrowRotation = (direction: number): number => {
    return (direction + 180) % 360;
  };

  // Animated styles
  const windFlowStyle = useAnimatedStyle(() => {
    const opacity = 0.3 + windFlowAnimation.value * 0.4;
    return { opacity };
  });

  const gustPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gustPulseAnimation.value }],
  }));

  if (!visible) return null;

  return (
    <>
      {/* Wind Speed Heatmap */}
      <Heatmap
        points={heatmapData}
        opacity={0.6}
        radius={60}
        maxIntensity={1}
        gradientSmoothing={15}
        heatmapMode={'POINTS_WEIGHT'}
      />

      {/* Wind Direction Barbs */}
      {showWindBarbsMode && windBarbs.map((barb, index) => {
        const barbStyle = getWindBarbStyle(barb.windSpeed);
        
        return (
          <React.Fragment key={`wind-barb-${index}`}>
            {/* Main wind barb */}
            <Marker
              coordinate={barb.coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <Animated.View 
                style={[
                  styles.windBarb,
                  windFlowStyle,
                  {
                    transform: [
                      { rotate: `${getWindArrowRotation(barb.windDirection)}deg` }
                    ]
                  }
                ]}
              >
                <Wind size={barbStyle.size} color={barbStyle.color} />
              </Animated.View>
            </Marker>

            {/* Wind speed label for significant winds */}
            {barb.windSpeed > 10 && (
              <Marker
                coordinate={barb.coordinate}
                anchor={{ x: 0.5, y: 1.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.windSpeedLabel}>
                  <IOSText style={styles.windSpeedText}>
                    {barb.windSpeed.toFixed(0)}
                  </IOSText>
                </View>
              </Marker>
            )}

            {/* Gust indicators */}
            {showGustIndicators && barb.gustSpeed && barb.gustSpeed > barb.windSpeed + 2 && (
              <Marker
                coordinate={barb.coordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <Animated.View style={[styles.gustIndicator, gustPulseStyle]}>
                  <View style={styles.gustRing} />
                </Animated.View>
              </Marker>
            )}
          </React.Fragment>
        );
      })}

      {/* Wind Shear Zones */}
      {windShearZones.map((shear, index) => (
        <React.Fragment key={`wind-shear-${index}`}>
          {/* Shear zone circle */}
          <Circle
            center={shear.coordinate}
            radius={200}
            fillColor={shear.convergence ? colors.warning + '30' : colors.error + '30'}
            strokeColor={shear.convergence ? colors.warning : colors.error}
            strokeWidth={2}
            lineDashPattern={[5, 5]}
          />

          {/* Shear indicator */}
          <Marker
            coordinate={shear.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.shearIndicator}>
              {shear.convergence ? (
                <TrendingUp size={16} color={colors.warning} />
              ) : (
                <View style={styles.shearIcon}>
                  <IOSText style={styles.shearText}>⚡</IOSText>
                </View>
              )}
            </View>
          </Marker>
        </React.Fragment>
      ))}

      {/* Pressure Gradient Indicators (if enabled) */}
      {showPressureGradient && windBarbs.filter((_, i) => i % 6 === 0).map((barb, index) => (
        <Marker
          key={`pressure-${index}`}
          coordinate={barb.coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.pressureIndicator}>
            <IOSText style={styles.pressureText}>
              {barb.pressure?.toFixed(0)}
            </IOSText>
          </View>
        </Marker>
      ))}

      {/* Wind Pattern Legend */}
      <Marker
        coordinate={{ latitude: 22.3100, longitude: 114.2100 }}
        anchor={{ x: 0, y: 0 }}
        tracksViewChanges={false}
      >
        <View style={styles.windLegend}>
          <IOSText style={styles.legendTitle}>Wind Speed (kts)</IOSText>
          
          <View style={styles.legendRow}>
            <Wind size={12} color={colors.textMuted} />
            <IOSText style={styles.legendText}>0-3 Light</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <Wind size={14} color={colors.success} />
            <IOSText style={styles.legendText}>3-8 Gentle</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <Wind size={16} color={colors.primary} />
            <IOSText style={styles.legendText}>8-15 Moderate</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <Wind size={18} color={colors.warning} />
            <IOSText style={styles.legendText}>15-25 Fresh</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <Wind size={20} color={colors.error} />
            <IOSText style={styles.legendText}>25+ Strong</IOSText>
          </View>
        </View>
      </Marker>

      {/* Racing Impact Legend */}
      <Marker
        coordinate={{ latitude: 22.3100, longitude: 114.2600 }}
        anchor={{ x: 1, y: 0 }}
        tracksViewChanges={false}
      >
        <View style={styles.racingLegend}>
          <IOSText style={styles.legendTitle}>Racing Conditions</IOSText>
          
          <View style={styles.legendRow}>
            <View style={[styles.shearIcon, { backgroundColor: colors.warning + '30' }]}>
              <TrendingUp size={10} color={colors.warning} />
            </View>
            <IOSText style={styles.legendText}>Wind Convergence</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <View style={[styles.shearIcon, { backgroundColor: colors.error + '30' }]}>
              <IOSText style={[styles.shearText, { fontSize: 8 }]}>⚡</IOSText>
            </View>
            <IOSText style={styles.legendText}>Wind Shear</IOSText>
          </View>
          
          <View style={styles.legendRow}>
            <View style={styles.gustRing} />
            <IOSText style={styles.legendText}>Gust Activity</IOSText>
          </View>
        </View>
      </Marker>
    </>
  );
};

const styles = StyleSheet.create({
  windBarb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  windSpeedLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.xs,
    minWidth: 20,
    alignItems: 'center',
  },

  windSpeedText: {
    ...typography.caption,
    fontSize: 9,
    color: colors.background,
    fontWeight: '700',
  },

  gustIndicator: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  gustRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.warning,
    backgroundColor: 'transparent',
  },

  shearIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.warning,
  },

  shearIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  shearText: {
    fontSize: 12,
    textAlign: 'center',
  },

  pressureIndicator: {
    backgroundColor: 'rgba(100, 100, 255, 0.8)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.info,
  },

  pressureText: {
    ...typography.caption,
    fontSize: 8,
    color: colors.background,
    fontWeight: '600',
  },

  windLegend: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 120,
  },

  racingLegend: {
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
});