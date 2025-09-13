import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation2 } from 'lucide-react-native';
import { IOSText } from '../../components/ios';
import { colors, typography, spacing } from '../../constants/theme';
import type { WeatherScreenProps } from '../../types/navigation';

export function RacingWeatherMapScreen({ navigation }: WeatherScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Navigation2 color={colors.primary} size={24} />
        <IOSText style={styles.title}>Racing Weather Map</IOSText>
      </View>
      
      <View style={styles.content}>
        <IOSText style={styles.message}>
          🏁 NEW RACING WEATHER SCREEN LOADED SUCCESSFULLY! 🏁
        </IOSText>
        <IOSText style={styles.subtitle}>
          Interactive map with weather overlays for Clearwater Bay Marina racing area
        </IOSText>
        <IOSText style={styles.location}>
          📍 Hong Kong Racing Area (22.35°N, 114.25°E)
        </IOSText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  
  title: {
    ...typography.h4,
    color: colors.text,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  
  message: {
    ...typography.h5,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  
  subtitle: {
    ...typography.body1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  
  location: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});