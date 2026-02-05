import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { colors, spacing } from '../../constants/theme';
import type { Activity, ActivityType, ActivityWithContext } from '../../data/scheduleData';
import { activityTypes, getActivitiesAtLocation } from '../../data/scheduleData';
import { EventActionSheet } from './EventActionSheet';
import { EventDetailModal } from './EventDetailModal';
import { RelatedActivitiesModal } from './RelatedActivitiesModal';
import { getLocationById } from '../../data/sailingLocations';

export interface ActivityItemProps {
  activity: Activity;
  activityDate: string; // The day date for calendar integration
  eventId?: string;
  isHighlighted?: boolean;
}

const getActivityColor = (type: ActivityType): string => {
  return activityTypes[type].color;
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, activityDate, eventId, isHighlighted = false }) => {
  const navigation = useNavigation();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const activityColor = getActivityColor(activity.type);

  // Find other activities at the same location
  const activitiesAtLocation = useMemo(() => {
    if (!eventId) return [];
    return getActivitiesAtLocation(activity, activityDate, eventId);
  }, [activity, activityDate, eventId]);

  const handleLocationPress = () => {
    if (activity.mapLocationId) {
      (navigation as any).navigate('Map', { locationId: activity.mapLocationId });
    }
  };

  const handleActivityPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowActionSheet(true);
  };

  const handleNavigateToMap = () => {
    setShowActionSheet(false);
    if (activity.mapLocationId) {
      (navigation as any).navigate('Map', { locationId: activity.mapLocationId });
    }
  };

  const handleGetDirections = () => {
    setShowActionSheet(false);
    if (activity.mapLocationId) {
      const location = getLocationById(activity.mapLocationId);
      if (location) {
        const { latitude, longitude } = location.coordinates;
        const encodedName = encodeURIComponent(location.name);

        // Use platform-specific URL scheme for native maps
        // Android: geo: URI with coordinates and label to ensure correct destination
        // iOS: Apple Maps URL with destination coordinates
        const url = Platform.select({
          ios: `maps://app?daddr=${latitude},${longitude}`,
          android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedName})`,
          default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        });

        Linking.canOpenURL(url).then(supported => {
          if (supported) {
            Linking.openURL(url);
          } else {
            // Fallback to Google Maps web URL with exact coordinates
            const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            Linking.openURL(fallbackUrl);
          }
        }).catch(() => {
          Alert.alert('Error', 'Unable to open maps app');
        });
      }
    }
  };

  const handleViewDetails = () => {
    setShowActionSheet(false);
    setShowDetailModal(true);
  };

  const handleShowRelated = () => {
    setShowActionSheet(false);
    setShowRelatedModal(true);
  };

  const handleRelatedActivityPress = (relatedActivity: ActivityWithContext) => {
    setShowRelatedModal(false);
    // Navigate to the day containing this activity
    (navigation as any).navigate('Schedule', {
      date: relatedActivity.date,
      eventId: relatedActivity.activity,
    });
  };

  const handleContact = () => {
    setShowActionSheet(false);
    // TODO: Contact organizer
  };

  // Event detail modal handlers
  const handleDetailModalNavigateToMap = () => {
    setShowDetailModal(false);
    if (activity.mapLocationId) {
      (navigation as any).navigate('Map', { locationId: activity.mapLocationId });
    }
  };

  const handleDetailModalGetDirections = () => {
    setShowDetailModal(false);
    if (activity.mapLocationId) {
      const location = getLocationById(activity.mapLocationId);
      if (location) {
        const { latitude, longitude } = location.coordinates;
        const encodedName = encodeURIComponent(location.name);

        const url = Platform.select({
          ios: `maps://app?daddr=${latitude},${longitude}`,
          android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedName})`,
          default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        });

        Linking.canOpenURL(url).then(supported => {
          if (supported) {
            Linking.openURL(url);
          } else {
            const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            Linking.openURL(fallbackUrl);
          }
        }).catch(() => {
          Alert.alert('Error', 'Unable to open maps app');
        });
      }
    }
  };

  const handleDetailModalShowRelated = () => {
    setShowDetailModal(false);
    setShowRelatedModal(true);
  };

  const handleDetailModalContact = () => {
    setShowDetailModal(false);
    // TODO: Contact organizer
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          { borderLeftColor: activityColor },
          isHighlighted && styles.highlightedContainer,
        ]}
        onPress={handleActivityPress}
        activeOpacity={0.7}
      >
        <View style={styles.contentSection}>
          {/* Title Row with Time */}
          <View style={styles.titleRow}>
            <IOSText textStyle="callout" weight="semibold" style={styles.timeText}>
              {activity.time}
            </IOSText>
            <IOSText textStyle="body" weight="semibold" style={styles.activityTitle} numberOfLines={2}>
              {activity.activity}
            </IOSText>
          </View>

          {/* Description */}
          {activity.detail && (
            <IOSText textStyle="caption" style={styles.activityDetail} numberOfLines={2}>
              {activity.detail}
            </IOSText>
          )}

          {/* Location Row */}
          {activity.mapLocationId ? (
            <TouchableOpacity
              style={styles.locationRow}
              onPress={handleLocationPress}
              activeOpacity={0.7}
            >
              <MapPin size={12} color={colors.primary} strokeWidth={2} />
              <IOSText textStyle="caption" color="link" style={[styles.locationText, styles.locationLink]}>
                {activity.location}
              </IOSText>
              <ChevronRight size={12} color={colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <View style={styles.locationRow}>
              <MapPin size={12} color={colors.textMuted} strokeWidth={2} />
              <IOSText textStyle="caption" color="secondaryLabel" style={styles.locationText}>
                {activity.location}
              </IOSText>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <EventActionSheet
        activity={activity}
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onGetDirections={handleGetDirections}
        onNavigateToMap={handleNavigateToMap}
        onViewDetails={handleViewDetails}
        onShowRelated={handleShowRelated}
        onContact={activity.contactPerson ? handleContact : undefined}
        activitiesAtLocationCount={activitiesAtLocation.length}
      />

      <EventDetailModal
        activity={activity}
        activityDate={activityDate}
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onGetDirections={handleDetailModalGetDirections}
        onNavigateToMap={handleDetailModalNavigateToMap}
        onShowRelated={handleDetailModalShowRelated}
        onContact={activity.contactPerson ? handleDetailModalContact : undefined}
        activitiesAtLocationCount={activitiesAtLocation.length}
      />

      <RelatedActivitiesModal
        visible={showRelatedModal}
        onClose={() => setShowRelatedModal(false)}
        activities={activitiesAtLocation}
        onActivityPress={handleRelatedActivityPress}
        currentActivityName={activity.location}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary, // Default, overridden by inline style
    padding: 12,
    marginBottom: 8,
  },
  highlightedContainer: {
    backgroundColor: colors.primary + '15',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  contentSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  timeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    minWidth: 75,
  },
  activityTitle: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
    flexShrink: 1,
  },
  activityDetail: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    marginLeft: 75 + spacing.md, // Align with title (time width + gap)
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginLeft: 75 + spacing.md, // Align with title
  },
  locationText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  locationLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});