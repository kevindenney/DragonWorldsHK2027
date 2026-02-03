/**
 * Clean, Simplified Authentication Provider
 * 
 * This provider only manages authentication state for the UI.
 * All business logic is handled by the isolated authService.
 * No circular dependencies, clean separation of concerns.
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { mockAuthService } from './mockAuthService';
import { AuthContextType, AuthState, LoginCredentials, RegisterCredentials, AuthProviderType, User } from './authTypes';

/**
 * Authentication actions
 */
type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

/**
 * Initial authentication state
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true for initialization
  error: null,
  isInitialized: false,
};

/**
 * Authentication state reducer
 */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        error: null,
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload, isLoading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'RESET':
      return { ...initialState, isInitialized: true, isLoading: false };
    
    default:
      return state;
  }
}

/**
 * Authentication Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Detect if Firebase is properly configured
 */
function isFirebaseConfigured(): boolean {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  return !!(apiKey && appId && apiKey !== '' && appId !== '');
}

/**
 * Lazy load Firebase auth service only when needed
 */
async function getFirebaseAuthService() {
  try {
    const { authService } = await import('./firebase/authService');
    return authService;
  } catch (error) {
    throw new Error('Firebase authentication service unavailable');
  }
}

/**
 * Clean Authentication Provider
 */
