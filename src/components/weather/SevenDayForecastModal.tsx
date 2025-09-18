import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from '../../utils/reanimatedWrapper';
import {
  X,
  Wind,
  Waves,
  Anchor,
  Thermometer,
  Droplets,
  Eye,
  Sun,
  Cloud,
  CloudRain,
  ChevronRight,
} from 'lucide-react-native';

import { IOSText } from '../ios/IOSText';
import { DailyForecastData, LocationCoordinate } from '../../stores/weatherStore';
import { useDailyForecast } from '../../stores/weatherStore';
import { WindStation } from '../../services/windStationService';
import { WaveStation } from '../../services/waveDataService';
import { TideStation } from '../../services/tideDataService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SevenDayForecastModalProps {
  visible: boolean;
  onClose: () => void;
  station: {
    id: string;
    name: string;
    type: 'wind' | 'wave' | 'tide';
    coordinate: LocationCoordinate;
    data: WindStation | WaveStation | TideStation;
  } | null;
}

const getWeatherIcon = (conditions: string, size: number = 24) => {
  const condition = conditions.toLowerCase();
  const color = '#007AFF';

  if (condition.includes('rain') || condition.includes('storm')) {
    return <CloudRain size={size} color={color} />;
  }
  if (condition.includes('cloud')) {
    return <Cloud size={size} color={color} />;
  }
  if (condition.includes('clear') || condition.includes('sunny')) {
    return <Sun size={size} color={color} />;
  }
  return <Cloud size={size} color={color} />;
};

const formatWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const getSailingConditionColor = (condition: string): string => {
  switch (condition) {
    case 'excellent': return '#00C896';
    case 'good': return '#32D74B';
    case 'moderate': return '#FF9500';
    case 'poor': return '#FF9F0A';
    case 'dangerous': return '#FF3B30';
    default: return '#8E8E93';
  }
};

const getSailingConditionText = (condition: string): string => {
  switch (condition) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'moderate': return 'Moderate';
    case 'poor': return 'Poor';
    case 'dangerous': return 'Dangerous';
    default: return 'Unknown';
  }
};

