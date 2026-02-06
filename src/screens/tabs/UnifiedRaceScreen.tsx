import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, SlideInRight } from '../../utils/reanimatedWrapper';
import { 
  Megaphone, 
  Flag, 
  Trophy, 
  RefreshCw, 
  Calendar, 
  Waves,
  MapPin,
  Clock,
  Users,
  ChevronDown,
  WifiOff,
  User,
  Anchor,
  UserCheck,
  Scale,
  AlertTriangle,
  Coffee,
  Utensils,
  Activity,
  Wind,
  Navigation,
  Play,
  ExternalLink,
  FileText
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../constants/theme';
// Direct imports used instead of barrel exports due to Hermes engine incompatibility
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { SkeletonLoader } from '../../components/shared/SkeletonLoader';
import { SimpleError } from '../../components/shared/SimpleError';
import { OfflineError } from '../../components/shared/OfflineError';
import { haptics } from '../../utils/haptics';
import { offlineManager } from '../../services/offlineManager';
import { useSelectedEvent, useSetSelectedEvent } from '../../stores/eventStore';
import { EVENTS } from '../../constants/events';
import { FloatingEventSwitch } from '../../components/navigation/FloatingEventSwitch';
import {
  IOSNavigationBar,
  IOSCard,
  IOSSection,
  IOSButton,
  IOSText,
  IOSBadge
} from '../../components/ios';
import { useUserType } from '../../stores/userStore';
import type { UserType } from '../../types';

// Unified interfaces for Race Screen
interface RaceEvent {
  id: string;
  type: 'racing' | 'social' | 'meeting' | 'practice' | 'registration' | 'measurement' | 'protest-hearing';
  time: string;
  title: string;
  location: string;
  status?: 'upcoming' | 'in-progress' | 'weather-hold' | 'completed' | 'cancelled';
  details: string[];
  icon: any;
  actionButton?: {
    title: string;
    onPress: () => void;
  };
}

interface LiveRaceStatus {
  raceNumber: number;
  raceName: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'postponed' | 'abandoned';
  startTime?: string;
  elapsedTime?: string;
  estimatedFinish?: string;
  location: string;
  reason?: string;
}

interface LiveContext {
  eventName: string;
  eventType: 'asia-cup' | 'dragon-worlds';
  status: 'race-day' | 'social-time' | 'rest-day';
  currentTime: string;
}

interface NoticeItem {
  id: string;
  title: string;
  type: 'notice' | 'amendment' | 'result' | 'protest';
  postedTime: string;
  urgent: boolean;
}

export function UnifiedRaceScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const selectedEvent = useSelectedEvent();
  const setSelectedEvent = useSetSelectedEvent();
  const userType = useUserType();

  // Live context state
  const [liveContext, setLiveContext] = useState<LiveContext>({
    eventName: '2027 Dragon World Championship',
    eventType: 'dragon-worlds',
    status: 'race-day',
    currentTime: new Date().toLocaleTimeString()
  });

  // Live race status state
  const [currentRace, setCurrentRace] = useState<LiveRaceStatus>({
    raceNumber: 3,
    raceName: 'Gold Fleet Race 3',
    status: 'in-progress',
    startTime: '14:00',
    elapsedTime: '1:23:45',
    location: 'Hong Kong Racing Area',
  });

  // Notice board state
  const [notices, setNotices] = useState<NoticeItem[]>([
    {
      id: '1',
      title: 'Weather Update - Winds 15-20 knots',
      type: 'notice',
      postedTime: '2 hours ago',
      urgent: true
    },
    {
      id: '2', 
      title: 'Race Committee Instructions',
      type: 'amendment',
      postedTime: '4 hours ago',
      urgent: false
    }
  ]);

  // Race events state (merged from ScheduleScreen)
  const [raceEvents] = useState<RaceEvent[]>([
    {
      id: '1',
      type: 'racing',
      time: '14:00',
      title: 'Gold Fleet Race 3',
      location: 'Hong Kong Racing Area',
      status: 'in-progress',
      details: ['Wind: 15-20 knots', 'Course: Windward-Leeward', 'Estimated finish: 15:30'],
      icon: Flag,
    },
    {
      id: '2', 
      type: 'racing',
      time: '15:45',
      title: 'Gold Fleet Race 4',
      location: 'Hong Kong Racing Area', 
      status: 'upcoming',
      details: ['Subject to completion of Race 3', 'Wind forecast: 12-18 knots'],
      icon: Flag,
    },
    {
      id: '3',
      type: 'social',
      time: '19:00',
      title: 'Welcome Reception',
      location: 'Royal Hong Kong Yacht Club',
      status: 'upcoming',
      details: ['Cocktails & networking', 'Dress code: Smart casual', 'Sponsored by HSBC'],
      icon: Users,
    }
  ]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await haptics.impact();
      
      // Refresh logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderLiveStatus = () => {
    if (liveContext.status !== 'race-day') return null;

    return (
      <Animated.View entering={FadeInDown.duration(600).delay(200)}>
        <IOSCard style={styles.liveCard}>
          <View style={styles.liveHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <IOSText textStyle="caption1" color="secondaryLabel">LIVE</IOSText>
            </View>
            <IOSBadge
              text={currentRace.status.toUpperCase()}
              variant="filled"
              color={currentRace.status === 'in-progress' ? 'systemOrange' : 'systemGray'}
            />
          </View>
          
          <IOSText textStyle="title2" style={styles.raceTitle}>
            {currentRace.raceName}
          </IOSText>
          
          <View style={styles.raceDetails}>
            <View style={styles.raceDetailItem}>
              <Clock size={16} color={colors.textSecondary} />
              <IOSText textStyle="body" color="secondaryLabel">
                {currentRace.elapsedTime || currentRace.startTime}
              </IOSText>
            </View>
            <View style={styles.raceDetailItem}>
              <MapPin size={16} color={colors.textSecondary} />
              <IOSText textStyle="body" color="secondaryLabel">
                {currentRace.location}
              </IOSText>
            </View>
          </View>
        </IOSCard>
      </Animated.View>
    );
  };

  const renderNoticeBoard = () => (
    <Animated.View entering={FadeInDown.duration(600).delay(400)}>
      <IOSSection title="Notice Board">
        {notices.map((notice, index) => (
          <IOSCard key={notice.id} style={[styles.noticeCard, notice.urgent && styles.urgentNotice]}>
            <View style={styles.noticeHeader}>
              <IOSText textStyle="headline" style={styles.noticeTitle}>
                {notice.title}
              </IOSText>
              {notice.urgent && (
                <IOSBadge text="URGENT" variant="filled" color="systemRed" />
              )}
            </View>
            <View style={styles.noticeFooter}>
              <IOSText textStyle="caption1" color="secondaryLabel">
                {notice.type.toUpperCase()} • {notice.postedTime}
              </IOSText>
              <ExternalLink size={16} color={colors.primary} />
            </View>
          </IOSCard>
        ))}
        <IOSButton 
          title="View All Notices"
          variant="secondary"
          style={styles.viewAllButton}
          onPress={() => {}}
        />
      </IOSSection>
    </Animated.View>
  );

  const renderEventHeader = () => {
    return (
      <View style={styles.eventHeaderContainer}>
        <IOSText textStyle="title1" style={styles.screenTitle}>Race Day</IOSText>
        <FloatingEventSwitch
          options={[
            { label: 'APAC 2026', shortLabel: 'APAC 2026', value: EVENTS.APAC_2026.id },
            { label: 'Worlds 2027', shortLabel: 'Worlds 2027', value: EVENTS.WORLDS_2027.id }
          ]}
          selectedValue={selectedEvent}
          onValueChange={setSelectedEvent}
        />
      </View>
    );
  };

  const renderRaceEvents = () => (
    <Animated.View entering={SlideInRight.duration(600).delay(600)}>
      <IOSSection title="Race Schedule">
        {raceEvents.map((event, index) => (
          <IOSCard key={event.id} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <View style={styles.eventTime}>
                <IOSText textStyle="title3">{event.time}</IOSText>
                {event.status && (
                  <IOSBadge
                    text={event.status.toUpperCase()}
                    variant="filled"
                    color={
                      event.status === 'in-progress' ? 'systemOrange' :
                      event.status === 'completed' ? 'systemGreen' :
                      event.status === 'weather-hold' ? 'systemRed' : 'systemGray'
                    }
                  />
                )}
              </View>
              <event.icon size={24} color={colors.primary} />
            </View>

            <IOSText textStyle="headline" style={styles.eventTitle}>
              {event.title}
            </IOSText>

            <View style={styles.eventLocation}>
              <MapPin size={16} color={colors.textSecondary} />
              <IOSText textStyle="body" color="secondaryLabel">
                {event.location}
              </IOSText>
            </View>

            <View style={styles.eventDetails}>
              {event.details.map((detail, idx) => (
                <IOSText key={idx} textStyle="caption1" color="secondaryLabel">
                  • {detail}
                </IOSText>
              ))}
            </View>
            
            {event.actionButton && (
              <IOSButton
                title={event.actionButton.title}
                variant="secondary"
                size="small"
                style={styles.eventAction}
                onPress={event.actionButton.onPress}
              />
            )}
          </IOSCard>
        ))}
      </IOSSection>
    </Animated.View>
  );

  if (isOffline) {
    return <OfflineError onRetry={onRefresh} />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          title="Race"
          style="large"
          rightActions={[
            {
              icon: <RefreshCw size={20} color={colors.primary} />,
              onPress: onRefresh,
              testID: "refresh-button"
            }
          ]}
        />
        
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderEventHeader()}
          {renderLiveStatus()}
          {renderNoticeBoard()}
          {renderRaceEvents()}
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  liveCard: {
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  raceTitle: {
    marginBottom: spacing.sm,
  },
  raceDetails: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  raceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  noticeCard: {
    marginBottom: spacing.sm,
  },
  urgentNotice: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  noticeTitle: {
    flex: 1,
    marginRight: spacing.sm,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllButton: {
    marginTop: spacing.sm,
  },
  eventCard: {
    marginBottom: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventTime: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  eventTitle: {
    marginBottom: spacing.xs,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  eventDetails: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  eventAction: {
    alignSelf: 'flex-start',
  },
  eventHeaderContainer: {
    paddingVertical: spacing.md,
  },
  screenTitle: {
    fontWeight: '700',
  },
});