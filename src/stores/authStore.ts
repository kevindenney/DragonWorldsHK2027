import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User, AuthProviderType, LoginCredentials, RegisterCredentials } from '../types/simpleAuth';
import { getDocRef, withTimestamp, UserDocument } from '../config/firestore';
import { setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';

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
                preferences: {
                  notifications: true,
                  newsletter: false,
                  language: 'en',
                },
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
            preferences: userDoc.preferences,
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

      // OAuth provider login (placeholder - implement when OAuth is configured)
      loginWithProvider: async (provider: AuthProviderType) => {
        try {
          set({ isLoading: true, error: null });
          
          // TODO: Implement OAuth providers when credentials are configured
          throw new Error(`${provider} login not yet configured. Please use email/password authentication.`);
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