/**
 * EventInfoSheet Component
 *
 * Bottom sheet for displaying event details (progressive disclosure).
 * Follows Apple WWDC25 design principle: "Progressive Disclosure" - show only what's necessary upfront.
 *
 * Contains:
 * - Event title and description
 * - Event dates and venue
 * - Statistics (total activities, event days, racing days)
 * - ClubSpot link for registration
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import {
  X,
  Calendar,
  MapPin,
  Sailboat,
  Users,
  CalendarDays,
  ExternalLink,
  Trophy,
} from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import type { EventSchedule } from '../../data/scheduleData';

interface EventInfoSheetProps {
  event: EventSchedule;
  visible: boolean;
  onClose: () => void;
}

export const EventInfoSheet: React.FC<EventInfoSheetProps> = ({
  event,
  visible,
  onClose,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Define snap points (50% and 85% of screen)
  const snapPoints = useMemo(() => ['50%', '85%'], []);

  // Control bottom sheet based on visibility
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Calculate event statistics
  const stats = useMemo(() => {
    const totalActivities = event.days.reduce((sum, day) => sum + day.activities.length, 0);
    const eventDays = event.days.length;
    const racingDays = event.days.filter(day =>
      day.activities.some(activity => activity.type === 'racing')
    ).length;
    const socialEvents = event.days.reduce((sum, day) =>
      sum + day.activities.filter(a => a.type === 'social').length, 0
    );

    return { totalActivities, eventDays, racingDays, socialEvents };
  }, [event]);

  // Handle opening ClubSpot link
  const handleClubSpotPress = async () => {
    if (event.clubSpotUrl) {
      try {
        const canOpen = await Linking.canOpenURL(event.clubSpotUrl);
        if (canOpen) {
          await Linking.openURL(event.clubSpotUrl);
        } else {
          Alert.alert('Error', 'Cannot open registration link');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open registration link');
      }
    }
  };

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Trophy size={24} color={colors.primary} strokeWidth={2} />
            <IOSText textStyle="title2" weight="bold" style={styles.title}>
              Event Info
            </IOSText>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <BottomSheetScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Event Title & Description */}
        <View style={styles.section}>
          <IOSText textStyle="title1" weight="bold" style={styles.eventTitle}>
            {event.title}
          </IOSText>
          <IOSText textStyle="body" style={styles.eventDescription}>
            {event.description}
          </IOSText>
        </View>

        {/* Event Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <CalendarDays size={20} color={colors.primary} />
            <View style={styles.detailText}>
              <IOSText textStyle="caption1" style={styles.detailLabel}>
                Dates
              </IOSText>
              <IOSText textStyle="body" weight="semibold" style={styles.detailValue}>
                {event.dates}
              </IOSText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={20} color={colors.primary} />
            <View style={styles.detailText}>
              <IOSText textStyle="caption1" style={styles.detailLabel}>
                Venue
              </IOSText>
              <IOSText textStyle="body" weight="semibold" style={styles.detailValue}>
                {event.venue}
              </IOSText>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
            Event Overview
          </IOSText>

          <View style={styles.statsGrid}>
            {/* Total Activities */}
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Calendar size={24} color="#0066CC" />
              </View>
              <IOSText textStyle="title1" weight="bold" style={[styles.statNumber, { color: '#0066CC' }]}>
                {stats.totalActivities}
              </IOSText>
              <IOSText textStyle="caption1" style={styles.statLabel}>
                Activities
              </IOSText>
            </View>

            {/* Event Days */}
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E0F7FA' }]}>
                <CalendarDays size={24} color="#00ACC1" />
              </View>
              <IOSText textStyle="title1" weight="bold" style={[styles.statNumber, { color: '#00ACC1' }]}>
                {stats.eventDays}
              </IOSText>
              <IOSText textStyle="caption1" style={styles.statLabel}>
                Event Days
              </IOSText>
            </View>

            {/* Racing Days */}
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Sailboat size={24} color="#2E7D8E" />
              </View>
              <IOSText textStyle="title1" weight="bold" style={[styles.statNumber, { color: '#2E7D8E' }]}>
                {stats.racingDays}
              </IOSText>
              <IOSText textStyle="caption1" style={styles.statLabel}>
                Racing Days
              </IOSText>
            </View>

            {/* Social Events */}
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FFEBEE' }]}>
                <Users size={24} color="#E74C3C" />
              </View>
              <IOSText textStyle="title1" weight="bold" style={[styles.statNumber, { color: '#E74C3C' }]}>
                {stats.socialEvents}
              </IOSText>
              <IOSText textStyle="caption1" style={styles.statLabel}>
                Social Events
              </IOSText>
            </View>
          </View>
        </View>

        {/* Registration Link */}
        {event.clubSpotUrl && (
          <TouchableOpacity style={styles.registrationButton} onPress={handleClubSpotPress}>
            <ExternalLink size={20} color="#FFFFFF" />
            <IOSText textStyle="body" weight="semibold" style={styles.registrationButtonText}>
              View on ClubSpot
            </IOSText>
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: colors.textMuted,
    width: 40,
    height: 4,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.lg,
  },
  eventTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    marginBottom: spacing.sm,
  },
  eventDescription: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  detailsSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    color: colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    color: colors.text,
  },
  statsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: 28,
    lineHeight: 34,
  },
  statLabel: {
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  registrationButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  registrationButtonText: {
    color: '#FFFFFF',
  },
});
