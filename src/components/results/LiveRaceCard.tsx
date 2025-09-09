import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Play, 
  Pause, 
  Wind, 
  Clock, 
  MapPin, 
  Trophy,
  TrendingUp,
  Users
} from 'lucide-react-native';

import { IOSText } from '../ui/IOSText';
import { IOSCard } from '../ui/IOSCard';
import { IOSButton } from '../ui/IOSButton';
import { IOSBadge } from '../ui/IOSBadge';
import type { LiveRaceData } from '../../services/resultsService';

interface LiveRaceCardProps {
  liveData: LiveRaceData;
  onViewDetails: () => void;
  onViewMap: () => void;
}

export const LiveRaceCard: React.FC<LiveRaceCardProps> = ({
  liveData,
  onViewDetails,
  onViewMap,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (liveData.status === 'racing' && liveData.estimatedFinishTime) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const finish = new Date(liveData.estimatedFinishTime!).getTime();
        const remaining = Math.max(0, finish - now);
        
        if (remaining > 0) {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeRemaining('Finished');
        }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [liveData.estimatedFinishTime]);

  const getStatusBadge = () => {
    switch (liveData.status) {
      case 'sequence':
        return <IOSBadge color="#FF9500">Starting Sequence</IOSBadge>;
      case 'racing':
        return <IOSBadge color="#FF3B30">LIVE</IOSBadge>;
      case 'finished':
        return <IOSBadge color="#34C759">Finished</IOSBadge>;
      case 'postponed':
        return <IOSBadge color="#8E8E93">Postponed</IOSBadge>;
      case 'abandoned':
        return <IOSBadge color="#8E8E93">Abandoned</IOSBadge>;
      default:
        return <IOSBadge color="#007AFF">Scheduled</IOSBadge>;
    }
  };

  const formatElapsedTime = () => {
    if (!liveData.startTime) return null;
    
    const started = new Date(liveData.startTime).getTime();
    const now = new Date().getTime();
    const elapsed = now - started;
    
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const leaderProgress = liveData.leaders.length > 0 ? liveData.leaders[0] : null;

  return (
    <IOSCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <IOSText style={styles.raceTitle}>
            Race {liveData.raceNumber}
          </IOSText>
          {getStatusBadge()}
        </View>
        
        <IOSText style={styles.courseInfo}>
          {liveData.course.name} • {liveData.course.distance} nm
        </IOSText>
      </View>

      {/* Race Progress */}
      {liveData.status === 'racing' && (
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Clock size={16} color="#8E8E93" />
              <IOSText style={styles.progressLabel}>Elapsed</IOSText>
              <IOSText style={styles.progressValue}>{formatElapsedTime()}</IOSText>
            </View>
            
            <View style={styles.progressItem}>
              <Trophy size={16} color="#8E8E93" />
              <IOSText style={styles.progressLabel}>Leader</IOSText>
              <IOSText style={styles.progressValue}>
                {leaderProgress ? leaderProgress.sailNumber : '—'}
              </IOSText>
            </View>
            
            <View style={styles.progressItem}>
              <Users size={16} color="#8E8E93" />
              <IOSText style={styles.progressLabel}>Fleet</IOSText>
              <IOSText style={styles.progressValue}>{liveData.fleet.length}</IOSText>
            </View>
          </View>

          {timeRemaining && (
            <View style={styles.estimatedFinish}>
              <IOSText style={styles.finishLabel}>Est. finish in:</IOSText>
              <IOSText style={styles.finishTime}>{timeRemaining}</IOSText>
            </View>
          )}
        </View>
      )}

      {/* Weather Conditions */}
      <View style={styles.weatherSection}>
        <View style={styles.weatherRow}>
          <Wind size={16} color="#007AFF" />
          <IOSText style={styles.weatherText}>
            {liveData.weather.windSpeed} kt
          </IOSText>
          <IOSText style={styles.weatherDetail}>
            @ {liveData.weather.windDirection}°
          </IOSText>
          {liveData.weather.gustSpeed && (
            <IOSText style={styles.gustText}>
              G{liveData.weather.gustSpeed}
            </IOSText>
          )}
        </View>
        
        {liveData.weather.waveHeight && (
          <IOSText style={styles.waveText}>
            Wave: {liveData.weather.waveHeight}m
          </IOSText>
        )}
      </View>

      {/* Current Leaders (Racing) */}
      {liveData.status === 'racing' && liveData.leaders.length > 0 && (
        <View style={styles.leadersSection}>
          <IOSText style={styles.leadersTitle}>Current Leaders</IOSText>
          <View style={styles.leadersList}>
            {liveData.leaders.slice(0, 3).map((result, index) => (
              <View key={result.id} style={styles.leaderRow}>
                <IOSText style={styles.leaderPosition}>{index + 1}</IOSText>
                <IOSText style={styles.leaderSail}>{result.sailNumber}</IOSText>
                <IOSText style={styles.leaderName}>{result.helmName}</IOSText>
                <IOSText style={styles.leaderCountry}>{result.country}</IOSText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Sequence Phase (Starting) */}
      {liveData.status === 'sequence' && liveData.sequencePhase && (
        <View style={styles.sequenceSection}>
          <View style={styles.sequenceHeader}>
            <IOSText style={styles.sequencePhase}>
              {liveData.sequencePhase.phase.toUpperCase()}
            </IOSText>
            <IOSText style={styles.sequenceTime}>
              T-{Math.max(0, Math.floor(liveData.sequencePhase.timeRemaining / 60))}:
              {String(liveData.sequencePhase.timeRemaining % 60).padStart(2, '0')}
            </IOSText>
          </View>
          
          {liveData.sequencePhase.signals.length > 0 && (
            <IOSText style={styles.sequenceSignal}>
              {liveData.sequencePhase.signals[0].description}
            </IOSText>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <IOSButton
          title="Live Results"
          onPress={onViewDetails}
          variant="primary"
          size="small"
          style={styles.actionButton}
          icon={<TrendingUp size={16} color="#FFFFFF" />}
        />
        <IOSButton
          title="Race Map"
          onPress={onViewMap}
          variant="secondary"
          size="small"
          style={styles.actionButton}
          icon={<MapPin size={16} color="#007AFF" />}
        />
      </View>

      {/* Last Update */}
      <View style={styles.footer}>
        <IOSText style={styles.lastUpdate}>
          Updated: {new Date(liveData.lastUpdate).toLocaleTimeString()}
        </IOSText>
      </View>
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  raceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  courseInfo: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Progress Section
  progressSection: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
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
    fontWeight: '600',
    color: '#1C1C1E',
  },
  estimatedFinish: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  finishLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginRight: 8,
  },
  finishTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Weather Section
  weatherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
    marginBottom: 16,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  weatherDetail: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
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
  },

  // Leaders Section
  leadersSection: {
    marginBottom: 16,
  },
  leadersTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  leadersList: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 8,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  leaderPosition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    width: 24,
  },
  leaderSail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 64,
  },
  leaderName: {
    fontSize: 14,
    color: '#3C3C43',
    flex: 1,
  },
  leaderCountry: {
    fontSize: 12,
    color: '#8E8E93',
    width: 32,
  },

  // Sequence Section
  sequenceSection: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  sequenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sequencePhase: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  sequenceTime: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF9500',
  },
  sequenceSignal: {
    fontSize: 14,
    color: '#8E4A00',
    textAlign: 'center',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#8E8E93',
  },
});