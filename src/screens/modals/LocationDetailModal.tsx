import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
} from 'lucide-react-native';

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
  championshipRole?: string;
  address?: string;
  hours?: string;
  facilities?: string[];
  forRacers?: string;
  forSpectators?: string;
  transportation?: Array<{
    title: string;
    details?: string;
  }>;
}

interface LocationDetailModalProps {
  location: LocationDetail;
  visible: boolean;
  onClose: () => void;
}

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  location,
  visible,
  onClose
}) => {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;

  // DEBUG: Log layout info
  React.useEffect(() => {
    if (visible) {
    }
  }, [visible, screenHeight, insets.bottom]);

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

  const getWindCondition = (speed: number) => {
    if (speed < 7) return { text: 'Light', color: '#34C759' };
    if (speed < 15) return { text: 'Moderate', color: '#007AFF' };
    if (speed < 25) return { text: 'Strong', color: '#FF9500' };
    return { text: 'Gale', color: '#FF3B30' };
  };

  const handleGetDirections = () => {
    // Open directions logic
  };

  const windCondition = location.currentConditions
    ? getWindCondition(location.currentConditions.windSpeed)
    : null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={styles.modalOverlay}
        onStartShouldSetResponder={() => {
          return false; // Don't intercept
        }}
      >
        <View
          style={[
            styles.modalContainer,
            {
              maxHeight: screenHeight * 0.9,
              paddingBottom: insets.bottom || 16,
            }
          ]}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
          }}
        >
          {/* FIXED HEADER */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.venueName}>{location.name}</Text>
              <Text style={styles.venueType}>{getLocationTypeDisplay(location.type)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* SCROLLABLE CONTENT - CRITICAL FOR ANDROID */}
          <ScrollView
            style={[styles.scrollView, { backgroundColor: 'red' }]} // DEBUG: see if ScrollView exists
            contentContainerStyle={[
              styles.scrollViewContent,
              { backgroundColor: 'blue', minHeight: 2000 } // DEBUG: see content area & force scrolling
            ]}
            showsVerticalScrollIndicator={true}
            bounces={true}
            nestedScrollEnabled={true}
            scrollEnabled={true} // Explicitly enable
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false} // Android optimization that can break scrolling
            onScroll={() => console.log('🔴 SCROLLING EVENT DETECTED')} // Verify scroll events
            scrollEventThrottle={16}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
            }}
            onContentSizeChange={(width, height) => {
            }}
            onTouchStart={() => console.log('🔍 [ANDROID DEBUG] Touch START on ScrollView')}
            onTouchEnd={() => console.log('🔍 [ANDROID DEBUG] Touch END on ScrollView')}
            onScrollBeginDrag={() => console.log('🔍 [ANDROID DEBUG] Scroll BEGIN DRAG')}
            onScrollEndDrag={() => console.log('🔍 [ANDROID DEBUG] Scroll END DRAG')}
          >
            {/* Championship Badge */}
            {location.championshipRole && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Championship 2027</Text>
              </View>
            )}

            {/* Description */}
            <Text style={styles.description}>{location.description}</Text>

            {/* Championship Role */}
            {location.championshipRole && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Championship Role</Text>
                <Text style={styles.roleText}>{location.championshipRole}</Text>
              </View>
            )}

            {/* Coordinates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Coordinates</Text>
              <View style={styles.coordinatesRow}>
                <MapPin size={20} color="#0066CC" />
                <View style={styles.coordinatesText}>
                  <Text style={styles.sectionContent}>
                    {location.coordinates.latitude.toFixed(6)}°N
                  </Text>
                  <Text style={styles.sectionContent}>
                    {location.coordinates.longitude.toFixed(6)}°E
                  </Text>
                </View>
              </View>
            </View>

            {/* Address */}
            {location.address && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📍 Address</Text>
                <Text style={styles.sectionContent}>{location.address}</Text>
              </View>
            )}

            {/* Hours */}
            {location.hours && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🕐 Hours</Text>
                <Text style={styles.sectionContent}>{location.hours}</Text>
              </View>
            )}

            {/* Current Conditions */}
            {location.currentConditions && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Conditions</Text>

                {/* Wind */}
                <View style={styles.conditionRow}>
                  <Wind size={20} color="#0066CC" />
                  <View style={styles.conditionContent}>
                    <Text style={styles.conditionLabel}>Wind</Text>
                    <View style={styles.conditionValueRow}>
                      <Text style={styles.conditionValue}>
                        {location.currentConditions.windSpeed} kts @ {location.currentConditions.windDirection}°
                      </Text>
                      {windCondition && (
                        <View style={[styles.conditionBadge, { backgroundColor: windCondition.color }]}>
                          <Text style={styles.conditionBadgeText}>{windCondition.text}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Waves */}
                <View style={styles.conditionRow}>
                  <Waves size={20} color="#00ACC1" />
                  <View style={styles.conditionContent}>
                    <Text style={styles.conditionLabel}>Wave Height</Text>
                    <Text style={styles.conditionValue}>
                      {location.currentConditions.waveHeight} m
                    </Text>
                  </View>
                </View>

                {/* Tide */}
                <View style={styles.conditionRow}>
                  {location.currentConditions.tideType === 'high' ?
                    <ArrowUp size={20} color="#34C759" /> :
                    <ArrowDown size={20} color="#FF3B30" />
                  }
                  <View style={styles.conditionContent}>
                    <Text style={styles.conditionLabel}>Tide</Text>
                    <View style={styles.conditionValueRow}>
                      <Text style={styles.conditionValue}>
                        {location.currentConditions.tideHeight.toFixed(1)}m
                      </Text>
                      <View style={[
                        styles.conditionBadge,
                        { backgroundColor: location.currentConditions.tideType === 'high' ? '#007AFF' : '#34C759' }
                      ]}>
                        <Text style={styles.conditionBadgeText}>
                          {location.currentConditions.tideType.toUpperCase()} at {location.currentConditions.tideTime}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Facilities */}
            {location.facilities && location.facilities.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Facilities</Text>
                {location.facilities.map((facility, index) => (
                  <Text key={index} style={styles.facilityItem}>
                    • {facility}
                  </Text>
                ))}
              </View>
            )}

            {/* Services */}
            {location.services && location.services.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                {location.services.map((service, index) => (
                  <Text key={index} style={styles.facilityItem}>
                    • {service}
                  </Text>
                ))}
              </View>
            )}

            {/* For Racers */}
            {location.forRacers && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⛵ For Racers</Text>
                <Text style={styles.sectionContent}>{location.forRacers}</Text>
              </View>
            )}

            {/* For Spectators */}
            {location.forSpectators && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👥 For Spectators</Text>
                <Text style={styles.sectionContent}>{location.forSpectators}</Text>
              </View>
            )}

            {/* Transportation */}
            {location.transportation && location.transportation.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transportation</Text>
                {location.transportation.map((transport, index) => (
                  <View key={index} style={styles.transportCard}>
                    <Text style={styles.transportTitle}>{transport.title}</Text>
                    {transport.details && (
                      <Text style={styles.transportDetails}>
                        {transport.details}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Contact */}
            {location.contactInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                {location.contactInfo.phone && (
                  <View style={styles.contactRow}>
                    <Phone size={20} color="#0066CC" />
                    <Text style={styles.contactItem}>{location.contactInfo.phone}</Text>
                  </View>
                )}
                {location.contactInfo.email && (
                  <View style={styles.contactRow}>
                    <Mail size={20} color="#0066CC" />
                    <Text style={styles.contactItem}>{location.contactInfo.email}</Text>
                  </View>
                )}
                {location.contactInfo.website && (
                  <View style={styles.contactRow}>
                    <Globe size={20} color="#0066CC" />
                    <Text style={styles.contactItem}>{location.contactInfo.website}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Extra padding at bottom so last content isn't hidden by button */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* FIXED BUTTON AT BOTTOM */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={handleGetDirections}
            >
              <Text style={styles.directionsButtonText}>
                🧭 Get Directions
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // CRITICAL: DO NOT USE flex: 1 here - it breaks Android scrolling
    // Instead use maxHeight as set in component
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    // This header is NOT scrollable
  },

  headerContent: {
    flex: 1,
    marginRight: 16,
  },

  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },

  venueType: {
    fontSize: 14,
    color: '#666666',
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButtonText: {
    fontSize: 20,
    color: '#666666',
  },

  // CRITICAL: ScrollView MUST have style with flex: 1 for Android
  scrollView: {
    flex: 1,
  },

  // Content inside ScrollView
  scrollViewContent: {
    padding: 16,
    paddingBottom: 24,
  },

  badge: {
    backgroundColor: '#0066CC',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 16,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  description: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 20,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },

  sectionContent: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },

  roleText: {
    fontSize: 15,
    color: '#0066CC',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  coordinatesText: {
    marginLeft: 12,
    gap: 4,
  },

  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  conditionContent: {
    flex: 1,
    marginLeft: 12,
  },

  conditionLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },

  conditionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  conditionValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  conditionBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  facilityItem: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 24,
    paddingLeft: 8,
  },

  transportCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0066CC',
  },

  transportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },

  transportDetails: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  contactItem: {
    fontSize: 14,
    color: '#0066CC',
    marginLeft: 12,
  },

  // FIXED BUTTON CONTAINER
  buttonContainer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    // This is NOT in the ScrollView - it's fixed at bottom
  },

  directionsButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  directionsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
