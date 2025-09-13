import React, { createContext, useContext, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useAuthStore, authSelectors } from '../stores/authStore';
import { User, AuthProviderType, LoginCredentials, RegisterCredentials } from '../types/simpleAuth';

/**
 * Authentication context interface
 */
interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginWithProvider: (provider: AuthProviderType) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  clearError: () => void;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Get store selectors
  const user = useAuthStore(authSelectors.user);
  const isAuthenticated = useAuthStore(authSelectors.isAuthenticated);
  const isLoading = useAuthStore(authSelectors.isLoading);
  const error = useAuthStore(authSelectors.error);
  const isInitialized = useAuthStore(authSelectors.isInitialized);
  
  // Get store actions
  const { 
    initialize, 
    login, 
    register, 
    loginWithProvider, 
    logout, 
    resetPassword, 
    updateProfile, 
    resendEmailVerification, 
    clearError 
  } = useAuthStore();
  
  // Track initialization to prevent multiple calls
  const initializationAttempted = useRef(false);
  
  // Initialize auth state on mount - only run once
  useEffect(() => {
    if (!isInitialized && !initializationAttempted.current) {
      initializationAttempted.current = true;
      console.log('🚀 Initializing auth store...');
      initialize().catch(error => {
        console.error('Auth initialization error:', error);
      });
    }
  }, [isInitialized]);

  const contextValue: AuthContextType = useMemo(() => ({
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,

    // Actions
    login,
    register,
    loginWithProvider,
    logout,
    resetPassword,
    updateProfile,
    resendEmailVerification,
    clearError,
  }), [user, isAuthenticated, isLoading, error, isInitialized, login, register, loginWithProvider, logout, resetPassword, updateProfile, resendEmailVerification, clearError]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthProvider;