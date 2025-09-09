import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
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
  WifiOff
} from 'lucide-react-native';
import { colors, spacing } from '../../constants/theme';
import { ErrorBoundary, LoadingSpinner, SkeletonLoader, SimpleError, OfflineError } from '../../components/shared';
import { haptics } from '../../utils/haptics';
import { offlineManager } from '../../services/offlineManager';
import {
  IOSNavigationBar,
  IOSCard,
  IOSSection,
  IOSButton,
  IOSText,
  IOSBadge
} from '../../components/ios';
import type { ScheduleScreenProps } from '../../types/navigation';

// TypeScript interfaces
interface RaceEvent {
  id: string;
  type: 'racing' | 'social' | 'meeting';
  time: string;
  title: string;
  location: string;
  status?: 'upcoming' | 'in-progress' | 'weather-hold' | 'completed';
  details: string[];
  icon: any;
  actionButton?: {
    title: string;
    onPress: () => void;
  };
  sponsorAreas?: {
    titlePrefix?: string;
    locationSuffix?: string;
  };
}

interface EventSwitcherProps {
  selectedEvent: 'Asia Pacific' | 'World Championship';
  onEventChange: (event: 'Asia Pacific' | 'World Championship') => void;
  boatCount: number;
  countryCount: number;
}

interface DaySection {
  date: string;
  displayDate: string;
  events: RaceEvent[];
}

