import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import {
  X,
  MapPin,
  Clock,
  Phone,
  Globe,
  Mail,
  Calendar,
  Navigation,
  Users,
  Eye
} from 'lucide-react-native';
import { LocationDetailModalProps } from '../../types/sailingLocation';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';

const { colors, spacing, typography, shadows, borderRadius } = dragonChampionshipsLightTheme;

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  location,
  onClose,
  onScheduleNavigate
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Define snap points for the bottom sheet
  // Starts at 35% to show header + description without covering the map
  const snapPoints = useMemo(() => ['35%', '60%', '90%'], []);

  // Control bottom sheet based on location visibility
  useEffect(() => {
    if (location) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [location]);

  // Render backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Don't render if no location
  if (!location) return null;
  const handleContactPress = async (type: 'phone' | 'email' | 'website', value: string) => {
    try {
      let url = '';
      switch (type) {
        case 'phone':
          url = `tel:${value}`;
          break;
        case 'email':
          url = `mailto:${value}`;
          break;
        case 'website':
          url = value.startsWith('http') ? value : `https://${value}`;
          break;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open contact method');
    }
  };

  const handleGetDirections = () => {
    const { latitude, longitude } = location.coordinates;
    const encodedName = encodeURIComponent(location.name);
    const url = `https://maps.google.com/maps?q=${encodedName}&ll=${latitude},${longitude}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open Google Maps');
      }
    });
  };

  const getLocationTypeLabel = () => {
    switch (location.type) {
      case 'championship_hq':
        return 'Championship Headquarters';
      case 'race_course':
        return 'Race Course';
      case 'venue':
        return 'Championship Venue';
      case 'spectator_point':
        return 'Spectator Point';
      default:
        return 'Location';
    }
  };

  const getLocationIcon = () => {
    switch (location.type) {
      case 'championship_hq':
        return <MapPin size={20} color={colors.primary} />;
      case 'race_course':
        return <Navigation size={20} color={colors.primary} />;
      case 'venue':
        return <MapPin size={20} color={colors.primary} />;
      case 'spectator_point':
        return <Eye size={20} color={colors.primary} />;
      default:
        return <MapPin size={20} color={colors.primary} />;
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}  // Start at 35% to show name/description without covering map
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      {/* Header */}
      <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              {getLocationIcon()}
              <View style={styles.titleText}>
                <Text style={styles.title}>{location.name}</Text>
                <Text style={styles.subtitle}>{getLocationTypeLabel()}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {location.championshipSpecific && (
            <View style={styles.championshipBadge}>
              <Text style={styles.championshipBadgeText}>Championship 2027</Text>
            </View>
          )}
        </View>

      {/* Content - Scrollable with BottomSheetScrollView */}
      <BottomSheetScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.description}>{location.description}</Text>
          </View>

          {/* Championship Role */}
          {location.championshipRole && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Championship Role</Text>
              <Text style={styles.championshipRole}>{location.championshipRole}</Text>
            </View>
          )}

          {/* Address - Tappable to get directions */}
          {location.address && (
            <TouchableOpacity
              style={styles.addressSection}
              onPress={handleGetDirections}
              activeOpacity={0.7}
            >
              <View style={styles.addressHeader}>
                <MapPin size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Address</Text>
              </View>
              <Text style={styles.address}>{location.address}</Text>
              <View style={styles.directionHint}>
                <Navigation size={16} color={colors.primary} />
                <Text style={styles.directionHintText}>Tap for directions</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Inline Get Directions Button */}
          <TouchableOpacity
            style={styles.inlineDirectionsButton}
            onPress={handleGetDirections}
          >
            <Navigation size={20} color="#FFFFFF" />
            <Text style={styles.inlineDirectionsButtonText}>Get Directions</Text>
          </TouchableOpacity>

          {/* Operating Hours */}
          {location.operatingHours && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={16} color={colors.primary} />
                <Text style={styles.sectionTitle}>Hours</Text>
              </View>
              <Text style={styles.operatingHours}>{location.operatingHours}</Text>
            </View>
          )}

          {/* Facilities */}
          {location.facilities && location.facilities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Facilities</Text>
              {location.facilities.map((facility, index) => (
                <Text key={index} style={styles.facilityItem}>• {facility}</Text>
              ))}
            </View>
          )}

          {/* For Racers */}
          {location.racerInfo && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Navigation size={16} color={colors.primary} />
                <Text style={styles.sectionTitle}>For Racers</Text>
              </View>
              <Text style={styles.infoText}>{location.racerInfo}</Text>
            </View>
          )}

          {/* For Spectators */}
          {location.spectatorInfo && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users size={16} color={colors.primary} />
                <Text style={styles.sectionTitle}>For Spectators</Text>
              </View>
              <Text style={styles.infoText}>{location.spectatorInfo}</Text>
            </View>
          )}

          {/* Championship Events */}
          {location.championshipEvents && location.championshipEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={16} color={colors.primary} />
                <Text style={styles.sectionTitle}>Championship Events</Text>
              </View>
              {location.championshipEvents.map((event, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.eventItem}
                  onPress={() => {
                    if (onScheduleNavigate) {
                      onScheduleNavigate(event.date, event.event);
                    }
                  }}
                >
                  <View style={styles.eventContent}>
                    <Text style={styles.eventDate}>{event.date} at {event.time}</Text>
                    <Text style={styles.eventTitle}>{event.event}</Text>
                    {event.description && (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    )}
                  </View>
                  {onScheduleNavigate && (
                    <Calendar size={24} color={colors.primary} style={styles.eventIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Transportation */}
          {location.transportation && location.transportation.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transportation</Text>
              {location.transportation.map((transport, index) => (
                <View key={index} style={styles.transportItem}>
                  <Text style={styles.transportType}>{transport.type.toUpperCase()}: {transport.route}</Text>
                  {transport.schedule && (
                    <Text style={styles.transportDetail}>Schedule: {transport.schedule}</Text>
                  )}
                  {transport.cost && (
                    <Text style={styles.transportDetail}>Cost: {transport.cost}</Text>
                  )}
                  {transport.notes && (
                    <Text style={styles.transportNotes}>{transport.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Contact Information */}
          {location.contact && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              
              {location.contact.phone && (
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => handleContactPress('phone', location.contact!.phone!)}
                >
                  <Phone size={16} color={colors.primary} />
                  <Text style={styles.contactText}>{location.contact.phone}</Text>
                </TouchableOpacity>
              )}
              
              {location.contact.email && (
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => handleContactPress('email', location.contact!.email!)}
                >
                  <Mail size={16} color={colors.primary} />
                  <Text style={styles.contactText}>{location.contact.email}</Text>
                </TouchableOpacity>
              )}
              
              {location.contact.website && (
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => handleContactPress('website', location.contact!.website!)}
                >
                  <Globe size={16} color={colors.primary} />
                  <Text style={styles.contactText}>{location.contact.website}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  // BottomSheet styles
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: colors.textMuted,
    width: 40,
    height: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.cardMedium,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.text,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  championshipBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  championshipBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 120, // Extra padding for floating tab bar
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.text,
    lineHeight: 22,
  },
  championshipRole: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  address: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  addressSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  directionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  directionHintText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  inlineDirectionsButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.cardMedium,
    elevation: 3,
  },
  inlineDirectionsButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  operatingHours: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  facilityItem: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: 2,
  },
  infoText: {
    ...typography.bodyMedium,
    color: colors.text,
    lineHeight: 20,
  },
  eventItem: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  eventIcon: {
    width: 24,
    height: 24,
  },
  eventDate: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  eventTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  eventDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  transportItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  transportType: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  transportDetail: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  transportNotes: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  contactText: {
    ...typography.bodyMedium,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'android' ? spacing.xl : spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
    ...shadows.cardMedium,
    elevation: 8, // Android shadow
  },
  directionsButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  directionsButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});