export function AuthenticationProvider({ children }: AuthProviderProps) {

  try {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const [useFirebase, setUseFirebase] = React.useState(false);
    const [authServiceReady, setAuthServiceReady] = React.useState(false);
    const firebaseServiceRef = useRef<any>(null);


  /**
   * Initialize authentication state
   */
  useEffect(() => {
    let safetyTimeoutId: NodeJS.Timeout;
    let isInitialized = false;

    async function initializeAuth() {
      const initStartTime = Date.now();

      try {
        // Safety timeout - force initialization after 3 seconds maximum
        safetyTimeoutId = setTimeout(() => {
          if (!isInitialized) {
            dispatch({ type: 'SET_INITIALIZED', payload: true });
            isInitialized = true;
          }
        }, 3000);

        // Check Firebase configuration with detailed logging
        const firebaseConfigured = isFirebaseConfigured();

        if (firebaseConfigured) {
          try {

            setUseFirebase(true);

            // Timeout for Firebase service loading (5 seconds to allow for cold start)
            const firebaseLoadPromise = getFirebaseAuthService();
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Firebase service loading timed out')), 5000);
            });

            const firebaseAuthService = await Promise.race([firebaseLoadPromise, timeoutPromise]);
            firebaseServiceRef.current = firebaseAuthService;


            // Set up Firebase auth state listener with timeout protection
            let listenerFired = false;
            const listenerTimeout = setTimeout(() => {
              if (!listenerFired && !isInitialized) {
                dispatch({ type: 'SET_INITIALIZED', payload: true });
                isInitialized = true;
              }
            }, 2000);

            const unsubscribe = firebaseAuthService.onAuthStateChanged((user) => {
              listenerFired = true;
              clearTimeout(listenerTimeout);

              dispatch({ type: 'SET_USER', payload: user });

              if (!isInitialized) {
                dispatch({ type: 'SET_INITIALIZED', payload: true });
                isInitialized = true;
                clearTimeout(safetyTimeoutId);
              }
            });

            unsubscribeRef.current = unsubscribe;

            const initDuration = Date.now() - initStartTime;

          } catch (error) {
            const initDuration = Date.now() - initStartTime;
            // Use console.warn instead of console.error since we handle this gracefully with fallback

            // Fall back to mock authentication (this is expected in dev or when Firebase is slow)
            setUseFirebase(false);
            await initializeMockAuth();
            if (!isInitialized) {
              dispatch({ type: 'SET_INITIALIZED', payload: true });
              isInitialized = true;
              clearTimeout(safetyTimeoutId);
            }
          }
        } else {
          setUseFirebase(false);
          await initializeMockAuth();
          if (!isInitialized) {
            dispatch({ type: 'SET_INITIALIZED', payload: true });
            isInitialized = true;
            clearTimeout(safetyTimeoutId);
          }
        }

        setAuthServiceReady(true);
        const totalDuration = Date.now() - initStartTime;

      } catch (error) {
        const initDuration = Date.now() - initStartTime;

        // Last resort: ensure app doesn't hang
        if (!isInitialized) {
          dispatch({ type: 'SET_INITIALIZED', payload: true });
          isInitialized = true;
          clearTimeout(safetyTimeoutId);
        }
      }
    }


    async function initializeMockAuth() {

      // Initialize mock auth service
      await mockAuthService.initialize();

      // Set up mock auth state listener
      const unsubscribe = mockAuthService.onAuthStateChanged((user) => {
        dispatch({ type: 'SET_USER', payload: user });

        if (!isInitialized) {
          dispatch({ type: 'SET_INITIALIZED', payload: true });
          isInitialized = true;
          clearTimeout(safetyTimeoutId);
        }
      });

      unsubscribeRef.current = unsubscribe;
    }

    initializeAuth();

    // Cleanup on unmount
    return () => {
      clearTimeout(safetyTimeoutId);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  /**
   * Login with email and password
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {

    const loginStartTime = Date.now();

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });


      // Add timeout for authentication requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Authentication request timed out after 15 seconds')), 15000);
      });

      let authPromise: Promise<any>;

      if (useFirebase && firebaseServiceRef.current) {


        authPromise = firebaseServiceRef.current.login(credentials);
      } else {


        authPromise = mockAuthService.login(credentials);
      }

      // Race between auth request and timeout
      await Promise.race([authPromise, timeoutPromise]);

      const loginDuration = Date.now() - loginStartTime;

      // User state will be updated via onAuthStateChanged listener
    } catch (error) {
      const loginDuration = Date.now() - loginStartTime;

      // Ultra-safe error logging - completely bulletproof
      try {
        let errorMessage = 'Unknown error';
        let errorCode = 'unknown';
        let errorName = 'unknown';
        let errorStack = 'No stack available';

        try { errorMessage = error?.message || String(error); } catch {}
        try { errorCode = error?.code || 'unknown'; } catch {}
        try { errorName = error?.name || 'unknown'; } catch {}
        try {
          if (error && error.stack) {
            const stackStr = String(error.stack);
            errorStack = stackStr.length > 300 ? stackStr.slice(0, 300) : stackStr;
          }
        } catch {}

        const errorDetails = {
          message: errorMessage,
          code: errorCode,
          name: errorName,
          stack: errorStack
        };
      } catch (logError) {
      }

      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Register new user
   */
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    const regStartTime = Date.now();

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });


      if (useFirebase && firebaseServiceRef.current) {

        await firebaseServiceRef.current.register(credentials);
      } else {

        await mockAuthService.register(credentials);
      }

      const regDuration = Date.now() - regStartTime;

      // User state will be updated via onAuthStateChanged listener
    } catch (error) {
      const regDuration = Date.now() - regStartTime;

      // Ultra-safe error logging - completely bulletproof
      try {
        let errorMessage = 'Unknown error';
        let errorCode = 'unknown';
        let errorName = 'unknown';
        let errorStack = 'No stack available';

        try { errorMessage = error?.message || String(error); } catch {}
        try { errorCode = error?.code || 'unknown'; } catch {}
        try { errorName = error?.name || 'unknown'; } catch {}
        try {
          if (error && error.stack) {
            const stackStr = String(error.stack);
            errorStack = stackStr.length > 300 ? stackStr.slice(0, 300) : stackStr;
          }
        } catch {}

        const errorDetails = {
          message: errorMessage,
          code: errorCode,
          name: errorName,
          stack: errorStack
        };
      } catch (logError) {
      }

      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Registration failed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Login with OAuth provider
   */
  const loginWithProvider = async (provider: AuthProviderType): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });


      if (useFirebase && firebaseServiceRef.current) {
        await firebaseServiceRef.current.loginWithProvider(provider);
      } else {
        throw new Error('OAuth login not available in mock mode. Please use email/password registration.');
      }
      // User state will be updated via onAuthStateChanged listener
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'OAuth login failed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Logout current user
   */
  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });


      if (useFirebase && firebaseServiceRef.current) {
        await firebaseServiceRef.current.logout();
      } else {
        await mockAuthService.logout();
      }
      // User state will be updated via onAuthStateChanged listener
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Logout failed' });
      // Even if logout fails, reset local state
      dispatch({ type: 'RESET' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Reset password
   */
  const resetPassword = async (email: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });


      if (useFirebase && firebaseServiceRef.current) {
        await firebaseServiceRef.current.resetPassword(email);
      } else {
        await mockAuthService.resetPassword(email);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Password reset failed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });


      if (useFirebase && firebaseServiceRef.current) {
        const updatedUser = await firebaseServiceRef.current.updateUserProfile(updates);
        dispatch({ type: 'SET_USER', payload: updatedUser });
      } else {
        // Mock service doesn't support profile updates yet - just update locally
        const currentUser = state.user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates, updatedAt: new Date() };
          dispatch({ type: 'SET_USER', payload: updatedUser });
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Profile update failed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Resend email verification
   */
  const resendEmailVerification = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });


      if (useFirebase && firebaseServiceRef.current) {
        await firebaseServiceRef.current.resendEmailVerification();
      } else {
        throw new Error('Email verification not available in mock mode.');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to send verification email' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Clear error state
   */
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  /**
   * Context value
   */
  const contextValue: AuthContextType = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    isInitialized: state.isInitialized,

    // Actions
    login,
    register,
    loginWithProvider,
    logout,
    resetPassword,
    updateProfile,
    resendEmailVerification,
    clearError,
  };


    return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {

    // Check if this is the Hermes property error
    if (error.message?.includes('property is not configurable')) {
    }

    throw error;
  }
}

/**
 * Custom hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Export both names for compatibility during transition
export { AuthenticationProvider as AuthProvider };
export default AuthenticationProvider;