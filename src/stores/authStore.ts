import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugZustandStore } from '../utils/hermesDebugger';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User, AuthProviderType, LoginCredentials, RegisterCredentials } from '../types/simpleAuth';
import { getDocRef, withTimestamp, UserDocument } from '../config/firestore';
import { setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri } from 'expo-auth-session';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

/**
 * OAuth helper functions using native Google Sign-In
 */
const handleGoogleOAuth = async () => {
  try {
    console.log('🔐 [GOOGLE AUTH] ========== NATIVE SIGN-IN ==========');
    console.log('🔐 [GOOGLE AUTH] Platform:', Platform.OS);
    console.log('🔐 [GOOGLE AUTH] Web Client ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'NOT SET');

    // Check if Google Play Services are available (Android only)
    if (Platform.OS === 'android') {
      console.log('🔐 [GOOGLE AUTH] Checking Google Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('🔐 [GOOGLE AUTH] Google Play Services available');
    }

    // Sign in with Google
    console.log('🔐 [GOOGLE AUTH] Starting native sign-in...');
    const signInResult = await GoogleSignin.signIn();
    console.log('🔐 [GOOGLE AUTH] Sign-in successful, user:', signInResult.data?.user?.email);

    // Get the ID token
    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens.idToken;

    if (!idToken) {
      throw new Error('Failed to get ID token from Google Sign-In');
    }

    console.log('🔐 [GOOGLE AUTH] Got ID token, creating Firebase credential...');

    // Create Firebase credential from Google ID token
    const credential = GoogleAuthProvider.credential(idToken);
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const userCredential = await signInWithCredential(auth, credential);

    console.log('🔐 [GOOGLE AUTH] Firebase sign-in successful:', userCredential.user.email);
    return userCredential;

  } catch (error: any) {
    console.error('🔐 [GOOGLE AUTH] Error:', error);

    // Handle specific Google Sign-In errors
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google sign-in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google sign-in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available or outdated');
    } else {
      console.error('🔐 [GOOGLE AUTH] Error code:', error.code);
      console.error('🔐 [GOOGLE AUTH] Error message:', error.message);
      throw error;
    }
  }
};

const handleAppleOAuth = async () => {
  try {
    // Use expo-auth-session with Firebase Auth web flow for Apple
    const redirectUri = makeRedirectUri({
      scheme: 'dragonworlds',
      path: '/auth/callback',
    });

    const request = new AuthSession.AuthRequest({
      clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || 'com.dragonworlds.hk2027', // Use bundle ID as fallback
      scopes: ['name', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri,
      extraParams: {
        // Ensure we get an ID token for Firebase
        nonce: Math.random().toString(36).substring(2, 15),
        response_mode: 'form_post',
      },
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
    });

    if (result.type === 'success' && result.params.id_token) {
      // Create Firebase credential from Apple ID token
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: result.params.id_token,
      });
      if (!auth) throw new Error('Firebase Auth is not initialized');
      return await signInWithCredential(auth, credential);
    } else {
      throw new Error('Apple sign-in was cancelled or failed');
    }
  } catch (error) {
    throw error;
  }
};

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
  initializing: boolean;
  unsubscribe: (() => void) | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginWithProvider: (provider: AuthProviderType) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuthData: () => void;
}

/**
 * Authentication store using Zustand with persistence
 */
