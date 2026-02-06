/**
 * DiscussScreen - Native Community Discussion Screen
 *
 * Displays the Dragon Worlds community from RegattaFlow with native iOS styling.
 * Connects directly to RegattaFlow's Supabase API for community and post data.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  MessageSquare,
  ExternalLink,
  ChevronLeft,
  LogIn,
  RefreshCw,
  Rss,
  Sailboat,
  AlertCircle,
  MessageCircle,
  Plus,
} from 'lucide-react-native';

// Hooks
import { useRegattaFlowSession } from '../hooks/useRegattaFlowSession';
import {
  useCommunityWithPosts,
  useJoinCommunity,
  useLeaveCommunity,
  useCreatePost,
  useFeed,
} from '../hooks/useCommunityData';
import { useToolbarVisibility } from '../contexts/TabBarVisibilityContext';

// Stores
import {
  useCommunityStore,
  useSelectedSegment,
  useSetSelectedSegment,
  useHasSeenWelcome,
  useMarkWelcomeSeen,
  type DiscussSegment,
} from '../stores/communityStore';
import { useToastStore } from '../stores/toastStore';

// Components
import { IOSText } from '../components/ios/IOSText';
import { IOSSegmentedControl } from '../components/ios/IOSSegmentedControl';
import { IOSButton } from '../components/ios/IOSButton';
import { IOSCard } from '../components/ios/IOSCard';
import { ProfileButton } from '../components/navigation/ProfileButton';
import { Toast } from '../components/shared/Toast';
import { PostCard } from '../components/discuss/PostCard';
import { CommunityHeader } from '../components/discuss/CommunityHeader';
import { CreatePostModal } from '../components/discuss/CreatePostModal';
import { PostDetailModal } from '../components/discuss/PostDetailModal';
import { WelcomeBanner } from '../components/discuss/WelcomeBanner';

// Utils
import { colors, spacing } from '../constants/theme';
import { DRAGON_WORLDS_COMMUNITY_SLUG, REGATTAFLOW_URLS, PostType, CommunityPost } from '../types/community';

/** Floating tab bar total height (tab bar + bottom offset + extra padding) */
const FLOATING_TAB_BAR_HEIGHT = 64 + 20 + 16; // 100px total
const HEADER_HEIGHT = 60;

interface DiscussScreenProps {
  /** Callback to navigate back to More menu */
  onBack?: () => void;
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <IOSText textStyle="callout" color="secondaryLabel" style={styles.loadingText}>
        Loading community...
      </IOSText>
    </View>
  );
}

/**
 * Unauthenticated state component
 */
function UnauthenticatedState({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();

  const handleOpenExternal = async () => {
    await Haptics.selectionAsync();
    try {
      await Linking.openURL(REGATTAFLOW_URLS.community(DRAGON_WORLDS_COMMUNITY_SLUG));
    } catch (error) {
      console.error('[Discuss] Failed to open external URL:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with back button */}
      <View style={styles.simpleHeader}>
        <IOSText textStyle="title1" weight="bold">
          Discuss
        </IOSText>
      </View>

      <View style={styles.centerContainer}>
        <View style={styles.iconContainer}>
          <LogIn size={48} color={colors.primary} strokeWidth={1.5} />
        </View>
        <IOSText textStyle="title3" weight="semibold" style={styles.emptyTitle}>
          Sign In Required
        </IOSText>
        <IOSText textStyle="callout" color="secondaryLabel" style={styles.emptySubtitle}>
          Sign in to your account to join the Dragon Worlds community discussions.
        </IOSText>
        <IOSButton
          title="Browse in Browser"
          variant="tinted"
          size="medium"
          icon={<ExternalLink size={18} color={colors.primary} />}
          onPress={handleOpenExternal}
          style={styles.externalButton}
        />
      </View>
    </View>
  );
}

/**
 * Error state component
 */
function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centerContainer}>
      <View style={[styles.iconContainer, styles.errorIconContainer]}>
        <AlertCircle size={48} color={colors.error} strokeWidth={1.5} />
      </View>
      <IOSText textStyle="title3" weight="semibold" style={styles.emptyTitle}>
        Connection Error
      </IOSText>
      <IOSText textStyle="callout" color="secondaryLabel" style={styles.emptySubtitle}>
        {error}
      </IOSText>
      <IOSButton
        title="Try Again"
        variant="filled"
        size="medium"
        icon={<RefreshCw size={18} color="#FFFFFF" />}
        onPress={onRetry}
        style={styles.retryButton}
      />
    </View>
  );
}

