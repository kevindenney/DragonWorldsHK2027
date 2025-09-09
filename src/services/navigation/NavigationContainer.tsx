import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types/navigation';
import { TabNavigator } from './TabNavigator';
import { SplashScreen } from '../../screens/SplashScreen';
import { OnboardingScreen } from '../../screens/OnboardingScreen';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { RegisterScreen } from '../../screens/auth/RegisterScreen';
import { useAuth } from '../../hooks/useAuth';
import { useUserStore, useNeedsOnboarding } from '../../stores/userStore';
import type { UserType, UserProfile } from '../../types';

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigationContainer() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, isInitialized } = useAuth();
  const needsOnboarding = useNeedsOnboarding();
  const completeOnboarding = useUserStore(state => state.completeOnboarding);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Handle onboarding completion
  const handleOnboardingComplete = (userType: UserType, profile: Partial<UserProfile>) => {
    completeOnboarding(userType, profile);
  };

  // Show splash screen first or while auth is initializing
  if (showSplash || !isInitialized) {
    return <SplashScreen onSplashComplete={handleSplashComplete} />;
  }

  // Show authentication screens if not authenticated
  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ headerShown: false }}
          initialRouteName="Login"
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Show onboarding if needed
  if (needsOnboarding) {
    return (
      <OnboardingScreen onComplete={handleOnboardingComplete} />
    );
  }

  // Show main app navigation
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        {/* Add other stack screens here as needed */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}