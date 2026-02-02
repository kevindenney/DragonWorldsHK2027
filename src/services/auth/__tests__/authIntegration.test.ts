/**
 * Authentication Integration Tests
 *
 * End-to-end tests for authentication flows including
 * login/logout cycles, session persistence, and error recovery.
 */

import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals';

// Mock Firebase Auth module
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockSendEmailVerification = jest.fn();
const mockUpdateProfile = jest.fn();
const mockOnAuthStateChanged = jest.fn();

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  sendPasswordResetEmail: (...args: any[]) => mockSendPasswordResetEmail(...args),
  sendEmailVerification: (...args: any[]) => mockSendEmailVerification(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
  signInWithCredential: jest.fn(),
  GoogleAuthProvider: { credential: jest.fn() },
  OAuthProvider: jest.fn().mockImplementation(() => ({ credential: jest.fn() })),
}));

// Mock Firebase config
jest.mock('../../../config/firebase', () => ({
  auth: { currentUser: null },
  firestore: null,
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => null }),
  setDoc: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../config/firestore', () => ({
  getDocRef: { user: jest.fn().mockReturnValue({ path: 'users/test' }) },
  withTimestamp: jest.fn((data) => data),
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn().mockReturnValue('dragonworlds://auth/callback'),
  AuthRequest: jest.fn().mockImplementation(() => ({
    promptAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
  })),
  ResponseType: { IdToken: 'id_token' },
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock hermesDebugger
jest.mock('../../../utils/hermesDebugger', () => ({
  debugZustandStore: () => ({
    beforeCreate: jest.fn(),
    afterCreate: jest.fn(),
    beforePersist: jest.fn(),
    afterPersist: jest.fn(),
  }),
}));

// Import after mocks
import { useAuthStore } from '../../../stores/authStore';
import { MockAuthFactory } from '../../../testing/authTestMocks';
import {
  validateEmail,
  validatePassword,
  validateDisplayName,
} from '../authUtils';

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,
    });

    // Default mock implementations
    mockOnAuthStateChanged.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Login/Logout Cycle', () => {
    it('should complete full login and logout cycle', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();
      const mockCredential = { user: mockFirebaseUser };

      mockSignInWithEmailAndPassword.mockResolvedValueOnce(mockCredential);
      mockSignOut.mockResolvedValueOnce(undefined);

      // Initial state
      let state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();

      // Login
      await state.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      // Verify logged in state
      state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeTruthy();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.error).toBeNull();

      // Logout
      await state.logout();

      // Verify logged out state
      state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should handle rapid login/logout cycles', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();
      const mockCredential = { user: mockFirebaseUser };

      mockSignInWithEmailAndPassword.mockResolvedValue(mockCredential);
      mockSignOut.mockResolvedValue(undefined);

      // Perform multiple rapid cycles
      for (let i = 0; i < 5; i++) {
        let store = useAuthStore.getState();

        await store.login({
          email: 'test@example.com',
          password: 'Password123!',
        });

        expect(useAuthStore.getState().isAuthenticated).toBe(true);

        store = useAuthStore.getState();
        await store.logout();

        expect(useAuthStore.getState().isAuthenticated).toBe(false);
      }

      // Final state should be clean
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Registration Flow', () => {
    it('should complete full registration flow', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        emailVerified: false,
      });
      const mockCredential = { user: mockFirebaseUser };

      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce(mockCredential);
      mockUpdateProfile.mockResolvedValueOnce(undefined);
      mockSendEmailVerification.mockResolvedValueOnce(undefined);

      const registrationData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        displayName: 'New User',
      };

      // Validate inputs first (mimicking form validation)
      expect(validateEmail(registrationData.email)).toBe(true);
      expect(validatePassword(registrationData.password).isValid).toBe(true);
      expect(validateDisplayName(registrationData.displayName).isValid).toBe(true);

      // Register
      const store = useAuthStore.getState();
      await store.register(registrationData);

      // Verify registered and logged in
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeTruthy();
      expect(state.user?.displayName).toBe('New User');
      expect(state.user?.emailVerified).toBe(false);

      // Verification email should have been sent
      expect(mockSendEmailVerification).toHaveBeenCalled();
    });

    it('should prevent registration with invalid data', () => {
      // Test with invalid email
      expect(validateEmail('invalid-email')).toBe(false);

      // Test with weak password
      const weakPasswordResult = validatePassword('weak');
      expect(weakPasswordResult.isValid).toBe(false);
      expect(weakPasswordResult.errors.length).toBeGreaterThan(0);

      // Test with invalid display name
      const invalidNameResult = validateDisplayName('');
      expect(invalidNameResult.isValid).toBe(false);
    });

    it('should handle registration errors gracefully', async () => {
      const error: any = new Error('Email in use');
      error.code = 'auth/email-already-in-use';
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.register({
          email: 'existing@example.com',
          password: 'Password123!',
          displayName: 'User',
        });
      } catch (e) {
        // Expected
      }

      // State should reflect error
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);

      const store = useAuthStore.getState();

      await store.resetPassword('user@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com'
      );

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });

    it('should handle invalid email for password reset', async () => {
      const error: any = new Error('Invalid email');
      error.code = 'auth/invalid-email';
      mockSendPasswordResetEmail.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.resetPassword('invalid-email');
      } catch (e) {
        // Expected
      }

      const state = useAuthStore.getState();
      expect(state.error).toBeTruthy();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from login errors', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      // First attempt fails
      const error: any = new Error('Network error');
      error.code = 'auth/network-request-failed';
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      // First login attempt
      let store = useAuthStore.getState();
      try {
        await store.login({
          email: 'test@example.com',
          password: 'Password123!',
        });
      } catch (e) {
        // Expected
      }

      let state = useAuthStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.isAuthenticated).toBe(false);

      // Clear error
      store = useAuthStore.getState();
      store.clearError();

      state = useAuthStore.getState();
      expect(state.error).toBeNull();

      // Second attempt succeeds
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });

      store = useAuthStore.getState();
      await store.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should clear error state when starting new action', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      // Set initial error state
      useAuthStore.setState({ error: 'Previous error' });

      let state = useAuthStore.getState();
      expect(state.error).toBe('Previous error');

      // New login attempt should clear error
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });

      const store = useAuthStore.getState();
      await store.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('Session State Management', () => {
    it('should maintain user data consistency', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
      });
      const mockCredential = { user: mockFirebaseUser };

      mockSignInWithEmailAndPassword.mockResolvedValueOnce(mockCredential);

      const store = useAuthStore.getState();

      await store.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      // Verify all user data is consistent
      const state = useAuthStore.getState();
      expect(state.user?.uid).toBe('user-123');
      expect(state.user?.email).toBe('test@example.com');
      expect(state.user?.displayName).toBe('Test User');
      expect(state.user?.emailVerified).toBe(true);
    });

    it('should handle concurrent state access', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockFirebaseUser });

      // Login
      const store1 = useAuthStore.getState();
      await store1.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      // Both getState calls should see the same state
      const state1 = useAuthStore.getState();
      const state2 = useAuthStore.getState();

      expect(state1.isAuthenticated).toBe(true);
      expect(state2.isAuthenticated).toBe(true);
      expect(state1.user).toEqual(state2.user);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty credentials gracefully', async () => {
      const error: any = new Error('Invalid');
      error.code = 'auth/invalid-email';
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.login({
          email: '',
          password: '',
        });
      } catch (e) {
        // Expected
      }

      const state = useAuthStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle special characters in credentials', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        email: 'user+tag@example.com',
      });

      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });

      const store = useAuthStore.getState();

      await store.login({
        email: 'user+tag@example.com',
        password: 'P@$$w0rd!#$%',
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle very long inputs', async () => {
      const error: any = new Error('Invalid');
      error.code = 'auth/invalid-email';
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.login({
          email: 'a'.repeat(1000) + '@example.com',
          password: 'p'.repeat(1000),
        });
      } catch (e) {
        // Expected
      }

      // Should handle without crashing
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should handle unicode in display names', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        displayName: '日本語ユーザー',
      });

      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });
      mockUpdateProfile.mockResolvedValueOnce(undefined);
      mockSendEmailVerification.mockResolvedValueOnce(undefined);

      const store = useAuthStore.getState();

      await store.register({
        email: 'user@example.com',
        password: 'Password123!',
        displayName: '日本語ユーザー',
      });

      // Note: validateDisplayName may reject unicode, but Firebase might accept it
      // This tests that the store handles whatever Firebase returns
      const state = useAuthStore.getState();
      expect(state.user?.displayName).toBe('日本語ユーザー');
    });
  });

  describe('State Cleanup', () => {
    it('should clear all auth data with clearAuthData', () => {
      // Set up complex state
      const mockUser = MockAuthFactory.createMockUser();
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
        error: 'Some error',
        isInitialized: false,
      });

      // Verify state is set
      let state = useAuthStore.getState();
      expect(state.user).toBeTruthy();
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeTruthy();

      // Clear all data
      state.clearAuthData();

      // Verify clean state
      state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isInitialized).toBe(true);
    });
  });
});
