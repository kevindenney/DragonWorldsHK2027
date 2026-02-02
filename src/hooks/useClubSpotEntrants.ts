/**
 * useClubSpotEntrants - React Query hook for fetching ClubSpot entrants
 *
 * Provides live data fetching with automatic caching, refetching,
 * and fallback to bundled/demo data on failure.
 *
 * Strategy:
 * 1. Immediately return bundled data (fast, offline-capable)
 * 2. Fetch live data in background
 * 3. Update UI when live data arrives
 * 4. Fall back to bundled/demo if live fails
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useEffect } from 'react';
import ClubSpotService from '../services/clubSpotService';
import type { DataSourceInfo } from '../services/clubSpotService';
import type { Competitor } from '../types/noticeBoard';

// Create a singleton instance of ClubSpotService
const clubSpotServiceInstance = new ClubSpotService({
  useDemoData: false, // Default to live data
});

// Query keys for caching
const QUERY_KEYS = {
  entrants: (regattaId: string, eventId: string) => ['clubspot-entrants', regattaId, eventId] as const,
};

interface UseClubSpotEntrantsOptions {
  /** Enable/disable the query */
  enabled?: boolean;
  /** Custom stale time in milliseconds (default: 5 minutes) */
  staleTime?: number;
  /** Force demo mode */
  forceDemoMode?: boolean;
}

interface UseClubSpotEntrantsResult {
  /** Array of competitor entrants */
  entrants: Competitor[];
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether data is being refreshed in the background */
  isRefreshing: boolean;
  /** Error object if the query failed */
  error: Error | null;
  /** Data source information (live, cache, or demo) */
  dataSourceInfo: DataSourceInfo | null;
  /** Function to refetch the data */
  refetch: () => Promise<void>;
  /** Function to invalidate and refetch the data */
  refresh: () => Promise<void>;
  /** Whether the data is from a live source */
  isLiveData: boolean;
  /** Timestamp of when data was last fetched */
  lastUpdated: Date | null;
  /** Human-readable time since last update */
  lastUpdatedText: string;
}

/**
 * Hook to fetch and manage ClubSpot entrant data
 *
 * @param regattaId - ClubSpot regatta ID (e.g., 'p75RuY5UZc')
 * @param eventId - Internal event ID for context
 * @param options - Query options
 */
export function useClubSpotEntrants(
  regattaId: string,
  eventId: string,
  options: UseClubSpotEntrantsOptions = {}
): UseClubSpotEntrantsResult {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    forceDemoMode = false,
  } = options;

  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.entrants(regattaId, eventId);

  // Get bundled data for immediate display
  const bundledEntrants = useMemo(() => {
    return clubSpotServiceInstance.getBundledEntrants(regattaId);
  }, [regattaId]);

  // Set demo mode if forced
  if (forceDemoMode) {
    clubSpotServiceInstance.setUseDemoData(true);
  }

  // React Query hook with placeholderData for instant display
  const {
    data: entrants = bundledEntrants,
    isLoading,
    isFetching,
    error,
    refetch: queryRefetch,
    isPlaceholderData,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`[useClubSpotEntrants] Fetching entrants for ${regattaId}/${eventId}`);
      return clubSpotServiceInstance.getEntrants(regattaId, eventId);
    },
    enabled: enabled && !!regattaId && !!eventId,
    staleTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    // Show bundled data immediately while fetching
    placeholderData: bundledEntrants.length > 0 ? bundledEntrants : undefined,
    // Don't show loading state if we have placeholder data
    notifyOnChangeProps: ['data', 'error', 'isFetching'],
  });

  // Get data source info - account for placeholder data
  const dataSourceInfo = useMemo((): DataSourceInfo | null => {
    // If we're showing placeholder/bundled data
    if (isPlaceholderData || (isLoading && bundledEntrants.length > 0)) {
      return {
        isLive: false,
        lastFetched: new Date(),
        source: 'cache' as const, // Bundled data is like cached data
      };
    }
    return clubSpotServiceInstance.getDataSourceInfo(regattaId, eventId);
  }, [regattaId, eventId, entrants, isPlaceholderData, isLoading, bundledEntrants.length]);

  // Calculate last updated text
  const lastUpdatedText = useMemo(() => {
    if (!dataSourceInfo?.lastFetched) {
      return 'Never';
    }

    const now = new Date();
    const diff = now.getTime() - dataSourceInfo.lastFetched.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) {
      return 'Just now';
    }
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    return dataSourceInfo.lastFetched.toLocaleDateString();
  }, [dataSourceInfo?.lastFetched]);

  // Refetch function
  const refetch = useCallback(async () => {
    console.log('[useClubSpotEntrants] Refetching data...');
    await queryRefetch();
  }, [queryRefetch]);

  // Refresh function (invalidate cache and refetch)
  const refresh = useCallback(async () => {
    console.log('[useClubSpotEntrants] Refreshing data (cache invalidation)...');
    clubSpotServiceInstance.clearCache(regattaId);
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey, regattaId]);

  // Don't show loading if we have bundled/placeholder data
  const effectiveIsLoading = isLoading && bundledEntrants.length === 0;

  return {
    entrants,
    isLoading: effectiveIsLoading,
    isRefreshing: isFetching && !effectiveIsLoading,
    error: error as Error | null,
    dataSourceInfo,
    refetch,
    refresh,
    isLiveData: dataSourceInfo?.isLive ?? false,
    lastUpdated: dataSourceInfo?.lastFetched ?? null,
    lastUpdatedText,
  };
}

/**
 * Hook to prefetch ClubSpot entrant data
 */
export function usePrefetchClubSpotEntrants() {
  const queryClient = useQueryClient();

  return useCallback(
    async (regattaId: string, eventId: string) => {
      console.log(`[useClubSpotEntrants] Prefetching entrants for ${regattaId}/${eventId}`);
      await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.entrants(regattaId, eventId),
        queryFn: () => clubSpotServiceInstance.getEntrants(regattaId, eventId),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );
}

/**
 * Get the ClubSpotService instance for direct access
 * (useful for toggling demo mode)
 */
export function getClubSpotService(): ClubSpotService {
  return clubSpotServiceInstance;
}

export default useClubSpotEntrants;
