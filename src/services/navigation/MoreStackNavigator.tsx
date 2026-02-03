import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MoreScreen } from '../../screens/tabs/MoreScreen';
import { ProfileScreen } from '../../screens/ProfileScreen';
import { ShippingScreen } from '../../screens/tabs/ShippingScreen';
import { RaceFormsScreen } from '../../screens/tabs/RaceFormsScreen';

type MoreStackParamList = {
  MoreHome: undefined;
  Profile: undefined;
  Shipping: undefined;
  RaceForms: undefined;
};

const Stack = createStackNavigator<MoreStackParamList>();

export function MoreStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Shipping" component={ShippingScreen} />
      <Stack.Screen name="RaceForms" component={RaceFormsScreen} />
    </Stack.Navigator>
  );
}