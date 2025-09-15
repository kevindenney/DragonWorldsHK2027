/**
 * Animation utilities using React Native's built-in Animated API
 * Replacement for react-native-reanimated animations
 */

import { Animated, Easing } from 'react-native';

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
}

/**
 * Create fade in animation
 */
export const createFadeInAnimation = (
  animatedValue: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const {
    duration = 300,
    delay = 0,
    easing = Easing.out(Easing.ease),
    useNativeDriver = true,
  } = config;

  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing,
    useNativeDriver,
  });
};

/**
 * Create fade out animation
 */
export const createFadeOutAnimation = (
  animatedValue: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const {
    duration = 300,
    delay = 0,
    easing = Easing.in(Easing.ease),
    useNativeDriver = true,
  } = config;

  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    easing,
    useNativeDriver,
  });
};

/**
 * Create fade in down animation (fade in + slide from top)
 */
export const createFadeInDownAnimation = (
  fadeValue: Animated.Value,
  translateValue: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const {
    duration = 500,
    delay = 0,
    easing = Easing.out(Easing.back(1.2)),
    useNativeDriver = true,
  } = config;

  return Animated.parallel([
    Animated.timing(fadeValue, {
      toValue: 1,
      duration,
      delay,
      easing,
      useNativeDriver,
    }),
    Animated.timing(translateValue, {
      toValue: 0,
      duration,
      delay,
      easing,
      useNativeDriver,
    }),
  ]);
};

/**
 * Create fade in up animation (fade in + slide from bottom)
 */
export const createFadeInUpAnimation = (
  fadeValue: Animated.Value,
  translateValue: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const {
    duration = 500,
    delay = 0,
    easing = Easing.out(Easing.back(1.2)),
    useNativeDriver = true,
  } = config;

  return Animated.parallel([
    Animated.timing(fadeValue, {
      toValue: 1,
      duration,
      delay,
      easing,
      useNativeDriver,
    }),
    Animated.timing(translateValue, {
      toValue: 0,
      duration,
      delay,
      easing,
      useNativeDriver,
    }),
  ]);
};

/**
 * Create scale in animation
 */
export const createScaleInAnimation = (
  scaleValue: Animated.Value,
  config: AnimationConfig = {}
): Animated.CompositeAnimation => {
  const {
    duration = 300,
    delay = 0,
    easing = Easing.out(Easing.back(1.5)),
    useNativeDriver = true,
  } = config;

  return Animated.timing(scaleValue, {
    toValue: 1,
    duration,
    delay,
    easing,
    useNativeDriver,
  });
};

/**
 * Create stagger animation for lists
 */
export const createStaggerAnimation = (
  animations: Animated.CompositeAnimation[],
  stagger: number = 100
): Animated.CompositeAnimation => {
  return Animated.stagger(stagger, animations);
};

/**
 * Utility class for managing component animations
 */
export class AnimatedComponent {
  private fadeValue: Animated.Value;
  private translateYValue: Animated.Value;
  private scaleValue: Animated.Value;

  constructor() {
    this.fadeValue = new Animated.Value(0);
    this.translateYValue = new Animated.Value(30);
    this.scaleValue = new Animated.Value(0.8);
  }

  /**
   * Get animated style for fade in down effect
   */
  getFadeInDownStyle() {
    return {
      opacity: this.fadeValue,
      transform: [
        {
          translateY: this.translateYValue,
        },
      ],
    };
  }

  /**
   * Get animated style for fade in up effect
   */
  getFadeInUpStyle() {
    return {
      opacity: this.fadeValue,
      transform: [
        {
          translateY: this.translateYValue.interpolate({
            inputRange: [0, 30],
            outputRange: [0, 30],
          }),
        },
      ],
    };
  }

  /**
   * Get animated style for scale in effect
   */
  getScaleInStyle() {
    return {
      opacity: this.fadeValue,
      transform: [
        {
          scale: this.scaleValue,
        },
      ],
    };
  }

  /**
   * Animate fade in down
   */
  animateFadeInDown(config?: AnimationConfig) {
    return createFadeInDownAnimation(this.fadeValue, this.translateYValue, config);
  }

  /**
   * Animate fade in up
   */
  animateFadeInUp(config?: AnimationConfig) {
    this.translateYValue.setValue(30);
    return createFadeInUpAnimation(this.fadeValue, this.translateYValue, config);
  }

  /**
   * Animate scale in
   */
  animateScaleIn(config?: AnimationConfig) {
    return Animated.parallel([
      createFadeInAnimation(this.fadeValue, config),
      createScaleInAnimation(this.scaleValue, config),
    ]);
  }

  /**
   * Reset all values to initial state
   */
  reset() {
    this.fadeValue.setValue(0);
    this.translateYValue.setValue(30);
    this.scaleValue.setValue(0.8);
  }
}

/**
 * Hook-like function for using animations in functional components
 */
export const useAnimatedValues = () => {
  return new AnimatedComponent();
};