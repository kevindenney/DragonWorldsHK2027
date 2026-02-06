/**
 * PostDetailModal Component
 *
 * Native modal for viewing full post details in-app.
 * Shows author info, full post content, engagement stats, and comments.
 * Supports native upvoting, commenting, and replying.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  User,
  Clock,
  ThumbsUp,
  MessageCircle,
  Pin,
  ExternalLink,
  Eye,
  Send,
  Reply,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import { IOSText } from '../ios/IOSText';
import { IOSButton } from '../ios/IOSButton';
import { IOSCard } from '../ios/IOSCard';
import { Toast } from '../shared/Toast';

import type { CommunityPost, PostComment } from '../../types/community';
import { POST_TYPE_BADGES, REGATTAFLOW_URLS } from '../../types/community';
import {
  usePostComments,
  useUserVote,
  useToggleUpvote,
  useCreateComment,
  useIncrementViewCount,
} from '../../hooks/useCommunityData';
import { useToastStore } from '../../stores/toastStore';

interface PostDetailModalProps {
  post: CommunityPost | null;
  communitySlug: string;
  onClose: () => void;
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
 * Format a date to a readable string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Single comment component with replies support
 */
interface CommentItemProps {
  comment: PostComment;
  onReply: (commentId: string, authorName: string) => void;
  level?: number;
}

