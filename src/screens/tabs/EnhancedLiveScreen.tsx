import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Activity, 
  Clock, 
  Trophy, 
  AlertTriangle, 
  Wind, 
  MapPin,
  Users,
  Calendar,
  Navigation,
  CreditCard,
  Building,
  Car,
  ChevronRight,
  Play,
  ExternalLink
} from 'lucide-react-native';
import type { LiveScreenProps } from '../../types/navigation';
import { colors } from '../../constants/theme';
import {
  IOSCard,
  IOSText,
  IOSButton,
  IOSBadge,
  IOSSection
} from '../../components/ios';
import { useUserType } from '../../stores/userStore';
import type { UserType } from '../../types';

// Enhanced interfaces for Live Screen
interface LiveContext {
  eventName: string;
  eventType: 'asia-pacific' | 'world-championship';
  status: 'race-day' | 'social-time' | 'rest-day';
  currentTime: string;
}

interface LiveRaceStatus {
  raceNumber: number;
  raceName: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'postponed' | 'abandoned';
  startTime?: string;
  elapsedTime?: string;
  estimatedFinish?: string;
  location: string;
  reason?: string; // For postponed/abandoned races
}

interface WeatherAlert {
  id: string;
  severity: 'warning' | 'advisory' | 'watch';
  title: string;
  message: string;
  timestamp: string;
  expectedTime?: string;
}

interface QuickWeatherData {
  windSpeed: number;
  windDirection: string;
  windTrend: 'increasing' | 'decreasing' | 'steady';
  waveHeight: number;
  tideStatus: 'rising' | 'falling';
  temperature: number;
  conditions: string;
  raceConditions: 'excellent' | 'good' | 'challenging' | 'poor';
}

interface UpcomingEvent {
  id: string;
  title: string;
  time: string;
  location: string;
  sponsor?: 'sino' | 'hsbc' | 'bmw';
  category: 'racing' | 'social' | 'ceremony' | 'briefing';
}

interface ChampionshipUpdate {
  position: number;
  sailNumber: string;
  skipper: string;
  country: string;
  points: number;
  change: number;
}

interface SponsorAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  sponsor: 'hsbc' | 'sino' | 'bmw' | 'garmin';
  action: () => void;
}

