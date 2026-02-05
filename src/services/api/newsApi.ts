/**
 * News API - React Query hooks for news data
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNews, NewsItem, BUNDLED_NEWS } from '../newsService';
import { useNewsStore } from '../../stores/newsStore';

// Query keys
export const newsKeys = {
  all: ['news'] as const,
  list: () => [...newsKeys.all, 'list'] as const,
};

/**
 * Hook to fetch news items
 * - Returns cached/bundled data while loading
 * - Auto-refetches in background when stale
 * - Handles errors gracefully with fallback data
 */
export function useNews() {
  return useQuery({
    queryKey: newsKeys.list(),
    queryFn: () => fetchNews(false),
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 30 * 60 * 1000, // Keep cached data for 30 minutes
    placeholderData: BUNDLED_NEWS, // Show bundled data while loading
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook to manually refresh news
 * Returns a function that can be called to force refresh
 */
export function useRefreshNews() {
  const queryClient = useQueryClient();

  return async () => {
    // Invalidate and refetch news
    await queryClient.invalidateQueries({ queryKey: newsKeys.list() });
    // Force a fresh fetch
    return queryClient.fetchQuery({
      queryKey: newsKeys.list(),
      queryFn: () => fetchNews(true),
    });
  };
}

/**
 * Prefetch news data
 * Useful for preloading before navigation
 */
export function usePrefetchNews() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: newsKeys.list(),
      queryFn: () => fetchNews(false),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Hook to track unread news count
 * Call this at app level to keep badge updated
 */
export function useTrackUnreadNews() {
  const { data: news = [] } = useNews();
  const updateUnreadCount = useNewsStore((state) => state.updateUnreadCount);
  const seenArticleIds = useNewsStore((state) => state.seenArticleIds);

  useEffect(() => {
    if (news.length > 0) {
      const articleIds = news.map((item) => item.id);
      updateUnreadCount(articleIds);
    }
  }, [news, updateUnreadCount, seenArticleIds]);
}

// Re-export types for convenience
export type { NewsItem };
