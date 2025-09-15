import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, 
  Filter, 
  Users, 
  ChevronLeft,
  Flag,
  Trophy,
  MapPin,
  Phone,
  Check,
  X,
  Clock,
  AlertCircle
} from 'lucide-react-native';

import { colors, spacing } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import {
  IOSNavigationBar,
  IOSButton,
  IOSText,
  IOSCard,
  IOSBadge,
  IOSSection
} from '../ios';
import { LoadingSpinner, SimpleError } from '../shared';
import NoticeBoardService from '../../services/noticeBoardService';
import { useUserStore } from '../../stores/userStore';
import type { Competitor } from '../../types/noticeBoard';

interface EntryListProps {
  navigation: any;
  route: {
    params: {
      eventId: string;
    };
  };
}

const getCountryFlag = (countryCode: string): string => {
  const flagEmojis: { [key: string]: string } = {
    'HKG': '🇭🇰',
    'AUS': '🇦🇺', 
    'GBR': '🇬🇧',
    'USA': '🇺🇸',
    'NZL': '🇳🇿',
    'SIN': '🇸🇬',
    'JPN': '🇯🇵',
    'FRA': '🇫🇷',
    'ITA': '🇮🇹',
    'GER': '🇩🇪'
  };
  return flagEmojis[countryCode] || '🏁';
};

const getStatusColor = (status: Competitor['registrationStatus']) => {
  switch (status) {
    case 'confirmed': return 'systemGreen';
    case 'paid': return 'systemBlue';
    case 'pending': return 'systemOrange';
    case 'incomplete': return 'systemRed';
    default: return 'systemGray';
  }
};

const getStatusIcon = (status: Competitor['registrationStatus']) => {
  switch (status) {
    case 'confirmed': return Check;
    case 'paid': return Check;
    case 'pending': return Clock;
    case 'incomplete': return X;
    default: return AlertCircle;
  }
};

