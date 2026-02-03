import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ChevronLeft, ExternalLink, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { dragonChampionshipsLightTheme } from '../constants/dragonChampionshipsTheme';
import { externalUrls } from '../config/externalUrls';

const { colors, spacing, typography, shadows, borderRadius } = dragonChampionshipsLightTheme;

interface RacingRulesScreenProps {
  navigation: any;
}

export function RacingRulesScreen({ navigation }: RacingRulesScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const racingRulesUrl = externalUrls.racingRules.officialUrl;

  const handleBack = async () => {
    await Haptics.selectionAsync();
    navigation.goBack();
  };

  const handleRefresh = async () => {
    await Haptics.selectionAsync();
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  const handleOpenExternal = async () => {
    await Haptics.selectionAsync();
    try {
      const canOpen = await Linking.canOpenURL(racingRulesUrl);
      if (canOpen) {
        await Linking.openURL(racingRulesUrl);
      }
    } catch (error) {
    }
  };

  const handleWebViewError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.primary} strokeWidth={2} />
          <Text style={styles.backText}>Results</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Racing Rules</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Refresh page"
          >
            <RefreshCw size={20} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleOpenExternal}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open in browser"
          >
            <ExternalLink size={20} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView Content */}
      <View style={styles.webViewContainer}>
        {hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to Load Page</Text>
            <Text style={styles.errorDescription}>
              The Racing Rules page could not be loaded. Please check your internet connection or try opening in your browser.
            </Text>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRefresh}
                activeOpacity={0.8}
              >
                <RefreshCw size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.externalButton}
                onPress={handleOpenExternal}
                activeOpacity={0.8}
              >
                <ExternalLink size={18} color={colors.primary} strokeWidth={2} />
                <Text style={styles.externalButtonText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <WebView
              ref={webViewRef}
              source={{ uri: racingRulesUrl }}
              style={styles.webView}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={handleWebViewError}
              onHttpError={handleWebViewError}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading Racing Rules...</Text>
                </View>
              )}
              // iOS specific props
              allowsBackForwardNavigationGestures={true}
              // Android specific props
              domStorageEnabled={true}
              javaScriptEnabled={true}
              mixedContentMode="compatibility"
              // Common props
              cacheEnabled={true}
              pullToRefreshEnabled={true}
            />
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </>
        )}
      </View>

      {/* Info Bar */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Official World Sailing Racing Rules of Sailing
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.cardSmall,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  backText: {
    ...typography.bodyLarge,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 2,
  },
  headerTitle: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorDescription: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  errorActions: {
    gap: spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  retryButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  externalButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
  infoBar: {
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'center',
  },
  infoText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

export default RacingRulesScreen;
