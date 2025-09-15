import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LayoutGrid, List } from 'lucide-react-native';
import { SimplifiedResultsScreen } from '../../screens/tabs/SimplifiedResultsScreen';
import { ModernResultsScreen } from '../../screens/tabs/ModernResultsScreen';
import { CompetitorDetailScreen } from '../../screens/CompetitorDetailScreen';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';

const { colors, typography, spacing, borderRadius } = dragonChampionshipsLightTheme;

type ResultsStackParamList = {
  ResultsHome: undefined;
  CompetitorDetail: {
    sailNumber: string;
    competitorData: any;
    standings: any;
  };
};

const Stack = createStackNavigator<ResultsStackParamList>();

// Results screen with view toggle
function ResultsScreenWithToggle(props: any) {
  const [viewMode, setViewMode] = useState<'simple' | 'modern'>('modern');

  const toggleView = () => {
    setViewMode(current => current === 'simple' ? 'modern' : 'simple');
  };

  // For modern view, we integrate the toggle into the screen itself
  if (viewMode === 'modern') {
    return <ModernResultsScreen {...props} onToggleView={toggleView} />;
  }

  // For simple view, show with toggle header
  return (
    <View style={styles.container}>
      {/* View toggle header */}
      <View style={styles.toggleHeader}>
        <Text style={styles.toggleTitle}>Results</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleView}
          activeOpacity={0.7}
        >
          <LayoutGrid color={colors.primary} size={20} />
          <Text style={styles.toggleButtonText}>Modern</Text>
        </TouchableOpacity>
      </View>

      <SimplifiedResultsScreen {...props} />
    </View>
  );
}

export function ResultsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ResultsHome" component={ResultsScreenWithToggle} />
      <Stack.Screen name="CompetitorDetail" component={CompetitorDetailScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  toggleTitle: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  toggleButtonText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '600',
  },
});


