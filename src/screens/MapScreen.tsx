import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Navigation, Layers, Info, Settings } from 'lucide-react-native';

import { InteractiveRaceMap } from '../components/maps/InteractiveRaceMap';
import { IOSText } from '../components/ui/IOSText';
import { IOSButton } from '../components/ui/IOSButton';
import { IOSCard } from '../components/ui/IOSCard';
import { IOSSegmentedControl } from '../components/ui/IOSSegmentedControl';
import { useUserStore } from '../stores/userStore';
import GarminService, { SponsorLocation, RaceAreaBoundary, NavigationRoute } from '../services/garminService';

interface MapScreenProps {
  navigation: any;
}

interface LocationDetails {
  location: SponsorLocation | RaceAreaBoundary;
  route?: NavigationRoute;
  isNavigating: boolean;
}

const { width, height } = Dimensions.get('window');

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const userStore = useUserStore();
  const user = userStore();
  
  const [mapMode, setMapMode] = useState<'racing' | 'navigation' | 'services'>('racing');
  const [selectedLocation, setSelectedLocation] = useState<LocationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [garminService] = useState(() => new GarminService(userStore));

  const mapModeOptions = [
    { label: 'Racing', value: 'racing' },
    { label: 'Navigation', value: 'navigation' },
    { label: 'Services', value: 'services' }
  ];

  const handleLocationSelect = async (location: SponsorLocation | RaceAreaBoundary) => {
    try {
      setSelectedLocation({
        location,
        isNavigating: false
      });
    } catch (error) {
      console.error('Error selecting location:', error);
      Alert.alert('Error', 'Failed to select location');
    }
  };

  const handleStartNavigation = async () => {
    if (!selectedLocation) return;
    
    try {
      setIsLoading(true);
      
      // Get user's current location (mock for demo)
      const currentLocation = {
        latitude: 22.2830,
        longitude: 114.1650
      };
      
      const targetCoordinate = 'coordinates' in selectedLocation.location 
        ? selectedLocation.location.coordinates
        : selectedLocation.location.coordinates[0];
        
      const route = await garminService.calculateRoute(currentLocation, targetCoordinate);
      
      setSelectedLocation(prev => prev ? {
        ...prev,
        route,
        isNavigating: true
      } : null);
      
      Alert.alert(
        'Navigation Started',
        `Route to ${selectedLocation.location.name}\nDistance: ${route.distance.toFixed(1)} nm\nETA: ${Math.round(route.estimatedTime)} minutes`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error starting navigation:', error);
      Alert.alert('Navigation Error', 'Failed to calculate route');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopNavigation = () => {
    setSelectedLocation(prev => prev ? {
      ...prev,
      route: undefined,
      isNavigating: false
    } : null);
  };

  const getLocationTypeDescription = (location: SponsorLocation | RaceAreaBoundary): string => {
    if ('sponsor' in location) {
      const sponsorLocation = location as SponsorLocation;
      switch (sponsorLocation.sponsor) {
        case 'HSBC':
          return sponsorLocation.type === 'ATM' ? 'Banking Services' : 'Premier Banking';
        case 'Sino_Group':
          return 'Luxury Hospitality';
        case 'BMW':
          return 'Transport Services';
        case 'Garmin':
          return 'Marine Navigation';
        default:
          return 'Services';
      }
    } else {
      const raceArea = location as RaceAreaBoundary;
      switch (raceArea.type) {
        case 'start_line':
          return 'Race Start';
        case 'finish_line':
          return 'Race Finish';
        case 'mark':
          return 'Racing Mark';
        case 'prohibited_area':
          return 'Restricted Area';
        default:
          return 'Race Area';
      }
    }
  };

  const getAccessLevel = (): string => {
    switch (user.userType) {
      case 'participant':
        return 'Professional Charts & Navigation';
      case 'vip':
        return 'Premium Services & VIP Access';
      default:
        return 'Basic Navigation';
    }
  };

  const renderLocationDetails = () => {
    if (!selectedLocation) return null;
    
    const { location, route, isNavigating } = selectedLocation;
    const isSponsorLocation = 'sponsor' in location;
    
    return (
      <IOSCard style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <View style={styles.locationInfo}>
            <IOSText style={styles.locationName}>{location.name}</IOSText>
            <IOSText style={styles.locationType}>
              {getLocationTypeDescription(location)}
            </IOSText>
            {isSponsorLocation && (
              <IOSText style={styles.locationAddress}>
                {(location as SponsorLocation).address}
              </IOSText>
            )}
          </View>
          <IOSButton
            title={isNavigating ? "Stop" : "Navigate"}
            onPress={isNavigating ? handleStopNavigation : handleStartNavigation}
            variant={isNavigating ? "secondary" : "primary"}
            size="small"
            disabled={isLoading}
            style={styles.navButton}
          />
        </View>
        
        {location.description && (
          <IOSText style={styles.locationDescription}>
            {location.description}
          </IOSText>
        )}
        
        {isSponsorLocation && (
          <View style={styles.servicesContainer}>
            <IOSText style={styles.servicesTitle}>Available Services:</IOSText>
            {(location as SponsorLocation).services.map((service, index) => (
              <IOSText key={index} style={styles.serviceItem}>• {service}</IOSText>
            ))}
            
            {(location as SponsorLocation).contact && (
              <View style={styles.contactInfo}>
                <IOSText style={styles.contactLabel}>Contact:</IOSText>
                {(location as SponsorLocation).contact?.phone && (
                  <IOSText style={styles.contactText}>
                    📞 {(location as SponsorLocation).contact!.phone}
                  </IOSText>
                )}
                {(location as SponsorLocation).contact?.website && (
                  <IOSText style={styles.contactText}>
                    🌐 {(location as SponsorLocation).contact!.website}
                  </IOSText>
                )}
              </View>
            )}
          </View>
        )}
        
        {route && (
          <View style={styles.routeInfo}>
            <IOSText style={styles.routeTitle}>Navigation Route</IOSText>
            <View style={styles.routeStats}>
              <View style={styles.routeStat}>
                <IOSText style={styles.routeStatLabel}>Distance</IOSText>
                <IOSText style={styles.routeStatValue}>{route.distance.toFixed(1)} nm</IOSText>
              </View>
              <View style={styles.routeStat}>
                <IOSText style={styles.routeStatLabel}>ETA</IOSText>
                <IOSText style={styles.routeStatValue}>{Math.round(route.estimatedTime)} min</IOSText>
              </View>
            </View>
            
            {route.safetyNotes.length > 0 && (
              <View style={styles.safetyNotes}>
                <IOSText style={styles.safetyTitle}>⚠️ Safety Notes:</IOSText>
                {route.safetyNotes.map((note, index) => (
                  <IOSText key={index} style={styles.safetyNote}>• {note}</IOSText>
                ))}
              </View>
            )}
          </View>
        )}
      </IOSCard>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IOSText style={styles.headerTitle}>Marine Navigation</IOSText>
        <IOSText style={styles.accessLevel}>{getAccessLevel()}</IOSText>
      </View>
      
      <IOSSegmentedControl
        options={mapModeOptions}
        selectedValue={mapMode}
        onValueChange={(value) => setMapMode(value as 'racing' | 'navigation' | 'services')}
        style={styles.segmentedControl}
      />
      
      <View style={styles.mapContainer}>
        <InteractiveRaceMap
          showRaceAreas={mapMode === 'racing' || mapMode === 'navigation'}
          showSponsorLocations={mapMode === 'services' || mapMode === 'navigation'}
          showNavigation={mapMode === 'navigation'}
          selectedLocationId={selectedLocation?.location.id}
          onLocationSelect={handleLocationSelect}
          initialRegion={{
            latitude: 22.2830,
            longitude: 114.1650,
            latitudeDelta: mapMode === 'racing' ? 0.0422 : 0.0922,
            longitudeDelta: mapMode === 'racing' ? 0.0221 : 0.0421,
          }}
        />
      </View>
      
      {selectedLocation && (
        <ScrollView 
          style={styles.detailsContainer}
          contentContainerStyle={styles.detailsContent}
          showsVerticalScrollIndicator={false}
        >
          {renderLocationDetails()}
        </ScrollView>
      )}
      
      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <IOSButton
          title="Weather Overlay"
          onPress={() => navigation.navigate('Weather')}
          variant="secondary"
          size="small"
          icon={<Layers size={16} color="#007AFF" />}
        />
        {user.userType === 'participant' && (
          <IOSButton
            title="Race Areas"
            onPress={() => setMapMode('racing')}
            variant={mapMode === 'racing' ? 'primary' : 'secondary'}
            size="small"
            icon={<MapPin size={16} color={mapMode === 'racing' ? "#FFFFFF" : "#007AFF"} />}
          />
        )}
        <IOSButton
          title="Services"
          onPress={() => setMapMode('services')}
          variant={mapMode === 'services' ? 'primary' : 'secondary'}
          size="small"
          icon={<Navigation size={16} color={mapMode === 'services' ? "#FFFFFF" : "#007AFF"} />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  accessLevel: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
  },
  segmentedControl: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  mapContainer: {
    flex: 1,
  },
  detailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.4,
    backgroundColor: 'transparent',
  },
  detailsContent: {
    padding: 16,
  },
  locationCard: {
    padding: 16,
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  locationType: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: '#8E8E93',
  },
  locationDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  navButton: {
    minWidth: 80,
  },
  servicesContainer: {
    marginTop: 8,
  },
  servicesTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  serviceItem: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 2,
  },
  contactInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#007AFF',
    marginBottom: 2,
  },
  routeInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  routeTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeStat: {
    flex: 1,
    alignItems: 'center',
  },
  routeStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  routeStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  safetyNotes: {
    marginTop: 8,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF9500',
    marginBottom: 4,
  },
  safetyNote: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
  },
  quickActions: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
});