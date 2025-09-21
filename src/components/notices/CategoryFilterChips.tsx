import React, { Fragment } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Calendar,
  Clock,
  Flag,
  AlertTriangle,
  Scale,
  Settings,
  FileText
} from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import { IOSButton, IOSText } from '../ios';
import { haptics } from '../../utils/haptics';

import type { RegattaCategory } from '../../types/noticeBoard';

export interface CategoryCount {
  category: RegattaCategory | 'all';
  count: number;
  unreadCount?: number;
}

interface CategoryFilterChipsProps {
  categoryCounts: CategoryCount[];
  selectedCategory: RegattaCategory | 'all';
  onCategoryChange: (category: RegattaCategory | 'all') => void;
}

const CATEGORY_INFO = {
  all: {
    label: 'All',
    icon: FileText,
    color: colors.primary
  },
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
  }
} as const;

export const CategoryFilterChips: React.FC<CategoryFilterChipsProps> = ({
  categoryCounts,
  selectedCategory,
  onCategoryChange
}) => {
  console.log('[CategoryFilterChips] Rendering with counts:', categoryCounts);
  console.log('[CategoryFilterChips] Selected category:', selectedCategory);

  const handleCategoryPress = async (category: RegattaCategory | 'all') => {
    await haptics.selection();
    onCategoryChange(category);
  };

  // Robust data validation
  if (!categoryCounts || !Array.isArray(categoryCounts) || categoryCounts.length === 0) {
    console.log('[CategoryFilterChips] Invalid or empty category counts, returning null');
    return null;
  }

  // Validate each category count item - keep all categories including those with 0 count
  const validCategoryCounts = categoryCounts.filter(item => {
    if (!item || typeof item !== 'object') {
      console.warn('[CategoryFilterChips] Invalid category count item:', item);
      return false;
    }
    if (!item.category || typeof item.category !== 'string') {
      console.warn('[CategoryFilterChips] Invalid category:', item.category);
      return false;
    }
    if (typeof item.count !== 'number' || item.count < 0) {
      console.warn('[CategoryFilterChips] Invalid count:', item.count);
      return false;
    }
    return true; // Keep all valid categories, even with count 0
  });

  if (validCategoryCounts.length === 0) {
    console.log('[CategoryFilterChips] No valid category counts after validation');
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {validCategoryCounts.map(({ category, count, unreadCount }) => {
          console.log('[CategoryFilterChips] Processing category:', category, 'count:', count);

          const categoryInfo = CATEGORY_INFO[category];
          if (!categoryInfo) {
            console.log('[CategoryFilterChips] No category info for:', category);
            // Return empty fragment instead of null to avoid React Native text rendering issues
            return <Fragment key={`missing-${category}`} />;
          }

          const isSelected = selectedCategory === category;
          const safeCount = typeof count === 'number' ? count : 0;
          const safeUnreadCount = typeof unreadCount === 'number' ? unreadCount : 0;

          return (
            <View key={category} style={styles.chipContainer}>
              <IOSButton
                title={`${categoryInfo.label} ${safeCount.toString()}`}
                variant={isSelected ? 'filled' : 'tinted'}
                size="small"
                onPress={() => handleCategoryPress(category)}
                style={[
                  styles.chip,
                  isSelected && {
                    backgroundColor: categoryInfo.color,
                    borderColor: categoryInfo.color,
                  }
                ]}
                textStyle={[
                  styles.chipText,
                  isSelected ? styles.chipTextSelected : styles.chipTextUnselected
                ]}
              />

              {/* Unread badge */}
              {safeUnreadCount > 0 && (
                <View style={[
                  styles.unreadBadge,
                  { backgroundColor: isSelected ? colors.surface : categoryInfo.color }
                ]}>
                  <IOSText
                    textStyle="caption2"
                    weight="semibold"
                    style={[
                      styles.unreadText,
                      { color: isSelected ? categoryInfo.color : colors.surface }
                    ]}
                  >
                    {safeUnreadCount.toString()}
                  </IOSText>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingTop: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  chipContainer: {
    position: 'relative',
  },
  chip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: spacing.xs,
  },
  chipIcon: {
    marginRight: spacing.xs,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 0,
  },
  chipTextSelected: {
    color: colors.surface,
  },
  chipTextUnselected: {
    color: colors.text,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  unreadText: {
    fontSize: 11,
    lineHeight: 16,
  },
});