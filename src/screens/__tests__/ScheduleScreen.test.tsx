/**
 * ScheduleScreen component rendering tests
 */
import React from 'react';
import { renderWithProviders, mockNavigation, mockRoute } from '../../testing/testUtils';

// Mock Zustand stores
jest.mock('../../stores/eventStore', () => ({
  useSelectedEvent: () => 'apac-2026',
  useSetSelectedEvent: () => jest.fn(),
  useSelectedEventDefinition: () => ({
    id: 'apac-2026',
    name: 'APAC 2026',
    shortName: 'APAC 2026',
  }),
  useEventStoreHydrated: () => true,
  useEventSelection: () => ({
    selectedEventId: 'apac-2026',
    setSelectedEvent: jest.fn(),
    eventDefinition: { id: 'apac-2026', name: 'APAC 2026', shortName: 'APAC 2026' },
    isHydrated: true,
    participatingEventIds: ['apac-2026'],
    toggleParticipation: jest.fn(),
  }),
}));

// Mock toolbar visibility
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
  useTabBarVisibility: () => ({
    isToolbarVisible: true,
    showToolbar: jest.fn(),
    hideToolbar: jest.fn(),
  }),
  TabBarVisibilityProvider: ({ children }: any) => children,
}));

// Mock useAuth
jest.mock('../../auth/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test', displayName: 'Test User', email: 'test@test.com' },
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
  }),
}));

// Mock expo modules
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

// Mock child components that have complex dependencies
jest.mock('../../components/navigation/FloatingEventSwitch', () => ({
  FloatingEventSwitch: ({ events, selectedEventId, onEventChange }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="event-switch">
        {events?.map?.((e: any) => (
          <TouchableOpacity
            key={e.id}
            testID={`event-${e.id}`}
            onPress={() => onEventChange?.(e.id)}
          >
            <Text>{e.shortName || e.name}</Text>
          </TouchableOpacity>
        ))}
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

jest.mock('../../components/schedule/HorizontalDatePicker', () => ({
  HorizontalDatePicker: () => {
    const { View } = require('react-native');
    return <View testID="date-picker" />;
  },
}));

jest.mock('../../components/schedule/ScheduleDayContent', () => ({
  ScheduleDayContent: () => {
    const { View, Text } = require('react-native');
    return (
      <View testID="schedule-content">
        <Text>Schedule content</Text>
      </View>
    );
  },
}));

jest.mock('../../components/schedule/EventInfoSheet', () => ({
  EventInfoSheet: () => null,
}));

jest.mock('../../components/ios/IOSText', () => ({
  IOSText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

import { ScheduleScreen } from '../tabs/ScheduleScreen';

describe('ScheduleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <ScheduleScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('renders the schedule header text', () => {
    const { getByText } = renderWithProviders(
      <ScheduleScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(getByText('Schedule')).toBeTruthy();
  });

  it('renders the event switch component', () => {
    const { getByTestId } = renderWithProviders(
      <ScheduleScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(getByTestId('event-switch')).toBeTruthy();
  });

  it('renders the date picker', () => {
    const { getByTestId } = renderWithProviders(
      <ScheduleScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(getByTestId('date-picker')).toBeTruthy();
  });

  it('renders the schedule content area', () => {
    const { getByTestId } = renderWithProviders(
      <ScheduleScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(getByTestId('schedule-content')).toBeTruthy();
  });

  it('renders the profile button', () => {
    const { getByTestId } = renderWithProviders(
      <ScheduleScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(getByTestId('profile-button')).toBeTruthy();
  });
});
