import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ship, MapPin, Package, ExternalLink, Clock } from 'lucide-react-native';

export function ShippingScreen() {
  const handleContactPress = async () => {
    const url = 'https://www.centraloceans.com';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header - MoreScreen handles safe area + back button padding */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shipping Tracker</Text>
        <Text style={styles.headerSubtitle}>Track your boat container</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Coming Soon Card */}
        <View style={styles.comingSoonCard}>
          <View style={styles.iconContainer}>
            <Ship color="#007AFF" size={64} strokeWidth={1.5} />
          </View>

          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonDescription}>
            Track your Dragon class boat shipment to Hong Kong in real-time.
            Get updates on container location, estimated arrival, and customs clearance.
          </Text>

          {/* Feature Preview */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <MapPin color="#007AFF" size={24} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Live Tracking</Text>
                <Text style={styles.featureDescription}>
                  Real-time container location updates
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Package color="#007AFF" size={24} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Shipment Details</Text>
                <Text style={styles.featureDescription}>
                  Container info, vessel details, and route
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Clock color="#007AFF" size={24} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>ETA Notifications</Text>
                <Text style={styles.featureDescription}>
                  Get alerts on arrival and customs status
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Freight Partner Info */}
        <View style={styles.partnerCard}>
          <Text style={styles.partnerLabel}>Official Freight Partner</Text>
          <Text style={styles.partnerName}>Central Oceans (Hong Kong)</Text>
          <Text style={styles.partnerDescription}>
            Specializing in yacht and sailboat shipping to Hong Kong with
            full container load (FCL) and custom crating services.
          </Text>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactPress}
          >
            <Text style={styles.contactButtonText}>Visit Website</Text>
            <ExternalLink color="#FFFFFF" size={16} />
          </TouchableOpacity>
        </View>

        {/* Shipping Routes Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Shipping Routes to Hong Kong</Text>

          <Text style={styles.routeHeader}>From Europe</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Rotterdam, Hamburg, Antwerp, Felixstowe</Text>
              <Text style={styles.timelineValue}>30-45 days*</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Fos Sur Mer, Valencia, Genoa</Text>
              <Text style={styles.timelineValue}>30-45 days*</Text>
            </View>
          </View>

          <Text style={styles.routeNote}>*via Suez Canal (shorter) or Cape (longer transit time) - subject to restrictions</Text>

          <Text style={[styles.routeHeader, { marginTop: 16 }]}>From Australia & Japan</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Fremantle, Melbourne</Text>
              <Text style={styles.timelineValue}>15-25 days</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.timelineDotLast]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Osaka, Japan</Text>
              <Text style={styles.timelineValue}>3-5 days</Text>
            </View>
          </View>
        </View>

        {/* Subsidized Shipping Info */}
        <View style={styles.subsidyCard}>
          <Text style={styles.subsidyTitle}>Subsidized Shipping Available</Text>
          <Text style={styles.subsidyText}>
            The RHKYC and sponsors will subsidize the shipping and logistics of transporting your Dragon in and out of Hong Kong. A shipping package is available to facilitate the participation of international teams.
          </Text>
        </View>

        {/* Charter Boats Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Charter Boats</Text>
          <Text style={styles.charterText}>
            Up to 20 charter boats expected to be available for the championship.
            Contact the organizing committee for availability and pricing.
          </Text>
        </View>

        {/* Bottom Spacing for Tab Bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  comingSoonDescription: {
    fontSize: 15,
    color: '#6C6C70',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  featureText: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  partnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  partnerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  partnerDescription: {
    fontSize: 14,
    color: '#6C6C70',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginTop: 4,
    marginRight: 16,
  },
  timelineDotLast: {
    backgroundColor: '#34C759',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5EA',
    paddingLeft: 16,
    marginLeft: -22,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  routeHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
    marginTop: 4,
  },
  routeNote: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  subsidyCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#B3D9F2',
  },
  subsidyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066CC',
    marginBottom: 8,
  },
  subsidyText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  charterText: {
    fontSize: 14,
    color: '#6C6C70',
    lineHeight: 20,
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 100, // Space for floating tab bar
  },
});

export default ShippingScreen;
