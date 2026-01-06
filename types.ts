
export enum Condition {
  LIKE_NEW = 'Like New',
  EXCELLENT = 'Excellent',
  VERY_GOOD = 'Very Good',
  GOOD = 'Good',
  FAIR = 'Fair'
}

export enum Category {
  STROLLERS = 'Strollers & Travel Systems',
  CAR_SEATS = 'Car Seats & Boosters',
  CRIBS = 'Cribs & Bassinets',
  FEEDING = 'High Chairs & Feeding',
  CARRIERS = 'Baby Carriers & Wraps',
  PLAY_YARDS = 'Play Yards',
  TOYS = 'Toys & Books',
  CLOTHING = 'Clothing Bundles',
  GEAR = 'Other Gear',
  SAFETY = 'Monitors & Safety'
}

export enum AgeRange {
  ZERO_TO_SIX_MO = '0-6mo',
  SIX_TO_TWELVE_MO = '6-12mo',
  TWELVE_TO_EIGHTEEN_MO = '12-18mo',
  EIGHTEEN_TO_TWENTY_FOUR_MO = '18-24mo',
  TWO_TO_THREE_YR = '2-3yr',
  THREE_TO_FIVE_YR = '3-5yr',
  FIVE_PLUS = '5+'
}

export interface DealAnalysis {
  estimatedRetailPrice: number;
  savingsPercentage: number;
  dealScore: number; // 1-10
  verdict: string; // "Great Deal", "Fair Price", "Overpriced"
  explanation: string;
  retailSource?: string;
  // Added sources to support Google Search Grounding requirement
  sources?: { title: string; uri: string }[];
}

export interface SavedSearch {
  id: string;
  query: string;
  category: string; // 'All' or specific Category
  ageRange: string; // 'All' or specific AgeRange
  minPrice: string;
  maxPrice: string;
  createdAt: string;
}

// Trust Tier System
export enum TrustTier {
  BASIC = 'basic',
  VERIFIED = 'verified',
  TRUSTED = 'trusted'
}

export interface User {
  id: string;
  name: string;
  isVerifiedParent: boolean; // Legacy - use trustTier instead
  isPremium?: boolean;
  isAdmin?: boolean;
  joinDate: string;
  itemsSold: number;
  avatarUrl: string;
  location: string; // Zip code or city
  bio?: string;
  email?: string;
  savedListingIds?: string[]; // Legacy - use wishlist for new saves
  wishlist?: WishlistItem[];  // Enhanced wishlist with price tracking
  savedSearches?: SavedSearch[];
  followingIds?: string[];
  followersCount?: number;
  rating?: number;
  reviewCount?: number;
  stripeAccountId?: string; // Stripe Connect account for sellers
  stripeOnboarded?: boolean; // Has completed Stripe onboarding
  // Referral program
  referralCode?: string; // Unique code to share with friends
  referredBy?: string; // Referral code used when signing up
  referralCredit?: number; // Credit balance in dollars (reduces transaction fees)
  referralCount?: number; // Number of successful referrals
  // Social/Community features (MVP v2)
  neighborhood?: string; // Specific neighborhood name (e.g., "Auburn", "Capitol Hill")
  kidAges?: number[]; // Array of kid ages in years (e.g., [2, 5] for 2yo and 5yo)
  parentingTags?: string[]; // Interest tags for future matching (e.g., ["outdoor activities", "music"])
  // Charity donations
  totalDonated?: number; // Running sum of charity donations made by this user

  // Trust & Verification System
  trustTier?: TrustTier;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  hasPaymentMethod?: boolean;
  hasProfilePhoto?: boolean;
  socialGoogleConnected?: boolean;
  socialFacebookConnected?: boolean;
  socialAppleConnected?: boolean;
  idVerified?: boolean;
  idVerifiedAt?: string;
  completedTransactions?: number;
  averageRating?: number;
  responseTimeHours?: number; // Rolling average response time

