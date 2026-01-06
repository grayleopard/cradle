import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const listingLoadTime = new Trend('listing_load_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 50 },    // Hold at 50 users
    { duration: '30s', target: 100 },  // Spike to 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
    errors: ['rate<0.05'],             // Less than 5% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://joinpipit.com';

export default function () {
  group('Browse Home Page', () => {
    const homeRes = http.get(`${BASE_URL}/`);

    check(homeRes, {
      'home page status is 200': (r) => r.status === 200,
      'home page loads under 500ms': (r) => r.timings.duration < 500,
      'home page has content': (r) => r.body.length > 0,
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Browse Listings API', () => {
    const listingsRes = http.get(`${BASE_URL}/api/listings?limit=20`);

    const success = check(listingsRes, {
      'listings API status is 200': (r) => r.status === 200,
      'listings API response time < 500ms': (r) => r.timings.duration < 500,
      'listings API returns JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });

    if (!success) {
      errorRate.add(1);
    }

    listingLoadTime.add(listingsRes.timings.duration);
    sleep(1);
  });

  group('Filter by Category', () => {
    const categories = [
      'Strollers & Travel Systems',
      'Car Seats & Boosters',
      'Cribs & Bassinets',
      'High Chairs & Feeding',
    ];

    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryRes = http.get(`${BASE_URL}/api/listings?category=${encodeURIComponent(category)}&limit=20`);

    check(categoryRes, {
      'category filter status is 200': (r) => r.status === 200,
      'category filter response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(0.5);
  });

  group('Search Listings', () => {
    const searchTerms = ['stroller', 'crib', 'car seat', 'high chair', 'clothes'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const searchRes = http.get(`${BASE_URL}/api/listings?search=${encodeURIComponent(term)}&limit=20`);

    check(searchRes, {
      'search status is 200': (r) => r.status === 200,
      'search response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(0.5);
  });

  group('View Listing Detail', () => {
    // First get listings to get a valid ID
    const listingsRes = http.get(`${BASE_URL}/api/listings?limit=5`);

    if (listingsRes.status === 200) {
      try {
        const listings = JSON.parse(listingsRes.body);
        if (listings && listings.length > 0) {
          const randomListing = listings[Math.floor(Math.random() * listings.length)];
          const detailRes = http.get(`${BASE_URL}/api/listings/${randomListing.id}`);

          check(detailRes, {
            'listing detail status is 200': (r) => r.status === 200,
            'listing detail response time < 500ms': (r) => r.timings.duration < 500,
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
    'load-tests/results/browse-load-summary.json': JSON.stringify(data, null, 2),
  };
}
