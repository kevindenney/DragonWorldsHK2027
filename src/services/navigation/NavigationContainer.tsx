import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SplashScreen } from '../../screens/SplashScreen';
import { EnhancedLoginScreen } from '../../screens/auth/EnhancedLoginScreen';
import { EnhancedRegisterScreen } from '../../screens/auth/EnhancedRegisterScreen';
import { ForgotPasswordScreen } from '../../screens/auth/ForgotPasswordScreen';
import { ProfileScreen } from '../../screens/ProfileScreen';
// CompetitorDetail is now nested under the Results stack so we do not import it here
import { DocumentViewer } from '../../components/noticeBoard/DocumentViewer';
import { EntryList } from '../../components/noticeBoard/EntryListCard';
import { AuthProvider } from '../../auth/AuthProvider';
import { useAuth } from '../../auth/useAuth';
import { TabNavigator } from './TabNavigator';

const Stack = createStackNavigator();

// Main authenticated app with stack navigation for Notice Board screens
const MainApp = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
      {/** Detail screens within tab stacks should not be declared here to preserve the tab bar */}
      <Stack.Screen 
        name="DocumentViewer" 
        component={DocumentViewer}
      />
      <Stack.Screen 
        name="EntryList" 
        component={EntryList}
      />
    </Stack.Navigator>
  );
};

// Authentication stack navigator
const AuthStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="Login"
  >
    <Stack.Screen name="Login" component={EnhancedLoginScreen} />
    <Stack.Screen name="Register" component={EnhancedRegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// App content with minimal auth friction for racing app
const AppContent = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  
  // Handle splash screen completion
  const handleSplashComplete = () => {
    console.log('🎬 Splash screen completed');
    setShowSplash(false);
  };
  
  // Development mode auto-bypass splash timeout
  useEffect(() => {
    if (__DEV__ && showSplash) {
      const devBypassTimer = setTimeout(() => {
        console.log('🚀 Dev Mode - Auto-bypassing splash screen');
        setShowSplash(false);
      }, 2000); // Reduced to 2 seconds

      return () => clearTimeout(devBypassTimer);
    }
  }, []); // Only run once on mount
  
  // Show splash screen first
  if (showSplash || !isInitialized) {
    return <SplashScreen onSplashComplete={handleSplashComplete} />;
  }
  
  // For racing app: Allow guest access to all features
  // Users can optionally authenticate for personalized features
  // Skip auth requirement for core functionality
  const skipAuthForRacing = true; // Set to false if auth is required
  
  if (!skipAuthForRacing && !isAuthenticated) {
    return <AuthStack />;
  }
  
  // Show main app with guest/authenticated access
  return <MainApp />;
};

export function AppNavigationContainer() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
}

