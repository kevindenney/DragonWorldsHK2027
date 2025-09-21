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
    
    if (date) {
      // Find the day that matches the date and expand it
      const matchingDay = currentEvent.days.find(day => 
        day.date === date || day.activities.some(activity => 
          activity.title === eventId || activity.subtitle?.includes(eventId || '')
        )
      );
      
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
              <View style={styles.statItem}>
                <IOSText textStyle="title1" weight="bold" style={styles.statNumber}>
                  {totalActivities}
                </IOSText>
                <IOSText textStyle="caption" color="secondaryLabel" style={styles.statLabel}>
                  Total Activities
                </IOSText>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <IOSText textStyle="title1" weight="bold" style={styles.statNumber}>
                  {competitionDays}
                </IOSText>
                <IOSText textStyle="caption" color="secondaryLabel" style={styles.statLabel}>
                  Event Days
                </IOSText>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <IOSText textStyle="title1" weight="bold" style={styles.statNumber}>
                  {racingDays}
                </IOSText>
                <IOSText textStyle="caption" color="secondaryLabel" style={styles.statLabel}>
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
  statNumber: {
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.sm,
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