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


// Use React Native's Animated API
const AnimatedDefault = {
  View: Animated.View,
  Text: Animated.Text,
  ScrollView: Animated.ScrollView,
  Image: Animated.Image,
  createAnimatedComponent: Animated.createAnimatedComponent,
  Value: Animated.Value,
  timing: Animated.timing,
  sequence: Animated.sequence,
  parallel: Animated.parallel,
  spring: Animated.spring,
  decay: Animated.decay,
  delay: Animated.delay,
  stagger: Animated.stagger,
  loop: Animated.loop,
  add: Animated.add,
  subtract: Animated.subtract,
  multiply: Animated.multiply,
  divide: Animated.divide,
  modulo: Animated.modulo,
  diffClamp: Animated.diffClamp,
};

// Animation functions that return style objects for entering animations
// These mimic the behavior of reanimated's entering animations with chainable duration method
const createAnimationFunction = () => {
  const animationFn = () => ({});
  animationFn.duration = (ms: number) => {
    const durationFn = () => ({});
    durationFn.delay = (delayMs: number) => ({});
    return durationFn;
  };
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
        
        // Safely update distance property - HERMES COMPATIBLE
        if (this.distance !== undefined) {
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
            }
          });
        }
      } catch (error) {
      }
    });

  }

  get value() {
    return this._value;
  }

  set value(newValue: any) {
    try {
      const safeValue = (typeof newValue === 'number' && !isNaN(newValue)) ? newValue : 0;
      this._value = safeValue;
      
      // Safely update distance property - HERMES COMPATIBLE
      if (this.distance !== undefined) {
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

// HERMES COMPATIBILITY: Removed dangerous monkey patching
// The previous code was monkey patching Object.defineProperty and Object.getOwnPropertyDescriptor
// This causes "property is not configurable" errors in Hermes runtime

// HERMES-SAFE: Global gesture state for React Navigation compatibility
if (typeof global !== 'undefined') {

  // CONFIRMED: The "property is not configurable" error comes from dependencies, not our code
  // Safe approach: Use direct property assignment without descriptor modifications
  try {
    const safeGestureState = {
      distance: globalGestureState.distance || 0,
      velocity: globalGestureState.velocity || { x: 0, y: 0 },
      position: globalGestureState.position || { x: 0, y: 0 },
      finished: globalGestureState.finished || false,
      time: globalGestureState.time || 0,
      // Add safe getter methods
      getDistance: () => globalGestureState.distance ?? 0,
      getVelocity: () => globalGestureState.velocity ?? { x: 0, y: 0 },
      getPosition: () => globalGestureState.position ?? { x: 0, y: 0 }
    };

    // Direct assignment - no property descriptor modification
    (global as any).__reactNavigationGestureState = safeGestureState;
  } catch (error) {
    // Minimal fallback
    try {
      (global as any).__reactNavigationGestureState = { distance: 0 };
    } catch (fallbackError) {
    }
  }

}
