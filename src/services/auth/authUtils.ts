import { User, UserRole, AuthProviderType, UserStatus } from '../../types/auth';

/**
 * Authentication utilities and helpers
 */

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} => {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 20;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 20;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 20;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 20;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 20;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score,
  };
};

/**
 * Validate display name
 */
export const validateDisplayName = (displayName: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!displayName || displayName.trim().length === 0) {
    return { isValid: false, error: 'Display name is required' };
  }

  if (displayName.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters long' };
  }

  if (displayName.length > 50) {
    return { isValid: false, error: 'Display name must be less than 50 characters long' };
  }

  if (!/^[a-zA-Z0-9\s\-_.]+$/.test(displayName)) {
    return { isValid: false, error: 'Display name contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Validate phone number
 */
export const validatePhoneNumber = (phoneNumber: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!phoneNumber) {
    return { isValid: true }; // Phone number is optional
  }

  // Basic international phone number format
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  
  if (!phoneRegex.test(phoneNumber)) {
    return { 
      isValid: false, 
      error: 'Phone number must be in international format (e.g., +1234567890)' 
    };
  }

  return { isValid: true };
};

/**
 * Check if user has permission
 */
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;

  // Super admin has all permissions
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Admin has most permissions
  if (user.role === UserRole.ADMIN) {
    const adminPermissions = [
      'user:read',
      'user:update:own',
      'user:read:any',
      'profile:update:own',
      'profile:read',
      'admin:read',
    ];
    return adminPermissions.includes(permission);
  }

  // Regular user permissions
  const userPermissions = [
    'user:read:own',
    'user:update:own',
    'profile:update:own',
    'profile:read',
  ];
  
  return userPermissions.includes(permission);
};

/**
 * Check if user has role
 */
export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * Check if user is admin or super admin
 */
export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
};

/**
 * Check if user is active
 */
export const isActiveUser = (user: User | null): boolean => {
  if (!user) return false;
  return user.status === UserStatus.ACTIVE;
};

/**
 * Check if user's email is verified
 */
export const isEmailVerified = (user: User | null): boolean => {
  if (!user) return false;
  return user.emailVerified;
};

/**
 * Get user's primary authentication provider
 */
export const getPrimaryProvider = (user: User | null): AuthProviderType | null => {
  if (!user || !user.linkedProviders.length) return null;
  
  const primaryProvider = user.linkedProviders.find(p => p.isPrimary);
  return primaryProvider?.provider || user.providers[0] || null;
};

/**
 * Check if user can unlink a provider
 */
export const canUnlinkProvider = (user: User | null, provider: AuthProviderType): boolean => {
  if (!user) return false;
  
  // Must have password or multiple providers
  const hasPassword = user.providers.includes(AuthProviderType.EMAIL);
  const otherProviders = user.linkedProviders.filter(p => p.provider !== provider);
  
  return hasPassword || otherProviders.length > 0;
};

/**
 * Get user's avatar URL with fallback
 */
export const getUserAvatar = (user: User | null, size: number = 100): string => {
  if (!user) {
    return `https://ui-avatars.com/api/?name=User&size=${size}&background=6366f1&color=fff`;
  }

  if (user.photoURL) {
    return user.photoURL;
  }

  // Generate avatar from display name or email
  const name = user.displayName || user.email.split('@')[0];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=6366f1&color=fff`;
};

/**
 * Get user's initials
 */
export const getUserInitials = (user: User | null): string => {
  if (!user) return 'U';
  
  const name = user.displayName || user.email;
  const parts = name.split(' ');
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  return name[0]?.toUpperCase() || 'U';
};

/**
 * Format user's display name
 */
export const getDisplayName = (user: User | null): string => {
  if (!user) return 'User';
  
  return user.displayName || user.email.split('@')[0] || 'User';
};

/**
 * Get provider display name
 */
export const getProviderDisplayName = (provider: AuthProviderType): string => {
  const providerNames = {
    [AuthProviderType.EMAIL]: 'Email',
    [AuthProviderType.GOOGLE]: 'Google',
    [AuthProviderType.APPLE]: 'Apple',
    [AuthProviderType.FACEBOOK]: 'Facebook',
    [AuthProviderType.GITHUB]: 'GitHub',
  };
  
  return providerNames[provider] || provider;
};

/**
 * Get provider icon name (for use with icon libraries)
 */
export const getProviderIcon = (provider: AuthProviderType): string => {
  const providerIcons = {
    [AuthProviderType.EMAIL]: 'mail',
    [AuthProviderType.GOOGLE]: 'google',
    [AuthProviderType.APPLE]: 'apple',
    [AuthProviderType.FACEBOOK]: 'facebook',
    [AuthProviderType.GITHUB]: 'github',
  };
  
  return providerIcons[provider] || 'user';
};

/**
 * Calculate time since last login
 */
export const getTimeSinceLastLogin = (user: User | null): string => {
  if (!user || !user.metadata.lastLoginAt) {
    return 'Never';
  }
  
  const lastLogin = new Date(user.metadata.lastLoginAt);
  const now = new Date();
  const diff = now.getTime() - lastLogin.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length: number = 16): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return `• ${errors.join('\n• ')}`;
};