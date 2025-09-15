import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useWeatherStore } from '../../stores/weatherStore';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, G, Text as SvgText, Circle } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TrendData {
  current: number;
  previous: number;
  trend: 'rising' | 'falling' | 'steady';
  rate: number;
}

interface WeatherMetrics {
  wind: TrendData;
  tide: TrendData;
  wave: TrendData;
}

const calculateTrend = (current: number, previous: number): TrendData => {
  const diff = current - previous;
  const rate = Math.abs(diff);
  let trend: 'rising' | 'falling' | 'steady';

  if (Math.abs(diff) < 0.1) {
    trend = 'steady';
  } else if (diff > 0) {
    trend = 'rising';
  } else {
    trend = 'falling';
  }

  return { current, previous, trend, rate };
};

const WeatherConditionsOverlay: React.FC = () => {
  const [showDetail, setShowDetail] = useState(false);
  const [metrics, setMetrics] = useState<WeatherMetrics | null>(null);

  const { currentConditions, currentMarine, hourlyForecast } = useWeatherStore();

  useEffect(() => {
    if (currentConditions && currentMarine && hourlyForecast.length > 0) {
      const previousHour = hourlyForecast[0];

      setMetrics({
        wind: calculateTrend(
          currentConditions.windSpeed,
          previousHour?.windSpeed || currentConditions.windSpeed
        ),
        tide: calculateTrend(
          currentMarine.tideHeight,
          previousHour?.tideHeight || currentMarine.tideHeight
        ),
        wave: calculateTrend(
          currentMarine.waveHeight,
          previousHour?.waveHeight || currentMarine.waveHeight
        )
      });
    }
  }, [currentConditions, currentMarine, hourlyForecast]);

  const getTrendIcon = (trend: 'rising' | 'falling' | 'steady') => {
    switch (trend) {
      case 'rising':
        return 'trending-up';
      case 'falling':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = (trend: 'rising' | 'falling' | 'steady', metric: 'wind' | 'tide' | 'wave') => {
    if (trend === 'steady') return '#94a3b8';

    if (metric === 'wind' || metric === 'wave') {
      return trend === 'rising' ? '#ef4444' : '#22c55e';
    } else {
      return trend === 'rising' ? '#3b82f6' : '#f59e0b';
    }
  };

  const renderChart = () => {
    if (!hourlyForecast || hourlyForecast.length === 0) return null;

    const chartWidth = screenWidth - 40;
    const chartHeight = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const data = hourlyForecast.slice(0, 12);

    const windMax = Math.max(...data.map(d => d.windSpeed)) * 1.1;
    const waveMax = Math.max(...data.map(d => d.waveHeight)) * 1.1;
    const tideRange = Math.max(...data.map(d => Math.abs(d.tideHeight))) * 1.1;

    const xScale = (index: number) => (index / (data.length - 1)) * plotWidth + padding.left;
    const windYScale = (value: number) => plotHeight - (value / windMax) * plotHeight + padding.top;
    const waveYScale = (value: number) => plotHeight - (value / waveMax) * plotHeight + padding.top;
    const tideYScale = (value: number) => plotHeight / 2 - (value / tideRange) * (plotHeight / 2) + padding.top;

    const windPath = data.map((d, i) =>
      `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${windYScale(d.windSpeed)}`
    ).join(' ');

    const wavePath = data.map((d, i) =>
      `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${waveYScale(d.waveHeight)}`
    ).join(' ');

    const tidePath = data.map((d, i) =>
      `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${tideYScale(d.tideHeight)}`
    ).join(' ');

    return (
      <Svg width={chartWidth} height={chartHeight}>
        <G>
          <Line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#e2e8f0"
            strokeWidth={1}
          />

          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            stroke="#e2e8f0"
            strokeWidth={1}
          />

          <Line
            x1={padding.left}
            y1={chartHeight / 2}
            x2={chartWidth - padding.right}
            y2={chartHeight / 2}
            stroke="#e2e8f0"
            strokeWidth={0.5}
            strokeDasharray="3,3"
          />

          <Path
            d={windPath}
            stroke="#3b82f6"
            strokeWidth={2}
            fill="none"
          />

          <Path
            d={wavePath}
            stroke="#10b981"
            strokeWidth={2}
            fill="none"
          />

          <Path
            d={tidePath}
            stroke="#f59e0b"
            strokeWidth={2}
            fill="none"
          />

          {data.map((d, i) => (
            <G key={i}>
              <Circle cx={xScale(i)} cy={windYScale(d.windSpeed)} r={3} fill="#3b82f6" />
              <Circle cx={xScale(i)} cy={waveYScale(d.waveHeight)} r={3} fill="#10b981" />
              <Circle cx={xScale(i)} cy={tideYScale(d.tideHeight)} r={3} fill="#f59e0b" />

              {i % 2 === 0 && (
                <SvgText
                  x={xScale(i)}
                  y={chartHeight - padding.bottom + 15}
                  fontSize={10}
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {d.time}
                </SvgText>
              )}
            </G>
          ))}

          <SvgText
            x={15}
            y={padding.top}
            fontSize={10}
            fill="#3b82f6"
            fontWeight="bold"
          >
            Wind
          </SvgText>

          <SvgText
            x={15}
            y={padding.top + 15}
            fontSize={10}
            fill="#10b981"
            fontWeight="bold"
          >
            Wave
          </SvgText>

          <SvgText
            x={15}
            y={padding.top + 30}
            fontSize={10}
            fill="#f59e0b"
            fontWeight="bold"
          >
            Tide
          </SvgText>
        </G>
      </Svg>
    );
  };

  if (!metrics || !currentConditions || !currentMarine) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={styles.overlay}
        onPress={() => setShowDetail(true)}
        activeOpacity={0.9}
      >
        <BlurView intensity={90} tint="light" style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
            style={styles.gradientContainer}
          >
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Ionicons name="speedometer-outline" size={16} color="#3b82f6" />
                  <Text style={styles.metricLabel}>Wind</Text>
                </View>
                <View style={styles.metricValue}>
                  <Text style={styles.valueText}>{metrics.wind.current.toFixed(1)} kts</Text>
                  <Ionicons
                    name={getTrendIcon(metrics.wind.trend)}
                    size={14}
                    color={getTrendColor(metrics.wind.trend, 'wind')}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Ionicons name="water-outline" size={16} color="#f59e0b" />
                  <Text style={styles.metricLabel}>Tide</Text>
                </View>
                <View style={styles.metricValue}>
                  <Text style={styles.valueText}>{metrics.tide.current.toFixed(1)} m</Text>
                  <Ionicons
                    name={getTrendIcon(metrics.tide.trend)}
                    size={14}
                    color={getTrendColor(metrics.tide.trend, 'tide')}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Ionicons name="pulse-outline" size={16} color="#10b981" />
                  <Text style={styles.metricLabel}>Wave</Text>
                </View>
                <View style={styles.metricValue}>
                  <Text style={styles.valueText}>{metrics.wave.current.toFixed(1)} m</Text>
                  <Ionicons
                    name={getTrendIcon(metrics.wave.trend)}
                    size={14}
                    color={getTrendColor(metrics.wave.trend, 'wave')}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>

      <Modal
        visible={showDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weather Conditions Detail</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Ionicons name="close" size={24} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Current Conditions</Text>

                <View style={styles.detailGrid}>
                  <View style={styles.detailCard}>
                    <View style={styles.detailCardHeader}>
                      <Ionicons name="speedometer-outline" size={20} color="#3b82f6" />
                      <Text style={styles.detailCardTitle}>Wind</Text>
                    </View>
                    <Text style={styles.detailCardValue}>{metrics.wind.current.toFixed(1)} kts</Text>
                    <View style={styles.detailCardTrend}>
                      <Ionicons
                        name={getTrendIcon(metrics.wind.trend)}
                        size={16}
                        color={getTrendColor(metrics.wind.trend, 'wind')}
                      />
                      <Text style={[styles.trendText, { color: getTrendColor(metrics.wind.trend, 'wind') }]}>
                        {metrics.wind.rate.toFixed(1)} kts/hr
                      </Text>
                    </View>
                    <Text style={styles.detailCardDirection}>
                      Direction: {currentConditions.windDirection}°
                    </Text>
                  </View>

                  <View style={styles.detailCard}>
                    <View style={styles.detailCardHeader}>
                      <Ionicons name="water-outline" size={20} color="#f59e0b" />
                      <Text style={styles.detailCardTitle}>Tide</Text>
                    </View>
                    <Text style={styles.detailCardValue}>{metrics.tide.current.toFixed(1)} m</Text>
                    <View style={styles.detailCardTrend}>
                      <Ionicons
                        name={getTrendIcon(metrics.tide.trend)}
                        size={16}
                        color={getTrendColor(metrics.tide.trend, 'tide')}
                      />
                      <Text style={[styles.trendText, { color: getTrendColor(metrics.tide.trend, 'tide') }]}>
                        {metrics.tide.rate.toFixed(2)} m/hr
                      </Text>
                    </View>
                    <Text style={styles.detailCardDirection}>
                      Type: {currentMarine.tideType}
                    </Text>
                  </View>

                  <View style={styles.detailCard}>
                    <View style={styles.detailCardHeader}>
                      <Ionicons name="pulse-outline" size={20} color="#10b981" />
                      <Text style={styles.detailCardTitle}>Wave</Text>
                    </View>
                    <Text style={styles.detailCardValue}>{metrics.wave.current.toFixed(1)} m</Text>
                    <View style={styles.detailCardTrend}>
                      <Ionicons
                        name={getTrendIcon(metrics.wave.trend)}
                        size={16}
                        color={getTrendColor(metrics.wave.trend, 'wave')}
                      />
                      <Text style={[styles.trendText, { color: getTrendColor(metrics.wave.trend, 'wave') }]}>
                        {metrics.wave.rate.toFixed(2)} m/hr
                      </Text>
                    </View>
                    <Text style={styles.detailCardDirection}>
                      Period: {currentMarine.swellPeriod}s
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>12-Hour Trend</Text>
                <View style={styles.chartContainer}>
                  {renderChart()}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Wind Gust</Text>
                    <Text style={styles.infoValue}>{currentConditions.windGust || currentConditions.windSpeed} kts</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Swell Direction</Text>
                    <Text style={styles.infoValue}>{currentMarine.swellDirection}°</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Current Speed</Text>
                    <Text style={styles.infoValue}>{currentMarine.current.speed} kts</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Current Direction</Text>
                    <Text style={styles.infoValue}>{currentMarine.current.direction}°</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Sea Temperature</Text>
                    <Text style={styles.infoValue}>{currentMarine.seaTemperature}°C</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Next Tide</Text>
                    <Text style={styles.infoValue}>{currentMarine.tideTime}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 100,
    right: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  blurContainer: {
    borderRadius: 12,
  },
  gradientContainer: {
    padding: 12,
    borderRadius: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    paddingHorizontal: 10,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '600',
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: screenHeight * 0.75,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalBody: {
    flex: 1,
  },
  detailSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 15,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailCardTitle: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '600',
  },
  detailCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  detailCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  detailCardDirection: {
    fontSize: 11,
    color: '#94a3b8',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
});

export default WeatherConditionsOverlay;