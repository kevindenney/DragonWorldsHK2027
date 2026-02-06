/**
 * Scoring Utilities Tests
 *
 * Tests for sailing regatta scoring validation and calculation functions
 */

import {
  validateScoringConsistency,
  calculateDiscardCount,
  findDiscards,
  calculateNetPoints,
  validateChampionshipScoring,
} from '../scoringUtils';

describe('validateScoringConsistency', () => {
  it('validates correct scoring with no discards', () => {
    const result = validateScoringConsistency([1, 2, 3], [], 6);
    expect(result.isValid).toBe(true);
    expect(result.calculated).toBe(6);
    expect(result.expected).toBe(6);
    expect(result.difference).toBe(0);
  });

  it('validates correct scoring with one discard', () => {
    // [1, 3, 2, 5, 2, 1, 4] with discard [5] = 1+3+2+2+1+4 = 13
    const result = validateScoringConsistency([1, 3, 2, 5, 2, 1, 4], [5], 13);
    expect(result.isValid).toBe(true);
    expect(result.calculated).toBe(13);
  });

  it('validates correct scoring with two discards', () => {
    // [1, 2, 3, 4, 5, 6] with discards [5, 6] = 1+2+3+4 = 10
    const result = validateScoringConsistency([1, 2, 3, 4, 5, 6], [5, 6], 10);
    expect(result.isValid).toBe(true);
    expect(result.calculated).toBe(10);
  });

  it('detects incorrect scoring - total too high', () => {
    const result = validateScoringConsistency([1, 2, 3], [], 10);
    expect(result.isValid).toBe(false);
    expect(result.calculated).toBe(6);
    expect(result.expected).toBe(10);
    expect(result.difference).toBe(4);
    expect(result.message).toContain('mismatch');
  });

  it('detects incorrect scoring - total too low', () => {
    const result = validateScoringConsistency([1, 2, 3], [], 3);
    expect(result.isValid).toBe(false);
    expect(result.calculated).toBe(6);
    expect(result.expected).toBe(3);
    expect(result.difference).toBe(3);
  });

  it('handles empty race results', () => {
    const result = validateScoringConsistency([], [], 0);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('No race results');
  });

  it('handles DNF scores (high point values)', () => {
    // Fleet of 12, DNF = 13 points
    // [1, 2, 13, 3] with discard [13] = 1+2+3 = 6
    const result = validateScoringConsistency([1, 2, 13, 3], [13], 6);
    expect(result.isValid).toBe(true);
    expect(result.calculated).toBe(6);
  });

  it('handles multiple DNF scores', () => {
    // [1, 16, 16, 3] with discards [16, 16] = 1+3 = 4
    const result = validateScoringConsistency([1, 16, 16, 3], [16, 16], 4);
    expect(result.isValid).toBe(true);
    expect(result.calculated).toBe(4);
  });
});

describe('calculateDiscardCount', () => {
  it('returns 0 discards for 1-3 races', () => {
    expect(calculateDiscardCount(1)).toBe(0);
    expect(calculateDiscardCount(2)).toBe(0);
    expect(calculateDiscardCount(3)).toBe(0);
  });

  it('returns 1 discard for 4-6 races', () => {
    expect(calculateDiscardCount(4)).toBe(1);
    expect(calculateDiscardCount(5)).toBe(1);
    expect(calculateDiscardCount(6)).toBe(1);
  });

  it('returns 1 discard for 7-9 races', () => {
    expect(calculateDiscardCount(7)).toBe(1);
    expect(calculateDiscardCount(8)).toBe(1);
    expect(calculateDiscardCount(9)).toBe(1);
  });

  it('returns 2 discards for 10-12 races', () => {
    expect(calculateDiscardCount(10)).toBe(2);
    expect(calculateDiscardCount(11)).toBe(2);
    expect(calculateDiscardCount(12)).toBe(2);
  });

  it('scales discards for more than 12 races', () => {
    expect(calculateDiscardCount(13)).toBeGreaterThanOrEqual(2);
    expect(calculateDiscardCount(15)).toBeGreaterThanOrEqual(3);
    expect(calculateDiscardCount(20)).toBeGreaterThanOrEqual(4);
  });
});

