/**
 * RegattaFlow Auth Bridge Service
 *
 * Handles token exchange between Firebase and RegattaFlow's Supabase backend.
 * This service exchanges Firebase ID tokens for RegattaFlow session tokens.
 */

import { auth } from '../config/firebase';
import {
  REGATTAFLOW_AUTH_BRIDGE_URL,
  SESSION_REFRESH_BUFFER_MS,
  RegattaFlowErrorCode,
  ERROR_MESSAGES,
} from '../config/regattaFlow';
import type {
  RegattaFlowProfile,
  RegattaFlowSession,
  AuthBridgeResponse,
} from '../types/regattaFlow';

/**
 * Custom error class for RegattaFlow authentication errors
 */
export class RegattaFlowAuthError extends Error {
  code: RegattaFlowErrorCode;
  userMessage: string;

  constructor(code: RegattaFlowErrorCode, originalError?: Error) {
    const userMessage = ERROR_MESSAGES[code];
    super(originalError?.message || userMessage);
    this.name = 'RegattaFlowAuthError';
    this.code = code;
    this.userMessage = userMessage;

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RegattaFlowAuthError);
    }
  }
}

/**
 * Get the current Firebase ID token
 * @throws RegattaFlowAuthError if the user is not authenticated or token retrieval fails
 */
async function getFirebaseIdToken(): Promise<string> {
  if (!auth?.currentUser) {
    throw new RegattaFlowAuthError(RegattaFlowErrorCode.USER_NOT_AUTHENTICATED);
  }

  try {
    const idToken = await auth.currentUser.getIdToken(true);
    return idToken;
  } catch (error) {
    console.error('[RegattaFlow Auth] Failed to get Firebase ID token:', error);
    throw new RegattaFlowAuthError(
      RegattaFlowErrorCode.FIREBASE_TOKEN_ERROR,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Exchange a Firebase ID token for a RegattaFlow session
 * @param profile - User profile data to sync with RegattaFlow
 * @returns RegattaFlow session with access token
 * @throws RegattaFlowAuthError on failure
 */
export async function exchangeFirebaseToken(
  profile: RegattaFlowProfile
): Promise<RegattaFlowSession> {
  // Get Firebase ID token
  const firebaseIdToken = await getFirebaseIdToken();
  console.log('[RegattaFlow Auth] Got Firebase token, length:', firebaseIdToken.length);
  console.log('[RegattaFlow Auth] Calling bridge at:', REGATTAFLOW_AUTH_BRIDGE_URL);

  try {
    const response = await fetch(REGATTAFLOW_AUTH_BRIDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firebaseIdToken}`,
      },
      body: JSON.stringify({
        profile: {
          // Send both snake_case and camelCase for compatibility
          display_name: profile.displayName,
          displayName: profile.displayName,
          boat_class: profile.boatClass,
          boatClass: profile.boatClass,
          club_name: profile.clubName,
          clubName: profile.clubName,
          photo_url: profile.photoUrl,
          photoUrl: profile.photoUrl,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error body');
      console.error(
        '[RegattaFlow Auth] Bridge request failed:',
        response.status,
        response.statusText,
        'Body:',
        errorBody
      );
      throw new RegattaFlowAuthError(RegattaFlowErrorCode.BRIDGE_REQUEST_FAILED);
    }

    const data: AuthBridgeResponse = await response.json();
    console.log('[RegattaFlow Auth] Bridge response:', JSON.stringify(data));

    if (!data.success || !data.session) {
      console.error('[RegattaFlow Auth] Bridge response error:', data.error);
      throw new RegattaFlowAuthError(RegattaFlowErrorCode.BRIDGE_RESPONSE_INVALID);
    }

    // Normalize expiry to Unix timestamp (milliseconds)
    let expiresAt = data.session.expiresAt;
    if (typeof expiresAt === 'string') {
      expiresAt = new Date(expiresAt).getTime();
    } else if (expiresAt < 10000000000) {
      // If it's in seconds, convert to milliseconds
      expiresAt = expiresAt * 1000;
    }

    return {
      ...data.session,
      expiresAt,
    };
  } catch (error) {
    if (error instanceof RegattaFlowAuthError) {
      throw error;
    }

    console.error('[RegattaFlow Auth] Network error:', error);
    throw new RegattaFlowAuthError(
      RegattaFlowErrorCode.NETWORK_ERROR,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Check if a session is still valid
 * Returns true if the session exists and hasn't expired (with buffer time)
 * @param session - The session to check
 * @returns true if the session is valid, false otherwise
 */
export function isSessionValid(session: RegattaFlowSession | null): boolean {
  if (!session) {
    return false;
  }

  const now = Date.now();
  const expiryWithBuffer = session.expiresAt - SESSION_REFRESH_BUFFER_MS;

  return now < expiryWithBuffer;
}

/**
 * Check if the user is currently authenticated with Firebase
 * @returns true if the user is authenticated, false otherwise
 */
export function isFirebaseAuthenticated(): boolean {
  return !!auth?.currentUser;
}

/**
 * Get the current Firebase user's email
 * @returns The user's email or null if not authenticated
 */
export function getFirebaseUserEmail(): string | null {
  return auth?.currentUser?.email || null;
}

/**
 * Get the current Firebase user's UID
 * @returns The user's UID or null if not authenticated
 */
export function getFirebaseUserUid(): string | null {
  return auth?.currentUser?.uid || null;
}
