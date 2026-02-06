/**
 * DiscussWelcomeModal Component
 *
 * One-time welcome modal shown when a user first visits the Discuss tab.
 * Informs them that their Dragon Worlds account is linked to RegattaFlow
 * for community features.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MessageSquare, Users, Link2 } from 'lucide-react-native';

import { IOSModal } from '../ios/IOSModal';
import { IOSText } from '../ios/IOSText';
import { IOSButton } from '../ios/IOSButton';
import { colors, spacing } from '../../constants/theme';

interface DiscussWelcomeModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const DiscussWelcomeModal: React.FC<DiscussWelcomeModalProps> = ({
  visible,
  onDismiss,
}) => {
  return (
    <IOSModal
      visible={visible}
      onClose={onDismiss}
      title="Welcome to Discuss"
      presentationStyle="formSheet"
      showCloseButton={false}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MessageSquare size={48} color={colors.primary} strokeWidth={1.5} />
        </View>

        {/* Description */}
        <IOSText textStyle="body" style={styles.description}>
          Your Dragon Worlds account is now linked to RegattaFlow for community features.
        </IOSText>

        {/* Feature List */}
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Users size={20} color={colors.primary} />
            </View>
            <IOSText textStyle="callout" style={styles.featureText}>
              Join community discussions
            </IOSText>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <MessageSquare size={20} color={colors.primary} />
            </View>
            <IOSText textStyle="callout" style={styles.featureText}>
              Create posts and share updates
            </IOSText>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Link2 size={20} color={colors.primary} />
            </View>
            <IOSText textStyle="callout" style={styles.featureText}>
              Connect with fellow sailors
            </IOSText>
          </View>
        </View>

        {/* Dismiss Button */}
        <IOSButton
          title="Got It"
          variant="filled"
          size="large"
          onPress={onDismiss}
          style={styles.button}
        />
      </View>
    </IOSModal>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.xl,
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  features: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    color: colors.text,
  },
  button: {
    width: '100%',
  },
});

export default DiscussWelcomeModal;
