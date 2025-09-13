import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OneHandedSettings {
  enabled: boolean;
  thumbSide: 'left' | 'right';
  reachableHeight: number; // pixels from bottom
}

export function useOneHandedMode() {
  const [settings, setSettings] = useState<OneHandedSettings>({
    enabled: false,
    thumbSide: 'right',
    reachableHeight: 400,
  });

  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadSettings();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('oneHandedMode');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load one-handed mode settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<OneHandedSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      await AsyncStorage.setItem('oneHandedMode', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save one-handed mode settings:', error);
    }
  };

  const isReachable = (yPosition: number): boolean => {
    if (!settings.enabled) return true;
    
    const bottomDistance = screenDimensions.height - yPosition;
    return bottomDistance <= settings.reachableHeight;
  };

  const getOptimalPosition = (elementHeight: number = 60): number => {
    if (!settings.enabled) return 0;
    
    // Position elements in the thumb-reachable zone
    const maxY = screenDimensions.height - settings.reachableHeight;
    const minY = screenDimensions.height - elementHeight - 100; // Leave some padding
    
    return Math.max(minY, maxY);
  };

  const getThumbZoneStyles = () => {
    if (!settings.enabled) return {};

    return {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: settings.reachableHeight,
      zIndex: 1000,
    };
  };

  const shouldUseCompactLayout = (): boolean => {
    return settings.enabled && screenDimensions.height > 700;
  };

  return {
    settings,
    updateSettings,
    isReachable,
    getOptimalPosition,
    getThumbZoneStyles,
    shouldUseCompactLayout,
    isOneHandedEnabled: settings.enabled,
    screenDimensions,
  };
}