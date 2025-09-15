import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from '../../../utils/reanimatedWrapper';
import {
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  Check,
} from 'lucide-react-native';

import { IOSText } from '../../ios';
import { locationWeatherService } from '../../../services/locationWeatherService';
import type { LocationData } from '../../../stores/weatherStore';

interface WeatherControlsHeaderProps {
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
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

const formatTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleTimeString('en-US', options);
};

export const WeatherControlsHeader: React.FC<WeatherControlsHeaderProps> = ({
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
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const animatePress = useSharedValue(0);

  const dateOptions = generateDateOptions();
  const isDateWithinOWMWindow = (date: Date) => {
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - date.getTime());
    return diffMs <= 5.01 * 24 * 60 * 60 * 1000; // ~5 days
  };

  const handleLocationSelect = (location: LocationData) => {
    onLocationChange(location);
    setShowLocationModal(false);
  };

  const handleDateSelect = (date: Date) => {
    onDateChange(date);
    setShowDateModal(false);
  };

  const handleTimeSelect = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newTime = new Date(selectedTime);
    newTime.setHours(hours, minutes, 0, 0);
    onTimeChange(newTime);
    setShowTimeModal(false);
  };

  const SelectorButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    isLoading?: boolean;
    hasError?: boolean;
  }> = ({ icon, label, onPress, isLoading = false, hasError = false }) => {
    const pressAnimation = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 1 - pressAnimation.value * 0.05 }],
    }));

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            hasError && styles.selectorButtonError,
            isLoading && styles.selectorButtonLoading
          ]}
          onPress={onPress}
          onPressIn={() => {
            pressAnimation.value = withSpring(1);
          }}
          onPressOut={() => {
            pressAnimation.value = withSpring(0);
          }}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <View style={styles.selectorContent}>
            {isLoading ? (
              <View style={styles.loadingSpinner} />
            ) : (
              icon
            )}
            <IOSText style={[
              styles.selectorText,
              hasError && styles.selectorTextError,
              isLoading && styles.selectorTextLoading
            ]}>
              {isLoading ? 'Loading...' : label}
            </IOSText>
            {!isLoading && <ChevronDown size={12} color="#6C757D" />}
          </View>
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

  const renderDateModal = () => (
    <Modal
      visible={showDateModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDateModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowDateModal(false)}
      >
        <Animated.View
          entering={FadeInDown.springify()}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <IOSText style={styles.modalTitle}>Select Date</IOSText>
            <IOSText style={{ marginTop: 8, fontSize: 12, color: '#6C757D', textAlign: 'center' }}>
              Dates older than 5 days use Open‑Meteo (waves) and NOAA (tides). OpenWeatherMap historical is disabled beyond 5 days.
            </IOSText>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {dateOptions.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalItem}
                onPress={() => handleDateSelect(date)}
              >
                <View style={styles.modalItemContent}>
                  <Calendar size={20} color="#007AFF" />
                  <IOSText 
                    style={[
                      styles.modalItemText,
                      !isDateWithinOWMWindow(date) && { color: '#8E8E93' }
                    ]}
                  >
                    {formatDate(date)}
                    {!isDateWithinOWMWindow(date) && '  (older than 5 days)'}
                  </IOSText>
                  {selectedDate.toDateString() === date.toDateString() && (
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
                    <Clock size={20} color="#007AFF" />
                    <IOSText style={styles.modalItemText}>
                      {new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </IOSText>
                    {isSelected && (
                      <Check size={20} color="#007AFF" />
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
      <View style={styles.controlsRow}>
        <SelectorButton
          icon={<MapPin size={14} color="#007AFF" />}
          label={(selectedLocation?.name?.split(' ')[0]) || 'Select Location'}
          onPress={() => setShowLocationModal(true)}
          isLoading={isLoading}
          hasError={!!error}
        />
        
        <SelectorButton
          icon={<Calendar size={14} color="#34C759" />}
          label={formatDate(selectedDate)}
          onPress={() => setShowDateModal(true)}
          isLoading={isLoading}
          hasError={!!error}
        />
        
        <SelectorButton
          icon={<Clock size={14} color="#FF9500" />}
          label={formatTime(selectedTime)}
          onPress={() => setShowTimeModal(true)}
          isLoading={isLoading}
          hasError={!!error}
        />
      </View>

      {renderLocationModal()}
      {renderDateModal()}
      {renderTimeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  selectorButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  selectorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    letterSpacing: 0.1,
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
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderTopColor: '#007AFF',
    // Note: In a real implementation, you'd use an actual spinner component
  },
});