  // Smart Scheduling & Porch Pickup
  availabilityEnabled?: boolean;        // Has user set up availability?
  porchPickupEnabled?: boolean;         // Willing to do porch pickup as seller?
  porchPickupAddress?: string;          // Default porch pickup address
  porchPickupCoordinates?: { lat: number; lng: number };
  preferredMeetupLocationIds?: string[]; // Favorite safe meetup spots
}

// Follow relationship for social features
export interface Follow {
  id: string;
  followerId: string; // User who is following
  followingId: string; // User being followed
  createdAt: string;
}

// Charity for donation feature
export interface Charity {
  id: string;
  name: string;
  shortDescription: string; // One-liner for checkout display
  fullDescription?: string;
  websiteUrl?: string;
  logoUrl?: string;
  locationCity?: string;
  locationState?: string;
  isActive: boolean;
  totalReceived: number; // Running total for reporting
  createdAt: string;
}

// Donation options shown at checkout
export enum DonationOption {
  ROUND_UP = 'round_up',    // Round up to nearest dollar (default)
  PERCENT_2 = 'percent_2',  // Add 2%
  PERCENT_5 = 'percent_5',  // Add 5%
  NONE = 'none'             // No donation
}

// Calculate donation amount based on option and subtotal
export const calculateDonationAmount = (
  option: DonationOption,
  subtotal: number
): number => {
  switch (option) {
    case DonationOption.ROUND_UP:
      return Math.ceil(subtotal) - subtotal;
    case DonationOption.PERCENT_2:
      return Math.round(subtotal * 0.02 * 100) / 100;
    case DonationOption.PERCENT_5:
      return Math.round(subtotal * 0.05 * 100) / 100;
    case DonationOption.NONE:
    default:
      return 0;
  }
};

export interface Review {
  id: string;
  targetUserId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  // Photo reviews enhancement
  photoUrl?: string;
  transactionId?: string;
  itemTitle?: string;
  // Seller response
  sellerResponse?: string;
  sellerResponseDate?: string;
}

export interface Report {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface SafetyCheckResult {
  isSafe: boolean;
  reason: string;
  confidence: number;
  potentialRecalls?: string[];
  sources?: { title: string; uri: string }[]; // New field for Search Grounding
}

export interface Listing {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  dealAnalysis?: DealAnalysis; // New Field: Stored AI Analysis
  condition: Condition;
  category: Category;
  ageRange: AgeRange;
  brand?: string;
  model?: string;
  manufactureDate?: string; // For Car Seats
  expirationDate?: string;  // Calculated
  isSmokeFree?: boolean;
  isPetFree?: boolean;
  images: string[];
  locationZip: string;
  coordinates?: { lat: number; lng: number };
  isSafetyVerified: boolean;
  safetyCheckResult?: SafetyCheckResult;
  distanceMiles: number; // Dynamic based on user location
  isSold?: boolean;
  isPromoted?: boolean; // Premium feature
  createdAt: string;
  // Bundle discount
  bundleDiscount?: number; // Percentage discount when bundled (e.g., 10 = 10% off)
  bundleEligible?: boolean; // Whether this item can be bundled
  // Shipping options
  deliveryMethod?: DeliveryMethod; // Local pickup, shipping, or both (default: local_pickup)
  shippingPrice?: number;          // Flat rate shipping cost set by seller
  offersShipping?: boolean;        // Quick check if shipping is available
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string; // ISO string
  isRead: boolean;
}

export interface Conversation {
  id: string;
  listingId: string;
  participantIds: string[]; // [buyerId, sellerId]
  lastMessage?: Message;
  updatedAt: string; // ISO string
}

export enum OfferStatus {
  PENDING = 'pending',       // Waiting for seller response
  ACCEPTED = 'accepted',     // Seller accepted, ready to proceed
  COUNTERED = 'countered',   // Seller made counter-offer
  DECLINED = 'declined',     // Seller declined
  EXPIRED = 'expired',       // Offer expired (24h)
  WITHDRAWN = 'withdrawn'    // Buyer withdrew offer
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;            // Offered price
  counterAmount?: number;    // Seller's counter-offer (if countered)
  message?: string;          // Optional message with offer
  status: OfferStatus;
  expiresAt: string;         // ISO string, 24h from creation
  createdAt: string;
  updatedAt: string;
}

export enum TransactionStatus {
  INITIATED = 'initiated',           // Buyer requested, waiting for seller approval
  ACCEPTED = 'accepted',             // Seller approved, waiting for payment
  PAYMENT_HELD = 'payment_held',     // Buyer paid, funds in escrow
  SCHEDULED = 'scheduled',           // Meetup time/location confirmed via smart scheduling
  MEETUP_AGREED = 'meetup_agreed',   // Time/Location set (optional intermediate step)
  INSPECTION_PENDING = 'inspection_pending', // At meetup, waiting for buyer checklist
  READY_FOR_PICKUP = 'ready_for_pickup',     // Porch pickup: seller dropped off item
  PICKED_UP = 'picked_up',                   // Porch pickup: buyer picked up, confirming
  COMPLETED = 'completed',           // Inspection passed, funds released
  DISPUTED = 'disputed',             // Buyer flagged issue
  CANCELLED = 'cancelled',
  PICKUP_EXPIRED = 'pickup_expired'  // Porch pickup: 24h window expired
}

// Exchange type for transactions
export enum ExchangeType {
  IN_PERSON = 'in_person',           // Traditional meetup with inspection
  PORCH_PICKUP = 'porch_pickup',     // Async porch drop-off/pickup
  SHIPPING = 'shipping'              // Shipped via carrier
}

export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  platformFee: number;
  total: number;
  status: TransactionStatus;

