import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, Animated } from 'react-native';
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
            activeOpacity={0.6}
          >
            <Animated.View style={styles.segmentContent}>
              <IOSText
                style={[
                  styles.segmentText,
                  isSelected && styles.selectedSegmentText
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
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
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44,
  },
  segmentContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSegment: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
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
    fontWeight: '500',
    color: '#007AFF',
    textAlign: 'center',
  },
  selectedSegmentText: {
    fontWeight: '700',
    color: '#007AFF',
    fontSize: 14,
  },
});