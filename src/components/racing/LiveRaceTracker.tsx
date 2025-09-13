import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Alert,
  Animated,
  TouchableOpacity
} from 'react-native';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Wind, 
  Clock, 
  MapPin, 
  Trophy,
  TrendingUp,
  Users,
  Flag,
  Activity,
  Maximize2,
  Settings,
  Bell,
  BellOff,
  Wifi,
  WifiOff
} from 'lucide-react-native';

import { IOSText, IOSCard, IOSButton, IOSBadge, IOSSegmentedControl } from '../ios';
import type { LiveRaceData, LiveRacePosition } from '../../services/resultsService';

interface LiveRaceTrackerProps {
  raceData: LiveRaceData;
  onRefresh?: () => Promise<void>;
  onViewMap?: () => void;
  onViewFullResults?: () => void;
  onCompetitorPress?: (sailNumber: string) => void;
  isConnected?: boolean;
  autoRefresh?: boolean;
  onAutoRefreshToggle?: (enabled: boolean) => void;
}

type ViewMode = 'leaders' | 'fleet' | 'progress';

export const LiveRaceTracker: React.FC<LiveRaceTrackerProps> = ({
  raceData,
  onRefresh,
  onViewMap,
  onViewFullResults,
  onCompetitorPress,
  isConnected = true,
  autoRefresh = true,
  onAutoRefreshToggle,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('leaders');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  // Animation values for position changes
  const [fadeAnim] = useState(new Animated.Value(1));

  // Real-time timer for elapsed time
  const [elapsedTime, setElapsedTime] = useState('');
  const [timeToFinish, setTimeToFinish] = useState('');

  useEffect(() => {
    if (raceData.status === 'racing' && raceData.startTime) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const start = new Date(raceData.startTime!).getTime();
        const elapsed = now - start;
        
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        if (hours > 0) {
          setElapsedTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }

        // Calculate estimated finish time
        if (raceData.estimatedFinishTime) {
          const finish = new Date(raceData.estimatedFinishTime).getTime();
          const remaining = Math.max(0, finish - now);
          
          if (remaining > 0) {
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            setTimeToFinish(`${mins}:${secs.toString().padStart(2, '0')}`);
          } else {
            setTimeToFinish('Finished');
          }
        }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [raceData.startTime, raceData.estimatedFinishTime, raceData.status]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && raceData.status === 'racing') {
      const interval = setInterval(async () => {
        if (onRefresh) {
          await onRefresh();
          setLastUpdateTime(new Date());
          
          // Animate update
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0.5,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }, 30000); // Refresh every 30 seconds during racing

      return () => clearInterval(interval);
    }
  }, [autoRefresh, raceData.status, onRefresh, fadeAnim]);

  const handleManualRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        setLastUpdateTime(new Date());
      } catch (error) {
        Alert.alert('Update Failed', 'Could not refresh race data. Please try again.');
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh]);

  const getStatusColor = () => {
    switch (raceData.status) {
      case 'sequence': return '#FF9500';
      case 'racing': return '#FF3B30';
      case 'finished': return '#34C759';
      case 'postponed': return '#8E8E93';
      case 'abandoned': return '#8E8E93';
      default: return '#007AFF';
    }
  };

  const getStatusText = () => {
    switch (raceData.status) {
      case 'sequence': return 'Starting Sequence';
      case 'racing': return 'RACING';
      case 'finished': return 'Finished';
      case 'postponed': return 'Postponed';
      case 'abandoned': return 'Abandoned';
      default: return 'Scheduled';
    }
  };

  const renderRaceHeader = () => (
    <IOSCard style={styles.headerCard}>
      {/* Race Title & Status */}
      <View style={styles.titleRow}>
        <View style={styles.titleSection}>
          <IOSText style={styles.raceTitle}>Race {raceData.raceNumber}</IOSText>
          <IOSText style={styles.courseInfo}>
            {raceData.course.name} • {raceData.course.distance} nm
          </IOSText>
        </View>
        
        <View style={styles.statusSection}>
          <IOSBadge color={getStatusColor()}>
            {getStatusText()}
          </IOSBadge>
          <View style={styles.connectionStatus}>
            {isConnected ? (
              <Wifi size={16} color="#34C759" />
            ) : (
              <WifiOff size={16} color="#FF3B30" />
            )}
          </View>
        </View>
      </View>

      {/* Race Progress */}
      {raceData.status === 'racing' && (
        <View style={styles.progressSection}>
          <View style={styles.progressGrid}>
            <View style={styles.progressItem}>
              <Clock size={16} color="#8E8E93" />
              <IOSText style={styles.progressLabel}>Elapsed</IOSText>
              <IOSText style={styles.progressValue}>{elapsedTime}</IOSText>
            </View>
            
            <View style={styles.progressItem}>
              <Trophy size={16} color="#FFD700" />
              <IOSText style={styles.progressLabel}>Leader</IOSText>
              <IOSText style={styles.progressValue}>
                {raceData.leaders.length > 0 ? raceData.leaders[0].sailNumber : '—'}
              </IOSText>
            </View>
            
            <View style={styles.progressItem}>
              <Users size={16} color="#8E8E93" />
              <IOSText style={styles.progressLabel}>Fleet</IOSText>
              <IOSText style={styles.progressValue}>{raceData.fleet.length}</IOSText>
            </View>
            
            <View style={styles.progressItem}>
              <Flag size={16} color="#007AFF" />
              <IOSText style={styles.progressLabel}>Est. Finish</IOSText>
              <IOSText style={styles.progressValue}>{timeToFinish}</IOSText>
            </View>
          </View>
        </View>
      )}

      {/* Starting Sequence */}
      {raceData.status === 'sequence' && raceData.sequencePhase && (
        <View style={styles.sequenceSection}>
          <View style={styles.sequenceHeader}>
            <IOSText style={styles.sequencePhase}>
              {raceData.sequencePhase.phase.toUpperCase()}
            </IOSText>
            <IOSText style={styles.sequenceTime}>
              T-{Math.floor(raceData.sequencePhase.timeRemaining / 60)}:
              {String(raceData.sequencePhase.timeRemaining % 60).padStart(2, '0')}
            </IOSText>
          </View>
          
          {raceData.sequencePhase.signals.length > 0 && (
            <IOSText style={styles.sequenceSignal}>
              {raceData.sequencePhase.signals[0].description}
            </IOSText>
          )}
        </View>
      )}

      {/* Weather Conditions */}
      <View style={styles.weatherSection}>
        <Wind size={16} color="#007AFF" />
        <IOSText style={styles.weatherText}>
          {raceData.weather.windSpeed} kt @ {raceData.weather.windDirection}°
        </IOSText>
        {raceData.weather.gustSpeed && (
          <IOSText style={styles.gustText}>
            G{raceData.weather.gustSpeed}
          </IOSText>
        )}
        {raceData.weather.waveHeight && (
          <IOSText style={styles.waveText}>
            Wave: {raceData.weather.waveHeight}m
          </IOSText>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsSection}>
        <View style={styles.controlsRow}>
          <IOSButton
            title="Refresh"
            onPress={handleManualRefresh}
            variant="secondary"
            size="small"
            icon={<RotateCcw size={16} color="#007AFF" />}
            style={styles.controlButton}
            disabled={isRefreshing}
          />
          
          <IOSButton
            title={autoRefresh ? "Auto" : "Manual"}
            onPress={() => onAutoRefreshToggle?.(!autoRefresh)}
            variant={autoRefresh ? "primary" : "secondary"}
            size="small"
            icon={autoRefresh ? <Play size={16} color="#FFFFFF" /> : <Pause size={16} color="#007AFF" />}
            style={styles.controlButton}
          />
          
          <IOSButton
            title=""
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            variant="secondary"
            size="small"
            icon={notificationsEnabled ? <Bell size={16} color="#007AFF" /> : <BellOff size={16} color="#8E8E93" />}
            style={styles.iconButton}
          />
          
          <IOSButton
            title="Map"
            onPress={onViewMap}
            variant="secondary"
            size="small"
            icon={<MapPin size={16} color="#007AFF" />}
            style={styles.controlButton}
          />
        </View>
        
        <IOSText style={styles.lastUpdate}>
          Last updated: {lastUpdateTime.toLocaleTimeString()}
        </IOSText>
      </View>
    </IOSCard>
  );

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSection}>
      <IOSSegmentedControl
        values={['Leaders', 'Fleet', 'Progress']}
        selectedIndex={viewMode === 'leaders' ? 0 : viewMode === 'fleet' ? 1 : 2}
        onChange={(index) => setViewMode(index === 0 ? 'leaders' : index === 1 ? 'fleet' : 'progress')}
        style={styles.segmentedControl}
      />
    </View>
  );

  const renderLeadersView = () => (
    <Animated.View style={[styles.dataSection, { opacity: fadeAnim }]}>
      <IOSCard style={styles.leadersCard}>
        <View style={styles.sectionHeader}>
          <Trophy size={20} color="#FFD700" />
          <IOSText style={styles.sectionTitle}>Current Leaders</IOSText>
          <IOSText style={styles.sectionSubtitle}>Top 10</IOSText>
        </View>
        
        <View style={styles.leadersTable}>
          <View style={styles.tableHeader}>
            <IOSText style={styles.headerCell}>Pos</IOSText>
            <IOSText style={styles.headerCell}>Sail</IOSText>
            <IOSText style={styles.headerCell}>Helm</IOSText>
            <IOSText style={styles.headerCell}>Progress</IOSText>
            <IOSText style={styles.headerCell}>Gap</IOSText>
          </View>
          
          {raceData.leaders.slice(0, 10).map((position, index) => (
            <TouchableOpacity
              key={position.sailNumber}
              style={[
                styles.leaderRow,
                index < 3 && styles.podiumRow
              ]}
              onPress={() => onCompetitorPress?.(position.sailNumber)}
            >
              <View style={styles.positionCell}>
                <IOSText style={[
                  styles.positionNumber,
                  index === 0 && styles.firstPlace,
                  index === 1 && styles.secondPlace,
                  index === 2 && styles.thirdPlace
                ]}>
                  {index + 1}
                </IOSText>
              </View>
              
              <IOSText style={styles.sailCell}>{position.sailNumber}</IOSText>
              <IOSText style={styles.helmCell} numberOfLines={1}>{position.helmName}</IOSText>
              
              <View style={styles.progressCell}>
                <View style={[styles.progressBar, { width: `${position.courseProgress || 0}%` }]} />
                <IOSText style={styles.progressText}>
                  {Math.round(position.courseProgress || 0)}%
                </IOSText>
              </View>
              
              <IOSText style={styles.gapCell}>
                {index === 0 ? '—' : position.gapToLeader || '—'}
              </IOSText>
            </TouchableOpacity>
          ))}
        </View>
        
        <IOSButton
          title="View Full Results"
          onPress={onViewFullResults}
          variant="primary"
          size="medium"
          style={styles.fullResultsButton}
          icon={<TrendingUp size={16} color="#FFFFFF" />}
        />
      </IOSCard>
    </Animated.View>
  );

  const renderFleetView = () => (
    <Animated.View style={[styles.dataSection, { opacity: fadeAnim }]}>
      <IOSCard style={styles.fleetCard}>
        <View style={styles.sectionHeader}>
          <Users size={20} color="#007AFF" />
          <IOSText style={styles.sectionTitle}>Fleet Status</IOSText>
          <IOSText style={styles.sectionSubtitle}>{raceData.fleet.length} boats</IOSText>
        </View>
        
        <View style={styles.fleetStats}>
          <View style={styles.fleetStatItem}>
            <IOSText style={styles.fleetStatNumber}>
              {raceData.fleet.filter(b => b.status === 'racing').length}
            </IOSText>
            <IOSText style={styles.fleetStatLabel}>Racing</IOSText>
          </View>
          
          <View style={styles.fleetStatItem}>
            <IOSText style={styles.fleetStatNumber}>
              {raceData.fleet.filter(b => b.status === 'finished').length}
            </IOSText>
            <IOSText style={styles.fleetStatLabel}>Finished</IOSText>
          </View>
          
          <View style={styles.fleetStatItem}>
            <IOSText style={styles.fleetStatNumber}>
              {raceData.fleet.filter(b => b.status && ['dnf', 'ret', 'dsq'].includes(b.status)).length}
            </IOSText>
            <IOSText style={styles.fleetStatLabel}>Retired</IOSText>
          </View>
        </View>
        
        <ScrollView style={styles.fleetList} showsVerticalScrollIndicator={false}>
          {raceData.fleet.map((boat) => (
            <TouchableOpacity
              key={boat.sailNumber}
              style={styles.fleetItem}
              onPress={() => onCompetitorPress?.(boat.sailNumber)}
            >
              <IOSText style={styles.fleetSail}>{boat.sailNumber}</IOSText>
              <IOSText style={styles.fleetHelm} numberOfLines={1}>{boat.helmName}</IOSText>
              <IOSBadge 
                color={boat.status === 'racing' ? '#34C759' : boat.status === 'finished' ? '#007AFF' : '#FF3B30'}
                size="small"
              >
                {boat.status?.toUpperCase() || 'UNKNOWN'}
              </IOSBadge>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </IOSCard>
    </Animated.View>
  );

  const renderProgressView = () => (
    <Animated.View style={[styles.dataSection, { opacity: fadeAnim }]}>
      <IOSCard style={styles.progressCard}>
        <View style={styles.sectionHeader}>
          <Activity size={20} color="#FF9500" />
          <IOSText style={styles.sectionTitle}>Race Progress</IOSText>
          <IOSText style={styles.sectionSubtitle}>Course completion</IOSText>
        </View>
        
        <View style={styles.courseProgress}>
          <View style={styles.courseSection}>
            <IOSText style={styles.courseSectionTitle}>Start Line</IOSText>
            <View style={styles.courseMarker}>
              <Flag size={16} color="#34C759" />
              <IOSText style={styles.courseMarkerText}>All boats started</IOSText>
            </View>
          </View>
          
          <View style={styles.courseSection}>
            <IOSText style={styles.courseSectionTitle}>Windward Mark</IOSText>
            <View style={styles.courseMarker}>
              <IOSText style={styles.courseMarkerNumber}>
                {raceData.fleet.filter(b => (b.courseProgress || 0) > 25).length}
              </IOSText>
              <IOSText style={styles.courseMarkerText}>boats rounded</IOSText>
            </View>
          </View>
          
          <View style={styles.courseSection}>
            <IOSText style={styles.courseSectionTitle}>Leeward Mark</IOSText>
            <View style={styles.courseMarker}>
              <IOSText style={styles.courseMarkerNumber}>
                {raceData.fleet.filter(b => (b.courseProgress || 0) > 75).length}
              </IOSText>
              <IOSText style={styles.courseMarkerText}>boats rounded</IOSText>
            </View>
          </View>
          
          <View style={styles.courseSection}>
            <IOSText style={styles.courseSectionTitle}>Finish Line</IOSText>
            <View style={styles.courseMarker}>
              <Trophy size={16} color="#FFD700" />
              <IOSText style={styles.courseMarkerText}>
                {raceData.fleet.filter(b => b.status === 'finished').length} finished
              </IOSText>
            </View>
          </View>
        </View>
      </IOSCard>
    </Animated.View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleManualRefresh}
          tintColor="#007AFF"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {renderRaceHeader()}
      {renderViewModeSelector()}
      
      {viewMode === 'leaders' && renderLeadersView()}
      {viewMode === 'fleet' && renderFleetView()}
      {viewMode === 'progress' && renderProgressView()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // Header
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  raceTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  courseInfo: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  connectionStatus: {
    marginTop: 8,
  },

  // Progress
  progressSection: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    marginBottom: 2,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },

  // Sequence
  sequenceSection: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  sequenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sequencePhase: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9500',
  },
  sequenceTime: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF9500',
  },
  sequenceSignal: {
    fontSize: 14,
    color: '#8E4A00',
    textAlign: 'center',
  },

  // Weather
  weatherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    marginBottom: 16,
  },
  weatherText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  gustText: {
    fontSize: 14,
    color: '#FF9500',
    marginLeft: 8,
    fontWeight: '500',
  },
  waveText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 12,
  },

  // Controls
  controlsSection: {
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  iconButton: {
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // View Mode
  viewModeSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  segmentedControl: {
    width: '100%',
  },

  // Data Section
  dataSection: {
    margin: 16,
    marginTop: 8,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Leaders View
  leadersCard: {
    padding: 16,
  },
  leadersTable: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  podiumRow: {
    backgroundColor: '#FFF9E6',
    borderRadius: 6,
    marginVertical: 1,
    borderBottomWidth: 0,
  },
  positionCell: {
    width: 30,
    alignItems: 'center',
  },
  positionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  firstPlace: {
    color: '#FFD700',
  },
  secondPlace: {
    color: '#C0C0C0',
  },
  thirdPlace: {
    color: '#CD7F32',
  },
  sailCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  helmCell: {
    flex: 2,
    fontSize: 14,
    color: '#1C1C1E',
    paddingHorizontal: 8,
  },
  progressCell: {
    flex: 1,
    position: 'relative',
    height: 20,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1C1C1E',
    zIndex: 1,
  },
  gapCell: {
    flex: 1,
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  fullResultsButton: {
    marginTop: 8,
  },

  // Fleet View
  fleetCard: {
    padding: 16,
  },
  fleetStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  fleetStatItem: {
    alignItems: 'center',
  },
  fleetStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  fleetStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  fleetList: {
    maxHeight: 300,
  },
  fleetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  fleetSail: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  fleetHelm: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    marginRight: 8,
  },

  // Progress View
  progressCard: {
    padding: 16,
  },
  courseProgress: {
    gap: 16,
  },
  courseSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  courseSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  courseMarker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseMarkerNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 8,
  },
  courseMarkerText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});