export const EnhancedLiveScreen: React.FC<LiveScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [liveContext, setLiveContext] = useState<LiveContext>(mockLiveContext);
  const [raceStatus, setRaceStatus] = useState<LiveRaceStatus>(mockRaceStatus);
  const [weatherAlert, setWeatherAlert] = useState<WeatherAlert | null>(mockWeatherAlert);
  const [quickWeather, setQuickWeather] = useState<QuickWeatherData>(mockQuickWeather);
  const [upcomingEvent, setUpcomingEvent] = useState<UpcomingEvent>(mockUpcomingEvent);
  const [championshipUpdate, setChampionshipUpdate] = useState<ChampionshipUpdate[]>(mockStandings);
  
  const userType = useUserType();

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const renderEventContext = () => (
    <IOSCard style={styles.contextCard}>
      <View style={styles.contextHeader}>
        <IOSText style={styles.contextTitle}>Dragon World Championships</IOSText>
        <View style={styles.eventToggle}>
          <IOSBadge 
            text="Asia Pacific" 
            variant={liveContext.eventType === 'asia-pacific' ? 'primary' : 'secondary'}
            size="small"
          />
          <IOSBadge 
            text="World Champ" 
            variant={liveContext.eventType === 'world-championship' ? 'primary' : 'secondary'} 
            size="small"
          />
        </View>
      </View>
      
      {liveContext.eventType === 'world-championship' && (
        <IOSText style={styles.contextSubtitle}>
          Day 4 of 9 | 47 boats | 12 countries
        </IOSText>
      )}
    </IOSCard>
  );

  const renderRaceStatus = () => {
    const isRaceDay = liveContext.status === 'race-day';
    
    return (
      <IOSSection title={isRaceDay ? "RIGHT NOW" : "RACE DAY COMPLETE"}>
        <IOSCard style={styles.raceStatusCard}>
          <View style={styles.raceHeader}>
            <View style={styles.raceInfo}>
              {raceStatus.status === 'in-progress' && (
                <>
                  <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                  <IOSText style={styles.raceTitle}>🏁 {raceStatus.raceName} - In Progress</IOSText>
                </>
              )}
              {raceStatus.status === 'completed' && (
                <>
                  <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                  <IOSText style={styles.raceTitle}>✅ {raceStatus.raceName} - Completed</IOSText>
                </>
              )}
              {raceStatus.status === 'abandoned' && (
                <>
                  <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
                  <IOSText style={styles.raceTitle}>❌ {raceStatus.raceName} - Abandoned</IOSText>
                </>
              )}
            </View>
          </View>
          
          <View style={styles.raceDetails}>
            {raceStatus.status === 'in-progress' && (
              <>
                <IOSText style={styles.raceDetail}>Started: {raceStatus.startTime} ({raceStatus.elapsedTime} ago)</IOSText>
                <IOSText style={styles.raceDetail}>📍 {raceStatus.location}</IOSText>
                <IOSText style={styles.raceDetail}>⏱️ Est. Finish: {raceStatus.estimatedFinish}</IOSText>
              </>
            )}
            {raceStatus.status === 'completed' && (
              <>
                <IOSText style={styles.raceDetail}>Winner: HKG 59 (Van Olphen)</IOSText>
                <IOSText style={styles.raceDetail}>Duration: 2h 34m</IOSText>
              </>
            )}
            {raceStatus.status === 'abandoned' && (
              <>
                <IOSText style={styles.raceDetail}>Reason: {raceStatus.reason}</IOSText>
                <IOSText style={styles.raceDetail}>Rescheduled: Tomorrow 10:00</IOSText>
              </>
            )}
          </View>
          
          <IOSButton
            title={raceStatus.status === 'in-progress' ? "Watch Live" : "View Results"}
            variant="primary"
            size="small"
            onPress={() => {
              if (raceStatus.status === 'in-progress') {
                navigation.navigate('Map');
              } else {
                navigation.navigate('Services'); // Results tab
              }
            }}
            style={styles.raceButton}
          />
        </IOSCard>
      </IOSSection>
    );
  };

  const renderWeatherAlert = () => {
    if (!weatherAlert) return null;
    
    return (
      <IOSSection title="URGENT NOTICES">
        <IOSCard style={[styles.alertCard, { borderLeftColor: colors.warning }]}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color={colors.warning} />
            <IOSText style={styles.alertTitle}>{weatherAlert.title}</IOSText>
            <IOSText style={styles.alertTime}>({weatherAlert.expectedTime})</IOSText>
          </View>
          <IOSText style={styles.alertMessage}>{weatherAlert.message}</IOSText>
          <IOSButton
            title="View Details"
            variant="ghost"
            size="small"
            onPress={() => navigation.navigate('Weather')}
            style={styles.alertButton}
          />
        </IOSCard>
      </IOSSection>
    );
  };

  const renderQuickWeather = () => (
    <IOSSection title="QUICK WEATHER">
      <IOSCard style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <Wind size={20} color={colors.primary} />
          <IOSText style={styles.weatherTitle}>
            💨 Wind: {quickWeather.windSpeed}kts {quickWeather.windDirection} ({quickWeather.windTrend})
          </IOSText>
        </View>
        
        <IOSText style={styles.weatherDetail}>
          🌊 Wave: {quickWeather.waveHeight}m | Tide: {quickWeather.tideStatus}
        </IOSText>
        <IOSText style={styles.weatherDetail}>
          ☁️ {quickWeather.conditions}, {quickWeather.temperature}°C
        </IOSText>
        
        <View style={styles.weatherFooter}>
          <IOSBadge 
            text={`Racing: ${quickWeather.raceConditions}`} 
            variant={quickWeather.raceConditions === 'excellent' ? 'success' : 'secondary'}
          />
          <IOSButton
            title="Full Forecast"
            variant="ghost"
            size="small"
            onPress={() => navigation.navigate('Weather')}
            icon={ChevronRight}
          />
        </View>
        
        <IOSText style={styles.weatherAttribution}>Marine Weather</IOSText>
      </IOSCard>
    </IOSSection>
  );

  const renderUpcomingEvent = () => (
    <IOSSection title={liveContext.status === 'race-day' ? "NEXT UP" : "HAPPENING NOW"}>
      <IOSCard style={styles.upcomingCard}>
        <View style={styles.eventHeader}>
          <Calendar size={20} color={colors.primary} />
          <IOSText style={styles.eventTitle}>{upcomingEvent.title}</IOSText>
        </View>
        
        <IOSText style={styles.eventTime}>
          {liveContext.status === 'social-time' ? `Started: ${upcomingEvent.time} (30 min ago)` : `Today ${upcomingEvent.time}`}
        </IOSText>
        <IOSText style={styles.eventLocation}>📍 {upcomingEvent.location}</IOSText>
        
        {upcomingEvent.sponsor === 'sino' && (
          <IOSText style={styles.eventSponsor}>🏨 Sino Group Venue</IOSText>
        )}
        
        <IOSButton
          title={liveContext.status === 'social-time' ? "Join Celebration" : "Get Ready"}
          variant="primary"
          size="small"
          onPress={() => navigation.navigate('Schedule')}
          style={styles.eventButton}
        />
      </IOSCard>
    </IOSSection>
  );

  const renderChampionshipUpdate = () => {
    if (liveContext.status === 'race-day') return null;
    
    return (
      <IOSSection title="CHAMPIONSHIP UPDATE">
        <IOSCard style={styles.standingsCard}>
          <IOSText style={styles.standingsTitle}>🏆 Standings after Race 3</IOSText>
          
          {championshipUpdate.slice(0, 3).map((standing, index) => (
            <View key={standing.sailNumber} style={styles.standingRow}>
              <IOSText style={styles.standingPosition}>{standing.position}</IOSText>
              <IOSText style={styles.standingSail}>{standing.sailNumber}</IOSText>
              <IOSText style={styles.standingChange}>
                ({standing.change > 0 ? '+' : ''}{standing.change})
              </IOSText>
              <IOSText style={styles.standingPoints}>{standing.points} pts</IOSText>
            </View>
          ))}
          
          <IOSText style={styles.racesRemaining}>🎯 2 races remaining</IOSText>
          
          <IOSButton
            title="Full Standings"
            variant="ghost"
            size="small"
            onPress={() => navigation.navigate('Services')}
            icon={ChevronRight}
            style={styles.standingsButton}
          />
        </IOSCard>
      </IOSSection>
    );
  };

  const renderSponsorActions = () => (
    <IOSSection title="QUICK ACTIONS">
      <View style={styles.sponsorGrid}>
        <IOSCard style={styles.sponsorAction} onPress={() => navigation.navigate('Map')}>
          <MapPin size={16} color={colors.primary} />
          <IOSText style={styles.sponsorActionText}>📍 Directions</IOSText>
        </IOSCard>
        
        <IOSCard style={styles.sponsorAction} onPress={() => navigation.navigate('Social')}>
          <Users size={16} color={colors.primary} />
          <IOSText style={styles.sponsorActionText}>💬 Race Chat</IOSText>
        </IOSCard>
        
        <IOSCard style={styles.sponsorAction} onPress={() => {}}>
          <CreditCard size={16} color={colors.primary} />
          <IOSText style={styles.sponsorActionText}>🏦 HSBC ATM</IOSText>
        </IOSCard>
        
        <IOSCard style={styles.sponsorAction} onPress={() => {}}>
          <Building size={16} color={colors.primary} />
          <IOSText style={styles.sponsorActionText}>🏨 Concierge</IOSText>
        </IOSCard>
      </View>
    </IOSSection>
  );

  const renderSocialTime = () => {
    if (liveContext.status !== 'social-time') return null;
    
    return (
      <IOSSection title="TONIGHT'S SOCIAL">
        <IOSCard style={styles.socialCard}>
          <IOSText style={styles.socialTitle}>🎵 Live jazz at Conrad Lobby</IOSText>
          <IOSText style={styles.socialTitle}>🍸 VIP afterparty (22:00)</IOSText>
          <IOSText style={styles.socialTitle}>💬 Active: 89 people in chat</IOSText>
          
          <IOSButton
            title="Join the Fun"
            variant="primary"
            onPress={() => navigation.navigate('Social')}
            style={styles.socialButton}
          />
        </IOSCard>
      </IOSSection>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IOSText style={styles.headerTitle}>Live Status</IOSText>
        <View style={styles.headerLogo}>
          <IOSText style={styles.logoText}>[Dragon Logo]</IOSText>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderEventContext()}
        {renderRaceStatus()}
        {renderWeatherAlert()}
        {renderQuickWeather()}
        {renderUpcomingEvent()}
        {renderChampionshipUpdate()}
        {renderSponsorActions()}
        {renderSocialTime()}
      </ScrollView>
    </SafeAreaView>
  );
};

