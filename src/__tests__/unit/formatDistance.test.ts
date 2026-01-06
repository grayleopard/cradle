import { describe, it, expect } from 'vitest';
import { calculateDistance, ZIP_COORDINATES } from '../../../utils/locationHelpers';

describe('calculateDistance (Haversine formula)', () => {
  describe('Known zip code distances', () => {
    it('should return 0 for same location', () => {
      const coords = ZIP_COORDINATES['98001'];
      expect(calculateDistance(coords.lat, coords.lng, coords.lat, coords.lng)).toBe(0);
    });

    it('should calculate distance between Auburn West and Auburn East', () => {
      const auburn1 = ZIP_COORDINATES['98001']; // Auburn West
      const auburn2 = ZIP_COORDINATES['98002']; // Auburn East
      const distance = calculateDistance(auburn1.lat, auburn1.lng, auburn2.lat, auburn2.lng);
      // Should be about 1.5-2 miles
      expect(distance).toBeGreaterThan(1);
      expect(distance).toBeLessThan(3);
    });

    it('should calculate distance between Auburn and Seattle', () => {
      const auburn = ZIP_COORDINATES['98001'];
      const seattle = ZIP_COORDINATES['98101'];
      const distance = calculateDistance(auburn.lat, auburn.lng, seattle.lat, seattle.lng);
      // Should be about 20-25 miles
      expect(distance).toBeGreaterThan(15);
      expect(distance).toBeLessThan(30);
    });

    it('should calculate distance between Federal Way and Kent', () => {
      const federalWay = ZIP_COORDINATES['98003'];
      const kent = ZIP_COORDINATES['98030'];
      const distance = calculateDistance(federalWay.lat, federalWay.lng, kent.lat, kent.lng);
      // Should be about 5-8 miles
      expect(distance).toBeGreaterThan(3);
      expect(distance).toBeLessThan(10);
    });
  });

  describe('Distance calculation accuracy', () => {
    it('should round to 1 decimal place', () => {
      const result = calculateDistance(47.3069, -122.2619, 47.3073, -122.2284);
      const decimalPlaces = (result.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });

    it('should be symmetric (A to B = B to A)', () => {
      const a = ZIP_COORDINATES['98001'];
      const b = ZIP_COORDINATES['98101'];
      const distanceAB = calculateDistance(a.lat, a.lng, b.lat, b.lng);
      const distanceBA = calculateDistance(b.lat, b.lng, a.lat, a.lng);
      expect(distanceAB).toBe(distanceBA);
    });

    it('should satisfy triangle inequality', () => {
      const a = ZIP_COORDINATES['98001'];
      const b = ZIP_COORDINATES['98002'];
      const c = ZIP_COORDINATES['98101'];

      const ab = calculateDistance(a.lat, a.lng, b.lat, b.lng);
      const bc = calculateDistance(b.lat, b.lng, c.lat, c.lng);
      const ac = calculateDistance(a.lat, a.lng, c.lat, c.lng);

      expect(ac).toBeLessThanOrEqual(ab + bc + 0.1); // Small tolerance for rounding
    });
  });

  describe('Edge cases', () => {
    it('should handle crossing longitude 180', () => {
      // Test points near international date line
      const result = calculateDistance(40.0, 179.0, 40.0, -179.0);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(200); // Should wrap around, not go the long way
    });

    it('should handle equator crossing', () => {
      const result = calculateDistance(1.0, -122.0, -1.0, -122.0);
      // 2 degrees latitude at equator ~= 138 miles
      expect(result).toBeGreaterThan(130);
      expect(result).toBeLessThan(150);
    });

    it('should handle polar coordinates', () => {
      // Near north pole
      const result = calculateDistance(89.0, 0, 89.0, 180);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(150); // Should be relatively short at pole
    });
  });

  describe('Unit verification (miles)', () => {
    it('should return distance in miles', () => {
      // Known distance: Seattle to Portland is ~175 miles
      // Using approximate coordinates
      const seattle = { lat: 47.6062, lng: -122.3321 };
      const portland = { lat: 45.5152, lng: -122.6784 };
      const distance = calculateDistance(seattle.lat, seattle.lng, portland.lat, portland.lng);
      expect(distance).toBeGreaterThan(140);
      expect(distance).toBeLessThan(180);
    });
  });
});

describe('ZIP_COORDINATES', () => {
  it('should have coordinates for Auburn area zip codes', () => {
    expect(ZIP_COORDINATES['98001']).toBeDefined();
    expect(ZIP_COORDINATES['98002']).toBeDefined();
    expect(ZIP_COORDINATES['98092']).toBeDefined();
  });

  it('should have coordinates for Federal Way', () => {
    expect(ZIP_COORDINATES['98003']).toBeDefined();
    expect(ZIP_COORDINATES['98023']).toBeDefined();
  });

  it('should have coordinates for Kent', () => {
    expect(ZIP_COORDINATES['98030']).toBeDefined();
  });

  it('should have coordinates for Seattle Downtown', () => {
    expect(ZIP_COORDINATES['98101']).toBeDefined();
  });

  it('should have valid lat/lng values', () => {
    Object.values(ZIP_COORDINATES).forEach(coords => {
      expect(coords.lat).toBeGreaterThan(45); // Pacific Northwest
      expect(coords.lat).toBeLessThan(50);
      expect(coords.lng).toBeLessThan(-120);
      expect(coords.lng).toBeGreaterThan(-125);
    });
  });
});

// Distance display formatting
describe('Distance Display Formatting', () => {
  const formatDistance = (miles: number): string => {
    if (miles < 0.1) return 'Less than 0.1 mi';
    if (miles < 1) return `${miles.toFixed(1)} mi`;
    if (miles < 10) return `${miles.toFixed(1)} mi`;
    return `${Math.round(miles)} mi`;
  };

  it('should show "Less than 0.1 mi" for very close', () => {
    expect(formatDistance(0.05)).toBe('Less than 0.1 mi');
  });

  it('should show decimal for < 1 mile', () => {
    expect(formatDistance(0.5)).toBe('0.5 mi');
  });

  it('should show decimal for < 10 miles', () => {
    expect(formatDistance(5.3)).toBe('5.3 mi');
  });

  it('should round to whole number for >= 10 miles', () => {
    expect(formatDistance(15.7)).toBe('16 mi');
  });
});
