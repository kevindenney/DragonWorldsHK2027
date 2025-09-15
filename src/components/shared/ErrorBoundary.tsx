import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw, ArrowLeft, Bug } from 'lucide-react-native';
import { colors, typography, spacing, shadows } from '../../constants/theme';
import { errorHandler } from '../../services/errorHandler';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  showDetails?: boolean;
  testID?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to our error handling service
    errorHandler.logError({
      type: 'ui',
      severity: 'high',
      message: `React Error Boundary: ${error.message}`,
      source: 'error_boundary',
      context: {
        componentStack: errorInfo.componentStack,
        stack: error.stack,
      },
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return (
        <ErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId!}
          onRetry={this.retry}
          showDetails={this.props.showDetails}
          testID={this.props.testID}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  onRetry: () => void;
  showDetails?: boolean;
  testID?: string;
}

function ErrorFallback({ 
  error, 
  errorInfo, 
  errorId, 
  onRetry, 
  showDetails = false,
  testID 
}: ErrorFallbackProps) {
  const [showDetailedError, setShowDetailedError] = React.useState(showDetails);

  return (
    <View
      style={styles.container}
      testID={testID}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.errorCard}
        >
          <View style={styles.iconContainer}>
            <AlertTriangle color={colors.error} size={48} />
          </View>

          <Text style={styles.title}>Something went wrong</Text>
          
          <Text style={styles.message}>
            We're sorry, but something unexpected happened. 
            You can try refreshing or go back to continue using the app.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={onRetry}
              accessible={true}
              accessibilityLabel="Retry"
              accessibilityRole="button"
            >
              <RefreshCw color={colors.background} size={20} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => setShowDetailedError(!showDetailedError)}
              accessible={true}
              accessibilityLabel={showDetailedError ? "Hide details" : "Show details"}
              accessibilityRole="button"
            >
              <Bug color={colors.textMuted} size={16} />
              <Text style={styles.detailsButtonText}>
                {showDetailedError ? 'Hide Details' : 'Show Details'}
              </Text>
            </TouchableOpacity>
          </View>

          {showDetailedError && (
            <View
              style={styles.errorDetails}
            >
              <Text style={styles.errorId}>Error ID: {errorId}</Text>
              
              <View style={styles.errorSection}>
                <Text style={styles.sectionTitle}>Error:</Text>
                <Text style={styles.errorText}>{error.message}</Text>
              </View>

              {error.stack && (
                <View style={styles.errorSection}>
                  <Text style={styles.sectionTitle}>Stack Trace:</Text>
                  <ScrollView 
                    style={styles.stackContainer}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    <Text style={styles.stackText}>{error.stack}</Text>
                  </ScrollView>
                </View>
              )}

              {errorInfo?.componentStack && (
                <View style={styles.errorSection}>
                  <Text style={styles.sectionTitle}>Component Stack:</Text>
                  <ScrollView 
                    style={styles.stackContainer}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    <Text style={styles.stackText}>{errorInfo.componentStack}</Text>
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

interface SimpleErrorProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
  icon?: React.ReactNode;
  testID?: string;
}

export function SimpleError({ 
  message, 
  onRetry, 
  showRetry = true, 
  icon,
  testID 
}: SimpleErrorProps) {
  return (
    <Animated.View 
      style={styles.simpleErrorContainer}
      entering={FadeIn.duration(200)}
      testID={testID}
    >
      <View style={styles.simpleErrorContent}>
        {icon || <AlertTriangle color={colors.error} size={32} />}
        <Text style={styles.simpleErrorText}>{message}</Text>
        {showRetry && onRetry && (
          <TouchableOpacity 
            style={styles.simpleRetryButton}
            onPress={onRetry}
            accessible={true}
            accessibilityLabel="Retry"
            accessibilityRole="button"
          >
            <RefreshCw color={colors.primary} size={16} />
            <Text style={styles.simpleRetryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

interface OfflineErrorProps {
  onRetry?: () => void;
  testID?: string;
}

export function OfflineError({ onRetry, testID }: OfflineErrorProps) {
  return (
    <SimpleError
      message="You're offline. Some features may not be available."
      onRetry={onRetry}
      showRetry={!!onRetry}
      icon={<AlertTriangle color={colors.warning} size={32} />}
      testID={testID}
    />
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
  testID?: string;
}

export function NetworkError({ onRetry, testID }: NetworkErrorProps) {
  return (
    <SimpleError
      message="Network connection failed. Please check your internet connection."
      onRetry={onRetry}
      showRetry={!!onRetry}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  message: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.md,
    minWidth: 160,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.background,
    marginLeft: spacing.sm,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailsButtonText: {
    ...typography.body2,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  errorDetails: {
    width: '100%',
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  errorId: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  errorSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body2,
    color: colors.error,
    fontFamily: 'monospace',
  },
  stackContainer: {
    maxHeight: 120,
    backgroundColor: colors.borderLight + '40',
    borderRadius: 4,
    padding: spacing.sm,
  },
  stackText: {
    ...typography.caption,
    color: colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  simpleErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  simpleErrorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  simpleErrorText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  simpleRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: spacing.sm,
  },
  simpleRetryText: {
    ...typography.button,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
});