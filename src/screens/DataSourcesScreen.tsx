import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IOSText } from '../components/ios';
import { Thermometer, Wind, Waves, Anchor, ExternalLink, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react-native';
import { useWeatherStore } from '../stores/weatherStore';
import { DevelopedByAttribution } from '../components/branding/PoweredByRegattaFlow';

const open = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {}
};

type SourceKey = 'openweathermap' | 'openmeteo' | 'noaa' | 'hko';

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
    openweathermap: false,
    openmeteo: false,
    noaa: false,
    hko: false,
  });
  const [health, setHealth] = useState<Record<SourceKey, SourceHealth>>({
    openweathermap: { status: 'down' },
    openmeteo: { status: 'down' },
    noaa: { status: 'down' },
    hko: { status: 'down' },
  });
  const [recentErrors, setRecentErrors] = useState<string[]>([]);
  type Metric = 'temperature' | 'wind' | 'waves' | 'tide' | 'all';
  const [filter, setFilter] = useState<Metric>('all');

  const loadSnapshot = async () => {
    try {
      setLoading(true);
      const { weatherAPI } = await import('../services/weatherAPI');
      const res = await weatherAPI.getWeatherData();
      const keys = Object.keys(res.data || {}) as SourceKey[];

      const nextAvailable: Record<SourceKey, boolean> = { openweathermap: false, openmeteo: false, noaa: false, hko: false };
      keys.forEach(k => { if (k in nextAvailable) nextAvailable[k] = true; });
      setAvailableSources(nextAvailable);

      const nextHealth: Record<SourceKey, SourceHealth> = { openweathermap: { status: 'down' }, openmeteo: { status: 'down' }, noaa: { status: 'down' }, hko: { status: 'down' } };
      (['openweathermap','openmeteo','noaa','hko'] as SourceKey[]).forEach(k => {
        nextHealth[k] = nextAvailable[k] ? { status: 'ok' } : { status: 'down' };
      });

      if (Array.isArray(res.errors) && res.errors.length) {
        setRecentErrors(res.errors.map((e: any) => `${e.source}: ${e.error}`));
        res.errors.forEach((e: any) => {
          const key = e.source as SourceKey;
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
      temperature: availableSources.openweathermap ? 'OpenWeatherMap' : (availableSources.hko ? 'Hong Kong Observatory' : 'Simulated/Fallback'),
      wind: availableSources.openweathermap ? 'OpenWeatherMap' : (availableSources.hko ? 'Hong Kong Observatory' : 'Simulated/Fallback'),
      waves: availableSources.openmeteo ? 'Open‑Meteo Marine' : 'Simulated/Fallback',
      tide: availableSources.noaa ? 'NOAA Tides' : 'Simulated/Fallback',
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
          {/* Open‑Meteo - Waves */}
          {(filter === 'all' || filter === 'waves') && (
            <View style={styles.sourceRow}>
              <Waves size={16} color="#007AFF" />
              <View style={styles.sourceTextWrap}>
                <TouchableOpacity onPress={() => open('https://open-meteo.com/')}>
                  <IOSText style={styles.link}>Open‑Meteo Marine API</IOSText>
                </TouchableOpacity>
                <IOSText style={styles.cardBody}>Wave heights, periods, directions</IOSText>
              </View>
            </View>
          )}

          {/* NOAA - Tide */}
          {(filter === 'all' || filter === 'tide') && (
            <View style={styles.sourceRow}>
              <Anchor size={16} color="#007AFF" />
              <View style={styles.sourceTextWrap}>
                <TouchableOpacity onPress={() => open('https://api.tidesandcurrents.noaa.gov/')}>
                  <IOSText style={styles.link}>NOAA Tides API</IOSText>
                </TouchableOpacity>
                <IOSText style={styles.cardBody}>Tide predictions for Hong Kong waters</IOSText>
              </View>
            </View>
          )}

          {/* OpenWeatherMap - Temp & Wind */}
          {(filter === 'all' || filter === 'temperature' || filter === 'wind') && (
            <View style={styles.sourceRow}>
              <View style={styles.multiIcon}>
                <Thermometer size={16} color="#FF6B6B" />
                <Wind size={16} color="#007AFF" style={{ marginLeft: 6 }} />
              </View>
              <View style={styles.sourceTextWrap}>
                <TouchableOpacity onPress={() => open('https://openweathermap.org/api/one-call-3')}>
                  <IOSText style={styles.link}>OpenWeatherMap (One Call)</IOSText>
                </TouchableOpacity>
                <IOSText style={styles.cardBody}>Temperature, wind, and hourly forecasts</IOSText>
              </View>
            </View>
          )}

          {/* HKO - Local conditions (temp/wind fallback) */}
          {(filter === 'all' || filter === 'temperature' || filter === 'wind') && (
            <View style={styles.sourceRow}>
              <View style={styles.multiIcon}>
                <Thermometer size={16} color="#FF6B6B" />
                <Wind size={16} color="#007AFF" style={{ marginLeft: 6 }} />
              </View>
              <View style={styles.sourceTextWrap}>
                <TouchableOpacity onPress={() => open('https://www.hko.gov.hk/en/wxinfo/ts/index.htm')}>
                  <IOSText style={styles.link}>Hong Kong Observatory</IOSText>
                </TouchableOpacity>
                <IOSText style={styles.cardBody}>Local conditions and weather warnings</IOSText>
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
          <IOSText style={styles.cardBody}>• Weather Manager: updates every 15 minutes by default</IOSText>
          <IOSText style={styles.cardBody}>• Racing Weather Simulation: refreshes every 5 minutes during racing</IOSText>
          <IOSText style={styles.cardBody}>• Cache Duration: 10–30 minutes depending on subscription tier</IOSText>
          <IOSText style={styles.cardBody}>• During active racing: 2–5 minute real‑time refreshes</IOSText>
        </View>

        {/* API Health */}
        <View style={styles.card}>
          <IOSText style={styles.cardTitle}>API Health</IOSText>
          <View style={styles.healthItem}><IOSText style={styles.healthLabel}>OpenWeatherMap</IOSText>{renderHealth(health.openweathermap)}</View>
          <View style={styles.healthItem}><IOSText style={styles.healthLabel}>Open‑Meteo Marine</IOSText>{renderHealth(health.openmeteo)}</View>
          <View style={styles.healthItem}><IOSText style={styles.healthLabel}>NOAA Tides</IOSText>{renderHealth(health.noaa)}</View>
          <View style={styles.healthItem}><IOSText style={styles.healthLabel}>Hong Kong Observatory</IOSText>{renderHealth(health.hko)}</View>
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

        {/* Data Quality & Fallbacks */}
        <View style={styles.card}>
          <IOSText style={styles.cardTitle}>Data Quality & Fallbacks</IOSText>
          <IOSText style={styles.cardBody}>• High quality: NOAA, OpenWeatherMap, HKO (when available)</IOSText>
          <IOSText style={styles.cardBody}>• Medium quality: Open‑Meteo marine (waves/swell)</IOSText>
          <IOSText style={styles.cardBody}>• Low quality: Simulated data when external APIs are unavailable</IOSText>
        </View>

        {/* Live Status */}
        <View style={styles.card}>
          <IOSText style={styles.cardTitle}>Is it live?</IOSText>
          <IOSText style={styles.cardBody}>✓ Real‑time fetching from multiple APIs</IOSText>
          <IOSText style={styles.cardBody}>✓ Automatic refresh every 5–15 minutes</IOSText>
          <IOSText style={styles.cardBody}>✓ Live tide predictions from NOAA</IOSText>
          <IOSText style={styles.cardBody}>✓ Current wind and waves from marine sources</IOSText>
          <IOSText style={styles.cardBody}>✓ HKO local conditions and warnings</IOSText>
          <IOSText style={styles.cardBody}>✓ Smart caching to balance freshness and limits</IOSText>
        </View>

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
});


