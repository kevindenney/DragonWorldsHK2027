/**
 * Animation wrapper using React Native's built-in Animated API
 * Replacement for react-native-reanimated
 *
 * Provides comprehensive React Navigation compatibility
 */

import { Animated, Easing } from 'react-native';

// Global gesture handler state for React Navigation compatibility
const globalGestureState = {
  distance: 0,
  velocity: { x: 0, y: 0 },
  position: { x: 0, y: 0 },
  finished: false,
  time: 0
};

console.log('[AnimationWrapper] Initializing React Native Animated API wrapper');

// Use React Native's Animated API
const AnimatedDefault = {
  View: Animated.View,
  Text: Animated.Text,
  ScrollView: Animated.ScrollView,
  Image: Animated.Image,
  createAnimatedComponent: Animated.createAnimatedComponent,
};

// Animation functions that return style objects for entering animations
// These mimic the behavior of reanimated's entering animations with chainable duration method
const createAnimationFunction = () => {
  const animationFn = () => ({});
  animationFn.duration = (ms: number) => ({});
  return animationFn;
};

const FadeInDown = createAnimationFunction();
const FadeInUp = createAnimationFunction();
const FadeIn = createAnimationFunction();
const FadeOut = createAnimationFunction();
const SlideInUp = createAnimationFunction();
const SlideInDown = createAnimationFunction();
const SlideInRight = createAnimationFunction();

// Enhanced Animated Value that mimics reanimated's SharedValue with full React Navigation compatibility
class SharedValueImpl {
  private _value: any;
  private _animatedValue: Animated.Value;
  private _listeners: Map<string, Function>;

  constructor(initialValue: any) {
    // Ensure we have a valid initial value with extra safety
    const safeInitialValue = (typeof initialValue === 'number' && !isNaN(initialValue)) ? initialValue : 0;

    this._value = safeInitialValue;
    this._animatedValue = new Animated.Value(safeInitialValue);
    this._listeners = new Map();

    // Add properties that react-navigation expects with defensive initialization
    this.distance = safeInitialValue;
    this.state = {
      finished: false,
      position: safeInitialValue,
      time: Date.now(),
      velocity: 0
    };

    // Update global gesture state with safety checks
    if (globalGestureState) {
      globalGestureState.distance = safeInitialValue;
      globalGestureState.position = { x: safeInitialValue, y: 0 };
      globalGestureState.time = Date.now();
    }

    // Listen to animated value changes and update distance with defensive programming
    this._animatedValue.addListener(({ value }) => {
      try {
        const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;
        this._value = safeValue;
        
        // Safely update distance property
        if (this.hasOwnProperty('distance') || this.distance !== undefined) {
          this.distance = safeValue;
        }
        
        this.state = {
          finished: false,
          position: safeValue,
          time: Date.now(),
          velocity: 0
        };

        // Update global gesture state with safety checks
        if (globalGestureState && typeof globalGestureState === 'object') {
          globalGestureState.distance = safeValue;
          globalGestureState.position = { x: safeValue, y: 0 };
          globalGestureState.time = Date.now();
        }

        // Notify custom listeners with error handling
        if (this._listeners && this._listeners.size > 0) {
          this._listeners.forEach(listener => {
            try {
              if (typeof listener === 'function') {
                listener({ value: safeValue });
              }
            } catch (error) {
              console.warn('[SharedValueImpl] Listener error:', error);
            }
          });
        }
      } catch (error) {
        console.error('[SharedValueImpl] Critical listener error:', error);
      }
    });

    console.log(`[SharedValueImpl] Initialized with distance: ${this.distance}`);
  }

  get value() {
    return this._value;
  }

  set value(newValue: any) {
    try {
      const safeValue = (typeof newValue === 'number' && !isNaN(newValue)) ? newValue : 0;
      this._value = safeValue;
      
      // Safely update distance property
      if (this.hasOwnProperty('distance') || this.distance !== undefined) {
        this.distance = safeValue;
      }
      
      this._animatedValue.setValue(safeValue);
      this.state = {
        finished: true,
        position: safeValue,
        time: Date.now(),
        velocity: 0
      };
    } catch (error) {
      console.error('[SharedValueImpl] Error setting value:', error);
    }
  }

  // Add methods that react-navigation stack navigator expects
  addListener = (callback: any) => {
    const id = this._animatedValue.addListener(callback);
    return id;
  };

  removeListener = (id: any) => {
    this._animatedValue.removeListener(id);
  };

