import { describe, it, expect } from 'vitest';
import { calculateDistance, ZIP_COORDINATES } from './locationHelpers';

describe('Location Helpers', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Auburn West to Auburn East
      const auburnWest = ZIP_COORDINATES['98001'];
      const auburnEast = ZIP_COORDINATES['98002'];
      
      const distance = calculateDistance(
        auburnWest.lat, auburnWest.lng,
        auburnEast.lat, auburnEast.lng
      );
      
      // Expected distance is roughly 1.6 miles
      expect(distance).toBeGreaterThan(1.0);
      expect(distance).toBeLessThan(2.0);
    });

    it('should return 0 for same coordinates', () => {
      const point = ZIP_COORDINATES['98001'];
      const distance = calculateDistance(point.lat, point.lng, point.lat, point.lng);
      expect(distance).toBe(0);
    });

    it('should handle long distances accurately', () => {
      // Seattle to Auburn (~20-25 miles)
      const seattle = ZIP_COORDINATES['98101'];
      const auburn = ZIP_COORDINATES['98001'];
      
      const distance = calculateDistance(
        seattle.lat, seattle.lng,
        auburn.lat, auburn.lng
      );
      
      expect(distance).toBeGreaterThan(20);
      expect(distance).toBeLessThan(30);
    });
  });

  describe('ZIP_COORDINATES', () => {
    it('should contain key Auburn zip codes', () => {
      expect(ZIP_COORDINATES).toHaveProperty('98001');
      expect(ZIP_COORDINATES).toHaveProperty('98002');
      expect(ZIP_COORDINATES).toHaveProperty('98092');
    });
  });
});