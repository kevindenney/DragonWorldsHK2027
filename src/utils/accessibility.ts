import React from 'react';
import { Platform, AccessibilityInfo } from 'react-native';

export interface AccessibilityConfig {
  label?: string;
  hint?: string;
  role?: 'button' | 'header' | 'link' | 'text' | 'image' | 'adjustable' | 'summary';
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
  };
  value?: {
    text?: string;
    min?: number;
    max?: number;
    now?: number;
  };
  ignoresInvertColors?: boolean;
}

export class AccessibilityManager {
  private screenReaderEnabled: boolean = false;
  private reduceMotionEnabled: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    try {
      // Check if screen reader is enabled
      this.screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Check if reduce motion is enabled
      this.reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      
      // Listen for accessibility changes
      AccessibilityInfo.addEventListener('screenReaderChanged', this.handleScreenReaderChange.bind(this));
      AccessibilityInfo.addEventListener('reduceMotionChanged', this.handleReduceMotionChange.bind(this));
      
      this.isInitialized = true;
      console.log(`Accessibility initialized - Screen reader: ${this.screenReaderEnabled}, Reduce motion: ${this.reduceMotionEnabled}`);
    } catch (error) {
      console.warn('Failed to initialize accessibility:', error);
    }
  }

  private handleScreenReaderChange(isEnabled: boolean): void {
    this.screenReaderEnabled = isEnabled;
    console.log(`Screen reader changed: ${isEnabled}`);
  }

  private handleReduceMotionChange(isEnabled: boolean): void {
    this.reduceMotionEnabled = isEnabled;
    console.log(`Reduce motion changed: ${isEnabled}`);
  }

  // Public getters
  isScreenReaderEnabled(): boolean {
    return this.screenReaderEnabled;
  }

  isReduceMotionEnabled(): boolean {
    return this.reduceMotionEnabled;
  }

  isAccessibilityEnabled(): boolean {
    return this.screenReaderEnabled;
  }

  // Helper functions for creating accessible components
  createAccessibilityProps(config: AccessibilityConfig) {
    const props: any = {};

    if (config.label) {
      props.accessibilityLabel = config.label;
    }

    if (config.hint) {
      props.accessibilityHint = config.hint;
    }

    if (config.role) {
      props.accessibilityRole = config.role;
    }

    if (config.state) {
      props.accessibilityState = config.state;
    }

    if (config.value) {
      props.accessibilityValue = config.value;
    }

    if (config.ignoresInvertColors !== undefined) {
      props.accessibilityIgnoresInvertColors = config.ignoresInvertColors;
    }

    // Always make elements accessible
    props.accessible = true;

    return props;
  }

  // Specialized helpers for common UI patterns
  createButtonProps(label: string, hint?: string, disabled?: boolean) {
    return this.createAccessibilityProps({
      label,
      hint,
      role: 'button',
      state: { disabled }
    });
  }

  createHeaderProps(text: string) {
    return this.createAccessibilityProps({
      label: text,
      role: 'header'
    });
  }

  createLinkProps(label: string, hint?: string) {
    return this.createAccessibilityProps({
      label,
      hint,
      role: 'link'
    });
  }

  createImageProps(description: string, ignoreInvert: boolean = false) {
    return this.createAccessibilityProps({
      label: description,
      role: 'image',
      ignoresInvertColors: ignoreInvert
    });
  }

  createAdjustableProps(label: string, min: number, max: number, current: number, hint?: string) {
    return this.createAccessibilityProps({
      label,
      hint,
      role: 'adjustable',
      value: { min, max, now: current }
    });
  }

  createToggleProps(label: string, isOn: boolean, hint?: string) {
    return this.createAccessibilityProps({
      label,
      hint,
      role: 'button',
      state: { checked: isOn }
    });
  }

  createExpandableProps(label: string, isExpanded: boolean, hint?: string) {
    return this.createAccessibilityProps({
      label,
      hint,
      role: 'button',
      state: { expanded: isExpanded }
    });
  }

  // Weather-specific accessibility helpers
  createWeatherConditionProps(temperature: number, conditions: string, windSpeed: number) {
    const label = `Weather: ${temperature} degrees celsius, ${conditions}, wind speed ${windSpeed} knots`;
    return this.createAccessibilityProps({
      label,
      role: 'text'
    });
  }

  createWindDirectionProps(direction: number, speed: number) {
    const compassPoint = this.degreesToCompass(direction);
    const label = `Wind: ${speed} knots from ${compassPoint}, ${direction} degrees`;
    return this.createAccessibilityProps({
      label,
      role: 'text'
    });
  }

  // Sailing/Racing-specific helpers
  createRaceEventProps(time: string, title: string, location: string, status?: string) {
    let label = `Race at ${time}: ${title} at ${location}`;
    if (status) {
      label += `, status: ${status}`;
    }
    return this.createAccessibilityProps({
      label,
      role: 'button',
      hint: 'Tap for more details'
    });
  }

  createResultsProps(position: number, boat: string, points?: number) {
    let label = `Position ${position}: ${boat}`;
    if (points !== undefined) {
      label += `, ${points} points`;
    }
    return this.createAccessibilityProps({
      label,
      role: 'text'
    });
  }

  createNavigationTabProps(tabName: string, isSelected: boolean) {
    return this.createAccessibilityProps({
      label: `${tabName} tab`,
      role: 'button',
      state: { selected: isSelected },
      hint: `Navigate to ${tabName} screen`
    });
  }

  // Utility functions
  private degreesToCompass(degrees: number): string {
    const directions = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  formatTimeForAccessibility(time: string): string {
    // Convert "14:30" to "2:30 PM" or similar accessible format
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return time;
    }
  }

  formatNumberForAccessibility(num: number, unit?: string): string {
    const rounded = Math.round(num * 10) / 10; // Round to 1 decimal place
    return `${rounded}${unit ? ` ${unit}` : ''}`;
  }

  // Animation helpers for reduced motion
  shouldReduceMotion(): boolean {
    return this.reduceMotionEnabled;
  }

  getAnimationDuration(defaultDuration: number): number {
    return this.reduceMotionEnabled ? 0 : defaultDuration;
  }

  // Focus management
  async announceForAccessibility(message: string): Promise<void> {
    try {
      await AccessibilityInfo.announceForAccessibility(message);
    } catch (error) {
      console.warn('Failed to announce for accessibility:', error);
    }
  }

  async announceImportantChange(message: string): Promise<void> {
    // Use announceForAccessibility for important updates like race starts, weather alerts
    if (this.screenReaderEnabled) {
      await this.announceForAccessibility(message);
    }
  }

  // Screen reader optimized content
  createScreenReaderContent(regularText: string, screenReaderText: string): string {
    return this.screenReaderEnabled ? screenReaderText : regularText;
  }

  // Cleanup
  destroy(): void {
    AccessibilityInfo.removeEventListener('screenReaderChanged', this.handleScreenReaderChange);
    AccessibilityInfo.removeEventListener('reduceMotionChanged', this.handleReduceMotionChange);
  }
}

// Create and export singleton instance
export const accessibility = new AccessibilityManager();

// Export convenience hook for React components
export function useAccessibility() {
  return accessibility;
}

// Higher-order component for adding accessibility
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>,
  config: AccessibilityConfig
) {
  return React.forwardRef<any, P>((props, ref) => {
    const accessibilityProps = accessibility.createAccessibilityProps(config);
    return React.createElement(Component, { ...props, ...accessibilityProps, ref });
  });
}

export default accessibility;