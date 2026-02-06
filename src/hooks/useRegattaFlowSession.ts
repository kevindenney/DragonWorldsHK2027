/**
 * RegattaFlow Session Management Hook
 *
 * Provides session management for RegattaFlow Discuss integration.
 * Handles automatic session refresh, profile building, and error handling.
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '../auth/useAuth';
import { useRegattaFlowStore } from '../stores/regattaFlowStore';
import {
  exchangeFirebaseToken,
  isSessionValid,
  isFirebaseAuthenticated,
  RegattaFlowAuthError,
} from '../services/regattaFlowAuthService';
import {
  REGATTAFLOW_COMMUNITY_URL,
  ACCESS_TOKEN_PARAM,
  REFRESH_TOKEN_PARAM,
} from '../config/regattaFlow';
import type { RegattaFlowProfile, RegattaFlowSession } from '../types/regattaFlow';

/**
 * Minimum time between refresh attempts (30 seconds)
 * Prevents excessive API calls during error states
 */
const MIN_REFRESH_INTERVAL_MS = 30 * 1000;

/**
 * Hook return type
 */
interface UseRegattaFlowSessionReturn {
  /** Current session (null if not authenticated) */
  session: RegattaFlowSession | null;
  /** Loading state for auth operations */
  isLoading: boolean;
  /** Error message from last failed operation */
  error: string | null;
  /** Whether the current session is valid */
  isValid: boolean;
  /** Whether the user is authenticated with Firebase */
  isFirebaseAuth: boolean;
  /** Full URL to load in WebView (with auth token) */
  discussUrl: string | null;
  /** Refresh the session (exchanges Firebase token for new session) */
  refreshSession: () => Promise<void>;
  /** Clear the current session */
  clearSession: () => void;
}

/**
 * Build a RegattaFlow profile from the current user's Firebase data
 */
function buildProfileFromUser(user: {
  displayName?: string;
  photoURL?: string;
  sailingProfile?: {
    boatClass?: string;
    yachtClub?: string;
  };
}): RegattaFlowProfile {
  return {
    displayName: user.displayName || 'Sailor',
    boatClass: user.sailingProfile?.boatClass,
    clubName: user.sailingProfile?.yachtClub,
    photoUrl: user.photoURL,
  };
}

/**
 * Hook for managing RegattaFlow session state
 */
export function useRegattaFlowSession(): UseRegattaFlowSessionReturn {
  const { user, isAuthenticated } = useAuth();

  // Get store state and actions
  const session = useRegattaFlowStore((state) => state.session);
  const isLoading = useRegattaFlowStore((state) => state.isLoading);
  const error = useRegattaFlowStore((state) => state.error);
  const lastRefreshAttempt = useRegattaFlowStore((state) => state.lastRefreshAttempt);

  const setSession = useRegattaFlowStore((state) => state.setSession);
  const clearSessionAction = useRegattaFlowStore((state) => state.clearSession);
  const setLoading = useRegattaFlowStore((state) => state.setLoading);
  const setError = useRegattaFlowStore((state) => state.setError);
  const updateLastRefreshAttempt = useRegattaFlowStore(
    (state) => state.updateLastRefreshAttempt
  );

  // Check if session is still valid
  const isValid = useMemo(() => isSessionValid(session), [session]);

  // Check if user is authenticated with Firebase
  const isFirebaseAuth = isAuthenticated && isFirebaseAuthenticated();

  /**
   * Build the discuss URL with session tokens
   * Uses both access and refresh tokens for proper session establishment
   */
  const discussUrl = useMemo(() => {
    if (!session?.accessToken || !isValid) {
      return null;
    }

    // Append both tokens as query parameters for session injection
    // RegattaFlow will use these to establish a real Supabase session
    const url = new URL(REGATTAFLOW_COMMUNITY_URL);
    url.searchParams.set(ACCESS_TOKEN_PARAM, session.accessToken);
    if (session.refreshToken) {
      url.searchParams.set(REFRESH_TOKEN_PARAM, session.refreshToken);
    }
    return url.toString();
  }, [session, isValid]);

  /**
   * Refresh the session by exchanging Firebase token
   */
  const refreshSession = useCallback(async () => {
    // Check if Firebase auth is available
    if (!isFirebaseAuth || !user) {
      setError('Please sign in to access the community.');
      return;
    }

    // Rate limit refresh attempts
    if (lastRefreshAttempt) {
      const timeSinceLastAttempt = Date.now() - lastRefreshAttempt;
      if (timeSinceLastAttempt < MIN_REFRESH_INTERVAL_MS) {
        console.log('[RegattaFlow] Skipping refresh - too soon since last attempt');
        return;
      }
    }

    setLoading(true);
    setError(null);
    updateLastRefreshAttempt();

    try {
      const profile = buildProfileFromUser(user);
      console.log('[RegattaFlow] Exchanging token with profile:', JSON.stringify(profile));
      const newSession = await exchangeFirebaseToken(profile);
      console.log('[RegattaFlow] Session refreshed successfully, userId:', newSession.userId);
      setSession(newSession);
    } catch (err) {
      console.error('[RegattaFlow] Session refresh failed:', err);
      console.error('[RegattaFlow] Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));

      if (err instanceof RegattaFlowAuthError) {
        console.error('[RegattaFlow] Auth error code:', err.code, 'Message:', err.userMessage);
        setError(err.userMessage);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[RegattaFlow] Generic error:', errorMessage);
        setError('Failed to connect to the community. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [
    isFirebaseAuth,
    user,
    lastRefreshAttempt,
    setLoading,
    setError,
    setSession,
    updateLastRefreshAttempt,
  ]);

  /**
   * Clear the current session
   */
  const clearSession = useCallback(() => {
    clearSessionAction();
  }, [clearSessionAction]);

  return {
    session,
    isLoading,
    error,
    isValid,
    isFirebaseAuth,
    discussUrl,
    refreshSession,
    clearSession,
  };
}

export default useRegattaFlowSession;
