/**
 * CommunityHeader Component
 *
 * Displays community information including name, description, member count,
 * and a join/leave button for the native Discuss screen.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {
  Users,
  MessageSquare,
  CheckCircle,
  ExternalLink,
  Sailboat,
} from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import { IOSCard } from '../ios/IOSCard';
import { IOSText } from '../ios/IOSText';
import { IOSButton } from '../ios/IOSButton';
import { haptics } from '../../utils/haptics';

import type { Community, CommunityMembership } from '../../types/community';
import { REGATTAFLOW_URLS } from '../../types/community';
import { MembersListModal } from './MembersListModal';

interface CommunityHeaderProps {
  community: Community | null | undefined;
  membership: CommunityMembership | null | undefined;
  isLoading?: boolean;
  isMembershipLoading?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  isJoining?: boolean;
  isLeaving?: boolean;
}

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  community,
  membership,
  isLoading,
  isMembershipLoading,
  onJoin,
  onLeave,
  isJoining,
  isLeaving,
}) => {
  const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);
  const isMember = !!membership;
  const isActionPending = isJoining || isLeaving || isMembershipLoading;

  /**
   * Handle opening members modal
   */
  const handleOpenMembersModal = async () => {
    await haptics.buttonPress();
    setIsMembersModalVisible(true);
  };

  /**
   * Handle opening community in browser
   */
  const handleOpenInBrowser = async () => {
    await haptics.buttonPress();
    if (community?.slug) {
      const url = REGATTAFLOW_URLS.community(community.slug);
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error('[CommunityHeader] Failed to open URL:', error);
      }
    }
  };

  /**
   * Handle join/leave action
   */
  const handleMembershipAction = async () => {
    await haptics.buttonPress();
    if (isMember && onLeave) {
      onLeave();
    } else if (!isMember && onJoin) {
      onJoin();
    }
  };

  // Loading state
  if (isLoading || !community) {
    return (
      <View style={styles.container}>
        <IOSCard variant="elevated" style={styles.card}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <IOSText textStyle="callout" color="secondaryLabel">
              Loading community...
            </IOSText>
          </View>
        </IOSCard>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="community-header">
      <IOSCard variant="elevated" style={styles.card}>
        {/* Community Info Row */}
        <View style={styles.infoRow}>
          {/* Icon or Image */}
          {community.icon_url ? (
            <Image
              source={{ uri: community.icon_url }}
              style={styles.communityImage}
              accessibilityLabel={`${community.name} icon`}
            />
          ) : (
            <View style={[styles.communityImage, styles.imagePlaceholder]}>
              <Sailboat size={24} color={colors.primary} />
            </View>
          )}

          {/* Name and Description */}
          <View style={styles.infoContent}>
            <View style={styles.nameRow} testID="community-name-row">
              <IOSText textStyle="headline" weight="semibold" numberOfLines={1} testID="community-name">
                {community.name}
              </IOSText>
              {(community.is_official || community.is_verified) && (
                <CheckCircle size={16} color={colors.success} fill={colors.success + '30'} />
              )}
            </View>

            {community.description && (
              <IOSText
                textStyle="footnote"
                color="secondaryLabel"
                numberOfLines={2}
                style={styles.description}
              >
                {community.description}
              </IOSText>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow} testID="community-stats-row">
          <TouchableOpacity
            style={styles.statTouchable}
            onPress={handleOpenMembersModal}
            activeOpacity={0.7}
            testID="community-member-count"
          >
            <Users size={14} color={colors.primary} />
            <IOSText textStyle="footnote" color="systemBlue">
              {community.member_count ?? 0} members
            </IOSText>
          </TouchableOpacity>

          <View style={styles.stat} testID="community-post-count">
            <MessageSquare size={14} color={colors.textMuted} />
            <IOSText textStyle="footnote" color="secondaryLabel">
              {community.post_count ?? 0} posts
            </IOSText>
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.actionsRow} testID="community-actions-row">
          <IOSButton
            title={isMember ? 'Joined' : 'Join Community'}
            size="medium"
            variant={isMember ? 'tinted' : 'filled'}
            color={isMember ? colors.success : undefined}
            icon={
              isActionPending ? (
                <ActivityIndicator size="small" color={isMember ? colors.success : '#FFFFFF'} />
              ) : isMember ? (
                <CheckCircle size={16} color={colors.success} />
              ) : undefined
            }
            onPress={handleMembershipAction}
            disabled={isActionPending}
            style={styles.joinButton}
            testID={isMember ? 'community-leave-button' : 'community-join-button'}
          />

          <IOSButton
            title="Open in Browser"
            size="medium"
            variant="tinted"
            color={colors.primary}
            icon={<ExternalLink size={14} color={colors.primary} />}
            onPress={handleOpenInBrowser}
            style={styles.externalButton}
            testID="community-open-browser-button"
          />
        </View>
      </IOSCard>

      {/* Members List Modal */}
      <MembersListModal
        communityId={community.id}
        communityName={community.name}
        visible={isMembersModalVisible}
        onClose={() => setIsMembersModalVisible(false)}
      />
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  communityImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: spacing.md,
  },
  imagePlaceholder: {
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  description: {
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginLeft: -spacing.sm,
    borderRadius: borderRadius.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  joinButton: {
    flex: 1,
  },
  externalButton: {
    // Don't flex - size to content so text isn't cut off
  },
});

export default CommunityHeader;
