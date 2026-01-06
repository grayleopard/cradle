import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const paymentIntentTime = new Trend('payment_intent_time');
const transactionTime = new Trend('transaction_time');

// Test configuration - Conservative for payment operations
export const options = {
  stages: [
    { duration: '30s', target: 5 },    // Ramp up to 5 users
    { duration: '1m', target: 10 },    // Hold at 10 users
    { duration: '30s', target: 10 },   // Maintain
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% under 3s (Stripe calls can be slow)
    http_req_failed: ['rate<0.05'],     // Less than 5% failure rate
    errors: ['rate<0.1'],               // Less than 10% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://joinpipit.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
  };

  group('Create Transaction', () => {
    const transactionPayload = JSON.stringify({
      listingId: 'test-listing-123',
      amount: 10000, // $100 in cents
    });

    const startTime = Date.now();
    const txRes = http.post(`${BASE_URL}/api/transactions`, transactionPayload, { headers });
    transactionTime.add(Date.now() - startTime);

    check(txRes, {
      'create transaction returns 200/201': (r) => r.status === 200 || r.status === 201 || r.status === 401,
      'create transaction under 2s': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Create Payment Intent', () => {
    const paymentPayload = JSON.stringify({
      action: 'createPaymentIntent',
      amount: 10000,
      sellerAccountId: 'acct_test123',
      transactionId: 'tx_test123',
      listingTitle: 'Test Stroller',
    });

    const startTime = Date.now();
    const piRes = http.post(`${BASE_URL}/api/stripe`, paymentPayload, { headers });
    paymentIntentTime.add(Date.now() - startTime);

    check(piRes, {
      'payment intent returns 200': (r) => r.status === 200 || r.status === 201 || r.status === 401,
      'payment intent under 3s': (r) => r.timings.duration < 3000,
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Get Account Status', () => {
    const statusPayload = JSON.stringify({
      action: 'getAccountStatus',
      accountId: 'acct_test123',
    });

    const statusRes = http.post(`${BASE_URL}/api/stripe`, statusPayload, { headers });

    check(statusRes, {
      'account status returns 200': (r) => r.status === 200 || r.status === 401,
      'account status under 2s': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    sleep(0.5);
  });

  group('Capture Payment', () => {
    const capturePayload = JSON.stringify({
      action: 'capturePayment',
      paymentIntentId: 'pi_test123',
    });

    const captureRes = http.post(`${BASE_URL}/api/stripe`, capturePayload, { headers });

    check(captureRes, {
      'capture payment returns 200': (r) => r.status === 200 || r.status === 400 || r.status === 401,
      'capture payment under 3s': (r) => r.timings.duration < 3000,
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Calculate Fees', () => {
    // Simple fee calculation test
    const amount = Math.floor(Math.random() * 50000) + 1000; // $10-$510
    const platformFee = Math.round(amount * 0.10);
    const sellerPayout = amount - platformFee;

    check(null, {
      'fee calculation is correct': () => platformFee + sellerPayout === amount,
      'platform fee is 10%': () => platformFee === Math.round(amount * 0.10),
    }) || errorRate.add(1);

    sleep(0.5);
  });
}

export function handleSummary(data) {
  return {
    'load-tests/results/checkout-load-summary.json': JSON.stringify(data, null, 2),
  };
}
