import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { 
  User, 
  Users, 
  Anchor, 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Award,
  Target,
  Activity,
  Share,
  Star
} from 'lucide-react-native';

import { IOSText, IOSCard, IOSButton, IOSBadge, IOSSegmentedControl } from '../ios';
import type { Competitor, RaceResult } from '../../types/noticeBoard';

interface CompetitorProfileProps {
  competitor: Competitor;
  raceResults?: RaceResult[];
  currentPosition?: number;
  onClose?: () => void;
  onViewRace?: (raceNumber: number) => void;
  onCompare?: () => void;
}

const getCountryFlag = (countryCode: string): string => {
  const flagEmojis: { [key: string]: string } = {
    'HKG': '🇭🇰', 'AUS': '🇦🇺', 'GBR': '🇬🇧', 'USA': '🇺🇸',
    'NZL': '🇳🇿', 'SIN': '🇸🇬', 'JPN': '🇯🇵', 'FRA': '🇫🇷',
    'ITA': '🇮🇹', 'GER': '🇩🇪', 'ESP': '🇪🇸', 'NED': '🇳🇱'
  };
  return flagEmojis[countryCode] || '🏁';
};

export const CompetitorProfile: React.FC<CompetitorProfileProps> = ({
  competitor,
  raceResults = [],
  currentPosition,
  onClose,
  onViewRace,
  onCompare,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'performance'>('overview');

  // Calculate performance statistics
  const stats = React.useMemo(() => {
    if (raceResults.length === 0) {
      return {
        racesCompleted: 0,
        averagePosition: 0,
        bestFinish: null,
        topThreeFinishes: 0,
        totalPoints: 0,
        trend: 'same' as const
      };
    }

    const finishedRaces = raceResults.filter(r => r.finishPosition && r.status === 'finished');
    const positions = finishedRaces.map(r => r.finishPosition!);
    const bestFinish = positions.length > 0 ? Math.min(...positions) : null;
    const topThreeFinishes = positions.filter(pos => pos <= 3).length;
    const averagePosition = positions.length > 0 ? 
      positions.reduce((sum, pos) => sum + pos, 0) / positions.length : 0;
    const totalPoints = raceResults.reduce((sum, r) => sum + r.points, 0);

    // Calculate trend (simplified - compare last 2 races vs previous 2)
    let trend: 'up' | 'down' | 'same' = 'same';
    if (finishedRaces.length >= 4) {
      const recent = finishedRaces.slice(-2).map(r => r.finishPosition!);
      const previous = finishedRaces.slice(-4, -2).map(r => r.finishPosition!);
      const recentAvg = recent.reduce((sum, pos) => sum + pos, 0) / recent.length;
      const previousAvg = previous.reduce((sum, pos) => sum + pos, 0) / previous.length;
      
      if (recentAvg < previousAvg - 1) trend = 'up';
      else if (recentAvg > previousAvg + 1) trend = 'down';
    }

    return {
      racesCompleted: finishedRaces.length,
      averagePosition: Math.round(averagePosition * 10) / 10,
      bestFinish,
      topThreeFinishes,
      totalPoints,
      trend
    };
  }, [raceResults]);

  const handleShare = () => {
    Alert.alert(
      'Share Competitor',
      'Share competitor profile:',
      [
        { text: 'Copy Link', onPress: () => console.log('Copy link') },
        { text: 'Share Results', onPress: () => console.log('Share results') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleContact = (type: 'phone' | 'email') => {
    if (type === 'phone' && competitor.emergencyContact?.phone) {
      // Open phone dialer
      console.log('Call:', competitor.emergencyContact.phone);
    } else if (type === 'email' && competitor.emergencyContact?.email) {
      // Open email client
      console.log('Email:', competitor.emergencyContact.email);
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Basic Information */}
      <IOSCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <User size={20} color="#007AFF" />
          <IOSText style={styles.sectionTitle}>Competitor Information</IOSText>
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <IOSText style={styles.infoLabel}>Sail Number:</IOSText>
            <IOSText style={styles.infoValue}>{competitor.sailNumber}</IOSText>
          </View>
          
          <View style={styles.infoRow}>
            <IOSText style={styles.infoLabel}>Country:</IOSText>
            <View style={styles.countryInfo}>
              <IOSText style={styles.countryFlag}>{getCountryFlag(competitor.country)}</IOSText>
              <IOSText style={styles.infoValue}>{competitor.country}</IOSText>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <IOSText style={styles.infoLabel}>Club:</IOSText>
            <IOSText style={styles.infoValue}>{competitor.club}</IOSText>
          </View>
          
          {competitor.boatName && (
            <View style={styles.infoRow}>
              <IOSText style={styles.infoLabel}>Boat Name:</IOSText>
              <IOSText style={styles.infoValue}>{competitor.boatName}</IOSText>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <IOSText style={styles.infoLabel}>Entry Date:</IOSText>
            <IOSText style={styles.infoValue}>
              {new Date(competitor.entryDate).toLocaleDateString()}
            </IOSText>
          </View>
        </View>
      </IOSCard>

      {/* Crew Information */}
      {competitor.crewNames.length > 0 && (
        <IOSCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#007AFF" />
            <IOSText style={styles.sectionTitle}>Crew</IOSText>
          </View>
          
          <View style={styles.crewList}>
            <View style={styles.crewMember}>
              <IOSText style={styles.crewRole}>Helm:</IOSText>
              <IOSText style={styles.crewName}>{competitor.helmName}</IOSText>
            </View>
            {competitor.crewNames.map((crewName, index) => (
              <View key={index} style={styles.crewMember}>
                <IOSText style={styles.crewRole}>Crew {index + 1}:</IOSText>
                <IOSText style={styles.crewName}>{crewName}</IOSText>
              </View>
            ))}
          </View>
        </IOSCard>
      )}

      {/* Registration Status */}
      <IOSCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText size={20} color="#007AFF" />
          <IOSText style={styles.sectionTitle}>Registration Status</IOSText>
        </View>
        
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <IOSText style={styles.statusLabel}>Registration:</IOSText>
            <IOSBadge 
              color={competitor.registrationStatus === 'confirmed' ? '#34C759' : '#FF9500'}
              size="small"
            >
              {competitor.registrationStatus}
            </IOSBadge>
          </View>
          
          <View style={styles.statusItem}>
            <IOSText style={styles.statusLabel}>Payment:</IOSText>
            <IOSBadge 
              color={competitor.paymentStatus === 'paid' ? '#34C759' : '#FF9500'}
              size="small"
            >
              {competitor.paymentStatus}
            </IOSBadge>
          </View>
          
          <View style={styles.statusItem}>
            <IOSText style={styles.statusLabel}>Documents:</IOSText>
            <IOSBadge 
              color={competitor.documentsSubmitted ? '#34C759' : '#FF3B30'}
              size="small"
            >
              {competitor.documentsSubmitted ? 'Complete' : 'Missing'}
            </IOSBadge>
          </View>
          
          <View style={styles.statusItem}>
            <IOSText style={styles.statusLabel}>Measurement:</IOSText>
            <IOSBadge 
              color={competitor.measurementCompleted ? '#34C759' : '#FF9500'}
              size="small"
            >
              {competitor.measurementCompleted ? 'Valid' : 'Pending'}
            </IOSBadge>
          </View>
        </View>
      </IOSCard>

      {/* Emergency Contact (Officials only) */}
      {competitor.emergencyContact && (
        <IOSCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Phone size={20} color="#007AFF" />
            <IOSText style={styles.sectionTitle}>Emergency Contact</IOSText>
          </View>
          
          <View style={styles.contactInfo}>
            <IOSText style={styles.contactName}>{competitor.emergencyContact.name}</IOSText>
            <IOSText style={styles.contactRole}>{competitor.emergencyContact.role}</IOSText>
            
            <View style={styles.contactActions}>
              {competitor.emergencyContact.phone && (
                <IOSButton
                  title="Call"
                  onPress={() => handleContact('phone')}
                  variant="secondary"
                  size="small"
                  icon={<Phone size={16} color="#007AFF" />}
                  style={styles.contactButton}
                />
              )}
              {competitor.emergencyContact.email && (
                <IOSButton
                  title="Email"
                  onPress={() => handleContact('email')}
                  variant="secondary"
                  size="small"
                  icon={<Mail size={16} color="#007AFF" />}
                  style={styles.contactButton}
                />
              )}
            </View>
          </View>
        </IOSCard>
      )}
    </View>
  );

  const renderResultsTab = () => (
    <View style={styles.tabContent}>
      {/* Current Position */}
      {currentPosition && (
        <IOSCard style={styles.section}>
          <View style={styles.currentPosition}>
            <Trophy size={24} color="#FFD700" />
            <IOSText style={styles.currentPositionText}>
              Current Position: {currentPosition}
            </IOSText>
          </View>
        </IOSCard>
      )}

      {/* Race Results */}
      <IOSCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={20} color="#007AFF" />
          <IOSText style={styles.sectionTitle}>Race Results</IOSText>
        </View>
        
        {raceResults.length > 0 ? (
          <View style={styles.resultsTable}>
            <View style={styles.resultsHeader}>
              <IOSText style={styles.headerCell}>Race</IOSText>
              <IOSText style={styles.headerCell}>Position</IOSText>
              <IOSText style={styles.headerCell}>Points</IOSText>
              <IOSText style={styles.headerCell}>Status</IOSText>
            </View>
            
            {raceResults.map((result) => (
              <TouchableOpacity
                key={result.raceNumber}
                style={styles.resultRow}
                onPress={() => onViewRace?.(result.raceNumber)}
              >
                <IOSText style={styles.resultCell}>{result.raceNumber}</IOSText>
                <IOSText style={styles.resultCell}>
                  {result.finishPosition || '—'}
                </IOSText>
                <IOSText style={styles.resultCell}>{result.points}</IOSText>
                <IOSBadge 
                  color={result.status === 'finished' ? '#34C759' : '#FF9500'}
                  size="small"
                >
                  {result.status.toUpperCase()}
                </IOSBadge>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noResults}>
            <IOSText style={styles.noResultsText}>No race results yet</IOSText>
          </View>
        )}
      </IOSCard>
    </View>
  );

  const renderPerformanceTab = () => (
    <View style={styles.tabContent}>
      {/* Performance Summary */}
      <IOSCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <Activity size={20} color="#007AFF" />
          <IOSText style={styles.sectionTitle}>Performance Summary</IOSText>
        </View>
        
        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <IOSText style={styles.performanceValue}>{stats.racesCompleted}</IOSText>
            <IOSText style={styles.performanceLabel}>Races</IOSText>
          </View>
          
          <View style={styles.performanceItem}>
            <IOSText style={styles.performanceValue}>
              {stats.averagePosition > 0 ? stats.averagePosition : '—'}
            </IOSText>
            <IOSText style={styles.performanceLabel}>Avg Position</IOSText>
          </View>
          
          <View style={styles.performanceItem}>
            <IOSText style={styles.performanceValue}>
              {stats.bestFinish || '—'}
            </IOSText>
            <IOSText style={styles.performanceLabel}>Best Finish</IOSText>
          </View>
          
          <View style={styles.performanceItem}>
            <IOSText style={styles.performanceValue}>{stats.topThreeFinishes}</IOSText>
            <IOSText style={styles.performanceLabel}>Top 3</IOSText>
          </View>
        </View>
        
        <View style={styles.trendIndicator}>
          {stats.trend === 'up' && <TrendingUp size={20} color="#34C759" />}
          {stats.trend === 'down' && <TrendingDown size={20} color="#FF3B30" />}
          {stats.trend === 'same' && <Activity size={20} color="#8E8E93" />}
          <IOSText style={[
            styles.trendText,
            { color: stats.trend === 'up' ? '#34C759' : stats.trend === 'down' ? '#FF3B30' : '#8E8E93' }
          ]}>
            {stats.trend === 'up' ? 'Improving' : stats.trend === 'down' ? 'Declining' : 'Steady'}
          </IOSText>
        </View>
      </IOSCard>

      {/* Points Breakdown */}
      <IOSCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <Award size={20} color="#007AFF" />
          <IOSText style={styles.sectionTitle}>Points Breakdown</IOSText>
        </View>
        
        <View style={styles.pointsBreakdown}>
          <View style={styles.pointsRow}>
            <IOSText style={styles.pointsLabel}>Total Points:</IOSText>
            <IOSText style={styles.pointsValue}>{stats.totalPoints}</IOSText>
          </View>
          <View style={styles.pointsRow}>
            <IOSText style={styles.pointsLabel}>Races Counted:</IOSText>
            <IOSText style={styles.pointsValue}>{stats.racesCompleted}</IOSText>
          </View>
          <View style={styles.pointsRow}>
            <IOSText style={styles.pointsLabel}>Discards:</IOSText>
            <IOSText style={styles.pointsValue}>
              {Math.max(0, stats.racesCompleted - 5)} {/* Example discard rule */}
            </IOSText>
          </View>
        </View>
      </IOSCard>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <IOSText style={styles.sailNumber}>{competitor.sailNumber}</IOSText>
            <IOSText style={styles.helmName}>{competitor.helmName}</IOSText>
            <View style={styles.countryRow}>
              <IOSText style={styles.countryFlag}>{getCountryFlag(competitor.country)}</IOSText>
              <IOSText style={styles.country}>{competitor.country}</IOSText>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <IOSButton
              title=""
              onPress={handleShare}
              variant="secondary"
              size="small"
              icon={<Share size={20} color="#007AFF" />}
              style={styles.headerButton}
            />
            {onCompare && (
              <IOSButton
                title=""
                onPress={onCompare}
                variant="secondary"
                size="small"
                icon={<Star size={20} color="#007AFF" />}
                style={styles.headerButton}
              />
            )}
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <IOSSegmentedControl
          values={['Overview', 'Results', 'Performance']}
          selectedIndex={activeTab === 'overview' ? 0 : activeTab === 'results' ? 1 : 2}
          onChange={(index) => setActiveTab(index === 0 ? 'overview' : index === 1 ? 'results' : 'performance')}
          style={styles.segmentedControl}
        />
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'results' && renderResultsTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  sailNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  helmName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  country: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
  },

  // Tab Navigation
  tabNavigation: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  segmentedControl: {
    width: '100%',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },

  // Overview Tab
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },

  // Crew
  crewList: {
    gap: 8,
  },
  crewMember: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  crewRole: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    width: 80,
  },
  crewName: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  // Status
  statusGrid: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Contact
  contactInfo: {
    alignItems: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  contactRole: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    minWidth: 80,
  },

  // Results Tab
  currentPosition: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  currentPositionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 12,
  },

  resultsTable: {
    gap: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginBottom: 1,
  },
  resultCell: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#8E8E93',
  },

  // Performance Tab
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  performanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  trendText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Points
  pointsBreakdown: {
    gap: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});