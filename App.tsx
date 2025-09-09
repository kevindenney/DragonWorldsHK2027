import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProviders, AppNavigationContainer, setupNotifications } from './src';

export default function App() {
  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <AppProviders>
      <AppNavigationContainer />
      <StatusBar style="auto" />
    </AppProviders>
  );
}
