import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  Flag,
  AlertTriangle,
  Scale,
  Settings,
  Megaphone
} from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import { IOSText, IOSBadge } from '../ios';
import { NoticeCard } from './NoticeCard';
import { haptics } from '../../utils/haptics';

import type { RegattaCategory } from '../../types/noticeBoard';

// Reuse the same type from NoticesScreen
type NoticeItem = {
  id: string;
  title: string;
  content?: string;
  description?: string;
  itemType: 'notification' | 'document';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publishedAt: string;
  category?: RegattaCategory;
  isRead?: boolean;
};

interface CollapsibleCategorySectionProps {
  category: RegattaCategory;
  notices: NoticeItem[];
  onNoticePress: (notice: NoticeItem) => void;
  initiallyExpanded?: boolean;
}

const CATEGORY_INFO = {
  pre_event: {
    label: 'Pre-Event',
    icon: Calendar,
    color: colors.info
  },
  daily_operations: {
    label: 'Daily Ops',
    icon: Clock,
    color: colors.primary
  },
  competition_management: {
    label: 'Competition',
    icon: Flag,
    color: colors.success
  },
  protests_hearings: {
    label: 'Protests',
    icon: Scale,
    color: colors.warning
  },
  safety_regulatory: {
    label: 'Safety',
    icon: AlertTriangle,
    color: colors.error
  },
  administrative: {
    label: 'Admin',
    icon: Settings,
    color: colors.textSecondary
  },
  media_announcements: {
    label: 'Media',
    icon: Megaphone,
    color: colors.accent
  }
} as const;

export const CollapsibleCategorySection: React.FC<CollapsibleCategorySectionProps> = ({
  category,
  notices,
  onNoticePress,
  initiallyExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const categoryInfo = CATEGORY_INFO[category];
  if (!categoryInfo) return null;

  const IconComponent = categoryInfo.icon;
  const unreadCount = notices.filter(notice => notice.isRead === false).length;
  const hasNewNotices = unreadCount > 0;

  const handleToggleExpanded = async () => {
    await haptics.selection();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const renderNoticeItem = (notice: NoticeItem, index: number) => (
    <NoticeCard
      key={`${notice.itemType}-${notice.id}`}
      notice={notice}
      onPress={onNoticePress}
      compact={true}
      style={[
        styles.noticeCard,
        index === notices.length - 1 && styles.lastNoticeCard
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color + '20' }]}>
            <IconComponent size={18} color={categoryInfo.color} />
          </View>

          <View style={styles.headerInfo}>
            <IOSText textStyle="headline" weight="semibold" style={styles.categoryTitle}>
              {categoryInfo.label}
            </IOSText>
            <IOSText textStyle="caption1" color="secondaryLabel">
              {notices.length} notice{notices.length !== 1 ? 's' : ''}
            </IOSText>
          </View>
        </View>

        <View style={styles.headerRight}>
          {hasNewNotices && (
            <IOSBadge
              color="systemPink"
              variant="filled"
              size="small"
              style={styles.newBadge}
            >
              New
            </IOSBadge>
          )}

          <IOSText textStyle="title3" color="secondaryLabel" style={styles.countText}>
            {notices.length}
          </IOSText>

          <View style={styles.chevronContainer}>
            {isExpanded ? (
              <ChevronDown size={16} color={colors.textSecondary} />
            ) : (
              <ChevronRight size={16} color={colors.textSecondary} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Section Content */}
      {isExpanded && (
        <View style={styles.content}>
          {notices.map((notice, index) => renderNoticeItem(notice, index))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  categoryTitle: {
    marginBottom: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  newBadge: {
    paddingHorizontal: spacing.xs,
  },
  countText: {
    minWidth: 20,
    textAlign: 'center',
  },
  chevronContainer: {
    padding: spacing.xs,
  },
  content: {
    marginTop: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  noticeCard: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  lastNoticeCard: {
    borderBottomWidth: 0,
  },
});