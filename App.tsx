import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigationContainer } from './src/services/navigation/NavigationContainer';
import { Text, View, StyleSheet } from 'react-native';

class HermesErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.log('🚨 [HermesErrorBoundary] getDerivedStateFromError:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log('🚨 [HermesErrorBoundary] componentDidCatch:');
    console.log('Error:', error);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    console.log('Component stack:', errorInfo.componentStack);

    // Check if this is our specific Hermes error
    if (error.message.includes('property is not configurable')) {
      console.log('🎯 [HermesErrorBoundary] FOUND HERMES PROPERTY ERROR!');
      console.log('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 500), // First 500 chars of stack
      });
    }

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

// Add global error handler for uncaught errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorMessage = args.join(' ');
  if (errorMessage.includes('property is not configurable')) {
    console.log('🎯 [Global] CAUGHT HERMES ERROR in console.error:', errorMessage);
  }
  originalConsoleError(...args);
};

export default function App() {
  console.log('🚀 [App] Starting Dragon Worlds HK 2027 app...');

  // Hermes debugging is now initialized in index.ts before any imports

  React.useEffect(() => {
    console.log('🚀 [App] App component mounted');
  }, []);

  return (
    <HermesErrorBoundary>
      <SafeAreaProvider>
        <AppNavigationContainer />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </HermesErrorBoundary>
  );
}
