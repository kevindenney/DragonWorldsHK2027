import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MessageCircle, 
  Users, 
  Crown, 
  MapPin, 
  ChevronDown,
  ChevronRight,
  Shield,
  Phone
} from 'lucide-react-native';
import { colors, spacing } from '../../constants/theme';
import {
  IOSNavigationBar,
  IOSCard,
  IOSSection,
  IOSButton,
  IOSText,
  IOSBadge
} from '../../components/ios';
import type { SocialScreenProps } from '../../types/navigation';

// TypeScript interfaces
interface ChatMessage {
  username: string;
  message: string;
  timestamp?: string;
}

interface WhatsAppGroup {
  id: string;
  title: string;
  description: string;
  memberCount: string;
  isActive?: boolean;
  isVIP?: boolean;
  isInviteOnly?: boolean;
  actionButton: {
    title: string;
    onPress: () => void;
  };
  sponsorPrefix?: string;
}

interface GroupSection {
  id: string;
  title: string;
  groups: WhatsAppGroup[];
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

// Collapsible Section Component
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.collapsibleSection}>
      <IOSButton
        title={title}
        variant="plain"
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.sectionHeader}
        textStyle={styles.sectionHeaderText}
      />
      <View style={styles.sectionHeaderRow}>
        {isExpanded ? (
          <ChevronDown size={16} color={colors.textSecondary} />
        ) : (
          <ChevronRight size={16} color={colors.textSecondary} />
        )}
      </View>
      
      {isExpanded && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// Chat Preview Component
const ChatPreview: React.FC<{ messages: ChatMessage[] }> = ({ messages }) => (
  <View style={styles.chatPreview}>
    {messages.map((msg, index) => (
      <View key={index} style={styles.chatMessage}>
        <IOSText textStyle="callout" color="systemBlue" weight="semibold">
          {msg.username}:
        </IOSText>
        <IOSText textStyle="callout" color="label" style={styles.messageText}>
          {msg.message}
        </IOSText>
      </View>
    ))}
  </View>
);

// WhatsApp Group Card Component
const GroupCard: React.FC<{ group: WhatsAppGroup }> = ({ group }) => (
  <IOSCard variant="elevated" style={styles.groupCard}>
    <View style={styles.groupHeader}>
      <View style={styles.groupTitleRow}>
        <IOSText textStyle="headline" weight="semibold">
          {group.sponsorPrefix && (
            <IOSText textStyle="caption1" color="systemBlue" weight="semibold">
              {group.sponsorPrefix}{' '}
            </IOSText>
          )}
          {group.title}
        </IOSText>
        
        <View style={styles.groupBadges}>
          {group.isActive && (
            <IOSBadge color="systemGreen" variant="filled" size="small">
              LIVE
            </IOSBadge>
          )}
          {group.isInviteOnly && (
            <IOSBadge color="systemOrange" variant="tinted" size="small">
              <Shield size={10} color={colors.warning} />
              {' '}INVITE ONLY
            </IOSBadge>
          )}
        </View>
      </View>
    </View>

    <IOSText textStyle="callout" color="secondaryLabel" style={styles.groupDescription}>
      {group.description}
    </IOSText>

    <View style={styles.groupMeta}>
      <View style={styles.memberCount}>
        <Users size={16} color={colors.textSecondary} />
        <IOSText textStyle="footnote" color="tertiaryLabel">
          {group.memberCount}
        </IOSText>
      </View>
    </View>

    <IOSButton
      title={group.actionButton.title}
      variant={group.isVIP ? 'filled' : 'tinted'}
      size="medium"
      onPress={group.actionButton.onPress}
      style={styles.groupActionButton}
    />
  </IOSCard>
);

// Enhanced Social Screen - Forward to new implementation
export { EnhancedSocialScreen as SocialScreen } from './EnhancedSocialScreen';

export function _OriginalSocialScreen({ navigation }: SocialScreenProps) {
  // Mock chat data
  const liveMessages: ChatMessage[] = [
    {
      username: '@SailorMike',
      message: 'Wind building on the right side of the course'
    },
    {
      username: '@DragonSarah',
      message: 'HKG 59 looking good on this leg!'
    }
  ];

  // WhatsApp groups data
  const whatsappSections: GroupSection[] = [
    {
      id: 'active-racing',
      title: 'ACTIVE RACING',
      groups: [
        {
          id: '1',
          title: 'Live Race Commentary',
          description: 'Real-time race discussion',
          memberCount: '89 active now',
          isActive: true,
          actionButton: {
            title: 'Join Now',
            onPress: () => {}
          }
        }
      ]
    },
    {
      id: 'spectators-families',
      title: 'SPECTATORS & FAMILIES',
      groups: [
        {
          id: '2',
          title: 'Dragon Worlds Spectators',
          description: 'General event discussion',
          memberCount: '234 members',
          actionButton: {
            title: 'Join Group',
            onPress: () => {}
          }
        }
      ]
    },
    {
      id: 'vip-hospitality',
      title: 'VIP & HOSPITALITY',
      groups: [
        {
          id: '3',
          title: 'Premier Events',
          description: 'Exclusive experiences',
          memberCount: '24 members',
          isVIP: true,
          isInviteOnly: true,
          sponsorPrefix: 'Rolex',
          actionButton: {
            title: 'Contact RM',
            onPress: () => {}
          }
        }
      ]
    },
    {
      id: 'hong-kong-local',
      title: 'HONG KONG LOCAL',
      groups: [
        {
          id: '4',
          title: 'HK Insider Tips',
          description: 'Local recommendations',
          memberCount: '156 members',
          actionButton: {
            title: 'Join Group',
            onPress: () => {}
          }
        }
      ]
    }
  ];

  const handleJoinConversation = () => {
    // Handle join live conversation
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Dragon logo */}
      <IOSNavigationBar
        title="Connect & Share"
        style="large"
        rightActions={[
          {
            icon: <Image 
              source={require('../../../assets/dragon-logo.png')} 
              style={styles.dragonLogo}
              resizeMode="contain"
            />,
            onPress: () => {}
          }
        ]}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Live Discussion Section */}
        <IOSSection spacing="regular">
          <IOSCard variant="elevated" style={styles.liveDiscussionCard}>
            <View style={styles.liveHeader}>
              <View style={styles.liveTitleRow}>
                <MessageCircle size={20} color={colors.success} />
                <IOSText textStyle="headline" weight="semibold" color="label">
                  LIVE DISCUSSION
                </IOSText>
                <IOSBadge color="systemRed" variant="filled" size="small">
                  LIVE
                </IOSBadge>
              </View>
              
              <IOSText textStyle="callout" color="secondaryLabel" style={styles.liveSubtitle}>
                Race 3 Live Chat - 147 participants active
              </IOSText>
            </View>

            <ChatPreview messages={liveMessages} />

            <IOSButton
              title="Join Conversation"
              variant="filled"
              size="large"
              onPress={handleJoinConversation}
              style={styles.joinButton}
            />
          </IOSCard>
        </IOSSection>

        {/* WhatsApp Groups Section */}
        <IOSSection title="WHATSAPP GROUPS" spacing="regular">
          <View style={styles.groupSections}>
            {whatsappSections.map((section) => (
              <CollapsibleSection key={section.id} title={section.title}>
                <View style={styles.groupsContainer}>
                  {section.groups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </View>
              </CollapsibleSection>
            ))}
          </View>
        </IOSSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  dragonLogo: {
    width: 32,
    height: 32,
  },

  // Live Discussion
  liveDiscussionCard: {
    // Card styling handled by IOSCard
  },
  liveHeader: {
    marginBottom: 16,
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  liveSubtitle: {
    marginTop: 4,
  },
  chatPreview: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  chatMessage: {
    flexDirection: 'row',
    gap: 4,
  },
  messageText: {
    flex: 1,
  },
  joinButton: {
    // Button styling handled by IOSButton
  },

  // Collapsible Sections
  collapsibleSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'left',
    color: colors.textSecondary,
  },
  sectionHeaderRow: {
    position: 'absolute',
    right: 0,
    top: 12,
  },
  sectionContent: {
    marginTop: 8,
  },

  // Groups
  groupSections: {
    gap: 24, // 8pt grid system
  },
  groupsContainer: {
    gap: 16, // 8pt grid system
  },
  groupCard: {
    // Card styling handled by IOSCard
  },
  groupHeader: {
    marginBottom: 8,
  },
  groupTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  groupBadges: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  groupDescription: {
    marginBottom: 12,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupActionButton: {
    alignSelf: 'flex-start',
  },
});