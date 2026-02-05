import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Cloud,
  Wind, 
  Thermometer,
  Eye,
  TrendingUp,
  Navigation,
  Waves,
  ChevronRight,
  Lock,
  Unlock,
  Star,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react-native';
import { 
  IOSCard,
  IOSText,
  IOSButton,
  IOSBadge,
  IOSSection
} from '../../components/ios';
import { colors } from '../../constants/theme';
import { useUserType, useNeedsVerification } from '../../stores/userStore';
import { 
  useWeatherStore,
  useCurrentWeather,
  useCurrentMarine,
  useWeatherForecasts,
  useWeatherAlerts,
  useWeatherLoading,
  useWeatherError,
  useAccessLevel,
  useCanAccessFeature
} from '../../stores/weatherStore';
import type { WeatherScreenProps } from '../../types/navigation';

export const EnhancedWeatherScreen: React.FC<WeatherScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Real weather store hooks
  const { refreshWeather } = useWeatherStore();
  const currentWeather = useCurrentWeather();
  const currentMarine = useCurrentMarine();
  const forecasts = useWeatherForecasts();
  const alerts = useWeatherAlerts();
  const loading = useWeatherLoading();
  const error = useWeatherError();
  const accessLevel = useAccessLevel();
  const canAccessProfessionalAnalysis = useCanAccessFeature('detailedAnalysis');
  const canAccessMarineData = useCanAccessFeature('marineConditions');
  const canAccessRacingAnalysis = useCanAccessFeature('racingInsights');
  
  const userType = useUserType();
  const needsVerification = useNeedsVerification();

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      await refreshWeather();
    } catch (error) {
      Alert.alert('Error', 'Failed to load weather data. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };

  const handleSubscriptionUpgrade = () => {
    Alert.alert(
      'Premium Weather Features',
      'Upgrade to access professional sailing weather analysis, wind shift predictions, and racing tactics.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'View Plans', onPress: () => navigation.navigate('Services') }
      ]
    );
  };

  const handleCrossPromotion = () => {
    Alert.alert(
      'TacticalWind Pro',
      'Want advanced race analysis? TacticalWind Pro offers layline calculations, start line analysis, and professional racing tools used by America\'s Cup teams.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Learn More', onPress: () => {
          // Navigate to cross-promotion screen
        }}
      ]
    );
  };

  const renderParticipantAccess = () => {
    if (accessLevel !== 'participant') return null;

    return (
      <IOSCard style={styles.participantCard}>
        <View style={styles.accessHeader}>
          <Target size={20} color={colors.success} />
          <IOSText style={styles.accessTitle}>🎯 Professional Data Active</IOSText>
        </View>
        <IOSText style={styles.accessSubtitle}>Free during championship</IOSText>
        <IOSText style={styles.accessExpiry}>Expires: Nov 29, 23:59</IOSText>
        <IOSButton
          title="Continue After Event"
          variant="ghost"
          size="small"
          onPress={handleSubscriptionUpgrade}
          icon={ChevronRight}
          style={styles.continueButton}
        />
      </IOSCard>
    );
  };

  const renderSubscriptionRequired = () => {
    if (accessLevel === 'premium') return null;

    return (
      <IOSCard style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <Lock size={20} color={colors.warning} />
          <IOSText style={styles.subscriptionTitle}>🔒 Professional Weather Access</IOSText>
        </View>
        <IOSText style={styles.subscriptionSubtitle}>Championship access expired</IOSText>
        <IOSText style={styles.subscriptionDescription}>Continue with premium features</IOSText>
        
        <View style={styles.subscriptionActions}>
          <IOSButton
            title="View Subscription Plans"
            variant="primary"
            size="small"
            onPress={handleSubscriptionUpgrade}
            icon={ChevronRight}
            style={styles.subscriptionButton}
          />
          <IOSButton
            title="Try Basic Weather"
            variant="ghost"
            size="small"
            onPress={() => {}}
            style={styles.basicButton}
          />
        </View>
      </IOSCard>
    );
  };

  const renderCurrentConditions = () => {
    if (!currentWeather) return null;

    return (
      <IOSSection title="CURRENT CONDITIONS">
        <IOSCard style={styles.conditionsCard}>
          <View style={styles.mainConditions}>
            <View style={styles.conditionItem}>
              <Cloud size={24} color={colors.primary} />
              <View style={styles.conditionDetails}>
                <IOSText style={styles.conditionTitle}>🌤️ {currentWeather.conditions}</IOSText>
                <IOSText style={styles.conditionValue}>
                  {currentWeather.temperature}°C | Feels like {currentWeather.temperature}°C
                </IOSText>
              </View>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <IOSText style={styles.detailLabel}>Humidity</IOSText>
              <IOSText style={styles.detailValue}>{currentWeather.humidity}%</IOSText>
            </View>
            <View style={styles.detailItem}>
              <IOSText style={styles.detailLabel}>Pressure</IOSText>
              <IOSText style={styles.detailValue}>{currentWeather.pressure} hPa</IOSText>
            </View>
            <View style={styles.detailItem}>
              <IOSText style={styles.detailLabel}>Visibility</IOSText>
              <IOSText style={styles.detailValue}>{currentWeather.visibility}km</IOSText>
            </View>
            <View style={styles.detailItem}>
              <IOSText style={styles.detailLabel}>Updated</IOSText>
              <IOSText style={styles.detailValue}>90 sec ago</IOSText>
            </View>
          </View>

          {accessLevel === 'premium' && (
            <View style={styles.professionalBadge}>
              <IOSBadge text="Multi-Source Data Active" variant="success" size="small" />
              <IOSBadge text="OpenWeatherMap + Open-Meteo" variant="primary" size="small" />
            </View>
          )}
          
          <IOSText style={styles.attribution}>Professional Marine Weather</IOSText>
        </IOSCard>
      </IOSSection>
    );
  };

  const renderProfessionalWindAnalysis = () => {
    if (!canAccessProfessionalAnalysis || !currentWeather) {
      return renderLockedFeature('PROFESSIONAL WIND ANALYSIS', 'Professional analysis requires subscription');
    }

    return (
      <IOSSection title="PROFESSIONAL WIND ANALYSIS">
        <IOSCard style={styles.analysisCard}>
          <View style={styles.windHeader}>
            <Wind size={20} color={colors.primary} />
            <IOSText style={styles.windTitle}>
              💨 {currentWeather.windSpeed} knots from {currentWeather.windDirection}°
            </IOSText>
          </View>

          <IOSText style={styles.windDetail}>Gusts: {currentWeather.windGust || currentWeather.windSpeed + 3} knots</IOSText>
          <IOSText style={styles.windDetail}>Pressure: {currentWeather.pressure} hPa</IOSText>
          <IOSText style={styles.windDetail}>Visibility: {currentWeather.visibility}km</IOSText>
          <IOSText style={styles.windDetail}>Conditions: {currentWeather.conditions}</IOSText>

          <View style={styles.racingAnalysisSection}>
            <IOSText style={styles.racingAnalysisTitle}>🎯 Racing Analysis</IOSText>
            <IOSText style={styles.racingAnalysisDetail}>
              {currentWeather.windSpeed > 15 ? 'Strong wind conditions - favors tactical sailing' : 'Moderate conditions - consistent wind expected'}
            </IOSText>
            <IOSText style={styles.racingAnalysisDetail}>Wind direction: {currentWeather.windDirection}° - {currentWeather.windDirection > 180 ? 'Southerly' : 'Northerly'} pattern</IOSText>
          </View>

          <IOSButton
            title="Detailed Wind Maps"
            variant="ghost"
            size="small"
            onPress={() => {}}
            icon={ChevronRight}
            style={styles.detailButton}
          />
        </IOSCard>
      </IOSSection>
    );
  };

  const renderWaveCurrentAnalysis = () => {
    if (!canAccessMarineData || !currentMarine) {
      return renderLockedFeature('WAVE & CURRENT ANALYSIS', 'Marine data requires premium subscription');
    }

    return (
      <IOSSection title="WAVE & CURRENT ANALYSIS">
        <IOSCard style={styles.analysisCard}>
          <IOSText style={styles.waveTitle}>
            🌊 Wave: {currentMarine.waveHeight}m @ {currentMarine.swellPeriod}sec
          </IOSText>
          <IOSText style={styles.waveDetail}>
            Current: {currentMarine.current.speed}kt at {currentMarine.current.direction}°
          </IOSText>
          <IOSText style={styles.waveDetail}>Tide: {currentMarine.tideHeight}m ({currentMarine.tideTime})</IOSText>
          <IOSText style={styles.waveDetail}>Sea Temperature: {currentMarine.seaTemperature}°C</IOSText>

          <View style={styles.tacticalSection}>
            <IOSText style={styles.tacticalTitle}>🎯 Tactical Recommendation</IOSText>
            <IOSText style={styles.tacticalDetail}>
              {currentMarine.waveHeight < 1 ? 'Calm seas - focus on wind patterns' : 'Moderate seas - consider wave patterns in tactics'}
            </IOSText>
            <IOSText style={styles.tacticalDetail}>Current direction affects racing line selection</IOSText>
          </View>

          <IOSButton
            title="Current Maps"
            variant="ghost"
            size="small"
            onPress={() => {}}
            icon={ChevronRight}
            style={styles.detailButton}
          />
        </IOSCard>
      </IOSSection>
    );
  };

  const renderProfessionalForecast = () => {
    if (!canAccessRacingAnalysis || !forecasts || forecasts.length === 0) {
      return renderBasicForecast();
    }

    return (
      <IOSSection title="6-HOUR PROFESSIONAL FORECAST">
        <IOSCard style={styles.forecastCard}>
          {forecasts.slice(0, 6).map((forecast, index) => {
            const time = new Date(forecast.time).getHours();
            const raceQualityColor = colors.success; // Simplified for now

            return (
              <View key={index} style={styles.forecastRow}>
                <IOSText style={styles.forecastTime}>{time}:00</IOSText>
                <IOSText style={styles.forecastWind}>
                  {Math.round(forecast.weather.windSpeed)}kts {forecast.weather.windDirection}°
                </IOSText>
                <IOSText style={styles.forecastCondition}>{forecast.weather.conditions}</IOSText>
                <IOSText style={styles.forecastTemp}>{forecast.weather.temperature}°C</IOSText>
                <View style={[styles.raceQualityDot, { backgroundColor: raceQualityColor }]} />
                <IOSText style={[styles.raceQuality, { color: raceQualityColor }]}>
                  R{forecast.weather.windSpeed > 15 ? '++' : forecast.weather.windSpeed > 8 ? '+' : '-'}
                </IOSText>
              </View>
            );
          })}

          <View style={styles.forecastLegend}>
            <IOSText style={styles.legendText}>R = Racing Conditions Quality</IOSText>
            <IOSButton
              title="Extended Forecast"
              variant="ghost"
              size="small"
              onPress={() => {}}
              icon={ChevronRight}
              style={styles.extendedButton}
            />
          </View>
        </IOSCard>
      </IOSSection>
    );
  };

  const renderBasicForecast = () => (
    <IOSSection title="BASIC CONDITIONS">
      <IOSCard style={styles.basicCard}>
        <IOSText style={styles.basicTitle}>🌤️ {currentWeather?.conditions || 'Loading...'} | {currentWeather?.temperature || '--'}°C</IOSText>
        <IOSText style={styles.basicDetail}>Wind: {currentWeather?.windSpeed || '--'}kts from {currentWeather?.windDirection || '--'}°</IOSText>
        <IOSText style={styles.basicDetail}>Marine data: Premium feature</IOSText>
        <IOSText style={styles.basicDetail}>Visibility: {currentWeather?.visibility || '--'}km</IOSText>

        <View style={styles.upgradePrompt}>
          <IOSText style={styles.upgradeTitle}>🔓 Upgrade for:</IOSText>
          <IOSText style={styles.upgradeFeature}>• High-resolution forecasts</IOSText>
          <IOSText style={styles.upgradeFeature}>• Racing analysis</IOSText>
          <IOSText style={styles.upgradeFeature}>• Wind shift predictions</IOSText>
          <IOSText style={styles.upgradeFeature}>• Professional accuracy</IOSText>
          <IOSText style={styles.upgradeFeature}>• Tactical recommendations</IOSText>
        </View>

        <IOSText style={styles.attribution}>Free Weather Data</IOSText>
      </IOSCard>
    </IOSSection>
  );

  const renderPremiumPreview = () => {
    if (accessLevel === 'premium') return null;

    return (
      <IOSSection title="PREMIUM PREVIEW">
        <IOSCard style={styles.previewCard}>
          <IOSText style={styles.previewTitle}>🎯 Professional Features</IOSText>
          
          <View style={styles.blurredContent}>
            <IOSText style={styles.blurredText}>[BLURRED CONTENT]</IOSText>
            <IOSText style={styles.blurredText}>Wind shear analysis...</IOSText>
            <IOSText style={styles.blurredText}>Pressure gradient maps...</IOSText>
            <IOSText style={styles.blurredText}>Racing tactical overlay...</IOSText>
            <IOSText style={styles.blurredText}>Current interaction...</IOSText>
            <IOSText style={styles.blurredText}>[BLURRED CONTENT]</IOSText>
          </View>

          <IOSButton
            title="Unlock Professional"
            variant="primary"
            onPress={handleSubscriptionUpgrade}
            icon={ChevronRight}
            style={styles.unlockButton}
          />
        </IOSCard>
      </IOSSection>
    );
  };

  const renderTacticalWindPromo = () => (
    <IOSSection title="SAILING STRATEGY APP">
      <IOSCard style={styles.promoCard}>
        <IOSText style={styles.promoTitle}>🚀 Want Advanced Race Analysis?</IOSText>
        <IOSText style={styles.promoAppName}>TacticalWind Pro</IOSText>
        
        <View style={styles.promoFeatures}>
          <IOSText style={styles.promoFeature}>• Layline calculations</IOSText>
          <IOSText style={styles.promoFeature}>• Start line analysis</IOSText>
          <IOSText style={styles.promoFeature}>• Wind shift prediction</IOSText>
          <IOSText style={styles.promoFeature}>• Tactical decision trees</IOSText>
        </View>

        <IOSButton
          title="Download TacticalWind Pro"
          variant="primary"
          onPress={handleCrossPromotion}
          icon={ChevronRight}
          style={styles.promoButton}
        />
        
        <IOSText style={styles.promoCredibility}>Used by America's Cup teams</IOSText>
      </IOSCard>
    </IOSSection>
  );

  const renderLockedFeature = (title: string, description: string) => (
    <IOSSection title={title}>
      <IOSCard style={styles.lockedCard}>
        <View style={styles.lockedHeader}>
          <Lock size={20} color={colors.textMuted} />
          <IOSText style={styles.lockedTitle}>Premium Feature</IOSText>
        </View>
        <IOSText style={styles.lockedDescription}>{description}</IOSText>
        <IOSButton
          title="Upgrade to Access"
          variant="ghost"
          size="small"
          onPress={handleSubscriptionUpgrade}
          style={styles.lockedButton}
        />
      </IOSCard>
    </IOSSection>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <IOSText style={styles.loadingText}>Loading weather data...</IOSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IOSText style={styles.headerTitle}>Marine Weather</IOSText>
        <View style={styles.headerLogo}>
          <IOSText style={styles.logoText}>[Dragon Logo]</IOSText>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderParticipantAccess()}
        {renderSubscriptionRequired()}
        {renderCurrentConditions()}
        {renderProfessionalWindAnalysis()}
        {renderWaveCurrentAnalysis()}
        {renderProfessionalForecast()}
        {renderPremiumPreview()}
        {renderTacticalWindPromo()}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerLogo: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
  },
  logoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  // Participant Access Card
  participantCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.success + '10',
    borderColor: colors.success,
    borderWidth: 1,
  },
  accessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 8,
  },
  accessSubtitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  accessExpiry: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  continueButton: {
    alignSelf: 'flex-start',
  },
  // Subscription Required Card
  subscriptionCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.warning + '10',
    borderColor: colors.warning,
    borderWidth: 1,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 8,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  subscriptionActions: {
    gap: 8,
  },
  subscriptionButton: {
    marginBottom: 8,
  },
  basicButton: {
    alignSelf: 'flex-start',
  },
  // Current Conditions
  conditionsCard: {
    padding: 16,
  },
  mainConditions: {
    marginBottom: 16,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  conditionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  conditionValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '40%',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  professionalBadge: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  attribution: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  // Professional Analysis
  analysisCard: {
    padding: 16,
  },
  windHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  windTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  windDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  racingAnalysisSection: {
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
  },
  racingAnalysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  racingAnalysisDetail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  // Wave Analysis
  waveTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  waveDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  tacticalSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.secondary + '10',
    borderRadius: 8,
  },
  tacticalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  tacticalDetail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  detailButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  // Forecast
  forecastCard: {
    padding: 16,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  forecastTime: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    width: 50,
  },
  forecastWind: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  forecastCondition: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 60,
  },
  forecastTemp: {
    fontSize: 14,
    color: colors.text,
    width: 50,
  },
  raceQualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  raceQuality: {
    fontSize: 12,
    fontWeight: '600',
    width: 30,
  },
  forecastLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  extendedButton: {
    alignSelf: 'flex-end',
  },
  // Basic Weather
  basicCard: {
    padding: 16,
  },
  basicTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  basicDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  upgradePrompt: {
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  upgradeFeature: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  // Premium Preview
  previewCard: {
    padding: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  blurredContent: {
    padding: 16,
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    marginBottom: 16,
  },
  blurredText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  unlockButton: {
    alignSelf: 'flex-start',
  },
  // TacticalWind Promo
  promoCard: {
    padding: 16,
    backgroundColor: colors.primary + '05',
    borderColor: colors.primary + '20',
    borderWidth: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  promoAppName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  promoFeatures: {
    marginBottom: 16,
  },
  promoFeature: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  promoButton: {
    marginBottom: 12,
  },
  promoCredibility: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Locked Feature
  lockedCard: {
    padding: 16,
    opacity: 0.7,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  lockedDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  lockedButton: {
    alignSelf: 'flex-start',
  },
});

export default EnhancedWeatherScreen;