// Mock data based on your screen designs
const mockLiveContext: LiveContext = {
  eventName: 'Dragon World Championships',
  eventType: 'world-championship',
  status: 'race-day',
  currentTime: new Date().toISOString()
};

const mockRaceStatus: LiveRaceStatus = {
  raceNumber: 3,
  raceName: 'Race 3',
  status: 'in-progress',
  startTime: '11:00',
  elapsedTime: '45 min',
  estimatedFinish: '13:30',
  location: 'Racing Area'
};

const mockWeatherAlert: WeatherAlert = {
  id: 'alert-1',
  severity: 'warning',
  title: '🚨 Weather Advisory',
  message: 'Strong winds expected Race 4 may be postponed',
  timestamp: new Date().toISOString(),
  expectedTime: '14:30'
};

const mockQuickWeather: QuickWeatherData = {
  windSpeed: 15,
  windDirection: 'NE',
  windTrend: 'increasing',
  waveHeight: 0.8,
  tideStatus: 'rising',
  temperature: 22,
  conditions: 'Partly cloudy',
  raceConditions: 'excellent'
};

const mockUpcomingEvent: UpcomingEvent = {
  id: 'event-1',
  title: '🍽️ Prize Giving Dinner',
  time: '19:00',
  location: 'Conrad Hong Kong',
  sponsor: 'sino',
  category: 'social'
};

