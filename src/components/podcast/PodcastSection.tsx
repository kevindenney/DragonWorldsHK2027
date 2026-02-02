import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Headphones, ExternalLink, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import { externalUrls, isUrlConfigured } from '../../config/externalUrls';

const { colors, spacing, typography, shadows, borderRadius } = dragonChampionshipsLightTheme;

interface PodcastSectionProps {
  style?: any;
}

export function PodcastSection({ style }: PodcastSectionProps) {
  const spotifyUrl = externalUrls.podcast.spotify;
  const isConfigured = isUrlConfigured(spotifyUrl);

  const handleListenOnSpotify = async () => {
    await Haptics.selectionAsync();

    if (!isConfigured) {
      Alert.alert(
        'Coming Soon',
        'The Dragon Worlds podcast will be available soon! Check back later for updates.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      // Try to open Spotify app first
      const spotifyAppUrl = spotifyUrl.replace('https://open.spotify.com/', 'spotify://');
      const canOpenSpotifyApp = await Linking.canOpenURL(spotifyAppUrl);

      if (canOpenSpotifyApp) {
        await Linking.openURL(spotifyAppUrl);
      } else {
        // Fall back to web URL
        const canOpenWeb = await Linking.canOpenURL(spotifyUrl);
        if (canOpenWeb) {
          await Linking.openURL(spotifyUrl);
        } else {
          Alert.alert(
            'Unable to Open',
            'Please install Spotify or open the link manually in your browser.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }
    } catch (error) {
      console.error('Error opening Spotify:', error);
      Alert.alert(
        'Error',
        'Failed to open the podcast. Please try again later.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        {/* Podcast Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Headphones size={28} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Dragon Worlds Podcast</Text>
            <Text style={styles.subtitle}>Behind the scenes of championship sailing</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Join us for exclusive interviews with top sailors, race analysis,
          and insider stories from the Dragon Class World Championships.
        </Text>

        {/* Latest Episode Preview (if configured) */}
        {isConfigured && (
          <View style={styles.episodePreview}>
            <View style={styles.episodeIcon}>
              <Play size={16} color={colors.primary} strokeWidth={2.5} fill={colors.primary} />
            </View>
            <View style={styles.episodeInfo}>
              <Text style={styles.episodeLabel}>Latest Episode</Text>
              <Text style={styles.episodeTitle}>Preparing for Hong Kong 2027</Text>
            </View>
          </View>
        )}

        {/* Listen Button */}
        <TouchableOpacity
          style={styles.spotifyButton}
          onPress={handleListenOnSpotify}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Listen on Spotify"
        >
          <View style={styles.spotifyIconContainer}>
            <SpotifyIcon />
          </View>
          <Text style={styles.spotifyButtonText}>
            {isConfigured ? 'Listen on Spotify' : 'Coming Soon on Spotify'}
          </Text>
          <ExternalLink size={16} color="#FFFFFF" strokeWidth={2} style={styles.externalIcon} />
        </TouchableOpacity>

        {/* Additional platforms hint */}
        <Text style={styles.platformsHint}>
          Also available on Apple Podcasts & Google Podcasts
        </Text>
      </View>
    </View>
  );
}

// Spotify Logo Icon component
function SpotifyIcon() {
  return (
    <View style={spotifyIconStyles.container}>
      <View style={spotifyIconStyles.circle}>
        <View style={spotifyIconStyles.bar1} />
        <View style={spotifyIconStyles.bar2} />
        <View style={spotifyIconStyles.bar3} />
      </View>
    </View>
  );
}

const spotifyIconStyles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  bar1: {
    width: 12,
    height: 2.5,
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  bar2: {
    width: 10,
    height: 2.5,
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  bar3: {
    width: 8,
    height: 2.5,
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  episodePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  episodeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  episodeInfo: {
    flex: 1,
  },
  episodeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  episodeTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  spotifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1DB954', // Spotify green
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  spotifyIconContainer: {
    marginRight: 4,
  },
  spotifyButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  externalIcon: {
    opacity: 0.8,
  },
  platformsHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default PodcastSection;
