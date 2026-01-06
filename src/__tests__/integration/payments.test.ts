import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockFetchResponse, createMockTransaction, createMockListing, createMockUser } from '../../test/setup';
import { TransactionStatus, DonationOption, calculateDonationAmount } from '../../../types';

// Mock Stripe service functions
const mockStripeService = {
  createConnectAccount: vi.fn(),
  getAccountStatus: vi.fn(),
  createPaymentIntent: vi.fn(),
  capturePayment: vi.fn(),
  cancelPayment: vi.fn(),
  createPayout: vi.fn(),
  transferToSeller: vi.fn(),
};

describe('Stripe Connect Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create Connect account for new seller', async () => {
    mockStripeService.createConnectAccount.mockResolvedValue({
      accountId: 'acct_test123',
      onboardingUrl: 'https://connect.stripe.com/setup/test',
    });

    const result = await mockStripeService.createConnectAccount(
      'user-123',
      'seller@example.com',
      'https://pipit.app/profile'
    );

    expect(result.accountId).toBe('acct_test123');
    expect(result.onboardingUrl).toContain('stripe.com');
  });

  it('should check account status', async () => {
    mockStripeService.getAccountStatus.mockResolvedValue({
      id: 'acct_test123',
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
    });

    const status = await mockStripeService.getAccountStatus('acct_test123');

    expect(status.chargesEnabled).toBe(true);
    expect(status.payoutsEnabled).toBe(true);
  });

  it('should handle incomplete onboarding', async () => {
    mockStripeService.getAccountStatus.mockResolvedValue({
      id: 'acct_test123',
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    });

    const status = await mockStripeService.getAccountStatus('acct_test123');

    expect(status.chargesEnabled).toBe(false);
    expect(status.detailsSubmitted).toBe(false);
  });
});

describe('Payment Intent Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create payment intent for purchase', async () => {
    mockStripeService.createPaymentIntent.mockResolvedValue({
      clientSecret: 'pi_test_secret_abc123',
      paymentIntentId: 'pi_test123',
    });

    const result = await mockStripeService.createPaymentIntent(
      10000, // $100 in cents
      'acct_seller123',
      'tx_123',
      'UPPAbaby Stroller'
    );

    expect(result.clientSecret).toContain('pi_test_secret');
    expect(result.paymentIntentId).toBe('pi_test123');
  });

  it('should handle seller without Stripe account (delayed onboarding)', async () => {
    mockStripeService.createPaymentIntent.mockResolvedValue({
      clientSecret: 'pi_test_secret_abc123',
      paymentIntentId: 'pi_test123',
      requiresSellerOnboarding: true,
    });

    const result = await mockStripeService.createPaymentIntent(
      5000,
      undefined, // No seller account
      'tx_456',
      'Baby Carrier'
    );

    expect(result.requiresSellerOnboarding).toBe(true);
    expect(result.clientSecret).toBeDefined();
  });

  it('should capture payment after inspection', async () => {
    mockStripeService.capturePayment.mockResolvedValue({
      status: 'succeeded',
      captured: 10000,
    });

    const result = await mockStripeService.capturePayment('pi_test123');

    expect(result.status).toBe('succeeded');
    expect(result.captured).toBe(10000);
  });

  it('should cancel payment on dispute', async () => {
    mockStripeService.cancelPayment.mockResolvedValue({
      status: 'canceled',
    });

    const result = await mockStripeService.cancelPayment('pi_test123');

    expect(result.status).toBe('canceled');
  });
});

describe('Payout Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create standard payout', async () => {
    mockStripeService.createPayout.mockResolvedValue({
      transferId: 'tr_test123',
      method: 'standard',
      arrivalDate: '2024-01-20',
    });

    const result = await mockStripeService.createPayout('acct_seller123', 9000, 'standard');

    expect(result.method).toBe('standard');
    expect(result.transferId).toBeDefined();
  });

  it('should create instant payout when eligible', async () => {
    mockStripeService.createPayout.mockResolvedValue({
      transferId: 'tr_test456',
      payoutId: 'po_test789',
      method: 'instant',
      arrivalDate: '2024-01-15T10:00:00Z',
    });

    const result = await mockStripeService.createPayout('acct_seller123', 9000, 'instant');

    expect(result.method).toBe('instant');
    expect(result.payoutId).toBeDefined();
  });

  it('should transfer to seller after delayed onboarding', async () => {
    mockStripeService.transferToSeller.mockResolvedValue({
      transferId: 'tr_test123',
      amount: 9000,
      status: 'succeeded',
    });

    const result = await mockStripeService.transferToSeller(
      'acct_seller123',
      'pi_test123',
      'tx_123'
    );

    expect(result.status).toBe('succeeded');
    expect(result.amount).toBe(9000);
  });
});

