import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { NativeSyntheticEvent, NativeScrollEvent, Animated } from 'react-native';

/**
 * ToolbarVisibilityContext
 *
 * Manages TOP TOOLBAR visibility on scroll.
 * - Tab bar remains always visible per Apple HIG
 * - Top toolbar/header hides on scroll down, shows on scroll up
 * - This follows Apple's Safari/Photos pattern
 */

const TOOLBAR_HEIGHT = 120; // Full header height including event selector
const SCROLL_THRESHOLD = 10; // Minimum scroll delta to trigger hide/show

interface ToolbarVisibilityContextType {
  isToolbarVisible: boolean;
  toolbarTranslateY: Animated.Value;
  toolbarOpacity: Animated.Value;
  showToolbar: () => void;
  hideToolbar: () => void;
  createScrollHandler: () => {
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onScrollBeginDrag: () => void;
    onScrollEndDrag: () => void;
    onMomentumScrollEnd: () => void;
  };
}

const ToolbarVisibilityContext = createContext<ToolbarVisibilityContextType | null>(null);

interface ToolbarVisibilityProviderProps {
  children: ReactNode;
}

export function ToolbarVisibilityProvider({ children }: ToolbarVisibilityProviderProps) {
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [toolbarTranslateY] = useState(() => new Animated.Value(0));
  const [toolbarOpacity] = useState(() => new Animated.Value(1));

  // Track scroll state
  const lastScrollY = useRef(0);
  const isScrolling = useRef(false);

  const showToolbar = useCallback(() => {
    if (!isToolbarVisible) {
      setIsToolbarVisible(true);
      Animated.parallel([
        Animated.spring(toolbarTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 12,
        }),
        Animated.timing(toolbarOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isToolbarVisible, toolbarTranslateY, toolbarOpacity]);

  const hideToolbar = useCallback(() => {
    if (isToolbarVisible) {
      setIsToolbarVisible(false);
      Animated.parallel([
        Animated.spring(toolbarTranslateY, {
          toValue: -TOOLBAR_HEIGHT,
          useNativeDriver: true,
          tension: 100,
          friction: 12,
        }),
        Animated.timing(toolbarOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isToolbarVisible, toolbarTranslateY, toolbarOpacity]);

  const createScrollHandler = useCallback(() => {
    // Create fresh refs for each scroll handler instance
    let localLastScrollY = 0;
    let localIsScrolling = false;

    return {
      onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const delta = currentScrollY - localLastScrollY;

        // Only react to significant scroll movements
        if (Math.abs(delta) > SCROLL_THRESHOLD) {
          if (delta > 0 && currentScrollY > TOOLBAR_HEIGHT) {
            // Scrolling down - hide toolbar (but only if we've scrolled past the toolbar height)
            hideToolbar();
          } else if (delta < 0) {
            // Scrolling up - show toolbar
            showToolbar();
          }
        }

        // Always show toolbar when at top
        if (currentScrollY <= 0) {
          showToolbar();
        }

        localLastScrollY = currentScrollY;
      },
      onScrollBeginDrag: () => {
        localIsScrolling = true;
      },
      onScrollEndDrag: () => {
        localIsScrolling = false;
      },
      onMomentumScrollEnd: () => {
        localIsScrolling = false;
        // Show toolbar when scroll momentum ends if near top
        if (localLastScrollY < TOOLBAR_HEIGHT) {
          showToolbar();
        }
      },
    };
  }, [hideToolbar, showToolbar]);

  return (
    <ToolbarVisibilityContext.Provider
      value={{
        isToolbarVisible,
        toolbarTranslateY,
        toolbarOpacity,
        showToolbar,
        hideToolbar,
        createScrollHandler,
      }}
    >
      {children}
    </ToolbarVisibilityContext.Provider>
  );
}

export function useToolbarVisibility(): ToolbarVisibilityContextType {
  const context = useContext(ToolbarVisibilityContext);

  if (!context) {
    // Return a mock context for components rendered outside provider
    return {
      isToolbarVisible: true,
      toolbarTranslateY: new Animated.Value(0),
      toolbarOpacity: new Animated.Value(1),
      showToolbar: () => {},
      hideToolbar: () => {},
      createScrollHandler: () => ({
        onScroll: () => {},
        onScrollBeginDrag: () => {},
        onScrollEndDrag: () => {},
        onMomentumScrollEnd: () => {},
      }),
    };
  }

  return context;
}

// Legacy exports for backwards compatibility
export const TabBarVisibilityProvider = ToolbarVisibilityProvider;
export const useTabBarVisibility = useToolbarVisibility;
export default ToolbarVisibilityContext;