  // Exchange type
  exchangeType?: ExchangeType; // Default: in_person

  // Offer that led to this transaction (if any)
  offerId?: string;
  originalListingPrice?: number; // Track if price was negotiated

  // Charity donation
  donationAmount?: number; // Amount donated to charity
  donationCharityId?: string; // ID of charity receiving donation
  donationOption?: DonationOption; // Which option user selected

  // Stripe Payment
  stripePaymentIntentId?: string;

  // Meeting Details (legacy + smart scheduling)
  meetupLocation?: string;
  meetupTime?: string;

  // Smart Scheduling fields
  scheduledDate?: string;        // ISO date (YYYY-MM-DD)
  scheduledTimeSlot?: string;    // Time slot (e.g., "10:00 AM - 12:00 PM")
  scheduledLocationId?: string;  // Reference to SafeMeetupLocation
  scheduledLocationName?: string; // Cached location name
  scheduledLocationAddress?: string; // Cached full address

  // Porch Pickup fields
  porchPickup?: {
    sellerAddress: string;           // Drop-off address
    sellerCoordinates?: { lat: number; lng: number };
    dropOffPhotoUrl?: string;        // Photo seller takes when leaving item
    dropOffTimestamp?: string;       // When seller dropped off
    pickupPhotoUrl?: string;         // Photo buyer takes when picking up
    pickupTimestamp?: string;        // When buyer picked up
    buyerConfirmedAt?: string;       // When buyer confirmed receipt
    expiresAt?: string;              // 24h from drop-off
    buyerLocationVerified?: boolean; // Geofence check passed
  };

