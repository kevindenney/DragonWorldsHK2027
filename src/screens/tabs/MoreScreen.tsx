import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Pressable
} from 'react-native';
import { Users, Cloud, ChevronRight, FileText, User, LogIn, LogOut, Trophy, Info, RefreshCw, Check, Package, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import { EnhancedContactsScreen } from './EnhancedContactsScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { useAuth } from '../../auth/useAuth';
import { useUserStore } from '../../stores/userStore';
import { ModernWeatherMapScreen } from './ModernWeatherMapScreen';
import { DataSourcesScreen } from '../DataSourcesScreen';
import { AboutRegattaFlowScreen } from '../AboutRegattaFlowScreen';

// Component validation logging
console.log('🔍 [MoreScreen] Component imports validation:');
console.log('🔍 [MoreScreen] EnhancedContactsScreen:', typeof EnhancedContactsScreen);
console.log('🔍 [MoreScreen] SponsorsScreen:', typeof SponsorsScreen);
console.log('🔍 [MoreScreen] ModernWeatherMapScreen:', typeof ModernWeatherMapScreen);
console.log('🔍 [MoreScreen] DataSourcesScreen:', typeof DataSourcesScreen);
console.log('🔍 [MoreScreen] AboutRegattaFlowScreen:', typeof AboutRegattaFlowScreen);

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
  section?: string;
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
      section: 'RACING TOOLS',
    },
    {
      id: 'weather',
      title: 'Weather',
      description: 'Modern weather interface with OpenSeaMaps nautical charts',
      icon: Cloud,
      component: ModernWeatherMapScreen,
      accessibilityLabel: 'Weather maps and nautical charts',
      section: 'RACING TOOLS',
    },
    {
      id: 'sponsors',
      title: 'Sponsors',
      description: 'Championship sponsors, exclusive offers, and Hong Kong activities',
      icon: Trophy,
      component: SponsorsScreen,
      accessibilityLabel: 'Championship sponsors with exclusive offers and Hong Kong activities',
      section: 'EVENT INFORMATION',
    },
    {
      id: 'data-sources',
      title: 'Data Sources',
      description: 'Live weather APIs, refresh cadence, and fallbacks',
      icon: FileText,
      component: DataSourcesScreen,
      accessibilityLabel: 'Information about live data sources and update schedule',
      section: 'EVENT INFORMATION',
    },
    {
      id: 'about-regattaflow',
      title: 'About RegattaFlow',
      description: 'Company info, services, and contact details',
      icon: Info,
      component: AboutRegattaFlowScreen,
      accessibilityLabel: 'Information about RegattaFlow company and services',
      section: 'APP',
    },
  ];

  // Add development option for resetting onboarding (only in dev mode)
  if (__DEV__) {
    baseOptions.push({
      id: 'reset-onboarding',
      title: 'Reset Onboarding',
      description: 'Show onboarding flow again (Development only)',
      icon: RefreshCw,
      action: 'reset-onboarding' as any,
      accessibilityLabel: 'Reset onboarding flow for testing',
      section: 'APP',
    });
  }

  // Add authentication options
  if (isAuthenticated && user) {
    // Profile card is now at top, so we don't need it in the menu
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
      navigationTarget: 'UnifiedAuth',
      accessibilityLabel: 'Sign in to access personalized features',
    });
  }


  return baseOptions;
};

