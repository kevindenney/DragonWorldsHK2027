import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { AlertTriangle, X, Eye, Wind, Waves, Navigation, Clock } from 'lucide-react-native';
import { marineWarningService, MarineWarning, WarningSeverity } from '../../services/marineWarningService';

interface MarineWarningPanelProps {
  visible: boolean;
  onClose: () => void;
}

interface WarningItemProps {
  warning: MarineWarning;
  onPress: () => void;
}

const WarningItem: React.FC<WarningItemProps> = ({ warning, onPress }) => {
  const getSeverityColor = (severity: WarningSeverity) => {
    switch (severity) {
      case 'severe': return '#DC2626'; // Red
      case 'warning': return '#EA580C'; // Orange
      case 'watch': return '#D97706'; // Amber
      case 'advisory': return '#EAB308'; // Yellow
      default: return '#6B7280'; // Gray
    }
  };

  const getSeverityIcon = (severity: WarningSeverity) => {
    switch (severity) {
      case 'severe':
      case 'warning':
        return <AlertTriangle size={20} color="#FFFFFF" />;
      case 'watch':
        return <Eye size={20} color="#FFFFFF" />;
      default:
        return <AlertTriangle size={20} color="#FFFFFF" />;
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const validUntil = new Date(warning.validUntil);
    const diffMs = validUntil.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs <= 0) return 'Expired';
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
    return `${diffMinutes}m`;
  };

  return (
    <TouchableOpacity style={styles.warningItem} onPress={onPress}>
      <View style={[styles.warningHeader, { backgroundColor: getSeverityColor(warning.severity) }]}>
        <View style={styles.warningHeaderLeft}>
          {getSeverityIcon(warning.severity)}
          <Text style={styles.warningTitle}>{warning.title}</Text>
        </View>
        <View style={styles.warningBadge}>
          <Text style={styles.warningBadgeText}>{warning.severity.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.warningContent}>
        <Text style={styles.warningDescription} numberOfLines={2}>
          {warning.description}
        </Text>

        <View style={styles.warningDetails}>
          {/* Wind Speed */}
          {warning.windSpeed && (
            <View style={styles.detailItem}>
              <Wind size={14} color="#6B7280" />
              <Text style={styles.detailText}>{warning.windSpeed}kt</Text>
            </View>
          )}

          {/* Wave Height */}
          {warning.waveHeight && (
            <View style={styles.detailItem}>
              <Waves size={14} color="#6B7280" />
              <Text style={styles.detailText}>{warning.waveHeight}m</Text>
            </View>
          )}

          {/* Visibility */}
          {warning.visibility && (
            <View style={styles.detailItem}>
              <Eye size={14} color="#6B7280" />
              <Text style={styles.detailText}>{warning.visibility}km</Text>
            </View>
          )}

          {/* Time Remaining */}
          <View style={styles.detailItem}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.detailText}>{getTimeRemaining()}</Text>
          </View>
        </View>

        <View style={styles.warningFooter}>
          <Text style={styles.affectedAreas}>
            Areas: {warning.affectedAreas.join(', ')}
          </Text>
          <Text style={styles.warningSource}>
            {warning.source} • {new Date(warning.lastUpdated).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const MarineWarningPanel: React.FC<MarineWarningPanelProps> = ({ visible, onClose }) => {
  const [warnings, setWarnings] = useState<MarineWarning[]>([]);
  const [selectedWarning, setSelectedWarning] = useState<MarineWarning | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  useEffect(() => {
    // Subscribe to warning updates
    const unsubscribe = marineWarningService.addWarningListener((updatedWarnings) => {
      setWarnings(updatedWarnings);
    });

    return unsubscribe;
  }, []);

  if (!visible) return null;

  const getSummaryStats = () => {
    const severe = warnings.filter(w => w.severity === 'severe').length;
    const warning = warnings.filter(w => w.severity === 'warning').length;
    const watch = warnings.filter(w => w.severity === 'watch').length;
    const advisory = warnings.filter(w => w.severity === 'advisory').length;

    return { severe, warning, watch, advisory };
  };

  const stats = getSummaryStats();
  const hasHighPriorityWarnings = stats.severe > 0 || stats.warning > 0;

  return (
    <Animated.View style={[styles.panel, { opacity: fadeAnim }]}>
      <View style={styles.panelHeader}>
        <View style={styles.headerLeft}>
          <AlertTriangle
            size={24}
            color={hasHighPriorityWarnings ? '#DC2626' : '#6B7280'}
          />
          <View>
            <Text style={styles.panelTitle}>Marine Warnings</Text>
            <Text style={styles.panelSubtitle}>
              {warnings.length} active warning{warnings.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Warning Summary */}
      {warnings.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            {stats.severe > 0 && (
              <View style={[styles.summaryBadge, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.summaryBadgeText}>SEVERE: {stats.severe}</Text>
              </View>
            )}
            {stats.warning > 0 && (
              <View style={[styles.summaryBadge, { backgroundColor: '#EA580C' }]}>
                <Text style={styles.summaryBadgeText}>WARNING: {stats.warning}</Text>
              </View>
            )}
            {stats.watch > 0 && (
              <View style={[styles.summaryBadge, { backgroundColor: '#D97706' }]}>
                <Text style={styles.summaryBadgeText}>WATCH: {stats.watch}</Text>
              </View>
            )}
            {stats.advisory > 0 && (
              <View style={[styles.summaryBadge, { backgroundColor: '#EAB308' }]}>
                <Text style={styles.summaryBadgeText}>ADVISORY: {stats.advisory}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Warning List */}
      <ScrollView style={styles.warningList} showsVerticalScrollIndicator={false}>
        {warnings.length === 0 ? (
          <View style={styles.noWarningsContainer}>
            <Navigation size={48} color="#9CA3AF" />
            <Text style={styles.noWarningsTitle}>All Clear</Text>
            <Text style={styles.noWarningsText}>
              No active marine warnings for Hong Kong waters
            </Text>
          </View>
        ) : (
          warnings
            .sort((a, b) => {
              // Sort by severity first, then by issue time
              const severityOrder = { severe: 4, warning: 3, watch: 2, advisory: 1, normal: 0 };
              const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
              if (severityDiff !== 0) return severityDiff;
              return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
            })
            .map((warning) => (
              <WarningItem
                key={warning.id}
                warning={warning}
                onPress={() => setSelectedWarning(warning)}
              />
            ))
        )}
      </ScrollView>

      {/* Selected Warning Detail */}
      {selectedWarning && (
        <View style={styles.detailOverlay}>
          <View style={styles.detailPanel}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedWarning.title}</Text>
              <TouchableOpacity
                onPress={() => setSelectedWarning(null)}
                style={styles.detailCloseButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailContent}>
              <Text style={styles.detailDescription}>
                {selectedWarning.description}
              </Text>

              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Valid Until:</Text>
                <Text style={styles.detailInfoText}>
                  {new Date(selectedWarning.validUntil).toLocaleString()}
                </Text>
              </View>

              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Affected Areas:</Text>
                <Text style={styles.detailInfoText}>
                  {selectedWarning.affectedAreas.join(', ')}
                </Text>
              </View>

              {selectedWarning.windSpeed && (
                <View style={styles.detailInfo}>
                  <Text style={styles.detailInfoLabel}>Wind Speed:</Text>
                  <Text style={styles.detailInfoText}>
                    {selectedWarning.windSpeed} knots
                  </Text>
                </View>
              )}

              {selectedWarning.waveHeight && (
                <View style={styles.detailInfo}>
                  <Text style={styles.detailInfoLabel}>Wave Height:</Text>
                  <Text style={styles.detailInfoText}>
                    {selectedWarning.waveHeight} meters
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  panelSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningList: {
    maxHeight: 250,
  },
  warningItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  warningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  warningHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  warningBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningContent: {
    padding: 12,
  },
  warningDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  warningDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  warningFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  affectedAreas: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  warningSource: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  noWarningsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noWarningsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  noWarningsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  detailPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 20,
    maxHeight: 300,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  detailCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    padding: 16,
    maxHeight: 200,
  },
  detailDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailInfo: {
    marginBottom: 12,
  },
  detailInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  detailInfoText: {
    fontSize: 14,
    color: '#1F2937',
  },
});

export default MarineWarningPanel;