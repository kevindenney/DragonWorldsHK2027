import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, SlideInRight } from '../utils/reanimatedWrapper';
import { 
  FileText, 
  Bell, 
  AlertTriangle, 
  Users, 
  Scale, 
  Flag,
  Download,
  Calendar,
  MapPin,
  Eye,
  ChevronRight,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react-native';

import { colors, spacing } from '../constants/theme';
import { ErrorBoundary, LoadingSpinner, SkeletonLoader, SimpleError, OfflineError } from '../components/shared';
import { haptics } from '../utils/haptics';
import { offlineManager } from '../services/offlineManager';
import {
  IOSNavigationBar,
  IOSCard,
  IOSSection,
  IOSButton,
  IOSText,
  IOSBadge
} from '../components/ios';
import { CategoryHeader } from '../components/noticeBoard/enhanced/CategoryHeader';
import { EnhancedNoticeCard } from '../components/noticeBoard/enhanced/EnhancedNoticeCard';
import { SmartSearch } from '../components/noticeBoard/enhanced/SmartSearch';
import { 
  getAllCategories, 
  updateCategoryCounts, 
  filterByCategory, 
  getCategoryInfo,
  sortCategoriesByRelevance 
} from '../utils/categoryUtils';
import { SearchEngine } from '../utils/searchUtils';
import type { CategoryInfo, SearchQuery, RegattaCategory } from '../types/noticeBoard';

import NoticeBoardService from '../services/noticeBoardService';
import { useUserStore } from '../stores/userStore';
import { useAuth } from '../hooks/useAuth';
import { DataSourceSettings } from '../components/noticeBoard/DataSourceSettings';
import { NoticeBoardFeed } from '../components/noticeBoard/NoticeBoardFeed';
import { NoticeActions } from '../components/noticeBoard/NoticeActions';
import { NotificationService } from '../services/notificationService';
import type { 
  NoticeBoardEvent, 
  EventDocument, 
  OfficialNotification, 
  Competitor,
  ProtestSubmission,
  Hearing,
  OnWaterPenalty
} from '../types/noticeBoard';

interface NoticeBoardScreenProps {
  navigation: any;
  route: {
    params: {
      eventId: string;
    };
  };
}

export const NoticeBoardScreen: React.FC<NoticeBoardScreenProps> = ({ 
  navigation, 
  route 
}) => {
  // Defensive parameter extraction with fallback
  const eventId = route.params?.eventId || 'dragon-worlds-2027';
  const userStore = useUserStore();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<NoticeBoardEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticeBoardService] = useState(() => new NoticeBoardService(userStore));
  const [categories, setCategories] = useState<Record<RegattaCategory, CategoryInfo>>(
    Object.fromEntries(getAllCategories().map(cat => [cat.category, cat])) as Record<RegattaCategory, CategoryInfo>
  );
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchEngine] = useState(() => new SearchEngine());
  const [showSettings, setShowSettings] = useState(false);
  const [useDemoData, setUseDemoData] = useState(true);
  const [dataSource, setDataSource] = useState<'demo' | 'racing_rules' | 'ccr2024'>('demo');
  const [notificationService] = useState(() => NotificationService.getInstance());

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

      const eventData = await noticeBoardService.getEvent(eventId);
      
      if (eventData) {
        setEvent(eventData);
        
        // Update search engine with new data
        searchEngine.updateIndex(
          eventData.noticeBoard.documents,
          eventData.noticeBoard.notifications
        );
        
        // Update category counts
        const updatedCategories = updateCategoryCounts(
          eventData.noticeBoard.documents,
          eventData.noticeBoard.notifications
        );
        setCategories(updatedCategories);
        
        // Cache for offline use
        await offlineManager.cacheData(`notice_board_${eventId}`, eventData, {
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
  }, [eventId, isOffline, noticeBoardService]);

  // Initial load
  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // Initialize notification service
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        
        // Register for push notifications if user is authenticated
        if (user) {
          await notificationService.registerForPushNotifications(user.uid);
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, [user, notificationService]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    await haptics.pullToRefresh();
    setRefreshing(true);
    await loadEventData(false);
  }, [loadEventData]);

  // Search handler
  const handleSearch = useCallback(async (query: SearchQuery) => {
    setIsSearching(true);
    try {
      const results = searchEngine.search(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchEngine]);

  // Category toggle handler
  const handleCategoryToggle = useCallback(async (category: RegattaCategory) => {
    await haptics.selection();
    setCategories(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        isExpanded: !prev[category].isExpanded
      }
    }));
  }, []);

  // Category view handler
  const handleCategoryView = useCallback(async (category: RegattaCategory) => {
    await haptics.buttonPress();
    // Navigate to category-specific view
    navigation.navigate('CategoryView', { eventId, category });
  }, [navigation, eventId]);

  // Document view handler
  const handleViewDocument = useCallback(async (document: EventDocument) => {
    await haptics.buttonPress();
    navigation.navigate('DocumentViewer', { document });
  }, [navigation]);

  // Notification press handler (for overview tab)
  const handleNotificationPress = useCallback(async (notification: OfficialNotification) => {
    await haptics.buttonPress();
    navigation.navigate('NotificationDetail', { notification });
  }, [navigation]);

  // Notice press handler (for notices tab)
  const handleNoticePress = useCallback(async (notice: OfficialNotification) => {
    await haptics.buttonPress();
    navigation.navigate('NoticeDetail', { 
      noticeId: notice.id,
      eventId,
      notice 
    });
  }, [navigation, eventId]);

  // Protest submission handler
  const handleSubmitProtest = useCallback(async () => {
    await haptics.buttonPress();
    navigation.navigate('ProtestForm', { eventId });
  }, [navigation, eventId]);

  // Settings handlers
  const handleShowSettings = useCallback(async () => {
    await haptics.buttonPress();
    setShowSettings(true);
  }, []);

  const handleToggleDataSource = useCallback(async (newUseDemoData: boolean) => {
    await haptics.buttonPress();
    setUseDemoData(newUseDemoData);
    noticeBoardService.setUseDemoData(newUseDemoData);
    
    // Reload data with new source
    await loadEventData();
  }, [noticeBoardService, loadEventData]);

  const handleDataSourceChange = useCallback(async (newDataSource: 'demo' | 'racing_rules' | 'ccr2024') => {
    await haptics.buttonPress();
    setDataSource(newDataSource);
    noticeBoardService.setDataSource(newDataSource);
    
    // Reload data with new source
    await loadEventData();
  }, [noticeBoardService, loadEventData]);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  // Get priority color for notifications
  const getPriorityColor = (priority: OfficialNotification['priority']) => {
    switch (priority) {
      case 'urgent': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  // Get document type icon
  const getDocumentIcon = (type: EventDocument['type']) => {
    switch (type) {
      case 'notice_of_race': return FileText;
      case 'sailing_instructions': return FileText;
      case 'schedule': return Calendar;
      case 'results': return Flag;
      default: return FileText;
    }
  };

  // Render enhanced notice board with 6 categories
  const renderEnhancedNoticeboard = () => {
    if (!event) return null;

    // Show search results if searching
    if (isSearching || searchResults.length > 0) {
      return renderSearchResults();
    }

    // Render categories
    const sortedCategories = sortCategoriesByRelevance(Object.values(categories));

    return (
      <View style={styles.enhancedContent}>
        {/* Event Header */}
        <IOSSection spacing="compact">
          <IOSCard variant="elevated" style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <IOSText textStyle="title2" weight="semibold" style={styles.eventTitle}>
                {event.name}
              </IOSText>
              <IOSBadge 
                color={event.status === 'active' ? 'systemGreen' : 'systemBlue'}
                variant="filled"
              >
                {event.status.toUpperCase()}
              </IOSBadge>
            </View>
            
            <View style={styles.eventDetails}>
              <View style={styles.eventDetailRow}>
                <MapPin size={16} color={colors.textSecondary} />
                <IOSText textStyle="callout" color="secondaryLabel">
                  {event.venue} • {event.organizer}
                </IOSText>
              </View>
              
              <View style={styles.eventDetailRow}>
                <Users size={16} color={colors.textSecondary} />
                <IOSText textStyle="callout" color="secondaryLabel">
                  {event.entryCount} entries • {event.classes.join(', ')}
                </IOSText>
              </View>
            </View>
          </IOSCard>
        </IOSSection>

        {/* Categories */}
        {sortedCategories.map((category) => (
          <IOSSection key={category.category} spacing="compact">
            <CategoryHeader
              category={category}
              isExpanded={category.isExpanded}
              onToggle={handleCategoryToggle}
              onPress={handleCategoryView}
              showUnreadBadge={true}
              interactive={true}
            />
            
            {category.isExpanded && renderCategoryContent(category.category)}
          </IOSSection>
        ))}
      </View>
    );
  };

  // Render content for a specific category
  const renderCategoryContent = (category: RegattaCategory) => {
    if (!event) return null;

    const documents = filterByCategory(event.noticeBoard.documents, category, true);
    const notifications = filterByCategory(event.noticeBoard.notifications, category, false);
    
    const allItems = [
      ...documents.map(doc => ({ item: doc, type: 'document' as const })),
      ...notifications.map(notification => ({ item: notification, type: 'notification' as const }))
    ];

    if (allItems.length === 0) {
      return (
        <View style={styles.emptyCategory}>
          <IOSText textStyle="callout" color="secondaryLabel" style={styles.emptyCategoryText}>
            No items in this category yet
          </IOSText>
        </View>
      );
    }

    return (
      <View style={styles.categoryContent}>
        {allItems.slice(0, 5).map(({ item, type }, index) => (
          <EnhancedNoticeCard
            key={`${type}-${item.id}`}
            item={item}
            type={type}
            onPress={type === 'document' ? handleViewDocument : handleNotificationPress}
            onDownload={type === 'document' ? handleDocumentDownload : undefined}
            onBookmark={handleBookmarkItem}
            compact={true}
            showCategory={false}
          />
        ))}
        
        {allItems.length > 5 && (
          <IOSButton
            title={`View All ${allItems.length} Items`}
            variant="plain"
            size="small"
            onPress={() => handleCategoryView(category)}
            style={styles.viewAllButton}
          />
        )}
      </View>
    );
  };

  // Render search results
  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="medium" text="Searching..." />
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.emptyResults}>
          <IOSText textStyle="title3" weight="medium" style={styles.emptyResultsTitle}>
            No results found
          </IOSText>
          <IOSText textStyle="callout" color="secondaryLabel" style={styles.emptyResultsText}>
            Try adjusting your search terms or filters
          </IOSText>
        </View>
      );
    }

    return (
      <View style={styles.searchResultsContainer}>
        <IOSText textStyle="headline" weight="semibold" style={styles.searchResultsTitle}>
          {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''}
        </IOSText>
        
        {searchResults.map((result, index) => (
          <EnhancedNoticeCard
            key={`${result.type}-${result.id}`}
            item={result.type === 'document' 
              ? event?.noticeBoard.documents.find(d => d.id === result.id)!
              : event?.noticeBoard.notifications.find(n => n.id === result.id)!
            }
            type={result.type}
            onPress={result.type === 'document' ? handleViewDocument : handleNotificationPress}
            onDownload={result.type === 'document' ? handleDocumentDownload : undefined}
            onBookmark={handleBookmarkItem}
            showCategory={true}
          />
        ))}
      </View>
    );
  };

  // Handler functions for the enhanced notice cards
  const handleDocumentDownload = useCallback(async (document: EventDocument) => {
    await haptics.buttonPress();
    // Implement download functionality
    console.log('Download document:', document.title);
  }, []);

  const handleBookmarkItem = useCallback(async (item: EventDocument | OfficialNotification) => {
    await haptics.selection();
    // Implement bookmark functionality
    console.log('Bookmark item:', item.title);
  }, []);

  // Legacy render function kept for compatibility
  const renderOverview = () => {
    if (!event) return null;

    const unreadNotifications = event.noticeBoard.notifications.filter(n => !n.isRead).length;
    const activeProtests = event.noticeBoard.protests.filter(p => p.status !== 'decided').length;
    const pendingHearings = event.noticeBoard.hearings.filter(h => h.status === 'scheduled').length;
    const recentPenalties = event.noticeBoard.penalties.length;

    return (
      <View style={styles.tabContent}>
        {/* Event Info Card */}
        <IOSSection spacing="compact">
          <IOSCard variant="elevated" style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <IOSText textStyle="title2" weight="semibold" style={styles.eventTitle}>
                {event.name}
              </IOSText>
              <IOSBadge 
                color={event.status === 'active' ? 'systemGreen' : 'systemBlue'}
                variant="filled"
              >
                {event.status.toUpperCase()}
              </IOSBadge>
            </View>
            
            <View style={styles.eventDetails}>
              <View style={styles.eventDetailRow}>
                <MapPin size={16} color={colors.textSecondary} />
                <IOSText textStyle="callout" color="secondaryLabel">
                  {event.venue} • {event.organizer}
                </IOSText>
              </View>
              
              <View style={styles.eventDetailRow}>
                <Users size={16} color={colors.textSecondary} />
                <IOSText textStyle="callout" color="secondaryLabel">
                  {event.entryCount} entries • {event.classes.join(', ')}
                </IOSText>
              </View>
              
              <View style={styles.eventDetailRow}>
                <Calendar size={16} color={colors.textSecondary} />
                <IOSText textStyle="callout" color="secondaryLabel">
                  {new Date(event.dates.start).toLocaleDateString()} - {new Date(event.dates.end).toLocaleDateString()}
                </IOSText>
              </View>
            </View>
          </IOSCard>
        </IOSSection>

        {/* Quick Stats */}
        <IOSSection spacing="compact">
          <View style={styles.statsGrid}>
            <IOSCard variant="elevated" style={styles.statCard}>
              <Bell size={24} color={unreadNotifications > 0 ? colors.primary : colors.textSecondary} />
              <IOSText textStyle="title3" weight="semibold" style={styles.statNumber}>
                {unreadNotifications}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                New Notices
              </IOSText>
            </IOSCard>
            
            <IOSCard variant="elevated" style={styles.statCard}>
              <Scale size={24} color={activeProtests > 0 ? colors.warning : colors.textSecondary} />
              <IOSText textStyle="title3" weight="semibold" style={styles.statNumber}>
                {activeProtests}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Active Protests
              </IOSText>
            </IOSCard>
            
            <IOSCard variant="elevated" style={styles.statCard}>
              <AlertTriangle size={24} color={recentPenalties > 0 ? colors.error : colors.textSecondary} />
              <IOSText textStyle="title3" weight="semibold" style={styles.statNumber}>
                {recentPenalties}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Penalties
              </IOSText>
            </IOSCard>
          </View>
        </IOSSection>

        {/* Quick Actions */}
        <IOSSection title="Quick Actions" spacing="regular">
          <View style={styles.quickActions}>
            <IOSButton
              title="View Documents"
              variant="tinted"
              size="medium"
              onPress={() => handleTabChange('documents')}
              style={styles.quickActionButton}
              icon={<FileText size={20} color={colors.primary} />}
            />
            
            <IOSButton
              title="Entry List"
              variant="tinted"
              size="medium"
              onPress={() => navigation.navigate('EntryList', { eventId })}
              style={styles.quickActionButton}
              icon={<Users size={20} color={colors.primary} />}
            />
          </View>
          
          <View style={styles.quickActions}>
            <IOSButton
              title="File Protest"
              variant="primary"
              size="medium"
              onPress={() => navigation.navigate('ProtestForm', { eventId })}
              style={styles.quickActionButton}
              icon={<Scale size={20} color={colors.surface} />}
            />
            
            <IOSButton
              title="Sailing Instructions"
              variant="tinted"
              size="medium"
              onPress={() => navigation.navigate('SailingInstructions', { eventId })}
              style={styles.quickActionButton}
              icon={<FileText size={20} color={colors.primary} />}
            />
          </View>
        </IOSSection>

        {/* Sailor Actions */}
        {dataSource === 'ccr2024' && (
          <IOSSection title="CCR Sailor Actions" spacing="regular">
            <NoticeActions
              eventId={eventId}
              noticeBoardService={noticeBoardService}
              userRole={user?.role || 'participant'}
              onActionSubmitted={(actionId) => {
                console.log(`Action ${actionId} submitted successfully`);
                // Optionally reload notices or show confirmation
              }}
            />
          </IOSSection>
        )}

        {/* Recent Notifications */}
        {unreadNotifications > 0 && (
          <IOSSection title="Recent Notices" spacing="regular">
            <View style={styles.notificationsList}>
              {event.noticeBoard.notifications
                .filter(n => !n.isRead)
                .slice(0, 3)
                .map((notification) => (
                  <IOSCard 
                    key={notification.id} 
                    variant="elevated" 
                    style={styles.notificationCard}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationMeta}>
                        <IOSBadge 
                          color={getPriorityColor(notification.priority)}
                          size="small"
                        >
                          {notification.priority.toUpperCase()}
                        </IOSBadge>
                        <IOSText textStyle="caption1" color="tertiaryLabel">
                          {new Date(notification.publishedAt).toLocaleTimeString()}
                        </IOSText>
                      </View>
                      <ChevronRight size={16} color={colors.textSecondary} />
                    </View>
                    
                    <IOSText textStyle="headline" weight="semibold" numberOfLines={2}>
                      {notification.title}
                    </IOSText>
                    
                    <IOSText textStyle="callout" color="secondaryLabel" numberOfLines={2}>
                      {notification.content}
                    </IOSText>
                  </IOSCard>
                ))}
            </View>
            
            {unreadNotifications > 3 && (
              <IOSButton
                title={`View All ${unreadNotifications} Notices`}
                variant="plain"
                size="small"
                onPress={() => handleTabChange('notifications')}
                style={styles.viewAllButton}
              />
            )}
          </IOSSection>
        )}
      </View>
    );
  };

  // Render documents tab
  const renderDocuments = () => {
    if (!event) return null;

    const groupedDocs = event.noticeBoard.documents.reduce((groups, doc) => {
      const category = doc.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(doc);
      return groups;
    }, {} as Record<string, EventDocument[]>);

    return (
      <View style={styles.tabContent}>
        {Object.entries(groupedDocs).map(([category, docs]) => (
          <IOSSection key={category} title={category} spacing="regular">
            <View style={styles.documentsList}>
              {docs.map((document) => {
                const IconComponent = getDocumentIcon(document.type);
                
                return (
                  <IOSCard 
                    key={document.id}
                    variant="elevated" 
                    style={styles.documentCard}
                    onPress={() => handleViewDocument(document)}
                  >
                    <View style={styles.documentHeader}>
                      <View style={styles.documentMeta}>
                        <IconComponent size={20} color={colors.primary} />
                        <View style={styles.documentInfo}>
                          <IOSText textStyle="headline" weight="semibold" numberOfLines={1}>
                            {document.title}
                          </IOSText>
                          <IOSText textStyle="caption1" color="tertiaryLabel">
                            {document.fileType.toUpperCase()} • {Math.round((document.size || 0) / 1024)} KB
                          </IOSText>
                        </View>
                      </View>
                      
                      <View style={styles.documentActions}>
                        {document.isRequired && (
                          <IOSBadge color="systemRed" size="small">
                            Required
                          </IOSBadge>
                        )}
                        <ChevronRight size={16} color={colors.textSecondary} />
                      </View>
                    </View>
                    
                    {document.description && (
                      <IOSText textStyle="callout" color="secondaryLabel" numberOfLines={2}>
                        {document.description}
                      </IOSText>
                    )}
                  </IOSCard>
                );
              })}
            </View>
          </IOSSection>
        ))}
      </View>
    );
  };

  // Render notices tab
  const renderNotices = () => {
    return (
      <View style={styles.noticesTabContent}>
        <NoticeBoardFeed
          eventId={eventId}
          onNoticePress={handleNoticePress}
          onSubmitProtest={handleSubmitProtest}
          userRole={user?.role || 'participant'}
          useLiveData={!useDemoData}
        />
      </View>
    );
  };

  // Show loading screen on initial load
  if (isLoading && !event && !error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          title="Notice Board"
          style="large"
          leftAction={{
            icon: <ChevronRight size={20} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />,
            onPress: () => navigation.goBack()
          }}
          rightActions={[
            {
              icon: <Settings size={20} color={colors.primary} />,
              onPress: handleShowSettings
            }
          ]}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner 
            size="large" 
            text="Loading notice board..." 
            showBackground={true}
            testID="notice-board-loading"
          />
        </View>

        {/* Data Source Settings Modal */}
        {showSettings && (
          <DataSourceSettings
            currentUseDemoData={useDemoData}
            currentDataSource={dataSource}
            onToggleDataSource={handleToggleDataSource}
            onDataSourceChange={handleDataSourceChange}
            onClose={handleCloseSettings}
          />
        )}
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          title="Notice Board"
          style="large"
          leftAction={{
            icon: <ChevronRight size={20} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />,
            onPress: () => navigation.goBack()
          }}
          rightActions={[
            {
              icon: <Settings size={20} color={colors.primary} />,
              onPress: handleShowSettings
            }
          ]}
        />
        {isOffline ? (
          <OfflineError 
            onRetry={() => loadEventData()}
            testID="notice-board-offline-error"
          />
        ) : (
          <SimpleError
            message={error}
            onRetry={() => loadEventData()}
            testID="notice-board-error"
          />
        )}

        {/* Data Source Settings Modal */}
        {showSettings && (
          <DataSourceSettings
            currentUseDemoData={useDemoData}
            currentDataSource={dataSource}
            onToggleDataSource={handleToggleDataSource}
            onDataSourceChange={handleDataSourceChange}
            onClose={handleCloseSettings}
          />
        )}
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Notice board screen error:', error, errorInfo);
        haptics.errorAction();
      }}
      testID="notice-board-error-boundary"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          title="Notice Board"
          style="large"
          leftAction={{
            icon: <ChevronRight size={20} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />,
            onPress: () => navigation.goBack()
          }}
          rightActions={[
            {
              icon: <Settings size={20} color={colors.primary} />,
              onPress: handleShowSettings
            },
            {
              icon: isOffline ? <WifiOff size={20} color={colors.warning} /> : <Wifi size={20} color={colors.primary} />,
              onPress: () => {}
            }
          ]}
        />

        {/* Offline indicator */}
        {isOffline && (
          <Animated.View 
            style={styles.offlineIndicator}
            entering={SlideInRight.duration(300)}
          >
            <WifiOff color={colors.warning} size={16} />
            <IOSText textStyle="caption1" color="systemOrange">
              Offline - showing cached data
            </IOSText>
          </Animated.View>
        )}

        {/* Smart Search */}
        <IOSSection spacing="compact">
          <SmartSearch
            onSearch={handleSearch}
            placeholder="Search regatta notices and documents..."
            showAdvancedFilters={true}
          />
        </IOSSection>

        <ScrollView 
          style={styles.scrollView} 
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
          accessible={true}
          accessibilityLabel="Notice board content"
        >
          {renderEnhancedNoticeboard()}
        </ScrollView>

        {/* Data Source Settings Modal */}
        {showSettings && (
          <DataSourceSettings
            currentUseDemoData={useDemoData}
            currentDataSource={dataSource}
            onToggleDataSource={handleToggleDataSource}
            onDataSourceChange={handleDataSourceChange}
            onClose={handleCloseSettings}
          />
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
    gap: 8,
  },
  tabNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: spacing.md,
    padding: spacing.xs,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  tabContent: {
    paddingBottom: spacing.xl,
  },
  noticesTabContent: {
    flex: 1,
    paddingTop: spacing.sm,
  },

  // Event Card
  eventCard: {
    padding: spacing.lg,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  eventTitle: {
    flex: 1,
    marginRight: spacing.md,
  },
  eventDetails: {
    gap: spacing.sm,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.xs,
  },
  statNumber: {
    // Typography handled by IOSText
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
  },
  viewAllButton: {
    alignSelf: 'center',
    marginTop: spacing.sm,
  },

  // Notifications
  notificationsList: {
    gap: spacing.md,
  },
  notificationCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // Documents
  documentsList: {
    gap: spacing.md,
  },
  documentCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  documentInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // Enhanced notice board styles
  enhancedContent: {
    paddingBottom: spacing.xl,
  },
  emptyCategory: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    margin: spacing.sm,
  },
  emptyCategoryText: {
    textAlign: 'center',
  },
  categoryContent: {
    gap: spacing.xs,
    margin: spacing.sm,
  },
  viewAllButton: {
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  searchResultsContainer: {
    paddingHorizontal: spacing.md,
  },
  searchResultsTitle: {
    marginBottom: spacing.md,
  },
  emptyResults: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyResultsTitle: {
    marginBottom: spacing.sm,
  },
  emptyResultsText: {
    textAlign: 'center',
  },
});