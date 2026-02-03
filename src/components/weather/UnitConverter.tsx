/**
 * UnitConverter Component
 * 
 * Living Document Implementation:
 * A comprehensive unit conversion system for weather data with persistent user preferences.
 * Handles temperature (C/F), wind speed (KPH/KTS), pressure, and distance conversions
 * with Google Weather-style toggle interface.
 * 
 * Features:
 * - Temperature: Celsius ↔ Fahrenheit conversion
 * - Wind Speed: KPH ↔ Knots conversion  
 * - Pressure: hPa, inHg, mmHg options
 * - Distance: Metric/Imperial for visibility and wave height
 * - Persistent user preferences via AsyncStorage
 * - Real-time conversion throughout app
 * - iOS-style toggle switches
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Platform,
  Switch 
} from 'react-native';
import { 
  Settings, 
  Thermometer,
  Wind,
  Gauge,
  Eye,
  Waves,
  RotateCcw,
  Check
} from 'lucide-react-native';
import { IOSText } from '../ios';
import { colors, typography, spacing } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Unit types and conversion interfaces
export type TemperatureUnit = 'C' | 'F';
export type WindSpeedUnit = 'kts' | 'kph' | 'mph';
export type PressureUnit = 'hPa' | 'inHg' | 'mmHg';
export type DistanceUnit = 'metric' | 'imperial'; // km/m vs mi/ft

export interface WeatherUnits {
  temperature: TemperatureUnit;
  windSpeed: WindSpeedUnit;
  pressure: PressureUnit;
  distance: DistanceUnit;
}

export interface UnitConverterProps {
  onUnitsChange: (units: WeatherUnits) => void;
  initialUnits?: WeatherUnits;
  showModal?: boolean;
  onClose?: () => void;
}

// Default units
const DEFAULT_UNITS: WeatherUnits = {
  temperature: 'C',
  windSpeed: 'kts',
  pressure: 'hPa',
  distance: 'metric'
};

// Storage key for persisting units
const UNITS_STORAGE_KEY = 'dragon_worlds_weather_units';

// Conversion utility functions
export const convertTemperature = (celsius: number, to: TemperatureUnit): number => {
  if (to === 'F') {
    return Math.round(celsius * 9/5 + 32);
  }
  return Math.round(celsius);
};

export const convertWindSpeed = (knots: number, to: WindSpeedUnit): number => {
  switch (to) {
    case 'kph':
      return Math.round(knots * 1.852);
    case 'mph':
      return Math.round(knots * 1.15078);
    case 'kts':
    default:
      return Math.round(knots);
  }
};

export const convertPressure = (hPa: number, to: PressureUnit): number => {
  switch (to) {
    case 'inHg':
      return Math.round(hPa * 0.02953 * 100) / 100;
    case 'mmHg':
      return Math.round(hPa * 0.750062);
    case 'hPa':
    default:
      return Math.round(hPa);
  }
};

export const convertDistance = (km: number, to: DistanceUnit): number => {
  if (to === 'imperial') {
    return Math.round(km * 0.621371 * 10) / 10; // miles
  }
  return Math.round(km * 10) / 10; // kilometers
};

export const convertWaveHeight = (meters: number, to: DistanceUnit): number => {
  if (to === 'imperial') {
    return Math.round(meters * 3.28084 * 10) / 10; // feet
  }
  return Math.round(meters * 10) / 10; // meters
};

// Get unit labels
export const getTemperatureLabel = (unit: TemperatureUnit) => unit === 'C' ? '°C' : '°F';
export const getWindSpeedLabel = (unit: WindSpeedUnit) => unit;
export const getPressureLabel = (unit: PressureUnit) => unit;
export const getDistanceLabel = (unit: DistanceUnit) => unit === 'metric' ? 'km' : 'mi';
export const getWaveHeightLabel = (unit: DistanceUnit) => unit === 'metric' ? 'm' : 'ft';

interface UnitOptionProps {
  title: string;
  icon: React.ReactNode;
  currentValue: string;
  options: Array<{ value: string; label: string; description: string }>;
  onSelect: (value: string) => void;
}

const UnitOption: React.FC<UnitOptionProps> = ({
  title,
  icon,
  currentValue,
  options,
  onSelect
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.unitSection}>
      <TouchableOpacity 
        style={styles.unitHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.unitHeaderContent}>
          {icon}
          <IOSText style={styles.unitTitle}>{title}</IOSText>
        </View>
        <View style={styles.currentValue}>
          <IOSText style={styles.currentValueText}>
            {options.find(o => o.value === currentValue)?.label || currentValue}
          </IOSText>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.optionsContainer}>
          {options.map((option) => {
            const isSelected = option.value === currentValue;
            
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionItem, isSelected && styles.selectedOption]}
                onPress={() => {
                  onSelect(option.value);
                  setExpanded(false);
                }}
              >
                <View style={styles.optionContent}>
                  <IOSText style={[
                    styles.optionLabel,
                    isSelected && styles.selectedOptionLabel
                  ]}>
                    {option.label}
                  </IOSText>
                  <IOSText style={[
                    styles.optionDescription,
                    isSelected && styles.selectedOptionDescription
                  ]}>
                    {option.description}
                  </IOSText>
                </View>
                {isSelected && (
                  <Check size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export const UnitConverter: React.FC<UnitConverterProps> = ({
  onUnitsChange,
  initialUnits,
  showModal = false,
  onClose
}) => {
  const [units, setUnits] = useState<WeatherUnits>(initialUnits || DEFAULT_UNITS);
  const [loading, setLoading] = useState(true);

  // Load saved units on component mount
  useEffect(() => {
    loadUnitsFromStorage();
  }, []);

  // Save units whenever they change
  useEffect(() => {
    if (!loading) {
      saveUnitsToStorage(units);
      onUnitsChange(units);
    }
  }, [units, loading, onUnitsChange]);

  const loadUnitsFromStorage = async () => {
    try {
      const savedUnits = await AsyncStorage.getItem(UNITS_STORAGE_KEY);
      if (savedUnits) {
        const parsedUnits = JSON.parse(savedUnits);
        setUnits({ ...DEFAULT_UNITS, ...parsedUnits });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const saveUnitsToStorage = async (newUnits: WeatherUnits) => {
    try {
      await AsyncStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(newUnits));
    } catch (error) {
    }
  };

  const handleUnitChange = <K extends keyof WeatherUnits>(
    key: K, 
    value: WeatherUnits[K]
  ) => {
    setUnits(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Units',
      'Reset all units to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setUnits(DEFAULT_UNITS)
        }
      ]
    );
  };

  const temperatureOptions = [
    { value: 'C', label: 'Celsius (°C)', description: 'Standard metric temperature' },
    { value: 'F', label: 'Fahrenheit (°F)', description: 'Imperial temperature scale' }
  ];

  const windSpeedOptions = [
    { value: 'kts', label: 'Knots', description: 'Nautical miles per hour (sailing standard)' },
    { value: 'kph', label: 'KPH', description: 'Kilometers per hour' },
    { value: 'mph', label: 'MPH', description: 'Miles per hour' }
  ];

  const pressureOptions = [
    { value: 'hPa', label: 'hPa', description: 'Hectopascals (meteorological standard)' },
    { value: 'inHg', label: 'inHg', description: 'Inches of mercury' },
    { value: 'mmHg', label: 'mmHg', description: 'Millimeters of mercury' }
  ];

  const distanceOptions = [
    { value: 'metric', label: 'Metric', description: 'Kilometers and meters' },
    { value: 'imperial', label: 'Imperial', description: 'Miles and feet' }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <IOSText style={styles.loadingText}>Loading unit preferences...</IOSText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Settings size={24} color={colors.primary} />
          <IOSText style={styles.headerTitle}>Units & Display</IOSText>
        </View>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IOSText style={styles.closeButtonText}>Done</IOSText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* Temperature */}
        <UnitOption
          title="Temperature"
          icon={<Thermometer size={20} color={colors.warning} />}
          currentValue={units.temperature}
          options={temperatureOptions}
          onSelect={(value) => handleUnitChange('temperature', value as TemperatureUnit)}
        />

        {/* Wind Speed */}
        <UnitOption
          title="Wind Speed"
          icon={<Wind size={20} color={colors.accent} />}
          currentValue={units.windSpeed}
          options={windSpeedOptions}
          onSelect={(value) => handleUnitChange('windSpeed', value as WindSpeedUnit)}
        />

        {/* Pressure */}
        <UnitOption
          title="Atmospheric Pressure"
          icon={<Gauge size={20} color={colors.info} />}
          currentValue={units.pressure}
          options={pressureOptions}
          onSelect={(value) => handleUnitChange('pressure', value as PressureUnit)}
        />

        {/* Distance */}
        <UnitOption
          title="Distance & Wave Height"
          icon={<Waves size={20} color={colors.primary} />}
          currentValue={units.distance}
          options={distanceOptions}
          onSelect={(value) => handleUnitChange('distance', value as DistanceUnit)}
        />

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <RotateCcw size={16} color={colors.textSecondary} />
          <IOSText style={styles.resetButtonText}>Reset to Defaults</IOSText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  loadingText: {
    ...typography.body2,
    color: colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerTitle: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },

  closeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },

  closeButtonText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
    padding: spacing.lg,
  },

  // Unit Sections
  unitSection: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },

  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },

  unitHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  unitTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },

  currentValue: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
  },

  currentValueText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // Options
  optionsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },

  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  selectedOption: {
    backgroundColor: colors.primary + '05',
  },

  optionContent: {
    flex: 1,
  },

  optionLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },

  selectedOptionLabel: {
    color: colors.primary,
  },

  optionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  selectedOptionDescription: {
    color: colors.primary,
    opacity: 0.8,
  },

  // Reset Button
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
  },

  resetButtonText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});

/**
 * Living Document Export Notes:
 * 
 * This UnitConverter provides comprehensive unit management for weather data:
 * 
 * - Persistent Preferences: AsyncStorage integration for user settings
 * - Comprehensive Units: Temperature, wind, pressure, and distance support
 * - Marine Focus: Knots as primary wind unit, wave height conversions
 * - Real-time Updates: Immediate unit changes throughout the app
 * - Accessibility: Clear labels and descriptions for all options
 * - iOS Design: Native-style option selection and toggles
 * 
 * Future enhancements:
 * - Regional unit defaults based on user location
 * - Advanced marine units (nautical miles, fathoms)
 * - Unit conversion animations and feedback
 * - Integration with device locale settings
 * - Sailing-specific unit recommendations
 */