  // Inspection Data
  inspectionPhotoUrl?: string;
  inspectionChecklist?: {
    matchesDescription: boolean;
    conditionAcceptable: boolean;
    noUndisclosedDamage: boolean;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  completedAt?: string;
  autoReleased?: boolean;
}

// Image Validation Types
export enum ImageValidationStatus {
  PENDING = 'pending',         // Upload in progress
  VALIDATING = 'validating',   // Running AI checks
  APPROVED = 'approved',       // All checks passed
  REJECTED = 'rejected',       // Failed moderation or quality
  WARNING = 'warning'          // Minor issues but usable
}

export interface ImageValidationResult {
  status: ImageValidationStatus;
  moderationPassed: boolean;      // Cloudinary/Rekognition check
  qualityScore?: number;          // 0-100 from Gemini
  relevanceScore?: number;        // 0-100 from Gemini
  issues: string[];               // Human-readable issues
  suggestions?: string[];         // Tips to improve
  rejectionReason?: string;       // If rejected, why
}

// Image Validation Thresholds
export const IMAGE_VALIDATION_THRESHOLDS = {
  MIN_QUALITY_SCORE: 40,          // Below this = rejected
  MIN_RELEVANCE_SCORE: 50,        // Below this = rejected
  WARNING_QUALITY_SCORE: 60,      // Below this = warning
  MIN_RESOLUTION: 400,            // Minimum width/height
  MAX_FILE_SIZE_MB: 10,           // Max file size
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
};

// Notification Types
export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  OFFER_RECEIVED = 'offer_received',
  OFFER_ACCEPTED = 'offer_accepted',
  OFFER_DECLINED = 'offer_declined',
  OFFER_COUNTERED = 'offer_countered',
  TRANSACTION_UPDATE = 'transaction_update',
  NEW_FOLLOWER = 'new_follower',
  PRICE_DROP = 'price_drop',
  // Smart Scheduling notifications
  MEETUP_SCHEDULED = 'meetup_scheduled',
  MEETUP_REMINDER_24H = 'meetup_reminder_24h',
  MEETUP_REMINDER_1H = 'meetup_reminder_1h',
  // Porch Pickup notifications
  PORCH_ITEM_READY = 'porch_item_ready',
  PORCH_PICKUP_CONFIRMED = 'porch_pickup_confirmed',
  PORCH_PICKUP_EXPIRING = 'porch_pickup_expiring',
  PORCH_PICKUP_EXPIRED = 'porch_pickup_expired'
}

export interface Notification {
  id: string;
  userId: string;           // Recipient of the notification
  type: NotificationType;
  title: string;
  message: string;
  actorId?: string;         // User who triggered the notification
  actorName?: string;       // Cached name for offline display
  actorAvatarUrl?: string;  // Cached avatar for offline display
  referenceId?: string;     // ID of related entity (listing, offer, transaction, user, conversation)
  referenceType?: 'listing' | 'offer' | 'transaction' | 'user' | 'conversation';
  isRead: boolean;
  createdAt: string;
}

// Wishlist item with price tracking for alerts
export interface WishlistItem {
  listingId: string;
  savedAt: string;          // ISO timestamp
  priceWhenSaved: number;   // Track original price for drop alerts
  alertOnPriceDrop: boolean; // User preference
  alertThreshold?: number;  // Optional: alert only if drops below this price
  notifiedAt?: string;      // Last time we alerted about this item
}

// Bundle deal - discount when buying multiple items from same seller
export interface BundleDeal {
  id: string;
  sellerId: string;
  listingIds: string[];         // IDs of listings included in bundle
  discountType: 'percent' | 'fixed';
  discountValue: number;        // e.g., 15 for 15% or $15 off
  title?: string;               // Optional custom bundle name
  description?: string;         // Optional description
  minItems?: number;            // Minimum items to qualify (default: 2)
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;           // Optional expiration
}

// Shipping and Delivery Options
export enum DeliveryMethod {
  LOCAL_PICKUP = 'local_pickup',       // Meet in person (default)
  SHIPPING = 'shipping',               // Ship via carrier
  BOTH = 'both'                        // Seller offers both options
}

export enum ShippingCarrier {
  USPS = 'usps',
  UPS = 'ups',
  FEDEX = 'fedex',
  SELLER_CHOICE = 'seller_choice'      // Seller decides at time of shipping
}

export interface ShippingOption {
  carrier: ShippingCarrier;
  estimatedDays: string;               // e.g., "3-5 days"
  price: number;                       // Shipping cost
  isFree?: boolean;                    // Free shipping (price displayed as $0)
}

