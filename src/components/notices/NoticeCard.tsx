import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Linking } from 'react-native';
// Animated import removed to fix Hermes property configuration error
import {
  Bell,
  FileText,
  AlertTriangle,
  Calendar,
  Scale,
  Users,
  Flag,
  MapPin,
  Clock,
  ChevronRight,
  Bookmark,
  Download,
  ExternalLink,
  Globe
} from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import {
  IOSCard,
  IOSText,
  IOSBadge,
  IOSButton
} from '../ios';

import type {
  OfficialNotification,
  EventDocument,
  RegattaCategory,
  NotificationType,
  DocumentType
} from '../../types/noticeBoard';

type NoticeItem = (OfficialNotification | EventDocument) & {
  itemType: 'notification' | 'document';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publishedAt: string;
  category?: RegattaCategory;
};

interface NoticeCardProps {
  notice: NoticeItem;
  onPress: (notice: NoticeItem) => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({
  notice,
  onPress,
  style,
  compact = false
}) => {
  // Get priority color
  const getPriorityColor = (priority: NoticeItem['priority'] | string | undefined) => {
    switch (priority) {
      case 'critical':
      case 'urgent': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.primary;
      case 'low': return colors.textSecondary;
      default: return colors.primary;
    }
  };

  // Get left border color based on priority
  const getBorderColor = (priority: NoticeItem['priority'] | string | undefined) => {
    switch (priority) {
      case 'critical':
      case 'urgent':
      case 'high':
        return '#DC3545'; // Red for critical/urgent/high
      case 'medium':
        return '#FF9800'; // Orange for medium
      case 'low':
      default:
        return '#E0E0E0'; // Gray for low/normal
    }
  };

  // Get priority badge styling
  const getPriorityBadgeStyle = (priority: NoticeItem['priority'] | string | undefined) => {
    switch (priority) {
      case 'critical':
      case 'urgent':
        return {
          backgroundColor: '#FFE5E9',
          color: '#DC3545'
        };
      case 'high':
        return {
          backgroundColor: '#FFF3E0',
          color: '#FF9800'
        };
      default:
        return null; // Use default IOSBadge styling
    }
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: NoticeItem['priority'] | undefined): 'filled' | 'tinted' => {
    return priority === 'urgent' ? 'filled' : 'tinted';
  };

  // Get icon for notice type
  const getNoticeIcon = () => {
    if (notice.itemType === 'document') {
      const docType = (notice as EventDocument).type;
      switch (docType) {
        case 'notice_of_race':
        case 'sailing_instructions':
          return FileText;
        case 'race_schedule':
          return Calendar;
        case 'results':
          return Flag;
        case 'protest_info':
          return Scale;
        case 'safety_notice':
          return AlertTriangle;
        case 'venue_info':
          return MapPin;
        default:
          return FileText;
      }
    } else {
      const notifType = (notice as OfficialNotification).type;
      switch (notifType) {
        case 'protest':
          return Scale;
        case 'weather':
          return AlertTriangle;
        case 'schedule_update':
          return Calendar;
        case 'results':
          return Flag;
        case 'emergency':
        case 'safety_warning':
          return AlertTriangle;
        case 'entry_update':
          return Users;
        case 'venue_info':
          return MapPin;
        default:
          return Bell;
      }
    }
  };

  // Get category display name
  const getCategoryName = (category?: RegattaCategory) => {
    if (!category) return '';

    switch (category) {
      case 'pre_event': return 'Pre-Event';
      case 'daily_operations': return 'Daily Ops';
      case 'competition_management': return 'Competition';
      case 'protests_hearings': return 'Protests';
      case 'safety_regulatory': return 'Safety';
      case 'administrative': return 'Admin';
      default: return '';
    }
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  // Check if unread - isRead is now always set by NoticesScreen
  const isUnread = 'isRead' in notice ? !notice.isRead : true;

  const IconComponent = getNoticeIcon();
  const priorityColor = getPriorityColor(notice.priority);
  const categoryName = getCategoryName(notice.category);
  const borderColor = getBorderColor(notice.priority);
  const priorityBadgeStyle = getPriorityBadgeStyle(notice.priority);

  // Handle external link press
  const handleExternalLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
      }
    } catch (error) {
    }
  };

  // Check if document has racing rules link
  const isRacingRulesDocument = notice.itemType === 'document' &&
    ((notice as EventDocument).url?.includes('racingrulesofsailing.org') ||
     (notice as EventDocument).url?.includes('sailing.org'));

  return (
    <View
      style={[styles.container, style]}
    >
      <IOSCard
        variant="elevated"
        style={[
          styles.card,
          compact && styles.cardCompact,
          { borderLeftWidth: 4, borderLeftColor: borderColor }
        ]}
        onPress={() => onPress(notice)}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: priorityColor + '20' }]}>
              <IconComponent size={20} color={priorityColor} strokeWidth={2} />
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.headerTopRow}>
                {priorityBadgeStyle ? (
                  <View style={[
                    styles.customPriorityBadge,
                    { backgroundColor: priorityBadgeStyle.backgroundColor }
                  ]}>
                    <IOSText
                      textStyle="caption2"
                      weight="semibold"
                      style={{ color: priorityBadgeStyle.color }}
                    >
                      {notice.priority?.toUpperCase() || 'MEDIUM'}
                    </IOSText>
                  </View>
                ) : (
                  <IOSBadge
                    color={priorityColor}
                    variant={getPriorityVariant(notice.priority)}
                    size="small"
                  >
                    {notice.priority?.toUpperCase() || 'MEDIUM'}
                  </IOSBadge>
                )}

                {isUnread && (
                  <IOSBadge
                    color="systemBlue"
                    variant="filled"
                    size="small"
                  >
                    UNREAD
                  </IOSBadge>
                )}

                {categoryName && (
                  <IOSText textStyle="caption2" color="tertiaryLabel">
                    {categoryName}
                  </IOSText>
                )}
              </View>

              <View style={styles.headerBottomRow}>
                <Clock size={12} color={colors.textMuted} />
                <IOSText textStyle="caption2" color="tertiaryLabel">
                  {getRelativeTime(notice.publishedAt)}
                </IOSText>

                {notice.itemType === 'notification' && (notice as OfficialNotification).author && (
                  <>
                    <IOSText textStyle="caption2" color="tertiaryLabel">•</IOSText>
                    <IOSText textStyle="caption2" color="tertiaryLabel">
                      {(notice as OfficialNotification).authorRole.replace('_', ' ')}
                    </IOSText>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            {isUnread && <View style={styles.unreadDot} />}
            <ChevronRight size={16} color={colors.textSecondary} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <IOSText
            textStyle={compact ? "callout" : "headline"}
            weight="semibold"
            numberOfLines={compact ? 2 : 3}
            style={styles.title}
          >
            {notice.title}
          </IOSText>

          {'content' in notice && notice.content && (
            <IOSText
              textStyle="callout"
              color="secondaryLabel"
              numberOfLines={compact ? 2 : 3}
              style={styles.description}
            >
              {notice.content}
            </IOSText>
          )}

          {'description' in notice && notice.description && (
            <IOSText
              textStyle="callout"
              color="secondaryLabel"
              numberOfLines={compact ? 2 : 3}
              style={styles.description}
            >
              {notice.description}
            </IOSText>
          )}
        </View>

        {/* Footer */}
        {!compact && (
          <View style={styles.footer}>
            {/* Racing Rules Link - Prominent display */}
            {isRacingRulesDocument && (
              <View style={styles.racingRulesSection}>
                <View style={styles.racingRulesHeader}>
                  <Globe size={16} color={colors.primary} />
                  <IOSText textStyle="caption1" color="label" weight="medium">
                    Official Document Source
                  </IOSText>
                </View>
                <IOSButton
                  title="View Original on sailing.org"
                  size="small"
                  variant="tinted"
                  color={colors.primary}
                  icon={<ExternalLink size={14} color={colors.primary} />}
                  onPress={() => handleExternalLink((notice as EventDocument).url)}
                  style={styles.racingRulesButton}
                />
              </View>
            )}

            {/* Document specific info */}
            {notice.itemType === 'document' && (
              <View style={styles.documentInfo}>
                <FileText size={14} color={colors.textMuted} />
                <IOSText textStyle="caption1" color="tertiaryLabel">
                  {(notice as EventDocument).fileType.toUpperCase()}
                </IOSText>

                {(notice as EventDocument).size && (
                  <>
                    <IOSText textStyle="caption1" color="tertiaryLabel">•</IOSText>
                    <IOSText textStyle="caption1" color="tertiaryLabel">
                      {Math.round((notice as EventDocument).size! / 1024)} KB
                    </IOSText>
                  </>
                )}

                {(notice as EventDocument).isRequired && (
                  <IOSBadge color="systemRed" size="small">
                    Required
                  </IOSBadge>
                )}
              </View>
            )}

            {/* Tags for notifications */}
            {notice.itemType === 'notification' && (notice as OfficialNotification).tags && (
              <View style={styles.tags}>
                {(notice as OfficialNotification).tags.slice(0, 3).map((tag, index) => (
                  <IOSBadge
                    key={index}
                    color="systemGray"
                    variant="tinted"
                    size="small"
                  >
                    {tag}
                  </IOSBadge>
                ))}
                {(notice as OfficialNotification).tags.length > 3 && (
                  <IOSText textStyle="caption2" color="tertiaryLabel">
                    +{(notice as OfficialNotification).tags.length - 3} more
                  </IOSText>
                )}
              </View>
            )}
          </View>
        )}
      </IOSCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: 12, // Increased spacing between cards
  },
  card: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF', // Ensure white background
  },
  cardCompact: {
    padding: spacing.sm,
  },
  customPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  content: {
    gap: spacing.sm,
  },
  title: {
    lineHeight: 22,
  },
  description: {
    lineHeight: 20,
  },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  racingRulesSection: {
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  racingRulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  racingRulesButton: {
    alignSelf: 'flex-start',
  },
});