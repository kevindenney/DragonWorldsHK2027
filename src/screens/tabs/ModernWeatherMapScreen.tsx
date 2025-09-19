import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  SafeAreaView
} from 'react-native';
import MapView, {Marker, PROVIDER_DEFAULT, Region, UrlTile} from 'react-native-maps';
import {ChevronLeft} from 'lucide-react-native';
import {RACE_AREAS} from '../../config/raceAreas';
import {useSevenDayWeatherStore} from '../../stores/sevenDayWeatherStore';
import TrendIcon from '../../ui/TrendIcon';
import MetricDetailSheet from '../MetricDetailSheet';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

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

export function ModernWeatherMapScreen({navigation}: {navigation?: {goBack: () => void}}) {
  const store = useSevenDayWeatherStore();
  const {bundles, loading, fetchAllBundles, clearCache} = store;
  const [detailSheet, setDetailSheet] = useState<DetailSheetState>({
    visible: false,
    metric: 'wind',
    areaKey: ''
  });

  // Clear cache and fetch fresh data to get live tide data
  useEffect(() => {
    console.log('🗺️ [MAP FLOW] === MODERN WEATHER MAP INITIALIZATION ===');
    console.log('🗺️ [MAP FLOW] Component mounted, starting fresh data fetch...');
    console.log('🗺️ [MAP FLOW] Current bundles state:', Object.keys(bundles));

    clearCache().then(() => {
      console.log('🗺️ [MAP FLOW] ✅ Cache cleared successfully, fetching fresh bundles...');
      console.log('🗺️ [MAP FLOW] About to call fetchAllBundles()...');

      const startTime = Date.now();
      fetchAllBundles().then(() => {
        const endTime = Date.now();
        console.log(`🗺️ [MAP FLOW] ✅ fetchAllBundles() completed in ${endTime - startTime}ms`);
        console.log('🗺️ [MAP FLOW] Updated bundles state:', Object.keys(bundles));

        // Log tide data for each bundle
        Object.entries(bundles).forEach(([areaKey, bundle]) => {
          console.log(`🗺️ [MAP FLOW] Bundle ${areaKey} tide data:`, {
            heightM: bundle.current.tide.heightM,
            trend: bundle.current.tide.trend,
            stationName: bundle.current.tide.stationName
          });
        });
      }).catch(error => {
        console.error('🗺️ [MAP FLOW] ❌ fetchAllBundles() failed:', error);
      });
    }).catch(error => {
      console.error('🗺️ [MAP FLOW] ❌ clearCache() failed:', error);
    });
  }, []);

  const openDetailSheet = (metric: 'wind' | 'wave' | 'tide', areaKey: string) => {
    setDetailSheet({visible: true, metric, areaKey});
  };

  const closeDetailSheet = () => {
    setDetailSheet(prev => ({...prev, visible: false}));
  };

  return (
    <View style={styles.container}>
      {/* Minimal back button */}
      {navigation && (
        <SafeAreaView style={styles.backButtonContainer}>
          <TouchableOpacity
            onPress={navigation.goBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* Full-screen map */}
      <MapView
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

        {/* Render exactly 5 race area markers */}
        {RACE_AREAS.map(area => {
          const bundle = bundles[area.key];

          return (
            <Marker
              key={area.key}
              coordinate={{latitude: area.lat, longitude: area.lon}}
              title={area.name}
            >
              <View style={styles.markerContainer}>
                {/* Area name label */}
                <View style={styles.areaLabel}>
                  <Text style={styles.areaLabelText}>{area.name}</Text>
                </View>

                {/* Three weather badges */}
                <View style={styles.badgeRow}>
                  {/* Wind Badge */}
                  <TouchableOpacity
                    style={[
                      styles.badge,
                      styles.windBadge,
                      bundle?.current.wind.confidence !== undefined && bundle.current.wind.confidence < 0.7 && styles.lowConfidenceBadge
                    ]}
                    onPress={() => openDetailSheet('wind', area.key)}
                    disabled={!bundle}
                  >
                    {bundle ? (
                      <View style={styles.badgeContent}>
                        <Text style={styles.badgeText}>
                          {bundle.current.wind.speedKts.toFixed(0)} kt
                          {bundle.current.wind.gustKts && bundle.current.wind.gustKts > bundle.current.wind.speedKts + 2 && (
                            ` G${bundle.current.wind.gustKts.toFixed(0)}`
                          )}
                        </Text>
                        <TrendIcon value={bundle.current.wind.trend} size={10} />
                        {/* Confidence indicator for multi-source data */}
                        {bundle.current.wind.confidence !== undefined && (
                          <View style={styles.confidenceIndicator}>
                            <Text style={styles.confidenceText}>
                              {(bundle.current.wind.confidence * 100).toFixed(0)}%
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <ActivityIndicator size="small" color="#fff" />
                    )}
                  </TouchableOpacity>

                  {/* Wave Badge */}
                  <TouchableOpacity
                    style={[styles.badge, styles.waveBadge]}
                    onPress={() => openDetailSheet('wave', area.key)}
                    disabled={!bundle || bundle.current.wave.heightM === null}
                  >
                    {bundle && bundle.current.wave.heightM !== null ? (
                      <View style={styles.badgeContent}>
                        <Text style={styles.badgeText}>
                          {bundle.current.wave.heightM.toFixed(1)}m
                          {bundle.current.wave.periodS !== null &&
                            ` @${bundle.current.wave.periodS.toFixed(0)}s`}
                        </Text>
                        <TrendIcon value={bundle.current.wave.trend} size={10} />
                      </View>
                    ) : bundle ? (
                      <Text style={styles.badgeText}>N/A</Text>
                    ) : (
                      <ActivityIndicator size="small" color="#fff" />
                    )}
                  </TouchableOpacity>

                  {/* Tide Badge */}
                  <TouchableOpacity
                    style={[
                      styles.badge,
                      styles.tideBadge,
                      (!bundle || bundle.current.tide.heightM === null) && styles.badgeDisabled
                    ]}
                    onPress={() => openDetailSheet('tide', area.key)}
                    disabled={!bundle || bundle.current.tide.heightM === null}
                  >
                    {bundle && bundle.current.tide.heightM !== null ? (
                      <View>
                        <View style={styles.badgeContent}>
                          <Text style={styles.badgeText}>
                            {bundle.current.tide.heightM.toFixed(1)}m
                          </Text>
                          {bundle.current.tide.trend && (
                            <TrendIcon value={bundle.current.tide.trend} size={10} />
                          )}
                        </View>
                        {bundle.current.tide.stationName && (
                          <Text style={styles.tideStation}>
                            via {bundle.current.tide.stationName}
                          </Text>
                        )}
                      </View>
                    ) : bundle ? (
                      <Text style={styles.badgeText}>N/A</Text>
                    ) : (
                      <ActivityIndicator size="small" color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

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
  markerContainer: {
    alignItems: 'center'
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
    fontSize: 10,
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
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 40,
    paddingTop: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
});

export default ModernWeatherMapScreen;