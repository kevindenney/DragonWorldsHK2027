import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Clock, User, ExternalLink, Globe } from 'lucide-react-native';

import { colors, spacing, borderRadius } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import {
  IOSNavigationBar,
  IOSText,
  IOSCard,
  IOSBadge,
  IOSButton
} from '../ios';
import type { OfficialNotification } from '../../types/noticeBoard';

interface NotificationDetailProps {
  navigation: any;
  route: {
    params: {
      notificationId: string;
      eventId: string;
      notification: OfficialNotification;
    };
  };
}

export const NotificationDetail: React.FC<NotificationDetailProps> = ({
  navigation,
  route
}) => {
  const { notification } = route.params;

  const handleBack = async () => {
    await haptics.buttonPress();
    navigation.goBack();
  };

  // Handle external link press
  const handleExternalLink = async (url: string) => {
    try {
      await haptics.buttonPress();
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
      }
    } catch (error) {
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'urgent': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.primary;
      case 'low': return colors.textSecondary;
      default: return colors.primary;
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <IOSNavigationBar
        style="large"
        title="Notice Details"
        leftAction={{
          icon: <ChevronLeft size={20} color={colors.primary} />,
          onPress: handleBack
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <IOSCard variant="elevated" style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Bell size={24} color={getPriorityColor(notification.priority)} />
            </View>
            <View style={styles.headerContent}>
              <IOSBadge
                color={getPriorityColor(notification.priority)}
                variant={notification.priority === 'urgent' ? 'filled' : 'tinted'}
                size="small"
              >
                {(notification.priority || 'medium').toUpperCase()}
              </IOSBadge>
              {notification.isRead === false && (
                <IOSBadge color="systemBlue" variant="filled" size="small">
                  UNREAD
                </IOSBadge>
              )}
            </View>
          </View>

          {/* Title */}
          <IOSText textStyle="title2" weight="bold" style={styles.title}>
            {notification.title}
          </IOSText>

          {/* Metadata */}
          <View style={styles.metadata}>
            <View style={styles.metadataRow}>
              <Clock size={16} color={colors.textSecondary} />
              <IOSText textStyle="caption1" color="secondaryLabel">
                {formatTime(notification.publishedAt)}
              </IOSText>
            </View>

            {notification.author && (
              <View style={styles.metadataRow}>
                <User size={16} color={colors.textSecondary} />
                <IOSText textStyle="caption1" color="secondaryLabel">
                  {notification.authorRole.replace('_', ' ')} - {notification.author}
                </IOSText>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <IOSText textStyle="body" style={styles.contentText}>
              {notification.content}
            </IOSText>
          </View>

          {/* Original Source Link */}
          {notification.sourceUrl && (
            <View style={styles.sourceSection}>
              <View style={styles.sourceHeader}>
                <Globe size={16} color={colors.primary} />
                <IOSText textStyle="caption1" color="label" weight="medium">
                  Original Source
                </IOSText>
              </View>
              <IOSButton
                title="View on Event Website"
                size="small"
                variant="tinted"
                color={colors.primary}
                icon={<ExternalLink size={14} color={colors.primary} />}
                onPress={() => handleExternalLink(notification.sourceUrl!)}
                style={styles.sourceButton}
              />
            </View>
          )}

          {/* Tags */}
          {notification.tags && notification.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <IOSText textStyle="caption1" weight="semibold" style={styles.tagsTitle}>
                Tags
              </IOSText>
              <View style={styles.tags}>
                {notification.tags.map((tag, index) => (
                  <IOSBadge
                    key={index}
                    color="systemGray"
                    variant="tinted"
                    size="small"
                  >
                    {tag}
                  </IOSBadge>
                ))}
              </View>
            </View>
          )}
        </IOSCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: spacing.md,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    marginBottom: spacing.md,
    lineHeight: 28,
  },
  metadata: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  content: {
    marginBottom: spacing.lg,
  },
  contentText: {
    lineHeight: 24,
  },
  tagsSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  tagsTitle: {
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sourceSection: {
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sourceButton: {
    alignSelf: 'flex-start',
  },
});