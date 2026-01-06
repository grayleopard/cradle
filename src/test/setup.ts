import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock navigator.geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 47.6062,
          longitude: -122.3321,
          accuracy: 100,
        },
      });
    }),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
});

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock AudioContext for voice features
window.AudioContext = vi.fn().mockImplementation(() => ({
  createMediaStreamSource: vi.fn(),
  createAnalyser: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 0,
    frequencyBinCount: 0,
    getByteFrequencyData: vi.fn(),
  })),
  close: vi.fn(),
}));

// Mock MediaRecorder for voice recording
window.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null,
  onstop: null,
  state: 'inactive',
}));

// Suppress console errors in tests unless explicitly testing error handling
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: An update to') ||
        args[0].includes('act(...)'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

// ===========================================
// SERVICE MOCKS
// ===========================================

// Mock Supabase Client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user' } } }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
};

vi.mock('../services/supabase', () => ({
  supabase: mockSupabaseClient,
  getOrCreateUser: vi.fn().mockResolvedValue({
    id: 'test-user',
    name: 'Test User',
    isVerifiedParent: true,
    joinDate: '2024-01',
    itemsSold: 0,
    avatarUrl: '',
    location: '98001',
  }),
}));

// Mock Stripe Service
vi.mock('../services/stripeService', () => ({
  createConnectAccount: vi.fn().mockResolvedValue({
    accountId: 'acct_test123',
    onboardingUrl: 'https://connect.stripe.com/test',
  }),
  getAccountStatus: vi.fn().mockResolvedValue({
    id: 'acct_test123',
    chargesEnabled: true,
    payoutsEnabled: true,
    detailsSubmitted: true,
  }),
  createPaymentIntent: vi.fn().mockResolvedValue({
    clientSecret: 'pi_test_secret',
    paymentIntentId: 'pi_test123',
  }),
  capturePayment: vi.fn().mockResolvedValue({ status: 'succeeded', captured: 10000 }),
  cancelPayment: vi.fn().mockResolvedValue({ status: 'canceled' }),
  createPayout: vi.fn().mockResolvedValue({
    transferId: 'tr_test123',
    method: 'standard',
    arrivalDate: '2024-01-15',
  }),
}));

// Mock Gemini Service
vi.mock('../services/geminiService', () => ({
  checkProductSafety: vi.fn().mockResolvedValue({
    isSafe: true,
    reason: 'No recalls found',
    confidence: 95,
    potentialRecalls: [],
  }),
  generateListingMetadata: vi.fn().mockResolvedValue({
    title: 'Test Item',
    description: 'Test description',
    category: 'Strollers & Travel Systems',
    condition: 'Good',
    ageRange: '0-6mo',
    suggestedPrice: 50,
  }),
  analyzeDeal: vi.fn().mockResolvedValue({
    estimatedRetailPrice: 200,
    savingsPercentage: 50,
    dealScore: 8,
    verdict: 'Great Deal',
    explanation: 'Good price for this item',
  }),
  generateInspectionChecklist: vi.fn().mockResolvedValue([
    'Check brakes',
    'Test folding mechanism',
    'Inspect harness',
  ]),
  validateListingImages: vi.fn().mockResolvedValue({
    overallStatus: 'approved',
    results: [{ index: 0, status: 'approved', qualityScore: 85, relevanceScore: 90, issues: [] }],
    message: 'All images approved',
  }),
}));

// Mock Cloudinary Service
vi.mock('../services/cloudinaryService', () => ({
  uploadImage: vi.fn().mockResolvedValue('https://res.cloudinary.com/test/image/upload/v1234/test.jpg'),
  processImage: vi.fn().mockImplementation((file) => Promise.resolve(file)),
}));

// ===========================================
// TEST UTILITIES
// ===========================================

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  name: 'Test Parent',
  isVerifiedParent: true,
  joinDate: 'Jan 2024',
  itemsSold: 5,
  avatarUrl: 'https://example.com/avatar.jpg',
  location: '98001',
  email: 'test@example.com',
  phoneVerified: true,
  emailVerified: true,
  trustTier: 'verified',
  ...overrides,
});

export const createMockListing = (overrides = {}) => ({
  id: 'test-listing-1',
  userId: 'test-user-1',
  title: 'Test Stroller',
  description: 'Great condition stroller',
  price: 100,
  condition: 'Good',
  category: 'Strollers & Travel Systems',
  ageRange: '0-6mo',
  images: ['https://example.com/image.jpg'],
  locationZip: '98001',
  isSafetyVerified: true,
  distanceMiles: 2.5,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockTransaction = (overrides = {}) => ({
  id: 'test-tx-1',
  listingId: 'test-listing-1',
  buyerId: 'buyer-1',
  sellerId: 'seller-1',
  amount: 100,
  platformFee: 10,
  total: 110,
  status: 'initiated',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockConversation = (overrides = {}) => ({
  id: 'test-conv-1',
  listingId: 'test-listing-1',
  participantIds: ['user-1', 'user-2'],
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockMessage = (overrides = {}) => ({
  id: 'test-msg-1',
  conversationId: 'test-conv-1',
  senderId: 'user-1',
  text: 'Hello!',
  timestamp: new Date().toISOString(),
  isRead: false,
  ...overrides,
});

// Helper to mock fetch responses
export const mockFetchResponse = (data: unknown, ok = true, status = 200) => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));
