import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOSText } from '../components/ios';
import { colors } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SponsorLogo {
  id: string;
  name: string;
  logo: any; // require() statement
  tier: 'title' | 'major' | 'aligned';
  size: 'large' | 'medium' | 'small';
}

// Sponsor logo configuration based on brand hierarchy
const sponsorLogos: SponsorLogo[] = [
  {
    id: 'hsbc',
    name: 'HSBC',
    logo: require('../assets/sponsors/hsbc-logo.png'), // Will need actual logo files
    tier: 'title',
    size: 'large'
  },
  {
    id: 'sino',
    name: 'Sino Group',
    logo: require('../assets/sponsors/sino-logo.png'),
    tier: 'major', 
    size: 'medium'
  },
  {
    id: 'predictwind',
    name: 'PredictWind',
    logo: require('../assets/sponsors/predictwind-logo.png'),
    tier: 'aligned',
    size: 'small'
  },
  {
    id: 'garmin',
    name: 'Garmin',
    logo: require('../assets/sponsors/garmin-logo.png'),
    tier: 'aligned',
    size: 'small'
  },
  {
    id: 'bmw',
    name: 'BMW',
    logo: require('../assets/sponsors/bmw-logo.png'),
    tier: 'aligned',
    size: 'small'
  }
];

interface SplashScreenProps {
  onSplashComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onSplashComplete }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [logoScale] = useState(new Animated.Value(0.8));
  const [sponsorOpacity] = useState(new Animated.Value(0));
  const [currentSponsor, setCurrentSponsor] = useState(0);

  useEffect(() => {
    const animationSequence = async () => {
      // Main logo appears
      await new Promise(resolve => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          })
        ]).start(resolve);
      });

      // Show sponsors sequentially
      for (let i = 0; i < sponsorLogos.length; i++) {
        setCurrentSponsor(i);
        await new Promise(resolve => {
          Animated.sequence([
            Animated.timing(sponsorOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(sponsorOpacity, {
              toValue: 0,
              duration: 300,
              delay: 600,
              useNativeDriver: true,
            })
          ]).start(resolve);
        });
      }

      // Hold final frame before transitioning
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSplashComplete();
    };

    animationSequence();
  }, [fadeAnim, logoScale, sponsorOpacity, onSplashComplete]);

  const renderSponsorLogo = (sponsor: SponsorLogo, index: number) => {
    if (index !== currentSponsor) return null;

    const sizeStyles = {
      large: { width: 200, height: 80 },
      medium: { width: 150, height: 60 },
      small: { width: 120, height: 48 }
    };

    return (
      <Animated.View
        key={sponsor.id}
        style={[
          styles.sponsorContainer,
          { opacity: sponsorOpacity }
        ]}
      >
        <IOSText 
          style={[
            styles.sponsorTier,
            sponsor.tier === 'title' && styles.titleSponsorText,
            sponsor.tier === 'major' && styles.majorSponsorText,
            sponsor.tier === 'aligned' && styles.alignedSponsorText
          ]}
        >
          {sponsor.tier === 'title' && 'Title Sponsor'}
          {sponsor.tier === 'major' && 'Major Sponsor'} 
          {sponsor.tier === 'aligned' && 'Aligned Partners'}
        </IOSText>
        <View style={[styles.sponsorLogo, sizeStyles[sponsor.size]]}>
          {/* Placeholder for logo - will be replaced with actual images */}
          <View style={[styles.logoPlaceholder, sizeStyles[sponsor.size]]}>
            <IOSText style={styles.logoText}>[{sponsor.name} LOGO]</IOSText>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Main Dragon Worlds Logo */}
        <Animated.View
          style={[
            styles.mainLogoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          {/* Placeholder for main logo */}
          <View style={styles.mainLogo}>
            <IOSText style={styles.mainLogoText}>DRAGON WORLDS</IOSText>
            <IOSText style={styles.mainLogoSubText}>HONG KONG 2027</IOSText>
          </View>
        </Animated.View>

        {/* Sponsor Display Area */}
        <View style={styles.sponsorArea}>
          {sponsorLogos.map((sponsor, index) => renderSponsorLogo(sponsor, index))}
        </View>

        {/* App Attribution */}
        <Animated.View 
          style={[
            styles.attribution,
            { opacity: fadeAnim }
          ]}
        >
          <IOSText style={styles.attributionText}>App by Dragon Worlds Organization</IOSText>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary, // Dragon Blue
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  mainLogoContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  mainLogo: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  mainLogoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  mainLogoSubText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  sponsorArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  sponsorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    position: 'absolute',
  },
  sponsorTier: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  titleSponsorText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  majorSponsorText: {
    color: colors.white,
    opacity: 0.9,
  },
  alignedSponsorText: {
    color: colors.white,
    opacity: 0.8,
    fontSize: 12,
  },
  sponsorLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {
    backgroundColor: colors.white,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  attribution: {
    alignItems: 'center',
    marginBottom: 20,
  },
  attributionText: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default SplashScreen;