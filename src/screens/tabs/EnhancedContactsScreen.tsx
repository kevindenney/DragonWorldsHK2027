import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MessageCircle, 
  Users, 
  Search,
  Filter,
  Phone,
  AlertTriangle,
  Radio,
  Star,
  Bell,
  Settings,
  X
} from 'lucide-react-native';

import { WhatsAppGroupCard } from '../../components/social/WhatsAppGroupCard';
import { ContactCard, EmergencyContactCard, CommunicationChannelCard } from '../../components/contacts';
import { IOSText, IOSButton, IOSCard, IOSSection, IOSSegmentedControl, IOSModal } from '../../components/ios';
import { 
  useSocialStore,
  type GroupCategory
} from '../../stores/socialStore';
import {
  useContactsStore
} from '../../stores/contactsStore';
import { useUserStore, useUserType } from '../../stores/userStore';
import type { MoreScreenProps } from '../../types/navigation';

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
        variant="filled"
        style={styles.joinLiveButton}
        icon={<MessageCircle size={16} color="#FFFFFF" />}
      />
    </IOSCard>
  );
};

export const EnhancedContactsScreen: React.FC<MoreScreenProps> = ({ navigation = null }) => {
  const userType = useUserType();
  
  // Use single store subscriptions to prevent cascading re-renders
  const socialStore = useSocialStore();
  const contactsStore = useContactsStore();
  
  // Extract data directly from stores to prevent individual hook subscriptions
  const allGroups = socialStore.whatsAppGroups;
  const joinedGroups = socialStore.joinedGroups;
  const activeDiscussions = socialStore.activeDiscussions;
  const socialLoading = socialStore.loading;
  const socialError = socialStore.error;
  
  const keyContacts = contactsStore.keyContacts;
  const emergencyContacts = contactsStore.emergencyContacts;
  const communicationChannels = contactsStore.communicationChannels;
  const contactsLoading = contactsStore.loading;
  const contactsError = contactsStore.error;
  const searchQuery = contactsStore.searchQuery;
  
  // Get filtered data safely with stable memoization
  const filteredContacts = useMemo(() => {
    return contactsStore.getFilteredContacts();
  }, [keyContacts, searchQuery, contactsStore.activeFilters]);
  
  const filteredEmergencyContacts = useMemo(() => {
    return contactsStore.getFilteredEmergencyContacts();
  }, [emergencyContacts, searchQuery]);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'emergency' | 'contacts' | 'groups' | 'channels'>('emergency');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const isInitialized = useRef(false);

  const tabOptions = [
    { label: 'Emergency', value: 'emergency' },
    { label: 'Contacts', value: 'contacts' },
    { label: 'Groups', value: 'groups' },
    { label: 'Channels', value: 'channels' }
  ];

  // Initialize data only once on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Only initialize once to prevent infinite loops
        if (!isInitialized.current) {
          console.log('🔄 Initializing EnhancedContactsScreen data...');
          
          // Always initialize default contacts on first load
          console.log('📞 Initializing default contacts...');
          useContactsStore.getState().initializeDefaultContacts();
          
          // Load social data
          console.log('👥 Refreshing social groups...');
          await useSocialStore.getState().refreshGroups();
          
          isInitialized.current = true;
          console.log('✅ EnhancedContactsScreen initialization complete');
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
      }
    };

    initializeData();
  }, []); // Empty dependency array - only run once on mount

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        socialStore.refreshGroups(),
        contactsStore.refreshContacts()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await socialStore.joinGroup(groupId);
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
          await socialStore.requestGroupAccess(groupId, message);
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
      await socialStore.leaveGroup(groupId);
      Alert.alert('Left Group', 'You have left the group.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to leave group');
    }
  };

  const handleViewGroup = (groupId: string) => {
    socialStore.trackGroupInteraction({
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

  const handleSearch = (query: string) => {
    contactsStore.setSearchQuery(query);
  };

  const handleClearFilters = () => {
    contactsStore.clearFilters();
  };

  const handleShowSearch = () => {
    setShowSearchModal(true);
  };

  const handleShowFilters = () => {
    setShowFilterModal(true);
  };

  const getFilteredGroups = () => {
    // Handle case where allGroups might be undefined
    let filtered = allGroups || [];
    
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group => 
        group.title.toLowerCase().includes(query) ||
        group.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredGroups = getFilteredGroups();
  const joinedGroupIds = (joinedGroups || []).map(g => g.id);
  const liveDiscussion = (activeDiscussions || []).find(d => d.isLive);
  const loading = socialLoading || contactsLoading;
  const error = socialError || contactsError;
  
  // Memoize the recent messages array to prevent infinite re-renders
  const recentMessages = useMemo(() => {
    if (!liveDiscussion?.lastMessage) return [];
    return [{
      author: liveDiscussion.lastMessage.author,
      message: liveDiscussion.lastMessage.content,
      timestamp: liveDiscussion.lastMessage.timestamp
    }];
  }, [liveDiscussion?.lastMessage]);

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'emergency':
        return (
          <View style={styles.tabContent}>
            {filteredEmergencyContacts.length === 0 ? (
              <IOSCard style={styles.emptyCard}>
                <AlertTriangle size={48} color="#8E8E93" style={styles.emptyIcon} />
                <IOSText style={styles.emptyTitle}>No Emergency Contacts</IOSText>
                <IOSText style={styles.emptySubtitle}>
                  Emergency contacts will appear here
                </IOSText>
              </IOSCard>
            ) : (
              filteredEmergencyContacts.map((contact) => (
                <EmergencyContactCard
                  key={contact.id}
                  contact={contact}
                />
              ))
            )}
          </View>
        );
      
      case 'contacts':
        return (
          <View style={styles.tabContent}>
            {filteredContacts.length === 0 ? (
              <IOSCard style={styles.emptyCard}>
                <Users size={48} color="#8E8E93" style={styles.emptyIcon} />
                <IOSText style={styles.emptyTitle}>No Contacts Found</IOSText>
                <IOSText style={styles.emptySubtitle}>
                  {searchQuery ? 'Try a different search term' : 'Key contacts will appear here'}
                </IOSText>
              </IOSCard>
            ) : (
              filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                />
              ))
            )}
          </View>
        );
      
      case 'groups':
        return (
          <View style={styles.tabContent}>
            {loading ? (
              <IOSCard style={styles.loadingCard}>
                <IOSText style={styles.loadingText}>Loading groups...</IOSText>
              </IOSCard>
            ) : filteredGroups.length === 0 ? (
              <IOSCard style={styles.emptyCard}>
                <Users size={48} color="#8E8E93" style={styles.emptyIcon} />
                <IOSText style={styles.emptyTitle}>No Groups Found</IOSText>
                <IOSText style={styles.emptySubtitle}>
                  {searchQuery ? 'Try a different search term' : 'WhatsApp groups will appear here'}
                </IOSText>
              </IOSCard>
            ) : (
              filteredGroups.map((group) => (
                <WhatsAppGroupCard
                  key={group.id}
                  group={group}
                  isJoined={joinedGroupIds.includes(group.id)}
                  onJoin={handleJoinGroup}
                  onRequestAccess={handleRequestAccess}
                  onViewGroup={handleViewGroup}
                  onLeave={handleLeaveGroup}
                />
              ))
            )}
          </View>
        );
      
      case 'channels':
        return (
          <View style={styles.tabContent}>
            {communicationChannels.length === 0 ? (
              <IOSCard style={styles.emptyCard}>
                <Radio size={48} color="#8E8E93" style={styles.emptyIcon} />
                <IOSText style={styles.emptyTitle}>No Communication Channels</IOSText>
                <IOSText style={styles.emptySubtitle}>
                  Official communication channels will appear here
                </IOSText>
              </IOSCard>
            ) : (
              communicationChannels.map((channel) => (
                <CommunicationChannelCard
                  key={channel.id}
                  channel={channel}
                />
              ))
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Image 
            source={require('../../../assets/dragon-logo.png')} 
            style={styles.dragonLogo}
            resizeMode="contain"
          />
          <IOSText style={styles.headerTitle}>Contacts & Groups</IOSText>
        </View>
        
        <View style={styles.headerActions}>
          <IOSButton
            title=""
            onPress={handleShowSearch}
            variant="tinted"
            size="small"
            icon={<Search size={20} color="#007AFF" />}
            style={styles.headerButton}
          />
          <IOSButton
            title=""
            onPress={handleShowFilters}
            variant="tinted"
            size="small"
            icon={<Filter size={20} color="#007AFF" />}
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
              recentMessages={recentMessages}
              onJoin={handleJoinLiveDiscussion}
            />
          </IOSSection>
        )}

        {/* Quick Access Emergency Contacts */}
        {emergencyContacts.length > 0 && (
          <IOSSection style={styles.section}>
            <IOSText style={styles.sectionTitle}>Quick Emergency Access</IOSText>
            <View style={styles.quickEmergencyRow}>
              {emergencyContacts.slice(0, 3).map((contact) => (
                <EmergencyContactCard
                  key={contact.id}
                  contact={contact}
                  compact={true}
                />
              ))}
            </View>
          </IOSSection>
        )}

        {/* Tab Navigation */}
        <IOSSection style={styles.section}>
          <IOSSegmentedControl
            options={tabOptions}
            selectedValue={selectedTab}
            onValueChange={(value) => setSelectedTab(value as typeof selectedTab)}
            style={styles.tabFilter}
          />
        </IOSSection>

        {/* Error Display */}
        {error && (
          <IOSSection style={styles.section}>
            <IOSCard style={styles.errorCard}>
              <IOSText style={styles.errorText}>{error}</IOSText>
              <IOSButton
                title="Retry"
                onPress={handleRefresh}
                variant="tinted"
                size="small"
                style={styles.retryButton}
              />
            </IOSCard>
          </IOSSection>
        )}

        {/* Tab Content */}
        <IOSSection style={styles.section}>
          {renderTabContent()}
        </IOSSection>

        {/* User Type Specific Features */}
        {userType === 'participant' && (
          <IOSSection style={styles.section}>
            <IOSText style={styles.sectionTitle}>Competitor Features</IOSText>
            <IOSCard style={styles.featureCard}>
              <IOSText style={styles.featureTitle}>Racing Network</IOSText>
              <IOSText style={styles.featureDescription}>
                Connect with fellow competitors, find crew positions, and build your sailing network.
              </IOSText>
              <IOSButton
                title="Explore Connections"
                onPress={() => {/* Navigate to connections */}}
                variant="filled"
                size="small"
                style={styles.featureButton}
              />
            </IOSCard>
          </IOSSection>
        )}

        {/* Safety Information */}
        <IOSSection style={styles.section}>
          <IOSCard style={styles.safetyCard}>
            <IOSText style={styles.safetyTitle}>🛡️ Safety & Guidelines</IOSText>
            <IOSText style={styles.safetyText}>
              Keep emergency contact information available offline. Be respectful in group communications and follow event guidelines.
            </IOSText>
          </IOSCard>
        </IOSSection>
      </ScrollView>

      {/* Search Modal */}
      <IOSModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="Search Contacts & Groups"
      >
        <View style={styles.searchModalContent}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              placeholder="Search by name, role, or description..."
              value={searchQuery}
              onChangeText={handleSearch}
              style={styles.searchInput}
              autoFocus
              placeholderTextColor="#8E8E93"
            />
            {searchQuery.length > 0 && (
              <IOSButton
                title=""
                onPress={() => handleSearch('')}
                variant="tinted"
                size="small"
                icon={<X size={16} color="#8E8E93" />}
                style={styles.clearSearchButton}
              />
            )}
          </View>
          
          {searchQuery.length > 0 && (
            <View style={styles.searchResults}>
              <IOSText style={styles.searchResultsTitle}>
                {filteredContacts.length + filteredEmergencyContacts.length} results found
              </IOSText>
            </View>
          )}
          
          <View style={styles.searchModalActions}>
            <IOSButton
              title="Clear"
              onPress={handleClearFilters}
              variant="tinted"
              style={styles.searchModalButton}
            />
            <IOSButton
              title="Done"
              onPress={() => setShowSearchModal(false)}
              variant="filled"
              style={styles.searchModalButton}
            />
          </View>
        </View>
      </IOSModal>

      {/* Filter Modal */}
      <IOSModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Contacts"
      >
        <View style={styles.filterModalContent}>
          <IOSText style={styles.filterSectionTitle}>Contact Category</IOSText>
          <View style={styles.filterOptions}>
            {['race-management', 'emergency-contacts', 'technical-support', 'host-organization'].map((category) => (
              <IOSButton
                key={category}
                title={category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                onPress={() => {/* Apply category filter */}}
                variant="tinted"
                size="small"
                style={styles.filterOptionButton}
              />
            ))}
          </View>
          
          <IOSText style={styles.filterSectionTitle}>Type</IOSText>
          <View style={styles.filterOptions}>
            <IOSButton
              title="Emergency Only"
              onPress={() => {/* Apply emergency filter */}}
              variant="tinted"
              size="small"
              style={styles.filterOptionButton}
            />
            <IOSButton
              title="Has Phone"
              onPress={() => {/* Apply phone filter */}}
              variant="tinted"
              size="small"
              style={styles.filterOptionButton}
            />
            <IOSButton
              title="Favorites"
              onPress={() => {/* Apply favorites filter */}}
              variant="tinted"
              size="small"
              style={styles.filterOptionButton}
            />
          </View>
          
          <View style={styles.filterModalActions}>
            <IOSButton
              title="Clear All"
              onPress={handleClearFilters}
              variant="tinted"
              style={styles.filterModalButton}
            />
            <IOSButton
              title="Apply"
              onPress={() => setShowFilterModal(false)}
              variant="filled"
              style={styles.filterModalButton}
            />
          </View>
        </View>
      </IOSModal>
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

  // Quick Emergency Access
  quickEmergencyRow: {
    paddingHorizontal: 16,
  },

  // Tab Navigation
  tabFilter: {
    marginHorizontal: 16,
  },

  // Tab Content
  tabContent: {
    paddingHorizontal: 16,
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

  // Search Modal
  searchModalContent: {
    padding: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 8,
  },
  clearSearchButton: {
    marginLeft: 8,
    width: 30,
    height: 30,
  },
  searchResults: {
    marginBottom: 16,
  },
  searchResultsTitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  searchModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchModalButton: {
    flex: 1,
  },

  // Filter Modal
  filterModalContent: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    marginTop: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterOptionButton: {
    marginBottom: 8,
  },
  filterModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  filterModalButton: {
    flex: 1,
  },
});