const authDebugger = debugZustandStore('authStore');
authDebugger.beforeCreate();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,
      initializing: false,
      unsubscribe: null,

      // Login action
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
          if (!auth) throw new Error('Firebase Auth is not initialized');
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          // Fetch user data from Firestore (if available)
          let userData = null;
          try {
            if (firestore) {
              const userDoc = await getDoc(getDocRef.user(userCredential.user.uid));
              userData = userDoc.data();
            }
          } catch (error) {
          }
          
          const user: User = {
            uid: userCredential.user.uid,
            email: userCredential.user.email || '',
            displayName: userData?.displayName || userCredential.user.displayName || '',
            photoURL: userData?.photoURL || userCredential.user.photoURL || undefined,
            phoneNumber: userData?.phoneNumber || userCredential.user.phoneNumber || undefined,
            emailVerified: userCredential.user.emailVerified,
            role: userData?.role || 'participant',
            providers: userData?.providers || ['email'],
            createdAt: userData?.createdAt?.toDate() || new Date(),
            updatedAt: userData?.updatedAt?.toDate() || new Date(),
            preferences: userData?.preferences,
            sailingProfile: userData?.sailingProfile,
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error?.code === 'auth/user-not-found'
            ? 'No account found with this email'
            : error?.code === 'auth/wrong-password'
            ? 'Incorrect password'
            : error?.code === 'auth/invalid-email'
            ? 'Invalid email address'
            : error?.message || 'Login failed';
          
          set({
            isLoading: false,
            error: errorMessage,
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

          if (!auth) throw new Error('Firebase Auth is not initialized');
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );

          // Update display name
          await updateProfile(userCredential.user, {
            displayName: credentials.displayName,
          });

          // Default preferences for new users
          const defaultPreferences = {
            notifications: true,
            newsletter: false,
            language: 'en',
          };

          // Create user document in Firestore (if available)
          try {
            if (firestore) {
              const userDoc = withTimestamp({
                uid: userCredential.user.uid,
                email: userCredential.user.email || '',
                displayName: credentials.displayName || '',
                emailVerified: false,
                role: 'participant' as const,
                providers: ['email'],
                preferences: defaultPreferences,
              });

              await setDoc(getDocRef.user(userCredential.user.uid), userDoc as any);
            } else {
            }
          } catch (error) {
          }

          // Send verification email
          await sendEmailVerification(userCredential.user);

          const user: User = {
            uid: userCredential.user.uid,
            email: userCredential.user.email || '',
            displayName: credentials.displayName || '',
            emailVerified: false,
            role: 'participant',
            providers: ['email'],
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: defaultPreferences,
          };
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error?.code === 'auth/email-already-in-use'
            ? 'An account already exists with this email'
            : error?.code === 'auth/weak-password'
            ? 'Password should be at least 6 characters'
            : error?.code === 'auth/invalid-email'
            ? 'Invalid email address'
            : error?.message || 'Registration failed';
            
          set({
            isLoading: false,
            error: errorMessage,
            user: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // OAuth provider login
      loginWithProvider: async (provider: AuthProviderType) => {
        try {
          set({ isLoading: true, error: null });

          let userCredential;

          switch (provider) {
            case 'google':
              userCredential = await handleGoogleOAuth();
              break;
            case 'apple':
              userCredential = await handleAppleOAuth();
              break;
            default:
              throw new Error(`${provider} login not yet implemented. Please use Google, Apple, or email/password authentication.`);
          }

          // Fetch user data from Firestore (if available)
          let userData = null;
          try {
            if (firestore) {
              const userDoc = await getDoc(getDocRef.user(userCredential.user.uid));
              userData = userDoc.data();
            }
          } catch (error) {
          }

          // Create or update user document in Firestore
          try {
            if (firestore) {
              const userDoc = withTimestamp({
                uid: userCredential.user.uid,
                email: userCredential.user.email || '',
                displayName: userCredential.user.displayName || '',
                photoURL: userCredential.user.photoURL || undefined,
                phoneNumber: userCredential.user.phoneNumber || undefined,
                emailVerified: userCredential.user.emailVerified,
                role: (userData?.role || 'participant') as 'participant' | 'organizer' | 'admin',
                providers: userData?.providers || [provider],
                preferences: userData?.preferences || {
                  notifications: true,
                  newsletter: false,
                  language: 'en',
                },
              });

              await setDoc(getDocRef.user(userCredential.user.uid), userDoc as any, { merge: true });
            }
          } catch (error) {
          }

          const user: User = {
            uid: userCredential.user.uid,
            email: userCredential.user.email || '',
            displayName: userCredential.user.displayName || '',
            photoURL: userCredential.user.photoURL || undefined,
            phoneNumber: userCredential.user.phoneNumber || undefined,
            emailVerified: userCredential.user.emailVerified,
            role: userData?.role || 'participant',
            providers: userData?.providers || [provider],
            createdAt: userData?.createdAt?.toDate() || new Date(),
            updatedAt: new Date(),
            preferences: userData?.preferences,
            sailingProfile: userData?.sailingProfile,
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error?.code === 'auth/account-exists-with-different-credential'
            ? 'An account already exists with the same email address but different sign-in credentials'
            : error?.code === 'auth/invalid-credential'
            ? 'Invalid credentials. Please try again'
            : error?.message || `${provider} login failed`;

          set({
            isLoading: false,
            error: errorMessage,
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

          if (!auth) throw new Error('Firebase Auth is not initialized');
          await signOut(auth);
          
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
          // Don't throw on logout error - still clear local state
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      // Reset password action
      resetPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });

          if (!auth) throw new Error('Firebase Auth is not initialized');
          await sendPasswordResetEmail(auth, email);
          
          set({
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error?.code === 'auth/user-not-found'
            ? 'No account found with this email'
            : error?.code === 'auth/invalid-email'
            ? 'Invalid email address'
            : error?.message || 'Password reset failed';
            
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Update profile action
      updateProfile: async (updates: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });
          
          const currentUser = get().user;
          const firebaseUser = auth?.currentUser;
          
          if (!currentUser || !firebaseUser) {
            throw new Error('No user logged in');
          }
          
          // Update Firebase Auth profile
          if (updates.displayName || updates.photoURL) {
            await updateProfile(firebaseUser, {
              displayName: updates.displayName,
              photoURL: updates.photoURL,
            });
          }
          
          // Update Firestore document (if available)
          try {
            if (firestore) {
              const userDocRef = getDocRef.user(currentUser.uid);
              await setDoc(userDocRef, {
                ...updates,
                updatedAt: serverTimestamp(),
              } as any, { merge: true });
            }
          } catch (error) {
          }
          
          const updatedUser = {
            ...currentUser,
            ...updates,
            updatedAt: new Date(),
          };
          
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

          if (!auth) {
            throw new Error('Auth not initialized');
          }
          const firebaseUser = auth.currentUser;
          if (!firebaseUser) {
            throw new Error('No user logged in');
          }
          
          await sendEmailVerification(firebaseUser);
          
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

      // Clear all auth data (for testing/debugging)
      clearAuthData: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          isInitialized: true,
        });
      },

      // Initialize authentication state
      initialize: async () => {
        try {
          const currentState = get();
          
          // Prevent multiple initializations
          if (currentState.isInitialized || currentState.initializing) {
            return;
          }

          // Mark as initializing to prevent concurrent calls
          set({ initializing: true });
          set({ isLoading: true });

          // Set up Firebase auth state listener
          if (!auth) throw new Error('Firebase Auth is not initialized');
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
              if (firebaseUser) {
                // Fetch user data from Firestore (if available)
                let userData = null;
                try {
                  if (firestore) {
                    const userDoc = await getDoc(getDocRef.user(firebaseUser.uid));
                    userData = userDoc.data();
                  }
                } catch (firestoreError) {
                }
                
                const user: User = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: userData?.displayName || firebaseUser.displayName || '',
                  photoURL: userData?.photoURL || firebaseUser.photoURL || undefined,
                  phoneNumber: userData?.phoneNumber || firebaseUser.phoneNumber || undefined,
                  emailVerified: firebaseUser.emailVerified,
                  role: userData?.role || 'participant',
                  providers: userData?.providers || ['email'],
                  createdAt: userData?.createdAt?.toDate() || new Date(),
                  updatedAt: userData?.updatedAt?.toDate() || new Date(),
                  preferences: userData?.preferences,
                  sailingProfile: userData?.sailingProfile,
                };

                set({
                  user,
                  isAuthenticated: true,
                  isInitialized: true,
                  isLoading: false,
                  error: null,
                });
              } else {
                set({
                  user: null,
                  isAuthenticated: false,
                  isInitialized: true,
                  isLoading: false,
                  error: null,
                });
              }
            } catch (error) {
              // Still mark as initialized to prevent loops
              set({
                isInitialized: true,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Auth state error',
              });
            }
          });
          
          // Store unsubscribe function for cleanup if needed
          set({ unsubscribe });
          
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
      storage: (() => {
        authDebugger.beforePersist();
        try {
          const storage = createJSONStorage(() => AsyncStorage);
          authDebugger.afterPersist();
          return storage;
        } catch (error) {
          throw error;
        }
      })(),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Post-creation debugging
authDebugger.afterCreate();

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