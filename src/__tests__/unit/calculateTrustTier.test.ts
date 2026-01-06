import { describe, it, expect } from 'vitest';
import {
  calculateTrustTier,
  getTrustTierInfo,
  TrustPermissions,
  getNextTierRequirements,
  formatResponseTime
} from '../../../utils/trustTier';
import { TrustTier, User } from '../../../types';

describe('calculateTrustTier', () => {
  describe('BASIC tier requirements', () => {
    it('should return BASIC when phone is not verified', () => {
      const user: Partial<User> = {
        phoneVerified: false,
        emailVerified: true,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.BASIC);
    });

    it('should return BASIC when email is not verified', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: false,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.BASIC);
    });

    it('should return BASIC when neither phone nor email is verified', () => {
      const user: Partial<User> = {
        phoneVerified: false,
        emailVerified: false,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.BASIC);
    });

    it('should return BASIC when phone/email verified but not enough tier 2 signals', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: false,
        hasProfilePhoto: false,
        socialGoogleConnected: false,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.BASIC);
    });

    it('should return BASIC with only 1 of 3 tier 2 signals', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: true,
        hasProfilePhoto: false,
        socialGoogleConnected: false,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.BASIC);
    });
  });

  describe('VERIFIED tier requirements', () => {
    it('should return VERIFIED with phone, email, and 2 tier 2 signals (payment + photo)', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: true,
        hasProfilePhoto: true,
        socialGoogleConnected: false,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.VERIFIED);
    });

    it('should return VERIFIED with phone, email, and 2 tier 2 signals (social + photo)', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: false,
        hasProfilePhoto: true,
        socialGoogleConnected: true,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.VERIFIED);
    });

    it('should return VERIFIED with phone, email, and 2 tier 2 signals (payment + social)', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: true,
        hasProfilePhoto: false,
        socialFacebookConnected: true,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.VERIFIED);
    });

    it('should count any social provider for tier 2', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: true,
        socialAppleConnected: true,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.VERIFIED);
    });
  });

  describe('TRUSTED tier requirements', () => {
    it('should return TRUSTED when ID is verified', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: true,
        hasProfilePhoto: true,
        idVerified: true,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.TRUSTED);
    });

    it('should return TRUSTED with proven track record (3+ transactions, 4.0+ rating)', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: true,
        hasProfilePhoto: true,
        idVerified: false,
        completedTransactions: 3,
        averageRating: 4.0,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.TRUSTED);
    });

    it('should return TRUSTED with 5 transactions and 4.5 rating', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: true,
        hasProfilePhoto: true,
        completedTransactions: 5,
        averageRating: 4.5,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.TRUSTED);
    });

    it('should return VERIFIED if transactions >= 3 but rating < 4.0', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: true,
        hasProfilePhoto: true,
        completedTransactions: 3,
        averageRating: 3.9,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.VERIFIED);
    });

    it('should return VERIFIED if rating >= 4.0 but transactions < 3', () => {
      const user: Partial<User> = {
        phoneVerified: true,
        emailVerified: true,
        hasPaymentMethod: true,
        hasProfilePhoto: true,
        completedTransactions: 2,
        averageRating: 4.5,
      };
      expect(calculateTrustTier(user)).toBe(TrustTier.VERIFIED);
    });
  });
});

describe('getTrustTierInfo', () => {
  it('should return correct info for TRUSTED tier', () => {
    const info = getTrustTierInfo(TrustTier.TRUSTED);
    expect(info.label).toBe('Trusted Parent');
    expect(info.shortLabel).toBe('Trusted');
    expect(info.icon).toBe('shield');
    expect(info.color).toBe('#2D9B8C');
  });

  it('should return correct info for VERIFIED tier', () => {
    const info = getTrustTierInfo(TrustTier.VERIFIED);
    expect(info.label).toBe('Verified Member');
    expect(info.shortLabel).toBe('Verified');
    expect(info.icon).toBe('check');
  });

  it('should return correct info for BASIC tier', () => {
    const info = getTrustTierInfo(TrustTier.BASIC);
    expect(info.label).toBe('Basic Account');
    expect(info.shortLabel).toBe('');
    expect(info.icon).toBeNull();
  });
});

