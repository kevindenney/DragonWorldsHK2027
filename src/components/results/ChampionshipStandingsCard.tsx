import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Medal,
  Target,
  Flag
} from 'lucide-react-native';

import { IOSText } from '../ui/IOSText';
import { IOSCard } from '../ui/IOSCard';
import { IOSButton } from '../ui/IOSButton';
import { IOSBadge } from '../ui/IOSBadge';
import type { ChampionshipStandings } from '../../services/resultsService';

interface ChampionshipStandingsCardProps {
  standings: ChampionshipStandings[];
  showAll?: boolean;
  onViewAll?: () => void;
  onViewSailor?: (sailNumber: string) => void;
  highlightSailNumber?: string;
}

const getCountryFlag = (countryCode: string): string => {
  const flagEmojis: { [key: string]: string } = {
    'HKG': '🇭🇰',
    'AUS': '🇦🇺', 
    'GBR': '🇬🇧',
    'USA': '🇺🇸',
    'NZL': '🇳🇿',
    'SIN': '🇸🇬',
    'JPN': '🇯🇵',
    'FRA': '🇫🇷',
    'ITA': '🇮🇹',
    'GER': '🇩🇪'
  };
  return flagEmojis[countryCode] || '🏁';
};

const getTrendIcon = (trend: 'up' | 'down' | 'same', change?: number) => {
  switch (trend) {
    case 'up':
      return <TrendingUp size={14} color="#34C759" />;
    case 'down':
      return <TrendingDown size={14} color="#FF3B30" />;
    default:
      return <Minus size={14} color="#8E8E93" />;
  }
};

const getPositionBadge = (position: number) => {
  if (position === 1) {
    return <IOSBadge color="#FFD700" textColor="#000000">1st</IOSBadge>;
  } else if (position === 2) {
    return <IOSBadge color="#C0C0C0" textColor="#000000">2nd</IOSBadge>;
  } else if (position === 3) {
    return <IOSBadge color="#CD7F32" textColor="#FFFFFF">3rd</IOSBadge>;
  } else if (position <= 10) {
    return <IOSBadge color="#007AFF">T{position}</IOSBadge>;
  }
  return null;
};

