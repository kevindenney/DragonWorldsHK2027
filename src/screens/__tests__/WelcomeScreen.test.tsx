/**
 * WelcomeScreen component rendering tests
 */
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, mockAuthValue } from '../../testing/testUtils';

// Mock useAuth hook
jest.mock('../../auth/useAuth', () => ({
  useAuth: () => mockAuthValue,
}));

// expo-linear-gradient and reanimatedWrapper are mocked globally in setupTests.ts

// Mock the SocialLoginButton component (named export)
jest.mock('../../components/auth/SocialLoginButton', () => ({
  SocialLoginButton: ({ title, onPress, testID, ...props }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

// Mock AnimatedSigningText (named export)
jest.mock('../../components/auth/AnimatedSigningText', () => ({
  AnimatedSigningText: () => null,
}));

// Import after mocks
import WelcomeScreen from '../onboarding/WelcomeScreen';

describe('WelcomeScreen', () => {
  const mockOnContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <WelcomeScreen onContinue={mockOnContinue} />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('renders the welcome screen container with testID', () => {
    const { getByTestId } = renderWithProviders(
      <WelcomeScreen onContinue={mockOnContinue} />,
    );
    expect(getByTestId('welcome-screen')).toBeTruthy();
  });

  it('renders the email button with testID', () => {
    const { getByTestId } = renderWithProviders(
      <WelcomeScreen onContinue={mockOnContinue} />,
    );
    expect(getByTestId('welcome-btn-email')).toBeTruthy();
  });

  it('renders "Continue with Email" text', () => {
    const { getByText } = renderWithProviders(
      <WelcomeScreen onContinue={mockOnContinue} />,
    );
    expect(getByText('Continue with Email')).toBeTruthy();
  });

  it('email button is pressable without crashing', () => {
    const { getByTestId } = renderWithProviders(
      <WelcomeScreen onContinue={mockOnContinue} />,
    );
    fireEvent.press(getByTestId('welcome-btn-email'));
    // The email button triggers an async loading state before calling onContinue
    expect(getByTestId('welcome-btn-email')).toBeTruthy();
  });

  it('renders Google sign-in button with testID', () => {
    const { getByTestId } = renderWithProviders(
      <WelcomeScreen onContinue={mockOnContinue} />,
    );
    expect(getByTestId('welcome-btn-google')).toBeTruthy();
  });

  it('renders Apple sign-in button with testID', () => {
    const { getByTestId } = renderWithProviders(
      <WelcomeScreen onContinue={mockOnContinue} />,
    );
    expect(getByTestId('welcome-btn-apple')).toBeTruthy();
  });
});
