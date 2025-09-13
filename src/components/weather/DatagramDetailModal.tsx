import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  Wind,
  Waves,
  Anchor,
  X,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';

import { IOSText } from '../ios';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import ChartWithTimeIndicators from './modern/ChartWithTimeIndicators';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DatagramDetailModalProps {
  visible: boolean;
  onClose: () => void;
  location: {
    id: string;
    name: string;
    coordinate: { latitude: number; longitude: number };
  };
  selectedDate: Date;
  selectedTime: Date;
  currentData: {
    windSpeed: number;
    windDirection: number;
    waveHeight: number;
    tideHeight: number;
  };
}

const DatagramDetailModal: React.FC<DatagramDetailModalProps> = ({
  visible,
  onClose,
  location,
  selectedDate,
  selectedTime,
  currentData,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      const newY = context.startY + event.translationY;
      if (newY > 0) {
        translateY.value = newY;
      }
    },
    onEnd: (event) => {
      const shouldClose = event.translationY > 100 || event.velocityY > 500;
      if (shouldClose) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    },
  });

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Generate 24-hour trend data
  const generateTrendData = () => {
    const data = [];
    const baseTime = new Date(selectedDate);
    baseTime.setHours(selectedTime.getHours(), 0, 0, 0);
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(baseTime.getTime() + i * 60 * 60 * 1000);
      const hour = time.getHours();
      
      // Generate realistic trends based on time of day
      const windBase = 8 + Math.sin((hour - 6) * Math.PI / 12) * 6;
      const waveBase = 0.5 + Math.sin((hour - 8) * Math.PI / 12) * 0.8;
      const tideBase = 1.0 + Math.sin((hour * Math.PI / 6)) * 1.2;
      
      // Add some variation
      const windVariation = (Math.random() - 0.5) * 4;
      const waveVariation = (Math.random() - 0.5) * 0.3;
      const tideVariation = (Math.random() - 0.5) * 0.2;
      
      data.push({
        time: time.toISOString(),
        hour: hour,
        windSpeed: Math.max(0, windBase + windVariation),
        waveHeight: Math.max(0.1, waveBase + waveVariation),
        tideHeight: Math.max(0, tideBase + tideVariation),
        isCurrentTime: i === 0, // Mark the first data point as current time
        isForecast: i > 0, // Mark all other points as forecast
      });
    }
    
    return data;
  };

  const trendData = generateTrendData();
  const selectedHour = selectedTime.getHours();

  // Find the current data point
  const currentDataPoint = trendData.find(d => d.hour === selectedHour) || trendData[0];

  // Prepare chart data with reduced time gradients (every 3 hours)
  const windData = trendData.map(d => d.windSpeed);
  const chartData = {
    labels: trendData.map((d, index) => {
      // Show labels only every 3 hours (0, 3, 6, 9, 12, 15, 18, 21)
      if (index % 3 === 0 || index === trendData.length - 1) {
        const time = new Date(d.time);
        const hour = time.getHours();
        const day = time.getDate();
        const month = time.getMonth() + 1;
        return `${hour.toString().padStart(2, '0')}\n${month}/${day}`;
      }
      return '';
    }),
    datasets: [
      {
        data: windData.length > 0 ? windData : [0],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Wind Speed (kts)'],
  };

  const waveData = trendData.map(d => d.waveHeight);
  const waveChartData = {
    labels: trendData.map((d, index) => {
      // Show labels only every 3 hours (0, 3, 6, 9, 12, 15, 18, 21)
      if (index % 3 === 0 || index === trendData.length - 1) {
        const time = new Date(d.time);
        const hour = time.getHours();
        const day = time.getDate();
        const month = time.getMonth() + 1;
        return `${hour.toString().padStart(2, '0')}\n${month}/${day}`;
      }
      return '';
    }),
    datasets: [
      {
        data: waveData.length > 0 ? waveData : [0],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Wave Height (m)'],
  };

  const tideData = trendData.map(d => d.tideHeight);
  const tideChartData = {
    labels: trendData.map((d, index) => {
      // Show labels only every 3 hours (0, 3, 6, 9, 12, 15, 18, 21)
      if (index % 3 === 0 || index === trendData.length - 1) {
        const time = new Date(d.time);
        const hour = time.getHours();
        const day = time.getDate();
        const month = time.getMonth() + 1;
        return `${hour.toString().padStart(2, '0')}\n${month}/${day}`;
      }
      return '';
    }),
    datasets: [
      {
        data: tideData.length > 0 ? tideData : [0],
        color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Tide Height (m)'],
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    // Custom props for better time display
    formatYLabel: (value) => value,
    formatXLabel: (value) => value,
    // Show fewer horizontal lines
    count: 4,
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTrendIcon = (current: number, average: number) => {
    if (current > average) return <TrendingUp size={16} color={colors.success} />;
    return <TrendingDown size={16} color={colors.error} />;
  };

  const windAverage = trendData.reduce((sum, d) => sum + d.windSpeed, 0) / trendData.length;
  const waveAverage = trendData.reduce((sum, d) => sum + d.waveHeight, 0) / trendData.length;
  const tideAverage = trendData.reduce((sum, d) => sum + d.tideHeight, 0) / trendData.length;

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Modal */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.modal, modalStyle]}>
          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            {/* Handle */}
            <View style={styles.handle} />
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.locationInfo}>
                  <IOSText style={styles.locationName}>{location.name}</IOSText>
                  <View style={styles.timeInfo}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <IOSText style={styles.timeText}>
                      {formatDate(selectedDate)} • {formatTime(selectedTime)}
                    </IOSText>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Current Values */}
            <View style={styles.currentValues}>
              <View style={styles.valueCard}>
                <View style={styles.valueHeader}>
                  <Wind size={20} color={colors.primary} />
                  <IOSText style={styles.valueLabel}>Wind Speed</IOSText>
                  {getTrendIcon(currentData.windSpeed, windAverage)}
                </View>
                <IOSText style={styles.valueText}>
                  {currentData.windSpeed.toFixed(1)} kts
                </IOSText>
                <IOSText style={styles.valueSubtext}>
                  {currentData.windDirection}° {getWindDirection(currentData.windDirection)}
                </IOSText>
              </View>

              <View style={styles.valueCard}>
                <View style={styles.valueHeader}>
                  <Waves size={20} color={colors.primary} />
                  <IOSText style={styles.valueLabel}>Wave Height</IOSText>
                  {getTrendIcon(currentData.waveHeight, waveAverage)}
                </View>
                <IOSText style={styles.valueText}>
                  {currentData.waveHeight.toFixed(1)} m
                </IOSText>
                <IOSText style={styles.valueSubtext}>
                  Avg: {waveAverage.toFixed(1)}m
                </IOSText>
              </View>

              <View style={styles.valueCard}>
                <View style={styles.valueHeader}>
                  <Anchor size={20} color={colors.success} />
                  <IOSText style={styles.valueLabel}>Tide Height</IOSText>
                  {getTrendIcon(currentData.tideHeight, tideAverage)}
                </View>
                <IOSText style={styles.valueText}>
                  {currentData.tideHeight.toFixed(1)} m
                </IOSText>
                <IOSText style={styles.valueSubtext}>
                  Avg: {tideAverage.toFixed(1)}m
                </IOSText>
              </View>
            </View>

            {/* Charts */}
            <ScrollView style={styles.chartsContainer} showsVerticalScrollIndicator={false}>
              {/* Wind Chart */}
              <View style={styles.chartSection}>
                <ChartWithTimeIndicators
                  data={chartData}
                  width={SCREEN_WIDTH - 32}
                  height={180}
                  chartConfig={chartConfig}
                  currentTimeIndex={0}
                  forecastStartIndex={1}
                  showCurrentTimeMarker={true}
                  showForecastRange={true}
                  title="🌊 Wind Speed Trend (24h)"
                  footerText={`Current: ${currentData.windSpeed.toFixed(1)} kts at ${selectedHour}:00`}
                  footerSubtext={`Data shows 24h trend • Forecast from ${selectedHour}:00 to ${(selectedHour + 23) % 24}:00`}
                />
              </View>

              {/* Wave Chart */}
              <View style={styles.chartSection}>
                <ChartWithTimeIndicators
                  data={waveChartData}
                  width={SCREEN_WIDTH - 32}
                  height={180}
                  chartConfig={chartConfig}
                  currentTimeIndex={0}
                  forecastStartIndex={1}
                  showCurrentTimeMarker={true}
                  showForecastRange={true}
                  title="🌊 Wave Height Trend (24h)"
                  footerText={`Current: ${currentData.waveHeight.toFixed(1)}m at ${selectedHour}:00`}
                  footerSubtext={`Data shows 24h trend • Forecast from ${selectedHour}:00 to ${(selectedHour + 23) % 24}:00`}
                />
              </View>

              {/* Tide Chart */}
              <View style={styles.chartSection}>
                <ChartWithTimeIndicators
                  data={tideChartData}
                  width={SCREEN_WIDTH - 32}
                  height={180}
                  chartConfig={chartConfig}
                  currentTimeIndex={0}
                  forecastStartIndex={1}
                  showCurrentTimeMarker={true}
                  showForecastRange={true}
                  title="⚓ Tide Height Trend (24h)"
                  footerText={`Current: ${currentData.tideHeight.toFixed(1)}m at ${selectedHour}:00`}
                  footerSubtext={`Data shows 24h trend • Forecast from ${selectedHour}:00 to ${(selectedHour + 23) % 24}:00`}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...shadows.cardLarge,
  },
  safeArea: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
  },
  currentValues: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  valueCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  valueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  valueLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  valueText: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  valueSubtext: {
    ...typography.labelSmall,
    color: colors.textTertiary,
  },
  chartsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chartSection: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  chartTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 8,
    ...shadows.cardSmall,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  chartFooter: {
    marginTop: 8,
    alignItems: 'center',
  },
  chartFooterText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
  },
  chartFooterSubtext: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default DatagramDetailModal;