const mockStandings: ChampionshipUpdate[] = [
  { position: 1, sailNumber: 'HKG 59', skipper: 'Van Olphen', country: 'HK', points: 4, change: 1 },
  { position: 2, sailNumber: 'GBR 8', skipper: 'Wilson', country: 'GB', points: 7, change: -1 },
  { position: 3, sailNumber: 'AUS 12', skipper: 'Mitchell', country: 'AU', points: 9, change: 2 }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerLogo: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
  },
  logoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contextCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contextTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  eventToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  contextSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  raceStatusCard: {
    padding: 16,
  },
  raceHeader: {
    marginBottom: 12,
  },
  raceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  raceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  raceDetails: {
    marginBottom: 16,
  },
  raceDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  raceButton: {
    marginTop: 8,
  },
  alertCard: {
    padding: 16,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  alertTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  alertButton: {
    alignSelf: 'flex-start',
  },
  weatherCard: {
    padding: 16,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
  },
  weatherDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  weatherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  weatherAttribution: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  upcomingCard: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  eventTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  eventSponsor: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 12,
  },
  eventButton: {
    marginTop: 8,
  },
  standingsCard: {
    padding: 16,
  },
  standingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  standingPosition: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    width: 30,
  },
  standingSail: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  standingChange: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 8,
  },
  standingPoints: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  racesRemaining: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 8,
    marginBottom: 12,
  },
  standingsButton: {
    alignSelf: 'flex-start',
  },
  sponsorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sponsorAction: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    alignItems: 'center',
  },
  sponsorActionText: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  socialCard: {
    padding: 16,
  },
  socialTitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  socialButton: {
    marginTop: 12,
  },
});

export default EnhancedLiveScreen;