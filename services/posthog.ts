import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

export const initPostHog = () => {
  if (!POSTHOG_KEY) {
    console.warn('[PostHog] API key not configured. Analytics disabled.');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Disable in development
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.opt_out_capturing();
      }
    },
    // Privacy settings
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    // Session recording
    disable_session_recording: import.meta.env.DEV,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
        email: false,
      },
    },
    // Performance
    bootstrap: {
      distinctID: localStorage.getItem('pipit_user_id') || undefined,
    },
  });

  console.log('[PostHog] Initialized');
};

// Identify user after login
export const identifyUser = (user: {
  id: string;
  email?: string;
  name?: string;
  trustTier?: string;
  location?: string;
  joinDate?: string;
}) => {
  posthog.identify(user.id, {
    email: user.email,
    name: user.name,
    trust_tier: user.trustTier,
    location: user.location,
    join_date: user.joinDate,
  });

  // Store for bootstrap
  localStorage.setItem('pipit_user_id', user.id);
};

// Reset on logout
export const resetUser = () => {
  posthog.reset();
  localStorage.removeItem('pipit_user_id');
};

// ===========================================
// EVENT TRACKING
// ===========================================

// Auth Events
export const trackSignUp = (method: 'phone' | 'email' | 'google' | 'apple') => {
  posthog.capture('user_signed_up', {
    method,
    timestamp: new Date().toISOString(),
  });
};

export const trackLogin = (method: 'phone' | 'email' | 'google' | 'apple') => {
  posthog.capture('user_logged_in', {
    method,
    timestamp: new Date().toISOString(),
  });
};

export const trackLogout = () => {
  posthog.capture('user_logged_out');
};

// Listing Events
export const trackListingCreated = (listing: {
  id: string;
  category: string;
  price: number;
  condition: string;
  hasImages: boolean;
  imageCount: number;
}) => {
  posthog.capture('listing_created', {
    listing_id: listing.id,
    category: listing.category,
    price: listing.price,
    condition: listing.condition,
    has_images: listing.hasImages,
    image_count: listing.imageCount,
  });
};

export const trackListingViewed = (listing: {
  id: string;
  category: string;
  price: number;
  sellerId: string;
  isSafetyVerified: boolean;
}) => {
  posthog.capture('listing_viewed', {
    listing_id: listing.id,
    category: listing.category,
    price: listing.price,
    seller_id: listing.sellerId,
    is_safety_verified: listing.isSafetyVerified,
  });
};

export const trackListingSaved = (listingId: string, category: string) => {
  posthog.capture('listing_saved', {
    listing_id: listingId,
    category,
  });
};

export const trackListingShared = (listingId: string, method: string) => {
  posthog.capture('listing_shared', {
    listing_id: listingId,
    share_method: method,
  });
};

// Search Events
export const trackSearch = (query: string, resultCount: number, filters?: Record<string, string>) => {
  posthog.capture('search_performed', {
    query,
    result_count: resultCount,
    ...filters,
  });
};

// Messaging Events
export const trackMessageSent = (conversationId: string, isFirstMessage: boolean) => {
  posthog.capture('message_sent', {
    conversation_id: conversationId,
    is_first_message: isFirstMessage,
  });
};

export const trackOfferMade = (listingId: string, offerAmount: number, listingPrice: number) => {
  posthog.capture('offer_made', {
    listing_id: listingId,
    offer_amount: offerAmount,
    listing_price: listingPrice,
    discount_percent: Math.round((1 - offerAmount / listingPrice) * 100),
  });
};

// Checkout Events
export const trackCheckoutStarted = (transaction: {
  id: string;
  listingId: string;
  amount: number;
  category: string;
}) => {
  posthog.capture('checkout_started', {
    transaction_id: transaction.id,
    listing_id: transaction.listingId,
    amount: transaction.amount,
    category: transaction.category,
  });
};

export const trackCheckoutCompleted = (transaction: {
  id: string;
  listingId: string;
  amount: number;
  platformFee: number;
  donationAmount?: number;
}) => {
  posthog.capture('checkout_completed', {
    transaction_id: transaction.id,
    listing_id: transaction.listingId,
    amount: transaction.amount,
    platform_fee: transaction.platformFee,
    donation_amount: transaction.donationAmount || 0,
    $set: {
      has_purchased: true,
      last_purchase_date: new Date().toISOString(),
    },
  });
};

export const trackCheckoutAbandoned = (step: string, reason?: string) => {
  posthog.capture('checkout_abandoned', {
    step,
    reason,
  });
};

// Review Events
export const trackReviewSubmitted = (review: {
  transactionId: string;
  rating: number;
  hasComment: boolean;
}) => {
  posthog.capture('review_submitted', {
    transaction_id: review.transactionId,
    rating: review.rating,
    has_comment: review.hasComment,
  });
};

// Trust Tier Events
export const trackTrustTierUpgrade = (fromTier: string, toTier: string, trigger: string) => {
  posthog.capture('trust_tier_upgraded', {
    from_tier: fromTier,
    to_tier: toTier,
    trigger,
  });
};

export const trackVerificationStarted = (type: 'phone' | 'email' | 'id' | 'social') => {
  posthog.capture('verification_started', {
    verification_type: type,
  });
};

export const trackVerificationCompleted = (type: 'phone' | 'email' | 'id' | 'social') => {
  posthog.capture('verification_completed', {
    verification_type: type,
  });
};

// Seller Events
export const trackStripeOnboardingStarted = () => {
  posthog.capture('stripe_onboarding_started');
};

export const trackStripeOnboardingCompleted = () => {
  posthog.capture('stripe_onboarding_completed', {
    $set: {
      is_seller: true,
      stripe_onboarded_date: new Date().toISOString(),
    },
  });
};

export const trackPayoutRequested = (amount: number, method: 'instant' | 'standard') => {
  posthog.capture('payout_requested', {
    amount,
    method,
  });
};

// Feature Usage
export const trackFeatureUsed = (feature: string, details?: Record<string, unknown>) => {
  posthog.capture('feature_used', {
    feature,
    ...details,
  });
};

// A/B Testing
export const getFeatureFlag = (flagKey: string): boolean | string | undefined => {
  return posthog.getFeatureFlag(flagKey);
};

export const isFeatureEnabled = (flagKey: string): boolean => {
  return posthog.isFeatureEnabled(flagKey) || false;
};

// Export posthog for direct access if needed
export { posthog };
