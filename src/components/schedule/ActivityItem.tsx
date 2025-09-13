import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Sailboat, 
  Users, 
  MessageSquare, 
  ClipboardList, 
  Settings, 
  FileText, 
  Camera,
  MapPin,
  LucideIcon
} from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { IOSBadge } from '../ios/IOSBadge';
import { colors, spacing } from '../../constants/theme';
import type { Activity, ActivityType } from '../../data/scheduleData';
import { activityTypes } from '../../data/scheduleData';

export interface ActivityItemProps {
  activity: Activity;
}

const getActivityIcon = (type: ActivityType): LucideIcon => {
  const iconMap: Record<ActivityType, LucideIcon> = {
    racing: Sailboat,
    social: Users,
    meeting: MessageSquare,
    registration: ClipboardList,
    technical: Settings,
    administrative: FileText,
    media: Camera,
  };
  return iconMap[type];
};

const getActivityColor = (type: ActivityType): string => {
  return activityTypes[type].color;
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const IconComponent = getActivityIcon(activity.type);
  const activityColor = getActivityColor(activity.type);
  
  return (
    <View style={styles.container}>
      <View style={styles.timeSection}>
        <IOSText textStyle="callout" weight="semibold" style={styles.timeText}>
          {activity.time}
        </IOSText>
      </View>
      
      <View style={styles.contentSection}>
        <View style={styles.activityHeader}>
          <View style={styles.activityInfo}>
            <View style={[styles.iconContainer, { backgroundColor: `${activityColor}15` }]}>
              <IconComponent size={14} color={activityColor} strokeWidth={2} />
            </View>
            <IOSText textStyle="subheadline" weight="medium" style={styles.activityTitle}>
              {activity.activity}
            </IOSText>
          </View>
          <IOSBadge 
            variant="filled" 
            color="systemBlue" 
            size="small"
            style={[styles.badge, { backgroundColor: `${activityColor}20` }]}
          >
            <IOSText textStyle="caption2" style={[styles.badgeText, { color: activityColor }]}>
              {activityTypes[activity.type].label}
            </IOSText>
          </IOSBadge>
        </View>
        
        <View style={styles.locationRow}>
          <MapPin size={12} color={colors.textMuted} strokeWidth={2} />
          <IOSText textStyle="caption" color="secondaryLabel" style={styles.locationText}>
            {activity.location}
          </IOSText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  timeSection: {
    width: 80,
    paddingRight: spacing.sm,
    justifyContent: 'flex-start',
  },
  timeText: {
    color: colors.primary,
    fontSize: 13,
  },
  contentSection: {
    flex: 1,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.borderLight,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  activityInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    flex: 1,
    color: colors.text,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
});