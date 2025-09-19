import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import {useSevenDayWeatherStore} from '../stores/sevenDayWeatherStore';
import { formatChartTime } from '../utils/timeUtils';

interface MetricDetailSheetProps {
  metric: 'wind' | 'wave' | 'tide';
  areaKey: string;
  visible: boolean;
  onClose: () => void;
}

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export default function MetricDetailSheet({
  metric,
  areaKey,
  visible,
  onClose
}: MetricDetailSheetProps) {
  const [horizon, setHorizon] = useState<12 | 24 | 48>(24);

  useEffect(() => {
    if (visible) {
      setHorizon(24); // Reset to 24h when modal opens
    }
  }, [visible, metric]);
  const bundle = useSevenDayWeatherStore(state => state.bundles[areaKey]);

  if (!visible) return null;
  if (!bundle) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={styles.title}>Loading...</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={{padding: 20, alignItems: 'center'}}>
                  <ActivityIndicator size="large" color="#0ea5e9" />
                  <Text style={{marginTop: 10, fontSize: 14, color: '#64748b'}}>
                    Loading weather data...
                  </Text>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    );
  }

  // Find current hour index in the times array
  const now = new Date();
  const currentTimeMs = now.getTime();

  // Find the index that corresponds to current time or closest future hour
  let startIndex = 0;
  if (bundle.hourly.times.length > 0) {
    // Find the first timestamp that is at or after current time
    startIndex = bundle.hourly.times.findIndex(time => {
      const timeMs = new Date(time).getTime();
      return timeMs >= currentTimeMs;
    });

    // If no future time found, start from beginning
    if (startIndex === -1) {
      startIndex = 0;
    }

    console.log('🕒 [MetricDetailSheet] Time sync:', {
      currentTime: now.toISOString(),
      startIndex,
      startTime: bundle.hourly.times[startIndex],
      totalTimes: bundle.hourly.times.length
    });
  }

  // Slice arrays based on horizon starting from current time
  const sliceEnd = Math.min(startIndex + horizon, bundle.hourly.times.length);
  const times = bundle.hourly.times.slice(startIndex, sliceEnd);


  // Get data based on metric, sliced from current time
  const getData = () => {
    switch (metric) {
      case 'wind':
        return {
          primary: bundle.hourly.windSpeedKts.slice(startIndex, sliceEnd),
          secondary: bundle.hourly.windDirDeg.slice(startIndex, sliceEnd),
          label: 'Wind Speed (kt)',
          secondaryLabel: 'Direction (°)'
        };
      case 'wave':
        return {
          primary: bundle.hourly.waveHeightM.slice(startIndex, sliceEnd),
          secondary: bundle.hourly.wavePeriodS.slice(startIndex, sliceEnd),
          label: 'Wave Height (m)',
          secondaryLabel: 'Period (s)'
        };
      case 'tide':
        // 🔧 [TIDE FIX] Use unified tide service instead of bundle.hourly.tideHeightM
        console.log('🔧 [METRIC SHEET] === TIDE FORECAST CALCULATION FIX ===');
        console.log('🔧 [METRIC SHEET] OLD DATA - bundle.hourly.tideHeightM:', bundle.hourly.tideHeightM.slice(startIndex, sliceEnd));

        // Generate unified tide data for each time slot
        const unifiedTideData = times.map((timeStr, index) => {
          try {
            // Import unified service dynamically to avoid circular dependencies
            const { unifiedTideService } = require('../services/unifiedTideService');
            const timeForCalculation = new Date(timeStr);
            unifiedTideService.synchronizeTime(timeForCalculation);

            // Get the race area configuration to find the tide station
            const { RACE_AREAS } = require('../config/raceAreas');
            const { RACE_AREA_TIDE_MAP } = require('../config/raceAreaTides');

            const area = RACE_AREAS.find(a => a.key === areaKey);
            if (!area) {
              console.warn(`🔧 [METRIC SHEET] Unknown area key: ${areaKey}`);
              return bundle.hourly.tideHeightM[startIndex + index]; // fallback
            }

            const stationKey = RACE_AREA_TIDE_MAP[areaKey];
            if (!stationKey) {
              console.warn(`🔧 [METRIC SHEET] No tide station mapped for ${areaKey}`);
              return bundle.hourly.tideHeightM[startIndex + index]; // fallback
            }

            const coordinate = { lat: area.lat, lon: area.lon };
            const unifiedHeight = unifiedTideService.getCurrentTideHeight(coordinate, timeForCalculation);

            console.log(`🔧 [METRIC SHEET] Time ${timeStr}: unified=${unifiedHeight}m, old=${bundle.hourly.tideHeightM[startIndex + index]}m`);
            return unifiedHeight;

          } catch (error) {
            console.error(`🔧 [METRIC SHEET] Error calculating unified tide for ${timeStr}:`, error);
            return bundle.hourly.tideHeightM[startIndex + index]; // fallback to old data
          }
        });

        console.log('🔧 [METRIC SHEET] NEW DATA - unifiedTideData:', unifiedTideData);
        console.log('🔧 [METRIC SHEET] === TIDE FORECAST CALCULATION COMPLETE ===');

        return {
          primary: unifiedTideData,
          secondary: null,
          label: 'Tide Height (m)',
          secondaryLabel: null
        };
    }
  };

  const {primary, secondary, label, secondaryLabel} = getData();


  // Find min/max for scaling
  const validPrimary = primary.filter(v => v !== null) as number[];
  const maxPrimary = Math.max(...validPrimary, 1);
  const minPrimary = Math.min(...validPrimary, 0);
  const rangePrimary = maxPrimary - minPrimary || 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  {metric === 'wind' ? 'Wind Forecast' :
                   metric === 'wave' ? 'Wave Forecast' :
                   'Tide Forecast'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

            {/* Segmented Control */}
            <View style={styles.segmentedControl}>
              {([12, 24, 48] as const).map(h => (
                <TouchableOpacity
                  key={h}
                  style={[styles.segment, horizon === h && styles.segmentActive]}
                  onPress={() => setHorizon(h)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, horizon === h && styles.segmentTextActive]}>
                    {h}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart Area */}
            <Text style={{fontSize: 10, color: '#666', textAlign: 'center', marginBottom: 5}}>
              Showing {primary.length} hours from {(() => {
                const timeValue = times[0];
                if (typeof timeValue === 'string' && timeValue.includes('T')) {
                  const hour = parseInt(timeValue.split('T')[1].slice(0, 2));
                  if (hour === 0) return '12AM';
                  if (hour === 12) return '12PM';
                  if (hour < 12) return `${hour}AM`;
                  return `${hour - 12}PM`;
                }
                return 'now';
              })()} HKT
            </Text>
            <ScrollView
              key={`chart-${horizon}-${primary.length}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chartScroll}
            >
              <View style={[styles.chart, {width: primary.length * 34 + 60}]}>
                {/* Y-axis labels */}
                <View style={styles.yAxis}>
                  <Text style={styles.axisLabel}>{maxPrimary.toFixed(1)}</Text>
                  <Text style={styles.axisLabel}>{((maxPrimary + minPrimary) / 2).toFixed(1)}</Text>
                  <Text style={styles.axisLabel}>{minPrimary.toFixed(1)}</Text>
                </View>

                {/* Bars */}
                <View key={`bars-${horizon}-${primary.length}`} style={styles.bars}>
                  {primary.map((value, i) => {
                    const height = value !== null
                      ? ((value - minPrimary) / rangePrimary) * 120
                      : 0;

                    return (
                      <View key={`${horizon}-${i}-${times[i]}`} style={styles.barContainer}>
                        {value !== null && (
                          <View
                            style={[
                              styles.bar,
                              {height, backgroundColor: metric === 'wind' ? '#0ea5e9' :
                                                       metric === 'wave' ? '#06b6d4' :
                                                       '#10b981'}
                            ]}
                          />
                        )}
                        <Text style={styles.timeLabel}>
                          {(() => {
                            const timeValue = times[i];

                            // Simple fallback for weather API ISO timestamps like "2024-01-01T15:00:00"
                            if (typeof timeValue === 'string' && timeValue.includes('T')) {
                              const hour = parseInt(timeValue.split('T')[1].slice(0, 2));
                              if (hour === 0) return '12AM';
                              if (hour === 12) return '12PM';
                              if (hour < 12) return `${hour}AM`;
                              return `${hour - 12}PM`;
                            }

                            // Try our formatting function as fallback
                            try {
                              return formatChartTime(timeValue, { showTimezone: false, use24Hour: false, shortFormat: true });
                            } catch (e) {
                              // Final fallback - just show hour from ISO string
                              if (typeof timeValue === 'string' && timeValue.includes(':')) {
                                return timeValue.split('T')[1]?.slice(0, 2) || '??';
                              }
                              return '??';
                            }
                          })()}
                        </Text>
                        {value !== null && (
                          <Text style={styles.valueLabel}>
                            {value.toFixed(1)}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Secondary data (if applicable) */}
            {secondary && secondaryLabel && (
              <View style={styles.secondaryData}>
                <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.secondaryValues}>
                    {secondary.map((value, i) => (
                      <Text key={i} style={styles.secondaryValue}>
                        {value !== null ? value.toFixed(0) : '-'}
                      </Text>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footer}>
                Sources: Open-Meteo (wind/wave), HKO HHOT (tide)
              </Text>
              <Text style={styles.timezoneFooter}>
                Times in Hong Kong Time (HKT)
              </Text>
            </View>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    minHeight: SCREEN_HEIGHT * 0.5,
    width: '100%',
    overflow: 'hidden'
  },
  safeArea: {
    flex: 1,
    minHeight: SCREEN_HEIGHT * 0.5
  },
  content: {
    padding: 20,
    width: '100%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 0
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    marginRight: 10
  },
  closeButtonContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
    textAlign: 'center'
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 2,
    marginBottom: 20
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  segmentActive: {
    backgroundColor: 'white'
  },
  segmentText: {
    fontSize: 14,
    color: '#64748b'
  },
  segmentTextActive: {
    color: '#0f172a',
    fontWeight: '600'
  },
  chartScroll: {
    marginBottom: 20
  },
  chart: {
    flexDirection: 'row',
    height: 150,
    paddingRight: 20
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  axisLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right'
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 10
  },
  barContainer: {
    width: 30,
    marginHorizontal: 2,
    alignItems: 'center'
  },
  bar: {
    width: 20,
    borderRadius: 2
  },
  timeLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4
  },
  valueLabel: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2
  },
  secondaryData: {
    marginBottom: 20
  },
  secondaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 5
  },
  secondaryValues: {
    flexDirection: 'row'
  },
  secondaryValue: {
    width: 34,
    fontSize: 10,
    color: '#475569',
    textAlign: 'center'
  },
  footerContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  footer: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  timezoneFooter: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  }
});