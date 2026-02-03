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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  AlertTriangle,
  Smartphone,
  Globe,
  Database,
  Eye,
  Moon,
  Sun,
  HelpCircle,
  MessageCircle,
  FileText,
  Star,
  Anchor,
  Sailboat,
  ChevronRight
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { useAuth } from '../../auth/useAuth';
import { User as UserType, UserProfile as UserProfileType, LinkedProvider } from '../../types/auth';
import { AuthButton } from './AuthButton';
import { imageUploadService, UploadProgress } from '../../services/imageUploadService';

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
  };

  const handlePhotoUpload = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to update your profile picture.');
        return;
      }

      // Show action sheet for photo selection
      Alert.alert(
        'Update Profile Photo',
        'Choose an option to update your profile picture',
        [
          { text: 'Camera', onPress: () => handleImageSelection('camera') },
          { text: 'Photo Library', onPress: () => handleImageSelection('library') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to access photo library. Please try again.');
    }
  };

  const handleImageSelection = async (source: 'camera' | 'library') => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setUploadProgress(null);


      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert('Permission Required', 'Please allow camera access to take a photo.');
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'] as ImagePicker.MediaType[],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8, // Better quality for profile pictures
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'] as ImagePicker.MediaType[],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8, // Better quality for profile pictures
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        // Compress image if needed to reduce upload time
        const compressedUri = await imageUploadService.compressImage(imageUri, 400, 0.8);

        // Upload to Firebase Storage with progress tracking
        const uploadResult = await imageUploadService.uploadProfilePicture(
          user.uid,
          compressedUri,
          {
            onProgress: (progress) => {
              setUploadProgress(progress);
            },
            timeoutMs: 30000, // 30 second timeout
            maxSizeBytes: 5 * 1024 * 1024, // 5MB limit
          }
        );


        // Update the profile with the cloud storage URL
        await updateProfile({
          photoURL: uploadResult.downloadURL,
        });

        showSuccessMessage('Profile photo updated successfully!');
      }
    } catch (error) {

      let errorMessage = 'Failed to update profile photo.';
      if (error instanceof Error) {
        // Use the user-friendly error messages from the upload service
        errorMessage = error.message;
      }

      Alert.alert('Upload Error', errorMessage + ' Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(null);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      setIsUpdatingProfile(true);
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

      showSuccessMessage(
        `Push notifications ${value ? 'enabled' : 'disabled'} successfully!`
      );
    } catch (error) {
      // Revert the toggle on error
      setNotificationsEnabled(!value);
      Alert.alert('Error', 'Failed to update notification preferences. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
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
      {successMessage && (
        <View style={styles.successMessage}>
          <CheckCircle size={16} color={colors.success} />
          <Text style={styles.successMessageText}>{successMessage}</Text>
        </View>
      )}

      <ProfileHeader
        user={user}
        onEditProfile={onEditProfile}
        onPhotoUpload={handlePhotoUpload}
        isUploadingPhoto={isUploadingPhoto}
        uploadProgress={uploadProgress}
      />

      <ProfileSection title="Sailing Profile">
        <ProfileField
          icon={<User size={20} color={colors.textMuted} />}
          label="Role"
          value="Sailor"
        />

        <ProfileField
          icon={<Sailboat size={20} color={colors.textMuted} />}
          label="Boat"
          value="d59 (Dragon Class)"
        />

        <ProfileField
          icon={<MapPin size={20} color={colors.textMuted} />}
          label="Home Club"
          value="Royal Hong Kong Yacht Club"
        />

        <TouchableOpacity
          style={styles.field}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert('Event Registrations', 'Your registered events will be shown here in a future update.');
          }}
        >
          <View style={styles.fieldLeft}>
            <Calendar size={20} color={colors.textMuted} />
            <View style={styles.fieldText}>
              <Text style={styles.fieldLabel}>Event Registrations</Text>
              <Text style={styles.fieldValue}>2 active registrations</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </ProfileSection>

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
          value={formatDate(user.createdAt)}
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
        
        <ConnectedAccounts providers={user.linkedProviders || []} />
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
          {isUpdatingProfile ? (
            <ActivityIndicator size={20} color={colors.primary} />
          ) : (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
              disabled={isUpdatingProfile}
            />
          )}
        </View>
      </ProfileSection>

      <ProfileSection title="App Settings">
        <SettingsItem
          icon={<Smartphone size={20} color={colors.textMuted} />}
          title="Display & Interface"
          subtitle="App theme, font size, and display preferences"
          onPress={() => {
            // TODO: Navigate to display settings
            Alert.alert('Display Settings', 'Display and interface settings will be available in a future update.');
          }}
          showArrow
        />

        <SettingsItem
          icon={<Globe size={20} color={colors.textMuted} />}
          title="Language & Region"
          subtitle="App language, date format, and units"
          onPress={() => {
            // TODO: Navigate to language settings
            Alert.alert('Language Settings', 'Language and region settings will be available in a future update.');
          }}
          showArrow
        />

        <SettingsItem
          icon={<Database size={20} color={colors.textMuted} />}
          title="Data & Storage"
          subtitle="Manage app data, cache, and offline content"
          onPress={() => {
            // TODO: Navigate to data settings
            Alert.alert('Data Settings', 'Data and storage settings will be available in a future update.');
          }}
          showArrow
        />

        <SettingsItem
          icon={<Eye size={20} color={colors.textMuted} />}
          title="Privacy & Permissions"
          subtitle="App permissions and privacy controls"
          onPress={() => {
            // TODO: Navigate to privacy settings
            Alert.alert('Privacy Settings', 'Privacy and permissions settings will be available in a future update.');
          }}
          showArrow
        />
      </ProfileSection>

      <ProfileSection title="Support & Help">
        <SettingsItem
          icon={<HelpCircle size={20} color={colors.textMuted} />}
          title="Help Center"
          subtitle="Browse FAQ and get answers to common questions"
          onPress={() => {
            // TODO: Navigate to help center or open help URL
            Alert.alert('Help Center', 'The help center will be available in a future update. For immediate assistance, please contact support.');
          }}
          showArrow
        />

        <SettingsItem
          icon={<MessageCircle size={20} color={colors.textMuted} />}
          title="Contact Support"
          subtitle="Get in touch with our support team"
          onPress={() => {
            Alert.alert(
              'Contact Support',
              'Choose how you\'d like to contact support:',
              [
                {
                  text: 'Email',
                  onPress: () => {
                    const supportEmail = 'support@regattaflow.com';
                    const subject = 'DragonWorlds HK 2027 - Support Request';
                    const body = `Hello RegattaFlow Support,

I need assistance with the DragonWorlds HK 2027 app.

User Information:
- Email: ${user?.email}
- User ID: ${user?.uid}

Issue Description:
[Please describe your issue here]

Thank you for your assistance.`;

                    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    Alert.alert('Opening Email', `We'll open your email app to contact support at ${supportEmail}`);
                    // In a real implementation, you would use Linking.openURL(mailtoUrl)
                  }
                },
                {
                  text: 'In-App',
                  onPress: () => {
                    Alert.alert('In-App Support', 'In-app support chat will be available in a future update.');
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
          showArrow
        />

        <SettingsItem
          icon={<FileText size={20} color={colors.textMuted} />}
          title="Terms & Privacy"
          subtitle="Read our terms of service and privacy policy"
          onPress={() => {
            Alert.alert(
              'Terms & Privacy',
              'Choose what you\'d like to read:',
              [
                {
                  text: 'Terms of Service',
                  onPress: () => {
                    Alert.alert('Terms of Service', 'Terms of Service will be available in a future update.');
                  }
                },
                {
                  text: 'Privacy Policy',
                  onPress: () => {
                    Alert.alert('Privacy Policy', 'Privacy Policy will be available in a future update.');
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
          showArrow
        />

        <SettingsItem
          icon={<Star size={20} color={colors.textMuted} />}
          title="Rate the App"
          subtitle="Share your feedback on the App Store"
          onPress={() => {
            Alert.alert(
              'Rate the App',
              'We\'d love to hear your feedback! Your rating helps us improve the app.',
              [
                {
                  text: 'Rate Now',
                  onPress: () => {
                    Alert.alert('App Store', 'App Store rating will be available when the app is published.');
                  }
                },
                {
                  text: 'Maybe Later',
                  style: 'cancel'
                }
              ]
            );
          }}
          showArrow
        />
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
  onPhotoUpload?: () => void;
  isUploadingPhoto?: boolean;
  uploadProgress?: UploadProgress | null;
}

function ProfileHeader({
  user,
  onEditProfile,
  onPhotoUpload,
  isUploadingPhoto,
  uploadProgress,
}: ProfileHeaderProps) {
  const showDragonLogo = !user.photoURL && !isUploadingPhoto;

  return (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : showDragonLogo ? (
          <Image
            source={require('../../../assets/dragon-logo.png')}
            style={styles.avatarDragonLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={40} color={colors.textMuted} />
          </View>
        )}

        {/* Upload progress overlay */}
        {isUploadingPhoto && uploadProgress && (
          <View style={styles.uploadProgressOverlay}>
            <View style={styles.uploadProgressContainer}>
              <View style={[styles.uploadProgressBar, { width: `${uploadProgress.percentage}%` }]} />
            </View>
            <Text style={styles.uploadProgressText}>{uploadProgress.percentage}%</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.cameraButton, isUploadingPhoto && styles.cameraButtonLoading]}
          activeOpacity={0.7}
          onPress={onPhotoUpload}
          disabled={isUploadingPhoto}
        >
          {isUploadingPhoto ? (
            <ActivityIndicator size={14} color={colors.background} />
          ) : (
            <Camera size={16} color={colors.background} />
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.displayName}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        
        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.metadata?.loginCount || 0}</Text>
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
      
      {providers && providers.length > 0 ? (
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '30',
    gap: spacing.sm,
  },
  successMessageText: {
    ...typography.body2,
    color: colors.success,
    flex: 1,
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
  avatarDragonLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  uploadProgressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: colors.text + '80',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  uploadProgressContainer: {
    width: 60,
    height: 4,
    backgroundColor: colors.background + '40',
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadProgressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  uploadProgressText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
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
    ...shadows.button,
  },
  cameraButtonLoading: {
    backgroundColor: colors.textMuted,
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