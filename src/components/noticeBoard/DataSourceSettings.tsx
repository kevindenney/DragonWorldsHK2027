import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import { colors } from '../../constants/theme';
import { Settings, Database, Wifi, WifiOff, Globe, Anchor } from 'lucide-react-native';

interface DataSourceSettingsProps {
  currentUseDemoData: boolean;
  currentDataSource?: 'demo' | 'racing_rules' | 'ccr2024';
  onToggleDataSource: (useDemoData: boolean) => void;
  onDataSourceChange?: (dataSource: 'demo' | 'racing_rules' | 'ccr2024') => void;
  onClose: () => void;
}

export const DataSourceSettings: React.FC<DataSourceSettingsProps> = ({
  currentUseDemoData,
  currentDataSource = 'demo',
  onToggleDataSource,
  onDataSourceChange,
  onClose
}) => {
  const [useDemoData, setUseDemoData] = useState(currentUseDemoData);
  const [dataSource, setDataSource] = useState(currentDataSource);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setHasUnsavedChanges(
      useDemoData !== currentUseDemoData || dataSource !== currentDataSource
    );
  }, [useDemoData, currentUseDemoData, dataSource, currentDataSource]);

  const handleToggle = (value: boolean) => {
    setUseDemoData(value);
  };

  const handleDataSourceSelect = (source: 'demo' | 'racing_rules' | 'ccr2024') => {
    setDataSource(source);
  };

  const handleSave = () => {
    if (hasUnsavedChanges) {
      onToggleDataSource(useDemoData);
      if (onDataSourceChange) {
        onDataSourceChange(dataSource);
      }
      
      const sourceNames = {
        demo: 'Demo Data',
        racing_rules: 'Racing Rules of Sailing',
        ccr2024: 'China Coast Race Week'
      };
      
      Alert.alert(
        'Settings Saved',
        `Data source switched to ${sourceNames[dataSource]}`,
        [{ text: 'OK', onPress: onClose }]
      );
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to cancel?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard Changes', 
            style: 'destructive',
            onPress: () => {
              setUseDemoData(currentUseDemoData);
              setDataSource(currentDataSource);
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  const getDataSourceIcon = (source: typeof dataSource) => {
    switch (source) {
      case 'demo':
        return <Database size={20} color={colors.textSecondary} />;
      case 'racing_rules':
        return <Wifi size={20} color={colors.success} />;
      case 'ccr2024':
        return <Anchor size={20} color={colors.primary} />;
      default:
        return <Database size={20} color={colors.textSecondary} />;
    }
  };

  const getDataSourceName = (source: typeof dataSource) => {
    switch (source) {
      case 'demo':
        return 'Demo Data';
      case 'racing_rules':
        return 'Racing Rules of Sailing';
      case 'ccr2024':
        return 'China Coast Race Week';
      default:
        return 'Demo Data';
    }
  };

  const getDataSourceDescription = (source: typeof dataSource) => {
    switch (source) {
      case 'demo':
        return 'Using demonstration data for development and testing';
      case 'racing_rules':
        return 'Fetching real race data from racingrulesofsailing.org';
      case 'ccr2024':
        return 'Live notices from China Coast Race Week with sailor action forms';
      default:
        return 'Using demonstration data for development and testing';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Settings size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Data Source Settings</Text>
        </View>

        {/* Current Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {getDataSourceIcon(dataSource)}
            <Text style={styles.statusTitle}>
              Current Source: {getDataSourceName(dataSource)}
            </Text>
          </View>
          
          <Text style={styles.statusDescription}>
            {getDataSourceDescription(dataSource)}
          </Text>
        </View>

        {/* Data Source Selection */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Data Source</Text>
          <Text style={styles.sectionDescription}>
            Choose your notice board data source
          </Text>
          
          <View style={styles.sourceOptions}>
            {/* Demo Data Option */}
            <TouchableOpacity
              style={[styles.sourceOption, dataSource === 'demo' && styles.selectedOption]}
              onPress={() => handleDataSourceSelect('demo')}
            >
              <View style={styles.sourceHeader}>
                <Database size={20} color={dataSource === 'demo' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.sourceTitle, dataSource === 'demo' && styles.selectedText]}>
                  Demo Data
                </Text>
              </View>
              <Text style={styles.sourceDescription}>
                Demonstration data for testing and development
              </Text>
            </TouchableOpacity>

            {/* Racing Rules Option */}
            <TouchableOpacity
              style={[styles.sourceOption, dataSource === 'racing_rules' && styles.selectedOption]}
              onPress={() => handleDataSourceSelect('racing_rules')}
            >
              <View style={styles.sourceHeader}>
                <Wifi size={20} color={dataSource === 'racing_rules' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.sourceTitle, dataSource === 'racing_rules' && styles.selectedText]}>
                  Racing Rules of Sailing
                </Text>
              </View>
              <Text style={styles.sourceDescription}>
                Official race results from racingrulesofsailing.org
              </Text>
            </TouchableOpacity>

            {/* CCR2024 Option */}
            <TouchableOpacity
              style={[styles.sourceOption, dataSource === 'ccr2024' && styles.selectedOption]}
              onPress={() => handleDataSourceSelect('ccr2024')}
            >
              <View style={styles.sourceHeader}>
                <Anchor size={20} color={dataSource === 'ccr2024' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.sourceTitle, dataSource === 'ccr2024' && styles.selectedText]}>
                  China Coast Race Week
                </Text>
              </View>
              <Text style={styles.sourceDescription}>
                Live notices from chinacoastraceweek.com with sailor actions
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Source Toggle */}
        <View style={styles.settingSection}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Use Demo Data</Text>
              <Text style={styles.settingDescription}>
                Toggle between demonstration data and real race results
              </Text>
            </View>
            <Switch
              value={useDemoData}
              onValueChange={handleToggle}
              trackColor={{ false: colors.success, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        {/* Demo Data Information */}
        {useDemoData && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Database size={18} color={colors.primary} />
              <Text style={styles.infoTitle}>Demo Data Features</Text>
            </View>
            <Text style={styles.infoContent}>
              • Simulated Dragon Worlds HK 2027 event data{'\n'}
              • Sample race results and standings{'\n'}
              • Mock sailing instructions and documents{'\n'}
              • Example competitor entries and protest forms{'\n'}
              • Instant loading without network dependencies
            </Text>
          </View>
        )}

        {/* Live Data Information */}
        {!useDemoData && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Wifi size={18} color={colors.success} />
              <Text style={styles.infoTitle}>Live Data Features</Text>
            </View>
            <Text style={styles.infoContent}>
              • Real race results from racingrulesofsailing.org{'\n'}
              • Official sailing instructions and documents{'\n'}
              • Live competitor standings and entries{'\n'}
              • Current protest forms and decisions{'\n'}
              • Requires internet connection
            </Text>
            
            <View style={styles.warningBox}>
              <WifiOff size={16} color={colors.warning} />
              <Text style={styles.warningText}>
                Live data requires a backend service to avoid CORS restrictions. 
                Currently falls back to demo data if scraping fails.
              </Text>
            </View>
          </View>
        )}

        {/* Performance Note */}
        <View style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>Performance Note</Text>
          <Text style={styles.performanceContent}>
            {useDemoData 
              ? 'Demo mode provides instant loading and works offline.'
              : 'Live mode may have slower loading times due to web scraping and network requests.'
            }
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.saveButton, !hasUnsavedChanges && styles.disabledButton]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, !hasUnsavedChanges && styles.disabledButtonText]}>
            {hasUnsavedChanges ? 'Save Changes' : 'Close'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  settingSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  infoContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  performanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  performanceContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  disabledButton: {
    backgroundColor: colors.borderLight,
  },
  disabledButtonText: {
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sourceOptions: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sourceOption: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  selectedText: {
    color: colors.primary,
  },
  sourceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});