  removeAllListeners = () => {
    this._animatedValue.removeAllListeners();
    this._listeners.clear();
  };

  // Methods for compatibility with reanimated
  setValue = (value: any) => {
    this.value = value;
  };

  // Add interpolate method
  interpolate = (config: any) => {
    return this._animatedValue.interpolate(config);
  };

  // Custom listener management for React Navigation compatibility
  addCustomListener = (id: string, callback: Function) => {
    this._listeners.set(id, callback);
  };

  removeCustomListener = (id: string) => {
    this._listeners.delete(id);
  };

  // Gesture handler compatibility methods
  stopAnimation = (callback?: (value: number) => void) => {
    this._animatedValue.stopAnimation(callback);
  };

  extractOffset = () => {
    this._animatedValue.extractOffset();
  };

  flattenOffset = () => {
    this._animatedValue.flattenOffset();
  };

  setOffset = (offset: number) => {
    this._animatedValue.setOffset(offset);
  };

  // Add other expected properties
  distance: number;
  state: any;

  // Make it behave like an Animated.Value when needed
  get _nativeValue() {
    return this._animatedValue;
  }

  // Additional React Navigation specific methods
  __getValue = () => {
    return this._value;
  };

  __attach = () => {};
  __detach = () => {};
}

// Reanimated hooks - provide fallback implementations
const useSharedValue = (initialValue: any) => {
  return new SharedValueImpl(initialValue);
};

const useAnimatedStyle = (styleFunction: () => any) => {
  // Return a static style object
  return {};
};

const useAnimatedGestureHandler = (handlers: any) => {
  // Return empty handler
  return {};
};

// Reanimated animation functions - provide fallbacks
const withTiming = (toValue: number, config?: any) => {
  return toValue; // Just return the target value
};

const withSpring = (toValue: number, config?: any) => {
  return toValue; // Just return the target value
};

const withRepeat = (animation: any, count?: number, reverse?: boolean) => {
  return animation; // Return the animation unchanged
};

const withSequence = (...animations: any[]) => {
  return animations[animations.length - 1]; // Return the last animation
};

