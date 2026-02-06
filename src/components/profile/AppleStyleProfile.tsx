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
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import {
  Mail,
  LogOut,
  Camera,
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
import { imageUploadService, UploadProgress } from '../../services/imageUploadService';

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
  const { user, logout, updateProfile } = useAuth();

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      const message = error instanceof Error ? error.message : 'Failed to update photo.';
      Alert.alert('Error', message);
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(null);
    }
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
