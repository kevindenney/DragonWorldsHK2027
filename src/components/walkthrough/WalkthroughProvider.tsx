/**
 * WalkthroughProvider - Context provider for walkthrough system
 *
 * Wraps the app and renders the coach mark overlay when active.
 * Provides context for registering target elements and controlling walkthroughs.
 */

import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { SpotlightMask } from './SpotlightMask';
import { CoachMark } from './CoachMark';
import {
  useWalkthroughStore,
  useIsWalkthroughActive,
  useCurrentSequence,
  useCurrentStepIndex,
  useRegisteredTargets,
  type WalkthroughSequence,
  type TargetLayout,
} from '../../stores/walkthroughStore';
import {
  getSequenceSteps,
  getSequenceStepCount,
  getStep,
} from '../../constants/walkthroughSteps';

// Context for walkthrough registration and control
interface WalkthroughContextValue {
  registerTarget: (id: string, ref: React.RefObject<any>) => void;
  unregisterTarget: (id: string) => void;
  startSequence: (sequence: WalkthroughSequence) => void;
  isActive: boolean;
  currentSequence: WalkthroughSequence | null;
}

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

export function useWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within WalkthroughProvider');
  }
  return context;
}

interface WalkthroughProviderProps {
  children: React.ReactNode;
}

export function WalkthroughProvider({ children }: WalkthroughProviderProps) {
  const isActive = useIsWalkthroughActive();
  const currentSequence = useCurrentSequence();
  const currentStepIndex = useCurrentStepIndex();
  const registeredTargets = useRegisteredTargets();

  const {
    startSequence,
    nextStep,
    previousStep,
    skipSequence,
    completeSequence,
    registerTarget: storeRegisterTarget,
    unregisterTarget: storeUnregisterTarget,
    updateTargetLayout,
  } = useWalkthroughStore();

  // Track refs for measuring
  const targetRefs = useRef<Record<string, React.RefObject<any>>>({});

  // Register a target element
  const registerTarget = useCallback(
    (id: string, ref: React.RefObject<any>) => {
      targetRefs.current[id] = ref;
      storeRegisterTarget(id, ref);
    },
    [storeRegisterTarget]
  );

  // Unregister a target element
  const unregisterTarget = useCallback(
    (id: string) => {
      delete targetRefs.current[id];
      storeUnregisterTarget(id);
    },
    [storeUnregisterTarget]
  );

  // Measure target layout when walkthrough becomes active or step changes
  useEffect(() => {
    if (!isActive || !currentSequence) return;

    const currentStep = getStep(currentSequence, currentStepIndex);
    if (!currentStep) return;

    // Check both provider's targetRefs and store's registeredTargets for the ref
    // This handles both registration patterns (via hook or direct store)
    const providerRef = targetRefs.current[currentStep.targetId];
    const storeRef = registeredTargets[currentStep.targetId]?.ref;
    const targetRef = providerRef || storeRef;

    if (!targetRef?.current) return;

    // Wait a frame for layout to be ready
    requestAnimationFrame(() => {
      targetRef.current?.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          if (x !== undefined && y !== undefined) {
            updateTargetLayout(currentStep.targetId, {
              x: 0,
              y: 0,
              width,
              height,
              pageX: x,
              pageY: y,
            });
          }
        }
      );
    });
  }, [isActive, currentSequence, currentStepIndex, updateTargetLayout, registeredTargets]);

  // Get current step info
  const currentStep = currentSequence
    ? getStep(currentSequence, currentStepIndex)
    : null;
  const totalSteps = currentSequence
    ? getSequenceStepCount(currentSequence)
    : 0;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Get target layout for current step
  const currentTargetId = currentStep?.targetId || '';
  const targetLayout = registeredTargets[currentTargetId]?.layout || null;

  // Handle next button
  const handleNext = useCallback(() => {
    if (isLastStep) {
      completeSequence();
    } else {
      nextStep();
    }
  }, [isLastStep, completeSequence, nextStep]);

  // Handle previous button
  const handlePrevious = useCallback(() => {
    previousStep();
  }, [previousStep]);

  // Handle skip/close
  const handleSkip = useCallback(() => {
    skipSequence();
  }, [skipSequence]);

  // Context value
  const contextValue: WalkthroughContextValue = {
    registerTarget,
    unregisterTarget,
    startSequence,
    isActive,
    currentSequence,
  };

  return (
    <WalkthroughContext.Provider value={contextValue}>
      <View style={styles.container}>
        {children}

        {/* Walkthrough overlay */}
        {isActive && currentStep && (
          <View style={styles.overlay} pointerEvents="box-none">
            {/* Tap outside to skip */}
            <TouchableWithoutFeedback onPress={handleSkip}>
              <View style={styles.backdropTouchable} />
            </TouchableWithoutFeedback>

            {/* Spotlight mask */}
            <SpotlightMask
              targetLayout={targetLayout}
              visible={isActive}
              overlayOpacity={0.6}
            />

            {/* Coach mark tooltip */}
            <CoachMark
              step={currentStep}
              targetLayout={targetLayout}
              currentStep={currentStepIndex}
              totalSteps={totalSteps}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={handleSkip}
              isLastStep={isLastStep}
              isFirstStep={isFirstStep}
              visible={isActive}
            />
          </View>
        )}
      </View>
    </WalkthroughContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
});
