/**
 * SpotlightMask - SVG overlay with spotlight cutout
 *
 * Creates a dark overlay with a transparent "spotlight" area
 * to highlight target elements during walkthroughs.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Defs, Rect, Mask, Circle } from 'react-native-svg';
import type { TargetLayout } from '../../stores/walkthroughStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SPOTLIGHT_PADDING = 8; // Extra padding around the target
const SPOTLIGHT_RADIUS = 12; // Border radius of spotlight

interface SpotlightMaskProps {
  targetLayout: TargetLayout | null;
  visible: boolean;
  overlayOpacity?: number;
}

// Animated SVG components for smooth transitions
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export function SpotlightMask({
  targetLayout,
  visible,
  overlayOpacity = 0.6,
}: SpotlightMaskProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  // Calculate spotlight dimensions
  const spotlightX = targetLayout
    ? targetLayout.pageX - SPOTLIGHT_PADDING
    : SCREEN_WIDTH / 2 - 50;
  const spotlightY = targetLayout
    ? targetLayout.pageY - SPOTLIGHT_PADDING
    : SCREEN_HEIGHT / 2 - 50;
  const spotlightWidth = targetLayout
    ? targetLayout.width + SPOTLIGHT_PADDING * 2
    : 100;
  const spotlightHeight = targetLayout
    ? targetLayout.height + SPOTLIGHT_PADDING * 2
    : 100;

  // For circular spotlight (simpler, works better with rounded elements)
  const centerX = spotlightX + spotlightWidth / 2;
  const centerY = spotlightY + spotlightHeight / 2;
  const radius = Math.max(spotlightWidth, spotlightHeight) / 2 + SPOTLIGHT_PADDING;

  return (
    <AnimatedSvg
      style={[styles.container, { opacity: fadeAnim }]}
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT}
      pointerEvents="none"
    >
      <Defs>
        <Mask id="spotlightMask">
          {/* White rectangle = visible overlay */}
          <Rect
            x={0}
            y={0}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            fill="white"
          />
          {/* Black circle = transparent spotlight */}
          {targetLayout && (
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="black"
            />
          )}
        </Mask>
      </Defs>

      {/* Semi-transparent overlay with spotlight cutout */}
      <Rect
        x={0}
        y={0}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        fill={`rgba(0, 0, 0, ${overlayOpacity})`}
        mask="url(#spotlightMask)"
      />

      {/* Spotlight ring/border for emphasis */}
      {targetLayout && (
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={2}
        />
      )}
    </AnimatedSvg>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
