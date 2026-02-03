import React from 'react';
import { View, StyleSheet, ScrollView, Image, Linking } from 'react-native';
import {
  Wind,
  Waves,
  Compass,
  Thermometer,
  Eye,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronLeft,
  Globe
} from 'lucide-react-native';
import { colors, spacing } from '../../constants/theme';
import {
  IOSModal,
  IOSCard,
  IOSButton,
  IOSText,
  IOSBadge
} from '../../components/ios';

// TypeScript interfaces
interface WeatherCondition {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  visibility: number;
  pressure: number;
  humidity: number;
}

interface MarineCondition {
  waveHeight: number;
  swellPeriod: number;
  swellDirection: number;
  tideHeight: number;
  tideTime: string;
  tideType: 'high' | 'low';
  current: {
    speed: number;
    direction: number;
  };
}

export interface DataSource {
  name: string;
  url: string;
  lastUpdated: string;
  quality: 'high' | 'medium' | 'low';
  description: string;
}

interface RacingForecast {
  provider: string;
  sponsorLogo?: string;
  dataSource?: DataSource;
  conditions: {
    time: string;
    windSpeed: number;
    windDirection: number;
    conditions: string;
  }[];
  summary: string;
}

interface WeatherDetailModalProps {
  currentConditions: WeatherCondition;
  marineConditions: MarineCondition;
  racingForecast: RacingForecast;
  dataSources: {
    weather?: DataSource;
    marine?: DataSource;
    tide?: DataSource;
  };
  visible: boolean;
  onClose: () => void;
}

// Weather Info Row Component
const WeatherInfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  badge?: React.ReactNode;
}> = ({ icon, label, value, unit, badge }) => (
  <View style={styles.weatherRow}>
    <View style={styles.weatherIcon}>
      {icon}
    </View>
    <View style={styles.weatherContent}>
      <IOSText textStyle="caption1" color="secondaryLabel">
        {label}
      </IOSText>
      <View style={styles.weatherValueRow}>
        <IOSText textStyle="title3" weight="semibold" color="label">
          {value}
          {unit && (
            <IOSText textStyle="callout" color="secondaryLabel">
              {unit}
            </IOSText>
          )}
        </IOSText>
        {badge && <View style={styles.weatherBadge}>{badge}</View>}
      </View>
    </View>
  </View>
);

// Wind Direction Indicator Component
const WindDirectionIndicator: React.FC<{ direction: number }> = ({ direction }) => (
  <View style={styles.windIndicator}>
    <Compass size={40} color={colors.primary} />
    <View style={[styles.windArrow, { transform: [{ rotate: `${direction}deg` }] }]}>
      <ArrowUp size={16} color={colors.primary} />
    </View>
    <IOSText textStyle="caption1" color="secondaryLabel" style={styles.windDegree}>
      {direction}°
    </IOSText>
  </View>
);

// Helper function to open external URLs
const openURL = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
    }
  } catch (error) {
  }
};

// Data Source Component
const DataSourceCard: React.FC<{
  title: string;
  source?: DataSource;
  icon: React.ReactNode;
}> = ({ title, source, icon }) => {
  if (!source) return null;

  const getQualityColor = (quality: DataSource['quality']) => {
    switch (quality) {
      case 'high': return 'systemGreen';
      case 'medium': return 'systemOrange';
      case 'low': return 'systemRed';
      default: return 'systemGray';
    }
  };

  const getQualityText = (quality: DataSource['quality']) => {
    switch (quality) {
      case 'high': return 'High Quality';
      case 'medium': return 'Medium Quality';
      case 'low': return 'Low Quality';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.dataSourceCard}>
      <View style={styles.dataSourceHeader}>
        <View style={styles.dataSourceIcon}>
          {icon}
        </View>
        <View style={styles.dataSourceContent}>
          <IOSText textStyle="caption1" color="secondaryLabel">
            {title}
          </IOSText>
          <IOSText textStyle="callout" weight="semibold" color="label">
            {source.name}
          </IOSText>
          <IOSText textStyle="caption2" color="secondaryLabel">
            {source.description}
          </IOSText>
        </View>
        <View style={styles.dataSourceActions}>
          <IOSBadge
            color={getQualityColor(source.quality)}
            variant="tinted"
            size="small"
          >
            {getQualityText(source.quality)}
          </IOSBadge>
        </View>
      </View>
      <View style={styles.dataSourceFooter}>
        <IOSText textStyle="caption2" color="tertiaryLabel">
          Updated: {new Date(source.lastUpdated).toLocaleString()}
        </IOSText>
        <IOSButton
          title="View Source"
          variant="plain"
          size="small"
          onPress={() => openURL(source.url)}
          style={styles.sourceButton}
        />
      </View>
    </View>
  );
};

