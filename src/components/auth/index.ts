// Authentication Component Library
// Comprehensive auth components with accessibility and responsive design

// Core Form Components
export { AuthInput } from './AuthInput';
export type { AuthInputProps, AuthInputRef } from './AuthInput';

export { AuthButton } from './AuthButton';
export type { AuthButtonProps } from './AuthButton';

// export { LoginForm, RegisterForm } from './AuthForm'; // Temporarily disabled
// export type { LoginFormProps, RegisterFormProps } from './AuthForm'; // Temporarily disabled

// export { PasswordResetForm, ChangePasswordForm } from './PasswordResetForm'; // Temporarily disabled
// export type { PasswordResetFormProps, ChangePasswordFormProps } from './PasswordResetForm'; // Temporarily disabled

// Social Login Components
import { commonProviderSets as _commonProviderSets } from './SocialLoginButton';
export { SocialLoginButton, SocialLoginGroup, commonProviderSets } from './SocialLoginButton';
export type { SocialLoginButtonProps, SocialLoginGroupProps } from './SocialLoginButton';
const commonProviderSets = _commonProviderSets;

// User Profile & Dashboard
// export { UserProfile } from './UserProfile'; // Temporarily disabled
// export type { UserProfileProps } from './UserProfile'; // Temporarily disabled

// Route Protection
export {
  AuthGuard,
  RequireAuth,
  RequireRole,
  RequireAdmin,
  GuestOnly,
  useAuthGuard
} from './AuthGuard';
export type {
  AuthGuardProps,
  RequireAuthProps,
  RequireRoleProps,
  RequireAdminProps,
  GuestOnlyProps
} from './AuthGuard';

// Progressive Authentication
export {
  ProgressiveAuthPrompt,
  useProgressiveAuth
} from './ProgressiveAuthPrompt';

// Notification System
export { 
  Notification,
  AuthNotification,
  ConnectionStatus,
  NotificationProvider,
  useNotifications
} from './NotificationSystem';
export type { 
  NotificationProps, 
  NotificationConfig, 
  NotificationType,
  AuthNotificationProps 
} from './NotificationSystem';

// Utility exports for external usage
export const AuthComponentsVersion = '1.0.0';

// Common auth scenarios - ready-to-use component compositions
export const AuthComponents = {
  // Complete login screen with social options
  // FullLoginScreen: LoginForm, // Temporarily disabled
  
  // Complete registration screen with validation
  // FullRegisterScreen: RegisterForm, // Temporarily disabled
  
  // Password reset flow
  // PasswordResetFlow: PasswordResetForm, // Temporarily disabled
  
  // User profile dashboard
  // ProfileDashboard: UserProfile, // Temporarily disabled
  
  // Route guards
  // ProtectedRoute: RequireAuth, // Temporarily disabled
  // AdminRoute: RequireAdmin, // Temporarily disabled
  
  // Social login options
  // SocialLogin: SocialLoginGroup, // Temporarily disabled
} as const;

// Default configurations for common use cases
export const defaultAuthConfig = {
  socialProviders: commonProviderSets.basic,
  enableNotifications: true,
  autoHideNotifications: true,
  requireEmailVerification: true,
  passwordMinLength: 8,
  enableBiometric: false,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
} as const;

// Common validation patterns
export const authValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
} as const;

// Accessibility labels and hints
export const authAccessibilityLabels = {
  loginButton: 'Sign in to your account',
  registerButton: 'Create a new account',
  forgotPasswordButton: 'Reset your password',
  socialLoginButton: (provider: string) => `Continue with ${provider}`,
  passwordToggle: 'Toggle password visibility',
  emailInput: 'Email address, required field',
  passwordInput: 'Password, required field',
  profilePicture: 'Profile picture',
  signOutButton: 'Sign out of your account',
} as const;