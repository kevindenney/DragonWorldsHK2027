import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  RefreshCw, 
  Compass, 
  Target, 
  Wind,
  BarChart3
} from 'lucide-react-native';
import { colors, spacing } from '../../constants/theme';

interface SimpleRacingActionsProps {
  onRefresh: () => Promise<void>;
  onToggleView: () => void;
  isRefreshing: boolean;
  currentView: 'overview' | 'tactical' | 'detailed';
}

export const SimpleRacingActions: React.FC<SimpleRacingActionsProps> = ({
  onRefresh,
  onToggleView,
  isRefreshing,
  currentView
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Racing Controls</Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, isRefreshing && styles.disabled]}
          onPress={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw color={isRefreshing ? colors.textMuted : colors.primary} size={20} />
          <Text style={styles.actionText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onToggleView}>
          <BarChart3 color={colors.primary} size={20} />
          <Text style={styles.actionText}>View: {currentView}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Compass color={colors.primary} size={20} />
          <Text style={styles.actionText}>Course</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    minWidth: 80,
  },
  disabled: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 11,
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
});