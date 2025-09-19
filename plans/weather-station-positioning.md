# Weather Station Positioning & Map Layer Enhancement Plan

## Feature Description

We need to enhance the weather tab (located under the "More" tab) to display precise positioning of weather monitoring stations on the map. Currently, there are three control buttons for nautical map layer, radar, and satellite overlays. We need to:

1. **Add station toggle buttons** for wind, wave, and tide stations with corresponding data
2. **Ensure accurate positioning** of 12 Hong Kong tide-prediction sites using official coordinates
3. **Show absolute positions** of wind, tide, and wave stations on the map
4. **Maintain existing functionality** of radar, satellite, and nautical map layers

## Current State Analysis

### Existing Infrastructure ✅
- **Weather Layer Controls**: `src/components/weather/WeatherLayerControls.tsx` with radar/satellite toggles
- **Weather Map Layer**: `src/components/weather/WeatherMapLayer.tsx` supporting wind/waves/tides/currents
- **Wind Station Service**: `src/services/windStationService.ts` with 12+ HKO stations and marine buoys
- **Weather Screen**: `src/screens/tabs/WeatherScreen.tsx` under More tab
- **Coordinate Constants**: `src/constants/raceCoordinates.ts` for racing area

### Research Completed ✅
- **6 HKO Tide Stations**: Official coordinates from https://www.hko.gov.hk/en/cis/stn.htm
- **6 Additional Stations**: MD/AAHK/DSD operators from https://www.gov.hk/en/residents/transport/vessel/realtime_tide.htm
- **Wind Stations**: Existing service has comprehensive coverage
- **Wave Stations**: Can leverage existing marine weather buoy locations

## Updated Design Decisions (Based on User Feedback)

1. **Station Toggle Integration**: Integrate wind/wave/tide station toggles with existing 3 buttons (nautical, radar, satellite) in unified 6-button layout
2. **Nautical Chart Enhancement**: Keep current implementation, improve if possible during development
3. **Station Info Display**: Detailed modal with forecast data, historical trends, and station metadata when tapping markers
4. **Performance Strategy**: Implement clustering at zoom levels <12 to handle 30+ stations efficiently

## Implementation Architecture

### Phase 1: Station Data Constants

#### 1.1 Create Tide Stations Constants
**File**: `src/constants/hkTideStations.ts`

```typescript
export interface TideStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  operator: 'HKO' | 'MD' | 'AAHK' | 'DSD';
  verified: boolean;
}

// Convert DMS coordinates from HKO to decimal
function dmsToDecimal(degrees: number, minutes: number, seconds: number): number {
  return degrees + minutes / 60 + seconds / 3600;
}

export const HK_TIDE_STATIONS: TideStation[] = [
  // HKO verified stations (6)
  { id: 'TBT', name: 'Tsim Bei Tsui', lat: 22.4872, lon: 114.0142, operator: 'HKO', verified: true },
  { id: 'QUB', name: 'Quarry Bay', lat: 22.2911, lon: 114.2133, operator: 'HKO', verified: true },
  // ... additional stations
];
```

#### 1.2 Create Wave Stations Constants
**File**: `src/constants/hkWaveStations.ts`

```typescript
export interface WaveStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'buoy' | 'coastal' | 'offshore';
  verified: boolean;
}

// Leverage existing marine weather buoy locations from windStationService
export const HK_WAVE_STATIONS: WaveStation[] = [
  // Marine weather buoys for wave monitoring
  { id: 'VH01', name: 'Victoria Harbour Central', lat: 22.2850, lon: 114.1650, type: 'buoy', verified: true },
  // ... additional stations
];
```

#### 1.3 Verify Wind Stations
**Action**: Review `src/services/windStationService.ts` and ensure coordinates are accurate for map display.

### Phase 2: Weather Layer Control Enhancements

#### 2.1 Extend WeatherLayerControls Component
**File**: `src/components/weather/WeatherLayerControls.tsx`

Add new props and state for station toggles:

```typescript
interface WeatherLayerControlsProps {
  // Existing props...
  radarVisible?: boolean;
  satelliteVisible?: boolean;

  // New station visibility props
  windStationsVisible?: boolean;
  waveStationsVisible?: boolean;
  tideStationsVisible?: boolean;
  nauticalMapVisible?: boolean;

  // New callback props
  onWindStationsToggle?: (visible: boolean) => void;
  onWaveStationsToggle?: (visible: boolean) => void;
  onTideStationsToggle?: (visible: boolean) => void;
  onNauticalMapToggle?: (visible: boolean) => void;
}
```

