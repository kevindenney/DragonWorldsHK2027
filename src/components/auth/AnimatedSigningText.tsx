import React, { useState, useEffect } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

interface AnimatedSigningTextProps {
  style?: StyleProp<TextStyle>;
}

/**
 * Animated "Signing in" text with cycling dots: "" → "." → ".." → "..."
 */
export function AnimatedSigningText({ style }: AnimatedSigningTextProps) {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const dots = '.'.repeat(dotCount);

  return (
    <Text style={style}>
      Signing in{dots}
    </Text>
  );
}