/**
 * Empty posts state component
 */
function EmptyPostsState({ onCreatePost, isMember }: { onCreatePost?: () => void; isMember?: boolean }) {
  return (
    <View style={styles.emptyContainer} testID="discuss-empty-posts">
      <MessageCircle size={48} color={colors.textMuted} />
      <IOSText textStyle="title3" weight="medium" style={styles.emptyTitle}>
        No Posts Yet
      </IOSText>
      <IOSText textStyle="callout" color="secondaryLabel" style={styles.emptySubtitle}>
        {isMember
          ? 'Be the first to start a discussion!'
          : 'Join the community to start a discussion!'}
      </IOSText>
      {isMember && onCreatePost && (
        <IOSButton
          title="Create Post"
          variant="filled"
          size="medium"
          icon={<Plus size={18} color="#FFFFFF" />}
          onPress={onCreatePost}
          style={styles.createPostButton}
          testID="discuss-empty-create-post-button"
        />
      )}
    </View>
  );
}

/**
 * Empty feed state component (when user hasn't joined any communities)
 */
function EmptyFeedState() {
  const handleOpenExternal = async () => {
    await Haptics.selectionAsync();
    try {
      await Linking.openURL(REGATTAFLOW_URLS.app);
    } catch (error) {
      console.error('[Discuss] Failed to open external URL:', error);
    }
  };

  return (
    <View style={styles.emptyContainer}>
      <Sailboat size={48} color={colors.textMuted} />
      <IOSText textStyle="title3" weight="medium" style={styles.emptyTitle}>
        No Communities Yet
      </IOSText>
      <IOSText textStyle="callout" color="secondaryLabel" style={styles.emptySubtitle}>
        Join communities on RegattaFlow to see posts in your feed.
      </IOSText>
      <IOSButton
        title="Explore RegattaFlow"
        variant="tinted"
        size="medium"
        icon={<ExternalLink size={16} color={colors.primary} />}
        onPress={handleOpenExternal}
        style={styles.externalButton}
      />
    </View>
  );
}

/**
 * Empty feed posts state (when user has communities but no posts)
 */
function EmptyFeedPostsState() {
  return (
    <View style={styles.emptyContainer}>
      <Rss size={48} color={colors.textMuted} />
      <IOSText textStyle="title3" weight="medium" style={styles.emptyTitle}>
        Your Feed is Empty
      </IOSText>
      <IOSText textStyle="callout" color="secondaryLabel" style={styles.emptySubtitle}>
        No posts yet from your communities. Be the first to start a discussion!
      </IOSText>
    </View>
  );
}

/**
 * Main Discuss Screen Component
 */
