import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigationContainer } from './src/services/navigation/NavigationContainer';

export default function App() {
  console.log('🏁 Main App function called');
  return (
    <SafeAreaProvider>
      <AppNavigationContainer />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
