import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Activity, Cloud, MapPin, Calendar, Users, Settings } from 'lucide-react-native';
import type { MainTabParamList } from '../../types/navigation';
import { 
  LiveScreen, 
  WeatherScreen, 
  ScheduleScreen, 
  SocialScreen, 
  ServicesScreen 
} from '../../screens/tabs';
import { MapScreen } from '../../screens/MapScreen';
import { colors, components } from '../../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let IconComponent;
          
          switch (route.name) {
            case 'Live':
              IconComponent = Activity;
              break;
            case 'Weather':
              IconComponent = Cloud;
              break;
            case 'Map':
              IconComponent = MapPin;
              break;
            case 'Schedule':
              IconComponent = Calendar;
              break;
            case 'Social':
              IconComponent = Users;
              break;
            case 'Services':
              IconComponent = Settings;
              break;
            default:
              IconComponent = Activity;
          }
          
          return <IconComponent color={color} size={size} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: components.tab.height,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
        tabBarShowLabel: true,
      })}
    >
      <Tab.Screen 
        name="Live" 
        component={LiveScreen}
        options={{
          tabBarLabel: 'Live',
        }}
      />
      <Tab.Screen 
        name="Weather" 
        component={WeatherScreen}
        options={{
          tabBarLabel: 'Weather',
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen 
        name="Social" 
        component={SocialScreen}
        options={{
          tabBarLabel: 'Social',
        }}
      />
      <Tab.Screen 
        name="Services" 
        component={ServicesScreen}
        options={{
          tabBarLabel: 'Services',
        }}
      />
    </Tab.Navigator>
  );
}