// Auburn/Seattle Area Zip Code Centers
export const ZIP_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '98001': { lat: 47.3069, lng: -122.2619 }, // Auburn West
  '98002': { lat: 47.3073, lng: -122.2284 }, // Auburn East/Downtown
  '98092': { lat: 47.2831, lng: -122.1812 }, // Lakeland Hills
  '98003': { lat: 47.3087, lng: -122.3060 }, // Federal Way
  '98023': { lat: 47.3023, lng: -122.3644 }, // Federal Way West
  '98030': { lat: 47.3718, lng: -122.2043 }, // Kent
  '98101': { lat: 47.6101, lng: -122.3421 }, // Seattle Downtown
};

// Haversine formula to calculate distance in miles
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 3959; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  
  // Round to 1 decimal place
  return Math.round(d * 10) / 10;
};
