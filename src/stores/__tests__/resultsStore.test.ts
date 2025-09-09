import { act, renderHook } from '@testing-library/react-native';
import { useResultsStore } from '../resultsStore';
import { MockDataFactory, StoreTestUtils } from '../../testing/testingSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('ResultsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      const { clearResults } = useResultsStore.getState();
      clearResults();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useResultsStore());
      
      expect(result.current.championship).toBeNull();
      expect(result.current.competitors).toEqual([]);
      expect(result.current.races).toEqual([]);
      expect(result.current.overallStandings).toEqual([]);
      expect(result.current.raceResults).toEqual([]);
      expect(result.current.currentRace).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdate).toBeNull();
      expect(result.current.selectedClass).toBe('all');
      expect(result.current.standingsView).toBe('after-discards');
    });
  });

  describe('Competitor Management', () => {
    it('should add competitors', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockCompetitor = {
        id: 'comp-1',
        sailNumber: 'HKG 59',
        country: 'Hong Kong',
        countryCode: 'HK',
        skipper: 'Test Sailor',
        crew: ['Crew 1'],
        yacht: { name: 'Test Yacht', builder: 'Test Builder', year: 2020 },
        isVerified: true,
        participantType: 'competitor' as const,
        registrationDate: new Date().toISOString()
      };

      act(() => {
        result.current.addCompetitor(mockCompetitor);
      });

      expect(result.current.competitors).toHaveLength(1);
      expect(result.current.competitors[0]).toEqual(mockCompetitor);
    });

    it('should update competitor info', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockCompetitor = {
        id: 'comp-1',
        sailNumber: 'HKG 59',
        country: 'Hong Kong',
        countryCode: 'HK',
        skipper: 'Test Sailor',
        isVerified: false,
        participantType: 'competitor' as const,
        registrationDate: new Date().toISOString(),
        yacht: {}
      };

      act(() => {
        result.current.addCompetitor(mockCompetitor);
      });

      act(() => {
        result.current.updateCompetitorInfo('comp-1', { 
          isVerified: true,
          crew: ['New Crew'] 
        });
      });

      const updatedCompetitor = result.current.competitors.find(c => c.id === 'comp-1');
      expect(updatedCompetitor?.isVerified).toBe(true);
      expect(updatedCompetitor?.crew).toEqual(['New Crew']);
    });

    it('should get competitor by ID', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockCompetitor = {
        id: 'comp-1',
        sailNumber: 'HKG 59',
        country: 'Hong Kong',
        countryCode: 'HK',
        skipper: 'Test Sailor',
        isVerified: true,
        participantType: 'competitor' as const,
        registrationDate: new Date().toISOString(),
        yacht: {}
      };

      act(() => {
        result.current.addCompetitor(mockCompetitor);
      });

      const foundCompetitor = result.current.getCompetitorById('comp-1');
      expect(foundCompetitor).toEqual(mockCompetitor);

      const notFound = result.current.getCompetitorById('non-existent');
      expect(notFound).toBeUndefined();
    });

    it('should get competitor by sail number', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockCompetitor = {
        id: 'comp-1',
        sailNumber: 'HKG 59',
        country: 'Hong Kong',
        countryCode: 'HK',
        skipper: 'Test Sailor',
        isVerified: true,
        participantType: 'competitor' as const,
        registrationDate: new Date().toISOString(),
        yacht: {}
      };

      act(() => {
        result.current.addCompetitor(mockCompetitor);
      });

      const foundCompetitor = result.current.getCompetitorBySailNumber('HKG 59');
      expect(foundCompetitor).toEqual(mockCompetitor);

      const notFound = result.current.getCompetitorBySailNumber('GBR 8');
      expect(notFound).toBeUndefined();
    });
  });

  describe('Race Management', () => {
    it('should add races', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockRace = {
        id: 'race-1',
        number: 1,
        name: 'Race 1',
        date: '2024-11-21',
        startTime: '11:00',
        status: 'scheduled' as const,
        course: 'Triangle',
        results: [],
        isDiscardable: true
      };

      act(() => {
        result.current.addRace(mockRace);
      });

      expect(result.current.races).toHaveLength(1);
      expect(result.current.races[0]).toEqual(mockRace);
    });

    it('should update race info', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockRace = {
        id: 'race-1',
        number: 1,
        name: 'Race 1',
        date: '2024-11-21',
        startTime: '11:00',
        status: 'scheduled' as const,
        course: 'Triangle',
        results: [],
        isDiscardable: true
      };

      act(() => {
        result.current.addRace(mockRace);
      });

      act(() => {
        result.current.updateRace('race-1', { 
          status: 'racing',
          windConditions: { speed: 15, direction: 45, conditions: 'Fresh' }
        });
      });

      const updatedRace = result.current.races.find(r => r.id === 'race-1');
      expect(updatedRace?.status).toBe('racing');
      expect(updatedRace?.windConditions?.speed).toBe(15);
    });

    it('should get race by ID', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockRace = {
        id: 'race-1',
        number: 1,
        name: 'Race 1',
        date: '2024-11-21',
        startTime: '11:00',
        status: 'scheduled' as const,
        course: 'Triangle',
        results: [],
        isDiscardable: true
      };

      act(() => {
        result.current.addRace(mockRace);
      });

      const foundRace = result.current.getRaceById('race-1');
      expect(foundRace).toEqual(mockRace);

      const notFound = result.current.getRaceById('non-existent');
      expect(notFound).toBeUndefined();
    });

    it('should get completed races', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const races = [
        {
          id: 'race-1',
          number: 1,
          name: 'Race 1',
          date: '2024-11-21',
          startTime: '11:00',
          status: 'finished' as const,
          course: 'Triangle',
          results: [],
          isDiscardable: true
        },
        {
          id: 'race-2',
          number: 2,
          name: 'Race 2',
          date: '2024-11-21',
          startTime: '13:00',
          status: 'racing' as const,
          course: 'Windward-Leeward',
          results: [],
          isDiscardable: true
        },
        {
          id: 'race-3',
          number: 3,
          name: 'Race 3',
          date: '2024-11-22',
          startTime: '11:00',
          status: 'finished' as const,
          course: 'Triangle',
          results: [],
          isDiscardable: true
        }
      ];

      act(() => {
        races.forEach(race => result.current.addRace(race));
      });

      const completedRaces = result.current.getCompletedRaces();
      expect(completedRaces).toHaveLength(2);
      expect(completedRaces.map(r => r.id)).toEqual(['race-1', 'race-3']);
    });
  });

  describe('Race Results', () => {
    it('should add race results', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockResult = {
        id: 'result-1',
        raceId: 'race-1',
        raceNumber: 1,
        sailNumber: 'HKG 59',
        competitorId: 'comp-1',
        position: 1,
        points: 1,
        finishTime: '12:45:30',
        status: 'finished' as const
      };

      act(() => {
        result.current.addRaceResult(mockResult);
      });

      expect(result.current.raceResults).toHaveLength(1);
      expect(result.current.raceResults[0]).toEqual(mockResult);
    });

    it('should update race results', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockRace = {
        id: 'race-1',
        number: 1,
        name: 'Race 1',
        date: '2024-11-21',
        startTime: '11:00',
        status: 'finished' as const,
        course: 'Triangle',
        results: [],
        isDiscardable: true
      };

      const mockResults = [
        {
          id: 'result-1',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'HKG 59',
          competitorId: 'comp-1',
          position: 1,
          points: 1,
          status: 'finished' as const
        },
        {
          id: 'result-2',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'GBR 8',
          competitorId: 'comp-2',
          position: 2,
          points: 2,
          status: 'finished' as const
        }
      ];

      act(() => {
        result.current.addRace(mockRace);
      });

      act(() => {
        result.current.updateRaceResults('race-1', mockResults);
      });

      expect(result.current.raceResults).toHaveLength(2);
      
      const updatedRace = result.current.races.find(r => r.id === 'race-1');
      expect(updatedRace?.results).toEqual(mockResults);
    });

    it('should get race leaderboard', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockResults = [
        {
          id: 'result-1',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'GBR 8',
          competitorId: 'comp-2',
          position: 2,
          points: 2,
          status: 'finished' as const
        },
        {
          id: 'result-2',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'HKG 59',
          competitorId: 'comp-1',
          position: 1,
          points: 1,
          status: 'finished' as const
        },
        {
          id: 'result-3',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'AUS 12',
          competitorId: 'comp-3',
          position: null,
          points: 4,
          status: 'dnf' as const
        }
      ];

      act(() => {
        mockResults.forEach(result => result.current.addRaceResult(result));
      });

      const leaderboard = result.current.getRaceLeaderboard('race-1');
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].position).toBe(1); // HKG 59 first
      expect(leaderboard[1].position).toBe(2); // GBR 8 second
      expect(leaderboard[2].position).toBeNull(); // AUS 12 DNF
    });

    it('should get competitor results', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockResults = [
        {
          id: 'result-1',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'HKG 59',
          competitorId: 'comp-1',
          position: 1,
          points: 1,
          status: 'finished' as const
        },
        {
          id: 'result-2',
          raceId: 'race-2',
          raceNumber: 2,
          sailNumber: 'HKG 59',
          competitorId: 'comp-1',
          position: 3,
          points: 3,
          status: 'finished' as const
        },
        {
          id: 'result-3',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'GBR 8',
          competitorId: 'comp-2',
          position: 2,
          points: 2,
          status: 'finished' as const
        }
      ];

      act(() => {
        mockResults.forEach(result => result.current.addRaceResult(result));
      });

      const competitorResults = result.current.getCompetitorResults('comp-1');
      expect(competitorResults).toHaveLength(2);
      expect(competitorResults.map(r => r.points)).toEqual([1, 3]);
    });
  });

  describe('Standings Calculation', () => {
    it('should calculate overall standings', () => {
      const { result } = renderHook(() => useResultsStore());
      
      // Set up championship
      const mockChampionship = {
        id: 'test-championship',
        name: 'Test Championship',
        startDate: '2024-11-21',
        endDate: '2024-11-24',
        venue: 'Test Venue',
        raceCount: 3,
        discardCount: 1,
        scoringSystem: 'low-point' as const,
        classes: ['Dragon']
      };

      // Set up competitors
      const mockCompetitors = [
        {
          id: 'comp-1',
          sailNumber: 'HKG 59',
          country: 'Hong Kong',
          countryCode: 'HK',
          skipper: 'Sailor 1',
          isVerified: true,
          participantType: 'competitor' as const,
          registrationDate: new Date().toISOString(),
          yacht: {}
        },
        {
          id: 'comp-2',
          sailNumber: 'GBR 8',
          country: 'Great Britain',
          countryCode: 'GB',
          skipper: 'Sailor 2',
          isVerified: true,
          participantType: 'competitor' as const,
          registrationDate: new Date().toISOString(),
          yacht: {}
        }
      ];

      // Set up race results
      const mockResults = [
        {
          id: 'result-1',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'HKG 59',
          competitorId: 'comp-1',
          position: 1,
          points: 1,
          status: 'finished' as const
        },
        {
          id: 'result-2',
          raceId: 'race-1',
          raceNumber: 1,
          sailNumber: 'GBR 8',
          competitorId: 'comp-2',
          position: 2,
          points: 2,
          status: 'finished' as const
        },
        {
          id: 'result-3',
          raceId: 'race-2',
          raceNumber: 2,
          sailNumber: 'HKG 59',
          competitorId: 'comp-1',
          position: 3,
          points: 3,
          status: 'finished' as const
        },
        {
          id: 'result-4',
          raceId: 'race-2',
          raceNumber: 2,
          sailNumber: 'GBR 8',
          competitorId: 'comp-2',
          position: 1,
          points: 1,
          status: 'finished' as const
        }
      ];

      act(() => {
        useResultsStore.setState({
          championship: mockChampionship,
          competitors: mockCompetitors,
          raceResults: mockResults
        });
      });

      const standings = result.current.calculateStandings();
      
      expect(standings).toHaveLength(2);
      
      // Both have same net points (3) after discard, so order by total points
      const hkgStanding = standings.find(s => s.sailNumber === 'HKG 59');
      const gbrStanding = standings.find(s => s.sailNumber === 'GBR 8');
      
      expect(hkgStanding?.totalPoints).toBe(4); // 1 + 3
      expect(hkgStanding?.netPoints).toBe(3);   // 4 - 1 (discard worst)
      expect(gbrStanding?.totalPoints).toBe(3); // 2 + 1
      expect(gbrStanding?.netPoints).toBe(2);   // 3 - 1 (discard worst)
      
      expect(gbrStanding?.position).toBe(1); // Better net points
      expect(hkgStanding?.position).toBe(2);
    });

    it('should update standings when race results change', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockChampionship = {
        id: 'test-championship',
        name: 'Test Championship',
        startDate: '2024-11-21',
        endDate: '2024-11-24',
        venue: 'Test Venue',
        raceCount: 2,
        discardCount: 0,
        scoringSystem: 'low-point' as const,
        classes: ['Dragon']
      };

      const mockCompetitor = {
        id: 'comp-1',
        sailNumber: 'HKG 59',
        country: 'Hong Kong',
        countryCode: 'HK',
        skipper: 'Test Sailor',
        isVerified: true,
        participantType: 'competitor' as const,
        registrationDate: new Date().toISOString(),
        yacht: {}
      };

      act(() => {
        useResultsStore.setState({
          championship: mockChampionship,
          competitors: [mockCompetitor]
        });
      });

      const standings = result.current.updateStandings([{
        position: 1,
        sailNumber: 'HKG 59',
        competitorId: 'comp-1',
        totalPoints: 3,
        netPoints: 3,
        raceScores: [1, 2],
        discards: []
      }]);

      expect(result.current.overallStandings).toHaveLength(1);
      expect(result.current.overallStandings[0].position).toBe(1);
    });
  });

  describe('Current Race', () => {
    it('should set current race', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockRace = {
        id: 'race-1',
        number: 1,
        name: 'Race 1',
        date: '2024-11-21',
        startTime: '11:00',
        status: 'racing' as const,
        course: 'Triangle',
        results: [],
        isDiscardable: true
      };

      act(() => {
        result.current.setCurrentRace(mockRace);
      });

      expect(result.current.currentRace).toEqual(mockRace);

      act(() => {
        result.current.setCurrentRace(null);
      });

      expect(result.current.currentRace).toBeNull();
    });
  });

  describe('Filters and Views', () => {
    it('should set selected class', () => {
      const { result } = renderHook(() => useResultsStore());

      expect(result.current.selectedClass).toBe('all');

      act(() => {
        result.current.setSelectedClass('Dragon');
      });

      expect(result.current.selectedClass).toBe('Dragon');
    });

    it('should set standings view', () => {
      const { result } = renderHook(() => useResultsStore());

      expect(result.current.standingsView).toBe('after-discards');

      act(() => {
        result.current.setStandingsView('overall');
      });

      expect(result.current.standingsView).toBe('overall');
    });

    it('should filter competitors by class', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const mockCompetitors = [
        {
          id: 'comp-1',
          sailNumber: 'HKG 59',
          country: 'Hong Kong',
          countryCode: 'HK',
          skipper: 'Sailor 1',
          isVerified: true,
          participantType: 'competitor' as const,
          registrationDate: new Date().toISOString(),
          yacht: {}
        },
        {
          id: 'comp-2',
          sailNumber: 'GBR 8',
          country: 'Great Britain',
          countryCode: 'GB',
          skipper: 'Sailor 2',
          isVerified: true,
          participantType: 'reserve' as const,
          registrationDate: new Date().toISOString(),
          yacht: {}
        }
      ];

      act(() => {
        useResultsStore.setState({ competitors: mockCompetitors });
      });

      const allCompetitors = result.current.filterCompetitorsByClass('all');
      expect(allCompetitors).toHaveLength(2);

      const activeCompetitors = result.current.filterCompetitorsByClass('Dragon');
      expect(activeCompetitors).toHaveLength(1);
      expect(activeCompetitors[0].participantType).toBe('competitor');
    });
  });

  describe('Loading and Error States', () => {
    it('should manage loading state', () => {
      const { result } = renderHook(() => useResultsStore());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it('should manage error state', () => {
      const { result } = renderHook(() => useResultsStore());

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid updates efficiently', () => {
      const { result } = renderHook(() => useResultsStore());
      
      const startTime = performance.now();
      
      // Perform 50 rapid competitor updates
      for (let i = 0; i < 50; i++) {
        act(() => {
          const mockCompetitor = {
            id: `comp-${i}`,
            sailNumber: `TEST ${i}`,
            country: 'Test Country',
            countryCode: 'TC',
            skipper: `Skipper ${i}`,
            isVerified: true,
            participantType: 'competitor' as const,
            registrationDate: new Date().toISOString(),
            yacht: { name: `Yacht ${i}` }
          };
          result.current.addCompetitor(mockCompetitor);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all updates in reasonable time (< 200ms)
      expect(duration).toBeLessThan(200);
      expect(result.current.competitors).toHaveLength(50);
    });
  });
});