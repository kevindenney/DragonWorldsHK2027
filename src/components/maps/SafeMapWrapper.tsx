import React, { Component, Suspense, lazy } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

// Dynamically import map components to isolate them from main bundle
const LazyMapScreen = lazy(() =>
  import('../../screens/MapScreenSafe').then(module => ({
    default: module.MapScreen
  })).catch(error => {
    console.warn('Failed to load MapScreen:', error);
    return { default: MapFallback };
  })
);

const LazyModernWeatherMapScreen = lazy(() =>
  import('../../screens/tabs/ModernWeatherMapScreen').then(module => ({
    default: module.ModernWeatherMapScreen
  })).catch(error => {
    console.warn('Failed to load ModernWeatherMapScreen:', error);
    return { default: WeatherMapFallback };
  })
);

interface SafeMapWrapperState {
  hasError: boolean;
  error?: Error;
}

interface SafeMapWrapperProps {
  mapType: 'navigation' | 'weather';
  navigation?: any;
  fallbackMessage?: string;
  onRetry?: () => void;
}

// Error Boundary for Map Components
class SafeMapWrapper extends Component<SafeMapWrapperProps, SafeMapWrapperState> {
  constructor(props: SafeMapWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SafeMapWrapperState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Map component error caught by SafeMapWrapper:', error, errorInfo);

    // Log specific Hermes/deriveBFS errors
    if (error.message?.includes('distance') || error.message?.includes('deriveBFS')) {
      console.error('🚨 Hermes/deriveBFS error detected in map component:', error.message);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const isHermesError = this.state.error?.message?.includes('distance') ||
                           this.state.error?.message?.includes('deriveBFS');

      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>
            {isHermesError ? 'Map Temporarily Unavailable' : 'Map Error'}
          </Text>
          <Text style={styles.errorMessage}>
            {isHermesError
              ? 'Map functionality is being optimized for better performance.'
              : this.props.fallbackMessage || 'Unable to load map component.'
            }
          </Text>
          {!isHermesError && (
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <RefreshCw size={16} color="#007AFF" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <Suspense fallback={<MapLoadingFallback />}>
        {this.props.mapType === 'navigation' ? (
          <LazyMapScreen navigation={this.props.navigation} />
        ) : (
          <LazyModernWeatherMapScreen navigation={this.props.navigation} />
        )}
      </Suspense>
    );
  }
}

// Loading fallback
const MapLoadingFallback: React.FC = () => (
  <View style={styles.loadingContainer}>
    <RefreshCw size={32} color="#007AFF" />
    <Text style={styles.loadingText}>Loading Map...</Text>
  </View>
);

// Fallback component for failed navigation map
const MapFallback: React.FC<{ navigation?: any }> = ({ navigation }) => (
  <View style={styles.fallbackContainer}>
    <AlertTriangle size={32} color="#FF9500" />
    <Text style={styles.fallbackTitle}>Navigation Map Unavailable</Text>
    <Text style={styles.fallbackMessage}>
      Map functionality is currently being optimized.
      Please use the other tabs for race information.
    </Text>
  </View>
);

// Fallback component for failed weather map
const WeatherMapFallback: React.FC<{ navigation?: any }> = ({ navigation }) => (
  <View style={styles.fallbackContainer}>
    <AlertTriangle size={32} color="#FF9500" />
    <Text style={styles.fallbackTitle}>Weather Map Unavailable</Text>
    <Text style={styles.fallbackMessage}>
      Weather map is being optimized. Weather data is still available through other features.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F2F2F7',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  retryText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F2F2F7',
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackMessage: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SafeMapWrapper;