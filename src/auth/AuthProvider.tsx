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
    console.log('🔐 [AuthProvider] Lazy loading Firebase auth service...');
    const { authService } = await import('./firebase/authService');
    console.log('✅ [AuthProvider] Firebase auth service loaded successfully');
    return authService;
  } catch (error) {
    console.error('❌ [AuthProvider] Failed to load Firebase auth service:', error);
    throw new Error('Firebase authentication service unavailable');
  }
}

/**
 * Clean Authentication Provider
 */
export function AuthenticationProvider({ children }: AuthProviderProps) {
  console.log('🔐 [AuthProvider] Creating AuthenticationProvider component');

  try {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const [useFirebase, setUseFirebase] = React.useState(false);
    const [authServiceReady, setAuthServiceReady] = React.useState(false);
    const firebaseServiceRef = useRef<any>(null);

    console.log('🔐 [AuthProvider] State and refs initialized successfully');

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    async function initializeAuth() {
      const initStartTime = Date.now();
      console.log('🔐 [AuthProvider] Initializing authentication...');

      try {
        // Check Firebase configuration with detailed logging
        const firebaseConfigured = isFirebaseConfigured();
        console.log('🔐 [AuthProvider] Firebase configuration check:', {
          isConfigured: firebaseConfigured,
          hasApiKey: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
          hasAppId: !!process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
          nodeEnv: process.env.EXPO_PUBLIC_NODE_ENV,
          isDev: __DEV__
        });

        if (firebaseConfigured) {
          try {
            console.log('🔐 [AuthProvider] Attempting to use Firebase authentication');
            console.log('🔐 [AuthProvider] DEBUGGING: Environment variables:', {
              hasApiKey: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
              hasAppId: !!process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
              hasProjectId: !!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
              apiKeyFirst4: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.substring(0, 4),
              projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
            });

            setUseFirebase(true);

            // Add timeout for Firebase service loading
            const firebaseLoadPromise = getFirebaseAuthService();
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Firebase service loading timed out')), 10000);
            });

            console.log('🔐 [AuthProvider] Loading Firebase auth service...');
            const firebaseAuthService = await Promise.race([firebaseLoadPromise, timeoutPromise]);
            firebaseServiceRef.current = firebaseAuthService;

            console.log('🔐 [AuthProvider] DEBUGGING: Firebase service methods:', {
              hasRegister: typeof firebaseAuthService.register === 'function',
              hasLogin: typeof firebaseAuthService.login === 'function',
              hasOnAuthStateChanged: typeof firebaseAuthService.onAuthStateChanged === 'function'
            });

            console.log('🔐 [AuthProvider] Firebase auth service loaded, setting up listener...');

            // Set up Firebase auth state listener
            const unsubscribe = firebaseAuthService.onAuthStateChanged((user) => {
              console.log('🔐 [AuthProvider] Firebase auth state changed:', {
                hasUser: !!user,
                userId: user?.uid,
                email: user?.email,
                emailVerified: user?.emailVerified
              });
              dispatch({ type: 'SET_USER', payload: user });

              if (!state.isInitialized) {
                console.log('🔐 [AuthProvider] Marking auth as initialized');
                dispatch({ type: 'SET_INITIALIZED', payload: true });
              }
            });

            unsubscribeRef.current = unsubscribe;

            const initDuration = Date.now() - initStartTime;
            console.log(`✅ [AuthProvider] Firebase authentication initialized successfully in ${initDuration}ms`);

          } catch (error) {
            const initDuration = Date.now() - initStartTime;
            console.error(`❌ [AuthProvider] Firebase initialization failed after ${initDuration}ms:`, error);
            console.error('❌ [AuthProvider] Error details:', {
              message: error?.message,
              name: error?.name,
              stack: error?.stack ? error.stack.substring(0, 300) : undefined
            });

            // Fall back to mock authentication if Firebase fails to load
            console.log('🔄 [AuthProvider] Falling back to mock authentication...');
            setUseFirebase(false);
            await initializeMockAuth();
          }
        } else {
          console.log('🔧 [AuthProvider] Firebase not configured, using mock authentication');
          setUseFirebase(false);
          await initializeMockAuth();
        }

        setAuthServiceReady(true);
        const totalDuration = Date.now() - initStartTime;
        console.log(`🎉 [AuthProvider] Authentication initialization completed in ${totalDuration}ms`);

      } catch (error) {
        const initDuration = Date.now() - initStartTime;
        console.error(`💥 [AuthProvider] Critical initialization error after ${initDuration}ms:`, error);

        // Last resort: ensure we have some form of auth working
        try {
          setUseFirebase(false);
          await initializeMockAuth();
          setAuthServiceReady(true);
          console.log('🆘 [AuthProvider] Emergency mock auth fallback successful');
        } catch (mockError) {
          console.error('💀 [AuthProvider] Even mock auth failed:', mockError);
          throw mockError;
        }
      }
    }


    async function initializeMockAuth() {
      console.log('🔧 [AuthProvider] Initializing mock authentication service');

      // Initialize mock auth service
      await mockAuthService.initialize();

      // Set up mock auth state listener
      const unsubscribe = mockAuthService.onAuthStateChanged((user) => {
        console.log('🔧 [AuthProvider] Mock auth state changed:', user ? 'User signed in' : 'User signed out');
        dispatch({ type: 'SET_USER', payload: user });

        if (!state.isInitialized) {
          dispatch({ type: 'SET_INITIALIZED', payload: true });
        }
      });

      unsubscribeRef.current = unsubscribe;
      console.log('✅ [AuthProvider] Mock authentication initialized successfully');
    }

    initializeAuth();

    // Cleanup on unmount
    return () => {
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

      console.log('🔐 [AuthProvider] Starting login process...');
      console.log('🔐 [AuthProvider] DEBUGGING: AuthProvider login method called successfully');
      console.log('🔐 [AuthProvider] Service status:', {
        useFirebase,
        authServiceReady,
        firebaseServiceReady: !!firebaseServiceRef.current,
        credentials: { email: credentials.email, hasPassword: !!credentials.password }
      });

      // Add timeout for authentication requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Authentication request timed out after 15 seconds')), 15000);
      });

      let authPromise: Promise<any>;

      if (useFirebase && firebaseServiceRef.current) {
        console.log('🔐 [AuthProvider] Using Firebase for login');
        console.log('🔐 [AuthProvider] Firebase service type:', typeof firebaseServiceRef.current.login);


        authPromise = firebaseServiceRef.current.login(credentials);
      } else {
        console.log('🔧 [AuthProvider] Using mock service for login');
        console.log('🔧 [AuthProvider] Mock service status:', {
          initialized: !!mockAuthService,
          hasLoginMethod: typeof mockAuthService.login === 'function'
        });


        authPromise = mockAuthService.login(credentials);
      }

      // Race between auth request and timeout
      await Promise.race([authPromise, timeoutPromise]);

      const loginDuration = Date.now() - loginStartTime;
      console.log(`✅ [AuthProvider] Login completed successfully in ${loginDuration}ms`);

      // User state will be updated via onAuthStateChanged listener
    } catch (error) {
      const loginDuration = Date.now() - loginStartTime;
      console.error(`❌ [AuthProvider] Login failed after ${loginDuration}ms:`, error);

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
        console.error('❌ [AuthProvider] Error details:', errorDetails);
      } catch (logError) {
        console.error('❌ [AuthProvider] Error occurred while logging error details:', String(error));
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

      console.log('🔐 [AuthProvider] Starting registration process...');
      console.log('🔐 [AuthProvider] DEBUGGING: Registration credentials:', {
        email: credentials.email,
        displayName: credentials.displayName,
        hasPassword: !!credentials.password,
        passwordLength: credentials.password?.length || 0
      });
      console.log('🔐 [AuthProvider] DEBUGGING: Auth service status:', {
        useFirebase,
        authServiceReady,
        firebaseServiceReady: !!firebaseServiceRef.current,
        mockServiceReady: !!mockAuthService
      });

      if (useFirebase && firebaseServiceRef.current) {
        console.log('🔐 [AuthProvider] Using Firebase for registration');
        console.log('🔐 [AuthProvider] DEBUGGING: Firebase service type:', typeof firebaseServiceRef.current.register);

        await firebaseServiceRef.current.register(credentials);
      } else {
        console.log('🔧 [AuthProvider] Using mock service for registration');
        console.log('🔧 [AuthProvider] DEBUGGING: Mock service status:', {
          initialized: !!mockAuthService,
          hasRegisterMethod: typeof mockAuthService.register === 'function'
        });

        await mockAuthService.register(credentials);
      }

      const regDuration = Date.now() - regStartTime;
      console.log(`✅ [AuthProvider] Registration completed successfully in ${regDuration}ms`);

      // User state will be updated via onAuthStateChanged listener
    } catch (error) {
      const regDuration = Date.now() - regStartTime;
      console.error(`❌ [AuthProvider] Registration failed after ${regDuration}ms:`, error);

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
        console.error('❌ [AuthProvider] Error details:', errorDetails);
      } catch (logError) {
        console.error('❌ [AuthProvider] Error occurred while logging error details:', String(error));
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

      console.log('🔐 [AuthProvider] Starting OAuth login process...');

      if (useFirebase && firebaseServiceRef.current) {
        console.log('🔐 [AuthProvider] Using Firebase for OAuth login');
        await firebaseServiceRef.current.loginWithProvider(provider);
      } else {
        console.log('⚠️ [AuthProvider] OAuth not supported in mock mode');
        throw new Error('OAuth login not available in mock mode. Please use email/password registration.');
      }
      // User state will be updated via onAuthStateChanged listener
    } catch (error) {
      console.error('❌ [AuthProvider] OAuth login failed:', error);
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

      console.log('🔐 [AuthProvider] Starting logout process...');

      if (useFirebase && firebaseServiceRef.current) {
        console.log('🔐 [AuthProvider] Using Firebase for logout');
        await firebaseServiceRef.current.logout();
      } else {
        console.log('🔧 [AuthProvider] Using mock service for logout');
        await mockAuthService.logout();
      }
      // User state will be updated via onAuthStateChanged listener
    } catch (error) {
      console.error('❌ [AuthProvider] Logout failed:', error);
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

      console.log('🔐 [AuthProvider] Starting password reset process...');

      if (useFirebase && firebaseServiceRef.current) {
        console.log('🔐 [AuthProvider] Using Firebase for password reset');
        await firebaseServiceRef.current.resetPassword(email);
      } else {
        console.log('🔧 [AuthProvider] Using mock service for password reset');
        await mockAuthService.resetPassword(email);
      }
    } catch (error) {
      console.error('❌ [AuthProvider] Password reset failed:', error);
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

      console.log('🔐 [AuthProvider] Starting profile update process...');

      if (useFirebase && firebaseServiceRef.current) {
        console.log('🔐 [AuthProvider] Using Firebase for profile update');
        const updatedUser = await firebaseServiceRef.current.updateUserProfile(updates);
        dispatch({ type: 'SET_USER', payload: updatedUser });
      } else {
        console.log('🔧 [AuthProvider] Using mock service for profile update (local only)');
        // Mock service doesn't support profile updates yet - just update locally
        const currentUser = state.user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates, updatedAt: new Date() };
          dispatch({ type: 'SET_USER', payload: updatedUser });
        }
      }
    } catch (error) {
      console.error('❌ [AuthProvider] Profile update failed:', error);
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

      console.log('🔐 [AuthProvider] Starting email verification resend...');

      if (useFirebase && firebaseServiceRef.current) {
        console.log('🔐 [AuthProvider] Using Firebase for email verification');
        await firebaseServiceRef.current.resendEmailVerification();
      } else {
        console.log('⚠️ [AuthProvider] Email verification not supported in mock mode');
        throw new Error('Email verification not available in mock mode.');
      }
    } catch (error) {
      console.error('❌ [AuthProvider] Email verification resend failed:', error);
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

    console.log('🔐 [AuthProvider] About to render AuthContext.Provider');

    return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error('💥 [AuthProvider] AuthenticationProvider error:', error);
    console.error('💥 [AuthProvider] Error stack:', error.stack);

    // Check if this is the Hermes property error
    if (error.message?.includes('property is not configurable')) {
      console.error('🎯 [AuthProvider] FOUND HERMES PROPERTY ERROR IN AUTH PROVIDER!');
      console.error('🎯 [AuthProvider] This suggests the error occurs during auth initialization');
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