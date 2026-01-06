import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Greeting function (typically in utils or a component)
const getGreeting = (name?: string): string => {
  const hour = new Date().getHours();
  let timeGreeting: string;

  if (hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour < 17) {
    timeGreeting = 'Good afternoon';
  } else {
    timeGreeting = 'Good evening';
  }

  if (name) {
    return `${timeGreeting}, ${name}!`;
  }
  return `${timeGreeting}!`;
};

// Get a friendly date string
const getRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// Format price for display
const formatPrice = (cents: number): string => {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars);
};

describe('getGreeting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Time-based greetings', () => {
    it('should say Good morning before noon', () => {
      vi.setSystemTime(new Date('2024-01-15T08:00:00'));
      expect(getGreeting()).toBe('Good morning!');
    });

    it('should say Good morning at 11:59', () => {
      vi.setSystemTime(new Date('2024-01-15T11:59:00'));
      expect(getGreeting()).toBe('Good morning!');
    });

    it('should say Good afternoon at noon', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));
      expect(getGreeting()).toBe('Good afternoon!');
    });

    it('should say Good afternoon at 4pm', () => {
      vi.setSystemTime(new Date('2024-01-15T16:00:00'));
      expect(getGreeting()).toBe('Good afternoon!');
    });

    it('should say Good evening at 5pm', () => {
      vi.setSystemTime(new Date('2024-01-15T17:00:00'));
      expect(getGreeting()).toBe('Good evening!');
    });

    it('should say Good evening at midnight', () => {
      vi.setSystemTime(new Date('2024-01-15T23:59:00'));
      expect(getGreeting()).toBe('Good evening!');
    });
  });

  describe('Personalized greetings', () => {
    it('should include name when provided', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00'));
      expect(getGreeting('Sarah')).toBe('Good morning, Sarah!');
    });

    it('should work with any name', () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00'));
      expect(getGreeting('Jessica')).toBe('Good afternoon, Jessica!');
    });

    it('should handle empty string as no name', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00'));
      expect(getGreeting('')).toBe('Good morning!');
    });
  });
});

describe('getRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Today" for today', () => {
    expect(getRelativeDate('2024-01-15T08:00:00')).toBe('Today');
  });

  it('should return "Yesterday" for yesterday', () => {
    expect(getRelativeDate('2024-01-14T12:00:00')).toBe('Yesterday');
  });

  it('should return days ago for less than a week', () => {
    expect(getRelativeDate('2024-01-12T12:00:00')).toBe('3 days ago');
    expect(getRelativeDate('2024-01-10T12:00:00')).toBe('5 days ago');
  });

  it('should return weeks ago for less than a month', () => {
    expect(getRelativeDate('2024-01-01T12:00:00')).toBe('2 weeks ago');
    expect(getRelativeDate('2023-12-25T12:00:00')).toBe('3 weeks ago');
  });

  it('should return months ago for less than a year', () => {
    expect(getRelativeDate('2023-12-01T12:00:00')).toBe('1 months ago');
    expect(getRelativeDate('2023-09-15T12:00:00')).toBe('4 months ago');
  });

  it('should return years ago for over a year', () => {
    expect(getRelativeDate('2022-01-15T12:00:00')).toBe('2 years ago');
    expect(getRelativeDate('2021-01-15T12:00:00')).toBe('3 years ago');
  });
});

describe('formatPrice', () => {
  it('should format whole dollar amounts without cents', () => {
    expect(formatPrice(10000)).toBe('$100');
    expect(formatPrice(5000)).toBe('$50');
  });

  it('should format amounts with cents', () => {
    expect(formatPrice(9999)).toBe('$99.99');
    expect(formatPrice(1050)).toMatch(/\$10\.5/); // Handles both $10.5 and $10.50
  });

  it('should format large amounts with commas', () => {
    expect(formatPrice(100000)).toBe('$1,000');
    expect(formatPrice(1000000)).toBe('$10,000');
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('$0');
  });

  it('should handle small amounts', () => {
    expect(formatPrice(99)).toBe('$0.99');
    expect(formatPrice(1)).toBe('$0.01');
  });
});

// Username validation
describe('Username Validation', () => {
  const validateName = (name: string): { valid: boolean; error?: string } => {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Name is required' };
    }
    if (name.length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' };
    }
    if (name.length > 50) {
      return { valid: false, error: 'Name must be less than 50 characters' };
    }
    if (!/^[a-zA-Z\s\-']+$/.test(name)) {
      return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }
    return { valid: true };
  };

  it('should accept valid names', () => {
    expect(validateName('Sarah')).toEqual({ valid: true });
    expect(validateName('Mary Jane')).toEqual({ valid: true });
    expect(validateName("O'Brien")).toEqual({ valid: true });
    expect(validateName('Mary-Jane')).toEqual({ valid: true });
  });

  it('should reject empty names', () => {
    expect(validateName('')).toEqual({ valid: false, error: 'Name is required' });
    expect(validateName('   ')).toEqual({ valid: false, error: 'Name is required' });
  });

  it('should reject names that are too short', () => {
    expect(validateName('A')).toEqual({ valid: false, error: 'Name must be at least 2 characters' });
  });

  it('should reject names that are too long', () => {
    const longName = 'A'.repeat(51);
    expect(validateName(longName)).toEqual({ valid: false, error: 'Name must be less than 50 characters' });
  });

  it('should reject names with invalid characters', () => {
    expect(validateName('Sarah123')).toEqual({ valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' });
    expect(validateName('Sarah@home')).toEqual({ valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' });
  });
});
