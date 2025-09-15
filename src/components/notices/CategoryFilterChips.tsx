import React from 'react';
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
  const handleCategoryPress = async (category: RegattaCategory | 'all') => {
    await haptics.selection();
    onCategoryChange(category);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categoryCounts.map(({ category, count, unreadCount }) => {
          const categoryInfo = CATEGORY_INFO[category];
          if (!categoryInfo) return null;

          const isSelected = selectedCategory === category;
          const IconComponent = categoryInfo.icon;

          return (
            <View key={category} style={styles.chipContainer}>
              <IOSButton
                title={`${categoryInfo.label} ${count}`}
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
                titleStyle={[
                  styles.chipText,
                  isSelected ? styles.chipTextSelected : styles.chipTextUnselected
                ]}
                icon={
                  <IconComponent
                    size={16}
                    color={isSelected ? colors.surface : categoryInfo.color}
                    style={styles.chipIcon}
                  />
                }
              />

              {/* Unread badge */}
              {unreadCount && unreadCount > 0 && (
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
                    {unreadCount}
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
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
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
  },
  chipIcon: {
    marginRight: spacing.xs,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
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