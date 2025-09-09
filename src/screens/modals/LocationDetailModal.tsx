import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  MapPin,
  Navigation,
  Wind,
  Waves,
  ArrowUp,
  ArrowDown,
  Phone,
  Mail,
  Globe,
  Map,
  Anchor
} from 'lucide-react-native';
import { colors, spacing } from '../../constants/theme';
import {
  IOSModal,
  IOSCard,
  IOSButton,
  IOSText,
  IOSBadge
} from '../../components/ios';

// TypeScript interfaces
interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface CurrentConditions {
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  tideHeight: number;
  tideType: 'high' | 'low';
  tideTime: string;
}

interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

interface LocationDetail {
  id: string;
  name: string;
  type: 'marina' | 'race-area' | 'hotel' | 'restaurant' | 'venue';
  description: string;
  coordinates: LocationCoordinates;
  currentConditions?: CurrentConditions;
  contactInfo?: ContactInfo;
  services?: string[];
}

interface LocationDetailModalProps {
  location: LocationDetail;
  visible: boolean;
  onClose: () => void;
}

// Location Info Row Component
const LocationInfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
}> = ({ icon, label, value, badge }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      {icon}
    </View>
    <View style={styles.infoContent}>
      <IOSText textStyle="caption1" color="secondaryLabel">
        {label}
      </IOSText>
      <View style={styles.infoValueRow}>
        <IOSText textStyle="callout" color="label">
          {value}
        </IOSText>
        {badge && <View style={styles.infoBadge}>{badge}</View>}
      </View>
    </View>
  </View>
);

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  location,
  visible,
  onClose
}) => {
  const getLocationTypeDisplay = (type: LocationDetail['type']) => {
    const types = {
      'marina': 'Marina',
      'race-area': 'Race Area',
      'hotel': 'Hotel',
      'restaurant': 'Restaurant',
      'venue': 'Event Venue'
    };
    return types[type];
  };

  const getLocationTypeColor = (type: LocationDetail['type']) => {
    const colors = {
      'marina': 'systemBlue' as const,
      'race-area': 'systemGreen' as const,
      'hotel': 'systemOrange' as const,
      'restaurant': 'systemRed' as const,
      'venue': 'systemGray' as const,
    };
    return colors[type];
  };

  const getWindCondition = (speed: number) => {
    if (speed < 7) return { text: 'Light', color: 'systemGreen' as const };
    if (speed < 15) return { text: 'Moderate', color: 'systemBlue' as const };
    if (speed < 25) return { text: 'Strong', color: 'systemOrange' as const };
    return { text: 'Gale', color: 'systemRed' as const };
  };

  const handleGetDirections = () => {
    // Open directions logic
  };

  const handleViewChart = () => {
    // View nautical chart logic
  };

  const handleContact = (type: 'phone' | 'email' | 'website', value: string) => {
    // Handle contact action
  };

  const windCondition = location.currentConditions 
    ? getWindCondition(location.currentConditions.windSpeed)
    : null;

  return (
    <IOSModal
      visible={visible}
      onClose={onClose}
      presentationStyle="pageSheet"
      showsHandleIndicator={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IOSText textStyle="largeTitle" weight="bold" style={styles.locationName}>
              {location.name}
            </IOSText>
            <IOSBadge 
              color={getLocationTypeColor(location.type)} 
              variant="tinted" 
              size="medium"
              style={styles.typeBadge}
            >
              {getLocationTypeDisplay(location.type)}
            </IOSBadge>
          </View>
          <IOSButton
            title="Done"
            variant="plain"
            size="medium"
            onPress={onClose}
            style={styles.doneButton}
          />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Description */}
          <IOSCard variant="elevated" style={styles.descriptionCard}>
            <IOSText textStyle="callout" color="secondaryLabel" style={styles.description}>
              {location.description}
            </IOSText>
          </IOSCard>

          {/* Coordinates */}
          <IOSCard variant="elevated" style={styles.coordinatesCard}>
            <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
              Coordinates
            </IOSText>
            
            <View style={styles.coordinatesInfo}>
              <MapPin size={20} color={colors.primary} />
              <View style={styles.coordinatesText}>
                <IOSText textStyle="callout" weight="semibold" color="label">
                  {location.coordinates.latitude.toFixed(6)}°N
                </IOSText>
                <IOSText textStyle="callout" weight="semibold" color="label">
                  {location.coordinates.longitude.toFixed(6)}°E
                </IOSText>
              </View>
            </View>
          </IOSCard>

          {/* Current Conditions */}
          {location.currentConditions && (
            <IOSCard variant="elevated" style={styles.conditionsCard}>
              <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
                Current Conditions
              </IOSText>
              
              <View style={styles.conditionsGrid}>
                <LocationInfoRow
                  icon={<Wind size={20} color={colors.primary} />}
                  label="Wind"
                  value={`${location.currentConditions.windSpeed} kts @ ${location.currentConditions.windDirection}°`}
                  badge={windCondition && (
                    <IOSBadge color={windCondition.color} variant="tinted" size="small">
                      {windCondition.text}
                    </IOSBadge>
                  )}
                />
                
                <LocationInfoRow
                  icon={<Waves size={20} color={colors.accent} />}
                  label="Wave Height"
                  value={`${location.currentConditions.waveHeight} m`}
                />
                
                <LocationInfoRow
                  icon={location.currentConditions.tideType === 'high' ? 
                    <ArrowUp size={20} color={colors.success} /> : 
                    <ArrowDown size={20} color={colors.error} />
                  }
                  label="Tide"
                  value={`${location.currentConditions.tideHeight.toFixed(1)}m`}
                  badge={
                    <IOSBadge 
                      color={location.currentConditions.tideType === 'high' ? 'systemBlue' : 'systemGreen'} 
                      variant="tinted" 
                      size="small"
                    >
                      {location.currentConditions.tideType.toUpperCase()} at {location.currentConditions.tideTime}
                    </IOSBadge>
                  }
                />
              </View>
            </IOSCard>
          )}

          {/* Navigation */}
          <IOSCard variant="elevated" style={styles.navigationCard}>
            <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
              Navigation
            </IOSText>
            
            <View style={styles.navigationButtons}>
              <IOSButton
                title="Get Directions"
                variant="filled"
                size="large"
                onPress={handleGetDirections}
                style={styles.navigationButton}
              />
              
              {(location.type === 'marina' || location.type === 'race-area') && (
                <IOSButton
                  title="View Chart"
                  variant="tinted"
                  size="large"
                  onPress={handleViewChart}
                  style={styles.navigationButton}
                />
              )}
            </View>
          </IOSCard>

          {/* Services */}
          {location.services && location.services.length > 0 && (
            <IOSCard variant="elevated" style={styles.servicesCard}>
              <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
                Services
              </IOSText>
              
              <View style={styles.servicesList}>
                {location.services.map((service, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <IOSText textStyle="callout" color="secondaryLabel">
                      • {service}
                    </IOSText>
                  </View>
                ))}
              </View>
            </IOSCard>
          )}

          {/* Contact Information */}
          {location.contactInfo && (
            <IOSCard variant="elevated" style={styles.contactCard}>
              <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
                Contact Information
              </IOSText>
              
              <View style={styles.contactList}>
                {location.contactInfo.phone && (
                  <View style={styles.contactItem}>
                    <Phone size={20} color={colors.primary} />
                    <IOSButton
                      title={location.contactInfo.phone}
                      variant="plain"
                      onPress={() => handleContact('phone', location.contactInfo!.phone!)}
                      style={styles.contactButton}
                      textStyle={styles.contactButtonText}
                    />
                  </View>
                )}
                
                {location.contactInfo.email && (
                  <View style={styles.contactItem}>
                    <Mail size={20} color={colors.accent} />
                    <IOSButton
                      title={location.contactInfo.email}
                      variant="plain"
                      onPress={() => handleContact('email', location.contactInfo!.email!)}
                      style={styles.contactButton}
                      textStyle={styles.contactButtonText}
                    />
                  </View>
                )}
                
                {location.contactInfo.website && (
                  <View style={styles.contactItem}>
                    <Globe size={20} color={colors.success} />
                    <IOSButton
                      title={location.contactInfo.website}
                      variant="plain"
                      onPress={() => handleContact('website', location.contactInfo!.website!)}
                      style={styles.contactButton}
                      textStyle={styles.contactButtonText}
                    />
                  </View>
                )}
              </View>
            </IOSCard>
          )}
        </ScrollView>
      </View>
    </IOSModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flex: 1,
    paddingRight: 16,
  },
  locationName: {
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
  },
  doneButton: {
    alignSelf: 'flex-start',
  },
  
  // Content
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Sections
  descriptionCard: {
    marginBottom: 16,
  },
  coordinatesCard: {
    marginBottom: 16,
  },
  conditionsCard: {
    marginBottom: 16,
  },
  navigationCard: {
    marginBottom: 16,
  },
  servicesCard: {
    marginBottom: 16,
  },
  contactCard: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  
  // Description
  description: {
    lineHeight: 22,
  },
  
  // Coordinates
  coordinatesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinatesText: {
    marginLeft: 12,
    gap: 4,
  },
  
  // Conditions
  conditionsGrid: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoBadge: {
    marginLeft: 12,
  },
  
  // Navigation
  navigationButtons: {
    gap: 12,
  },
  navigationButton: {
    // Button styling handled by IOSButton
  },
  
  // Services
  servicesList: {
    gap: 8,
  },
  serviceItem: {
    paddingLeft: 8,
  },
  
  // Contact
  contactList: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactButton: {
    marginLeft: 12,
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  contactButtonText: {
    color: colors.primary,
    textAlign: 'left',
  },
});