// Event Switcher Component
const EventSwitcher: React.FC<EventSwitcherProps> = ({
  selectedEvent,
  onEventChange,
  boatCount,
  countryCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpanded = useCallback(async () => {
    await haptics.buttonPress();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleEventChange = useCallback(async (event: 'Asia Pacific' | 'World Championship') => {
    await haptics.selection();
    onEventChange(event);
    setIsExpanded(false);
  }, [onEventChange]);

  return (
    <IOSCard variant="elevated">
      <IOSButton
        title={selectedEvent}
        variant="plain"
        onPress={handleToggleExpanded}
        style={styles.eventSwitcherButton}
        textStyle={styles.eventSwitcherText}
        accessibilityLabel={`Current event: ${selectedEvent}. Tap to change event.`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      />
      <View style={styles.eventSwitcherRow}>
        <IOSText 
          textStyle="caption1" 
          color="secondaryLabel"
          accessibilityLabel={`${boatCount} boats participating from ${countryCount} countries`}
        >
          {boatCount} boats | {countryCount} countries
        </IOSText>
        <ChevronDown 
          size={16} 
          color={colors.textSecondary}
          style={[styles.chevron, isExpanded && styles.chevronExpanded]} 
        />
      </View>
      
      {isExpanded && (
        <Animated.View 
          style={styles.eventDropdown}
          entering={FadeInDown.duration(200)}
        >
          <IOSButton
            title="Asia Pacific"
            variant="plain"
            onPress={() => handleEventChange('Asia Pacific')}
            style={styles.eventOption}
            accessibilityLabel="Switch to Asia Pacific event"
          />
          <IOSButton
            title="World Championship"
            variant="plain"
            onPress={() => handleEventChange('World Championship')}
            style={styles.eventOption}
            accessibilityLabel="Switch to World Championship event"
          />
        </Animated.View>
      )}
    </IOSCard>
  );
};

// Event Card Component
const EventCard: React.FC<{ event: RaceEvent }> = ({ event }) => {
  const getStatusBadgeProps = (status?: string) => {
    switch (status) {
      case 'in-progress':
        return { color: 'systemGreen' as const, variant: 'filled' as const };
      case 'weather-hold':
        return { color: 'systemOrange' as const, variant: 'filled' as const };
      case 'completed':
        return { color: 'systemGray' as const, variant: 'tinted' as const };
      default:
        return { color: 'systemBlue' as const, variant: 'tinted' as const };
    }
  };

  const statusProps = event.status ? getStatusBadgeProps(event.status) : null;

  return (
    <IOSCard variant="elevated" style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventTimeSection}>
          <event.icon size={20} color={colors.primary} />
          <IOSText textStyle="headline" weight="semibold" style={styles.eventTime}>
            {event.time}
          </IOSText>
        </View>
        
        {statusProps && (
          <IOSBadge {...statusProps} size="small">
            {event.status?.replace('-', ' ').toUpperCase()}
          </IOSBadge>
        )}
      </View>

      <View style={styles.eventContent}>
        <IOSText textStyle="title3" weight="semibold" style={styles.eventTitle}>
          {event.sponsorAreas?.titlePrefix && (
            <IOSText textStyle="caption1" color="systemBlue" weight="semibold">
              {event.sponsorAreas.titlePrefix}{' '}
            </IOSText>
          )}
          {event.title}
        </IOSText>
        
        <View style={styles.eventLocation}>
          <MapPin size={16} color={colors.textSecondary} />
          <IOSText textStyle="callout" color="secondaryLabel" style={styles.locationText}>
            {event.location}
            {event.sponsorAreas?.locationSuffix && (
              <IOSText textStyle="caption1" color="systemBlue">
                {' '}{event.sponsorAreas.locationSuffix}
              </IOSText>
            )}
          </IOSText>
        </View>

        <View style={styles.eventDetails}>
          {event.details.map((detail, index) => (
            <IOSText key={index} textStyle="footnote" color="tertiaryLabel">
              • {detail}
            </IOSText>
          ))}
        </View>

        {event.actionButton && (
          <IOSButton
            title={event.actionButton.title}
            variant="tinted"
            size="medium"
            onPress={event.actionButton.onPress}
            style={styles.actionButton}
          />
        )}
      </View>
    </IOSCard>
  );
};

export function ScheduleScreen({ navigation }: ScheduleScreenProps) {
  const [selectedEvent, setSelectedEvent] = useState<'Asia Pacific' | 'World Championship'>('World Championship');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<DaySection[]>([]);

  // Monitor offline status
  useEffect(() => {
    const unsubscribe = offlineManager.onStatusChange((status) => {
      setIsOffline(!status.isConnected);
    });
    
    return unsubscribe;
  }, []);

  // Load schedule data
  const loadScheduleData = useCallback(async (showLoader: boolean = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isOffline) {
        const cachedData = await offlineManager.getCriticalScheduleData();
        if (cachedData && !cachedData.isOfflineData) {
          setScheduleData(cachedData);
        } else {
          // Load mock data when offline
          const mockData = getMockScheduleData();
          setScheduleData(mockData);
        }
      } else {
        const mockData = getMockScheduleData();
        setScheduleData(mockData);
        // Cache the data for offline use
        await offlineManager.cacheData('critical_schedule', mockData, {
          priority: 'critical',
          expiresIn: 1440 // 24 hours
        });
      }
    } catch (err) {
      console.error('Failed to load schedule data:', err);
      setError('Failed to load schedule data');
      await haptics.errorAction();
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isOffline]);

  // Initial load
  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    await haptics.pullToRefresh();
    setRefreshing(true);
    await loadScheduleData(false);
  }, [loadScheduleData]);

  // Enhanced event change with haptics
  const handleEventChange = useCallback(async (event: 'Asia Pacific' | 'World Championship') => {
    await haptics.selection();
    setSelectedEvent(event);
  }, []);

  // Helper function to get mock data
  const getMockScheduleData = (): DaySection[] => [
    {
      date: 'today',
      displayDate: 'TODAY - FRIDAY, NOV 21',
      events: [
        {
          id: '1',
          type: 'meeting',
          time: '9:00',
          title: 'Skippers Meeting',
          location: 'RHKYC Race Room',
          details: ['Mandatory attendance', 'Race 3 & 4 briefing'],
          icon: Megaphone,
        },
        {
          id: '2',
          type: 'racing',
          time: '11:00',
          title: 'Race 3 - IN PROGRESS',
          location: 'Racing Area (8nm out)',
          status: 'in-progress',
          details: ['15kts NE, building', 'Est. finish: 13:30'],
          icon: Flag,
          actionButton: {
            title: 'Live Tracking',
            onPress: () => navigation.navigate('Live')
          }
        },
        {
          id: '3',
          type: 'racing',
          time: '15:00',
          title: 'Race 4 - WEATHER HOLD',
          location: 'Racing Area',
          status: 'weather-hold',
          details: ['Strong wind warning', 'Decision at 14:30'],
          icon: Flag,
          actionButton: {
            title: 'Weather Update',
            onPress: () => navigation.navigate('Weather')
          }
        },
        {
          id: '4',
          type: 'social',
          time: '19:00',
          title: 'Prize Giving Dinner',
          location: 'Conrad Hong Kong',
          details: ['Black tie optional', 'Live entertainment'],
          icon: Trophy,
          sponsorAreas: {
            titlePrefix: 'Rolex',
            locationSuffix: '- hospitality by HSBC'
          },
          actionButton: {
            title: 'RSVP Status',
            onPress: () => {}
          }
        }
      ]
    },
    {
      date: 'tomorrow',
      displayDate: 'TOMORROW - SATURDAY, NOV 22',
      events: [
        {
          id: '5',
          type: 'racing',
          time: '10:00',
          title: 'Race 5 - Final Race',
          location: 'Racing Area',
          details: ['Forecast: 12kts SW', 'Championship deciding'],
          icon: Flag,
        }
      ]
    }
  ];

  const handleRefresh = () => {
    // Refresh logic
  };

  const handleTodayPress = () => {
    // Navigate to today
  };

  const handleTidesPress = () => {
    // Show tides information
  };

  // Show loading screen on initial load
  if (isLoading && scheduleData.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          title="Racing Schedule"
          style="large"
          rightActions={[
            {
              icon: <Image 
                source={require('../../../assets/dragon-logo.png')} 
                style={styles.dragonLogo}
                resizeMode="contain"
              />,
              onPress: () => {}
            }
          ]}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner 
            size="large" 
            text="Loading schedule..." 
            showBackground={true}
            testID="schedule-loading"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && scheduleData.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <IOSNavigationBar
          title="Racing Schedule"
          style="large"
          rightActions={[
            {
              icon: <Image 
                source={require('../../../assets/dragon-logo.png')} 
                style={styles.dragonLogo}
                resizeMode="contain"
              />,
              onPress: () => {}
            }
          ]}
        />
        {isOffline ? (
          <OfflineError 
            onRetry={() => loadScheduleData()}
            testID="schedule-offline-error"
          />
        ) : (
          <SimpleError
            message={error}
            onRetry={() => loadScheduleData()}
            testID="schedule-error"
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Schedule screen error:', error, errorInfo);
        haptics.errorAction();
      }}
      testID="schedule-error-boundary"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with Dragon logo */}
        <IOSNavigationBar
          title="Racing Schedule"
          style="large"
          rightActions={[
            {
              icon: <Image 
                source={require('../../../assets/dragon-logo.png')} 
                style={styles.dragonLogo}
                resizeMode="contain"
              />,
              onPress: () => {}
            }
          ]}
        />

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
          accessible={true}
          accessibilityLabel="Racing schedule scroll view"
        >
          {/* Offline indicator */}
          {isOffline && (
            <Animated.View 
              style={styles.offlineIndicator}
              entering={SlideInRight.duration(300)}
            >
              <WifiOff color={colors.warning} size={16} />
              <IOSText textStyle="caption1" color="systemOrange">
                Offline - showing cached schedule
              </IOSText>
            </Animated.View>
          )}
          {/* Event Switcher Section */}
          <IOSSection spacing="regular">
            <EventSwitcher
              selectedEvent={selectedEvent}
              onEventChange={handleEventChange}
            boatCount={47}
            countryCount={12}
          />
        </IOSSection>

        {/* Controls Row */}
        <IOSSection spacing="compact">
          <View style={styles.controlsRow}>
            <IOSButton
              title="Refresh"
              variant="gray"
              size="medium"
              onPress={handleRefresh}
              style={styles.controlButton}
            />
            <IOSButton
              title="Today"
              variant="tinted"
              size="medium"
              onPress={handleTodayPress}
              style={styles.controlButton}
            />
            <IOSButton
              title="Tides"
              variant="gray"
              size="medium"
              onPress={handleTidesPress}
              style={styles.controlButton}
            />
          </View>
        </IOSSection>

        {/* Day Sections */}
        {scheduleData.map((daySection) => (
          <IOSSection 
            key={daySection.date}
            title={daySection.displayDate}
            spacing="regular"
          >
            <View style={styles.eventsContainer}>
              {daySection.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </View>
          </IOSSection>
        ))}
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning + '40',
    gap: 8,
  },

  // Header
  dragonLogo: {
    width: 32,
    height: 32,
  },

  // Event Switcher
  eventSwitcherButton: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  eventSwitcherText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'left',
  },
  eventSwitcherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 8,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  eventDropdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  eventOption: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },

  // Controls Row
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12, // 8pt grid system
  },
  controlButton: {
    flex: 1,
  },

  // Events
  eventsContainer: {
    gap: 16, // 8pt grid system
  },
  eventCard: {
    // Card styling handled by IOSCard component
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTime: {
    // Typography handled by IOSText
  },
  eventContent: {
    gap: 8, // 8pt grid system
  },
  eventTitle: {
    // Typography handled by IOSText
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    flex: 1,
  },
  eventDetails: {
    gap: 4, // 8pt grid system
    paddingLeft: 8,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
});