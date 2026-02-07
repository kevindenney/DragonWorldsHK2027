/**
 * Community Data Hooks for RegattaFlow Integration
 *
 * React Query hooks for fetching community data, posts, and managing membership.
 * These hooks integrate with the RegattaFlow session for authenticated requests.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService, type PostSortBy } from '../services/communityService';
import { useRegattaFlowSession } from './useRegattaFlowSession';
import type { Community, CommunityPost, CommunityMembership, CommunityMember, PostComment, PostVote } from '../types/community';
import { DRAGON_WORLDS_COMMUNITY_SLUG } from '../types/community';

/**
 * Query keys for React Query cache management
 */
export const communityQueryKeys = {
  all: ['community'] as const,
  community: (slug: string) => [...communityQueryKeys.all, 'detail', slug] as const,
  communityById: (id: string) => [...communityQueryKeys.all, 'detail-id', id] as const,
  posts: (communityId: string) =>
    [...communityQueryKeys.all, 'posts', communityId] as const,
  members: (communityId: string) =>
    [...communityQueryKeys.all, 'members', communityId] as const,
  membership: (communityId: string, userId: string) =>
    [...communityQueryKeys.all, 'membership', communityId, userId] as const,
  userCommunities: (userId: string) =>
    [...communityQueryKeys.all, 'user-communities', userId] as const,
  feedPosts: (userId: string) =>
    [...communityQueryKeys.all, 'feed', userId] as const,
  postComments: (postId: string) =>
    [...communityQueryKeys.all, 'comments', postId] as const,
  userVote: (postId: string, userId: string) =>
    [...communityQueryKeys.all, 'vote', postId, userId] as const,
  commentVote: (commentId: string, userId: string) =>
    [...communityQueryKeys.all, 'comment-vote', commentId, userId] as const,
};

/**
 * Hook to fetch a community by its slug
 * @param slug - The community slug (defaults to Dragon Worlds)
 * @param enabled - Whether to enable the query (defaults to true)
 */
