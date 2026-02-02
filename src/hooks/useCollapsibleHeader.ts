/**
 * useCollapsibleHeader Hook
 *
 * Provides smooth hide-on-scroll header animation using React Native's
 * built-in Animated API for Hermes engine compatibility.
 *
 * Usage:
 * ```tsx
 * const { scrollY, headerTransform, headerOpacity, onScroll } = useCollapsibleHeader();
 *
 * return (
 *   <View>
 *     <Animated.View style={[styles.header, { transform: headerTransform, opacity: headerOpacity }]}>
 *       <HeaderContent />
 *     </Animated.View>
 *     <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}>
 *       <Content />
 *     </Animated.ScrollView>
 *   </View>
 * );
 * ```
 */

import { useRef, useMemo } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface CollapsibleHeaderConfig {
  /** Maximum height the header can collapse (default: 96) */
  headerHeight?: number;
  /** Minimum scroll distance before collapse starts (default: 0) */
  scrollThreshold?: number;
  /** Whether to enable snap behavior (default: false) */
  enableSnap?: boolean;
}

interface CollapsibleHeaderReturn {
  /** Animated scroll Y value */
  scrollY: Animated.Value;
  /** Transform style array for header translateY */
  headerTransform: { translateY: Animated.AnimatedInterpolation<number> }[];
  /** Animated opacity value for header fade */
  headerOpacity: Animated.AnimatedInterpolation<number>;
  /** Combined header style with transform and opacity */
  headerStyle: {
    transform: { translateY: Animated.AnimatedInterpolation<number> }[];
    opacity: Animated.AnimatedInterpolation<number>;
  };
  /** Scroll event handler for ScrollView/FlatList */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Animated event for direct binding to ScrollView onScroll prop */
  scrollHandler: Animated.Value;
}

export function useCollapsibleHeader(
  config: CollapsibleHeaderConfig = {}
): CollapsibleHeaderReturn {
  const {
    headerHeight = 96,
    scrollThreshold = 0,
    enableSnap = false,
  } = config;

  // Animated value for scroll position
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header translateY interpolation
  // Starts after scrollThreshold, collapses over headerHeight distance
  const headerTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [scrollThreshold, scrollThreshold + headerHeight],
        outputRange: [0, -headerHeight],
        extrapolate: 'clamp',
      }),
    [scrollY, headerHeight, scrollThreshold]
  );

  // Header opacity interpolation
  // Fades out as header collapses
  const headerOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [scrollThreshold, scrollThreshold + headerHeight * 0.5],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [scrollY, headerHeight, scrollThreshold]
  );

  // Combined transform array
  const headerTransform = useMemo(
    () => [{ translateY: headerTranslateY }],
    [headerTranslateY]
  );

  // Combined header style for convenience
  const headerStyle = useMemo(
    () => ({
      transform: headerTransform,
      opacity: headerOpacity,
    }),
    [headerTransform, headerOpacity]
  );

  // Scroll event handler with native driver
  const onScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      ),
    [scrollY]
  );

  return {
    scrollY,
    headerTransform,
    headerOpacity,
    headerStyle,
    onScroll: onScroll as any, // Type assertion needed for Animated.event compatibility
    scrollHandler: scrollY,
  };
}

/**
 * Alternative hook for headers that should show/hide based on scroll direction
 * rather than absolute scroll position.
 */
export function useDirectionalCollapsibleHeader(
  config: CollapsibleHeaderConfig & { hideThreshold?: number } = {}
): CollapsibleHeaderReturn & { isHidden: boolean } {
  const {
    headerHeight = 96,
    hideThreshold = 10,
  } = config;

  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isHiddenRef = useRef(false);
  const headerOffset = useRef(new Animated.Value(0)).current;

  // This is a simplified version - for full directional support,
  // you'd need to use gesture handler or a more complex setup
  const headerTranslateY = Animated.add(
    scrollY.interpolate({
      inputRange: [0, headerHeight],
      outputRange: [0, -headerHeight],
      extrapolate: 'clamp',
    }),
    headerOffset
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, headerHeight * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return {
    scrollY,
    headerTransform: [{ translateY: headerTranslateY as any }],
    headerOpacity,
    headerStyle: {
      transform: [{ translateY: headerTranslateY as any }],
      opacity: headerOpacity,
    },
    onScroll: onScroll as any,
    scrollHandler: scrollY,
    isHidden: isHiddenRef.current,
  };
}

export default useCollapsibleHeader;
