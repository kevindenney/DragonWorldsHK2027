import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Save, User, Camera } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { useAuth } from '../../auth/useAuth';
import { User as UserType } from '../../auth/authTypes';
import { ProfileAvatar } from '../shared/ProfileAvatar';
import {
  pickImageFromGallery,
  pickImageFromCamera,
  uploadProfileImage,
  isCameraAvailable,
  debugFirebaseState,
} from '../../services/imageUploadService';
import { auth } from '../../config/firebase';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

interface ProfileFormData {
  displayName: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  testID,
}) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Photo editing state
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  // DEBUG: Firebase state info
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Initialize form data when modal opens
  useEffect(() => {
    if (visible && user) {
      console.log('[EditProfileModal] Modal opened');
      console.log('[EditProfileModal] App user.uid:', user.uid);
      console.log('[EditProfileModal] App user.email:', user.email);
      console.log('[EditProfileModal] App user.displayName:', user.displayName);
      console.log('[EditProfileModal] App user.photoURL:', user.photoURL);

      // Debug Firebase state when modal opens
      debugFirebaseState('EditProfileModal opened');

      // Build debug info string for visual display
      const authOk = !!auth;
      const currentUserOk = !!auth?.currentUser;
      const uidMatch = auth?.currentUser?.uid === user.uid;

      const debugStr = [
        `Upload: REST API`,
        `Auth: ${authOk ? 'OK' : 'NULL'}`,
        `CurrentUser: ${currentUserOk ? 'OK' : 'NULL'}`,
        `UID Match: ${uidMatch ? 'YES' : 'NO'}`,
        `App UID: ${user.uid?.substring(0, 8)}...`,
        `Auth UID: ${auth?.currentUser?.uid?.substring(0, 8) || 'N/A'}...`,
      ].join(' | ');

      setDebugInfo(debugStr);
      console.log('[EditProfileModal] DEBUG:', debugStr);

      const initialData = {
        displayName: user.displayName || '',
      };
      setFormData(initialData);
      setLocalPhotoUri(null);
      setPhotoRemoved(false);
      setUploadProgress(0);
      setHasChanges(false);
    }
  }, [visible, user]);

  // Track changes (including photo changes)
  useEffect(() => {
    if (user) {
      const hasNameChange = formData.displayName !== (user.displayName || '');
      const hasPhotoChange = localPhotoUri !== null || photoRemoved;

      setHasChanges(hasNameChange || hasPhotoChange);
    }
  }, [formData, user, localPhotoUri, photoRemoved]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.displayName.trim()) {
      Alert.alert('Validation Error', 'Display name is required.');
      return false;
    }

    return true;
  };

  // Handle avatar tap - show action sheet
  const handleAvatarPress = () => {
    const hasExistingPhoto = user?.photoURL || localPhotoUri;
    const cameraAvailable = isCameraAvailable();

    // Build options dynamically
    const options: string[] = ['Choose from Library'];
    if (cameraAvailable) {
      options.unshift('Take Photo');
    }
    if (hasExistingPhoto && !photoRemoved) {
      options.push('Remove Photo');
    }
    options.push('Cancel');

    const cancelIndex = options.length - 1;
    const destructiveIndex = options.indexOf('Remove Photo');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: cancelIndex,
          destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
          title: 'Change Profile Photo',
        },
        (buttonIndex) => {
          handleActionSheetSelection(options[buttonIndex]);
        }
      );
    } else {
      // Android fallback using Alert
      Alert.alert(
        'Change Profile Photo',
        undefined,
        options.map((option, index) => ({
          text: option,
          style: option === 'Remove Photo' ? 'destructive' : option === 'Cancel' ? 'cancel' : 'default',
          onPress: () => handleActionSheetSelection(option),
        }))
      );
    }
  };

  const handleActionSheetSelection = async (selection: string) => {
    switch (selection) {
      case 'Take Photo':
        await handleTakePhoto();
        break;
      case 'Choose from Library':
        await handleChooseFromLibrary();
        break;
      case 'Remove Photo':
        handleRemovePhoto();
        break;
      default:
        // Cancel - do nothing
        break;
    }
  };

  const handleTakePhoto = async () => {
    const result = await pickImageFromCamera();
    if (result && !result.cancelled) {
      setLocalPhotoUri(result.uri);
      setPhotoRemoved(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    const result = await pickImageFromGallery();
    if (result && !result.cancelled) {
      setLocalPhotoUri(result.uri);
      setPhotoRemoved(false);
    }
  };

  const handleRemovePhoto = () => {
    setLocalPhotoUri(null);
    setPhotoRemoved(true);
  };

  const handleSave = async () => {
    console.log('[EditProfileModal] handleSave called');
    console.log('[EditProfileModal] localPhotoUri:', localPhotoUri?.substring(0, 50));
    console.log('[EditProfileModal] photoRemoved:', photoRemoved);
    console.log('[EditProfileModal] formData:', JSON.stringify(formData));

    if (!validateForm()) {
      console.log('[EditProfileModal] Form validation failed');
      return;
    }

    if (!user) {
      console.log('[EditProfileModal] No user in context');
      Alert.alert('Error', 'No user logged in.');
      return;
    }

    console.log('[EditProfileModal] User from context:', user.uid);
    debugFirebaseState('handleSave before upload');

    setIsLoading(true);
    try {
      let newPhotoURL: string | undefined | null = undefined;

      // Upload new photo if selected
      if (localPhotoUri) {
        console.log('[EditProfileModal] Starting photo upload...');
        console.log('[EditProfileModal] Uploading for user.uid:', user.uid);
        setIsUploadingImage(true);
        try {
          const uploadResult = await uploadProfileImage(
            user.uid,
            localPhotoUri,
            (progress) => {
              console.log('[EditProfileModal] Upload progress:', progress);
              setUploadProgress(progress);
            }
          );
          console.log('[EditProfileModal] Upload SUCCESS!');
          console.log('[EditProfileModal] Download URL:', uploadResult.downloadURL);
          newPhotoURL = uploadResult.downloadURL;
        } catch (uploadError: any) {
          setIsUploadingImage(false);
          setIsLoading(false);
          const errorMessage = uploadError?.message || 'Unknown error';
          console.error('[EditProfileModal] Upload FAILED');
          console.error('[EditProfileModal] Upload error type:', typeof uploadError);
          console.error('[EditProfileModal] Upload error:', uploadError);
          console.error('[EditProfileModal] Upload error message:', errorMessage);
          Alert.alert(
            'Upload Failed',
            `${errorMessage}\n\nWould you like to try again or save without the photo?`,
            [
              { text: 'Try Again', onPress: handleSave },
              {
                text: 'Save Without Photo',
                onPress: () => saveProfileWithoutPhoto(),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return;
        }
        setIsUploadingImage(false);
      } else if (photoRemoved) {
        // User explicitly removed their photo
        console.log('[EditProfileModal] Photo removed, setting photoURL to null');
        newPhotoURL = null;
      }

      // Build profile updates
      const updates: Partial<UserType> = {
        displayName: formData.displayName.trim(),
      };

      // Only include photoURL if it changed
      if (newPhotoURL !== undefined) {
        updates.photoURL = newPhotoURL ?? undefined;
      }

      console.log('[EditProfileModal] Calling updateProfile with:', JSON.stringify(updates));
      await updateProfile(updates);
      console.log('[EditProfileModal] updateProfile SUCCESS');

      // Close modal immediately on success
      setIsLoading(false);
      onClose();
    } catch (error: any) {
      console.error('[EditProfileModal] updateProfile FAILED');
      console.error('[EditProfileModal] Profile update error:', error);
      console.error('[EditProfileModal] Profile update error message:', error?.message);
      setIsLoading(false);
      Alert.alert(
        'Error',
        `Failed to update your profile: ${error?.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const saveProfileWithoutPhoto = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updates: Partial<UserType> = {
        displayName: formData.displayName.trim(),
      };

      await updateProfile(updates);
      setIsLoading(false);
      onClose();
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to update your profile. Please try again.');
    }
  };

  const handleClose = () => {
    if (hasChanges && !isLoading) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to close without saving?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  // Determine the photo URL to display
  const displayPhotoURL = photoRemoved
    ? null
    : localPhotoUri || user?.photoURL;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      testID={testID}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isLoading}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Edit Profile</Text>

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveButton,
                (!hasChanges || isLoading) && styles.saveButtonDisabled,
              ]}
              disabled={!hasChanges || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.saveButtonContent}>
                  <Save size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* DEBUG INFO - TEMPORARY */}
          {__DEV__ && (
            <View style={styles.debugBanner}>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Profile Avatar Preview - Tappable */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handleAvatarPress}
                disabled={isLoading}
                activeOpacity={0.7}
                style={styles.avatarTouchable}
              >
                <ProfileAvatar
                  photoURL={displayPhotoURL}
                  name={formData.displayName || user?.displayName || 'Sailor'}
                  id={user?.uid || 'default'}
                  size={120}
                  isLoading={isUploadingImage}
                />
                {/* Camera badge overlay */}
                <View style={styles.cameraBadge}>
                  <Camera size={16} color={colors.white} />
                </View>
              </TouchableOpacity>

              {/* Upload progress indicator */}
              {isUploadingImage && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${uploadProgress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    Uploading... {uploadProgress}%
                  </Text>
                </View>
              )}

              {/* Hint text */}
              {!isUploadingImage && (
                <Text style={styles.avatarHint}>Tap to change photo</Text>
              )}
            </View>

            {/* Display Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={formData.displayName}
                  onChangeText={(text) => handleInputChange('displayName', text)}
                  placeholder="Enter your display name"
                  placeholderTextColor={colors.textMuted}
                  maxLength={50}
                  editable={!isLoading}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  debugBanner: {
    backgroundColor: '#FFEB3B',
    padding: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: 4,
  },
  debugText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  saveButton: {
    ...shadows.button,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  saveButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  form: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarTouchable: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    ...shadows.button,
  },
  progressContainer: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  avatarHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
});
