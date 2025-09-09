// TypeScript interfaces for iOS component library
// Ensures type safety and Apple HIG compliance

export interface IOSComponentBase {
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
  };
}

// Apple HIG Color System Types
export interface IOSSystemColors {
  // Primary colors
  systemBlue: string;
  systemBrown: string;
  systemGray: string;
  systemGreen: string;
  systemIndigo: string;
  systemOrange: string;
  systemPink: string;
  systemPurple: string;
  systemRed: string;
  systemTeal: string;
  systemYellow: string;

  // Neutral colors
  systemGray2: string;
  systemGray3: string;
  systemGray4: string;
  systemGray5: string;
  systemGray6: string;

  // Label colors (semantic)
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  quaternaryLabel: string;

  // Background colors (semantic)
  systemBackground: string;
  secondarySystemBackground: string;
  tertiarySystemBackground: string;

  // Grouped background colors
  systemGroupedBackground: string;
  secondarySystemGroupedBackground: string;
  tertiarySystemGroupedBackground: string;

  // Fill colors
  systemFill: string;
  secondarySystemFill: string;
  tertiarySystemFill: string;
  quaternarySystemFill: string;

  // Separator colors
  separator: string;
  opaqueSeparator: string;
}

// Apple HIG Typography Types
export interface IOSTypographyStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  letterSpacing?: number;
}

export interface IOSTypographyScale {
  largeTitle: IOSTypographyStyle;    // 34pt
  title1: IOSTypographyStyle;        // 28pt
  title2: IOSTypographyStyle;        // 22pt
  title3: IOSTypographyStyle;        // 20pt
  headline: IOSTypographyStyle;      // 17pt semibold
  body: IOSTypographyStyle;          // 17pt
  callout: IOSTypographyStyle;       // 16pt
  subheadline: IOSTypographyStyle;   // 15pt
  footnote: IOSTypographyStyle;      // 13pt
  caption1: IOSTypographyStyle;      // 12pt
  caption2: IOSTypographyStyle;      // 11pt
}

// Apple HIG Spacing Types
export interface IOSSpacing {
  xxs: number;  // 4pt
  xs: number;   // 8pt
  sm: number;   // 12pt
  md: number;   // 16pt
  lg: number;   // 20pt
  xl: number;   // 24pt
  xxl: number;  // 32pt
  xxxl: number; // 40pt
}

// Apple HIG Component Sizing
export interface IOSComponentSizes {
  touchTarget: {
    minimum: number;     // 44pt minimum
    recommended: number; // 48pt recommended
  };
  cornerRadius: {
    small: number;   // 8pt
    medium: number;  // 12pt
    large: number;   // 16pt
  };
  elevation: {
    card: number;
    modal: number;
    popover: number;
  };
}

// Button-specific types
export interface IOSButtonHIGSpec {
  variants: {
    filled: {
      backgroundColor: string;
      textColor: string;
      borderWidth: number;
    };
    tinted: {
      backgroundColor: string;
      textColor: string;
      borderWidth: number;
    };
    gray: {
      backgroundColor: string;
      textColor: string;
      borderWidth: number;
    };
    plain: {
      backgroundColor: string;
      textColor: string;
      borderWidth: number;
    };
  };
  sizes: {
    large: { height: number; paddingHorizontal: number; fontSize: number };
    medium: { height: number; paddingHorizontal: number; fontSize: number };
    small: { height: number; paddingHorizontal: number; fontSize: number };
  };
  states: {
    normal: { opacity: number };
    pressed: { opacity: number };
    disabled: { opacity: number };
  };
}

// List-specific types
export interface IOSListHIGSpec {
  cell: {
    minHeight: number;        // 44pt minimum
    paddingVertical: number;  // 12pt
    paddingHorizontal: number; // 16pt
  };
  separator: {
    height: number;           // StyleSheet.hairlineWidth
    color: string;
    insetStart: number;       // 16pt
  };
  accessory: {
    disclosure: string;
    detail: string;
    checkmark: string;
  };
  section: {
    headerHeight: number;     // 28pt
    footerHeight: number;     // 28pt
    spacing: number;          // 32pt between sections
  };
}

// Modal-specific types
export interface IOSModalHIGSpec {
  presentations: {
    sheet: {
      marginTop: number;        // 10% of screen height
      cornerRadius: number;     // 16pt
    };
    pageSheet: {
      marginTop: number;        // 15% of screen height
      marginHorizontal: number; // 8pt
      cornerRadius: number;     // 16pt
    };
    formSheet: {
      marginTop: number;        // 20% of screen height
      marginHorizontal: number; // 16pt
      cornerRadius: number;     // 16pt
    };
    fullScreen: {
      marginTop: number;        // 0
    };
  };
  handle: {
    width: number;    // 36pt
    height: number;   // 5pt
    cornerRadius: number; // 2.5pt
  };
  backdrop: {
    opacity: number;  // 0.4
  };
}

// Navigation Bar-specific types
export interface IOSNavigationBarHIGSpec {
  heights: {
    standard: number;  // 44pt
    large: number;     // 96pt
    compact: number;   // 44pt
  };
  title: {
    standard: { fontSize: number; fontWeight: string };    // 17pt semibold
    large: { fontSize: number; fontWeight: string };       // 34pt bold
    compact: { fontSize: number; fontWeight: string };     // 15pt semibold
  };
  button: {
    minWidth: number;  // 44pt
    height: number;    // 44pt
    fontSize: number;  // 17pt
  };
}

// Card-specific types
export interface IOSCardHIGSpec {
  cornerRadius: number;     // 12pt
  padding: number;          // 16pt
  shadow: {
    ios: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
    };
    android: {
      elevation: number;
    };
  };
  variants: {
    elevated: { hasElevation: boolean };
    filled: { backgroundColor: string };
    outlined: { borderWidth: number; borderColor: string };
  };
}

// Comprehensive iOS HIG specification
export interface IOSHIGSpecification {
  colors: IOSSystemColors;
  typography: IOSTypographyScale;
  spacing: IOSSpacing;
  components: IOSComponentSizes;
  button: IOSButtonHIGSpec;
  list: IOSListHIGSpec;
  modal: IOSModalHIGSpec;
  navigationBar: IOSNavigationBarHIGSpec;
  card: IOSCardHIGSpec;
}

// Dynamic Type support
export interface IOSDynamicTypeSupport {
  isEnabled: boolean;
  currentCategory: 
    | 'xSmall'
    | 'small'
    | 'medium'
    | 'large'
    | 'xLarge'
    | 'xxLarge'
    | 'xxxLarge'
    | 'accessibilityMedium'
    | 'accessibilityLarge'
    | 'accessibilityXLarge'
    | 'accessibilityXXLarge'
    | 'accessibilityXXXLarge';
  scaleFactor: number;
}

// Accessibility support
export interface IOSAccessibilitySupport {
  isVoiceOverRunning: boolean;
  isSwitchControlRunning: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  isDarkerSystemColorsEnabled: boolean;
  prefersCrossFadeTransitions: boolean;
  isOnOffSwitchLabelsEnabled: boolean;
}