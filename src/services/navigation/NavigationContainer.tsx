import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SimpleLoginScreen } from '../../screens/auth/SimpleLoginScreen';
import { SimpleRegisterScreen } from '../../screens/auth/SimpleRegisterScreen';
import { SimplePasswordResetScreen } from '../../screens/auth/SimplePasswordResetScreen';
import { ProfileScreen } from '../../screens/ProfileScreen';
// CompetitorDetail is now nested under the Results stack so we do not import it here
import { DocumentViewer } from '../../components/noticeBoard/DocumentViewer';
import { EntryList } from '../../components/noticeBoard/EntryListCard';
import { AuthProvider } from '../../auth/AuthProvider';
import { useAuth } from '../../auth/useAuth';
import { TabNavigator } from './TabNavigator';
import { WelcomeScreen, FeatureTourScreen, GuestModeScreen, OnboardingScreen } from '../../screens/onboarding';
import { useUserStore } from '../../stores/userStore';

const Stack = createStackNavigator();

// Onboarding Navigator for first-time users
const OnboardingNavigator = () => {
  const [currentStep, setCurrentStep] = React.useState<'welcome' | 'tour' | 'choice' | 'userType'>('welcome');
  const { completeOnboarding, setUserType } = useUserStore();

  console.log('📋 [OnboardingNavigator] Current step:', currentStep);

  const handleWelcomeContinue = () => {
    console.log('📋 [OnboardingNavigator] Welcome continue -> tour');
    setCurrentStep('tour');
  };

  const handleWelcomeSkip = () => {
    console.log('📋 [OnboardingNavigator] Welcome skip -> main app as guest');
    completeOnboarding('spectator', {
      onboardingType: 'spectator',
      needsVerification: false,
      joinedAt: new Date().toISOString(),
    });
  };

  const handleTourContinue = () => {
    console.log('📋 [OnboardingNavigator] Tour continue -> choice');
    setCurrentStep('choice');
  };

  const handleTourBack = () => {
    console.log('📋 [OnboardingNavigator] Tour back -> welcome');
    setCurrentStep('welcome');
  };

  const handleTourSkip = () => {
    console.log('📋 [OnboardingNavigator] Tour skip -> main app as guest');
    completeOnboarding('spectator', {
      onboardingType: 'spectator',
      needsVerification: false,
      joinedAt: new Date().toISOString(),
    });
  };

  const handleCreateAccount = () => {
    console.log('📋 [OnboardingNavigator] Create account -> user type selection');
    setCurrentStep('userType');
  };

  const handleSignIn = () => {
    console.log('📋 [OnboardingNavigator] Sign in -> login screen');
    // This will be handled by auth system
  };

  const handleContinueAsGuest = () => {
    console.log('📋 [OnboardingNavigator] Continue as guest -> main app');
    completeOnboarding('spectator', {
      onboardingType: 'spectator',
      needsVerification: false,
      joinedAt: new Date().toISOString(),
    });
  };

  const handleChoiceBack = () => {
    console.log('📋 [OnboardingNavigator] Choice back -> tour');
    setCurrentStep('tour');
  };

  const handleUserTypeComplete = (userType: any, profile: any) => {
    console.log('📋 [OnboardingNavigator] User type complete:', userType, profile);
    completeOnboarding(userType, profile);
  };

  switch (currentStep) {
    case 'welcome':
      return (
        <WelcomeScreen
          onContinue={handleWelcomeContinue}
          onSkip={handleWelcomeSkip}
        />
      );

    case 'tour':
      return (
        <FeatureTourScreen
          onContinue={handleTourContinue}
          onBack={handleTourBack}
          onSkip={handleTourSkip}
        />
      );

    case 'choice':
      return (
        <GuestModeScreen
          onCreateAccount={handleCreateAccount}
          onSignIn={handleSignIn}
          onContinueAsGuest={handleContinueAsGuest}
          onBack={handleChoiceBack}
        />
      );

    case 'userType':
      return (
        <OnboardingScreen
          onComplete={handleUserTypeComplete}
        />
      );

    default:
      return (
        <WelcomeScreen
          onContinue={handleWelcomeContinue}
          onSkip={handleWelcomeSkip}
        />
      );
  }
};

