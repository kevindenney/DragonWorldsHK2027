import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Users,
  MessageCircle,
  Clock,
} from 'lucide-react-native';

import { IOSText, IOSCard } from '../ios';
import type { WhatsAppGroup } from '../../stores/socialStore';

interface WhatsAppGroupCardProps {
  group: WhatsAppGroup;
  isJoined: boolean;
  hasAccessRequest?: boolean;
  onJoin: (groupId: string) => void;
  onRequestAccess: (groupId: string) => void;
  onViewGroup: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
}

/**
 * WhatsAppGroupCard - Coming Soon State
 *
 * WhatsApp group functionality is temporarily disabled.
 * This component displays a "Coming Soon" placeholder state.
 */
export const WhatsAppGroupCard: React.FC<WhatsAppGroupCardProps> = ({
  group,
}) => {
  return (
    <IOSCard style={styles.card}>
      <View style={styles.cardContent}>
        {/* Coming Soon Badge */}
        <View style={styles.comingSoonBadge}>
          <Clock size={12} color="#FFFFFF" />
          <IOSText style={styles.comingSoonBadgeText}>COMING SOON</IOSText>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.categoryIcon}>
              <MessageCircle size={16} color="#C7C7CC" />
            </View>
            <View style={styles.titleContainer}>
              <IOSText style={styles.title}>{group.title}</IOSText>
            </View>
          </View>

          <IOSText style={styles.description}>{group.description}</IOSText>
        </View>

        {/* Stats - Placeholder */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Users size={14} color="#C7C7CC" />
            <IOSText style={styles.statText}>
              {group.memberCount?.toLocaleString() || '—'} members
            </IOSText>
          </View>
        </View>

        {/* Coming Soon Message */}
        <View style={styles.comingSoonMessage}>
          <IOSText style={styles.comingSoonText}>
            WhatsApp group integration will be available closer to the event.
          </IOSText>
        </View>
      </View>
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 0,
    opacity: 0.7,
  },
  cardContent: {
    padding: 16,
    position: 'relative',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#8E8E93',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  header: {
    marginBottom: 12,
    marginTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#AEAEB2',
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    fontSize: 13,
    color: '#C7C7CC',
    marginLeft: 4,
  },
  comingSoonMessage: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
  },
  comingSoonText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
