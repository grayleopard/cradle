import {
  DayOfWeek,
  TimeSlot,
  DayAvailability,
  UserAvailability,
  MatchedTimeSlot,
  SafeMeetupLocation,
  LocationSuggestion,
  GeofenceResult,
  PORCH_PICKUP_CONSTANTS,
  DEFAULT_AVAILABILITY
} from '../types';
import { calculateDistance, ZIP_COORDINATES } from './locationHelpers';

// Pre-seeded safe meetup locations for Auburn/Seattle area
export const SAFE_MEETUP_LOCATIONS: SafeMeetupLocation[] = [
  {
    id: 'loc_auburn_pd',
    name: 'Auburn Police Department',
    type: 'police_station',
    address: '340 E Main St',
    city: 'Auburn',
    state: 'WA',
    zip: '98002',
    coordinates: { lat: 47.3073, lng: -122.2284 },
    openHours: '24/7',
    hasParking: true,
    isVerified: true
  },
  {
    id: 'loc_auburn_lib',
    name: 'Auburn Library',
    type: 'library',
    address: '1102 Auburn Way S',
    city: 'Auburn',
    state: 'WA',
    zip: '98002',
    coordinates: { lat: 47.3015, lng: -122.2260 },
    openHours: 'Mon-Sat 10am-6pm',
    hasParking: true,
    isVerified: true
  },
  {
    id: 'loc_kent_pd',
    name: 'Kent Police Department',
    type: 'police_station',
    address: '220 4th Ave S',
    city: 'Kent',
    state: 'WA',
    zip: '98032',
    coordinates: { lat: 47.3838, lng: -122.2349 },
    openHours: '24/7',
    hasParking: true,
    isVerified: true
  },
  {
    id: 'loc_kent_lib',
    name: 'Kent Library',
    type: 'library',
    address: '212 2nd Ave N',
    city: 'Kent',
    state: 'WA',
    zip: '98032',
    coordinates: { lat: 47.3854, lng: -122.2334 },
    openHours: 'Mon-Sat 10am-8pm, Sun 1pm-5pm',
    hasParking: true,
    isVerified: true
  },
  {
    id: 'loc_fedway_pd',
    name: 'Federal Way Police',
    type: 'police_station',
    address: '33325 8th Ave S',
    city: 'Federal Way',
    state: 'WA',
    zip: '98003',
    coordinates: { lat: 47.3113, lng: -122.3127 },
    openHours: '24/7',
    hasParking: true,
    isVerified: true
  },
  {
    id: 'loc_fedway_lib',
    name: 'Federal Way Library',
    type: 'library',
    address: '34200 1st Way S',
    city: 'Federal Way',
    state: 'WA',
    zip: '98003',
    coordinates: { lat: 47.3177, lng: -122.3133 },
    openHours: 'Mon-Thu 10am-8pm, Fri-Sat 10am-5pm',
    hasParking: true,
    isVerified: true
  },
  {
    id: 'loc_lakeland_cc',
    name: 'Lakeland Hills Community Center',
    type: 'community_center',
    address: '1420 Lakeland Hills Way SE',
    city: 'Auburn',
    state: 'WA',
    zip: '98092',
    coordinates: { lat: 47.2756, lng: -122.1823 },
    openHours: 'Mon-Fri 6am-9pm, Sat 8am-5pm',
    hasParking: true,
    isVerified: true
  }
];

// Day names for display
const DAY_NAMES: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

