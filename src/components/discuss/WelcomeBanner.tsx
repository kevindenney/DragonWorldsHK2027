/**
 * WelcomeBanner Component
 *
 * A dismissible inline banner that explains how the Discuss feature works:
 * - Dragon Worlds = This event's community
 * - Feed = All your communities in one place
 * - RegattaFlow = Where to discover more communities
 * - Auto-signup when participating in discussions
 *
 * Shown once at the top of the Discuss screen, persisted via communityStore.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { MessageSquare, Check, X, Download } from 'lucide-react-native';

import { IOSCard } from '../ios/IOSCard';
import { IOSText } from '../ios/IOSText';
import { IOSButton } from '../ios/IOSButton';
import { colors, spacing } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import { REGATTAFLOW_URLS } from '../../types/community';

interface WelcomeBannerProps {
  /** Called when user dismisses the banner */
  onDismiss: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onDismiss }) => {
  const handleDismiss = async () => {
    await haptics.buttonPress();
    onDismiss();
  };

  const handleDownloadApp = async () => {
    await haptics.buttonPress();
    const url = Platform.OS === 'ios' ? REGATTAFLOW_URLS.appStore : REGATTAFLOW_URLS.playStore;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('[WelcomeBanner] Failed to open app store:', error);
    }
  };

  return (
    <View style={styles.container} testID="welcome-banner">
      <IOSCard variant="elevated" style={styles.card}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={styles.iconContainer}>
              <MessageSquare size={18} color={colors.primary} strokeWidth={2} />
            </View>
            <IOSText textStyle="subheadline" weight="semibold" style={styles.title}>
              Powered by RegattaFlow
            </IOSText>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.closeButton}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityLabel="Dismiss welcome banner"
            accessibilityRole="button"
          >
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <IOSText textStyle="footnote" color="secondaryLabel" style={styles.paragraph}>
            This discussion forum and many other sailing communities are hosted on{' '}
            <IOSText textStyle="footnote" weight="semibold" color="label">
              RegattaFlow
            </IOSText>
            . Download the app to discover more communities, connect with sailors worldwide, and never miss a discussion.
          </IOSText>

          <IOSText textStyle="footnote" color="secondaryLabel" style={styles.paragraph}>
            🎉{' '}
            <IOSText textStyle="footnote" weight="semibold" color="label">
              You're automatically signed up
            </IOSText>
            {' '}by participating here! Your account works across all RegattaFlow communities.
          </IOSText>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <IOSButton
            title="Download RegattaFlow"
            variant="filled"
            size="small"
            icon={<Download size={14} color="#FFFFFF" />}
            onPress={handleDownloadApp}
            style={styles.downloadButton}
            testID="welcome-banner-download-button"
          />
          <IOSButton
            title="Got it"
            variant="tinted"
            size="small"
            icon={<Check size={14} color={colors.primary} />}
            onPress={handleDismiss}
            style={styles.dismissButton}
            testID="welcome-banner-dismiss-button"
          />
        </View>
      </IOSCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    backgroundColor: colors.primaryLight + '10', // Light blue tint
    borderWidth: 1,
    borderColor: colors.primaryLight + '30',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
    marginTop: -spacing.xs,
  },
  content: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  paragraph: {
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  downloadButton: {
    flex: 1,
    minWidth: 160,
  },
  dismissButton: {
    minWidth: 80,
  },
});

export default WelcomeBanner;