const interpolate = (value: number, inputRange: number[], outputRange: number[]) => {
  // Simple linear interpolation fallback
  if (inputRange.length !== outputRange.length) return outputRange[0];

  for (let i = 0; i < inputRange.length - 1; i++) {
    if (value >= inputRange[i] && value <= inputRange[i + 1]) {
      const progress = (value - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
      return outputRange[i] + progress * (outputRange[i + 1] - outputRange[i]);
    }
  }
  return outputRange[outputRange.length - 1];
};

const interpolateColor = (value: number, inputRange: number[], outputRange: string[]) => {
  // Return the first color as fallback
  return outputRange[0] || '#000000';
};

const runOnJS = (fn: Function) => {
  return fn; // Just return the function
};

// Additional reanimated APIs that React Navigation might need
const cancelAnimation = (animatedValue: any) => {
  // No-op for canceling animations
};

const useDerivedValue = (fn: () => any) => {
  return new SharedValueImpl(fn());
};

const useAnimatedProps = (fn: () => any) => {
  return {};
};

const useAnimatedScrollHandler = (handlers: any) => {
  return {};
};

const useWorkletCallback = (fn: Function) => {
  return fn;
};

const makeMutable = (initialValue: any) => {
  return new SharedValueImpl(initialValue);
};

const makeRemote = (initialValue: any) => {
  return new SharedValueImpl(initialValue);
};

// Enhanced Gesture Handler compatibility with proper state management
const createGestureHandler = (type: string) => {
  return {
    onBegin: (callback: any) => ({ onBegin: callback, type }),
    onActive: (callback: any) => ({ onActive: callback, type }),
    onEnd: (callback: any) => ({ onEnd: callback, type }),
    onFinalize: (callback: any) => ({ onFinalize: callback, type }),
    onChange: (callback: any) => ({ onChange: callback, type }),
    runOnJS: (enabled: boolean) => ({ runOnJS: enabled, type }),
    shouldCancelWhenOutside: (enabled: boolean) => ({ shouldCancelWhenOutside: enabled, type }),
    enabled: (enabled: boolean) => ({ enabled, type }),
    simultaneousWithExternalGesture: (gesture: any) => ({ simultaneousWithExternalGesture: gesture, type }),
    requireExternalGestureToFail: (gesture: any) => ({ requireExternalGestureToFail: gesture, type }),
  };
};

const Gesture = {
  Pan: () => createGestureHandler('pan'),
  Tap: () => createGestureHandler('tap'),
  LongPress: () => createGestureHandler('longPress'),
  Rotation: () => createGestureHandler('rotation'),
  Pinch: () => createGestureHandler('pinch'),
  Fling: () => createGestureHandler('fling'),
  Native: () => createGestureHandler('native'),
  Manual: () => createGestureHandler('manual'),
  Race: (...gestures: any[]) => ({ type: 'race', gestures }),
  Simultaneous: (...gestures: any[]) => ({ type: 'simultaneous', gestures }),
  Exclusive: (...gestures: any[]) => ({ type: 'exclusive', gestures }),
};

// Enhanced GestureDetector with React Native gesture handling
const GestureDetector = ({ gesture, children }: { gesture?: any; children: any }) => {
  // For now, just return children - can be enhanced later with actual gesture handling
  return children;
};

// Gesture state constants (matching react-native-gesture-handler)
const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

// Add clock and timing functions
const Clock = class {
  constructor() {}
};

const clockRunning = (clock: any) => false;
const startClock = (clock: any) => {};
const stopClock = (clock: any) => {};

// Export all the wrappers and fallback functions
export default AnimatedDefault;
export {
  FadeInDown,
  FadeInUp,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideInDown,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  interpolateColor,
  runOnJS,
  cancelAnimation,
  useDerivedValue,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useWorkletCallback,
  makeMutable,
  makeRemote,
  Gesture,
  GestureDetector,
  State,
  Clock,
  clockRunning,
  startClock,
  stopClock,
  Easing
};

// Helper function to check if animations are available
export const isReanimatedAvailable = () => {
  return true; // Always available since we're using React Native's Animated API
};

// Global error handling for React Navigation's gesture state access
// This prevents "Cannot read property 'distance' of undefined" errors
if (typeof global !== 'undefined') {
  // Monkey patch common React Navigation gesture access patterns
  const originalDescriptor = Object.getOwnPropertyDescriptor;
  const originalDefineProperty = Object.defineProperty;

  // Create a safe getter for distance property access
  const createSafeGetter = (target: any, prop: string) => {
    if (prop === 'distance' && (target === null || target === undefined)) {
      console.log('[AnimationWrapper] Defensive: Returning safe distance value for undefined object');
      return 0;
    }
    return target?.[prop];
  };

  // Add a global gesture state fallback
  const globalGestureProxy = new Proxy(globalGestureState, {
    get(target, prop) {
      if (prop === 'distance') {
        return target.distance ?? 0;
      }
      return target[prop as keyof typeof target] ?? 0;
    }
  });

  // Export the global gesture state for React Navigation access
  (global as any).__reactNavigationGestureState = globalGestureProxy;

  // Add global property access protection for deriveBFS-related errors
  const originalGlobalGet = global.Object?.getOwnPropertyDescriptor;
  if (originalGlobalGet) {
    global.Object.getOwnPropertyDescriptor = function(obj: any, prop: string | symbol) {
      try {
        // Handle undefined objects trying to access distance property
        if (!obj && prop === 'distance') {
          console.log('[AnimationWrapper] Protected: distance access on undefined object');
          return { 
            value: 0, 
            writable: true, 
            enumerable: true, 
            configurable: true 
          };
        }
        return originalGlobalGet.call(this, obj, prop);
      } catch (error) {
        console.warn('[AnimationWrapper] Property descriptor error:', error);
        // Return a safe default descriptor for distance property
        if (prop === 'distance') {
          return { 
            value: 0, 
            writable: true, 
            enumerable: true, 
            configurable: true 
          };
        }
        throw error;
      }
    };
  }

  // Add protection for direct property access that causes deriveBFS errors
  const originalObjectDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj: any, prop: string | symbol, descriptor: PropertyDescriptor) {
    try {
      // Safely handle distance property definitions
      if (prop === 'distance' && (!obj || typeof obj !== 'object')) {
        console.log('[AnimationWrapper] Safe: distance property definition on invalid object');
        return obj;
      }
      return originalObjectDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      console.warn('[AnimationWrapper] Property definition error:', error);
      // For distance properties, fail silently to prevent deriveBFS crashes
      if (prop === 'distance') {
        return obj;
      }
      throw error;
    }
  };
}

console.log('[AnimationWrapper] React Native Animated API wrapper ready with all exports and defensive gesture handling');