Update layout to integrated 6-button design:

```typescript
{/* Integrated Weather & Station Controls */}
<View style={styles.controlsContainer}>
  {/* Top Row: Existing Overlays */}
  <View style={styles.buttonRow}>
    {/* Nautical Map Toggle */}
    <TouchableOpacity
      style={[styles.layerButton, nauticalMapVisible && styles.layerButtonActive]}
      onPress={() => onNauticalMapToggle?.(!nauticalMapVisible)}
    >
      <Map size={18} color={nauticalMapVisible ? "#FFF" : "#00C864"} />
      <Text style={[styles.layerButtonText, nauticalMapVisible && styles.layerButtonTextActive]}>
        Nautical
      </Text>
    </TouchableOpacity>

    {/* Radar Toggle */}
    <TouchableOpacity
      style={[styles.layerButton, radarVisible && styles.layerButtonActive]}
      onPress={handleRadarToggle}
    >
      <CloudRain size={18} color={radarVisible ? "#FFF" : "#00C864"} />
      <Text style={[styles.layerButtonText, radarVisible && styles.layerButtonTextActive]}>
        Radar
      </Text>
    </TouchableOpacity>

    {/* Satellite Toggle */}
    <TouchableOpacity
      style={[styles.layerButton, satelliteVisible && styles.layerButtonActive]}
      onPress={handleSatelliteToggle}
    >
      {getSatelliteIcon()}
      <Text style={[styles.layerButtonText, satelliteVisible && styles.layerButtonTextActive]}>
        Satellite
      </Text>
    </TouchableOpacity>
  </View>

  {/* Bottom Row: Station Toggles */}
  <View style={styles.buttonRow}>
    {/* Wind Stations */}
    <TouchableOpacity
      style={[styles.layerButton, windStationsVisible && styles.layerButtonActive]}
      onPress={() => onWindStationsToggle?.(!windStationsVisible)}
    >
      <Wind size={18} color={windStationsVisible ? "#FFF" : "#00C864"} />
      <Text style={[styles.layerButtonText, windStationsVisible && styles.layerButtonTextActive]}>
        Wind
      </Text>
    </TouchableOpacity>

    {/* Wave Stations */}
    <TouchableOpacity
      style={[styles.layerButton, waveStationsVisible && styles.layerButtonActive]}
      onPress={() => onWaveStationsToggle?.(!waveStationsVisible)}
    >
      <Waves size={18} color={waveStationsVisible ? "#FFF" : "#00C864"} />
      <Text style={[styles.layerButtonText, waveStationsVisible && styles.layerButtonTextActive]}>
        Waves
      </Text>
    </TouchableOpacity>

    {/* Tide Stations */}
    <TouchableOpacity
      style={[styles.layerButton, tideStationsVisible && styles.layerButtonActive]}
      onPress={() => onTideStationsToggle?.(!tideStationsVisible)}
    >
      <Activity size={18} color={tideStationsVisible ? "#FFF" : "#00C864"} />
      <Text style={[styles.layerButtonText, tideStationsVisible && styles.layerButtonTextActive]}>
        Tides
      </Text>
    </TouchableOpacity>
  </View>
</View>
```

#### 2.2 Update Weather Store
**File**: `src/stores/weatherStore.ts`

Add station visibility state:

```typescript
interface WeatherState {
  // Existing state...

  // Station visibility
  windStationsVisible: boolean;
  waveStationsVisible: boolean;
  tideStationsVisible: boolean;
  nauticalMapVisible: boolean;

  // Actions
  toggleWindStations: () => void;
  toggleWaveStations: () => void;
  toggleTideStations: () => void;
  toggleNauticalMap: () => void;
}
```

### Phase 3: Station Marker Components

#### 3.1 Create Station Marker Components
**File**: `src/components/weather/StationMarkers.tsx`

```typescript
interface StationMarkerProps {
  station: TideStation | WaveStation | WindStation;
  type: 'tide' | 'wave' | 'wind';
  onPress?: (station: any) => void;
}

export const TideStationMarker: React.FC<{ station: TideStation; onPress?: (station: TideStation) => void }> = ({ station, onPress }) => (
  <Marker
    coordinate={{ latitude: station.lat, longitude: station.lon }}
    onPress={() => onPress?.(station)}
  >
    <View style={styles.tideMarker}>
      <Waves size={16} color="#007AFF" />
      {station.verified && <View style={styles.verifiedIndicator} />}
    </View>
  </Marker>
);

// Similar for WaveStationMarker and WindStationMarker
```

