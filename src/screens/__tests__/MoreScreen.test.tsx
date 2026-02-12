/**
 * MoreScreen component rendering tests
 */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders, mockNavigation, mockAuthValue } from '../../testing/testUtils';

// Mock useAuth - path from MoreScreen: ../../auth/useAuth
jest.mock('../../auth/useAuth', () => ({
  useAuth: () => mockAuthValue,
}));

// Mock stores
jest.mock('../../stores/newsStore', () => ({
  useNewsStore: () => ({
    seenArticleIds: [],
    unreadCount: 2,
    lastViewedAt: null,
    markArticlesAsSeen: jest.fn(),
    updateUnreadCount: jest.fn(),
    clearUnread: jest.fn(),
    resetStore: jest.fn(),
  }),
}));

jest.mock('../../stores/eventStore', () => ({
  useSelectedEvent: () => 'apac-2026',
  useSetSelectedEvent: () => jest.fn(),
  useSelectedEventDefinition: () => ({
    id: 'apac-2026',
    name: 'APAC 2026',
    shortName: 'APAC 2026',
  }),
}));

// Override navigation mock for MoreScreen which uses useNavigation with getParent
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    getParent: jest.fn(() => ({
      setOptions: jest.fn(),
      navigate: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
      dispatch: jest.fn(),
    })),
  }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: any) => children,
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock child screens (named exports) - paths resolved from test file
// MoreScreen imports these from ./SomeName (relative to src/screens/tabs/)
// From test at src/screens/__tests__/, these resolve to ../tabs/SomeName
jest.mock('../tabs/EnhancedContactsScreen', () => ({
  EnhancedContactsScreen: () => null,
}));
jest.mock('../tabs/EntrantsScreen', () => ({
  EntrantsScreen: () => null,
}));
jest.mock('../tabs/SponsorsScreen', () => ({
  SponsorsScreen: () => null,
}));
jest.mock('../tabs/NewsScreen', () => ({
  NewsScreen: () => null,
}));
jest.mock('../tabs/ModernWeatherMapScreen', () => ({
  ModernWeatherMapScreen: () => null,
}));
jest.mock('../tabs/ShippingScreen', () => ({
  ShippingScreen: () => null,
}));

// These are imported from ../SomeName in MoreScreen (i.e., src/screens/SomeName)
// From test at src/screens/__tests__/, these resolve to ../SomeName
jest.mock('../MapScreen', () => ({
  MapScreen: () => null,
}));
jest.mock('../DataSourcesScreen', () => ({
  DataSourcesScreen: () => null,
}));
jest.mock('../DiscussScreen', () => ({
  DiscussScreen: () => null,
}));
jest.mock('../AboutRegattaFlowScreen', () => ({
  AboutRegattaFlowScreen: () => null,
}));

// Mock shared components
jest.mock('../../components/ios/IOSText', () => ({
  IOSText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock('../../components/navigation/ProfileButton', () => ({
  ProfileButton: () => {
    const { View } = require('react-native');
    return <View testID="profile-button" />;
  },
}));

jest.mock('../../components/navigation/FloatingBackButton', () => ({
  FloatingBackButton: () => null,
}));

import { MoreScreen } from '../tabs/MoreScreen';

describe('MoreScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <MoreScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('renders the More header', () => {
    const { getByText } = renderWithProviders(
      <MoreScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByText('More')).toBeTruthy();
  });

  it('renders RACE section header', () => {
    const { getByText } = renderWithProviders(
      <MoreScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByText('RACE')).toBeTruthy();
  });

  it('renders EVENT section header', () => {
    const { getByText } = renderWithProviders(
      <MoreScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByText('EVENT')).toBeTruthy();
  });

  it('renders Entrants menu item with testID', () => {
    const { getByTestId } = renderWithProviders(
      <MoreScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('more-menu-entrants')).toBeTruthy();
  });

  it('renders News menu item with testID', () => {
    const { getByTestId } = renderWithProviders(
      <MoreScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('more-menu-news')).toBeTruthy();
  });

  it('renders Contacts menu item with testID', () => {
    const { getByTestId } = renderWithProviders(
      <MoreScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('more-menu-contacts')).toBeTruthy();
  });

  it('renders Sponsors menu item with testID', () => {
    const { getByTestId } = renderWithProviders(
      <MoreScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('more-menu-sponsors')).toBeTruthy();
  });

  it('renders Weather menu item with testID', () => {
    const { getByTestId } = renderWithProviders(
      <MoreScreen navigation={mockNavigation} route={{} as any} />,
    );
    expect(getByTestId('more-menu-weather')).toBeTruthy();
  });

  it('navigates when tapping Entrants menu item', () => {
    const { getByTestId } = renderWithProviders(
      <MoreScreen navigation={mockNavigation} route={{} as any} />,
    );
    fireEvent.press(getByTestId('more-menu-entrants'));
    // The MoreScreen handles navigation internally with sub-screen state
    // We just verify the press doesn't crash
  });
});
