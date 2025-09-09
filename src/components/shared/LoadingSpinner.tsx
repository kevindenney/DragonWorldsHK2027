import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  FadeIn, 
  FadeOut 
} from 'react-native-reanimated';
import { colors, typography, spacing } from '../../constants/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  showBackground?: boolean;
  testID?: string;
}

export function LoadingSpinner({ 
  size = 'medium', 
  color = colors.primary, 
  text,
  showBackground = false,
  testID 
}: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const getSizeValue = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 40;
      default: return 24;
    }
  };

  const containerStyle = [
    styles.container,
    showBackground && styles.backgroundContainer
  ];

  return (
    <Animated.View 
      style={containerStyle}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      testID={testID}
    >
      <ActivityIndicator 
        size={getSizeValue()} 
        color={color}
        accessible={true}
        accessibilityLabel={text ? `Loading: ${text}` : 'Loading'}
      />
      {text && (
        <Text style={[styles.loadingText, { color }]} accessible={true}>
          {text}
        </Text>
      )}
    </Animated.View>
  );
}

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  style?: any;
  testID?: string;
}

export function SkeletonLoader({ width = '100%', height = 20, style, testID }: SkeletonLoaderProps) {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height },
        animatedStyle,
        style
      ]}
      testID={testID}
      accessible={true}
      accessibilityLabel="Loading content"
    />
  );
}

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
  testID?: string;
}

export function LoadingScreen({ message = 'Loading...', showLogo = true, testID }: LoadingScreenProps) {
  return (
    <View style={styles.fullScreenContainer} testID={testID}>
      {showLogo && (
        <Animated.View 
          style={styles.logoContainer}
          entering={FadeIn.delay(100)}
        >
          <Text style={styles.logoText}>🐉</Text>
          <Text style={styles.appName}>DragonWorlds HK</Text>
        </Animated.View>
      )}
      
      <Animated.View 
        style={styles.loadingContainer}
        entering={FadeIn.delay(200)}
      >
        <LoadingSpinner size="large" text={message} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  backgroundContainer: {
    backgroundColor: colors.background + 'CC',
    borderRadius: 12,
    minWidth: 100,
    minHeight: 80,
  },
  loadingText: {
    ...typography.body2,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  skeleton: {
    backgroundColor: colors.borderLight,
    borderRadius: 4,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoText: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
  },
});