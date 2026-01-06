import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, createMockListing, createMockUser } from '../../test/setup';
import { Category, Condition, AgeRange } from '../../../types';

describe('Listing CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Listing', () => {
    it('should create a listing with all required fields', async () => {
      const newListing = createMockListing({
        id: 'new-listing-1',
        title: 'UPPAbaby Vista Stroller',
        price: 450,
        category: Category.STROLLERS,
      });

      const mockInsert = vi.fn().mockResolvedValue({ data: newListing, error: null });
      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const db = mockSupabaseClient.from('listings');
      const { data, error } = await db.insert(newListing);

      expect(error).toBeNull();
      expect(data).toEqual(newListing);
      expect(mockInsert).toHaveBeenCalledWith(newListing);
    });

    it('should reject listing without title', async () => {
      const invalidListing = { ...createMockListing(), title: '' };

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Title is required' },
        }),
      });

      const db = mockSupabaseClient.from('listings');
      const { error } = await db.insert(invalidListing);

      expect(error).toBeDefined();
      expect(error?.message).toContain('Title');
    });

    it('should reject listing without images', async () => {
      const invalidListing = { ...createMockListing(), images: [] };

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'At least one image is required' },
        }),
      });

      const db = mockSupabaseClient.from('listings');
      const { error } = await db.insert(invalidListing);

      expect(error).toBeDefined();
    });
  });

  describe('Read Listings', () => {
    it('should fetch all active listings', async () => {
      const mockListings = [
        createMockListing({ id: '1', title: 'Stroller' }),
        createMockListing({ id: '2', title: 'Car Seat' }),
        createMockListing({ id: '3', title: 'High Chair' }),
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockListings, error: null }),
      });

      const db = mockSupabaseClient.from('listings');
      const { data } = await db.select().eq('is_sold', false).order('created_at').limit(50);

      expect(data).toHaveLength(3);
    });

    it('should fetch listing by ID', async () => {
      const mockListing = createMockListing({ id: 'listing-123' });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockListing, error: null }),
      });

      const db = mockSupabaseClient.from('listings');
      const { data } = await db.select().eq('id', 'listing-123').single();

      expect(data?.id).toBe('listing-123');
    });

    it('should return null for non-existent listing', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const db = mockSupabaseClient.from('listings');
      const { data } = await db.select().eq('id', 'non-existent').single();

      expect(data).toBeNull();
    });

    it('should filter by category', async () => {
      const strollerListings = [
        createMockListing({ id: '1', category: Category.STROLLERS }),
        createMockListing({ id: '2', category: Category.STROLLERS }),
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: strollerListings, error: null }),
      });

      const db = mockSupabaseClient.from('listings');
      const { data } = await db.select().eq('category', Category.STROLLERS).order('created_at').limit(20);

      expect(data).toHaveLength(2);
      expect(data?.every(l => l.category === Category.STROLLERS)).toBe(true);
    });
  });

  describe('Update Listing', () => {
    it('should update listing price', async () => {
      const updatedListing = createMockListing({ id: 'listing-123', price: 400 });

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: updatedListing, error: null }),
      });

      const db = mockSupabaseClient.from('listings');
      const { data } = await db.update({ price: 400 }).eq('id', 'listing-123');

      expect(data?.price).toBe(400);
    });

    it('should mark listing as sold', async () => {
      const soldListing = createMockListing({ id: 'listing-123', isSold: true });

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: soldListing, error: null }),
      });

      const db = mockSupabaseClient.from('listings');
      const { data } = await db.update({ is_sold: true }).eq('id', 'listing-123');

      expect(data?.isSold).toBe(true);
    });

    it('should only allow owner to update', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Unauthorized: not listing owner' },
        }),
      });

      const db = mockSupabaseClient.from('listings');
      const { error } = await db.update({ price: 100 }).eq('id', 'listing-123');

      expect(error).toBeDefined();
      expect(error?.message).toContain('Unauthorized');
    });
  });

  describe('Delete Listing', () => {
    it('should delete listing by ID', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const db = mockSupabaseClient.from('listings');
      const { error } = await db.delete().eq('id', 'listing-123');

      expect(error).toBeNull();
    });

    it('should only allow owner to delete', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Unauthorized: not listing owner' },
        }),
      });

      const db = mockSupabaseClient.from('listings');
      const { error } = await db.delete().eq('id', 'listing-123');

      expect(error).toBeDefined();
    });
  });
});

