import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Utensils,
  Users,
  ChevronRight,
  Navigation
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
interface EventDetail {
  id: string;
  title: string;
  type: 'racing' | 'social' | 'meeting';
  status: 'upcoming' | 'in-progress' | 'completed' | 'weather-hold';
  startTime: string;
  endTime?: string;
  description: string;
  location: {
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  sponsorServices?: {
    title: string;
    provider: string;
    services: string[];
  };
}

interface EventDetailModalProps {
  event: EventDetail;
  visible: boolean;
  onClose: () => void;
}

// Event Info Row Component
const EventInfoRow: React.FC<{
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
      <IOSText textStyle="caption1" color="secondaryLabel" style={styles.infoLabel}>
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

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  visible,
  onClose
}) => {
  const getStatusBadge = (status: EventDetail['status']) => {
    const badgeProps = {
      'upcoming': { color: 'systemBlue' as const, variant: 'tinted' as const },
      'in-progress': { color: 'systemGreen' as const, variant: 'filled' as const },
      'completed': { color: 'systemGray' as const, variant: 'tinted' as const },
      'weather-hold': { color: 'systemOrange' as const, variant: 'filled' as const },
    };
    
    return (
      <IOSBadge {...badgeProps[status]} size="small">
        {status.replace('-', ' ').toUpperCase()}
      </IOSBadge>
    );
  };

  const getEventTypeDisplay = (type: EventDetail['type']) => {
    const types = {
      'racing': 'Racing Event',
      'social': 'Social Event',
      'meeting': 'Meeting'
    };
    return types[type];
  };

  const handleAddToCalendar = () => {
    // Add to calendar logic
  };

  const handleJoinDiscussion = () => {
    // Join event discussion logic
  };

  const handleDietaryRequirements = () => {
    // Dietary requirements logic
  };

  const handleCheckRSVP = () => {
    // Check RSVP status logic
  };

  const handleDirections = () => {
    // Open directions logic
  };

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
            <IOSText textStyle="largeTitle" weight="bold" style={styles.eventTitle}>
              {event.title}
            </IOSText>
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
          {/* Event Information Card */}
          <IOSCard variant="elevated" style={styles.infoCard}>
            <EventInfoRow
              icon={<Clock size={20} color={colors.primary} />}
              label="Time"
              value={`${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}`}
            />
            
            <EventInfoRow
              icon={<Calendar size={20} color={colors.accent} />}
              label="Type"
              value={getEventTypeDisplay(event.type)}
            />
            
            <EventInfoRow
              icon={<Users size={20} color={colors.success} />}
              label="Status"
              value={event.status.replace('-', ' ')}
              badge={getStatusBadge(event.status)}
            />
          </IOSCard>

          {/* Description Section */}
          <IOSCard variant="elevated" style={styles.descriptionCard}>
            <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
              Description
            </IOSText>
            <IOSText textStyle="callout" color="secondaryLabel" style={styles.description}>
              {event.description}
            </IOSText>
          </IOSCard>

          {/* Location Section */}
          <IOSCard variant="elevated" style={styles.locationCard}>
            <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
              Location
            </IOSText>
            
            <View style={styles.locationInfo}>
              <MapPin size={20} color={colors.primary} />
              <View style={styles.locationDetails}>
                <IOSText textStyle="callout" weight="semibold" color="label">
                  {event.location.name}
                </IOSText>
                <IOSText textStyle="footnote" color="tertiaryLabel">
                  {event.location.coordinates.latitude.toFixed(6)}, {event.location.coordinates.longitude.toFixed(6)}
                </IOSText>
              </View>
            </View>

            <IOSButton
              title="Get Directions"
              variant="tinted"
              size="medium"
              onPress={handleDirections}
              style={styles.directionsButton}
            />
          </IOSCard>

          {/* Sponsor Services Section */}
          {event.sponsorServices && (
            <IOSCard variant="elevated" style={styles.sponsorCard}>
              <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
                <IOSText textStyle="caption1" color="systemBlue" weight="semibold">
                  {event.sponsorServices.provider}{' '}
                </IOSText>
                {event.sponsorServices.title}
              </IOSText>
              
              <View style={styles.servicesGrid}>
                {event.sponsorServices.services.map((service, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <IOSText textStyle="callout" color="secondaryLabel">
                      • {service}
                    </IOSText>
                  </View>
                ))}
              </View>
            </IOSCard>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <IOSButton
              title="Add to Calendar"
              variant="filled"
              size="large"
              onPress={handleAddToCalendar}
              style={styles.actionButton}
            />
            
            <IOSButton
              title="Join Event Discussion"
              variant="tinted"
              size="large"
              onPress={handleJoinDiscussion}
              style={styles.actionButton}
            />
            
            <View style={styles.secondaryActions}>
              <IOSButton
                title="Dietary Requirements"
                variant="gray"
                size="medium"
                onPress={handleDietaryRequirements}
                style={styles.secondaryActionButton}
              />
              
              <IOSButton
                title="Check RSVP Status"
                variant="gray"
                size="medium"
                onPress={handleCheckRSVP}
                style={styles.secondaryActionButton}
              />
            </View>
          </View>
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
  eventTitle: {
    // Typography handled by IOSText
  },
  doneButton: {
    alignSelf: 'flex-start',
  },
  
  // Content
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Info Card
  infoCard: {
    marginBottom: 16,
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
  infoLabel: {
    marginBottom: 2,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBadge: {
    marginLeft: 8,
  },
  
  // Sections
  descriptionCard: {
    marginBottom: 16,
  },
  locationCard: {
    marginBottom: 16,
  },
  sponsorCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  description: {
    lineHeight: 22,
  },
  
  // Location
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  directionsButton: {
    alignSelf: 'flex-start',
  },
  
  // Sponsor Services
  servicesGrid: {
    gap: 4,
  },
  serviceItem: {
    paddingLeft: 8,
  },
  
  // Actions
  actionsSection: {
    paddingBottom: 32,
    gap: 12,
  },
  actionButton: {
    // Button styling handled by IOSButton
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
  },
});