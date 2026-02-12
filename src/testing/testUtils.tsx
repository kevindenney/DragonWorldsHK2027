/**
 * Test utilities for rendering components with required providers and mocks.
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

// Default mock user for authenticated tests
export const mockUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  phoneNumber: null,
  role: 'participant' as const,
  status: 'active' as const,
  providers: ['password'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock auth return value
export const mockAuthValue = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  isInitialized: true,
  hasRole: jest.fn(() => false),
  hasAnyRole: jest.fn(() => false),
  isAdmin: jest.fn(() => false),
  isOrganizer: jest.fn(() => false),
  isParticipant: jest.fn(() => true),
  isEmailVerified: jest.fn(() => true),
  isProfileComplete: jest.fn(() => true),
  getDisplayName: jest.fn(() => 'Test User'),
  getUserInitials: jest.fn(() => 'TU'),
  login: jest.fn(),
  register: jest.fn(),
  loginWithProvider: jest.fn(),
  logout: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
  resendEmailVerification: jest.fn(),
  clearError: jest.fn(),
};

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Safe area insets mock frame
const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, right: 0, bottom: 34, left: 0 },
};

interface TestProviderOptions {
  withNavigation?: boolean;
}

/**
 * Renders a component wrapped with all necessary providers.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions & TestProviderOptions,
) {
  const { withNavigation = false, ...renderOptions } = options || {};
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    const inner = (
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider initialMetrics={safeAreaMetrics}>
          {children}
        </SafeAreaProvider>
      </QueryClientProvider>
    );

    if (withNavigation) {
      return <NavigationContainer>{inner}</NavigationContainer>;
    }
    return inner;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Mock navigation prop
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(() => ({
    setOptions: jest.fn(),
    navigate: jest.fn(),
    dispatch: jest.fn(),
  })),
  getState: jest.fn(() => ({
    routes: [],
    index: 0,
    key: 'test',
    routeNames: [],
    type: 'stack',
    stale: false,
  })),
  getId: jest.fn(),
};

// Mock route prop
export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
};
