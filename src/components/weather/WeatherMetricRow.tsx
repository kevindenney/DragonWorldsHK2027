import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IOSText } from '../ios/IOSText';
import { LucideIcon } from 'lucide-react-native';

interface WeatherMetricRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  showSeparator?: boolean;
}

export const WeatherMetricRow: React.FC<WeatherMetricRowProps> = ({
  icon: Icon,
  label,
  value,
  showSeparator = true
}) => {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <IOSText textStyle="body" color="label" style={styles.label}>
            {label}
          </IOSText>
        </View>
        
        <View style={styles.valueContainer}>
          <IOSText textStyle="body" weight="medium" color="label" style={styles.value}>
            {value}
          </IOSText>
        </View>
      </View>
      
      {showSeparator && <View style={styles.separator} />}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    color: '#000000',
    fontSize: 17,
  },
  valueContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  value: {
    color: '#8E8E93',
    fontSize: 17,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C7C7CC',
    marginLeft: 20,
  },
});