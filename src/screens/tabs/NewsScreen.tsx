import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Newspaper, Calendar, User, ExternalLink, ChevronRight, AlertCircle } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { useNews, useRefreshNews, NewsItem } from '../../services/api/newsApi';
import { useNewsStore } from '../../stores/newsStore';
import { useToastStore } from '../../stores/toastStore';
import { ArticleWebView } from '../../components/news/ArticleWebView';
import { Toast } from '../../components/shared/Toast';

export function NewsScreen() {
  const { data: news = [], isLoading, isError, isFetching } = useNews();
  const refreshNews = useRefreshNews();

  // News store for tracking unread articles
  const { seenArticleIds, markArticlesAsSeen, updateUnreadCount, clearUnread } = useNewsStore();

  // Toast store for notifications
  const showToast = useToastStore((state) => state.showToast);

  // State for WebView
  const [selectedArticle, setSelectedArticle] = useState<{ url: string; title: string } | null>(null);

  // Track previous news count for detecting new articles
  const previousNewsRef = useRef<string[]>([]);

  // Mark all articles as seen when the screen is viewed
  useEffect(() => {
    if (news.length > 0) {
      const articleIds = news.map((item) => item.id);
      markArticlesAsSeen(articleIds);
    }
  }, [news, markArticlesAsSeen]);

  // Clear unread count when screen is focused
  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  const handleRefresh = useCallback(async () => {
    try {
      // Store current article IDs before refresh
      const currentIds = news.map((item) => item.id);
      previousNewsRef.current = currentIds;

      const freshNews = await refreshNews();

      // Check for new articles
      if (freshNews && freshNews.length > 0) {
        const freshIds = freshNews.map((item) => item.id);
        const seenSet = new Set(seenArticleIds);
        const newArticles = freshIds.filter((id) => !seenSet.has(id));

        if (newArticles.length > 0) {
          // Show toast for new articles
          const message = newArticles.length === 1
            ? '1 new article'
            : `${newArticles.length} new articles`;
          showToast(message, 'success');

          // Update the seen articles and clear unread (since we're on the screen)
          markArticlesAsSeen(freshIds);
        } else if (previousNewsRef.current.length > 0) {
          // No new articles found
          showToast('News is up to date', 'info');
        }
      }
    } catch (error) {
      // Error handling is managed by React Query
      if (__DEV__) {
        console.log('News refresh error:', error);
      }
      showToast('Failed to refresh news', 'error');
    }
  }, [refreshNews, news, seenArticleIds, showToast, markArticlesAsSeen]);

  const handleNewsPress = (item: NewsItem) => {
    if (item.url) {
      // Open in-app WebView instead of external browser
      setSelectedArticle({ url: item.url, title: item.title });
    }
  };

  const handleCloseWebView = () => {
    setSelectedArticle(null);
  };

  const handleViewAllPress = async () => {
    const url = 'https://www.dragonworld2027.com/news';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const NewsCard = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => handleNewsPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.newsHeader}>
        <View style={styles.newsIconContainer}>
          <Newspaper size={20} color={colors.primary} />
        </View>
        <View style={styles.newsMeta}>
          <View style={styles.metaRow}>
            <Calendar size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
          <View style={styles.metaRow}>
            <User size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.author}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.newsTitle}>{item.title}</Text>
      <Text style={styles.newsSummary} numberOfLines={3}>{item.summary}</Text>

      <View style={styles.readMoreContainer}>
        <Text style={styles.readMoreText}>Read more</Text>
        <ExternalLink size={14} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Toast notifications */}
      <Toast />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News</Text>
        <Text style={styles.headerSubtitle}>Latest updates from Dragon World 2027</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading news...</Text>
          </View>
        ) : isError && news.length === 0 ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color="#FF3B30" />
            <Text style={styles.errorTitle}>Unable to Load News</Text>
            <Text style={styles.errorText}>
              Pull down to try again, or visit the website directly.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleViewAllPress}
            >
              <Text style={styles.retryButtonText}>Visit Website</Text>
              <ExternalLink size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : news.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Newspaper size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No News Available</Text>
            <Text style={styles.emptyText}>
              Check back later for the latest updates on the Dragon World Championship.
            </Text>
          </View>
        ) : (
          <>
            {news.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}

            {/* View All Button */}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewAllPress}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All News on Website</Text>
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Article WebView Bottom Sheet */}
      <ArticleWebView
        url={selectedArticle?.url || null}
        title={selectedArticle?.title || ''}
        onClose={handleCloseWebView}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  newsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  newsMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 6,
  },
  newsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    lineHeight: 22,
  },
  newsSummary: {
    fontSize: 14,
    color: '#6C6C70',
    lineHeight: 20,
    marginBottom: 12,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default NewsScreen;
