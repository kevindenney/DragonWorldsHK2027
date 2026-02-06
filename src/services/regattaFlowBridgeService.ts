/**
 * RegattaFlow Bridge Service
 *
 * Handles authentication bridge between Dragon Worlds (Firebase) and RegattaFlow (Supabase).
 * Exchanges Firebase ID tokens for RegattaFlow session tokens to enable seamless
 * WebView embedding of the RegattaFlow Discuss feature.
 */

import { auth } from '../config/firebase';

// ============================================================================
// TYPES
// ============================================================================

export interface RegattaFlowBridgeProfile {
  displayName?: string;
  boatClass?: string;
  clubName?: string;
  photoUrl?: string;
}

export interface RegattaFlowBridgeResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
  user?: {
    id: string;
    email: string;
    fullName?: string;
    isNewUser: boolean;
  };
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// RegattaFlow Supabase Edge Function endpoint
const REGATTAFLOW_SUPABASE_URL = 'https://gskctjfmrohonlcuwqro.supabase.co';
const BRIDGE_ENDPOINT = `${REGATTAFLOW_SUPABASE_URL}/functions/v1/firebase-auth-bridge`;

// Dragon Worlds community slug in RegattaFlow
export const DRAGON_WORLDS_COMMUNITY_SLUG = '2027-hk-dragon-worlds';

// RegattaFlow web app URL
export const REGATTAFLOW_WEB_URL = 'https://regattaflow-app.vercel.app';

// Cache for bridge token to avoid repeated exchanges
let cachedBridgeToken: string | null = null;
let cachedBridgeTokenExpiry: number = 0;

// ============================================================================
// BRIDGE SERVICE
// ============================================================================

/**
 * Get the current Firebase user's ID token
 */
async function getFirebaseIdToken(): Promise<string | null> {
  try {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      console.log('[RegattaFlowBridge] No Firebase user signed in');
      return null;
    }

    const idToken = await currentUser.getIdToken(true); // Force refresh
    return idToken;
  } catch (error) {
    console.error('[RegattaFlowBridge] Failed to get Firebase ID token:', error);
    return null;
  }
}

/**
 * Exchange Firebase ID token for RegattaFlow bridge token
 *
 * @param profile - Optional profile data to sync to RegattaFlow
 * @returns Bridge response with access token
 */
export async function exchangeFirebaseTokenForRegattaFlow(
  profile?: RegattaFlowBridgeProfile
): Promise<RegattaFlowBridgeResponse> {
  try {
    // Check cache first
    const now = Math.floor(Date.now() / 1000);
    if (cachedBridgeToken && cachedBridgeTokenExpiry > now + 60) {
      console.log('[RegattaFlowBridge] Using cached bridge token');
      return {
        success: true,
        accessToken: cachedBridgeToken,
        expiresAt: cachedBridgeTokenExpiry,
      };
    }

    // Get fresh Firebase ID token
    const firebaseToken = await getFirebaseIdToken();
    if (!firebaseToken) {
      return {
        success: false,
        error: 'Not signed in to Firebase',
      };
    }

    console.log('[RegattaFlowBridge] Exchanging Firebase token for RegattaFlow session...');

    // Call the RegattaFlow bridge endpoint
    const response = await fetch(BRIDGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseToken,
        profile,
        communitySlug: DRAGON_WORLDS_COMMUNITY_SLUG,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[RegattaFlowBridge] Bridge request failed:', response.status, errorData);
      return {
        success: false,
        error: errorData.error || `Bridge request failed: ${response.status}`,
      };
    }

    const data: RegattaFlowBridgeResponse = await response.json();

    // Cache the token
    if (data.success && data.accessToken) {
      cachedBridgeToken = data.accessToken;
      cachedBridgeTokenExpiry = data.expiresAt || (now + 300);
      console.log('[RegattaFlowBridge] Token cached, expires at:', new Date(cachedBridgeTokenExpiry * 1000));
    }

    return data;
  } catch (error) {
    console.error('[RegattaFlowBridge] Exchange failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build the RegattaFlow Discuss URL with authentication
 *
 * @param bridgeToken - The bridge token from exchangeFirebaseTokenForRegattaFlow
 * @param path - Optional path within RegattaFlow (defaults to community discuss)
 * @returns Authenticated URL for WebView
 */
export function buildRegattaFlowDiscussUrl(bridgeToken: string, path?: string): string {
  const targetPath = path || `/community/${DRAGON_WORLDS_COMMUNITY_SLUG}`;
  const url = new URL(targetPath, REGATTAFLOW_WEB_URL);
  url.searchParams.set('bridge_token', bridgeToken);
  return url.toString();
}

/**
 * Get authenticated RegattaFlow Discuss URL
 * Combines token exchange and URL building in one call
 *
 * @param profile - Optional profile data to sync
 * @returns URL string or null if auth failed
 */
export async function getAuthenticatedDiscussUrl(
  profile?: RegattaFlowBridgeProfile
): Promise<{ url: string; error?: string } | { url: null; error: string }> {
  const response = await exchangeFirebaseTokenForRegattaFlow(profile);

  if (!response.success || !response.accessToken) {
    return {
      url: null,
      error: response.error || 'Failed to get access token',
    };
  }

  const url = buildRegattaFlowDiscussUrl(response.accessToken);
  return { url };
}

/**
 * Clear cached bridge token (call on logout)
 */
export function clearRegattaFlowBridgeCache(): void {
  cachedBridgeToken = null;
  cachedBridgeTokenExpiry = 0;
  console.log('[RegattaFlowBridge] Cache cleared');
}

/**
 * Check if user is eligible for RegattaFlow integration
 * (Must be signed in to Firebase)
 */
export function isRegattaFlowEligible(): boolean {
  return auth?.currentUser !== null;
}

export default {
  exchangeFirebaseTokenForRegattaFlow,
  buildRegattaFlowDiscussUrl,
  getAuthenticatedDiscussUrl,
  clearRegattaFlowBridgeCache,
  isRegattaFlowEligible,
  DRAGON_WORLDS_COMMUNITY_SLUG,
  REGATTAFLOW_WEB_URL,
};
