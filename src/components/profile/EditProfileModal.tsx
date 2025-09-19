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
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Save, User, Mail, Phone, MapPin } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { useAuth } from '../../auth/useAuth';
import { User as UserType } from '../../types/auth';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

interface ProfileFormData {
  displayName: string;
  email: string;
  phoneNumber: string;
  location: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  testID,
}) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    email: '',
    phoneNumber: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (visible && user) {
      const initialData = {
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        location: user.profile?.location || '',
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
        formData.email !== (user.email || '') ||
        formData.phoneNumber !== (user.phoneNumber || '') ||
        formData.location !== (user.profile?.location || '');

      setHasChanges(hasModifications);
    }
  }, [formData, user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.displayName.trim()) {
      Alert.alert('Validation Error', 'Display name is required.');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email address is required.');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updates: Partial<UserType> = {
        displayName: formData.displayName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        profile: {
          ...user?.profile,
          location: formData.location.trim() || undefined,
        },
      };

      // Note: Email changes typically require re-authentication in most systems
      // For now, we'll exclude email updates to avoid complications
      if (formData.email !== user?.email) {
        Alert.alert(
          'Email Change',
          'Email changes require additional verification. Please contact support to change your email address.',
          [{ text: 'OK' }]
        );
        return;
      }

      await updateProfile(updates);

      Alert.alert(
        'Success',
        'Your profile has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: onClose,
          },
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        'Failed to update your profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
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
                <ActivityIndicator size={20} color={colors.background} />
              ) : (
                <View style={styles.saveButtonContent}>
                  <Save size={16} color={colors.background} />
                  <Text style={styles.saveButtonText}>Save</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* Display Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Display Name *</Text>
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
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
                  <Mail size={20} color={colors.textMuted} />
                  <TextInput
                    style={[styles.textInput, styles.textInputDisabled]}
                    value={formData.email}
                    placeholder="Email address"
                    placeholderTextColor={colors.textMuted}
                    editable={false}
                  />
                </View>
                <Text style={styles.inputHelper}>
                  Contact support to change your email address
                </Text>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Phone size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.phoneNumber}
                    onChangeText={(text) => handleInputChange('phoneNumber', text)}
                    placeholder="Enter your phone number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={20}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.location}
                    onChangeText={(text) => handleInputChange('location', text)}
                    placeholder="Enter your location"
                    placeholderTextColor={colors.textMuted}
                    maxLength={100}
                    editable={!isLoading}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
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
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.button,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
    gap: spacing.lg,
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
  inputContainerDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  textInputDisabled: {
    color: colors.textMuted,
  },
  inputHelper: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.xs,
  },
});