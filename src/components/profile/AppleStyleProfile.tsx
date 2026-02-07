/**
 * AppleStyleProfile - Redesigned profile following WWDC25 design principles
 *
 * Key Design Principles Applied:
 * 1. Prioritize important features - Sailing identity and registrations first
 * 2. Remove confusing metrics - No "logins" or "accounts" stats
 * 3. Progressive disclosure - Settings hidden, alerts surfaced
 * 4. Organize by behavior - Grouped by what sailors actually do
 * 5. Visual hierarchy - Identity and actionable items prominent
 * 6. Consolidate redundancy - Email shown once, in context
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Constants from 'expo-constants';
import {
  Mail,
  LogOut,
  Trash2,
  CheckCircle,
  Sailboat,
  MapPin,
  Key,
  Smartphone,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { useAuth } from '../../auth/useAuth';
import { User as UserType } from '../../auth/authTypes';
import { AuthButton } from '../auth/AuthButton';
import { ProfileAvatar } from '../shared/ProfileAvatar';

interface AppleStyleProfileProps {
  onEditProfile?: () => void;
  onDeleteAccount?: () => void;
  testID?: string;
}

export function AppleStyleProfile({
  onEditProfile,
  onDeleteAccount,
  testID,
}: AppleStyleProfileProps) {
  const { user, logout } = useAuth();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User data not available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      {/* Success Message */}
      {successMessage && (
        <View style={styles.successBanner}>
          <CheckCircle size={16} color={colors.success} />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* Identity Card - Consolidated sailing identity */}
      <IdentityCard
        user={user}
        onEditProfile={onEditProfile}
      />

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Contact</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Mail size={18} color={colors.textMuted} />
            <Text style={styles.infoText}>{user.email}</Text>
          </View>
        </View>
      </View>

      {/* Login Info */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Login</Text>
        <View style={styles.card}>
          {user.providers?.map((provider, index) => (
            <View
              key={provider}
              style={[
                styles.loginMethodRow,
                index < (user.providers?.length || 1) - 1 && styles.loginMethodBorder,
              ]}
            >
              <View style={styles.loginMethodLeft}>
                {provider === 'email' ? (
                  <Key size={18} color={colors.textMuted} />
                ) : (
                  <Smartphone size={18} color={colors.textMuted} />
                )}
                <Text style={styles.loginMethodText}>
                  {provider === 'email'
                    ? 'Email & Password'
                    : provider === 'google.com'
                    ? 'Google'
                    : provider === 'apple.com'
                    ? 'Apple'
                    : provider}
                </Text>
              </View>
              <View style={styles.loginMethodBadge}>
                <Text style={styles.loginMethodBadgeText}>Connected</Text>
              </View>
            </View>
          ))}
          {(!user.providers || user.providers.length === 0) && (
            <View style={styles.loginMethodRow}>
              <View style={styles.loginMethodLeft}>
                <Key size={18} color={colors.textMuted} />
                <Text style={styles.loginMethodText}>Email & Password</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Sign Out & Delete - Least important, at bottom */}
      <View style={styles.accountActions}>
        <AuthButton
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          size="medium"
          leftIcon={<LogOut size={16} color={colors.textSecondary} />}
          style={styles.signOutButton}
        />

        <TouchableOpacity
          style={styles.deleteLink}
          onPress={onDeleteAccount}
        >
          <Trash2 size={14} color={colors.error} />
          <Text style={styles.deleteLinkText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <Text style={styles.versionText}>
        Dragon Worlds HK 2027 v{Constants.expoConfig?.version || '1.0.0'}
      </Text>
    </ScrollView>
  );
}

// ============================================
// Sub-components
// ============================================

interface IdentityCardProps {
  user: UserType;
  onEditProfile?: () => void;
}

function IdentityCard({
  user,
  onEditProfile,
}: IdentityCardProps) {
  // Debug: Log user.photoURL to verify it's being received
  if (__DEV__) {
    console.log('[IdentityCard] user.photoURL:', user.photoURL);
  }
  return (
    <View style={styles.identityCard}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <ProfileAvatar
          photoURL={user.photoURL}
          name={user.displayName || 'Sailor'}
          id={user.uid}
          size={72}
        />
      </View>

      {/* Identity Info */}
      <View style={styles.identityInfo}>
        <Text style={styles.userName}>{user.displayName || 'Sailor'}</Text>

        {/* Sailing Identity - This IS who they are */}
        <View style={styles.sailingIdentity}>
          {(user.sailingProfile?.sailNumber || user.sailingProfile?.boatClass) && (
            <View style={styles.identityRow}>
              <Sailboat size={16} color={colors.primary} />
              <Text style={styles.identityText}>
                {[user.sailingProfile?.sailNumber, user.sailingProfile?.boatClass]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          )}
          {user.sailingProfile?.yachtClub && (
            <View style={styles.identityRow}>
              <MapPin size={16} color={colors.primary} />
              <Text style={styles.identityText}>{user.sailingProfile.yachtClub}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={onEditProfile}
        activeOpacity={0.7}
      >
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
}



// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  errorText: {
    ...typography.body1,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  // Success Banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  successText: {
    ...typography.body2,
    color: colors.success,
    fontWeight: '500',
  },

  // Identity Card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  avatarSection: {
    marginRight: spacing.md,
  },
  identityInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sailingIdentity: {
    gap: spacing.xs,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  identityText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  identityPlaceholder: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
  },
  editButtonText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.body2,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.card,
    overflow: 'hidden',
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  infoText: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },

  // Login Method Row
  loginMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  loginMethodBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  loginMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  loginMethodText: {
    ...typography.body1,
    color: colors.text,
  },
  loginMethodBadge: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  loginMethodBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
  },

  // Account Actions
  accountActions: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  signOutButton: {
    width: '100%',
  },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  deleteLinkText: {
    ...typography.body2,
    color: colors.error,
  },

  // Version
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

});
