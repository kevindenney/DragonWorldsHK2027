import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  MapPin,
  Clock,
  ChevronDown,
  Check,
} from 'lucide-react-native';

import { IOSText } from '../../ios';
import { locationWeatherService } from '../../../services/locationWeatherService';
import type { LocationData } from '../../../stores/weatherStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ModernWeatherTopBarProps {
  selectedLocation: LocationData | null;
  selectedDate: Date;
  selectedTime: Date;
  onLocationChange: (location: LocationData) => void;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
  isLoading?: boolean;
  error?: string | null;
}

// Get sailing locations from the service
const SAILING_LOCATIONS: LocationData[] = locationWeatherService.getSailingLocations().map(loc => ({
  id: loc.id,
  name: loc.name,
  coordinate: loc.coordinate,
  type: loc.type || 'race-area',
}));

// Generate time options (every hour from 00:00 to 23:00)
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

// Generate next 14 days for date selection
const generateDateOptions = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

const formatDate = (date: Date): string => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) {
    return 'Today';
  }
  
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short'
  };
  return date.toLocaleDateString('en-US', options);
};

const formatDateNumber = (date: Date): string => {
  return date.getDate().toString();
};

const formatTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleTimeString('en-US', options);
};

export const ModernWeatherTopBar: React.FC<ModernWeatherTopBarProps> = ({
  selectedLocation,
  selectedDate,
  selectedTime,
  onLocationChange,
  onDateChange,
  onTimeChange,
  isLoading = false,
  error = null,
}) => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const dateOptions = generateDateOptions();

  const handleLocationSelect = (location: LocationData) => {
    onLocationChange(location);
    setShowLocationModal(false);
  };

  const handleTimeSelect = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newTime = new Date(selectedTime);
    newTime.setHours(hours, minutes, 0, 0);
    onTimeChange(newTime);
    setShowTimeModal(false);
  };


  const DateButton: React.FC<{
    date: Date;
    isSelected: boolean;
    onPress: () => void;
  }> = ({ date, isSelected, onPress }) => {
    const pressAnimation = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 1 - pressAnimation.value * 0.05 }],
    }));

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.dateButton,
            isSelected && styles.dateButtonSelected
          ]}
          onPress={onPress}
          onPressIn={() => {
            pressAnimation.value = withSpring(1);
          }}
          onPressOut={() => {
            pressAnimation.value = withSpring(0);
          }}
          activeOpacity={0.7}
        >
          <IOSText style={[
            styles.dateLabel,
            isSelected && styles.dateLabelSelected
          ]}>
            {formatDate(date)}
          </IOSText>
          <IOSText style={[
            styles.dateNumber,
            isSelected && styles.dateNumberSelected
          ]}>
            {formatDateNumber(date)}
          </IOSText>
        </TouchableOpacity>
      </Animated.View>
    );
  };


  const renderLocationModal = () => (
    <Modal
      visible={showLocationModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLocationModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowLocationModal(false)}
      >
        <Animated.View
          entering={FadeInDown.springify()}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <IOSText style={styles.modalTitle}>Select Location</IOSText>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {SAILING_LOCATIONS.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.modalItem}
                onPress={() => handleLocationSelect(location)}
              >
                <View style={styles.modalItemContent}>
                  <MapPin size={20} color="#007AFF" />
                  <IOSText style={styles.modalItemText}>{location.name}</IOSText>
                  {selectedLocation?.id === location.id && (
                    <Check size={20} color="#007AFF" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

  const renderTimeModal = () => (
    <Modal
      visible={showTimeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTimeModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowTimeModal(false)}
      >
        <Animated.View
          entering={FadeInDown.springify()}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <IOSText style={styles.modalTitle}>Select Time</IOSText>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map((timeString) => {
              const currentTimeString = selectedTime.toTimeString().slice(0, 5);
              const isSelected = currentTimeString === timeString;
              
              return (
                <TouchableOpacity
                  key={timeString}
                  style={styles.modalItem}
                  onPress={() => handleTimeSelect(timeString)}
                >
                  <View style={styles.modalItemContent}>
                    <Clock size={20} color="#FF9500" />
                    <IOSText style={styles.modalItemText}>
                      {new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </IOSText>
                    {isSelected && (
                      <Check size={20} color="#FF9500" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Top Row - Location and Time Selectors */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowLocationModal(true)}
          activeOpacity={0.7}
        >
          <MapPin size={16} color="#007AFF" />
          <IOSText style={styles.selectorText}>
            {selectedLocation?.name || 'Hong Kong Central'}
          </IOSText>
          <ChevronDown size={14} color="#8E8E93" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowTimeModal(true)}
          activeOpacity={0.7}
        >
          <Clock size={16} color="#FF9500" />
          <IOSText style={styles.selectorText}>
            {formatTime(selectedTime)}
          </IOSText>
          <ChevronDown size={14} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Date Selector Row */}
      <View style={styles.dateRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollContent}
        >
          {dateOptions.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <DateButton
                key={index}
                date={date}
                isSelected={isSelected}
                onPress={() => onDateChange(date)}
              />
            );
          })}
        </ScrollView>
      </View>

      {renderLocationModal()}
      {renderTimeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(229, 229, 234, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  dateRow: {
    marginBottom: 12,
  },
  dateScrollContent: {
    paddingHorizontal: 16,
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginHorizontal: 4,
  },
  dateButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C757D',
    marginBottom: 2,
  },
  dateLabelSelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  // Loading and error states
  selectorButtonError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFEBEE',
  },
  selectorButtonLoading: {
    opacity: 0.7,
  },
  selectorTextError: {
    color: '#FF3B30',
  },
  selectorTextLoading: {
    color: '#8E8E93',
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderTopColor: '#007AFF',
  },
});
