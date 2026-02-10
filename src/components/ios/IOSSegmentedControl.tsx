import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';
import { IOSText } from './IOSText';

export interface IOSSegmentedControlOption {
  label: string;
  value: string;
}

export interface IOSSegmentedControlProps {
  options?: IOSSegmentedControlOption[];
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  // Alternative API for simpler usage
  values?: string[];
  selectedIndex?: number;
  onChange?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

export const IOSSegmentedControl: React.FC<IOSSegmentedControlProps> = ({
  options = [],
  selectedValue,
  onValueChange,
  // Alternative API props
  values,
  selectedIndex,
  onChange,
  style
}) => {
  // Support both APIs: convert values/selectedIndex/onChange to options/selectedValue/onValueChange
  const normalizedOptions: IOSSegmentedControlOption[] = values
    ? values.map(v => ({ label: v, value: v }))
    : options;

  const normalizedSelectedValue = values && selectedIndex !== undefined
    ? values[selectedIndex]
    : selectedValue;

  const handlePress = (value: string, index: number) => {
    if (values && onChange) {
      onChange(index);
    } else if (onValueChange) {
      onValueChange(value);
    }
  };

  if (!normalizedOptions.length) return null;

  return (
    <View style={[styles.container, style]}>
      {normalizedOptions.map((option, index) => {
        const isSelected = option.value === normalizedSelectedValue;
        const isFirst = index === 0;
        const isLast = index === normalizedOptions.length - 1;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              isSelected && styles.selectedSegment,
              isFirst && styles.firstSegment,
              isLast && styles.lastSegment
            ]}
            onPress={() => handlePress(option.value, index)}
            activeOpacity={0.6}
          >
            <Animated.View style={styles.segmentContent}>
              <IOSText
                style={[
                  styles.segmentText,
                  isSelected && styles.selectedSegmentText
                ]}
                numberOfLines={1}
              >
                {option.label}
              </IOSText>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 12,
    gap: 8, // Space between tabs
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44,
    backgroundColor: '#FFFFFF', // Unselected: white background
    borderWidth: 1,
    borderColor: '#E0E0E0', // Unselected: light gray border
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSegment: {
    backgroundColor: '#E3F2FD', // Selected: light blue background
    borderWidth: 2, // Selected: thicker border
    borderColor: '#0066CC', // Selected: darker blue border
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  firstSegment: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  lastSegment: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '400', // Unselected: normal weight
    color: '#666666', // Unselected: gray text
    textAlign: 'center',
  },
  selectedSegmentText: {
    fontWeight: '600', // Selected: semi-bold weight
    color: '#0066CC', // Selected: darker blue text
    fontSize: 14,
  },
});