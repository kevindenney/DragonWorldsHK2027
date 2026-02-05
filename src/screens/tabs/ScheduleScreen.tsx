/**
 * ScheduleScreen - Apple WWDC25 Design Principles
 *
 * Redesigned following Apple's design principles:
 * - Structure: Prioritize essential features, remove decorative elements
 * - Progressive Disclosure: Show only what's necessary upfront
 * - Content First: Schedule visible immediately without tapping
 *
 * Layout:
 * - Header with event switch and info button
 * - HorizontalDatePicker for quick day navigation
 * - ScheduleDayContent showing activities immediately
 * - EventInfoSheet for progressive disclosure of event details
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IOSText } from '../../components/ios/IOSText';
import { FloatingEventSwitch } from '../../components/navigation/FloatingEventSwitch';
import { ProfileButton } from '../../components/navigation/ProfileButton';
import { useSelectedEvent, useSetSelectedEvent } from '../../stores/eventStore';
import { EVENTS } from '../../constants/events';
import { HorizontalDatePicker } from '../../components/schedule/HorizontalDatePicker';
import { ScheduleDayContent } from '../../components/schedule/ScheduleDayContent';
import { EventInfoSheet } from '../../components/schedule/EventInfoSheet';
import { colors, spacing } from '../../constants/theme';
import { eventSchedules } from '../../data/scheduleData';
import { useToolbarVisibility } from '../../contexts/TabBarVisibilityContext';
import type { ScheduleScreenProps } from '../../types/navigation';

const HEADER_HEIGHT = 250; // Height of header section including month/year, date picker, and day title

export function ScheduleScreen({ navigation, route }: ScheduleScreenProps) {
  const selectedEvent = useSelectedEvent();
  const setSelectedEvent = useSetSelectedEvent();
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showEventInfo, setShowEventInfo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedActivityName, setHighlightedActivityName] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Toolbar auto-hide
  const { toolbarTranslateY, createScrollHandler } = useToolbarVisibility();
  const scrollHandler = useMemo(() => createScrollHandler(), [createScrollHandler]);

  // Get current event data
  const currentEvent = selectedEvent === EVENTS.WORLDS_2027.id
    ? eventSchedules.worldChampionship
    : eventSchedules.asiaPacificChampionships;

  // Get currently selected day
  const selectedDay = useMemo(() => {
    if (!selectedDayId) return null;
    return currentEvent.days.find(day => day.id === selectedDayId) || null;
  }, [selectedDayId, currentEvent]);

  // Derive month/year from the first day of the event
  const monthYear = useMemo(() => {
    if (currentEvent.days.length === 0) return undefined;
    // Parse date string like "Thursday, November 19, 2026"
    const firstDay = currentEvent.days[0];
    const dateParts = firstDay.date.split(', ');
    const monthDay = dateParts[1]?.split(' ') || ['November'];
    const month = monthDay[0] || 'November';
    const year = dateParts[2] || '2026';
    return `${month} ${year}`;
  }, [currentEvent]);

  // Auto-select first day when event changes
  useEffect(() => {
    if (currentEvent.days.length > 0) {
      setSelectedDayId(currentEvent.days[0].id);
    }
  }, [selectedEvent]);

  // Helper to convert ISO date (2026-11-19) to "November 19, 2026" format for matching
  const formatIsoDateForMatching = useCallback((isoDate: string): string | null => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const parts = isoDate.split('-');
    if (parts.length !== 3) return null;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (monthIndex < 0 || monthIndex > 11) return null;
    return `${months[monthIndex]} ${day}, ${year}`;
  }, []);

  // Handle navigation parameters to auto-select and highlight specific events
  useEffect(() => {
    const { date, eventId } = route?.params || {};
    console.log('[ScheduleScreen] Received params:', { date, eventId });

    if (date || eventId) {
      const matchingDay = currentEvent.days.find(day => {
        // Try exact match first, then formatted ISO date match
        const formattedDate = date ? formatIsoDateForMatching(date) : null;
        const dateMatches = date && (
          day.date === date ||
          day.date.includes(date) ||
          (formattedDate && day.date.includes(formattedDate))
        );

        // Check if eventId matches:
        // 1. Any activity name
        // 2. The day title (e.g., "Racing Day 1" in "APAC Racing Day 1")
        // 3. Extract "Racing Day X" pattern from eventId and match against title
        const eventIdLower = eventId?.toLowerCase() || '';
        const dayTitleLower = day.title?.toLowerCase() || '';
        const eventMatches = eventId && (
          day.activities.some(activity =>
            activity.activity.toLowerCase().includes(eventIdLower)
          ) ||
          eventIdLower.includes(dayTitleLower) ||
          dayTitleLower.includes(eventIdLower)
        );
        return dateMatches || eventMatches;
      });

      if (matchingDay) {
        setSelectedDayId(matchingDay.id);

        // Set the highlighted activity name if eventId is provided
        if (eventId) {
          setHighlightedActivityName(eventId);

          // Clear highlight after 5 seconds
          const timer = setTimeout(() => {
            setHighlightedActivityName(null);
          }, 5000);

          return () => clearTimeout(timer);
        }
      }
    }
  }, [route?.params, currentEvent, formatIsoDateForMatching]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleDaySelect = useCallback((dayId: string) => {
    setSelectedDayId(dayId);
  }, []);

  return (
    <View style={styles.container}>
      {/* Main Content - Scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + insets.top }}
        scrollEventThrottle={16}
        onScroll={scrollHandler.onScroll}
        onScrollBeginDrag={scrollHandler.onScrollBeginDrag}
        onScrollEndDrag={scrollHandler.onScrollEndDrag}
        onMomentumScrollEnd={scrollHandler.onMomentumScrollEnd}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            progressViewOffset={HEADER_HEIGHT + insets.top}
          />
        }
      >
        {/* Day Content - Activities visible immediately */}
        <ScheduleDayContent day={selectedDay} highlightedActivityName={highlightedActivityName} />

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Header Section - Positioned above content */}
      <Animated.View
        style={[
          styles.headerSection,
          {
            paddingTop: insets.top,
            transform: [{ translateY: toolbarTranslateY }]
          }
        ]}
      >
        {/* Title Row */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IOSText textStyle="title1" weight="bold" style={styles.headerTitle}>
              Schedule
            </IOSText>
            <ProfileButton size={36} />
          </View>
          <FloatingEventSwitch
            options={[
              { label: 'APAC 2026', shortLabel: 'APAC 2026', value: EVENTS.APAC_2026.id },
              { label: 'Worlds 2027', shortLabel: 'Worlds 2027', value: EVENTS.WORLDS_2027.id }
            ]}
            selectedValue={selectedEvent}
            onValueChange={setSelectedEvent}
          />
        </View>

        {/* Date Picker with Day Title */}
        <HorizontalDatePicker
          days={currentEvent.days}
          selectedDayId={selectedDayId}
          onDaySelect={handleDaySelect}
          selectedDayTitle={selectedDay?.title}
          monthYear={monthYear}
        />
      </Animated.View>

      {/* Event Info Sheet - Progressive Disclosure */}
      <EventInfoSheet
        event={currentEvent}
        visible={showEventInfo}
        onClose={() => setShowEventInfo(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  bottomPadding: {
    height: 100,
  },
});
