import { act, renderHook } from '@testing-library/react-native';
import { useScheduleStore } from '../scheduleStore';
import { MockDataFactory, StoreTestUtils } from '../../testing/testingSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('ScheduleStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      const { clearEvents } = useScheduleStore.getState();
      clearEvents();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useScheduleStore());
      
      expect(result.current.events).toEqual([]);
      expect(result.current.races).toEqual([]);
      expect(result.current.selectedEvent).toBe('World Championship');
      expect(result.current.loading).toBe(false);
      expect(result.current.lastSync).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Event Management', () => {
    it('should add events successfully', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockEvent = MockDataFactory.createMockRaceEvent({
        id: 'event_1',
        title: 'Test Race',
        type: 'racing',
        status: 'upcoming',
        date: '2024-11-21',
        location: {
          name: 'RHKYC',
          coordinates: { latitude: 22.2783, longitude: 114.1757 }
        }
      });

      act(() => {
        result.current.addEvent(mockEvent);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0]).toEqual(mockEvent);
    });

    it('should remove events successfully', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockEvent = MockDataFactory.createMockRaceEvent({
        id: 'event_1',
        title: 'Test Race'
      });

      act(() => {
        result.current.addEvent(mockEvent);
      });

      expect(result.current.events).toHaveLength(1);

      act(() => {
        result.current.removeEvent('event_1');
      });

      expect(result.current.events).toHaveLength(0);
    });

    it('should update events list', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockEvents = [
        MockDataFactory.createMockRaceEvent({ id: 'event_1', title: 'Race 1' }),
        MockDataFactory.createMockRaceEvent({ id: 'event_2', title: 'Race 2' }),
      ];

      act(() => {
        result.current.updateEvents(mockEvents);
      });

      expect(result.current.events).toHaveLength(2);
      expect(result.current.events[0].title).toBe('Race 1');
      expect(result.current.events[1].title).toBe('Race 2');
      expect(result.current.lastSync).toBeTruthy();
      expect(result.current.error).toBeNull();
    });

    it('should update event status', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockEvent = MockDataFactory.createMockRaceEvent({
        id: 'event_1',
        status: 'upcoming'
      });

      act(() => {
        result.current.addEvent(mockEvent);
      });

      expect(result.current.events[0].status).toBe('upcoming');

      act(() => {
        result.current.updateEventStatus('event_1', 'in-progress');
      });

      expect(result.current.events[0].status).toBe('in-progress');
    });

    it('should get events by day', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockEvents = [
        MockDataFactory.createMockRaceEvent({ id: 'event_1', date: '2024-11-21' }),
        MockDataFactory.createMockRaceEvent({ id: 'event_2', date: '2024-11-22' }),
        MockDataFactory.createMockRaceEvent({ id: 'event_3', date: '2024-11-21' }),
      ];

      act(() => {
        result.current.updateEvents(mockEvents);
      });

      const todaysEvents = result.current.getEventsByDay('2024-11-21');
      expect(todaysEvents).toHaveLength(2);
      expect(todaysEvents.map(e => e.id)).toEqual(['event_1', 'event_3']);
    });

    it('should get event by ID', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockEvent = MockDataFactory.createMockRaceEvent({
        id: 'event_1',
        title: 'Test Race'
      });

      act(() => {
        result.current.addEvent(mockEvent);
      });

      const foundEvent = result.current.getEventById('event_1');
      expect(foundEvent).toEqual(mockEvent);

      const notFoundEvent = result.current.getEventById('non-existent');
      expect(notFoundEvent).toBeUndefined();
    });
  });

  describe('Race Management', () => {
    it('should update races list', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockRaces = [
        {
          id: 'race_1',
          eventId: 'event_1',
          raceNumber: 1,
          className: 'Dragon',
          status: 'scheduled' as const,
          startTime: '11:00',
          estimatedDuration: 90,
          course: 'Triangle',
          participants: ['HKG59', 'GBR8']
        },
        {
          id: 'race_2',
          eventId: 'event_1',
          raceNumber: 2,
          className: 'Dragon',
          status: 'racing' as const,
          startTime: '13:00',
          estimatedDuration: 90,
          course: 'Windward-Leeward',
          participants: ['HKG59', 'GBR8', 'AUS12']
        }
      ];

      act(() => {
        result.current.updateRaces(mockRaces);
      });

      expect(result.current.races).toHaveLength(2);
      expect(result.current.races[0].className).toBe('Dragon');
      expect(result.current.races[1].status).toBe('racing');
    });

    it('should get current races', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockRaces = [
        {
          id: 'race_1',
          eventId: 'event_1',
          raceNumber: 1,
          className: 'Dragon',
          status: 'scheduled' as const,
          startTime: '11:00',
          estimatedDuration: 90,
          course: 'Triangle',
          participants: ['HKG59']
        },
        {
          id: 'race_2',
          eventId: 'event_1',
          raceNumber: 2,
          className: 'Dragon',
          status: 'racing' as const,
          startTime: '13:00',
          estimatedDuration: 90,
          course: 'Windward-Leeward',
          participants: ['HKG59']
        },
        {
          id: 'race_3',
          eventId: 'event_1',
          raceNumber: 3,
          className: 'Dragon',
          status: 'starting' as const,
          startTime: '15:00',
          estimatedDuration: 90,
          course: 'Triangle',
          participants: ['HKG59']
        }
      ];

      act(() => {
        result.current.updateRaces(mockRaces);
      });

      const currentRaces = result.current.getCurrentRaces();
      expect(currentRaces).toHaveLength(2);
      expect(currentRaces.map(r => r.status)).toEqual(['racing', 'starting']);
    });

    it('should update race status', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockRace = {
        id: 'race_1',
        eventId: 'event_1',
        raceNumber: 1,
        className: 'Dragon',
        status: 'scheduled' as const,
        startTime: '11:00',
        estimatedDuration: 90,
        course: 'Triangle',
        participants: ['HKG59']
      };

      act(() => {
        result.current.updateRaces([mockRace]);
      });

      expect(result.current.races[0].status).toBe('scheduled');

      act(() => {
        result.current.updateRaceStatus('race_1', 'starting');
      });

      expect(result.current.races[0].status).toBe('starting');
    });

    it('should get race by ID', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockRace = {
        id: 'race_1',
        eventId: 'event_1',
        raceNumber: 1,
        className: 'Dragon',
        status: 'scheduled' as const,
        startTime: '11:00',
        estimatedDuration: 90,
        course: 'Triangle',
        participants: ['HKG59']
      };

      act(() => {
        result.current.updateRaces([mockRace]);
      });

      const foundRace = result.current.getRaceById('race_1');
      expect(foundRace).toEqual(mockRace);

      const notFoundRace = result.current.getRaceById('non-existent');
      expect(notFoundRace).toBeUndefined();
    });
  });

  describe('Event Selection', () => {
    it('should change selected event', () => {
      const { result } = renderHook(() => useScheduleStore());

      expect(result.current.selectedEvent).toBe('World Championship');

      act(() => {
        result.current.setSelectedEvent('Asia Pacific');
      });

      expect(result.current.selectedEvent).toBe('Asia Pacific');
    });
  });

  describe('Loading and Error States', () => {
    it('should manage loading state', () => {
      const { result } = renderHook(() => useScheduleStore());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });

    it('should manage error state', () => {
      const { result } = renderHook(() => useScheduleStore());

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Data Persistence', () => {
    it('should handle store rehydration', async () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockEvent = MockDataFactory.createMockRaceEvent({
        id: 'event_1',
        title: 'Persistent Race'
      });

      // Add event
      act(() => {
        result.current.addEvent(mockEvent);
        result.current.setSelectedEvent('Asia Pacific');
      });

      // Simulate store rehydration
      const storeSnapshot = StoreTestUtils.createStoreSnapshot(useScheduleStore);
      
      expect(storeSnapshot.events).toHaveLength(1);
      expect(storeSnapshot.events[0].title).toBe('Persistent Race');
      expect(storeSnapshot.selectedEvent).toBe('Asia Pacific');
    });
  });

  describe('Clear Events', () => {
    it('should clear all events and races', () => {
      const { result } = renderHook(() => useScheduleStore());
      const mockEvent = MockDataFactory.createMockRaceEvent();
      const mockRace = {
        id: 'race_1',
        eventId: 'event_1',
        raceNumber: 1,
        className: 'Dragon',
        status: 'scheduled' as const,
        startTime: '11:00',
        estimatedDuration: 90,
        course: 'Triangle',
        participants: ['HKG59']
      };

      // Add data
      act(() => {
        result.current.addEvent(mockEvent);
        result.current.updateRaces([mockRace]);
        result.current.setError('Test error');
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.races).toHaveLength(1);
      expect(result.current.error).toBe('Test error');

      // Clear all
      act(() => {
        result.current.clearEvents();
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.races).toEqual([]);
      expect(result.current.lastSync).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid updates efficiently', () => {
      const { result } = renderHook(() => useScheduleStore());
      
      const startTime = performance.now();
      
      // Perform 20 rapid event updates
      for (let i = 0; i < 20; i++) {
        act(() => {
          const mockEvent = MockDataFactory.createMockRaceEvent({
            id: `event_${i}`,
            title: `Race ${i}`,
            status: i % 2 === 0 ? 'upcoming' : 'in-progress'
          });
          result.current.addEvent(mockEvent);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all updates in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
      expect(result.current.events).toHaveLength(20);
    });
  });
});