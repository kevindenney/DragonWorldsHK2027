/**
 * Time Utilities Tests
 *
 * Tests for formatRelativeTime and other time utility functions
 */

import { formatRelativeTime } from '../timeUtils';

describe('formatRelativeTime', () => {
  const mockNow = new Date('2026-11-20T12:00:00Z').getTime();

  beforeAll(() => {
    // Use Jest's fake timers to mock Date
    jest.useFakeTimers();
    jest.setSystemTime(new Date(mockNow));
  });

  afterAll(() => {
    // Restore real timers
    jest.useRealTimers();
  });

  describe('returns "just now"', () => {
    it('for timestamps less than 60 seconds ago', () => {
      const timestamp = mockNow - 30 * 1000; // 30 seconds ago
      expect(formatRelativeTime(timestamp)).toBe('just now');
    });

    it('for timestamps exactly 59 seconds ago', () => {
      const timestamp = mockNow - 59 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('just now');
    });

    it('for the current timestamp', () => {
      expect(formatRelativeTime(mockNow)).toBe('just now');
    });

    it('for future timestamps (fallback)', () => {
      const futureTimestamp = mockNow + 60 * 1000; // 1 minute in the future
      expect(formatRelativeTime(futureTimestamp)).toBe('just now');
    });

    it('for invalid dates', () => {
      expect(formatRelativeTime('invalid-date')).toBe('just now');
      expect(formatRelativeTime(NaN)).toBe('just now');
    });
  });

  describe('returns minutes ago', () => {
    it('for exactly 1 minute ago', () => {
      const timestamp = mockNow - 60 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('1 min ago');
    });

    it('for 5 minutes ago', () => {
      const timestamp = mockNow - 5 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('5 mins ago');
    });

    it('for 30 minutes ago', () => {
      const timestamp = mockNow - 30 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('30 mins ago');
    });

    it('for 59 minutes ago', () => {
      const timestamp = mockNow - 59 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('59 mins ago');
    });

    it('uses singular "min" for 1 minute', () => {
      const timestamp = mockNow - 1 * 60 * 1000;
      const result = formatRelativeTime(timestamp);
      expect(result).not.toContain('mins');
      expect(result).toContain('min');
    });

    it('uses plural "mins" for > 1 minute', () => {
      const timestamp = mockNow - 2 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toContain('mins');
    });
  });

  describe('returns hours ago', () => {
    it('for exactly 1 hour ago', () => {
      const timestamp = mockNow - 60 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('1 hour ago');
    });

    it('for 2 hours ago', () => {
      const timestamp = mockNow - 2 * 60 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('2 hours ago');
    });

    it('for 12 hours ago', () => {
      const timestamp = mockNow - 12 * 60 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('12 hours ago');
    });

    it('for 23 hours ago', () => {
      const timestamp = mockNow - 23 * 60 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('23 hours ago');
    });

    it('uses singular "hour" for 1 hour', () => {
      const timestamp = mockNow - 1 * 60 * 60 * 1000;
      const result = formatRelativeTime(timestamp);
      expect(result).not.toContain('hours');
      expect(result).toContain('hour');
    });

    it('uses plural "hours" for > 1 hour', () => {
      const timestamp = mockNow - 2 * 60 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toContain('hours');
    });
  });

  describe('returns formatted date for older timestamps', () => {
    it('for exactly 24 hours ago', () => {
      const timestamp = mockNow - 24 * 60 * 60 * 1000;
      const result = formatRelativeTime(timestamp);
      // Should contain month abbreviation and time
      expect(result).toMatch(/Nov \d+/);
    });

    it('for 2 days ago', () => {
      const timestamp = mockNow - 2 * 24 * 60 * 60 * 1000;
      const result = formatRelativeTime(timestamp);
      expect(result).toMatch(/Nov \d+/);
    });

    it('for 1 week ago', () => {
      const timestamp = mockNow - 7 * 24 * 60 * 60 * 1000;
      const result = formatRelativeTime(timestamp);
      expect(result).toMatch(/Nov \d+/);
    });

    it('includes time component for dates', () => {
      const timestamp = mockNow - 48 * 60 * 60 * 1000; // 2 days ago
      const result = formatRelativeTime(timestamp);
      // Should contain AM or PM
      expect(result).toMatch(/(AM|PM)/);
    });
  });

  describe('handles different input types', () => {
    it('accepts number (milliseconds)', () => {
      const timestamp = mockNow - 5 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('5 mins ago');
    });

    it('accepts Date object', () => {
      const date = new Date(mockNow - 5 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('5 mins ago');
    });

    it('accepts ISO string', () => {
      const isoString = new Date(mockNow - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(isoString)).toBe('5 mins ago');
    });
  });

  describe('edge cases', () => {
    it('handles boundary between just now and 1 min (60 seconds)', () => {
      const timestamp = mockNow - 60 * 1000; // exactly 60 seconds
      expect(formatRelativeTime(timestamp)).toBe('1 min ago');
    });

    it('handles boundary between minutes and hours (3600 seconds)', () => {
      const timestamp = mockNow - 3600 * 1000; // exactly 1 hour
      expect(formatRelativeTime(timestamp)).toBe('1 hour ago');
    });

    it('handles boundary between hours and days (86400 seconds)', () => {
      const timestamp = mockNow - 86400 * 1000; // exactly 24 hours
      const result = formatRelativeTime(timestamp);
      // Should be formatted date, not "24 hours ago"
      expect(result).not.toContain('hour');
    });
  });
});
