import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Settings, 
  Shield, 
  Bell, 
  LogOut,
  Edit3,
  Camera,
  Link,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { useAuth } from '../../auth/useAuth';
import { User as UserType, UserProfile as UserProfileType, LinkedProvider } from '../../types/auth';
import { AuthButton } from './AuthButton';

interface UserProfileProps {
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  onDeleteAccount?: () => void;
  testID?: string;
}

export function UserProfile({
  onEditProfile,
  onChangePassword,
  onDeleteAccount,
  testID,
}: UserProfileProps) {
  const { user, logout, updateProfile } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.preferences?.notifications?.push || false
  );

  const handleNotificationToggle = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      
      // Update user preferences
      await updateProfile({
        preferences: {
          ...user?.preferences,
          notifications: {
            ...user?.preferences?.notifications,
            push: value,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      // Revert the toggle on error
      setNotificationsEnabled(!value);
      Alert.alert('Error', 'Failed to update notification preferences. Please try again.');
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User data not available</Text>
      </View>
    );
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDeleteAccount,
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      <ProfileHeader user={user} onEditProfile={onEditProfile} />
      
      <ProfileSection title="Account Information">
        <ProfileField
          icon={<Mail size={20} color={colors.textMuted} />}
          label="Email"
          value={user.email}
          verified={user.emailVerified}
        />
        
        {user.phoneNumber && (
          <ProfileField
            icon={<Phone size={20} color={colors.textMuted} />}
            label="Phone"
            value={user.phoneNumber}
          />
        )}
        
        {user.profile?.location && (
          <ProfileField
            icon={<MapPin size={20} color={colors.textMuted} />}
            label="Location"
            value={user.profile.location}
          />
        )}
        
        <ProfileField
          icon={<Calendar size={20} color={colors.textMuted} />}
          label="Member since"
          value={formatDate(user.metadata.createdAt)}
        />
      </ProfileSection>

      <ProfileSection title="Security">
        <SettingsItem
          icon={<Shield size={20} color={colors.textMuted} />}
          title="Change Password"
          subtitle="Update your account password"
          onPress={onChangePassword}
          showArrow
        />
        
        <ConnectedAccounts providers={user.linkedProviders} />
      </ProfileSection>

      <ProfileSection title="Preferences">
        <View style={styles.settingsItem}>
          <View style={styles.settingsLeft}>
            <Bell size={20} color={colors.textMuted} />
            <View style={styles.settingsText}>
              <Text style={styles.settingsTitle}>Push Notifications</Text>
              <Text style={styles.settingsSubtitle}>
                Receive notifications about race updates
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </ProfileSection>

      <ProfileSection title="Account Actions">
        <AuthButton
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          size="medium"
          leftIcon={<LogOut size={16} color={colors.textSecondary} />}
          style={styles.actionButton}
          testID={`${testID}-sign-out`}
        />
        
        <AuthButton
          title="Delete Account"
          onPress={handleDeleteAccount}
          variant="text"
          size="medium"
          leftIcon={<Trash2 size={16} color={colors.error} />}
          textStyle={styles.deleteButtonText}
          style={styles.deleteButton}
          testID={`${testID}-delete-account`}
        />
      </ProfileSection>
    </ScrollView>
  );
}

interface ProfileHeaderProps {
  user: UserType;
  onEditProfile?: () => void;
}

function ProfileHeader({ user, onEditProfile }: ProfileHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={40} color={colors.textMuted} />
          </View>
        )}
        
        <TouchableOpacity style={styles.cameraButton} activeOpacity={0.7}>
          <Camera size={16} color={colors.background} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.displayName}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        
        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.metadata.loginCount}</Text>
            <Text style={styles.statLabel}>Logins</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {user.linkedProviders?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Accounts</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={onEditProfile}
        activeOpacity={0.7}
      >
        <Edit3 size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

interface ProfileFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  verified?: boolean;
}

function ProfileField({ icon, label, value, verified }: ProfileFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLeft}>
        {icon}
        <View style={styles.fieldText}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>{value}</Text>
        </View>
      </View>
      
      {verified !== undefined && (
        <View style={styles.verificationBadge}>
          {verified ? (
            <CheckCircle size={16} color={colors.success} />
          ) : (
            <AlertTriangle size={16} color={colors.warning} />
          )}
        </View>
      )}
    </View>
  );
}

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, showArrow }: SettingsItemProps) {
  return (
    <TouchableOpacity 
      style={styles.settingsItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsLeft}>
        {icon}
        <View style={styles.settingsText}>
          <Text style={styles.settingsTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingsSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      {showArrow && (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}

interface ConnectedAccountsProps {
  providers: LinkedProvider[];
}

function ConnectedAccounts({ providers }: ConnectedAccountsProps) {
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '🔗';
      case 'apple':
        return '🍎';
      case 'facebook':
        return '📘';
      default:
        return '🔗';
    }
  };

  return (
    <View style={styles.connectedAccounts}>
      <View style={styles.accountsHeader}>
        <Link size={16} color={colors.textMuted} />
        <Text style={styles.accountsTitle}>Connected Accounts</Text>
      </View>
      
      {providers.length > 0 ? (
        providers.map((provider) => (
          <View key={provider.providerId} style={styles.connectedAccount}>
            <Text style={styles.providerIcon}>
              {getProviderIcon(provider.provider)}
            </Text>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>
                {provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)}
              </Text>
              <Text style={styles.providerEmail}>
                {provider.email || 'No email provided'}
              </Text>
            </View>
            
            {provider.isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>Primary</Text>
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noAccounts}>No connected accounts</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body1,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body2,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  editButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '20',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  fieldValue: {
    ...typography.body1,
    color: colors.text,
  },
  verificationBadge: {
    marginLeft: spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingsTitle: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingsSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  arrow: {
    ...typography.h5,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  connectedAccounts: {
    padding: spacing.md,
  },
  accountsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  accountsTitle: {
    ...typography.body1,
    color: colors.text,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  connectedAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  providerIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
  },
  providerEmail: {
    ...typography.caption,
    color: colors.textMuted,
  },
  primaryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  primaryText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '500',
  },
  noAccounts: {
    ...typography.body2,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
  deleteButtonText: {
    color: colors.error,
  },
});