/**
 * Utility functions for validation
 */

export const validators = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (E.164 format)
   */
  isValidPhoneNumber: (phoneNumber: string): boolean => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  },

  /**
   * Validate Firebase UID format
   */
  isValidFirebaseUid: (uid: string): boolean => {
    const uidRegex = /^[a-zA-Z0-9_-]{28}$/;
    return uidRegex.test(uid);
  },

  /**
   * Validate URL format
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate password strength
   */
  isStrongPassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate display name
   */
  isValidDisplayName: (displayName: string): boolean => {
    return displayName.trim().length >= 1 && displayName.trim().length <= 100;
  },

  /**
   * Sanitize string input
   */
  sanitizeString: (str: string): string => {
    return str.trim().replace(/[<>]/g, '');
  },

  /**
   * Validate date range
   */
  isDateInRange: (date: Date, minDate?: Date, maxDate?: Date): boolean => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  },

  /**
   * Validate file size
   */
  isValidFileSize: (sizeInBytes: number, maxSizeInMB: number = 5): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return sizeInBytes <= maxSizeInBytes;
  },

  /**
   * Validate file type
   */
  isValidFileType: (mimeType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(mimeType);
  },

  /**
   * Validate IP address
   */
  isValidIPAddress: (ip: string): boolean => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  },

  /**
   * Validate JWT token format (basic check)
   */
  isValidJWTFormat: (token: string): boolean => {
    const parts = token.split('.');
    return parts.length === 3;
  }
};

export default validators;