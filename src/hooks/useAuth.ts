import { useAuth as useAuthContext } from '../auth/AuthProvider';
import { User, LoginCredentials, RegisterCredentials, AuthProviderType } from '../auth/authTypes';

/**
 * Enhanced authentication hook with additional utilities
 */
export const useAuth = () => {
  const authContext = useAuthContext();
  // Removed authStore to eliminate circular dependency

  /**
   * Check if user has specific role
   */
  const hasRole = (role: string): boolean => {
    return authContext.user?.role === role;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: string[]): boolean => {
    return authContext.user ? roles.includes(authContext.user.role) : false;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  /**
   * Check if user is organizer
   */
  const isOrganizer = (): boolean => {
    return hasRole('organizer');
  };

  /**
   * Check if user is participant
   */
  const isParticipant = (): boolean => {
    return hasRole('participant');
  };

  /**
   * Check if user's email is verified
   */
  const isEmailVerified = (): boolean => {
    return authContext.user?.emailVerified ?? false;
  };

  /**
   * Check if user's profile is complete
   */
  const isProfileComplete = (): boolean => {
    const user = authContext.user;
    if (!user) return false;

    return !!(
      user.displayName &&
      user.email &&
      user.phoneNumber
    );
  };

  /**
   * Get user's display name or fallback
   */
  const getDisplayName = (): string => {
    const user = authContext.user;
    if (!user) return 'Guest';

    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  /**
   * Get user's initials for avatar
   */
  const getUserInitials = (): string => {
    const displayName = getDisplayName();
    if (displayName === 'Guest' || displayName === 'User') return 'G';

    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  /**
   * Login with email and password
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    return authContext.login(credentials);
  };

  /**
   * Register with email and password
   */
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    return authContext.register(credentials);
  };

  /**
   * Login with OAuth provider
   */
  const loginWithProvider = async (provider: AuthProviderType): Promise<void> => {
    return authContext.loginWithProvider(provider);
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    return authContext.logout();
  };

  /**
   * Send password reset email
   */
  const resetPassword = async (email: string): Promise<void> => {
    return authContext.resetPassword(email);
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    return authContext.updateProfile(updates);
  };

  /**
   * Resend email verification - TODO: Implement in AuthProvider
   */
  const resendEmailVerification = async (): Promise<void> => {
    throw new Error('resendEmailVerification not implemented yet');
  };

  /**
   * Clear authentication error
   */
  const clearError = (): void => {
    authContext.clearError();
  };

  return {
    // State
    user: authContext.user,
    isAuthenticated: authContext.isAuthenticated,
    isLoading: authContext.isLoading,
    error: authContext.error,
    isInitialized: authContext.isInitialized,

    // Role checks
    hasRole,
    hasAnyRole,
    isAdmin,
    isOrganizer,
    isParticipant,

    // Status checks
    isEmailVerified,
    isProfileComplete,

    // User info utilities
    getDisplayName,
    getUserInitials,

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
};

export default useAuth;