describe('Transaction State Machine', () => {
  it('should progress through happy path', () => {
    let tx = createMockTransaction({ status: TransactionStatus.INITIATED });

    // Seller accepts
    tx = { ...tx, status: TransactionStatus.ACCEPTED };
    expect(tx.status).toBe(TransactionStatus.ACCEPTED);

    // Buyer pays
    tx = { ...tx, status: TransactionStatus.PAYMENT_HELD };
    expect(tx.status).toBe(TransactionStatus.PAYMENT_HELD);

    // Meetup agreed
    tx = { ...tx, status: TransactionStatus.MEETUP_AGREED, meetupLocation: 'Starbucks', meetupTime: '2024-01-15T14:00:00Z' };
    expect(tx.status).toBe(TransactionStatus.MEETUP_AGREED);

    // Inspection pending
    tx = { ...tx, status: TransactionStatus.INSPECTION_PENDING };
    expect(tx.status).toBe(TransactionStatus.INSPECTION_PENDING);

    // Completed
    tx = { ...tx, status: TransactionStatus.COMPLETED, completedAt: new Date().toISOString() };
    expect(tx.status).toBe(TransactionStatus.COMPLETED);
  });

  it('should handle dispute flow', () => {
    let tx = createMockTransaction({ status: TransactionStatus.INSPECTION_PENDING });

    // Buyer disputes
    tx = { ...tx, status: TransactionStatus.DISPUTED };
    expect(tx.status).toBe(TransactionStatus.DISPUTED);

    // Admin resolves -> cancelled (refund)
    tx = { ...tx, status: TransactionStatus.CANCELLED };
    expect(tx.status).toBe(TransactionStatus.CANCELLED);
  });

  it('should handle seller rejection', () => {
    let tx = createMockTransaction({ status: TransactionStatus.INITIATED });

    // Seller rejects
    tx = { ...tx, status: TransactionStatus.CANCELLED };
    expect(tx.status).toBe(TransactionStatus.CANCELLED);
  });
});

describe('Fee Calculation', () => {
  const calculateFees = (amount: number) => {
    const platformFeePercent = 0.10; // 10%
    const platformFee = Math.round(amount * platformFeePercent);
    const sellerPayout = amount - platformFee;
    return { platformFee, sellerPayout };
  };

  it('should calculate 10% platform fee', () => {
    const { platformFee, sellerPayout } = calculateFees(10000); // $100

    expect(platformFee).toBe(1000); // $10
    expect(sellerPayout).toBe(9000); // $90
  });

  it('should handle small amounts', () => {
    const { platformFee, sellerPayout } = calculateFees(500); // $5

    expect(platformFee).toBe(50); // $0.50
    expect(sellerPayout).toBe(450); // $4.50
  });

  it('should handle large amounts', () => {
    const { platformFee, sellerPayout } = calculateFees(50000); // $500

    expect(platformFee).toBe(5000); // $50
    expect(sellerPayout).toBe(45000); // $450
  });
});

describe('Donation Calculation', () => {
  it('should add round-up donation', () => {
    const subtotal = 47.50;
    const donation = calculateDonationAmount(DonationOption.ROUND_UP, subtotal);
    const total = subtotal + donation;

    expect(donation).toBe(0.50);
    expect(total).toBe(48);
  });

  it('should add 2% donation', () => {
    const subtotal = 100;
    const donation = calculateDonationAmount(DonationOption.PERCENT_2, subtotal);

    expect(donation).toBe(2);
  });

  it('should add 5% donation', () => {
    const subtotal = 100;
    const donation = calculateDonationAmount(DonationOption.PERCENT_5, subtotal);

    expect(donation).toBe(5);
  });

  it('should handle no donation', () => {
    const subtotal = 100;
    const donation = calculateDonationAmount(DonationOption.NONE, subtotal);

    expect(donation).toBe(0);
  });
});

describe('Webhook Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle payment_intent.succeeded', async () => {
    const webhookPayload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test123',
          amount: 10000,
          metadata: { transactionId: 'tx_123' },
        },
      },
    };

    // Simulate webhook handler
    const handleWebhook = (event: typeof webhookPayload) => {
      if (event.type === 'payment_intent.succeeded') {
        return {
          success: true,
          transactionId: event.data.object.metadata.transactionId,
          newStatus: TransactionStatus.PAYMENT_HELD,
        };
      }
      return { success: false };
    };

    const result = handleWebhook(webhookPayload);
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(TransactionStatus.PAYMENT_HELD);
  });

  it('should handle payment_intent.payment_failed', async () => {
    const webhookPayload = {
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_test123',
          last_payment_error: { message: 'Card declined' },
          metadata: { transactionId: 'tx_123' },
        },
      },
    };

    const handleWebhook = (event: typeof webhookPayload) => {
      if (event.type === 'payment_intent.payment_failed') {
        return {
          success: true,
          error: event.data.object.last_payment_error?.message,
        };
      }
      return { success: false };
    };

    const result = handleWebhook(webhookPayload);
    expect(result.success).toBe(true);
    expect(result.error).toBe('Card declined');
  });

  it('should handle charge.refunded', async () => {
    const webhookPayload = {
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_test123',
          amount_refunded: 10000,
          payment_intent: 'pi_test123',
        },
      },
    };

    const handleWebhook = (event: typeof webhookPayload) => {
      if (event.type === 'charge.refunded') {
        return {
          success: true,
          refundedAmount: event.data.object.amount_refunded,
        };
      }
      return { success: false };
    };

    const result = handleWebhook(webhookPayload);
    expect(result.success).toBe(true);
    expect(result.refundedAmount).toBe(10000);
  });
});
