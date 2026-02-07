/**
 * PostCard Component
 *
 * Displays a community post in a native iOS-styled card.
 * Based on the NoticeCard pattern for consistent app styling.
 */

import React from 'react';
import { View, StyleSheet, Image, ViewStyle, StyleProp } from 'react-native';
import {
  MessageCircle,
  ThumbsUp,
  Pin,
  Clock,
  ChevronRight,
  User,
  Pencil,
} from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import { IOSCard } from '../ios/IOSCard';
import { IOSText } from '../ios/IOSText';
import { IOSBadge } from '../ios/IOSBadge';
import { haptics } from '../../utils/haptics';

import type { CommunityPost, PostType } from '../../types/community';
import { POST_TYPE_BADGES } from '../../types/community';

interface PostCardProps {
  post: CommunityPost;
  communitySlug: string;
  onPress: (post: CommunityPost) => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  /** Show community name badge (useful in feed view) */
  showCommunityBadge?: boolean;
}

/**
 * Format a date to relative time (e.g., "2h ago", "3d ago")
 */
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;

  return date.toLocaleDateString();
}

/**
 * Truncate body text to a preview length
 */
function getBodyPreview(body: string | null, maxLength: number = 150): string {
  if (!body) return '';
  if (body.length <= maxLength) return body;
  return body.substring(0, maxLength).trim() + '...';
}

/**
 * Check if a post has been edited (updated_at differs from created_at)
 */
function isPostEdited(createdAt: string, updatedAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  // Consider edited if updated more than 1 minute after creation
  return updated - created > 60000;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  communitySlug,
  onPress,
  style,
  compact = false,
  showCommunityBadge = false,
}) => {
  const badgeConfig = POST_TYPE_BADGES[post.post_type] || POST_TYPE_BADGES.discussion;
  const authorName = post.author?.full_name || 'Anonymous';
  const authorAvatar = post.author?.avatar_url;
  const communityName = post.community?.name;
  const wasEdited = isPostEdited(post.created_at, post.updated_at);

  /**
   * Handle card press - calls parent handler
   */
  const handlePress = async () => {
    await haptics.buttonPress();
    onPress(post);
  };

  return (
    <View style={[styles.container, style]} testID={`post-card-${post.id}`}>
      <IOSCard
        variant="elevated"
        style={[
          styles.card,
          compact && styles.cardCompact,
          post.pinned && styles.cardPinned,
        ]}
        onPress={handlePress}
        testID={`post-card-pressable-${post.id}`}
      >
        {/* Header: Author + Time + Pinned */}
        <View style={styles.header}>
          <View style={styles.authorRow}>
            {/* Avatar */}
            {authorAvatar ? (
              <Image
                source={{ uri: authorAvatar }}
                style={styles.avatar}
                accessibilityLabel={`${authorName}'s avatar`}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User size={16} color={colors.textMuted} />
              </View>
            )}

            <View style={styles.authorInfo}>
              <IOSText textStyle="footnote" weight="semibold">
                {authorName}
              </IOSText>
              <View style={styles.metaRow}>
                <View style={styles.timeRow}>
                  <Clock size={10} color={colors.textMuted} />
                  <IOSText textStyle="caption2" color="tertiaryLabel">
                    {getRelativeTime(post.created_at)}
                  </IOSText>
                </View>
                {wasEdited && (
                  <View style={styles.editedIndicator}>
                    <Pencil size={9} color={colors.textMuted} />
                    <IOSText textStyle="caption2" color="tertiaryLabel">
                      edited
                    </IOSText>
                  </View>
                )}
                {showCommunityBadge && communityName && (
                  <>
                    <IOSText textStyle="caption2" color="tertiaryLabel">
                      •
                    </IOSText>
                    <IOSText textStyle="caption2" color="systemBlue" numberOfLines={1}>
                      {communityName}
                    </IOSText>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            {post.pinned && (
              <View style={styles.pinnedBadge}>
                <Pin size={12} color={colors.primary} />
              </View>
            )}
            <ChevronRight size={16} color={colors.textMuted} />
          </View>
        </View>

        {/* Badge + Title */}
        <View style={styles.titleSection}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: badgeConfig.backgroundColor },
            ]}
          >
            <IOSText
              textStyle="caption2"
              weight="semibold"
              style={{ color: badgeConfig.color }}
            >
              {badgeConfig.label}
            </IOSText>
          </View>

          <IOSText
            textStyle={compact ? 'callout' : 'headline'}
            weight="semibold"
            numberOfLines={compact ? 2 : 3}
            style={styles.title}
          >
            {post.title}
          </IOSText>
        </View>

        {/* Body preview */}
        {post.body && (
          <IOSText
            textStyle="callout"
            color="secondaryLabel"
            numberOfLines={compact ? 2 : 3}
            style={styles.body}
          >
            {getBodyPreview(post.body, compact ? 100 : 150)}
          </IOSText>
        )}

        {/* Footer: Upvotes + Comments */}
        <View style={styles.footer}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <ThumbsUp size={14} color={colors.textMuted} />
              <IOSText textStyle="caption1" color="tertiaryLabel">
                {post.upvotes || 0}
              </IOSText>
            </View>

            <View style={styles.stat}>
              <MessageCircle size={14} color={colors.textMuted} />
              <IOSText textStyle="caption1" color="tertiaryLabel">
                {post.comment_count || 0}
              </IOSText>
            </View>
          </View>

          <View style={styles.readMore}>
            <IOSText textStyle="caption2" color="systemBlue">
              Read more
            </IOSText>
            <ChevronRight size={12} color={colors.primary} />
          </View>
        </View>
      </IOSCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  cardCompact: {
    padding: spacing.sm,
  },
  cardPinned: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInfo: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pinnedBadge: {
    padding: 4,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 4,
  },
  titleSection: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  title: {
    lineHeight: 22,
  },
  body: {
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

export default PostCard;
