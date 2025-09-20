import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MoreScreen } from '../../screens/tabs/MoreScreen';
import { ProfileScreen } from '../../screens/ProfileScreen';

type MoreStackParamList = {
  MoreHome: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<MoreStackParamList>();

export function MoreStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}