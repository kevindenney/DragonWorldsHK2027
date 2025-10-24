import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {
  MapPin,
  Info,
  Users,
  Phone,
  X
} from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { colors, spacing } from '../../constants/theme';
import type { Activity } from '../../data/scheduleData';

interface EventActionSheetProps {
  activity: Activity | null;
  visible: boolean;
  onClose: () => void;
  onNavigateToMap: () => void;
  onViewDetails: () => void;
  onShowRelated: () => void;
  onContact?: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export const EventActionSheet: React.FC<EventActionSheetProps> = ({
  activity,
  visible,
  onClose,
  onNavigateToMap,
  onViewDetails,
  onShowRelated,
  onContact,
}) => {
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!activity) return null;

  const actionItems = [
    {
      icon: MapPin,
      title: 'Navigate to Location',
      subtitle: activity.location,
      onPress: onNavigateToMap,
      color: colors.primary,
      disabled: !activity.mapLocationId,
    },
    {
      icon: Info,
      title: 'View Details',
      subtitle: 'See complete information',
      onPress: onViewDetails,
      color: '#4A90E2',
    },
    {
      icon: Users,
      title: 'Related Activities',
      subtitle: 'See connected events',
      onPress: onShowRelated,
      color: '#7B68EE',
      disabled: !activity.prerequisites || activity.prerequisites.length === 0,
    },
  ];

  if (activity.contactPerson && onContact) {
    actionItems.push({
      icon: Phone,
      title: 'Contact Organizer',
      subtitle: activity.contactPerson,
      onPress: onContact,
      color: '#28A745',
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.actionSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <IOSText textStyle="headline" weight="semibold" style={styles.title}>
                {activity.activity}
              </IOSText>
              <IOSText textStyle="caption" color="secondaryLabel" style={styles.time}>
                {activity.time} • {activity.location}
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

          {/* Actions */}
          <View style={styles.actions}>
            {actionItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionItem,
                  item.disabled && styles.actionItemDisabled,
                ]}
                onPress={item.disabled ? undefined : item.onPress}
                activeOpacity={0.7}
                disabled={item.disabled}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${item.color}15` }]}>
                  <item.icon
                    size={20}
                    color={item.disabled ? colors.textMuted : item.color}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.actionContent}>
                  <IOSText
                    textStyle="body"
                    weight="semibold"
                    style={[
                      styles.actionTitle,
                      item.disabled && styles.actionTitleDisabled,
                    ]}
                  >
                    {item.title}
                  </IOSText>
                  <IOSText
                    textStyle="caption"
                    color="secondaryLabel"
                    style={[
                      styles.actionSubtitle,
                      item.disabled && styles.actionSubtitleDisabled,
                    ]}
                  >
                    {item.subtitle}
                  </IOSText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
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
  actionSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
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
  time: {
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
  actions: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionItemDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: colors.text,
    marginBottom: 2,
  },
  actionTitleDisabled: {
    color: colors.textMuted,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  actionSubtitleDisabled: {
    color: colors.textMuted,
  },
});