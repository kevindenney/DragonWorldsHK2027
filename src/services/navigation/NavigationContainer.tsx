import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import { SimpleLoginScreen } from '../../screens/auth/SimpleLoginScreen';
import { SimpleRegisterScreen } from '../../screens/auth/SimpleRegisterScreen';
import { SimplePasswordResetScreen } from '../../screens/auth/SimplePasswordResetScreen';
import { UnifiedAuthScreen } from '../../screens/auth/UnifiedAuthScreen';
import { UnifiedEmailAuthScreen } from '../../screens/auth/UnifiedEmailAuthScreen';
// CompetitorDetail is now nested under the Results stack so we do not import it here
import { DocumentViewer } from '../../components/noticeBoard/DocumentViewer';
import { NotificationDetail } from '../../components/noticeBoard/NotificationDetail';
import { EntryList } from '../../components/noticeBoard/EntryListCard';
import { ProfileScreen } from '../../screens/ProfileScreen';
import { MapScreen } from '../../screens/MapScreen';
import { AuthProvider } from '../../auth/AuthProvider';
import { useAuth } from '../../auth/useAuth';
import { TabNavigator } from './TabNavigator';
import { WelcomeScreen, FeatureTourScreen, GuestModeScreen, OnboardingScreen, AccountCreationScreen } from '../../screens/onboarding';
import { useUserStore } from '../../stores/userStore';

const Stack = createStackNavigator();

// Onboarding Navigator for first-time users
const OnboardingNavigator = () => {
  const [currentStep, setCurrentStep] = React.useState<'welcome' | 'email'>('welcome');
  const { completeOnboarding, setUserType, setSelectedOnboardingType } = useUserStore();
  const { isAuthenticated, user, logout } = useAuth();

  // Track if we've cleared stale session and if user has freshly authenticated
  const hasCleared = React.useRef(false);
  const [readyForAuth, setReadyForAuth] = React.useState(false);

  // On mount: Clear any existing Firebase session to ensure clean slate
  // User must explicitly login/signup to proceed
  React.useEffect(() => {
    const clearStaleSession = async () => {
      if (!hasCleared.current) {
        hasCleared.current = true;
        // If there's an existing session, sign out to ensure clean onboarding
        if (isAuthenticated) {
          console.log('[OnboardingNavigator] Clearing stale auth session for clean onboarding');
          try {
            await logout();
          } catch (e) {
            // Ignore logout errors
          }
        }
        // Now ready to accept fresh authentication
        setReadyForAuth(true);
      }
    };
    clearStaleSession();
  }, []);

  // Only complete onboarding after user FRESHLY authenticates (after we cleared stale session)
  React.useEffect(() => {
    if (readyForAuth && isAuthenticated && user) {
      console.log('[OnboardingNavigator] Fresh authentication detected, completing onboarding');
      completeOnboarding('spectator', {
        onboardingType: 'spectator',
        needsVerification: false,
        joinedAt: new Date().toISOString(),
        displayName: user.displayName || user.email || 'User',
        email: user.email || '',
      });
    }
  }, [readyForAuth, isAuthenticated, user, completeOnboarding]);

  const handleEmailContinue = () => {
    setCurrentStep('email');
  };

  const handleEmailBack = () => {
    setCurrentStep('welcome');
  };

  switch (currentStep) {
    case 'welcome':
      return (
        <WelcomeScreen
          onContinue={handleEmailContinue}
        />
      );

    case 'email':
      return (
        <UnifiedEmailAuthScreen
          navigation={{
            goBack: handleEmailBack,
            navigate: (routeName: string) => {
              if (routeName === 'ForgotPassword') {
                // For now, go back to welcome - can add password reset later
                setCurrentStep('welcome');
              }
            },
            canGoBack: () => true,
            reset: () => {}
          }}
        />
      );

    default:
      return (
        <WelcomeScreen
          onContinue={handleEmailContinue}
        />
      );
  }
};

// Main authenticated app with stack navigation for Notice Board screens
const MainApp = () => {

  React.useEffect(() => {
    return () => {
    };
  }, []);

  try {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
        />
      {/* Auth screens - accessible from More tab and within app flow */}
      <Stack.Screen
        name="UnifiedAuth"
        component={UnifiedAuthScreen}
        options={{
          headerShown: false,
          presentation: 'modal'
        }}
      />
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
        name="NotificationDetail"
        component={NotificationDetail}
      />
      <Stack.Screen
        name="EntryList"
        component={EntryList}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          presentation: 'card'
        }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{
          headerShown: false,
          presentation: 'card'
        }}
      />
    </Stack.Navigator>
    );
  } catch (error) {
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


  React.useEffect(() => {
    return () => {
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
      authStateRef.current = { isAuthenticated, isInitialized };
    } else {
    }

    if (onboardingChanged) {
      onboardingStateRef.current = { needsOnboarding };
    } else {
    }

    // Hide splash screen when auth is initialized
    React.useEffect(() => {
      async function hideSplash() {
        if (isInitialized) {
          try {
            await SplashScreen.hideAsync();
          } catch (error) {
          }
        }
      }
      hideSplash();
    }, [isInitialized]);

    // Wait for auth initialization
    if (!isInitialized) {
      return null; // Splash screen will remain visible until isInitialized is true
    }

    // Require authentication - users must sign in or sign up to use the app
    // Show onboarding/auth flow if:
    // 1. User needs onboarding (first-time user)
    // 2. User is not authenticated (logged out or never signed in)
    if (needsOnboarding || !isAuthenticated) {
      return <OnboardingNavigator />;
    }

    // Only show main app when user is authenticated
    return <MainApp />;
  } catch (error) {
    throw error;
  }
};

export function AppNavigationContainer() {

  try {

    // React Navigation state change listener
    const onNavigationStateChange = React.useCallback((state: any) => {
    }, []);

    // Navigation ready listener
    const onNavigationReady = React.useCallback(() => {
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
    throw error;
  }
}

