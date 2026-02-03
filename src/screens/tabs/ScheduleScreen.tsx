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

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Animated } from 'react-native';
import { TouchableOpacity } from 'react-native';
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
import { useWalkthroughStore } from '../../stores/walkthroughStore';
import type { ScheduleScreenProps } from '../../types/navigation';

const HEADER_HEIGHT = 250; // Height of header section including month/year, date picker, and day title

export function ScheduleScreen({ navigation, route }: ScheduleScreenProps) {
  const selectedEvent = useSelectedEvent();
  const setSelectedEvent = useSetSelectedEvent();
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showEventInfo, setShowEventInfo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Walkthrough target refs
  const headerRef = useRef<View>(null);
  const eventSwitchRef = useRef<View>(null);
  const datePickerRef = useRef<View>(null);
  const scheduleContentRef = useRef<View>(null);
  const { registerTarget, unregisterTarget } = useWalkthroughStore();

  // Register walkthrough targets
  useEffect(() => {
    registerTarget('schedule-header', headerRef);
    registerTarget('event-switch', eventSwitchRef);
    registerTarget('date-picker', datePickerRef);
    registerTarget('schedule-content', scheduleContentRef);

    return () => {
      unregisterTarget('schedule-header');
      unregisterTarget('event-switch');
      unregisterTarget('date-picker');
      unregisterTarget('schedule-content');
    };
  }, [registerTarget, unregisterTarget]);

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

  // Handle navigation parameters to auto-select and highlight specific events
  useEffect(() => {
    const { date, eventId } = route?.params || {};

    if (date || eventId) {
      const matchingDay = currentEvent.days.find(day => {
        const dateMatches = date && (day.date === date || day.date.includes(date));
        const eventMatches = eventId && day.activities.some(activity =>
          activity.activity.includes(eventId)
        );
        return dateMatches || eventMatches;
      });

      if (matchingDay) {
        setSelectedDayId(matchingDay.id);
      }
    }
  }, [route?.params, currentEvent]);

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
        <View ref={scheduleContentRef} collapsable={false}>
          <ScheduleDayContent day={selectedDay} />
        </View>

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
        <View ref={headerRef} collapsable={false} style={styles.header}>
          <View style={styles.headerContent}>
            <IOSText textStyle="title1" weight="bold" style={styles.headerTitle}>
              Schedule
            </IOSText>
            <ProfileButton size={36} />
          </View>
          <View ref={eventSwitchRef} collapsable={false}>
            <FloatingEventSwitch
              options={[
                { label: 'APAC 2026', shortLabel: 'APAC 2026', value: EVENTS.APAC_2026.id },
                { label: 'Worlds 2027', shortLabel: 'Worlds 2027', value: EVENTS.WORLDS_2027.id }
              ]}
              selectedValue={selectedEvent}
              onValueChange={setSelectedEvent}
            />
          </View>
        </View>

        {/* Date Picker with Day Title */}
        <View ref={datePickerRef} collapsable={false}>
          <HorizontalDatePicker
            days={currentEvent.days}
            selectedDayId={selectedDayId}
            onDaySelect={handleDaySelect}
            selectedDayTitle={selectedDay?.title}
            monthYear={monthYear}
          />
        </View>
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
