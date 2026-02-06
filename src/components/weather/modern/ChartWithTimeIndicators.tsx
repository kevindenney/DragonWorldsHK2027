import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { IOSText } from '../../ios';
import { formatChartTime, formatCurrentTime } from '../../../utils/timeUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChartWithTimeIndicatorsProps {
  data: any;
  width?: number;
  height?: number;
  chartConfig: any;
  style?: any;
  currentTimeIndex?: number;
  forecastStartIndex?: number;
  showCurrentTimeMarker?: boolean;
  showForecastRange?: boolean;
  title?: string;
  footerText?: string;
  footerSubtext?: string;
}

export const ChartWithTimeIndicators: React.FC<ChartWithTimeIndicatorsProps> = ({
  data,
  width = SCREEN_WIDTH - 32,
  height = 180,
  chartConfig,
  style,
  currentTimeIndex = 0,
  forecastStartIndex = 0,
  showCurrentTimeMarker = true,
  showForecastRange = true,
  title,
  footerText,
  footerSubtext,
}) => {
  const chartWidth = width;
  const chartHeight = height;

  // Calculate positions for indicators
  const currentTimeX = currentTimeIndex >= 0 && data.labels ? 
    (currentTimeIndex / (data.labels.length - 1)) * chartWidth : 0;
  
  const forecastStartX = forecastStartIndex >= 0 && data.labels ? 
    (forecastStartIndex / (data.labels.length - 1)) * chartWidth : 0;

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.chartHeader}>
          <IOSText style={styles.chartTitle}>{title}</IOSText>
        </View>
      )}
      
      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={StyleSheet.flatten([styles.chart, style])}
          withDots={false}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={true}
        />
        
        {/* Overlay SVG for time indicators */}
        <Svg
          width={chartWidth}
          height={chartHeight}
          style={styles.overlaySvg}
        >
          <Defs>
            <LinearGradient id="forecastGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="rgba(0, 122, 255, 0.1)" stopOpacity="0" />
              <Stop offset="1" stopColor="rgba(0, 122, 255, 0.1)" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Forecast range background */}
          {showForecastRange && forecastStartIndex > 0 && (
            <Line
              x1={forecastStartX}
              y1={0}
              x2={chartWidth}
              y2={0}
              stroke="url(#forecastGradient)"
              strokeWidth={chartHeight}
              opacity="0.3"
            />
          )}

          {/* Current time marker */}
          {showCurrentTimeMarker && currentTimeIndex >= 0 && (
            <>
              <Line
                x1={currentTimeX}
                y1={0}
                x2={currentTimeX}
                y2={chartHeight}
                stroke="#FF3B30"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.8"
              />
              <SvgText
                x={currentTimeX}
                y={12}
                fontSize="10"
                fill="#FF3B30"
                textAnchor="middle"
                fontWeight="600"
              >
                NOW (HKT)
              </SvgText>
            </>
          )}

          {/* Forecast start marker */}
          {showForecastRange && forecastStartIndex > 0 && (
            <>
              <Line
                x1={forecastStartX}
                y1={0}
                x2={forecastStartX}
                y2={chartHeight}
                stroke="#007AFF"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.6"
              />
              <SvgText
                x={forecastStartX}
                y={chartHeight - 8}
                fontSize="9"
                fill="#007AFF"
                textAnchor="middle"
                fontWeight="500"
              >
                FORECAST
              </SvgText>
            </>
          )}
        </Svg>
      </View>

      {(footerText || footerSubtext) && (
        <View style={styles.chartFooter}>
          {footerText && (
            <IOSText style={styles.chartFooterText}>
              {footerText}
            </IOSText>
          )}
          {footerSubtext && (
            <IOSText style={styles.chartFooterSubtext}>
              {footerSubtext}
            </IOSText>
          )}
        </View>
      )}

      {/* Always show timezone indicator */}
      <View style={styles.timezoneFooter}>
        <IOSText style={styles.timezoneText}>
          Times in Hong Kong Time (HKT)
        </IOSText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartHeader: {
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  chartContainer: {
    position: 'relative',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  overlaySvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  chartFooter: {
    marginTop: 8,
    alignItems: 'center',
  },
  chartFooterText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  chartFooterSubtext: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 2,
    textAlign: 'center',
  },

  // Timezone footer
  timezoneFooter: {
    marginTop: 8,
    alignItems: 'center',
  },

  timezoneText: {
    fontSize: 10,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
});

export default ChartWithTimeIndicators;
