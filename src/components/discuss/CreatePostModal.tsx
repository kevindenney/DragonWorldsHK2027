/**
 * CreatePostModal Component
 *
 * Native modal for creating new posts or editing existing posts in the community.
 * Supports post types, title, and body input.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Send,
  Check,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Flag,
  AlertTriangle,
} from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import { IOSText } from '../ios/IOSText';
import { IOSButton } from '../ios/IOSButton';
import { IOSCard } from '../ios/IOSCard';

import type { PostType, CommunityPost } from '../../types/community';
import { POST_TYPE_BADGES } from '../../types/community';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (post: { title: string; body: string | null; postType: PostType }) => Promise<void>;
  isSubmitting?: boolean;
  communityName?: string;
  /** If provided, modal operates in edit mode with pre-filled values */
  editingPost?: CommunityPost | null;
}

interface PostTypeOption {
  type: PostType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const POST_TYPE_OPTIONS: PostTypeOption[] = [
  {
    type: 'discussion',
    label: 'Discussion',
    icon: <MessageSquare size={20} color={POST_TYPE_BADGES.discussion.color} />,
    description: 'General discussion topic',
  },
  {
    type: 'question',
    label: 'Question',
    icon: <HelpCircle size={20} color={POST_TYPE_BADGES.question.color} />,
    description: 'Ask the community',
  },
  {
    type: 'tip',
    label: 'Tip',
    icon: <Lightbulb size={20} color={POST_TYPE_BADGES.tip.color} />,
    description: 'Share helpful advice',
  },
  {
    type: 'report',
    label: 'Race Report',
    icon: <Flag size={20} color={POST_TYPE_BADGES.report.color} />,
    description: 'Share race experience',
  },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
  communityName = 'Community',
  editingPost,
}) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [postType, setPostType] = useState<PostType>('discussion');
  const [titleError, setTitleError] = useState<string | null>(null);

  const isEditMode = !!editingPost;

  /**
   * Pre-fill form when editing
   */
  useEffect(() => {
    if (editingPost && visible) {
      setTitle(editingPost.title);
      setBody(editingPost.body || '');
      setPostType(editingPost.post_type);
      setTitleError(null);
    }
  }, [editingPost, visible]);

  /**
   * Reset form state
   */
  const resetForm = useCallback(() => {
    setTitle('');
    setBody('');
    setPostType('discussion');
    setTitleError(null);
  }, []);

  /**
   * Handle close
   */
  const handleClose = useCallback(() => {
    Haptics.selectionAsync();
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  /**
   * Validate form
   */
  const validateForm = useCallback((): boolean => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return false;
    }
    if (title.trim().length < 5) {
      setTitleError('Title must be at least 5 characters');
      return false;
    }
    setTitleError(null);
    return true;
  }, [title]);

  /**
   * Handle submit
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim() || null,
        postType,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      onClose();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Error handling is done in parent
    }
  }, [title, body, postType, validateForm, onSubmit, resetForm, onClose]);

  /**
   * Handle post type selection
   */
  const handlePostTypeSelect = useCallback((type: PostType) => {
    Haptics.selectionAsync();
    setPostType(type);
  }, []);

  if (!visible) return null;

  const canSubmit = title.trim().length >= 5 && !isSubmitting;

  return (
    <View style={[styles.overlay, { paddingTop: insets.top }]} testID="create-post-modal">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="create-post-close-button"
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <IOSText textStyle="headline" weight="semibold">
                {isEditMode ? 'Edit Post' : 'New Post'}
              </IOSText>
              <IOSText textStyle="caption1" color="secondaryLabel">
                in {communityName}
              </IOSText>
            </View>
            <IOSButton
              title={isEditMode ? 'Save' : 'Post'}
              size="small"
              variant={canSubmit ? 'filled' : 'gray'}
              disabled={!canSubmit}
              loading={isSubmitting}
              icon={!isSubmitting ? (isEditMode ? <Check size={14} color={canSubmit ? '#FFFFFF' : colors.textMuted} /> : <Send size={14} color={canSubmit ? '#FFFFFF' : colors.textMuted} />) : undefined}
              onPress={handleSubmit}
              testID="create-post-submit-button"
            />
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Post Type Selector */}
            <View style={styles.section}>
              <IOSText textStyle="footnote" color="secondaryLabel" style={styles.sectionLabel}>
                POST TYPE
              </IOSText>
              <View style={styles.postTypeGrid} testID="create-post-type-grid">
                {POST_TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.postTypeOption,
                      postType === option.type && styles.postTypeOptionSelected,
                    ]}
                    onPress={() => handlePostTypeSelect(option.type)}
                    activeOpacity={0.7}
                    testID={`create-post-type-${option.type}`}
                  >
                    {option.icon}
                    <IOSText
                      testID={`create-post-type-label-${option.type}`}
                      textStyle="caption1"
                      weight={postType === option.type ? 'semibold' : 'regular'}
                      color={postType === option.type ? 'systemBlue' : 'label'}
                    >
                      {option.label}
                    </IOSText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title Input */}
            <View style={styles.section}>
              <IOSText textStyle="footnote" color="secondaryLabel" style={styles.sectionLabel}>
                TITLE
              </IOSText>
              <TextInput
                style={[styles.titleInput, titleError && styles.inputError]}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (titleError) setTitleError(null);
                }}
                maxLength={200}
                autoFocus
                returnKeyType="next"
                testID="create-post-title-input"
              />
              {titleError && (
                <IOSText textStyle="caption2" color="systemRed" style={styles.errorText}>
                  {titleError}
                </IOSText>
              )}
              <IOSText textStyle="caption2" color="tertiaryLabel" style={styles.charCount}>
                {title.length}/200
              </IOSText>
            </View>

            {/* Body Input */}
            <View style={styles.section}>
              <IOSText textStyle="footnote" color="secondaryLabel" style={styles.sectionLabel}>
                DETAILS (OPTIONAL)
              </IOSText>
              <TextInput
                style={styles.bodyInput}
                placeholder="Add more details, context, or questions..."
                placeholderTextColor={colors.textMuted}
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={5000}
                testID="create-post-body-input"
              />
              <IOSText textStyle="caption2" color="tertiaryLabel" style={styles.charCount}>
                {body.length}/5000
              </IOSText>
            </View>

            {/* Guidelines */}
            <IOSCard variant="filled" style={styles.guidelinesCard}>
              <IOSText textStyle="caption1" color="secondaryLabel">
                Community Guidelines: Be respectful, stay on topic, and share constructive
                content. Posts that violate guidelines may be removed.
              </IOSText>
            </IOSCard>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 100,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
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
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    letterSpacing: 0.5,
  },
  postTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  postTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postTypeOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  titleInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 17,
    color: colors.text,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  charCount: {
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  bodyInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    minHeight: 150,
    lineHeight: 22,
  },
  guidelinesCard: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
});

export default CreatePostModal;
