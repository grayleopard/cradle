
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
  location: string;
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
}

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