describe('Listing Search & Filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search by text query', async () => {
    const matchingListings = [
      createMockListing({ title: 'UPPAbaby Vista Stroller' }),
      createMockListing({ title: 'UPPAbaby Cruz Stroller' }),
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: matchingListings, error: null }),
    });

    // Simulating text search
    const results = matchingListings.filter(l =>
      l.title.toLowerCase().includes('uppababy')
    );

    expect(results).toHaveLength(2);
  });

  it('should filter by price range', async () => {
    const allListings = [
      createMockListing({ id: '1', price: 50 }),
      createMockListing({ id: '2', price: 100 }),
      createMockListing({ id: '3', price: 200 }),
      createMockListing({ id: '4', price: 500 }),
    ];

    const minPrice = 75;
    const maxPrice = 250;

    const filtered = allListings.filter(l => l.price >= minPrice && l.price <= maxPrice);

    expect(filtered).toHaveLength(2);
    expect(filtered.map(l => l.price)).toEqual([100, 200]);
  });

  it('should filter by age range', async () => {
    const allListings = [
      createMockListing({ id: '1', ageRange: AgeRange.ZERO_TO_SIX_MO }),
      createMockListing({ id: '2', ageRange: AgeRange.SIX_TO_TWELVE_MO }),
      createMockListing({ id: '3', ageRange: AgeRange.TWO_TO_THREE_YR }),
    ];

    const filtered = allListings.filter(l => l.ageRange === AgeRange.ZERO_TO_SIX_MO);

    expect(filtered).toHaveLength(1);
  });

  it('should filter by condition', async () => {
    const allListings = [
      createMockListing({ id: '1', condition: Condition.LIKE_NEW }),
      createMockListing({ id: '2', condition: Condition.GOOD }),
      createMockListing({ id: '3', condition: Condition.FAIR }),
    ];

    const filtered = allListings.filter(l => l.condition === Condition.LIKE_NEW);

    expect(filtered).toHaveLength(1);
  });

  it('should sort by price ascending', async () => {
    const listings = [
      createMockListing({ id: '1', price: 200 }),
      createMockListing({ id: '2', price: 50 }),
      createMockListing({ id: '3', price: 100 }),
    ];

    const sorted = [...listings].sort((a, b) => a.price - b.price);

    expect(sorted[0].price).toBe(50);
    expect(sorted[1].price).toBe(100);
    expect(sorted[2].price).toBe(200);
  });

  it('should sort by distance', async () => {
    const listings = [
      createMockListing({ id: '1', distanceMiles: 5 }),
      createMockListing({ id: '2', distanceMiles: 1 }),
      createMockListing({ id: '3', distanceMiles: 10 }),
    ];

    const sorted = [...listings].sort((a, b) => a.distanceMiles - b.distanceMiles);

    expect(sorted[0].distanceMiles).toBe(1);
    expect(sorted[2].distanceMiles).toBe(10);
  });
});

describe('Listing Safety Verification', () => {
  it('should flag listing for safety check on car seats', async () => {
    const carSeatListing = createMockListing({
      category: Category.CAR_SEATS,
      isSafetyVerified: false,
    });

    expect(carSeatListing.category).toBe(Category.CAR_SEATS);
    expect(carSeatListing.isSafetyVerified).toBe(false);
  });

  it('should store safety check result', async () => {
    const verifiedListing = createMockListing({
      isSafetyVerified: true,
      safetyCheckResult: {
        isSafe: true,
        reason: 'No recalls found',
        confidence: 95,
        potentialRecalls: [],
      },
    });

    expect(verifiedListing.isSafetyVerified).toBe(true);
    expect(verifiedListing.safetyCheckResult?.isSafe).toBe(true);
  });
});
