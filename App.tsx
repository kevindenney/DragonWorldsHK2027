import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigationContainer } from './src/services/navigation/NavigationContainer';
import { Text, View, StyleSheet } from 'react-native';
import { validateRuntimeConfiguration, logEnvironmentVariables } from './src/utils/configValidator';
import { useUserStore } from './src/stores/userStore';
import { useTrackUnreadNews } from './src/services/api/newsApi';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Keep the splash screen visible while we fetch resources
console.log('🚀 [App.tsx] Preventing splash screen auto-hide');
SplashScreen.preventAutoHideAsync()
  .then(() => console.log('✅ [App.tsx] Splash screen auto-hide prevented'))
  .catch((error) => console.warn('⚠️ [App.tsx] Error preventing splash screen auto-hide:', error));

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Application Error:', error.message);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Application Error</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Unknown error occurred'}
          </Text>
          <Text style={styles.errorDetails}>
            Check console for detailed error information
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);
  const needsOnboarding = useUserStore(state => state.needsOnboarding);

  React.useEffect(() => {
    async function prepare() {
      try {
        console.log('🔄 [App.tsx] Preparing app resources...');
        console.log(`📋 [App.tsx] User needs onboarding: ${needsOnboarding}`);

        // Run comprehensive configuration validation
        console.log('🔍 [App.tsx] Running configuration validation...');
        if (__DEV__) {
          logEnvironmentVariables();
          const configResult = validateRuntimeConfiguration();

          if (!configResult.isValid) {
            console.error('❌ [App.tsx] Configuration validation failed!');
            console.error('Errors:', configResult.errors);
          } else {
            console.log('✅ [App.tsx] Configuration validation passed');
          }
        }

        // Calendar module test removed from startup to prevent app hanging
        // Test will be performed when user attempts to use calendar feature

        console.log('🚀 [App.tsx] Basic app preparation complete');
        setAppIsReady(true);
      } catch (e) {
        console.warn('⚠️ [App.tsx] Error during app preparation:', e);
        // Even if there's an error, we should continue
        setAppIsReady(true);
      }
    }

    prepare();
  }, [needsOnboarding]);

  if (!appIsReady) {
    console.log('⏳ [App.tsx] App not ready yet, keeping splash screen visible');
    return null;
  }

  console.log('🚀 [App.tsx] App is ready, rendering main content');
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NewsUnreadTracker />
          <AppNavigationContainer />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Component to track unread news and update badge count
function NewsUnreadTracker() {
  useTrackUnreadNews();
  return null;
}
