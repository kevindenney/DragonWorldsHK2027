import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  testID?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius: skeletonBorderRadius = borderRadius.sm,
  style,
  testID
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: skeletonBorderRadius,
          opacity,
        },
        style,
      ]}
      testID={testID}
    />
  );
};

// Preset skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; lastLineWidth?: string }> = ({
  lines = 1,
  lastLineWidth = '75%',
}) => (
  <View style={styles.textContainer}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        height={16}
        width={index === lines - 1 ? lastLineWidth : '100%'}
        style={styles.textLine}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC<{ showAvatar?: boolean }> = ({ showAvatar = false }) => (
  <View style={styles.cardContainer}>
    <View style={styles.cardHeader}>
      {showAvatar && <SkeletonLoader width={40} height={40} borderRadius={20} />}
      <View style={styles.cardHeaderText}>
        <SkeletonLoader width="60%" height={18} />
        <SkeletonLoader width="40%" height={14} style={styles.cardSubtitle} />
      </View>
    </View>
    <SkeletonText lines={3} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.borderLight,
  },
  textContainer: {
    gap: spacing.xs,
  },
  textLine: {
    marginBottom: spacing.xs,
  },
  cardContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderText: {
    flex: 1,
    gap: spacing.xs,
  },
  cardSubtitle: {
    marginTop: spacing.xs,
  },
});