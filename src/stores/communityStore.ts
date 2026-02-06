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
 * Current welcome banner version - bump this to show the banner again to all users
 * when the content changes significantly
 */
const WELCOME_BANNER_VERSION = 2;

/**
 * Community store state
 */
interface CommunityState {
  /** Currently selected segment in the Discuss screen */
  selectedSegment: DiscussSegment;

  /** Version of the welcome banner the user has seen (0 = never seen) */
  seenWelcomeVersion: number;

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
  'selectedSegment' | 'seenWelcomeVersion' | 'lastPostsRefresh'
> = {
  selectedSegment: 'community',
  seenWelcomeVersion: 0,
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
        set({ seenWelcomeVersion: WELCOME_BANNER_VERSION });
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
        seenWelcomeVersion: state.seenWelcomeVersion,
      }),
      // Migrate old hasSeenWelcome to new version system
      migrate: (persistedState: any, version) => {
        if (persistedState.hasSeenWelcome !== undefined) {
          // Old format: convert hasSeenWelcome: true to seenWelcomeVersion: 1
          persistedState.seenWelcomeVersion = persistedState.hasSeenWelcome ? 1 : 0;
          delete persistedState.hasSeenWelcome;
        }
        return persistedState;
      },
      version: 1,
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
  useCommunityStore((state) => state.seenWelcomeVersion >= WELCOME_BANNER_VERSION);

export const useMarkWelcomeSeen = () =>
  useCommunityStore((state) => state.markWelcomeSeen);

export default useCommunityStore;
