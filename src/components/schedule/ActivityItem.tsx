import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { 
  Sailboat, 
  Users, 
  MessageSquare, 
  ClipboardList, 
  Settings, 
  FileText, 
  Camera,
  MapPin,
  ChevronRight,
  LucideIcon
} from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { IOSBadge } from '../ios/IOSBadge';
import { colors, spacing } from '../../constants/theme';
import type { Activity, ActivityType } from '../../data/scheduleData';
import { activityTypes } from '../../data/scheduleData';
import { EventActionSheet } from './EventActionSheet';
import { EventDetailModal } from './EventDetailModal';

export interface ActivityItemProps {
  activity: Activity;
  activityDate: string; // The day date for calendar integration
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

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, activityDate }) => {
  const navigation = useNavigation();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const IconComponent = getActivityIcon(activity.type);
  const activityColor = getActivityColor(activity.type);

  const handleLocationPress = () => {
    if (activity.mapLocationId) {
      navigation.navigate('Map' as never, { locationId: activity.mapLocationId } as never);
    }
  };

  const handleActivityPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowActionSheet(true);
  };

  const handleNavigateToMap = () => {
    setShowActionSheet(false);
    if (activity.mapLocationId) {
      navigation.navigate('Map' as never, { locationId: activity.mapLocationId } as never);
    }
  };


  const handleViewDetails = () => {
    setShowActionSheet(false);
    setShowDetailModal(true);
  };

  const handleShowRelated = () => {
    setShowActionSheet(false);
    // TODO: Show related activities
    console.log('Show related activities for:', activity.activity);
  };

  const handleContact = () => {
    setShowActionSheet(false);
    // TODO: Contact organizer
    console.log('Contact organizer:', activity.contactPerson);
  };

  // Event detail modal handlers
  const handleDetailModalNavigateToMap = () => {
    setShowDetailModal(false);
    if (activity.mapLocationId) {
      navigation.navigate('Map' as never, { locationId: activity.mapLocationId } as never);
    }
  };


  const handleDetailModalShowRelated = () => {
    setShowDetailModal(false);
    // TODO: Show related activities
    console.log('Show related activities for:', activity.activity);
  };

  const handleDetailModalContact = () => {
    setShowDetailModal(false);
    // TODO: Contact organizer
    console.log('Contact organizer:', activity.contactPerson);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={handleActivityPress}
        activeOpacity={0.7}
      >
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
            <IOSText textStyle="body" weight="semibold" style={styles.activityTitle} numberOfLines={2}>
              {activity.activity}
            </IOSText>
            {activity.detail && (
              <IOSText textStyle="caption" color="secondaryLabel" style={styles.activityDetail} numberOfLines={2}>
                {activity.detail}
              </IOSText>
            )}
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

        {activity.mapLocationId ? (
          <TouchableOpacity
            style={styles.locationRow}
            onPress={handleLocationPress}
            activeOpacity={0.7}
          >
            <MapPin size={12} color={colors.primary} strokeWidth={2} />
            <IOSText textStyle="caption" color="link" style={[styles.locationText, styles.locationLink]}>
              {activity.location}
            </IOSText>
            <ChevronRight size={12} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.textMuted} strokeWidth={2} />
            <IOSText textStyle="caption" color="secondaryLabel" style={styles.locationText}>
              {activity.location}
            </IOSText>
          </View>
        )}
      </View>
      </TouchableOpacity>

      <EventActionSheet
        activity={activity}
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onNavigateToMap={handleNavigateToMap}
        onViewDetails={handleViewDetails}
        onShowRelated={handleShowRelated}
        onContact={activity.contactPerson ? handleContact : undefined}
      />

      <EventDetailModal
        activity={activity}
        activityDate={activityDate}
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onNavigateToMap={handleDetailModalNavigateToMap}
        onShowRelated={handleDetailModalShowRelated}
        onContact={activity.contactPerson ? handleDetailModalContact : undefined}
      />
    </>
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
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  activityDetail: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    flexShrink: 1,
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
  locationLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});