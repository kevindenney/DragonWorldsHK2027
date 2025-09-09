import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthProvider, LoginCredentials, RegisterCredentials } from '../types/auth';
import authService from '../services/auth/authService';

/**
 * Authentication store state interface
 */
interface AuthState {
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
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Authentication store using Zustand with persistence
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Login action
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
          const user = await authService.loginWithEmail(
            credentials.email,
            credentials.password
          );
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
            user: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // Register action
      register: async (credentials: RegisterCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
          const user = await authService.registerWithEmail(
            credentials.email,
            credentials.password,
            credentials.displayName
          );
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
            user: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // OAuth provider login
      loginWithProvider: async (provider: AuthProvider) => {
        try {
          set({ isLoading: true, error: null });
          
          let user: User;
          switch (provider) {
            case AuthProvider.GOOGLE:
              user = await authService.loginWithGoogle();
              break;
            case AuthProvider.APPLE:
              user = await authService.loginWithApple();
              break;
            case AuthProvider.FACEBOOK:
              user = await authService.loginWithFacebook();
              break;
            default:
              throw new Error(`Unsupported provider: ${provider}`);
          }
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'OAuth login failed',
            user: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          
          await authService.logout();
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Logout failed',
          });
          throw error;
        }
      },

      // Reset password action
      resetPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await authService.sendPasswordResetEmail(email);
          
          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Password reset failed',
          });
          throw error;
        }
      },

      // Update profile action
      updateProfile: async (updates: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });
          
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('No user logged in');
          }
          
          const updatedUser = await authService.updateUserProfile({
            ...currentUser,
            ...updates,
          });
          
          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Profile update failed',
          });
          throw error;
        }
      },

      // Resend email verification
      resendEmailVerification: async () => {
        try {
          set({ isLoading: true, error: null });
          
          await authService.resendEmailVerification();
          
          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Email verification failed',
          });
          throw error;
        }
      },

      // Utility actions
      clearError: () => set({ error: null }),
      
      setUser: (user: User | null) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setError: (error: string | null) => set({ error }),

      // Initialize authentication state
      initialize: async () => {
        try {
          set({ isLoading: true });
          
          // Set up auth state listener
          authService.onAuthStateChange((user) => {
            set({
              user,
              isAuthenticated: !!user,
              isInitialized: true,
              isLoading: false,
            });
          });
          
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Initialization failed',
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Auth store selectors for optimized re-renders
 */
export const authSelectors = {
  user: (state: AuthState) => state.user,
  isAuthenticated: (state: AuthState) => state.isAuthenticated,
  isLoading: (state: AuthState) => state.isLoading,
  error: (state: AuthState) => state.error,
  isInitialized: (state: AuthState) => state.isInitialized,
};

export default useAuthStore;