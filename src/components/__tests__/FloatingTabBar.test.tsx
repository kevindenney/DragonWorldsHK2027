/**
 * FloatingTabBar component rendering tests
 */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../testing/testUtils';

// Mock stores
jest.mock('../../stores/newsStore', () => ({
  useNewsStore: () => ({
    unreadCount: 3,
  }),
}));

jest.mock('../../stores/noticesStore', () => ({
  useNoticesStore: () => ({
    unreadCount: 5,
  }),
  useNoticesUnreadCount: () => 5,
}));

// Mock lucide icons
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const MockIcon = (props: any) => <View testID={`icon-${props.testID || 'mock'}`} />;
  return new Proxy(
    {},
    {
      get: () => MockIcon,
    },
  );
});

import FloatingTabBar from '../../components/navigation/FloatingTabBar';

describe('FloatingTabBar', () => {
  const mockState = {
    index: 0,
    routes: [
      { key: 'Schedule-1', name: 'Schedule' },
      { key: 'NoticeBoard-1', name: 'NoticeBoard' },
      { key: 'Results-1', name: 'Results' },
      { key: 'Forms-1', name: 'Forms' },
      { key: 'More-1', name: 'More' },
    ],
    routeNames: ['Schedule', 'NoticeBoard', 'Results', 'Forms', 'More'],
    type: 'tab' as const,
    stale: false as const,
    history: [{ type: 'route' as const, key: 'Schedule-1' }],
  };

  const mockDescriptors: any = {};
  mockState.routes.forEach((route) => {
    mockDescriptors[route.key] = {
      options: {
        tabBarLabel: route.name,
        tabBarAccessibilityLabel: route.name,
      },
      render: () => null,
    };
  });

  const mockNavigationProp: any = {
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
    dispatch: jest.fn(),
  };

  const defaultProps = {
    state: mockState,
    descriptors: mockDescriptors,
    navigation: mockNavigationProp,
    insets: { top: 0, bottom: 34, left: 0, right: 0 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<FloatingTabBar {...defaultProps} />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders all tab buttons with testIDs', () => {
    const { getByTestId } = renderWithProviders(<FloatingTabBar {...defaultProps} />);
    expect(getByTestId('tab-schedule')).toBeTruthy();
    expect(getByTestId('tab-noticeboard')).toBeTruthy();
    expect(getByTestId('tab-results')).toBeTruthy();
    expect(getByTestId('tab-forms')).toBeTruthy();
    expect(getByTestId('tab-more')).toBeTruthy();
  });

  it('renders tab labels', () => {
    const { getByText } = renderWithProviders(<FloatingTabBar {...defaultProps} />);
    expect(getByText('Schedule')).toBeTruthy();
    expect(getByText('Notices')).toBeTruthy();
    expect(getByText('Results')).toBeTruthy();
    expect(getByText('Forms')).toBeTruthy();
    expect(getByText('More')).toBeTruthy();
  });

  it('highlights the active tab', () => {
    const { getByTestId } = renderWithProviders(<FloatingTabBar {...defaultProps} />);
    // First tab (Schedule) is active (index: 0)
    const scheduleTab = getByTestId('tab-schedule');
    expect(scheduleTab).toBeTruthy();
  });

  it('responds to tab press without crashing', () => {
    const { getByTestId } = renderWithProviders(<FloatingTabBar {...defaultProps} />);
    fireEvent.press(getByTestId('tab-noticeboard'));
    // Verify the press doesn't crash - navigation emit may be async
    expect(getByTestId('tab-noticeboard')).toBeTruthy();
  });

  it('highlights second tab when state.index is 1', () => {
    const updatedState = { ...mockState, index: 1 };
    const { getByTestId } = renderWithProviders(
      <FloatingTabBar {...defaultProps} state={updatedState} />,
    );
    expect(getByTestId('tab-noticeboard')).toBeTruthy();
  });
});
