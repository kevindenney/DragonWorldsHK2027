import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { colors, spacing } from '../../constants/theme';
import type { Activity, ActivityType } from '../../data/scheduleData';
import { activityTypes } from '../../data/scheduleData';
import { EventActionSheet } from './EventActionSheet';
import { EventDetailModal } from './EventDetailModal';
import { getLocationById } from '../../data/sailingLocations';

export interface ActivityItemProps {
  activity: Activity;
  activityDate: string; // The day date for calendar integration
}

const getActivityColor = (type: ActivityType): string => {
  return activityTypes[type].color;
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, activityDate }) => {
  const navigation = useNavigation();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const activityColor = getActivityColor(activity.type);

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
        const url = Platform.select({
          ios: `maps://app?daddr=${latitude},${longitude}&q=${encodedName}`,
          android: `google.navigation:q=${latitude},${longitude}`,
          default: `https://maps.google.com/maps?daddr=${latitude},${longitude}&q=${encodedName}`,
        });
        
        Linking.canOpenURL(url).then(supported => {
          if (supported) {
            Linking.openURL(url);
          } else {
            // Fallback to Google Maps web URL
            const fallbackUrl = `https://maps.google.com/maps?daddr=${latitude},${longitude}&q=${encodedName}`;
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
    // TODO: Show related activities
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
          ios: `maps://app?daddr=${latitude},${longitude}&q=${encodedName}`,
          android: `google.navigation:q=${latitude},${longitude}`,
          default: `https://maps.google.com/maps?daddr=${latitude},${longitude}&q=${encodedName}`,
        });
        
        Linking.canOpenURL(url).then(supported => {
          if (supported) {
            Linking.openURL(url);
          } else {
            const fallbackUrl = `https://maps.google.com/maps?daddr=${latitude},${longitude}&q=${encodedName}`;
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
    // TODO: Show related activities
  };

  const handleDetailModalContact = () => {
    setShowDetailModal(false);
    // TODO: Contact organizer
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { borderLeftColor: activityColor }]}
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
    minWidth: 60,
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
    marginLeft: 60 + spacing.md, // Align with title (time width + gap)
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginLeft: 60 + spacing.md, // Align with title
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