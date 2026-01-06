import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const createListingTime = new Trend('create_listing_time');

// Test configuration - Lower concurrency for write operations
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 20 },    // Hold at 20 users
    { duration: '30s', target: 20 },   // Maintain 20 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s (writes are slower)
    http_req_failed: ['rate<0.05'],     // Less than 5% failure rate
    errors: ['rate<0.1'],               // Less than 10% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://joinpipit.com';

// Mock auth token for testing (would be replaced with real auth in production)
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
  };

  group('Create Listing Flow', () => {
    // Step 1: Validate listing data (simulated AI check)
    const validationPayload = JSON.stringify({
      action: 'validateImages',
      images: [{ base64: 'mock-base64-data', mimeType: 'image/jpeg' }],
      category: 'Strollers & Travel Systems',
    });

    const validationRes = http.post(`${BASE_URL}/api/gemini`, validationPayload, { headers });

    check(validationRes, {
      'image validation returns 200': (r) => r.status === 200 || r.status === 201,
      'image validation under 3s': (r) => r.timings.duration < 3000,
    }) || errorRate.add(1);

    sleep(0.5);
  });

  group('Safety Check', () => {
    const safetyPayload = JSON.stringify({
      action: 'checkProductSafety',
      title: 'UPPAbaby Vista Stroller',
      description: 'Excellent condition, used for 6 months',
    });

    const safetyRes = http.post(`${BASE_URL}/api/gemini`, safetyPayload, { headers });

    check(safetyRes, {
      'safety check returns 200': (r) => r.status === 200 || r.status === 201,
      'safety check under 5s': (r) => r.timings.duration < 5000,
    }) || errorRate.add(1);

    sleep(0.5);
  });

  group('Submit Listing', () => {
    const listingPayload = JSON.stringify({
      title: `Test Stroller ${Date.now()}`,
      description: 'Load test listing - please ignore',
      price: Math.floor(Math.random() * 200) + 50,
      condition: 'Good',
      category: 'Strollers & Travel Systems',
      ageRange: '0-6mo',
      images: ['https://example.com/test-image.jpg'],
      locationZip: '98001',
    });

    const startTime = Date.now();
    const createRes = http.post(`${BASE_URL}/api/listings`, listingPayload, { headers });
    const duration = Date.now() - startTime;

    createListingTime.add(duration);

    check(createRes, {
      'create listing returns 200/201': (r) => r.status === 200 || r.status === 201,
      'create listing under 2s': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Update Listing', () => {
    // First create a listing to update
    const listingPayload = JSON.stringify({
      title: `Update Test ${Date.now()}`,
      description: 'Will be updated',
      price: 100,
      condition: 'Good',
      category: 'Toys & Books',
      ageRange: '0-6mo',
      images: ['https://example.com/test.jpg'],
      locationZip: '98001',
    });

    const createRes = http.post(`${BASE_URL}/api/listings`, listingPayload, { headers });

    if (createRes.status === 200 || createRes.status === 201) {
      try {
        const listing = JSON.parse(createRes.body);
        if (listing && listing.id) {
          const updatePayload = JSON.stringify({
            price: 90,
            description: 'Updated description for load test',
          });

          const updateRes = http.patch(
            `${BASE_URL}/api/listings/${listing.id}`,
            updatePayload,
            { headers }
          );

          check(updateRes, {
            'update listing returns 200': (r) => r.status === 200,
            'update listing under 1s': (r) => r.timings.duration < 1000,
          }) || errorRate.add(1);
        }
      } catch (e) {
        errorRate.add(1);
      }
    }

    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    'load-tests/results/listing-load-summary.json': JSON.stringify(data, null, 2),
  };
}
