import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Star, Heart, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import { useAuth } from '../../auth/useAuth';
import { useProgressiveAuth } from './ProgressiveAuthPrompt';

const { colors, spacing, typography, borderRadius } = dragonChampionshipsLightTheme;

interface ProgressiveAuthExampleProps {
  itemTitle?: string;
}

export function ProgressiveAuthExample({ itemTitle = "this feature" }: ProgressiveAuthExampleProps) {
  const { isAuthenticated } = useAuth();
  const { showPrompt, PromptComponent } = useProgressiveAuth();

  const handleSavePreference = async () => {
    await Haptics.selectionAsync();

    if (isAuthenticated) {
      // User is authenticated, proceed with action
      console.log('Saving preference - user is authenticated');
      // Implement actual save logic here
    } else {
      // Show progressive auth prompt
      showPrompt({
        title: 'Save Your Preferences?',
        description: `Sign in to save your preferences for ${itemTitle} and sync them across all your devices.`,
        benefits: [
          'Save favorite notices and results',
          'Personalized race notifications',
          'Sync preferences across devices',
          'Access submission forms',
        ],
        feature: 'preferences',
        onAuthComplete: () => {
          // This will be called after successful authentication
          console.log('User authenticated, now saving preference...');
          // Implement actual save logic here
        },
      });
    }
  };

  const handleSubmitFeedback = async () => {
    await Haptics.selectionAsync();

    if (isAuthenticated) {
      // User is authenticated, show feedback form
      console.log('Opening feedback form - user is authenticated');
      // Navigate to feedback form or show modal
    } else {
      // Show progressive auth prompt
      showPrompt({
        title: 'Submit Feedback',
        description: 'Sign in to submit feedback and questions to race officials.',
        benefits: [
          'Submit questions to race committee',
          'Report issues or suggestions',
          'Track your submissions',
          'Receive official responses',
        ],
        feature: 'feedback submission',
        onAuthComplete: () => {
          console.log('User authenticated, now showing feedback form...');
          // Navigate to feedback form or show modal
        },
      });
    }
  };

  const handleLikeItem = async () => {
    await Haptics.selectionAsync();

    if (isAuthenticated) {
      // User is authenticated, toggle like
      console.log('Toggling like - user is authenticated');
      // Implement like toggle logic
    } else {
      // Show progressive auth prompt
      showPrompt({
        title: 'Like This Item?',
        description: `Sign in to like ${itemTitle} and build your personalized racing experience.`,
        benefits: [
          'Like notices and results',
          'Build your personalized feed',
          'Get recommendations',
          'Track your sailing interests',
        ],
        feature: 'social features',
        onAuthComplete: () => {
          console.log('User authenticated, now toggling like...');
          // Implement like toggle logic
        },
      });
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Progressive Authentication Examples</Text>
        <Text style={styles.subtitle}>
          {isAuthenticated
            ? "You're signed in! All features are available."
            : "Try these features to see authentication prompts:"}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSavePreference}
            accessibilityRole="button"
            accessibilityLabel="Save preference"
          >
            <Star
              size={20}
              color={colors.primary}
              fill={isAuthenticated ? colors.primary : 'transparent'}
            />
            <Text style={styles.actionText}>Save Preference</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLikeItem}
            accessibilityRole="button"
            accessibilityLabel="Like item"
          >
            <Heart
              size={20}
              color={colors.primary}
              fill={isAuthenticated ? colors.primary : 'transparent'}
            />
            <Text style={styles.actionText}>Like Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSubmitFeedback}
            accessibilityRole="button"
            accessibilityLabel="Submit feedback"
          >
            <MessageSquare size={20} color={colors.primary} />
            <Text style={styles.actionText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progressive Auth Modal */}
      <PromptComponent />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    margin: spacing.md,
  },
  title: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});