export const ChampionshipStandingsCard: React.FC<ChampionshipStandingsCardProps> = ({
  standings,
  showAll = false,
  onViewAll,
  onViewSailor,
  highlightSailNumber,
}) => {
  const displayStandings = showAll ? standings : standings.slice(0, 10);
  const totalCompetitors = standings.length;

  return (
    <IOSCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Trophy size={20} color="#FFD700" />
          <IOSText style={styles.title}>Championship Standings</IOSText>
        </View>
        <IOSText style={styles.subtitle}>
          {totalCompetitors} competitors • After {standings[0]?.racesCompleted || 0} races
        </IOSText>
      </View>

      {/* Standings Header */}
      <View style={styles.standingsHeader}>
        <IOSText style={[styles.headerText, styles.positionHeader]}>Pos</IOSText>
        <IOSText style={[styles.headerText, styles.sailHeader]}>Sail</IOSText>
        <IOSText style={[styles.headerText, styles.nameHeader]}>Helm</IOSText>
        <IOSText style={[styles.headerText, styles.pointsHeader]}>Net Pts</IOSText>
        <IOSText style={[styles.headerText, styles.trendHeader]}>Trend</IOSText>
      </View>

      {/* Standings List */}
      <ScrollView 
        style={styles.standingsList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {displayStandings.map((sailor, index) => {
          const isHighlighted = sailor.sailNumber === highlightSailNumber;
          const isQualifying = sailor.position <= Math.floor(totalCompetitors * 0.8); // Top 80% qualify
          
          return (
            <View
              key={sailor.sailNumber}
              style={[
                styles.standingRow,
                isHighlighted && styles.highlightedRow
              ]}
            >
              <View style={styles.positionCell}>
                <IOSText style={[styles.position, isHighlighted && styles.highlightedText]}>
                  {sailor.position}
                </IOSText>
                {getPositionBadge(sailor.position)}
              </View>
              
              <View style={styles.sailCell}>
                <IOSText style={[styles.sailNumber, isHighlighted && styles.highlightedText]}>
                  {sailor.sailNumber}
                </IOSText>
                <IOSText style={styles.country}>
                  {getCountryFlag(sailor.country)} {sailor.country}
                </IOSText>
              </View>
              
              <View style={styles.nameCell}>
                <IOSText 
                  style={[styles.helmName, isHighlighted && styles.highlightedText]}
                  numberOfLines={1}
                >
                  {sailor.helmName}
                </IOSText>
                {sailor.club && (
                  <IOSText style={styles.club} numberOfLines={1}>
                    {sailor.club}
                  </IOSText>
                )}
              </View>
              
              <View style={styles.pointsCell}>
                <IOSText style={[styles.netPoints, isHighlighted && styles.highlightedText]}>
                  {sailor.netPoints}
                </IOSText>
                <IOSText style={styles.totalPoints}>
                  ({sailor.totalPoints})
                </IOSText>
              </View>
              
              <View style={styles.trendCell}>
                {getTrendIcon(sailor.trend, sailor.trendChange)}
                {sailor.trendChange && sailor.trendChange > 0 && (
                  <IOSText style={[
                    styles.trendChange,
                    { color: sailor.trend === 'up' ? '#34C759' : '#FF3B30' }
                  ]}>
                    {sailor.trendChange}
                  </IOSText>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Qualification Line */}
      {totalCompetitors > 10 && (
        <View style={styles.qualificationInfo}>
          <View style={styles.qualLine}>
            <Flag size={14} color="#34C759" />
            <IOSText style={styles.qualText}>
              Top {Math.floor(totalCompetitors * 0.8)} qualify for finals
            </IOSText>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {!showAll && totalCompetitors > 10 && (
          <IOSButton
            title={`View All ${totalCompetitors} Entries`}
            onPress={onViewAll}
            variant="secondary"
            size="small"
            style={styles.actionButton}
          />
        )}
        
        <IOSButton
          title="Race Results"
          onPress={() => {/* Navigate to race results */}}
          variant="primary"
          size="small"
          style={styles.actionButton}
          icon={<Target size={16} color="#FFFFFF" />}
        />
      </View>

      {/* Championship Info */}
      <View style={styles.footer}>
        <IOSText style={styles.footerText}>
          Scoring: Low Point System • {standings[0]?.worstResult ? 'Discards applied' : 'No discards yet'}
        </IOSText>
        <IOSText style={styles.lastUpdate}>
          Updated: {new Date().toLocaleTimeString()}
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
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Headers
  standingsHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  positionHeader: {
    width: 40,
  },
  sailHeader: {
    width: 70,
  },
  nameHeader: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: 8,
  },
  pointsHeader: {
    width: 60,
  },
  trendHeader: {
    width: 50,
  },

  // Standings List
  standingsList: {
    maxHeight: 400,
  },
  standingRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  highlightedRow: {
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    marginVertical: 1,
    borderBottomWidth: 0,
  },

  // Cells
  positionCell: {
    width: 40,
    alignItems: 'center',
  },
  position: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  
  sailCell: {
    width: 70,
    alignItems: 'center',
  },
  sailNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 1,
  },
  country: {
    fontSize: 10,
    color: '#8E8E93',
  },
  
  nameCell: {
    flex: 1,
    paddingLeft: 8,
  },
  helmName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 1,
  },
  club: {
    fontSize: 11,
    color: '#8E8E93',
  },
  
  pointsCell: {
    width: 60,
    alignItems: 'center',
  },
  netPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 1,
  },
  totalPoints: {
    fontSize: 11,
    color: '#8E8E93',
  },
  
  trendCell: {
    width: 50,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  trendChange: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },

  // Highlighting
  highlightedText: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // Qualification
  qualificationInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  qualLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 6,
    fontWeight: '500',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
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
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  lastUpdate: {
    fontSize: 11,
    color: '#8E8E93',
  },
});