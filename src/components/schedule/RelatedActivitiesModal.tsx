import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { X, MapPin, Calendar, Clock } from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { colors, spacing } from '../../constants/theme';
import type { ActivityWithContext, ActivityType } from '../../data/scheduleData';
import { activityTypes } from '../../data/scheduleData';

interface RelatedActivitiesModalProps {
  visible: boolean;
  onClose: () => void;
  activities: ActivityWithContext[];
  onActivityPress: (activity: ActivityWithContext) => void;
  currentActivityName: string;
}

const { height: screenHeight } = Dimensions.get('window');

const getActivityColor = (type: ActivityType): string => {
  return activityTypes[type].color;
};

const formatDate = (dateString: string): string => {
  // Date format is "Wednesday, November 18, 2026"
  // Extract just "Wed, Nov 18"
  const parts = dateString.split(', ');
  if (parts.length >= 2) {
    const weekday = parts[0].substring(0, 3); // "Wed"
    const monthDay = parts[1]; // "November 18"
    const monthParts = monthDay.split(' ');
    const month = monthParts[0]?.substring(0, 3) || ''; // "Nov"
    const day = monthParts[1] || ''; // "18"
    return `${weekday}, ${month} ${day}`;
  }
  return dateString;
};

export const RelatedActivitiesModal: React.FC<RelatedActivitiesModalProps> = ({
  visible,
  onClose,
  activities,
  onActivityPress,
  currentActivityName,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContent}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <IOSText textStyle="headline" weight="semibold" style={styles.title}>
                At This Location
              </IOSText>
              <IOSText textStyle="caption" color="secondaryLabel" style={styles.subtitle}>
                {activities.length} other event{activities.length === 1 ? '' : 's'} at {currentActivityName}
              </IOSText>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Activities List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {activities.length === 0 ? (
              <View style={styles.emptyState}>
                <IOSText textStyle="body" color="secondaryLabel">
                  No related activities found
                </IOSText>
              </View>
            ) : (
              activities.map((activity, index) => {
                const activityColor = getActivityColor(activity.type);
                return (
                  <TouchableOpacity
                    key={`${activity.date}-${activity.time}-${index}`}
                    style={[
                      styles.activityCard,
                      { borderLeftColor: activityColor },
                    ]}
                    onPress={() => onActivityPress(activity)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.activityHeader}>
                      <View style={styles.dateTimeRow}>
                        <View style={styles.dateBadge}>
                          <Calendar size={12} color={colors.primary} strokeWidth={2} />
                          <IOSText textStyle="caption" weight="semibold" style={styles.dateText}>
                            {formatDate(activity.date)}
                          </IOSText>
                        </View>
                        <View style={styles.timeBadge}>
                          <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
                          <IOSText textStyle="caption" color="secondaryLabel">
                            {activity.time}
                          </IOSText>
                        </View>
                      </View>
                    </View>

                    <IOSText textStyle="body" weight="semibold" style={styles.activityName}>
                      {activity.activity}
                    </IOSText>

                    {activity.detail && (
                      <IOSText textStyle="caption" color="secondaryLabel" style={styles.activityDetail} numberOfLines={2}>
                        {activity.detail}
                      </IOSText>
                    )}

                    <View style={styles.locationRow}>
                      <MapPin size={12} color={colors.textMuted} strokeWidth={2} />
                      <IOSText textStyle="caption" color="secondaryLabel" style={styles.locationText}>
                        {activity.location}
                      </IOSText>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.6,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  scrollView: {
    flex: 1,
    flexGrow: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  activityCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  activityHeader: {
    marginBottom: spacing.xs,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: colors.primary,
    fontSize: 12,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityName: {
    color: colors.text,
    marginBottom: spacing.xs,
  },
  activityDetail: {
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
  },
});
