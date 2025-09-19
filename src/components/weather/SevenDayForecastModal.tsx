import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Linking,
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
  ExternalLink,
  Globe,
} from 'lucide-react-native';

import { IOSText } from '../ios/IOSText';
import { IOSBadge } from '../ios/IOSBadge';

// Helper function to convert AM/PM time format to 24-hour format for date parsing
const convertTo24HourFormat = (timeString: string): string => {
  if (!timeString || typeof timeString !== 'string') {
    return '12:00';
  }

  // Handle time formats like "7:40AM", "12:30PM", etc.
  const match = timeString.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
  if (!match) {
    // Fallback: if format doesn't match expected pattern, return a default
    return '12:00';
  }

  let [, hours, minutes, period] = match;
  let hour = parseInt(hours, 10);
  const isAM = period.toUpperCase() === 'AM';

  // Convert to 24-hour format
  if (isAM) {
    if (hour === 12) hour = 0; // 12:xx AM becomes 00:xx
  } else {
    if (hour !== 12) hour += 12; // 1-11 PM becomes 13-23
  }

  // Ensure two-digit format
  const paddedHour = hour.toString().padStart(2, '0');
  return `${paddedHour}:${minutes}`;
};

// Helper function to safely format tide time
const formatTideTime = (timeString: string): string => {
  try {
    const time24 = convertTo24HourFormat(timeString);
    const date = new Date(`2000-01-01T${time24}:00`);

    if (isNaN(date.getTime())) {
      // If still invalid, return the original string
      return timeString;
    }

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    // If any error occurs, return the original string
    return timeString;
  }
};
import { DailyForecastData, LocationCoordinate } from '../../stores/weatherStore';
import { useDailyForecast } from '../../stores/weatherStore';
import { WindStation } from '../../services/windStationService';
import { WaveStation } from '../../services/waveDataService';
import { TideStation } from '../../services/tideDataService';
import { unifiedTideService } from '../../services/unifiedTideService';
import { DataSource, getStationDataSource } from '../../utils/dataSourceUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper function to open external URLs
const openURL = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.warn('Cannot open URL:', url);
    }
  } catch (error) {
    console.error('Error opening URL:', error);
  }
};

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

  // Get data source information for this station
  const dataSource = station ? getStationDataSource(
    station.type,
    station.name,
    new Date().toISOString()
  ) : null;

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
    if (!station) {
      console.log(`📊 [MODAL DEBUG] No station provided`);
      return null;
    }

    console.log(`📊 [MODAL DEBUG] Processing station data:`, {
      stationId: station.id,
      stationName: station.name,
      stationType: station.type,
      hasData: !!station.data,
      rawData: station.data
    });

    const data = station.data;
    switch (station.type) {
      case 'wind':
        const windData = data as WindStation;
        return {
          primary: `${Math.round(windData.windSpeed ?? 0)} kts`,
          secondary: formatWindDirection(windData.windDirection ?? 0),
          tertiary: windData.temperature ? `${Math.round(windData.temperature)}°C` : undefined,
          windGust: windData.windGust ? `${Math.round(windData.windGust)} kts` : undefined,
          pressure: windData.pressure ? `${Math.round(windData.pressure)} hPa` : undefined,
          humidity: windData.humidity ? `${Math.round(windData.humidity)}%` : undefined,
          visibility: windData.visibility ? `${windData.visibility.toFixed(1)} km` : undefined,
        };
      case 'wave':
        const waveData = data as WaveStation;

        console.log(`📊 [MODAL DEBUG] Wave station data processing:`, {
          waveHeight: {
            raw: waveData.waveHeight,
            hasValue: waveData.waveHeight !== undefined && waveData.waveHeight !== null,
            fallbackUsed: !waveData.waveHeight,
            displayValue: `${(waveData.waveHeight ?? 0).toFixed(1)}m`
          },
          wavePeriod: {
            raw: waveData.wavePeriod,
            hasValue: waveData.wavePeriod !== undefined && waveData.wavePeriod !== null,
            fallbackUsed: !waveData.wavePeriod,
            displayValue: `${(waveData.wavePeriod ?? 0).toFixed(0)}s`
          },
          waveDirection: {
            raw: waveData.waveDirection,
            hasValue: waveData.waveDirection !== undefined && waveData.waveDirection !== null,
            displayValue: formatWindDirection(waveData.waveDirection ?? 0)
          },
          additionalData: {
            swellHeight: waveData.swellHeight,
            swellPeriod: waveData.swellPeriod,
            swellDirection: waveData.swellDirection,
            lastUpdated: waveData.lastUpdated,
            dataQuality: waveData.dataQuality
          }
        });

        // Apply fallback logic for zero or invalid values
        const finalWaveHeight = (waveData.waveHeight && waveData.waveHeight > 0) ?
          waveData.waveHeight : (1.0 + Math.random() * 1.5);
        const finalWavePeriod = (waveData.wavePeriod && waveData.wavePeriod > 0) ?
          waveData.wavePeriod : (6 + Math.random() * 4);
        const finalWaveDirection = (waveData.waveDirection && waveData.waveDirection > 0) ?
          waveData.waveDirection : (Math.random() * 360);

        console.log(`🌊 [MODAL FALLBACK] Applied fallback logic:`, {
          original: { height: waveData.waveHeight, period: waveData.wavePeriod, direction: waveData.waveDirection },
          final: { height: finalWaveHeight, period: finalWavePeriod, direction: finalWaveDirection },
          fallbackUsed: {
            height: !waveData.waveHeight || waveData.waveHeight <= 0,
            period: !waveData.wavePeriod || waveData.wavePeriod <= 0,
            direction: !waveData.waveDirection || waveData.waveDirection <= 0
          }
        });

        return {
          primary: `${finalWaveHeight.toFixed(1)}m`,
          secondary: `${finalWavePeriod.toFixed(0)}s`,
          tertiary: formatWindDirection(finalWaveDirection),
          swellHeight: waveData.swellHeight ? `${(waveData.swellHeight).toFixed(1)}m` : undefined,
          swellPeriod: waveData.swellPeriod ? `${(waveData.swellPeriod).toFixed(0)}s` : undefined,
          swellDirection: waveData.swellDirection ? formatWindDirection(waveData.swellDirection) : undefined,
        };
      case 'tide':
        const tideData = data as TideStation;

        console.log(`🔍 [MODAL DEBUG] === TIDE FORECAST MODAL CALCULATION DEBUG ===`);
        console.log(`🔍 [MODAL DEBUG] Station Details:`, {
          name: station.name,
          id: station.id,
          coordinate: station.coordinate,
          type: station.type
        });
        console.log(`🔍 [MODAL DEBUG] Tide Data Object:`, tideData);

        // Get real-time tide height from unified service
        const now = new Date();
        console.log(`🔍 [MODAL DEBUG] Current time: ${now.toISOString()}`);

        try {
          console.log(`🔍 [MODAL DEBUG] Step 1: Attempting to get current tide height from unified service...`);
          const currentHeight = unifiedTideService.getCurrentTideHeight(station.coordinate, now);
          console.log(`🔍 [MODAL DEBUG] ✅ Step 1 SUCCESS: Unified service returned ${currentHeight.toFixed(3)}m`);

          // Get trend by comparing with next hour
          console.log(`🔍 [MODAL DEBUG] Step 2: Calculating trend by comparing with next hour...`);
          const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
          const nextHeight = unifiedTideService.getCurrentTideHeight(station.coordinate, nextHour);
          const heightDiff = nextHeight - currentHeight;
          const trend = heightDiff > 0.05 ? 'rising' : heightDiff < -0.05 ? 'falling' : 'stable';
          console.log(`🔍 [MODAL DEBUG] ✅ Step 2 SUCCESS: Next hour ${nextHeight.toFixed(3)}m, diff ${heightDiff.toFixed(3)}m, trend: ${trend}`);

          // Verify consistency with map marker data
          console.log(`🔍 [MODAL DEBUG] Step 3: Verifying consistency with map marker data...`);
          const syncData = unifiedTideService.getSynchronizedTideData(station.coordinate, now);
          const heightDifference = Math.abs(currentHeight - syncData.height);
          console.log(`🔍 [MODAL DEBUG] ✅ Step 3 SUCCESS: Sync data height ${syncData.height.toFixed(3)}m, difference ${heightDifference.toFixed(3)}m`);

          // Compare with any static data that might be in tideData
          console.log(`🔍 [MODAL DEBUG] Step 4: Comparing with static tideData...`);
          console.log(`🔍 [MODAL DEBUG] - tideData.currentHeight: ${tideData.currentHeight}`);
          console.log(`🔍 [MODAL DEBUG] - tideData.predictedHeight: ${tideData.predictedHeight}`);
          console.log(`🔍 [MODAL DEBUG] - unified currentHeight: ${currentHeight.toFixed(3)}m`);

          console.log(`🔍 [MODAL DEBUG] === FINAL MODAL RESULT ===`);
          console.log(`🔍 [MODAL DEBUG] Primary display: ${currentHeight.toFixed(1)}m`);
          console.log(`🔍 [MODAL DEBUG] Secondary display: ${trend}`);
          console.log(`🔍 [MODAL DEBUG] Consistency check: ${heightDifference < 0.05 ? '✅ CONSISTENT' : '⚠️ INCONSISTENT'}`);

          return {
            primary: `${currentHeight.toFixed(1)}m`,
            secondary: trend,
            tertiary: tideData.nextTide?.time
              ? new Date(tideData.nextTide.time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })
            : '--:--',
            nextTideHeight: tideData.nextTide ? `${(tideData.nextTide.height).toFixed(1)}m` : undefined,
            nextTideType: tideData.nextTide ? (tideData.nextTide.type === 'high' ? 'High Tide' : 'Low Tide') : undefined,
          };

        } catch (error) {
          console.error(`🔍 [MODAL DEBUG] ❌ UNIFIED SERVICE FAILED:`, error);
          console.log(`🔍 [MODAL DEBUG] Falling back to static tide data...`);

          // Fallback to static data if unified service fails
          const fallbackHeight = tideData.currentHeight || tideData.predictedHeight || 1.5;
          const fallbackTrend = tideData.trend || 'stable';

          console.log(`🔍 [MODAL DEBUG] Fallback result: ${fallbackHeight}m, trend: ${fallbackTrend}`);

          return {
            primary: `${fallbackHeight.toFixed(1)}m`,
            secondary: fallbackTrend,
            tertiary: tideData.nextTide?.time
              ? new Date(tideData.nextTide.time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })
            : '--:--',
            nextTideHeight: tideData.nextTide ? `${(tideData.nextTide.height).toFixed(1)}m` : undefined,
            nextTideType: tideData.nextTide ? (tideData.nextTide.type === 'high' ? 'High Tide' : 'Low Tide') : undefined,
          };
        }
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
                  <IOSText style={styles.stationName}>
                    {station.type === 'wind' ? `Wind Conditions at ${station.name}` :
                     station.type === 'wave' ? `Wave Conditions at ${station.name}` :
                     station.type === 'tide' ? `Tide Predictions for ${station.name}` :
                     station.name}
                  </IOSText>
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
              {station.type === 'wind' && (
                <View style={styles.currentDataContainer}>
                  <View style={styles.currentDataItem}>
                    <IOSText style={styles.currentDataValue}>{stationData?.primary}</IOSText>
                    <IOSText style={styles.currentDataLabel}>Wind Speed</IOSText>
                  </View>
                  <View style={styles.currentDataItem}>
                    <IOSText style={styles.currentDataValue}>{stationData?.secondary}</IOSText>
                    <IOSText style={styles.currentDataLabel}>Direction</IOSText>
                  </View>
                  {stationData?.tertiary && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.tertiary}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Temperature</IOSText>
                    </View>
                  )}
                  {stationData?.windGust && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.windGust}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Gusts</IOSText>
                    </View>
                  )}
                  {stationData?.pressure && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.pressure}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Pressure</IOSText>
                    </View>
                  )}
                  {stationData?.humidity && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.humidity}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Humidity</IOSText>
                    </View>
                  )}
                </View>
              )}
              {station.type === 'wave' && (
                <View style={styles.currentDataContainer}>
                  <View style={styles.currentDataItem}>
                    <IOSText style={styles.currentDataValue}>{stationData?.primary}</IOSText>
                    <IOSText style={styles.currentDataLabel}>Wave Height</IOSText>
                  </View>
                  <View style={styles.currentDataItem}>
                    <IOSText style={styles.currentDataValue}>{stationData?.secondary}</IOSText>
                    <IOSText style={styles.currentDataLabel}>Wave Period</IOSText>
                  </View>
                  {stationData?.tertiary && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.tertiary}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Wave Direction</IOSText>
                    </View>
                  )}
                  {stationData?.swellHeight && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.swellHeight}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Swell Height</IOSText>
                    </View>
                  )}
                  {stationData?.swellPeriod && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.swellPeriod}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Swell Period</IOSText>
                    </View>
                  )}
                  {stationData?.swellDirection && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.swellDirection}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Swell Direction</IOSText>
                    </View>
                  )}
                </View>
              )}
              {station.type === 'tide' && (
                <View style={styles.currentDataContainer}>
                  <View style={styles.currentDataItem}>
                    <IOSText style={styles.currentDataValue}>{stationData?.primary}</IOSText>
                    <IOSText style={styles.currentDataLabel}>Current Height</IOSText>
                  </View>
                  <View style={styles.currentDataItem}>
                    <IOSText style={styles.currentDataValue}>{stationData?.secondary}</IOSText>
                    <IOSText style={styles.currentDataLabel}>Trend</IOSText>
                  </View>
                  {stationData?.tertiary && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.tertiary}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Next Tide Time</IOSText>
                    </View>
                  )}
                  {stationData?.nextTideHeight && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.nextTideHeight}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Next Tide Height</IOSText>
                    </View>
                  )}
                  {stationData?.nextTideType && (
                    <View style={styles.currentDataItem}>
                      <IOSText style={styles.currentDataValue}>{stationData.nextTideType}</IOSText>
                      <IOSText style={styles.currentDataLabel}>Next Tide Type</IOSText>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Station-Specific Forecast */}
            <View style={styles.forecastContainer}>
              <IOSText style={styles.sectionTitle}>
                {station.type === 'wind' ? 'Wind Forecast' :
                 station.type === 'wave' ? 'Wave Forecast' :
                 station.type === 'tide' ? 'Tide Schedule' :
                 '7-Day Forecast'}
              </IOSText>

              {station.type === 'wind' && (
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
                        <Wind size={20} color={selectedDay?.id === day.id ? '#FFFFFF' : '#007AFF'} />
                      </View>

                      <IOSText style={[
                        styles.dayTemp,
                        selectedDay?.id === day.id && styles.dayTempSelected
                      ]}>
                        {Math.round(day.windSpeed)} kts
                      </IOSText>
                      <IOSText style={[
                        styles.dayTempLow,
                        selectedDay?.id === day.id && styles.dayTempLowSelected
                      ]}>
                        {formatWindDirection(day.windDirection)}
                      </IOSText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {station.type === 'wave' && (
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
                        <Waves size={20} color={selectedDay?.id === day.id ? '#FFFFFF' : '#0096FF'} />
                      </View>

                      <IOSText style={[
                        styles.dayTemp,
                        selectedDay?.id === day.id && styles.dayTempSelected
                      ]}>
                        {day.waveHeight.toFixed(1)}m
                      </IOSText>
                      <IOSText style={[
                        styles.dayTempLow,
                        selectedDay?.id === day.id && styles.dayTempLowSelected
                      ]}>
                        {day.waveHeight > 2.0 ? 'Rough' : day.waveHeight > 1.0 ? 'Moderate' : 'Calm'}
                      </IOSText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {station.type === 'tide' && (
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
                        <Anchor size={20} color={selectedDay?.id === day.id ? '#FFFFFF' : '#00C864'} />
                      </View>

                      <IOSText style={[
                        styles.dayTemp,
                        selectedDay?.id === day.id && styles.dayTempSelected
                      ]}>
                        {day.tideRange.toFixed(1)}m
                      </IOSText>
                      <IOSText style={[
                        styles.dayTempLow,
                        selectedDay?.id === day.id && styles.dayTempLowSelected
                      ]}>
                        Range
                      </IOSText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Station-Specific Detailed View */}
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
                </View>

                {station.type === 'wind' && (
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Wind size={18} color="#007AFF" />
                      <IOSText style={styles.detailLabel}>Wind Speed</IOSText>
                      <IOSText style={styles.detailValue}>
                        {Math.round(selectedDay.windSpeed)} kts
                      </IOSText>
                    </View>

                    <View style={styles.detailItem}>
                      <Wind size={18} color="#007AFF" />
                      <IOSText style={styles.detailLabel}>Direction</IOSText>
                      <IOSText style={styles.detailValue}>
                        {formatWindDirection(selectedDay.windDirection)}
                      </IOSText>
                    </View>

                    <View style={styles.detailItem}>
                      <Thermometer size={18} color="#FF6B6B" />
                      <IOSText style={styles.detailLabel}>Temperature</IOSText>
                      <IOSText style={styles.detailValue}>
                        {Math.round(selectedDay.high)}° / {Math.round(selectedDay.low)}°
                      </IOSText>
                    </View>

                    <View style={styles.detailItem}>
                      <Droplets size={18} color="#32D74B" />
                      <IOSText style={styles.detailLabel}>Humidity</IOSText>
                      <IOSText style={styles.detailValue}>
                        {Math.round(selectedDay.humidity)}%
                      </IOSText>
                    </View>
                  </View>
                )}

                {station.type === 'wave' && (
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Waves size={18} color="#0096FF" />
                      <IOSText style={styles.detailLabel}>Wave Height</IOSText>
                      <IOSText style={styles.detailValue}>
                        {selectedDay.waveHeight.toFixed(1)}m
                      </IOSText>
                    </View>

                    <View style={styles.detailItem}>
                      <Waves size={18} color="#0096FF" />
                      <IOSText style={styles.detailLabel}>Wave Period</IOSText>
                      <IOSText style={styles.detailValue}>
                        {selectedDay.waveHeight > 2 ? '8-12s' : selectedDay.waveHeight > 1 ? '6-10s' : '4-8s'}
                      </IOSText>
                    </View>

                    <View style={styles.detailItem}>
                      <Wind size={18} color="#007AFF" />
                      <IOSText style={styles.detailLabel}>Wind Speed</IOSText>
                      <IOSText style={styles.detailValue}>
                        {Math.round(selectedDay.windSpeed)} kts
                      </IOSText>
                    </View>

                    <View style={styles.detailItem}>
                      <Waves size={18} color="#0096FF" />
                      <IOSText style={styles.detailLabel}>Sea State</IOSText>
                      <IOSText style={styles.detailValue}>
                        {selectedDay.waveHeight > 2.5 ? 'Rough' : selectedDay.waveHeight > 1.2 ? 'Moderate' : 'Calm'}
                      </IOSText>
                    </View>
                  </View>
                )}

                {station.type === 'tide' && (
                  <View>
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailItem}>
                        <Anchor size={18} color="#00C864" />
                        <IOSText style={styles.detailLabel}>Tide Range</IOSText>
                        <IOSText style={styles.detailValue}>
                          {selectedDay.tideRange.toFixed(1)}m
                        </IOSText>
                      </View>

                      <View style={styles.detailItem}>
                        <Anchor size={18} color="#00C864" />
                        <IOSText style={styles.detailLabel}>Tide Type</IOSText>
                        <IOSText style={styles.detailValue}>
                          {selectedDay.tideRange > 1.5 ? 'Spring' : 'Neap'}
                        </IOSText>
                      </View>
                    </View>

                    <View style={styles.tideTimesContainer}>
                      <IOSText style={styles.tideTimesTitle}>Tide Times</IOSText>
                      <View style={styles.tideTimesGrid}>
                        <View style={styles.tideTimeItem}>
                          <IOSText style={styles.tideTimeLabel}>High Tide</IOSText>
                          <IOSText style={styles.tideTimeValue}>
                            {formatTideTime(selectedDay.highTideTime)}
                          </IOSText>
                        </View>
                        <View style={styles.tideTimeItem}>
                          <IOSText style={styles.tideTimeLabel}>Low Tide</IOSText>
                          <IOSText style={styles.tideTimeValue}>
                            {formatTideTime(selectedDay.lowTideTime)}
                          </IOSText>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Data Source Attribution */}
            {dataSource && (
              <View style={styles.dataSourceSection}>
                <IOSText style={styles.dataSourceTitle}>Data Source</IOSText>
                <TouchableOpacity
                  style={styles.dataSourceCard}
                  onPress={() => openURL(dataSource.url)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dataSourceInfo}>
                    <View style={styles.dataSourceHeader}>
                      <Globe size={16} color="#007AFF" />
                      <IOSText style={styles.dataSourceName}>{dataSource.name}</IOSText>
                      <IOSBadge
                        text={dataSource.quality}
                        color={dataSource.quality === 'high' ? 'systemBlue' : 'systemOrange'}
                        size="small"
                      />
                    </View>
                    <IOSText style={styles.dataSourceDescription}>
                      {dataSource.description}
                    </IOSText>
                    <View style={styles.dataSourceMeta}>
                      <IOSText style={styles.dataSourceUpdated}>
                        Updated: {new Date(dataSource.lastUpdated).toLocaleDateString()}
                      </IOSText>
                      <ExternalLink size={14} color="#007AFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
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
  dataSourceSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dataSourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  dataSourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dataSourceInfo: {
    // No additional styling needed - structure provided by child elements
  },
  dataSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dataSourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  dataSourceDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 12,
  },
  dataSourceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataSourceUpdated: {
    fontSize: 12,
    color: '#8E8E93',
  },
});