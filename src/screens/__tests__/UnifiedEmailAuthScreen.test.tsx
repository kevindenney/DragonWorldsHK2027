/**
 * UnifiedEmailAuthScreen component rendering tests
 */
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockAuthValue, mockNavigation } from '../../testing/testUtils';

// Mock useAuth hook
const mockUseAuth = { ...mockAuthValue };
jest.mock('../../auth/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock authService
jest.mock('../../auth/firebase/authService', () => ({
  authService: {
    checkEmailExists: jest.fn(() => Promise.resolve(false)),
    signIn: jest.fn(),
    signUp: jest.fn(),
  },
}));

// expo-linear-gradient and reanimatedWrapper are mocked globally in setupTests.ts

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock keyboard aware scroll view
jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: ({ children, ...props }: any) => {
    const { ScrollView } = require('react-native');
    return <ScrollView {...props}>{children}</ScrollView>;
  },
}));

// Mock SimpleAuthInput (named export)
jest.mock('../../components/auth/SimpleAuthInput', () => ({
  SimpleAuthInput: ({ testID, placeholder, value, onChangeText, ...props }: any) => {
    const { TextInput } = require('react-native');
    return (
      <TextInput
        testID={testID}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    );
  },
}));

// Mock SimpleAuthButton (named export)
jest.mock('../../components/auth/SimpleAuthButton', () => ({
  SimpleAuthButton: ({ testID, title, onPress, ...props }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID={testID} onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

import UnifiedEmailAuthScreen from '../auth/UnifiedEmailAuthScreen';

describe('UnifiedEmailAuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <UnifiedEmailAuthScreen navigation={mockNavigation} />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('renders email input field with testID', () => {
    const { getByTestId } = renderWithProviders(
      <UnifiedEmailAuthScreen navigation={mockNavigation} />,
    );
    expect(getByTestId('auth-email')).toBeTruthy();
  });

  it('renders continue button with testID', () => {
    const { getByTestId } = renderWithProviders(
      <UnifiedEmailAuthScreen navigation={mockNavigation} />,
    );
    expect(getByTestId('auth-continue')).toBeTruthy();
  });

  it('renders back button with testID', () => {
    const { getByTestId } = renderWithProviders(
      <UnifiedEmailAuthScreen navigation={mockNavigation} />,
    );
    expect(getByTestId('auth-back')).toBeTruthy();
  });

  it('accepts email input', () => {
    const { getByTestId } = renderWithProviders(
      <UnifiedEmailAuthScreen navigation={mockNavigation} />,
    );
    const emailInput = getByTestId('auth-email');
    fireEvent.changeText(emailInput, 'user@test.com');
    expect(emailInput.props.value).toBe('user@test.com');
  });

  it('shows email step initially', () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <UnifiedEmailAuthScreen navigation={mockNavigation} />,
    );
    // Email input should be visible
    expect(getByTestId('auth-email')).toBeTruthy();
    // Password input should not yet be visible
    expect(queryByTestId('auth-password')).toBeNull();
  });
});