function CommentItem({ comment, onReply, level = 0 }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const authorName = comment.author?.full_name || 'Anonymous';
  const authorAvatar = comment.author?.avatar_url;
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <View style={[styles.commentItem, level > 0 && styles.commentReply]}>
      <View style={styles.commentHeader}>
        {authorAvatar ? (
          <Image source={{ uri: authorAvatar }} style={styles.commentAvatar} />
        ) : (
          <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
            <User size={14} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.commentAuthorInfo}>
          <IOSText textStyle="footnote" weight="semibold">
            {authorName}
          </IOSText>
          <IOSText textStyle="caption2" color="tertiaryLabel">
            {getRelativeTime(comment.created_at)}
          </IOSText>
        </View>
      </View>

      <IOSText textStyle="callout" style={styles.commentBody}>
        {comment.body}
      </IOSText>

      <View style={styles.commentActions}>
        {level === 0 && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => onReply(comment.id, authorName)}
          >
            <Reply size={14} color={colors.primary} />
            <IOSText textStyle="caption1" color="systemBlue">
              Reply
            </IOSText>
          </TouchableOpacity>
        )}

        {hasReplies && (
          <TouchableOpacity
            style={styles.showRepliesButton}
            onPress={() => setShowReplies(!showReplies)}
          >
            {showReplies ? (
              <ChevronUp size={14} color={colors.textMuted} />
            ) : (
              <ChevronDown size={14} color={colors.textMuted} />
            )}
            <IOSText textStyle="caption1" color="secondaryLabel">
              {showReplies ? 'Hide' : 'Show'} {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
            </IOSText>
          </TouchableOpacity>
        )}
      </View>

      {/* Nested replies */}
      {hasReplies && showReplies && (
        <View style={styles.repliesContainer}>
          {comment.replies!.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} level={1} />
          ))}
        </View>
      )}
    </View>
  );
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  communitySlug,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.showToast);

  // Comment input state
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  // Optimistic UI state for upvotes
  const [optimisticUpvoteCount, setOptimisticUpvoteCount] = useState<number | null>(null);
  const [optimisticHasUpvoted, setOptimisticHasUpvoted] = useState<boolean | null>(null);

  // Data hooks
  const { data: comments, isLoading: isLoadingComments, refetch: refetchComments } = usePostComments(post?.id);
  const { data: userVote } = useUserVote(post?.id);
  const toggleUpvoteMutation = useToggleUpvote();
  const createCommentMutation = useCreateComment();
  const incrementViewMutation = useIncrementViewCount();

  // Track if user has upvoted (use optimistic state if available)
  const hasUpvoted = optimisticHasUpvoted !== null ? optimisticHasUpvoted : !!userVote;

  // Get upvote count (use optimistic state if available)
  const upvoteCount = optimisticUpvoteCount !== null ? optimisticUpvoteCount : (post?.upvotes || 0);

  // Reset optimistic state when post changes
  useEffect(() => {
    setOptimisticUpvoteCount(null);
    setOptimisticHasUpvoted(null);
  }, [post?.id]);

  // Increment view count when post is opened
  useEffect(() => {
    if (post?.id) {
      incrementViewMutation.mutate(post.id);
    }
  }, [post?.id]);

  const badgeConfig = post ? (POST_TYPE_BADGES[post.post_type] || POST_TYPE_BADGES.discussion) : POST_TYPE_BADGES.discussion;
  const authorName = post?.author?.full_name || 'Anonymous';
  const authorAvatar = post?.author?.avatar_url;

  /**
   * Handle close
   */
  const handleClose = () => {
    Haptics.selectionAsync();
    setCommentText('');
    setReplyingTo(null);
    onClose();
  };

  /**
   * Handle open in browser
   */
  const handleOpenInBrowser = async () => {
    if (!post) return;
    await Haptics.selectionAsync();
    const url = REGATTAFLOW_URLS.post(communitySlug, post.id);
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('[PostDetailModal] Failed to open URL:', error);
    }
  };

  /**
   * Handle upvote toggle with optimistic UI
   */
  const handleUpvote = async () => {
    if (!post) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update - immediately update UI
    const currentlyUpvoted = hasUpvoted;
    const currentCount = upvoteCount;
    const newUpvoted = !currentlyUpvoted;
    const newCount = newUpvoted ? currentCount + 1 : Math.max(0, currentCount - 1);

    setOptimisticHasUpvoted(newUpvoted);
    setOptimisticUpvoteCount(newCount);

    try {
      await toggleUpvoteMutation.mutateAsync(post.id);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticHasUpvoted(currentlyUpvoted);
      setOptimisticUpvoteCount(currentCount);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PostDetailModal] Upvote error:', errorMessage, error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(errorMessage, 'error');
    }
  };

  /**
   * Handle reply to comment
   */
  const handleReplyToComment = (commentId: string, authorName: string) => {
    Haptics.selectionAsync();
    setReplyingTo({ id: commentId, name: authorName });
  };

  /**
   * Cancel reply
   */
  const cancelReply = () => {
    Haptics.selectionAsync();
    setReplyingTo(null);
  };

  /**
   * Submit comment
   */
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await createCommentMutation.mutateAsync({
        postId: post.id,
        body: commentText.trim(),
        parentCommentId: replyingTo?.id ?? null,
      });

      setCommentText('');
      setReplyingTo(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Comment posted!', 'success');
    } catch (error) {
      console.warn('[PostDetailModal] Comment error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error instanceof Error ? error.message : 'Could not post comment';
      showToast(message, 'error');
    }
  };

  return (
    <Modal
      visible={!!post}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {post && (
      <View style={[styles.overlay, { paddingTop: insets.top }]} testID="post-detail-modal">
      <Toast />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="post-detail-close-button"
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <IOSText textStyle="headline" weight="semibold">
                Post
              </IOSText>
            </View>
            <IOSButton
              title="Open"
              size="small"
              variant="tinted"
              icon={<ExternalLink size={14} color={colors.primary} />}
              onPress={handleOpenInBrowser}
              testID="post-detail-open-browser-button"
            />
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Pinned indicator */}
            {post.pinned && (
              <View style={styles.pinnedBanner}>
                <Pin size={14} color={colors.primary} />
                <IOSText textStyle="caption1" weight="semibold" color="systemBlue">
                  Pinned Post
                </IOSText>
              </View>
            )}

            {/* Author section */}
            <View style={styles.authorSection}>
              {authorAvatar ? (
                <Image
                  source={{ uri: authorAvatar }}
                  style={styles.avatar}
                  accessibilityLabel={`${authorName}'s avatar`}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <User size={24} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.authorInfo}>
                <IOSText textStyle="body" weight="semibold">
                  {authorName}
                </IOSText>
                <View style={styles.timeRow}>
                  <Clock size={12} color={colors.textMuted} />
                  <IOSText textStyle="caption1" color="secondaryLabel">
                    {getRelativeTime(post.created_at)}
                  </IOSText>
                </View>
              </View>
            </View>

            {/* Post type badge */}
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: badgeConfig.backgroundColor },
              ]}
            >
              <IOSText
                textStyle="caption1"
                weight="semibold"
                style={{ color: badgeConfig.color }}
              >
                {badgeConfig.label}
              </IOSText>
            </View>

            {/* Title */}
            <IOSText textStyle="title2" weight="bold" style={styles.title}>
              {post.title}
            </IOSText>

            {/* Body */}
            {post.body && (
              <IOSText textStyle="body" color="label" style={styles.body}>
                {post.body}
              </IOSText>
            )}

            {/* Action buttons - Upvote */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.upvoteButton, hasUpvoted && styles.upvoteButtonActive]}
                onPress={handleUpvote}
                disabled={toggleUpvoteMutation.isPending}
              >
                <ThumbsUp
                  size={20}
                  color={hasUpvoted ? '#FFFFFF' : colors.primary}
                  fill={hasUpvoted ? '#FFFFFF' : 'none'}
                />
                <IOSText
                  textStyle="callout"
                  weight="semibold"
                  style={{ color: hasUpvoted ? '#FFFFFF' : colors.primary }}
                >
                  {hasUpvoted ? 'Upvoted' : 'Upvote'} ({upvoteCount})
                </IOSText>
              </TouchableOpacity>

              <View style={styles.viewCount}>
                <Eye size={16} color={colors.textMuted} />
                <IOSText textStyle="caption1" color="secondaryLabel">
                  {post.view_count || 0} views
                </IOSText>
              </View>
            </View>

            {/* Posted date */}
            <IOSText textStyle="caption1" color="tertiaryLabel" style={styles.postedDate}>
              Posted {formatDate(post.created_at)}
            </IOSText>

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              <View style={styles.commentsSectionHeader}>
                <MessageCircle size={18} color={colors.text} />
                <IOSText textStyle="headline" weight="semibold">
                  Comments ({comments?.length || post.comment_count || 0})
                </IOSText>
              </View>

              {isLoadingComments ? (
                <View style={styles.commentsLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <IOSText textStyle="caption1" color="secondaryLabel">
                    Loading comments...
                  </IOSText>
                </View>
              ) : comments && comments.length > 0 ? (
                <View style={styles.commentsList}>
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onReply={handleReplyToComment}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.noComments}>
                  <IOSText textStyle="callout" color="secondaryLabel">
                    No comments yet. Be the first to comment!
                  </IOSText>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Comment Input */}
          <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
            {replyingTo && (
              <View style={styles.replyingToBar}>
                <IOSText textStyle="caption1" color="secondaryLabel">
                  Replying to {replyingTo.name}
                </IOSText>
                <TouchableOpacity onPress={cancelReply}>
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : 'Add a comment...'}
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!commentText.trim() || createCommentMutation.isPending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || createCommentMutation.isPending}
              >
                {createCommentMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInfo: {
    flex: 1,
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.md,
    lineHeight: 30,
  },
  body: {
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  upvoteButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  postedDate: {
    marginBottom: spacing.lg,
  },
  commentsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  commentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  commentsList: {
    gap: spacing.md,
  },
  noComments: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  commentItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  commentReply: {
    marginLeft: spacing.lg,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
    borderBottomWidth: 0,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
  },
  commentAuthorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commentBody: {
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  showRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  repliesContainer: {
    marginTop: spacing.sm,
  },
  commentInputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  replyingToBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
});

export default PostDetailModal;
