import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Anchor, Calendar, Trophy, FileText, MoreHorizontal } from 'lucide-react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { MainTabParamList } from '../../types/navigation';

// Add screen loading logging
console.log('🔍 [TabNavigator] Starting to import screens...');

import { MapScreen } from '../../screens/MapScreen';
import { ScheduleScreen } from '../../screens/tabs/ScheduleScreen';
import { ResultsStackNavigator } from './ResultsStackNavigator';
import { NoticesScreen } from '../../screens/tabs/NoticesScreen';
import { MoreStackNavigator } from './MoreStackNavigator';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';

console.log('✅ [TabNavigator] All screens imported (using ScheduleScreen)');

const Tab = createBottomTabNavigator<MainTabParamList>();

const { colors, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;

export function TabNavigator() {
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
    console.log(`📱 [TabNavigator] Tab pressed: ${tabName || 'unknown'}`);
    await Haptics.selectionAsync();
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let IconComponent;
          const iconSize = focused ? size + 2 : size;
          
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
            case 'Map':
              IconComponent = Anchor;
              break;
            case 'More':
              IconComponent = MoreHorizontal;
              break;
            default:
              IconComponent = Calendar;
          }
          
          const iconElement = (
            <IconComponent 
              color={color} 
              size={iconSize} 
              strokeWidth={focused ? 2.5 : 2}
              fill={focused ? color : 'transparent'}
            />
          );

          if (focused) {
            return (
              <View style={{
                backgroundColor: `${colors.primary}15`,
                borderRadius: borderRadius.round,
                paddingHorizontal: 16,
                paddingVertical: 8,
                minWidth: 64,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {iconElement}
              </View>
            );
          }
          
          return iconElement;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: `${colors.surface}F5`,
          borderTopColor: colors.borderLight,
          borderTopWidth: 0.5,
          height: spacing.tabHeight - 10,
          paddingBottom: 8,
          paddingTop: 6,
          paddingHorizontal: 8,
          ...shadows.tabBar,
          elevation: 8,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          marginHorizontal: 2,
          borderRadius: borderRadius.md,
          minHeight: 40,
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