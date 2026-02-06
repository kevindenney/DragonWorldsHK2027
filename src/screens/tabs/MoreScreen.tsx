import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EnhancedContactsScreen } from './EnhancedContactsScreen';
import { EntrantsScreen } from './EntrantsScreen';
import { SponsorsScreen } from './SponsorsScreen';
import { NewsScreen } from './NewsScreen';
import { useAuth } from '../../auth/useAuth';
import { ModernWeatherMapScreen } from './ModernWeatherMapScreen';
import { MapScreen } from '../MapScreen';
import { DataSourcesScreen } from '../DataSourcesScreen';
import { DiscussScreen } from '../DiscussScreen';
import { AboutRegattaFlowScreen } from '../AboutRegattaFlowScreen';
import { ShippingScreen } from './ShippingScreen';
import { IOSText } from '../../components/ios/IOSText';
import { ProfileButton } from '../../components/navigation/ProfileButton';
import { FloatingBackButton } from '../../components/navigation/FloatingBackButton';
import { colors } from '../../constants/theme';
import type { RootStackParamList } from '../../types/navigation';
import { useNewsStore } from '../../stores/newsStore';

interface MoreOption {
  id: string;
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  component?: React.ComponentType<any>;
  action?: 'navigation' | 'auth';
  navigationTarget?: keyof RootStackParamList;
  accessibilityLabel: string;
  section: string;
  destructive?: boolean;
}

// Group options by section for iOS-style grouped list
const getMoreOptions = (): MoreOption[] => {
  const options: MoreOption[] = [
    // RACING section
    {
      id: 'entrants',
      title: 'Entrants',
      iconName: 'people-outline',
      component: EntrantsScreen,
      accessibilityLabel: 'View registered competitors and boats',
      section: 'Racing',
    },
    {
      id: 'map',
      title: 'Venue Map',
      iconName: 'map-outline',
      component: MapScreen,
      accessibilityLabel: 'Interactive sailing locations and race course map',
      section: 'Racing',
    },
    {
      id: 'shipping',
      title: 'Container Shipping',
      iconName: 'boat-outline',
      component: ShippingScreen,
      accessibilityLabel: 'Track your boat shipping container',
      section: 'Racing',
    },
    // EVENT section
    {
      id: 'discuss',
      title: 'Discuss',
      iconName: 'chatbubbles-outline',
      component: DiscussScreen,
      accessibilityLabel: 'Community discussions and forums',
      section: 'Event',
    },
    {
      id: 'news',
      title: 'News',
      iconName: 'newspaper-outline',
      component: NewsScreen,
      accessibilityLabel: 'Latest news from Dragon World 2027',
      section: 'Event',
    },
    {
      id: 'contacts',
      title: 'Contacts',
      iconName: 'call-outline',
      component: EnhancedContactsScreen,
      accessibilityLabel: 'Contacts, WhatsApp groups, and emergency information',
      section: 'Event',
    },
    {
      id: 'weather',
      title: 'Weather',
      iconName: 'partly-sunny-outline',
      component: ModernWeatherMapScreen,
      accessibilityLabel: 'Weather maps and nautical charts',
      section: 'Event',
    },
    {
      id: 'sponsors',
      title: 'Sponsors',
      iconName: 'ribbon-outline',
      component: SponsorsScreen,
      accessibilityLabel: 'Championship sponsors with exclusive offers',
      section: 'Event',
    },
    // APP section
    {
      id: 'about-regattaflow',
      title: 'About RegattaFlow',
      iconName: 'navigate-outline',
      component: AboutRegattaFlowScreen,
      accessibilityLabel: 'Learn about RegattaFlow sailing platform',
      section: 'App',
    },
    {
      id: 'data-sources',
      title: 'Data Sources',
      iconName: 'server-outline',
      component: DataSourcesScreen,
      accessibilityLabel: 'Information about live data sources',
      section: 'App',
    },
  ];

  return options;
};

// Badge component for unread count
function RowBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  const displayText = count > 99 ? '99+' : String(count);

  return (
    <View style={styles.rowBadge}>
      <Text style={styles.rowBadgeText}>{displayText}</Text>
    </View>
  );
}

