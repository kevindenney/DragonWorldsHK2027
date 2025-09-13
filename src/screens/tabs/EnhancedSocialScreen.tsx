import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MessageCircle, 
  Users, 
  Search,
  Filter,
  Plus,
  Bell,
  Settings
} from 'lucide-react-native';

import { WhatsAppGroupCard } from '../../components/social/WhatsAppGroupCard';
import { IOSText, IOSButton, IOSCard, IOSSection, IOSSegmentedControl } from '../../components/ios';
import { 
  useSocialStore,
  useWhatsAppGroups,
  useJoinedGroups,
  useActiveDiscussions,
  useSocialLoading,
  useSocialError,
  type GroupCategory
} from '../../stores/socialStore';
import { useUserStore, useUserType } from '../../stores/userStore';
import type { SocialScreenProps } from '../../types/navigation';

interface LiveCommentaryProps {
  isActive: boolean;
  participantCount: number;
  recentMessages: Array<{
    author: string;
    message: string;
    timestamp: string;
  }>;
  onJoin: () => void;
}

const LiveCommentary: React.FC<LiveCommentaryProps> = ({
  isActive,
  participantCount,
  recentMessages,
  onJoin
}) => {
  if (!isActive) return null;

  return (
    <IOSCard style={styles.liveCard}>
      <View style={styles.liveHeader}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveIcon} />
          <IOSText style={styles.liveTitle}>LIVE RACE COMMENTARY</IOSText>
        </View>
        <IOSText style={styles.liveParticipants}>
          {participantCount} participants
        </IOSText>
      </View>
      
      <View style={styles.messagePreview}>
        {recentMessages.slice(0, 3).map((msg, index) => (
          <View key={index} style={styles.messageRow}>
            <IOSText style={styles.messageAuthor}>{msg.author}:</IOSText>
            <IOSText style={styles.messageText}>{msg.message}</IOSText>
          </View>
        ))}
      </View>
      
      <IOSButton
        title="Join Live Discussion"
        onPress={onJoin}
        variant="primary"
        style={styles.joinLiveButton}
        icon={<MessageCircle size={16} color="#FFFFFF" />}
      />
    </IOSCard>
  );
};

