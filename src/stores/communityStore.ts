/**
 * Community Store
 *
 * Zustand store for managing community-related state such as
 * selected segment, UI preferences, and cached community data.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Segment options for the Discuss screen
 */
export type DiscussSegment = 'community' | 'feed';

/**
 * Community store state
 */
interface CommunityState {
  /** Currently selected segment in the Discuss screen */
  selectedSegment: DiscussSegment;

  /** Whether the user has seen the welcome/onboarding message */
  hasSeenWelcome: boolean;

  /** Last time the posts were refreshed (for stale data indicator) */
  lastPostsRefresh: number | null;

  /** Actions */
  setSelectedSegment: (segment: DiscussSegment) => void;
  markWelcomeSeen: () => void;
  updateLastPostsRefresh: () => void;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState: Pick<
  CommunityState,
  'selectedSegment' | 'hasSeenWelcome' | 'lastPostsRefresh'
> = {
  selectedSegment: 'community',
  hasSeenWelcome: false,
  lastPostsRefresh: null,
};

/**
 * Community store with persistence
 */
export const useCommunityStore = create<CommunityState>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedSegment: (segment) => {
        set({ selectedSegment: segment });
      },

      markWelcomeSeen: () => {
        set({ hasSeenWelcome: true });
      },

      updateLastPostsRefresh: () => {
        set({ lastPostsRefresh: Date.now() });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'community-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        selectedSegment: state.selectedSegment,
        hasSeenWelcome: state.hasSeenWelcome,
      }),
    }
  )
);

/**
 * Selector hooks for specific state slices
 */
export const useSelectedSegment = () =>
  useCommunityStore((state) => state.selectedSegment);

export const useSetSelectedSegment = () =>
  useCommunityStore((state) => state.setSelectedSegment);

export const useHasSeenWelcome = () =>
  useCommunityStore((state) => state.hasSeenWelcome);

export const useMarkWelcomeSeen = () =>
  useCommunityStore((state) => state.markWelcomeSeen);

export default useCommunityStore;
