import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Anchor, Calendar, Trophy, FileText, Users, MoreHorizontal } from 'lucide-react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { MainTabParamList } from '../../types/navigation';

// Add screen loading logging
console.log('🔍 [TabNavigator] Starting to import screens...');

import { MapScreen } from '../../screens/MapScreen';
import { ScheduleScreen } from '../../screens/tabs/ScheduleScreen';
import { ResultsStackNavigator } from './ResultsStackNavigator';
import { NoticesScreen } from '../../screens/tabs/NoticesScreen';
import { EntrantsScreen } from '../../screens/tabs/EntrantsScreen';
import { MoreStackNavigator } from './MoreStackNavigator';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';

console.log('✅ [TabNavigator] All screens imported (using ScheduleScreen)');

const Tab = createBottomTabNavigator<MainTabParamList>();

const { colors, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const renderCountRef = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());

  renderCountRef.current += 1;
  const currentTime = Date.now();
  const timeSinceLastRender = currentTime - lastRenderTime.current;
  lastRenderTime.current = currentTime;

  console.log(`🚀 [TabNavigator] Render #${renderCountRef.current} (${timeSinceLastRender}ms since last)`);

  React.useEffect(() => {
    console.log('📱 [TabNavigator] Component mounted');
    return () => {
      console.log('📱 [TabNavigator] Component unmounted');
    };
  }, []);

  const handleTabPress = async (tabName?: string) => {
    console.log(`📱 [TabNavigator] 🎯 TAB PRESSED: ${tabName || 'unknown'}`, {
      tabName,
      timestamp: Date.now(),
      isMoreTab: tabName?.includes('More') || tabName?.includes('Additional features')
    });
    await Haptics.selectionAsync();
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let IconComponent;
          // Clean, consistent icon sizing - no size change on focus
          const iconSize = 24;

          switch (route.name) {
            case 'Schedule':
              IconComponent = Calendar;
              break;
            case 'NoticeBoard':
              IconComponent = FileText;
              break;
            case 'Results':
              IconComponent = Trophy;
              break;
            case 'Entrants':
              IconComponent = Users;
              break;
            case 'Map':
              IconComponent = Anchor;
              break;
            case 'More':
              IconComponent = MoreHorizontal;
              break;
            default:
              IconComponent = Calendar;
          }

          // Clean icon rendering - color-only state indication (no pill background)
          return (
            <IconComponent
              color={color}
              size={iconSize}
              strokeWidth={focused ? 2.5 : 2}
            />
          );
        },
        // Regatta Flow design: Blue active (#3B82F6), muted gray inactive (#6B7280)
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF', // Clean white background
          borderTopColor: '#E5E7EB', // Clean border
          borderTopWidth: 1,
          height: 56 + insets.bottom, // Cleaner height
          paddingBottom: insets.bottom, // Dynamic safe area padding
          paddingTop: 6,
          // Minimal shadow for cleaner look
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12, // Per spec: 12px
          fontWeight: '600', // Per spec: weight 600
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          marginHorizontal: 0,
        },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarButton: (props) => {
          const { onPress, ...otherProps } = props;
          return (
            <TouchableOpacity
              {...otherProps}
              onPress={async () => {
                await handleTabPress(props.accessibilityLabel);
                onPress?.();
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarAccessibilityLabel: 'Race schedule and timing',
        }}
        listeners={{
          focus: () => console.log('📋 [Tab] Schedule screen focused'),
          blur: () => console.log('📋 [Tab] Schedule screen blurred'),
        }}
      />
      <Tab.Screen
        name="NoticeBoard"
        component={NoticesScreen}
        options={{
          tabBarLabel: 'Notices',
          tabBarAccessibilityLabel: 'Official notices and documents',
        }}
        initialParams={{ eventId: 'dragon-worlds-2027' }}
        listeners={{
          focus: () => console.log('📋 [Tab] NoticeBoard screen focused'),
          blur: () => console.log('📋 [Tab] NoticeBoard screen blurred'),
        }}
      />
      <Tab.Screen
        name="Results"
        component={ResultsStackNavigator}
        options={{
          tabBarLabel: 'Results',
          tabBarAccessibilityLabel: 'Championship standings and results',
        }}
        listeners={{
          focus: () => console.log('📋 [Tab] Results screen focused'),
          blur: () => console.log('📋 [Tab] Results screen blurred'),
        }}
      />
      <Tab.Screen
        name="Entrants"
        component={EntrantsScreen}
        options={{
          tabBarLabel: 'Entrants',
          tabBarAccessibilityLabel: 'Event entrants and competitor registration status',
        }}
        listeners={{
          focus: () => console.log('📋 [Tab] Entrants screen focused'),
          blur: () => console.log('📋 [Tab] Entrants screen blurred'),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarAccessibilityLabel: 'Interactive sailing locations and race course map',
        }}
        listeners={{
          focus: () => console.log('📋 [Tab] Map screen focused'),
          blur: () => console.log('📋 [Tab] Map screen blurred'),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        options={{
          tabBarLabel: 'More',
          tabBarAccessibilityLabel: 'Additional features and tools including Social and Weather',
        }}
        listeners={{
          focus: () => console.log('📋 [Tab] More screen focused'),
          blur: () => console.log('📋 [Tab] More screen blurred'),
        }}
      />
    </Tab.Navigator>
  );
}