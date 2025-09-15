import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence
} from '../../utils/reanimatedWrapper';
import { 
  Navigation, 
  ArrowUp, 
  TrendingUp,
  Target,
  Wind,
  AlertTriangle,
  CheckCircle
} from 'lucide-react-native';
import Svg, { 
  Line, 
  Circle, 
  Path, 
  Defs, 
  LinearGradient, 
  Stop, 
  Polygon,
  Text as SvgText
} from 'react-native-svg';
import { colors, typography, spacing } from '../../constants/theme';
import { 
  darkSkyColors, 
  darkSkyTypography, 
  darkSkySpacing,
  darkSkyCharts,
  racingConditionUtils 
} from '../../constants/darkSkyTheme';

const { width } = Dimensions.get('window');
const WIDGET_WIDTH = width - (darkSkySpacing.cardMargin * 2);
const SVG_SIZE = WIDGET_WIDTH - (darkSkySpacing.cardPadding * 2);

interface StartLineData {
  startLineBearing: number; // degrees
  windDirection: number;
  windSpeed: number;
  lineLength: number; // meters
  favoredEnd: 'port' | 'starboard' | 'neutral';
  bias: number; // degrees of bias
}

interface BoatPosition {
  position: number; // 0-1 along start line (0 = port, 1 = starboard)
  advantage: 'optimal' | 'good' | 'poor';
  clearAir: boolean;
  laylineDistance: number; // meters to layline
}

interface StartLineAnalysisWidgetProps {
  startLineData: StartLineData;
  currentPosition?: BoatPosition;
  timeToStart?: number; // seconds
  showTacticalAdvice?: boolean;
  onPositionOptimize?: (position: number) => void;
}

