import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

// Apple HIG Typography Scale
export type IOSTextStyle = 
  | 'largeTitle'    // 34pt
  | 'title1'        // 28pt
  | 'title2'        // 22pt
  | 'title3'        // 20pt
  | 'headline'      // 17pt semibold
  | 'body'          // 17pt
  | 'callout'       // 16pt
  | 'subheadline'   // 15pt
  | 'footnote'      // 13pt
  | 'caption1'      // 12pt
  | 'caption2';     // 11pt

export type IOSTextWeight = 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';

export interface IOSTextProps extends Omit<TextProps, 'style'> {
  children: React.ReactNode;
  textStyle?: IOSTextStyle;
  weight?: IOSTextWeight;
  color?: 'label' | 'secondaryLabel' | 'tertiaryLabel' | 'quaternaryLabel' | 'systemBlue' | 'systemRed' | 'systemGreen' | string;
  style?: TextProps['style'];
}

export const IOSText: React.FC<IOSTextProps> = ({
  children,
  textStyle = 'body',
  weight,
  color = 'label',
  style,
  ...props
}) => {
  const getColor = (colorName: string) => {
    switch (colorName) {
      case 'label':
        return colors.text;
      case 'secondaryLabel':
        return colors.textSecondary;
      case 'tertiaryLabel':
        return colors.textMuted;
      case 'quaternaryLabel':
        return colors.textMuted + '60';
      case 'systemBlue':
        return colors.primary;
      case 'systemRed':
        return colors.error;
      case 'systemGreen':
        return colors.success;
      default:
        return colorName;
    }
  };

  const combinedStyle = [
    styles.base,
    styles[textStyle],
    weight && styles[weight],
    { color: getColor(color) },
    style,
  ];

  return (
    <Text style={combinedStyle} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System', // iOS system font
  },

  // Apple HIG Typography Scale
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700', // Bold
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700', // Bold
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700', // Bold
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600', // Semibold
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600', // Semibold
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400', // Regular
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400', // Regular
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400', // Regular
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400', // Regular
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400', // Regular
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400', // Regular
  },

  // Font weights
  ultraLight: { fontWeight: '100' },
  thin: { fontWeight: '200' },
  light: { fontWeight: '300' },
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  heavy: { fontWeight: '800' },
  black: { fontWeight: '900' },
});