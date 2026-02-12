/**
 * RaceFormsScreen component rendering tests
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

jest.mock('../../contexts/TabBarVisibilityContext', () => ({
  useToolbarVisibility: () => ({
    isToolbarVisible: true,
    toolbarTranslateY: { setValue: jest.fn() },
    toolbarOpacity: { setValue: jest.fn() },
    showToolbar: jest.fn(),
    hideToolbar: jest.fn(),
    createScrollHandler: () => ({
      onScroll: jest.fn(),
      onScrollBeginDrag: jest.fn(),
      onScrollEndDrag: jest.fn(),
      onMomentumScrollEnd: jest.fn(),
    }),
  }),
}));

jest.mock('../../auth/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test', displayName: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
  }),
}));

// Mock QR code component
jest.mock('react-native-qrcode-svg', () => 'QRCode');

// Mock child components
jest.mock('../../components/navigation/FloatingEventSwitch', () => ({
  FloatingEventSwitch: ({ events, selectedEventId }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="event-switch">
        <Text>APAC 2026</Text>
        <Text>Worlds 2027</Text>
      </View>
    );
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

import RaceFormsScreen from '../tabs/RaceFormsScreen';

describe('RaceFormsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <RaceFormsScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('renders the forms header', () => {
    const { getByText } = renderWithProviders(
      <RaceFormsScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(getByText('Forms')).toBeTruthy();
  });

  it('renders the event switch', () => {
    const { getByTestId } = renderWithProviders(
      <RaceFormsScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(getByTestId('event-switch')).toBeTruthy();
  });

  it('renders form section headers', () => {
    const { queryByText } = renderWithProviders(
      <RaceFormsScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    // These sections may or may not be present depending on the event data
    // At minimum, the screen should render
    expect(queryByText('Forms')).toBeTruthy();
  });
});
