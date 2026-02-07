/**
 * InitialsAvatar - Displays user initials on a colored circle
 *
 * Generates a deterministic background color based on the user's ID
 * so the same user always gets the same color.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography } from '../../constants/theme';

interface InitialsAvatarProps {
  /** User's display name to extract initials from */
  name: string;
  /** User's unique ID for consistent color generation */
  id: string;
  /** Size of the avatar in pixels */
  size?: number;
  /** Optional custom style for the container */
  style?: ViewStyle;
  /** Optional custom style for the text */
  textStyle?: TextStyle;
  testID?: string;
}

// Vibrant, accessible color palette for avatars
const AVATAR_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEAA7', // Soft Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Lavender
  '#85C1E9', // Light Blue
  '#F8B500', // Amber
  '#48C9B0', // Turquoise
];

/**
 * Extract initials from a display name
 * - "Kevin Denne" -> "KD"
 * - "John" -> "J"
 * - "" or undefined -> "?"
 */
const getInitials = (name: string): string => {
  if (!name || !name.trim()) {
    return '?';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    // First letter of first name + first letter of last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Single name - just use the first letter
  return parts[0][0].toUpperCase();
};

/**
 * Generate a consistent color index from a user ID
 * Uses a simple hash function to ensure the same ID always produces the same color
 */
const getColorIndex = (id: string): number => {
  if (!id) return 0;

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Ensure positive index
  return Math.abs(hash) % AVATAR_COLORS.length;
};

export function InitialsAvatar({
  name,
  id,
  size = 72,
  style,
  textStyle,
  testID,
}: InitialsAvatarProps) {
  const initials = getInitials(name);
  const backgroundColor = AVATAR_COLORS[getColorIndex(id)];

  // Calculate font size based on avatar size (roughly 40% of avatar size)
  const fontSize = Math.round(size * 0.4);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize,
            lineHeight: fontSize * 1.2,
          },
          textStyle,
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default InitialsAvatar;
