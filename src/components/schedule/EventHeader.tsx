import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, MapPin } from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { IOSCard } from '../ios/IOSCard';
import { colors, spacing } from '../../constants/theme';
import type { EventSchedule } from '../../data/scheduleData';

export interface EventHeaderProps {
  event: EventSchedule;
}

export const EventHeader: React.FC<EventHeaderProps> = ({ event }) => {
  return (
    <IOSCard style={styles.container} variant="elevated">
      <View style={styles.header}>
        <IOSText textStyle="title2" weight="bold" style={styles.title}>
          {event.title}
        </IOSText>
        <IOSText textStyle="callout" color="secondaryLabel" style={styles.description}>
          {event.description}
        </IOSText>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Calendar size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <IOSText textStyle="callout" weight="medium" style={styles.detailText}>
            {event.dates}
          </IOSText>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <MapPin size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <IOSText textStyle="callout" style={styles.detailText}>
            {event.venue.replace(', Port Shelter', '')}
          </IOSText>
        </View>
      </View>
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  details: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
  },
  detailText: {
    flex: 1,
    color: colors.text,
  },
});