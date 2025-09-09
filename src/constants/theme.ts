import { Platform } from 'react-native';

// TypeScript interfaces for theme system
export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  borderLight: string;
  shadow: string;
}

export interface SponsorColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  letterSpacing?: number;
}

export interface Typography {
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  h4: TypographyStyle;
  h5: TypographyStyle;
  h6: TypographyStyle;
  body1: TypographyStyle;
  body2: TypographyStyle;
  caption: TypographyStyle;
  overline: TypographyStyle;
  button: TypographyStyle;
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface BorderRadius {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
}

export interface Shadows {
  small: object;
  medium: object;
  large: object;
  card: object;
  button: object;
  modal: object;
}

export interface ComponentStyles {
  button: {
    height: {
      small: number;
      medium: number;
      large: number;
    };
    padding: {
      small: { vertical: number; horizontal: number };
      medium: { vertical: number; horizontal: number };
      large: { vertical: number; horizontal: number };
    };
  };
  card: {
    padding: number;
    margin: number;
    borderWidth: number;
  };
  input: {
    height: number;
    paddingHorizontal: number;
    borderWidth: number;
  };
  tab: {
    height: number;
    iconSize: number;
  };
  header: {
    height: number;
    paddingHorizontal: number;
  };
}

export interface Theme {
  colors: ColorPalette;
  sponsorColors?: SponsorColors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  components: ComponentStyles;
}

// Core Dragon World Championships Color Palette
export const colors: ColorPalette = {
  // Primary sailing blue
  primary: '#2B5CE6',
  primaryLight: '#5A7FEA',
  primaryDark: '#1E40B3',
  
  // Secondary gold
  secondary: '#FFD700',
  secondaryLight: '#FFE033',
  secondaryDark: '#CCB800',
  
  // Accent sailing colors
  accent: '#00BCD4', // Sailing cyan
  
  // Sailing whites and grays
  background: '#FFFFFF',
  surface: '#F8FAFB',
  text: '#1A1A1A',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  
  // Status colors
  success: '#10B981', // Green flag
  warning: '#F59E0B', // Yellow flag
  error: '#EF4444',   // Red flag
  info: '#3B82F6',    // Blue flag
  
  // Borders and dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: '#000000',
};

// Configurable sponsor color system
export const createSponsorTheme = (sponsorColors: SponsorColors): ColorPalette => ({
  ...colors,
  primary: sponsorColors.primary,
  secondary: sponsorColors.secondary,
  accent: sponsorColors.accent,
  text: sponsorColors.text,
  background: sponsorColors.background,
});

// Example sponsor configurations
export const sponsorThemes = {
  rolex: {
    primary: '#006847', // Rolex green
    secondary: '#FFD700', // Gold
    accent: '#1A1A1A',
    text: '#1A1A1A',
    background: '#FFFFFF',
  },
  omega: {
    primary: '#C41E3A', // Omega red
    secondary: '#FFD700', // Gold
    accent: '#1A1A1A',
    text: '#1A1A1A',
    background: '#FFFFFF',
  },
  prada: {
    primary: '#000000', // Prada black
    secondary: '#FF0000', // Prada red
    accent: '#FFFFFF',
    text: '#000000',
    background: '#FFFFFF',
  },
} as const;

// Typography system
const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography: Typography = {
  h1: {
    fontFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: -0.25,
  },
  h3: {
    fontFamily,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: 0,
  },
  h4: {
    fontFamily,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  h5: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0,
  },
  h6: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  body1: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  body2: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.25,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  overline: {
    fontFamily,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 1.5,
  },
  button: {
    fontFamily,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.75,
  },
};

// Spacing system (8px base unit)
export const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius values
export const borderRadius: BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

// Shadow styles for different platforms
export const shadows: Shadows = {
  small: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  medium: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  large: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
  button: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  modal: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
    android: {
      elevation: 16,
    },
    default: {},
  }),
};

// Component styling constants
export const components: ComponentStyles = {
  button: {
    height: {
      small: 32,
      medium: 44,
      large: 56,
    },
    padding: {
      small: { vertical: spacing.xs, horizontal: spacing.md },
      medium: { vertical: spacing.sm, horizontal: spacing.lg },
      large: { vertical: spacing.md, horizontal: spacing.xl },
    },
  },
  card: {
    padding: spacing.md,
    margin: spacing.sm,
    borderWidth: 1,
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  tab: {
    height: 60,
    iconSize: 24,
  },
  header: {
    height: 56,
    paddingHorizontal: spacing.md,
  },
};

// Main theme object
export const theme: Theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
};

// Utility function to create themed styles
export const createThemedStyles = (customColors?: SponsorColors) => {
  const themeColors = customColors ? createSponsorTheme(customColors) : colors;
  
  return {
    ...theme,
    colors: themeColors,
  };
};

// Helper functions for common style patterns
export const getColorWithOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export const getSpacingStyle = (
  top?: keyof Spacing,
  right?: keyof Spacing,
  bottom?: keyof Spacing,
  left?: keyof Spacing
) => ({
  paddingTop: top ? spacing[top] : 0,
  paddingRight: right ? spacing[right] : 0,
  paddingBottom: bottom ? spacing[bottom] : 0,
  paddingLeft: left ? spacing[left] : 0,
});

export const getMarginStyle = (
  top?: keyof Spacing,
  right?: keyof Spacing,
  bottom?: keyof Spacing,
  left?: keyof Spacing
) => ({
  marginTop: top ? spacing[top] : 0,
  marginRight: right ? spacing[right] : 0,
  marginBottom: bottom ? spacing[bottom] : 0,
  marginLeft: left ? spacing[left] : 0,
});

// Sailing-specific color utilities
export const getSailingStatusColor = (status: 'upcoming' | 'active' | 'completed' | 'cancelled') => {
  switch (status) {
    case 'upcoming':
      return colors.info;
    case 'active':
      return colors.success;
    case 'completed':
      return colors.textSecondary;
    case 'cancelled':
      return colors.error;
    default:
      return colors.textMuted;
  }
};

export const getWeatherColor = (condition: 'calm' | 'light' | 'moderate' | 'strong' | 'gale') => {
  switch (condition) {
    case 'calm':
      return colors.success;
    case 'light':
      return colors.info;
    case 'moderate':
      return colors.warning;
    case 'strong':
      return colors.error;
    case 'gale':
      return '#8B0000'; // Dark red for dangerous conditions
    default:
      return colors.textMuted;
  }
};