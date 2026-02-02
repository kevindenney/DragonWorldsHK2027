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
import { setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { makeRedirectUri } from 'expo-auth-session';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth helper functions
 */
const handleGoogleOAuth = async () => {
  try {
    // Use expo-auth-session with Firebase Auth web flow
    const redirectUri = makeRedirectUri({
      scheme: 'dragonworlds',
      path: '/auth/callback',
    });

    const request = new AuthSession.AuthRequest({
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri,
      extraParams: {
        // Ensure we get an ID token for Firebase
        nonce: Math.random().toString(36).substring(2, 15),
      },
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    });

    if (result.type === 'success' && result.params.id_token) {
      // Create Firebase credential from Google ID token
      const credential = GoogleAuthProvider.credential(result.params.id_token);
      return await signInWithCredential(auth, credential);
    } else {
      throw new Error('Google sign-in was cancelled or failed');
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw error;
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
      return await signInWithCredential(auth, credential);
    } else {
      throw new Error('Apple sign-in was cancelled or failed');
    }
  } catch (error) {
    console.error('Apple OAuth error:', error);
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

      // Login action
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
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
            console.warn('⚠️ Could not fetch user data from Firestore:', error);
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
              const userDoc: UserDocument = withTimestamp({
                uid: userCredential.user.uid,
                email: userCredential.user.email || '',
                displayName: credentials.displayName || '',
                emailVerified: false,
                role: 'participant',
                providers: ['email'],
                preferences: defaultPreferences,
              });

              await setDoc(getDocRef.user(userCredential.user.uid), userDoc);
              console.log('✅ User document created in Firestore');
            } else {
              console.warn('⚠️ Firestore not available, skipping user document creation');
            }
          } catch (error) {
            console.warn('⚠️ Could not create user document in Firestore:', error);
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
            console.warn('⚠️ Could not fetch user data from Firestore:', error);
          }

          // Create or update user document in Firestore
          try {
            if (firestore) {
              const userDoc: UserDocument = withTimestamp({
                uid: userCredential.user.uid,
                email: userCredential.user.email || '',
                displayName: userCredential.user.displayName || '',
                photoURL: userCredential.user.photoURL || undefined,
                phoneNumber: userCredential.user.phoneNumber || undefined,
                emailVerified: userCredential.user.emailVerified,
                role: userData?.role || 'participant',
                providers: userData?.providers || [provider],
                preferences: userData?.preferences || {
                  notifications: true,
                  newsletter: false,
                  language: 'en',
                },
              });

              await setDoc(getDocRef.user(userCredential.user.uid), userDoc, { merge: true });
              console.log(`✅ User document updated in Firestore for ${provider} login`);
            }
          } catch (error) {
            console.warn('⚠️ Could not update user document in Firestore:', error);
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
          const firebaseUser = auth.currentUser;
          
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
                updatedAt: new Date(),
              }, { merge: true });
            }
          } catch (error) {
            console.warn('⚠️ Could not update user document in Firestore:', error);
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
          if (currentState.isInitialized || (currentState as any).initializing) {
            return;
          }
          
          // Mark as initializing to prevent concurrent calls
          (currentState as any).initializing = true;
          set({ isLoading: true });
          
          // Set up Firebase auth state listener
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
                  console.warn('⚠️ Could not fetch user data from Firestore:', firestoreError);
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
              console.error('Auth state change error:', error);
              // Still mark as initialized to prevent loops
              set({
                isInitialized: true,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Auth state error',
              });
            }
          });
          
          // Store unsubscribe function for cleanup if needed
          (get() as any).unsubscribe = unsubscribe;
          
        } catch (error) {
          console.error('Auth initialization error:', error);
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
        console.log('🔍 [AuthStore] Creating AsyncStorage for Zustand persistence...');
        try {
          const storage = createJSONStorage(() => AsyncStorage);
          authDebugger.afterPersist();
          console.log('🔍 [AuthStore] AsyncStorage persistence setup successful');
          return storage;
        } catch (error) {
          console.error('🚨 [AuthStore] AsyncStorage persistence setup failed:', error);
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
authDebugger.afterCreate(useAuthStore);

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