describe('TrustPermissions', () => {
  describe('canBrowse', () => {
    it('should allow all tiers to browse', () => {
      expect(TrustPermissions.canBrowse(TrustTier.BASIC)).toBe(true);
      expect(TrustPermissions.canBrowse(TrustTier.VERIFIED)).toBe(true);
      expect(TrustPermissions.canBrowse(TrustTier.TRUSTED)).toBe(true);
    });
  });

  describe('canMessageUnlimited', () => {
    it('should not allow BASIC to message unlimited', () => {
      expect(TrustPermissions.canMessageUnlimited(TrustTier.BASIC)).toBe(false);
    });

    it('should allow VERIFIED to message unlimited', () => {
      expect(TrustPermissions.canMessageUnlimited(TrustTier.VERIFIED)).toBe(true);
    });

    it('should allow TRUSTED to message unlimited', () => {
      expect(TrustPermissions.canMessageUnlimited(TrustTier.TRUSTED)).toBe(true);
    });
  });

  describe('getMessageLimit', () => {
    it('should return 5 for BASIC tier', () => {
      expect(TrustPermissions.getMessageLimit(TrustTier.BASIC)).toBe(5);
    });

    it('should return Infinity for VERIFIED and TRUSTED', () => {
      expect(TrustPermissions.getMessageLimit(TrustTier.VERIFIED)).toBe(Infinity);
      expect(TrustPermissions.getMessageLimit(TrustTier.TRUSTED)).toBe(Infinity);
    });
  });

  describe('canBuyItems', () => {
    it('should not allow BASIC to buy', () => {
      expect(TrustPermissions.canBuyItems(TrustTier.BASIC)).toBe(false);
    });

    it('should allow VERIFIED and TRUSTED to buy', () => {
      expect(TrustPermissions.canBuyItems(TrustTier.VERIFIED)).toBe(true);
      expect(TrustPermissions.canBuyItems(TrustTier.TRUSTED)).toBe(true);
    });
  });

  describe('canListItems', () => {
    it('should not allow BASIC to list items', () => {
      expect(TrustPermissions.canListItems(TrustTier.BASIC)).toBe(false);
    });

    it('should allow VERIFIED and TRUSTED to list items', () => {
      expect(TrustPermissions.canListItems(TrustTier.VERIFIED)).toBe(true);
      expect(TrustPermissions.canListItems(TrustTier.TRUSTED)).toBe(true);
    });
  });

  describe('getMaxListingPrice', () => {
    it('should return 0 for BASIC tier', () => {
      expect(TrustPermissions.getMaxListingPrice(TrustTier.BASIC, false)).toBe(0);
    });

    it('should return 100 for VERIFIED without ID', () => {
      expect(TrustPermissions.getMaxListingPrice(TrustTier.VERIFIED, false)).toBe(100);
    });

    it('should return Infinity for VERIFIED with ID', () => {
      expect(TrustPermissions.getMaxListingPrice(TrustTier.VERIFIED, true)).toBe(Infinity);
    });

    it('should return Infinity for TRUSTED', () => {
      expect(TrustPermissions.getMaxListingPrice(TrustTier.TRUSTED, false)).toBe(Infinity);
    });
  });

  describe('requiresIdForPrice', () => {
    it('should not require ID for TRUSTED tier', () => {
      expect(TrustPermissions.requiresIdForPrice(TrustTier.TRUSTED, 500, false)).toBe(false);
    });

    it('should not require ID if already verified', () => {
      expect(TrustPermissions.requiresIdForPrice(TrustTier.VERIFIED, 500, true)).toBe(false);
    });

    it('should return "required" for price > 200 without ID', () => {
      expect(TrustPermissions.requiresIdForPrice(TrustTier.VERIFIED, 250, false)).toBe('required');
    });

    it('should return "prompt" for price > 100 but <= 200 without ID', () => {
      expect(TrustPermissions.requiresIdForPrice(TrustTier.VERIFIED, 150, false)).toBe('prompt');
    });

    it('should return false for price <= 100', () => {
      expect(TrustPermissions.requiresIdForPrice(TrustTier.VERIFIED, 100, false)).toBe(false);
    });
  });

  describe('hasPrioritySearch', () => {
    it('should only give priority search to TRUSTED', () => {
      expect(TrustPermissions.hasPrioritySearch(TrustTier.BASIC)).toBe(false);
      expect(TrustPermissions.hasPrioritySearch(TrustTier.VERIFIED)).toBe(false);
      expect(TrustPermissions.hasPrioritySearch(TrustTier.TRUSTED)).toBe(true);
    });
  });
});