export const EntryList: React.FC<EntryListProps> = ({
  navigation,
  route
}) => {
  const { eventId } = route.params;
  const userStore = useUserStore();
  
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [filteredCompetitors, setFilteredCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Competitor['registrationStatus']>('all');
  const [noticeBoardService] = useState(() => new NoticeBoardService(userStore));

  // Load entry list
  const loadEntryList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const entryList = await noticeBoardService.getEntryList(eventId);
      setCompetitors(entryList);
      setFilteredCompetitors(entryList);
    } catch (err) {
      console.error('Failed to load entry list:', err);
      setError('Failed to load entry list');
      await haptics.errorAction();
    } finally {
      setIsLoading(false);
    }
  }, [eventId, noticeBoardService]);

  // Initial load
  useEffect(() => {
    loadEntryList();
  }, [loadEntryList]);

  // Filter and search competitors
  useEffect(() => {
    let filtered = competitors;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.registrationStatus === filterStatus);
    }

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(c => 
        c.sailNumber.toLowerCase().includes(searchLower) ||
        c.helmName.toLowerCase().includes(searchLower) ||
        c.club.toLowerCase().includes(searchLower) ||
        c.country.toLowerCase().includes(searchLower) ||
        c.crewNames.some(crew => crew.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCompetitors(filtered);
  }, [competitors, searchText, filterStatus]);

  // Handle search input
  const handleSearchChange = useCallback(async (text: string) => {
    setSearchText(text);
    if (text.length > 0) {
      await haptics.keyPress();
    }
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback(async (status: typeof filterStatus) => {
    await haptics.selection();
    setFilterStatus(status);
  }, []);

  // Handle competitor press
  const handleCompetitorPress = useCallback(async (competitor: Competitor) => {
    await haptics.buttonPress();
    navigation.navigate('CompetitorDetail', { competitor, eventId });
  }, [navigation, eventId]);

  // Render competitor card
  const renderCompetitorCard = (competitor: Competitor) => {
    const StatusIcon = getStatusIcon(competitor.registrationStatus);
    
    return (
      <View
        key={competitor.id}
      >
        <IOSCard 
          variant="elevated" 
          style={styles.competitorCard}
          onPress={() => handleCompetitorPress(competitor)}
        >
          <View style={styles.competitorHeader}>
            <View style={styles.competitorInfo}>
              <View style={styles.competitorMeta}>
                <IOSText textStyle="headline" weight="semibold">
                  {competitor.sailNumber}
                </IOSText>
                <IOSText textStyle="caption1" color="tertiaryLabel">
                  {getCountryFlag(competitor.country)} {competitor.country}
                </IOSText>
              </View>
              
              <IOSBadge 
                color={getStatusColor(competitor.registrationStatus)}
                size="small"
                variant="filled"
              >
                {competitor.registrationStatus.toUpperCase()}
              </IOSBadge>
            </View>
            
            <StatusIcon 
              size={20} 
              color={colors[getStatusColor(competitor.registrationStatus) as keyof typeof colors] || colors.textSecondary} 
            />
          </View>
          
          <View style={styles.competitorDetails}>
            <IOSText textStyle="callout" weight="medium">
              {competitor.helmName}
            </IOSText>
            
            {competitor.crewNames.length > 0 && (
              <IOSText textStyle="caption1" color="secondaryLabel">
                Crew: {competitor.crewNames.join(', ')}
              </IOSText>
            )}
            
            <View style={styles.competitorMeta}>
              <MapPin size={14} color={colors.textSecondary} />
              <IOSText textStyle="caption1" color="tertiaryLabel">
                {competitor.club}
              </IOSText>
            </View>
            
            <IOSText textStyle="caption1" color="tertiaryLabel">
              Entered: {new Date(competitor.entryDate).toLocaleDateString()}
            </IOSText>
          </View>
          
          <View style={styles.competitorFooter}>
            <View style={styles.statusIndicators}>
              <View style={styles.statusIndicator}>
                <IOSText textStyle="caption2" color="tertiaryLabel">Payment:</IOSText>
                <IOSBadge 
                  color={competitor.paymentStatus === 'paid' ? 'systemGreen' : 'systemOrange'}
                  size="small"
                >
                  {competitor.paymentStatus.toUpperCase()}
                </IOSBadge>
              </View>
              
              <View style={styles.statusIndicator}>
                <IOSText textStyle="caption2" color="tertiaryLabel">Docs:</IOSText>
                <IOSBadge 
                  color={competitor.documentsSubmitted ? 'systemGreen' : 'systemRed'}
                  size="small"
                >
                  {competitor.documentsSubmitted ? 'COMPLETE' : 'MISSING'}
                </IOSBadge>
              </View>
              
              <View style={styles.statusIndicator}>
                <IOSText textStyle="caption2" color="tertiaryLabel">Measurement:</IOSText>
                <IOSBadge 
                  color={competitor.measurementCompleted ? 'systemGreen' : 'systemOrange'}
                  size="small"
                >
                  {competitor.measurementCompleted ? 'DONE' : 'PENDING'}
                </IOSBadge>
              </View>
            </View>
          </View>
        </IOSCard>
      </View>
    );
  };

  // Get filter options
  const filterOptions: Array<{ label: string; value: typeof filterStatus }> = [
    { label: 'All', value: 'all' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Incomplete', value: 'incomplete' }
  ];

  // Get stats
  const totalEntries = competitors.length;
  const confirmedEntries = competitors.filter(c => c.registrationStatus === 'confirmed').length;
  const paidEntries = competitors.filter(c => c.paymentStatus === 'paid').length;
  const countries = [...new Set(competitors.map(c => c.country))].length;

  // Show loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          title="Entry List"
          style="large"
          leftAction={{
            icon: <ChevronLeft size={20} color={colors.primary} />,
            onPress: () => navigation.goBack()
          }}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner 
            size="large" 
            text="Loading entries..." 
            showBackground={true}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show error
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          title="Entry List"
          style="large"
          leftAction={{
            icon: <ChevronLeft size={20} color={colors.primary} />,
            onPress: () => navigation.goBack()
          }}
        />
        <SimpleError
          message={error}
          onRetry={loadEntryList}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <IOSNavigationBar
        title="Entry List"
        style="large"
        leftAction={{
          icon: <ChevronLeft size={20} color={colors.primary} />,
          onPress: () => navigation.goBack()
        }}
        rightActions={[
          {
            icon: <Users size={20} color={colors.primary} />,
            onPress: () => {}
          }
        ]}
      />

      {/* Statistics */}
      <IOSSection spacing="compact">
        <IOSCard variant="elevated" style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <IOSText textStyle="title2" weight="bold" color="primary">
                {totalEntries}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Total Entries
              </IOSText>
            </View>
            
            <View style={styles.statItem}>
              <IOSText textStyle="title2" weight="bold" color="systemGreen">
                {confirmedEntries}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Confirmed
              </IOSText>
            </View>
            
            <View style={styles.statItem}>
              <IOSText textStyle="title2" weight="bold" color="systemBlue">
                {paidEntries}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Paid
              </IOSText>
            </View>
            
            <View style={styles.statItem}>
              <IOSText textStyle="title2" weight="bold" color="systemOrange">
                {countries}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Countries
              </IOSText>
            </View>
          </View>
        </IOSCard>
      </IOSSection>

      {/* Search and Filter */}
      <IOSSection spacing="compact">
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by sail number, name, or club..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.map((option) => (
            <IOSButton
              key={option.value}
              title={option.label}
              variant={filterStatus === option.value ? 'filled' : 'tinted'}
              size="small"
              onPress={() => handleFilterChange(option.value)}
              style={styles.filterButton}
            />
          ))}
        </ScrollView>
      </IOSSection>

      {/* Results */}
      <IOSSection 
        title={`${filteredCompetitors.length} ${filteredCompetitors.length === 1 ? 'Entry' : 'Entries'}`}
        spacing="compact"
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredCompetitors.length === 0 ? (
            <IOSCard variant="elevated" style={styles.emptyCard}>
              <Users size={48} color={colors.textSecondary} />
              <IOSText textStyle="headline" weight="semibold" color="secondaryLabel">
                No entries found
              </IOSText>
              <IOSText textStyle="callout" color="tertiaryLabel" style={styles.emptyText}>
                {searchText || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No competitors have registered yet'
                }
              </IOSText>
            </IOSCard>
          ) : (
            <View style={styles.competitorsList}>
              {filteredCompetitors.map(renderCompetitorCard)}
            </View>
          )}
        </ScrollView>
      </IOSSection>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },

  // Statistics
  statsCard: {
    padding: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },

  // Search and Filter
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchIcon: {
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  filterContainer: {
    marginTop: spacing.sm,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    minWidth: 80,
  },

  // Competitors
  competitorsList: {
    gap: spacing.md,
  },
  competitorCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  competitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  competitorInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginRight: spacing.md,
  },
  competitorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  competitorDetails: {
    gap: spacing.xs,
  },
  competitorFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderLight,
  },
  statusIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusIndicator: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 280,
  },
});