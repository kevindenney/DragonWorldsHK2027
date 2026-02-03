import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { View, StyleSheet, FlatList, RefreshControl, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  WifiOff,
  ChevronLeft,
  Info
} from 'lucide-react-native';

import { colors, spacing } from '../../constants/theme';
// Direct imports used instead of barrel exports due to Hermes engine incompatibility
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { SimpleError } from '../../components/shared/SimpleError';
import { OfflineError } from '../../components/shared/OfflineError';
import { FloatingEventSwitch } from '../../components/navigation/FloatingEventSwitch';
import { haptics } from '../../utils/haptics';
import { offlineManager } from '../../services/offlineManager';
import {
  IOSNavigationBar,
  IOSText,
  IOSSection
} from '../../components/ios';

import { NoticeCard } from '../../components/notices/NoticeCard';
import { NoticeFilters } from '../../components/notices/NoticeFilters';
import { CategoryFilterChips, type CategoryCount } from '../../components/notices/CategoryFilterChips';
import { ProfileButton } from '../../components/navigation/ProfileButton';
import { useToolbarVisibility } from '../../contexts/TabBarVisibilityContext';

const HEADER_HEIGHT = 60; // Height of header section for content padding

import NoticeBoardService from '../../services/noticeBoardService';
import { useUserStore } from '../../stores/userStore';
import { useAuth } from '../../hooks/useAuth';
import { useSelectedEvent, useSetSelectedEvent, useEventStoreHydrated } from '../../stores/eventStore';
import { EVENTS } from '../../constants/events';

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
  const userStore = useUserStore();
  const { user } = useAuth();
  const [noticeBoardService] = useState(() => new NoticeBoardService(userStore, true, 'demo'));
  const insets = useSafeAreaInsets();

  // Toolbar auto-hide
  const { toolbarTranslateY, createScrollHandler } = useToolbarVisibility();
  const scrollHandler = useMemo(() => createScrollHandler(), [createScrollHandler]);

  // Use global event store
  const selectedEventId = useSelectedEvent();
  const setSelectedEvent = useSetSelectedEvent();
  const storeHydrated = useEventStoreHydrated();


  // Initial load effect - triggers when store is first hydrated
  useEffect(() => {

    // If store just became hydrated and we don't have event data, load it immediately
    if (storeHydrated && !event && selectedEventId) {
      loadEventData();
    }
  }, [storeHydrated]);

  const [event, setEvent] = useState<NoticeBoardEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [selectedCategory, setSelectedCategory] = useState<RegattaCategory | 'all'>('all');
  const [showHelpLegend, setShowHelpLegend] = useState(false);
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

  // Track if we're currently loading to prevent multiple simultaneous loads
  const loadingRef = useRef(false);

  // Load event data
  const loadEventData = useCallback(async (showLoader: boolean = true) => {

    // Prevent multiple simultaneous loads
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;

    try {
      if (showLoader) setIsLoading(true);
      setError(null);


      // Add timeout to prevent infinite loading (increased to 15 seconds)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          reject(new Error('Loading timeout'));
        }, 15000)
      );

      const eventDataPromise = noticeBoardService.getEvent(selectedEventId);

      const eventData = await Promise.race([eventDataPromise, timeoutPromise]) as NoticeBoardEvent;


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
        }
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [selectedEventId, isOffline, noticeBoardService]);

  // Load event data when selectedEventId changes
  useEffect(() => {

    if (selectedEventId && storeHydrated) {
      loadEventData();
    } else {
    }
  }, [selectedEventId, storeHydrated]); // Remove loadEventData from dependencies to prevent loops

  // Refresh data when returning to the screen
  useFocusEffect(
    useCallback(() => {
      if (selectedEventId && storeHydrated && event) {
        loadEventData(false); // Don't show loading spinner for focus refresh
      }
    }, [selectedEventId, storeHydrated, event, loadEventData])
  );


  // Combine and process notices
  const allNotices = useMemo((): NoticeItem[] => {
    if (!event || !event.noticeBoard) return [];

    const notifications: NoticeItem[] = (event.noticeBoard.notifications || []).map(notification => ({
      ...notification,
      itemType: 'notification' as const,
      priority: notification.priority || 'medium',
      category: notification.metadata?.category
    }));

    const documents: NoticeItem[] = (event.noticeBoard.documents || []).map(document => ({
      ...document,
      itemType: 'document' as const,
      priority: (document.priority as NoticeItem['priority']) || 'medium',
      publishedAt: document.uploadedAt,
      category: document.category
    }));

    return [...notifications, ...documents].sort((a, b) => {
      // Sort by: 1) Unread first, 2) Priority (urgent > high > medium > low), 3) Timestamp (newest first)

      // Check unread status
      const aUnread = 'isRead' in a ? !a.isRead : false;
      const bUnread = 'isRead' in b ? !b.isRead : false;

      // Unread notices come first
      if (aUnread !== bUnread) {
        return aUnread ? -1 : 1;
      }

      // Then sort by priority
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'] || 2;
      const bPriority = priorityOrder[b.priority || 'medium'] || 2;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // Finally sort by date (newest first)
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [event]);

  // Filter notices based on filters
  const filteredNotices = useMemo(() => {
    let filtered = allNotices;

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
  }, [allNotices, activeFilters]);

  // Category counts for filter chips - based on all notices (not filtered) to show total counts
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

    // Count notices by category using allNotices to show total counts
    allNotices.forEach(notice => {
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

    // Return all categories, showing count 0 for categories with no data
    // This ensures consistent category display regardless of data availability
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: Math.max(0, data.count || 0), // Ensure non-negative number
        unreadCount: Math.max(0, data.unreadCount || 0) // Ensure non-negative number
      }))
      .filter(item => item.category && typeof item.category === 'string'); // Final safety check
  }, [allNotices]); // Changed dependency from filteredNotices to allNotices

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
      // Cast to EventDocument and ensure proper structure for DocumentViewer
      const document = notice as EventDocument;
      const documentForViewer = {
        ...document,
        // Ensure required EventDocument properties are present
        uploadedAt: document.uploadedAt || notice.publishedAt,
        fileType: document.fileType || 'pdf',
        url: document.url || '#',
        type: document.type || 'notice_of_race',
        category: document.category || 'administrative'
      };

      try {
        navigation.navigate('DocumentViewer', {
          document: documentForViewer
        });
      } catch (error) {
      }
    }
  }, [navigation, selectedEventId]);

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
        haptics.errorAction();
      }}
    >
      <View style={styles.container}>
        {/* Notices Content - Scrolls under the header */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT + insets.top + 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={scrollHandler.onScroll}
          onScrollBeginDrag={scrollHandler.onScrollBeginDrag}
          onScrollEndDrag={scrollHandler.onScrollEndDrag}
          onMomentumScrollEnd={scrollHandler.onMomentumScrollEnd}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
              progressViewOffset={HEADER_HEIGHT + insets.top + 100}
            />
          }
        >
          {/* Offline indicator */}
          {isOffline && (
            <View style={styles.offlineIndicator}>
              <WifiOff color={colors.warning} size={16} />
              <IOSText textStyle="caption1" color="systemOrange">
                Offline - showing cached data
              </IOSText>
            </View>
          )}

          {showHelpLegend && (
            <View style={styles.helpLegendContainer}>
              <View style={styles.helpSection}>
                <IOSText textStyle="caption1" weight="semibold" style={styles.helpSectionTitle}>
                  Notice Status
                </IOSText>
                <View style={styles.helpItem}>
                  <View style={[styles.helpIndicator, styles.unreadIndicator]} />
                  <IOSText textStyle="caption2" color="secondaryLabel">
                    Blue border on left = Unread notice
                  </IOSText>
                </View>
                <View style={styles.helpItem}>
                  <View style={styles.helpBadgeExample}>
                    <View style={[styles.helpBadge, { backgroundColor: colors.primary }]}>
                      <IOSText textStyle="caption2" color="white" weight="medium">
                        UNREAD
                      </IOSText>
                    </View>
                  </View>
                  <IOSText textStyle="caption2" color="secondaryLabel">
                    Unread label badge
                  </IOSText>
                </View>
              </View>

              <View style={styles.helpSection}>
                <IOSText textStyle="caption1" weight="semibold" style={styles.helpSectionTitle}>
                  Priority Colors
                </IOSText>
                <View style={styles.helpItem}>
                  <View style={[styles.helpDot, { backgroundColor: colors.error }]} />
                  <IOSText textStyle="caption2" color="secondaryLabel">
                    Red = Urgent priority
                  </IOSText>
                </View>
                <View style={styles.helpItem}>
                  <View style={[styles.helpDot, { backgroundColor: colors.warning }]} />
                  <IOSText textStyle="caption2" color="secondaryLabel">
                    Yellow = High priority
                  </IOSText>
                </View>
                <View style={styles.helpItem}>
                  <View style={[styles.helpDot, { backgroundColor: colors.primary }]} />
                  <IOSText textStyle="caption2" color="secondaryLabel">
                    Blue = Medium priority
                  </IOSText>
                </View>
                <View style={styles.helpItem}>
                  <View style={[styles.helpDot, { backgroundColor: colors.textSecondary }]} />
                  <IOSText textStyle="caption2" color="secondaryLabel">
                    Gray = Low priority
                  </IOSText>
                </View>
              </View>
            </View>
          )}

          {displayedNotices.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color={colors.textMuted} />
              <IOSText textStyle="title3" weight="medium" style={styles.emptyTitle}>
                No notices available
              </IOSText>
              <IOSText textStyle="callout" color="secondaryLabel" style={styles.emptyDescription}>
                {Object.values(activeFilters).some(filter =>
                  Array.isArray(filter) ? filter.length > 0 :
                  typeof filter === 'boolean' ? filter :
                  typeof filter === 'object' && filter !== null ? Object.keys(filter).length > 0 :
                  filter !== 'all'
                ) ? 'Try adjusting your filters' : 'Official notices will appear here once published on racingrulesofsailing.org'}
              </IOSText>
            </View>
          ) : (
            // Show flat list of all notices
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

        {/* Floating Header Section - Positioned above content */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              paddingTop: insets.top,
              transform: [{ translateY: toolbarTranslateY }]
            }
          ]}
        >
          <View style={styles.headerContainer}>
            <IOSText textStyle="title1" weight="bold" style={styles.headerTitle}>
              Notices
            </IOSText>
            <ProfileButton size={36} />
          </View>
          <FloatingEventSwitch
            options={[
              { label: 'APAC 2026', shortLabel: 'APAC 2026', value: EVENTS.APAC_2026.id },
              { label: 'Worlds 2027', shortLabel: 'Worlds 2027', value: EVENTS.WORLDS_2027.id }
            ]}
            selectedValue={selectedEventId}
            onValueChange={setSelectedEvent}
          />

          {/* Category Filter Chips with Info Icon */}
          <View style={styles.filterRow}>
            <View style={styles.filterChipsContainer}>
              <CategoryFilterChips
                categoryCounts={categoryCounts}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            </View>

            {/* Info Icon */}
            <TouchableOpacity
              style={styles.infoIconButton}
              onPress={() => {
                haptics.selection();
                setShowHelpLegend(!showHelpLegend);
              }}
              accessibilityLabel="Show notice indicator help"
            >
              <Info size={20} color="#999999" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerTitle: {
    color: colors.text,
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  filterChipsContainer: {
    flex: 1,
  },
  infoIconButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  helpToggleButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  helpToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  helpToggleText: {
    fontSize: 12,
    color: '#999999',
  },
  helpLegendContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpSection: {
    marginBottom: spacing.md,
  },
  helpSectionTitle: {
    marginBottom: spacing.sm,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  helpIndicator: {
    width: 32,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadIndicator: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  helpDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 10,
  },
  helpBadgeExample: {
    marginLeft: 4,
  },
  helpBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
});