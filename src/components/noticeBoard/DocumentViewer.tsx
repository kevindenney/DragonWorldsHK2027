import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Alert, Linking, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  Share as ShareIcon,
  ChevronLeft,
  FileText,
  ExternalLink
} from 'lucide-react-native';

import { colors, spacing } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import {
  IOSNavigationBar,
  IOSButton,
  IOSText,
  IOSCard
} from '../ios';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import type { EventDocument } from '../../types/noticeBoard';

interface DocumentViewerProps {
  navigation: any;
  route: {
    params: {
      document: EventDocument;
    };
  };
}

const { width, height } = Dimensions.get('window');

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  navigation,
  route
}) => {
  const { document } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      await haptics.buttonPress();

      // Use React Native's built-in Share API
      await Share.share({
        title: document.title,
        message: `${document.title}\n${document.url}`,
        url: document.url, // iOS only
      });
    } catch (err) {
      if (!(err instanceof Error && err.message === 'User did not share')) {
        Alert.alert('Error', 'Failed to share document');
      }
    }
  };

  const handleOpenExternal = async () => {
    try {
      await haptics.buttonPress();


      // Check if we can open the URL
      const canOpen = await Linking.canOpenURL(document.url);

      if (canOpen) {
        await Linking.openURL(document.url);
      } else {
        // Try to open anyway - some URLs report false but still work
        await Linking.openURL(document.url);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to open document in external browser');
    }
  };

  const renderDocumentInfo = () => (
    <IOSCard variant="elevated" style={styles.documentInfo}>
      <View style={styles.documentHeader}>
        <FileText size={24} color={colors.primary} />
        <View style={styles.documentMeta}>
          <IOSText textStyle="headline" weight="semibold" numberOfLines={2}>
            {document.title}
          </IOSText>
          <IOSText textStyle="callout" color="secondaryLabel">
            {document.fileType.toUpperCase()} • {Math.round((document.size || 0) / 1024)} KB
          </IOSText>
          {document.lastModified && (
            <IOSText textStyle="caption1" color="tertiaryLabel">
              Updated: {new Date(document.lastModified).toLocaleDateString()}
            </IOSText>
          )}
        </View>
      </View>
      
      {document.description && (
        <IOSText textStyle="callout" color="secondaryLabel" style={styles.description}>
          {document.description}
        </IOSText>
      )}
      
      <View style={styles.documentActions}>
        <IOSButton
          title="Share"
          variant="tinted"
          size="small"
          onPress={handleShare}
          icon={<ShareIcon size={16} color={colors.primary} />}
          style={styles.actionButton}
        />

        <IOSButton
          title="Open"
          variant="tinted"
          size="small"
          onPress={handleOpenExternal}
          icon={<ExternalLink size={16} color={colors.primary} />}
          style={styles.actionButton}
        />
      </View>
    </IOSCard>
  );

  const renderWebView = () => {
    // For PDFs on iOS, WebView renders them natively
    // For Android, use Google Docs viewer as fallback
    const pdfUrl = document.fileType === 'pdf' && Platform.OS === 'android'
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(document.url)}&embedded=true`
      : document.url;

    return (
      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: pdfUrl }}
          style={styles.webView}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError('Failed to load document');
            setIsLoading(false);
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" text="Loading document..." />
            </View>
          )}
          scalesPageToFit={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <LoadingSpinner size="large" text="Loading document..." />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <IOSNavigationBar
        title="Document"
        style="default"
        leftAction={{
          icon: <ChevronLeft size={20} color={colors.primary} />,
          onPress: () => navigation.goBack()
        }}
      />

      <View style={styles.content}>
        {renderDocumentInfo()}
        
        {error ? (
          <IOSCard variant="elevated" style={styles.errorCard}>
            <IOSText textStyle="headline" weight="semibold" color="systemRed">
              Error Loading Document
            </IOSText>
            <IOSText textStyle="callout" color="secondaryLabel">
              {error}
            </IOSText>
            <IOSButton
              title="Try Again"
              variant="tinted"
              size="medium"
              onPress={() => {
                setError(null);
                setIsLoading(true);
              }}
            />
          </IOSCard>
        ) : (
          renderWebView()
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },

  // Document Info
  documentInfo: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  documentMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  description: {
    marginTop: spacing.xs,
  },
  documentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 90,
    maxWidth: '48%',
  },

  // WebView
  webViewContainer: {
    flex: 1,
    borderRadius: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background + 'CC',
  },

  // Error
  errorCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
});