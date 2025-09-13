import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Anchor, Calendar, Trophy, FileText, MoreHorizontal } from 'lucide-react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { MainTabParamList } from '../../types/navigation';
import { MapScreen } from '../../screens/MapScreen';
import { ScheduleScreen } from '../../screens/tabs/ScheduleScreen';
import { ResultsStackNavigator } from './ResultsStackNavigator';
import { NoticeBoardScreen } from '../../screens/NoticeBoardScreen';
import { MoreScreen } from '../../screens/tabs/MoreScreen';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const { colors, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;

export function TabNavigator() {
  const handleTabPress = async () => {
    await Haptics.selectionAsync();
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let IconComponent;
          const iconSize = focused ? size + 2 : size;
          
          switch (route.name) {
            case 'Map':
              IconComponent = Anchor;
              break;
            case 'Schedule':
              IconComponent = Calendar;
              break;
            case 'Results':
              IconComponent = Trophy;
              break;
            case 'NoticeBoard':
              IconComponent = FileText;
              break;
            case 'More':
              IconComponent = MoreHorizontal;
              break;
            default:
              IconComponent = Anchor;
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
          height: spacing.tabHeight + 8,
          paddingBottom: 16,
          paddingTop: 12,
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
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
          marginHorizontal: 2,
          borderRadius: borderRadius.md,
          minHeight: 48,
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
                await handleTabPress();
                onPress?.();
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarAccessibilityLabel: 'Interactive sailing locations and race course map',
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarAccessibilityLabel: 'Race schedule and timing',
        }}
      />
      <Tab.Screen 
        name="Results" 
        component={ResultsStackNavigator}
        options={{
          tabBarLabel: 'Results',
          tabBarAccessibilityLabel: 'Championship standings and results',
        }}
      />
      <Tab.Screen 
        name="NoticeBoard" 
        component={NoticeBoardScreen}
        options={{
          tabBarLabel: 'Notices',
          tabBarAccessibilityLabel: 'Official notices and documents',
        }}
        initialParams={{ eventId: 'dragon-worlds-2027' }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarAccessibilityLabel: 'Additional features and tools including Social and Weather',
        }}
      />
    </Tab.Navigator>
  );
}