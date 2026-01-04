
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

export interface User {
  id: string;
  name: string;
  isVerifiedParent: boolean;
  isPremium?: boolean;
  isAdmin?: boolean;
  joinDate: string;
  itemsSold: number;
  avatarUrl: string;
  location: string; // Zip code or city
  bio?: string;
  email?: string;
  savedListingIds?: string[];
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
  rating: number; // 1-5
  comment: string;
  date: string;
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
  MEETUP_AGREED = 'meetup_agreed',   // Time/Location set (optional intermediate step)
  INSPECTION_PENDING = 'inspection_pending', // At meetup, waiting for buyer checklist
  COMPLETED = 'completed',           // Inspection passed, funds released
  DISPUTED = 'disputed',             // Buyer flagged issue
  CANCELLED = 'cancelled'
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

  // Offer that led to this transaction (if any)
  offerId?: string;
  originalListingPrice?: number; // Track if price was negotiated

  // Charity donation
  donationAmount?: number; // Amount donated to charity
  donationCharityId?: string; // ID of charity receiving donation
  donationOption?: DonationOption; // Which option user selected

  // Stripe Payment
  stripePaymentIntentId?: string;

  // Meeting Details
  meetupLocation?: string;
  meetupTime?: string;

  // Inspection Data
  inspectionPhotoUrl?: string;
  inspectionChecklist?: {
    matchesDescription: boolean;
    conditionAcceptable: boolean;
    noUndisclosedDamage: boolean;
  };

  createdAt: string;
  updatedAt: string;
}

// Notification Types
export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  OFFER_RECEIVED = 'offer_received',
  OFFER_ACCEPTED = 'offer_accepted',
  OFFER_DECLINED = 'offer_declined',
  OFFER_COUNTERED = 'offer_countered',
  TRANSACTION_UPDATE = 'transaction_update',
  NEW_FOLLOWER = 'new_follower'
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