// Main authenticated app with stack navigation for Notice Board screens
const MainApp = () => {
  console.log('🚀 [NavigationContainer] Rendering MainApp component');

  React.useEffect(() => {
    console.log('📱 [MainApp] Component mounted');
    return () => {
      console.log('📱 [MainApp] Component unmounted');
    };
  }, []);

  try {
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
      {/* Auth screens - accessible from More tab and within app flow */}
      <Stack.Screen
        name="Login"
        component={SimpleLoginScreen}
        options={{
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="Register"
        component={SimpleRegisterScreen}
        options={{
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={SimplePasswordResetScreen}
        options={{
          headerShown: false,
          presentation: 'modal'
        }}
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
  } catch (error) {
    console.error('💥 [NavigationContainer] MainApp render error:', error);
    throw error;
  }
};

// Authentication stack navigator
const AuthStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="Login"
  >
    <Stack.Screen name="Login" component={SimpleLoginScreen} />
    <Stack.Screen name="Register" component={SimpleRegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={SimplePasswordResetScreen} />
  </Stack.Navigator>
);

// App content with minimal auth friction for racing app + onboarding flow
const AppContent = () => {
  const renderCountRef = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());
  const authStateRef = React.useRef({ isAuthenticated: false, isInitialized: false });
  const onboardingStateRef = React.useRef({ needsOnboarding: true });

  renderCountRef.current += 1;
  const currentTime = Date.now();
  const timeSinceLastRender = currentTime - lastRenderTime.current;
  lastRenderTime.current = currentTime;

  console.log(`🚀 [AppContent] Render #${renderCountRef.current} (${timeSinceLastRender}ms since last)`);

  React.useEffect(() => {
    console.log('📱 [AppContent] Component mounted');
    return () => {
      console.log('📱 [AppContent] Component unmounted');
    };
  }, []);

  try {
    const { isAuthenticated, isInitialized } = useAuth();
    const { needsOnboarding } = useUserStore();

    // Check if auth state actually changed
    const prevAuth = authStateRef.current;
    const authChanged = prevAuth.isAuthenticated !== isAuthenticated || prevAuth.isInitialized !== isInitialized;

    // Check if onboarding state changed
    const prevOnboarding = onboardingStateRef.current;
    const onboardingChanged = prevOnboarding.needsOnboarding !== needsOnboarding;

    if (authChanged) {
      console.log(`🔄 [AppContent] Auth state CHANGED:`, {
        from: prevAuth,
        to: { isAuthenticated, isInitialized },
        renderCount: renderCountRef.current
      });
      authStateRef.current = { isAuthenticated, isInitialized };
    } else {
      console.log(`📊 [AppContent] Auth state unchanged: ${JSON.stringify({ isAuthenticated, isInitialized })}`);
    }

    if (onboardingChanged) {
      console.log(`🔄 [AppContent] Onboarding state CHANGED:`, {
        from: prevOnboarding.needsOnboarding,
        to: needsOnboarding,
        renderCount: renderCountRef.current
      });
      onboardingStateRef.current = { needsOnboarding };
    } else {
      console.log(`📊 [AppContent] Onboarding state unchanged: needsOnboarding=${needsOnboarding}`);
    }

    // Wait for auth initialization
    if (!isInitialized) {
      console.log('🚀 [NavigationContainer] Auth not yet initialized, showing loading state');
      return null; // Let native splash screen handle the loading state
    }

    // Check if user needs onboarding first
    if (needsOnboarding) {
      console.log('🚀 [NavigationContainer] User needs onboarding, showing OnboardingNavigator');
      return <OnboardingNavigator />;
    }

    // Racing app strategy: Optional authentication
    // - Allow guest access to all core features (Schedule, Notices, Results, Map)
    // - Provide authentication for personalized features when needed
    // - Users can sign in/out from More tab at any time

    // Show main app - authentication is optional and accessible via More tab
    console.log('🚀 [NavigationContainer] Auth initialized and onboarding complete, rendering MainApp');
    return <MainApp />;
  } catch (error) {
    console.error('💥 [NavigationContainer] AppContent error:', error);
    throw error;
  }
};

export function AppNavigationContainer() {
  console.log('🚀 [NavigationContainer] Rendering AppNavigationContainer');

  try {
    console.log('🚀 [NavigationContainer] Testing AuthProvider with Hermes-compatible wrapper');
    console.log('🚀 [NavigationContainer] About to render AuthProvider');

    // React Navigation state change listener
    const onNavigationStateChange = React.useCallback((state: any) => {
      console.log('🧭 [Navigation] State changed:', {
        index: state?.index,
        routeNames: state?.routeNames,
        routes: state?.routes?.map((r: any) => ({ name: r.name, key: r.key })),
        timestamp: Date.now()
      });
    }, []);

    // Navigation ready listener
    const onNavigationReady = React.useCallback(() => {
      console.log('🧭 [Navigation] Navigation container ready');
    }, []);

    return (
      <AuthProvider>
        <NavigationContainer
          onStateChange={onNavigationStateChange}
          onReady={onNavigationReady}
        >
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    );
  } catch (error) {
    console.error('💥 [NavigationContainer] AppNavigationContainer render error:', error);
    console.error('💥 [NavigationContainer] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500)
    });
    throw error;
  }
}

