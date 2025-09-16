import React, { useState, useEffect, useCallback, useMemo } from 'react';

console.log('[NoticesScreen] Module loading...');
import { View, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Animated import removed to fix Hermes property configuration error
import {
  Bell,
  Search,
  WifiOff,
  Settings,
  ChevronLeft
} from 'lucide-react-native';

import { colors, spacing } from '../../constants/theme';
// Direct imports used instead of barrel exports due to Hermes engine incompatibility
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { SimpleError } from '../../components/shared/SimpleError';
import { OfflineError } from '../../components/shared/OfflineError';
import { haptics } from '../../utils/haptics';
import { offlineManager } from '../../services/offlineManager';
import {
  IOSNavigationBar,
  IOSText,
  IOSSection
} from '../../components/ios';

import { NoticeCard } from '../../components/notices/NoticeCard';
import { NoticeFilters } from '../../components/notices/NoticeFilters';
import { NoticeSearchBar } from '../../components/notices/NoticeSearchBar';
import { EventSelector } from '../../components/notices/EventSelector';
import { CategoryFilterChips, type CategoryCount } from '../../components/notices/CategoryFilterChips';
import { CollapsibleCategorySection } from '../../components/notices/CollapsibleCategorySection';

import NoticeBoardService from '../../services/noticeBoardService';
import { useUserStore } from '../../stores/userStore';
import { useAuth } from '../../hooks/useAuth';

import type {
  NoticeBoardEvent,
  OfficialNotification,
  EventDocument,
  RegattaCategory,
  SearchFilters
} from '../../types/noticeBoard';

interface NoticesScreenProps {
  navigation: any;
  route: {
    params?: {
      eventId?: string;
    };
  };
}

type NoticeItem = (OfficialNotification | EventDocument) & {
  itemType: 'notification' | 'document';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publishedAt: string;
  category?: RegattaCategory;
};

export const NoticesScreen: React.FC<NoticesScreenProps> = ({
  navigation,
  route
}) => {
  console.log('[NoticesScreen] Component initializing...');
  const userStore = useUserStore();
  const { user } = useAuth();
  const [noticeBoardService] = useState(() => new NoticeBoardService(userStore));

  // Get default event from service
  const defaultEventId = noticeBoardService.getDefaultEventId();
  const [selectedEventId, setSelectedEventId] = useState(
    route.params?.eventId || defaultEventId
  );

  console.log('[NoticesScreen] Selected Event ID:', selectedEventId);

  const [event, setEvent] = useState<NoticeBoardEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RegattaCategory | 'all'>('all');
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({
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

  // Monitor offline status
  useEffect(() => {
    const unsubscribe = offlineManager.onStatusChange((status) => {
      setIsOffline(!status.isConnected);
    });

    return unsubscribe;
  }, []);

  // Load event data
  const loadEventData = useCallback(async (showLoader: boolean = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      const eventData = await noticeBoardService.getEvent(selectedEventId);

      if (eventData) {
        setEvent(eventData);

        // Cache for offline use
        await offlineManager.cacheData(`notice_board_${selectedEventId}`, eventData, {
          priority: 'critical',
          expiresIn: 1440 // 24 hours
        });
      } else {
        setError('Event not found');
      }
    } catch (err) {
      console.error('Failed to load event data:', err);
      setError('Failed to load event data');
      await haptics.errorAction();

      // Try to load from cache if offline
      if (isOffline) {
        try {
          const cachedData = await offlineManager.getCriticalScheduleData();
          if (cachedData) {
            setEvent(cachedData as NoticeBoardEvent);
            setError(null);
          }
        } catch (cacheError) {
          console.error('Failed to load from cache:', cacheError);
        }
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedEventId, isOffline, noticeBoardService]);

  // Initial load
  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // Combine and process notices
  const allNotices = useMemo((): NoticeItem[] => {
    if (!event) return [];

    const notifications: NoticeItem[] = event.noticeBoard.notifications.map(notification => ({
      ...notification,
      itemType: 'notification' as const,
      priority: notification.priority || 'medium',
      category: notification.metadata?.category
    }));

    const documents: NoticeItem[] = event.noticeBoard.documents.map(document => ({
      ...document,
      itemType: 'document' as const,
      priority: (document.priority as NoticeItem['priority']) || 'medium',
      publishedAt: document.uploadedAt,
      category: document.category
    }));

    return [...notifications, ...documents].sort((a, b) => {
      // Sort by priority first, then by date
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'] || 2;
      const bPriority = priorityOrder[b.priority || 'medium'] || 2;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [event]);

  // Filter notices based on search and filters
  const filteredNotices = useMemo(() => {
    let filtered = allNotices;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notice =>
        notice.title.toLowerCase().includes(query) ||
        ('content' in notice && notice.content.toLowerCase().includes(query)) ||
        ('description' in notice && notice.description?.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (activeFilters.priorities.length > 0) {
      filtered = filtered.filter(notice =>
        activeFilters.priorities.includes(notice.priority)
      );
    }

    if (activeFilters.categories.length > 0) {
      filtered = filtered.filter(notice =>
        notice.category && activeFilters.categories.includes(notice.category)
      );
    }

    if (activeFilters.readStatus !== 'all') {
      filtered = filtered.filter(notice => {
        if (activeFilters.readStatus === 'unread') {
          return 'isRead' in notice ? !notice.isRead : true;
        } else {
          return 'isRead' in notice ? notice.isRead : false;
        }
      });
    }

    return filtered;
  }, [allNotices, searchQuery, activeFilters]);

  // Category counts for filter chips
  const categoryCounts = useMemo((): CategoryCount[] => {
    const categoryMap = new Map<RegattaCategory | 'all', { count: number; unreadCount: number }>();

    // Initialize with all possible categories
    const allCategories: (RegattaCategory | 'all')[] = [
      'all', 'pre_event', 'daily_operations', 'competition_management',
      'protests_hearings', 'safety_regulatory', 'administrative'
    ];

    allCategories.forEach(cat => {
      categoryMap.set(cat, { count: 0, unreadCount: 0 });
    });

    // Count notices by category
    filteredNotices.forEach(notice => {
      const category = notice.category || 'administrative';
      const isUnread = 'isRead' in notice ? !notice.isRead : false;

      // Update specific category count
      const categoryData = categoryMap.get(category) || { count: 0, unreadCount: 0 };
      categoryMap.set(category, {
        count: categoryData.count + 1,
        unreadCount: categoryData.unreadCount + (isUnread ? 1 : 0)
      });

      // Update 'all' count
      const allData = categoryMap.get('all')!;
      categoryMap.set('all', {
        count: allData.count + 1,
        unreadCount: allData.unreadCount + (isUnread ? 1 : 0)
      });
    });

    return Array.from(categoryMap.entries())
      .filter(([_, data]) => data.count > 0)
      .map(([category, data]) => ({
        category,
        count: data.count,
        unreadCount: data.unreadCount
      }));
  }, [filteredNotices]);

  // Group notices by category for sectioned view
  const noticesByCategory = useMemo(() => {
    const grouped = new Map<RegattaCategory, NoticeItem[]>();

    filteredNotices.forEach(notice => {
      const category = notice.category || 'administrative';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(notice);
    });

    return grouped;
  }, [filteredNotices]);

  // Filter notices by selected category
  const displayedNotices = useMemo(() => {
    if (selectedCategory === 'all') {
      return filteredNotices;
    }
    return filteredNotices.filter(notice =>
      (notice.category || 'administrative') === selectedCategory
    );
  }, [filteredNotices, selectedCategory]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    await haptics.pullToRefresh();
    setRefreshing(true);
    await loadEventData(false);
  }, [loadEventData]);

  // Handle event change
  const handleEventChange = useCallback(async (eventId: string) => {
    await haptics.selection();
    setSelectedEventId(eventId);
  }, []);

  // Handle notice press
  const handleNoticePress = useCallback(async (notice: NoticeItem) => {
    await haptics.buttonPress();

    if (notice.itemType === 'notification') {
      navigation.navigate('NotificationDetail', {
        notificationId: notice.id,
        eventId: selectedEventId,
        notification: notice
      });
    } else {
      navigation.navigate('DocumentViewer', {
        document: notice
      });
    }
  }, [navigation, selectedEventId]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle filters
  const handleFiltersChange = useCallback((filters: SearchFilters) => {
    setActiveFilters(filters);
  }, []);


  // Handle category selection
  const handleCategoryChange = useCallback(async (category: RegattaCategory | 'all') => {
    await haptics.selection();
    setSelectedCategory(category);
  }, []);

  // Get unread count
  const unreadCount = useMemo(() => {
    return allNotices.filter(notice =>
      'isRead' in notice ? !notice.isRead : false
    ).length;
  }, [allNotices]);

  // Render notice item
  const renderNoticeItem = useCallback(({ item, index }: { item: NoticeItem; index: number }) => (
    <NoticeCard
      key={`${item.itemType}-${item.id}`}
      notice={item}
      onPress={handleNoticePress}
      style={index === 0 ? { marginTop: spacing.sm } : undefined}
    />
  ), [handleNoticePress]);

  // Show loading screen on initial load
  if (isLoading && !event && !error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          style="large"
          leftAction={{
            icon: <ChevronLeft size={20} color={colors.primary} />,
            onPress: () => navigation.goBack()
          }}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner
            size="large"
            text="Loading notices..."
            showBackground={true}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          style="large"
          leftAction={{
            icon: <ChevronLeft size={20} color={colors.primary} />,
            onPress: () => navigation.goBack()
          }}
        />
        {isOffline ? (
          <OfflineError
            onRetry={() => loadEventData()}
          />
        ) : (
          <SimpleError
            message={error}
            onRetry={() => loadEventData()}
          />
        )}
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Notices screen error:', error, errorInfo);
        haptics.errorAction();
      }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          style="large"
          badge={unreadCount > 0 ? unreadCount.toString() : undefined}
        />
        {/* Event Selector */}
        <EventSelector
          selectedEventId={selectedEventId}
          onEventChange={handleEventChange}
          unreadCounts={{
            'asia-pacific-2026': allNotices.filter(n =>
              'isRead' in n ? !n.isRead : false
            ).length,
            'dragon-worlds-2026': allNotices.filter(n =>
              'isRead' in n ? !n.isRead : false
            ).length
          }}
        />

        {/* Offline indicator */}
        {isOffline && (
          <View style={styles.offlineIndicator}>
            <WifiOff color={colors.warning} size={16} />
            <IOSText textStyle="caption1" color="systemOrange">
              Offline - showing cached data
            </IOSText>
          </View>
        )}

        {/* Search Bar */}
        <IOSSection spacing="compact">
          <NoticeSearchBar
            value={searchQuery}
            onSearch={handleSearch}
            placeholder="Search notices and documents..."
          />
        </IOSSection>

        {/* Category Filter Chips */}
        <CategoryFilterChips
          categoryCounts={categoryCounts}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />


        {/* Notices Content */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
        >
          {displayedNotices.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color={colors.textMuted} />
              <IOSText textStyle="title3" weight="medium" style={styles.emptyTitle}>
                No notices found
              </IOSText>
              <IOSText textStyle="callout" color="secondaryLabel" style={styles.emptyDescription}>
                {searchQuery || Object.values(activeFilters).some(filter =>
                  Array.isArray(filter) ? filter.length > 0 :
                  typeof filter === 'boolean' ? filter :
                  typeof filter === 'object' && filter !== null ? Object.keys(filter).length > 0 :
                  filter !== 'all'
                ) ? 'Try adjusting your search or filters' : 'New notices will appear here when published'}
              </IOSText>
            </View>
          ) : selectedCategory === 'all' && !searchQuery ? (
            // Show categorized sections when viewing all and not searching
            Array.from(noticesByCategory.entries()).map(([category, notices]) => (
              <CollapsibleCategorySection
                key={category}
                category={category}
                notices={notices}
                onNoticePress={handleNoticePress}
                initiallyExpanded={true}
              />
            ))
          ) : (
            // Show flat list when filtering by category or searching
            displayedNotices.map((notice, index) => (
              <NoticeCard
                key={`${notice.itemType}-${notice.id}`}
                notice={notice}
                onPress={handleNoticePress}
                style={index === 0 ? { marginTop: spacing.sm } : undefined}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
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
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning + '40',
    gap: spacing.sm,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    maxWidth: 280,
  },
});