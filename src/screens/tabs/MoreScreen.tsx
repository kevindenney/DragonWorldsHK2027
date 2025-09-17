import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Users, Cloud, ChevronRight, FileText, User, LogIn, LogOut, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import { EnhancedContactsScreen } from './EnhancedContactsScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { useAuth } from '../../auth/useAuth';
import { ProgressiveAuthExample } from '../../components/auth/ProgressiveAuthExample';
// TEMPORARILY DISABLED: import { ModernWeatherMapScreen } from './ModernWeatherMapScreen';

const { colors, spacing, typography, shadows, borderRadius } = dragonChampionshipsLightTheme;

interface MoreOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component?: React.ComponentType<any>;
  action?: 'navigation' | 'auth';
  navigationTarget?: string;
  accessibilityLabel: string;
}

// Create options based on authentication state
const getMoreOptions = (isAuthenticated: boolean, user: any): MoreOption[] => {
  const baseOptions: MoreOption[] = [
    {
      id: 'contacts',
      title: 'Contacts',
      description: 'Key contacts, WhatsApp groups, and emergency information',
      icon: Users,
      component: EnhancedContactsScreen,
      accessibilityLabel: 'Contacts, WhatsApp groups, and emergency information',
    },
    {
      id: 'sponsors',
      title: 'Sponsors',
      description: 'Championship sponsors, exclusive offers, and Hong Kong activities',
      icon: Trophy,
      component: SponsorsScreen,
      accessibilityLabel: 'Championship sponsors with exclusive offers and Hong Kong activities',
    },
    // TEMPORARILY DISABLED: Weather screen with maps
    // {
    //   id: 'weather',
    //   title: 'Weather',
    //   description: 'Modern weather interface with OpenSeaMaps nautical charts',
    //   icon: Cloud,
    //   component: ModernWeatherMapScreen,
    //   accessibilityLabel: 'Weather maps and nautical charts',
    // },
    {
      id: 'data-sources',
      title: 'Data Sources',
      description: 'Live weather APIs, refresh cadence, and fallbacks',
      icon: FileText,
      component: require('../DataSourcesScreen').DataSourcesScreen,
      accessibilityLabel: 'Information about live data sources and update schedule',
    },
  ];

  // Add authentication options
  if (isAuthenticated && user) {
    baseOptions.push({
      id: 'profile',
      title: 'Profile',
      description: `Signed in as ${user.displayName || user.email}`,
      icon: User,
      action: 'navigation',
      navigationTarget: 'Profile',
      accessibilityLabel: `User profile for ${user.displayName || user.email}`,
    });
    baseOptions.push({
      id: 'sign-out',
      title: 'Sign Out',
      description: 'Sign out of your account',
      icon: LogOut,
      action: 'auth',
      accessibilityLabel: 'Sign out of your account',
    });
  } else {
    baseOptions.push({
      id: 'sign-in',
      title: 'Sign In',
      description: 'Access personalized features and save preferences',
      icon: LogIn,
      action: 'navigation',
      navigationTarget: 'Login',
      accessibilityLabel: 'Sign in to access personalized features',
    });
  }

  // Add debug options in development
  if (__DEV__) {
    baseOptions.push({
      id: 'progressive-auth-demo',
      title: 'Progressive Auth Demo',
      description: 'Test the progressive authentication prompts',
      icon: User,
      component: ProgressiveAuthExample,
      accessibilityLabel: 'Test progressive authentication prompts',
    });
    baseOptions.push({
      id: 'debug-clear-auth',
      title: 'Debug: Clear Auth',
      description: 'Clear authentication data (Development only)',
      icon: LogOut,
      action: 'navigation',
      navigationTarget: 'ClearAuth',
      accessibilityLabel: 'Clear authentication data for testing',
    });
  }

  return baseOptions;
};

export function MoreScreen() {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const navigation = useNavigation();
  const { isAuthenticated, user, clearAuthData, logout } = useAuth();

  // Get dynamic options based on auth state
  const moreOptions = React.useMemo(() =>
    getMoreOptions(isAuthenticated, user),
    [isAuthenticated, user]
  );

  const handleOptionPress = async (option: MoreOption) => {
    await Haptics.selectionAsync();

    // Handle sign out
    if (option.id === 'sign-out') {
      try {
        await logout();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('Sign out error:', error);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Handle debug clear auth
    if (option.id === 'debug-clear-auth') {
      const { clearAuthStorage } = await import('../../utils/authDebug');
      const cleared = await clearAuthStorage();
      if (cleared) {
        // Also clear the store state
        clearAuthData();
        alert('Auth data cleared! Please reload the app.');
      }
      return;
    }

    // Handle different option types
    if (option.action === 'navigation' && option.navigationTarget) {
      // Navigate to specified screen
      (navigation as any).navigate(option.navigationTarget);
    } else if (option.component) {
      // Show component in current screen
      setSelectedOption(option.id);
    }
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
        {/* User Status Indicator */}
        <View style={styles.userStatusContainer}>
          {isAuthenticated && user ? (
            <View style={styles.userStatus}>
              <User size={16} color={colors.primary} />
              <View style={styles.userStatusContent}>
                <Text style={styles.userStatusText}>
                  Signed in as {user.displayName || user.email}
                </Text>
                <Text style={styles.userBenefitsText}>
                  Personalized features enabled
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.userStatus}>
              <User size={16} color={colors.textMuted} />
              <View style={styles.userStatusContent}>
                <Text style={styles.guestStatusText}>
                  Using as guest
                </Text>
                <Text style={styles.guestBenefitsText}>
                  Sign in to save preferences and access personalized features
                </Text>
              </View>
            </View>
          )}
        </View>
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
    ...typography.bodyLarge,
    color: colors.text,
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
  userStatusContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userStatusContent: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  userStatusText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  userBenefitsText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
  },
  guestStatusText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  guestBenefitsText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
});