import { waveDataService } from '../waveDataService';

describe('WaveDataService', () => {
  describe('Water Validation', () => {
    it('should validate coordinates over water correctly', () => {
      // Victoria Harbour coordinates
      expect(waveDataService.validateWaterLocation({
        latitude: 22.285,
        longitude: 114.175
      })).toBe(true);

      // Clearwater Bay coordinates
      expect(waveDataService.validateWaterLocation({
        latitude: 22.290,
        longitude: 114.290
      })).toBe(true);

      // Land coordinates (should be false)
      expect(waveDataService.validateWaterLocation({
        latitude: 22.300,
        longitude: 114.100
      })).toBe(false);
    });
  });

  describe('Wave Station Generation', () => {
    it('should generate wave stations for water areas', async () => {
      const stations = await waveDataService.getWaveStations();
      
      expect(stations.length).toBeGreaterThan(0);
      
      // All stations should be over water
      stations.forEach(station => {
        expect(waveDataService.validateWaterLocation(station.coordinate)).toBe(true);
        expect(station.waveHeight).toBeGreaterThan(0);
        expect(station.id).toMatch(/^wave-/);
      });
    });

    it('should get wave stations for specific area', async () => {
      const victoriaHarbourStations = await waveDataService.getWaveStationsForArea('Victoria Harbour');
      
      expect(victoriaHarbourStations.length).toBeGreaterThan(0);
      victoriaHarbourStations.forEach(station => {
        expect(station.name).toContain('Victoria Harbour');
      });
    });
  });

  describe('Water Areas', () => {
    it('should return all water areas', () => {
      const waterAreas = waveDataService.getWaterAreas();
      
      expect(waterAreas.length).toBeGreaterThan(0);
      expect(waterAreas[0]).toHaveProperty('name');
      expect(waterAreas[0]).toHaveProperty('bounds');
    });
  });
});
