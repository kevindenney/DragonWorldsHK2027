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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Save, User, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { useAuth } from '../../auth/useAuth';
import { User as UserType } from '../../auth/authTypes';
import { imageUploadService } from '../../services/imageUploadService';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

interface ProfileFormData {
  displayName: string;
  photoURL: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  testID,
}) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    photoURL: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (visible && user) {
      const initialData = {
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      };
      setFormData(initialData);
      setHasChanges(false);
    }
  }, [visible, user]);

  // Track changes
  useEffect(() => {
    if (user) {
      const hasModifications =
        formData.displayName !== (user.displayName || '') ||
        formData.photoURL !== (user.photoURL || '');

      setHasChanges(hasModifications);
    }
  }, [formData, user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to change your profile picture.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleInputChange('photoURL', result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.displayName.trim()) {
      Alert.alert('Validation Error', 'Display name is required.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No user logged in.');
      return;
    }

    setIsLoading(true);
    try {
      const updates: Partial<UserType> = {
        displayName: formData.displayName.trim(),
      };

      // Upload new profile picture if changed and is a local file
      if (formData.photoURL !== (user?.photoURL || '')) {
        if (formData.photoURL && !formData.photoURL.startsWith('http')) {
          // Local file URI - upload to Firebase Storage
          try {
            const uploadResult = await imageUploadService.uploadProfilePicture(
              user.uid,
              formData.photoURL
            );
            updates.photoURL = uploadResult.downloadURL;
          } catch (uploadError) {
            const message = uploadError instanceof Error ? uploadError.message : 'Unknown error';
            Alert.alert(
              'Upload Error',
              `Failed to upload profile picture: ${message}. Your other changes will still be saved.`,
              [{ text: 'OK' }]
            );
            // Continue without the photo update
          }
        } else {
          // Already a remote URL or empty
          updates.photoURL = formData.photoURL || undefined;
        }
      }

      await updateProfile(updates);

      // Close modal immediately on success
      setIsLoading(false);
      onClose();
    } catch (error) {
      setIsLoading(false);
      Alert.alert(
        'Error',
        'Failed to update your profile. Please try again.',
        [{ text: 'OK' }]
      );
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

          {/* Form */}
          <View style={styles.form}>
            {/* Profile Picture */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.avatarContainer}
                disabled={isLoading}
              >
                {formData.photoURL ? (
                  <Image
                    source={{ uri: formData.photoURL }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={48} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.cameraButton}>
                  <Camera size={16} color={colors.background} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to change photo</Text>
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
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
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
