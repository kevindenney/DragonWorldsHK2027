import { act, renderHook } from '@testing-library/react-native';
import { useRegattaStore } from '../useRegattaStore';
import { MockDataFactory, StoreTestUtils } from '../../testing/testingSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('useRegattaStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useRegattaStore.setState({
        races: [],
        boats: [],
        results: [],
        selectedRace: null
      });
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      expect(result.current.races).toEqual([]);
      expect(result.current.boats).toEqual([]);
      expect(result.current.results).toEqual([]);
      expect(result.current.selectedRace).toBeNull();
    });
  });

  describe('Race Management', () => {
    it('should set races', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockRaces = [
        {
          id: 'race-1',
          name: 'Race 1',
          startTime: new Date('2024-11-21T11:00:00'),
          status: 'upcoming' as const,
          course: 'Triangle'
        },
        {
          id: 'race-2',
          name: 'Race 2',
          startTime: new Date('2024-11-21T13:00:00'),
          status: 'upcoming' as const,
          course: 'Windward-Leeward'
        }
      ];

      act(() => {
        result.current.setRaces(mockRaces);
      });

      expect(result.current.races).toHaveLength(2);
      expect(result.current.races).toEqual(mockRaces);
    });

    it('should add a race', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockRace = {
        id: 'race-1',
        name: 'Test Race',
        startTime: new Date('2024-11-21T11:00:00'),
        status: 'upcoming' as const,
        course: 'Triangle'
      };

      act(() => {
        result.current.addRace(mockRace);
      });

      expect(result.current.races).toHaveLength(1);
      expect(result.current.races[0]).toEqual(mockRace);
    });

    it('should add multiple races', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const race1 = {
        id: 'race-1',
        name: 'Race 1',
        startTime: new Date('2024-11-21T11:00:00'),
        status: 'upcoming' as const,
        course: 'Triangle'
      };

      const race2 = {
        id: 'race-2',
        name: 'Race 2',
        startTime: new Date('2024-11-21T13:00:00'),
        status: 'upcoming' as const,
        course: 'Windward-Leeward'
      };

      act(() => {
        result.current.addRace(race1);
        result.current.addRace(race2);
      });

      expect(result.current.races).toHaveLength(2);
      expect(result.current.races[0]).toEqual(race1);
      expect(result.current.races[1]).toEqual(race2);
    });

    it('should update a race', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockRace = {
        id: 'race-1',
        name: 'Test Race',
        startTime: new Date('2024-11-21T11:00:00'),
        status: 'upcoming' as const,
        course: 'Triangle'
      };

      act(() => {
        result.current.addRace(mockRace);
      });

      act(() => {
        result.current.updateRace('race-1', { 
          status: 'active', 
          course: 'Windward-Leeward' 
        });
      });

      const updatedRace = result.current.races.find(r => r.id === 'race-1');
      expect(updatedRace?.status).toBe('active');
      expect(updatedRace?.course).toBe('Windward-Leeward');
      expect(updatedRace?.name).toBe('Test Race'); // Should preserve other fields
    });

    it('should not update non-existent race', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockRace = {
        id: 'race-1',
        name: 'Test Race',
        startTime: new Date('2024-11-21T11:00:00'),
        status: 'upcoming' as const,
        course: 'Triangle'
      };

      act(() => {
        result.current.addRace(mockRace);
      });

      act(() => {
        result.current.updateRace('non-existent', { status: 'active' });
      });

      // Original race should be unchanged
      expect(result.current.races[0]).toEqual(mockRace);
    });

    it('should set selected race', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockRace = {
        id: 'race-1',
        name: 'Test Race',
        startTime: new Date('2024-11-21T11:00:00'),
        status: 'upcoming' as const,
        course: 'Triangle'
      };

      expect(result.current.selectedRace).toBeNull();

      act(() => {
        result.current.setSelectedRace(mockRace);
      });

      expect(result.current.selectedRace).toEqual(mockRace);

      act(() => {
        result.current.setSelectedRace(null);
      });

      expect(result.current.selectedRace).toBeNull();
    });
  });

  describe('Boat Management', () => {
    it('should set boats', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockBoats = [
        {
          id: 'boat-1',
          sailNumber: 'HKG 59',
          skipper: 'John Smith',
          crew: 'Jane Doe',
          class: 'Dragon'
        },
        {
          id: 'boat-2',
          sailNumber: 'GBR 8',
          skipper: 'Mike Johnson',
          crew: 'Sarah Wilson',
          class: 'Dragon'
        }
      ];

      act(() => {
        result.current.setBoats(mockBoats);
      });

      expect(result.current.boats).toHaveLength(2);
      expect(result.current.boats).toEqual(mockBoats);
    });

    it('should handle boats without crew', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockBoat = {
        id: 'boat-1',
        sailNumber: 'AUS 12',
        skipper: 'Solo Sailor',
        class: 'Dragon'
      };

      act(() => {
        result.current.setBoats([mockBoat]);
      });

      expect(result.current.boats).toHaveLength(1);
      expect(result.current.boats[0].crew).toBeUndefined();
      expect(result.current.boats[0].skipper).toBe('Solo Sailor');
    });
  });

  describe('Results Management', () => {
    it('should set results', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockResults = [
        {
          raceId: 'race-1',
          boatId: 'boat-1',
          position: 1,
          finishTime: new Date('2024-11-21T12:45:30'),
          points: 1
        },
        {
          raceId: 'race-1',
          boatId: 'boat-2',
          position: 2,
          finishTime: new Date('2024-11-21T12:45:45'),
          points: 2
        }
      ];

      act(() => {
        result.current.setResults(mockResults);
      });

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results).toEqual(mockResults);
    });

    it('should add a result', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockResult = {
        raceId: 'race-1',
        boatId: 'boat-1',
        position: 1,
        points: 1
      };

      act(() => {
        result.current.addResult(mockResult);
      });

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0]).toEqual(mockResult);
    });

    it('should add multiple results', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const result1 = {
        raceId: 'race-1',
        boatId: 'boat-1',
        position: 1,
        points: 1
      };

      const result2 = {
        raceId: 'race-1',
        boatId: 'boat-2',
        position: 2,
        points: 2
      };

      act(() => {
        result.current.addResult(result1);
        result.current.addResult(result2);
      });

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results[0]).toEqual(result1);
      expect(result.current.results[1]).toEqual(result2);
    });

    it('should handle results without finish time', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockResult = {
        raceId: 'race-1',
        boatId: 'boat-1',
        position: 1,
        points: 1
      };

      act(() => {
        result.current.addResult(mockResult);
      });

      expect(result.current.results[0].finishTime).toBeUndefined();
      expect(result.current.results[0].position).toBe(1);
      expect(result.current.results[0].points).toBe(1);
    });
  });

  describe('Complex Race Scenarios', () => {
    it('should handle race status transitions', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockRace = {
        id: 'race-1',
        name: 'Championship Race',
        startTime: new Date('2024-11-21T11:00:00'),
        status: 'upcoming' as const,
        course: 'Triangle'
      };

      act(() => {
        result.current.addRace(mockRace);
      });

      // Start the race
      act(() => {
        result.current.updateRace('race-1', { status: 'active' });
      });

      expect(result.current.races[0].status).toBe('active');

      // Complete the race
      act(() => {
        result.current.updateRace('race-1', { status: 'completed' });
      });

      expect(result.current.races[0].status).toBe('completed');
    });

    it('should manage race with boats and results', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      // Set up race
      const mockRace = {
        id: 'race-1',
        name: 'Test Race',
        startTime: new Date('2024-11-21T11:00:00'),
        status: 'completed' as const,
        course: 'Triangle'
      };

      // Set up boats
      const mockBoats = [
        {
          id: 'boat-1',
          sailNumber: 'HKG 59',
          skipper: 'Sailor 1',
          class: 'Dragon'
        },
        {
          id: 'boat-2',
          sailNumber: 'GBR 8',
          skipper: 'Sailor 2',
          class: 'Dragon'
        }
      ];

      // Set up results
      const mockResults = [
        {
          raceId: 'race-1',
          boatId: 'boat-1',
          position: 1,
          finishTime: new Date('2024-11-21T12:45:30'),
          points: 1
        },
        {
          raceId: 'race-1',
          boatId: 'boat-2',
          position: 2,
          finishTime: new Date('2024-11-21T12:45:45'),
          points: 2
        }
      ];

      act(() => {
        result.current.addRace(mockRace);
        result.current.setBoats(mockBoats);
        result.current.setResults(mockResults);
        result.current.setSelectedRace(mockRace);
      });

      expect(result.current.races).toHaveLength(1);
      expect(result.current.boats).toHaveLength(2);
      expect(result.current.results).toHaveLength(2);
      expect(result.current.selectedRace).toEqual(mockRace);

      // Verify results are linked to correct race and boats
      expect(result.current.results[0].raceId).toBe('race-1');
      expect(result.current.results[0].boatId).toBe('boat-1');
      expect(result.current.results[1].raceId).toBe('race-1');
      expect(result.current.results[1].boatId).toBe('boat-2');
    });
  });

  describe('Data Persistence', () => {
    it('should handle store rehydration', async () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockRace = {
        id: 'persistent-race',
        name: 'Persistent Race',
        startTime: new Date('2024-11-21T11:00:00'),
        status: 'upcoming' as const,
        course: 'Triangle'
      };

      const mockBoat = {
        id: 'persistent-boat',
        sailNumber: 'PERSIST 1',
        skipper: 'Persistent Sailor',
        class: 'Dragon'
      };

      const mockResult = {
        raceId: 'persistent-race',
        boatId: 'persistent-boat',
        position: 1,
        points: 1
      };

      act(() => {
        result.current.addRace(mockRace);
        result.current.setBoats([mockBoat]);
        result.current.addResult(mockResult);
        result.current.setSelectedRace(mockRace);
      });

      // Simulate store rehydration
      const storeSnapshot = StoreTestUtils.createStoreSnapshot(useRegattaStore);
      
      expect(storeSnapshot.races).toHaveLength(1);
      expect(storeSnapshot.boats).toHaveLength(1);
      expect(storeSnapshot.results).toHaveLength(1);
      expect(storeSnapshot.selectedRace?.id).toBe('persistent-race');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data sets', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      act(() => {
        result.current.setRaces([]);
        result.current.setBoats([]);
        result.current.setResults([]);
      });

      expect(result.current.races).toEqual([]);
      expect(result.current.boats).toEqual([]);
      expect(result.current.results).toEqual([]);
    });

    it('should handle partial race updates', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const mockRace = {
        id: 'race-1',
        name: 'Original Name',
        startTime: new Date('2024-11-21T11:00:00'),
        status: 'upcoming' as const,
        course: 'Original Course'
      };

      act(() => {
        result.current.addRace(mockRace);
      });

      // Update only name
      act(() => {
        result.current.updateRace('race-1', { name: 'Updated Name' });
      });

      const updatedRace = result.current.races[0];
      expect(updatedRace.name).toBe('Updated Name');
      expect(updatedRace.status).toBe('upcoming'); // Should remain unchanged
      expect(updatedRace.course).toBe('Original Course'); // Should remain unchanged
    });

    it('should handle duplicate boat entries', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const boat1 = {
        id: 'boat-1',
        sailNumber: 'HKG 59',
        skipper: 'Sailor 1',
        class: 'Dragon'
      };

      const boat2 = {
        id: 'boat-1', // Same ID
        sailNumber: 'HKG 60', // Different sail number
        skipper: 'Sailor 2',
        class: 'Dragon'
      };

      act(() => {
        result.current.setBoats([boat1, boat2]);
      });

      // Both boats should be stored (store doesn't enforce uniqueness)
      expect(result.current.boats).toHaveLength(2);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const { result } = renderHook(() => useRegattaStore());
      
      const startTime = performance.now();
      
      // Create 100 races
      const races = Array.from({ length: 100 }, (_, i) => ({
        id: `race-${i}`,
        name: `Race ${i}`,
        startTime: new Date(`2024-11-21T${String(11 + Math.floor(i / 10)).padStart(2, '0')}:${String((i % 10) * 6).padStart(2, '0')}:00`),
        status: i % 3 === 0 ? 'upcoming' as const : i % 3 === 1 ? 'active' as const : 'completed' as const,
        course: i % 2 === 0 ? 'Triangle' : 'Windward-Leeward'
      }));

      // Create 50 boats
      const boats = Array.from({ length: 50 }, (_, i) => ({
        id: `boat-${i}`,
        sailNumber: `TEST ${i}`,
        skipper: `Skipper ${i}`,
        crew: i % 2 === 0 ? `Crew ${i}` : undefined,
        class: 'Dragon'
      }));

      // Create 500 results (10 races × 50 boats)
      const results = Array.from({ length: 500 }, (_, i) => ({
        raceId: `race-${Math.floor(i / 50)}`,
        boatId: `boat-${i % 50}`,
        position: (i % 50) + 1,
        points: (i % 50) + 1
      }));

      act(() => {
        result.current.setRaces(races);
        result.current.setBoats(boats);
        result.current.setResults(results);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle large datasets in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
      expect(result.current.races).toHaveLength(100);
      expect(result.current.boats).toHaveLength(50);
      expect(result.current.results).toHaveLength(500);
    });
  });
});