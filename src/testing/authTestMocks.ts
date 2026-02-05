/**
 * Authentication Test Mocks and Utilities
 *
 * Provides comprehensive mocks for Firebase Auth, Firestore, and related services
 * for testing the authentication system.
 */

// Use Jest globals with flexible typing for test mocks
const jest = (globalThis as any).jest || {
  fn: () => {
    const mockFn = function(...args: any[]) { return mockFn._mockImplementation?.(...args); };
    mockFn._mockImplementation = null as any;
    mockFn.mockReturnValue = (val: any) => { mockFn._mockImplementation = () => val; return mockFn; };
    mockFn.mockResolvedValue = (val: any) => { mockFn._mockImplementation = () => Promise.resolve(val); return mockFn; };
    mockFn.mockImplementation = (impl: any) => { mockFn._mockImplementation = impl; return mockFn; };
    mockFn.mockReset = () => { mockFn._mockImplementation = null; };
    return mockFn;
  }
};

// Mock user types matching the actual implementation
export interface MockUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  role: string;
  providers: string[];
  createdAt: Date;
  updatedAt: Date;
  preferences?: any;
}

export interface MockFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  getIdToken: jest.Mock;
  reload: jest.Mock;
}

export interface MockUserCredential {
  user: MockFirebaseUser;
  providerId: string | null;
  operationType: 'signIn' | 'link' | 'reauthenticate';
}

/**
 * Factory for creating mock users
 */
