import { Listing, User, Category, Condition } from '../types';

/**
 * Recommendation engine for personalized listings
 * Uses collaborative filtering based on:
 * - User's browsing history (recently viewed)
 * - User's favorites
 * - User's purchase history
 * - Category preferences
 * - Price range preferences
 * - Location proximity
 */

interface UserPreferences {
  favoriteCategories: Map<Category, number>;
  favoriteBrands: Map<string, number>;
  avgPriceRange: { min: number; max: number };
  preferredConditions: Map<Condition, number>;
}

/**
 * Extract user preferences from their behavior
 */
export function extractUserPreferences(
  user: User | null,
  listings: Listing[],
  recentlyViewedIds: string[],
  purchasedListingIds: string[] = []
): UserPreferences {
  const favoriteCategories = new Map<Category, number>();
  const favoriteBrands = new Map<string, number>();
  const preferredConditions = new Map<Condition, number>();
  const prices: number[] = [];

  // Get listings the user has interacted with
  const savedIds = user?.savedListingIds || [];
  const interactedIds = [...new Set([...recentlyViewedIds, ...savedIds, ...purchasedListingIds])];

  const interactedListings = interactedIds
    .map(id => listings.find(l => l.id === id))
    .filter((l): l is Listing => l !== undefined);

  // Weight: recently viewed = 1, saved = 2, purchased = 3
  interactedListings.forEach((listing, idx) => {
    const isSaved = savedIds.includes(listing.id);
    const isPurchased = purchasedListingIds.includes(listing.id);
    const isRecent = recentlyViewedIds.includes(listing.id);

    let weight = 0;
    if (isRecent) weight += 1;
    if (isSaved) weight += 2;
    if (isPurchased) weight += 3;
    weight = Math.max(weight, 1);

    // Categories
    const catCount = favoriteCategories.get(listing.category) || 0;
    favoriteCategories.set(listing.category, catCount + weight);

    // Brands
    if (listing.brand) {
      const brandCount = favoriteBrands.get(listing.brand) || 0;
      favoriteBrands.set(listing.brand, brandCount + weight);
    }

    // Conditions
    const condCount = preferredConditions.get(listing.condition) || 0;
    preferredConditions.set(listing.condition, condCount + weight);

    // Prices
    for (let i = 0; i < weight; i++) {
      prices.push(listing.price);
    }
  });

  // Calculate average price range
  let avgPriceRange = { min: 0, max: 500 };
  if (prices.length > 0) {
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    avgPriceRange = {
      min: Math.max(0, avgPrice * 0.5),
      max: avgPrice * 2
    };
  }

  return { favoriteCategories, favoriteBrands, avgPriceRange, preferredConditions };
}

/**
 * Calculate a relevance score for a listing based on user preferences
 */
export function calculateRelevanceScore(
  listing: Listing,
  preferences: UserPreferences,
  userLocation?: { lat: number; lng: number } | null
): number {
  let score = 0;

  // Category match (highest weight)
  const categoryScore = preferences.favoriteCategories.get(listing.category) || 0;
  score += categoryScore * 10;

  // Brand match
  if (listing.brand) {
    const brandScore = preferences.favoriteBrands.get(listing.brand) || 0;
    score += brandScore * 8;
  }

  // Condition preference
  const conditionScore = preferences.preferredConditions.get(listing.condition) || 0;
  score += conditionScore * 3;

  // Price range match
  if (listing.price >= preferences.avgPriceRange.min &&
      listing.price <= preferences.avgPriceRange.max) {
    score += 5;
  }

  // Distance bonus (closer = better)
  if (listing.distanceMiles !== undefined) {
    if (listing.distanceMiles < 5) score += 10;
    else if (listing.distanceMiles < 10) score += 7;
    else if (listing.distanceMiles < 20) score += 4;
    else if (listing.distanceMiles < 50) score += 1;
  }

  // Premium/promoted items get a small boost
  if (listing.isPromoted) score += 2;

  // Safety verified items get a boost
  if (listing.isSafetyVerified) score += 3;

  return score;
}

/**
 * Get personalized recommendations for a user
 */
export function getRecommendedListings(
  listings: Listing[],
  user: User | null,
  recentlyViewedIds: string[],
  options: {
    limit?: number;
    excludeIds?: string[];
    purchasedListingIds?: string[];
  } = {}
): Listing[] {
  const { limit = 8, excludeIds = [], purchasedListingIds = [] } = options;

  // Get user preferences
  const preferences = extractUserPreferences(
    user,
    listings,
    recentlyViewedIds,
    purchasedListingIds
  );

  // Filter available listings
  const availableListings = listings.filter(l =>
    !l.isSold &&
    l.userId !== user?.id &&
    !excludeIds.includes(l.id)
  );

  // If no preferences, return newest listings
  if (preferences.favoriteCategories.size === 0 &&
      preferences.favoriteBrands.size === 0) {
    return availableListings.slice(0, limit);
  }

  // Score and sort listings
  const scoredListings = availableListings.map(listing => ({
    listing,
    score: calculateRelevanceScore(listing, preferences)
  }));

  scoredListings.sort((a, b) => b.score - a.score);

  return scoredListings.slice(0, limit).map(s => s.listing);
}

/**
 * Get similar listings to a given listing ("You might like")
 */
export function getSimilarListings(
  targetListing: Listing,
  allListings: Listing[],
  options: {
    limit?: number;
    excludeIds?: string[];
  } = {}
): Listing[] {
  const { limit = 4, excludeIds = [] } = options;

  // Filter available listings
  const availableListings = allListings.filter(l =>
    !l.isSold &&
    l.id !== targetListing.id &&
    !excludeIds.includes(l.id)
  );

  // Score listings by similarity
  const scoredListings = availableListings.map(listing => {
    let score = 0;

    // Same category (highest)
    if (listing.category === targetListing.category) score += 20;

    // Same brand (high)
    if (listing.brand && listing.brand === targetListing.brand) score += 15;

    // Similar age range
    if (listing.ageRange === targetListing.ageRange) score += 8;

    // Similar condition
    if (listing.condition === targetListing.condition) score += 5;

    // Similar price (within 30%)
    const priceDiff = Math.abs(listing.price - targetListing.price) / targetListing.price;
    if (priceDiff < 0.3) score += 10 * (1 - priceDiff);

    // Nearby location
    if (listing.distanceMiles !== undefined && targetListing.distanceMiles !== undefined) {
      if (listing.distanceMiles < 10) score += 5;
      else if (listing.distanceMiles < 25) score += 2;
    }

    // From same seller (slight penalty to show variety)
    if (listing.userId === targetListing.userId) score -= 5;

    return { listing, score };
  });

  scoredListings.sort((a, b) => b.score - a.score);

  return scoredListings.slice(0, limit).map(s => s.listing);
}

/**
 * Get "More from this seller" listings
 */
export function getMoreFromSeller(
  sellerId: string,
  allListings: Listing[],
  excludeListingId: string,
  limit: number = 4
): Listing[] {
  return allListings
    .filter(l => l.userId === sellerId && l.id !== excludeListingId && !l.isSold)
    .slice(0, limit);
}
