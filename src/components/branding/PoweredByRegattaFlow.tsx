import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Anchor, ExternalLink } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { REGATTA_FLOW_BRANDING, getAttributionText, getWebsiteUrl } from '../../constants/regattaFlowBranding';

interface PoweredByRegattaFlowProps {
  /** Style variant */
  variant?: 'minimal' | 'standard' | 'detailed';
  /** Attribution text style */
  textStyle?: 'powered' | 'developed' | 'full';
  /** Show company logo */
  showLogo?: boolean;
  /** Show external link icon */
  showExternalLink?: boolean;
  /** Make the component clickable to open website */
  clickable?: boolean;
  /** Custom text color */
  textColor?: string;
  /** Custom background color */
  backgroundColor?: string;
  /** Show as card with border and padding */
  asCard?: boolean;
}

const openWebsite = async () => {
  try {
    await Haptics.selectionAsync();
    const url = getWebsiteUrl();
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Could not open RegattaFlow website');
    }
  } catch (error) {
    Alert.alert('Error', 'Could not open RegattaFlow website');
  }
};

export function PoweredByRegattaFlow({
  variant = 'standard',
  textStyle = 'powered',
  showLogo = true,
  showExternalLink = true,
  clickable = true,
  textColor = REGATTA_FLOW_BRANDING.colors.textMuted,
  backgroundColor = 'transparent',
  asCard = false,
}: PoweredByRegattaFlowProps) {
  const attributionText = getAttributionText(textStyle);

  const renderContent = () => {
    switch (variant) {
      case 'minimal':
        return (
          <View style={styles.contentRow}>
            <Text style={[styles.text, { color: textColor }]}>{attributionText}</Text>
            {showExternalLink && clickable && (
              <ExternalLink size={12} color={textColor} style={styles.externalIcon} />
            )}
          </View>
        );

      case 'detailed':
        return (
          <View style={styles.detailedContent}>
            {showLogo && (
              <View style={styles.logoContainer}>
                <Anchor size={20} color={REGATTA_FLOW_BRANDING.colors.primary} strokeWidth={2} />
              </View>
            )}
            <View style={styles.detailedText}>
              <Text style={[styles.companyName, { color: REGATTA_FLOW_BRANDING.colors.primary }]}>
                {REGATTA_FLOW_BRANDING.name}
              </Text>
              <Text style={[styles.tagline, { color: textColor }]}>
                {REGATTA_FLOW_BRANDING.tagline}
              </Text>
              {showExternalLink && clickable && (
                <Text style={[styles.linkText, { color: REGATTA_FLOW_BRANDING.colors.accent }]}>
                  Visit our website →
                </Text>
              )}
            </View>
          </View>
        );

      default: // standard
        return (
          <View style={styles.contentRow}>
            {showLogo && (
              <View style={styles.miniLogoContainer}>
                <Anchor size={16} color={REGATTA_FLOW_BRANDING.colors.primary} strokeWidth={2} />
              </View>
            )}
            <Text style={[styles.text, { color: textColor }]}>{attributionText}</Text>
            {showExternalLink && clickable && (
              <ExternalLink size={14} color={textColor} style={styles.externalIcon} />
            )}
          </View>
        );
    }
  };

  const containerStyle = [
    styles.container,
    { backgroundColor },
    asCard && styles.cardStyle,
  ];

  if (clickable) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={openWebsite}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${attributionText}. Tap to visit website.`}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStyle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedText: {
    marginLeft: 12,
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${REGATTA_FLOW_BRANDING.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLogoContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${REGATTA_FLOW_BRANDING.colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  tagline: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  externalIcon: {
    marginLeft: 6,
  },
});

// Convenience components for common use cases
export const PoweredByFooter = () => (
  <PoweredByRegattaFlow
    variant="minimal"
    textStyle="powered"
    showLogo={false}
    textColor="#8E8E93"
  />
);

export const AboutRegattaFlowCard = () => (
  <PoweredByRegattaFlow
    variant="detailed"
    textStyle="full"
    asCard={true}
    clickable={true}
  />
);

export const DevelopedByAttribution = () => (
  <PoweredByRegattaFlow
    variant="standard"
    textStyle="developed"
    showLogo={true}
    clickable={true}
  />
);