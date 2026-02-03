import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../types/navigation';
import { TabBarVisibilityProvider } from '../../contexts/TabBarVisibilityContext';
import { FloatingTabBar } from '../../components/navigation/FloatingTabBar';
import { useWalkthroughStore, type WalkthroughSequence } from '../../stores/walkthroughStore';

// Add screen loading logging

import { ScheduleScreen } from '../../screens/tabs/ScheduleScreen';
import { NoticesScreen } from '../../screens/tabs/NoticesScreen';
import { ResultsStackNavigator } from './ResultsStackNavigator';
import { RaceFormsScreen } from '../../screens/tabs/RaceFormsScreen';
import { MoreStackNavigator } from './MoreStackNavigator';


const Tab = createBottomTabNavigator<MainTabParamList>();

function TabNavigatorContent() {
  const renderCountRef = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());
  const { startSequence, shouldShowSequence } = useWalkthroughStore();

  renderCountRef.current += 1;
  const currentTime = Date.now();
  const timeSinceLastRender = currentTime - lastRenderTime.current;
  lastRenderTime.current = currentTime;

  // Create walkthrough trigger for each tab
  const triggerWalkthrough = useCallback((sequence: WalkthroughSequence) => {
    // Small delay to allow screen to render and measure targets
    setTimeout(() => {
      if (shouldShowSequence(sequence)) {
        startSequence(sequence);
      }
    }, 500);
  }, [startSequence, shouldShowSequence]);

  React.useEffect(() => {
    return () => {
    };
  }, []);

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        listeners={{
          focus: () => {
            console.log('[Tab] Schedule screen focused');
            triggerWalkthrough('schedule');
          },
          blur: () => console.log('[Tab] Schedule screen blurred'),
        }}
      />
      <Tab.Screen
        name="NoticeBoard"
        component={NoticesScreen}
        initialParams={{ eventId: 'dragon-worlds-2027' }}
        listeners={{
          focus: () => {
            console.log('[Tab] NoticeBoard screen focused');
            triggerWalkthrough('notices');
          },
          blur: () => console.log('[Tab] NoticeBoard screen blurred'),
        }}
      />
      <Tab.Screen
        name="Results"
        component={ResultsStackNavigator}
        listeners={{
          focus: () => {
            console.log('[Tab] Results screen focused');
            triggerWalkthrough('results');
          },
          blur: () => console.log('[Tab] Results screen blurred'),
        }}
      />
      <Tab.Screen
        name="Forms"
        component={RaceFormsScreen}
        listeners={{
          focus: () => {
            console.log('[Tab] Forms screen focused');
            triggerWalkthrough('forms');
          },
          blur: () => console.log('[Tab] Forms screen blurred'),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        listeners={{
          focus: () => {
            console.log('[Tab] More screen focused');
            triggerWalkthrough('more');
          },
          blur: () => console.log('[Tab] More screen blurred'),
        }}
      />
    </Tab.Navigator>
  );
}

export function TabNavigator() {
  return (
    <TabBarVisibilityProvider>
      <TabNavigatorContent />
    </TabBarVisibilityProvider>
  );
}
