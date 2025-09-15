import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from '../../utils/reanimatedWrapper';
import { 
  RefreshCw, 
  Compass, 
  Target, 
  Wind,
  Settings,
  BarChart3
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { darkSkyColors, darkSkySpacing } from '../../constants/darkSkyTheme';
import { haptics } from '../../utils/haptics';

const { width } = Dimensions.get('window');

interface RacingQuickActionsProps {
  onRefresh: () => Promise<void>;
  onSetCourseBearing: (bearing: number) => void;
  onToggleView: () => void;
  isRefreshing: boolean;
  currentView: 'overview' | 'tactical' | 'detailed';
  isOneHandedMode?: boolean;
}

export const RacingQuickActions: React.FC<RacingQuickActionsProps> = ({
  onRefresh,
  onSetCourseBearing,
  onToggleView,
  isRefreshing,
  currentView,
  isOneHandedMode = false
}) => {
  const [courseBearingInput, setCourseBearingInput] = useState<string>('');
  const refreshRotation = useSharedValue(0);
  const actionScale = useSharedValue(1);

  const refreshStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${refreshRotation.value}deg` },
      ],
    };
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;

    haptics.impactAsync();
    refreshRotation.value = withTiming(refreshRotation.value + 360, { duration: 1000 });

    await onRefresh();
  };

  const handleViewToggle = () => {
    haptics.impactAsync();
    onToggleView();
  };

  const quickActions = [
    {
      id: 'refresh',
      icon: RefreshCw,
      label: 'Refresh',
      action: handleRefresh,
      disabled: isRefreshing,
      style: refreshStyle,
    },
    {
      id: 'compass',
      icon: Compass,
      label: 'Course',
      action: () => {
        haptics.impactAsync();
        // Could open course bearing input modal
      },
    },
    {
      id: 'target',
      icon: Target,
      label: 'Mark',
      action: () => {
        haptics.impactAsync();
        // Could open mark bearing input modal
      },
    },
    {
      id: 'view',
      icon: currentView === 'overview' ? BarChart3 : currentView === 'tactical' ? Wind : Settings,
      label: currentView === 'overview' ? 'Tactical' : currentView === 'tactical' ? 'Detailed' : 'Overview',
      action: handleViewToggle,
    },
  ];

  const renderQuickActions = () => {
    if (isOneHandedMode) {
      // Thumb-friendly bottom placement for one-handed use
      return (
        <View style={styles.oneHandedContainer}>
          <View style={styles.oneHandedActions}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.oneHandedActionButton,
                  action.disabled && styles.disabledButton
                ]}
                onPress={action.action}
                disabled={action.disabled}
                activeOpacity={0.7}
              >
                <View>
                  <action.icon 
                    color={action.disabled ? darkSkyColors.textMuted : darkSkyColors.accent} 
                    size={20} 
                  />
                </View>
                <Text style={[
                  styles.oneHandedActionLabel,
                  action.disabled && styles.disabledText
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // Standard horizontal layout
    return (
      <View style={styles.standardContainer}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton,
              action.disabled && styles.disabledButton
            ]}
            onPress={action.action}
            disabled={action.disabled}
            activeOpacity={0.7}
          >
            <View>
              <action.icon 
                color={action.disabled ? darkSkyColors.textMuted : darkSkyColors.accent} 
                size={24} 
              />
            </View>
            <Text style={[
              styles.actionLabel,
              action.disabled && styles.disabledText
            ]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Animated.View 
      style={styles.container} 
      entering={FadeInUp.delay(200)}
    >
      {renderQuickActions()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkSkyColors.cardBackground,
    borderRadius: darkSkySpacing.cardRadius,
    marginVertical: darkSkySpacing.cardMargin,
    borderWidth: 1,
    borderColor: darkSkyColors.cardBorder,
  },
  standardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
  },
  oneHandedContainer: {
    padding: spacing.sm,
  },
  oneHandedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    minWidth: 60,
  },
  oneHandedActionButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: darkSkyColors.backgroundTertiary,
    minWidth: 70,
    flex: 1,
    marginHorizontal: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 12,
    color: darkSkyColors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  oneHandedActionLabel: {
    fontSize: 11,
    color: darkSkyColors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  disabledText: {
    color: darkSkyColors.textMuted,
  },
});