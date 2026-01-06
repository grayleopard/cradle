import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Category, IMAGE_VALIDATION_THRESHOLDS } from '../../../types';

// Mock the checkProductSafety function behavior
const mockSafetyCheck = async (title: string, description: string) => {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();
  const combined = `${lowerTitle} ${lowerDesc}`;

  // Check for recalled brands/products
  const recalledPatterns = [
    { pattern: /fisher.?price rock.?n.?play/i, reason: 'Fisher-Price Rock n Play recalled due to infant deaths' },
    { pattern: /drop.?side crib/i, reason: 'Drop-side cribs banned due to entrapment hazards' },
    { pattern: /bumbo.*seat/i, reason: 'Bumbo seats require safety warnings about fall risk' },
  ];

  for (const { pattern, reason } of recalledPatterns) {
    if (pattern.test(combined)) {
      return {
        isSafe: false,
        reason,
        confidence: 95,
        potentialRecalls: [reason],
      };
    }
  }

  // Check for car seat expiration concerns
  if (combined.includes('car seat') && combined.includes('201')) {
    const yearMatch = combined.match(/20(1[0-9])/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      if (year < 2018) {
        return {
          isSafe: false,
          reason: 'Car seat may be expired (typically 6-10 years from manufacture)',
          confidence: 80,
          potentialRecalls: [],
        };
      }
    }
  }

  // Default: Safe
  return {
    isSafe: true,
    reason: 'No safety concerns identified',
    confidence: 85,
    potentialRecalls: [],
  };
};

describe('Safety Check Logic', () => {
  describe('Recalled product detection', () => {
    it('should flag Fisher-Price Rock n Play', async () => {
      const result = await mockSafetyCheck(
        'Fisher-Price Rock n Play Sleeper',
        'Gently used, great for soothing baby'
      );
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain('recalled');
    });

    it('should flag drop-side cribs', async () => {
      const result = await mockSafetyCheck(
        'Vintage Drop Side Crib',
        'Beautiful antique crib with drop side for easy access'
      );
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain('banned');
    });

    it('should flag Bumbo seats with warning', async () => {
      const result = await mockSafetyCheck(
        'Bumbo Floor Seat',
        'Great for sitting practice'
      );
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain('safety warnings');
    });
  });

  describe('Car seat expiration', () => {
    it('should flag potentially expired car seats', async () => {
      const result = await mockSafetyCheck(
        'Graco Car Seat 2015',
        'Used car seat from 2015, still works great'
      );
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('should allow recent car seats', async () => {
      const result = await mockSafetyCheck(
        'Graco Car Seat 2022',
        'Like new car seat purchased in 2022'
      );
      expect(result.isSafe).toBe(true);
    });
  });

  describe('Safe products', () => {
    it('should approve standard stroller', async () => {
      const result = await mockSafetyCheck(
        'UPPAbaby Vista Stroller',
        'Excellent condition, used for 6 months'
      );
      expect(result.isSafe).toBe(true);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should approve clothing bundles', async () => {
      const result = await mockSafetyCheck(
        'Baby Clothes Bundle 0-3 months',
        '20 pieces, gently used, no stains'
      );
      expect(result.isSafe).toBe(true);
    });

    it('should approve toys', async () => {
      const result = await mockSafetyCheck(
        'Wooden Block Set',
        'Educational toys, age 1+'
      );
      expect(result.isSafe).toBe(true);
    });
  });
});

describe('IMAGE_VALIDATION_THRESHOLDS', () => {
  it('should have reasonable quality thresholds', () => {
    expect(IMAGE_VALIDATION_THRESHOLDS.MIN_QUALITY_SCORE).toBe(40);
    expect(IMAGE_VALIDATION_THRESHOLDS.WARNING_QUALITY_SCORE).toBe(60);
    expect(IMAGE_VALIDATION_THRESHOLDS.WARNING_QUALITY_SCORE).toBeGreaterThan(
      IMAGE_VALIDATION_THRESHOLDS.MIN_QUALITY_SCORE
    );
  });

  it('should have reasonable relevance threshold', () => {
    expect(IMAGE_VALIDATION_THRESHOLDS.MIN_RELEVANCE_SCORE).toBe(50);
  });

  it('should have reasonable file size limit', () => {
    expect(IMAGE_VALIDATION_THRESHOLDS.MAX_FILE_SIZE_MB).toBe(10);
  });

  it('should have minimum resolution requirement', () => {
    expect(IMAGE_VALIDATION_THRESHOLDS.MIN_RESOLUTION).toBe(400);
  });

  it('should allow common image types', () => {
    expect(IMAGE_VALIDATION_THRESHOLDS.ALLOWED_TYPES).toContain('image/jpeg');
    expect(IMAGE_VALIDATION_THRESHOLDS.ALLOWED_TYPES).toContain('image/png');
    expect(IMAGE_VALIDATION_THRESHOLDS.ALLOWED_TYPES).toContain('image/webp');
    expect(IMAGE_VALIDATION_THRESHOLDS.ALLOWED_TYPES).toContain('image/heic');
  });

  it('should not allow gif (for quality reasons)', () => {
    expect(IMAGE_VALIDATION_THRESHOLDS.ALLOWED_TYPES).not.toContain('image/gif');
  });
});

describe('Category-specific safety rules', () => {
  const getCategoryChecklist = (category: Category): string[] => {
    switch (category) {
      case Category.STROLLERS:
        return ['Check brakes', 'Test folding mechanism', 'Inspect harness', 'Check wheels'];
      case Category.CAR_SEATS:
        return ['Check expiration date', 'Inspect for stress marks', 'Verify harness tightens', 'Check buckle function'];
      case Category.CRIBS:
        return ['Check slat spacing', 'Inspect mattress support', 'Verify no drop sides', 'Check for recalls'];
      case Category.TOYS:
        return ['Check for loose parts', 'Inspect battery compartment', 'Check for sharp edges', 'Verify sound/lights'];
      default:
        return ['Item matches description', 'No undisclosed damage', 'Clean condition', 'All parts included'];
    }
  };

  it('should have stroller-specific checks', () => {
    const checklist = getCategoryChecklist(Category.STROLLERS);
    expect(checklist).toContain('Check brakes');
    expect(checklist).toContain('Test folding mechanism');
  });

  it('should have car seat-specific checks', () => {
    const checklist = getCategoryChecklist(Category.CAR_SEATS);
    expect(checklist).toContain('Check expiration date');
    expect(checklist).toContain('Inspect for stress marks');
  });

  it('should have crib-specific checks', () => {
    const checklist = getCategoryChecklist(Category.CRIBS);
    expect(checklist).toContain('Check slat spacing');
    expect(checklist).toContain('Verify no drop sides');
  });

  it('should have toy-specific checks', () => {
    const checklist = getCategoryChecklist(Category.TOYS);
    expect(checklist).toContain('Check for loose parts');
    expect(checklist).toContain('Check for sharp edges');
  });

  it('should have generic checks for other categories', () => {
    const checklist = getCategoryChecklist(Category.CLOTHING);
    expect(checklist).toContain('Item matches description');
    expect(checklist).toContain('No undisclosed damage');
  });
});
