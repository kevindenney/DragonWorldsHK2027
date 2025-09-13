import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';


interface SplashScreenProps {
  onSplashComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onSplashComplete }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (hasCompleted.current) return;
    
    let mounted = true;
    hasCompleted.current = true;

    const runSplashSequence = async () => {
      try {
        console.log('🎬 Starting minimal splash sequence');

        // Simple logo fade-in (0-600ms)
        await new Promise<void>((resolve) => {
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start(() => {
            if (mounted) resolve();
          });
        });

        if (!mounted) return;

        // Brief display (600-1200ms)
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            if (mounted) resolve();
          }, 600);
        });

        // Complete splash
        if (mounted) {
          console.log('🎬 Minimal splash sequence completed');
          onSplashComplete();
        }

      } catch (error) {
        console.error('Splash sequence error:', error);
        if (mounted) {
          onSplashComplete();
        }
      }
    };

    // Backup timer - much shorter now
    const backupTimer = setTimeout(() => {
      if (mounted) {
        console.log('🎬 Splash backup timer triggered');
        onSplashComplete();
      }
    }, 1500);

    runSplashSequence();

    return () => {
      mounted = false;
      clearTimeout(backupTimer);
    };
  }, []); // Empty dependency array

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              { opacity: logoOpacity }
            ]}
          >
            <Image
              source={require('../../assets/dragon-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
});

export default SplashScreen;