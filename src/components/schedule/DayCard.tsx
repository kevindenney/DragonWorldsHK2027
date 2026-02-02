import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { IOSCard } from '../ios/IOSCard';
import { ActivityItem } from './ActivityItem';
import { colors, spacing, shadows } from '../../constants/theme';
import type { Day } from '../../data/scheduleData';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DATE_SECTION_WIDTH = 96;
const CONTENT_INDENT = spacing.md + DATE_SECTION_WIDTH + spacing.sm;

export interface DayCardProps {
  day: Day;
  isExpanded?: boolean;
  onToggle?: (dayId: string) => void;
}

export const DayCard: React.FC<DayCardProps> = ({ 
  day, 
  isExpanded: controlledExpanded,
  onToggle 
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (onToggle) {
      onToggle(day.id);
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const parts = dateString.split(', ');
      if (parts.length >= 2) {
        return {
          dayOfWeek: parts[0],
          date: parts[1]
        };
      }
      return {
        dayOfWeek: dateString,
        date: ''
      };
    } catch {
      return {
        dayOfWeek: dateString,
        date: ''
      };
    }
  };

  const { dayOfWeek, date } = formatDate(day.date);

  return (
    <IOSCard style={styles.container} variant="elevated">
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityHint={`${isExpanded ? 'Collapse' : 'Expand'} ${day.title} schedule`}
      >
        <View style={styles.dateSection}>
          <IOSText textStyle="callout" weight="semibold" style={styles.dayOfWeek}>
            {dayOfWeek}
          </IOSText>
          {date && (
            <IOSText textStyle="caption" color="secondaryLabel" style={styles.date}>
              {date}
            </IOSText>
          )}
        </View>
        
        <View style={styles.titleSection}>
          <IOSText textStyle="headline" weight="semibold" style={styles.title}>
            {day.title}
          </IOSText>
          <IOSText textStyle="caption" color="secondaryLabel" style={styles.activityCount}>
            {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
          </IOSText>
        </View>
        
        <View style={styles.expandIcon}>
          {isExpanded ? (
            <ChevronUp size={20} color={colors.textSecondary} strokeWidth={2} />
          ) : (
            <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.activitiesContainer}>
          <View style={styles.divider} />
          {day.activities.map((activity, index) => (
            <View key={index}>
              <ActivityItem activity={activity} activityDate={day.date} />
              {index < day.activities.length - 1 && (
                <View style={styles.activityDivider} />
              )}
            </View>
          ))}
        </View>
      )}
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dateSection: {
    width: DATE_SECTION_WIDTH,
    alignItems: 'flex-start',
    paddingRight: spacing.sm,
  },
  dayOfWeek: {
    color: colors.primary,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
  },
  titleSection: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  title: {
    color: colors.text,
    marginBottom: 2,
  },
  activityCount: {
    fontSize: 11,
  },
  expandIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${colors.textSecondary}10`,
    borderRadius: 16,
  },
  activitiesContainer: {
    backgroundColor: colors.surface,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  activityDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginLeft: CONTENT_INDENT, // Align with content after time section
    marginRight: spacing.md,
  },
});
