import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { 
  Users, 
  Shield, 
  Star, 
  MessageCircle,
  ExternalLink,
  Lock,
  Verified,
  UserPlus,
  Clock
} from 'lucide-react-native';

import { IOSText } from '../ui/IOSText';
import { IOSButton } from '../ui/IOSButton';
import { IOSBadge } from '../ui/IOSBadge';
import { IOSCard } from '../ui/IOSCard';
import type { WhatsAppGroup } from '../../stores/socialStore';
import { useUserStore } from '../../stores/userStore';

interface WhatsAppGroupCardProps {
  group: WhatsAppGroup;
  isJoined: boolean;
  hasAccessRequest?: boolean;
  onJoin: (groupId: string) => void;
  onRequestAccess: (groupId: string) => void;
  onViewGroup: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
}

export const WhatsAppGroupCard: React.FC<WhatsAppGroupCardProps> = ({
  group,
  isJoined,
  hasAccessRequest,
  onJoin,
  onRequestAccess,
  onViewGroup,
  onLeave,
}) => {
  const user = useUserStore();

  const getSponsorColor = (sponsor?: string): string => {
    switch (sponsor) {
      case 'HSBC': return '#DC143C';
      case 'Sino Group': return '#8B4513';
      case 'BMW': return '#0066CC';
      case 'Garmin': return '#007CC3';
      default: return '#007AFF';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'active-racing': return '#FF9500';
      case 'spectators-families': return '#34C759';
      case 'vip-hospitality': return '#AF52DE';
      case 'hong-kong-local': return '#007AFF';
      case 'technical-support': return '#FF3B30';
      case 'media-press': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getCategoryIcon = (category: string) => {
    const color = getCategoryColor(category);
    switch (category) {
      case 'active-racing': return <MessageCircle size={16} color={color} />;
      case 'spectators-families': return <Users size={16} color={color} />;
      case 'vip-hospitality': return <Star size={16} color={color} />;
      case 'hong-kong-local': return <Shield size={16} color={color} />;
      case 'technical-support': return <Shield size={16} color={color} />;
      case 'media-press': return <ExternalLink size={16} color={color} />;
      default: return <Users size={16} color={color} />;
    }
  };

  const handleJoinPress = () => {
    if (group.isInviteOnly) {
      Alert.alert(
        'Request Access',
        `This group requires approval. Would you like to request access to "${group.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Request Access',
            onPress: () => onRequestAccess(group.id)
          }
        ]
      );
    } else {
      Alert.alert(
        'Join Group',
        `Join "${group.title}" on WhatsApp?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Join',
            onPress: () => onJoin(group.id)
          }
        ]
      );
    }
  };

  const handleLeavePress = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave',
          style: 'destructive',
          onPress: () => onLeave?.(group.id)
        }
      ]
    );
  };

  const canUserJoin = (): boolean => {
    if (isJoined) return false;
    if (hasAccessRequest) return false;
    
    // VIP groups require VIP status
    if (group.isVIP && user.userType !== 'vip') {
      return false;
    }
    
    return true;
  };

  const getActionButtonConfig = () => {
    if (isJoined) {
      return {
        title: 'Open',
        onPress: () => onViewGroup(group.id),
        variant: 'primary' as const,
        icon: <ExternalLink size={16} color="#FFFFFF" />
      };
    }
    
    if (hasAccessRequest) {
      return {
        title: 'Pending',
        onPress: undefined,
        variant: 'secondary' as const,
        disabled: true,
        icon: <Clock size={16} color="#8E8E93" />
      };
    }
    
    if (!canUserJoin()) {
      return {
        title: 'Restricted',
        onPress: undefined,
        variant: 'secondary' as const,
        disabled: true,
        icon: <Lock size={16} color="#8E8E93" />
      };
    }
    
    if (group.isInviteOnly) {
      return {
        title: 'Request',
        onPress: handleJoinPress,
        variant: 'secondary' as const,
        icon: <UserPlus size={16} color="#007AFF" />
      };
    }
    
    return {
      title: 'Join',
      onPress: handleJoinPress,
      variant: 'primary' as const,
      icon: <UserPlus size={16} color="#FFFFFF" />
    };
  };

  const actionConfig = getActionButtonConfig();
  const activityLevel = group.activeMemberCount && group.memberCount 
    ? (group.activeMemberCount / group.memberCount) > 0.3 ? 'high' : 'medium'
    : 'low';

  return (
    <IOSCard style={styles.card}>
      <TouchableOpacity onPress={() => onViewGroup(group.id)} style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.categoryIcon}>
              {getCategoryIcon(group.category)}
            </View>
            <View style={styles.titleContainer}>
              <IOSText style={styles.title}>{group.title}</IOSText>
              {group.sponsorPrefix && (
                <IOSText style={[styles.sponsor, { color: getSponsorColor(group.sponsorPrefix) }]}>
                  {group.sponsorPrefix}
                </IOSText>
              )}
            </View>
            <View style={styles.badges}>
              {group.verificationStatus === 'verified' && (
                <Verified size={16} color="#007AFF" />
              )}
              {group.isVIP && (
                <Star size={16} color="#AF52DE" style={styles.badgeIcon} />
              )}
              {group.isInviteOnly && (
                <Lock size={16} color="#8E8E93" style={styles.badgeIcon} />
              )}
            </View>
          </View>
          
          <IOSText style={styles.description}>{group.description}</IOSText>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Users size={14} color="#8E8E93" />
            <IOSText style={styles.statText}>
              {group.memberCount.toLocaleString()} member{group.memberCount !== 1 ? 's' : ''}
            </IOSText>
          </View>
          
          {group.activeMemberCount && (
            <View style={styles.statItem}>
              <MessageCircle size={14} color="#8E8E93" />
              <IOSText style={styles.statText}>
                {group.activeMemberCount} active
              </IOSText>
            </View>
          )}
          
          <View style={styles.statItem}>
            <View style={[
              styles.activityIndicator,
              { backgroundColor: activityLevel === 'high' ? '#34C759' : 
                               activityLevel === 'medium' ? '#FF9500' : '#8E8E93' }
            ]} />
            <IOSText style={styles.statText}>
              {activityLevel} activity
            </IOSText>
          </View>
        </View>

        {/* Rules/Requirements */}
        {group.rules && group.rules.length > 0 && (
          <View style={styles.rules}>
            {group.rules.slice(0, 2).map((rule, index) => (
              <IOSText key={index} style={styles.ruleText}>
                • {rule}
              </IOSText>
            ))}
            {group.rules.length > 2 && (
              <IOSText style={styles.moreRules}>
                +{group.rules.length - 2} more rules
              </IOSText>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        {isJoined && (
          <IOSButton
            title="Leave"
            onPress={handleLeavePress}
            variant="secondary"
            size="small"
            style={styles.leaveButton}
          />
        )}
        
        <IOSButton
          title={actionConfig.title}
          onPress={actionConfig.onPress}
          variant={actionConfig.variant}
          size="small"
          disabled={actionConfig.disabled}
          icon={actionConfig.icon}
          style={styles.actionButton}
        />
      </View>
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 0,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
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
    color: '#1C1C1E',
    marginBottom: 2,
  },
  sponsor: {
    fontSize: 13,
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginLeft: 6,
  },
  description: {
    fontSize: 14,
    color: '#3C3C43',
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
    color: '#8E8E93',
    marginLeft: 4,
  },
  activityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  rules: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  ruleText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  moreRules: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  leaveButton: {
    minWidth: 60,
  },
  actionButton: {
    minWidth: 80,
  },
});