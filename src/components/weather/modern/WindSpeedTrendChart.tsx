import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import { IOSText } from '../../ios';

// Debug logging
console.log('WindSpeedTrendChart - Imports loaded');
console.log('PanGestureHandler available:', !!PanGestureHandler);
console.log('Svg available:', !!Svg);
console.log('Path available:', !!Path);
console.log('Animated available:', !!Animated);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = 40;
const CHART_WIDTH = SCREEN_WIDTH - 16 - (CHART_PADDING * 2);
const CHART_HEIGHT = 220;

export interface ChartDataPoint {
  time: string;
  value: number;
  label?: string;
  timestampMs?: number;
}

interface WindSpeedTrendChartProps {
  data: ChartDataPoint[];
  selectedTimeIndex?: number;
  onTimeSelect?: (index: number) => void;
  color?: string;
  fillColor?: string;
  unit?: string;
  title?: string;
  nowIndex?: number;
}

const formatTime = (timeString: string): string => {
  if (timeString.includes(':')) {
    return timeString;
  }
  // Assume it's in format like "03:00"
  return timeString;
};

const createPath = (points: { x: number; y: number }[]): string => {
  if (points.length === 0) return '';
  
  const path = points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M${point.x},${point.y}`;
    } else {
      // Create smooth curves using quadratic bezier curves
      const prevPoint = points[index - 1];
      const controlPointX = (prevPoint.x + point.x) / 2;
      return `${acc} Q${controlPointX},${prevPoint.y} ${point.x},${point.y}`;
    }
  }, '');
  
  return path;
};

const createAreaPath = (points: { x: number; y: number }[]): string => {
  if (points.length === 0) return '';
  
  const linePath = createPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  
  return `${linePath} L${lastPoint.x},${CHART_HEIGHT} L${firstPoint.x},${CHART_HEIGHT} Z`;
};

export const WindSpeedTrendChart: React.FC<WindSpeedTrendChartProps> = ({
  data,
  selectedTimeIndex = -1,
  onTimeSelect,
  color = '#4A90B8',
  fillColor = '#4A90B8',
  unit = 'kts',
  title = '🌊 Wind Speed Trend',
  nowIndex,
}) => {
  console.log('WindSpeedTrendChart - Component rendering');
  console.log('Data length:', data?.length);
  console.log('Components check:', {
    PanGestureHandler: !!PanGestureHandler,
    Animated: !!Animated,
    Svg: !!Svg,
    View: !!View,
  });
  const panX = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const chartData = useMemo(() => {
    if (data.length === 0) return { points: [], maxValue: 0, minValue: 0 };

    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const valueRange = maxValue - minValue || 1;

    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * CHART_WIDTH;
      const normalizedValue = (point.value - minValue) / valueRange;
      const y = CHART_HEIGHT - (normalizedValue * CHART_HEIGHT * 0.8) - (CHART_HEIGHT * 0.1);
      
      return { x, y, value: point.value, time: point.time };
    });

    return { points, maxValue, minValue, valueRange };
  }, [data]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (event) => {
      isDragging.value = true;
    },
    onActive: (event) => {
      panX.value = Math.max(0, Math.min(CHART_WIDTH, event.x - CHART_PADDING));
    },
    onEnd: () => {
      isDragging.value = false;
      
      // Find closest data point
      const closestIndex = Math.round((panX.value / CHART_WIDTH) * (data.length - 1));
      
      if (onTimeSelect) {
        runOnJS(onTimeSelect)(closestIndex);
      }
    },
  });

  const indicatorStyle = useAnimatedStyle(() => {
    const targetX = selectedTimeIndex >= 0 
      ? (selectedTimeIndex / (data.length - 1)) * CHART_WIDTH
      : panX.value;

    return {
      transform: [
        { translateX: withSpring(targetX) }
      ],
      opacity: withSpring(isDragging.value || selectedTimeIndex >= 0 ? 1 : 0),
    };
  });

  const selectedPoint = useMemo(() => {
    if (selectedTimeIndex >= 0 && selectedTimeIndex < chartData.points.length) {
      return chartData.points[selectedTimeIndex];
    }
    return null;
  }, [selectedTimeIndex, chartData.points]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IOSText style={styles.title}>{title}</IOSText>
        {selectedPoint && (
          <View style={styles.selectedInfo}>
            <IOSText style={styles.selectedValue}>
              {selectedPoint.value} {unit}
            </IOSText>
            <IOSText style={styles.selectedTime}>
              {formatTime(selectedPoint.time)}
            </IOSText>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={styles.chartWrapper}>
            <Svg
              width={CHART_WIDTH + (CHART_PADDING * 2)}
              height={CHART_HEIGHT + 60}
              style={styles.svg}
            >
              <Defs>
                <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={fillColor} stopOpacity="0.3" />
                  <Stop offset="1" stopColor={fillColor} stopOpacity="0.05" />
                </LinearGradient>
              </Defs>

              {/* Chart area fill */}
              <Path
                d={createAreaPath(chartData.points.map(p => ({ x: p.x + CHART_PADDING, y: p.y })))}
                fill="url(#gradient)"
              />

              {/* Chart line */}
              <Path
                d={createPath(chartData.points.map(p => ({ x: p.x + CHART_PADDING, y: p.y })))}
                stroke={color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {chartData.points.map((point, index) => (
                <Circle
                  key={index}
                  cx={point.x + CHART_PADDING}
                  cy={point.y}
                  r={selectedTimeIndex === index ? "6" : "4"}
                  fill={selectedTimeIndex === index ? color : "#FFFFFF"}
                  stroke={color}
                  strokeWidth="2"
                />
              ))}

              {/* Time labels with reduced granularity (every 3 steps) */}
              {data.map((point, index) => {
                if (index % 3 === 0 || index === data.length - 1) {
                  const x = (index / (data.length - 1)) * CHART_WIDTH + CHART_PADDING;
                  const time = new Date(point.time);
                  const hour = time.getHours();
                  const day = time.getDate();
                  const month = time.getMonth() + 1;
                  return (
                    <SvgText
                      key={index}
                      x={x}
                      y={CHART_HEIGHT + 20}
                      fontSize="12"
                      fill="#8E8E93"
                      textAnchor="middle"
                    >
                      {`${hour.toString().padStart(2, '0')}\n${month}/${day}`}
                    </SvgText>
                  );
                }
                return null;
              })}

              {/* Value grid with more ticks */}
              {Array.from({ length: 5 }, (_, i) => {
                const y = 20 + (i * (CHART_HEIGHT - 40)) / 4;
                const val = chartData.maxValue - (i * (chartData.valueRange)) / 4;
                return (
                  <React.Fragment key={`tick-${i}`}>
                    <Line
                      x1={CHART_PADDING}
                      y1={y}
                      x2={CHART_PADDING + CHART_WIDTH}
                      y2={y}
                      stroke="#E5E5EA"
                      strokeWidth="1"
                      strokeDasharray="2,3"
                    />
                    <SvgText
                      x={10}
                      y={y + 4}
                      fontSize="11"
                      fill="#8E8E93"
                      textAnchor="start"
                    >
                      {Math.round(val)} {unit}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* Now marker based on nearest real timestamp index */}
              {data.length > 0 && nowIndex !== undefined && nowIndex >= 0 && nowIndex < data.length && (
                (() => {
                  const x = (nowIndex / (data.length - 1)) * CHART_WIDTH + CHART_PADDING;
                  return (
                    <React.Fragment key="now">
                      <Line
                        x1={x}
                        y1={0}
                        x2={x}
                        y2={CHART_HEIGHT}
                        stroke="#FF3B30"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        opacity="0.8"
                      />
                      <SvgText
                        x={x}
                        y={-4}
                        fontSize="10"
                        fill="#FF3B30"
                        textAnchor="middle"
                      >
                        Now
                      </SvgText>
                    </React.Fragment>
                  );
                })()
              )}

              {/* Selection indicator line */}
              {(isDragging.value || selectedTimeIndex >= 0) && (
                <Line
                  x1={selectedPoint ? selectedPoint.x + CHART_PADDING : panX.value + CHART_PADDING}
                  y1={0}
                  x2={selectedPoint ? selectedPoint.x + CHART_PADDING : panX.value + CHART_PADDING}
                  y2={CHART_HEIGHT}
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.7"
                />
              )}
            </Svg>

            {/* Touch indicator */}
            <Animated.View style={[styles.touchIndicator, indicatorStyle]}>
              <View style={[styles.indicatorDot, { backgroundColor: color }]} />
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  selectedInfo: {
    alignItems: 'flex-end',
  },
  selectedValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A90B8',
  },
  selectedTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartWrapper: {
    position: 'relative',
  },
  svg: {
    overflow: 'visible',
  },
  touchIndicator: {
    position: 'absolute',
    top: -10,
    width: 2,
    height: CHART_HEIGHT + 20,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginTop: 5,
  },
});