/**
 * Scoring Utilities for Sailing Regattas
 *
 * Provides validation and calculation helpers for sailing regatta scoring
 * following ISAF low-point scoring system conventions.
 */

/**
 * Result of scoring validation
 */
export interface ScoringValidationResult {
  isValid: boolean;
  calculated: number;
  expected: number;
  difference: number;
  message?: string;
}

/**
 * Special scoring values for non-finishing boats
 */
export const SPECIAL_SCORES = {
  DNF: 'DNF', // Did Not Finish
  DNS: 'DNS', // Did Not Start
  DSQ: 'DSQ', // Disqualified
  OCS: 'OCS', // On Course Side (premature start)
  BFD: 'BFD', // Black Flag Disqualification
  UFD: 'UFD', // U Flag Disqualification
  RET: 'RET', // Retired
  DNC: 'DNC', // Did Not Come to starting area
} as const;

/**
 * Default points for special scores (typically fleet size + 1 or higher)
 */
export const DEFAULT_PENALTY_POINTS = {
  DNF: (fleetSize: number) => fleetSize + 1,
  DNS: (fleetSize: number) => fleetSize + 1,
  DSQ: (fleetSize: number) => fleetSize + 1,
  OCS: (fleetSize: number) => fleetSize + 1,
  BFD: (fleetSize: number) => fleetSize + 1,
  UFD: (fleetSize: number) => fleetSize + 1,
  RET: (fleetSize: number) => fleetSize + 1,
  DNC: (fleetSize: number) => fleetSize + 1,
};

/**
 * Validates that totalPoints matches the sum of race results minus discards
 *
 * @param raceResults - Array of race results (positions/points)
 * @param discards - Array of discarded scores
 * @param expectedTotal - The totalPoints value to validate
 * @returns Validation result with calculated vs expected comparison
 *
 * @example
 * validateScoringConsistency([1, 3, 2, 5, 2, 1, 4], [5], 15)
 * // { isValid: false, calculated: 13, expected: 15, difference: 2 }
 */
export function validateScoringConsistency(
  raceResults: number[],
  discards: number[],
  expectedTotal: number
): ScoringValidationResult {
  if (!raceResults || raceResults.length === 0) {
    return {
      isValid: false,
      calculated: 0,
      expected: expectedTotal,
      difference: expectedTotal,
      message: 'No race results provided',
    };
  }

  // Calculate gross points (sum of all results)
  const grossPoints = raceResults.reduce((sum, points) => sum + points, 0);

  // Calculate discarded points
  const discardedPoints = discards?.reduce((sum, points) => sum + points, 0) || 0;

  // Net points = gross - discards
  const netPoints = grossPoints - discardedPoints;

  const difference = Math.abs(netPoints - expectedTotal);
  const isValid = difference === 0;

  return {
    isValid,
    calculated: netPoints,
    expected: expectedTotal,
    difference,
    message: isValid
      ? undefined
      : `Scoring mismatch: calculated ${netPoints}, expected ${expectedTotal} (diff: ${difference})`,
  };
}

/**
 * Calculates the number of discards based on the number of races
 * Following typical ISAF conventions:
 * - 1-3 races: 0 discards
 * - 4-6 races: 1 discard
 * - 7-9 races: 1 discard
 * - 10-12 races: 2 discards
 * - 13+ races: 2+ discards
 *
 * @param totalRaces - Total number of races in the series
 * @returns Number of discards allowed
 */
export function calculateDiscardCount(totalRaces: number): number {
  if (totalRaces <= 3) return 0;
  if (totalRaces <= 6) return 1;
  if (totalRaces <= 9) return 1;
  if (totalRaces <= 12) return 2;
  return Math.floor(totalRaces / 5); // Roughly 1 discard per 5 races
}

/**
 * Identifies the worst results to discard from race results
 *
 * @param raceResults - Array of race results
 * @param discardCount - Number of results to discard
 * @returns Array of values to discard (worst results)
 */
export function findDiscards(raceResults: number[], discardCount: number): number[] {
  if (discardCount <= 0 || !raceResults || raceResults.length === 0) {
    return [];
  }

  // Sort descending to find worst results
  const sorted = [...raceResults].sort((a, b) => b - a);
  return sorted.slice(0, discardCount);
}

/**
 * Calculates net points after discards
 *
 * @param raceResults - Array of race results
 * @param discardCount - Number of results to discard
 * @returns Net points after discarding worst results
 */
export function calculateNetPoints(raceResults: number[], discardCount: number): number {
  if (!raceResults || raceResults.length === 0) return 0;

  const discards = findDiscards(raceResults, discardCount);
  const gross = raceResults.reduce((sum, p) => sum + p, 0);
  const discardedPoints = discards.reduce((sum, p) => sum + p, 0);

  return gross - discardedPoints;
}

/**
 * Validates all competitors in a championship for scoring consistency
 *
 * @param competitors - Array of competitors with raceResults, discards, and totalPoints
 * @returns Array of validation results for competitors with issues
 */
export function validateChampionshipScoring(
  competitors: Array<{
    sailNumber: string;
    raceResults: number[];
    discards?: number[];
    totalPoints: number;
  }>
): Array<{ sailNumber: string; validation: ScoringValidationResult }> {
  const issues: Array<{ sailNumber: string; validation: ScoringValidationResult }> = [];

  for (const competitor of competitors) {
    const validation = validateScoringConsistency(
      competitor.raceResults,
      competitor.discards || [],
      competitor.totalPoints
    );

    if (!validation.isValid) {
      issues.push({
        sailNumber: competitor.sailNumber,
        validation,
      });
    }
  }

  return issues;
}

/**
 * Logs scoring validation warnings in development mode
 *
 * @param championshipName - Name of the championship for logging
 * @param competitors - Array of competitors to validate
 */
export function logScoringValidationWarnings(
  championshipName: string,
  competitors: Array<{
    sailNumber: string;
    raceResults: number[];
    discards?: number[];
    totalPoints: number;
  }>
): void {
  if (!__DEV__) return;

  const issues = validateChampionshipScoring(competitors);

  if (issues.length > 0) {
    console.warn(`[ScoringValidation] ${championshipName}: ${issues.length} scoring inconsistencies found`);
    issues.forEach(({ sailNumber, validation }) => {
      console.warn(`  - ${sailNumber}: ${validation.message}`);
    });
  }
}
