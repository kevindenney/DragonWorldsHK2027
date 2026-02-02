/**
 * Authentication Utilities Tests
 *
 * Unit tests for auth helper functions including validation,
 * permission checks, and utility functions.
 */

import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validatePhoneNumber,
  hasPermission,
  hasRole,
  isAdmin,
  isActiveUser,
  isEmailVerified,
  getUserAvatar,
  getUserInitials,
  getDisplayName,
  getProviderDisplayName,
  getProviderIcon,
  generateSecurePassword,
  sanitizeInput,
  formatValidationErrors,
} from '../authUtils';
import { UserRole, UserStatus, AuthProviderType } from '../../../types/auth';

// Mock user factory for testing
const createMockUser = (overrides = {}) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: undefined,
  phoneNumber: undefined,
  emailVerified: false,
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
  providers: [AuthProviderType.EMAIL],
  linkedProviders: [],
  primaryProvider: AuthProviderType.EMAIL,
  profile: {},
  preferences: {
    notifications: { email: true, push: true, sms: false },
    privacy: { profileVisible: true, emailVisible: false, phoneVisible: false, allowProviderLinking: true, allowDataSync: true },
    theme: 'light' as const,
    oauth: { autoSyncProfile: true, allowMultipleAccounts: false },
  },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    loginCount: 1,
  },
  ...overrides,
});

