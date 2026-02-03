import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Calendar,
  FileText,
  Trophy,
  ClipboardList,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useWalkthroughStore } from '../../stores/walkthroughStore';
// Tab bar stays always visible per Apple HIG - no visibility context needed

interface TabConfig {
  name: string;
  label: string;
  icon: LucideIcon;
  accessibilityLabel: string;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  Schedule: {
    name: 'Schedule',
    label: 'Schedule',
    icon: Calendar,
    accessibilityLabel: 'Race schedule and timing',
  },
  NoticeBoard: {
    name: 'NoticeBoard',
    label: 'Notices',
    icon: FileText,
    accessibilityLabel: 'Official notices and documents',
  },
  Results: {
    name: 'Results',
    label: 'Results',
    icon: Trophy,
    accessibilityLabel: 'Championship standings and results',
  },
  Forms: {
    name: 'Forms',
    label: 'Forms',
    icon: ClipboardList,
    accessibilityLabel: 'Official race forms including protests, scoring inquiries, and more',
  },
  More: {
    name: 'More',
    label: 'More',
    icon: MoreHorizontal,
    accessibilityLabel: 'Additional features and tools including Entrants, Map, Weather, and more',
  },
};

// Design tokens from RegattaFlow spec - High contrast version
const COLORS = {
  active: '#007AFF',
  inactive: '#6B7280',
  background: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.08)',
  shadow: '#000000',
};

const DIMENSIONS = {
  tabBarHeight: 64,
  borderRadius: 32,
  iconSize: 24,
  horizontalMargin: 16,
  bottomOffset: 20,
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const moreTabRef = useRef<View>(null);
  const { registerTarget, unregisterTarget } = useWalkthroughStore();

  // Register More tab as walkthrough target
  useEffect(() => {
    registerTarget('tab-bar-more', moreTabRef);
    return () => {
      unregisterTarget('tab-bar-more');
    };
  }, [registerTarget, unregisterTarget]);

  const handleTabPress = async (
    routeName: string,
    isFocused: boolean,
    target: string | undefined
  ) => {
    // Haptic feedback on press
    await Haptics.selectionAsync();

    const event = navigation.emit({
      type: 'tabPress',
      target,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const handleTabLongPress = (target: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.emit({
      type: 'tabLongPress',
      target,
    });
  };

  const bottomPosition = Math.max(insets.bottom, DIMENSIONS.bottomOffset);

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomPosition,
        },
      ]}
    >
      <View style={styles.tabBarBackground}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIGS[route.name];

          if (!config) {
            return null;
          }

          const IconComponent = config.icon;
          const color = isFocused ? COLORS.active : COLORS.inactive;

          // Add ref to More tab for walkthrough highlighting
          const isMoreTab = route.name === 'More';

          const tabContent = (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={config.accessibilityLabel}
              testID={`tab-${route.name.toLowerCase()}`}
              onPress={() =>
                handleTabPress(
                  route.name,
                  isFocused,
                  route.key
                )
              }
              onLongPress={() => handleTabLongPress(route.key)}
              style={styles.tabButton}
            >
              <View style={styles.tabContent}>
                <IconComponent
                  color={color}
                  size={DIMENSIONS.iconSize}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color },
                    isFocused && styles.tabLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </View>
            </TouchableOpacity>
          );

          // Wrap More tab in a View with ref for walkthrough
          if (isMoreTab) {
            return (
              <View
                key={route.key}
                ref={moreTabRef}
                collapsable={false}
                style={styles.tabWrapper}
              >
                {tabContent}
              </View>
            );
          }

          return <View key={route.key} style={styles.tabWrapper}>{tabContent}</View>;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: DIMENSIONS.horizontalMargin,
    right: DIMENSIONS.horizontalMargin,
    alignItems: 'center',
    zIndex: 100,
  },
  tabBarBackground: {
    flexDirection: 'row',
    height: DIMENSIONS.tabBarHeight,
    backgroundColor: COLORS.background,
    borderRadius: DIMENSIONS.borderRadius,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.border,
    // Stronger iOS shadow for more contrast
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabLabelActive: {
    fontWeight: '600',
  },
  tabWrapper: {
    flex: 1,
  },
});

export default FloatingTabBar;
