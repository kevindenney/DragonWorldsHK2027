import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView 
} from 'react-native';
import { Users, Cloud, ChevronRight, FileText } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import { EnhancedContactsScreen } from './EnhancedContactsScreen';
import { ModernWeatherMapScreen } from './ModernWeatherMapScreen';

const { colors, spacing, typography, shadows, borderRadius } = dragonChampionshipsLightTheme;

interface MoreOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  accessibilityLabel: string;
}

const moreOptions: MoreOption[] = [
  {
    id: 'contacts',
    title: 'Contacts',
    description: 'Key contacts, WhatsApp groups, and emergency information',
    icon: Users,
    component: EnhancedContactsScreen,
    accessibilityLabel: 'Contacts, WhatsApp groups, and emergency information',
  },
  {
    id: 'weather',
    title: 'Weather',
    description: 'Modern weather interface with OpenSeaMaps nautical charts',
    icon: Cloud,
    component: ModernWeatherMapScreen,
    accessibilityLabel: 'Weather maps and nautical charts',
  },
  {
    id: 'data-sources',
    title: 'Data Sources',
    description: 'Live weather APIs, refresh cadence, and fallbacks',
    icon: FileText,
    component: require('../DataSourcesScreen').DataSourcesScreen,
    accessibilityLabel: 'Information about live data sources and update schedule',
  },
];

export function MoreScreen() {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);

  const handleOptionPress = async (option: MoreOption) => {
    await Haptics.selectionAsync();
    setSelectedOption(option.id);
  };

  const handleBackPress = async () => {
    await Haptics.selectionAsync();
    setSelectedOption(null);
  };

  if (selectedOption) {
    const option = moreOptions.find(opt => opt.id === selectedOption);
    if (option) {
      const Component = option.component;
      return (
        <View style={styles.container}>
          <SafeAreaView style={styles.header}>
            <TouchableOpacity 
              onPress={handleBackPress}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back to more options"
            >
              <ChevronRight 
                size={24} 
                color={colors.primary} 
                style={{ transform: [{ rotate: '180deg' }] }} 
              />
              <Text style={styles.backText}>More</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{option.title}</Text>
          </SafeAreaView>
          <View style={styles.contentContainer}>
            <Component />
          </View>
        </View>
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
        <Text style={styles.headerSubtitle}>Additional features and tools</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          {moreOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={() => handleOptionPress(option)}
                accessibilityRole="button"
                accessibilityLabel={option.accessibilityLabel}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <IconComponent 
                    size={28} 
                    color={colors.primary} 
                    strokeWidth={2}
                  />
                </View>
                
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                
                <ChevronRight 
                  size={20} 
                  color={colors.textMuted} 
                  strokeWidth={2}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.cardMedium,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backText: {
    ...typography.bodyMedium,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  scrollContainer: {
    flex: 1,
  },
  optionsContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 72,
    ...shadows.cardMedium,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
  contentContainer: {
    flex: 1,
  },
});