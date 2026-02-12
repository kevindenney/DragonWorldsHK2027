/**
 * Wind Station Service Tests
 *
 * Tests for the wind station service to ensure real coordinates
 * and proper data validation are working correctly.
 *
 * WeatherAPI is mocked to avoid hitting real external APIs in tests.
 */

jest.mock('../weatherAPI', () => {
  return {
    WeatherAPI: jest.fn().mockImplementation(() => ({
      getWeatherData: jest.fn().mockResolvedValue({
        data: {
          openmeteo_weather: {
            data: {
              wind: [{
                windSpeed: 12.5,
                windDirection: 45,
                windGust: 18.2,
                temperature: 26,
                pressure: 1013,
                humidity: 75,
                visibility: 12,
              }],
            },
          },
        },
      }),
    })),
  };
});

jest.mock('../errorHandler', () => ({
  handleWeatherAPIError: jest.fn().mockReturnValue('mock error'),
}));

import { windStationService } from '../windStationService';

describe('WindStationService', () => {
  beforeEach(() => {
    // Clear cache before each test
    windStationService.clearCache();
  });

  describe('getWindStations', () => {
    it('should return wind stations with real coordinates', async () => {
      const stations = await windStationService.getWindStations();

      expect(stations).toBeDefined();
      expect(Array.isArray(stations)).toBe(true);
      expect(stations.length).toBeGreaterThan(0);
    });

    it('should have valid coordinates for all stations', async () => {
      const stations = await windStationService.getWindStations();

      stations.forEach(station => {
        expect(station.coordinate).toBeDefined();
        expect(station.coordinate.latitude).toBeGreaterThanOrEqual(-90);
        expect(station.coordinate.latitude).toBeLessThanOrEqual(90);
        expect(station.coordinate.longitude).toBeGreaterThanOrEqual(-180);
        expect(station.coordinate.longitude).toBeLessThanOrEqual(180);
      });
    });

    it('should have valid wind data for all stations', async () => {
      const stations = await windStationService.getWindStations();

      stations.forEach(station => {
        expect(station.windSpeed).toBeGreaterThanOrEqual(0);
        expect(station.windSpeed).toBeLessThanOrEqual(100);
        expect(station.windDirection).toBeGreaterThanOrEqual(0);
        expect(station.windDirection).toBeLessThanOrEqual(360);
      });
    });

    it('should have proper station names and descriptions', async () => {
      const stations = await windStationService.getWindStations();

      stations.forEach(station => {
        expect(station.name).toBeDefined();
        expect(station.name.length).toBeGreaterThan(0);
        expect(station.description).toBeDefined();
        expect(station.description.length).toBeGreaterThan(0);
      });
    });

    it('should include both HKO and marine stations', async () => {
      const stations = await windStationService.getWindStations();

      const hkoStations = stations.filter(s => s.type === 'hko');
      const marineStations = stations.filter(s => s.type === 'marine');

      expect(hkoStations.length).toBeGreaterThan(0);
      expect(marineStations.length).toBeGreaterThan(0);
    });
  });

  describe('getWindStationsForArea', () => {
    it('should return stations within specified area', async () => {
      // Hong Kong racing area bounds
      const stations = await windStationService.getWindStationsForArea(
        22.4,  // north
        22.2,  // south
        114.3, // east
        114.1  // west
      );

      expect(stations).toBeDefined();
      expect(Array.isArray(stations)).toBe(true);

      stations.forEach(station => {
        expect(station.coordinate.latitude).toBeGreaterThanOrEqual(22.2);
        expect(station.coordinate.latitude).toBeLessThanOrEqual(22.4);
        expect(station.coordinate.longitude).toBeGreaterThanOrEqual(114.1);
        expect(station.coordinate.longitude).toBeLessThanOrEqual(114.3);
      });
    });
  });

  describe('getActiveWindStations', () => {
    it('should return only active stations', async () => {
      const activeStations = await windStationService.getActiveWindStations();

      expect(activeStations).toBeDefined();
      expect(Array.isArray(activeStations)).toBe(true);

      activeStations.forEach(station => {
        expect(station.isActive).toBe(true);
      });
    });
  });

  describe('coordinate validation', () => {
    it('should have realistic Hong Kong coordinates', async () => {
      const stations = await windStationService.getWindStations();

      stations.forEach(station => {
        // Hong Kong is roughly between 22.1°N and 22.6°N, 113.8°E and 114.4°E
        expect(station.coordinate.latitude).toBeGreaterThan(22.0);
        expect(station.coordinate.latitude).toBeLessThan(23.0);
        expect(station.coordinate.longitude).toBeGreaterThan(113.5);
        expect(station.coordinate.longitude).toBeLessThan(114.5);
      });
    });
  });
});
