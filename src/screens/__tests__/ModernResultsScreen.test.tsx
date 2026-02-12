/**
 * ModernResultsScreen component rendering tests
 */
import React from 'react';
import { renderWithProviders, mockNavigation, mockRoute } from '../../testing/testUtils';

// Mock stores
jest.mock('../../stores/eventStore', () => ({
  useSelectedEvent: () => 'apac-2026',
  useSetSelectedEvent: () => jest.fn(),
  useSelectedEventDefinition: () => ({
    id: 'apac-2026',
    name: 'APAC 2026',
    shortName: 'APAC 2026',
  }),
  useEventStoreHydrated: () => true,
}));

jest.mock('../../auth/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test', displayName: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
  }),
}));

// Mock results service
jest.mock('../../services/resultsService', () => ({
  resultsService: {
    getChampionship: jest.fn(() => Promise.resolve(null)),
    getChampionships: jest.fn(() => Promise.resolve([])),
    getForceMockData: jest.fn(() => false),
    setForceMockData: jest.fn(),
  },
}));

// Mock child components
jest.mock('../../components/navigation/FloatingEventSwitch', () => ({
  FloatingEventSwitch: () => {
    const { View, Text } = require('react-native');
    return <View testID="event-switch"><Text>APAC 2026</Text></View>;
  },
}));

jest.mock('../../components/navigation/ProfileButton', () => ({
  ProfileButton: () => {
    const { View } = require('react-native');
    return <View testID="profile-button" />;
  },
}));

jest.mock('../../components/ios/IOSText', () => ({
  IOSText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

import { ModernResultsScreen } from '../tabs/ModernResultsScreen';

describe('ModernResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <ModernResultsScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('renders the results header', () => {
    const { getByText } = renderWithProviders(
      <ModernResultsScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(getByText('Results')).toBeTruthy();
  });

  it('renders the event switch', () => {
    const { getByTestId } = renderWithProviders(
      <ModernResultsScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(getByTestId('event-switch')).toBeTruthy();
  });

  it('renders the profile button', () => {
    const { getByTestId } = renderWithProviders(
      <ModernResultsScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(getByTestId('profile-button')).toBeTruthy();
  });
});
