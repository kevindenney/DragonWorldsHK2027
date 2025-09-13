import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Search, Filter, X } from 'lucide-react-native';

import { IOSText, IOSButton, IOSBadge } from '../../ios';
import { SearchQuery, SearchFilters, RegattaCategory } from '../../../types/noticeBoard';
import { colors, spacing } from '../../../constants/theme';
import { parseSearchQuery, createDefaultFilters } from '../../../utils/searchUtils';
import { haptics } from '../../../utils/haptics';

interface SmartSearchProps {
  onSearch: (query: SearchQuery) => void;
  onFilterChange?: (filters: SearchFilters) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  onFilterChange,
  placeholder = "Search notices and documents...",
  showAdvancedFilters = false,
}) => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(createDefaultFilters());
  const [showFilters, setShowFilters] = useState(false);

  const parsedQuery = useMemo(() => {
    if (!searchText.trim()) return null;
    
    const { text, filters: parsedFilters } = parseSearchQuery(searchText);
    
    // Merge parsed filters with existing filters
    const mergedFilters: SearchFilters = {
      ...filters,
      ...parsedFilters,
      categories: parsedFilters.categories || filters.categories,
      priorities: parsedFilters.priorities || filters.priorities,
    };

    return {
      text,
      filters: mergedFilters,
      sortBy: 'relevance' as const,
      sortOrder: 'desc' as const,
    };
  }, [searchText, filters]);

  const handleSearch = async () => {
    await haptics.buttonPress();
    
    if (parsedQuery) {
      onSearch(parsedQuery);
    }
  };

  const handleClear = async () => {
    await haptics.selection();
    setSearchText('');
    setFilters(createDefaultFilters());
    
    // Trigger empty search to show all results
    onSearch({
      text: '',
      filters: createDefaultFilters(),
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const toggleFilters = async () => {
    await haptics.selection();
    setShowFilters(!showFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.priorities.length > 0 ||
      filters.readStatus !== 'all' ||
      filters.hasAttachments ||
      filters.requiresAction ||
      filters.authors.length > 0 ||
      filters.tags.length > 0
    );
  }, [filters]);

  const getFilterSummary = (): string => {
    const activeFilters: string[] = [];
    
    if (filters.categories.length > 0) {
      activeFilters.push(`${filters.categories.length} categories`);
    }
    if (filters.priorities.length > 0) {
      activeFilters.push(`${filters.priorities.length} priorities`);
    }
    if (filters.readStatus !== 'all') {
      activeFilters.push(filters.readStatus);
    }
    if (filters.hasAttachments) {
      activeFilters.push('with attachments');
    }
    if (filters.requiresAction) {
      activeFilters.push('action required');
    }
    
    return activeFilters.join(', ');
  };

  React.useEffect(() => {
    // Auto-search when text changes (debounced)
    const timer = setTimeout(() => {
      if (parsedQuery) {
        onSearch(parsedQuery);
      } else if (searchText === '') {
        // Show all results when search is cleared
        onSearch({
          text: '',
          filters: createDefaultFilters(),
          sortBy: 'date',
          sortOrder: 'desc',
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, parsedQuery, onSearch]);

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          
          {searchText.length > 0 && (
            <IOSButton
              title=""
              variant="plain"
              size="small"
              onPress={handleClear}
              icon={<X size={18} color={colors.textSecondary} />}
              style={styles.clearButton}
            />
          )}
        </View>

        {showAdvancedFilters && (
          <IOSButton
            title=""
            variant={hasActiveFilters ? "filled" : "tinted"}
            size="small"
            onPress={toggleFilters}
            icon={<Filter size={18} color={hasActiveFilters ? colors.surface : colors.primary} />}
            style={styles.filterButton}
          />
        )}
      </View>

      {/* Search Hints */}
      {searchText.length === 0 && (
        <View style={styles.hintsContainer}>
          <IOSText textStyle="caption2" color="tertiaryLabel" style={styles.hintsText}>
            Try: "category:pre_event", "priority:urgent", "author:Race Committee", "is:unread"
          </IOSText>
        </View>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <View style={styles.filtersContainer}>
          <IOSText textStyle="caption1" color="secondaryLabel">
            Active filters: {getFilterSummary()}
          </IOSText>
          <IOSButton
            title="Clear"
            variant="plain"
            size="small"
            onPress={handleClear}
            style={styles.clearFiltersButton}
          />
        </View>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && showAdvancedFilters && (
        <View style={styles.filtersPanel}>
          <IOSText textStyle="callout" weight="medium" style={styles.filtersPanelTitle}>
            Advanced Filters
          </IOSText>
          
          {/* Quick filter buttons */}
          <View style={styles.quickFilters}>
            <IOSButton
              title="Unread Only"
              variant={filters.readStatus === 'unread' ? "filled" : "tinted"}
              size="small"
              onPress={() => {
                setFilters(prev => ({
                  ...prev,
                  readStatus: prev.readStatus === 'unread' ? 'all' : 'unread'
                }));
              }}
            />
            
            <IOSButton
              title="Action Required"
              variant={filters.requiresAction ? "filled" : "tinted"}
              size="small"
              onPress={() => {
                setFilters(prev => ({
                  ...prev,
                  requiresAction: !prev.requiresAction
                }));
              }}
            />
            
            <IOSButton
              title="With Attachments"
              variant={filters.hasAttachments ? "filled" : "tinted"}
              size="small"
              onPress={() => {
                setFilters(prev => ({
                  ...prev,
                  hasAttachments: !prev.hasAttachments
                }));
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    marginLeft: spacing.xs,
  },
  filterButton: {
    minWidth: 44,
    height: 44,
  },
  hintsContainer: {
    marginTop: spacing.sm,
  },
  hintsText: {
    textAlign: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearFiltersButton: {
    // Custom styling if needed
  },
  filtersPanel: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  filtersPanelTitle: {
    marginBottom: spacing.md,
  },
  quickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

export default SmartSearch;