export function MoreScreen() {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [showContainerTrackingModal, setShowContainerTrackingModal] = React.useState(false);
  const navigation = useNavigation();
  const { isAuthenticated, user, logout } = useAuth();
  const { setUserType, completeOnboarding, resetOnboarding } = useUserStore();

  // Simple approach: Reset to root when coming from other tabs OR when More tab is pressed while already on More
  const wasOnDifferentTab = React.useRef(false);

  // Listen for tab focus events
  React.useEffect(() => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) return;

    const stateListener = parentNavigation.addListener('state', (e) => {
      const state = parentNavigation.getState();
      const currentRoute = state.routes[state.index];

      // Track if we're switching TO More tab from another tab
      if (currentRoute.name === 'More' && wasOnDifferentTab.current && selectedOption !== null) {
        console.log('🔍 [MoreScreen] Switching to More tab from another tab, resetting to root');
        setSelectedOption(null);
      }

      // Update flag for next time
      wasOnDifferentTab.current = currentRoute.name !== 'More';
    });

    // Also listen for tab press events when already on More tab
    const tabPressListener = parentNavigation.addListener('tabPress', (e) => {
      const state = parentNavigation.getState();
      const currentRoute = state.routes[state.index];

      // If we're already on More tab and have a selected option, reset to root
      if (currentRoute.name === 'More' && selectedOption !== null) {
        console.log('🔍 [MoreScreen] More tab pressed while already on More tab with sub-screen, resetting to root');
        setSelectedOption(null);
      }
    });

    return () => {
      stateListener();
      tabPressListener();
    };
  }, [navigation, selectedOption]);

  // Get dynamic options based on auth state
  const moreOptions = React.useMemo(() => {
    console.log('🔍 [MoreScreen] GENERATING OPTIONS - Auth state:', {
      isAuthenticated,
      user: user ? { email: user.email, displayName: user.displayName } : null
    });

    const options = getMoreOptions(isAuthenticated, user);
    console.log('🔍 [MoreScreen] Generated options validation - Total count:', options.length);
    options.forEach((option, index) => {
      console.log(`🔍 [MoreScreen] Option ${index} [${option.id}]:`, {
        title: option.title,
        hasComponent: !!option.component,
        componentType: typeof option.component,
        component: option.component
      });
    });

    // Check specifically for AboutRegattaFlow option
    const aboutOption = options.find(opt => opt.id === 'about-regattaflow');
    console.log('🔍 [MoreScreen] ABOUT-REGATTAFLOW option found:', aboutOption ? 'YES' : 'NO');
    if (aboutOption) {
      console.log('🔍 [MoreScreen] AboutRegattaFlow details:', aboutOption);
    }

    return options;
  }, [isAuthenticated, user]);

  const handleOptionPress = async (option: MoreOption) => {
    console.log('🔍 [MoreScreen] handleOptionPress called for option:', {
      optionId: option.id,
      optionTitle: option.title,
      hasComponent: !!option.component,
      action: option.action,
      timestamp: Date.now()
    });

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

    // Handle reset onboarding
    if (option.id === 'reset-onboarding') {
      try {
        // First logout the user, then reset onboarding
        if (isAuthenticated) {
          logout();
        }
        resetOnboarding();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('🔄 [MoreScreen] User logged out and onboarding reset - app will show onboarding immediately');
      } catch (error) {
        console.error('Reset onboarding error:', error);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }


    // Handle different option types
    if (option.action === 'navigation' && option.navigationTarget) {
      // Navigate to specified screen
      (navigation as any).navigate(option.navigationTarget);
    } else if (option.component) {
      // Show component in current screen
      console.log('🔍 [MoreScreen] Setting selectedOption to:', option.id);
      setSelectedOption(option.id);
    }
  };

  const handleBackPress = async () => {
    console.log('🔍 [MoreScreen] handleBackPress called from selectedOption:', selectedOption);
    await Haptics.selectionAsync();
    console.log('🔍 [MoreScreen] handleBackPress - Setting selectedOption to null');
    setSelectedOption(null);
  };

  if (selectedOption) {
    console.log('🔍 [MoreScreen] Attempting to render selected option:', selectedOption);
    const option = moreOptions.find(opt => opt.id === selectedOption);
    console.log('🔍 [MoreScreen] Found option:', option ? option.title : 'NOT FOUND');

    if (option && option.component) {
      console.log('🔍 [MoreScreen] Component details:', {
        optionId: option.id,
        componentExists: !!option.component,
        componentType: typeof option.component,
        componentName: option.component.name || 'unnamed'
      });
      const Component = option.component;

      // Special handling for weather screen - render without header for full-screen experience
      if (option.id === 'weather') {
        console.log('🔍 [MoreScreen] Rendering weather screen with custom navigation props');
        const weatherNavigation = {
          goBack: handleBackPress,
          // Add debug info
          __debug: 'CustomWeatherNavigation'
        };
        console.log('🔍 [MoreScreen] Weather navigation object:', weatherNavigation);

        return (
          <View style={styles.container}>
            <Component navigation={weatherNavigation} />
          </View>
        );
      }

      // Standard rendering with header for other components
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
          </SafeAreaView>
          <View style={styles.contentContainer}>
            <Component />
          </View>
        </View>
      );
    }
  }

  // Handle profile card press
  const handleProfilePress = async () => {
    await Haptics.selectionAsync();
    (navigation as any).navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
        <Text style={styles.headerSubtitle}>Account & Settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Container Tracking Coming Soon Card */}
        <TouchableOpacity
          style={styles.comingSoonCard}
          onPress={async () => {
            await Haptics.selectionAsync();
            setShowContainerTrackingModal(true);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Container Tracking - Coming Soon"
        >
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
          </View>
          <View style={styles.comingSoonIconContainer}>
            <Package size={32} color="#3B82F6" strokeWidth={2} />
          </View>
          <View style={styles.comingSoonContent}>
            <Text style={styles.comingSoonTitle}>Container Tracking</Text>
            <Text style={styles.comingSoonDescription}>
              Track your sailboat container from home to Hong Kong
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        </TouchableOpacity>

        {/* Enhanced Profile Card - Only show if authenticated */}
        {isAuthenticated && user && (
          <TouchableOpacity
            style={styles.profileCard}
            onPress={handleProfilePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="View profile"
          >
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
                {(user.displayName || user.email || 'U')[1]?.toUpperCase() || ''}
              </Text>
            </View>

            {/* User Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user.displayName || user.email || 'User'}
              </Text>
              <Text style={styles.profileRole}>
                Sailor • Racing on d59
              </Text>
              <View style={styles.profileRegistration}>
                <Check size={14} color="#0066CC" strokeWidth={2.5} />
                <Text style={styles.profileRegistrationText}>
                  Registered for 2 events
                </Text>
              </View>
            </View>

            {/* Chevron */}
            <ChevronRight size={24} color="#CCCCCC" strokeWidth={2} />
          </TouchableOpacity>
        )}

        <View style={styles.optionsContainer}>
          {(() => {
            let lastSection: string | undefined = undefined;
            return moreOptions.map((option, index) => {
              const IconComponent = option.icon;
              const showSectionHeader = option.section && option.section !== lastSection;
              const isFirstSection = index === 0 || (!moreOptions[index - 1].section && option.section);
              lastSection = option.section;

              return (
                <React.Fragment key={option.id}>
                  {showSectionHeader && (
                    <Text style={[styles.sectionHeader, isFirstSection && styles.firstSectionHeader]}>
                      {option.section}
                    </Text>
                  )}
                  <TouchableOpacity
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
                </React.Fragment>
              );
            });
          })()}
        </View>
      </ScrollView>

      {/* Container Tracking Info Modal */}
      <Modal
        visible={showContainerTrackingModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowContainerTrackingModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowContainerTrackingModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowContainerTrackingModal(false)}
              accessibilityLabel="Close modal"
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.modalIconContainer}>
              <Package size={48} color="#3B82F6" strokeWidth={1.5} />
            </View>

            <Text style={styles.modalTitle}>Container Tracking</Text>
            <Text style={styles.modalSubtitle}>Coming Soon!</Text>

            <Text style={styles.modalDescription}>
              We're working on a feature that will let you track your sailboat container shipment in real-time as it makes its journey from your home port to Hong Kong.
            </Text>

            <View style={styles.modalFeatureList}>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureBullet} />
                <Text style={styles.modalFeatureText}>Real-time GPS tracking</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureBullet} />
                <Text style={styles.modalFeatureText}>Estimated arrival updates</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureBullet} />
                <Text style={styles.modalFeatureText}>Shipping milestone notifications</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <View style={styles.modalFeatureBullet} />
                <Text style={styles.modalFeatureText}>Customs clearance status</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowContainerTrackingModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Got It</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingTop: spacing.xl,
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
  // Enhanced Profile Card Styles
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: spacing.lg,
    marginTop: 8,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  profileRegistration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileRegistrationText: {
    fontSize: 14,
    color: '#0066CC',
  },
  // Section Header Styles
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#999999',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  firstSectionHeader: {
    marginTop: 8, // Less margin for first section
  },
  // Coming Soon Card Styles
  comingSoonCard: {
    backgroundColor: '#F0F9FF', // Light blue background
    borderRadius: 16,
    padding: 16,
    marginHorizontal: spacing.lg,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    position: 'relative',
    overflow: 'hidden',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  comingSoonIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  comingSoonContent: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  comingSoonDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 1,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalFeatureList: {
    width: '100%',
    marginBottom: 24,
  },
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalFeatureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 12,
  },
  modalFeatureText: {
    fontSize: 14,
    color: '#475569',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});