export const StartLineAnalysisWidget: React.FC<StartLineAnalysisWidgetProps> = ({
  startLineData,
  currentPosition,
  timeToStart,
  showTacticalAdvice = true,
  onPositionOptimize
}) => {
  const pulseValue = useSharedValue(1);
  const windArrowRotation = useSharedValue(startLineData.windDirection);

  // Calculate start line geometry
  const lineGeometry = useMemo(() => {
    const centerX = SVG_SIZE / 2;
    const centerY = SVG_SIZE / 2;
    const lineLength = Math.min(SVG_SIZE * 0.6, startLineData.lineLength);
    
    // Convert bearing to radians for calculations
    const bearingRad = (startLineData.startLineBearing * Math.PI) / 180;
    
    const portX = centerX - Math.cos(bearingRad) * lineLength / 2;
    const portY = centerY - Math.sin(bearingRad) * lineLength / 2;
    const starboardX = centerX + Math.cos(bearingRad) * lineLength / 2;
    const starboardY = centerY + Math.sin(bearingRad) * lineLength / 2;
    
    return {
      port: { x: portX, y: portY },
      starboard: { x: starboardX, y: starboardY },
      center: { x: centerX, y: centerY },
      length: lineLength
    };
  }, [startLineData.startLineBearing, startLineData.lineLength]);

  // Calculate wind arrow position
  const windArrow = useMemo(() => {
    const windRad = (startLineData.windDirection * Math.PI) / 180;
    const arrowLength = 40;
    const startX = lineGeometry.center.x;
    const startY = lineGeometry.center.y - 60;
    
    return {
      start: { x: startX, y: startY },
      end: { 
        x: startX + Math.sin(windRad) * arrowLength,
        y: startY - Math.cos(windRad) * arrowLength
      }
    };
  }, [startLineData.windDirection, lineGeometry.center]);

  // Determine favored end visually
  const favoredEndColor = useMemo(() => {
    switch (startLineData.favoredEnd) {
      case 'port':
        return darkSkyColors.portAdvantage;
      case 'starboard':
        return darkSkyColors.starboardAdvantage;
      default:
        return darkSkyColors.startLineNeutral;
    }
  }, [startLineData.favoredEnd]);

  // Animation for countdown
  React.useEffect(() => {
    if (timeToStart && timeToStart <= 60) {
      pulseValue.value = withRepeat(
        withSequence(
          withSpring(1.2),
          withSpring(1)
        ),
        -1,
        false
      );
    } else {
      pulseValue.value = withSpring(1);
    }
  }, [timeToStart]);

  React.useEffect(() => {
    windArrowRotation.value = withSpring(startLineData.windDirection);
  }, [startLineData.windDirection]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }]
  }));

  const getPositionAdvice = (): { 
    recommendation: string; 
    reasoning: string; 
    color: string;
    icon: React.ReactNode;
  } => {
    const bias = Math.abs(startLineData.bias);
    
    if (bias <= 5) {
      return {
        recommendation: 'Start anywhere with clear air',
        reasoning: 'Line is square - prioritize clean start over position',
        color: darkSkyColors.startLineNeutral,
        icon: <CheckCircle color={darkSkyColors.startLineNeutral} size={16} />
      };
    } else if (bias <= 15) {
      return {
        recommendation: `Favor ${startLineData.favoredEnd} end`,
        reasoning: `${bias.toFixed(0)}° bias gives slight advantage`,
        color: favoredEndColor,
        icon: <Target color={favoredEndColor} size={16} />
      };
    } else {
      return {
        recommendation: `Commit to ${startLineData.favoredEnd} end`,
        reasoning: `${bias.toFixed(0)}° bias - significant advantage`,
        color: favoredEndColor,
        icon: <TrendingUp color={favoredEndColor} size={16} />
      };
    }
  };

  const advice = getPositionAdvice();

  // Generate wind shadow zones
  const windShadowPaths = useMemo(() => {
    const shadows = [];
    const boatLength = darkSkyCharts.startLineChart.boatLength;
    const shadowLength = boatLength * 3; // 3 boat lengths
    
    // Simplified wind shadow representation
    for (let i = 0; i < 5; i++) {
      const position = i * 0.2; // Every 20% along line
      const boatX = lineGeometry.port.x + (lineGeometry.starboard.x - lineGeometry.port.x) * position;
      const boatY = lineGeometry.port.y + (lineGeometry.starboard.y - lineGeometry.port.y) * position;
      
      const windRad = (startLineData.windDirection * Math.PI) / 180;
      const shadowX = boatX + Math.sin(windRad) * shadowLength;
      const shadowY = boatY - Math.cos(windRad) * shadowLength;
      
      shadows.push(`M ${boatX},${boatY} L ${shadowX},${shadowY}`);
    }
    
    return shadows;
  }, [lineGeometry, startLineData.windDirection]);

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <View style={styles.titleSection}>
          <Navigation color={darkSkyColors.accent} size={20} />
          <Text style={styles.title}>Start Line Analysis</Text>
          {timeToStart && timeToStart <= 300 && (
            <Animated.View style={[styles.countdown, pulseStyle]}>
              <Text style={styles.countdownText}>
                T-{Math.floor(timeToStart / 60)}:{(timeToStart % 60).toString().padStart(2, '0')}
              </Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* Start line visualization */}
      <Animated.View style={styles.visualization} entering={FadeInDown.delay(200)}>
        <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
          <Defs>
            <LinearGradient id="favoredGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={darkSkyColors.portAdvantage} stopOpacity={0.3} />
              <Stop offset="50%" stopColor={darkSkyColors.startLineNeutral} stopOpacity={0.1} />
              <Stop offset="100%" stopColor={darkSkyColors.starboardAdvantage} stopOpacity={0.3} />
            </LinearGradient>
          </Defs>

          {/* Wind shadow zones */}
          {windShadowPaths.map((path, index) => (
            <Path
              key={index}
              d={path}
              stroke={darkSkyColors.textMuted}
              strokeWidth="2"
              strokeOpacity={0.3}
              strokeDasharray="4,4"
            />
          ))}

          {/* Start line */}
          <Line
            x1={lineGeometry.port.x}
            y1={lineGeometry.port.y}
            x2={lineGeometry.starboard.x}
            y2={lineGeometry.starboard.y}
            stroke={darkSkyColors.textPrimary}
            strokeWidth="4"
          />

          {/* Port end marker */}
          <Circle
            cx={lineGeometry.port.x}
            cy={lineGeometry.port.y}
            r="8"
            fill={startLineData.favoredEnd === 'port' ? darkSkyColors.portAdvantage : darkSkyColors.textTertiary}
          />
          <SvgText
            x={lineGeometry.port.x}
            y={lineGeometry.port.y - 15}
            textAnchor="middle"
            fill={darkSkyColors.textSecondary}
            fontSize="12"
            fontWeight="600"
          >
            PORT
          </SvgText>

          {/* Starboard end marker */}
          <Circle
            cx={lineGeometry.starboard.x}
            cy={lineGeometry.starboard.y}
            r="8"
            fill={startLineData.favoredEnd === 'starboard' ? darkSkyColors.starboardAdvantage : darkSkyColors.textTertiary}
          />
          <SvgText
            x={lineGeometry.starboard.x}
            y={lineGeometry.starboard.y - 15}
            textAnchor="middle"
            fill={darkSkyColors.textSecondary}
            fontSize="12"
            fontWeight="600"
          >
            STBD
          </SvgText>

          {/* Wind arrow */}
          <Line
            x1={windArrow.start.x}
            y1={windArrow.start.y}
            x2={windArrow.end.x}
            y2={windArrow.end.y}
            stroke={darkSkyColors.accent}
            strokeWidth="3"
            markerEnd="url(#arrowhead)"
          />
          
          {/* Wind direction indicator */}
          <Circle
            cx={windArrow.start.x}
            cy={windArrow.start.y}
            r="15"
            fill={darkSkyColors.backgroundTertiary}
            stroke={darkSkyColors.accent}
            strokeWidth="2"
          />
          <SvgText
            x={windArrow.start.x}
            y={windArrow.start.y + 4}
            textAnchor="middle"
            fill={darkSkyColors.textPrimary}
            fontSize="10"
            fontWeight="600"
          >
            W
          </SvgText>

          {/* Current position indicator */}
          {currentPosition && (
            <Circle
              cx={lineGeometry.port.x + (lineGeometry.starboard.x - lineGeometry.port.x) * currentPosition.position}
              cy={lineGeometry.port.y + (lineGeometry.starboard.y - lineGeometry.port.y) * currentPosition.position}
              r="6"
              fill={darkSkyColors.raceActive}
              stroke={darkSkyColors.textPrimary}
              strokeWidth="2"
            />
          )}

          {/* Bias indicator arc */}
          {startLineData.bias > 5 && (
            <Path
              d={`M ${lineGeometry.center.x - 30} ${lineGeometry.center.y} 
                  A 30 30 0 0 ${startLineData.favoredEnd === 'starboard' ? 1 : 0} 
                  ${lineGeometry.center.x + 30} ${lineGeometry.center.y}`}
              stroke={favoredEndColor}
              strokeWidth="2"
              fill="none"
              strokeDasharray="3,2"
            />
          )}
        </Svg>
      </Animated.View>

      {/* Metrics */}
      <Animated.View style={styles.metrics} entering={FadeInDown.delay(300)}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{Math.round(startLineData.windSpeed)}</Text>
          <Text style={styles.metricUnit}>kts</Text>
          <Text style={styles.metricLabel}>Wind Speed</Text>
        </View>
        
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{Math.abs(startLineData.bias).toFixed(0)}°</Text>
          <Text style={styles.metricUnit}>{startLineData.favoredEnd}</Text>
          <Text style={styles.metricLabel}>Line Bias</Text>
        </View>
        
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{(startLineData.lineLength / 1000).toFixed(1)}</Text>
          <Text style={styles.metricUnit}>km</Text>
          <Text style={styles.metricLabel}>Line Length</Text>
        </View>
      </Animated.View>

      {/* Tactical advice */}
      {showTacticalAdvice && (
        <Animated.View style={styles.advice} entering={FadeInDown.delay(400)}>
          <View style={styles.adviceHeader}>
            {advice.icon}
            <Text style={[styles.adviceTitle, { color: advice.color }]}>
              {advice.recommendation}
            </Text>
          </View>
          <Text style={styles.adviceText}>
            {advice.reasoning}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkSkyColors.cardBackground,
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
  },
  title: {
    ...darkSkyTypography.bodyLarge,
    color: darkSkyColors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginLeft: darkSkySpacing.sm,
  },
  countdown: {
    backgroundColor: darkSkyColors.raceActive + '20',
    paddingHorizontal: darkSkySpacing.sm,
    paddingVertical: darkSkySpacing.xs,
    borderRadius: darkSkySpacing.sm,
  },
  countdownText: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.raceActive,
    fontWeight: '700',
    fontFamily: 'monospace',
  },

  visualization: {
    alignItems: 'center',
    marginBottom: darkSkySpacing.lg,
    backgroundColor: darkSkyColors.backgroundSecondary,
    borderRadius: darkSkySpacing.md,
    padding: darkSkySpacing.sm,
  },

  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: darkSkySpacing.lg,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    ...darkSkyTypography.displaySmall,
    color: darkSkyColors.textPrimary,
    fontWeight: '300',
  },
  metricUnit: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textTertiary,
    marginTop: -4,
  },
  metricLabel: {
    ...darkSkyTypography.caption,
    color: darkSkyColors.textTertiary,
    marginTop: darkSkySpacing.xs,
  },

  advice: {
    backgroundColor: darkSkyColors.backgroundTertiary,
    borderRadius: darkSkySpacing.md,
    padding: darkSkySpacing.lg,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: darkSkySpacing.sm,
  },
  adviceTitle: {
    ...darkSkyTypography.bodyMedium,
    fontWeight: '600',
    marginLeft: darkSkySpacing.sm,
  },
  adviceText: {
    ...darkSkyTypography.bodySmall,
    color: darkSkyColors.textSecondary,
    lineHeight: 18,
  },
});