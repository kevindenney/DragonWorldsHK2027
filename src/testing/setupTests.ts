// Jest setup for React Native testing environment
import { jest } from '@jest/globals';
import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock the reanimatedWrapper used by all app components
jest.mock('../utils/reanimatedWrapper', () => {
  const { Animated } = require('react-native');
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (init: any) => ({ value: init }),
    useAnimatedStyle: (fn: any) => fn(),
    withTiming: (val: any) => val,
    withSpring: (val: any) => val,
    withRepeat: (val: any) => val,
    withSequence: (...vals: any[]) => vals[0],
    FadeInDown: { duration: () => ({ delay: () => ({}) }) },
    FadeInUp: { duration: () => ({ delay: () => ({}) }) },
    FadeInRight: { duration: () => ({ delay: () => ({}) }) },
    FadeInLeft: { duration: () => ({ delay: () => ({}) }) },
    FadeIn: { duration: () => ({ delay: () => ({}) }) },
    FadeOut: { duration: () => ({}) },
    FadeOutUp: { duration: () => ({}) },
    FadeOutDown: { duration: () => ({}) },
    SlideInUp: { duration: () => ({}) },
    SlideInDown: { duration: () => ({}) },
    SlideInRight: { duration: () => ({}) },
    interpolate: jest.fn((val: any) => val),
    interpolateColor: jest.fn(),
    Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    Easing: { bezier: () => jest.fn(), linear: jest.fn() },
    runOnJS: (fn: any) => fn,
    cancelAnimation: jest.fn(),
    useDerivedValue: (fn: any) => ({ value: fn() }),
    useAnimatedProps: (fn: any) => fn(),
    useAnimatedScrollHandler: jest.fn(() => jest.fn()),
    useWorkletCallback: (fn: any) => fn,
    useAnimatedGestureHandler: jest.fn(() => ({})),
    makeMutable: (val: any) => ({ value: val }),
    makeRemote: jest.fn(),
    isReanimatedAvailable: () => true,
    Gesture: {},
    GestureDetector: ({ children }: any) => children,
    State: {},
    Clock: jest.fn(),
    clockRunning: jest.fn(),
    startClock: jest.fn(),
    stopClock: jest.fn(),
  };
});

// Mock expo-linear-gradient globally
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return children;
  },
}));

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  })),
  removeEventListener: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: 'MapView',
  Marker: 'Marker',
  Polyline: 'Polyline',
  Circle: 'Circle',
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: any) => children,
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock Lucide React Native icons
jest.mock('lucide-react-native', () => {
  const mockIcon = ({ size, color, ...props }: any) => `Icon-${size}-${color}`;
  
  return new Proxy({}, {
    get: () => mockIcon,
  });
});

// Global test timeout
jest.setTimeout(10000);

// Suppress console warnings during tests unless explicitly needed
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});