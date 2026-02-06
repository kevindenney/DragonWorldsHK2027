import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Linking, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOSText } from '../components/ios';
import { Thermometer, Wind, Waves, Anchor, ExternalLink, CheckCircle2, AlertTriangle, XCircle, Code } from 'lucide-react-native';
import { useWeatherStore } from '../stores/weatherStore';
import { DevelopedByAttribution } from '../components/branding/PoweredByRegattaFlow';
import { resultsService } from '../services/resultsService';

const open = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {}
};

type SourceKey = 'openmeteo' | 'hko' | 'clubspot' | 'racingrules';

interface SourceHealth {
  status: 'ok' | 'degraded' | 'down';
  message?: string;
}

export function DataSourcesScreen() {
  const storeLastUpdate = useWeatherStore(s => s.lastUpdate);
  const storeError = useWeatherStore(s => s.error);

  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [availableSources, setAvailableSources] = useState<Record<SourceKey, boolean>>({
    openmeteo: false,
    hko: false,
    clubspot: false,
    racingrules: false,
  });
  const [health, setHealth] = useState<Record<SourceKey, SourceHealth>>({
    openmeteo: { status: 'down' },
    hko: { status: 'down' },
    clubspot: { status: 'down' },
    racingrules: { status: 'down' },
  });
  const [recentErrors, setRecentErrors] = useState<string[]>([]);
  type Metric = 'temperature' | 'wind' | 'waves' | 'tide' | 'all';
  const [filter, setFilter] = useState<Metric>('all');

  const loadSnapshot = async () => {
    try {
      setLoading(true);
      const { weatherAPI } = await import('../services/weatherAPI');
      const { clubSpotService } = await import('../services/clubSpotService');

      // Fetch weather data
      const res = await weatherAPI.getWeatherData();
      const dataKeys = Object.keys(res.data || {});

      const nextAvailable: Record<SourceKey, boolean> = { openmeteo: false, hko: false, clubspot: false, racingrules: false };

      // Check for Open-Meteo data (either openmeteo or openmeteo_weather keys)
      if (dataKeys.includes('openmeteo') || dataKeys.includes('openmeteo_weather')) {
        nextAvailable.openmeteo = true;
      }
      // Check for HKO data
      if (dataKeys.includes('hko')) {
        nextAvailable.hko = true;
      }

      // Check ClubSpot connectivity
      try {
        const clubSpotHealth = await clubSpotService.checkHealth();
        nextAvailable.clubspot = clubSpotHealth.isHealthy;
      } catch {
        nextAvailable.clubspot = false;
      }

      // Check Racing Rules of Sailing connectivity
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const rrosResponse = await fetch('https://www.racingrulesofsailing.org/events/13242/event_links', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        nextAvailable.racingrules = rrosResponse.ok;
      } catch {
        nextAvailable.racingrules = false;
      }

      setAvailableSources(nextAvailable);

      const nextHealth: Record<SourceKey, SourceHealth> = { openmeteo: { status: 'down' }, hko: { status: 'down' }, clubspot: { status: 'down' }, racingrules: { status: 'down' } };
      (['openmeteo', 'hko', 'clubspot', 'racingrules'] as SourceKey[]).forEach(k => {
        nextHealth[k] = nextAvailable[k] ? { status: 'ok' } : { status: 'down' };
      });

      if (Array.isArray(res.errors) && res.errors.length) {
        setRecentErrors(res.errors.map((e: any) => `${e.source}: ${e.error}`));
        res.errors.forEach((e: any) => {
          // Map error sources to our health keys
          const sourceMap: Record<string, SourceKey> = {
            'open-meteo': 'openmeteo',
            'open-meteo-weather': 'openmeteo',
            'openmeteo': 'openmeteo',
            'hko': 'hko',
          };
          const key = sourceMap[e.source];
          if (key && nextHealth[key]) nextHealth[key] = { status: 'degraded', message: e.error };
        });
      } else {
        setRecentErrors([]);
      }

      setHealth(nextHealth);
      setFetchedAt(res.timestamp || new Date().toISOString());
    } catch (err) {
      setRecentErrors([err instanceof Error ? err.message : 'Failed to load snapshot']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  const activeSourceByMetric = useMemo(() => {
    return {
      temperature: availableSources.openmeteo ? 'Open-Meteo' : (availableSources.hko ? 'Hong Kong Observatory' : 'Simulated/Fallback'),
      wind: availableSources.openmeteo ? 'Open-Meteo' : (availableSources.hko ? 'HKO Weather Buoys' : 'Simulated/Fallback'),
      waves: availableSources.openmeteo ? 'Open-Meteo Marine' : 'Simulated/Fallback',
      tide: availableSources.hko ? 'HKO Tide Stations' : 'Simulated/Fallback',
    };
  }, [availableSources]);

  const renderHealth = (h: SourceHealth) => {
    switch (h.status) {
      case 'ok':
        return (<View style={styles.healthRow}><CheckCircle2 size={16} color="#34C759" /><IOSText style={styles.healthOk}>Operational</IOSText></View>);
      case 'degraded':
        return (<View style={styles.healthRow}><AlertTriangle size={16} color="#FFCC00" /><IOSText style={styles.healthWarn}>Degraded</IOSText></View>);
      default:
        return (<View style={styles.healthRow}><XCircle size={16} color="#FF3B30" /><IOSText style={styles.healthDown}>Unavailable</IOSText></View>);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <IOSText style={styles.title}>Live Data Sources</IOSText>

        {/* Interactive Legend / Filters */}
        <View style={styles.summaryRow}>
          <TouchableOpacity
            onPress={() => setFilter(prev => prev === 'temperature' ? 'all' : 'temperature')}
            style={[styles.summaryItem, filter === 'temperature' && styles.summaryItemSelected]}
            accessibilityRole="button"
          >
            <Thermometer size={16} color="#FF6B6B" />
            <IOSText style={[styles.summaryText, filter === 'temperature' && styles.summaryTextSelected]}>Temperature</IOSText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter(prev => prev === 'wind' ? 'all' : 'wind')}
            style={[styles.summaryItem, filter === 'wind' && styles.summaryItemSelected]}
            accessibilityRole="button"
          >
            <Wind size={16} color="#007AFF" />
            <IOSText style={[styles.summaryText, filter === 'wind' && styles.summaryTextSelected]}>Wind</IOSText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter(prev => prev === 'waves' ? 'all' : 'waves')}
            style={[styles.summaryItem, filter === 'waves' && styles.summaryItemSelected]}
            accessibilityRole="button"
          >
            <Waves size={16} color="#007AFF" />
            <IOSText style={[styles.summaryText, filter === 'waves' && styles.summaryTextSelected]}>Waves</IOSText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter(prev => prev === 'tide' ? 'all' : 'tide')}
            style={[styles.summaryItem, filter === 'tide' && styles.summaryItemSelected]}
            accessibilityRole="button"
          >
            <Anchor size={16} color="#007AFF" />
            <IOSText style={[styles.summaryText, filter === 'tide' && styles.summaryTextSelected]}>Tide</IOSText>
          </TouchableOpacity>
        </View>

        {/* Primary Sources */}
        <View style={styles.card}>
          <IOSText style={styles.cardTitle}>Primary Live Sources</IOSText>

          {/* Open-Meteo - Primary weather data */}
          {(filter === 'all' || filter === 'temperature' || filter === 'wind' || filter === 'waves') && (
            <View style={styles.sourceRow}>
              <View style={styles.multiIcon}>
                <Thermometer size={16} color="#FF6B6B" />
                <Wind size={16} color="#007AFF" style={{ marginLeft: 6 }} />
                <Waves size={16} color="#007AFF" style={{ marginLeft: 6 }} />
              </View>
              <View style={styles.sourceTextWrap}>
                <TouchableOpacity onPress={() => open('https://open-meteo.com/')}>
                  <IOSText style={styles.link}>Open-Meteo Weather & Marine API</IOSText>
                </TouchableOpacity>
                <IOSText style={styles.cardBody}>Temperature, wind, waves, pressure, humidity, and hourly forecasts for Hong Kong waters</IOSText>
              </View>
            </View>
          )}

          {/* Hong Kong Observatory - Local conditions */}
          {(filter === 'all' || filter === 'temperature' || filter === 'wind' || filter === 'tide') && (
            <View style={styles.sourceRow}>
              <View style={styles.multiIcon}>
                <Thermometer size={16} color="#FF6B6B" />
                <Wind size={16} color="#007AFF" style={{ marginLeft: 6 }} />
                <Anchor size={16} color="#007AFF" style={{ marginLeft: 6 }} />
              </View>
              <View style={styles.sourceTextWrap}>
                <TouchableOpacity onPress={() => open('https://www.hko.gov.hk/en/abouthko/opendata_intro.htm')}>
                  <IOSText style={styles.link}>Hong Kong Observatory Open Data</IOSText>
                </TouchableOpacity>
                <IOSText style={styles.cardBody}>Real-time local conditions, weather warnings, marine forecasts, and tide data</IOSText>
              </View>
            </View>
          )}

          {/* Racing Rules of Sailing - Results and Notices */}
          <View style={styles.sourceRow}>
            <View style={styles.multiIcon}>
              <ExternalLink size={16} color="#007AFF" />
            </View>
            <View style={styles.sourceTextWrap}>
              <TouchableOpacity onPress={() => open('https://www.racingrulesofsailing.org/events/13242/event_links?name=2027%2520HONG%2520KONG%2520DRAGON%2520WORLD%2520CHAMPIONSHIP')}>
                <IOSText style={styles.link}>Racing Rules of Sailing</IOSText>
              </TouchableOpacity>
              <IOSText style={styles.cardBody}>Live race results, official notices, sailing instructions, and regatta documentation</IOSText>
            </View>
          </View>

          {/* ClubSpot - Entrants */}
          <View style={styles.sourceRow}>
            <View style={styles.multiIcon}>
              <ExternalLink size={16} color="#007AFF" />
            </View>
            <View style={styles.sourceTextWrap}>
              <TouchableOpacity onPress={() => open('https://theclubspot.com/regatta/zyQIfeVjhb')}>
                <IOSText style={styles.link}>ClubSpot Entrants</IOSText>
              </TouchableOpacity>
              <IOSText style={styles.cardBody}>Live competitor registration, entry lists, and entrant data for Dragon Worlds</IOSText>
            </View>
          </View>
        </View>

        {/* HKO Professional Infrastructure */}
        <View style={styles.card}>
          <IOSText style={styles.cardTitle}>HKO Professional Marine Network</IOSText>

          {/* Weather Buoys */}
          {(filter === 'all' || filter === 'wind' || filter === 'waves') && (
            <View style={styles.sourceRow}>
              <View style={styles.multiIcon}>
                <Wind size={16} color="#007AFF" />
                <Waves size={16} color="#007AFF" style={{ marginLeft: 6 }} />
              </View>
              <View style={styles.sourceTextWrap}>
                <IOSText style={styles.link}>5 Weather Buoys (HKIA Area)</IOSText>
                <IOSText style={styles.cardBody}>10-second real-time updates: Chek Lap Kok, Sha Chau, Lung Fu Shan, Tate's Cairn, Waglan Island</IOSText>
              </View>
            </View>
          )}

          {/* Tide Stations */}
          {(filter === 'all' || filter === 'tide') && (
            <View style={styles.sourceRow}>
              <Anchor size={16} color="#007AFF" />
              <View style={styles.sourceTextWrap}>
                <IOSText style={styles.link}>14 Real-time Tide Stations</IOSText>
                <IOSText style={styles.cardBody}>Victoria Harbour, Cheung Chau, Quarry Bay, Tai O, Waglan Island, and 9 more</IOSText>
              </View>
            </View>
          )}

          {/* Wind Stations */}
          {(filter === 'all' || filter === 'wind' || filter === 'temperature') && (
            <View style={styles.sourceRow}>
              <View style={styles.multiIcon}>
                <Wind size={16} color="#007AFF" />
                <Thermometer size={16} color="#FF6B6B" style={{ marginLeft: 6 }} />
              </View>
              <View style={styles.sourceTextWrap}>
                <IOSText style={styles.link}>30+ Drifting Buoys</IOSText>
                <IOSText style={styles.cardBody}>South China Sea & Western North Pacific coverage with sea level pressure and temperature</IOSText>
              </View>
            </View>
          )}

          {/* Forecast Areas */}
          {(filter === 'all' || filter === 'wind' || filter === 'waves') && (
            <View style={styles.sourceRow}>
              <View style={styles.multiIcon}>
                <Wind size={16} color="#007AFF" />
                <Waves size={16} color="#007AFF" style={{ marginLeft: 6 }} />
              </View>
              <View style={styles.sourceTextWrap}>
                <IOSText style={styles.link}>10 Marine Forecast Areas</IOSText>
                <IOSText style={styles.cardBody}>Professional forecasting for Victoria Harbour, Eastern/Western Waters, and Open Sea areas</IOSText>
              </View>
            </View>
          )}
        </View>


        {/* Snapshot */}
        <View style={styles.card}>
          <IOSText style={styles.cardTitle}>Current Snapshot</IOSText>
          <IOSText style={styles.cardBody}>Last update (store): {storeLastUpdate ? new Date(storeLastUpdate).toLocaleString() : '—'}</IOSText>
          <IOSText style={styles.cardBody}>Last fetch (snapshot): {fetchedAt ? new Date(fetchedAt).toLocaleString() : '—'}</IOSText>
          {!!storeError && (
            <IOSText style={[styles.cardBody, { color: '#FF3B30' }]}>Recent error: {storeError}</IOSText>
          )}
          <View style={{ marginTop: 8 }} />
          <IOSText style={styles.smallTitle}>Active Source per Metric</IOSText>
          <IOSText style={styles.cardBody}>• Temperature: {activeSourceByMetric.temperature}</IOSText>
          <IOSText style={styles.cardBody}>• Wind: {activeSourceByMetric.wind}</IOSText>
          <IOSText style={styles.cardBody}>• Waves: {activeSourceByMetric.waves}</IOSText>
          <IOSText style={styles.cardBody}>• Tide: {activeSourceByMetric.tide}</IOSText>
          {/* Current chosen sources from store when available */}
          <View style={{ marginTop: 8 }} />
          <IOSText style={styles.smallTitle}>Currently Used (from store)</IOSText>
          <StoreSources />
          <View style={{ marginTop: 8 }} />
          <TouchableOpacity onPress={loadSnapshot} style={styles.refreshBtn} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <IOSText style={styles.refreshText}>Refresh Snapshot</IOSText>}
          </TouchableOpacity>
        </View>

        {/* Update Frequency */}
        <View style={styles.card}>
          <IOSText style={styles.cardTitle}>Update Frequency</IOSText>
          <IOSText style={styles.cardBody}>• Open-Meteo: 10-minute cache, updates every 15 minutes</IOSText>
          <IOSText style={styles.cardBody}>• HKO Weather Data: 10-second real-time polling when available</IOSText>
          <IOSText style={styles.cardBody}>• ClubSpot Entrants: Real-time updates, 5-minute cache</IOSText>
          <IOSText style={styles.cardBody}>• Race Results: Live updates during active racing</IOSText>
          <IOSText style={styles.cardBody}>• Notices: Automatic refresh every 5 minutes</IOSText>
        </View>

        {/* API Health */}
        <View style={styles.card}>
          <IOSText style={styles.cardTitle}>API Health Status</IOSText>
          <View style={styles.healthItem}><IOSText style={styles.healthLabel}>Open-Meteo Weather API</IOSText>{renderHealth(health.openmeteo)}</View>
          <View style={styles.healthItem}><IOSText style={styles.healthLabel}>Hong Kong Observatory</IOSText>{renderHealth(health.hko)}</View>
          <View style={styles.healthItem}><IOSText style={styles.healthLabel}>ClubSpot (Entrants)</IOSText>{renderHealth(health.clubspot)}</View>
          <View style={styles.healthItem}><IOSText style={styles.healthLabel}>Racing Rules of Sailing</IOSText>{renderHealth(health.racingrules)}</View>
          {recentErrors.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <IOSText style={styles.smallTitle}>Recent Fetch Errors</IOSText>
              {recentErrors.map((e, i) => (
                <IOSText key={i} style={[styles.cardBody, { color: '#FF3B30' }]}>
                  • {e}
                </IOSText>
              ))}
            </View>
          )}
        </View>

        {/* Data Quality & Sources */}
        <View style={styles.card}>
          <IOSText style={styles.cardTitle}>Data Quality & Reliability</IOSText>
          <IOSText style={styles.cardBody}>• High Quality: Open-Meteo weather & marine data, HKO official conditions</IOSText>
          <IOSText style={styles.cardBody}>• Live Racing Data: Real-time entrants from ClubSpot</IOSText>
          <IOSText style={styles.cardBody}>• Medium Quality: Cached API responses during peak usage</IOSText>
          <IOSText style={styles.cardBody}>• Fallback: Simulated data when APIs are temporarily unavailable</IOSText>
          <IOSText style={styles.cardBody}>• Geographic Coverage: Hong Kong waters and Dragon Worlds racing area</IOSText>
        </View>

        {/* Live Data Verification */}
        <View style={styles.card}>
          <IOSText style={styles.cardTitle}>Is It Live?</IOSText>
          <IOSText style={styles.cardBody}>✓ Open-Meteo: Free weather & marine API with hourly forecasts</IOSText>
          <IOSText style={styles.cardBody}>✓ HKO: Real-time Hong Kong weather conditions and marine forecasts</IOSText>
          <IOSText style={styles.cardBody}>✓ ClubSpot: Live entrant data for registered competitors</IOSText>
          <IOSText style={styles.cardBody}>✓ Automatic refresh: Weather every 15 minutes, race data every 5 minutes</IOSText>
          <IOSText style={styles.cardBody}>✓ Smart caching: Balance between real-time updates and API rate limits</IOSText>
          <IOSText style={styles.cardBody}>✓ Fallback systems: Continue functioning even when some sources are unavailable</IOSText>
        </View>

        {/* Dev Mode Settings - only visible in development */}
        {__DEV__ && <DevModeSettings />}

        {/* Links note */}
        <View style={styles.note}>
          <ExternalLink size={14} color="#6C757D" />
          <IOSText style={styles.noteText}>Tap any source name above to open its website.</IOSText>
        </View>

        {/* RegattaFlow Attribution */}
        <View style={styles.attributionSection}>
          <DevelopedByAttribution />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StoreSources() {
  const active = useWeatherStore(s => s.activeSources);
  if (!active || Object.keys(active).length === 0) {
    return <IOSText style={{ fontSize: 13, color: '#6C757D' }}>Not determined yet. Open Weather or change Location/Date/Time to fetch.</IOSText>;
  }
  return (
    <View>
      {!!active.temperature && (
        <IOSText style={{ fontSize: 14, color: '#2C3E50', marginBottom: 4 }}>
          • Temperature: {active.temperature.source} ({new Date(active.temperature.at).toLocaleTimeString()})
        </IOSText>
      )}
      {!!active.wind && (
        <IOSText style={{ fontSize: 14, color: '#2C3E50', marginBottom: 4 }}>
          • Wind: {active.wind.source} ({new Date(active.wind.at).toLocaleTimeString()})
        </IOSText>
      )}
      {!!active.waves && (
        <IOSText style={{ fontSize: 14, color: '#2C3E50', marginBottom: 4 }}>
          • Waves: {active.waves.source} ({new Date(active.waves.at).toLocaleTimeString()})
        </IOSText>
      )}
      {!!active.tide && (
        <IOSText style={{ fontSize: 14, color: '#2C3E50', marginBottom: 4 }}>
          • Tide: {active.tide.source} ({new Date(active.tide.at).toLocaleTimeString()})
        </IOSText>
      )}
    </View>
  );
}

function DevModeSettings() {
  const [forceMockData, setForceMockData] = useState(resultsService.getForceMockData());

  const handleToggle = (value: boolean) => {
    setForceMockData(value);
    resultsService.setForceMockData(value);
  };

  return (
    <View style={styles.card}>
      <View style={styles.devModeHeader}>
        <Code size={18} color="#FF9500" />
        <IOSText style={styles.devModeTitle}>Developer Settings</IOSText>
      </View>
      <IOSText style={styles.devModeNote}>These settings are only visible in development builds.</IOSText>

      <View style={styles.devToggleRow}>
        <View style={styles.devToggleInfo}>
          <IOSText style={styles.devToggleLabel}>Force Mock Results Data</IOSText>
          <IOSText style={styles.devToggleDesc}>
            Show populated mock championship data instead of fetching from live API
          </IOSText>
        </View>
        <Switch
          value={forceMockData}
          onValueChange={handleToggle}
          trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryItemSelected: {
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#2C3E50',
    fontWeight: '600',
  },
  summaryTextSelected: {
    color: '#007AFF',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
  },
  sourceTextWrap: {
    flex: 1,
  },
  multiIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 6,
  },
  link: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 6,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  noteText: {
    fontSize: 12,
    color: '#6C757D',
  },
  attributionSection: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  smallTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  refreshBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthLabel: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthOk: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '600',
  },
  healthWarn: {
    fontSize: 13,
    color: '#FFCC00',
    fontWeight: '600',
  },
  healthDown: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
  },
  devModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  devModeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
  },
  devModeNote: {
    fontSize: 12,
    color: '#6C757D',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  devToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  devToggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  devToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  devToggleDesc: {
    fontSize: 12,
    color: '#6C757D',
  },
});