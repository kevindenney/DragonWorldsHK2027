/**
 * News Store - Zustand store for tracking unread articles
 * Persists read article IDs to AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NewsStore {
  // Set of article IDs the user has seen
  seenArticleIds: string[];
  // Unread count for badge display
  unreadCount: number;
  // Last time the user viewed the news screen
  lastViewedAt: number | null;

  // Actions
  markArticlesAsSeen: (articleIds: string[]) => void;
  updateUnreadCount: (newArticleIds: string[]) => void;
  clearUnread: () => void;
  resetStore: () => void;
}

export const useNewsStore = create<NewsStore>()(
  persist(
    (set, get) => ({
      seenArticleIds: [],
      unreadCount: 0,
      lastViewedAt: null,

      markArticlesAsSeen: (articleIds: string[]) => {
        const currentSeen = get().seenArticleIds;
        const combinedIds = [...currentSeen, ...articleIds];
        const newSeen = combinedIds.filter((id, index) => combinedIds.indexOf(id) === index);
        set({
          seenArticleIds: newSeen,
          unreadCount: 0,
          lastViewedAt: Date.now(),
        });
      },

      updateUnreadCount: (newArticleIds: string[]) => {
        const seenIds = new Set(get().seenArticleIds);
        const unseenCount = newArticleIds.filter(id => !seenIds.has(id)).length;

        // Only update if there are actually new unseen articles
        if (unseenCount > 0) {
          set({ unreadCount: unseenCount });
        }
      },

      clearUnread: () => {
        set({ unreadCount: 0 });
      },

      resetStore: () => {
        set({
          seenArticleIds: [],
          unreadCount: 0,
          lastViewedAt: null,
        });
      },
    }),
    {
      name: 'dragonworld-news-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain fields
      partialize: (state) => ({
        seenArticleIds: state.seenArticleIds,
        lastViewedAt: state.lastViewedAt,
      }),
    }
  )
);

export default useNewsStore;
