import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Platform
} from 'react-native';
import MapView, {Marker, PROVIDER_DEFAULT, Region, UrlTile} from 'react-native-maps';
import { WebView } from 'react-native-webview';
import {ChevronLeft, Wind, Waves, Navigation, Info, TrendingUp, ArrowUp, ArrowDown, RefreshCw, MapPin, X} from 'lucide-react-native';
import {RACE_AREAS} from '../../config/raceAreas';
import {useSevenDayWeatherStore} from '../../stores/sevenDayWeatherStore';
import TrendIcon from '../../ui/TrendIcon';
import MetricDetailSheet from '../MetricDetailSheet';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Generate Android WebView map HTML with Leaflet/OpenStreetMap
const generateAndroidMapHTML = (bundles: any, raceAreas: any[], getWeatherForTime: any, selectedTimeIndex: number) => {
  const markers = raceAreas.map(area => {
    const bundle = bundles[area.key];
    if (!bundle) return null;
    const weather = getWeatherForTime(bundle, selectedTimeIndex);
    return {
      key: area.key,
      name: area.name,
      lat: area.lat,
      lon: area.lon,
      wind: weather.wind.speedKts.toFixed(0),
      windDir: weather.wind.dirDeg
    };
  }).filter(Boolean);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100%; }
        .wind-marker {
          background: rgba(0, 102, 204, 0.9);
          border-radius: 6px;
          padding: 6px 10px;
          color: white;
          font-weight: bold;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { center: [22.265, 114.25], zoom: 11, zoomControl: true, attributionControl: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        // Add OpenSeaMap nautical overlay
        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 18, opacity: 0.7 }).addTo(map);

        const markers = ${JSON.stringify(markers)};
        markers.forEach(m => {
          const icon = L.divIcon({
            className: 'custom-marker',
            html: '<div class="wind-marker">' + m.wind + ' kt</div>',
            iconSize: [60, 30],
            iconAnchor: [30, 15]
          });
          L.marker([m.lat, m.lon], { icon }).addTo(map)
            .on('click', () => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerSelected', areaKey: m.key })));
        });
      </script>
    </body>
    </html>
  `;
};

// Hong Kong region bounds for initial map view
const INITIAL_REGION: Region = {
  latitude: 22.265,
  longitude: 114.25,
  latitudeDelta: 0.25,
  longitudeDelta: 0.3
};

interface DetailSheetState {
  visible: boolean;
  metric: 'wind' | 'wave' | 'tide';
  areaKey: string;
}

interface LayerToggles {
  wind: boolean;
  waves: boolean;
  tides: boolean;
  current: boolean;
}

export function ModernWeatherMapScreen({onBack}: {onBack?: () => void}) {

  const store = useSevenDayWeatherStore();
  const {bundles, loading, fetchAllBundles, clearCache} = store;
  const mapRef = useRef<MapView>(null);

  // State management
  const [detailSheet, setDetailSheet] = useState<DetailSheetState>({
    visible: false,
    metric: 'wind',
    areaKey: ''
  });
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0); // 0 = current, 1 = +1h, etc.
  const [layerToggles, setLayerToggles] = useState<LayerToggles>({
    wind: true,
    waves: true,
    tides: true,
    current: false
  });
  const [legendVisible, setLegendVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Helper function to get forecast time labels
  const getTimeSlots = () => {
    const now = new Date();
    const slots = [
      { label: 'Now', offset: 0, time: now },
      { label: '+1h', offset: 1, time: new Date(now.getTime() + 3600000) },
      { label: '+2h', offset: 2, time: new Date(now.getTime() + 7200000) },
      { label: '+3h', offset: 3, time: new Date(now.getTime() + 10800000) },
      { label: '+6h', offset: 6, time: new Date(now.getTime() + 21600000) },
      { label: '+12h', offset: 12, time: new Date(now.getTime() + 43200000) },
      { label: '+24h', offset: 24, time: new Date(now.getTime() + 86400000) }
    ];
    return slots;
  };

  const timeSlots = getTimeSlots();

  // Helper to get weather data for selected time
  const getWeatherForTime = (bundle: any, timeIndex: number) => {
    if (timeIndex === 0 || !bundle.hourly) {
      return bundle.current;
    }

    // Get forecast data from hourly array
    const hourlyIndex = Math.min(timeIndex, bundle.hourly.times.length - 1);
    return {
      wind: {
        speedKts: bundle.hourly.windSpeedKts[hourlyIndex] || bundle.current.wind.speedKts,
        gustKts: null, // Hourly doesn't have gusts
        dirDeg: bundle.hourly.windDirDeg[hourlyIndex] || bundle.current.wind.dirDeg,
        trend: bundle.current.wind.trend
      },
      wave: {
        heightM: bundle.hourly.waveHeightM[hourlyIndex] ?? bundle.current.wave.heightM,
        periodS: bundle.hourly.wavePeriodS[hourlyIndex] ?? bundle.current.wave.periodS,
        dirDeg: bundle.hourly.waveDirDeg[hourlyIndex] ?? bundle.current.wave.dirDeg,
        trend: bundle.current.wave.trend
      },
      tide: {
        heightM: bundle.hourly.tideHeightM[hourlyIndex] ?? bundle.current.tide.heightM,
        trend: bundle.current.tide.trend,
        stationName: bundle.current.tide.stationName
      }
    };
  };

  // Clear cache and fetch fresh data to get live tide data
  useEffect(() => {

    clearCache().then(() => {

      const startTime = Date.now();
      fetchAllBundles().then(() => {
        const endTime = Date.now();

        // Log tide data for each bundle
        Object.entries(bundles).forEach(([areaKey, bundle]) => {
        });
      }).catch(error => {
      });
    }).catch(error => {
    });
  }, []);

  const openDetailSheet = (metric: 'wind' | 'wave' | 'tide', areaKey: string) => {
    setDetailSheet({visible: true, metric, areaKey});
  };

  const closeDetailSheet = () => {
    setDetailSheet(prev => ({...prev, visible: false}));
  };

  // Toggle layer visibility
  const toggleLayer = (layer: keyof LayerToggles) => {
    setLayerToggles(prev => ({...prev, [layer]: !prev[layer]}));
  };

  // Calculate weather summary from all bundles
  const getWeatherSummary = () => {
    const bundleValues = Object.values(bundles);
    if (bundleValues.length === 0) return null;

    const weatherData = bundleValues.map(b => getWeatherForTime(b, selectedTimeIndex));

    const avgWind = weatherData.reduce((sum, d) => sum + d.wind.speedKts, 0) / weatherData.length;
    const avgWave = weatherData.reduce((sum, d) => sum + (d.wave.heightM || 0), 0) / weatherData.length;

    // Calculate average tide
    const tideData = weatherData.filter(d => d.tide.heightM !== null);
    const avgTide = tideData.length > 0
      ? tideData.reduce((sum, d) => sum + (d.tide.heightM || 0), 0) / tideData.length
      : null;

    // Find most common wind direction
    const windDirs = weatherData.map(d => d.wind.dirDeg);
    const avgWindDir = windDirs.reduce((sum, dir) => sum + dir, 0) / windDirs.length;

    // Wind direction to compass
    const getWindDirection = (deg: number) => {
      const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const index = Math.round(deg / 22.5) % 16;
      return dirs[index];
    };

    return {
      avgWind: avgWind.toFixed(1),
      avgWave: avgWave.toFixed(1),
      avgTide: avgTide !== null ? avgTide.toFixed(1) : null,
      windDirection: getWindDirection(avgWindDir),
      windDirectionDeg: avgWindDir,
      tideTrend: tideData.length > 0 ? tideData[0].tide.trend : null
    };
  };

  // Get next high and low tide times (mock data - would come from API in production)
  const getTideTimings = () => {
    const now = new Date();
    const highTime = new Date(now);
    highTime.setHours(20, 15, 0); // 8:15 PM

    const lowTime = new Date(now);
    lowTime.setDate(lowTime.getDate() + 1);
    lowTime.setHours(2, 30, 0); // 2:30 AM next day

    return {
      nextHigh: {
        time: highTime,
        height: 2.1
      },
      nextLow: {
        time: lowTime,
        height: 0.3
      }
    };
  };

  const summary = getWeatherSummary();
  const tideTimings = getTideTimings();

  // Refresh weather data
  const refreshWeatherData = async () => {
    setLastUpdated(new Date());
    await clearCache();
    await fetchAllBundles();
  };

  // Center on user location (would use actual location in production)
  const centerOnUserLocation = () => {
    const userRegion: Region = {
      latitude: 22.285,
      longitude: 114.165,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1
    };
    mapRef.current?.animateToRegion(userRegion, 500);
  };

  // Get time since last update
  const getTimeSinceUpdate = () => {
    const diff = Date.now() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header with back button and time slider */}
      <SafeAreaView style={styles.timelineContainer}>
        <View style={styles.headerRow}>
          {/* Back button */}
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.headerBackButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color="#666" strokeWidth={2} />
            </TouchableOpacity>
          )}

          {/* Time Slider */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.timeSlider}
            contentContainerStyle={styles.timeSliderContent}
          >
            {timeSlots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  selectedTimeIndex === index && styles.activeTimeSlot
                ]}
                onPress={() => setSelectedTimeIndex(index)}
              >
                <Text style={[
                  styles.timeSlotLabel,
                  selectedTimeIndex === index && styles.activeTimeSlotText
                ]}>
                  {slot.label}
                </Text>
                <Text style={[
                  styles.timeSlotValue,
                  selectedTimeIndex === index && styles.activeTimeSlotText
                ]}>
                  {slot.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Update Indicator - Priority 5 */}
      <View style={styles.updateIndicator}>
        <RefreshCw size={14} color="#666666" />
        <Text style={styles.updateText}>Updated {getTimeSinceUpdate()}</Text>
        <TouchableOpacity onPress={refreshWeatherData}>
          <RefreshCw size={16} color="#0066CC" />
        </TouchableOpacity>
      </View>

      {/* Data Layer Toggles - Priority 2 */}
      <View style={styles.layerControls}>
        <TouchableOpacity
          style={[styles.layerButton, layerToggles.wind && styles.layerButtonActive]}
          onPress={() => toggleLayer('wind')}
        >
          <Wind size={20} color={layerToggles.wind ? '#FFFFFF' : '#666666'} />
          <Text style={[styles.layerButtonText, layerToggles.wind && styles.layerButtonTextActive]}>
            Wind
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.layerButton, layerToggles.waves && styles.layerButtonActive]}
          onPress={() => toggleLayer('waves')}
        >
          <Waves size={20} color={layerToggles.waves ? '#FFFFFF' : '#666666'} />
          <Text style={[styles.layerButtonText, layerToggles.waves && styles.layerButtonTextActive]}>
            Waves
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.layerButton, layerToggles.tides && styles.layerButtonActive]}
          onPress={() => toggleLayer('tides')}
        >
          <TrendingUp size={20} color={layerToggles.tides ? '#FFFFFF' : '#666666'} />
          <Text style={[styles.layerButtonText, layerToggles.tides && styles.layerButtonTextActive]}>
            Tides
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.layerButton, layerToggles.current && styles.layerButtonActive]}
          onPress={() => toggleLayer('current')}
        >
          <Navigation size={20} color={layerToggles.current ? '#FFFFFF' : '#666666'} />
          <Text style={[styles.layerButtonText, layerToggles.current && styles.layerButtonTextActive]}>
            Current
          </Text>
        </TouchableOpacity>

        {/* Legend Button - Priority 4 */}
        <TouchableOpacity
          style={styles.legendButton}
          onPress={() => setLegendVisible(!legendVisible)}
        >
          <Info size={20} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* My Location Button - Priority 4 */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={centerOnUserLocation}
      >
        <MapPin size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Legend Panel - Priority 4 */}
      {legendVisible && (
        <View style={styles.legendPanel}>
          <Text style={styles.legendTitle}>Wind Speed</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>0-10 kt (Light)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#0ea5e9' }]} />
              <Text style={styles.legendText}>10-15 kt (Moderate)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>15-20 kt (Fresh)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>20+ kt (Strong)</Text>
            </View>
          </View>

          <Text style={styles.legendTitle}>Symbols</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <Text style={styles.legendSymbol}>G15</Text>
              <Text style={styles.legendText}>Wind gusts</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendSymbol}>@5s</Text>
              <Text style={styles.legendText}>Wave period</Text>
            </View>
          </View>
        </View>
      )}

      {/* Full-screen map - use WebView on Android due to Google Maps billing issues */}
      {Platform.OS === 'android' ? (
        <WebView
          style={styles.map}
          source={{ html: generateAndroidMapHTML(bundles, RACE_AREAS, getWeatherForTime, selectedTimeIndex) }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'markerSelected') {
                setSelectedMarker(data.areaKey);
              }
            } catch (error) {}
          }}
        />
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={INITIAL_REGION}
          showsUserLocation={false}
          showsCompass={false}
          showsScale={false}
          mapType="standard"
        >
          {/* OpenSeaMap Nautical Overlay - Navigation aids, buoys, lights */}
          <UrlTile
            urlTemplate="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
            zIndex={1}
            tileSize={256}
            opacity={0.7}
            shouldReplaceMapContent={false}
            maximumZ={18}
            minimumZ={5}
            flipY={false}
          />

          {/* Render exactly 5 race area markers - with layer toggles and time selection */}
          {RACE_AREAS.map(area => {
            const bundle = bundles[area.key];
            if (!bundle) return null;

            const weather = getWeatherForTime(bundle, selectedTimeIndex);
            const isExpanded = selectedMarker === area.key;

            return (
              <Marker
                key={area.key}
                coordinate={{latitude: area.lat, longitude: area.lon}}
                title={area.name}
                onPress={() => setSelectedMarker(isExpanded ? null : area.key)}
              >
                <View style={styles.markerContainer}>
                  {!isExpanded ? (
                    // Compact View - Priority 3
                    <TouchableOpacity
                      style={styles.compactDataBubble}
                      onPress={() => setSelectedMarker(area.key)}
                    >
                      <Text style={styles.windSpeed}>{weather.wind.speedKts.toFixed(0)} kt</Text>
                      <View style={{ transform: [{ rotate: `${weather.wind.dirDeg}deg` }] }}>
                        <ArrowUp size={12} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    // Detailed View - Priority 3
                    <View style={styles.detailedDataBubble}>
                      <View style={styles.bubbleHeader}>
                        <Text style={styles.locationName}>{area.name}</Text>
                        <TouchableOpacity onPress={() => setSelectedMarker(null)}>
                          <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.bubbleData}>
                        <View style={styles.dataRow}>
                          <Wind size={16} color="#0066CC" />
                          <Text style={styles.dataLabel}>Wind:</Text>
                          <Text style={styles.dataValue}>
                            {weather.wind.speedKts.toFixed(0)} kt
                            {weather.wind.gustKts && ` (G${weather.wind.gustKts.toFixed(0)})`}
                          </Text>
                        </View>

                        <View style={styles.dataRow}>
                          <Waves size={16} color="#00ACC1" />
                          <Text style={styles.dataLabel}>Waves:</Text>
                          <Text style={styles.dataValue}>
                            {weather.wave.heightM !== null ? `${weather.wave.heightM.toFixed(1)}m` : 'N/A'}
                            {weather.wave.periodS !== null && ` @ ${weather.wave.periodS.toFixed(0)}s`}
                          </Text>
                        </View>

                        {layerToggles.tides && weather.tide.heightM !== null && (
                          <View style={styles.dataRow}>
                            <TrendingUp size={16} color="#00ACC1" />
                            <Text style={styles.dataLabel}>Tide:</Text>
                            <Text style={styles.dataValue}>
                              {weather.tide.heightM.toFixed(1)}m {weather.tide.trend === 'up' ? '↑' : weather.tide.trend === 'down' ? '↓' : '→'}
                            </Text>
                          </View>
                        )}

                        {layerToggles.current && (
                          <View style={styles.dataRow}>
                            <Navigation size={16} color="#FF9800" />
                            <Text style={styles.dataLabel}>Current:</Text>
                            <Text style={styles.dataValue}>1.2 kt SW</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Simplified badges when not expanded - only show enabled layers */}
                  {!isExpanded && (
                    <View style={styles.badgeRow}>
                      {/* These small badges removed in compact mode - data shown in bubble above */}
                    </View>
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* Android Weather Detail Card - shows when marker is selected */}
      {Platform.OS === 'android' && selectedMarker && (() => {
        const selectedArea = RACE_AREAS.find(area => area.key === selectedMarker);
        const bundle = selectedArea ? bundles[selectedArea.key] : null;
        if (!selectedArea || !bundle) return null;

        const weather = getWeatherForTime(bundle, selectedTimeIndex);

        return (
          <View style={styles.androidDetailCard}>
            <View style={styles.androidDetailHeader}>
              <Text style={styles.androidDetailTitle}>{selectedArea.name}</Text>
              <TouchableOpacity
                style={styles.androidDetailClose}
                onPress={() => setSelectedMarker(null)}
              >
                <X size={18} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.androidDetailContent}>
              <View style={styles.androidDetailRow}>
                <Wind size={18} color="#0066CC" />
                <Text style={styles.androidDetailLabel}>Wind</Text>
                <Text style={styles.androidDetailValue}>
                  {weather.wind.speedKts.toFixed(0)} kt
                  {weather.wind.gustKts && ` (G${weather.wind.gustKts.toFixed(0)})`}
                </Text>
              </View>

              <View style={styles.androidDetailRow}>
                <Waves size={18} color="#00ACC1" />
                <Text style={styles.androidDetailLabel}>Waves</Text>
                <Text style={styles.androidDetailValue}>
                  {weather.wave.heightM !== null ? `${weather.wave.heightM.toFixed(1)}m` : 'N/A'}
                  {weather.wave.periodS !== null && ` @ ${weather.wave.periodS.toFixed(0)}s`}
                </Text>
              </View>

              {weather.tide.heightM !== null && (
                <View style={styles.androidDetailRow}>
                  <TrendingUp size={18} color="#10B981" />
                  <Text style={styles.androidDetailLabel}>Tide</Text>
                  <Text style={styles.androidDetailValue}>
                    {weather.tide.heightM.toFixed(1)}m
                    {weather.tide.trend === 'up' ? ' ↑ Rising' : weather.tide.trend === 'down' ? ' ↓ Falling' : ' → Slack'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })()}

      {/* Weather Summary Card - Compact version above tab bar */}
      {summary && (
        <View style={styles.weatherSummaryCard}>
          <Text style={styles.summaryTitle}>Regional Average (All Areas)</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Wind size={16} color="#0066CC" />
              <Text style={styles.summaryValue}>{summary.avgWind} kt</Text>
              <Text style={styles.summaryLabel}>Wind</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontSize: 14 }]}>
                {summary.windDirection}
              </Text>
              <Text style={styles.summaryLabel}>Direction</Text>
            </View>

            <View style={styles.summaryItem}>
              <Waves size={16} color="#0066CC" />
              <Text style={styles.summaryValue}>{summary.avgWave}m</Text>
              <Text style={styles.summaryLabel}>Waves</Text>
            </View>

            {summary.avgTide && (
              <View style={styles.summaryItem}>
                <TrendingUp size={16} color="#00ACC1" />
                <Text style={styles.summaryValue}>{summary.avgTide}m</Text>
                <Text style={styles.summaryLabel}>Tide</Text>
              </View>
            )}
          </View>
          <Text style={styles.dataSourceLabel}>Data: Open-Meteo Marine API</Text>
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.loadingText}>Loading weather data...</Text>
          </View>
        </View>
      )}

      {/* Detail Sheet */}
      <MetricDetailSheet
        visible={detailSheet.visible}
        metric={detailSheet.metric}
        areaKey={detailSheet.areaKey}
        onClose={closeDetailSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    flex: 1
  },
  // Header with back button and time slider
  timelineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  timeSlider: {
    flex: 1,
    paddingRight: 12,
  },
  timeSliderContent: {
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  activeTimeSlot: {
    backgroundColor: '#0066CC',
  },
  timeSlotLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  timeSlotValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 2,
  },
  activeTimeSlotText: {
    color: '#FFFFFF',
  },
  // Layer Controls Styles - Priority 2
  layerControls: {
    position: 'absolute',
    top: 180,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  layerButtonActive: {
    backgroundColor: '#0066CC',
  },
  layerButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 8,
  },
  layerButtonTextActive: {
    color: '#FFFFFF',
  },
  legendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  // Legend Panel Styles - Priority 4
  legendPanel: {
    position: 'absolute',
    top: 180,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
  },
  legendItems: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 20,
    height: 12,
    borderRadius: 4,
  },
  legendSymbol: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066CC',
    width: 30,
  },
  legendText: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  // Android Weather Detail Card Styles
  androidDetailCard: {
    position: 'absolute',
    bottom: 230, // Above the weather summary card
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  androidDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  androidDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  androidDetailClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidDetailContent: {
    gap: 14,
  },
  androidDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  androidDetailLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    width: 50,
  },
  androidDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  // Weather Summary Card Styles - Compact version above tab bar
  weatherSummaryCard: {
    position: 'absolute',
    bottom: 100, // Above the tab bar
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 2,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666666',
    marginTop: 1,
    fontWeight: '500',
  },
  dataSourceLabel: {
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  // Update Indicator Styles - Priority 5
  updateIndicator: {
    position: 'absolute',
    top: 160,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 90,
  },
  updateText: {
    fontSize: 12,
    color: '#666666',
  },
  // My Location Button - Priority 4
  myLocationButton: {
    position: 'absolute',
    bottom: 170, // Above the weather summary card
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  markerContainer: {
    alignItems: 'center'
  },
  // Compact Data Bubble Styles - Priority 3
  compactDataBubble: {
    backgroundColor: 'rgba(0, 102, 204, 0.9)',
    borderRadius: 6,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 70,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  windSpeed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Detailed Data Bubble Styles - Priority 3
  detailedDataBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  closeButton: {
    fontSize: 20,
    fontWeight: '400',
    color: '#999999',
    paddingHorizontal: 8,
  },
  bubbleData: {
    gap: 10,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dataLabel: {
    fontSize: 13,
    color: '#666666',
    minWidth: 60,
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  areaLabel: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4
  },
  areaLabelText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600'
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center'
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  windBadge: {
    backgroundColor: '#0ea5e9'
  },
  waveBadge: {
    backgroundColor: '#06b6d4'
  },
  tideBadge: {
    backgroundColor: '#10b981'
  },
  badgeDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7
  },
  lowConfidenceBadge: {
    borderWidth: 1,
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(14, 165, 233, 0.8)'
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },
  confidenceIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center'
  },
  confidenceText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '700'
  },
  tideStation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
    marginTop: 2
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#475569'
  },
});

export default ModernWeatherMapScreen;