export function MoreScreen() {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const unreadCount = useNewsStore((state) => state.unreadCount);

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
        setSelectedOption(null);
      }

      // Update flag for next time
      wasOnDifferentTab.current = currentRoute.name !== 'More';
    });

    // Also listen for tab press events when already on More tab
    const tabPressListener = parentNavigation.addListener('tabPress' as any, (e: any) => {
      const state = parentNavigation.getState();
      const currentRoute = state.routes[state.index];

      // If we're already on More tab and have a selected option, reset to root
      if (currentRoute.name === 'More' && selectedOption !== null) {
        setSelectedOption(null);
      }
    });

    return () => {
      stateListener();
      tabPressListener();
    };
  }, [navigation, selectedOption]);

  // Get options list
  const moreOptions = React.useMemo(() => {
    return getMoreOptions();
  }, []);

  // Group options by section
  const groupedOptions = React.useMemo(() => {
    const groups: { [key: string]: MoreOption[] } = {};
    moreOptions.forEach(option => {
      if (!groups[option.section]) {
        groups[option.section] = [];
      }
      groups[option.section].push(option);
    });
    return groups;
  }, [moreOptions]);

  const handleOptionPress = async (option: MoreOption) => {
    await Haptics.selectionAsync();

    // Handle different option types
    if (option.action === 'navigation' && option.navigationTarget) {
      navigation.navigate(option.navigationTarget as any);
    } else if (option.component) {
      setSelectedOption(option.id);
    }
  };

  const handleBackPress = async () => {
    await Haptics.selectionAsync();
    setSelectedOption(null);
  };

  // Render a single row in iOS style
  const renderRow = (option: MoreOption, isFirst: boolean, isLast: boolean) => (
    <TouchableOpacity
      key={option.id}
      testID={`more-menu-${option.id}`}
      style={[
        styles.row,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        !isLast && styles.rowWithSeparator,
      ]}
      onPress={() => handleOptionPress(option)}
      accessibilityRole="button"
      accessibilityLabel={option.accessibilityLabel}
      activeOpacity={0.6}
    >
      <View style={styles.rowIconContainer}>
        <Ionicons
          name={option.iconName}
          size={22}
          color={option.destructive ? colors.error : colors.textSecondary}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, option.destructive && styles.rowTitleDestructive]}>
          {option.title}
        </Text>
      </View>
      {/* Show badge for News row when there are unread articles */}
      {option.id === 'news' && <RowBadge count={unreadCount} />}
      {!option.destructive && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  // Render a section group
  const renderSection = (sectionName: string, options: MoreOption[]) => (
    <View key={sectionName} style={styles.section}>
      <Text style={styles.sectionHeader}>{sectionName.toUpperCase()}</Text>
      <View style={styles.sectionGroup}>
        {options.map((option, index) =>
          renderRow(option, index === 0, index === options.length - 1)
        )}
      </View>
    </View>
  );

  if (selectedOption) {
    const option = moreOptions.find(opt => opt.id === selectedOption);

    if (option && option.component) {
      const Component = option.component;

      // Full-bleed screens - pass onBack prop directly to component
      // These screens render edge-to-edge and handle their own back button positioning
      if (option.id === 'map' || option.id === 'weather' || option.id === 'entrants' || option.id === 'news' || option.id === 'discuss') {
        return (
          <View style={styles.container}>
            <Component onBack={handleBackPress} />
          </View>
        );
      }

      // Standard screens - render FloatingBackButton overlay with content below
      // Add top padding to push content below the back button (insets.top + 8 + 40 button + 8 spacing)
      return (
        <View style={styles.container}>
          <FloatingBackButton onPress={handleBackPress} />
          <View style={[styles.contentContainer, { paddingTop: insets.top + 56 }]}>
            <Component />
          </View>
        </View>
      );
    }
  }

  // Section order for consistent display
  const sectionOrder = ['Racing', 'Event', 'App'];

  return (
    <View style={styles.container}>
      {/* iOS-style large title header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <IOSText textStyle="title1" weight="bold" style={styles.headerTitle}>
            More
          </IOSText>
          <ProfileButton size={36} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sectionOrder.map(sectionName => {
          const sectionOptions = groupedOptions[sectionName];
          if (!sectionOptions || sectionOptions.length === 0) return null;
          return renderSection(sectionName, sectionOptions);
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface, // iOS grouped list background
  },
  // Main header with large title
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text,
  },
  contentContainer: {
    flex: 1,
  },
  // Scroll container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  // Section styles (iOS grouped list)
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: -0.08,
    marginBottom: 8,
    marginLeft: 32,
  },
  sectionGroup: {
    marginHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 10,
    overflow: 'hidden',
  },
  // Row styles (iOS list row)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 11,
    paddingLeft: 16,
    paddingRight: 16,
    minHeight: 44, // iOS standard row height
  },
  rowFirst: {
    // First row in section
  },
  rowLast: {
    // Last row in section
  },
  rowWithSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIconContainer: {
    width: 29,
    alignItems: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: -0.4,
  },
  rowTitleDestructive: {
    color: colors.error,
  },
  rowBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  rowBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});