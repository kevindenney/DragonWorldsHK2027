import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Image } from 'react-native';
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
  const getSizeValue = () => {
    switch (size) {
      case 'small': return 'small';
      case 'large': return 'large';
      default: return 'small';
    }
  };

  const containerStyle = [
    styles.container,
    showBackground && styles.backgroundContainer
  ];

  return (
    <View 
      style={containerStyle}
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
    </View>
  );
}

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  style?: any;
  testID?: string;
}

export function SkeletonLoader({ width = '100%', height = 20, style, testID }: SkeletonLoaderProps) {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height },
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
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/dragon-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      )}
      
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" text={message} />
      </View>
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
    flex: 1,
    width: '100%',
    height: '100%',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
  },
});