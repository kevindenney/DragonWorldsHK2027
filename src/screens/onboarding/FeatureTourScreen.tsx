import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  FileText,
  Trophy,
  Anchor,
  Bell,
  Wind,
  Users,
  ArrowRight,
  ArrowLeft,
  MapPin
} from 'lucide-react-native';
import { IOSText, IOSButton } from '../../components/ios';
import { colors, spacing, typography, shadows } from '../../constants/theme';
import Animated from '../../utils/reanimatedWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FeatureTourScreenProps {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

interface TourSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
  mockupType: 'schedule' | 'notices' | 'results' | 'map';
}

const tourSlides: TourSlide[] = [
  {
    id: 'schedule',
    title: 'Race Schedule',
    description: 'Never miss a race with comprehensive scheduling and real-time updates.',
    icon: Calendar,
    color: colors.primary,
    features: [
      'Live race timing',
      'Weather updates',
      'Start sequences',
      'Course changes',
      'Results notifications'
    ],
    mockupType: 'schedule',
  },
  {
    id: 'notices',
    title: 'Official Notices',
    description: 'Stay informed with official race committee communications and documents.',
    icon: FileText,
    color: colors.info,
    features: [
      'Sailing instructions',
      'Race amendments',
      'Weather advisories',
      'Protest notices',
      'Results protests'
    ],
    mockupType: 'notices',
  },
  {
    id: 'results',
    title: 'Live Results',
    description: 'Track performance with real-time standings and detailed race analysis.',
    icon: Trophy,
    color: colors.warning,
    features: [
      'Live race tracking',
      'Fleet standings',
      'Race by race results',
      'Performance analytics',
      'Championship points'
    ],
    mockupType: 'results',
  },
  {
    id: 'map',
    title: 'Interactive Maps',
    description: 'Explore race courses and get professional weather data for optimal sailing.',
    icon: Anchor,
    color: colors.accent,
    features: [
      'Course visualization',
      'Wind patterns',
      'Tide information',
      'Weather forecasts',
      'Harbor navigation'
    ],
    mockupType: 'map',
  },
];

