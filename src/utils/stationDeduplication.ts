/**
 * Station Deduplication Utility
 * 
 * Prevents duplicate marine weather stations from being displayed at similar coordinates.
 * Ensures each station location is unique and properly spaced.
 */

export interface StationCoordinate {
  latitude: number;
  longitude: number;
}

export interface StationWithCoordinate {
  id: string;
  coordinate: StationCoordinate;
  [key: string]: any;
}

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(coord1: StationCoordinate, coord2: StationCoordinate): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Deduplicate stations based on minimum distance threshold
 * @param stations Array of stations with coordinates
 * @param minDistanceKm Minimum distance in kilometers between stations (default: 2km)
 * @returns Deduplicated array of stations
 */
export function deduplicateStations<T extends StationWithCoordinate>(
  stations: T[],
  minDistanceKm: number = 2.0
): T[] {
  const deduplicated: T[] = [];
  const usedCoordinates: StationCoordinate[] = [];

  for (const station of stations) {
    // Check if this station is too close to any existing station
    const isTooClose = usedCoordinates.some(usedCoord => 
      calculateDistance(station.coordinate, usedCoord) < minDistanceKm
    );

    if (!isTooClose) {
      deduplicated.push(station);
      usedCoordinates.push(station.coordinate);
    } else {
      console.log(`🗑️ Removing duplicate station ${station.id} at ${station.coordinate.latitude}, ${station.coordinate.longitude}`);
    }
  }

  console.log(`✅ Deduplicated stations: ${stations.length} → ${deduplicated.length} (removed ${stations.length - deduplicated.length} duplicates)`);
  return deduplicated;
}

/**
 * Merge multiple station arrays and deduplicate them
 * @param stationArrays Array of station arrays to merge
 * @param minDistanceKm Minimum distance in kilometers between stations
 * @returns Merged and deduplicated array of stations
 */
export function mergeAndDeduplicateStations<T extends StationWithCoordinate>(
  stationArrays: T[][],
  minDistanceKm: number = 2.0
): T[] {
  const allStations = stationArrays.flat();
  return deduplicateStations(allStations, minDistanceKm);
}

/**
 * Create a unique station ID based on coordinates and type
 * @param coordinate Station coordinates
 * @param type Station type (wind, wave, tide)
 * @returns Unique station ID
 */
export function createUniqueStationId(coordinate: StationCoordinate, type: string): string {
  const lat = coordinate.latitude.toFixed(3);
  const lng = coordinate.longitude.toFixed(3);
  return `${type}-${lat}-${lng}`;
}

/**
 * Validate that coordinates are within Hong Kong waters
 * @param coordinate Station coordinates
 * @returns True if coordinates are in Hong Kong waters
 */
export function isInHongKongWaters(coordinate: StationCoordinate): boolean {
  const { latitude, longitude } = coordinate;
  
  // Hong Kong bounding box (approximate)
  const minLat = 22.1;
  const maxLat = 22.6;
  const minLng = 113.8;
  const maxLng = 114.4;
  
  return latitude >= minLat && latitude <= maxLat && 
         longitude >= minLng && longitude <= maxLng;
}
