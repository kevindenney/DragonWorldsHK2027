/**
 * CoachMark - Tooltip component for walkthrough guidance
 *
 * Displays title, description, step indicator, and navigation buttons.
 * Positioned relative to the spotlight target element.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { X } from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';
import type { TooltipPosition, WalkthroughStep } from '../../constants/walkthroughSteps';
import type { TargetLayout } from '../../stores/walkthroughStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOOLTIP_WIDTH = Math.min(320, SCREEN_WIDTH - 48);
const TOOLTIP_MARGIN = 16;

interface CoachMarkProps {
  step: WalkthroughStep;
  targetLayout: TargetLayout | null;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
  visible: boolean;
}

export function CoachMark({
  step,
  targetLayout,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  isLastStep,
  isFirstStep,
  visible,
}: CoachMarkProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  // Calculate tooltip position based on target and preferred position
  const getTooltipPosition = (): { top: number; left: number } => {
    if (!targetLayout || step.isFullScreen) {
      // Center on screen for full-screen hints
      return {
        top: SCREEN_HEIGHT / 2 - 100,
        left: (SCREEN_WIDTH - TOOLTIP_WIDTH) / 2,
      };
    }

    const targetCenterX = targetLayout.pageX + targetLayout.width / 2;
    const targetCenterY = targetLayout.pageY + targetLayout.height / 2;

    // Calculate horizontal position (centered on target, but within screen bounds)
    let left = targetCenterX - TOOLTIP_WIDTH / 2;
    left = Math.max(TOOLTIP_MARGIN, Math.min(left, SCREEN_WIDTH - TOOLTIP_WIDTH - TOOLTIP_MARGIN));

    // Calculate vertical position based on preferred position
    let top: number;
    const tooltipHeight = 180; // Approximate height

    switch (step.position) {
      case 'top':
        // Position above the target
        top = targetLayout.pageY - tooltipHeight - TOOLTIP_MARGIN;
        if (top < TOOLTIP_MARGIN) {
          // Fall back to bottom if not enough space above
          top = targetLayout.pageY + targetLayout.height + TOOLTIP_MARGIN;
        }
        break;
      case 'bottom':
        // Position below the target
        top = targetLayout.pageY + targetLayout.height + TOOLTIP_MARGIN;
        if (top + tooltipHeight > SCREEN_HEIGHT - TOOLTIP_MARGIN) {
          // Fall back to top if not enough space below
          top = targetLayout.pageY - tooltipHeight - TOOLTIP_MARGIN;
        }
        break;
      case 'left':
      case 'right':
      case 'center':
      default:
        // For left/right/center, position below or above based on available space
        const spaceBelow = SCREEN_HEIGHT - (targetLayout.pageY + targetLayout.height);
        const spaceAbove = targetLayout.pageY;
        if (spaceBelow > tooltipHeight + TOOLTIP_MARGIN) {
          top = targetLayout.pageY + targetLayout.height + TOOLTIP_MARGIN;
        } else if (spaceAbove > tooltipHeight + TOOLTIP_MARGIN) {
          top = targetLayout.pageY - tooltipHeight - TOOLTIP_MARGIN;
        } else {
          // Center vertically if neither works
          top = (SCREEN_HEIGHT - tooltipHeight) / 2;
        }
        break;
    }

    // Ensure tooltip stays within screen bounds
    top = Math.max(TOOLTIP_MARGIN, Math.min(top, SCREEN_HEIGHT - tooltipHeight - TOOLTIP_MARGIN));

    return { top, left };
  };

  const position = getTooltipPosition();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: position.top,
          left: position.left,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onSkip}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <X size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <IOSText textStyle="headline" weight="semibold" style={styles.title}>
          {step.title}
        </IOSText>
        <IOSText textStyle="subheadline" color="secondaryLabel" style={styles.description}>
          {step.description}
        </IOSText>
      </View>

      {/* Footer with step indicator and buttons */}
      <View style={styles.footer}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index === currentStep && styles.stepDotActive,
                index < currentStep && styles.stepDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Navigation buttons */}
        <View style={styles.buttons}>
          {!isFirstStep && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onPrevious}
            >
              <IOSText textStyle="subheadline" weight="medium" color={colors.textSecondary}>
                Back
              </IOSText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onNext}
          >
            <IOSText textStyle="subheadline" weight="semibold" color="#FFFFFF">
              {isLastStep ? 'Done' : 'Next'}
            </IOSText>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: TOOLTIP_WIDTH,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
    zIndex: 1,
  },
  content: {
    marginBottom: spacing.md,
    marginRight: spacing.xl, // Space for close button
  },
  title: {
    marginBottom: spacing.xs,
    color: colors.text,
  },
  description: {
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
  stepDotCompleted: {
    backgroundColor: colors.primary + '60',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
});
