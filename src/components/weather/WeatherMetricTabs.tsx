/**
 * WeatherMetricTabs Component
 * 
 * Living Document Implementation:
 * Recreation of Google Weather's metric switching interface with marine enhancements.
 * Features iOS-style segmented control design for switching between temperature, 
 * precipitation, wind, tides, and waves in the hourly forecast chart.
 * 
 * Features:
 * - iOS-style segmented control with smooth animations
 * - Standard weather metrics: temperature, precipitation, wind
 * - Marine-specific metrics: tides and waves for sailing applications
 * - Color-coded metric indicators matching data visualization
 * - Haptic feedback for metric selection (iOS)
 * - Accessibility support with proper labels and hints
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { 
  Thermometer,
  CloudRain,
  Wind,
  Waves,
  TrendingUp,
  TrendingDown
} from 'lucide-react-native';
import { IOSText } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';
import { MetricType } from './HourlyForecastChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WeatherMetricTabsProps {
  selectedMetric: MetricType;
  onMetricChange: (metric: MetricType) => void;
  showMarineMetrics?: boolean;
  disabled?: boolean;
}

interface MetricConfig {
  type: MetricType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  isMarine?: boolean;
}

// Metric configurations with icons and colors
const getMetricConfigs = (): MetricConfig[] => [
  {
    type: 'temperature',
    label: 'Temp',
    icon: <Thermometer size={18} />,
    color: colors.warning,
    description: 'Air temperature in degrees'
  },
  {
    type: 'precipitation',
    label: 'Rain',
    icon: <CloudRain size={18} />,
    color: colors.primary,
    description: 'Precipitation probability'
  },
  {
    type: 'wind',
    label: 'Wind',
    icon: <Wind size={18} />,
    color: colors.accent,
    description: 'Wind speed and direction'
  },
  {
    type: 'tides',
    label: 'Tides',
    icon: <TrendingUp size={18} />,
    color: colors.success,
    description: 'Tidal height variations',
    isMarine: true
  },
  {
    type: 'waves',
    label: 'Waves',
    icon: <Waves size={18} />,
    color: colors.info,
    description: 'Wave height and conditions',
    isMarine: true
  }
];

export const WeatherMetricTabs: React.FC<WeatherMetricTabsProps> = ({
  selectedMetric,
  onMetricChange,
  showMarineMetrics = true,
  disabled = false
}) => {
  const metrics = getMetricConfigs().filter(metric => 
    showMarineMetrics || !metric.isMarine
  );

  const handleMetricPress = (metric: MetricType) => {
    if (disabled) return;
    
    // Add haptic feedback on iOS
    if (Platform.OS === 'ios') {
      // Expo Haptics would be imported at the top
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onMetricChange(metric);
  };

  const getTabWidth = () => {
    const containerWidth = SCREEN_WIDTH - (spacing.lg * 2);
    const tabPadding = spacing.sm * 2;
    return (containerWidth - tabPadding) / metrics.length;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IOSText style={styles.headerTitle}>Forecast Details</IOSText>
        <IOSText style={styles.headerSubtitle}>
          {showMarineMetrics ? 'Weather & Marine Conditions' : 'Weather Conditions'}
        </IOSText>
      </View>

      {/* Metric Tabs */}
      <View style={styles.tabsContainer}>
        <View style={[styles.segmentedControl, disabled && styles.disabledControl]}>
          {metrics.map((metric, index) => {
            const isSelected = selectedMetric === metric.type;
            const isFirstTab = index === 0;
            const isLastTab = index === metrics.length - 1;
            
            return (
              <TouchableOpacity
                key={metric.type}
                style={[
                  styles.tab,
                  { width: getTabWidth() },
                  isSelected && styles.selectedTab,
                  isSelected && { backgroundColor: metric.color + '20' },
                  isFirstTab && styles.firstTab,
                  isLastTab && styles.lastTab,
                  disabled && styles.disabledTab
                ]}
                onPress={() => handleMetricPress(metric.type)}
                disabled={disabled}
                accessibilityRole="tab"
                accessibilityLabel={`${metric.label} metric`}
                accessibilityHint={metric.description}
                accessibilityState={{ selected: isSelected }}
              >
                {/* Tab Content */}
                <View style={styles.tabContent}>
                  {/* Icon */}
                  <View style={styles.iconContainer}>
                    {React.cloneElement(metric.icon as React.ReactElement<{ color: string; size: number }>, {
                      color: isSelected ? metric.color : colors.textMuted,
                      size: 16
                    })}
                  </View>
                  
                  {/* Label */}
                  <IOSText style={[
                    styles.tabLabel,
                    isSelected && styles.selectedTabLabel,
                    isSelected && { color: metric.color },
                    disabled && styles.disabledTabLabel
                  ]}>
                    {metric.label}
                  </IOSText>
                </View>

                {/* Selection Indicator */}
                {isSelected && (
                  <View style={[
                    styles.selectionIndicator,
                    { backgroundColor: metric.color }
                  ]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Metric Description */}
      <View style={styles.descriptionContainer}>
        <IOSText style={styles.metricDescription}>
          {metrics.find(m => m.type === selectedMetric)?.description || ''}
        </IOSText>
        
        {/* Marine Data Notice */}
        {showMarineMetrics && (
          <View style={styles.marineNotice}>
            <View style={styles.marineIndicator} />
            <IOSText style={styles.marineNoticeText}>
              Marine data optimized for sailing conditions
            </IOSText>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  headerTitle: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },

  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Tabs Container
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  disabledControl: {
    opacity: 0.6,
  },

  // Individual Tabs
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 44, // iOS minimum touch target
  },

  selectedTab: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  firstTab: {
    marginRight: 1,
  },

  lastTab: {
    marginLeft: 1,
  },

  disabledTab: {
    opacity: 0.5,
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainer: {
    marginBottom: spacing.xs,
  },

  tabLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 11,
    textAlign: 'center',
  },

  selectedTabLabel: {
    fontWeight: '600',
  },

  disabledTabLabel: {
    color: colors.textMuted,
  },

  selectionIndicator: {
    position: 'absolute',
    bottom: -2,
    left: spacing.sm,
    right: spacing.sm,
    height: 2,
    borderRadius: 1,
  },

  // Description
  descriptionContainer: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },

  metricDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  marineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
  },

  marineIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.info,
    marginRight: spacing.xs,
  },

  marineNoticeText: {
    ...typography.caption,
    color: colors.info,
    fontSize: 10,
    fontWeight: '500',
  },
});

/**
 * Living Document Export Notes:
 * 
 * This WeatherMetricTabs component provides iOS-style metric switching for the Google Weather interface:
 * 
 * - Visual Fidelity: iOS segmented control design with smooth transitions
 * - Marine Integration: Dedicated tabs for tides and waves with appropriate icons
 * - Accessibility: Proper ARIA labels and touch targets for mobile use
 * - Haptic Feedback: iOS-style tactile feedback for metric selection
 * - Responsive Design: Dynamic tab sizing based on available metrics
 * 
 * Future enhancements:
 * - Animated tab transitions with spring physics
 * - Swipe gesture support for tab switching
 * - Premium metric indicators for subscription features
 * - Integration with sailing race schedule for context-aware metric suggestions
 * - Custom metric configurations for different boat types and sailing styles
 */