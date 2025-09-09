import React from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export enum HapticFeedbackType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
  IMPACT_LIGHT = 'impactLight',
  IMPACT_MEDIUM = 'impactMedium',
  IMPACT_HEAVY = 'impactHeavy'
}

class HapticManager {
  private isEnabled: boolean = true;
  private isSupported: boolean = Platform.OS === 'ios';

  constructor() {
    this.checkSupport();
  }

  private async checkSupport(): Promise<void> {
    // Check if haptics are supported on this device
    this.isSupported = Platform.OS === 'ios';
    
    // Could add additional device capability checks here
    if (this.isSupported) {
      console.log('Haptic feedback is supported');
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`Haptic feedback ${enabled ? 'enabled' : 'disabled'}`);
  }

  isHapticEnabled(): boolean {
    return this.isEnabled && this.isSupported;
  }

  // Impact feedback for button presses and interactions
  async impact(intensity: HapticFeedbackType = HapticFeedbackType.LIGHT): Promise<void> {
    if (!this.isHapticEnabled()) return;

    try {
      switch (intensity) {
        case HapticFeedbackType.LIGHT:
        case HapticFeedbackType.IMPACT_LIGHT:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case HapticFeedbackType.MEDIUM:
        case HapticFeedbackType.IMPACT_MEDIUM:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case HapticFeedbackType.HEAVY:
        case HapticFeedbackType.IMPACT_HEAVY:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Notification feedback for system events
  async notification(type: 'success' | 'warning' | 'error'): Promise<void> {
    if (!this.isHapticEnabled()) return;

    try {
      switch (type) {
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      console.warn('Haptic notification failed:', error);
    }
  }

  // Selection feedback for picker/tab changes
  async selection(): Promise<void> {
    if (!this.isHapticEnabled()) return;

    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic selection failed:', error);
    }
  }

  // Convenience methods for common interactions
  async buttonPress(): Promise<void> {
    await this.impact(HapticFeedbackType.LIGHT);
  }

  async buttonLongPress(): Promise<void> {
    await this.impact(HapticFeedbackType.MEDIUM);
  }

  async swipeAction(): Promise<void> {
    await this.impact(HapticFeedbackType.LIGHT);
  }

  async pullToRefresh(): Promise<void> {
    await this.impact(HapticFeedbackType.LIGHT);
  }

  async tabChange(): Promise<void> {
    await this.selection();
  }

  async modalOpen(): Promise<void> {
    await this.impact(HapticFeedbackType.MEDIUM);
  }

  async modalClose(): Promise<void> {
    await this.impact(HapticFeedbackType.LIGHT);
  }

  async alertShow(): Promise<void> {
    await this.notification('warning');
  }

  async successAction(): Promise<void> {
    await this.notification('success');
  }

  async errorAction(): Promise<void> {
    await this.notification('error');
  }

  async weatherAlert(): Promise<void> {
    await this.notification('warning');
  }

  async raceStart(): Promise<void> {
    await this.impact(HapticFeedbackType.HEAVY);
  }

  async resultUpdate(): Promise<void> {
    await this.notification('success');
  }

  async connectionEstablished(): Promise<void> {
    await this.notification('success');
  }

  async subscriptionUpgrade(): Promise<void> {
    await this.notification('success');
  }

  // Pattern haptics for specific sailing app contexts
  async windAlert(): Promise<void> {
    if (!this.isHapticEnabled()) return;
    
    // Double tap pattern for wind alerts
    await this.impact(HapticFeedbackType.MEDIUM);
    setTimeout(async () => {
      await this.impact(HapticFeedbackType.MEDIUM);
    }, 100);
  }

  async raceSequence(): Promise<void> {
    if (!this.isHapticEnabled()) return;
    
    // Racing start sequence pattern
    await this.impact(HapticFeedbackType.LIGHT);
    setTimeout(async () => {
      await this.impact(HapticFeedbackType.MEDIUM);
    }, 300);
    setTimeout(async () => {
      await this.impact(HapticFeedbackType.HEAVY);
    }, 600);
  }

  async achievementUnlocked(): Promise<void> {
    if (!this.isHapticEnabled()) return;
    
    // Celebration pattern
    await this.notification('success');
    setTimeout(async () => {
      await this.impact(HapticFeedbackType.MEDIUM);
    }, 150);
  }

  // Utility method for custom patterns
  async customPattern(pattern: Array<{ type: 'impact' | 'notification' | 'selection', intensity?: string, delay?: number }>): Promise<void> {
    if (!this.isHapticEnabled()) return;

    for (let i = 0; i < pattern.length; i++) {
      const step = pattern[i];
      
      if (step.delay && i > 0) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
      }

      switch (step.type) {
        case 'impact':
          await this.impact((step.intensity as HapticFeedbackType) || HapticFeedbackType.LIGHT);
          break;
        case 'notification':
          await this.notification((step.intensity as 'success' | 'warning' | 'error') || 'success');
          break;
        case 'selection':
          await this.selection();
          break;
      }
    }
  }
}

// Create and export singleton instance
export const haptics = new HapticManager();

// Export convenience function for React components
export function useHaptics() {
  return haptics;
}

// HOC for adding haptic feedback to touchable components
export function withHaptics<P extends object>(
  Component: React.ComponentType<P>,
  hapticType: keyof typeof HapticFeedbackType = 'LIGHT'
) {
  return React.forwardRef<any, P & { onPress?: () => void }>((props, ref) => {
    const handlePress = React.useCallback(async () => {
      await haptics.impact(HapticFeedbackType[hapticType]);
      props.onPress?.();
    }, [props.onPress]);

    return React.createElement(Component, { ...props, ref, onPress: handlePress });
  });
}

export default haptics;