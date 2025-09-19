import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WeatherDetailModal, createExampleDataSources } from '../../screens/modals/WeatherDetailModal';
import { convertActiveSourcesToDataSources } from '../../utils/dataSourceUtils';
import { useWeatherStore } from '../../stores/weatherStore';
import { IOSButton, IOSText } from '../ios';

/**
 * Demo component showing how to use the enhanced WeatherDetailModal
 * with real data sources from the weather store
 */
export const WeatherDetailModalDemo: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const activeSources = useWeatherStore(state => state.activeSources);

  // Example weather data (normally this would come from the weather store)
  const currentConditions = {
    temperature: 85,
    windSpeed: 21,
    windDirection: 180,
    windGust: 25,
    visibility: 10,
    pressure: 1013,
    humidity: 70
  };

  const marineConditions = {
    waveHeight: 2.5,
    swellPeriod: 8,
    swellDirection: 200,
    tideHeight: 2.5,
    tideTime: '14:30',
    tideType: 'high' as const,
    current: {
      speed: 1.2,
      direction: 190
    },
    seaTemperature: 28
  };

  const racingForecast = {
    provider: 'Dragon Worlds Weather Service',
    summary: 'Good sailing conditions with moderate winds from the south. Some gusting expected.',
    conditions: [
      { time: '14:00', windSpeed: 18, windDirection: 180, conditions: 'Partly Cloudy' },
      { time: '15:00', windSpeed: 21, windDirection: 185, conditions: 'Partly Cloudy' },
      { time: '16:00', windSpeed: 19, windDirection: 170, conditions: 'Scattered Clouds' }
    ]
  };

  // Convert store active sources to DataSource format
  const dataSources = convertActiveSourcesToDataSources(activeSources);

  // Fallback to example data sources if none are available
  const modalDataSources = Object.keys(dataSources).length > 0 ? dataSources : createExampleDataSources();

  return (
    <View style={styles.container}>
      <IOSText textStyle="headline" weight="semibold" style={styles.title}>
        Weather Detail Modal Demo
      </IOSText>

      <IOSText textStyle="callout" color="secondaryLabel" style={styles.description}>
        This demo shows the enhanced weather detail modal with data source attribution and links.
      </IOSText>

      <View style={styles.sourceInfo}>
        <IOSText textStyle="subheadline" weight="semibold" style={styles.sourceTitle}>
          Current Data Sources:
        </IOSText>
        {Object.keys(activeSources).length > 0 ? (
          Object.entries(activeSources).map(([metric, source]) => (
            <IOSText key={metric} textStyle="callout" color="secondaryLabel" style={styles.sourceItem}>
              • {metric}: {source?.source || 'N/A'}
            </IOSText>
          ))
        ) : (
          <IOSText textStyle="callout" color="tertiaryLabel" style={styles.noSources}>
            No active sources - using example data
          </IOSText>
        )}
      </View>

      <IOSButton
        title="Show Weather Detail Modal"
        variant="filled"
        size="large"
        onPress={() => setModalVisible(true)}
        style={styles.button}
      />

      <WeatherDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentConditions={currentConditions}
        marineConditions={marineConditions}
        racingForecast={racingForecast}
        dataSources={modalDataSources}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  sourceInfo: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sourceTitle: {
    marginBottom: 8,
  },
  sourceItem: {
    marginBottom: 4,
  },
  noSources: {
    fontStyle: 'italic',
  },
  button: {
    // Button styling handled by IOSButton
  },
});