export const FeatureTourScreen: React.FC<FeatureTourScreenProps> = ({
  onContinue,
  onBack,
  onSkip
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const slideOpacity = useRef(new Animated.Value(1)).current;
  const featureOpacity = useRef(new Animated.Value(1)).current;
  const mockupScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate when slide changes
    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(mockupScale, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(slideOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(mockupScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < tourSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      scrollViewRef.current?.scrollTo({
        x: (currentSlide + 1) * screenWidth,
        animated: true,
      });
    } else {
      onContinue();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      scrollViewRef.current?.scrollTo({
        x: (currentSlide - 1) * screenWidth,
        animated: true,
      });
    } else {
      onBack();
    }
  };

  const renderMockup = (mockupType: TourSlide['mockupType']) => {
    switch (mockupType) {
      case 'schedule':
        return (
          <View style={styles.mockup}>
            <View style={styles.mockupHeader}>
              <IOSText style={styles.mockupTitle} textStyle="headline" weight="semibold">
                Today's Racing
              </IOSText>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            </View>
            <View style={styles.mockupContent}>
              <View style={styles.raceItem}>
                <View style={styles.raceTime}>
                  <IOSText style={styles.timeText} textStyle="title2" weight="bold">10:30</IOSText>
                  <IOSText style={styles.statusText} textStyle="caption1">Starting Soon</IOSText>
                </View>
                <View style={styles.raceInfo}>
                  <IOSText style={styles.raceTitle} textStyle="body" weight="semibold">Race 3 - Gold Fleet</IOSText>
                  <IOSText style={styles.raceDetails} textStyle="footnote" color="secondaryLabel">
                    Course: Windward/Leeward • Wind: 12-15 knots
                  </IOSText>
                </View>
              </View>
            </View>
          </View>
        );

      case 'notices':
        return (
          <View style={styles.mockup}>
            <View style={styles.mockupHeader}>
              <IOSText style={styles.mockupTitle} textStyle="headline" weight="semibold">
                Race Committee
              </IOSText>
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <IOSText style={styles.badgeText} textStyle="caption2" weight="bold">NEW</IOSText>
              </View>
            </View>
            <View style={styles.mockupContent}>
              <View style={styles.noticeItem}>
                <View style={styles.noticeIcon}>
                  <Bell size={16} color={colors.warning} />
                </View>
                <View style={styles.noticeContent}>
                  <IOSText style={styles.noticeTitle} textStyle="body" weight="semibold">
                    Course Change - Race 4
                  </IOSText>
                  <IOSText style={styles.noticeTime} textStyle="caption1" color="secondaryLabel">
                    Posted 15 minutes ago
                  </IOSText>
                </View>
              </View>
            </View>
          </View>
        );

      case 'results':
        return (
          <View style={styles.mockup}>
            <View style={styles.mockupHeader}>
              <IOSText style={styles.mockupTitle} textStyle="headline" weight="semibold">
                Gold Fleet Standings
              </IOSText>
              <IOSText style={styles.updateText} textStyle="caption1" color="secondaryLabel">
                Live
              </IOSText>
            </View>
            <View style={styles.mockupContent}>
              <View style={styles.resultItem}>
                <View style={styles.position}>
                  <IOSText style={styles.positionText} textStyle="title2" weight="bold">1</IOSText>
                </View>
                <View style={styles.sailorInfo}>
                  <IOSText style={styles.sailorName} textStyle="body" weight="semibold">John Smith</IOSText>
                  <IOSText style={styles.countryCode} textStyle="footnote" color="secondaryLabel">
                    GBR 42 • 15 points
                  </IOSText>
                </View>
                <View style={styles.trend}>
                  <IOSText style={styles.trendText} textStyle="caption1" weight="bold">↑2</IOSText>
                </View>
              </View>
            </View>
          </View>
        );

      case 'map':
        return (
          <View style={styles.mockup}>
            <View style={styles.mockupHeader}>
              <IOSText style={styles.mockupTitle} textStyle="headline" weight="semibold">
                Course Alpha
              </IOSText>
              <View style={styles.windIndicator}>
                <Wind size={16} color={colors.primary} />
                <IOSText style={styles.windText} textStyle="caption1" weight="bold">15 kts</IOSText>
              </View>
            </View>
            <View style={styles.mockupContent}>
              <View style={styles.mapContainer}>
                <View style={styles.courseElement}>
                  <MapPin size={12} color={colors.success} />
                  <IOSText style={styles.markText} textStyle="caption2">Start</IOSText>
                </View>
                <View style={[styles.courseElement, { top: 30, right: 20 }]}>
                  <MapPin size={12} color={colors.warning} />
                  <IOSText style={styles.markText} textStyle="caption2">Mark 1</IOSText>
                </View>
                <View style={[styles.courseElement, { bottom: 20, left: 30 }]}>
                  <MapPin size={12} color={colors.error} />
                  <IOSText style={styles.markText} textStyle="caption2">Finish</IOSText>
                </View>
              </View>
            </View>
          </View>
        );
    }
  };

  const currentTour = tourSlides[currentSlide];
  const Icon = currentTour.icon;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          {tourSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index === currentSlide ? colors.primary : colors.borderLight,
                  transform: [{ scale: index === currentSlide ? 1.2 : 1 }],
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <IOSText style={styles.skipText} textStyle="body" color="systemBlue">
            Skip
          </IOSText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {tourSlides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <Animated.View
              style={[
                styles.slideContent,
                {
                  opacity: slideOpacity,
                  transform: [{ scale: mockupScale }],
                },
              ]}
            >
              {/* Feature Icon */}
              <View style={[styles.iconContainer, { backgroundColor: `${slide.color}15` }]}>
                <Icon size={48} color={slide.color} strokeWidth={1.5} />
              </View>

              {/* Title and Description */}
              <IOSText style={styles.slideTitle} textStyle="largeTitle" weight="bold">
                {slide.title}
              </IOSText>

              <IOSText style={styles.slideDescription} textStyle="body" color="secondaryLabel">
                {slide.description}
              </IOSText>

              {/* Interactive Mockup */}
              <View style={styles.mockupContainer}>
                {renderMockup(slide.mockupType)}
              </View>

              {/* Feature List */}
              <View style={styles.featuresList}>
                {slide.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featureItem}>
                    <View style={[styles.featureDot, { backgroundColor: slide.color }]} />
                    <IOSText style={styles.featureText} textStyle="footnote">
                      {feature}
                    </IOSText>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <IOSButton
          title={currentSlide === tourSlides.length - 1 ? "Let's Begin!" : "Next"}
          onPress={handleNext}
          variant="filled"
          size="large"
          style={[styles.nextButton, { backgroundColor: currentTour.color }] as any}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  slideTitle: {
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.md,
    fontSize: 32,
  },
  slideDescription: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    lineHeight: 24,
  },
  mockupContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  mockup: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    ...shadows.card,
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  mockupTitle: {
    color: colors.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: colors.background,
  },
  mockupContent: {
    gap: spacing.sm,
  },
  raceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  raceTime: {
    alignItems: 'center',
  },
  timeText: {
    color: colors.primary,
  },
  statusText: {
    color: colors.success,
  },
  raceInfo: {
    flex: 1,
  },
  raceTitle: {
    color: colors.text,
  },
  raceDetails: {
    marginTop: 2,
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noticeIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    color: colors.text,
  },
  noticeTime: {
    marginTop: 2,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  position: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    color: colors.background,
  },
  sailorInfo: {
    flex: 1,
  },
  sailorName: {
    color: colors.text,
  },
  countryCode: {
    marginTop: 2,
  },
  trend: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.success + '20',
    borderRadius: 4,
  },
  trendText: {
    color: colors.success,
  },
  windIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  windText: {
    color: colors.primary,
  },
  updateText: {
    fontSize: 12,
  },
  mapContainer: {
    height: 80,
    backgroundColor: colors.accent + '10',
    borderRadius: 8,
    position: 'relative',
  },
  courseElement: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    ...shadows.small,
  },
  markText: {
    fontSize: 10,
  },
  featuresList: {
    width: '100%',
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    flex: 1,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  nextButton: {
    borderRadius: 14,
    ...shadows.button,
  },
});

export default FeatureTourScreen;