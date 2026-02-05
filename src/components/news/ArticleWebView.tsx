/**
 * ArticleWebView - Bottom sheet WebView for reading news articles in-app
 * Uses @gorhom/bottom-sheet per CLAUDE.md guidelines for Android compatibility
 */

import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
  Platform,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  ExternalLink,
  Share2,
  RefreshCw,
  ChevronDown,
} from 'lucide-react-native';
import { colors } from '../../constants/theme';

interface ArticleWebViewProps {
  url: string | null;
  title: string;
  onClose: () => void;
}

export function ArticleWebView({ url, title, onClose }: ArticleWebViewProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  // Open sheet when URL is provided
  useEffect(() => {
    if (url) {
      setIsLoading(true);
      setHasError(false);
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [url]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleClose = async () => {
    await Haptics.selectionAsync();
    bottomSheetRef.current?.close();
  };

  const handleOpenExternal = async () => {
    if (!url) return;
    await Haptics.selectionAsync();
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to open URL:', error);
      }
    }
  };

  const handleShare = async () => {
    if (!url) return;
    await Haptics.selectionAsync();
    try {
      await Share.share({
        message: Platform.OS === 'ios' ? title : `${title}\n${url}`,
        url: Platform.OS === 'ios' ? url : undefined,
        title: title,
      });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to share:', error);
      }
    }
  };

  const handleRefresh = async () => {
    await Haptics.selectionAsync();
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  const handleWebViewError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Don't render anything if no URL
  if (!url) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1} // Start at 90% snap point
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      handleStyle={styles.handleContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Close article"
        >
          <ChevronDown size={24} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Share article"
          >
            <Share2 size={20} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleOpenExternal}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Open in browser"
          >
            <ExternalLink size={20} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to Load Article</Text>
            <Text style={styles.errorText}>
              This article could not be loaded. Try opening it in your browser.
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
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              source={{ uri: url }}
              style={styles.webView}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={handleWebViewError}
              onHttpError={handleWebViewError}
              startInLoadingState={false}
              // iOS specific props
              allowsBackForwardNavigationGestures={true}
              // Android specific props
              domStorageEnabled={true}
              javaScriptEnabled={true}
              mixedContentMode="compatibility"
              // Common props
              cacheEnabled={true}
              pullToRefreshEnabled={true}
              nestedScrollEnabled={true}
            />
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading article...</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleContainer: {
    paddingTop: 12,
    paddingBottom: 0,
  },
  handleIndicator: {
    backgroundColor: '#E5E5EA',
    width: 40,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorActions: {
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  externalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default ArticleWebView;
