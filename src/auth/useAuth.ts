import { useContext } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';

/**
 * Custom hook to access authentication context
 * 
 * @throws Error if used outside of AuthProvider
 * @returns AuthContextType - Authentication context with state and methods
 * 
 * @example
 * ```tsx
 * function LoginComponent() {
 *   const { signIn, isLoading, error, clearError } = useAuth();
 *   
 *   const handleLogin = async (email: string, password: string) => {
 *     try {
 *       await signIn({ email, password });
 *       // Handle successful login
 *     } catch (error) {
 *       // Error is automatically set in context
 *       console.error('Login failed:', error);
 *     }
 *   };
 *   
 *   return (
 *     <View>
 *       {error && (
 *         <Text style={styles.error}>
 *           {error.message}
 *           <TouchableOpacity onPress={clearError}>
 *             <Text>Dismiss</Text>
 *           </TouchableOpacity>
 *         </Text>
 *       )}
 *       <TouchableOpacity 
 *         onPress={() => handleLogin('user@example.com', 'password')}
 *         disabled={isLoading}
 *       >
 *         <Text>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
 *       </TouchableOpacity>
 *     </View>
 *   );
 * }
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>.'
    );
  }
  
  return context;
};

/**
 * Type guard to check if user is authenticated
 * 
 * @param authState - Authentication state from useAuth hook
 * @returns boolean - True if user is authenticated and not null
 * 
 * @example
 * ```tsx
 * function ProfileComponent() {
 *   const auth = useAuth();
 *   
 *   if (!isAuthenticated(auth)) {
 *     return <LoginPrompt />;
 *   }
 *   
 *   // TypeScript now knows auth.user is not null
 *   return <Text>Welcome, {auth.user.displayName}!</Text>;
 * }
 * ```
 */
export const isAuthenticated = (authState: AuthContextType): authState is AuthContextType & { user: NonNullable<AuthContextType['user']> } => {
  return authState.isAuthenticated && authState.user !== null;
};

/**
 * Hook to get current user with type safety
 * 
 * @returns User | null - Current authenticated user or null
 * 
 * @example
 * ```tsx
 * function UserProfile() {
 *   const user = useAuthUser();
 *   
 *   if (!user) {
 *     return <Text>Please sign in</Text>;
 *   }
 *   
 *   return (
 *     <View>
 *       <Text>Email: {user.email}</Text>
 *       <Text>Name: {user.displayName}</Text>
 *       <Text>Verified: {user.emailVerified ? 'Yes' : 'No'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export const useAuthUser = () => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook to check authentication loading state
 * 
 * @returns boolean - True if authentication is currently loading
 * 
 * @example
 * ```tsx
 * function App() {
 *   const isLoading = useAuthLoading();
 *   
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *   
 *   return <MainApp />;
 * }
 * ```
 */
export const useAuthLoading = () => {
  const { isLoading } = useAuth();
  return isLoading;
};

/**
 * Hook to get current authentication error
 * 
 * @returns AuthError | null - Current authentication error or null
 * 
 * @example
 * ```tsx
 * function ErrorDisplay() {
 *   const error = useAuthError();
 *   const { clearError } = useAuth();
 *   
 *   if (!error) return null;
 *   
 *   return (
 *     <View style={styles.errorContainer}>
 *       <Text style={styles.errorText}>{error.message}</Text>
 *       <TouchableOpacity onPress={clearError}>
 *         <Text>Dismiss</Text>
 *       </TouchableOpacity>
 *     </View>
 *   );
 * }
 * ```
 */
export const useAuthError = () => {
  const { error } = useAuth();
  return error;
};

/**
 * Hook for authentication actions
 * 
 * @returns Object with authentication action methods
 * 
 * @example
 * ```tsx
 * function AuthButtons() {
 *   const { signOut, signInWithGoogle, sendPasswordResetEmail } = useAuthActions();
 *   
 *   return (
 *     <View>
 *       <TouchableOpacity onPress={() => signInWithGoogle()}>
 *         <Text>Sign in with Google</Text>
 *       </TouchableOpacity>
 *       <TouchableOpacity onPress={() => signOut()}>
 *         <Text>Sign Out</Text>
 *       </TouchableOpacity>
 *       <TouchableOpacity onPress={() => sendPasswordResetEmail('user@example.com')}>
 *         <Text>Reset Password</Text>
 *       </TouchableOpacity>
 *     </View>
 *   );
 * }
 * ```
 */
export const useAuthActions = () => {
  const {
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
  } = useAuth();
  
  return {
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
};

/**
 * Hook to check if user has specific provider linked
 * 
 * @param provider - Provider to check for
 * @returns boolean - True if user has the specified provider linked
 * 
 * @example
 * ```tsx
 * function SocialLinksSettings() {
 *   const hasGoogle = useHasProvider('google');
 *   const hasApple = useHasProvider('apple');
 *   
 *   return (
 *     <View>
 *       <Text>Google linked: {hasGoogle ? 'Yes' : 'No'}</Text>
 *       <Text>Apple linked: {hasApple ? 'Yes' : 'No'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export const useHasProvider = (provider: string) => {
  const { user } = useAuth();
  return user?.providers.includes(provider as any) ?? false;
};

/**
 * Hook to get user's last activity timestamp
 * 
 * @returns number | null - Last activity timestamp or null
 * 
 * @example
 * ```tsx
 * function LastSeenIndicator() {
 *   const lastActivity = useLastActivity();
 *   
 *   if (!lastActivity) return null;
 *   
 *   const lastSeen = new Date(lastActivity).toLocaleString();
 *   return <Text>Last active: {lastSeen}</Text>;
 * }
 * ```
 */
export const useLastActivity = () => {
  const { lastActivity } = useAuth();
  return lastActivity;
};

export default useAuth;