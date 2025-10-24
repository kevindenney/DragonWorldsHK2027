import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOSText } from '../../components/ios/IOSText';
import { IOSSegmentedControl } from '../../components/ios/IOSSegmentedControl';
import { EventHeader } from '../../components/schedule/EventHeader';
import { DayCard } from '../../components/schedule/DayCard';
import { colors, spacing } from '../../constants/theme';
import { eventSchedules } from '../../data/scheduleData';
import type { ScheduleScreenProps } from '../../types/navigation';

export function ScheduleScreen({ navigation, route }: ScheduleScreenProps) {
  const [selectedEvent, setSelectedEvent] = useState<'asia-pacific-2026' | 'dragon-worlds-2026'>('asia-pacific-2026');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const currentEvent = selectedEvent === 'dragon-worlds-2026'
    ? eventSchedules.worldChampionship
    : eventSchedules.asiaPacificChampionships;

  // Handle navigation parameters to auto-expand and highlight specific events
  useEffect(() => {
    const { date, eventId } = route?.params || {};
    
    if (date || eventId) {
      // Find the day that matches the date or contains the event
      const matchingDay = currentEvent.days.find(day => {
        // Match by date (check if day.date contains the date string)
        const dateMatches = date && (day.date === date || day.date.includes(date));

        // Match by event name
        const eventMatches = eventId && day.activities.some(activity =>
          activity.activity.includes(eventId)
        );

        return dateMatches || eventMatches;
      });

      if (matchingDay) {
        const dayId = matchingDay.date;
        setExpandedDays(new Set([dayId]));
      }
    }
  }, [route?.params, currentEvent]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleEventChange = (eventId: 'asia-pacific-2026' | 'dragon-worlds-2026') => {
    setSelectedEvent(eventId);
    // Clear expanded days when switching events
    setExpandedDays(new Set());
  };

  const handleDayToggle = (dayId: string) => {
    const newExpandedDays = new Set(expandedDays);
    if (newExpandedDays.has(dayId)) {
      newExpandedDays.delete(dayId);
    } else {
      newExpandedDays.add(dayId);
    }
    setExpandedDays(newExpandedDays);
  };

  const calculateEventStats = () => {
    const totalActivities = currentEvent.days.reduce((sum, day) => sum + day.activities.length, 0);
    const competitionDays = currentEvent.days.length;
    const racingDays = currentEvent.days.filter(day => 
      day.activities.some(activity => activity.type === 'racing')
    ).length;
    
    return { totalActivities, competitionDays, racingDays };
  };

  const { totalActivities, competitionDays, racingDays } = calculateEventStats();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
      </View>

      {/* Event Selector */}
      <View style={styles.eventToggleContainer}>
        <IOSSegmentedControl
          options={[
            { label: '2026 Asia Pacific Championship', value: 'asia-pacific-2026' },
            { label: '2027 Dragon World Championship', value: 'dragon-worlds-2026' }
          ]}
          selectedValue={selectedEvent}
          onValueChange={(eventId) => handleEventChange(eventId as 'asia-pacific-2026' | 'dragon-worlds-2026')}
        />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Event Header */}
        <EventHeader event={currentEvent} />

        {/* Event Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              {/* Total Activities - Blue */}
              <View style={styles.statItem}>
                <View style={[styles.statCircle, styles.statCircleBlue]}>
                  <IOSText textStyle="title1" weight="bold" style={[styles.statNumber, styles.statNumberBlue]}>
                    {totalActivities}
                  </IOSText>
                </View>
                <IOSText textStyle="caption" style={styles.statLabel}>
                  Total Activities
                </IOSText>
              </View>

              {/* Event Days - Teal */}
              <View style={styles.statItem}>
                <View style={[styles.statCircle, styles.statCircleTeal]}>
                  <IOSText textStyle="title1" weight="bold" style={[styles.statNumber, styles.statNumberTeal]}>
                    {competitionDays}
                  </IOSText>
                </View>
                <IOSText textStyle="caption" style={styles.statLabel}>
                  Event Days
                </IOSText>
              </View>

              {/* Racing Days - Orange */}
              <View style={styles.statItem}>
                <View style={[styles.statCircle, styles.statCircleOrange]}>
                  <IOSText textStyle="title1" weight="bold" style={[styles.statNumber, styles.statNumberOrange]}>
                    {racingDays}
                  </IOSText>
                </View>
                <IOSText textStyle="caption" style={styles.statLabel}>
                  Racing Days
                </IOSText>
              </View>
            </View>
          </View>
        </View>

        {/* Day Cards */}
        <View style={styles.daysContainer}>
          {currentEvent.days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              isExpanded={expandedDays.has(day.id)}
              onToggle={handleDayToggle}
            />
          ))}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  title: {
    color: colors.text,
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCircleBlue: {
    backgroundColor: '#E3F2FD', // Light blue
  },
  statCircleTeal: {
    backgroundColor: '#E0F7FA', // Light teal
  },
  statCircleOrange: {
    backgroundColor: '#FFF3E0', // Light orange
  },
  statNumber: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  statNumberBlue: {
    color: '#0066CC', // Blue
  },
  statNumberTeal: {
    color: '#00ACC1', // Teal
  },
  statNumberOrange: {
    color: '#FF9800', // Orange
  },
  statLabel: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666666',
    marginTop: 0,
  },
  daysContainer: {
    paddingBottom: spacing.md,
  },
  bottomPadding: {
    height: spacing.lg,
  },
  eventToggleContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});