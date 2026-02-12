/**
 * NoticesScreen component rendering tests
 */
import React from 'react';
import { act } from '@testing-library/react-native';
import { renderWithProviders, mockNavigation, mockRoute, mockAuthValue } from '../../testing/testUtils';

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

jest.mock('../../stores/noticesStore', () => ({
  useNoticesStore: () => ({
    preferences: { showRead: true },
    seenNoticeIdsByEvent: {},
    unreadCount: 0,
    lastViewedAt: null,
    markNoticesAsSeen: jest.fn(),
    updateUnreadCount: jest.fn(),
    clearUnread: jest.fn(),
    resetStore: jest.fn(),
    resetPreferences: jest.fn(),
  }),
  useNoticesPreferences: () => ({ showRead: true }),
  useNoticesUnreadCount: () => 0,
  useSeenNoticeIdsByEvent: () => ({}),
  useNoticesStoreHydrated: () => true,
}));

// useToastStore uses selector pattern: useToastStore((state) => state.showToast)
const mockShowToast = jest.fn();
jest.mock('../../stores/toastStore', () => ({
  useToastStore: (selector?: any) => {
    const store = {
      message: null,
      variant: 'info',
      visible: false,
      duration: 3000,
      showToast: mockShowToast,
      hideToast: jest.fn(),
    };
    if (typeof selector === 'function') return selector(store);
    return store;
  },
}));

jest.mock('../../stores/userStore', () => ({
  useUserStore: () => ({
    user: { uid: 'test' },
  }),
}));

jest.mock('../../contexts/TabBarVisibilityContext', () => ({
  useToolbarVisibility: () => ({
    isToolbarVisible: true,
    toolbarTranslateY: { setValue: jest.fn(), interpolate: jest.fn(() => 0) },
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

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthValue,
}));

// Mock constants
jest.mock('../../constants/events', () => ({
  EVENTS: {
    APAC_2026: { id: 'apac-2026', name: 'APAC 2026', shortName: 'APAC 2026' },
    WORLDS_2027: { id: 'dragon-worlds-2027', name: 'Worlds 2027', shortName: 'Worlds 2027' },
  },
}));

// Mock NoticeBoardService - must have getEvent that resolves quickly
const mockEventData = {
  id: 'apac-2026',
  name: 'APAC 2026',
  notifications: [],
  documents: [],
};

jest.mock('../../services/noticeBoardService', () => {
  const MockService = jest.fn().mockImplementation(() => ({
    getEvent: jest.fn(() => Promise.resolve(mockEventData)),
    getNotices: jest.fn(() => Promise.resolve([])),
    getNoticeById: jest.fn(),
    fetchNotices: jest.fn(() => Promise.resolve([])),
  }));
  MockService.getNotices = jest.fn(() => Promise.resolve([]));
  MockService.getNoticeById = jest.fn();
  return {
    __esModule: true,
    default: MockService,
    NoticeBoardService: MockService,
  };
});

jest.mock('../../utils/haptics', () => ({
  haptics: {
    impact: jest.fn(),
    notification: jest.fn(),
    selection: jest.fn(),
    errorAction: jest.fn(),
    successAction: jest.fn(),
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
  },
}));

jest.mock('../../services/offlineManager', () => ({
  offlineManager: {
    getCachedNotices: jest.fn(() => null),
    getCachedData: jest.fn(() => null),
    cacheData: jest.fn(() => Promise.resolve()),
    cacheNotices: jest.fn(),
    isOffline: jest.fn(() => false),
    onStatusChange: jest.fn(() => jest.fn()),
  },
}));

// Mock types
jest.mock('../../types/noticeBoard', () => ({
  RegattaCategory: {},
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

// Mock the ios barrel import (IOSNavigationBar, IOSText, IOSSection)
jest.mock('../../components/ios', () => ({
  IOSNavigationBar: ({ children }: any) => {
    const { View } = require('react-native');
    return <View testID="ios-nav-bar">{children}</View>;
  },
  IOSText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
  IOSSection: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Also mock the individual IOSText path (imported in some components)
jest.mock('../../components/ios/IOSText', () => ({
  IOSText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock('../../components/shared/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => children,
}));

jest.mock('../../components/shared/LoadingSpinner', () => ({
  LoadingSpinner: () => null,
}));

jest.mock('../../components/shared/SimpleError', () => ({
  SimpleError: () => null,
}));

jest.mock('../../components/shared/OfflineError', () => ({
  OfflineError: () => null,
}));

jest.mock('../../components/shared/Toast', () => ({
  Toast: () => null,
}));

jest.mock('../../components/notices/NoticeCard', () => ({
  NoticeCard: ({ notice }: any) => {
    const { View, Text } = require('react-native');
    return <View testID={`notice-${notice?.id}`}><Text>{notice?.title}</Text></View>;
  },
}));

jest.mock('../../components/notices/NoticeFilters', () => ({
  NoticeFilters: () => null,
}));

jest.mock('../../components/notices/CategoryFilterChips', () => ({
  CategoryFilterChips: () => {
    const { View } = require('react-native');
    return <View testID="category-filters" />;
  },
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  Bell: 'Bell',
  WifiOff: 'WifiOff',
  ChevronLeft: 'ChevronLeft',
  Info: 'Info',
  ExternalLink: 'ExternalLink',
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

import { NoticesScreen } from '../tabs/NoticesScreen';

describe('NoticesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(
      <NoticesScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('renders the notices header after loading', async () => {
    const { getByText } = renderWithProviders(
      <NoticesScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    // Let the getEvent promise resolve and state update
    await act(async () => {
      jest.runAllTimers();
    });
    expect(getByText('Notices')).toBeTruthy();
  });

  it('renders the event switch after loading', async () => {
    const { getByTestId } = renderWithProviders(
      <NoticesScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    await act(async () => {
      jest.runAllTimers();
    });
    expect(getByTestId('event-switch')).toBeTruthy();
  });

  it('renders the profile button after loading', async () => {
    const { getByTestId } = renderWithProviders(
      <NoticesScreen navigation={mockNavigation} route={mockRoute as any} />,
    );
    await act(async () => {
      jest.runAllTimers();
    });
    expect(getByTestId('profile-button')).toBeTruthy();
  });
});
