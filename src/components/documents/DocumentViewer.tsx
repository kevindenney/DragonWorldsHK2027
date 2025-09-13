/**
 * Document Viewer Component
 * Displays PDFs and other race documents with download capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import {
  Download,
  Share2,
  ExternalLink,
  FileText,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react-native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import type { Document } from '../../services/firebaseRaceDataService';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

export function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkIfAlreadyDownloaded();
  }, []);

  // Check if document is already downloaded
  const checkIfAlreadyDownloaded = async () => {
    try {
      const fileName = getFileName(document.url);
      const localPath = `${FileSystem.documentDirectory}${fileName}`;
      
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        setDownloadedPath(localPath);
      }
    } catch (error) {
      console.warn('Error checking downloaded file:', error);
    }
  };

  // Get filename from URL
  const getFileName = (url: string): string => {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Ensure filename has proper extension
    if (!fileName.includes('.')) {
      return `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    }
    
    return fileName;
  };

  // Download document
  const downloadDocument = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      
      const fileName = getFileName(document.url);
      const localPath = `${FileSystem.documentDirectory}${fileName}`;

      // Download with progress callback
      const downloadResumable = FileSystem.createDownloadResumable(
        document.url,
        localPath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(progress * 100);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        setDownloadedPath(result.uri);
        Alert.alert('Success', 'Document downloaded successfully');
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download document');
      Alert.alert('Error', 'Failed to download document. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Save to device gallery/files
  const saveToDevice = async () => {
    try {
      if (!downloadedPath) {
        await downloadDocument();
        return;
      }

      if (Platform.OS === 'android') {
        // Request media library permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please grant permission to save files');
          return;
        }

        // Save to media library
        await MediaLibrary.saveToLibraryAsync(downloadedPath);
        Alert.alert('Success', 'Document saved to device');
      } else {
        // iOS - use sharing
        await Sharing.shareAsync(downloadedPath);
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save document');
    }
  };

  // Share document
  const shareDocument = async () => {
    try {
      if (downloadedPath) {
        // Share local file
        await Sharing.shareAsync(downloadedPath);
      } else {
        // Share URL
        await Share.share({
          message: `${document.title}\n${document.url}`,
          url: document.url,
          title: document.title
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share document');
    }
  };

  // Open in external app
  const openExternally = async () => {
    try {
      const canOpen = await Linking.canOpenURL(document.url);
      if (canOpen) {
        await Linking.openURL(document.url);
      } else {
        Alert.alert('Error', 'Unable to open document in external app');
      }
    } catch (error) {
      console.error('External open error:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  // Refresh document
  const refreshDocument = () => {
    setLoading(true);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <ArrowLeft color={colors.primary} size={24} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{document.title}</Text>
          <Text style={styles.subtitle}>{document.category}</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={refreshDocument}>
          <RefreshCw color={colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.actionButton, isDownloading && styles.actionButtonDisabled]} 
          onPress={downloadDocument}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : downloadedPath ? (
            <CheckCircle color={colors.success} size={16} />
          ) : (
            <Download color={colors.primary} size={16} />
          )}
          <Text style={styles.actionButtonText}>
            {isDownloading ? `${Math.round(downloadProgress)}%` : 
             downloadedPath ? 'Downloaded' : 'Download'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={saveToDevice}>
          <FileText color={colors.primary} size={16} />
          <Text style={styles.actionButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={shareDocument}>
          <Share2 color={colors.primary} size={16} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={openExternally}>
          <ExternalLink color={colors.primary} size={16} />
          <Text style={styles.actionButtonText}>Open</Text>
        </TouchableOpacity>
      </View>

      {/* Document Viewer */}
      <View style={styles.viewerContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle color={colors.error} size={48} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshDocument}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{ uri: downloadedPath || document.url }}
            style={styles.webView}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              setError('Failed to load document');
              setLoading(false);
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading document...</Text>
              </View>
            )}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Document Info */}
      <View style={styles.infoContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.infoTag}>
            <Text style={styles.infoTagText}>{document.fileType.toUpperCase()}</Text>
          </View>
          {document.uploadedAt && (
            <View style={styles.infoTag}>
              <Text style={styles.infoTagText}>
                {new Date(document.uploadedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
          <View style={styles.infoTag}>
            <Text style={styles.infoTagText}>{document.category}</Text>
          </View>
        </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.cardSmall,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    minWidth: 80,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
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
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.bodyLarge,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    ...typography.labelLarge,
    color: colors.textInverted,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  infoTag: {
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  infoTagText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 11,
  },
});