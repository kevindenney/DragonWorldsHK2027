import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Anchor, Building, MapPin, Eye, ShoppingBag, Store, Hotel, Wrench } from 'lucide-react-native';
import { SailingLocationMarkerProps, SailingLocationType } from '../../types/sailingLocation';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';

const { colors } = dragonChampionshipsLightTheme;

export const SailingLocationMarker: React.FC<SailingLocationMarkerProps> = ({
  location,
  isSelected,
  onPress
}) => {
  const getMarkerIcon = (type: SailingLocationType) => {
    const iconSize = 20;
    const iconColor = '#FFFFFF';
    
    switch (type) {
      case 'championship_hq':
        return <Anchor size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'race_course':
        return <MapPin size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'venue':
        return <Building size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'marina':
        return <Anchor size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'yacht_club':
        return <Building size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'chandlery':
        return <Wrench size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'gear_store':
        return <ShoppingBag size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'hotel':
        return <Hotel size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'support_service':
        return <Building size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'transport_hub':
        return <MapPin size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'spectator_point':
        return <Eye size={iconSize} color={iconColor} strokeWidth={2} />;
      default:
        return <MapPin size={iconSize} color={iconColor} strokeWidth={2} />;
    }
  };

  const getMarkerColor = (type: SailingLocationType, importance: string) => {
    // Primary locations get more vibrant colors
    const isPrimary = importance === 'primary';
    
    switch (type) {
      case 'championship_hq':
        return isPrimary ? '#DC2626' : '#EF4444'; // Red for championship HQ
      case 'race_course':
        return isPrimary ? '#2563EB' : '#3B82F6'; // Blue for race course
      case 'venue':
        return isPrimary ? '#059669' : '#10B981'; // Green for championship venues
      case 'marina':
        return isPrimary ? '#0891B2' : '#06B6D4'; // Cyan for marinas
      case 'yacht_club':
        return isPrimary ? '#0891B2' : '#67E8F9'; // Light cyan for yacht clubs
      case 'chandlery':
        return isPrimary ? '#EA580C' : '#FB923C'; // Orange for chandleries
      case 'gear_store':
        return isPrimary ? '#D97706' : '#FBBF24'; // Amber for gear stores
      case 'hotel':
        return isPrimary ? '#7C3AED' : '#A78BFA'; // Purple for hotels
      case 'support_service':
        return isPrimary ? '#059669' : '#34D399'; // Green for support services
      case 'transport_hub':
        return isPrimary ? '#6B7280' : '#9CA3AF'; // Gray for transport
      case 'spectator_point':
        return isPrimary ? '#BE185D' : '#EC4899'; // Pink for spectator points
      default:
        return '#6B7280'; // Gray for default
    }
  };

  const markerColor = getMarkerColor(location.type, location.importance);
  
  return (
    <View style={[
      styles.markerContainer,
      { backgroundColor: markerColor },
      isSelected && styles.selectedMarker,
      location.importance === 'primary' && styles.primaryMarker
    ]}>
      {getMarkerIcon(location.type)}
      
      {/* Championship-specific indicator */}
      {location.championshipSpecific && (
        <View style={styles.championshipIndicator} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedMarker: {
    borderColor: '#FFD700', // Gold border for selected
    borderWidth: 3,
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  primaryMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
  },
  championshipIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});