// Convert day index (0=Sunday) to DayOfWeek
const DAY_INDEX_TO_NAME: DayOfWeek[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to display time (e.g., "10:00 AM")
 */
export function formatTimeDisplay(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format time slot for display (e.g., "10:00 AM - 2:00 PM")
 */
export function formatTimeSlotDisplay(slot: TimeSlot): string {
  const startMinutes = parseTimeToMinutes(slot.start);
  const endMinutes = parseTimeToMinutes(slot.end);
  return `${formatTimeDisplay(startMinutes)} - ${formatTimeDisplay(endMinutes)}`;
}

/**
 * Check if two time slots overlap
 */
export function doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  const start1 = parseTimeToMinutes(slot1.start);
  const end1 = parseTimeToMinutes(slot1.end);
  const start2 = parseTimeToMinutes(slot2.start);
  const end2 = parseTimeToMinutes(slot2.end);

  return start1 < end2 && start2 < end1;
}

/**
 * Get overlapping portion of two time slots
 */
export function getTimeSlotOverlap(slot1: TimeSlot, slot2: TimeSlot): TimeSlot | null {
  const start1 = parseTimeToMinutes(slot1.start);
  const end1 = parseTimeToMinutes(slot1.end);
  const start2 = parseTimeToMinutes(slot2.start);
  const end2 = parseTimeToMinutes(slot2.end);

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  if (overlapStart >= overlapEnd) {
    return null;
  }

  const formatMinutesToTime = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return {
    start: formatMinutesToTime(overlapStart),
    end: formatMinutesToTime(overlapEnd)
  };
}

/**
 * Find matching time slots between buyer and seller availability
 * Returns matches for the next 14 days
 */
export function findMatchingTimeSlots(
  buyerAvailability: UserAvailability,
  sellerAvailability: UserAvailability,
  daysAhead: number = 14
): MatchedTimeSlot[] {
  const matches: MatchedTimeSlot[] = [];
  const today = new Date();

  for (let i = 1; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayOfWeek = DAY_INDEX_TO_NAME[date.getDay()];
    const dateString = date.toISOString().split('T')[0];

    // Check if date is blocked for either user
    if (
      buyerAvailability.blockedDates?.includes(dateString) ||
      sellerAvailability.blockedDates?.includes(dateString)
    ) {
      continue;
    }

    const buyerDay = buyerAvailability.weeklySchedule[dayOfWeek];
    const sellerDay = sellerAvailability.weeklySchedule[dayOfWeek];

    // Skip if either user is not available that day
    if (!buyerDay.enabled || !sellerDay.enabled) {
      continue;
    }

    // Find overlapping slots
    for (const buyerSlot of buyerDay.slots) {
      for (const sellerSlot of sellerDay.slots) {
        const overlap = getTimeSlotOverlap(buyerSlot, sellerSlot);
        if (overlap) {
          // Only include slots that are at least 30 minutes
          const duration = parseTimeToMinutes(overlap.end) - parseTimeToMinutes(overlap.start);
          if (duration >= 30) {
            matches.push({
              date: dateString,
              dayOfWeek,
              timeSlot: overlap,
              displayTime: `${DAY_NAMES[dayOfWeek]}, ${formatDateDisplay(date)} • ${formatTimeSlotDisplay(overlap)}`
            });
          }
        }
      }
    }
  }

  return matches;
}

/**
 * Format date for display (e.g., "Jan 15")
 */
function formatDateDisplay(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Get suggested meetup locations based on buyer and seller positions
 * Returns locations sorted by combined distance (favoring midpoints)
 */
export function getSuggestedLocations(
  buyerZip: string,
  sellerZip: string,
  maxDistanceMiles: number = 15
): LocationSuggestion[] {
  const buyerCoords = ZIP_COORDINATES[buyerZip];
  const sellerCoords = ZIP_COORDINATES[sellerZip];

  if (!buyerCoords || !sellerCoords) {
    // Fall back to all locations if we can't determine positions
    return SAFE_MEETUP_LOCATIONS.map(location => ({
      location,
      distanceFromBuyer: 0,
      distanceFromSeller: 0,
      isMidpoint: false
    }));
  }

  // Calculate midpoint
  const midpoint = {
    lat: (buyerCoords.lat + sellerCoords.lat) / 2,
    lng: (buyerCoords.lng + sellerCoords.lng) / 2
  };

  const suggestions: LocationSuggestion[] = [];

  for (const location of SAFE_MEETUP_LOCATIONS) {
    const distanceFromBuyer = calculateDistance(
      buyerCoords.lat, buyerCoords.lng,
      location.coordinates.lat, location.coordinates.lng
    );
    const distanceFromSeller = calculateDistance(
      sellerCoords.lat, sellerCoords.lng,
      location.coordinates.lat, location.coordinates.lng
    );
    const distanceFromMidpoint = calculateDistance(
      midpoint.lat, midpoint.lng,
      location.coordinates.lat, location.coordinates.lng
    );

    // Filter by max distance from either party
    if (distanceFromBuyer <= maxDistanceMiles && distanceFromSeller <= maxDistanceMiles) {
      suggestions.push({
        location,
        distanceFromBuyer,
        distanceFromSeller,
        isMidpoint: distanceFromMidpoint <= 2 // Within 2 miles of midpoint
      });
    }
  }

  // Sort: midpoint locations first, then by combined distance
  suggestions.sort((a, b) => {
    if (a.isMidpoint && !b.isMidpoint) return -1;
    if (!a.isMidpoint && b.isMidpoint) return 1;
    return (a.distanceFromBuyer + a.distanceFromSeller) -
           (b.distanceFromBuyer + b.distanceFromSeller);
  });

  return suggestions;
}

/**
 * Verify if buyer is within geofence of pickup location
 */
export function verifyGeofence(
  buyerLat: number,
  buyerLng: number,
  targetLat: number,
  targetLng: number
): GeofenceResult {
  // Calculate distance in meters (Haversine gives miles, convert)
  const distanceMiles = calculateDistance(buyerLat, buyerLng, targetLat, targetLng);
  const distanceMeters = distanceMiles * 1609.34; // Convert miles to meters

  return {
    verified: distanceMeters <= PORCH_PICKUP_CONSTANTS.GEOFENCE_RADIUS_METERS,
    distanceMeters: Math.round(distanceMeters),
    requiredRadiusMeters: PORCH_PICKUP_CONSTANTS.GEOFENCE_RADIUS_METERS
  };
}

/**
 * Calculate porch pickup expiration time (24h from drop-off)
 */
export function calculatePickupExpiration(dropOffTimestamp: string): string {
  const dropOff = new Date(dropOffTimestamp);
  dropOff.setHours(dropOff.getHours() + PORCH_PICKUP_CONSTANTS.PICKUP_WINDOW_HOURS);
  return dropOff.toISOString();
}

/**
 * Check if pickup is expiring soon (within warning window)
 */
export function isPickupExpiringSoon(expiresAt: string): boolean {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const hoursRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursRemaining > 0 && hoursRemaining <= PORCH_PICKUP_CONSTANTS.EXPIRY_WARNING_HOURS;
}

/**
 * Check if pickup has expired
 */
export function isPickupExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Create default availability for a new user
 */
export function createDefaultAvailability(userId: string): UserAvailability {
  return {
    userId,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    weeklySchedule: { ...DEFAULT_AVAILABILITY },
    blockedDates: [],
    updatedAt: new Date().toISOString()
  };
}

/**
 * Format remaining time for display (e.g., "4 hours left")
 */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const msRemaining = expiry.getTime() - now.getTime();

  if (msRemaining <= 0) {
    return 'Expired';
  }

  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hoursRemaining > 0) {
    return `${hoursRemaining}h ${minutesRemaining}m left`;
  }
  return `${minutesRemaining} minutes left`;
}