export const EnhancedSocialScreen: React.FC<SocialScreenProps> = ({ navigation }) => {
  const userType = useUserType();
  
  // Use stable references to store actions to prevent infinite re-renders
  const refreshGroups = useSocialStore(state => state.refreshGroups);
  const joinGroup = useSocialStore(state => state.joinGroup);
  const leaveGroup = useSocialStore(state => state.leaveGroup);
  const requestGroupAccess = useSocialStore(state => state.requestGroupAccess);
  const getGroupsByCategory = useSocialStore(state => state.getGroupsByCategory);
  const trackGroupInteraction = useSocialStore(state => state.trackGroupInteraction);
  
  const allGroups = useWhatsAppGroups();
  const joinedGroups = useJoinedGroups();
  const activeDiscussions = useActiveDiscussions();
  const loading = useSocialLoading();
  const error = useSocialError();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | GroupCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryOptions = [
    { label: 'All', value: 'all' },
    { label: 'Racing', value: 'active-racing' },
    { label: 'Spectators', value: 'spectators-families' },
    { label: 'VIP', value: 'vip-hospitality' },
    { label: 'Local', value: 'hong-kong-local' },
    { label: 'Tech', value: 'technical-support' }
  ];

  const loadInitialData = useCallback(async () => {
    try {
      await useSocialStore.getState().refreshGroups();
    } catch (error) {
      console.error('Error loading social data:', error);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshGroups();
    } catch (error) {
      console.error('Error refreshing social data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await joinGroup(groupId);
      Alert.alert('Success', 'Joined group successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join group');
    }
  };

  const handleRequestAccess = async (groupId: string) => {
    Alert.prompt(
      'Request Access',
      'Add a message to your access request (optional):',
      async (message) => {
        try {
          await requestGroupAccess(groupId, message);
          Alert.alert('Request Sent', 'Your access request has been submitted.');
        } catch (error) {
          Alert.alert('Error', error instanceof Error ? error.message : 'Failed to request access');
        }
      },
      'plain-text',
      '',
      'default'
    );
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await leaveGroup(groupId);
      Alert.alert('Left Group', 'You have left the group.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to leave group');
    }
  };

  const handleViewGroup = (groupId: string) => {
    // In a real app, this would open WhatsApp or navigate to group details
    trackGroupInteraction({
      groupId,
      type: 'view',
      timestamp: new Date().toISOString()
    });
    
    Alert.alert(
      'Open WhatsApp',
      'This will open the group in WhatsApp. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open WhatsApp', onPress: () => {
          // Here you would use Linking.openURL with the WhatsApp group link
          console.log('Opening WhatsApp group:', groupId);
        }}
      ]
    );
  };

  const handleJoinLiveDiscussion = () => {
    const liveDiscussion = activeDiscussions.find(d => d.isLive);
    if (liveDiscussion) {
      handleViewGroup(liveDiscussion.groupId);
    }
  };

  const getFilteredGroups = () => {
    let filtered = allGroups;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = getGroupsByCategory(selectedCategory as GroupCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group => 
        group.title.toLowerCase().includes(query) ||
        group.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredGroups = getFilteredGroups();
  const joinedGroupIds = joinedGroups.map(g => g.id);
  const liveDiscussion = activeDiscussions.find(d => d.isLive);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Image 
            source={require('../../../assets/dragon-logo.png')} 
            style={styles.dragonLogo}
            resizeMode="contain"
          />
          <IOSText style={styles.headerTitle}>Connect & Share</IOSText>
        </View>
        
        <View style={styles.headerActions}>
          <IOSButton
            title=""
            onPress={() => {/* Search functionality */}}
            variant="secondary"
            size="small"
            icon={<Search size={20} color="#007AFF" />}
            style={styles.headerButton}
          />
          <IOSButton
            title=""
            onPress={() => {/* Notifications */}}
            variant="secondary"
            size="small"
            icon={<Bell size={20} color="#007AFF" />}
            style={styles.headerButton}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Live Commentary Section */}
        {liveDiscussion && (
          <IOSSection style={styles.section}>
            <LiveCommentary
              isActive={liveDiscussion.isLive}
              participantCount={liveDiscussion.participantCount}
              recentMessages={liveDiscussion.lastMessage ? [
                {
                  author: liveDiscussion.lastMessage.author,
                  message: liveDiscussion.lastMessage.content,
                  timestamp: liveDiscussion.lastMessage.timestamp
                }
              ] : []}
              onJoin={handleJoinLiveDiscussion}
            />
          </IOSSection>
        )}

        {/* My Groups Section */}
        {joinedGroups.length > 0 && (
          <IOSSection style={styles.section}>
            <IOSText style={styles.sectionTitle}>My Groups</IOSText>
            {joinedGroups.slice(0, 3).map((group) => (
              <WhatsAppGroupCard
                key={group.id}
                group={group}
                isJoined={true}
                onJoin={handleJoinGroup}
                onRequestAccess={handleRequestAccess}
                onViewGroup={handleViewGroup}
                onLeave={handleLeaveGroup}
              />
            ))}
            {joinedGroups.length > 3 && (
              <IOSButton
                title={`View All ${joinedGroups.length} Groups`}
                onPress={() => {/* Navigate to full groups list */}}
                variant="secondary"
                style={styles.viewAllButton}
              />
            )}
          </IOSSection>
        )}

        {/* Category Filter */}
        <IOSSection style={styles.section}>
          <IOSText style={styles.sectionTitle}>Discover Groups</IOSText>
          <IOSSegmentedControl
            options={categoryOptions}
            selectedValue={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as 'all' | GroupCategory)}
            style={styles.categoryFilter}
          />
        </IOSSection>

        {/* Groups Grid */}
        <IOSSection style={styles.section}>
          {error && (
            <IOSCard style={styles.errorCard}>
              <IOSText style={styles.errorText}>{error}</IOSText>
              <IOSButton
                title="Retry"
                onPress={loadInitialData}
                variant="secondary"
                size="small"
                style={styles.retryButton}
              />
            </IOSCard>
          )}

          {loading ? (
            <IOSCard style={styles.loadingCard}>
              <IOSText style={styles.loadingText}>Loading groups...</IOSText>
            </IOSCard>
          ) : filteredGroups.length === 0 ? (
            <IOSCard style={styles.emptyCard}>
              <Users size={48} color="#8E8E93" style={styles.emptyIcon} />
              <IOSText style={styles.emptyTitle}>No Groups Found</IOSText>
              <IOSText style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search term' : 'Check back later for new groups'}
              </IOSText>
            </IOSCard>
          ) : (
            <View style={styles.groupsGrid}>
              {filteredGroups.map((group) => (
                <WhatsAppGroupCard
                  key={group.id}
                  group={group}
                  isJoined={joinedGroupIds.includes(group.id)}
                  onJoin={handleJoinGroup}
                  onRequestAccess={handleRequestAccess}
                  onViewGroup={handleViewGroup}
                  onLeave={handleLeaveGroup}
                />
              ))}
            </View>
          )}
        </IOSSection>

        {/* User Type Specific Features */}
        {userType === 'participant' && (
          <IOSSection style={styles.section}>
            <IOSText style={styles.sectionTitle}>Competitor Features</IOSText>
            <IOSCard style={styles.featureCard}>
              <IOSText style={styles.featureTitle}>Racing Network</IOSText>
              <IOSText style={styles.featureDescription}>
                Connect with fellow competitors, share experiences, and build your sailing network.
              </IOSText>
              <IOSButton
                title="Explore Connections"
                onPress={() => {/* Navigate to connections */}}
                variant="primary"
                size="small"
                style={styles.featureButton}
              />
            </IOSCard>
          </IOSSection>
        )}

        {/* Safety Information */}
        <IOSSection style={styles.section}>
          <IOSCard style={styles.safetyCard}>
            <IOSText style={styles.safetyTitle}>🛡️ Community Guidelines</IOSText>
            <IOSText style={styles.safetyText}>
              Please be respectful and follow WhatsApp group rules. Report any inappropriate behavior to group moderators.
            </IOSText>
          </IOSCard>
        </IOSSection>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragonLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  
  // Live Commentary
  liveCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  liveHeader: {
    marginBottom: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  liveTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
    letterSpacing: 0.5,
  },
  liveParticipants: {
    fontSize: 13,
    color: '#8E8E93',
  },
  messagePreview: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  messageAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 6,
  },
  messageText: {
    fontSize: 13,
    color: '#3C3C43',
    flex: 1,
  },
  joinLiveButton: {
    alignSelf: 'stretch',
  },

  // Category Filter
  categoryFilter: {
    marginHorizontal: 16,
  },

  // Groups
  groupsGrid: {
    paddingHorizontal: 16,
  },
  viewAllButton: {
    marginHorizontal: 16,
    marginTop: 12,
  },

  // Feature Cards
  featureCard: {
    marginHorizontal: 16,
    padding: 16,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 16,
    lineHeight: 20,
  },
  featureButton: {
    alignSelf: 'flex-start',
  },

  // Safety Card
  safetyCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#F8F9FF',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 13,
    color: '#3C3C43',
    lineHeight: 18,
  },

  // States
  loadingCard: {
    marginHorizontal: 16,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  errorCard: {
    marginHorizontal: 16,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    minWidth: 80,
  },
  emptyCard: {
    marginHorizontal: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});