export const SevenDayForecastModal: React.FC<SevenDayForecastModalProps> = ({
  visible,
  onClose,
  station,
}) => {
  const [selectedDay, setSelectedDay] = useState<DailyForecastData | null>(null);
  const slideAnimation = useSharedValue(0);

  // Get 7-day forecast data using the existing hook
  const dailyForecast = useDailyForecast(station?.coordinate || null);

  useEffect(() => {
    if (visible) {
      slideAnimation.value = withSpring(1);
      // Auto-select first day when modal opens
      if (dailyForecast && dailyForecast.length > 0) {
        setSelectedDay(dailyForecast[0]);
      }
    } else {
      slideAnimation.value = withSpring(0);
      setSelectedDay(null);
    }
  }, [visible, dailyForecast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - slideAnimation.value) * SCREEN_HEIGHT }],
  }));

  const handleClose = () => {
    slideAnimation.value = withSpring(0);
    setTimeout(onClose, 300);
  };

  const getStationTypeIcon = () => {
    if (!station) return null;

    switch (station.type) {
      case 'wind':
        return <Wind size={20} color="#007AFF" />;
      case 'wave':
        return <Waves size={20} color="#0096FF" />;
      case 'tide':
        return <Anchor size={20} color="#00C864" />;
      default:
        return null;
    }
  };

  const getStationCurrentData = () => {
    if (!station) return null;

    const data = station.data;
    switch (station.type) {
      case 'wind':
        const windData = data as WindStation;
        return {
          primary: `${Math.round(windData.windSpeed)} kts`,
          secondary: formatWindDirection(windData.windDirection),
          tertiary: windData.temperature ? `${Math.round(windData.temperature)}°C` : undefined,
        };
      case 'wave':
        const waveData = data as WaveStation;
        return {
          primary: `${waveData.waveHeight.toFixed(1)}m`,
          secondary: `${waveData.wavePeriod.toFixed(0)}s`,
          tertiary: formatWindDirection(waveData.waveDirection),
        };
      case 'tide':
        const tideData = data as TideStation;
        return {
          primary: `${tideData.currentHeight.toFixed(1)}m`,
          secondary: tideData.trend,
          tertiary: new Date(tideData.nextTide.time).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          }),
        };
      default:
        return null;
    }
  };

  if (!visible || !station) {
    return null;
  }

  const stationData = getStationCurrentData();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          <SafeAreaView style={styles.modalContent} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {getStationTypeIcon()}
                <View style={styles.headerTextContainer}>
                  <IOSText style={styles.stationName}>{station.name}</IOSText>
                  <IOSText style={styles.stationType}>
                    {station.type ? `${station.type.charAt(0).toUpperCase()}${station.type.slice(1)} Station` : 'Weather Station'}
                  </IOSText>
                </View>
              </View>

              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* Current Conditions */}
            <View style={styles.currentConditions}>
              <IOSText style={styles.sectionTitle}>Current Conditions</IOSText>
              <View style={styles.currentDataContainer}>
                <View style={styles.currentDataItem}>
                  <IOSText style={styles.currentDataValue}>{stationData?.primary}</IOSText>
                  <IOSText style={styles.currentDataLabel}>
                    {station.type === 'wind' ? 'Wind Speed' : station.type === 'wave' ? 'Wave Height' : 'Tide Level'}
                  </IOSText>
                </View>
                <View style={styles.currentDataItem}>
                  <IOSText style={styles.currentDataValue}>{stationData?.secondary}</IOSText>
                  <IOSText style={styles.currentDataLabel}>
                    {station.type === 'wind' ? 'Direction' : station.type === 'wave' ? 'Period' : 'Trend'}
                  </IOSText>
                </View>
                {stationData?.tertiary && (
                  <View style={styles.currentDataItem}>
                    <IOSText style={styles.currentDataValue}>{stationData.tertiary}</IOSText>
                    <IOSText style={styles.currentDataLabel}>
                      {station.type === 'wind' ? 'Temperature' : station.type === 'wave' ? 'Direction' : 'Next Tide'}
                    </IOSText>
                  </View>
                )}
              </View>
            </View>

            {/* 7-Day Forecast */}
            <View style={styles.forecastContainer}>
              <IOSText style={styles.sectionTitle}>7-Day Forecast</IOSText>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.daysScroll}
                contentContainerStyle={styles.daysScrollContent}
              >
                {dailyForecast?.map((day, index) => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayCard,
                      selectedDay?.id === day.id && styles.dayCardSelected
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <IOSText style={[
                      styles.dayName,
                      selectedDay?.id === day.id && styles.dayNameSelected
                    ]}>
                      {index === 0 ? 'Today' : day.dayShort}
                    </IOSText>

                    <View style={styles.dayIconContainer}>
                      {getWeatherIcon(day.conditions, 20)}
                    </View>

                    <IOSText style={[
                      styles.dayTemp,
                      selectedDay?.id === day.id && styles.dayTempSelected
                    ]}>
                      {Math.round(day.high)}°
                    </IOSText>
                    <IOSText style={[
                      styles.dayTempLow,
                      selectedDay?.id === day.id && styles.dayTempLowSelected
                    ]}>
                      {Math.round(day.low)}°
                    </IOSText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Detailed Day View */}
            {selectedDay && (
              <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.detailsHeader}>
                  <IOSText style={styles.detailsDate}>
                    {new Date(selectedDay.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </IOSText>
                  <View style={[
                    styles.sailingConditionBadge,
                    { backgroundColor: getSailingConditionColor(selectedDay.sailingConditions) }
                  ]}>
                    <IOSText style={styles.sailingConditionText}>
                      {getSailingConditionText(selectedDay.sailingConditions)} Sailing
                    </IOSText>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Thermometer size={18} color="#FF6B6B" />
                    <IOSText style={styles.detailLabel}>Temperature</IOSText>
                    <IOSText style={styles.detailValue}>
                      {Math.round(selectedDay.high)}° / {Math.round(selectedDay.low)}°
                    </IOSText>
                  </View>

                  <View style={styles.detailItem}>
                    <Wind size={18} color="#007AFF" />
                    <IOSText style={styles.detailLabel}>Wind</IOSText>
                    <IOSText style={styles.detailValue}>
                      {Math.round(selectedDay.windSpeed)} kts {formatWindDirection(selectedDay.windDirection)}
                    </IOSText>
                  </View>

                  <View style={styles.detailItem}>
                    <Waves size={18} color="#0096FF" />
                    <IOSText style={styles.detailLabel}>Waves</IOSText>
                    <IOSText style={styles.detailValue}>
                      {selectedDay.waveHeight.toFixed(1)}m
                    </IOSText>
                  </View>

                  <View style={styles.detailItem}>
                    <Anchor size={18} color="#00C864" />
                    <IOSText style={styles.detailLabel}>Tides</IOSText>
                    <IOSText style={styles.detailValue}>
                      Range: {selectedDay.tideRange.toFixed(1)}m
                    </IOSText>
                  </View>

                  <View style={styles.detailItem}>
                    <Droplets size={18} color="#32D74B" />
                    <IOSText style={styles.detailLabel}>Humidity</IOSText>
                    <IOSText style={styles.detailValue}>
                      {Math.round(selectedDay.humidity)}%
                    </IOSText>
                  </View>

                  <View style={styles.detailItem}>
                    <Sun size={18} color="#FF9500" />
                    <IOSText style={styles.detailLabel}>UV Index</IOSText>
                    <IOSText style={styles.detailValue}>
                      {selectedDay.uvIndex}
                    </IOSText>
                  </View>
                </View>

                <View style={styles.tideTimesContainer}>
                  <IOSText style={styles.tideTimesTitle}>Tide Times</IOSText>
                  <View style={styles.tideTimesGrid}>
                    <View style={styles.tideTimeItem}>
                      <IOSText style={styles.tideTimeLabel}>High Tide</IOSText>
                      <IOSText style={styles.tideTimeValue}>
                        {new Date(`2000-01-01T${selectedDay.highTideTime}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </IOSText>
                    </View>
                    <View style={styles.tideTimeItem}>
                      <IOSText style={styles.tideTimeLabel}>Low Tide</IOSText>
                      <IOSText style={styles.tideTimeValue}>
                        {new Date(`2000-01-01T${selectedDay.lowTideTime}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </IOSText>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  stationType: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  currentConditions: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  currentDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  currentDataItem: {
    alignItems: 'center',
    flex: 1,
  },
  currentDataValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  currentDataLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  forecastContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    marginBottom: 12,
  },
  daysScroll: {
    paddingLeft: 20,
  },
  daysScrollContent: {
    paddingRight: 20,
  },
  dayCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    minWidth: 70,
  },
  dayCardSelected: {
    backgroundColor: '#007AFF',
  },
  dayName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayIconContainer: {
    marginBottom: 8,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTemp: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  dayTempSelected: {
    color: '#FFFFFF',
  },
  dayTempLow: {
    fontSize: 14,
    color: '#8E8E93',
  },
  dayTempLowSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 16,
  },
  detailsDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  sailingConditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sailingConditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  tideTimesContainer: {
    marginBottom: 24,
  },
  tideTimesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  tideTimesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tideTimeItem: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  tideTimeLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  tideTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});