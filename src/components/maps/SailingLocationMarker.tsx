import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Anchor, Building, MapPin, Eye, ShoppingBag, Hotel, Wrench, Bus } from 'lucide-react-native';
import { SailingLocationMarkerProps, SailingLocationType } from '../../types/sailingLocation';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';

const { colors } = dragonChampionshipsLightTheme;

/**
 * Simplified semantic color palette (Apple HIG compliant)
 * 4 distinct colors for clear visual hierarchy
 */
const MARKER_COLORS = {
  // Championship/Critical - Red (high priority, race-related)
  championship: '#DC2626',

  // Water/Navigation - Blue (race courses, marinas, yacht clubs)
  water: '#2563EB',

  // Services - Green (gear, chandlery, support)
  services: '#059669',

  // Neutral - Gray (transport, tourism, hotels)
  neutral: '#6B7280',
} as const;

export const SailingLocationMarker: React.FC<SailingLocationMarkerProps> = ({
  location,
  isSelected
}) => {
  // Animation values
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const labelTranslateY = useRef(new Animated.Value(-8)).current;
  const markerScale = useRef(new Animated.Value(1)).current;

  // Animate label appearance when selected
  useEffect(() => {
    if (isSelected) {
      // Animate in
      Animated.parallel([
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(labelTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(markerScale, {
          toValue: 1.15,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset
      labelOpacity.setValue(0);
      labelTranslateY.setValue(-8);
      Animated.spring(markerScale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected]);

  const getMarkerIcon = (type: SailingLocationType) => {
    const iconSize = 20;
    const iconColor = '#FFFFFF';

    switch (type) {
      case 'championship_hq':
        return <Building size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'race_course':
        return <MapPin size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'venue':
        return <Building size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'marina':
        return <Anchor size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'yacht_club':
        return <Anchor size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'chandlery':
        return <Wrench size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'gear_store':
        return <ShoppingBag size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'hotel':
        return <Hotel size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'support_service':
        return <Wrench size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'transport_hub':
        return <Bus size={iconSize} color={iconColor} strokeWidth={2} />;
      case 'spectator_point':
        return <Eye size={iconSize} color={iconColor} strokeWidth={2} />;
      default:
        return <MapPin size={iconSize} color={iconColor} strokeWidth={2} />;
    }
  };

  /**
   * Simplified color mapping based on semantic categories
   * Primary importance gets slightly darker shade
   */
  const getMarkerColor = (type: SailingLocationType, importance: string): string => {
    const isPrimary = importance === 'primary';

    switch (type) {
      // Championship/Critical locations - Red
      case 'championship_hq':
      case 'race_course':
      case 'venue':
        return isPrimary ? MARKER_COLORS.championship : '#EF4444';

      // Water/Navigation locations - Blue
      case 'marina':
      case 'yacht_club':
      case 'spectator_point':
        return isPrimary ? MARKER_COLORS.water : '#3B82F6';

      // Services - Green
      case 'chandlery':
      case 'gear_store':
      case 'support_service':
        return isPrimary ? MARKER_COLORS.services : '#10B981';

      // Neutral - Gray
      case 'transport_hub':
      case 'hotel':
      default:
        return isPrimary ? MARKER_COLORS.neutral : '#9CA3AF';
    }
  };

  const markerColor = getMarkerColor(location.type, location.importance);

  return (
    <View style={styles.markerWrapper}>
      {/* Location name label - animated when selected */}
      {isSelected && (
        <Animated.View
          style={[
            styles.labelContainer,
            {
              opacity: labelOpacity,
              transform: [{ translateY: labelTranslateY }],
            }
          ]}
        >
          <View style={styles.labelBubble}>
            <Text style={styles.labelText} numberOfLines={1}>
              {location.name}
            </Text>
          </View>
          <View style={styles.labelArrow} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.markerContainer,
          {
            backgroundColor: markerColor,
            transform: [{ scale: markerScale }],
          },
          isSelected && styles.selectedMarker,
          location.importance === 'primary' && styles.primaryMarker
        ]}
      >
        {getMarkerIcon(location.type)}

        {/* Championship-specific indicator */}
        {location.championshipSpecific && (
          <View style={styles.championshipIndicator} />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  markerWrapper: {
    alignItems: 'center',
  },
  labelContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  labelBubble: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  labelArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.surface,
    marginTop: -1,
  },
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
    borderColor: colors.primary,
    borderWidth: 3,
    // Scale is now handled by Animated
    shadowOpacity: 0.35,
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
