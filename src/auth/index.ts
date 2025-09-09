// Authentication service
export { default as authService } from './authService';

// Context and hooks
export { AuthProvider, AuthContext } from './AuthContext';
export { 
  useAuth, 
  useAuthUser, 
  useAuthLoading, 
  useAuthError, 
  useAuthActions, 
  useHasProvider, 
  useLastActivity,
  isAuthenticated 
} from './useAuth';

// Route protection
export { 
  ProtectedRoute, 
  withAuth, 
  useAuthRequirements 
} from './ProtectedRoute';

// Utilities and validation
export {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validateRegistrationData,
  validateLoginCredentials,
  getAuthErrorMessage,
  formatUserDisplayName,
  getPrimaryProvider,
  canUnlinkProvider,
  getUserInitials,
  generateSecurePassword,
  getPasswordStrength,
  debounce,
  PASSWORD_REQUIREMENTS,
  DISPLAY_NAME_REQUIREMENTS
} from './authUtils';

// Types
export type {
  AuthProvider,
  UserRole,
  UserStatus,
  User,
  AuthState,
  LoginCredentials,
  RegistrationData,
  AuthError,
  ProfileUpdateRequest,
  AuthContextType,
  ValidationResult
} from '../types/auth';