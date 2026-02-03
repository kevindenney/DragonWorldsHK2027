import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';
import { oauthConfig } from '../config/firebase';
import {
  User,
  AuthState,
  LoginCredentials,
  RegistrationData,
  AuthError,
  ProfileUpdateRequest,
  AuthContextType,
} from '../types/auth';


const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  USER: '@dragonworlds/auth_user',
  LAST_ACTIVITY: '@dragonworlds/last_activity',
} as const;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    lastActivity: null,
  });

  // Initialize Google Sign-In configuration
  useEffect(() => {
    if (oauthConfig.google.webClientId) {
      authService.initializeGoogleSignIn(oauthConfig.google.webClientId);
    }
  }, []);

  // Load persisted user data
  useEffect(() => {
    const loadPersistedUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const lastActivity = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
        
        if (storedUser) {
          const user: User = JSON.parse(storedUser);
          const lastActivityTime = lastActivity ? parseInt(lastActivity) : null;
          
          setAuthState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            lastActivity: lastActivityTime,
            isLoading: false,
          }));
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load stored authentication data',
        }));
      }
    };

    loadPersistedUser();
  }, []);

  // Set up Firebase auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          // Store user data
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
          
          setAuthState(prev => ({
            ...prev,
            user,
            firebaseUser: authService.getCurrentUser(),
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastActivity: Date.now(),
          }));
        } else {
          // Clear stored data
          await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.LAST_ACTIVITY]);
          
          setAuthState(prev => ({
            ...prev,
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            lastActivity: null,
          }));
        }
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to handle authentication state change',
        }));
      }
    });

    return unsubscribe;
  }, []);

  // Update last activity periodically
  useEffect(() => {
    if (authState.isAuthenticated) {
      const updateActivity = async () => {
        const currentTime = Date.now();
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, currentTime.toString());
        setAuthState(prev => ({
          ...prev,
          lastActivity: currentTime,
        }));
      };

      const interval = setInterval(updateActivity, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [authState.isAuthenticated]);

  const setLoading = (isLoading: boolean) => {
    setAuthState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setAuthState(prev => ({ ...prev, error }));
  };

  const clearError = () => {
    setError(null);
  };

  const signIn = async (credentials: LoginCredentials): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.signInWithEmailAndPassword(credentials);
      return user;
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (registrationData: RegistrationData): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.createUserWithEmailAndPassword(registrationData);
      
      // Send email verification automatically
      if (!user.emailVerified) {
        try {
          await authService.sendEmailVerification();
        } catch (verificationError) {
          // Don't throw here as the main sign up succeeded
        }
      }
      
      return user;
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.signOut();
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (method: 'popup' | 'redirect' = 'popup'): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.signInWithGoogle(method);
      return user;
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async (): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.signInWithApple();
      return user;
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.sendPasswordResetEmail(email);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerification = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.sendEmailVerification();
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profile: ProfileUpdateRequest): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.updateUserProfile(profile);
      // Refresh user data to get updated profile
      await refreshUser();
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.deleteAccount();
      // Clear stored data
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.LAST_ACTIVITY]);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // Force refresh the Firebase user token
      await currentUser.reload();
      // The auth state listener will handle updating our state
    }
  };

  const getUserToken = async (forceRefresh: boolean = false): Promise<string | null> => {
    try {
      return await authService.getUserToken(forceRefresh);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      return null;
    }
  };

  const contextValue: AuthContextType = {
    // State
    ...authState,
    
    // Actions
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithApple,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    deleteAccount,
    clearError,
    refreshUser,
    getUserToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthContext;