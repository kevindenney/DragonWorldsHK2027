import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore, authSelectors } from '../stores/authStore';
import { User, AuthProvider, LoginCredentials, RegisterCredentials } from '../types/auth';

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
  loginWithProvider: (provider: AuthProvider) => Promise<void>;
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
  const authStore = useAuthStore();
  
  // Initialize auth state on mount
  useEffect(() => {
    if (!authStore.isInitialized) {
      authStore.initialize();
    }
  }, [authStore]);

  const contextValue: AuthContextType = {
    // State
    user: useAuthStore(authSelectors.user),
    isAuthenticated: useAuthStore(authSelectors.isAuthenticated),
    isLoading: useAuthStore(authSelectors.isLoading),
    error: useAuthStore(authSelectors.error),
    isInitialized: useAuthStore(authSelectors.isInitialized),

    // Actions
    login: authStore.login,
    register: authStore.register,
    loginWithProvider: authStore.loginWithProvider,
    logout: authStore.logout,
    resetPassword: authStore.resetPassword,
    updateProfile: authStore.updateProfile,
    resendEmailVerification: authStore.resendEmailVerification,
    clearError: authStore.clearError,
  };

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