#### 3.2 Extend WeatherMapLayer
**File**: `src/components/weather/WeatherMapLayer.tsx`

Add station overlay support:

```typescript
export type OverlayMode = 'wind' | 'waves' | 'tides' | 'currents' | 'temperature' | 'stations';

interface WeatherMapLayerProps {
  // Existing props...

  // Station data
  tideStations?: TideStation[];
  waveStations?: WaveStation[];
  windStations?: WindStation[];

  // Station visibility
  showTideStations?: boolean;
  showWaveStations?: boolean;
  showWindStations?: boolean;

  onStationPress?: (station: any, type: 'tide' | 'wave' | 'wind') => void;
}

// In render method:
{showTideStations && tideStations?.map(station => (
  <TideStationMarker
    key={station.id}
    station={station}
    onPress={(station) => onStationPress?.(station, 'tide')}
  />
))}
```

### Phase 4: Integration & Data Flow

#### 4.1 Update Weather Screen
**File**: `src/screens/tabs/WeatherScreen.tsx`

Connect station data and controls:

```typescript
import { HK_TIDE_STATIONS } from '../../constants/hkTideStations';
import { HK_WAVE_STATIONS } from '../../constants/hkWaveStations';
import { windStationService } from '../../services/windStationService';

// In component:
const [windStations, setWindStations] = useState<WindStation[]>([]);

useEffect(() => {
  const loadWindStations = async () => {
    const stations = await windStationService.getWindStations();
    setWindStations(stations);
  };
  loadWindStations();
}, []);

// Pass data to WeatherMapLayer and WeatherLayerControls
```

#### 4.2 Add Nautical Chart Layer
**File**: `src/components/weather/NauticalChartOverlay.tsx`

```typescript
interface NauticalChartOverlayProps {
  visible: boolean;
  opacity?: number;
  region: MapRegion;
}

export const NauticalChartOverlay: React.FC<NauticalChartOverlayProps> = ({ visible, opacity = 0.7, region }) => {
  if (!visible) return null;

  return (
    <UrlTile
      urlTemplate="https://tileserver.domain.com/nautical/{z}/{x}/{y}.png"
      maximumZ={18}
      opacity={opacity}
    />
  );
};
```

## Technical Considerations

### Expo Dev Build Compatibility ✅
- Using native modules is allowed (unlike Expo Go restrictions)
- Can leverage react-native-maps UrlTile for nautical charts
- No package installation restrictions

### Performance Optimization
- **Station Sampling**: Limit displayed stations based on zoom level
- **Marker Clustering**: Group nearby stations at low zoom levels
- **Caching**: Use existing wind station service caching patterns
- **Lazy Loading**: Load station data only when toggled on

### Coordinate Accuracy
- **Verified Stations**: 6 HKO stations with official DMS coordinates converted to decimal
- **Researched Stations**: 6 additional stations with estimated coordinates marked as unverified
- **Bounds Validation**: All coordinates within Hong Kong bounds (21.9–22.6 lat, 113.8–114.4 lon)

### UI/UX Consistency
- **Visual Hierarchy**: Station toggles in separate section below radar/satellite
- **Icon System**: Consistent with existing Lucide icons (Wind, Waves, Navigation)
- **Color Coding**: Different colors per station type, verified indicators
- **Accessibility**: Proper touch targets and screen reader support

## Implementation Commands

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npx eslint src/ --ext .ts,.tsx
```

### Testing
```bash
npm test -- --testPathPattern="weather|station"
```

### Build Verification
```bash
npm run ios        # Test on iOS simulator
npm run web        # Test web version
```

## Success Criteria

1. **Station Visibility**: All 12 tide stations, wind stations, and wave stations display at correct coordinates
2. **Toggle Functionality**: Each station type can be independently shown/hidden
3. **Coordinate Accuracy**: Verified stations show at official coordinates, unverified stations at researched locations
4. **Performance**: Map remains responsive with all stations displayed
5. **Integration**: Works seamlessly with existing radar/satellite/nautical toggles
6. **Visual Quality**: Station markers are clearly distinguishable and appropriately sized

## Implementation Order

1. ✅ Research tide station coordinates (completed)
2. 🔄 Create constants files for all station types
3. 🔄 Extend WeatherLayerControls with station toggles
4. 🔄 Create station marker components
5. 🔄 Update WeatherMapLayer to render stations
6. 🔄 Integrate with Weather Screen
7. 🔄 Add nautical chart overlay
8. 🔄 Test positioning accuracy and performance
9. 🔄 Quality checks and refinements

---

*This plan will be updated during implementation as new insights emerge.*