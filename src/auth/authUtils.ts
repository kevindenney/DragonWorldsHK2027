import { AuthError, AuthErrorCodes, User, AuthProviderType } from '../types/auth';

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Password requirements configuration
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

/**
 * Display name requirements
 */
export const DISPLAY_NAME_REQUIREMENTS = {
  minLength: 2,
  maxLength: 50,
  allowedChars: /^[a-zA-Z0-9\s._-]+$/,
} as const;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates email address format
 * 
 * @param email - Email address to validate
 * @returns ValidationResult
 * 
 * @example
 * ```ts
 * const result = validateEmail('user@example.com');
 * if (!result.isValid) {
 *   console.error('Email errors:', result.errors);
 * }
 * ```
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Please enter a valid email address');
  } else if (email.length > 254) {
    errors.push('Email address is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates password strength and requirements
 * 
 * @param password - Password to validate
 * @param requirements - Custom password requirements (optional)
 * @returns ValidationResult
 * 
 * @example
 * ```ts
 * const result = validatePassword('MyPassword123!');
 * if (!result.isValid) {
 *   result.errors.forEach(error => console.error(error));
 * }
 * ```
 */
export const validatePassword = (
  password: string,
  requirements = PASSWORD_REQUIREMENTS
): ValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  if (password.length > requirements.maxLength) {
    errors.push(`Password must be no more than ${requirements.maxLength} characters long`);
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requirements.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${requirements.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates display name
 * 
 * @param displayName - Display name to validate
 * @param requirements - Custom display name requirements (optional)
 * @returns ValidationResult
 * 
 * @example
 * ```ts
 * const result = validateDisplayName('John Doe');
 * if (!result.isValid) {
 *   console.error('Display name errors:', result.errors);
 * }
 * ```
 */
export const validateDisplayName = (
  displayName: string,
  requirements = DISPLAY_NAME_REQUIREMENTS
): ValidationResult => {
  const errors: string[] = [];

  if (!displayName) {
    errors.push('Display name is required');
    return { isValid: false, errors };
  }

  if (displayName.length < requirements.minLength) {
    errors.push(`Display name must be at least ${requirements.minLength} characters long`);
  }

  if (displayName.length > requirements.maxLength) {
    errors.push(`Display name must be no more than ${requirements.maxLength} characters long`);
  }

  if (!requirements.allowedChars.test(displayName)) {
    errors.push('Display name can only contain letters, numbers, spaces, dots, underscores, and hyphens');
  }

  // Check for consecutive spaces or special characters
  if (/\s{2,}/.test(displayName)) {
    errors.push('Display name cannot contain consecutive spaces');
  }

  // Check if name starts or ends with space or special character
  if (/^[\s._-]|[\s._-]$/.test(displayName)) {
    errors.push('Display name cannot start or end with spaces or special characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates registration form data
 * 
 * @param data - Registration form data
 * @returns ValidationResult
 * 
 * @example
 * ```ts
 * const result = validateRegistrationData({
 *   email: 'user@example.com',
 *   password: 'MyPassword123!',
 *   displayName: 'John Doe',
 *   acceptTerms: true
 * });
 * ```
 */
export const validateRegistrationData = (data: {
  email: string;
  password: string;
  displayName: string;
  acceptTerms: boolean;
}): ValidationResult => {
  const allErrors: string[] = [];

  // Validate email
  const emailResult = validateEmail(data.email);
  allErrors.push(...emailResult.errors);

  // Validate password
  const passwordResult = validatePassword(data.password);
  allErrors.push(...passwordResult.errors);

  // Validate display name
  const displayNameResult = validateDisplayName(data.displayName);
  allErrors.push(...displayNameResult.errors);

  // Validate terms acceptance
  if (!data.acceptTerms) {
    allErrors.push('You must accept the terms and conditions');
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};

/**
 * Validates login credentials
 * 
 * @param credentials - Login credentials
 * @returns ValidationResult
 * 
 * @example
 * ```ts
 * const result = validateLoginCredentials({
 *   email: 'user@example.com',
 *   password: 'mypassword'
 * });
 * ```
 */
export const validateLoginCredentials = (credentials: {
  email: string;
  password: string;
}): ValidationResult => {
  const errors: string[] = [];

  if (!credentials.email) {
    errors.push('Email is required');
  } else {
    const emailResult = validateEmail(credentials.email);
    errors.push(...emailResult.errors);
  }

  if (!credentials.password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Gets human-readable error message from Firebase auth error
 * 
 * @param error - Firebase auth error or error code
 * @returns Human-readable error message
 * 
 * @example
 * ```ts
 * try {
 *   await signIn(credentials);
 * } catch (error) {
 *   const message = getAuthErrorMessage(error);
 *   showErrorToast(message);
 * }
 * ```
 */
export const getAuthErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return AuthErrorCodes[error as keyof typeof AuthErrorCodes] || error;
  }

  if (error?.code) {
    return AuthErrorCodes[error.code as keyof typeof AuthErrorCodes] || error.message || 'An unknown error occurred';
  }

  return error?.message || 'An unknown error occurred';
};

/**
 * Formats user's full name from display name or email
 * 
 * @param user - User object
 * @returns Formatted display name
 * 
 * @example
 * ```ts
 * const name = formatUserDisplayName(user);
 * console.log(`Welcome, ${name}!`);
 * ```
 */
export const formatUserDisplayName = (user: User): string => {
  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }

  // Fallback to email username
  if (user.email) {
    const emailUsername = user.email.split('@')[0];
    return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
  }

  return 'User';
};

/**
 * Gets the primary authentication provider for a user
 * 
 * @param user - User object
 * @returns Primary auth provider
 * 
 * @example
 * ```ts
 * const provider = getPrimaryProvider(user);
 * console.log(`User signed in with: ${provider}`);
 * ```
 */
export const getPrimaryProvider = (user: User): AuthProviderType => {
  return user.primaryProvider || AuthProviderType.EMAIL;
};

/**
 * Checks if user can unlink a specific provider
 * 
 * @param user - User object
 * @param provider - Provider to check
 * @returns Whether provider can be unlinked
 * 
 * @example
 * ```ts
 * const canUnlink = canUnlinkProvider(user, AuthProviderType.GOOGLE);
 * if (canUnlink) {
 *   // Show unlink option
 * }
 * ```
 */
export const canUnlinkProvider = (user: User, provider: AuthProviderType): boolean => {
  // User must have at least one other provider
  return user.providers.length > 1 && user.providers.includes(provider);
};

/**
 * Gets user's initials for avatar display
 * 
 * @param user - User object
 * @returns User's initials (up to 2 characters)
 * 
 * @example
 * ```ts
 * const initials = getUserInitials(user);
 * // Use in avatar component: <Avatar>{initials}</Avatar>
 * ```
 */
export const getUserInitials = (user: User): string => {
  const displayName = formatUserDisplayName(user);
  
  const words = displayName.split(' ').filter(word => word.length > 0);
  
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  
  return 'U';
};

/**
 * Generates a secure random password
 * 
 * @param length - Password length (default: 16)
 * @param includeSymbols - Whether to include symbols (default: true)
 * @returns Generated password
 * 
 * @example
 * ```ts
 * const tempPassword = generateSecurePassword(12);
 * console.log('Generated password:', tempPassword);
 * ```
 */
export const generateSecurePassword = (length: number = 16, includeSymbols: boolean = true): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = includeSymbols ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Ensure at least one character from each required category
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  if (includeSymbols && symbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Calculates password strength score (0-100)
 * 
 * @param password - Password to analyze
 * @returns Strength score and feedback
 * 
 * @example
 * ```ts
 * const strength = getPasswordStrength('MyPassword123!');
 * console.log(`Strength: ${strength.score}/100 - ${strength.feedback}`);
 * ```
 */
export const getPasswordStrength = (password: string): { score: number; feedback: string } => {
  if (!password) {
    return { score: 0, feedback: 'Enter a password' };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (password.length >= 8) score += 20;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety scoring
  if (/[a-z]/.test(password)) {
    score += 10;
  } else {
    feedback.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 10;
  } else {
    feedback.push('Include uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 10;
  } else {
    feedback.push('Include numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Include special characters');
  }

  // Pattern analysis
  if (!/(.)\1{2,}/.test(password)) {
    score += 10; // No repeated characters
  }

  if (!/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def/.test(password.toLowerCase())) {
    score += 5; // No sequential patterns
  }

  // Common password penalties
  const commonWords = ['password', '123456', 'qwerty', 'admin', 'login'];
  const hasCommon = commonWords.some(word => password.toLowerCase().includes(word));
  if (hasCommon) {
    score -= 20;
    feedback.push('Avoid common words');
  }

  score = Math.max(0, Math.min(100, score));

  let strengthText = '';
  if (score < 30) strengthText = 'Very Weak';
  else if (score < 50) strengthText = 'Weak';
  else if (score < 70) strengthText = 'Fair';
  else if (score < 85) strengthText = 'Strong';
  else strengthText = 'Very Strong';

  return {
    score,
    feedback: feedback.length > 0 ? feedback.join(', ') : strengthText,
  };
};

/**
 * Debounce utility for validation
 * 
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 * 
 * @example
 * ```ts
 * const debouncedValidation = debounce((email: string) => {
 *   const result = validateEmail(email);
 *   setEmailError(result.errors[0]);
 * }, 500);
 * ```
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default {
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
  DISPLAY_NAME_REQUIREMENTS,
};