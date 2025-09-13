import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IOSSegmentedControl, IOSSegmentedControlOption } from '../ios/IOSSegmentedControl';

export interface EventSelectorProps {
  selectedEvent: string;
  onEventChange: (eventId: string) => void;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  selectedEvent,
  onEventChange,
}) => {
  const options: IOSSegmentedControlOption[] = [
    {
      label: 'World Championship',
      value: 'world-championship'
    },
    {
      label: 'Asia Pacific Championships',
      value: 'asia-pacific-championships'
    }
  ];

  return (
    <View style={styles.container}>
      <IOSSegmentedControl
        options={options}
        selectedValue={selectedEvent}
        onValueChange={onEventChange}
        style={styles.segmentedControl}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  segmentedControl: {
    marginHorizontal: 8,
  },
});