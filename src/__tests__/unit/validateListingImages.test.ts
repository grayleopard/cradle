import { describe, it, expect } from 'vitest';
import { IMAGE_VALIDATION_THRESHOLDS, ImageValidationStatus } from '../../../types';

// Image validation helper functions
const validateFileType = (mimeType: string): boolean => {
  return IMAGE_VALIDATION_THRESHOLDS.ALLOWED_TYPES.includes(mimeType);
};

const validateFileSize = (sizeBytes: number): boolean => {
  const sizeMB = sizeBytes / (1024 * 1024);
  return sizeMB <= IMAGE_VALIDATION_THRESHOLDS.MAX_FILE_SIZE_MB;
};

const validateDimensions = (width: number, height: number): boolean => {
  return width >= IMAGE_VALIDATION_THRESHOLDS.MIN_RESOLUTION &&
         height >= IMAGE_VALIDATION_THRESHOLDS.MIN_RESOLUTION;
};

const getValidationStatus = (
  qualityScore: number,
  relevanceScore: number
): ImageValidationStatus => {
  if (qualityScore < IMAGE_VALIDATION_THRESHOLDS.MIN_QUALITY_SCORE ||
      relevanceScore < IMAGE_VALIDATION_THRESHOLDS.MIN_RELEVANCE_SCORE) {
    return ImageValidationStatus.REJECTED;
  }
  if (qualityScore < IMAGE_VALIDATION_THRESHOLDS.WARNING_QUALITY_SCORE) {
    return ImageValidationStatus.WARNING;
  }
  return ImageValidationStatus.APPROVED;
};

describe('validateFileType', () => {
  it('should accept JPEG images', () => {
    expect(validateFileType('image/jpeg')).toBe(true);
  });

  it('should accept PNG images', () => {
    expect(validateFileType('image/png')).toBe(true);
  });

  it('should accept WebP images', () => {
    expect(validateFileType('image/webp')).toBe(true);
  });

  it('should accept HEIC images', () => {
    expect(validateFileType('image/heic')).toBe(true);
  });

  it('should reject GIF images', () => {
    expect(validateFileType('image/gif')).toBe(false);
  });

  it('should reject SVG images', () => {
    expect(validateFileType('image/svg+xml')).toBe(false);
  });

  it('should reject non-image files', () => {
    expect(validateFileType('application/pdf')).toBe(false);
    expect(validateFileType('text/plain')).toBe(false);
    expect(validateFileType('video/mp4')).toBe(false);
  });
});

describe('validateFileSize', () => {
  const MB = 1024 * 1024;

  it('should accept files under 10MB', () => {
    expect(validateFileSize(5 * MB)).toBe(true);
    expect(validateFileSize(1 * MB)).toBe(true);
    expect(validateFileSize(9.9 * MB)).toBe(true);
  });

  it('should accept files exactly at 10MB', () => {
    expect(validateFileSize(10 * MB)).toBe(true);
  });

  it('should reject files over 10MB', () => {
    expect(validateFileSize(11 * MB)).toBe(false);
    expect(validateFileSize(20 * MB)).toBe(false);
    expect(validateFileSize(100 * MB)).toBe(false);
  });

  it('should accept very small files', () => {
    expect(validateFileSize(100 * 1024)).toBe(true); // 100KB
    expect(validateFileSize(1)).toBe(true); // 1 byte
  });
});

describe('validateDimensions', () => {
  it('should accept images at minimum resolution', () => {
    expect(validateDimensions(400, 400)).toBe(true);
  });

  it('should accept images above minimum resolution', () => {
    expect(validateDimensions(1920, 1080)).toBe(true);
    expect(validateDimensions(4000, 3000)).toBe(true);
  });

  it('should reject images with width below minimum', () => {
    expect(validateDimensions(399, 600)).toBe(false);
    expect(validateDimensions(100, 1000)).toBe(false);
  });

  it('should reject images with height below minimum', () => {
    expect(validateDimensions(600, 399)).toBe(false);
    expect(validateDimensions(1000, 100)).toBe(false);
  });

  it('should reject images with both dimensions below minimum', () => {
    expect(validateDimensions(200, 200)).toBe(false);
    expect(validateDimensions(100, 100)).toBe(false);
  });
});

