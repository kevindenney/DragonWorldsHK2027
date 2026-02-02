/**
 * CollapsibleHeader Component
 *
 * A header component that smoothly hides as the user scrolls down
 * and reappears when scrolling up. Uses React Native's built-in
 * Animated API for Hermes engine compatibility.
 *
 * Usage:
 * ```tsx
 * const { scrollY, onScroll } = useCollapsibleHeader();
 *
 * return (
 *   <View style={{ flex: 1 }}>
 *     <CollapsibleHeader
 *       scrollY={scrollY}
 *       title="My Screen"
 *       subtitle="Optional subtitle"
 *     />
 *     <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}>
 *       <Content />
 *     </Animated.ScrollView>
 *   </View>
 * );
 * ```
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';

const { colors, spacing, typography, shadows } = dragonChampionshipsLightTheme;

interface CollapsibleHeaderProps {
  /** Animated scroll Y value from useCollapsibleHeader */
  scrollY: Animated.Value;
  /** Header title */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Custom left element (e.g., back button) */
  leftElement?: React.ReactNode;
  /** Custom right element (e.g., settings button) */
  rightElement?: React.ReactNode;
  /** Custom center element (replaces title/subtitle) */
  centerElement?: React.ReactNode;
  /** Header height for collapse calculation (default: 96) */
  headerHeight?: number;
  /** Whether to include safe area top padding (default: true) */
  includeSafeArea?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
  /** Custom subtitle style */
  subtitleStyle?: TextStyle;
  /** Children to render inside header */
  children?: React.ReactNode;
  /** Background color (default: surface color) */
  backgroundColor?: string;
  /** Whether header is sticky at top (default: true) */
  sticky?: boolean;
}

export function CollapsibleHeader({
  scrollY,
  title,
  subtitle,
  leftElement,
  rightElement,
  centerElement,
  headerHeight = 96,
  includeSafeArea = true,
  style,
  titleStyle,
  subtitleStyle,
  children,
  backgroundColor = colors.surface,
  sticky = true,
}: CollapsibleHeaderProps) {
  const insets = useSafeAreaInsets();
  const safeAreaTop = includeSafeArea ? insets.top : 0;

  // Header translateY interpolation - collapses as user scrolls down
  const headerTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, headerHeight],
        outputRange: [0, -headerHeight],
        extrapolate: 'clamp',
      }),
    [scrollY, headerHeight]
  );

  // Header opacity interpolation - fades out as it collapses
  const headerOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, headerHeight * 0.6],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [scrollY, headerHeight]
  );

  // Shadow opacity interpolation - adds shadow as header becomes sticky
  const shadowOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 0.1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        paddingTop: safeAreaTop,
        height: headerHeight + safeAreaTop,
        backgroundColor,
        transform: [{ translateY: headerTranslateY }],
      },
      sticky && styles.sticky,
      style,
    ],
    [safeAreaTop, headerHeight, backgroundColor, headerTranslateY, sticky, style]
  );

  return (
    <Animated.View style={containerStyle}>
      {/* Shadow layer */}
      <Animated.View
        style={[
          styles.shadowLayer,
          {
            opacity: shadowOpacity,
          },
        ]}
      />

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: headerOpacity }]}>
        {/* Left Element */}
        {leftElement && <View style={styles.leftContainer}>{leftElement}</View>}

        {/* Center Content */}
        <View style={styles.centerContainer}>
          {centerElement || (
            <>
              {title && (
                <Text style={[styles.title, titleStyle]} numberOfLines={1}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Right Element */}
        {rightElement && <View style={styles.rightContainer}>{rightElement}</View>}
      </Animated.View>

      {/* Optional children */}
      {children && (
        <Animated.View style={[styles.childrenContainer, { opacity: headerOpacity }]}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
}

/**
 * Spacer component to prevent content from being hidden behind the collapsible header.
 * Place this at the top of your scroll content.
 */
export function CollapsibleHeaderSpacer({
  headerHeight = 96,
  includeSafeArea = true,
}: {
  headerHeight?: number;
  includeSafeArea?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const safeAreaTop = includeSafeArea ? insets.top : 0;

  return <View style={{ height: headerHeight + safeAreaTop }} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
    overflow: 'hidden',
  },
  sticky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  shadowLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  leftContainer: {
    marginRight: spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightContainer: {
    marginLeft: spacing.md,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  childrenContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});

export default CollapsibleHeader;
