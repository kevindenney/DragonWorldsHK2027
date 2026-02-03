/**
 * Walkthrough Steps Configuration
 *
 * Defines all coach mark steps for each walkthrough sequence.
 * Steps are shown in order and reference target elements by ID.
 */

import type { WalkthroughSequence } from '../stores/walkthroughStore';

// Position of the tooltip relative to the target element
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

// Individual step configuration
export interface WalkthroughStep {
  id: string;
  targetId: string; // ID of the registered target element
  title: string;
  description: string;
  position: TooltipPosition;
  // Optional: highlight without requiring a registered target
  // (useful for full-screen hints)
  isFullScreen?: boolean;
  // Optional: action button text
  actionText?: string;
}

// Sequence configuration
export interface SequenceConfig {
  id: WalkthroughSequence;
  title: string;
  steps: WalkthroughStep[];
}

// All walkthrough sequences and their steps
export const WALKTHROUGH_SEQUENCES: Record<WalkthroughSequence, SequenceConfig> = {
  schedule: {
    id: 'schedule',
    title: 'Schedule Tour',
    steps: [
      {
        id: 'schedule-welcome',
        targetId: 'schedule-header',
        title: 'Welcome to Dragon Worlds',
        description: 'View the full event schedule and never miss a race.',
        position: 'bottom',
      },
      {
        id: 'schedule-event-switch',
        targetId: 'event-switch',
        title: 'Switch Events',
        description: 'Toggle between APAC Championships and World Championships.',
        position: 'bottom',
      },
      {
        id: 'schedule-date-picker',
        targetId: 'date-picker',
        title: 'Navigate Days',
        description: 'Scroll to select different days of the regatta.',
        position: 'bottom',
      },
      {
        id: 'schedule-activities',
        targetId: 'schedule-content',
        title: 'Daily Activities',
        description: 'View races, social events, and other activities for each day.',
        position: 'top',
      },
      {
        id: 'schedule-activity-detail',
        targetId: 'activity-item',
        title: 'Activity Details',
        description: 'Tap any activity to see full details, location, and add to your calendar.',
        position: 'top',
      },
      {
        id: 'schedule-more-features',
        targetId: 'tab-bar-more',
        title: 'Explore More',
        description: 'Find Notices, Results, Forms, Boat Tracking, and Sponsors in the More tab.',
        position: 'top',
      },
    ],
  },

  notices: {
    id: 'notices',
    title: 'Notice Board Tour',
    steps: [
      {
        id: 'notices-intro',
        targetId: 'notices-header',
        title: 'Official Notices',
        description: 'Stay up to date with official race communications.',
        position: 'bottom',
      },
      {
        id: 'notices-filters',
        targetId: 'notices-filters',
        title: 'Filter Notices',
        description: 'Filter by category to find specific types of notices.',
        position: 'bottom',
      },
      {
        id: 'notices-card',
        targetId: 'notices-list',
        title: 'View Details',
        description: 'Tap any notice to view the full document.',
        position: 'top',
      },
    ],
  },

  results: {
    id: 'results',
    title: 'Results Tour',
    steps: [
      {
        id: 'results-intro',
        targetId: 'results-header',
        title: 'Race Results',
        description: 'Track standings and individual race results.',
        position: 'bottom',
      },
      {
        id: 'results-standings',
        targetId: 'results-standings',
        title: 'Overall Standings',
        description: 'View current championship standings and points.',
        position: 'bottom',
      },
      {
        id: 'results-competitor',
        targetId: 'results-list',
        title: 'Competitor Details',
        description: 'Tap a competitor to see their full race history.',
        position: 'top',
      },
    ],
  },

  map: {
    id: 'map',
    title: 'Map Tour',
    steps: [
      {
        id: 'map-intro',
        targetId: 'map-container',
        title: 'Interactive Map',
        description: 'Explore race venues, facilities, and weather conditions.',
        position: 'center',
        isFullScreen: true,
      },
      {
        id: 'map-markers',
        targetId: 'map-container',
        title: 'Location Markers',
        description: 'Tap markers to view details about each venue.',
        position: 'center',
        isFullScreen: true,
      },
      {
        id: 'map-controls',
        targetId: 'map-controls',
        title: 'Map Controls',
        description: 'Toggle weather overlays and location filters.',
        position: 'left',
      },
    ],
  },

  weather: {
    id: 'weather',
    title: 'Weather Tour',
    steps: [
      {
        id: 'weather-current',
        targetId: 'weather-current',
        title: 'Current Conditions',
        description: 'View real-time weather at the race venue.',
        position: 'bottom',
      },
      {
        id: 'weather-forecast',
        targetId: 'weather-forecast',
        title: 'Hourly Forecast',
        description: 'Plan your racing with detailed hourly predictions.',
        position: 'bottom',
      },
      {
        id: 'weather-tide',
        targetId: 'weather-tide',
        title: 'Tide Information',
        description: 'Check tide times and current patterns.',
        position: 'top',
      },
    ],
  },

  forms: {
    id: 'forms',
    title: 'Forms Tour',
    steps: [
      {
        id: 'forms-intro',
        targetId: 'forms-header',
        title: 'Race Forms',
        description: 'Access and submit official race documentation.',
        position: 'bottom',
      },
      {
        id: 'forms-list',
        targetId: 'forms-list',
        title: 'Available Forms',
        description: 'Tap to view or submit any required form.',
        position: 'top',
      },
    ],
  },

  more: {
    id: 'more',
    title: 'More Options Tour',
    steps: [
      {
        id: 'more-intro',
        targetId: 'more-header',
        title: 'More Options',
        description: 'Access additional features and settings.',
        position: 'bottom',
      },
      {
        id: 'more-profile',
        targetId: 'more-profile',
        title: 'Your Profile',
        description: 'Manage your account and preferences.',
        position: 'left',
      },
      {
        id: 'more-app-info',
        targetId: 'more-app-section',
        title: 'App Information',
        description: 'View data sources and learn more about RegattaFlow.',
        position: 'top',
      },
    ],
  },
};

// Helper to get steps for a sequence
export function getSequenceSteps(sequence: WalkthroughSequence): WalkthroughStep[] {
  return WALKTHROUGH_SEQUENCES[sequence]?.steps || [];
}

// Helper to get total step count for a sequence
export function getSequenceStepCount(sequence: WalkthroughSequence): number {
  return WALKTHROUGH_SEQUENCES[sequence]?.steps.length || 0;
}

// Helper to get a specific step
export function getStep(
  sequence: WalkthroughSequence,
  stepIndex: number
): WalkthroughStep | null {
  const steps = getSequenceSteps(sequence);
  return steps[stepIndex] || null;
}

// Primary sequences that should be shown to new users
export const PRIMARY_SEQUENCES: WalkthroughSequence[] = [
  'schedule',
  'notices',
  'results',
  'map',
];
