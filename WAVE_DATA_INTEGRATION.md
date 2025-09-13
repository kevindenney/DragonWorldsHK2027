# Wave Data Integration

This document describes the complete integration of real wave data with water area validation for the Dragon Worlds HK 2027 weather map.

## Overview

The wave data integration ensures that:
- Wave stations are positioned only over water areas
- Real wave data is fetched from Open-Meteo API
- Fallback simulated data is provided when API fails
- Wave icons display actual wave height measurements
- Water area validation prevents land-based wave stations

## Architecture

### 1. Wave Data Service (`src/services/waveDataService.ts`)

**Key Features:**
- Water area validation using predefined Hong Kong water boundaries
- Real-time wave data fetching from Open-Meteo API
- Fallback simulation when API data unavailable
- Caching with 15-minute refresh intervals
- Coordinate validation before station creation

**Water Areas Covered:**
- Victoria Harbour
- Clearwater Bay
- Repulse Bay
- Stanley Bay
- Aberdeen Harbour

### 2. Updated Weather Map Screen

**Enhanced Features:**
- Real wave data integration
- Water-validated wave station positioning
- Wave data loading states and error handling
- Separate wave and wind data overlays
- Real-time wave data updates

## API Integration

### Open-Meteo Marine Data

The service fetches wave data from Open-Meteo API with the following parameters:

```typescript
interface WaveData {
  waveHeight: number;      // Wave height in meters
  wavePeriod: number;      // Wave period in seconds
  waveDirection: number;   // Wave direction in degrees
  swellHeight: number;     // Swell height in meters
  swellPeriod: number;     // Swell period in seconds
  swellDirection: number;  // Swell direction in degrees
}
```

### Data Quality Levels

- **High**: Real API data from Open-Meteo
- **Medium**: Cached API data
- **Low**: Simulated fallback data

## Usage

### Basic Wave Data Fetching

```typescript
import { waveDataService } from '../services/waveDataService';

// Get all wave stations
const stations = await waveDataService.getWaveStations();

// Get stations for specific area
const victoriaHarbourStations = await waveDataService.getWaveStationsForArea('Victoria Harbour');

// Validate water location
const isOverWater = waveDataService.validateWaterLocation({
  latitude: 22.285,
  longitude: 114.175
});
```

### Water Area Validation

```typescript
// Check if coordinates are over water
const isValid = waveDataService.validateWaterLocation(coordinate);

// Get all water areas
const waterAreas = waveDataService.getWaterAreas();
```

## Map Integration

### Wave Overlay Display

When the "Waves" filter is selected:

1. **Wave Station Markers**: Display wave height with wave icons
2. **Wave Height Circles**: Visual representation of wave intensity
3. **Water Validation**: Only stations over water are shown
4. **Real-time Data**: Current wave conditions from API

### Visual Distinctions

- **Wave Markers**: Blue color (`#0096FF`) with wave icons
- **Wind Markers**: Standard blue (`#007AFF`) with wind icons
- **Wave Circles**: Lighter blue with wave height radius
- **Data Quality**: Indicated in station names and status

## Error Handling

### API Failures

- Automatic fallback to simulated data
- Error messages displayed in UI
- Graceful degradation of functionality
- Retry mechanisms with exponential backoff

### Water Validation Errors

- Invalid coordinates rejected before API calls
- Clear error messages for land-based coordinates
- Automatic filtering of invalid stations

## Performance Optimizations

### Caching Strategy

- 15-minute cache for API data
- In-memory station storage
- Efficient water area boundary checking
- Parallel API calls for multiple stations

### Data Loading

- Progressive loading of wave stations
- Background refresh without UI blocking
- Optimized coordinate validation
- Minimal re-renders with React state management

## Testing

### Unit Tests

```bash
npm test waveDataService.test.ts
```

**Test Coverage:**
- Water area validation
- Wave station generation
- API integration
- Error handling
- Fallback mechanisms

### Integration Tests

- Map overlay rendering
- Real-time data updates
- User interaction handling
- Performance under load

## Configuration

### Water Area Boundaries

Water areas are defined in `WATER_AREAS` constant:

```typescript
const WATER_AREAS = [
  {
    name: 'Victoria Harbour',
    bounds: {
      north: 22.300,
      south: 22.260,
      east: 114.200,
      west: 114.140
    }
  },
  // ... more areas
];
```

### Wave Station Locations

Predefined coordinates in `WAVE_STATION_LOCATIONS`:

```typescript
const WAVE_STATION_LOCATIONS: LocationCoordinate[] = [
  { latitude: 22.285, longitude: 114.175 }, // Victoria Harbour
  { latitude: 22.290, longitude: 114.290 }, // Clearwater Bay
  // ... more locations
];
```

## Future Enhancements

### Planned Features

1. **Dynamic Water Detection**: Real-time water/land detection using satellite data
2. **More Wave Parameters**: Wave steepness, breaking probability
3. **Historical Data**: Wave trend analysis and forecasting
4. **Custom Stations**: User-defined wave monitoring points
5. **Offline Support**: Cached data for offline viewing

### API Improvements

1. **Multiple Data Sources**: Integration with additional wave data providers
2. **Higher Resolution**: More granular wave data points
3. **Real-time Updates**: WebSocket connections for live data
4. **Predictive Modeling**: Machine learning for wave forecasting

## Troubleshooting

### Common Issues

1. **No Wave Stations Showing**
   - Check API connectivity
   - Verify water area boundaries
   - Check coordinate validation

2. **Stations on Land**
   - Update water area boundaries
   - Check coordinate precision
   - Verify validation logic

3. **Slow Data Loading**
   - Check network connectivity
   - Verify API response times
   - Check caching configuration

### Debug Mode

Enable debug logging:

```typescript
// In waveDataService.ts
const DEBUG = true;

if (DEBUG) {
  console.log('Wave station validation:', station);
}
```

## Support

For issues or questions regarding wave data integration:

1. Check the test suite for expected behavior
2. Review API documentation for data format
3. Verify water area boundaries are correct
4. Check network connectivity and API status

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Dragon Worlds HK 2027 Development Team
