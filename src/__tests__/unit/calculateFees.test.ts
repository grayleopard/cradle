import { describe, it, expect } from 'vitest';
import { calculateDonationAmount, DonationOption } from '../../../types';

describe('calculateDonationAmount', () => {
  describe('ROUND_UP option', () => {
    it('should round up $10.00 to $0.00 extra (already whole)', () => {
      expect(calculateDonationAmount(DonationOption.ROUND_UP, 10.00)).toBe(0);
    });

    it('should round up $10.50 to $0.50 extra', () => {
      expect(calculateDonationAmount(DonationOption.ROUND_UP, 10.50)).toBe(0.5);
    });

    it('should round up $10.01 to $0.99 extra', () => {
      expect(calculateDonationAmount(DonationOption.ROUND_UP, 10.01)).toBeCloseTo(0.99);
    });

    it('should round up $99.99 to $0.01 extra', () => {
      expect(calculateDonationAmount(DonationOption.ROUND_UP, 99.99)).toBeCloseTo(0.01);
    });
  });

  describe('PERCENT_2 option', () => {
    it('should calculate 2% of $100', () => {
      expect(calculateDonationAmount(DonationOption.PERCENT_2, 100)).toBe(2);
    });

    it('should calculate 2% of $50', () => {
      expect(calculateDonationAmount(DonationOption.PERCENT_2, 50)).toBe(1);
    });

    it('should round to 2 decimal places', () => {
      // 2% of $33.33 = 0.6666 -> rounded to 0.67
      expect(calculateDonationAmount(DonationOption.PERCENT_2, 33.33)).toBe(0.67);
    });

    it('should calculate 2% of $1', () => {
      expect(calculateDonationAmount(DonationOption.PERCENT_2, 1)).toBe(0.02);
    });
  });

  describe('PERCENT_5 option', () => {
    it('should calculate 5% of $100', () => {
      expect(calculateDonationAmount(DonationOption.PERCENT_5, 100)).toBe(5);
    });

    it('should calculate 5% of $40', () => {
      expect(calculateDonationAmount(DonationOption.PERCENT_5, 40)).toBe(2);
    });

    it('should round to 2 decimal places', () => {
      // 5% of $33.33 = 1.6665 -> rounded to 1.67
      expect(calculateDonationAmount(DonationOption.PERCENT_5, 33.33)).toBe(1.67);
    });
  });

  describe('NONE option', () => {
    it('should return 0 for any amount', () => {
      expect(calculateDonationAmount(DonationOption.NONE, 100)).toBe(0);
      expect(calculateDonationAmount(DonationOption.NONE, 50)).toBe(0);
      expect(calculateDonationAmount(DonationOption.NONE, 0)).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle $0 subtotal', () => {
      expect(calculateDonationAmount(DonationOption.ROUND_UP, 0)).toBe(0);
      expect(calculateDonationAmount(DonationOption.PERCENT_2, 0)).toBe(0);
      expect(calculateDonationAmount(DonationOption.PERCENT_5, 0)).toBe(0);
    });

    it('should handle very small amounts', () => {
      expect(calculateDonationAmount(DonationOption.ROUND_UP, 0.01)).toBeCloseTo(0.99);
      expect(calculateDonationAmount(DonationOption.PERCENT_2, 0.01)).toBe(0);
    });

    it('should handle large amounts', () => {
      expect(calculateDonationAmount(DonationOption.PERCENT_5, 1000)).toBe(50);
      expect(calculateDonationAmount(DonationOption.ROUND_UP, 999.01)).toBeCloseTo(0.99);
    });
  });
});

// Platform fee calculation tests (10% fee)
describe('Platform Fee Calculation', () => {
  const calculatePlatformFee = (amount: number): number => {
    return Math.round(amount * 0.10 * 100) / 100;
  };

  it('should calculate 10% fee on $100', () => {
    expect(calculatePlatformFee(100)).toBe(10);
  });

  it('should calculate 10% fee on $50', () => {
    expect(calculatePlatformFee(50)).toBe(5);
  });

  it('should round to 2 decimal places', () => {
    expect(calculatePlatformFee(33.33)).toBe(3.33);
  });

  it('should handle small amounts', () => {
    expect(calculatePlatformFee(1)).toBe(0.10);
  });

  it('should handle large amounts', () => {
    expect(calculatePlatformFee(500)).toBe(50);
  });
});

// Seller payout calculation (after platform fee)
describe('Seller Payout Calculation', () => {
  const calculateSellerPayout = (amount: number, platformFeePercent = 0.10): number => {
    const platformFee = Math.round(amount * platformFeePercent * 100) / 100;
    return Math.round((amount - platformFee) * 100) / 100;
  };

  it('should calculate seller receives 90% on $100', () => {
    expect(calculateSellerPayout(100)).toBe(90);
  });

  it('should calculate seller receives 90% on $50', () => {
    expect(calculateSellerPayout(50)).toBe(45);
  });

  it('should handle decimal amounts', () => {
    expect(calculateSellerPayout(33.33)).toBe(30);
  });
});
