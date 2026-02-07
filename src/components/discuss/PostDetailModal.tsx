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
  ThumbsDown,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Pin,
  ExternalLink,
  Eye,
  Send,
  Reply,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import { IOSText } from '../ios/IOSText';
import { IOSButton } from '../ios/IOSButton';
import { IOSCard } from '../ios/IOSCard';
import { Toast } from '../shared/Toast';

import type { CommunityPost, PostComment, PostType } from '../../types/community';
import { POST_TYPE_BADGES, REGATTAFLOW_URLS } from '../../types/community';
import {
  usePostComments,
  useUserVote,
  useTogglePostVote,
  useTogglePinPost,
  useCreateComment,
  useUpdateComment,
  useIncrementViewCount,
  useCommentVote,
  useToggleCommentVote,
  useUpdatePost,
} from '../../hooks/useCommunityData';
import { useRegattaFlowSession } from '../../hooks/useRegattaFlowSession';
import { useToastStore } from '../../stores/toastStore';
import { CreatePostModal } from './CreatePostModal';

interface PostDetailModalProps {
  post: CommunityPost | null;
  communitySlug: string;
  onClose: () => void;
  /** User's role in the community (for mod actions like pinning) */
  userRole?: 'member' | 'moderator' | 'admin' | 'owner' | null;
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
 * Check if a post has been edited (updated_at differs from created_at)
 */
function isPostEdited(createdAt: string, updatedAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  // Consider edited if updated more than 1 minute after creation
  return updated - created > 60000;
}

/**
 * Single comment component with replies support and voting
 */
interface CommentItemProps {
  comment: PostComment;
  onReply: (commentId: string, authorName: string) => void;
  level?: number;
  /** Current user's ID for checking authorship */
  currentUserId?: string;
  /** Post ID for cache invalidation */
  postId: string;
}

function CommentItem({ comment, onReply, level = 0, currentUserId, postId }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const showToast = useToastStore((state) => state.showToast);
  const authorName = comment.author?.full_name || 'Anonymous';
  const authorAvatar = comment.author?.avatar_url;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isAuthor = currentUserId === comment.author_id;

  // Voting state
  const { data: userVote } = useCommentVote(comment.id);
  const toggleVoteMutation = useToggleCommentVote();
  const updateCommentMutation = useUpdateComment();

  // Optimistic UI state
  const [optimisticVote, setOptimisticVote] = useState<{ upvotes: number; downvotes: number; userVote: 1 | -1 | null } | null>(null);

  // Calculate current vote state
  const currentUpvotes = optimisticVote?.upvotes ?? (comment.upvotes || 0);
  const currentDownvotes = optimisticVote?.downvotes ?? (comment.downvotes || 0);
  const score = currentUpvotes - currentDownvotes;
  const currentUserVote = optimisticVote?.userVote ?? (userVote?.vote as 1 | -1 | null) ?? null;
  const hasUpvoted = currentUserVote === 1;
  const hasDownvoted = currentUserVote === -1;

  // Reset optimistic state when comment changes or server data updates
  useEffect(() => {
    setOptimisticVote(null);
  }, [comment.id, comment.upvotes, comment.downvotes]);

  const handleEditSave = async () => {
    if (!editText.trim()) return;

    try {
      await updateCommentMutation.mutateAsync({
        commentId: comment.id,
        postId,
        body: editText.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Comment updated!', 'success');
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update comment';
      console.error('[CommentItem] Edit error:', errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(errorMessage, 'error');
    }
  };

  const handleEditCancel = () => {
    setEditText(comment.body);
    setIsEditing(false);
  };

  const handleVote = async (voteType: 1 | -1) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    const oldUpvotes = currentUpvotes;
    const oldDownvotes = currentDownvotes;
    const oldUserVote = currentUserVote;

    let newUpvotes = oldUpvotes;
    let newDownvotes = oldDownvotes;
    let newUserVote: 1 | -1 | null = null;

    if (oldUserVote === voteType) {
      // Removing vote
      if (voteType === 1) {
        newUpvotes = Math.max(0, oldUpvotes - 1);
      } else {
        newDownvotes = Math.max(0, oldDownvotes - 1);
      }
      newUserVote = null;
    } else if (oldUserVote === null) {
      // Adding new vote
      if (voteType === 1) {
        newUpvotes = oldUpvotes + 1;
      } else {
        newDownvotes = oldDownvotes + 1;
      }
      newUserVote = voteType;
    } else {
      // Changing vote
      if (voteType === 1) {
        newUpvotes = oldUpvotes + 1;
        newDownvotes = Math.max(0, oldDownvotes - 1);
      } else {
        newDownvotes = oldDownvotes + 1;
        newUpvotes = Math.max(0, oldUpvotes - 1);
      }
      newUserVote = voteType;
    }

    setOptimisticVote({ upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote });

    try {
      await toggleVoteMutation.mutateAsync({ commentId: comment.id, voteType });
      // Clear optimistic state after success - let server data take over
      setOptimisticVote(null);
    } catch (error) {
      // Revert on error
      setOptimisticVote({ upvotes: oldUpvotes, downvotes: oldDownvotes, userVote: oldUserVote });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CommentItem] Vote error:', errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(errorMessage, 'error');
    }
  };

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
          <View style={styles.commentMetaRow}>
            <IOSText textStyle="caption2" color="tertiaryLabel">
              {getRelativeTime(comment.created_at)}
            </IOSText>
            {isPostEdited(comment.created_at, comment.updated_at) && (
              <View style={styles.commentEditedIndicator}>
                <Pencil size={9} color={colors.textMuted} />
                <IOSText textStyle="caption2" color="tertiaryLabel">
                  edited
                </IOSText>
              </View>
            )}
          </View>
        </View>
      </View>

      {isEditing ? (
        <View style={styles.commentEditContainer}>
          <TextInput
            style={styles.commentEditInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
            maxLength={2000}
          />
          <View style={styles.commentEditActions}>
            <TouchableOpacity
              style={styles.commentEditCancel}
              onPress={handleEditCancel}
            >
              <IOSText textStyle="caption1" color="secondaryLabel">
                Cancel
              </IOSText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.commentEditSave,
                (!editText.trim() || updateCommentMutation.isPending) && styles.commentEditSaveDisabled,
              ]}
              onPress={handleEditSave}
              disabled={!editText.trim() || updateCommentMutation.isPending}
            >
              {updateCommentMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IOSText textStyle="caption1" weight="semibold" style={{ color: '#FFFFFF' }}>
                  Save
                </IOSText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <IOSText textStyle="callout" style={styles.commentBody}>
          {comment.body}
        </IOSText>
      )}

      <View style={styles.commentActions}>
        {/* Voting buttons */}
        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={[styles.voteButton, hasUpvoted && styles.voteButtonActive]}
            onPress={() => handleVote(1)}
            disabled={toggleVoteMutation.isPending}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThumbsUp
              size={14}
              color={hasUpvoted ? '#FFFFFF' : colors.textMuted}
              fill={hasUpvoted ? '#FFFFFF' : 'none'}
            />
          </TouchableOpacity>

          <IOSText
            textStyle="caption1"
            weight="semibold"
            style={[
              styles.voteScore,
              score > 0 && styles.voteScorePositive,
              score < 0 && styles.voteScoreNegative,
            ]}
          >
            {score}
          </IOSText>

          <TouchableOpacity
            style={[styles.voteButton, hasDownvoted && styles.voteButtonDownvoteActive]}
            onPress={() => handleVote(-1)}
            disabled={toggleVoteMutation.isPending}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThumbsDown
              size={14}
              color={hasDownvoted ? '#FFFFFF' : colors.textMuted}
              fill={hasDownvoted ? '#FFFFFF' : 'none'}
            />
          </TouchableOpacity>
        </View>

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

        {isAuthor && !isEditing && (
          <TouchableOpacity
            style={styles.editCommentButton}
            onPress={() => {
              Haptics.selectionAsync();
              setIsEditing(true);
            }}
          >
            <Pencil size={14} color={colors.primary} />
            <IOSText textStyle="caption1" color="systemBlue">
              Edit
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
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              level={1}
              currentUserId={currentUserId}
              postId={postId}
            />
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
  userRole,
}) => {
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.showToast);
  const { session } = useRegattaFlowSession();

  // Check if user can pin posts (moderator, admin, or owner)
  const canPin = userRole === 'moderator' || userRole === 'admin' || userRole === 'owner';

  // Check if current user is the post author
  const isAuthor = post?.author_id === session?.userId;

  // Edit modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const updatePostMutation = useUpdatePost();

  // Comment input state
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  // Optimistic UI state for post voting
  const [optimisticPostVote, setOptimisticPostVote] = useState<{
    upvotes: number;
    downvotes: number;
    userVote: 1 | -1 | null;
  } | null>(null);

  // Data hooks
  const { data: comments, isLoading: isLoadingComments, refetch: refetchComments } = usePostComments(post?.id);
  const { data: userVote } = useUserVote(post?.id);
  const togglePostVoteMutation = useTogglePostVote();
  const togglePinMutation = useTogglePinPost();
  const createCommentMutation = useCreateComment();
  const incrementViewMutation = useIncrementViewCount();

  // Optimistic UI state for pin status
  const [optimisticPinned, setOptimisticPinned] = useState<boolean | null>(null);
  const isPinned = optimisticPinned ?? post?.pinned ?? false;

  // Get current vote state (optimistic or from server)
  const currentUpvotes = optimisticPostVote?.upvotes ?? (post?.upvotes || 0);
  const currentDownvotes = optimisticPostVote?.downvotes ?? (post?.downvotes || 0);
  const postScore = currentUpvotes - currentDownvotes;
  const currentUserVote = optimisticPostVote?.userVote ?? (userVote?.vote as 1 | -1 | null) ?? null;
  const hasUpvoted = currentUserVote === 1;
  const hasDownvoted = currentUserVote === -1;

  // Reset optimistic state when post data changes
  useEffect(() => {
    setOptimisticPostVote(null);
    setOptimisticPinned(null);
  }, [post?.id, post?.upvotes, post?.downvotes, post?.pinned]);

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
   * Handle edit post
   */
  const handleEditPost = useCallback(async (editedPost: { title: string; body: string | null; postType: PostType }) => {
    if (!post) return;

    try {
      await updatePostMutation.mutateAsync({
        postId: post.id,
        communityId: post.community_id || '',
        title: editedPost.title,
        body: editedPost.body,
        postType: editedPost.postType,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Post updated!', 'success');
      setIsEditModalVisible(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update post';
      console.error('[PostDetailModal] Edit error:', errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [post, updatePostMutation, showToast]);

  /**
   * Handle toggle pin (moderators+ only)
   */
  const handleTogglePin = async () => {
    if (!post || !canPin) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const oldPinned = isPinned;
    setOptimisticPinned(!oldPinned);

    try {
      await togglePinMutation.mutateAsync(post.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(oldPinned ? 'Post unpinned' : 'Post pinned', 'success');
    } catch (error) {
      // Revert on error
      setOptimisticPinned(oldPinned);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pin status';
      console.error('[PostDetailModal] Pin toggle error:', errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(errorMessage, 'error');
    }
  };

  /**
   * Handle post vote (upvote or downvote) with optimistic UI
   */
  const handlePostVote = async (voteType: 1 | -1) => {
    if (!post) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Save old state for potential revert
    const oldUpvotes = currentUpvotes;
    const oldDownvotes = currentDownvotes;
    const oldUserVote = currentUserVote;

    // Calculate optimistic state
    let newUpvotes = oldUpvotes;
    let newDownvotes = oldDownvotes;
    let newUserVote: 1 | -1 | null = null;

    if (oldUserVote === voteType) {
      // Removing vote
      if (voteType === 1) {
        newUpvotes = Math.max(0, oldUpvotes - 1);
      } else {
        newDownvotes = Math.max(0, oldDownvotes - 1);
      }
      newUserVote = null;
    } else if (oldUserVote === null) {
      // Adding new vote
      if (voteType === 1) {
        newUpvotes = oldUpvotes + 1;
      } else {
        newDownvotes = oldDownvotes + 1;
      }
      newUserVote = voteType;
    } else {
      // Switching vote
      if (voteType === 1) {
        newUpvotes = oldUpvotes + 1;
        newDownvotes = Math.max(0, oldDownvotes - 1);
      } else {
        newDownvotes = oldDownvotes + 1;
        newUpvotes = Math.max(0, oldUpvotes - 1);
      }
      newUserVote = voteType;
    }

    setOptimisticPostVote({ upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote });

    try {
      await togglePostVoteMutation.mutateAsync({ postId: post.id, voteType });
      // Clear optimistic state after success - let server data take over
      setOptimisticPostVote(null);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticPostVote({ upvotes: oldUpvotes, downvotes: oldDownvotes, userVote: oldUserVote });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PostDetailModal] Vote error:', errorMessage, error);
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
            {isPinned && (
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
                  {isPostEdited(post.created_at, post.updated_at) && (
                    <View style={styles.editedIndicator}>
                      <Pencil size={10} color={colors.textMuted} />
                      <IOSText textStyle="caption1" color="secondaryLabel">
                        edited
                      </IOSText>
                    </View>
                  )}
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

            {/* Reddit-style voting */}
            <View style={styles.actionButtons}>
              <View style={styles.postVoteContainer}>
                <TouchableOpacity
                  style={[styles.postVoteButton, hasUpvoted && styles.postVoteButtonUpvoted]}
                  onPress={() => handlePostVote(1)}
                  disabled={togglePostVoteMutation.isPending}
                  hitSlop={{ top: 8, bottom: 4, left: 8, right: 8 }}
                >
                  <ArrowBigUp
                    size={28}
                    color={hasUpvoted ? '#FF4500' : colors.textMuted}
                    fill={hasUpvoted ? '#FF4500' : 'none'}
                  />
                </TouchableOpacity>

                <IOSText
                  textStyle="headline"
                  weight="bold"
                  style={[
                    styles.postVoteScore,
                    hasUpvoted && styles.postVoteScoreUpvoted,
                    hasDownvoted && styles.postVoteScoreDownvoted,
                  ]}
                >
                  {postScore}
                </IOSText>

                <TouchableOpacity
                  style={[styles.postVoteButton, hasDownvoted && styles.postVoteButtonDownvoted]}
                  onPress={() => handlePostVote(-1)}
                  disabled={togglePostVoteMutation.isPending}
                  hitSlop={{ top: 4, bottom: 8, left: 8, right: 8 }}
                >
                  <ArrowBigDown
                    size={28}
                    color={hasDownvoted ? '#7193FF' : colors.textMuted}
                    fill={hasDownvoted ? '#7193FF' : 'none'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.actionButtonsRight}>
                {/* Edit button - only for post author */}
                {isAuthor && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setIsEditModalVisible(true);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Pencil size={16} color={colors.primary} />
                    <IOSText textStyle="caption1" weight="semibold" color="systemBlue">
                      Edit
                    </IOSText>
                  </TouchableOpacity>
                )}

                {/* Pin button - only for moderators, admins, owners */}
                {canPin && (
                  <TouchableOpacity
                    style={[styles.pinButton, isPinned && styles.pinButtonActive]}
                    onPress={handleTogglePin}
                    disabled={togglePinMutation.isPending}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Pin
                      size={18}
                      color={isPinned ? '#FFFFFF' : colors.primary}
                      fill={isPinned ? '#FFFFFF' : 'none'}
                    />
                    <IOSText
                      textStyle="caption1"
                      weight="semibold"
                      style={{ color: isPinned ? '#FFFFFF' : colors.primary }}
                    >
                      {isPinned ? 'Unpin' : 'Pin'}
                    </IOSText>
                  </TouchableOpacity>
                )}

                <View style={styles.viewCount}>
                  <Eye size={16} color={colors.textMuted} />
                  <IOSText textStyle="caption1" color="secondaryLabel">
                    {post.view_count || 0} views
                  </IOSText>
                </View>
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
                  Comments ({comments?.length ?? 0})
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
                      currentUserId={session?.userId}
                      postId={post.id}
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

      {/* Edit Post Modal */}
      <CreatePostModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSubmit={handleEditPost}
        isSubmitting={updatePostMutation.isPending}
        communityName={post?.community?.name || 'Community'}
        editingPost={post}
      />
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
  editedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 4,
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
  postVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xs,
  },
  postVoteButton: {
    padding: spacing.xs,
  },
  postVoteButtonUpvoted: {
    // No background change, just icon color
  },
  postVoteButtonDownvoted: {
    // No background change, just icon color
  },
  postVoteScore: {
    minWidth: 40,
    textAlign: 'center',
    color: colors.text,
  },
  postVoteScoreUpvoted: {
    color: '#FF4500', // Reddit orange
  },
  postVoteScoreDownvoted: {
    color: '#7193FF', // Reddit blue/periwinkle
  },
  actionButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '20',
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '20',
  },
  pinButtonActive: {
    backgroundColor: colors.primary,
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
    gap: 2,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentEditedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  commentBody: {
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  commentEditContainer: {
    marginBottom: spacing.xs,
  },
  commentEditInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    minHeight: 60,
    maxHeight: 120,
    lineHeight: 20,
  },
  commentEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  commentEditCancel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  commentEditSave: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 60,
    alignItems: 'center',
  },
  commentEditSaveDisabled: {
    backgroundColor: colors.textMuted,
  },
  editCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  voteButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  voteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButtonActive: {
    backgroundColor: colors.primary,
  },
  voteButtonDownvoteActive: {
    backgroundColor: '#FF6B6B',
  },
  voteScore: {
    minWidth: 24,
    textAlign: 'center',
    color: colors.textMuted,
  },
  voteScorePositive: {
    color: colors.primary,
  },
  voteScoreNegative: {
    color: '#FF6B6B',
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
