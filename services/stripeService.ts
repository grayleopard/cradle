const STRIPE_API_URL = '/api/stripe';

async function callStripeAPI<T>(action: string, params: Record<string, any>): Promise<T> {
  const response = await fetch(STRIPE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Stripe API error: ${response.status}`);
  }

  return response.json();
}

// ============================================
// SELLER ONBOARDING
// ============================================

export interface ConnectAccountResult {
  accountId: string;
  onboardingUrl: string;
}

export async function createConnectAccount(
  userId: string,
  email: string,
  returnUrl: string
): Promise<ConnectAccountResult> {
  return callStripeAPI('createConnectAccount', { userId, email, returnUrl });
}

export interface AccountStatus {
  id: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export async function getAccountStatus(accountId: string): Promise<AccountStatus> {
  return callStripeAPI('getAccountStatus', { accountId });
}

export async function createDashboardLink(accountId: string): Promise<{ url: string }> {
  return callStripeAPI('createDashboardLink', { accountId });
}

// ============================================
// PAYMENTS
// ============================================

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  requiresSellerOnboarding?: boolean;
}

export async function createPaymentIntent(
  amount: number,
  sellerAccountId: string | undefined,
  transactionId: string,
  listingTitle: string
): Promise<PaymentIntentResult> {
  return callStripeAPI('createPaymentIntent', {
    amount,
    sellerAccountId: sellerAccountId || null, // Send null if undefined
    transactionId,
    listingTitle,
  });
}

export async function capturePayment(paymentIntentId: string): Promise<{ status: string; captured: number }> {
  return callStripeAPI('capturePayment', { paymentIntentId });
}

export async function cancelPayment(paymentIntentId: string): Promise<{ status: string }> {
  return callStripeAPI('cancelPayment', { paymentIntentId });
}

// ============================================
// PAYOUTS
// ============================================

export interface PayoutResult {
  transferId: string;
  payoutId?: string;
  method: 'instant' | 'standard';
  arrivalDate: string;
}

export async function createPayout(
  accountId: string,
  amount: number,
  method: 'instant' | 'standard' = 'standard'
): Promise<PayoutResult> {
  return callStripeAPI('createPayout', { accountId, amount, method });
}

export async function checkInstantPayoutEligibility(
  accountId: string
): Promise<{ eligible: boolean; message: string }> {
  return callStripeAPI('checkInstantPayoutEligibility', { accountId });
}

// ============================================
// DELAYED ONBOARDING - TRANSFER TO SELLER
// ============================================

export interface TransferResult {
  transferId: string;
  amount: number;
  status: string;
}

export async function transferToSeller(
  sellerAccountId: string,
  paymentIntentId: string,
  transactionId: string
): Promise<TransferResult> {
  return callStripeAPI('transferToSeller', {
    sellerAccountId,
    paymentIntentId,
    transactionId,
  });
}
