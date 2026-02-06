/**
 * Notices Store Tests
 *
 * Tests for the notices store to verify seen tracking,
 * unread count management, and per-event tracking.
 */

import { useNoticesStore } from '../noticesStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('NoticesStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNoticesStore.getState().resetStore();
  });

  describe('Initial State', () => {
    it('should have empty seenNoticeIdsByEvent', () => {
      const state = useNoticesStore.getState();
      expect(state.seenNoticeIdsByEvent).toEqual({});
    });

    it('should have zero unread count', () => {
      const state = useNoticesStore.getState();
      expect(state.unreadCount).toBe(0);
    });

    it('should have null lastViewedAt', () => {
      const state = useNoticesStore.getState();
      expect(state.lastViewedAt).toBeNull();
    });
  });

  describe('markNoticesAsSeen', () => {
    it('should mark notices as seen for a specific event', () => {
      const { markNoticesAsSeen } = useNoticesStore.getState();

      markNoticesAsSeen('event-apac-2026', ['notice-1', 'notice-2', 'notice-3']);

      const state = useNoticesStore.getState();
      expect(state.seenNoticeIdsByEvent['event-apac-2026']).toEqual(['notice-1', 'notice-2', 'notice-3']);
    });

    it('should merge new notice IDs with existing ones', () => {
      const { markNoticesAsSeen } = useNoticesStore.getState();

      markNoticesAsSeen('event-apac-2026', ['notice-1', 'notice-2']);
      markNoticesAsSeen('event-apac-2026', ['notice-3', 'notice-4']);

      const state = useNoticesStore.getState();
      expect(state.seenNoticeIdsByEvent['event-apac-2026']).toEqual(['notice-1', 'notice-2', 'notice-3', 'notice-4']);
    });

    it('should deduplicate notice IDs', () => {
      const { markNoticesAsSeen } = useNoticesStore.getState();

      markNoticesAsSeen('event-apac-2026', ['notice-1', 'notice-2']);
      markNoticesAsSeen('event-apac-2026', ['notice-2', 'notice-3']); // notice-2 is duplicate

      const state = useNoticesStore.getState();
      expect(state.seenNoticeIdsByEvent['event-apac-2026']).toEqual(['notice-1', 'notice-2', 'notice-3']);
    });

    it('should track seen notices separately per event', () => {
      const { markNoticesAsSeen } = useNoticesStore.getState();

      markNoticesAsSeen('event-apac-2026', ['apac-notice-1', 'apac-notice-2']);
      markNoticesAsSeen('event-worlds-2027', ['worlds-notice-1', 'worlds-notice-2']);

      const state = useNoticesStore.getState();
      expect(state.seenNoticeIdsByEvent['event-apac-2026']).toEqual(['apac-notice-1', 'apac-notice-2']);
      expect(state.seenNoticeIdsByEvent['event-worlds-2027']).toEqual(['worlds-notice-1', 'worlds-notice-2']);
    });

    it('should clear unread count when marking notices as seen', () => {
      const { updateUnreadCount, markNoticesAsSeen } = useNoticesStore.getState();

      // First set some unread count
      updateUnreadCount('event-apac-2026', ['notice-1', 'notice-2', 'notice-3']);
      expect(useNoticesStore.getState().unreadCount).toBe(3);

      // Then mark as seen
      markNoticesAsSeen('event-apac-2026', ['notice-1', 'notice-2', 'notice-3']);
      expect(useNoticesStore.getState().unreadCount).toBe(0);
    });

    it('should update lastViewedAt timestamp', () => {
      const { markNoticesAsSeen } = useNoticesStore.getState();
      const beforeTime = Date.now();

      markNoticesAsSeen('event-apac-2026', ['notice-1']);

      const state = useNoticesStore.getState();
      expect(state.lastViewedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(state.lastViewedAt).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('updateUnreadCount', () => {
    it('should count unseen notices correctly', () => {
      const { markNoticesAsSeen, updateUnreadCount } = useNoticesStore.getState();

      // Mark some notices as seen
      markNoticesAsSeen('event-apac-2026', ['notice-1', 'notice-2']);

      // Reset unread to test updateUnreadCount
      useNoticesStore.setState({ unreadCount: 0 });

      // Update with all notice IDs (2 already seen, 2 new)
      updateUnreadCount('event-apac-2026', ['notice-1', 'notice-2', 'notice-3', 'notice-4']);

      const state = useNoticesStore.getState();
      expect(state.unreadCount).toBe(2); // notice-3 and notice-4 are unseen
    });

    it('should return 0 unseen when all notices are seen', () => {
      const { markNoticesAsSeen, updateUnreadCount } = useNoticesStore.getState();

      markNoticesAsSeen('event-apac-2026', ['notice-1', 'notice-2', 'notice-3']);

      // Reset unread to test updateUnreadCount
      useNoticesStore.setState({ unreadCount: 0 });

      updateUnreadCount('event-apac-2026', ['notice-1', 'notice-2', 'notice-3']);

      const state = useNoticesStore.getState();
      expect(state.unreadCount).toBe(0);
    });

    it('should count all as unseen for a new event', () => {
      const { updateUnreadCount } = useNoticesStore.getState();

      updateUnreadCount('event-worlds-2027', ['worlds-1', 'worlds-2', 'worlds-3']);

      const state = useNoticesStore.getState();
      expect(state.unreadCount).toBe(3);
    });

    it('should not decrease unread count when no new unseen notices', () => {
      const { markNoticesAsSeen, updateUnreadCount } = useNoticesStore.getState();

      // Set initial unread count
      updateUnreadCount('event-apac-2026', ['notice-1', 'notice-2']);
      expect(useNoticesStore.getState().unreadCount).toBe(2);

      // Mark all as seen
      markNoticesAsSeen('event-apac-2026', ['notice-1', 'notice-2']);

      // Update with same notices (all seen now)
      updateUnreadCount('event-apac-2026', ['notice-1', 'notice-2']);

      // Count should not have changed (stays at 0 from markNoticesAsSeen)
      expect(useNoticesStore.getState().unreadCount).toBe(0);
    });
  });

  describe('clearUnread', () => {
    it('should clear unread count to 0', () => {
      const { updateUnreadCount, clearUnread } = useNoticesStore.getState();

      updateUnreadCount('event-apac-2026', ['notice-1', 'notice-2', 'notice-3']);
      expect(useNoticesStore.getState().unreadCount).toBe(3);

      clearUnread();
      expect(useNoticesStore.getState().unreadCount).toBe(0);
    });
  });

  describe('resetStore', () => {
    it('should reset all state to initial values', () => {
      const { markNoticesAsSeen, updateUnreadCount, resetStore } = useNoticesStore.getState();

      // Set some state
      markNoticesAsSeen('event-apac-2026', ['notice-1', 'notice-2']);
      markNoticesAsSeen('event-worlds-2027', ['worlds-1']);
      updateUnreadCount('event-apac-2026', ['notice-3']);

      // Verify state is set
      let state = useNoticesStore.getState();
      expect(Object.keys(state.seenNoticeIdsByEvent).length).toBeGreaterThan(0);
      expect(state.lastViewedAt).not.toBeNull();

      // Reset
      resetStore();

      // Verify reset
      state = useNoticesStore.getState();
      expect(state.seenNoticeIdsByEvent).toEqual({});
      expect(state.unreadCount).toBe(0);
      expect(state.lastViewedAt).toBeNull();
    });
  });

  describe('Multi-event scenarios', () => {
    it('should handle switching between events correctly', () => {
      const { markNoticesAsSeen, updateUnreadCount } = useNoticesStore.getState();

      // User views APAC notices
      markNoticesAsSeen('event-apac-2026', ['apac-1', 'apac-2']);

      // User switches to Worlds - new notices appear
      updateUnreadCount('event-worlds-2027', ['worlds-1', 'worlds-2', 'worlds-3']);

      // Badge should show 3 for Worlds
      expect(useNoticesStore.getState().unreadCount).toBe(3);

      // User views Worlds notices
      markNoticesAsSeen('event-worlds-2027', ['worlds-1', 'worlds-2', 'worlds-3']);

      // Badge should clear
      expect(useNoticesStore.getState().unreadCount).toBe(0);

      // User switches back to APAC with a new notice
      useNoticesStore.setState({ unreadCount: 0 }); // Simulate leaving Notices tab
      updateUnreadCount('event-apac-2026', ['apac-1', 'apac-2', 'apac-3']); // apac-3 is new

      // Badge should show 1 (only apac-3 is new)
      expect(useNoticesStore.getState().unreadCount).toBe(1);

      // APAC seen state should still have original 2
      expect(useNoticesStore.getState().seenNoticeIdsByEvent['event-apac-2026']).toEqual(['apac-1', 'apac-2']);

      // Worlds seen state should have all 3
      expect(useNoticesStore.getState().seenNoticeIdsByEvent['event-worlds-2027']).toEqual(['worlds-1', 'worlds-2', 'worlds-3']);
    });
  });
});
