import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { IOSText } from './IOSText';

export interface IOSSegmentedControlOption {
  label: string;
  value: string;
}

export interface IOSSegmentedControlProps {
  options: IOSSegmentedControlOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: ViewStyle;
}

export const IOSSegmentedControl: React.FC<IOSSegmentedControlProps> = ({
  options,
  selectedValue,
  onValueChange,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;
        
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              isSelected && styles.selectedSegment,
              isFirst && styles.firstSegment,
              isLast && styles.lastSegment
            ]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.7}
          >
            <IOSText
              style={[
                styles.segmentText,
                isSelected && styles.selectedSegmentText
              ]}
            >
              {option.label}
            </IOSText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  selectedSegment: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  firstSegment: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  lastSegment: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#007AFF',
  },
  selectedSegmentText: {
    fontWeight: '600',
    color: '#007AFF',
  },
});