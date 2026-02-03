/**
 * Centralized Event Constants
 *
 * Single source of truth for event IDs and metadata.
 * Used throughout the app for event selection and display.
 */

export interface EventDefinition {
  id: string;
  name: string;
  shortName: string;
  location: string;
  dates: string;
  year: number;
}

export const EVENTS = {
  APAC_2026: {
    id: 'asia-pacific-2026',
    name: 'Asia Pacific Championships 2026',
    shortName: 'APAC 2026',
    location: 'Royal Hong Kong Yacht Club',
    dates: 'November 17-21, 2026',
    year: 2026,
  },
  WORLDS_2027: {
    id: 'dragon-worlds-2027',
    name: 'Dragon World Championships 2027',
    shortName: 'Worlds 2027',
    location: 'Royal Hong Kong Yacht Club',
    dates: 'November 19-30, 2026',
    year: 2026,
  },
} as const;

// Type for event IDs
export type EventId = typeof EVENTS.APAC_2026.id | typeof EVENTS.WORLDS_2027.id;

// Legacy ID mapping (for backwards compatibility)
// Some screens used 'dragon-worlds-2026' instead of 'dragon-worlds-2027'
export const LEGACY_EVENT_ID_MAP: Record<string, EventId> = {
  'dragon-worlds-2026': EVENTS.WORLDS_2027.id,
  'asia-pacific': EVENTS.APAC_2026.id,
};

// Helper to normalize event IDs
export function normalizeEventId(eventId: string): EventId {
  if (LEGACY_EVENT_ID_MAP[eventId]) {
    return LEGACY_EVENT_ID_MAP[eventId];
  }
  // Validate the event ID
  if (eventId === EVENTS.APAC_2026.id || eventId === EVENTS.WORLDS_2027.id) {
    return eventId as EventId;
  }
  // Default to APAC 2026
  return EVENTS.APAC_2026.id;
}

// Get event definition by ID
export function getEventById(eventId: string): EventDefinition {
  const normalizedId = normalizeEventId(eventId);
  if (normalizedId === EVENTS.APAC_2026.id) {
    return EVENTS.APAC_2026;
  }
  return EVENTS.WORLDS_2027;
}

// Array of all events for iteration
export const ALL_EVENTS: EventDefinition[] = [
  EVENTS.APAC_2026,
  EVENTS.WORLDS_2027,
];

// Default event ID
export const DEFAULT_EVENT_ID: EventId = EVENTS.APAC_2026.id;
