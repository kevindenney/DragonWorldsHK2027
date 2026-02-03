/**
 * WalkthroughStore - State management for first-time user walkthroughs
 *
 * Manages coach mark sequences for each screen, tracks completion,
 * and persists state across app sessions.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Walkthrough sequence identifiers
export type WalkthroughSequence =
  | 'schedule'
  | 'notices'
  | 'results'
  | 'map'
  | 'weather'
  | 'forms'
  | 'more';

// Target element layout for positioning coach marks
export interface TargetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  pageX: number;
  pageY: number;
}

// Registered target for coach mark positioning
export interface RegisteredTarget {
  id: string;
  layout: TargetLayout | null;
  ref: any; // React ref to the element
}

interface WalkthroughState {
  // Persistence state
  completedSequences: WalkthroughSequence[];
  hasCompletedInitialWalkthrough: boolean;
  showHintsEnabled: boolean;

  // Runtime state
  isActive: boolean;
  currentSequence: WalkthroughSequence | null;
  currentStepIndex: number;
  registeredTargets: Record<string, RegisteredTarget>;

  // Actions
  startSequence: (sequence: WalkthroughSequence) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipSequence: () => void;
  completeSequence: () => void;
  dismissWalkthrough: () => void;

  // Target registration
  registerTarget: (id: string, ref: any) => void;
  unregisterTarget: (id: string) => void;
  updateTargetLayout: (id: string, layout: TargetLayout) => void;

  // Preferences
  setShowHintsEnabled: (enabled: boolean) => void;

  // Query helpers
  hasCompletedSequence: (sequence: WalkthroughSequence) => boolean;
  shouldShowSequence: (sequence: WalkthroughSequence) => boolean;

  // Reset for testing/debugging
  resetAllProgress: () => void;
  resetSequence: (sequence: WalkthroughSequence) => void;
}

export const useWalkthroughStore = create<WalkthroughState>()(
  persist(
    (set, get) => ({
      // Initial persistence state
      completedSequences: [],
      hasCompletedInitialWalkthrough: false,
      showHintsEnabled: true,

      // Initial runtime state
      isActive: false,
      currentSequence: null,
      currentStepIndex: 0,
      registeredTargets: {},

      // Start a walkthrough sequence
      startSequence: (sequence: WalkthroughSequence) => {
        const state = get();

        // Don't start if already active or if hints are disabled
        if (state.isActive || !state.showHintsEnabled) {
          return;
        }

        // Don't start if already completed (unless manually triggered)
        if (state.completedSequences.includes(sequence)) {
          return;
        }

        set({
          isActive: true,
          currentSequence: sequence,
          currentStepIndex: 0,
        });
      },

      // Move to next step
      nextStep: () => {
        set(state => ({
          currentStepIndex: state.currentStepIndex + 1,
        }));
      },

      // Move to previous step
      previousStep: () => {
        set(state => ({
          currentStepIndex: Math.max(0, state.currentStepIndex - 1),
        }));
      },

      // Skip the current sequence without completing
      skipSequence: () => {
        const state = get();
        if (!state.currentSequence) return;

        // Mark as completed so it doesn't show again
        set(state => ({
          isActive: false,
          currentSequence: null,
          currentStepIndex: 0,
          completedSequences: state.currentSequence
            ? [...state.completedSequences, state.currentSequence]
            : state.completedSequences,
        }));
      },

      // Complete the current sequence
      completeSequence: () => {
        const state = get();
        if (!state.currentSequence) return;

        const newCompletedSequences = [
          ...state.completedSequences,
          state.currentSequence,
        ];

        // Check if this completes all initial sequences
        const initialSequences: WalkthroughSequence[] = [
          'schedule',
          'notices',
          'results',
          'map',
        ];
        const hasCompletedAll = initialSequences.every(seq =>
          newCompletedSequences.includes(seq)
        );

        set({
          isActive: false,
          currentSequence: null,
          currentStepIndex: 0,
          completedSequences: newCompletedSequences,
          hasCompletedInitialWalkthrough: hasCompletedAll,
        });
      },

      // Dismiss walkthrough without marking as complete
      dismissWalkthrough: () => {
        set({
          isActive: false,
          currentSequence: null,
          currentStepIndex: 0,
        });
      },

      // Register a target element for coach marks
      registerTarget: (id: string, ref: any) => {
        set(state => ({
          registeredTargets: {
            ...state.registeredTargets,
            [id]: { id, ref, layout: null },
          },
        }));
      },

      // Unregister a target element
      unregisterTarget: (id: string) => {
        set(state => {
          const { [id]: removed, ...rest } = state.registeredTargets;
          return { registeredTargets: rest };
        });
      },

      // Update target layout after measurement
      updateTargetLayout: (id: string, layout: TargetLayout) => {
        set(state => ({
          registeredTargets: {
            ...state.registeredTargets,
            [id]: {
              ...state.registeredTargets[id],
              layout,
            },
          },
        }));
      },

      // Toggle hints preference
      setShowHintsEnabled: (enabled: boolean) => {
        set({ showHintsEnabled: enabled });
      },

      // Check if a sequence has been completed
      hasCompletedSequence: (sequence: WalkthroughSequence) => {
        return get().completedSequences.includes(sequence);
      },

      // Check if a sequence should be shown
      shouldShowSequence: (sequence: WalkthroughSequence) => {
        const state = get();
        return (
          state.showHintsEnabled &&
          !state.completedSequences.includes(sequence) &&
          !state.isActive
        );
      },

      // Reset all walkthrough progress (for testing/debugging)
      resetAllProgress: () => {
        set({
          completedSequences: [],
          hasCompletedInitialWalkthrough: false,
          isActive: false,
          currentSequence: null,
          currentStepIndex: 0,
        });
      },

      // Reset a specific sequence
      resetSequence: (sequence: WalkthroughSequence) => {
        set(state => ({
          completedSequences: state.completedSequences.filter(
            s => s !== sequence
          ),
        }));
      },
    }),
    {
      name: 'dragon-worlds-walkthrough',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        completedSequences: state.completedSequences,
        hasCompletedInitialWalkthrough: state.hasCompletedInitialWalkthrough,
        showHintsEnabled: state.showHintsEnabled,
      }),
    }
  )
);

// Selector hooks for common patterns
export const useIsWalkthroughActive = () =>
  useWalkthroughStore(state => state.isActive);

export const useCurrentSequence = () =>
  useWalkthroughStore(state => state.currentSequence);

export const useCurrentStepIndex = () =>
  useWalkthroughStore(state => state.currentStepIndex);

export const useRegisteredTargets = () =>
  useWalkthroughStore(state => state.registeredTargets);

export const useShowHintsEnabled = () =>
  useWalkthroughStore(state => state.showHintsEnabled);

export const useHasCompletedSequence = (sequence: WalkthroughSequence) =>
  useWalkthroughStore(state => state.completedSequences.includes(sequence));
