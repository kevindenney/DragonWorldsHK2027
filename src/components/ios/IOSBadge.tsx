import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { IOSText } from './IOSText';
import { colors } from '../../constants/theme';

export type IOSBadgeVariant = 'filled' | 'tinted' | 'outlined';
export type IOSBadgeColor = 'systemBlue' | 'systemRed' | 'systemGreen' | 'systemOrange' | 'systemGray';
export type IOSBadgeSize = 'small' | 'medium' | 'large';

export interface IOSBadgeProps {
  children: React.ReactNode;
  variant?: IOSBadgeVariant;
  color?: IOSBadgeColor;
  size?: IOSBadgeSize;
  style?: ViewStyle;
  testID?: string;
}

export const IOSBadge: React.FC<IOSBadgeProps> = ({
  children,
  variant = 'filled',
  color = 'systemBlue',
  size = 'medium',
  style,
  testID,
}) => {
  const getColorValues = (colorName: IOSBadgeColor) => {
    switch (colorName) {
      case 'systemBlue':
        return { main: colors.primary, tint: colors.primary + '20', light: colors.primary + '10' };
      case 'systemRed':
        return { main: colors.error, tint: colors.error + '20', light: colors.error + '10' };
      case 'systemGreen':
        return { main: colors.success, tint: colors.success + '20', light: colors.success + '10' };
      case 'systemOrange':
        return { main: colors.warning, tint: colors.warning + '20', light: colors.warning + '10' };
      case 'systemGray':
        return { main: colors.textMuted, tint: colors.textMuted + '20', light: colors.textMuted + '10' };
      default:
        return { main: colors.primary, tint: colors.primary + '20', light: colors.primary + '10' };
    }
  };

  const colorValues = getColorValues(color);

  const getBackgroundColor = () => {
    switch (variant) {
      case 'filled':
        return colorValues.main;
      case 'tinted':
        return colorValues.tint;
      case 'outlined':
        return 'transparent';
      default:
        return colorValues.main;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'filled':
        return colors.background; // White text on filled
      case 'tinted':
        return colorValues.main;
      case 'outlined':
        return colorValues.main;
      default:
        return colors.background;
    }
  };

  const getBorderColor = () => {
    return variant === 'outlined' ? colorValues.main : 'transparent';
  };

  const badgeStyle = [
    styles.base,
    styles[size],
    {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      borderWidth: variant === 'outlined' ? 1 : 0,
    },
    style,
  ];

  const getTextStyle = () => {
    switch (size) {
      case 'small':
        return 'caption2';
      case 'medium':
        return 'caption1';
      case 'large':
        return 'footnote';
      default:
        return 'caption1';
    }
  };

  return (
    <View style={badgeStyle} testID={testID}>
      <IOSText 
        textStyle={getTextStyle() as any}
        color={getTextColor()}
        weight="semibold"
        style={styles.text}
      >
        {children}
      </IOSText>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  // Sizes following Apple HIG
  small: {
    paddingHorizontal: 6, // 6pt
    paddingVertical: 2,   // 2pt
    borderRadius: 8,      // 8pt
    minHeight: 16,        // 16pt
  },
  medium: {
    paddingHorizontal: 8, // 8pt
    paddingVertical: 4,   // 4pt
    borderRadius: 10,     // 10pt
    minHeight: 20,        // 20pt
  },
  large: {
    paddingHorizontal: 12, // 12pt
    paddingVertical: 6,    // 6pt
    borderRadius: 12,      // 12pt
    minHeight: 24,         // 24pt
  },

  text: {
    textAlign: 'center',
  },
});