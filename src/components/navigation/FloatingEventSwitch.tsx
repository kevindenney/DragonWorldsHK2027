import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Platform, LayoutChangeEvent } from 'react-native';
import { IOSText } from '../ios/IOSText';
import * as Haptics from 'expo-haptics';

interface FloatingEventSwitchOption {
  label: string;
  shortLabel: string;
  value: string;
}

interface FloatingEventSwitchProps {
  options: FloatingEventSwitchOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

/**
 * FloatingEventSwitch - A subtle, compact pill switch for event selection
 *
 * Features:
 * - Floating pill design with smooth animation
 * - Compact short labels for space efficiency
 * - Subtle background with animated indicator
 */
export const FloatingEventSwitch: React.FC<FloatingEventSwitchProps> = ({
  options,
  selectedValue,
  onValueChange,
}) => {
  const selectedIndex = options.findIndex(o => o.value === selectedValue);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate the width of each option and the indicator offset
  const optionWidth = containerWidth > 0 ? (containerWidth - 6) / options.length : 0; // subtract padding (3px each side)
  const indicatorOffset = selectedIndex * optionWidth;

  useEffect(() => {
    if (containerWidth > 0) {
      Animated.spring(slideAnim, {
        toValue: indicatorOffset,
        useNativeDriver: true,
        tension: 120,
        friction: 12,
      }).start();
    }
  }, [selectedIndex, indicatorOffset, containerWidth]);

  const handlePress = async (value: string) => {
    await Haptics.selectionAsync();
    onValueChange(value);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pillContainer} onLayout={handleLayout}>
        {/* Animated indicator */}
        {containerWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: optionWidth,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          />
        )}

        {/* Options */}
        {options.map((option) => {
          const isSelected = option.value === selectedValue;

          return (
            <TouchableOpacity
              key={option.value}
              style={styles.option}
              onPress={() => handlePress(option.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.label}
            >
              <IOSText
                style={[
                  styles.optionText,
                  isSelected && styles.selectedText,
                ]}
                numberOfLines={1}
              >
                {option.shortLabel}
              </IOSText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F5',
    borderRadius: 20,
    padding: 3,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default FloatingEventSwitch;
