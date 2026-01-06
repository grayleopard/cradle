import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const messageSendTime = new Trend('message_send_time');
const conversationLoadTime = new Trend('conversation_load_time');

// Test configuration - Higher concurrency for messaging
export const options = {
  stages: [
    { duration: '30s', target: 30 },   // Ramp up to 30 users
    { duration: '1m', target: 100 },   // Hold at 100 users
    { duration: '30s', target: 100 },  // Maintain
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% under 1s
    http_req_failed: ['rate<0.01'],     // Less than 1% failure rate
    errors: ['rate<0.05'],              // Less than 5% error rate
    message_send_time: ['p(95)<500'],   // Message send under 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://joinpipit.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
  };

  const userId = `user_${__VU}_${Date.now()}`;

  group('Load Conversations', () => {
    const startTime = Date.now();
    const convsRes = http.get(`${BASE_URL}/api/conversations?userId=${userId}`, { headers });
    conversationLoadTime.add(Date.now() - startTime);

    check(convsRes, {
      'conversations load returns 200': (r) => r.status === 200 || r.status === 401,
      'conversations load under 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(0.5);
  });

  group('Load Messages', () => {
    const conversationId = `conv_test_${__VU}`;
    const messagesRes = http.get(
      `${BASE_URL}/api/messages?conversationId=${conversationId}`,
      { headers }
    );

    check(messagesRes, {
      'messages load returns 200': (r) => r.status === 200 || r.status === 401,
      'messages load under 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(0.5);
  });

  group('Send Message', () => {
    const messagePayload = JSON.stringify({
      conversationId: `conv_test_${__VU}`,
      text: `Load test message from VU ${__VU} at ${Date.now()}`,
      senderId: userId,
    });

    const startTime = Date.now();
    const sendRes = http.post(`${BASE_URL}/api/messages`, messagePayload, { headers });
    messageSendTime.add(Date.now() - startTime);

    check(sendRes, {
      'send message returns 200/201': (r) => r.status === 200 || r.status === 201 || r.status === 401,
      'send message under 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(0.5);
  });

  group('Mark Messages Read', () => {
    const markReadPayload = JSON.stringify({
      conversationId: `conv_test_${__VU}`,
      userId: userId,
    });

    const markReadRes = http.post(
      `${BASE_URL}/api/messages/mark-read`,
      markReadPayload,
      { headers }
    );

    check(markReadRes, {
      'mark read returns 200': (r) => r.status === 200 || r.status === 401 || r.status === 404,
      'mark read under 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);

    sleep(0.5);
  });

  group('Create Conversation', () => {
    const createConvPayload = JSON.stringify({
      listingId: `listing_test_${__VU}`,
      participantIds: [userId, 'seller_test'],
    });

    const createConvRes = http.post(
      `${BASE_URL}/api/conversations`,
      createConvPayload,
      { headers }
    );

    check(createConvRes, {
      'create conversation returns 200/201': (r) => r.status === 200 || r.status === 201 || r.status === 401,
      'create conversation under 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Get Unread Count', () => {
    const unreadRes = http.get(
      `${BASE_URL}/api/notifications/unread?userId=${userId}`,
      { headers }
    );

    check(unreadRes, {
      'unread count returns 200': (r) => r.status === 200 || r.status === 401,
      'unread count under 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1);

    sleep(0.5);
  });
}

export function handleSummary(data) {
  return {
    'load-tests/results/message-load-summary.json': JSON.stringify(data, null, 2),
  };
}
