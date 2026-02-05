import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  X,
  Filter,
  Bell,
  FileText,
  AlertTriangle,
  Calendar,
  Scale,
  Users,
  Flag,
  MapPin,
  Settings,
  Megaphone
} from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import {
  IOSCard,
  IOSText,
  IOSButton,
  IOSBadge,
  IOSSegmentedControl
} from '../ios';

import type {
  SearchFilters,
  RegattaCategory
} from '../../types/noticeBoard';

interface NoticeFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  availableCategories: RegattaCategory[];
}

export const NoticeFilters: React.FC<NoticeFiltersProps> = ({
  filters,
  onChange,
  availableCategories
}) => {
  // Priority filter options
  const priorityOptions = [
    { value: 'urgent' as const, label: 'Urgent', color: colors.error },
    { value: 'high' as const, label: 'High', color: colors.warning },
    { value: 'medium' as const, label: 'Medium', color: colors.primary },
    { value: 'low' as const, label: 'Low', color: colors.textSecondary }
  ];

  // Category display info
  const categoryInfo = {
    pre_event: { label: 'Pre-Event', icon: Calendar, color: colors.info },
    daily_operations: { label: 'Daily Ops', icon: Bell, color: colors.primary },
    competition_management: { label: 'Competition', icon: Flag, color: colors.success },
    protests_hearings: { label: 'Protests', icon: Scale, color: colors.warning },
    safety_regulatory: { label: 'Safety', icon: AlertTriangle, color: colors.error },
    administrative: { label: 'Admin', icon: Settings, color: colors.textSecondary },
    media_announcements: { label: 'Media', icon: Megaphone, color: colors.accent }
  };

  // Read status options
  const readStatusOptions = [
    { label: 'All', value: 'all' as const },
    { label: 'Unread', value: 'unread' as const },
    { label: 'Read', value: 'read' as const }
  ];

  // Toggle priority filter
  const togglePriority = (priority: typeof filters.priorities[0]) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];

    onChange({
      ...filters,
      priorities: newPriorities
    });
  };

  // Toggle category filter
  const toggleCategory = (category: RegattaCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];

    onChange({
      ...filters,
      categories: newCategories
    });
  };

  // Set read status filter
  const setReadStatus = (status: SearchFilters['readStatus']) => {
    onChange({
      ...filters,
      readStatus: status
    });
  };

  // Toggle attachments filter
  const toggleHasAttachments = () => {
    onChange({
      ...filters,
      hasAttachments: !filters.hasAttachments
    });
  };

  // Toggle action required filter
  const toggleRequiresAction = () => {
    onChange({
      ...filters,
      requiresAction: !filters.requiresAction
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onChange({
      categories: [],
      documentTypes: [],
      notificationTypes: [],
      priorities: [],
      dateRange: {},
      authors: [],
      tags: [],
      readStatus: 'all',
      hasAttachments: false,
      requiresAction: false,
      languages: []
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.priorities.length > 0 ||
    filters.categories.length > 0 ||
    filters.readStatus !== 'all' ||
    filters.hasAttachments ||
    filters.requiresAction;

  return (
    <IOSCard variant="elevated" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Filter size={20} color={colors.primary} />
          <IOSText textStyle="headline" weight="semibold">
            Filters
          </IOSText>
          {hasActiveFilters && (
            <IOSBadge color="systemBlue" variant="filled" size="small">
              {[
                filters.priorities.length,
                filters.categories.length,
                filters.readStatus !== 'all' ? 1 : 0,
                filters.hasAttachments ? 1 : 0,
                filters.requiresAction ? 1 : 0
              ].reduce((sum, count) => sum + count, 0)}
            </IOSBadge>
          )}
        </View>

        {hasActiveFilters && (
          <IOSButton
            title="Clear All"
            variant="plain"
            size="small"
            onPress={clearAllFilters}
          />
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Priority Filters */}
        <View style={styles.filterSection}>
          <IOSText textStyle="callout" weight="medium" style={styles.sectionTitle}>
            Priority
          </IOSText>
          <View style={styles.filterOptions}>
            {priorityOptions.map(option => (
              <IOSButton
                key={option.value}
                title={option.label}
                variant={filters.priorities.includes(option.value) ? "filled" : "tinted"}
                size="small"
                onPress={() => togglePriority(option.value)}
                style={[
                  styles.filterButton,
                  filters.priorities.includes(option.value) && {
                    backgroundColor: option.color + '20',
                    borderColor: option.color
                  }
                ]}
                titleStyle={filters.priorities.includes(option.value) ? {
                  color: option.color
                } : undefined}
              />
            ))}
          </View>
        </View>

        {/* Category Filters */}
        {availableCategories.length > 0 && (
          <View style={styles.filterSection}>
            <IOSText textStyle="callout" weight="medium" style={styles.sectionTitle}>
              Category
            </IOSText>
            <View style={styles.filterOptions}>
              {availableCategories.map(category => {
                const info = categoryInfo[category];
                if (!info) return null;

                const IconComponent = info.icon;
                const isSelected = filters.categories.includes(category);

                return (
                  <IOSButton
                    key={category}
                    title={info.label}
                    variant={isSelected ? "filled" : "tinted"}
                    size="small"
                    onPress={() => toggleCategory(category)}
                    style={[
                      styles.filterButton,
                      isSelected && {
                        backgroundColor: info.color + '20',
                        borderColor: info.color
                      }
                    ]}
                    titleStyle={isSelected ? {
                      color: info.color
                    } : undefined}
                    icon={<IconComponent
                      size={16}
                      color={isSelected ? info.color : colors.textSecondary}
                    />}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Read Status */}
        <View style={styles.filterSection}>
          <IOSText textStyle="callout" weight="medium" style={styles.sectionTitle}>
            Status
          </IOSText>
          <IOSSegmentedControl
            options={readStatusOptions}
            selectedValue={filters.readStatus}
            onValueChange={(value) => setReadStatus(value as SearchFilters['readStatus'])}
            style={styles.segmentedControl}
          />
        </View>

        {/* Additional Options */}
        <View style={styles.filterSection}>
          <IOSText textStyle="callout" weight="medium" style={styles.sectionTitle}>
            Options
          </IOSText>
          <View style={styles.filterOptions}>
            <IOSButton
              title="Has Attachments"
              variant={filters.hasAttachments ? "filled" : "tinted"}
              size="small"
              onPress={toggleHasAttachments}
              style={styles.filterButton}
              icon={<FileText size={16} color={
                filters.hasAttachments ? colors.surface : colors.textSecondary
              } />}
            />

            <IOSButton
              title="Action Required"
              variant={filters.requiresAction ? "filled" : "tinted"}
              size="small"
              onPress={toggleRequiresAction}
              style={styles.filterButton}
              icon={<AlertTriangle size={16} color={
                filters.requiresAction ? colors.surface : colors.textSecondary
              } />}
            />
          </View>
        </View>
      </ScrollView>
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingRight: spacing.md,
  },
  filterSection: {
    minWidth: 150,
    gap: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterButton: {
    marginBottom: spacing.xs,
  },
  segmentedControl: {
    width: 180,
  },
});