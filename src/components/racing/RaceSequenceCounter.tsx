import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated,
  Vibration 
} from 'react-native';
import { 
  Flag, 
  AlertTriangle,
  Volume2,
  VolumeX,
  Play,
  Pause
} from 'lucide-react-native';

import { IOSText, IOSCard, IOSButton, IOSBadge } from '../ios';

interface RaceSequence {
  phase: 'warning' | 'preparatory' | 'one_minute' | 'start';
  timeRemaining: number; // seconds
  signals: {
    type: 'sound' | 'flag' | 'both';
    description: string;
    color?: string;
  }[];
  nextPhase?: string;
}

interface RaceSequenceCounterProps {
  sequence: RaceSequence;
  isActive?: boolean;
  onSequenceComplete?: () => void;
  soundEnabled?: boolean;
  onSoundToggle?: (enabled: boolean) => void;
}

const SEQUENCE_PHASES = {
  warning: {
    title: 'Warning Signal',
    color: '#007AFF',
    description: 'Class flag up',
    timeFromStart: 300 // 5 minutes
  },
  preparatory: {
    title: 'Preparatory Signal',
    color: '#FF9500',
    description: 'P flag up',
    timeFromStart: 240 // 4 minutes
  },
  one_minute: {
    title: 'One Minute Rule',
    color: '#FF3B30',
    description: 'P flag down',
    timeFromStart: 60 // 1 minute
  },
  start: {
    title: 'Starting Signal',
    color: '#34C759',
    description: 'Class flag down',
    timeFromStart: 0
  }
};

export const RaceSequenceCounter: React.FC<RaceSequenceCounterProps> = ({
  sequence,
  isActive = true,
  onSequenceComplete,
  soundEnabled = true,
  onSoundToggle,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(sequence.timeRemaining);
  const [currentPhase, setCurrentPhase] = useState(sequence.phase);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  // Update countdown timer
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        
        // Trigger animations and alerts at specific intervals
        if (newTime <= 10 && newTime > 0) {
          // Pulse animation for final 10 seconds
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();

          // Vibrate on final 10 seconds
          if (soundEnabled) {
            Vibration.vibrate(100);
          }
        }

        if (newTime === 0) {
          // Sequence phase completed
          if (soundEnabled) {
            Vibration.vibrate([0, 200, 100, 200]); // Double vibration
          }
          
          // Scale animation for phase completion
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();

          if (currentPhase === 'start') {
            onSequenceComplete?.();
          }
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, soundEnabled, pulseAnim, scaleAnim, currentPhase, onSequenceComplete]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get phase configuration
  const phaseConfig = SEQUENCE_PHASES[currentPhase];

  // Calculate progress percentage
  const totalPhaseTime = phaseConfig.timeFromStart;
  const progress = totalPhaseTime > 0 ? 
    ((totalPhaseTime - timeRemaining) / totalPhaseTime) * 100 : 100;

  return (
    <IOSCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Flag size={20} color={phaseConfig.color} />
          <IOSText style={styles.title}>Starting Sequence</IOSText>
        </View>
        
        <View style={styles.controls}>
          <IOSButton
            title=""
            onPress={() => onSoundToggle?.(!soundEnabled)}
            variant="secondary"
            size="small"
            icon={soundEnabled ? <Volume2 size={16} color="#007AFF" /> : <VolumeX size={16} color="#8E8E93" />}
            style={styles.controlButton}
          />
        </View>
      </View>

      {/* Current Phase */}
      <View style={styles.phaseSection}>
        <IOSBadge color={phaseConfig.color} size="large">
          {phaseConfig.title}
        </IOSBadge>
        <IOSText style={styles.phaseDescription}>
          {phaseConfig.description}
        </IOSText>
      </View>

      {/* Countdown Display */}
      <Animated.View 
        style={[
          styles.countdownSection,
          { 
            transform: [
              { scale: pulseAnim },
              { scale: scaleAnim }
            ] 
          }
        ]}
      >
        <IOSText style={[
          styles.countdownTime,
          { color: phaseConfig.color },
          timeRemaining <= 10 && styles.urgentTime
        ]}>
          {formatTime(timeRemaining)}
        </IOSText>
        
        <IOSText style={styles.countdownLabel}>
          {timeRemaining === 0 ? 'GO!' : 'until next signal'}
        </IOSText>
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <View style={[
            styles.progressFill, 
            { 
              width: `${progress}%`,
              backgroundColor: phaseConfig.color 
            }
          ]} />
        </View>
        <IOSText style={styles.progressText}>
          {Math.round(progress)}% complete
        </IOSText>
      </View>

      {/* Signals */}
      {sequence.signals.length > 0 && (
        <View style={styles.signalsSection}>
          <IOSText style={styles.signalsTitle}>Current Signals:</IOSText>
          {sequence.signals.map((signal, index) => (
            <View key={index} style={styles.signalItem}>
              <View style={[
                styles.signalIndicator,
                { backgroundColor: signal.color || phaseConfig.color }
              ]} />
              <IOSText style={styles.signalText}>{signal.description}</IOSText>
              <IOSBadge color="#8E8E93" size="small">
                {signal.type.toUpperCase()}
              </IOSBadge>
            </View>
          ))}
        </View>
      )}

      {/* Next Phase Preview */}
      {sequence.nextPhase && timeRemaining > 0 && (
        <View style={styles.nextPhaseSection}>
          <IOSText style={styles.nextPhaseLabel}>Next:</IOSText>
          <IOSText style={styles.nextPhaseText}>{sequence.nextPhase}</IOSText>
        </View>
      )}

      {/* Warning Messages */}
      {timeRemaining <= 30 && timeRemaining > 0 && (
        <View style={styles.warningSection}>
          <AlertTriangle size={16} color="#FF3B30" />
          <IOSText style={styles.warningText}>
            {timeRemaining <= 10 ? 'FINAL COUNTDOWN' : 'PREPARE TO START'}
          </IOSText>
        </View>
      )}

      {/* Sequence Complete */}
      {timeRemaining === 0 && currentPhase === 'start' && (
        <View style={styles.completeSection}>
          <IOSText style={styles.completeText}>🏁 RACE STARTED!</IOSText>
          <IOSText style={styles.completeSubtext}>
            Good luck to all competitors
          </IOSText>
        </View>
      )}
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 16,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  controls: {
    flexDirection: 'row',
  },
  controlButton: {
    paddingHorizontal: 12,
  },

  // Phase
  phaseSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  phaseDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },

  // Countdown
  countdownSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownTime: {
    fontSize: 48,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  urgentTime: {
    color: '#FF3B30',
  },
  countdownLabel: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Progress
  progressSection: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Signals
  signalsSection: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  signalsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
  },
  signalIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  signalText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },

  // Next Phase
  nextPhaseSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 16,
  },
  nextPhaseLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  nextPhaseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  // Warning
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9500',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },

  // Complete
  completeSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  completeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 8,
  },
  completeSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});