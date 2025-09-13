import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Alert,
  Vibration,
  AppState
} from 'react-native';
import { 
  Bell, 
  AlertTriangle, 
  Wind, 
  MapPin, 
  Calendar, 
  Flag,
  FileText,
  Gavel,
  Download,
  Share,
  Filter,
  Search,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Wifi,
  WifiOff
} from 'lucide-react-native';

import { IOSText, IOSCard, IOSButton, IOSBadge, IOSSearchBar, IOSSegmentedControl } from '../ios';
import type { OfficialNotification } from '../../types/noticeBoard';
import { RealDataService } from '../../services/realDataService';
import { useAuth } from '../../hooks/useAuth';

interface NoticeBoardFeedProps {
  eventId?: string;
  onNoticePress?: (notice: OfficialNotification) => void;
  onDownloadDocument?: (documentId: string) => void;
  onSubmitProtest?: () => void;
  userRole?: 'participant' | 'official' | 'spectator';
  useLiveData?: boolean;
}

type NoticeFilter = 'all' | 'urgent' | 'protests' | 'weather' | 'course' | 'schedule';
type SortOption = 'newest' | 'priority' | 'category';

export const NoticeBoardFeed: React.FC<NoticeBoardFeedProps> = ({
  eventId = 'dragon-worlds-2027',
  onNoticePress,
  onDownloadDocument,
  onSubmitProtest,
  userRole = 'participant',
  useLiveData = false,
}) => {
  // State
  const [notices, setNotices] = useState<OfficialNotification[]>([]);
  const [bookmarkedNotices, setBookmarkedNotices] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<NoticeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  // Services
  const realDataService = useMemo(() => new RealDataService(), []);
  const { user } = useAuth();

  // Setup real-time listeners
  useEffect(() => {
    if (!useLiveData || !user) return;

    console.log('🔔 Setting up real-time notices subscription');

    // Subscribe to notices updates
    const noticesUnsubscribe = realDataService.subscribeToNotices(
      eventId,
      (updatedNotices) => {
        console.log(`📝 Received ${updatedNotices.length} notices from Firestore`);
        setNotices(updatedNotices);
        setLastUpdateTime(new Date());
        
        // Check for urgent notices and provide haptic feedback
        const urgentNotices = updatedNotices.filter(n => 
          (n.priority === 'urgent' || n.priority === 'high') && !n.isRead
        );
        
        if (urgentNotices.length > 0) {
          Vibration.vibrate([0, 100, 50, 100]);
        }
      },
      (error) => {
        console.error('❌ Notices subscription error:', error);
        setIsOnline(false);
      }
    );

    // Subscribe to user bookmarks
    const bookmarksUnsubscribe = user ? realDataService.subscribeToUserBookmarks(
      user.uid,
      (bookmarkedIds) => {
        setBookmarkedNotices(bookmarkedIds);
      },
      (error) => {
        console.error('❌ Bookmarks subscription error:', error);
      }
    ) : () => {};

    // Cleanup on unmount
    return () => {
      noticesUnsubscribe();
      bookmarksUnsubscribe();
      realDataService.cleanup();
    };
  }, [useLiveData, eventId, user, realDataService]);

  // Handle app state changes for background refresh
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && useLiveData) {
        // App came to foreground, trigger manual refresh
        handleManualRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [useLiveData]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    if (!useLiveData) return;

    setIsRefreshing(true);
    
    try {
      const success = await realDataService.triggerManualRefresh(eventId);
      if (success) {
        setIsOnline(true);
        console.log('✅ Manual refresh completed');
      } else {
        setIsOnline(false);
      }
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      setIsOnline(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [useLiveData, eventId, realDataService]);

  // Mark notice as read
  const handleNoticePress = useCallback(async (notice: OfficialNotification) => {
    if (user && !notice.isRead) {
      try {
        await realDataService.markNoticeAsRead(user.uid, notice.id);
        
        // Update local state optimistically
        setNotices(prev => prev.map(n => 
          n.id === notice.id ? { ...n, isRead: true } : n
        ));
      } catch (error) {
        console.error('Error marking notice as read:', error);
      }
    }
    
    onNoticePress?.(notice);
  }, [user, realDataService, onNoticePress]);

  // Toggle bookmark
  const handleToggleBookmark = useCallback(async (noticeId: string) => {
    if (!user) return;

    try {
      const isBookmarked = await realDataService.toggleNoticeBookmark(user.uid, noticeId);
      
      // Update local state optimistically
      setBookmarkedNotices(prev => 
        isBookmarked 
          ? [...prev, noticeId]
          : prev.filter(id => id !== noticeId)
      );
      
      // Provide haptic feedback
      Vibration.vibrate(50);
      
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  }, [user, realDataService]);

  // Filter and sort notices
  const filteredNotices = useMemo(() => {
    let filtered = notices;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notice =>
        notice.title.toLowerCase().includes(query) ||
        notice.content.toLowerCase().includes(query) ||
        notice.author.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filter !== 'all') {
      switch (filter) {
        case 'urgent':
          filtered = filtered.filter(n => n.priority === 'urgent' || n.priority === 'high');
          break;
        case 'protests':
          filtered = filtered.filter(n => n.type === 'protest');
          break;
        case 'weather':
          filtered = filtered.filter(n => n.type === 'weather');
          break;
        case 'course':
          filtered = filtered.filter(n => n.type === 'course_change');
          break;
        case 'schedule':
          filtered = filtered.filter(n => n.type === 'schedule_update');
          break;
      }
    }

    // Apply unread filter
    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }

    // Sort notices
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'category':
          return a.type.localeCompare(b.type);
        case 'newest':
        default:
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });

    return filtered;
  }, [notices, searchQuery, filter, sortBy, showUnreadOnly]);

  // Statistics
  const stats = useMemo(() => {
    const total = notices.length;
    const unread = notices.filter(n => !n.isRead).length;
    const urgent = notices.filter(n => n.priority === 'urgent' || n.priority === 'high').length;
    const protests = notices.filter(n => n.type === 'protest').length;

    return { total, unread, urgent, protests };
  }, [notices]);

  const getNoticeIcon = (type: string, priority: string) => {
    if (priority === 'urgent') {
      return <AlertTriangle size={16} color="#FF3B30" />;
    }

    switch (type) {
      case 'weather':
        return <Wind size={16} color="#007AFF" />;
      case 'course_change':
        return <MapPin size={16} color="#FF9500" />;
      case 'schedule_update':
        return <Calendar size={16} color="#34C759" />;
      case 'protest':
        return <Gavel size={16} color="#FF3B30" />;
      case 'results':
        return <Flag size={16} color="#FFD700" />;
      default:
        return <Bell size={16} color="#8E8E93" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#007AFF';
      case 'low': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const formatTimeAgo = (publishedAt: string) => {
    const now = new Date().getTime();
    const published = new Date(publishedAt).getTime();
    const diffInMinutes = Math.floor((now - published) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleShareNotice = (notice: OfficialNotification) => {
    Alert.alert(
      'Share Notice',
      `Share "${notice.title}"?`,
      [
        { text: 'Copy Link', onPress: () => console.log('Copy link') },
        { text: 'Share Text', onPress: () => console.log('Share text') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderNoticeCard = ({ item }: { item: OfficialNotification }) => {
    const isBookmarked = bookmarkedNotices.includes(item.id);
    
    return (
      <TouchableOpacity
        onPress={() => handleNoticePress(item)}
        activeOpacity={0.7}
      >
        <IOSCard style={[
          styles.noticeCard,
          !item.isRead && styles.unreadCard,
          item.priority === 'urgent' && styles.urgentCard
        ]}>
          {/* Header */}
          <View style={styles.noticeHeader}>
            <View style={styles.noticeIcon}>
              {getNoticeIcon(item.type, item.priority)}
            </View>
            
            <View style={styles.noticeMeta}>
              <IOSText style={[styles.noticeTitle, !item.isRead && styles.unreadTitle]} numberOfLines={2}>
                {item.title}
              </IOSText>
              
              <View style={styles.metaRow}>
                <IOSText style={styles.author}>{item.author}</IOSText>
                <IOSText style={styles.timeAgo}>{formatTimeAgo(item.publishedAt)}</IOSText>
              </View>
            </View>
            
            <View style={styles.noticeActions}>
              <TouchableOpacity 
                onPress={() => handleToggleBookmark(item.id)}
                style={styles.bookmarkButton}
              >
                {isBookmarked ? (
                  <BookmarkCheck size={16} color="#007AFF" />
                ) : (
                  <Bookmark size={16} color="#8E8E93" />
                )}
              </TouchableOpacity>
              
              <IOSBadge 
                color={getPriorityColor(item.priority)} 
                size="small"
              >
                {item.priority.toUpperCase()}
              </IOSBadge>
              
              {!item.isRead && (
                <View style={styles.unreadIndicator} />
              )}
            </View>
          </View>

        {/* Content Preview */}
        <IOSText style={styles.noticeContent} numberOfLines={3}>
          {item.content}
        </IOSText>

        {/* Affected Races */}
        {item.affectedRaces && item.affectedRaces.length > 0 && (
          <View style={styles.affectedRaces}>
            <Flag size={14} color="#FF9500" />
            <IOSText style={styles.affectedRacesText}>
              Affects Race{item.affectedRaces.length > 1 ? 's' : ''}: {item.affectedRaces.join(', ')}
            </IOSText>
          </View>
        )}

        {/* Attachments */}
        {item.attachments && item.attachments.length > 0 && (
          <View style={styles.attachments}>
            <FileText size={14} color="#007AFF" />
            <IOSText style={styles.attachmentsText}>
              {item.attachments.length} document{item.attachments.length > 1 ? 's' : ''} attached
            </IOSText>
            <TouchableOpacity 
              onPress={() => item.attachments?.[0] && onDownloadDocument?.(item.attachments[0].id)}
              style={styles.downloadButton}
            >
              <Download size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Actions */}
        <View style={styles.noticeFooter}>
          <IOSText style={styles.footerText}>
            {new Date(item.publishedAt).toLocaleDateString()} • {item.authorRole.replace('_', ' ')}
          </IOSText>
          
          <TouchableOpacity 
            onPress={() => handleShareNotice(item)}
            style={styles.shareButton}
          >
            <Share size={14} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </IOSCard>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Status Bar */}
      <View style={[styles.statusBar, !isOnline && styles.offlineStatusBar]}>
        <View style={styles.statusContent}>
          {isOnline ? (
            <Wifi size={16} color="#34C759" />
          ) : (
            <WifiOff size={16} color="#FF3B30" />
          )}
          <IOSText style={[styles.statusText, !isOnline && styles.offlineStatusText]}>
            {isOnline 
              ? (lastUpdateTime ? `Last updated ${formatTimeAgo(lastUpdateTime.toISOString())}` : 'Connected')
              : 'Offline - Showing cached notices'
            }
          </IOSText>
        </View>
        
        {useLiveData && (
          <TouchableOpacity 
            onPress={handleManualRefresh}
            style={styles.refreshButton}
            disabled={isRefreshing}
          >
            <IOSText style={styles.refreshButtonText}>
              {isRefreshing ? 'Syncing...' : 'Refresh'}
            </IOSText>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Statistics */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <IOSText style={styles.statNumber}>{filteredNotices.length}</IOSText>
            <IOSText style={styles.statLabel}>Showing</IOSText>
          </View>
          
          <View style={styles.statItem}>
            <IOSText style={[styles.statNumber, styles.unreadStat]}>{stats.unread}</IOSText>
            <IOSText style={styles.statLabel}>Unread</IOSText>
          </View>
          
          <View style={styles.statItem}>
            <IOSText style={[styles.statNumber, styles.urgentStat]}>{stats.urgent}</IOSText>
            <IOSText style={styles.statLabel}>Urgent</IOSText>
          </View>
          
          <View style={styles.statItem}>
            <IOSText style={[styles.statNumber, styles.protestStat]}>{stats.protests}</IOSText>
            <IOSText style={styles.statLabel}>Protests</IOSText>
          </View>
          
          <View style={styles.statItem}>
            <IOSText style={[styles.statNumber, styles.bookmarkStat]}>{bookmarkedNotices.length}</IOSText>
            <IOSText style={styles.statLabel}>Bookmarked</IOSText>
          </View>
        </View>
      </View>

      {/* Search */}
      <IOSSearchBar
        placeholder="Search notices..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        style={styles.searchBar}
      />

      {/* Filters */}
      <View style={styles.filtersSection}>
        <IOSSegmentedControl
          values={['All', 'Urgent', 'Protests', 'Weather', 'Course', 'Schedule']}
          selectedIndex={['all', 'urgent', 'protests', 'weather', 'course', 'schedule'].indexOf(filter)}
          onChange={(index) => {
            const filters: NoticeFilter[] = ['all', 'urgent', 'protests', 'weather', 'course', 'schedule'];
            setFilter(filters[index]);
          }}
          style={styles.filterControl}
        />
      </View>

      {/* Sort and Options */}
      <View style={styles.optionsSection}>
        <View style={styles.sortOptions}>
          <IOSButton
            title="Newest"
            onPress={() => setSortBy('newest')}
            variant={sortBy === 'newest' ? 'primary' : 'secondary'}
            size="small"
            style={styles.sortButton}
          />
          <IOSButton
            title="Priority"
            onPress={() => setSortBy('priority')}
            variant={sortBy === 'priority' ? 'primary' : 'secondary'}
            size="small"
            style={styles.sortButton}
          />
          <IOSButton
            title="Category"
            onPress={() => setSortBy('category')}
            variant={sortBy === 'category' ? 'primary' : 'secondary'}
            size="small"
            style={styles.sortButton}
          />
        </View>
        
        <View style={styles.toggleOptions}>
          <IOSButton
            title="Unread Only"
            onPress={() => setShowUnreadOnly(!showUnreadOnly)}
            variant={showUnreadOnly ? 'primary' : 'secondary'}
            size="small"
            style={styles.toggleButton}
          />
        </View>
      </View>

      {/* Quick Actions */}
      {userRole === 'participant' && (
        <View style={styles.quickActions}>
          <IOSButton
            title="Submit Protest"
            onPress={onSubmitProtest}
            variant="primary"
            size="medium"
            icon={<Gavel size={16} color="#FFFFFF" />}
            style={styles.actionButton}
          />
          
          <IOSButton
            title="Contact Race Office"
            onPress={() => Alert.alert('Contact', 'Feature coming soon')}
            variant="secondary"
            size="medium"
            icon={<ExternalLink size={16} color="#007AFF" />}
            style={styles.actionButton}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredNotices}
        renderItem={renderNoticeCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          useLiveData ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleManualRefresh}
              tintColor="#007AFF"
              title={isOnline ? "Pull to refresh notices" : "Offline mode"}
              titleColor="#8E8E93"
            />
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={48} color="#8E8E93" />
            <IOSText style={styles.emptyTitle}>No notices found</IOSText>
            <IOSText style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 'Check back later for updates'}
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

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  offlineStatusBar: {
    borderLeftColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    color: '#3C3C43',
    marginLeft: 8,
  },
  offlineStatusText: {
    color: '#FF3B30',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  unreadStat: {
    color: '#007AFF',
  },
  urgentStat: {
    color: '#FF3B30',
  },
  protestStat: {
    color: '#FF9500',
  },
  bookmarkStat: {
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // Search
  searchBar: {
    marginBottom: 16,
  },

  // Filters
  filtersSection: {
    marginBottom: 16,
  },
  filterControl: {
    width: '100%',
  },

  // Options
  optionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
  },
  toggleOptions: {
    flexDirection: 'row',
  },
  toggleButton: {
    paddingHorizontal: 12,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },

  // Notice Cards
  noticeCard: {
    marginBottom: 12,
    padding: 16,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },

  // Notice Header
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noticeIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  noticeMeta: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
    lineHeight: 22,
  },
  unreadTitle: {
    fontWeight: '600',
    color: '#000000',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 13,
    color: '#8E8E93',
  },
  noticeActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  bookmarkButton: {
    padding: 4,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },

  // Notice Content
  noticeContent: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 12,
  },

  // Affected Races
  affectedRaces: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  affectedRacesText: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '500',
    marginLeft: 6,
  },

  // Attachments
  attachments: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  attachmentsText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  downloadButton: {
    padding: 4,
  },

  // Notice Footer
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  shareButton: {
    padding: 4,
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

}

export default NoticeBoardFeed;