describe('getNextTierRequirements', () => {
  it('should return no requirements for TRUSTED tier', () => {
    const user: Partial<User> = {
      phoneVerified: true,
      emailVerified: true,
      hasPaymentMethod: true,
      hasProfilePhoto: true,
      idVerified: true,
    };
    const result = getNextTierRequirements(user);
    expect(result.currentTier).toBe(TrustTier.TRUSTED);
    expect(result.nextTier).toBeNull();
    expect(result.requirements).toEqual([]);
    expect(result.progress).toBe(100);
  });

  it('should return requirements for BASIC user to reach VERIFIED', () => {
    const user: Partial<User> = {
      phoneVerified: false,
      emailVerified: false,
    };
    const result = getNextTierRequirements(user);
    expect(result.currentTier).toBe(TrustTier.BASIC);
    expect(result.nextTier).toBe(TrustTier.VERIFIED);
    expect(result.requirements).toContain('Verify your phone number');
    expect(result.requirements).toContain('Verify your email');
    expect(result.progress).toBe(0);
  });

  it('should show partial progress for BASIC user with some verifications', () => {
    const user: Partial<User> = {
      phoneVerified: true,
      emailVerified: true,
      hasPaymentMethod: true,
      hasProfilePhoto: false,
      socialGoogleConnected: false,
    };
    const result = getNextTierRequirements(user);
    expect(result.currentTier).toBe(TrustTier.BASIC);
    expect(result.progress).toBeGreaterThan(0);
    expect(result.progress).toBeLessThan(100);
  });

  it('should return requirements for VERIFIED user to reach TRUSTED', () => {
    const user: Partial<User> = {
      phoneVerified: true,
      emailVerified: true,
      hasPaymentMethod: true,
      hasProfilePhoto: true,
      idVerified: false,
      completedTransactions: 1,
      averageRating: 4.5,
    };
    const result = getNextTierRequirements(user);
    expect(result.currentTier).toBe(TrustTier.VERIFIED);
    expect(result.nextTier).toBe(TrustTier.TRUSTED);
    expect(result.requirements.length).toBeGreaterThan(0);
  });
});

describe('formatResponseTime', () => {
  it('should return "New seller" for undefined or 0', () => {
    expect(formatResponseTime(undefined)).toBe('New seller');
    expect(formatResponseTime(0)).toBe('New seller');
  });

  it('should return minutes message for < 1 hour', () => {
    expect(formatResponseTime(0.5)).toBe('Usually responds in minutes');
  });

  it('should return ~1 hour message for 1-2 hours', () => {
    expect(formatResponseTime(1)).toBe('Responds in ~1 hour');
    expect(formatResponseTime(1.5)).toBe('Responds in ~1 hour');
  });

  it('should return hours message for 2-24 hours', () => {
    expect(formatResponseTime(6)).toBe('Responds in ~6 hours');
    expect(formatResponseTime(12)).toBe('Responds in ~12 hours');
  });

  it('should return ~1 day message for 24-48 hours', () => {
    expect(formatResponseTime(24)).toBe('Responds in ~1 day');
    expect(formatResponseTime(36)).toBe('Responds in ~1 day');
  });

  it('should return days message for 48+ hours', () => {
    expect(formatResponseTime(72)).toBe('Responds in ~3 days');
    expect(formatResponseTime(120)).toBe('Responds in ~5 days');
  });
});
