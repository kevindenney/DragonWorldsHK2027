import React, { useState, useEffect } from 'react';
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
import { Newspaper, Calendar, User, ExternalLink, ChevronRight } from 'lucide-react-native';
import { colors } from '../../constants/theme';

interface NewsItem {
  id: string;
  title: string;
  date: string;
  author: string;
  summary: string;
  url?: string;
}

// Bundled news data from dragonworld2027.com/news
const BUNDLED_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Hopewell Hotel Named Official Hospitality Partner',
    date: '12 January 2026',
    author: 'Virgile Simon Bertrand',
    summary: 'Hopewell Hotel has been designated as the Official Hospitality Partner for the 2027 Hong Kong Dragon World Championship. The organizing committee emphasized this event marks a historic milestone as "the first to be held in Asia," highlighting Hong Kong\'s maritime heritage and tourism potential.',
    url: 'https://www.dragonworld2027.com/news/hopewell-hotel-named-official-hospitality-partner',
  },
  {
    id: '2',
    title: 'Registration Now Open',
    date: '17 December 2025',
    author: 'Virgile Simon Bertrand',
    summary: 'Registration for the championship is now available. The event runs from Saturday, November 21 to Sunday, November 29, 2026. It is organized by the Sailing Federation of Hong Kong, China, alongside the Royal Hong Kong Yacht Club, International Dragon Association, and Hong Kong Dragon Association.',
    url: 'https://www.dragonworld2027.com/news/registration-now-open',
  },
  {
    id: '3',
    title: 'Lily Xu Announced as Event Ambassador',
    date: '15 December 2025',
    author: 'Virgile Simon Bertrand',
    summary: 'Olympic gold medalist Lily Xu Lijia serves as the official Event Ambassador. Following her celebrated Laser Radial career—including bronze at 2008 Beijing and gold at 2012 London Olympics—she has recently engaged in Dragon sailing, competing across Europe and Hong Kong, including the 2025 Dragon Gold Cup.',
    url: 'https://www.dragonworld2027.com/news/lily-xu-announced-as-event-ambassador',
  },
  {
    id: '4',
    title: 'Karl Kwok Named Event Ambassador',
    date: '7 November 2025',
    author: 'Virgile Simon Bertrand',
    summary: 'Mr. Karl Kwok, an accomplished offshore racer, was announced as an event ambassador. His achievements include winning the 1997 Sydney to Hobart Yacht Race and the 2009 Transatlantic Maxi Yacht Cup. He remains "the first Chinese skipper in history" to secure these prestigious international victories.',
    url: 'https://www.dragonworld2027.com/news/karl-kwok-named-event-ambassador',
  },
];

export function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>(BUNDLED_NEWS);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // In production, this would fetch fresh data from the website
    // For now, we just simulate a refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNewsPress = async (item: NewsItem) => {
    if (item.url) {
      const canOpen = await Linking.canOpenURL(item.url);
      if (canOpen) {
        await Linking.openURL(item.url);
      }
    }
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
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading news...</Text>
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
