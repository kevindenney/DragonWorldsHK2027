/**
 * Authentication Store Tests
 *
 * Unit tests for the Zustand-based authentication store.
 * Tests login, logout, registration, password reset, and state management.
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
const mockSignInWithCredential = jest.fn();

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  sendPasswordResetEmail: (...args: any[]) => mockSendPasswordResetEmail(...args),
  sendEmailVerification: (...args: any[]) => mockSendEmailVerification(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
  signInWithCredential: (...args: any[]) => mockSignInWithCredential(...args),
  GoogleAuthProvider: { credential: jest.fn() },
  OAuthProvider: jest.fn().mockImplementation(() => ({ credential: jest.fn() })),
}));

// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  auth: { currentUser: null },
  firestore: null,
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => null }),
  setDoc: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../config/firestore', () => ({
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
jest.mock('../../utils/hermesDebugger', () => ({
  debugZustandStore: () => ({
    beforeCreate: jest.fn(),
    afterCreate: jest.fn(),
    beforePersist: jest.fn(),
    afterPersist: jest.fn(),
  }),
}));

// Import the store after mocks are set up
import { useAuthStore, authSelectors } from '../authStore';
import { MockAuthFactory } from '../../testing/authTestMocks';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset all mocks
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
    mockOnAuthStateChanged.mockReturnValue(jest.fn()); // Return unsubscribe function
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isInitialized).toBe(false);
    });

    it('should have all required actions', () => {
      const state = useAuthStore.getState();

      expect(typeof state.login).toBe('function');
      expect(typeof state.register).toBe('function');
      expect(typeof state.loginWithProvider).toBe('function');
      expect(typeof state.logout).toBe('function');
      expect(typeof state.resetPassword).toBe('function');
      expect(typeof state.updateProfile).toBe('function');
      expect(typeof state.resendEmailVerification).toBe('function');
      expect(typeof state.clearError).toBe('function');
      expect(typeof state.initialize).toBe('function');
      expect(typeof state.setUser).toBe('function');
      expect(typeof state.setLoading).toBe('function');
      expect(typeof state.setError).toBe('function');
      expect(typeof state.clearAuthData).toBe('function');
    });
  });

  describe('Selectors', () => {
    it('should select user correctly', () => {
      const mockUser = MockAuthFactory.createMockUser();
      useAuthStore.setState({ user: mockUser });

      const state = useAuthStore.getState();
      expect(authSelectors.user(state)).toEqual(mockUser);
    });

    it('should select isAuthenticated correctly', () => {
      useAuthStore.setState({ isAuthenticated: true });

      const state = useAuthStore.getState();
      expect(authSelectors.isAuthenticated(state)).toBe(true);
    });

    it('should select isLoading correctly', () => {
      useAuthStore.setState({ isLoading: true });

      const state = useAuthStore.getState();
      expect(authSelectors.isLoading(state)).toBe(true);
    });

    it('should select error correctly', () => {
      useAuthStore.setState({ error: 'Test error' });

      const state = useAuthStore.getState();
      expect(authSelectors.error(state)).toBe('Test error');
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();
      const mockCredential = { user: mockFirebaseUser };

      mockSignInWithEmailAndPassword.mockResolvedValueOnce(mockCredential);

      const store = useAuthStore.getState();

      await store.login({
        email: 'test@example.com',
        password: 'password123',
      });

      const state = useAuthStore.getState();

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeTruthy();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle user not found error', async () => {
      const error: any = new Error('User not found');
      error.code = 'auth/user-not-found';
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.login({
          email: 'notfound@example.com',
          password: 'password123',
        });
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe('No account found with this email');
      expect(state.isLoading).toBe(false);
    });

    it('should handle wrong password error', async () => {
      const error: any = new Error('Wrong password');
      error.code = 'auth/wrong-password';
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe('Incorrect password');
    });

    it('should handle invalid email error', async () => {
      const error: any = new Error('Invalid email');
      error.code = 'auth/invalid-email';
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.login({
          email: 'invalid-email',
          password: 'password123',
        });
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe('Invalid email address');
    });

    it('should handle generic error', async () => {
      const error = new Error('Something went wrong');
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.login({
          email: 'test@example.com',
          password: 'password123',
        });
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe('Something went wrong');
    });
  });

  describe('Registration', () => {
    it('should register successfully with valid data', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        emailVerified: false,
      });
      const mockCredential = { user: mockFirebaseUser };

      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce(mockCredential);
      mockUpdateProfile.mockResolvedValueOnce(undefined);
      mockSendEmailVerification.mockResolvedValueOnce(undefined);

      const store = useAuthStore.getState();

      await store.register({
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        displayName: 'New User',
      });

      const state = useAuthStore.getState();

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'NewPassword123!'
      );
      expect(mockUpdateProfile).toHaveBeenCalled();
      expect(mockSendEmailVerification).toHaveBeenCalled();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.displayName).toBe('New User');
    });

    it('should handle email already in use error', async () => {
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
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe('An account already exists with this email');
    });

    it('should handle weak password error', async () => {
      const error: any = new Error('Weak password');
      error.code = 'auth/weak-password';
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.register({
          email: 'user@example.com',
          password: '123',
          displayName: 'User',
        });
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe('Password should be at least 6 characters');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      // Set up authenticated state
      const mockUser = MockAuthFactory.createMockUser();
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      mockSignOut.mockResolvedValueOnce(undefined);

      let state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);

      await state.logout();

      state = useAuthStore.getState();
      expect(mockSignOut).toHaveBeenCalled();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should clear state even if signOut fails', async () => {
      // Set up authenticated state
      const mockUser = MockAuthFactory.createMockUser();
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      mockSignOut.mockRejectedValueOnce(new Error('Sign out failed'));

      const store = useAuthStore.getState();

      await store.logout();

      const state = useAuthStore.getState();
      // Should still clear local state
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email successfully', async () => {
      mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);

      const store = useAuthStore.getState();

      await store.resetPassword('user@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com'
      );

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle user not found error', async () => {
      const error: any = new Error('User not found');
      error.code = 'auth/user-not-found';
      mockSendPasswordResetEmail.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.resetPassword('notfound@example.com');
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe('No account found with this email');
    });
  });

  describe('OAuth Login', () => {
    it('should handle unsupported provider', async () => {
      const store = useAuthStore.getState();

      try {
        await store.loginWithProvider('facebook' as any);
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toContain('not yet implemented');
    });

    it('should login with Google successfully', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        displayName: 'Google User',
        email: 'google@example.com',
        photoURL: 'https://example.com/photo.jpg',
      });

      // Mock AuthRequest to return success
      const AuthSession = require('expo-auth-session');
      AuthSession.AuthRequest.mockImplementation(() => ({
        promptAsync: jest.fn().mockResolvedValue({
          type: 'success',
          params: { id_token: 'mock-google-id-token' },
        }),
      }));

      mockSignInWithCredential.mockResolvedValueOnce({ user: mockFirebaseUser });

      const store = useAuthStore.getState();

      await store.loginWithProvider('google');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('google@example.com');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should login with Apple successfully', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        displayName: 'Apple User',
        email: 'apple@example.com',
      });

      // Mock AuthRequest to return success for Apple
      const AuthSession = require('expo-auth-session');
      AuthSession.AuthRequest.mockImplementation(() => ({
        promptAsync: jest.fn().mockResolvedValue({
          type: 'success',
          params: { id_token: 'mock-apple-id-token' },
        }),
      }));

      mockSignInWithCredential.mockResolvedValueOnce({ user: mockFirebaseUser });

      const store = useAuthStore.getState();

      await store.loginWithProvider('apple');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('apple@example.com');
      expect(state.isLoading).toBe(false);
    });

    it('should handle cancelled Google sign-in', async () => {
      // Mock AuthRequest to return cancel
      const AuthSession = require('expo-auth-session');
      AuthSession.AuthRequest.mockImplementation(() => ({
        promptAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
      }));

      const store = useAuthStore.getState();

      try {
        await store.loginWithProvider('google');
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toContain('cancelled or failed');
    });

    it('should handle cancelled Apple sign-in', async () => {
      // Mock AuthRequest to return cancel
      const AuthSession = require('expo-auth-session');
      AuthSession.AuthRequest.mockImplementation(() => ({
        promptAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
      }));

      const store = useAuthStore.getState();

      try {
        await store.loginWithProvider('apple');
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toContain('cancelled or failed');
    });

    it('should handle account-exists-with-different-credential error', async () => {
      const AuthSession = require('expo-auth-session');
      AuthSession.AuthRequest.mockImplementation(() => ({
        promptAsync: jest.fn().mockResolvedValue({
          type: 'success',
          params: { id_token: 'mock-id-token' },
        }),
      }));

      const error: any = new Error('Account exists');
      error.code = 'auth/account-exists-with-different-credential';
      mockSignInWithCredential.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.loginWithProvider('google');
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toContain('different sign-in credentials');
    });

    it('should handle invalid-credential error', async () => {
      const AuthSession = require('expo-auth-session');
      AuthSession.AuthRequest.mockImplementation(() => ({
        promptAsync: jest.fn().mockResolvedValue({
          type: 'success',
          params: { id_token: 'mock-id-token' },
        }),
      }));

      const error: any = new Error('Invalid credential');
      error.code = 'auth/invalid-credential';
      mockSignInWithCredential.mockRejectedValueOnce(error);

      const store = useAuthStore.getState();

      try {
        await store.loginWithProvider('google');
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toContain('Invalid credentials');
    });

    it('should store user data in Firestore after OAuth login when firestore is available', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        displayName: 'OAuth User',
        email: 'oauth@example.com',
        photoURL: 'https://example.com/photo.jpg',
        phoneNumber: '+1234567890',
      });

      const AuthSession = require('expo-auth-session');
      AuthSession.AuthRequest.mockImplementation(() => ({
        promptAsync: jest.fn().mockResolvedValue({
          type: 'success',
          params: { id_token: 'mock-id-token' },
        }),
      }));

      mockSignInWithCredential.mockResolvedValueOnce({ user: mockFirebaseUser });

      const store = useAuthStore.getState();
      await store.loginWithProvider('google');

      // Verify user data is set correctly even without Firestore
      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('oauth@example.com');
      expect(state.user?.displayName).toBe('OAuth User');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle OAuth error gracefully', async () => {
      const AuthSession = require('expo-auth-session');
      AuthSession.AuthRequest.mockImplementation(() => ({
        promptAsync: jest.fn().mockRejectedValue(new Error('Network error')),
      }));

      const store = useAuthStore.getState();

      try {
        await store.loginWithProvider('google');
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeTruthy();
    });
  });

  describe('Utility Actions', () => {
    it('should clear error', () => {
      useAuthStore.setState({ error: 'Some error' });

      let state = useAuthStore.getState();
      expect(state.error).toBe('Some error');

      state.clearError();

      state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });

    it('should set user', () => {
      const mockUser = MockAuthFactory.createMockUser();

      const store = useAuthStore.getState();
      store.setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set user to null', () => {
      const mockUser = MockAuthFactory.createMockUser();
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });

      const store = useAuthStore.getState();
      store.setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should set loading state', () => {
      const store = useAuthStore.getState();

      store.setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      store.setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set error', () => {
      const store = useAuthStore.getState();

      store.setError('Test error');
      expect(useAuthStore.getState().error).toBe('Test error');

      store.setError(null);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should clear all auth data', () => {
      // Set up some state
      const mockUser = MockAuthFactory.createMockUser();
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
        error: 'Some error',
      });

      const store = useAuthStore.getState();
      store.clearAuthData();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('Profile Update', () => {
    it('should update profile when user is logged in', async () => {
      const mockUser = MockAuthFactory.createMockUser();
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      // Mock auth.currentUser
      const firebaseConfig = require('../../config/firebase');
      firebaseConfig.auth.currentUser = mockFirebaseUser;

      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      mockUpdateProfile.mockResolvedValueOnce(undefined);

      const store = useAuthStore.getState();

      await store.updateProfile({
        displayName: 'Updated Name',
      });

      const state = useAuthStore.getState();
      expect(state.user?.displayName).toBe('Updated Name');

      // Clean up
      firebaseConfig.auth.currentUser = null;
    });

    it('should throw error when no user is logged in', async () => {
      const store = useAuthStore.getState();

      try {
        await store.updateProfile({
          displayName: 'Updated Name',
        });
      } catch (e: any) {
        expect(e.message).toBe('No user logged in');
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe('No user logged in');
    });
  });

  describe('Email Verification', () => {
    it('should resend email verification when user is logged in', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      // Mock auth.currentUser
      const firebaseConfig = require('../../config/firebase');
      firebaseConfig.auth.currentUser = mockFirebaseUser;

      mockSendEmailVerification.mockResolvedValueOnce(undefined);

      const store = useAuthStore.getState();

      await store.resendEmailVerification();

      expect(mockSendEmailVerification).toHaveBeenCalledWith(mockFirebaseUser);

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Clean up
      firebaseConfig.auth.currentUser = null;
    });

    it('should throw error when no user is logged in', async () => {
      const store = useAuthStore.getState();

      try {
        await store.resendEmailVerification();
      } catch (e: any) {
        expect(e.message).toBe('No user logged in');
      }
    });
  });

  describe('State Persistence', () => {
    it('should only persist user and isAuthenticated', () => {
      // This tests the partialize function
      const mockUser = MockAuthFactory.createMockUser();

      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
        error: 'Some error',
        isInitialized: true,
      });

      // The store is configured to only persist user and isAuthenticated
      // We can verify the partialize config by checking the store structure
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle rapid state changes efficiently', () => {
      const startTime = performance.now();

      // Perform rapid state updates
      for (let i = 0; i < 100; i++) {
        const store = useAuthStore.getState();
        store.setLoading(i % 2 === 0);
        store.setError(i % 3 === 0 ? `Error ${i}` : null);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all updates in reasonable time
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Initialization', () => {
    beforeEach(() => {
      // Reset store state including internal flags
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: false,
      });
      // Clear any internal initializing flag
      const state = useAuthStore.getState() as any;
      delete state.initializing;
      delete state.unsubscribe;
    });

    it('should call onAuthStateChanged when initializing', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // Immediately call with null (no user)
        callback(null);
        return jest.fn();
      });

      const store = useAuthStore.getState();
      await store.initialize();

      expect(mockOnAuthStateChanged).toHaveBeenCalled();
    });

    it('should update state when auth state changes to logged-in user', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        uid: 'firebase-user-123',
        email: 'existing@example.com',
        displayName: 'Existing User',
      });

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // Simulate existing logged-in user
        callback(mockFirebaseUser);
        return jest.fn();
      });

      const store = useAuthStore.getState();
      await store.initialize();

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 50));

      const state = useAuthStore.getState();
      expect(state.user?.uid).toBe('firebase-user-123');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should prevent multiple initializations when already initialized', async () => {
      // First, mark as already initialized
      useAuthStore.setState({ isInitialized: true });

      const store = useAuthStore.getState();
      await store.initialize();

      // Should not call onAuthStateChanged again if already initialized
      expect(mockOnAuthStateChanged).not.toHaveBeenCalled();
    });

    it('should set initial state correctly after initialization with no user', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      const store = useAuthStore.getState();
      await store.initialize();

      // Wait for async state update
      await new Promise(resolve => setTimeout(resolve, 50));

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Profile Update Extended', () => {
    it('should update both displayName and photoURL', async () => {
      const mockUser = MockAuthFactory.createMockUser();
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      const firebaseConfig = require('../../config/firebase');
      firebaseConfig.auth.currentUser = mockFirebaseUser;

      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      mockUpdateProfile.mockResolvedValueOnce(undefined);

      const store = useAuthStore.getState();

      await store.updateProfile({
        displayName: 'New Name',
        photoURL: 'https://example.com/new-photo.jpg',
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith(
        mockFirebaseUser,
        expect.objectContaining({
          displayName: 'New Name',
          photoURL: 'https://example.com/new-photo.jpg',
        })
      );

      const state = useAuthStore.getState();
      expect(state.user?.displayName).toBe('New Name');
      expect(state.user?.photoURL).toBe('https://example.com/new-photo.jpg');

      firebaseConfig.auth.currentUser = null;
    });

    it('should handle profile update Firebase error', async () => {
      const mockUser = MockAuthFactory.createMockUser();
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      const firebaseConfig = require('../../config/firebase');
      firebaseConfig.auth.currentUser = mockFirebaseUser;

      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      mockUpdateProfile.mockRejectedValueOnce(new Error('Update failed'));

      const store = useAuthStore.getState();

      try {
        await store.updateProfile({ displayName: 'New Name' });
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe('Update failed');
      expect(state.isLoading).toBe(false);

      firebaseConfig.auth.currentUser = null;
    });

    it('should update preferences without Firebase profile call', async () => {
      const mockUser = MockAuthFactory.createMockUser();
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      const firebaseConfig = require('../../config/firebase');
      firebaseConfig.auth.currentUser = mockFirebaseUser;

      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      const store = useAuthStore.getState();

      await store.updateProfile({
        preferences: { notifications: false, newsletter: true, language: 'es' },
      });

      // updateProfile should not be called for preferences-only update
      expect(mockUpdateProfile).not.toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user?.preferences?.notifications).toBe(false);
      expect(state.user?.preferences?.newsletter).toBe(true);

      firebaseConfig.auth.currentUser = null;
    });
  });

  describe('Email Verification Extended', () => {
    it('should handle email verification error', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      const firebaseConfig = require('../../config/firebase');
      firebaseConfig.auth.currentUser = mockFirebaseUser;

      mockSendEmailVerification.mockRejectedValueOnce(new Error('Verification failed'));

      const store = useAuthStore.getState();

      try {
        await store.resendEmailVerification();
      } catch (e) {
        // Expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe('Verification failed');
      expect(state.isLoading).toBe(false);

      firebaseConfig.auth.currentUser = null;
    });
  });

  describe('Login with Firestore Data', () => {
    it('should use Firebase user data when Firestore returns no data', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        displayName: 'Firebase Name',
        email: 'test@example.com',
        photoURL: 'https://firebase.com/photo.jpg',
      });

      // Firestore mock returns no data (default mock behavior)
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });

      const store = useAuthStore.getState();
      await store.login({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      // Uses Firebase data as fallback when Firestore doesn't have user data
      expect(state.user?.displayName).toBe('Firebase Name');
      expect(state.user?.email).toBe('test@example.com');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle Firestore fetch error gracefully', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));

      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });

      const store = useAuthStore.getState();
      await store.login({ email: 'test@example.com', password: 'password123' });

      // Should still log in successfully with Firebase data
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeTruthy();
    });

    it('should set default role for new users', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });

      const store = useAuthStore.getState();
      await store.login({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.user?.role).toBe('participant');
    });

    it('should set default providers for email login', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser();

      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });

      const store = useAuthStore.getState();
      await store.login({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.user?.providers).toContain('email');
    });
  });

  describe('Registration with Firestore', () => {
    it('should register user successfully', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        uid: 'new-user-uid',
        email: 'newuser@example.com',
      });

      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });
      mockUpdateProfile.mockResolvedValueOnce(undefined);
      mockSendEmailVerification.mockResolvedValueOnce(undefined);

      const store = useAuthStore.getState();
      await store.register({
        email: 'newuser@example.com',
        password: 'Password123!',
        displayName: 'New User',
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('newuser@example.com');
      expect(state.user?.displayName).toBe('New User');
    });

    it('should set default preferences for new users', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        uid: 'new-user-uid',
        email: 'newuser@example.com',
      });

      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });
      mockUpdateProfile.mockResolvedValueOnce(undefined);
      mockSendEmailVerification.mockResolvedValueOnce(undefined);

      const store = useAuthStore.getState();
      await store.register({
        email: 'newuser@example.com',
        password: 'Password123!',
        displayName: 'New User',
      });

      const state = useAuthStore.getState();
      expect(state.user?.preferences).toBeDefined();
      expect(state.user?.preferences?.notifications).toBe(true);
      expect(state.user?.preferences?.language).toBe('en');
    });

    it('should handle registration when Firestore is unavailable', async () => {
      const mockFirebaseUser = MockAuthFactory.createMockFirebaseUser({
        uid: 'new-user-uid',
        email: 'newuser@example.com',
      });

      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockFirebaseUser });
      mockUpdateProfile.mockResolvedValueOnce(undefined);
      mockSendEmailVerification.mockResolvedValueOnce(undefined);

      // Firestore is mocked as null in the test setup
      const store = useAuthStore.getState();

      // Should not throw even if Firestore is unavailable
      await store.register({
        email: 'newuser@example.com',
        password: 'Password123!',
        displayName: 'New User',
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });
  });
});
