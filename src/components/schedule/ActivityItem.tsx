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
          <View style={[styles.iconContainer, { backgroundColor: `${activityColor}15` }]}>
            <IconComponent size={16} color={activityColor} strokeWidth={2} />
          </View>
          <View style={styles.activityInfo}>
            <IOSText textStyle="body" weight="semibold" style={styles.activityTitle}>
              {activity.activity}
            </IOSText>
            <View style={styles.metaRow}>
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
          </View>
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  timeSection: {
    minWidth: 72,
    paddingRight: spacing.md,
    justifyContent: 'flex-start',
  },
  timeText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 16,
  },
  contentSection: {
    flex: 1,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.borderLight,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  activityInfo: {
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  activityTitle: {
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginLeft: 40, // Align with activity title
  },
  locationText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});