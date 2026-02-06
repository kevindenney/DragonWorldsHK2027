/**
 * MembersListModal Component
 *
 * Native modal for viewing community members.
 * Shows member avatars, names, roles, and when they joined.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  User,
  Users,
  Shield,
  Crown,
  Star,
} from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import { IOSText } from '../ios/IOSText';

import type { CommunityMember } from '../../types/community';
import { useCommunityMembers } from '../../hooks/useCommunityData';

interface MembersListModalProps {
  communityId: string | undefined;
  communityName: string | undefined;
  visible: boolean;
  onClose: () => void;
}

/**
 * Format a date to relative time (e.g., "2h ago", "3d ago")
 */
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;

  return date.toLocaleDateString();
}

/**
 * Get role badge icon and color
 */
function getRoleBadge(role: CommunityMember['role']) {
  switch (role) {
    case 'owner':
      return { icon: Crown, color: '#FFD700', label: 'Owner' };
    case 'admin':
      return { icon: Shield, color: '#E53E3E', label: 'Admin' };
    case 'moderator':
      return { icon: Star, color: '#3182CE', label: 'Moderator' };
    default:
      return null;
  }
}

/**
 * Single member item component
 */
interface MemberItemProps {
  member: CommunityMember;
}

function MemberItem({ member }: MemberItemProps) {
  const userName = member.user?.full_name || 'Anonymous';
  const userAvatar = member.user?.avatar_url;
  const roleBadge = getRoleBadge(member.role);

  return (
    <View style={styles.memberItem}>
      {/* Avatar */}
      {userAvatar ? (
        <Image
          source={{ uri: userAvatar }}
          style={styles.avatar}
          accessibilityLabel={`${userName}'s avatar`}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <User size={24} color={colors.textMuted} />
        </View>
      )}

      {/* Info */}
      <View style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <IOSText textStyle="body" weight="medium" numberOfLines={1} style={styles.memberName}>
            {userName}
          </IOSText>
          {roleBadge && (
            <View style={[styles.roleBadge, { backgroundColor: roleBadge.color + '20' }]}>
              <roleBadge.icon size={12} color={roleBadge.color} />
              <IOSText textStyle="caption2" weight="semibold" style={{ color: roleBadge.color }}>
                {roleBadge.label}
              </IOSText>
            </View>
          )}
        </View>
        <IOSText textStyle="caption1" color="secondaryLabel">
          Joined {getRelativeTime(member.joined_at)}
        </IOSText>
      </View>
    </View>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Users size={48} color={colors.textMuted} />
      <IOSText textStyle="title3" weight="medium" style={styles.emptyTitle}>
        No Members Yet
      </IOSText>
      <IOSText textStyle="callout" color="secondaryLabel" style={styles.emptySubtitle}>
        Be the first to join this community!
      </IOSText>
    </View>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <IOSText textStyle="callout" color="secondaryLabel" style={styles.loadingText}>
        Loading members...
      </IOSText>
    </View>
  );
}

export const MembersListModal: React.FC<MembersListModalProps> = ({
  communityId,
  communityName,
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  // Fetch members only when modal is visible
  const { data: members, isLoading, error } = useCommunityMembers(communityId, visible);

  /**
   * Handle close
   */
  const handleClose = () => {
    Haptics.selectionAsync();
    onClose();
  };

  /**
   * Render member item
   */
  const renderItem = ({ item }: { item: CommunityMember }) => (
    <MemberItem member={item} />
  );

  /**
   * Key extractor
   */
  const keyExtractor = (item: CommunityMember) => item.id;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="members-modal-close-button"
          >
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Users size={20} color={colors.primary} />
            <IOSText textStyle="headline" weight="semibold">
              Members
            </IOSText>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Community name */}
        {communityName && (
          <View style={styles.communityNameContainer}>
            <IOSText textStyle="subheadline" color="secondaryLabel">
              {communityName}
            </IOSText>
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <View style={styles.errorContainer}>
            <IOSText textStyle="callout" color="secondaryLabel">
              Failed to load members
            </IOSText>
          </View>
        ) : !members || members.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={members}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: {
    padding: spacing.xs,
    width: 40,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  communityNameContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listContent: {
    padding: spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberName: {
    flex: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginLeft: 48 + spacing.md, // Align with text, not avatar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
});

export default MembersListModal;
