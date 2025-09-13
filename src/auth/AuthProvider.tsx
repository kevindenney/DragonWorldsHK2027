/**
 * Clean, Simplified Authentication Provider
 * 
 * This provider only manages authentication state for the UI.
 * All business logic is handled by the isolated authService.
 * No circular dependencies, clean separation of concerns.
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { authService } from './firebase/authService';
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
 * Clean Authentication Provider
 */
export function AuthenticationProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    console.log('🔐 Initializing authentication...');
    
    // Set up auth state listener
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log('🔐 Auth state changed:', user ? 'User signed in' : 'User signed out');
      dispatch({ type: 'SET_USER', payload: user });
      
      if (!state.isInitialized) {
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    });

    unsubscribeRef.current = unsubscribe;

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
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await authService.login(credentials);
      // User state will be updated via onAuthStateChanged listener
    } catch (error) {
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
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await authService.register(credentials);
      // User state will be updated via onAuthStateChanged listener
    } catch (error) {
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
      
      await authService.loginWithProvider(provider);
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
      
      await authService.logout();
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
      
      await authService.resetPassword(email);
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
      
      const updatedUser = await authService.updateUserProfile(updates);
      dispatch({ type: 'SET_USER', payload: updatedUser });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Profile update failed' });
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
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
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