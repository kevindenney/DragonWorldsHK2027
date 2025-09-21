import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {
  X,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  User,
  ShirtIcon,
  Backpack,
  ChevronRight,
} from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { IOSCard } from '../ios/IOSCard';
import { IOSBadge } from '../ios/IOSBadge';
import { colors, spacing } from '../../constants/theme';
import type { Activity } from '../../data/scheduleData';
import { activityTypes } from '../../data/scheduleData';

const { height: screenHeight } = Dimensions.get('window');

export interface EventDetailModalProps {
  activity: Activity | null;
  activityDate: string;
  visible: boolean;
  onClose: () => void;
  onNavigateToMap?: () => void;
  onShowRelated?: () => void;
  onContact?: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  activity,
  activityDate,
  visible,
  onClose,
  onNavigateToMap,
  onShowRelated,
  onContact,
}) => {
  if (!activity) return null;

  const activityColor = activityTypes[activity.type].color;
  const activityLabel = activityTypes[activity.type].label;

  const formatDate = (dateString: string) => {
    try {
      const parts = dateString.split(', ');
      if (parts.length >= 2) {
        return `${parts[0]}, ${parts[1]}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const DetailSection = ({
    icon: Icon,
    title,
    content,
    onPress
  }: {
    icon: React.ComponentType<any>;
    title: string;
    content: string | string[];
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.detailSection, onPress && styles.pressableSection]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.detailHeader}>
        <Icon size={16} color={colors.primary} strokeWidth={2} />
        <IOSText textStyle="subheadline" weight="semibold" style={styles.detailTitle}>
          {title}
        </IOSText>
        {onPress && <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />}
      </View>
      <View style={styles.detailContent}>
        {Array.isArray(content) ? (
          content.map((item, index) => (
            <IOSText key={index} textStyle="body" color="secondaryLabel" style={styles.listItem}>
              • {item}
            </IOSText>
          ))
        ) : (
          <IOSText textStyle="body" color="secondaryLabel">
            {content}
          </IOSText>
        )}
      </View>
    </TouchableOpacity>
  );

  const ActionButton = ({
    title,
    onPress,
    variant = 'primary'
  }: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
  }) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IOSText
        textStyle="body"
        weight="semibold"
        style={[
          styles.actionButtonText,
          variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText,
        ]}
      >
        {title}
      </IOSText>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <IOSText textStyle="headline" weight="bold" style={styles.headerTitle}>
            Event Details
          </IOSText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <IOSCard style={styles.mainCard} variant="elevated">
            <View style={styles.eventHeader}>
              <View style={[styles.typeIcon, { backgroundColor: `${activityColor}15` }]}>
                <IOSBadge
                  variant="filled"
                  color="systemBlue"
                  size="small"
                  style={[styles.typeBadge, { backgroundColor: `${activityColor}20` }]}
                >
                  <IOSText textStyle="caption2" style={[styles.typeBadgeText, { color: activityColor }]}>
                    {activityLabel}
                  </IOSText>
                </IOSBadge>
              </View>

              <View style={styles.eventTitleSection}>
                <IOSText textStyle="title2" weight="bold" style={styles.eventTitle}>
                  {activity.activity}
                </IOSText>

                <View style={styles.dateTimeRow}>
                  <Clock size={14} color={colors.textSecondary} strokeWidth={2} />
                  <IOSText textStyle="subheadline" color="secondaryLabel" style={styles.dateTimeText}>
                    {formatDate(activityDate)} at {activity.time}
                  </IOSText>
                </View>
              </View>
            </View>

            {activity.detail && (
              <View style={styles.descriptionSection}>
                <IOSText textStyle="body" color="secondaryLabel" style={styles.description}>
                  {activity.detail}
                </IOSText>
              </View>
            )}
          </IOSCard>

          <View style={styles.detailsContainer}>
            <DetailSection
              icon={MapPin}
              title="Location"
              content={activity.location}
              onPress={activity.mapLocationId ? onNavigateToMap : undefined}
            />

            {activity.contactPerson && (
              <DetailSection
                icon={User}
                title="Contact Person"
                content={activity.contactPerson}
                onPress={onContact}
              />
            )}

            {activity.dressCode && (
              <DetailSection
                icon={ShirtIcon}
                title="Dress Code"
                content={activity.dressCode}
              />
            )}

            {activity.bringItems && activity.bringItems.length > 0 && (
              <DetailSection
                icon={Backpack}
                title="What to Bring"
                content={activity.bringItems}
              />
            )}

            {activity.prerequisites && activity.prerequisites.length > 0 && (
              <DetailSection
                icon={AlertCircle}
                title="Prerequisites"
                content={activity.prerequisites}
                onPress={onShowRelated}
              />
            )}

            {activity.maxParticipants && (
              <DetailSection
                icon={Users}
                title="Capacity"
                content={`Maximum ${activity.maxParticipants} participants`}
              />
            )}

            {activity.registrationRequired && (
              <View style={styles.registrationNotice}>
                <AlertCircle size={16} color={colors.warning} strokeWidth={2} />
                <IOSText textStyle="footnote" weight="semibold" style={styles.registrationText}>
                  Registration Required
                </IOSText>
              </View>
            )}
          </View>

          <View style={styles.actionsContainer}>
            {activity.mapLocationId && (
              <ActionButton
                title="View Location on Map"
                onPress={onNavigateToMap!}
                variant="primary"
              />
            )}

            {activity.prerequisites && activity.prerequisites.length > 0 && (
              <ActionButton
                title="Show Related Activities"
                onPress={onShowRelated!}
                variant="secondary"
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${colors.textSecondary}10`,
    borderRadius: 20,
  },
  headerTitle: {
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  mainCard: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  typeIcon: {
    marginRight: spacing.md,
    marginTop: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventTitleSection: {
    flex: 1,
  },
  eventTitle: {
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateTimeText: {
    fontSize: 14,
  },
  descriptionSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  description: {
    lineHeight: 20,
  },
  detailsContainer: {
    gap: spacing.xs,
  },
  detailSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  pressableSection: {
    backgroundColor: `${colors.primary}05`,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  detailTitle: {
    color: colors.text,
    flex: 1,
  },
  detailContent: {
    marginLeft: 24,
  },
  listItem: {
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  registrationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  registrationText: {
    color: colors.warning,
  },
  actionsContainer: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 16,
  },
  primaryButtonText: {
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.text,
  },
});