// Helper function to create example data sources for testing/demo
export const createExampleDataSources = () => ({
  weather: {
    name: 'OpenWeatherMap',
    url: 'https://openweathermap.org/api/one-call-3',
    lastUpdated: new Date().toISOString(),
    quality: 'high' as const,
    description: 'Current weather conditions, temperature, and wind data'
  },
  marine: {
    name: 'Open-Meteo Marine',
    url: 'https://open-meteo.com/',
    lastUpdated: new Date().toISOString(),
    quality: 'medium' as const,
    description: 'Wave heights, swell periods, and marine forecasts'
  },
  tide: {
    name: 'NOAA Tides',
    url: 'https://api.tidesandcurrents.noaa.gov/',
    lastUpdated: new Date().toISOString(),
    quality: 'high' as const,
    description: 'Official tide predictions for Hong Kong waters'
  }
});

export const WeatherDetailModal: React.FC<WeatherDetailModalProps> = ({
  currentConditions,
  marineConditions,
  racingForecast,
  dataSources,
  visible,
  onClose
}) => {
  const getWindCondition = (speed: number) => {
    if (speed < 7) return { text: 'Light', color: 'systemGreen' as const };
    if (speed < 15) return { text: 'Moderate', color: 'systemBlue' as const };
    if (speed < 25) return { text: 'Strong', color: 'systemOrange' as const };
    return { text: 'Gale', color: 'systemRed' as const };
  };

  const handleExternalLink = () => {
    if (racingForecast.dataSource?.url) {
      openURL(racingForecast.dataSource.url);
    }
  };

  const windCondition = getWindCondition(currentConditions.windSpeed);

  return (
    <IOSModal
      visible={visible}
      onClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <IOSButton
            title=""
            variant="plain"
            onPress={onClose}
            style={styles.backButton}
          />
          <IOSText textStyle="headline" weight="semibold" style={styles.headerTitle}>
            Weather Details
          </IOSText>
          <View style={styles.sponsorArea}>
            {racingForecast.sponsorLogo && (
              <Image 
                source={require('../../../assets/sponsor-logo.png')} 
                style={styles.sponsorLogo}
                resizeMode="contain"
              />
            )}
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Current Conditions */}
          <IOSCard variant="elevated" style={styles.conditionsCard}>
            <IOSText textStyle="title2" weight="bold" style={styles.sectionTitle}>
              Current Conditions
            </IOSText>
            
            <View style={styles.conditionsGrid}>
              <WeatherInfoRow
                icon={<Thermometer size={20} color={colors.error} />}
                label="Temperature"
                value={currentConditions.temperature.toString()}
                unit="°C"
              />
              
              <WeatherInfoRow
                icon={<Wind size={20} color={colors.primary} />}
                label="Wind Speed"
                value={currentConditions.windSpeed.toString()}
                unit=" kts"
                badge={
                  <IOSBadge color={windCondition.color} variant="tinted" size="small">
                    {windCondition.text}
                  </IOSBadge>
                }
              />
              
              <WeatherInfoRow
                icon={<Eye size={20} color={colors.accent} />}
                label="Visibility"
                value={currentConditions.visibility.toString()}
                unit=" km"
              />
              
              <View style={styles.windDirectionSection}>
                <IOSText textStyle="caption1" color="secondaryLabel" style={styles.windDirectionLabel}>
                  Wind Direction
                </IOSText>
                <WindDirectionIndicator direction={currentConditions.windDirection} />
              </View>
            </View>
          </IOSCard>

          {/* Wind Analysis */}
          <IOSCard variant="elevated" style={styles.windCard}>
            <IOSText textStyle="title3" weight="semibold" style={styles.sectionTitle}>
              Wind Conditions - Detailed Analysis
            </IOSText>
            
            <View style={styles.windAnalysis}>
              <View style={styles.windStats}>
                <View style={styles.windStat}>
                  <IOSText textStyle="caption1" color="secondaryLabel">Current</IOSText>
                  <IOSText textStyle="title3" weight="bold" color="label">
                    {currentConditions.windSpeed} kts
                  </IOSText>
                </View>
                
                {currentConditions.windGust && (
                  <View style={styles.windStat}>
                    <IOSText textStyle="caption1" color="secondaryLabel">Gusts</IOSText>
                    <IOSText textStyle="title3" weight="bold" color="systemOrange">
                      {currentConditions.windGust} kts
                    </IOSText>
                  </View>
                )}
                
                <View style={styles.windStat}>
                  <IOSText textStyle="caption1" color="secondaryLabel">Direction</IOSText>
                  <IOSText textStyle="title3" weight="bold" color="label">
                    {currentConditions.windDirection}°
                  </IOSText>
                </View>
              </View>
              
              <IOSText textStyle="callout" color="secondaryLabel" style={styles.windDescription}>
                {windCondition.text} winds from the {currentConditions.windDirection < 180 ? 'north' : 'south'}
                {currentConditions.windGust && currentConditions.windGust > currentConditions.windSpeed + 5 
                  ? ', with significant gusting expected' 
                  : ', steady conditions'
                }.
              </IOSText>
            </View>
          </IOSCard>

          {/* Marine Conditions */}
          <IOSCard variant="elevated" style={styles.marineCard}>
            <IOSText textStyle="title3" weight="semibold" style={styles.sectionTitle}>
              Marine Conditions
            </IOSText>
            
            <View style={styles.marineGrid}>
              <WeatherInfoRow
                icon={<Waves size={20} color={colors.primary} />}
                label="Wave Height"
                value={marineConditions.waveHeight.toString()}
                unit=" m"
              />
              
              <WeatherInfoRow
                icon={<ArrowUp size={20} color={colors.success} />}
                label="Tide"
                value={`${marineConditions.tideHeight.toFixed(1)}m`}
                badge={
                  <IOSBadge 
                    color={marineConditions.tideType === 'high' ? 'systemBlue' : 'systemGreen'} 
                    variant="tinted" 
                    size="small"
                  >
                    {marineConditions.tideType.toUpperCase()} at {marineConditions.tideTime}
                  </IOSBadge>
                }
              />
              
              <WeatherInfoRow
                icon={<Compass size={20} color={colors.accent} />}
                label="Current"
                value={`${marineConditions.current.speed} kts`}
                unit={` @ ${marineConditions.current.direction}°`}
              />
              
              <View style={styles.swellInfo}>
                <IOSText textStyle="caption1" color="secondaryLabel">Swell</IOSText>
                <IOSText textStyle="callout" color="label">
                  {marineConditions.swellPeriod}s period, {marineConditions.swellDirection}° direction
                </IOSText>
              </View>
            </View>
          </IOSCard>

          {/* Racing Forecast */}
          <IOSCard variant="elevated" style={styles.forecastCard}>
            <View style={styles.forecastHeader}>
              <IOSText textStyle="title3" weight="semibold">
                Racing Forecast
              </IOSText>
              <IOSText textStyle="caption1" color="systemBlue" weight="semibold">
                Powered by {racingForecast.provider}
              </IOSText>
            </View>
            
            <IOSText textStyle="callout" color="secondaryLabel" style={styles.forecastSummary}>
              {racingForecast.summary}
            </IOSText>
            
            <View style={styles.forecastList}>
              {racingForecast.conditions.map((condition, index) => (
                <View key={index} style={styles.forecastItem}>
                  <IOSText textStyle="caption1" weight="semibold" color="label">
                    {condition.time}
                  </IOSText>
                  <IOSText textStyle="callout" color="secondaryLabel">
                    {condition.windSpeed} kts @ {condition.windDirection}° - {condition.conditions}
                  </IOSText>
                </View>
              ))}
            </View>
          </IOSCard>

          {/* Data Sources */}
          <IOSCard variant="elevated" style={styles.dataSourcesCard}>
            <IOSText textStyle="title3" weight="semibold" style={styles.sectionTitle}>
              Data Sources
            </IOSText>

            <DataSourceCard
              title="Weather Conditions"
              source={dataSources.weather}
              icon={<Thermometer size={16} color={colors.error} />}
            />

            <DataSourceCard
              title="Marine Conditions"
              source={dataSources.marine}
              icon={<Waves size={16} color={colors.primary} />}
            />

            <DataSourceCard
              title="Tide Information"
              source={dataSources.tide}
              icon={<Globe size={16} color={colors.accent} />}
            />
          </IOSCard>

          {/* External Link */}
          <View style={styles.externalSection}>
            <IOSButton
              title="View Full Forecast"
              variant="tinted"
              size="large"
              onPress={handleExternalLink}
              style={styles.externalButton}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <IOSText textStyle="caption1" color="tertiaryLabel" style={styles.attribution}>
            Data provided by multiple sources
          </IOSText>
          <View style={styles.footerLinks}>
            {dataSources.weather && (
              <IOSButton
                title={dataSources.weather.name}
                variant="plain"
                size="small"
                onPress={() => openURL(dataSources.weather!.url)}
                style={styles.footerLinkButton}
              />
            )}
            {dataSources.marine && (
              <IOSButton
                title={dataSources.marine.name}
                variant="plain"
                size="small"
                onPress={() => openURL(dataSources.marine!.url)}
                style={styles.footerLinkButton}
              />
            )}
            {dataSources.tide && (
              <IOSButton
                title={dataSources.tide.name}
                variant="plain"
                size="small"
                onPress={() => openURL(dataSources.tide!.url)}
                style={styles.footerLinkButton}
              />
            )}
          </View>
        </View>
      </View>
    </IOSModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  sponsorArea: {
    width: 40,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sponsorLogo: {
    width: 32,
    height: 16,
  },
  
  // Content
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Sections
  conditionsCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  windCard: {
    marginBottom: 16,
  },
  marineCard: {
    marginBottom: 16,
  },
  forecastCard: {
    marginBottom: 16,
  },
  dataSourcesCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  
  // Weather Rows
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  weatherIcon: {
    width: 40,
    alignItems: 'center',
  },
  weatherContent: {
    flex: 1,
  },
  weatherValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  weatherBadge: {
    marginLeft: 12,
  },
  
  // Current Conditions
  conditionsGrid: {
    gap: 0,
  },
  
  // Wind Direction
  windDirectionSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  windDirectionLabel: {
    marginBottom: 8,
  },
  windIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  windArrow: {
    position: 'absolute',
  },
  windDegree: {
    marginTop: 8,
  },
  
  // Wind Analysis
  windAnalysis: {
    gap: 16,
  },
  windStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  windStat: {
    alignItems: 'center',
  },
  windDescription: {
    lineHeight: 20,
  },
  
  // Marine Conditions
  marineGrid: {
    gap: 0,
  },
  swellInfo: {
    paddingVertical: 12,
    paddingLeft: 40,
  },
  
  // Racing Forecast
  forecastHeader: {
    marginBottom: 12,
  },
  forecastSummary: {
    marginBottom: 16,
    lineHeight: 20,
  },
  forecastList: {
    gap: 12,
  },
  forecastItem: {
    gap: 4,
  },
  
  // External
  externalSection: {
    paddingVertical: 16,
  },
  externalButton: {
    // Button styling handled by IOSButton
  },
  
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'center',
  },
  attribution: {
    textAlign: 'center',
  },

  // Data Source Cards
  dataSourceCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dataSourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dataSourceIcon: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dataSourceContent: {
    flex: 1,
  },
  dataSourceActions: {
    marginLeft: 8,
  },
  dataSourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sourceButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  // Footer Links
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  footerLinkButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});