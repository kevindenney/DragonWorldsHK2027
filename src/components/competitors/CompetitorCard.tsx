import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  User, 
  Users, 
  MapPin, 
  Trophy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Anchor
} from 'lucide-react-native';

import { IOSText, IOSBadge } from '../ios';
import type { Competitor } from '../../types/noticeBoard';

interface CompetitorCardProps {
  competitor: Competitor;
  onPress?: () => void;
  showCurrentPosition?: boolean;
  currentPosition?: number;
  isHighlighted?: boolean;
  compact?: boolean;
}

const getCountryFlag = (countryCode: string): string => {
  const flagEmojis: { [key: string]: string } = {
    'HKG': '🇭🇰', 'AUS': '🇦🇺', 'GBR': '🇬🇧', 'USA': '🇺🇸',
    'NZL': '🇳🇿', 'SIN': '🇸🇬', 'JPN': '🇯🇵', 'FRA': '🇫🇷',
    'ITA': '🇮🇹', 'GER': '🇩🇪', 'ESP': '🇪🇸', 'NED': '🇳🇱',
    'DEN': '🇩🇰', 'SWE': '🇸🇪', 'NOR': '🇳🇴', 'BRA': '🇧🇷',
    'CAN': '🇨🇦', 'MEX': '🇲🇽', 'ARG': '🇦🇷', 'CHI': '🇨🇱'
  };
  return flagEmojis[countryCode] || '🏁';
};

const getRegistrationStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <IOSBadge color="#34C759" size="small">Confirmed</IOSBadge>;
    case 'pending':
      return <IOSBadge color="#FF9500" size="small">Pending</IOSBadge>;
    case 'paid':
      return <IOSBadge color="#007AFF" size="small">Paid</IOSBadge>;
    case 'incomplete':
      return <IOSBadge color="#FF3B30" size="small">Incomplete</IOSBadge>;
    default:
      return <IOSBadge color="#8E8E93" size="small">Unknown</IOSBadge>;
  }
};

const getPaymentStatusIcon = (status: string) => {
  switch (status) {
    case 'paid':
      return <CheckCircle size={14} color="#34C759" />;
    case 'pending':
      return <Clock size={14} color="#FF9500" />;
    case 'overdue':
      return <AlertCircle size={14} color="#FF3B30" />;
    default:
      return null;
  }
};

export const CompetitorCard: React.FC<CompetitorCardProps> = ({
  competitor,
  onPress,
  showCurrentPosition = false,
  currentPosition,
  isHighlighted = false,
  compact = false,
}) => {
  const cardContent = (
    <View style={[
      compact ? styles.compactCard : styles.card,
      isHighlighted && styles.highlightedCard
    ]}>
      {/* Main Info Row */}
      <View style={styles.mainRow}>
        {/* Sail Number & Country */}
        <View style={styles.sailNumberSection}>
          <View style={styles.sailNumberRow}>
            <IOSText style={[styles.sailNumber, isHighlighted && styles.highlightedText]}>
              {competitor.sailNumber}
            </IOSText>
            {showCurrentPosition && currentPosition && (
              <IOSBadge 
                color={currentPosition <= 3 ? "#FFD700" : "#007AFF"} 
                size="small"
                textColor={currentPosition <= 3 ? "#000000" : "#FFFFFF"}
              >
                P{currentPosition}
              </IOSBadge>
            )}
          </View>
          <View style={styles.countryRow}>
            <IOSText style={styles.countryFlag}>
              {getCountryFlag(competitor.country)}
            </IOSText>
            <IOSText style={styles.countryCode}>{competitor.country}</IOSText>
          </View>
        </View>

        {/* Competitor Details */}
        <View style={styles.detailsSection}>
          <IOSText 
            style={[styles.helmName, isHighlighted && styles.highlightedText]} 
            numberOfLines={1}
          >
            {competitor.helmName}
          </IOSText>
          
          {!compact && competitor.crewNames.length > 0 && (
            <View style={styles.crewRow}>
              <Users size={12} color="#8E8E93" />
              <IOSText style={styles.crewText} numberOfLines={1}>
                {competitor.crewNames.join(', ')}
              </IOSText>
            </View>
          )}
          
          <View style={styles.clubRow}>
            <Anchor size={12} color="#8E8E93" />
            <IOSText style={styles.clubText} numberOfLines={1}>
              {competitor.club}
            </IOSText>
          </View>
        </View>

        {/* Status Indicators */}
        <View style={styles.statusSection}>
          {getRegistrationStatusBadge(competitor.registrationStatus)}
          
          {!compact && (
            <View style={styles.statusIcons}>
              <View style={styles.statusIcon}>
                {getPaymentStatusIcon(competitor.paymentStatus)}
              </View>
              
              {competitor.documentsSubmitted && (
                <View style={styles.statusIcon}>
                  <CheckCircle size={14} color="#34C759" />
                </View>
              )}
              
              {competitor.measurementCompleted && (
                <View style={styles.statusIcon}>
                  <Trophy size={14} color="#007AFF" />
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Secondary Info Row (Full cards only) */}
      {!compact && (
        <View style={styles.secondaryRow}>
          <View style={styles.secondaryInfo}>
            <IOSText style={styles.entryDateLabel}>Entered:</IOSText>
            <IOSText style={styles.entryDate}>
              {new Date(competitor.entryDate).toLocaleDateString()}
            </IOSText>
          </View>
          
          {competitor.specialRequirements && competitor.specialRequirements.length > 0 && (
            <View style={styles.specialRequirements}>
              <IOSText style={styles.requirementsLabel}>Requirements:</IOSText>
              <IOSText style={styles.requirementsText} numberOfLines={1}>
                {competitor.specialRequirements.join(', ')}
              </IOSText>
            </View>
          )}
        </View>
      )}

      {/* Action Indicators */}
      {onPress && (
        <View style={styles.actionIndicator}>
          <IOSText style={styles.actionText}>Tap for details</IOSText>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.touchableContainer}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  touchableContainer: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  highlightedCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F0F8FF',
  },

  // Main Row
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  // Sail Number Section
  sailNumberSection: {
    width: 80,
    alignItems: 'center',
  },
  sailNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sailNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 4,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  countryCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },

  // Details Section
  detailsSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  helmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  crewText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 6,
    flex: 1,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 6,
    flex: 1,
  },

  // Status Section
  statusSection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  statusIcons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusIcon: {
    marginLeft: 6,
  },

  // Secondary Row
  secondaryRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  secondaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  entryDateLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 4,
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3C3C43',
  },
  specialRequirements: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementsLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 4,
  },
  requirementsText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
    flex: 1,
  },

  // Action Indicator
  actionIndicator: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  actionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },

  // Highlighting
  highlightedText: {
    color: '#007AFF',
    fontWeight: '700',
  },
});