export function DiscussScreen({ onBack }: DiscussScreenProps) {
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.showToast);

  // Modal state
  const [isCreatePostModalVisible, setIsCreatePostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<{ post: CommunityPost; communitySlug: string } | null>(null);

  // Toolbar auto-hide
  const { toolbarTranslateY, createScrollHandler } = useToolbarVisibility();
  const scrollHandler = useMemo(() => createScrollHandler(), [createScrollHandler]);

  // Segment state
  const selectedSegment = useSelectedSegment();
  const setSelectedSegment = useSetSelectedSegment();

  // Welcome modal state
  const hasSeenWelcome = useHasSeenWelcome();
  const markWelcomeSeen = useMarkWelcomeSeen();

  // RegattaFlow session
  const { session, isLoading: isSessionLoading, error: sessionError, isFirebaseAuth, isValid, refreshSession } =
    useRegattaFlowSession();

  // Auto-refresh session on mount if needed, or if session exists but is expired
  useEffect(() => {
    if (isFirebaseAuth && !isSessionLoading && !sessionError) {
      // Refresh if no session, or if session exists but is expired
      if (!session || !isValid) {
        console.log('[Discuss] Auto-refreshing session - session:', !!session, 'isValid:', isValid);
        refreshSession();
      }
    }
  }, [isFirebaseAuth, session, isValid, isSessionLoading, sessionError, refreshSession]);

  // Community data (Dragon Worlds specific)
  const {
    community,
    posts,
    membership,
    isMember,
    isLoading,
    isRefreshing,
    isCommunityLoading,
    isPostsLoading,
    communityError,
    postsError,
    refetchAll,
  } = useCommunityWithPosts(DRAGON_WORLDS_COMMUNITY_SLUG);

  // Feed data (all joined communities)
  const {
    communities: feedCommunities,
    posts: feedPosts,
    isLoading: isFeedLoading,
    isRefreshing: isFeedRefreshing,
    isEmpty: isFeedEmpty,
    isPostsLoading: isFeedPostsLoading,
    refetchAll: refetchFeed,
  } = useFeed();

  // Join/Leave/Create mutations
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();
  const createPostMutation = useCreatePost();

  /**
   * Check if error is a JWT expired error
   */
  const isJwtExpiredError = (error: unknown): boolean => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('jwt expired') || message.includes('token expired');
    }
    return false;
  };

  /**
   * Handle join community with auto-retry on JWT expiry
   */
  const handleJoin = useCallback(async () => {
    if (!community?.id) return;

    try {
      await joinMutation.mutateAsync(community.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Joined community!', 'success');
    } catch (error) {
      console.error('[Discuss] Join error:', error);

      // If JWT expired, refresh session and retry once
      if (isJwtExpiredError(error)) {
        console.log('[Discuss] JWT expired, refreshing session and retrying...');
        try {
          await refreshSession();
          // Wait a moment for session to update
          await new Promise((resolve) => setTimeout(resolve, 500));
          await joinMutation.mutateAsync(community.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast('Joined community!', 'success');
          return;
        } catch (retryError) {
          console.error('[Discuss] Retry join failed:', retryError);
        }
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Failed to join community', 'error');
    }
  }, [community?.id, joinMutation, showToast, refreshSession]);

  /**
   * Handle leave community with auto-retry on JWT expiry
   */
  const handleLeave = useCallback(async () => {
    if (!community?.id) return;

    try {
      await leaveMutation.mutateAsync(community.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Left community', 'info');
    } catch (error) {
      console.error('[Discuss] Leave error:', error);

      // If JWT expired, refresh session and retry once
      if (isJwtExpiredError(error)) {
        console.log('[Discuss] JWT expired, refreshing session and retrying...');
        try {
          await refreshSession();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await leaveMutation.mutateAsync(community.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast('Left community', 'info');
          return;
        } catch (retryError) {
          console.error('[Discuss] Retry leave failed:', retryError);
        }
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Failed to leave community', 'error');
    }
  }, [community?.id, leaveMutation, showToast, refreshSession]);

  /**
   * Handle create post with auto-retry on JWT expiry
   */
  const handleCreatePost = useCallback(
    async (post: { title: string; body: string | null; postType: PostType }) => {
      if (!community?.id) {
        throw new Error('Community not loaded');
      }

      try {
        await createPostMutation.mutateAsync({
          communityId: community.id,
          title: post.title,
          body: post.body,
          postType: post.postType,
        });
        showToast('Post created!', 'success');
      } catch (error) {
        console.error('[Discuss] Create post error:', error);

        // If JWT expired, refresh session and retry once
        if (isJwtExpiredError(error)) {
          console.log('[Discuss] JWT expired, refreshing session and retrying...');
          try {
            await refreshSession();
            await new Promise((resolve) => setTimeout(resolve, 500));
            await createPostMutation.mutateAsync({
              communityId: community.id,
              title: post.title,
              body: post.body,
              postType: post.postType,
            });
            showToast('Post created!', 'success');
            return;
          } catch (retryError) {
            console.error('[Discuss] Retry create post failed:', retryError);
          }
        }

        showToast('Failed to create post', 'error');
        throw error;
      }
    },
    [community?.id, createPostMutation, showToast, refreshSession]
  );

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    await Haptics.selectionAsync();
    if (selectedSegment === 'feed') {
      await refetchFeed();
    } else {
      await refetchAll();
    }
  }, [selectedSegment, refetchAll, refetchFeed]);

  /**
   * Handle segment change
   */
  const handleSegmentChange = useCallback(
    (index: number) => {
      const segment: DiscussSegment = index === 0 ? 'feed' : 'community';
      setSelectedSegment(segment);
      Haptics.selectionAsync();
    },
    [setSelectedSegment]
  );

  /**
   * Handle open external
   */
  const handleOpenExternal = useCallback(async () => {
    await Haptics.selectionAsync();
    try {
      await Linking.openURL(REGATTAFLOW_URLS.community(DRAGON_WORLDS_COMMUNITY_SLUG));
    } catch (error) {
      console.error('[Discuss] Failed to open external URL:', error);
    }
  }, []);

  /**
   * Handle retry after error - refresh session first for JWT errors
   */
  const handleRetryAfterError = useCallback(async () => {
    // Refresh the session first (handles JWT expiry)
    await refreshSession();
    // Wait for session to update
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Then refetch data
    await refetchAll();
  }, [refreshSession, refetchAll]);

  /**
   * Handle post press - open detail modal
   */
  const handlePostPress = useCallback((post: CommunityPost, communitySlug: string) => {
    setSelectedPost({ post, communitySlug });
  }, []);

  // Show unauthenticated state if not signed in
  if (!isFirebaseAuth) {
    return <UnauthenticatedState onBack={onBack} />;
  }

  // Show loading state during initial session fetch
  if (isSessionLoading && !session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.simpleHeader}>
          <IOSText textStyle="title1" weight="bold">
            Discuss
          </IOSText>
        </View>
        <LoadingState />
      </View>
    );
  }

  // Show session error state
  if (sessionError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.simpleHeader}>
          <IOSText textStyle="title1" weight="bold">
            Discuss
          </IOSText>
        </View>
        <ErrorState error={sessionError} onRetry={refreshSession} />
      </View>
    );
  }

  // Community error state
  if (communityError && !community) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.simpleHeader}>
          <IOSText textStyle="title1" weight="bold">
            Discuss
          </IOSText>
        </View>
        <ErrorState
          error={communityError.message || 'Failed to load community'}
          onRetry={handleRetryAfterError}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="discuss-screen">
      {/* Toast notifications */}
      <Toast />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: HEADER_HEIGHT + insets.top + 70,
            paddingBottom: FLOATING_TAB_BAR_HEIGHT + Math.max(insets.bottom, 20) + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler.onScroll}
        onScrollBeginDrag={scrollHandler.onScrollBeginDrag}
        onScrollEndDrag={scrollHandler.onScrollEndDrag}
        onMomentumScrollEnd={scrollHandler.onMomentumScrollEnd}
        refreshControl={
          <RefreshControl
            refreshing={selectedSegment === 'feed' ? isFeedRefreshing : isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
            progressViewOffset={HEADER_HEIGHT + insets.top + 70}
          />
        }
      >
        {/* Welcome Banner - shown once to explain Feed vs Community */}
        {!hasSeenWelcome && session && (
          <WelcomeBanner onDismiss={markWelcomeSeen} />
        )}

        {selectedSegment === 'community' ? (
          <>
            {/* Community Header */}
            <CommunityHeader
              community={community}
              membership={membership}
              isLoading={isCommunityLoading}
              onJoin={handleJoin}
              onLeave={handleLeave}
              isJoining={joinMutation.isPending}
              isLeaving={leaveMutation.isPending}
            />

            {/* Posts - only show when community is loaded */}
            {community && (
              isPostsLoading && posts.length === 0 ? (
                <View style={styles.postsLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <IOSText textStyle="callout" color="secondaryLabel">
                    Loading posts...
                  </IOSText>
                </View>
              ) : posts.length === 0 ? (
                <EmptyPostsState
                  isMember={isMember}
                  onCreatePost={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsCreatePostModalVisible(true);
                  }}
                />
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    communitySlug={DRAGON_WORLDS_COMMUNITY_SLUG}
                    onPress={(p) => handlePostPress(p, DRAGON_WORLDS_COMMUNITY_SLUG)}
                  />
                ))
              )
            )}
          </>
        ) : (
          /* Feed Tab Content */
          <>
            {isFeedLoading || isFeedPostsLoading ? (
              <View style={styles.postsLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <IOSText textStyle="callout" color="secondaryLabel">
                  Loading feed...
                </IOSText>
              </View>
            ) : isFeedEmpty ? (
              <EmptyFeedState />
            ) : feedPosts.length === 0 ? (
              <EmptyFeedPostsState />
            ) : (
              feedPosts.map((post) => {
                const slug = post.community?.slug ?? DRAGON_WORLDS_COMMUNITY_SLUG;
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    communitySlug={slug}
                    showCommunityBadge={true}
                    onPress={(p) => handlePostPress(p, slug)}
                  />
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Header Section */}
      <Animated.View
        style={[
          styles.headerSection,
          {
            paddingTop: insets.top,
            transform: [{ translateY: toolbarTranslateY }],
          },
        ]}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerTitleRow}>
            <MessageSquare size={20} color={colors.primary} strokeWidth={2} />
            <IOSText textStyle="title1" weight="bold">
              Discuss
            </IOSText>
          </View>
          <View style={styles.headerActions}>
            {selectedSegment === 'community' && isMember && (
              <IOSButton
                title=""
                size="small"
                variant="tinted"
                icon={<Plus size={20} color={colors.primary} />}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsCreatePostModalVisible(true);
                }}
                style={styles.newPostButton}
                testID="discuss-new-post-button"
              />
            )}
            <ProfileButton size={36} />
          </View>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentContainer} testID="discuss-segment-container">
          <IOSSegmentedControl
            values={['Feed', 'Dragon Worlds']}
            selectedIndex={selectedSegment === 'feed' ? 0 : 1}
            onChange={handleSegmentChange}
            style={styles.segmentControl}
          />
        </View>
      </Animated.View>


      {/* Create Post Modal */}
      <CreatePostModal
        visible={isCreatePostModalVisible}
        onClose={() => setIsCreatePostModalVisible(false)}
        onSubmit={handleCreatePost}
        isSubmitting={createPostMutation.isPending}
        communityName={community?.name}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost?.post ?? null}
        communitySlug={selectedPost?.communitySlug ?? DRAGON_WORLDS_COMMUNITY_SLUG}
        onClose={() => setSelectedPost(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    // paddingTop and paddingBottom are calculated dynamically
  },
  headerSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  newPostButton: {
    paddingHorizontal: spacing.sm,
    minWidth: 40,
  },
  simpleHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  segmentContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  segmentControl: {
    // Additional styling if needed
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
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
  errorIconContainer: {
    backgroundColor: colors.error + '20',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.lg,
  },
  externalButton: {
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  createPostButton: {
    marginTop: spacing.md,
  },
  postsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
});

export default DiscussScreen;
