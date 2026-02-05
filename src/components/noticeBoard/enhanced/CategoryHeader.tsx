import React from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring 
} from '../../../utils/reanimatedWrapper';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Clock,
  FileText,
  Calendar,
  Trophy,
  Scale,
  Shield,
  Settings,
  Megaphone
} from 'lucide-react-native';

import { IOSText, IOSBadge } from '../../ios';
import { CategoryInfo, RegattaCategory } from '../../../types/noticeBoard';
import { colors, spacing } from '../../../constants/theme';
import { haptics } from '../../../utils/haptics';

interface CategoryHeaderProps {
  category: CategoryInfo;
  isExpanded: boolean;
  onToggle: (category: RegattaCategory) => void;
  onPress?: (category: RegattaCategory) => void;
  showUnreadBadge?: boolean;
  interactive?: boolean;
}

const CATEGORY_ICONS: Record<RegattaCategory, React.ComponentType<any>> = {
  [RegattaCategory.PRE_EVENT]: FileText,
  [RegattaCategory.DAILY_OPERATIONS]: Calendar,
  [RegattaCategory.COMPETITION_MANAGEMENT]: Trophy,
  [RegattaCategory.PROTESTS_HEARINGS]: Scale,
  [RegattaCategory.SAFETY_REGULATORY]: Shield,
  [RegattaCategory.ADMINISTRATIVE]: Settings,
  [RegattaCategory.MEDIA_ANNOUNCEMENTS]: Megaphone,
};

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  category,
  isExpanded,
  onToggle,
  onPress,
  showUnreadBadge = true,
  interactive = true,
}) => {
  const rotationValue = useSharedValue(isExpanded ? 90 : 0);
  const scaleValue = useSharedValue(1);

  React.useEffect(() => {
    rotationValue.value = withTiming(isExpanded ? 90 : 0, { duration: 200 });
  }, [isExpanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationValue.value}deg` }],
  }));

  const pressableStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePress = async () => {
    if (!interactive) return;

    await haptics.selection();
    scaleValue.value = withSpring(0.98, { duration: 100 });
    setTimeout(() => {
      scaleValue.value = withSpring(1, { duration: 150 });
    }, 100);
    
    onToggle(category.category);
  };

  const handleCategoryPress = async () => {
    if (!onPress || !interactive) return;

    await haptics.buttonPress();
    onPress(category.category);
  };

  const IconComponent = CATEGORY_ICONS[category.category];
  const hasUnreadItems = category.unreadCount > 0;
  const hasRecentActivity = category.lastUpdated && 
    new Date(category.lastUpdated) > new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

  const getCategoryColor = () => {
    if (hasUnreadItems) return colors.primary;
    if (hasRecentActivity) return colors.warning;
    return colors.textSecondary;
  };

  const getTotalItemCount = () => {
    return category.documentCount + category.notificationCount;
  };

  const formatLastUpdated = () => {
    if (!category.lastUpdated) return '';
    
    const date = new Date(category.lastUpdated);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Animated.View style={[styles.container, pressableStyle]}>
      <Pressable
        style={[
          styles.header,
          isExpanded && styles.headerExpanded,
          hasUnreadItems && styles.headerWithUnread
        ]}
        onPress={handlePress}
        android_ripple={{ color: colors.primary + '20' }}
      >
        {/* Left side - Icon and title */}
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: getCategoryColor() + '20' }]}>
            <IconComponent size={20} color={getCategoryColor()} />
          </View>
          
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <IOSText 
                textStyle="headline" 
                weight="semibold" 
                style={[styles.title, { color: getCategoryColor() }]}
                numberOfLines={1}
              >
                {category.displayName}
              </IOSText>
              
              {hasUnreadItems && showUnreadBadge && (
                <View style={styles.unreadIndicator}>
                  <AlertCircle size={16} color={colors.error} />
                </View>
              )}
            </View>
            
            <IOSText 
              textStyle="caption1" 
              color="secondaryLabel" 
              numberOfLines={1}
              style={styles.description}
            >
              {category.description}
            </IOSText>
          </View>
        </View>

        {/* Right side - Badges and chevron */}
        <View style={styles.rightContent}>
          <View style={styles.badgeContainer}>
            {/* Item count badge */}
            {getTotalItemCount() > 0 && (
              <IOSBadge
                color={hasUnreadItems ? 'systemBlue' : 'systemGray2'}
                variant="filled"
                size="small"
                style={styles.countBadge}
              >
                {getTotalItemCount()}
              </IOSBadge>
            )}
            
            {/* Unread count badge */}
            {hasUnreadItems && showUnreadBadge && (
              <IOSBadge
                color="systemRed"
                variant="filled"
                size="small"
                style={styles.unreadBadge}
              >
                {category.unreadCount}
              </IOSBadge>
            )}
          </View>

          {interactive && (
            <Animated.View style={chevronStyle}>
              <ChevronRight size={20} color={colors.textSecondary} />
            </Animated.View>
          )}
        </View>
      </Pressable>

      {/* Expandable metadata section */}
      {isExpanded && (
        <Animated.View
          style={styles.metadata}
        >
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <FileText size={14} color={colors.textSecondary} />
              <IOSText textStyle="caption2" color="tertiaryLabel">
                {category.documentCount} doc{category.documentCount !== 1 ? 's' : ''}
              </IOSText>
            </View>
            
            <View style={styles.metadataItem}>
              <AlertCircle size={14} color={colors.textSecondary} />
              <IOSText textStyle="caption2" color="tertiaryLabel">
                {category.notificationCount} notice{category.notificationCount !== 1 ? 's' : ''}
              </IOSText>
            </View>
            
            {hasRecentActivity && (
              <View style={styles.metadataItem}>
                <Clock size={14} color={colors.warning} />
                <IOSText textStyle="caption2" style={{ color: colors.warning }}>
                  {formatLastUpdated()}
                </IOSText>
              </View>
            )}
          </View>

          {onPress && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleCategoryPress}
              activeOpacity={0.7}
            >
              <IOSText textStyle="footnote" style={{ color: colors.primary }}>
                View All Items
              </IOSText>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginVertical: spacing.xs,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    minHeight: 64,
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerWithUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
  },
  unreadIndicator: {
    marginLeft: spacing.xs,
  },
  description: {
    lineHeight: 16,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  countBadge: {
    minWidth: 24,
  },
  unreadBadge: {
    minWidth: 20,
  },
  metadata: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
  },
});

export default CategoryHeader;