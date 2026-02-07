/**
 * WelcomeBanner Component
 *
 * A dismissible inline banner that explains the current tab:
 * - Feed tab: Explains that the feed shows posts from all joined communities
 * - Community tab: Explains that Dragon Worlds is one of many communities on RegattaFlow
 *
 * Content changes based on the selected segment (feed vs community).
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { MessageSquare, Check, X, Download, Rss, Users, ExternalLink } from 'lucide-react-native';

import { IOSCard } from '../ios/IOSCard';
import { IOSText } from '../ios/IOSText';
import { IOSButton } from '../ios/IOSButton';
import { colors, spacing } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import { REGATTAFLOW_URLS } from '../../types/community';
import type { DiscussSegment } from '../../stores/communityStore';

/** Example sailing communities on RegattaFlow */
const EXAMPLE_COMMUNITIES = [
  { name: 'SailGP Global', slug: 'sailgp' },
  { name: 'J/70 Class', slug: 'j70-class' },
  { name: 'Laser/ILCA Class', slug: 'laser-ilca' },
  { name: '49er Class', slug: '49er-class' },
];

interface WelcomeBannerProps {
  /** Called when user dismisses the banner */
  onDismiss: () => void;
  /** Current segment (feed or community) - changes displayed content */
  segment: DiscussSegment;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onDismiss, segment }) => {
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

  const handleOpenRegattaFlow = async () => {
    await haptics.buttonPress();
    try {
      await Linking.openURL(REGATTAFLOW_URLS.app);
    } catch (error) {
      console.error('[WelcomeBanner] Failed to open RegattaFlow:', error);
    }
  };

  // Feed tab content
  if (segment === 'feed') {
    return (
      <View style={styles.container} testID="welcome-banner-feed">
        <IOSCard variant="elevated" style={styles.card}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <View style={styles.iconContainer}>
                <Rss size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <IOSText textStyle="subheadline" weight="semibold" style={styles.title}>
                Your Feed
              </IOSText>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.closeButton}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityLabel="Dismiss banner"
              accessibilityRole="button"
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <IOSText textStyle="footnote" color="secondaryLabel" style={styles.paragraph}>
              Your feed shows posts from{' '}
              <IOSText textStyle="footnote" weight="semibold" color="label">
                all the sailing communities you've joined
              </IOSText>
              {' '}on RegattaFlow. It's a single place to stay updated on discussions across your communities.
            </IOSText>

            <IOSText textStyle="footnote" color="secondaryLabel" style={styles.paragraph}>
              Join more communities to see more posts in your feed. Switch to the{' '}
              <IOSText textStyle="footnote" weight="semibold" color="label">
                Dragon Worlds
              </IOSText>
              {' '}tab to see posts from just that community.
            </IOSText>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <IOSButton
              title="Got it"
              variant="filled"
              size="small"
              icon={<Check size={14} color="#FFFFFF" />}
              onPress={handleDismiss}
              style={styles.dismissButton}
              testID="welcome-banner-dismiss-button"
            />
          </View>
        </IOSCard>
      </View>
    );
  }

  // Community tab content (Dragon Worlds)
  return (
    <View style={styles.container} testID="welcome-banner-community">
      <IOSCard variant="elevated" style={styles.card}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={styles.iconContainer}>
              <Users size={18} color={colors.primary} strokeWidth={2} />
            </View>
            <IOSText textStyle="subheadline" weight="semibold" style={styles.title}>
              Powered by RegattaFlow
            </IOSText>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.closeButton}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityLabel="Dismiss banner"
            accessibilityRole="button"
          >
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <IOSText textStyle="footnote" color="secondaryLabel" style={styles.paragraph}>
            <IOSText textStyle="footnote" weight="semibold" color="label">
              2027 HK Dragon Worlds
            </IOSText>
            {' '}is one of many sailing communities on RegattaFlow. Your account works across all communities.
          </IOSText>

          <IOSText textStyle="footnote" color="secondaryLabel" style={styles.paragraph}>
            Discover more communities like{' '}
            {EXAMPLE_COMMUNITIES.slice(0, 3).map((c, i) => (
              <React.Fragment key={c.slug}>
                <IOSText textStyle="footnote" weight="medium" color="label">
                  {c.name}
                </IOSText>
                {i < 2 ? ', ' : ''}
              </React.Fragment>
            ))}
            {' '}and many more on the RegattaFlow app.
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
