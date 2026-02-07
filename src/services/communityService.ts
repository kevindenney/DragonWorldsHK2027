/**
 * Community Service for RegattaFlow Integration
 *
 * Direct Supabase queries for community data, posts, and membership.
 * Uses the existing auth bridge tokens for authenticated requests.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Community,
  CommunityPost,
  CommunityMembership,
  CommunityMember,
  PostComment,
  PostVote,
  DRAGON_WORLDS_COMMUNITY_SLUG,
} from '../types/community';

/**
 * RegattaFlow Supabase configuration
 * These are public anon credentials - safe to use in client-side code
 */
const SUPABASE_URL = 'https://qavekrwdbsobecwrfxwu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdmVrcndkYnNvYmVjd3JmeHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjU3MzIsImV4cCI6MjA3NDUwMTczMn0.iP6KVo3sJFp08yMCSAc9X9RyQgQFI_n8Az7-7_M2Cog';

/**
 * Default page size for post fetching
 */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Create a Supabase client with optional authentication
 * @param accessToken - Optional JWT access token from RegattaFlow session
 */
function getSupabaseClient(accessToken?: string): SupabaseClient {
  const options: Parameters<typeof createClient>[2] = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  };

  // If we have an access token, add it to headers
  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
}

/**
 * Service response wrapper
 */
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetch a community by its slug
 * @param slug - The community slug (e.g., '2027-hk-dragon-worlds')
 * @param accessToken - Optional access token for authenticated requests
 */
