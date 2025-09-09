import { act, renderHook } from '@testing-library/react-native';
import { useSocialStore } from '../socialStore';
import { MockDataFactory, StoreTestUtils } from '../../testing/testingSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('SocialStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      const { clearSocialData } = useSocialStore.getState();
      clearSocialData();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSocialStore());
      
      expect(result.current.whatsappGroups).toEqual([]);
      expect(result.current.joinedGroups).toEqual([]);
      expect(result.current.activeDiscussions).toEqual([]);
      expect(result.current.connections).toEqual([]);
      expect(result.current.groupInteractions).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastSync).toBeNull();
      expect(result.current.availableCategories).toHaveLength(6);
      expect(result.current.groupInvitations).toEqual([]);
      expect(result.current.blockedGroups).toEqual([]);
    });
  });

  describe('Group Management', () => {
    it('should join a group successfully', async () => {
      const { result } = renderHook(() => useSocialStore());
      
      const mockGroup = {
        id: 'test-group',
        title: 'Test Racing Group',
        description: 'Test description',
        category: 'active-racing' as const,
        memberCount: 50,
        verificationStatus: 'verified' as const,
        createdAt: new Date().toISOString(),
        admins: ['admin-1']
      };

      // Add the group to the store first
      act(() => {
        const store = useSocialStore.getState();
        useSocialStore.setState({
          whatsappGroups: [...store.whatsappGroups, mockGroup]
        });
      });

      // Join the group
      await act(async () => {
        await result.current.joinGroup('test-group');
      });

      expect(result.current.joinedGroups).toContain('test-group');
      expect(result.current.groupInteractions).toHaveLength(1);
      expect(result.current.groupInteractions[0].type).toBe('join');
    });

    it('should prevent joining invite-only groups', async () => {
      const { result } = renderHook(() => useSocialStore());
      
      const mockGroup = {
        id: 'vip-group',
        title: 'VIP Group',
        description: 'Exclusive group',
        category: 'vip-hospitality' as const,
        memberCount: 20,
        isInviteOnly: true,
        verificationStatus: 'verified' as const,
        createdAt: new Date().toISOString(),
        admins: ['admin-1']
      };

      // Add the group to store
      act(() => {
        const store = useSocialStore.getState();
        useSocialStore.setState({
          whatsappGroups: [...store.whatsappGroups, mockGroup]
        });
      });

      // Try to join invite-only group
      await act(async () => {
        await result.current.joinGroup('vip-group');
      });

      expect(result.current.joinedGroups).not.toContain('vip-group');
      expect(result.current.error).toContain('requires invitation');
    });

    it('should leave a group successfully', async () => {
      const { result } = renderHook(() => useSocialStore());
      
      // Set up initial state with joined group
      act(() => {
        useSocialStore.setState({
          joinedGroups: ['test-group']
        });
      });

      await act(async () => {
        await result.current.leaveGroup('test-group');
      });

      expect(result.current.joinedGroups).not.toContain('test-group');
      expect(result.current.groupInteractions).toHaveLength(1);
      expect(result.current.groupInteractions[0].type).toBe('leave');
    });

    it('should update group status', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const mockGroup = {
        id: 'test-group',
        title: 'Test Group',
        description: 'Test description',
        category: 'active-racing' as const,
        memberCount: 50,
        verificationStatus: 'pending' as const,
        createdAt: new Date().toISOString(),
        admins: ['admin-1']
      };

      act(() => {
        useSocialStore.setState({
          whatsappGroups: [mockGroup]
        });
      });

      act(() => {
        result.current.updateGroupStatus('test-group', { 
          verificationStatus: 'verified',
          memberCount: 75 
        });
      });

      const updatedGroup = result.current.whatsappGroups.find(g => g.id === 'test-group');
      expect(updatedGroup?.verificationStatus).toBe('verified');
      expect(updatedGroup?.memberCount).toBe(75);
    });
  });

  describe('Group Discovery', () => {
    beforeEach(() => {
      const mockGroups = [
        {
          id: 'racing-1',
          title: 'Racing Group 1',
          description: 'Active racing discussion',
          category: 'active-racing' as const,
          memberCount: 80,
          verificationStatus: 'verified' as const,
          createdAt: new Date().toISOString(),
          admins: ['admin-1']
        },
        {
          id: 'spectator-1',
          title: 'Spectator Group',
          description: 'Family and friends',
          category: 'spectators-families' as const,
          memberCount: 150,
          verificationStatus: 'verified' as const,
          createdAt: new Date().toISOString(),
          admins: ['admin-2']
        },
        {
          id: 'vip-1',
          title: 'VIP Hospitality',
          description: 'Premium experiences',
          category: 'vip-hospitality' as const,
          memberCount: 25,
          isVIP: true,
          verificationStatus: 'verified' as const,
          createdAt: new Date().toISOString(),
          admins: ['admin-3']
        }
      ];

      act(() => {
        useSocialStore.setState({
          whatsappGroups: mockGroups
        });
      });
    });

    it('should get groups by category', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const racingGroups = result.current.getGroupsByCategory('active-racing');
      expect(racingGroups).toHaveLength(1);
      expect(racingGroups[0].id).toBe('racing-1');

      const spectatorGroups = result.current.getGroupsByCategory('spectators-families');
      expect(spectatorGroups).toHaveLength(1);
      expect(spectatorGroups[0].id).toBe('spectator-1');
    });

    it('should get joined groups', () => {
      const { result } = renderHook(() => useSocialStore());
      
      act(() => {
        useSocialStore.setState({
          joinedGroups: ['racing-1', 'vip-1']
        });
      });

      const joinedGroups = result.current.getJoinedGroups();
      expect(joinedGroups).toHaveLength(2);
      expect(joinedGroups.map(g => g.id)).toEqual(['racing-1', 'vip-1']);
    });

    it('should get available groups', () => {
      const { result } = renderHook(() => useSocialStore());
      
      act(() => {
        useSocialStore.setState({
          joinedGroups: ['racing-1'],
          blockedGroups: ['vip-1']
        });
      });

      const availableGroups = result.current.getAvailableGroups();
      expect(availableGroups).toHaveLength(1);
      expect(availableGroups[0].id).toBe('spectator-1');
    });

    it('should search groups', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const racingResults = result.current.searchGroups('racing');
      expect(racingResults).toHaveLength(1);
      expect(racingResults[0].id).toBe('racing-1');

      const familyResults = result.current.searchGroups('family');
      expect(familyResults).toHaveLength(1);
      expect(familyResults[0].id).toBe('spectator-1');
    });
  });

  describe('Discussion Management', () => {
    it('should update active discussions', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const mockDiscussions = [
        {
          id: 'disc-1',
          groupId: 'racing-1',
          title: 'Race Commentary',
          type: 'race-commentary' as const,
          participantCount: 50,
          isLive: true
        }
      ];

      act(() => {
        result.current.updateActiveDiscussions(mockDiscussions);
      });

      expect(result.current.activeDiscussions).toEqual(mockDiscussions);
    });

    it('should join and leave discussions', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const mockDiscussion = {
        id: 'disc-1',
        groupId: 'racing-1',
        title: 'Race Commentary',
        type: 'race-commentary' as const,
        participantCount: 50,
        isLive: true
      };

      act(() => {
        result.current.updateActiveDiscussions([mockDiscussion]);
      });

      act(() => {
        result.current.joinDiscussion('disc-1');
      });

      expect(result.current.groupInteractions).toHaveLength(1);
      expect(result.current.groupInteractions[0].type).toBe('join');
      expect(result.current.groupInteractions[0].metadata?.discussionId).toBe('disc-1');

      act(() => {
        result.current.leaveDiscussion('disc-1');
      });

      expect(result.current.groupInteractions).toHaveLength(2);
      expect(result.current.groupInteractions[1].type).toBe('leave');
    });
  });

  describe('Connection Management', () => {
    it('should add and remove connections', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const mockConnection = MockDataFactory.createMockConnection({
        id: 'conn-1',
        name: 'Test Sailor',
        role: 'competitor',
        country: 'HKG'
      });

      act(() => {
        result.current.addConnection(mockConnection);
      });

      expect(result.current.connections).toHaveLength(1);
      expect(result.current.connections[0]).toEqual(mockConnection);

      act(() => {
        result.current.removeConnection('conn-1');
      });

      expect(result.current.connections).toHaveLength(0);
    });

    it('should update connections', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const mockConnection = MockDataFactory.createMockConnection({
        id: 'conn-1',
        name: 'Test Sailor',
        isVerified: false
      });

      act(() => {
        result.current.addConnection(mockConnection);
      });

      act(() => {
        result.current.updateConnection('conn-1', { isVerified: true });
      });

      expect(result.current.connections[0].isVerified).toBe(true);
    });

    it('should get connections by role', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const mockConnections = [
        MockDataFactory.createMockConnection({ id: 'comp-1', role: 'competitor' }),
        MockDataFactory.createMockConnection({ id: 'coach-1', role: 'coach' }),
        MockDataFactory.createMockConnection({ id: 'comp-2', role: 'competitor' }),
      ];

      act(() => {
        mockConnections.forEach(conn => result.current.addConnection(conn));
      });

      const competitors = result.current.getConnectionsByRole('competitor');
      expect(competitors).toHaveLength(2);

      const coaches = result.current.getConnectionsByRole('coach');
      expect(coaches).toHaveLength(1);
    });
  });

  describe('Group Invitations', () => {
    it('should respond to invitations', () => {
      const { result } = renderHook(() => useSocialStore());
      
      act(() => {
        useSocialStore.setState({
          groupInvitations: ['group-1', 'group-2']
        });
      });

      expect(result.current.groupInvitations).toHaveLength(2);

      act(() => {
        result.current.respondToInvitation('group-1', false);
      });

      expect(result.current.groupInvitations).toEqual(['group-2']);
    });
  });

  describe('Moderation', () => {
    it('should block and unblock groups', () => {
      const { result } = renderHook(() => useSocialStore());
      
      act(() => {
        useSocialStore.setState({
          joinedGroups: ['group-1']
        });
      });

      act(() => {
        result.current.blockGroup('group-1');
      });

      expect(result.current.blockedGroups).toContain('group-1');
      expect(result.current.joinedGroups).not.toContain('group-1');

      act(() => {
        result.current.unblockGroup('group-1');
      });

      expect(result.current.blockedGroups).not.toContain('group-1');
    });
  });

  describe('Analytics', () => {
    it('should calculate group stats', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const mockGroup = {
        id: 'test-group',
        title: 'Test Group',
        description: 'Test description',
        category: 'active-racing' as const,
        memberCount: 150,
        isActive: true,
        verificationStatus: 'verified' as const,
        createdAt: new Date().toISOString(),
        admins: ['admin-1']
      };

      const mockInteractions = [
        { groupId: 'test-group', type: 'join' as const, timestamp: new Date().toISOString() },
        { groupId: 'test-group', type: 'message' as const, timestamp: new Date().toISOString() },
      ];

      act(() => {
        useSocialStore.setState({
          whatsappGroups: [mockGroup],
          groupInteractions: mockInteractions
        });
      });

      const stats = result.current.getGroupStats('test-group');
      
      expect(stats.memberGrowth).toBe(15); // > 100 members
      expect(stats.activityLevel).toBe('high'); // isActive = true
      expect(stats.engagementScore).toBeGreaterThan(0);
    });

    it('should return default stats for non-existent group', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const stats = result.current.getGroupStats('non-existent');
      
      expect(stats.memberGrowth).toBe(0);
      expect(stats.activityLevel).toBe('low');
      expect(stats.engagementScore).toBe(0);
    });
  });

  describe('Loading and Error States', () => {
    it('should manage loading state', () => {
      const { result } = renderHook(() => useSocialStore());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it('should manage error state', () => {
      const { result } = renderHook(() => useSocialStore());

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });
  });

  describe('Data Persistence', () => {
    it('should handle store rehydration', async () => {
      const { result } = renderHook(() => useSocialStore());
      
      const mockGroup = {
        id: 'persistent-group',
        title: 'Persistent Group',
        description: 'Test description',
        category: 'active-racing' as const,
        memberCount: 50,
        verificationStatus: 'verified' as const,
        createdAt: new Date().toISOString(),
        admins: ['admin-1']
      };

      const mockConnection = MockDataFactory.createMockConnection({
        id: 'persistent-conn',
        name: 'Persistent Connection'
      });

      act(() => {
        useSocialStore.setState({
          whatsappGroups: [mockGroup],
          connections: [mockConnection],
          joinedGroups: ['persistent-group'],
          blockedGroups: ['blocked-group']
        });
      });

      // Simulate store rehydration
      const storeSnapshot = StoreTestUtils.createStoreSnapshot(useSocialStore);
      
      expect(storeSnapshot.whatsappGroups).toHaveLength(1);
      expect(storeSnapshot.connections).toHaveLength(1);
      expect(storeSnapshot.joinedGroups).toContain('persistent-group');
      expect(storeSnapshot.blockedGroups).toContain('blocked-group');
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid updates efficiently', () => {
      const { result } = renderHook(() => useSocialStore());
      
      const startTime = performance.now();
      
      // Perform 20 rapid connection updates
      for (let i = 0; i < 20; i++) {
        act(() => {
          const mockConnection = MockDataFactory.createMockConnection({
            id: `conn_${i}`,
            name: `Connection ${i}`,
            role: i % 2 === 0 ? 'competitor' : 'coach'
          });
          result.current.addConnection(mockConnection);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all updates in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
      expect(result.current.connections).toHaveLength(20);
    });
  });
});