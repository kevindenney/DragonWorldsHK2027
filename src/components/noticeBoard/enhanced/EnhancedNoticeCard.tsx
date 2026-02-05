import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from '../../../utils/reanimatedWrapper';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Bookmark,
  BookmarkCheck
} from 'lucide-react-native';

import { IOSText, IOSBadge, IOSButton } from '../../ios';
import { EventDocument, OfficialNotification, RegattaCategory } from '../../../types/noticeBoard';
import { colors, spacing } from '../../../constants/theme';
import { haptics } from '../../../utils/haptics';
import { getCategoryForDocument, getCategoryForNotification, getCategoryInfo } from '../../../utils/categoryUtils';

interface EnhancedNoticeCardProps {
  item: EventDocument | OfficialNotification;
  type: 'document' | 'notification';
  onPress: (item: EventDocument | OfficialNotification) => void;
  onDownload?: (item: EventDocument) => void;
  onBookmark?: (item: EventDocument | OfficialNotification) => void;
  onMarkAsRead?: (item: OfficialNotification) => void;
  isBookmarked?: boolean;
  showCategory?: boolean;
  compact?: boolean;
}

export const EnhancedNoticeCard: React.FC<EnhancedNoticeCardProps> = ({
  item,
  type,
  onPress,
  onDownload,
  onBookmark,
  onMarkAsRead,
  isBookmarked = false,
  showCategory = true,
  compact = false,
}) => {
  const handlePress = async () => {
    await haptics.buttonPress();
    onPress(item);
  };

  const handleDownload = async (e: any) => {
    e.stopPropagation();
    if (type === 'document' && onDownload) {
      await haptics.selection();
      onDownload(item as EventDocument);
    }
  };

  const handleBookmark = async (e: any) => {
    e.stopPropagation();
    if (onBookmark) {
      await haptics.selection();
      onBookmark(item);
    }
  };

  const handleMarkAsRead = async (e: any) => {
    e.stopPropagation();
    if (type === 'notification' && onMarkAsRead) {
      await haptics.selection();
      onMarkAsRead(item as OfficialNotification);
    }
  };

  const getCategory = (): RegattaCategory => {
    return type === 'document' 
      ? getCategoryForDocument(item as EventDocument)
      : getCategoryForNotification(item as OfficialNotification);
  };

  const getCategoryColor = (): string => {
    const categoryInfo = getCategoryInfo(getCategory());
    return categoryInfo.color;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return colors.error;
      case 'urgent': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.primary;
      case 'low': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getItemTitle = (): string => {
    return item.title;
  };

  const getItemDescription = (): string => {
    if (type === 'document') {
      const doc = item as EventDocument;
      return doc.keyData?.summary || doc.description || '';
    } else {
      const notification = item as OfficialNotification;
      return notification.content.length > 150 
        ? notification.content.substring(0, 150) + '...'
        : notification.content;
    }
  };

  const getItemDate = (): string => {
    return type === 'document' 
      ? (item as EventDocument).uploadedAt
      : (item as OfficialNotification).publishedAt;
  };

  const getItemPriority = (): string => {
    return type === 'document' 
      ? (item as EventDocument).priority || 'medium'
      : (item as OfficialNotification).priority;
  };

  const isUnread = (): boolean => {
    return type === 'notification' && !(item as OfficialNotification).isRead;
  };

  const hasActionRequired = (): boolean => {
    if (type === 'document') {
      return !!(item as EventDocument).keyData?.actionRequired;
    } else {
      return !!(item as OfficialNotification).metadata?.followUpRequired;
    }
  };

  const getActionText = (): string | undefined => {
    if (type === 'document') {
      return (item as EventDocument).keyData?.actionRequired;
    } else {
      return (item as OfficialNotification).metadata?.followUpRequired ? 'Action Required' : undefined;
    }
  };

  const categoryInfo = getCategoryInfo(getCategory());
  const priority = getItemPriority();
  const priorityColor = getPriorityColor(priority);
  const actionText = getActionText();

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.compactContainer,
        isUnread() && styles.unreadContainer
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Left: Category and priority */}
          <View style={styles.leftHeader}>
            {showCategory && (
              <IOSBadge
                color={categoryInfo.color}
                variant="filled"
                size="small"
                style={styles.categoryBadge}
              >
                {categoryInfo.displayName.split(' ')[0]}
              </IOSBadge>
            )}
            
            <IOSBadge
              color={priorityColor}
              variant="tinted"
              size="small"
            >
              {priority.toUpperCase()}
            </IOSBadge>
          </View>

          {/* Right: Actions */}
          <View style={styles.rightHeader}>
            {isUnread() && (
              <View style={styles.unreadIndicator} />
            )}
            
            <IOSText textStyle="caption2" color="tertiaryLabel">
              {formatDate(getItemDate())}
            </IOSText>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <IOSText 
            textStyle={compact ? "callout" : "headline"} 
            weight="semibold" 
            numberOfLines={compact ? 1 : 2}
            style={styles.title}
          >
            {getItemTitle()}
          </IOSText>
          
          {type === 'document' && (item as EventDocument).isRequired && (
            <IOSBadge color="systemRed" size="small" style={styles.requiredBadge}>
              Required
            </IOSBadge>
          )}
        </View>

        {/* Description */}
        {!compact && (
          <IOSText 
            textStyle="callout" 
            color="secondaryLabel" 
            numberOfLines={3}
            style={styles.description}
          >
            {getItemDescription()}
          </IOSText>
        )}

        {/* Action required banner */}
        {hasActionRequired() && actionText && (
          <View style={[styles.actionBanner, { backgroundColor: priorityColor + '15' }]}>
            <AlertTriangle size={16} color={priorityColor} />
            <IOSText 
              textStyle="footnote" 
              weight="medium" 
              style={[styles.actionText, { color: priorityColor }]}
              numberOfLines={1}
            >
              {actionText}
            </IOSText>
          </View>
        )}

        {/* Footer actions */}
        <View style={styles.footer}>
          <View style={styles.leftFooter}>
            {type === 'document' && (
              <View style={styles.documentInfo}>
                <FileText size={14} color={colors.textSecondary} />
                <IOSText textStyle="caption2" color="tertiaryLabel">
                  {(item as EventDocument).fileType?.toUpperCase() || 'PDF'}
                </IOSText>
                {(item as EventDocument).size && (
                  <IOSText textStyle="caption2" color="tertiaryLabel">
                    • {Math.round((item as EventDocument).size! / 1024)} KB
                  </IOSText>
                )}
              </View>
            )}
            
            {type === 'notification' && (item as OfficialNotification).tags.length > 0 && (
              <View style={styles.tags}>
                {(item as OfficialNotification).tags.slice(0, 2).map((tag, index) => (
                  <IOSBadge key={index} color="systemGray4" size="small">
                    {tag}
                  </IOSBadge>
                ))}
              </View>
            )}
          </View>

          <View style={styles.rightFooter}>
            {/* Bookmark button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBookmark}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isBookmarked ? (
                <BookmarkCheck size={18} color={colors.primary} />
              ) : (
                <Bookmark size={18} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {/* Read/Unread toggle for notifications */}
            {type === 'notification' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMarkAsRead}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isUnread() ? (
                  <EyeOff size={18} color={colors.textSecondary} />
                ) : (
                  <Eye size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}

            {/* Download button for documents */}
            {type === 'document' && onDownload && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDownload}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Download size={18} color={colors.primary} />
              </TouchableOpacity>
            )}

            {/* External link indicator */}
            <ExternalLink size={16} color={colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginVertical: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactContainer: {
    marginVertical: spacing.xs / 2,
  },
  unreadContainer: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryBadge: {
    // Custom styling if needed
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    marginRight: spacing.sm,
  },
  requiredBadge: {
    alignSelf: 'flex-start',
  },
  description: {
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  actionText: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftFooter: {
    flex: 1,
  },
  rightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
  },
});

export default EnhancedNoticeCard;