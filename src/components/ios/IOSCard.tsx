import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/theme';

export type IOSCardVariant = 'elevated' | 'filled' | 'outlined';

export interface IOSCardProps {
  children: React.ReactNode;
  variant?: IOSCardVariant;
  padding?: number;
  style?: ViewStyle;
  testID?: string;
  onPress?: () => void;
}

export const IOSCard: React.FC<IOSCardProps> = ({
  children,
  variant = 'elevated',
  padding = 16, // Apple HIG 16pt standard padding
  style,
  testID,
  onPress,
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={cardStyle}
      testID={testID}
      accessibilityRole="region"
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base card styles
  base: {
    borderRadius: 12, // Apple HIG 12pt corner radius for cards
    backgroundColor: colors.surface,
  },

  // Elevated card - Apple HIG standard card with shadow
  elevated: {
    backgroundColor: colors.background,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1, // Subtle shadow as per Apple HIG
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Filled card - Subtle background differentiation
  filled: {
    backgroundColor: colors.surface, // systemGray6 equivalent
  },

  // Outlined card - Border only
  outlined: {
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth, // 1px border
    borderColor: colors.border,
  },
});