export async function getCommunityBySlug(
  slug: string,
  accessToken?: string
): Promise<ServiceResponse<Community>> {
  try {
    const client = getSupabaseClient(accessToken);

    const { data, error } = await client
      .from('communities_with_stats')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('[CommunityService] Error fetching community:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Community, error: null };
  } catch (err) {
    console.error('[CommunityService] Exception fetching community:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Fetch a community by its ID
 * @param communityId - The community UUID
 * @param accessToken - Optional access token for authenticated requests
 */
export async function getCommunityById(
  communityId: string,
  accessToken?: string
): Promise<ServiceResponse<Community>> {
  try {
    const client = getSupabaseClient(accessToken);

    const { data, error } = await client
      .from('communities_with_stats')
      .select('*')
      .eq('id', communityId)
      .single();

    if (error) {
      console.error('[CommunityService] Error fetching community by ID:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Community, error: null };
  } catch (err) {
    console.error('[CommunityService] Exception fetching community by ID:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Post sort options
 */
export type PostSortBy = 'new' | 'top';

/**
 * Fetch posts for a community
 * @param communityId - The community UUID
 * @param accessToken - Optional access token for authenticated requests
 * @param page - Page number (0-indexed)
 * @param pageSize - Number of posts per page
 * @param sortBy - Sort order: 'new' (most recent) or 'top' (most upvotes)
 */
export async function getCommunityPosts(
  communityId: string,
  accessToken?: string,
  page: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE,
  sortBy: PostSortBy = 'new'
): Promise<ServiceResponse<CommunityPost[]>> {
  try {
    const client = getSupabaseClient(accessToken);
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Build query with dynamic sort order
    // Pinned posts always come first, then sort by either date or upvotes
    const { data, error } = await client
      .from('venue_discussions')
      .select(
        `
        *,
        author:users!author_id (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq('community_id', communityId)
      .eq('is_public', true)
      .order('pinned', { ascending: false })
      .order(sortBy === 'top' ? 'upvotes' : 'created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[CommunityService] Error fetching posts:', error);
      return { data: null, error: error.message };
    }

    return { data: data as CommunityPost[], error: null };
  } catch (err) {
    console.error('[CommunityService] Exception fetching posts:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Fetch members of a community with user profile info
 * @param communityId - The community UUID
 * @param accessToken - Optional access token for authenticated requests
 * @param page - Page number (0-indexed)
 * @param pageSize - Number of members per page
 */
export async function getCommunityMembers(
  communityId: string,
  accessToken?: string,
  page: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<ServiceResponse<CommunityMember[]>> {
  try {
    const client = getSupabaseClient(accessToken);
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // First, fetch memberships
    const { data: memberships, error: membershipError } = await client
      .from('community_memberships')
      .select('id, user_id, community_id, role, joined_at')
      .eq('community_id', communityId)
      .order('joined_at', { ascending: false })
      .range(from, to);

    if (membershipError) {
      console.error('[CommunityService] Error fetching memberships:', membershipError);
      return { data: null, error: membershipError.message };
    }

    if (!memberships || memberships.length === 0) {
      return { data: [], error: null };
    }

    // Get unique user IDs
    const userIds = memberships.map((m) => m.user_id);

    // Fetch user profiles separately
    const { data: users, error: usersError } = await client
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (usersError) {
      console.warn('[CommunityService] Could not fetch user profiles:', usersError.message);
      // Continue without user profiles rather than failing completely
    }

    // Create a map of user_id to user profile
    const userMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>();
    if (users) {
      for (const user of users) {
        userMap.set(user.id, user);
      }
    }

    // Combine memberships with user profiles
    const members: CommunityMember[] = memberships.map((membership) => ({
      id: membership.id,
      user_id: membership.user_id,
      community_id: membership.community_id,
      role: membership.role,
      joined_at: membership.joined_at,
      user: userMap.get(membership.user_id) ?? undefined,
    }));

    return { data: members, error: null };
  } catch (err) {
    console.error('[CommunityService] Exception fetching members:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Check if the current user is a member of a community
 * @param communityId - The community UUID
 * @param userId - The user's UUID
 * @param accessToken - Access token for authenticated request
 */
export async function checkMembership(
  communityId: string,
  userId: string,
  accessToken: string
): Promise<ServiceResponse<CommunityMembership | null>> {
  try {
    const client = getSupabaseClient(accessToken);

    const { data, error } = await client
      .from('community_memberships')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[CommunityService] Error checking membership:', error);
      return { data: null, error: error.message };
    }

    return { data: data as CommunityMembership | null, error: null };
  } catch (err) {
    console.error('[CommunityService] Exception checking membership:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Join a community
 * @param communityId - The community UUID
 * @param userId - The user's UUID
 * @param accessToken - Access token for authenticated request
 */
export async function joinCommunity(
  communityId: string,
  userId: string,
  accessToken: string
): Promise<ServiceResponse<CommunityMembership>> {
  try {
    const client = getSupabaseClient(accessToken);

    const { data, error } = await client
      .from('community_memberships')
      .upsert(
        {
          user_id: userId,
          community_id: communityId,
          role: 'member',
          notifications_enabled: true,
        },
        {
          onConflict: 'user_id,community_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[CommunityService] Error joining community:', error);
      return { data: null, error: error.message };
    }

    return { data: data as CommunityMembership, error: null };
  } catch (err) {
    console.error('[CommunityService] Exception joining community:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Leave a community
 * @param communityId - The community UUID
 * @param userId - The user's UUID
 * @param accessToken - Access token for authenticated request
 */
export async function leaveCommunity(
  communityId: string,
  userId: string,
  accessToken: string
): Promise<ServiceResponse<boolean>> {
  try {
    const client = getSupabaseClient(accessToken);

    const { error } = await client
      .from('community_memberships')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) {
      console.error('[CommunityService] Error leaving community:', error);
      return { data: false, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[CommunityService] Exception leaving community:', err);
    return {
      data: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Create a new post in a community
 * @param communityId - The community UUID
 * @param authorId - The author's user UUID
 * @param title - Post title
 * @param body - Post body (optional)
 * @param postType - Type of post (general, question, tip, etc.)
 * @param accessToken - Access token for authenticated request
 */
export async function createPost(
  communityId: string,
  authorId: string,
  title: string,
  body: string | null,
  postType: string,
  accessToken: string
): Promise<ServiceResponse<CommunityPost>> {
  try {
    const client = getSupabaseClient(accessToken);

    const { data, error } = await client
      .from('venue_discussions')
      .insert({
        community_id: communityId,
        author_id: authorId,
        title,
        body,
        post_type: postType,
        is_public: true,
        upvotes: 0,
        downvotes: 0,
        comment_count: 0,
        view_count: 0,
        pinned: false,
        is_resolved: false,
      })
      .select(
        `
        *,
        author:users!author_id (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error('[CommunityService] Error creating post:', error);
      return { data: null, error: error.message };
    }

    return { data: data as CommunityPost, error: null };
  } catch (err) {
    console.error('[CommunityService] Exception creating post:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get all communities the user has joined
 * @param userId - The user's UUID
 * @param accessToken - Access token for authenticated request
 */
export async function getUserCommunities(
  userId: string,
  accessToken: string
): Promise<ServiceResponse<Community[]>> {
  try {
    const client = getSupabaseClient(accessToken);

    // First get the user's memberships
    const { data: memberships, error: membershipError } = await client
      .from('community_memberships')
      .select('community_id')
      .eq('user_id', userId);

    if (membershipError) {
      console.error('[CommunityService] Error fetching memberships:', membershipError);
      return { data: null, error: membershipError.message };
    }

    if (!memberships || memberships.length === 0) {
      return { data: [], error: null };
    }

    // Get the community details for joined communities
    const communityIds = memberships.map((m) => m.community_id);
    const { data: communities, error: communitiesError } = await client
      .from('communities_with_stats')
      .select('*')
      .in('id', communityIds);

    if (communitiesError) {
      console.error('[CommunityService] Error fetching communities:', communitiesError);
      return { data: null, error: communitiesError.message };
    }

    return { data: communities as Community[], error: null };
  } catch (err) {
    console.error('[CommunityService] Exception fetching user communities:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get feed posts from all communities the user has joined
 * @param userId - The user's UUID
 * @param accessToken - Access token for authenticated request
 * @param page - Page number (0-indexed)
 * @param pageSize - Number of posts per page
 */
export async function getFeedPosts(
  userId: string,
  accessToken: string,
  page: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<ServiceResponse<CommunityPost[]>> {
  try {
    const client = getSupabaseClient(accessToken);
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // First get the user's memberships
    const { data: memberships, error: membershipError } = await client
      .from('community_memberships')
      .select('community_id')
      .eq('user_id', userId);

    if (membershipError) {
      console.error('[CommunityService] Error fetching memberships for feed:', membershipError);
      return { data: null, error: membershipError.message };
    }

    if (!memberships || memberships.length === 0) {
      return { data: [], error: null };
    }

    // Get posts from all joined communities
    const communityIds = memberships.map((m) => m.community_id);
    const { data: posts, error: postsError } = await client
      .from('venue_discussions')
      .select(
        `
        *,
        author:users!author_id (
          id,
          full_name,
          avatar_url
        ),
        community:communities!community_id (
          id,
          name,
          slug,
          icon_url
        )
      `
      )
      .in('community_id', communityIds)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (postsError) {
      console.error('[CommunityService] Error fetching feed posts:', postsError);
      return { data: null, error: postsError.message };
    }

    return { data: posts as CommunityPost[], error: null };
  } catch (err) {
    console.error('[CommunityService] Exception fetching feed posts:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get comments for a post, sorted by best (score = upvotes - downvotes)
 * @param discussionId - The post/discussion UUID
 * @param accessToken - Optional access token for authenticated requests
 */
export async function getPostComments(
  discussionId: string,
  accessToken?: string
): Promise<ServiceResponse<PostComment[]>> {
  try {
    const client = getSupabaseClient(accessToken);

    const { data, error } = await client
      .from('venue_discussion_comments')
      .select('*')
      .eq('discussion_id', discussionId)
      .is('parent_id', null) // Top-level comments only
      .order('upvotes', { ascending: false }) // Sort by best (most upvotes first)
      .order('created_at', { ascending: true }); // Then by oldest first for same score

    if (error) {
      // Silently return empty array if table doesn't exist or access denied
      // This allows the feature to gracefully degrade
      console.warn('[CommunityService] Comments not available:', error.message);
      return { data: [], error: null };
    }

    // Fetch replies for each comment, also sorted by best
    const comments = data as PostComment[];
    for (const comment of comments) {
      const { data: replies } = await client
        .from('venue_discussion_comments')
        .select('*')
        .eq('parent_id', comment.id)
        .order('upvotes', { ascending: false }) // Sort replies by best too
        .order('created_at', { ascending: true });

      if (replies) {
        comment.replies = replies as PostComment[];
      }
    }

    return { data: comments, error: null };
  } catch (err) {
    // Silently return empty array on exception
    console.warn('[CommunityService] Comments exception:', err);
    return { data: [], error: null };
  }
}

/**
 * Create a comment on a post
 * @param discussionId - The post/discussion UUID
 * @param authorId - The author's user UUID
 * @param body - Comment text
 * @param parentCommentId - Optional parent comment ID for replies
 * @param accessToken - Access token for authenticated request
 */
export async function createComment(
  discussionId: string,
  authorId: string,
  body: string,
  parentCommentId: string | null,
  accessToken: string
): Promise<ServiceResponse<PostComment>> {
  try {
    const client = getSupabaseClient(accessToken);

    const { data, error } = await client
      .from('venue_discussion_comments')
      .insert({
        discussion_id: discussionId,
        author_id: authorId,
        body,
        parent_id: parentCommentId,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[CommunityService] Error creating comment:', error);
      // Return actual error for debugging
      return { data: null, error: error.message };
    }

    // Try to update comment count (may fail if RPC doesn't exist)
    try {
      const { data: post } = await client
        .from('venue_discussions')
        .select('comment_count')
        .eq('id', discussionId)
        .single();

      if (post) {
        await client
          .from('venue_discussions')
          .update({ comment_count: (post.comment_count || 0) + 1 })
          .eq('id', discussionId);
      }
    } catch {
      // Ignore comment count update errors
    }

    return { data: data as PostComment, error: null };
  } catch (err) {
    console.error('[CommunityService] Exception creating comment:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Check if user has voted on a post
 * @param discussionId - The post/discussion UUID
 * @param userId - The user's UUID
 * @param accessToken - Access token for authenticated request
 */
export async function checkUserVote(
  discussionId: string,
  userId: string,
  accessToken: string
): Promise<ServiceResponse<PostVote | null>> {
  try {
    const client = getSupabaseClient(accessToken);

    const { data, error } = await client
      .from('venue_discussion_votes')
      .select('*')
      .eq('target_id', discussionId)
      .eq('target_type', 'discussion')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Silently return null if table doesn't exist
      console.warn('[CommunityService] Votes not available:', error.message);
      return { data: null, error: null };
    }

    return { data: data as PostVote | null, error: null };
  } catch (err) {
    console.warn('[CommunityService] Votes exception:', err);
    return { data: null, error: null };
  }
}

/**
 * Toggle vote on a post (upvote or downvote)
 * @param discussionId - The post/discussion UUID
 * @param userId - The user's UUID
 * @param voteType - 1 for upvote, -1 for downvote
 * @param accessToken - Access token for authenticated request
 * @returns Object with vote state and counts
 */
export async function togglePostVote(
  discussionId: string,
  userId: string,
  voteType: 1 | -1,
  accessToken: string
): Promise<ServiceResponse<{ hasUpvoted: boolean; hasDownvoted: boolean; upvotes: number; downvotes: number }>> {
  try {
    const client = getSupabaseClient(accessToken);

    // Check if user already voted
    const { data: existingVote, error: checkError } = await client
      .from('venue_discussion_votes')
      .select('*')
      .eq('target_id', discussionId)
      .eq('target_type', 'discussion')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('[CommunityService] Votes check error:', checkError);
      return { data: null, error: checkError.message };
    }

    let hasUpvoted = false;
    let hasDownvoted = false;

    if (existingVote) {
      const existingVoteType = existingVote.vote as number;

      if (existingVoteType === voteType) {
        // Same vote type - remove the vote
        const { error: deleteError } = await client
          .from('venue_discussion_votes')
          .delete()
          .eq('target_id', discussionId)
          .eq('target_type', 'discussion')
          .eq('user_id', userId);

        if (deleteError) {
          console.error('[CommunityService] Error removing vote:', deleteError);
          return { data: null, error: deleteError.message };
        }
        // hasUpvoted and hasDownvoted stay false (vote removed)
      } else {
        // Different vote type - update the vote
        const { error: updateError } = await client
          .from('venue_discussion_votes')
          .update({ vote: voteType })
          .eq('target_id', discussionId)
          .eq('target_type', 'discussion')
          .eq('user_id', userId);

        if (updateError) {
          console.error('[CommunityService] Error updating vote:', updateError);
          return { data: null, error: updateError.message };
        }

        hasUpvoted = voteType === 1;
        hasDownvoted = voteType === -1;
      }
    } else {
      // No existing vote - insert new vote
      const { error: insertError } = await client
        .from('venue_discussion_votes')
        .insert({
          target_id: discussionId,
          target_type: 'discussion',
          user_id: userId,
          vote: voteType,
        });

      if (insertError) {
        console.error('[CommunityService] Error adding vote:', insertError);
        return { data: null, error: `Vote failed: ${insertError.message}` };
      }

      hasUpvoted = voteType === 1;
      hasDownvoted = voteType === -1;
    }

    // Count actual votes from database (no more increment/decrement bugs!)
    const { count: upvoteCount } = await client
      .from('venue_discussion_votes')
      .select('*', { count: 'exact', head: true })
      .eq('target_id', discussionId)
      .eq('target_type', 'discussion')
      .eq('vote', 1);

    const { count: downvoteCount } = await client
      .from('venue_discussion_votes')
      .select('*', { count: 'exact', head: true })
      .eq('target_id', discussionId)
      .eq('target_type', 'discussion')
      .eq('vote', -1);

    const newUpvotes = upvoteCount || 0;
    const newDownvotes = downvoteCount || 0;

    // Update the post with accurate counts
    await client
      .from('venue_discussions')
      .update({ upvotes: newUpvotes, downvotes: newDownvotes })
      .eq('id', discussionId);

    return {
      data: {
        hasUpvoted,
        hasDownvoted,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
      },
      error: null,
    };
  } catch (err) {
    console.error('[CommunityService] Vote exception:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Toggle upvote on a post (legacy wrapper for backwards compatibility)
 * @deprecated Use togglePostVote instead
 */
export async function toggleUpvote(
  discussionId: string,
  userId: string,
  accessToken: string
): Promise<ServiceResponse<boolean>> {
  const result = await togglePostVote(discussionId, userId, 1, accessToken);
  if (result.error) {
    return { data: false, error: result.error };
  }
  return { data: result.data?.hasUpvoted ?? false, error: null };
}

/**
 * Increment view count for a post
 * @param discussionId - The post/discussion UUID
 * @param accessToken - Optional access token
 */
export async function incrementViewCount(
  discussionId: string,
  accessToken?: string
): Promise<ServiceResponse<boolean>> {
  try {
    const client = getSupabaseClient(accessToken);

    // Fetch current view count and increment
    const { data: post } = await client
      .from('venue_discussions')
      .select('view_count')
      .eq('id', discussionId)
      .single();

    if (post) {
      const { error } = await client
        .from('venue_discussions')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', discussionId);

      if (error) {
        console.error('[CommunityService] Error incrementing view count:', error);
        return { data: false, error: error.message };
      }
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[CommunityService] Exception incrementing view count:', err);
    return {
      data: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Toggle pin status for a post (moderators/admins only)
 * @param discussionId - The post/discussion UUID
 * @param accessToken - Access token for authenticated request
 * @returns The new pinned status
 */
export async function togglePinPost(
  discussionId: string,
  accessToken: string
): Promise<ServiceResponse<{ pinned: boolean }>> {
  try {
    const client = getSupabaseClient(accessToken);

    // First get the current pin status
    const { data: post, error: fetchError } = await client
      .from('venue_discussions')
      .select('pinned')
      .eq('id', discussionId)
      .single();

    if (fetchError) {
      console.error('[CommunityService] Error fetching post for pin toggle:', fetchError);
      return { data: null, error: fetchError.message };
    }

    // Toggle the pinned status
    const newPinnedStatus = !post.pinned;

    const { error: updateError } = await client
      .from('venue_discussions')
      .update({ pinned: newPinnedStatus })
      .eq('id', discussionId);

    if (updateError) {
      console.error('[CommunityService] Error toggling pin status:', updateError);
      return { data: null, error: updateError.message };
    }

    return { data: { pinned: newPinnedStatus }, error: null };
  } catch (err) {
    console.error('[CommunityService] Exception toggling pin status:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Check if user has voted on a comment
 * @param commentId - The comment UUID
 * @param userId - The user's UUID
 * @param accessToken - Access token for authenticated request
 */
export async function checkCommentVote(
  commentId: string,
  userId: string,
  accessToken: string
): Promise<ServiceResponse<PostVote | null>> {
  try {
    const client = getSupabaseClient(accessToken);

    const { data, error } = await client
      .from('venue_discussion_votes')
      .select('*')
      .eq('target_id', commentId)
      .eq('target_type', 'comment')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Silently return null if table doesn't exist
      console.warn('[CommunityService] Comment votes not available:', error.message);
      return { data: null, error: null };
    }

    return { data: data as PostVote | null, error: null };
  } catch (err) {
    console.warn('[CommunityService] Comment votes exception:', err);
    return { data: null, error: null };
  }
}

/**
 * Toggle vote on a comment (upvote or downvote)
 * @param commentId - The comment UUID
 * @param userId - The user's UUID
 * @param voteType - 1 for upvote, -1 for downvote
 * @param accessToken - Access token for authenticated request
 * @returns Object with hasUpvoted, hasDownvoted, and net score change
 */
export async function toggleCommentVote(
  commentId: string,
  userId: string,
  voteType: 1 | -1,
  accessToken: string
): Promise<ServiceResponse<{ hasUpvoted: boolean; hasDownvoted: boolean; upvotes: number; downvotes: number }>> {
  try {
    const client = getSupabaseClient(accessToken);

    // Check if user already voted on this comment
    const { data: existingVote, error: checkError } = await client
      .from('venue_discussion_votes')
      .select('*')
      .eq('target_id', commentId)
      .eq('target_type', 'comment')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('[CommunityService] Comment vote check error:', checkError);
      return { data: null, error: checkError.message };
    }

    // Get current comment vote counts
    const { data: comment, error: commentError } = await client
      .from('venue_discussion_comments')
      .select('upvotes, downvotes')
      .eq('id', commentId)
      .single();

    if (commentError) {
      console.error('[CommunityService] Comment fetch error:', commentError);
      return { data: null, error: commentError.message };
    }

    let newUpvotes = comment.upvotes || 0;
    let newDownvotes = comment.downvotes || 0;
    let hasUpvoted = false;
    let hasDownvoted = false;

    if (existingVote) {
      const existingVoteType = existingVote.vote as number;

      if (existingVoteType === voteType) {
        // Same vote type - remove the vote
        const { error: deleteError } = await client
          .from('venue_discussion_votes')
          .delete()
          .eq('target_id', commentId)
          .eq('target_type', 'comment')
          .eq('user_id', userId);

        if (deleteError) {
          console.error('[CommunityService] Error removing comment vote:', deleteError);
          return { data: null, error: deleteError.message };
        }

        // Update counts
        if (voteType === 1) {
          newUpvotes = Math.max(0, newUpvotes - 1);
        } else {
          newDownvotes = Math.max(0, newDownvotes - 1);
        }
      } else {
        // Different vote type - update the vote
        const { error: updateError } = await client
          .from('venue_discussion_votes')
          .update({ vote: voteType })
          .eq('target_id', commentId)
          .eq('target_type', 'comment')
          .eq('user_id', userId);

        if (updateError) {
          console.error('[CommunityService] Error updating comment vote:', updateError);
          return { data: null, error: updateError.message };
        }

        // Update counts - remove old vote, add new vote
        if (voteType === 1) {
          // Changing from downvote to upvote
          newDownvotes = Math.max(0, newDownvotes - 1);
          newUpvotes = newUpvotes + 1;
          hasUpvoted = true;
        } else {
          // Changing from upvote to downvote
          newUpvotes = Math.max(0, newUpvotes - 1);
          newDownvotes = newDownvotes + 1;
          hasDownvoted = true;
        }
      }
    } else {
      // No existing vote - insert new vote
      const { error: insertError } = await client
        .from('venue_discussion_votes')
        .insert({
          target_id: commentId,
          target_type: 'comment',
          user_id: userId,
          vote: voteType,
        });

      if (insertError) {
        console.error('[CommunityService] Error adding comment vote:', insertError);
        return { data: null, error: `Vote failed: ${insertError.message}` };
      }

      // Update counts
      if (voteType === 1) {
        newUpvotes = newUpvotes + 1;
        hasUpvoted = true;
      } else {
        newDownvotes = newDownvotes + 1;
        hasDownvoted = true;
      }
    }

    // Update comment vote counts
    const { error: updateCommentError } = await client
      .from('venue_discussion_comments')
      .update({ upvotes: newUpvotes, downvotes: newDownvotes })
      .eq('id', commentId);

    if (updateCommentError) {
      console.error('[CommunityService] Error updating comment counts:', updateCommentError);
      // Don't fail - the vote was recorded
    }

    return {
      data: {
        hasUpvoted,
        hasDownvoted,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
      },
      error: null,
    };
  } catch (err) {
    console.error('[CommunityService] Comment vote exception:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Service object for convenient imports
 */
export const communityService = {
  getCommunityBySlug,
  getCommunityById,
  getCommunityPosts,
  getCommunityMembers,
  checkMembership,
  joinCommunity,
  leaveCommunity,
  createPost,
  getUserCommunities,
  getFeedPosts,
  getPostComments,
  createComment,
  checkUserVote,
  toggleUpvote,
  togglePostVote,
  togglePinPost,
  incrementViewCount,
  checkCommentVote,
  toggleCommentVote,
};

export default communityService;