describe('authUtils', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user.name@example.com')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
      expect(validateEmail('user@subdomain.example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return valid for strong passwords', () => {
      const result = validatePassword('StrongP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    it('should return errors for short passwords', () => {
      const result = validatePassword('Ab1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should return errors for passwords without uppercase', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should return errors for passwords without lowercase', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should return errors for passwords without numbers', () => {
      const result = validatePassword('NoNumbers!!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return errors for passwords without special characters', () => {
      const result = validatePassword('NoSpecial123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should calculate correct score based on requirements met', () => {
      // All requirements met = 100
      expect(validatePassword('StrongP@ss123').score).toBe(100);

      // Missing one requirement = 80
      expect(validatePassword('strongp@ss123').score).toBe(80); // no uppercase

      // Very weak password - 'weak' gets 20 points for having lowercase
      expect(validatePassword('weak').score).toBe(20);
    });
  });

  describe('validateDisplayName', () => {
    it('should return valid for correct display names', () => {
      expect(validateDisplayName('John Doe').isValid).toBe(true);
      expect(validateDisplayName('User123').isValid).toBe(true);
      expect(validateDisplayName('Test-User_Name.').isValid).toBe(true);
    });

    it('should return error for empty display name', () => {
      const result = validateDisplayName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Display name is required');
    });

    it('should return error for whitespace-only display name', () => {
      const result = validateDisplayName('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Display name is required');
    });

    it('should return error for display name too short', () => {
      const result = validateDisplayName('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Display name must be at least 2 characters long');
    });

    it('should return error for display name too long', () => {
      const result = validateDisplayName('A'.repeat(51));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Display name must be less than 50 characters long');
    });

    it('should return error for invalid characters', () => {
      const result = validateDisplayName('User<script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Display name contains invalid characters');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should return valid for empty phone number (optional)', () => {
      expect(validatePhoneNumber('').isValid).toBe(true);
    });

    it('should return valid for correct international format', () => {
      expect(validatePhoneNumber('+1234567890').isValid).toBe(true);
      expect(validatePhoneNumber('+85212345678').isValid).toBe(true);
    });

    it('should return error for invalid format', () => {
      expect(validatePhoneNumber('1234567890').isValid).toBe(false);
      expect(validatePhoneNumber('+0123456789').isValid).toBe(false); // starts with 0
      expect(validatePhoneNumber('phone').isValid).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return false for null user', () => {
      expect(hasPermission(null, 'user:read')).toBe(false);
    });

    it('should grant all permissions to SUPER_ADMIN', () => {
      const superAdmin = createMockUser({ role: UserRole.SUPER_ADMIN });
      expect(hasPermission(superAdmin, 'user:read')).toBe(true);
      expect(hasPermission(superAdmin, 'admin:read')).toBe(true);
      expect(hasPermission(superAdmin, 'any:permission')).toBe(true);
    });

    it('should grant admin permissions to ADMIN role', () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      expect(hasPermission(admin, 'user:read')).toBe(true);
      expect(hasPermission(admin, 'admin:read')).toBe(true);
      expect(hasPermission(admin, 'user:read:any')).toBe(true);
    });

    it('should grant limited permissions to USER role', () => {
      const user = createMockUser({ role: UserRole.USER });
      expect(hasPermission(user, 'user:read:own')).toBe(true);
      expect(hasPermission(user, 'profile:read')).toBe(true);
      expect(hasPermission(user, 'admin:read')).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return false for null user', () => {
      expect(hasRole(null, UserRole.USER)).toBe(false);
    });

    it('should correctly check user role', () => {
      const user = createMockUser({ role: UserRole.USER });
      expect(hasRole(user, UserRole.USER)).toBe(true);
      expect(hasRole(user, UserRole.ADMIN)).toBe(false);
    });

    it('should correctly check admin role', () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      expect(hasRole(admin, UserRole.ADMIN)).toBe(true);
      expect(hasRole(admin, UserRole.USER)).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });

    it('should return false for regular user', () => {
      const user = createMockUser({ role: UserRole.USER });
      expect(isAdmin(user)).toBe(false);
    });

    it('should return true for admin', () => {
      const admin = createMockUser({ role: UserRole.ADMIN });
      expect(isAdmin(admin)).toBe(true);
    });

    it('should return true for super admin', () => {
      const superAdmin = createMockUser({ role: UserRole.SUPER_ADMIN });
      expect(isAdmin(superAdmin)).toBe(true);
    });
  });

  describe('isActiveUser', () => {
    it('should return false for null user', () => {
      expect(isActiveUser(null)).toBe(false);
    });

    it('should return true for active user', () => {
      const user = createMockUser({ status: UserStatus.ACTIVE });
      expect(isActiveUser(user)).toBe(true);
    });

    it('should return false for inactive user', () => {
      const user = createMockUser({ status: UserStatus.INACTIVE });
      expect(isActiveUser(user)).toBe(false);
    });

    it('should return false for suspended user', () => {
      const user = createMockUser({ status: UserStatus.SUSPENDED });
      expect(isActiveUser(user)).toBe(false);
    });
  });

  describe('isEmailVerified', () => {
    it('should return false for null user', () => {
      expect(isEmailVerified(null)).toBe(false);
    });

    it('should return true for verified email', () => {
      const user = createMockUser({ emailVerified: true });
      expect(isEmailVerified(user)).toBe(true);
    });

    it('should return false for unverified email', () => {
      const user = createMockUser({ emailVerified: false });
      expect(isEmailVerified(user)).toBe(false);
    });
  });

  describe('getUserAvatar', () => {
    it('should return default avatar for null user', () => {
      const avatar = getUserAvatar(null);
      expect(avatar).toContain('ui-avatars.com');
      expect(avatar).toContain('name=User');
    });

    it('should return user photoURL if available', () => {
      const user = createMockUser({ photoURL: 'https://example.com/photo.jpg' });
      expect(getUserAvatar(user)).toBe('https://example.com/photo.jpg');
    });

    it('should generate avatar from display name', () => {
      const user = createMockUser({ displayName: 'John Doe', photoURL: undefined });
      const avatar = getUserAvatar(user);
      expect(avatar).toContain('ui-avatars.com');
      expect(avatar).toContain('name=John%20Doe');
    });

    it('should use email if no display name', () => {
      const user = createMockUser({ displayName: '', email: 'john@example.com', photoURL: undefined });
      const avatar = getUserAvatar(user);
      expect(avatar).toContain('name=john');
    });

    it('should respect size parameter', () => {
      const avatar = getUserAvatar(null, 200);
      expect(avatar).toContain('size=200');
    });
  });

  describe('getUserInitials', () => {
    it('should return "U" for null user', () => {
      expect(getUserInitials(null)).toBe('U');
    });

    it('should return two initials for full name', () => {
      const user = createMockUser({ displayName: 'John Doe' });
      expect(getUserInitials(user)).toBe('JD');
    });

    it('should return single initial for single name', () => {
      const user = createMockUser({ displayName: 'John' });
      expect(getUserInitials(user)).toBe('J');
    });

    it('should fallback to email', () => {
      const user = createMockUser({ displayName: '', email: 'john@example.com' });
      expect(getUserInitials(user)).toBe('J');
    });
  });

  describe('getDisplayName', () => {
    it('should return "User" for null user', () => {
      expect(getDisplayName(null)).toBe('User');
    });

    it('should return display name if available', () => {
      const user = createMockUser({ displayName: 'John Doe' });
      expect(getDisplayName(user)).toBe('John Doe');
    });

    it('should fallback to email username', () => {
      const user = createMockUser({ displayName: '', email: 'john@example.com' });
      expect(getDisplayName(user)).toBe('john');
    });
  });

  describe('getProviderDisplayName', () => {
    it('should return correct display names for providers', () => {
      expect(getProviderDisplayName(AuthProviderType.EMAIL)).toBe('Email');
      expect(getProviderDisplayName(AuthProviderType.GOOGLE)).toBe('Google');
      expect(getProviderDisplayName(AuthProviderType.APPLE)).toBe('Apple');
      expect(getProviderDisplayName(AuthProviderType.FACEBOOK)).toBe('Facebook');
      expect(getProviderDisplayName(AuthProviderType.GITHUB)).toBe('GitHub');
    });
  });

  describe('getProviderIcon', () => {
    it('should return correct icon names for providers', () => {
      expect(getProviderIcon(AuthProviderType.EMAIL)).toBe('mail');
      expect(getProviderIcon(AuthProviderType.GOOGLE)).toBe('google');
      expect(getProviderIcon(AuthProviderType.APPLE)).toBe('apple');
      expect(getProviderIcon(AuthProviderType.FACEBOOK)).toBe('facebook');
      expect(getProviderIcon(AuthProviderType.GITHUB)).toBe('github');
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password of default length', () => {
      const password = generateSecurePassword();
      expect(password.length).toBe(16);
    });

    it('should generate password of specified length', () => {
      const password = generateSecurePassword(24);
      expect(password.length).toBe(24);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      expect(password1).not.toBe(password2);
    });

    it('should only use allowed characters', () => {
      const password = generateSecurePassword(100);
      const allowedChars = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/;
      expect(allowedChars.test(password)).toBe(true);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('should remove < and > characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('formatValidationErrors', () => {
    it('should return empty string for no errors', () => {
      expect(formatValidationErrors([])).toBe('');
    });

    it('should return single error as-is', () => {
      expect(formatValidationErrors(['Error 1'])).toBe('Error 1');
    });

    it('should format multiple errors with bullets', () => {
      const errors = ['Error 1', 'Error 2', 'Error 3'];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe('• Error 1\n• Error 2\n• Error 3');
    });
  });
});
