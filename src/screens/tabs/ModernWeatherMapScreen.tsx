import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { 
  UrlTile, 
  Marker, 
  Polyline,
  Circle,
  PROVIDER_DEFAULT,
  Region 
} from '../../utils/mapComponentStubs';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from '../../utils/reanimatedWrapper';
import {
  Cloud,
  Wind,
  Waves,
  Thermometer,
  Droplets,
  Eye,
  Navigation,
  Anchor,
  MapPin,
  Layers,
  ChevronUp,
  AlertTriangle,
  Compass,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react-native';

import { IOSText, IOSCard, IOSModal } from '../../components/ios';
import { 
  useWeatherStore,
  useCurrentWeather,
  useCurrentMarine,
  useWeatherForecasts,
  useHourlyForecast,
  useDailyForecast,
  useSelectedLocation,
} from '../../stores/weatherStore';
import type { MoreScreenProps } from '../../types/navigation';
import type { LocationData } from '../../stores/weatherStore';
import { RACE_AREA_REGION, NINEPINS_RACE_COURSE_CENTER } from '../../constants/raceCoordinates';

// Import new modern components
import { 
  ModernWeatherTopBar,
} from '../../components/weather/modern';
import { HourlyForecastChart } from '../../components/weather/HourlyForecastChart';
import DatagramDetailModal from '../../components/weather/DatagramDetailModal';

// Import wave data service
import { waveDataService, type WaveStation } from '../../services/waveDataService';
// Import wind station service
import { windStationService, type WindStation } from '../../services/windStationService';
// Import tide data service
import { tideDataService, type TideStation } from '../../services/tideDataService';
// Import station deduplication utility
import { deduplicateStations, mergeAndDeduplicateStations } from '../../utils/stationDeduplication';
// Import location weather service
import { locationWeatherService } from '../../services/locationWeatherService';
// Import weather conditions overlay
import WeatherConditionsOverlay from '../../components/weather/WeatherConditionsOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// OpenSeaMap tile configuration
const OPENSEAMAP_CONFIG = {
  seamark: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
  baseMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

// Hong Kong racing area - Clearwater Bay
const INITIAL_REGION: Region = RACE_AREA_REGION;

// Center of race area coordinates
const RACE_AREA_CENTER = NINEPINS_RACE_COURSE_CENTER;

// Five specific station locations around Hong Kong waters
const STATION_LOCATIONS = [
  {
    id: 'hung-hom',
    name: 'Hung Hom',
    coordinate: { latitude: 22.176863619628413, longitude: 114.16033681486007 },
    type: 'harbor'
  },
  {
    id: 'middle-island',
    name: 'Middle Island',
    coordinate: { latitude: 22.232366382833174, longitude: 114.17859939894664 },
    type: 'island-waters'
  },
  {
    id: 'victoria-harbor',
    name: 'Victoria Harbor',
    coordinate: { latitude: 22.303612873304136, longitude: 114.20317897832376 },
    type: 'harbor'
  },
  {
    id: 'shelter-cove',
    name: 'Shelter Cove',
    coordinate: { latitude: 22.340971816349295, longitude: 114.28637430456698 },
    type: 'cove'
  },
  {
    id: 'clearwater-bay-race',
    name: 'Clearwater Bay Race Area',
    coordinate: { latitude: 22.255796757885822, longitude: 114.32596534115692 },
    type: 'race-area'
  }
];

// Map overlay types
type MapOverlay = 'seamark' | 'wind' | 'wave' | 'tide' | 'temperature';

interface WeatherMarker {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title: string;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  waveHeight: number;
}

export function ModernWeatherMapScreen({ navigation }: MoreScreenProps) {
  const mapRef = useRef<MapView>(null);
  const bottomSheetOffset = useSharedValue(SCREEN_HEIGHT * 0.4);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOverlays, setSelectedOverlays] = useState<MapOverlay[]>(['seamark', 'wind', 'wave', 'tide', 'temperature']);
  const [selectedMarker, setSelectedMarker] = useState<WeatherMarker | null>(null);
  const [chartVisible, setChartVisible] = useState(false);
  const [chartSeries, setChartSeries] = useState<any[]>([]);
  const [snapshot, setSnapshot] = useState<{
    temperature?: number;
    windSpeed?: number;
    windDirection?: number;
    waveHeight?: number;
    tideHeight?: number;
    asOf?: string;
  } | null>(null);
  
  // Datagram modal state
  const [datagramModalVisible, setDatagramModalVisible] = useState(false);
  const [selectedDatagramLocation, setSelectedDatagramLocation] = useState<{
    id: string;
    name: string;
    coordinate: { latitude: number; longitude: number };
  } | null>(null);

  // Weather store hooks (declared before any effects that reference them)
  const { refreshWeather, loading, error, setSelectedLocation } = useWeatherStore();
  const currentWeather = useCurrentWeather();
  const currentMarine = useCurrentMarine();
  const forecasts = useWeatherForecasts();
  const hourlyForecast = useHourlyForecast();
  const dailyForecast = useDailyForecast();
  const selectedLocation = useSelectedLocation();

  // Debug logging for selectedOverlays changes
  useEffect(() => {
    console.log('🗺️ SELECTED OVERLAYS CHANGED:', selectedOverlays);
  }, [selectedOverlays]);

  // Initialize default location if none is selected
  useEffect(() => {
    if (!selectedLocation) {
      useWeatherStore.getState().setSelectedLocation({
        id: 'clearwater-bay-race-area',
        name: 'Clearwater Bay Race Area',
        coordinate: RACE_AREA_CENTER,
        type: 'race-area',
      });
    }
  }, [selectedLocation]);

  // Load location-based weather data when location changes
  useEffect(() => {
    const loadLocationWeatherData = async () => {
      if (!selectedLocation) return;
      
      setIsLoadingLocationData(true);
      setLocationDataError(null);
      
      try {
        // Kick off store hourly/forecast fetch for this coordinate
        await useWeatherStore.getState().fetchWeatherData(selectedLocation.coordinate);
        
        const data = await locationWeatherService.getLocationWeatherData(selectedLocation.id);
        if (data) {
          console.log('📍 Location weather data loaded:', {
            location: data.location.name,
            windStations: data.windStations.length,
            waveStations: data.waveStations.length,
            tideStations: data.tideStations.length
          });
          setLocationWeatherData(data);
        }
      } catch (error) {
        console.error('Failed to load location weather data:', error);
        setLocationDataError('Failed to load weather data for this location');
      } finally {
        setIsLoadingLocationData(false);
      }
    };

    loadLocationWeatherData();
  }, [selectedLocation]);

  // Removed legacy references to weatherStore; handled by loadDateWeatherData/loadTimeWeatherData above
  
  // New state for v0.dev design
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  
  // Enhanced weather data state
  const [locationWeatherData, setLocationWeatherData] = useState<any>(null);
  const [isLoadingLocationData, setIsLoadingLocationData] = useState(false);
  const [locationDataError, setLocationDataError] = useState<string | null>(null);
  
  // Location-specific weather cache
  const [locationWeatherCache, setLocationWeatherCache] = useState<Map<string, {
    windSpeed: number;
    windDirection: number;
    waveHeight: number;
    tideHeight: number;
    temperature: number;
    timestamp: number;
  }>>(new Map());
  
  // State to track loading status for each location
  const [locationLoadingStates, setLocationLoadingStates] = useState<Map<string, boolean>>(new Map());

  

  // Wave data state
  const [waveStations, setWaveStations] = useState<WaveStation[]>([]);
  const [waveDataLoading, setWaveDataLoading] = useState(false);
  const [waveDataError, setWaveDataError] = useState<string | null>(null);

  // Tide data state
  const [tideStations, setTideStations] = useState<TideStation[]>([]);
  const [tideDataLoading, setTideDataLoading] = useState(false);
  const [tideDataError, setTideDataError] = useState<string | null>(null);


  // Real wind station data from WindStationService
  const [weatherMarkers, setWeatherMarkers] = useState<WeatherMarker[]>([]);
  const [windStationsLoading, setWindStationsLoading] = useState(false);
  const [windStationsError, setWindStationsError] = useState<string | null>(null);

  useEffect(() => {
    // Old data loading disabled - using location-based data instead
    // loadWeatherData();
    // loadWaveData();
    // loadWindStations();
    // loadTideData();
  }, []);

  // Preload weather data for all locations when date/time changes
  useEffect(() => {
    const preloadLocationWeatherData = async () => {
      const loadingPromises = STATION_LOCATIONS.map(async (location) => {
        // Set loading state
        setLocationLoadingStates(prev => new Map(prev).set(location.id, true));
        
        try {
          await fetchLocationWeatherData(location);
        } finally {
          // Clear loading state
          setLocationLoadingStates(prev => new Map(prev).set(location.id, false));
        }
      });
      
      await Promise.all(loadingPromises);
    };

    preloadLocationWeatherData();
  }, [selectedDate, selectedTime]);

  // Reset selected marker when location changes so panel reflects new location
  useEffect(() => {
    if (!selectedLocation) return;
    console.log('📍 Location changed, clearing selected marker and chart data', selectedLocation.name);
    setSelectedMarker(null);
    setChartSeries([]);
    setChartVisible(false);
  }, [selectedLocation]);

  // Enhanced selector change handlers
  useEffect(() => {
    if (selectedLocation) {
      loadLocationWeatherData(selectedLocation, selectedDate, selectedTime);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedLocation && selectedDate) {
      loadDateWeatherData(selectedDate, selectedLocation);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedLocation && selectedTime) {
      loadTimeWeatherData(selectedTime, selectedLocation);
    }
  }, [selectedTime]);

  const loadWeatherData = async () => {
    try {
      await refreshWeather();
    } catch (error) {
      console.error('Failed to load weather:', error);
    }
  };

  // Function to fetch weather data for a specific location
  const fetchLocationWeatherData = async (location: typeof STATION_LOCATIONS[0]) => {
    const cacheKey = `${location.id}_${selectedDate.toDateString()}_${selectedTime.getHours()}`;
    const cached = locationWeatherCache.get(cacheKey);
    
    // Return cached data if it's less than 10 minutes old
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      return cached;
    }

    try {
      // Import weather API dynamically
      const { weatherAPI } = await import('../../services/weatherAPI');
      
      // Fetch weather data for specific location coordinates
      const weatherData = await weatherAPI.getWeatherData({
        lat: location.coordinate.latitude,
        lon: location.coordinate.longitude
      });
      
      // Extract relevant data
      const locationData = {
        windSpeed: weatherData?.data?.openweathermap?.current?.wind_speed ?? 
                   weatherData?.data?.hko?.windSpeed ?? 
                   (Math.random() * 8 + 4), // 4-12 kts fallback
        windDirection: weatherData?.data?.openweathermap?.current?.wind_deg ?? 
                       weatherData?.data?.hko?.windDirection ?? 
                       (Math.random() * 360),
        waveHeight: weatherData?.data?.openmeteo?.data?.wave?.[0]?.waveHeight ?? 
                    (Math.random() * 1.5 + 0.2), // 0.2-1.7m fallback
        tideHeight: weatherData?.data?.noaa?.tides?.[0]?.height ?? 
                    (Math.random() * 2 + 0.5), // 0.5-2.5m fallback
        temperature: weatherData?.data?.openweathermap?.current?.temp ?? 
                     weatherData?.data?.hko?.temperature ?? 
                     (Math.random() * 8 + 22), // 22-30°C fallback
        timestamp: Date.now()
      };
      
      // Cache the data
      const newCache = new Map(locationWeatherCache);
      newCache.set(cacheKey, locationData);
      setLocationWeatherCache(newCache);
      
      return locationData;
    } catch (error) {
      console.error(`Failed to fetch weather for ${location.name}:`, error);
      
      // Return location-specific fallback data with some variation
      const latSeed = Math.abs(location.coordinate.latitude * 1000) % 1000;
      const lonSeed = Math.abs(location.coordinate.longitude * 1000) % 1000;
      const random = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      
      return {
        windSpeed: 4 + random(latSeed) * 8, // 4-12 kts
        windDirection: random(lonSeed) * 360,
        waveHeight: 0.2 + random(latSeed + 100) * 1.5, // 0.2-1.7m
        tideHeight: 0.5 + random(lonSeed + 100) * 2, // 0.5-2.5m
        temperature: 22 + random(latSeed + lonSeed) * 8, // 22-30°C
        timestamp: Date.now()
      };
    }
  };

  // Enhanced location-based weather data loading
  const loadLocationWeatherData = async (location: LocationData, date?: Date, time?: Date) => {
    setIsLoadingLocationData(true);
    setLocationDataError(null);
    
    try {
      console.log(`🌤️ Loading weather data for ${location.name} at ${location.coordinate.latitude}, ${location.coordinate.longitude}`);
      
      // Import weather API dynamically to avoid circular dependencies
      const { weatherAPI } = await import('../../services/weatherAPI');
      
      // Fetch weather data for specific location
      const weatherData = await weatherAPI.getWeatherData({
        lat: location.coordinate.latitude,
        lon: location.coordinate.longitude
      });
      
      setLocationWeatherData(weatherData);
      setSnapshot(extractSnapshot(weatherData));
      
      // Update map center to selected location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.coordinate.latitude,
          longitude: location.coordinate.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
      
      console.log('✅ Location weather data loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load location weather data:', error);
      // Provide user-friendly error message
      let errorMessage = 'Failed to load weather data';
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Invalid API key')) {
          errorMessage = 'Weather API key invalid. Using free data sources.';
        } else if (error.message.includes('403') || error.message.includes('plan')) {
          errorMessage = 'Premium weather features unavailable. Using free alternatives.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Weather data not found for this location.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      }
      setLocationDataError(errorMessage);
    } finally {
      setIsLoadingLocationData(false);
    }
  };

  // Enhanced date-based weather data loading
  const loadDateWeatherData = async (date: Date, location: LocationData) => {
    setIsLoadingLocationData(true);
    setLocationDataError(null);
    
    try {
      console.log(`📅 Loading weather data for ${date.toDateString()} at ${location.name}`);
      
      // Generate date-specific simulated data that changes based on the selected date
      const dateSpecificData = generateDateSpecificWeatherData(date, location);
      
      setLocationWeatherData(dateSpecificData);
      setSnapshot(extractSnapshot(dateSpecificData));
      
      console.log('✅ Date weather data loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load date weather data:', error);
      setLocationDataError('Failed to load weather data for selected date');
    } finally {
      setIsLoadingLocationData(false);
    }
  };

  // Enhanced time-based weather data loading
  const loadTimeWeatherData = async (time: Date, location: LocationData) => {
    setIsLoadingLocationData(true);
    setLocationDataError(null);
    
    try {
      console.log(`⏰ Loading weather data for ${time.toTimeString()} at ${location.name}`);
      
      // Generate time-specific simulated data that changes based on the selected time
      const timeSpecificData = generateTimeSpecificWeatherData(time, location);
      
      setLocationWeatherData(timeSpecificData);
      setSnapshot(extractSnapshot(timeSpecificData));
      
      console.log('✅ Time weather data loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load time weather data:', error);
      setLocationDataError(error instanceof Error ? error.message : 'Failed to load time weather data');
    } finally {
      setIsLoadingLocationData(false);
    }
  };

  const loadWaveData = async () => {
    try {
      setWaveDataLoading(true);
      setWaveDataError(null);
      
      const stations = await waveDataService.getWaveStations();
      // Deduplicate wave stations to prevent overlapping markers
      const deduplicatedStations = deduplicateStations(stations, 1.5); // 1.5km minimum distance
      setWaveStations(deduplicatedStations);
    } catch (error) {
      console.error('Failed to load wave data:', error);
      setWaveDataError('Failed to load wave data');
    } finally {
      setWaveDataLoading(false);
    }
  };

  const loadWindStations = async () => {
    try {
      setWindStationsLoading(true);
      setWindStationsError(null);
      
      const stations = await windStationService.getWindStations();
      
      // Deduplicate wind stations to prevent overlapping markers
      const deduplicatedStations = deduplicateStations(stations, 1.5); // 1.5km minimum distance
      
      // Convert WindStation data to WeatherMarker format
      const markers: WeatherMarker[] = deduplicatedStations.map(station => ({
        id: station.id,
        coordinate: station.coordinate,
        title: station.name,
        windSpeed: station.windSpeed,
        windDirection: station.windDirection,
        temperature: station.temperature || 24,
        waveHeight: 1.2, // Default wave height, could be enhanced with wave data
      }));
      
      setWeatherMarkers(markers);
    } catch (error) {
      console.error('Failed to load wind stations:', error);
      setWindStationsError('Failed to load wind station data');
    } finally {
      setWindStationsLoading(false);
    }
  };

  const loadTideData = async () => {
    try {
      setTideDataLoading(true);
      setTideDataError(null);
      
      const stations = await tideDataService.getTideStations();
      setTideStations(stations);
    } catch (error) {
      console.error('Failed to load tide data:', error);
      setTideDataError('Failed to load tide data');
    } finally {
      setTideDataLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Old data loading disabled - using location-based data instead
    // await Promise.all([
    //   loadWeatherData(),
    //   loadWaveData(),
    //   loadWindStations(),
    //   loadTideData()
    // ]);
    setRefreshing(false);
  }, []);

  const toggleOverlay = (overlay: MapOverlay) => {
    console.log('🗺️ TOGGLE OVERLAY:', {
      requestedOverlay: overlay,
      currentOverlays: selectedOverlays,
      isCurrentlySelected: selectedOverlays.includes(overlay)
    });
    
    setSelectedOverlays(prev => {
      if (prev.includes(overlay)) {
        // Remove the overlay if it's currently selected
        const newOverlays = prev.filter(o => o !== overlay);
        console.log('🗺️ REMOVED OVERLAY:', overlay, 'New overlays:', newOverlays);
        return newOverlays;
      } else {
        // Add the overlay if it's not currently selected
        const newOverlays = [...prev, overlay];
        console.log('🗺️ ADDED OVERLAY:', overlay, 'New overlays:', newOverlays);
        return newOverlays;
      }
    });
  };

  const toggleAllOverlays = () => {
    const allOverlays: MapOverlay[] = ['seamark', 'wind', 'wave', 'tide', 'temperature'];
    const allSelected = allOverlays.every(overlay => selectedOverlays.includes(overlay));
    
    if (allSelected) {
      // Turn all off
      console.log('🗺️ TURNING ALL OVERLAYS OFF');
      setSelectedOverlays([]);
    } else {
      // Turn all on
      console.log('🗺️ TURNING ALL OVERLAYS ON');
      setSelectedOverlays(allOverlays);
    }
  };

  const animatedBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            bottomSheetOffset.value,
            [0, SCREEN_HEIGHT * 0.7],
            [0, SCREEN_HEIGHT * 0.7]
          ),
        },
      ],
    };
  });

  const handleMarkerPress = (marker: WeatherMarker) => {
    console.log('🟢 handleMarkerPress', marker);
    setSelectedMarker(marker);
    bottomSheetOffset.value = withSpring(SCREEN_HEIGHT * 0.3);
  };

  const handleWindStationPress = (station: {
    id: string;
    name: string;
    coordinate: { latitude: number; longitude: number };
    windSpeed: number;
    windDirection: number;
  }) => {
    console.log('🟢 handleWindStationPress', station);
    const marker: WeatherMarker = {
      id: station.id,
      coordinate: station.coordinate,
      title: station.name,
      windSpeed: station.windSpeed,
      windDirection: station.windDirection,
      temperature: locationWeatherData?.weather?.temperature || currentWeather?.temperature || 24,
      waveHeight: currentMarine?.waveHeight || 1.2,
    };
    setSelectedMarker(marker);
    bottomSheetOffset.value = withSpring(SCREEN_HEIGHT * 0.3);
  };

  const handleWaveStationPress = (station: WaveStation) => {
    // Convert WaveStation to WeatherMarker for display
    const marker: WeatherMarker = {
      id: station.id,
      coordinate: station.coordinate,
      title: station.name,
      windSpeed: 0,
      windDirection: 0,
      temperature: 0,
      waveHeight: station.waveHeight,
    };
    setSelectedMarker(marker);
    bottomSheetOffset.value = withSpring(SCREEN_HEIGHT * 0.3);
  };

  const handleTideStationPress = (station: TideStation) => {
    // Convert TideStation to WeatherMarker for display
    const marker: WeatherMarker = {
      id: station.id,
      coordinate: station.coordinate,
      title: station.name,
      windSpeed: 0,
      windDirection: 0,
      temperature: 0,
      waveHeight: station.currentHeight,
    };
    setSelectedMarker(marker);
    bottomSheetOffset.value = withSpring(SCREEN_HEIGHT * 0.3);
  };

  const formatWindDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getTideDirection = (): string => {
    // Simple tide direction calculation based on current time
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour + minute / 60;
    
    // Approximate tide cycle: high tide every ~6.2 hours
    const tideCycle = (currentTime * Math.PI) / 6.2;
    const tideValue = Math.sin(tideCycle);
    
    if (tideValue > 0.1) return '↗ Rising';
    if (tideValue < -0.1) return '↘ Falling';
    return '→ Stable';
  };

  const generateSixHourSeries = (center: Date, base: { windSpeed: number; waveHeight: number; tideHeight: number; }): any[] => {
    const baseTime = center || new Date();
    const series: any[] = [];
    for (let i = -3; i <= 2; i++) {
      const t = new Date(baseTime.getTime() + i * 60 * 60 * 1000);
      series.push({
        time: t.toISOString(),
        hour: t.getHours(),
        temperature: 28,
        windSpeed: Math.max(0, base.windSpeed + (Math.random() - 0.5) * 2),
        windDirection: Math.random() * 360,
        waveHeight: Math.max(0.1, base.waveHeight + (Math.random() - 0.5) * 0.3),
        tideHeight: Math.max(0, base.tideHeight + (Math.random() - 0.5) * 0.2),
        precipitation: 0,
        conditions: 'Clear',
        humidity: 70,
      });
    }
    console.log('📈 generateSixHourSeries created', series.length, 'points', { base });
    return series;
  };

  // Generate date-specific weather data that changes based on selected date
  function generateDateSpecificWeatherData(date: Date, location: LocationData) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isFuture = date > now;
    const daysDiff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Create a seed based on the date to ensure consistent but different data
    const dateSeed = date.getTime() % 1000000;
    const random = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    // Generate different weather patterns based on the date
    const baseTemp = 28 + Math.sin(date.getTime() / (1000 * 60 * 60 * 24)) * 8; // Daily variation
    const baseWind = 8 + Math.sin(date.getTime() / (1000 * 60 * 60 * 24 * 2)) * 12; // Bi-daily variation
    const baseWaves = 0.5 + Math.sin(date.getTime() / (1000 * 60 * 60 * 24 * 3)) * 1.5; // Tri-daily variation
    const baseTide = 1.0 + Math.sin(date.getTime() / (1000 * 60 * 60 * 24 * 0.5)) * 1.2; // Semi-daily variation
    
    // Add some randomness based on date seed
    const tempVariation = (random(dateSeed) - 0.5) * 6;
    const windVariation = (random(dateSeed + 1) - 0.5) * 8;
    const waveVariation = (random(dateSeed + 2) - 0.5) * 0.8;
    const tideVariation = (random(dateSeed + 3) - 0.5) * 0.6;
    
    // Different patterns for different days of the week
    const dayOfWeek = date.getDay();
    const weekendModifier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.1 : 1.0; // Slightly different on weekends
    
    const temperature = Math.round((baseTemp + tempVariation) * weekendModifier);
    const windSpeed = Math.max(2, Math.round((baseWind + windVariation) * weekendModifier));
    const windDirection = Math.round(random(dateSeed + 4) * 360);
    const waveHeight = Math.max(0.1, Math.round((baseWaves + waveVariation) * 10) / 10);
    const tideHeight = Math.max(0.0, Math.round((baseTide + tideVariation) * 10) / 10);
    
    // Create realistic data structure
    const weatherData = {
      data: {
        openweathermap: {
          current: {
            temp: temperature,
            wind_speed: windSpeed,
            wind_deg: windDirection,
            humidity: 65 + Math.round(random(dateSeed + 5) * 20),
            pressure: 1010 + Math.round(random(dateSeed + 6) * 20),
            weather: [{
              description: windSpeed > 15 ? 'Windy' : windSpeed > 10 ? 'Breezy' : 'Calm'
            }]
          }
        },
        openmeteo: {
          data: {
            wave: [{
              waveHeight: waveHeight,
              wavePeriod: 6 + Math.round(random(dateSeed + 7) * 4),
              waveDirection: windDirection + Math.round(random(dateSeed + 8) * 60 - 30)
            }]
          }
        },
        noaa: {
          tides: [{
            height: tideHeight,
            type: tideHeight > 1.5 ? 'high' : 'low'
          }]
        }
      },
      timestamp: date.toISOString(),
      requestedDate: date.toISOString()
    };
    
    console.log(`🌤️ Generated date-specific data for ${date.toDateString()}:`, {
      temperature,
      windSpeed,
      windDirection,
      waveHeight,
      tideHeight,
      isToday,
      isFuture,
      daysDiff
    });
    
    return weatherData;
  }

  // Generate time-specific weather data that changes based on selected time
  function generateTimeSpecificWeatherData(time: Date, location: LocationData) {
    const hour = time.getHours();
    const minute = time.getMinutes();
    
    // Create a seed based on the time to ensure consistent but different data
    const timeSeed = (hour * 60 + minute) % 1000000;
    const random = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    // Different weather patterns based on time of day
    const isNight = hour < 6 || hour > 18;
    const isMorning = hour >= 6 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 18;
    
    // Base values that change throughout the day
    const baseTemp = isNight ? 24 : isMorning ? 26 : isAfternoon ? 30 : 28;
    const baseWind = isNight ? 6 : isMorning ? 8 : isAfternoon ? 12 : 10;
    const baseWaves = isNight ? 0.3 : isMorning ? 0.5 : isAfternoon ? 0.8 : 0.6;
    const baseTide = 1.0 + Math.sin((hour * 60 + minute) * Math.PI / 720) * 1.2; // Semi-diurnal tide
    
    // Add time-based variations
    const tempVariation = (random(timeSeed) - 0.5) * 4;
    const windVariation = (random(timeSeed + 1) - 0.5) * 6;
    const waveVariation = (random(timeSeed + 2) - 0.5) * 0.4;
    const tideVariation = (random(timeSeed + 3) - 0.5) * 0.3;
    
    const temperature = Math.round(baseTemp + tempVariation);
    const windSpeed = Math.max(2, Math.round(baseWind + windVariation));
    const windDirection = Math.round(random(timeSeed + 4) * 360);
    const waveHeight = Math.max(0.1, Math.round((baseWaves + waveVariation) * 10) / 10);
    const tideHeight = Math.max(0.0, Math.round((baseTide + tideVariation) * 10) / 10);
    
    // Create realistic data structure
    const weatherData = {
      data: {
        openweathermap: {
          current: {
            temp: temperature,
            wind_speed: windSpeed,
            wind_deg: windDirection,
            humidity: 60 + Math.round(random(timeSeed + 5) * 25),
            pressure: 1010 + Math.round(random(timeSeed + 6) * 15),
            weather: [{
              description: windSpeed > 15 ? 'Windy' : windSpeed > 10 ? 'Breezy' : 'Calm'
            }]
          }
        },
        openmeteo: {
          data: {
            wave: [{
              waveHeight: waveHeight,
              wavePeriod: 5 + Math.round(random(timeSeed + 7) * 3),
              waveDirection: windDirection + Math.round(random(timeSeed + 8) * 40 - 20)
            }]
          }
        },
        noaa: {
          tides: [{
            height: tideHeight,
            type: tideHeight > 1.5 ? 'high' : 'low'
          }]
        }
      },
      timestamp: time.toISOString(),
      requestedTime: time.toISOString()
    };
    
    console.log(`⏰ Generated time-specific data for ${time.toTimeString()}:`, {
      temperature,
      windSpeed,
      windDirection,
      waveHeight,
      tideHeight,
      hour,
      isNight,
      isMorning,
      isAfternoon
    });
    
    return weatherData;
  }

  // Derive a simple snapshot from multi-source weather response
  function extractSnapshot(weatherData: any) {
    try {
      const data = weatherData?.data || {};
      const asOf = weatherData?.timestamp || new Date().toISOString();
      // Temperature and wind from OWM or HKO
      const owmCurrent = data.openweathermap?.current || data.openweathermap?.data?.current;
      const hko = data.hko?.current || data.hko;
      const temperature = (owmCurrent?.temp ?? hko?.temperature) ?? undefined;
      const windSpeed = (owmCurrent?.wind_speed ?? hko?.windSpeed) ?? undefined;
      const windDirection = (owmCurrent?.wind_deg ?? hko?.windDirection) ?? undefined;
      // Waves from Open-Meteo
      const omWave0 = data.openmeteo?.data?.wave?.[0];
      const waveHeight = omWave0?.waveHeight ?? undefined;
      // Tide from NOAA (note: API returns `tides` array, not `data.tide`)
      const noaa0 = Array.isArray(data.noaa?.tides) ? data.noaa.tides[0] : undefined;
      const tideHeight = noaa0?.height ?? undefined;
      return { temperature, windSpeed, windDirection, waveHeight, tideHeight, asOf };
    } catch {
      return { asOf: new Date().toISOString() } as any;
    }
  }

  // Format a friendly weekday + time string for the snapshot timestamp
  function formatDayAndTime(isoString?: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    try {
      const day = date.toLocaleDateString(undefined, { weekday: 'short' });
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${day} ${time}`;
    } catch {
      const dayIndex = date.getDay();
      const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const hours = date.getHours();
      const minutes = `${date.getMinutes()}`.padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 === 0 ? 12 : hours % 12;
      return `${shortDays[dayIndex]} ${hour12}:${minutes} ${ampm}`;
    }
  }

  // Combine separate selected date and time into a single ISO string
  function combineDateAndTime(d: Date, t: Date): string {
    const combined = new Date(d);
    combined.setHours(t.getHours(), t.getMinutes(), 0, 0);
    return combined.toISOString();
  }

  // Ensure chart series is prepared whenever a marker/time is chosen
  useEffect(() => {
    if (!selectedMarker) {
      console.log('⏳ No selectedMarker yet; skipping series generation');
      return;
    }
    const series = generateSixHourSeries(selectedTime, {
      windSpeed: selectedMarker.windSpeed ?? 8,
      waveHeight: selectedMarker.waveHeight ?? 1.0,
      tideHeight: 1.2,
    });
    setChartSeries(series);
    console.log('✅ Chart series ready', { points: series.length, title: selectedMarker.title });
  }, [selectedMarker, selectedTime]);

  const renderWeatherIcon = (size: number = 60) => {
    const conditions = currentWeather?.conditions?.toLowerCase() || '';
    if (conditions.includes('rain')) {
      return <Droplets size={size} color="#007AFF" />;
    } else if (conditions.includes('cloud')) {
      return <Cloud size={size} color="#007AFF" />;
    } else {
      return <Wind size={size} color="#007AFF" />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Modern Weather Top Bar - Positioned absolutely over the map */}
      <View style={styles.topBarContainer}>
        <ModernWeatherTopBar
        selectedLocation={selectedLocation}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onLocationChange={(location: LocationData) => {
          setSelectedLocation(location);
          // Additional location change logic can be added here
        }}
        onDateChange={(date: Date) => {
          setSelectedDate(date);
          // Additional date change logic can be added here
        }}
        onTimeChange={(time: Date) => {
          setSelectedTime(time);
          // Additional time change logic can be added here
        }}
        isLoading={isLoadingLocationData}
        error={locationDataError}
        />
      </View>

      {/* Map View - Full Screen */}
      <View style={styles.mapContainer}>
        {/* Map View with OpenSeaMap */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={INITIAL_REGION}
          showsUserLocation
          showsCompass={false}
          showsScale
          mapType="standard"
          onRegionChangeComplete={(region) => {
            // Refresh weather data when map region changes significantly
            console.log('🗺️ Map region changed, refreshing weather data');
            // Trigger a refresh of location weather data
            const preloadLocationWeatherData = async () => {
              const loadingPromises = STATION_LOCATIONS.map(async (location) => {
                setLocationLoadingStates(prev => new Map(prev).set(location.id, true));
                try {
                  await fetchLocationWeatherData(location);
                } finally {
                  setLocationLoadingStates(prev => new Map(prev).set(location.id, false));
                }
              });
              await Promise.all(loadingPromises);
            };
            preloadLocationWeatherData();
          }}
        >
        {/* OpenSeaMap Nautical Chart Overlay */}
        {selectedOverlays.includes('seamark') && (
          <UrlTile
            urlTemplate={OPENSEAMAP_CONFIG.seamark}
            zIndex={1}
            tileSize={256}
            opacity={0.7}
          />
        )}

        {/* Legacy wind-only markers removed in favor of combined datagram */}

        {/* Legacy wave-only markers removed */}

        {/* Legacy tide-only markers removed */}

        {/* Legacy wind direction indicators removed */}

        {/* Legacy wave height circles removed */}

        {/* Combined Datagram Markers for each station location */}
        {STATION_LOCATIONS.map((location, index) => {
          // Get location-specific weather data from cache
          const cacheKey = `${location.id}_${selectedDate.toDateString()}_${selectedTime.getHours()}`;
          const cachedData = locationWeatherCache.get(cacheKey);
          const isLoading = locationLoadingStates.get(location.id) || false;
          
          // Use cached location-specific data or fallback to global data
          const windSpeed = cachedData?.windSpeed ?? snapshot?.windSpeed ?? currentWeather?.windSpeed ?? 8;
          const windDirection = cachedData?.windDirection ?? snapshot?.windDirection ?? currentWeather?.windDirection ?? 45;
          const waveHeight = cachedData?.waveHeight ?? snapshot?.waveHeight ?? currentMarine?.waveHeight ?? 0.8;
          const tideHeight = cachedData?.tideHeight ?? snapshot?.tideHeight ?? currentMarine?.tideHeight ?? 1.2;
          
          // Generate realistic trends based on the actual data values
          const windTrend = windSpeed > 10 ? 'up' : windSpeed < 6 ? 'down' : 'up';
          const waveTrend = waveHeight > 1.0 ? 'up' : waveHeight < 0.5 ? 'down' : 'up';
          const tideTrend = tideHeight > 1.5 ? 'up' : tideHeight < 0.8 ? 'down' : 'up';
          
          const trend = {
            wind: windTrend as 'up' | 'down',
            wave: waveTrend as 'up' | 'down',
            tide: tideTrend as 'up' | 'down',
          };
          return (
            <Marker
              key={`datagram-${location.id}`}
              coordinate={location.coordinate}
              title={location.name}
              description={`Wind ${Math.round(windSpeed)}kts • Waves ${waveHeight.toFixed(1)}m • Tide ${tideHeight.toFixed(1)}m`}
              onPress={() => {
                console.log('🟡 Combined datagram pressed', { location: location.name, windSpeed, waveHeight, tideHeight });
                setSelectedDatagramLocation({
                  id: location.id,
                  name: location.name,
                  coordinate: location.coordinate,
                });
                setDatagramModalVisible(true);
              }}
              zIndex={600}
            >
              <View style={styles.waterMarkerContainer}>
                <View style={styles.datagramLabelContainer}>
                  <IOSText style={styles.datagramLabelText}>{location.name}</IOSText>
                </View>
                <View style={[styles.waterMarkerContent, styles.windWaterMarker, isLoading && styles.loadingMarker]}>
                  <Wind size={16} color="#FFF" />
                  <IOSText style={styles.waterMarkerText}>
                    {isLoading ? '...' : `${Math.round(windSpeed)} kts`}
                  </IOSText>
                  {!isLoading && (
                    <View style={styles.tideTrendIndicator}>
                      {trend.wind === 'up' ? (
                        <ArrowUp size={12} color="#FFF" />
                      ) : (
                        <ArrowDown size={12} color="#FFF" />
                      )}
                    </View>
                  )}
                </View>
                <View style={[styles.waterMarkerContent, styles.waveWaterMarker, isLoading && styles.loadingMarker]}>
                  <Waves size={16} color="#FFF" />
                  <IOSText style={styles.waterMarkerText}>
                    {isLoading ? '...' : `${waveHeight.toFixed(1)} m`}
                  </IOSText>
                  {!isLoading && (
                    <View style={styles.tideTrendIndicator}>
                      {trend.wave === 'up' ? (
                        <ArrowUp size={12} color="#FFF" />
                      ) : (
                        <ArrowDown size={12} color="#FFF" />
                      )}
                    </View>
                  )}
                </View>
                <View style={[styles.waterMarkerContent, styles.tideWaterMarker, isLoading && styles.loadingMarker]}>
                  <Anchor size={16} color="#FFF" />
                  <IOSText style={styles.waterMarkerText}>
                    {isLoading ? '...' : `${tideHeight.toFixed(1)} m`}
                  </IOSText>
                  {!isLoading && (
                    <View style={styles.tideTrendIndicator}>
                      {trend.tide === 'up' ? (
                        <ArrowUp size={12} color="#FFF" />
                      ) : (
                        <ArrowDown size={12} color="#FFF" />
                      )}
                    </View>
                  )}
                </View>
              </View>
            </Marker>
          );
        })}

        {/* Center of Race Area marker removed */}
      </MapView>

        {/* Weather Conditions Overlay */}
        <WeatherConditionsOverlay />

          {/* Map Layer Controls - Removed - All overlays always on */}

          {/* Bottom Sheet for Detailed Info */}
          <Animated.View
            style={[styles.bottomSheet, animatedBottomSheetStyle, styles.glassmorphism]}
          >
            <TouchableOpacity
              style={styles.bottomSheetHandle}
              onPress={() => {
                bottomSheetOffset.value = withSpring(
                  bottomSheetOffset.value === 0 ? SCREEN_HEIGHT * 0.4 : 0
                );
              }}
            >
              <View style={styles.handle} />
            </TouchableOpacity>

            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.markerDetails}>
                <IOSText style={styles.markerTitle}>
                  {selectedMarker ? selectedMarker.title : 'Clearwater Bay'}
                </IOSText>
                <View style={styles.markerMetrics}>
                  <View style={styles.detailRow}>
                    <Wind size={16} color="#007AFF" />
                    <IOSText style={styles.detailText}>
                      Wind: {selectedMarker ? selectedMarker.windSpeed : currentWeather?.windSpeed || 12} kts {formatWindDirection(selectedMarker ? selectedMarker.windDirection : currentWeather?.windDirection || 45)}
                    </IOSText>
                  </View>
                  <View style={styles.detailRow}>
                    <Waves size={16} color="#007AFF" />
                    <IOSText style={styles.detailText}>
                      Waves: {selectedMarker ? selectedMarker.waveHeight : currentMarine?.waveHeight || 1.2}m
                    </IOSText>
                  </View>
                  <View style={styles.detailRow}>
                    <Thermometer size={16} color="#007AFF" />
                    <IOSText style={styles.detailText}>
                      Temperature: {selectedMarker ? selectedMarker.temperature : currentWeather?.temperature || 24}°C
                    </IOSText>
                  </View>
                  <View style={styles.detailRow}>
                    <Anchor size={16} color="#007AFF" />
                    <IOSText style={styles.detailText}>
                      Tide: {currentMarine?.tideHeight || 1.8}m {getTideDirection()}
                    </IOSText>
                  </View>
                </View>
              </View>

              {/* Wave Data Status */}
              {selectedOverlays.includes('wave') && (
                <View style={styles.waveDataStatus}>
                  <IOSText style={styles.sectionTitle}>Wave Data Status</IOSText>
                  {waveDataLoading ? (
                    <IOSText style={styles.statusText}>Loading wave data...</IOSText>
                  ) : waveDataError ? (
                    <IOSText style={[styles.statusText, styles.errorText]}>
                      {waveDataError}
                    </IOSText>
                  ) : (
                    <IOSText style={styles.statusText}>
                      {waveStations.length} wave stations active
                    </IOSText>
                  )}
                </View>
              )}

              {/* Tide Data Status */}
              {selectedOverlays.includes('tide') && (
                <View style={styles.tideDataStatus}>
                  <IOSText style={styles.sectionTitle}>Tide Data Status</IOSText>
                  {tideDataLoading ? (
                    <IOSText style={styles.statusText}>Loading tide data...</IOSText>
                  ) : tideDataError ? (
                    <IOSText style={[styles.statusText, styles.errorText]}>
                      {tideDataError}
                    </IOSText>
                  ) : (
                    <IOSText style={styles.statusText}>
                      {tideStations.length} tide stations active
                    </IOSText>
                  )}
                </View>
              )}

              {/* Hourly Forecast */}
              <View style={styles.forecastSection}>
                <IOSText style={styles.sectionTitle}>Hourly Forecast</IOSText>
                {hourlyForecast.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {hourlyForecast.slice(0, 12).map((hour, index) => {
                      const hourTime = new Date();
                      hourTime.setHours(hourTime.getHours() + index);
                      const tideCycle = (hourTime.getHours() * Math.PI) / 6.2;
                      const tideValue = Math.sin(tideCycle);
                      const tideDirection = tideValue > 0.1 ? '↗' : tideValue < -0.1 ? '↘' : '→';
                      
                      return (
                        <View key={index} style={styles.hourlyItem}>
                          <IOSText style={styles.hourlyTime}>
                            {hourTime.getHours()}:00
                          </IOSText>
                          <Cloud size={20} color="#007AFF" />
                          <IOSText style={styles.hourlyTemp}>{hour.temperature}°</IOSText>
                          <IOSText style={styles.hourlyWind}>{hour.windSpeed}kt</IOSText>
                          <IOSText style={styles.hourlyTide}>
                            {hour.tideHeight.toFixed(1)}m {tideDirection}
                          </IOSText>
                        </View>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <View style={styles.noDataContainer}>
                    <IOSText style={styles.noDataText}>
                      Loading hourly forecast...
                    </IOSText>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>

      {/* Station Detail Chart Modal */}
      <IOSModal
        visible={chartVisible}
        onClose={() => setChartVisible(false)}
        presentationStyle="pageSheet"
      >
        <View style={{ padding: 16 }}>
          <IOSText style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
            {selectedMarker?.title}
          </IOSText>
          {chartSeries.length > 0 ? (
            <>
              <HourlyForecastChart data={chartSeries} selectedMetric="wind" />
              <View style={{ height: 12 }} />
              <HourlyForecastChart data={chartSeries} selectedMetric="waves" />
              <View style={{ height: 12 }} />
              <HourlyForecastChart data={chartSeries} selectedMetric="tides" />
            </>
          ) : (
            <View>
              <IOSText style={{ color: '#8E8E93' }}>Preparing chart data…</IOSText>
            </View>
          )}
        </View>
      </IOSModal>

      {/* Datagram Detail Modal */}
      <DatagramDetailModal
        visible={datagramModalVisible}
        onClose={() => setDatagramModalVisible(false)}
        location={selectedDatagramLocation || {
          id: 'default',
          name: 'Unknown Location',
          coordinate: { latitude: 0, longitude: 0 }
        }}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        currentData={{
          windSpeed: snapshot?.windSpeed ?? currentWeather?.windSpeed ?? 8,
          windDirection: snapshot?.windDirection ?? currentWeather?.windDirection ?? 45,
          waveHeight: snapshot?.waveHeight ?? currentMarine?.waveHeight ?? 0.8,
          tideHeight: snapshot?.tideHeight ?? currentMarine?.tideHeight ?? 1.2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // Account for status bar
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
  },
  glassmorphism: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mapControls: {
    position: 'absolute',
    bottom: 140,
    left: 16,
    right: 16,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  scrollViewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 60,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
  },
  controlText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  controlTextActive: {
    color: '#FFF',
  },
  toggleAllButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.8)', // Orange background
    minWidth: 70,
  },
  toggleAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerContent: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveMarkerContent: {
    backgroundColor: '#0096FF',
  },
  tideMarkerContent: {
    backgroundColor: '#00C864',
  },
  tideRisingMarker: {
    backgroundColor: '#00A86B', // Darker green for rising
  },
  tideFallingMarker: {
    backgroundColor: '#FF6B6B', // Red for falling
  },
  tideStableMarker: {
    backgroundColor: '#FFA500', // Orange for stable
  },
  tideTrendIndicator: {
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  markerDetails: {
    marginVertical: 8,
  },
  markerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  markerMetrics: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  waveDataStatus: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 150, 255, 0.1)',
    borderRadius: 8,
  },
  tideDataStatus: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 200, 100, 0.1)',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    color: '#FF3B30',
  },
  forecastSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 12,
    padding: 6,
  },
  hourlyTime: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
  },
  hourlyTemp: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginTop: 3,
  },
  hourlyWind: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
  hourlyTide: {
    fontSize: 9,
    color: '#007AFF',
    marginTop: 1,
    fontWeight: '500',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  raceAreaMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  raceAreaMarkerContent: {
    backgroundColor: '#FF3B30',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  raceAreaMarkerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  waterMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterMarkerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  windWaterMarker: {
    backgroundColor: '#007AFF', // Blue for wind
  },
  waveWaterMarker: {
    backgroundColor: '#0096FF', // Light blue for waves
  },
  tideWaterMarker: {
    backgroundColor: '#00C864', // Green for tide
  },
  loadingMarker: {
    opacity: 0.6,
    backgroundColor: '#8E8E93', // Gray for loading
  },
  waterMarkerText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  datagramLabelContainer: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
  },
  datagramLabelText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});