// Estimate shipping costs based on item category (simplified)
export const SHIPPING_ESTIMATES: Record<Category, { minCost: number; maxCost: number; estimatedDays: string }> = {
  [Category.STROLLERS]: { minCost: 25, maxCost: 60, estimatedDays: '5-7 days' },
  [Category.CAR_SEATS]: { minCost: 20, maxCost: 45, estimatedDays: '5-7 days' },
  [Category.CRIBS]: { minCost: 40, maxCost: 100, estimatedDays: '7-10 days' },
  [Category.FEEDING]: { minCost: 8, maxCost: 20, estimatedDays: '3-5 days' },
  [Category.CARRIERS]: { minCost: 10, maxCost: 18, estimatedDays: '3-5 days' },
  [Category.PLAY_YARDS]: { minCost: 15, maxCost: 35, estimatedDays: '5-7 days' },
  [Category.TOYS]: { minCost: 5, maxCost: 15, estimatedDays: '3-5 days' },
  [Category.CLOTHING]: { minCost: 5, maxCost: 12, estimatedDays: '3-5 days' },
  [Category.GEAR]: { minCost: 10, maxCost: 30, estimatedDays: '4-6 days' },
  [Category.SAFETY]: { minCost: 8, maxCost: 18, estimatedDays: '3-5 days' }
};

// ============================================
// Smart Scheduling & Porch Pickup Types
// ============================================

// Days of week for availability
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Time slot for availability windows
export interface TimeSlot {
  start: string;  // 24h format "09:00"
  end: string;    // 24h format "17:00"
}

// User's availability settings for a single day
export interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

// User's full weekly availability
export interface UserAvailability {
  userId: string;
  timezone: string;  // e.g., "America/Los_Angeles"
  weeklySchedule: Record<DayOfWeek, DayAvailability>;
  // Override dates (blocked or special availability)
  blockedDates?: string[];  // ISO dates where user is unavailable
  updatedAt: string;
}

// Pre-seeded safe meetup locations
export interface SafeMeetupLocation {
  id: string;
  name: string;
  type: 'police_station' | 'fire_station' | 'library' | 'community_center' | 'bank' | 'other';
  address: string;
  city: string;
  state: string;
  zip: string;
  coordinates: { lat: number; lng: number };
  openHours?: string;  // e.g., "Mon-Fri 9am-5pm"
  hasParking?: boolean;
  isVerified?: boolean;
}

// Matched time slot for scheduling
export interface MatchedTimeSlot {
  date: string;        // ISO date
  dayOfWeek: DayOfWeek;
  timeSlot: TimeSlot;
  displayTime: string; // Formatted for display (e.g., "Saturday, Jan 15 • 10:00 AM - 12:00 PM")
}

// Location suggestion with distance
export interface LocationSuggestion {
  location: SafeMeetupLocation;
  distanceFromBuyer: number;   // miles
  distanceFromSeller: number;  // miles
  isMidpoint: boolean;         // true if near midpoint
}

// Porch pickup eligibility check
export interface PorchPickupEligibility {
  eligible: boolean;
  reason?: string;  // Why not eligible (e.g., "Item too large", "Seller hasn't enabled")
}

// Geofence verification result
export interface GeofenceResult {
  verified: boolean;
  distanceMeters: number;
  requiredRadiusMeters: number;  // 30m for porch pickup
}

// Default availability template (weekdays 9-5)
export const DEFAULT_AVAILABILITY: Record<DayOfWeek, DayAvailability> = {
  monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] }
};

// Porch pickup constants
export const PORCH_PICKUP_CONSTANTS = {
  GEOFENCE_RADIUS_METERS: 30,      // Must be within 30m to verify
  PICKUP_WINDOW_HOURS: 24,          // 24h to pick up
  EXPIRY_WARNING_HOURS: 4,          // Warn when 4h left
  AUTO_RELEASE_DELAY_HOURS: 48      // Auto-release funds 48h after pickup confirmed
};
