import { User, TrustTier } from '../types';

/**
 * Calculate the trust tier for a user based on their verification signals
 */
export const calculateTrustTier = (user: Partial<User>): TrustTier => {
  // Tier 1: Basic - Need phone AND email verified
  if (!user.phoneVerified || !user.emailVerified) {
    return TrustTier.BASIC;
  }

  // Count Tier 2 signals (need 2 of 3)
  const tier2Signals = [
    user.hasPaymentMethod,
    user.socialGoogleConnected || user.socialFacebookConnected || user.socialAppleConnected,
    user.hasProfilePhoto
  ].filter(Boolean).length;

  if (tier2Signals < 2) {
    return TrustTier.BASIC;
  }

  // Tier 3: Trusted - Need ID verification OR proven track record
  const hasIdVerification = user.idVerified;
  const hasProvenTrackRecord =
    (user.completedTransactions || 0) >= 3 &&
    (user.averageRating || 0) >= 4.0;

  if (hasIdVerification || hasProvenTrackRecord) {
    return TrustTier.TRUSTED;
  }

  return TrustTier.VERIFIED;
};

/**
 * Get the display info for a trust tier
 */
export const getTrustTierInfo = (tier: TrustTier) => {
  switch (tier) {
    case TrustTier.TRUSTED:
      return {
        label: 'Trusted Parent',
        shortLabel: 'Trusted',
        icon: 'shield',
        color: '#2D9B8C',
        bgColor: '#F0FAF8',
        description: 'ID verified or proven track record'
      };
    case TrustTier.VERIFIED:
      return {
        label: 'Verified Member',
        shortLabel: 'Verified',
        icon: 'check',
        color: '#2D9B8C',
        bgColor: '#F0FAF8',
        description: 'Phone, email, and additional verification'
      };
    case TrustTier.BASIC:
    default:
      return {
        label: 'Basic Account',
        shortLabel: '',
        icon: null,
        color: '#6B5D52',
        bgColor: '#F5EDE6',
        description: 'Complete verification to unlock features'
      };
  }
};

/**
 * Permission checks based on trust tier
 */
export const TrustPermissions = {
  canBrowse: (_tier: TrustTier) => true,
  canSaveFavorites: (_tier: TrustTier) => true,

  canMessageUnlimited: (tier: TrustTier) =>
    tier === TrustTier.VERIFIED || tier === TrustTier.TRUSTED,

  getMessageLimit: (tier: TrustTier) =>
    tier === TrustTier.BASIC ? 5 : Infinity,

  canBuyItems: (tier: TrustTier) =>
    tier === TrustTier.VERIFIED || tier === TrustTier.TRUSTED,

  canListItems: (tier: TrustTier) =>
    tier === TrustTier.VERIFIED || tier === TrustTier.TRUSTED,

  getMaxListingPrice: (tier: TrustTier, idVerified: boolean) => {
    if (tier === TrustTier.TRUSTED) return Infinity;
    if (tier === TrustTier.VERIFIED) {
      if (idVerified) return Infinity;
      return 100; // Soft limit, prompt for ID above this
    }
    return 0; // Basic can't list
  },

  requiresIdForPrice: (tier: TrustTier, price: number, idVerified: boolean) => {
    if (idVerified || tier === TrustTier.TRUSTED) return false;
    if (price > 200) return 'required';
    if (price > 100) return 'prompt';
    return false;
  },

  hasPrioritySearch: (tier: TrustTier) => tier === TrustTier.TRUSTED
};

/**
 * Get what's needed to reach the next tier
 */
export const getNextTierRequirements = (user: Partial<User>): {
  currentTier: TrustTier;
  nextTier: TrustTier | null;
  requirements: string[];
  progress: number; // 0-100
} => {
  const currentTier = calculateTrustTier(user);

  if (currentTier === TrustTier.TRUSTED) {
    return {
      currentTier,
      nextTier: null,
      requirements: [],
      progress: 100
    };
  }

  if (currentTier === TrustTier.BASIC) {
    const requirements: string[] = [];
    let completed = 0;
    const total = 4; // phone, email, + 2 of 3 signals

    if (!user.phoneVerified) requirements.push('Verify your phone number');
    else completed++;

    if (!user.emailVerified) requirements.push('Verify your email');
    else completed++;

    const tier2Signals = [
      { done: !!user.hasPaymentMethod, text: 'Add a payment method' },
      { done: !!(user.socialGoogleConnected || user.socialFacebookConnected || user.socialAppleConnected), text: 'Connect a social account' },
      { done: !!user.hasProfilePhoto, text: 'Upload a profile photo' }
    ];

    const tier2Done = tier2Signals.filter(s => s.done).length;
    const tier2Needed = Math.max(0, 2 - tier2Done);

    tier2Signals.filter(s => !s.done).slice(0, tier2Needed).forEach(s => {
      requirements.push(s.text);
    });

    completed += Math.min(tier2Done, 2);

    return {
      currentTier,
      nextTier: TrustTier.VERIFIED,
      requirements,
      progress: Math.round((completed / total) * 100)
    };
  }

  // Currently VERIFIED, need to reach TRUSTED
  const requirements: string[] = [];
  const hasIdVerification = user.idVerified;
  const hasProvenTrackRecord =
    (user.completedTransactions || 0) >= 3 &&
    (user.averageRating || 0) >= 4.0;

  if (!hasIdVerification && !hasProvenTrackRecord) {
    requirements.push('Verify your ID');
    requirements.push(`Complete ${3 - (user.completedTransactions || 0)} more transactions with good reviews`);
  }

  const txProgress = Math.min(100, ((user.completedTransactions || 0) / 3) * 100);

  return {
    currentTier,
    nextTier: TrustTier.TRUSTED,
    requirements,
    progress: hasIdVerification ? 100 : Math.round(txProgress)
  };
};

/**
 * Format response time for display
 */
export const formatResponseTime = (hours: number | undefined): string => {
  if (!hours || hours === 0) return 'New seller';
  if (hours < 1) return 'Usually responds in minutes';
  if (hours < 2) return 'Responds in ~1 hour';
  if (hours < 24) return `Responds in ~${Math.round(hours)} hours`;
  if (hours < 48) return 'Responds in ~1 day';
  return `Responds in ~${Math.round(hours / 24)} days`;
};