describe('getValidationStatus', () => {
  describe('APPROVED status', () => {
    it('should approve high quality and relevance', () => {
      expect(getValidationStatus(85, 90)).toBe(ImageValidationStatus.APPROVED);
    });

    it('should approve at warning threshold', () => {
      expect(getValidationStatus(60, 60)).toBe(ImageValidationStatus.APPROVED);
    });

    it('should approve above warning threshold', () => {
      expect(getValidationStatus(75, 80)).toBe(ImageValidationStatus.APPROVED);
    });
  });

  describe('WARNING status', () => {
    it('should warn when quality is between min and warning threshold', () => {
      expect(getValidationStatus(50, 70)).toBe(ImageValidationStatus.WARNING);
    });

    it('should warn at exactly min quality with good relevance', () => {
      expect(getValidationStatus(40, 70)).toBe(ImageValidationStatus.WARNING);
    });

    it('should warn just above min quality', () => {
      expect(getValidationStatus(41, 60)).toBe(ImageValidationStatus.WARNING);
    });
  });

  describe('REJECTED status', () => {
    it('should reject when quality below minimum', () => {
      expect(getValidationStatus(39, 90)).toBe(ImageValidationStatus.REJECTED);
    });

    it('should reject when relevance below minimum', () => {
      expect(getValidationStatus(80, 49)).toBe(ImageValidationStatus.REJECTED);
    });

    it('should reject when both below minimum', () => {
      expect(getValidationStatus(30, 30)).toBe(ImageValidationStatus.REJECTED);
    });

    it('should reject at zero scores', () => {
      expect(getValidationStatus(0, 0)).toBe(ImageValidationStatus.REJECTED);
    });
  });
});

describe('Image validation edge cases', () => {
  it('should handle boundary conditions for quality', () => {
    // At min quality threshold
    expect(getValidationStatus(40, 60)).toBe(ImageValidationStatus.WARNING);
    // Just below min quality threshold
    expect(getValidationStatus(39, 60)).toBe(ImageValidationStatus.REJECTED);
    // At warning threshold
    expect(getValidationStatus(60, 60)).toBe(ImageValidationStatus.APPROVED);
    // Just below warning threshold
    expect(getValidationStatus(59, 60)).toBe(ImageValidationStatus.WARNING);
  });

  it('should handle boundary conditions for relevance', () => {
    // At min relevance threshold
    expect(getValidationStatus(70, 50)).toBe(ImageValidationStatus.APPROVED);
    // Just below min relevance threshold
    expect(getValidationStatus(70, 49)).toBe(ImageValidationStatus.REJECTED);
  });

  it('should handle perfect scores', () => {
    expect(getValidationStatus(100, 100)).toBe(ImageValidationStatus.APPROVED);
  });
});

describe('Listing image requirements', () => {
  const MIN_IMAGES = 1;
  const MAX_IMAGES = 6;

  const validateImageCount = (count: number): { valid: boolean; error?: string } => {
    if (count < MIN_IMAGES) {
      return { valid: false, error: 'At least 1 image is required' };
    }
    if (count > MAX_IMAGES) {
      return { valid: false, error: `Maximum ${MAX_IMAGES} images allowed` };
    }
    return { valid: true };
  };

  it('should require at least 1 image', () => {
    expect(validateImageCount(0)).toEqual({ valid: false, error: 'At least 1 image is required' });
  });

  it('should accept 1-6 images', () => {
    expect(validateImageCount(1)).toEqual({ valid: true });
    expect(validateImageCount(3)).toEqual({ valid: true });
    expect(validateImageCount(6)).toEqual({ valid: true });
  });

  it('should reject more than 6 images', () => {
    expect(validateImageCount(7)).toEqual({ valid: false, error: 'Maximum 6 images allowed' });
    expect(validateImageCount(10)).toEqual({ valid: false, error: 'Maximum 6 images allowed' });
  });
});
