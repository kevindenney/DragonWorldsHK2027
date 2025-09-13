import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { 
  X, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard,
  Globe
} from 'lucide-react-native';

import { IOSText, IOSButton, IOSCard } from '../ios';

interface CompetitorFiltersProps {
  availableCountries: string[];
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  filterBy: 'all' | 'confirmed' | 'pending' | 'paid' | 'incomplete';
  onFilterChange: (filter: 'all' | 'confirmed' | 'pending' | 'paid' | 'incomplete') => void;
  onClose: () => void;
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

export const CompetitorFilters: React.FC<CompetitorFiltersProps> = ({
  availableCountries,
  selectedCountries,
  onCountriesChange,
  filterBy,
  onFilterChange,
  onClose,
}) => {
  const statusFilters = [
    { key: 'all', label: 'All Competitors', icon: null, color: '#8E8E93' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: '#34C759' },
    { key: 'pending', label: 'Pending', icon: Clock, color: '#FF9500' },
    { key: 'paid', label: 'Paid', icon: CreditCard, color: '#007AFF' },
    { key: 'incomplete', label: 'Incomplete', icon: AlertCircle, color: '#FF3B30' },
  ] as const;

  const handleCountryToggle = (country: string) => {
    if (selectedCountries.includes(country)) {
      onCountriesChange(selectedCountries.filter(c => c !== country));
    } else {
      onCountriesChange([...selectedCountries, country]);
    }
  };

  const handleSelectAllCountries = () => {
    onCountriesChange(availableCountries);
  };

  const handleClearAllCountries = () => {
    onCountriesChange([]);
  };

  const handleClearAllFilters = () => {
    onFilterChange('all');
    onCountriesChange([]);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <IOSCard style={styles.filterCard}>
          {/* Header */}
          <View style={styles.header}>
            <IOSText style={styles.title}>Filter Competitors</IOSText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Registration Status Filter */}
            <View style={styles.section}>
              <IOSText style={styles.sectionTitle}>Registration Status</IOSText>
              <View style={styles.statusFilters}>
                {statusFilters.map((filter) => {
                  const Icon = filter.icon;
                  const isSelected = filterBy === filter.key;
                  
                  return (
                    <TouchableOpacity
                      key={filter.key}
                      style={[
                        styles.statusFilter,
                        isSelected && styles.selectedStatusFilter
                      ]}
                      onPress={() => onFilterChange(filter.key)}
                    >
                      {Icon && (
                        <Icon 
                          size={18} 
                          color={isSelected ? '#FFFFFF' : filter.color} 
                        />
                      )}
                      <IOSText style={[
                        styles.statusFilterText,
                        isSelected && styles.selectedStatusFilterText,
                        !isSelected && { color: filter.color }
                      ]}>
                        {filter.label}
                      </IOSText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Country Filter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Globe size={18} color="#007AFF" />
                  <IOSText style={styles.sectionTitle}>Countries</IOSText>
                </View>
                <View style={styles.countryActions}>
                  <TouchableOpacity 
                    onPress={handleSelectAllCountries}
                    style={styles.countryAction}
                  >
                    <IOSText style={styles.countryActionText}>All</IOSText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleClearAllCountries}
                    style={styles.countryAction}
                  >
                    <IOSText style={styles.countryActionText}>None</IOSText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.countryGrid}>
                {availableCountries.map((country) => {
                  const isSelected = selectedCountries.includes(country);
                  
                  return (
                    <TouchableOpacity
                      key={country}
                      style={[
                        styles.countryChip,
                        isSelected && styles.selectedCountryChip
                      ]}
                      onPress={() => handleCountryToggle(country)}
                    >
                      <IOSText style={styles.countryFlag}>
                        {getCountryFlag(country)}
                      </IOSText>
                      <IOSText style={[
                        styles.countryCode,
                        isSelected && styles.selectedCountryCode
                      ]}>
                        {country}
                      </IOSText>
                      {isSelected && (
                        <CheckCircle size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedCountries.length > 0 && (
                <View style={styles.selectedSummary}>
                  <IOSText style={styles.selectedText}>
                    {selectedCountries.length} of {availableCountries.length} countries selected
                  </IOSText>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <IOSButton
              title="Clear All"
              onPress={handleClearAllFilters}
              variant="secondary"
              size="medium"
              style={styles.footerButton}
            />
            <IOSButton
              title="Apply Filters"
              onPress={onClose}
              variant="primary"
              size="medium"
              style={styles.footerButton}
            />
          </View>
        </IOSCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  filterCard: {
    padding: 0,
    maxHeight: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },

  // Status Filters
  statusFilters: {
    gap: 12,
  },
  statusFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedStatusFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusFilterText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
    color: '#1C1C1E',
  },
  selectedStatusFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Country Filters
  countryActions: {
    flexDirection: 'row',
  },
  countryAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  countryActionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minWidth: 80,
  },
  selectedCountryChip: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  countryFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  selectedCountryCode: {
    color: '#FFFFFF',
  },
  selectedSummary: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },
  selectedText: {
    fontSize: 13,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  footerButton: {
    flex: 1,
  },
});