export class MockAuthFactory {
  /**
   * Create a mock Firebase user
   */
  static createMockFirebaseUser(overrides: Partial<MockFirebaseUser> = {}): MockFirebaseUser {
    return {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      phoneNumber: null,
      emailVerified: false,
      getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
      reload: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  /**
   * Create a mock app user (matching User type)
   */
  static createMockUser(overrides: Partial<MockUser> = {}): MockUser {
    return {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: undefined,
      phoneNumber: undefined,
      emailVerified: false,
      role: 'participant',
      providers: ['email'],
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        notifications: true,
        newsletter: false,
        language: 'en',
      },
      ...overrides,
    };
  }

  /**
   * Create a mock user credential (returned by Firebase auth methods)
   */
  static createMockUserCredential(
    userOverrides: Partial<MockFirebaseUser> = {},
    operationType: 'signIn' | 'link' | 'reauthenticate' = 'signIn'
  ): MockUserCredential {
    return {
      user: this.createMockFirebaseUser(userOverrides),
      providerId: 'password',
      operationType,
    };
  }

  /**
   * Create login credentials
   */
  static createLoginCredentials(overrides = {}) {
    return {
      email: 'test@example.com',
      password: 'TestPassword123!',
      ...overrides,
    };
  }

  /**
   * Create registration credentials
   */
  static createRegisterCredentials(overrides = {}) {
    return {
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      displayName: 'New User',
      ...overrides,
    };
  }

  /**
   * Create an admin user
   */
  static createAdminUser(overrides: Partial<MockUser> = {}): MockUser {
    return this.createMockUser({
      role: 'admin',
      emailVerified: true,
      ...overrides,
    });
  }

  /**
   * Create a verified user
   */
  static createVerifiedUser(overrides: Partial<MockUser> = {}): MockUser {
    return this.createMockUser({
      emailVerified: true,
      ...overrides,
    });
  }

  /**
   * Create a user with OAuth provider
   */
  static createOAuthUser(
    provider: 'google' | 'apple',
    overrides: Partial<MockUser> = {}
  ): MockUser {
    return this.createMockUser({
      providers: [provider],
      emailVerified: true,
      photoURL: provider === 'google' ? 'https://lh3.googleusercontent.com/photo' : undefined,
      ...overrides,
    });
  }
}

/**
 * Firebase Auth mock implementation
 */
export const createFirebaseAuthMock = () => {
  let currentUser: MockFirebaseUser | null = null;
  const authStateListeners: Array<(user: MockFirebaseUser | null) => void> = [];

  const triggerAuthStateChange = (user: MockFirebaseUser | null) => {
    currentUser = user;
    authStateListeners.forEach(listener => listener(user));
  };

  return {
    // Current user getter
    get currentUser() {
      return currentUser;
    },

    // Auth state change listener
    onAuthStateChanged: jest.fn((callback: (user: MockFirebaseUser | null) => void) => {
      authStateListeners.push(callback);
      // Immediately call with current user
      callback(currentUser);
      // Return unsubscribe function
      return jest.fn(() => {
        const index = authStateListeners.indexOf(callback);
        if (index > -1) authStateListeners.splice(index, 1);
      });
    }),

    // Sign in methods
    signInWithEmailAndPassword: jest.fn().mockImplementation(
      async (auth: any, email: string, password: string) => {
        if (password === 'wrong-password') {
          const error: any = new Error('Wrong password');
          error.code = 'auth/wrong-password';
          throw error;
        }
        if (email === 'notfound@example.com') {
          const error: any = new Error('User not found');
          error.code = 'auth/user-not-found';
          throw error;
        }
        if (email === 'invalid-email') {
          const error: any = new Error('Invalid email');
          error.code = 'auth/invalid-email';
          throw error;
        }
        const credential = MockAuthFactory.createMockUserCredential({ email });
        triggerAuthStateChange(credential.user);
        return credential;
      }
    ),

    // Registration
    createUserWithEmailAndPassword: jest.fn().mockImplementation(
      async (auth: any, email: string, password: string) => {
        if (email === 'existing@example.com') {
          const error: any = new Error('Email already in use');
          error.code = 'auth/email-already-in-use';
          throw error;
        }
        if (password.length < 6) {
          const error: any = new Error('Weak password');
          error.code = 'auth/weak-password';
          throw error;
        }
        const credential = MockAuthFactory.createMockUserCredential({
          email,
          emailVerified: false
        });
        triggerAuthStateChange(credential.user);
        return credential;
      }
    ),

    // Sign out
    signOut: jest.fn().mockImplementation(async () => {
      triggerAuthStateChange(null);
    }),

    // Password reset
    sendPasswordResetEmail: jest.fn().mockImplementation(
      async (auth: any, email: string) => {
        if (email === 'notfound@example.com') {
          const error: any = new Error('User not found');
          error.code = 'auth/user-not-found';
          throw error;
        }
        return undefined;
      }
    ),

    // Email verification
    sendEmailVerification: jest.fn().mockResolvedValue(undefined),

    // Update profile
    updateProfile: jest.fn().mockImplementation(
      async (user: MockFirebaseUser, profile: { displayName?: string; photoURL?: string }) => {
        if (profile.displayName) user.displayName = profile.displayName;
        if (profile.photoURL) user.photoURL = profile.photoURL;
      }
    ),

    // OAuth providers
    GoogleAuthProvider: {
      credential: jest.fn().mockReturnValue({ providerId: 'google.com' }),
    },
    OAuthProvider: jest.fn().mockImplementation(() => ({
      credential: jest.fn().mockReturnValue({ providerId: 'apple.com' }),
    })),

    // Sign in with credential (OAuth)
    signInWithCredential: jest.fn().mockImplementation(async (auth: any, credential: any) => {
      const provider = credential.providerId === 'google.com' ? 'google' : 'apple';
      const mockUser = MockAuthFactory.createMockFirebaseUser({
        email: `oauth-${provider}@example.com`,
        displayName: `OAuth ${provider} User`,
        emailVerified: true,
      });
      const userCredential = {
        user: mockUser,
        providerId: credential.providerId,
        operationType: 'signIn' as const,
      };
      triggerAuthStateChange(mockUser);
      return userCredential;
    }),

    // Helper to set current user (for testing)
    _setCurrentUser: (user: MockFirebaseUser | null) => {
      triggerAuthStateChange(user);
    },

    // Helper to get listeners count (for testing)
    _getListenersCount: () => authStateListeners.length,

    // Helper to reset mock
    _reset: () => {
      currentUser = null;
      authStateListeners.length = 0;
    },
  };
};

/**
 * Firestore mock implementation
 */
export const createFirestoreMock = () => {
  const documents: Map<string, any> = new Map();

  return {
    getDoc: jest.fn().mockImplementation(async (docRef: any) => {
      const data = documents.get(docRef.path);
      return {
        exists: () => !!data,
        data: () => data,
        id: docRef.id,
      };
    }),

    setDoc: jest.fn().mockImplementation(async (docRef: any, data: any, options?: any) => {
      if (options?.merge) {
        const existing = documents.get(docRef.path) || {};
        documents.set(docRef.path, { ...existing, ...data });
      } else {
        documents.set(docRef.path, data);
      }
    }),

    deleteDoc: jest.fn().mockImplementation(async (docRef: any) => {
      documents.delete(docRef.path);
    }),

    // Helper to set document data (for testing)
    _setDocument: (path: string, data: any) => {
      documents.set(path, data);
    },

    // Helper to get document data (for testing)
    _getDocument: (path: string) => {
      return documents.get(path);
    },

    // Helper to clear all documents (for testing)
    _clear: () => {
      documents.clear();
    },
  };
};

/**
 * AsyncStorage mock implementation with spies
 */
export const createAsyncStorageMock = () => {
  const storage: Map<string, string> = new Map();

  return {
    getItem: jest.fn().mockImplementation(async (key: string) => {
      return storage.get(key) || null;
    }),

    setItem: jest.fn().mockImplementation(async (key: string, value: string) => {
      storage.set(key, value);
    }),

    removeItem: jest.fn().mockImplementation(async (key: string) => {
      storage.delete(key);
    }),

    clear: jest.fn().mockImplementation(async () => {
      storage.clear();
    }),

    getAllKeys: jest.fn().mockImplementation(async () => {
      return Array.from(storage.keys());
    }),

    multiGet: jest.fn().mockImplementation(async (keys: string[]) => {
      return keys.map(key => [key, storage.get(key) || null]);
    }),

    multiSet: jest.fn().mockImplementation(async (keyValuePairs: [string, string][]) => {
      keyValuePairs.forEach(([key, value]) => storage.set(key, value));
    }),

    multiRemove: jest.fn().mockImplementation(async (keys: string[]) => {
      keys.forEach(key => storage.delete(key));
    }),

    // Helper to get storage state (for testing)
    _getStorage: () => Object.fromEntries(storage),

    // Helper to set storage state (for testing)
    _setStorage: (data: Record<string, string>) => {
      storage.clear();
      Object.entries(data).forEach(([key, value]) => storage.set(key, value));
    },

    // Helper to clear storage (for testing)
    _clear: () => {
      storage.clear();
    },
  };
};

/**
 * Firebase error factory
 */
export class FirebaseErrorFactory {
  static createAuthError(code: string, message?: string): Error {
    const error: any = new Error(message || `Firebase error: ${code}`);
    error.code = code;
    return error;
  }

