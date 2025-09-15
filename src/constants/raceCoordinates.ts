/**
 * Centralized Race Course Coordinates
 * Single source of truth for all racing area coordinates in the Dragon Worlds HK 2027 app
 *
 * This file ensures coordinate consistency between map views, weather services,
 * and sailing location data to prevent Hermes property configuration issues.
 */

// Primary race course coordinates - Nine Pins Islands Race Course
// Using the weather tab coordinates as the authoritative source
export const NINEPINS_RACE_COURSE_CENTER = {
  latitude: 22.265263983780926,
  longitude: 114.32704442168033,
} as const;

// Individual coordinate exports for services that need them separately
export const RACING_AREA_LAT = NINEPINS_RACE_COURSE_CENTER.latitude;
export const RACING_AREA_LON = NINEPINS_RACE_COURSE_CENTER.longitude;

// Supporting marina coordinates
export const CLEARWATER_BAY_MARINA = {
  latitude: 22.2720,
  longitude: 114.2200,
} as const;

// Hong Kong general coordinates (for weather services)
export const HK_GENERAL = {
  latitude: 22.2783,
  longitude: 114.1757,
} as const;

// Map region configuration for race area
export const RACE_AREA_REGION = {
  latitude: NINEPINS_RACE_COURSE_CENTER.latitude,
  longitude: NINEPINS_RACE_COURSE_CENTER.longitude,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
} as const;

// Export types for TypeScript
export type Coordinate = {
  readonly latitude: number;
  readonly longitude: number;
};

export type MapRegion = Coordinate & {
  readonly latitudeDelta: number;
  readonly longitudeDelta: number;
};