export function useCommunity(
  slug: string = DRAGON_WORLDS_COMMUNITY_SLUG,
  enabled: boolean = true
) {
  const { session, isValid } = useRegattaFlowSession();

  return useQuery({
    queryKey: communityQueryKeys.community(slug),
    queryFn: async () => {
      const result = await communityService.getCommunityBySlug(
        slug,
        session?.accessToken
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    // Only enable when session is valid to prevent JWT expired errors
    enabled: enabled && isValid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime)
  });
}

/**
 * Hook to fetch the Dragon Worlds community specifically
 */
export function useDragonWorldsCommunity() {
  return useCommunity(DRAGON_WORLDS_COMMUNITY_SLUG, true);
}

/**
 * Hook to fetch posts for a community
 * @param communityId - The community UUID
 * @param enabled - Whether to enable the query
 * @param sortBy - Sort order: 'new' (most recent) or 'top' (most upvotes)
 */
export function useCommunityPosts(
  communityId: string | undefined,
  enabled: boolean = true,
  sortBy: PostSortBy = 'new'
) {
  const { session, isValid } = useRegattaFlowSession();

  return useQuery({
    // Include sortBy in query key so changing sort triggers a refetch
    queryKey: communityId
      ? [...communityQueryKeys.posts(communityId), sortBy]
      : [...communityQueryKeys.all, 'posts', 'none'],
    queryFn: async () => {
      if (!communityId) {
        return [];
      }
      const result = await communityService.getCommunityPosts(
        communityId,
        session?.accessToken,
        0, // page
        20, // pageSize (DEFAULT_PAGE_SIZE)
        sortBy
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
    // Only enable when session is valid to prevent JWT expired errors
    enabled: enabled && !!communityId && isValid,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch members of a community
 * @param communityId - The community UUID
 * @param enabled - Whether to enable the query
 */
export function useCommunityMembers(
  communityId: string | undefined,
  enabled: boolean = true
) {
  const { session, isValid } = useRegattaFlowSession();

  return useQuery({
    queryKey: communityId
      ? communityQueryKeys.members(communityId)
      : [...communityQueryKeys.all, 'members', 'none'],
    queryFn: async () => {
      if (!communityId) {
        return [];
      }
      const result = await communityService.getCommunityMembers(
        communityId,
        session?.accessToken
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
    enabled: enabled && !!communityId && isValid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to check current user's membership in a community
 * @param communityId - The community UUID
 */
export function useCommunityMembership(communityId: string | undefined) {
  const { session, isValid } = useRegattaFlowSession();

  return useQuery({
    queryKey: communityId && session?.userId
      ? communityQueryKeys.membership(communityId, session.userId)
      : [...communityQueryKeys.all, 'membership', 'none'],
    queryFn: async () => {
      if (!communityId || !session?.userId || !session.accessToken) {
        return null;
      }
      const result = await communityService.checkMembership(
        communityId,
        session.userId,
        session.accessToken
      );
      if (result.error) {
        // Don't throw for membership check - null means not a member
        console.warn('[useCommunityMembership] Error:', result.error);
        return null;
      }
      return result.data;
    },
    enabled: !!communityId && isValid && !!session?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to join a community
 */
export function useJoinCommunity() {
  const queryClient = useQueryClient();
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async (communityId: string) => {
      if (!session?.userId || !session.accessToken) {
        throw new Error('You must be signed in to join a community');
      }

      const result = await communityService.joinCommunity(
        communityId,
        session.userId,
        session.accessToken
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (_, communityId) => {
      // Invalidate relevant queries
      if (session?.userId) {
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.membership(communityId, session.userId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to leave a community
 */
export function useLeaveCommunity() {
  const queryClient = useQueryClient();
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async (communityId: string) => {
      if (!session?.userId || !session.accessToken) {
        throw new Error('You must be signed in to leave a community');
      }

      const result = await communityService.leaveCommunity(
        communityId,
        session.userId,
        session.accessToken
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (_, communityId) => {
      // Invalidate relevant queries
      if (session?.userId) {
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.membership(communityId, session.userId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      });
    },
  });
}

/**
 * Parameters for creating a new post
 */
interface CreatePostParams {
  communityId: string;
  title: string;
  body: string | null;
  postType: string;
}

/**
 * Hook to create a new post in a community
 */
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async ({ communityId, title, body, postType }: CreatePostParams) => {
      if (!session?.userId || !session.accessToken) {
        throw new Error('You must be signed in to create a post');
      }

      const result = await communityService.createPost(
        communityId,
        session.userId,
        title,
        body,
        postType,
        session.accessToken
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (_, { communityId }) => {
      // Invalidate posts query to refetch with new post
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.posts(communityId),
      });
      // Also invalidate community stats (post count may have changed)
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      });
    },
  });
}

/**
 * Parameters for updating an existing post
 */
interface UpdatePostParams {
  postId: string;
  communityId: string;
  title: string;
  body: string | null;
  postType: string;
}

/**
 * Hook to update an existing post
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async ({ postId, title, body, postType }: UpdatePostParams) => {
      if (!session?.accessToken) {
        throw new Error('You must be signed in to edit a post');
      }

      const result = await communityService.updatePost(
        postId,
        title,
        body,
        postType,
        session.accessToken
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (_, { communityId }) => {
      // Invalidate posts query to refetch with updated post
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.posts(communityId),
      });
      // Also invalidate feed posts
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to fetch all communities the user has joined
 */
export function useUserCommunities() {
  const { session, isValid } = useRegattaFlowSession();

  return useQuery({
    queryKey: session?.userId
      ? communityQueryKeys.userCommunities(session.userId)
      : [...communityQueryKeys.all, 'user-communities', 'none'],
    queryFn: async () => {
      if (!session?.userId || !session.accessToken) {
        return [];
      }
      const result = await communityService.getUserCommunities(
        session.userId,
        session.accessToken
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
    enabled: isValid && !!session?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch feed posts from all joined communities
 */
export function useFeedPosts() {
  const { session, isValid } = useRegattaFlowSession();

  return useQuery({
    queryKey: session?.userId
      ? communityQueryKeys.feedPosts(session.userId)
      : [...communityQueryKeys.all, 'feed', 'none'],
    queryFn: async () => {
      if (!session?.userId || !session.accessToken) {
        return [];
      }
      const result = await communityService.getFeedPosts(
        session.userId,
        session.accessToken
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
    enabled: isValid && !!session?.userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Combined hook for feed data (user's communities and aggregated posts)
 */
export function useFeed() {
  const communitiesQuery = useUserCommunities();
  const postsQuery = useFeedPosts();

  return {
    // Communities data
    communities: communitiesQuery.data ?? [],
    isCommunitiesLoading: communitiesQuery.isLoading,
    communitiesError: communitiesQuery.error,

    // Posts data
    posts: postsQuery.data ?? [],
    isPostsLoading: postsQuery.isLoading,
    postsError: postsQuery.error,

    // Combined states
    isLoading: communitiesQuery.isLoading || postsQuery.isLoading,
    isRefreshing: communitiesQuery.isFetching || postsQuery.isFetching,
    isEmpty: (communitiesQuery.data?.length ?? 0) === 0,

    // Refetch functions
    refetchCommunities: communitiesQuery.refetch,
    refetchPosts: postsQuery.refetch,
    refetchAll: async () => {
      await Promise.all([
        communitiesQuery.refetch(),
        postsQuery.refetch(),
      ]);
    },
  };
}

/**
 * Combined hook for community data with posts and membership
 * This is the main hook to use in the DiscussScreen
 * @param slug - Community slug (defaults to Dragon Worlds)
 * @param sortBy - Sort order for posts: 'new' (most recent) or 'top' (most upvotes)
 */
export function useCommunityWithPosts(
  slug: string = DRAGON_WORLDS_COMMUNITY_SLUG,
  sortBy: PostSortBy = 'new'
) {
  const communityQuery = useCommunity(slug);
  const postsQuery = useCommunityPosts(communityQuery.data?.id, true, sortBy);
  const membershipQuery = useCommunityMembership(communityQuery.data?.id);

  return {
    // Community data
    community: communityQuery.data,
    isCommunityLoading: communityQuery.isLoading,
    communityError: communityQuery.error,

    // Posts data
    posts: postsQuery.data ?? [],
    isPostsLoading: postsQuery.isLoading,
    postsError: postsQuery.error,

    // Membership data
    membership: membershipQuery.data,
    isMember: !!membershipQuery.data,
    isMembershipLoading: membershipQuery.isLoading,

    // Combined states
    isLoading: communityQuery.isLoading || postsQuery.isLoading,
    isRefreshing:
      communityQuery.isFetching ||
      postsQuery.isFetching ||
      membershipQuery.isFetching,

    // Refetch functions
    refetchCommunity: communityQuery.refetch,
    refetchPosts: postsQuery.refetch,
    refetchMembership: membershipQuery.refetch,
    refetchAll: async () => {
      await Promise.all([
        communityQuery.refetch(),
        postsQuery.refetch(),
        membershipQuery.refetch(),
      ]);
    },
  };
}

/**
 * Hook to fetch comments for a post
 * @param postId - The post/discussion UUID
 * @param enabled - Whether to enable the query
 */
export function usePostComments(postId: string | undefined, enabled: boolean = true) {
  const { session, isValid } = useRegattaFlowSession();

  return useQuery({
    queryKey: postId
      ? communityQueryKeys.postComments(postId)
      : [...communityQueryKeys.all, 'comments', 'none'],
    queryFn: async () => {
      if (!postId) {
        return [];
      }
      const result = await communityService.getPostComments(postId, session?.accessToken);
      // Return empty array even on error for graceful degradation
      return result.data ?? [];
    },
    // Only enable when session is valid to prevent JWT expired errors
    enabled: enabled && !!postId && isValid,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to check if user has voted on a post
 * @param postId - The post/discussion UUID
 */
export function useUserVote(postId: string | undefined) {
  const { session, isValid } = useRegattaFlowSession();

  return useQuery({
    queryKey:
      postId && session?.userId
        ? communityQueryKeys.userVote(postId, session.userId)
        : [...communityQueryKeys.all, 'vote', 'none'],
    queryFn: async () => {
      if (!postId || !session?.userId || !session.accessToken) {
        return null;
      }
      const result = await communityService.checkUserVote(
        postId,
        session.userId,
        session.accessToken
      );
      if (result.error) {
        console.warn('[useUserVote] Error:', result.error);
        return null;
      }
      return result.data;
    },
    enabled: !!postId && isValid && !!session?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Parameters for creating a new comment
 */
interface CreateCommentParams {
  postId: string;
  body: string;
  parentCommentId?: string | null;
}

/**
 * Hook to create a comment on a post
 */
export function useCreateComment() {
  const queryClient = useQueryClient();
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async ({ postId, body, parentCommentId = null }: CreateCommentParams) => {
      if (!session?.userId || !session.accessToken) {
        throw new Error('You must be signed in to comment');
      }

      const result = await communityService.createComment(
        postId,
        session.userId,
        body,
        parentCommentId,
        session.accessToken
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (_, { postId }) => {
      // Invalidate comments query to refetch with new comment
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.postComments(postId),
      });
      // Also invalidate posts to update comment count
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      });
    },
  });
}

/**
 * Parameters for updating a comment
 */
interface UpdateCommentParams {
  commentId: string;
  postId: string;
  body: string;
}

/**
 * Hook to update an existing comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async ({ commentId, body }: UpdateCommentParams) => {
      if (!session?.accessToken) {
        throw new Error('You must be signed in to edit a comment');
      }

      const result = await communityService.updateComment(
        commentId,
        body,
        session.accessToken
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (_, { postId }) => {
      // Invalidate comments query to refetch with updated comment
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.postComments(postId),
      });
    },
  });
}

/**
 * Hook to toggle upvote on a post (legacy)
 * @deprecated Use useTogglePostVote for full upvote/downvote support
 */
export function useToggleUpvote() {
  const queryClient = useQueryClient();
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!session?.userId || !session.accessToken) {
        throw new Error('You must be signed in to upvote');
      }

      const result = await communityService.toggleUpvote(
        postId,
        session.userId,
        session.accessToken
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data; // true = upvoted, false = removed
    },
    onSuccess: (_, postId) => {
      // Invalidate vote query
      if (session?.userId) {
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.userVote(postId, session.userId),
        });
      }
      // Invalidate posts to update upvote count
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      });
    },
  });
}

/**
 * Parameters for toggling a post vote
 */
interface TogglePostVoteParams {
  postId: string;
  voteType: 1 | -1; // 1 = upvote, -1 = downvote
}

/**
 * Hook to toggle vote on a post (supports upvote and downvote)
 */
export function useTogglePostVote() {
  const queryClient = useQueryClient();
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async ({ postId, voteType }: TogglePostVoteParams) => {
      if (!session?.userId || !session.accessToken) {
        throw new Error('You must be signed in to vote');
      }

      const result = await communityService.togglePostVote(
        postId,
        session.userId,
        voteType,
        session.accessToken
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (_, { postId }) => {
      // Invalidate vote query
      if (session?.userId) {
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.userVote(postId, session.userId),
        });
      }
      // Invalidate posts to update vote counts
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to increment view count on a post
 */
export function useIncrementViewCount() {
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async (postId: string) => {
      const result = await communityService.incrementViewCount(postId, session?.accessToken);
      if (result.error) {
        console.warn('[useIncrementViewCount] Error:', result.error);
      }
      return result.data;
    },
  });
}

/**
 * Hook to check if user has voted on a comment
 * @param commentId - The comment UUID
 */
export function useCommentVote(commentId: string | undefined) {
  const { session, isValid } = useRegattaFlowSession();

  return useQuery({
    queryKey:
      commentId && session?.userId
        ? communityQueryKeys.commentVote(commentId, session.userId)
        : [...communityQueryKeys.all, 'comment-vote', 'none'],
    queryFn: async () => {
      if (!commentId || !session?.userId || !session.accessToken) {
        return null;
      }
      const result = await communityService.checkCommentVote(
        commentId,
        session.userId,
        session.accessToken
      );
      if (result.error) {
        console.warn('[useCommentVote] Error:', result.error);
        return null;
      }
      return result.data;
    },
    enabled: !!commentId && isValid && !!session?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Parameters for toggling a comment vote
 */
interface ToggleCommentVoteParams {
  commentId: string;
  voteType: 1 | -1; // 1 = upvote, -1 = downvote
}

/**
 * Hook to toggle vote on a comment
 */
export function useToggleCommentVote() {
  const queryClient = useQueryClient();
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async ({ commentId, voteType }: ToggleCommentVoteParams) => {
      if (!session?.userId || !session.accessToken) {
        throw new Error('You must be signed in to vote');
      }

      const result = await communityService.toggleCommentVote(
        commentId,
        session.userId,
        voteType,
        session.accessToken
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (_, { commentId }) => {
      // Invalidate comment vote query
      if (session?.userId) {
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.commentVote(commentId, session.userId),
        });
      }
      // Invalidate comments to update vote counts
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to toggle pin status on a post (moderators/admins only)
 */
export function useTogglePinPost() {
  const queryClient = useQueryClient();
  const { session } = useRegattaFlowSession();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!session?.accessToken) {
        throw new Error('You must be signed in to pin posts');
      }

      const result = await communityService.togglePinPost(
        postId,
        session.accessToken
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate posts to refresh with new pin status
      queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      });
    },
  });
}