  static userNotFound() {
    return this.createAuthError('auth/user-not-found', 'No user found with this email');
  }

  static wrongPassword() {
    return this.createAuthError('auth/wrong-password', 'Incorrect password');
  }

  static emailAlreadyInUse() {
    return this.createAuthError('auth/email-already-in-use', 'Email already in use');
  }

  static weakPassword() {
    return this.createAuthError('auth/weak-password', 'Password is too weak');
  }

  static invalidEmail() {
    return this.createAuthError('auth/invalid-email', 'Invalid email address');
  }

  static tooManyRequests() {
    return this.createAuthError('auth/too-many-requests', 'Too many requests');
  }

  static networkError() {
    return this.createAuthError('auth/network-request-failed', 'Network error');
  }

  static accountExistsWithDifferentCredential() {
    return this.createAuthError(
      'auth/account-exists-with-different-credential',
      'Account exists with different credential'
    );
  }
}

/**
 * Auth test utilities
 */
export class AuthTestUtils {
  /**
   * Wait for auth state to settle
   */
  static async waitForAuthState(
    getState: () => { isLoading: boolean },
    timeout = 1000
  ): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const check = () => {
        if (!getState().isLoading) {
          resolve();
        } else if (Date.now() - startTime >= timeout) {
          reject(new Error('Auth state timeout'));
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  /**
   * Create a store state snapshot
   */
  static createSnapshot<T>(store: { getState: () => T }): T {
    return JSON.parse(JSON.stringify(store.getState()));
  }

  /**
   * Assert auth state matches expected values
   */
  static assertAuthState(
    actual: { user: any; isAuthenticated: boolean; isLoading: boolean; error: string | null },
    expected: Partial<{ user: any; isAuthenticated: boolean; isLoading: boolean; error: string | null }>
  ) {
    if (expected.user !== undefined) {
      if (expected.user === null) {
        expect(actual.user).toBeNull();
      } else {
        expect(actual.user).toMatchObject(expected.user);
      }
    }
    if (expected.isAuthenticated !== undefined) {
      expect(actual.isAuthenticated).toBe(expected.isAuthenticated);
    }
    if (expected.isLoading !== undefined) {
      expect(actual.isLoading).toBe(expected.isLoading);
    }
    if (expected.error !== undefined) {
      expect(actual.error).toBe(expected.error);
    }
  }
}

export default {
  MockAuthFactory,
  createFirebaseAuthMock,
  createFirestoreMock,
  createAsyncStorageMock,
  FirebaseErrorFactory,
  AuthTestUtils,
};
