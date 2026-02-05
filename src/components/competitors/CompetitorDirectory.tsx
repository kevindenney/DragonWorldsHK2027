import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  Alert
} from 'react-native';
import { 
  Search, 
  Filter, 
  SortAsc, 
  Users, 
  Globe, 
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Share
} from 'lucide-react-native';

import { IOSText, IOSSearchBar, IOSButton, IOSSegmentedControl, IOSBadge } from '../ios';
import { CompetitorCard } from './CompetitorCard';
import { CompetitorFilters } from './CompetitorFilters';
import type { Competitor } from '../../types/noticeBoard';

interface CompetitorDirectoryProps {
  competitors: Competitor[];
  onCompetitorPress?: (competitor: Competitor) => void;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  showCurrentPositions?: boolean;
  currentPositions?: { [sailNumber: string]: number };
  highlightedSailNumber?: string;
}

type SortOption = 'sailNumber' | 'helmName' | 'country' | 'club' | 'position' | 'entryDate';
type FilterOption = 'all' | 'confirmed' | 'pending' | 'paid' | 'incomplete';

export const CompetitorDirectory: React.FC<CompetitorDirectoryProps> = ({
  competitors,
  onCompetitorPress,
  onRefresh,
  isRefreshing = false,
  showCurrentPositions = false,
  currentPositions = {},
  highlightedSailNumber,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('sailNumber');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');

  // Get unique countries for filtering
  const availableCountries = useMemo(() => {
    const countries = [...new Set(competitors.map(c => c.country))].sort();
    return countries;
  }, [competitors]);

  // Filter and sort competitors
  const filteredAndSortedCompetitors = useMemo(() => {
    let filtered = competitors;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(competitor => 
        competitor.helmName.toLowerCase().includes(query) ||
        competitor.sailNumber.toLowerCase().includes(query) ||
        competitor.country.toLowerCase().includes(query) ||
        competitor.club.toLowerCase().includes(query) ||
        competitor.crewNames.some(name => name.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(competitor => {
        switch (filterBy) {
          case 'confirmed':
            return competitor.registrationStatus === 'confirmed';
          case 'pending':
            return competitor.registrationStatus === 'pending';
          case 'paid':
            return competitor.paymentStatus === 'paid';
          case 'incomplete':
            return competitor.registrationStatus === 'incomplete';
          default:
            return true;
        }
      });
    }

    // Apply country filter
    if (selectedCountries.length > 0) {
      filtered = filtered.filter(competitor => 
        selectedCountries.includes(competitor.country)
      );
    }

    // Sort competitors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'sailNumber':
          return a.sailNumber.localeCompare(b.sailNumber, undefined, { numeric: true });
        case 'helmName':
          return a.helmName.localeCompare(b.helmName);
        case 'country':
          return a.country.localeCompare(b.country);
        case 'club':
          return a.club.localeCompare(b.club);
        case 'position':
          if (!showCurrentPositions) return 0;
          const posA = currentPositions[a.sailNumber] || 999;
          const posB = currentPositions[b.sailNumber] || 999;
          return posA - posB;
        case 'entryDate':
          return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [competitors, searchQuery, sortBy, filterBy, selectedCountries, showCurrentPositions, currentPositions]);

  // Statistics
  const stats = useMemo(() => {
    const total = competitors.length;
    const confirmed = competitors.filter(c => c.registrationStatus === 'confirmed').length;
    const paid = competitors.filter(c => c.paymentStatus === 'paid').length;
    const countries = new Set(competitors.map(c => c.country)).size;
    
    return {
      total,
      confirmed,
      paid,
      countries,
      showing: filteredAndSortedCompetitors.length
    };
  }, [competitors, filteredAndSortedCompetitors]);

  const handleExportList = () => {
    Alert.alert(
      'Export Competitor List',
      'Choose export format:',
      [
        { text: 'CSV', onPress: () => exportToCSV() },
        { text: 'PDF', onPress: () => exportToPDF() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const exportToCSV = () => {
    // Implementation for CSV export
  };

  const exportToPDF = () => {
    // Implementation for PDF export
  };

  const handleShareList = () => {
    // Implementation for sharing functionality
  };

  const renderCompetitorItem = ({ item }: { item: Competitor }) => (
    <CompetitorCard
      competitor={item}
      onPress={() => onCompetitorPress?.(item)}
      showCurrentPosition={showCurrentPositions}
      currentPosition={currentPositions[item.sailNumber]}
      isHighlighted={item.sailNumber === highlightedSailNumber}
      compact={viewMode === 'compact'}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Statistics */}
      <View style={styles.statsSection}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Users size={16} color="#007AFF" />
            <IOSText style={styles.statNumber}>{stats.showing}</IOSText>
            <IOSText style={styles.statLabel}>Showing</IOSText>
          </View>
          
          <View style={styles.statItem}>
            <CheckCircle size={16} color="#34C759" />
            <IOSText style={styles.statNumber}>{stats.confirmed}</IOSText>
            <IOSText style={styles.statLabel}>Confirmed</IOSText>
          </View>
          
          <View style={styles.statItem}>
            <Globe size={16} color="#FF9500" />
            <IOSText style={styles.statNumber}>{stats.countries}</IOSText>
            <IOSText style={styles.statLabel}>Countries</IOSText>
          </View>
          
          <View style={styles.statItem}>
            <IOSText style={styles.totalLabel}>of {stats.total} total</IOSText>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <IOSSearchBar
        placeholder="Search competitors..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        style={styles.searchBar}
      />

      {/* Controls Row */}
      <View style={styles.controlsRow}>
        {/* View Mode Selector */}
        <IOSSegmentedControl
          values={['List', 'Compact']}
          selectedIndex={viewMode === 'list' ? 0 : 1}
          onChange={(index: number) => setViewMode(index === 0 ? 'list' : 'compact')}
          style={styles.viewModeControl}
        />

        {/* Filter Button */}
        <IOSButton
          title="Filter"
          onPress={() => setShowFilters(!showFilters)}
          variant={showFilters ? "primary" : "secondary"}
          size="small"
          icon={<Filter size={16} color={showFilters ? "#FFFFFF" : "#007AFF"} />}
          style={styles.filterButton}
        />

        {/* Export/Share */}
        <IOSButton
          title=""
          onPress={handleExportList}
          variant="secondary"
          size="small"
          icon={<Download size={16} color="#007AFF" />}
          style={styles.actionButton}
        />
        
        <IOSButton
          title=""
          onPress={handleShareList}
          variant="secondary"
          size="small"
          icon={<Share size={16} color="#007AFF" />}
          style={styles.actionButton}
        />
      </View>

      {/* Sort Options */}
      <View style={styles.sortSection}>
        <IOSText style={styles.sortLabel}>Sort by:</IOSText>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'sailNumber', label: 'Sail #' },
            { key: 'helmName', label: 'Name' },
            { key: 'country', label: 'Country' },
            { key: 'club', label: 'Club' },
            ...(showCurrentPositions ? [{ key: 'position', label: 'Position' }] : []),
            { key: 'entryDate', label: 'Entry Date' }
          ]}
          renderItem={({ item }) => (
            <IOSButton
              title={item.label}
              onPress={() => setSortBy(item.key as SortOption)}
              variant={sortBy === item.key ? "primary" : "secondary"}
              size="small"
              style={styles.sortButton}
            />
          )}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.sortButtons}
        />
      </View>

      {/* Active Filters Display */}
      {(filterBy !== 'all' || selectedCountries.length > 0) && (
        <View style={styles.activeFilters}>
          <IOSText style={styles.activeFiltersLabel}>Active filters:</IOSText>
          {filterBy !== 'all' && (
            <IOSBadge 
              color="#007AFF" 
              onPress={() => setFilterBy('all')}
              dismissible
            >
              {filterBy}
            </IOSBadge>
          )}
          {selectedCountries.map(country => (
            <IOSBadge
              key={country}
              color="#FF9500"
              onPress={() => setSelectedCountries(prev => prev.filter(c => c !== country))}
              dismissible
            >
              {country}
            </IOSBadge>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filters Panel */}
      {showFilters && (
        <CompetitorFilters
          availableCountries={availableCountries}
          selectedCountries={selectedCountries}
          onCountriesChange={setSelectedCountries}
          filterBy={filterBy}
          onFilterChange={setFilterBy}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Competitor List */}
      <FlatList
        data={filteredAndSortedCompetitors}
        renderItem={renderCompetitorItem}
        keyExtractor={item => item.sailNumber}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={48} color="#8E8E93" />
            <IOSText style={styles.emptyTitle}>No competitors found</IOSText>
            <IOSText style={styles.emptySubtitle}>
              Try adjusting your search or filters
            </IOSText>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContainer: {
    padding: 16,
  },

  // Header
  header: {
    marginBottom: 16,
  },

  // Statistics
  statsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Search
  searchBar: {
    marginBottom: 16,
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewModeControl: {
    flex: 1,
    marginRight: 12,
  },
  filterButton: {
    marginRight: 8,
  },
  actionButton: {
    marginLeft: 4,
    paddingHorizontal: 12,
  },

  // Sort
  sortSection: {
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  sortButtons: {
    paddingRight: 16,
  },
  sortButton: {
    marginRight: 8,
  },

  // Active Filters
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  activeFiltersLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});