describe('findDiscards', () => {
  it('finds the worst result with 1 discard', () => {
    expect(findDiscards([1, 3, 2, 5, 2, 1, 4], 1)).toEqual([5]);
  });

  it('finds the two worst results with 2 discards', () => {
    expect(findDiscards([1, 3, 2, 5, 2, 6, 4], 2)).toEqual([6, 5]);
  });

  it('returns empty array with 0 discards', () => {
    expect(findDiscards([1, 2, 3, 4], 0)).toEqual([]);
  });

  it('returns empty array with empty results', () => {
    expect(findDiscards([], 1)).toEqual([]);
  });

  it('handles DNF values', () => {
    // DNF (13) should be discarded first
    expect(findDiscards([1, 2, 13, 3], 1)).toEqual([13]);
  });

  it('handles multiple DNF values', () => {
    expect(findDiscards([1, 16, 16, 3], 2)).toEqual([16, 16]);
  });

  it('handles when discard count exceeds results length', () => {
    expect(findDiscards([1, 2, 3], 5)).toEqual([3, 2, 1]);
  });
});

describe('calculateNetPoints', () => {
  it('calculates net points with no discards', () => {
    expect(calculateNetPoints([1, 2, 3, 4], 0)).toBe(10);
  });

  it('calculates net points with 1 discard', () => {
    // [1, 3, 2, 5, 2, 1, 4] - discard 5 = 13
    expect(calculateNetPoints([1, 3, 2, 5, 2, 1, 4], 1)).toBe(13);
  });

  it('calculates net points with 2 discards', () => {
    // [1, 2, 3, 4, 5, 6] - discard 5,6 = 10
    expect(calculateNetPoints([1, 2, 3, 4, 5, 6], 2)).toBe(10);
  });

  it('handles empty results', () => {
    expect(calculateNetPoints([], 1)).toBe(0);
  });

  it('handles DNF scores', () => {
    // [1, 2, 13, 3] - discard 13 = 6
    expect(calculateNetPoints([1, 2, 13, 3], 1)).toBe(6);
  });
});

describe('validateChampionshipScoring', () => {
  it('returns empty array when all scoring is valid', () => {
    const competitors = [
      { sailNumber: 'HKG 1', raceResults: [1, 2, 3], discards: [], totalPoints: 6 },
      { sailNumber: 'HKG 2', raceResults: [2, 3, 4], discards: [], totalPoints: 9 },
    ];
    expect(validateChampionshipScoring(competitors)).toEqual([]);
  });

  it('returns issues for invalid scoring', () => {
    const competitors = [
      { sailNumber: 'HKG 1', raceResults: [1, 2, 3], discards: [], totalPoints: 6 }, // Valid
      { sailNumber: 'HKG 2', raceResults: [2, 3, 4], discards: [], totalPoints: 100 }, // Invalid
    ];
    const issues = validateChampionshipScoring(competitors);
    expect(issues).toHaveLength(1);
    expect(issues[0].sailNumber).toBe('HKG 2');
    expect(issues[0].validation.isValid).toBe(false);
  });

  it('validates discards correctly', () => {
    const competitors = [
      {
        sailNumber: 'HKG 1',
        raceResults: [1, 3, 2, 5, 2, 1, 4],
        discards: [5],
        totalPoints: 13 // Correct: 1+3+2+2+1+4 = 13
      },
    ];
    expect(validateChampionshipScoring(competitors)).toEqual([]);
  });

  it('catches incorrect discard calculations', () => {
    const competitors = [
      {
        sailNumber: 'HKG 1',
        raceResults: [1, 3, 2, 5, 2, 1, 4],
        discards: [5],
        totalPoints: 18 // Incorrect: should be 13
      },
    ];
    const issues = validateChampionshipScoring(competitors);
    expect(issues).toHaveLength(1);
    expect(issues[0].validation.calculated).toBe(13);
    expect(issues[0].validation.expected).toBe(18);
  });
});
