/**
 * RegattaFlow Discuss Integration Types
 *
 * Type definitions for the Firebase-to-Supabase auth bridge
 * and community WebView integration.
 */

import { WebViewMessageType } from '../config/regattaFlow';

/**
 * Profile data sent to the auth bridge
 * This is used to sync user profile information to RegattaFlow
 */
export interface RegattaFlowProfile {
  /** User's display name */
  displayName: string;
  /** User's boat class (e.g., "Dragon") */
  boatClass?: string;
  /** User's club or organization name */
  clubName?: string;
  /** User's profile photo URL */
  photoUrl?: string;
}

/**
 * Session returned from the auth bridge
 * Contains the access token and metadata for authenticating with RegattaFlow
 */
export interface RegattaFlowSession {
  /** Supabase access token for RegattaFlow */
  accessToken: string;
  /** RegattaFlow user ID */
  userId: string;
  /** User email address */
  email: string;
  /** Session expiry timestamp (ISO string or Unix timestamp) */
  expiresAt: number;
  /** Optional refresh token for session renewal */
  refreshToken?: string;
}

/**
 * Response from the auth bridge endpoint
 */
export interface AuthBridgeResponse {
  /** Whether the authentication was successful */
  success: boolean;
  /** Session data (present on success) */
  session?: RegattaFlowSession;
  /** Error message (present on failure) */
  error?: string;
  /** Error code (present on failure) */
  code?: string;
}

/**
 * Messages received from the WebView
 */
export interface RegattaFlowWebViewMessage {
  /** Message type identifier */
  type: WebViewMessageType;
  /** Optional payload data */
  payload?: {
    /** URL for navigation requests */
    url?: string;
    /** Error message for failure events */
    error?: string;
    /** Success data */
    data?: Record<string, unknown>;
  };
}

/**
 * State for the RegattaFlow session store
 */
export interface RegattaFlowState {
  /** Current session (null if not authenticated) */
  session: RegattaFlowSession | null;
  /** Loading state for auth operations */
  isLoading: boolean;
  /** Error message from last failed operation */
  error: string | null;
  /** Timestamp of last refresh attempt (for rate limiting) */
  lastRefreshAttempt: number | null;
}

/**
 * Actions for the RegattaFlow session store
 */
export interface RegattaFlowActions {
  /** Set the current session */
  setSession: (session: RegattaFlowSession | null) => void;
  /** Clear the current session */
  clearSession: () => void;
  /** Set loading state */
  setLoading: (isLoading: boolean) => void;
  /** Set error message */
  setError: (error: string | null) => void;
  /** Update last refresh attempt timestamp */
  updateLastRefreshAttempt: () => void;
}

/**
 * Combined type for the RegattaFlow Zustand store
 */
export type RegattaFlowStore = RegattaFlowState & RegattaFlowActions;
