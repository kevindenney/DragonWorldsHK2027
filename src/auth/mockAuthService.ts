/**
 * Mock Authentication Service
 * Used when Firebase is not configured or for testing purposes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterCredentials, UserStatus } from './authTypes';

const MOCK_USERS_KEY = 'mock_users';
const CURRENT_USER_KEY = 'current_user';

interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  password: string; // Only stored for mock purposes
  emailVerified: boolean;
  createdAt: Date;
}

export class MockAuthService {
  private users: MockUser[] = [];
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  async initialize() {
    console.log('🔧 [MockAuth] Initializing mock authentication service...');

    // Load existing users
    try {
      const storedUsers = await AsyncStorage.getItem(MOCK_USERS_KEY);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      }
    } catch (error) {
      console.warn('Failed to load mock users:', error);
    }

    // Check for existing session
    try {
      const currentUserData = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (currentUserData) {
        this.currentUser = JSON.parse(currentUserData);
        this.notifyListeners();
      }
    } catch (error) {
      console.warn('Failed to load current user:', error);
    }

    console.log('✅ [MockAuth] Mock authentication initialized');
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    console.log('🔧 [MockAuth] Registering user:', credentials.email);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    if (this.users.find(u => u.email === credentials.email)) {
      throw { code: 'auth/email-already-in-use', message: 'Email already in use' };
    }

    // Validate password
    if (credentials.password.length < 8) {
      throw { code: 'auth/weak-password', message: 'Password should be at least 8 characters' };
    }

    // Create mock user
    const mockUser: MockUser = {
      uid: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: credentials.email,
      displayName: credentials.displayName || '',
      password: credentials.password,
      emailVerified: true, // Auto-verify for mock
      createdAt: new Date(),
    };

    // Save user
    this.users.push(mockUser);
    await this.saveUsers();

    // Create public user object
    const user: User = {
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      emailVerified: mockUser.emailVerified,
      role: 'participant',
      status: UserStatus.ACTIVE,
      providers: ['email'],
      createdAt: mockUser.createdAt,
      updatedAt: new Date(),
      preferences: {
        notifications: true,
        newsletter: false,
        language: 'en',
      },
    };

    // Sign in the user
    this.currentUser = user;
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.notifyListeners();

    console.log('✅ [MockAuth] User registered successfully:', user.email);
    return user;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    console.log('🔧 [MockAuth] Logging in user:', credentials.email);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Find user
    const mockUser = this.users.find(u => u.email === credentials.email);
    if (!mockUser) {
      throw { code: 'auth/user-not-found', message: 'No account found with this email' };
    }

    // Check password
    if (mockUser.password !== credentials.password) {
      throw { code: 'auth/wrong-password', message: 'Incorrect password' };
    }

    // Create public user object
    const user: User = {
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      emailVerified: mockUser.emailVerified,
      role: 'participant',
      status: UserStatus.ACTIVE,
      providers: ['email'],
      createdAt: mockUser.createdAt,
      updatedAt: new Date(),
      preferences: {
        notifications: true,
        newsletter: false,
        language: 'en',
      },
    };

    // Sign in the user
    this.currentUser = user;
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.notifyListeners();

    console.log('✅ [MockAuth] User logged in successfully:', user.email);
    return user;
  }

  async logout(): Promise<void> {
    console.log('🔧 [MockAuth] Logging out user');

    this.currentUser = null;
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    this.notifyListeners();

    console.log('✅ [MockAuth] User logged out');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);

    // Call immediately with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private async saveUsers(): Promise<void> {
    try {
      await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(this.users));
    } catch (error) {
      console.warn('Failed to save mock users:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.warn('Error in auth state listener:', error);
      }
    });
  }

  // Additional mock methods for testing
  async resetPassword(email: string): Promise<void> {
    console.log('🔧 [MockAuth] Password reset requested for:', email);
    // Simulate sending reset email
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('✅ [MockAuth] Password reset email sent (mock)');
  }

  async clearAllData(): Promise<void> {
    console.log('🔧 [MockAuth] Clearing all mock data');
    this.users = [];
    this.currentUser = null;
    await AsyncStorage.multiRemove([MOCK_USERS_KEY, CURRENT_USER_KEY]);
    this.notifyListeners();
    console.log('✅ [MockAuth] All mock data cleared');
  }
}

// Export singleton instance
export const mockAuthService = new MockAuthService();