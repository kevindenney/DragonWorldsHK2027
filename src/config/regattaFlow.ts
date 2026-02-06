/**
 * RegattaFlow Discuss Integration Configuration
 *
 * Configuration constants for the Firebase-to-Supabase auth bridge
 * and community WebView integration.
 */

/**
 * Auth bridge endpoint for exchanging Firebase tokens for RegattaFlow sessions
 */
export const REGATTAFLOW_AUTH_BRIDGE_URL =
  'https://qavekrwdbsobecwrfxwu.supabase.co/functions/v1/firebase-auth-bridge';

/**
 * Base community URL for RegattaFlow Discuss
 */
export const REGATTAFLOW_COMMUNITY_URL =
  'https://regattaflow-app.vercel.app/community/2027-hk-dragon-worlds';

/**
 * URL parameter names for WebView token passing
 * These must match the constants in RegattaFlow's firebaseBridge.ts
 */
export const ACCESS_TOKEN_PARAM = 'rf_access_token';
export const REFRESH_TOKEN_PARAM = 'rf_refresh_token';

/**
 * Time buffer (in milliseconds) before session expiry to trigger a refresh
 * Default: 60 seconds before expiry
 */
export const SESSION_REFRESH_BUFFER_MS = 60 * 1000;

/**
 * WebView message types for communication between WebView and React Native
 */
export enum WebViewMessageType {
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  NAVIGATION_REQUEST = 'NAVIGATION_REQUEST',
  OPEN_IN_APP = 'OPEN_IN_APP',
  READY = 'READY',
}

/**
 * Error codes for RegattaFlow auth service
 */
export enum RegattaFlowErrorCode {
  FIREBASE_TOKEN_ERROR = 'FIREBASE_TOKEN_ERROR',
  BRIDGE_REQUEST_FAILED = 'BRIDGE_REQUEST_FAILED',
  BRIDGE_RESPONSE_INVALID = 'BRIDGE_RESPONSE_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  USER_NOT_AUTHENTICATED = 'USER_NOT_AUTHENTICATED',
}

/**
 * User-friendly error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<RegattaFlowErrorCode, string> = {
  [RegattaFlowErrorCode.FIREBASE_TOKEN_ERROR]:
    'Unable to verify your identity. Please try signing in again.',
  [RegattaFlowErrorCode.BRIDGE_REQUEST_FAILED]:
    'Unable to connect to the community. Please check your internet connection.',
  [RegattaFlowErrorCode.BRIDGE_RESPONSE_INVALID]:
    'Received an unexpected response. Please try again later.',
  [RegattaFlowErrorCode.SESSION_EXPIRED]:
    'Your session has expired. Please refresh to continue.',
  [RegattaFlowErrorCode.NETWORK_ERROR]:
    'Network error. Please check your internet connection and try again.',
  [RegattaFlowErrorCode.USER_NOT_AUTHENTICATED]:
    'Please sign in to access the community.',
};
