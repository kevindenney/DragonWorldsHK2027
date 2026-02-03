/**
 * useWalkthroughTarget - Hook for registering walkthrough target elements
 *
 * Provides a ref and automatic registration/unregistration with the
 * walkthrough system for coach mark targeting.
 */

import { useRef, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useWalkthrough } from '../components/walkthrough/WalkthroughProvider';

/**
 * Register an element as a walkthrough target
 *
 * @param targetId - The unique ID for this target (matches walkthroughSteps.ts)
 * @returns A ref to attach to the target element
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const headerRef = useWalkthroughTarget('schedule-header');
 *
 *   return (
 *     <View ref={headerRef}>
 *       <Text>Header Content</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useWalkthroughTarget(targetId: string) {
  const ref = useRef<View>(null);
  const { registerTarget, unregisterTarget } = useWalkthrough();

  useEffect(() => {
    if (targetId) {
      registerTarget(targetId, ref);
    }

    return () => {
      if (targetId) {
        unregisterTarget(targetId);
      }
    };
  }, [targetId, registerTarget, unregisterTarget]);

  return ref;
}

/**
 * Safe version that works outside WalkthroughProvider
 * Returns a no-op ref if not within the provider context
 */
export function useWalkthroughTargetSafe(targetId: string) {
  const ref = useRef<View>(null);

  try {
    const { registerTarget, unregisterTarget } = useWalkthrough();

    useEffect(() => {
      if (targetId) {
        registerTarget(targetId, ref);
      }

      return () => {
        if (targetId) {
          unregisterTarget(targetId);
        }
      };
    }, [targetId, registerTarget, unregisterTarget]);
  } catch {
    // Not within WalkthroughProvider - return ref without registration
  }

  return ref;
}
