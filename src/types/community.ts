/**
 * Community Types for RegattaFlow Integration
 *
 * Types for the native Discuss screen that connects to RegattaFlow's
 * Supabase backend for community and discussion features.
 */

/**
 * Post type categories for community discussions
 * Must match RegattaFlow's venue_discussions.post_type CHECK constraint:
 * ('tip', 'question', 'report', 'discussion', 'safety_alert')
 */
export type PostType =
  | 'discussion'  // was 'general' - renamed to match RegattaFlow DB
  | 'question'
  | 'tip'
  | 'report'      // was 'race_report' - renamed to match RegattaFlow DB
  | 'safety_alert';

/**
 * Author information for a post
 */
export interface PostAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Community summary for feed posts
 */
export interface PostCommunity {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
}

/**
 * A community post/discussion
 * Maps to venue_discussions table in RegattaFlow Supabase
 */
export interface CommunityPost {
  id: string;
  community_id: string | null;
  venue_id: string | null;
  author_id: string | null;
  title: string;
  body: string | null;
  post_type: PostType;
  category: string | null;
  pinned: boolean;
  is_public: boolean;
  is_resolved: boolean;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  author?: PostAuthor;
  community?: PostCommunity;
  /** Whether the current user has upvoted this post (computed client-side) */
  has_upvoted?: boolean;
}

/**
 * Community information with stats
 * Maps to communities_with_stats view in RegattaFlow Supabase
 */
export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  community_type: string;
  category_id: string | null;
  icon_url: string | null;
  banner_url: string | null;
  created_by: string | null;
  is_official: boolean;
  is_verified: boolean;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  // Stats from communities_with_stats view
  member_count?: number;
  post_count?: number;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
  posts_last_24h?: number;
  new_members_7d?: number;
  // User's membership status (computed client-side)
  is_member?: boolean;
  user_role?: string | null;
}

/**
 * User's membership in a community
 */
export interface CommunityMembership {
  id: string;
  user_id: string;
  community_id: string;
  role: 'member' | 'moderator' | 'admin' | 'owner';
  notifications_enabled: boolean;
  joined_at: string;
}

/**
 * Community member with user profile info
 * Used for displaying member lists
 */
export interface CommunityMember {
  id: string;
  user_id: string;
  community_id: string;
  role: 'member' | 'moderator' | 'admin' | 'owner';
  joined_at: string;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * A comment on a post
 * Maps to venue_discussion_comments table in RegattaFlow Supabase
 */
export interface PostComment {
  id: string;
  discussion_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  upvotes: number;
  downvotes: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author?: PostAuthor;
  replies?: PostComment[];
}

/**
 * User's vote on a post or comment
 * Maps to venue_discussion_votes table in RegattaFlow Supabase
 */
export interface PostVote {
  id: string;
  user_id: string;
  target_id: string;
  target_type: 'discussion' | 'comment';
  vote: 1 | -1; // 1 = upvote, -1 = downvote
  created_at: string;
}

/**
 * Post badge styling configuration
 */
export interface PostTypeBadgeConfig {
  label: string;
  color: string;
  backgroundColor: string;
}

/**
 * Map of post types to their badge configurations
 * Keys must match RegattaFlow's venue_discussions.post_type values
 */
export const POST_TYPE_BADGES: Record<PostType, PostTypeBadgeConfig> = {
  discussion: {
    label: 'Discussion',
    color: '#4A5568',
    backgroundColor: '#E2E8F0',
  },
  question: {
    label: 'Question',
    color: '#3182CE',
    backgroundColor: '#BEE3F8',
  },
  tip: {
    label: 'Tip',
    color: '#38A169',
    backgroundColor: '#C6F6D5',
  },
  report: {
    label: 'Race Report',
    color: '#D69E2E',
    backgroundColor: '#FEFCBF',
  },
  safety_alert: {
    label: 'Safety Alert',
    color: '#E53E3E',
    backgroundColor: '#FED7D7',
  },
};

/**
 * Default Dragon Worlds community slug
 */
export const DRAGON_WORLDS_COMMUNITY_SLUG = '2027-hk-dragon-worlds';

/**
 * RegattaFlow base URLs
 */
export const REGATTAFLOW_URLS = {
  community: (slug: string) => `https://regattaflow.com/community/${slug}`,
  post: (communitySlug: string, postId: string) =>
    `https://regattaflow.com/venue/post/${postId}`,
  app: 'https://regattaflow.com',
  appStore: 'https://apps.apple.com/app/regattaflow/id6740091218',
  playStore: 'https://play.google.com/store/apps/details?id=com.regattaflow.app',
} as const;
