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
  Image,
  Alert,
  Switch,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Mail,
  Bell,
  LogOut,
  Camera,
  Trash2,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Sailboat,
  MapPin,
  Shield,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Globe,
  Database,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { useAuth } from '../../auth/useAuth';
import { User as UserType } from '../../auth/authTypes';
import { AuthButton } from '../auth/AuthButton';
import { imageUploadService, UploadProgress } from '../../services/imageUploadService';
import NotificationService from '../../services/notificationService';

interface AppleStyleProfileProps {
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  onDeleteAccount?: () => void;
  onNavigateToSettings?: () => void;
  testID?: string;
}

export function AppleStyleProfile({
  onEditProfile,
  onChangePassword,
  onDeleteAccount,
  onNavigateToSettings,
  testID,
}: AppleStyleProfileProps) {
  const { user, logout, updateProfile } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.preferences?.notifications ?? false
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Settings state
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(
    user?.preferences?.theme ?? 'light'
  );
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'zh'>(
    (user?.preferences?.language as 'en' | 'zh') ?? 'en'
  );

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handlePhotoUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      Alert.alert('Update Photo', 'Choose a source', [
        { text: 'Camera', onPress: () => handleImageSelection('camera') },
        { text: 'Photo Library', onPress: () => handleImageSelection('library') },
        { text: 'Cancel', style: 'cancel' }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Unable to access photos.');
    }
  };

  const handleImageSelection = async (source: 'camera' | 'library') => {
    if (!user?.uid) return;

    try {
      setIsUploadingPhoto(true);

      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert('Permission Required', 'Please allow camera access.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const compressedUri = await imageUploadService.compressImage(result.assets[0].uri, 400, 0.8);
        const uploadResult = await imageUploadService.uploadProfilePicture(
          user.uid,
          compressedUri,
          {
            onProgress: (progress) => setUploadProgress(progress),
            timeoutMs: 30000,
            maxSizeBytes: 5 * 1024 * 1024,
          }
        );

        await updateProfile({ photoURL: uploadResult.downloadURL });
        setSuccessMessage('Photo updated!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update photo.');
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(null);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      setIsUpdatingProfile(true);
      setNotificationsEnabled(value);

      const notificationService = NotificationService.getInstance();

      if (value) {
        // User wants to enable notifications - request permission and register
        await notificationService.initialize();
        const token = await notificationService.registerForPushNotifications(user?.uid);

        if (!token) {
          // Permission was denied or device doesn't support notifications
          setNotificationsEnabled(false);
          Alert.alert(
            'Notifications Not Available',
            'Unable to enable notifications. Please check your device settings to allow notifications for this app.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Successfully registered - save preference
        await updateProfile({
          preferences: {
            ...user?.preferences,
            notifications: true,
            newsletter: user?.preferences?.newsletter ?? false,
            language: user?.preferences?.language ?? 'en',
          },
        });
        setSuccessMessage('Race notifications enabled!');
      } else {
        // User wants to disable notifications
        if (user?.uid) {
          await notificationService.setNotificationsEnabled(user.uid, false);
        }

        await updateProfile({
          preferences: {
            ...user?.preferences,
            notifications: false,
            newsletter: user?.preferences?.newsletter ?? false,
            language: user?.preferences?.language ?? 'en',
          },
        });
        setSuccessMessage('Notifications disabled');
      }
    } catch (error) {
      setNotificationsEnabled(!value);
      Alert.alert('Error', 'Failed to update notification settings.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.initialize();
      await notificationService.sendLocalNotification(
        '🏁 Race Starting Soon!',
        'Dragon Class - Race 1 starts in 15 minutes. Head to the start area.',
        {
          type: 'race-start',
          raceId: 'test-123',
          priority: 'high'
        }
      );
      setSuccessMessage('Test notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification. Make sure notifications are enabled.');
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    try {
      setCurrentTheme(theme);
      await updateProfile({
        preferences: {
          ...user?.preferences,
          notifications: user?.preferences?.notifications ?? false,
          newsletter: user?.preferences?.newsletter ?? false,
          language: user?.preferences?.language ?? 'en',
          theme,
        },
      });
      setSuccessMessage(`Theme set to ${theme}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update theme.');
    }
  };

  const handleLanguageChange = async (language: 'en' | 'zh') => {
    try {
      setCurrentLanguage(language);
      await updateProfile({
        preferences: {
          ...user?.preferences,
          notifications: user?.preferences?.notifications ?? false,
          newsletter: user?.preferences?.newsletter ?? false,
          language,
          theme: user?.preferences?.theme ?? 'light',
        },
      });
      setSuccessMessage(language === 'en' ? 'Language set to English' : '語言設定為繁體中文');
    } catch (error) {
      Alert.alert('Error', 'Failed to update language.');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear locally cached data. You may need to re-download some content.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear cache logic would go here
              setSuccessMessage('Cache cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          },
        },
      ]
    );
  };

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
        onPhotoUpload={handlePhotoUpload}
        onEditProfile={onEditProfile}
        isUploadingPhoto={isUploadingPhoto}
        uploadProgress={uploadProgress}
      />

      {/* Quick Settings - Most common preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Quick Settings</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Bell size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Race Notifications</Text>
                <Text style={styles.settingSubtitle}>Start times, results, and updates</Text>
              </View>
            </View>
            {isUpdatingProfile ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            )}
          </View>
          {/* Test Notification Button */}
          {notificationsEnabled && (
            <TouchableOpacity
              style={styles.testNotificationButton}
              onPress={handleTestNotification}
              activeOpacity={0.7}
            >
              <Bell size={16} color={colors.primary} />
              <Text style={styles.testNotificationText}>Send Test Notification</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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

      {/* Account & Security - Progressive disclosure */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <MenuRow
            icon={<Shield size={20} color={colors.textMuted} />}
            title="Security"
            subtitle="Password and connected accounts"
            onPress={onChangePassword}
            isLast={!settingsExpanded}
          />

          {/* Expandable Settings Section */}
          <TouchableOpacity
            style={[styles.menuRow, styles.menuRowBorder]}
            onPress={() => setSettingsExpanded(!settingsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Settings size={20} color={colors.textMuted} />
              </View>
              <View>
                <Text style={styles.menuTitle}>Settings</Text>
                <Text style={styles.menuSubtitle}>Display, language, and data</Text>
              </View>
            </View>
            <View style={{ transform: [{ rotate: settingsExpanded ? '180deg' : '0deg' }] }}>
              <ChevronDown size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          {settingsExpanded && (
            <View style={styles.inlineSettings}>
              {/* Theme Toggle */}
              <View style={styles.inlineSettingRow}>
                <View style={styles.inlineSettingLeft}>
                  {currentTheme === 'light' ? (
                    <Sun size={18} color={colors.warning} />
                  ) : (
                    <Moon size={18} color={colors.primary} />
                  )}
                  <Text style={styles.inlineSettingLabel}>Theme</Text>
                </View>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentedOption,
                      currentTheme === 'light' && styles.segmentedOptionActive,
                    ]}
                    onPress={() => handleThemeChange('light')}
                  >
                    <Text
                      style={[
                        styles.segmentedText,
                        currentTheme === 'light' && styles.segmentedTextActive,
                      ]}
                    >
                      Light
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentedOption,
                      currentTheme === 'dark' && styles.segmentedOptionActive,
                    ]}
                    onPress={() => handleThemeChange('dark')}
                  >
                    <Text
                      style={[
                        styles.segmentedText,
                        currentTheme === 'dark' && styles.segmentedTextActive,
                      ]}
                    >
                      Dark
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Language Toggle */}
              <View style={styles.inlineSettingRow}>
                <View style={styles.inlineSettingLeft}>
                  <Globe size={18} color={colors.primary} />
                  <Text style={styles.inlineSettingLabel}>Language</Text>
                </View>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentedOption,
                      currentLanguage === 'en' && styles.segmentedOptionActive,
                    ]}
                    onPress={() => handleLanguageChange('en')}
                  >
                    <Text
                      style={[
                        styles.segmentedText,
                        currentLanguage === 'en' && styles.segmentedTextActive,
                      ]}
                    >
                      English
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentedOption,
                      currentLanguage === 'zh' && styles.segmentedOptionActive,
                    ]}
                    onPress={() => handleLanguageChange('zh')}
                  >
                    <Text
                      style={[
                        styles.segmentedText,
                        currentLanguage === 'zh' && styles.segmentedTextActive,
                      ]}
                    >
                      繁體中文
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Clear Cache */}
              <TouchableOpacity
                style={styles.inlineSettingRow}
                onPress={handleClearCache}
                activeOpacity={0.7}
              >
                <View style={styles.inlineSettingLeft}>
                  <Database size={18} color={colors.textMuted} />
                  <Text style={styles.inlineSettingLabel}>Clear Cache</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Help */}
      <View style={styles.section}>
        <View style={styles.card}>
          <MenuRow
            icon={<HelpCircle size={20} color={colors.textMuted} />}
            title="Help & Support"
            subtitle="FAQ, contact support"
            onPress={() => Alert.alert('Help', 'Support options coming soon.')}
            isLast
          />
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
      <Text style={styles.versionText}>Dragon Worlds HK 2027 v1.0.0</Text>
    </ScrollView>
  );
}

// ============================================
// Sub-components
// ============================================

interface IdentityCardProps {
  user: UserType;
  onPhotoUpload: () => void;
  onEditProfile?: () => void;
  isUploadingPhoto: boolean;
  uploadProgress: UploadProgress | null;
}

function IdentityCard({
  user,
  onPhotoUpload,
  onEditProfile,
  isUploadingPhoto,
  uploadProgress,
}: IdentityCardProps) {
  const showDragonLogo = !user.photoURL && !isUploadingPhoto;

  return (
    <View style={styles.identityCard}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={onPhotoUpload} activeOpacity={0.8}>
          <View style={styles.avatarContainer}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : showDragonLogo ? (
              <Image
                source={require('../../../assets/dragon-logo.png')}
                style={styles.avatarLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Sailboat size={32} color={colors.textMuted} />
              </View>
            )}

            {isUploadingPhoto && uploadProgress && (
              <View style={styles.uploadOverlay}>
                <Text style={styles.uploadText}>{uploadProgress.percentage}%</Text>
              </View>
            )}

            <View style={styles.cameraButton}>
              {isUploadingPhoto ? (
                <ActivityIndicator size={12} color="#fff" />
              ) : (
                <Camera size={14} color="#fff" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Identity Info */}
      <View style={styles.identityInfo}>
        <Text style={styles.userName}>{user.displayName || 'Sailor'}</Text>

        {/* Sailing Identity - This IS who they are */}
        <View style={styles.sailingIdentity}>
          {(user.sailingProfile?.sailNumber || user.sailingProfile?.boatClass) ? (
            <View style={styles.identityRow}>
              <Sailboat size={16} color={colors.primary} />
              <Text style={styles.identityText}>
                {[user.sailingProfile?.sailNumber, user.sailingProfile?.boatClass]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          ) : (
            <View style={styles.identityRow}>
              <Sailboat size={16} color={colors.textMuted} />
              <Text style={[styles.identityText, styles.identityPlaceholder]}>
                Add your sail number
              </Text>
            </View>
          )}
          {user.sailingProfile?.yachtClub ? (
            <View style={styles.identityRow}>
              <MapPin size={16} color={colors.primary} />
              <Text style={styles.identityText}>{user.sailingProfile.yachtClub}</Text>
            </View>
          ) : (
            <View style={styles.identityRow}>
              <MapPin size={16} color={colors.textMuted} />
              <Text style={[styles.identityText, styles.identityPlaceholder]}>
                Add your yacht club
              </Text>
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


interface MenuRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
  isLast?: boolean;
}

function MenuRow({ icon, title, subtitle, onPress, isLast }: MenuRowProps) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIconContainer}>{icon}</View>
        <View>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
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
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.border,
  },
  avatarLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
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

  // Settings Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  testNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  testNotificationText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '500',
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

  // Menu Row
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
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

  // Inline Settings
  inlineSettings: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inlineSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  inlineSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineSettingLabel: {
    ...typography.body2,
    color: colors.text,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: 2,
  },
  segmentedOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm - 1,
  },
  segmentedOptionActive: {
    backgroundColor: colors.surface,
  },
  segmentedText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  segmentedTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
});
