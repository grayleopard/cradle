import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP } from './utils/rateLimit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

// Fee structure:
// - Buyer pays: 5.5% platform fee (Pipit's revenue)
// - Seller pays: Stripe processing (~2.9% + $0.30) from their payout
// - Seller pays: 1% instant payout fee (optional)
const BUYER_PLATFORM_FEE_PERCENT = 5.5;
const STRIPE_PROCESSING_PERCENT = 2.9;
const STRIPE_PROCESSING_FIXED = 0.30; // $0.30 per transaction

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://pipit.app',
  'https://www.pipit.app',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
].filter(Boolean);

// Supabase client for auth verification
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Validate Stripe account ID format
function isValidStripeAccountId(id: string): boolean {
  return /^acct_[a-zA-Z0-9]{16,}$/.test(id);
}

// Validate Stripe payment intent ID format
function isValidPaymentIntentId(id: string): boolean {
  return /^pi_[a-zA-Z0-9]{24,}$/.test(id);
}

// Validate amount (positive integer, reasonable max)
function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0 && amount <= 100000 && Number.isFinite(amount);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers - restrict to allowed origins
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting - 20 requests per minute per IP
  const clientIP = getClientIP(req.headers);
  const rateLimit = checkRateLimit(`stripe:${clientIP}`, { windowMs: 60000, maxRequests: 20 });

  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.resetIn));
    return res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${rateLimit.resetIn} seconds.`
    });
  }

  const { action, ...params } = req.body;

  // Validate action exists
  if (!action || typeof action !== 'string') {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  try {
    switch (action) {
      // ============================================
      // CREATE CONNECT ACCOUNT (for sellers)
      // ============================================
      case 'createConnectAccount': {
        const { userId, email, returnUrl } = params;

        // Input validation
        if (!userId || typeof userId !== 'string') {
          return res.status(400).json({ error: 'Missing userId' });
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({ error: 'Invalid email' });
        }
        if (!returnUrl || typeof returnUrl !== 'string') {
          return res.status(400).json({ error: 'Missing returnUrl' });
        }
        // Validate returnUrl is from allowed origin
        try {
          const url = new URL(returnUrl);
          const isAllowedOrigin = ALLOWED_ORIGINS.some(origin => {
            try {
              return new URL(origin).host === url.host;
            } catch { return false; }
          });
          if (!isAllowedOrigin && !returnUrl.startsWith('http://localhost')) {
            return res.status(400).json({ error: 'Invalid return URL origin' });
          }
        } catch {
          return res.status(400).json({ error: 'Invalid return URL format' });
        }

        // Create a Connect Express account for individual sellers
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email,
          business_type: 'individual', // Pre-set for peer-to-peer sellers
          metadata: { pipit_user_id: userId },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        // Create onboarding link
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${returnUrl}?refresh=true`,
          return_url: `${returnUrl}?success=true&account=${account.id}`,
          type: 'account_onboarding',
        });

        return res.json({
          accountId: account.id,
          onboardingUrl: accountLink.url,
        });
      }

      // ============================================
      // GET CONNECT ACCOUNT STATUS
      // ============================================
      case 'getAccountStatus': {
        const { accountId } = params;

        // Input validation
        if (!accountId || !isValidStripeAccountId(accountId)) {
          return res.status(400).json({ error: 'Invalid account ID' });
        }

        const account = await stripe.accounts.retrieve(accountId);

        return res.json({
          id: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        });
      }

      // ============================================
      // CREATE PAYMENT INTENT (buyer pays)
      // ============================================
      case 'createPaymentIntent': {
        const { amount, sellerAccountId, transactionId, listingTitle } = params;

        // Input validation
        if (!isValidAmount(amount)) {
          return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!transactionId || typeof transactionId !== 'string') {
          return res.status(400).json({ error: 'Missing transactionId' });
        }
        if (sellerAccountId && !isValidStripeAccountId(sellerAccountId)) {
          return res.status(400).json({ error: 'Invalid seller account ID' });
        }

        // Fee calculation:
        // - Buyer pays: item price + 5.5% platform fee
        // - Platform keeps: 5.5% (our revenue)
        // - Seller receives: item price - Stripe processing (~2.9% + $0.30)
        const itemPrice = amount; // The listing price
        const buyerPlatformFee = itemPrice * (BUYER_PLATFORM_FEE_PERCENT / 100);
        const buyerTotal = itemPrice + buyerPlatformFee;

        // Stripe processing fee (seller pays this from their payout)
        const stripeProcessingFee = (buyerTotal * (STRIPE_PROCESSING_PERCENT / 100)) + STRIPE_PROCESSING_FIXED;

        // What seller receives after Stripe processing
        const sellerPayout = itemPrice - stripeProcessingFee;

        // Application fee = platform fee + Stripe processing (so seller effectively pays processing)
        const applicationFee = buyerPlatformFee + stripeProcessingFee;

        // Build payment intent options
        const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
          amount: Math.round(buyerTotal * 100), // Convert to cents - buyer pays this
          currency: 'usd',
          // Don't capture immediately - we'll capture after inspection
          capture_method: 'manual',
          metadata: {
            transaction_id: transactionId,
            listing_title: listingTitle,
            item_price_cents: String(Math.round(itemPrice * 100)),
            platform_fee_cents: String(Math.round(buyerPlatformFee * 100)),
            stripe_fee_cents: String(Math.round(stripeProcessingFee * 100)),
            seller_payout_cents: String(Math.round(sellerPayout * 100)),
          },
        };

        // If seller has Stripe account, set up direct transfer
        // Otherwise, funds go to platform and we transfer after seller onboards
        if (sellerAccountId) {
          paymentIntentOptions.application_fee_amount = Math.round(applicationFee * 100);
          paymentIntentOptions.transfer_data = {
            destination: sellerAccountId,
          };
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

        return res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          requiresSellerOnboarding: !sellerAccountId,
          // Return fee breakdown for UI
          feeBreakdown: {
            itemPrice: itemPrice,
            platformFee: Math.round(buyerPlatformFee * 100) / 100,
            buyerTotal: Math.round(buyerTotal * 100) / 100,
            stripeProcessingFee: Math.round(stripeProcessingFee * 100) / 100,
            sellerPayout: Math.round(sellerPayout * 100) / 100,
          }
        });
      }

      // ============================================
      // CAPTURE PAYMENT (after inspection approved)
      // ============================================
      case 'capturePayment': {
        const { paymentIntentId } = params;

        // Input validation
        if (!paymentIntentId || !isValidPaymentIntentId(paymentIntentId)) {
          return res.status(400).json({ error: 'Invalid payment intent ID' });
        }

        const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

        return res.json({
          status: paymentIntent.status,
          captured: paymentIntent.amount,
        });
      }

      // ============================================
      // CANCEL PAYMENT (refund buyer)
      // ============================================
      case 'cancelPayment': {
        const { paymentIntentId } = params;

        // Input validation
        if (!paymentIntentId || !isValidPaymentIntentId(paymentIntentId)) {
          return res.status(400).json({ error: 'Invalid payment intent ID' });
        }

        const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

        return res.json({
          status: paymentIntent.status,
        });
      }

      // ============================================
      // CREATE DASHBOARD LINK (for sellers to view earnings)
      // ============================================
      case 'createDashboardLink': {
        const { accountId } = params;

        // Input validation
        if (!accountId || !isValidStripeAccountId(accountId)) {
          return res.status(400).json({ error: 'Invalid account ID' });
        }

        const loginLink = await stripe.accounts.createLoginLink(accountId);

        return res.json({
          url: loginLink.url,
        });
      }

      // ============================================
      // CREATE PAYOUT (transfer to seller's bank/card)
      // ============================================
      case 'createPayout': {
        const { accountId, amount, method = 'standard' } = params;

        // Input validation
        if (!accountId || !isValidStripeAccountId(accountId)) {
          return res.status(400).json({ error: 'Invalid account ID' });
        }
        if (!isValidAmount(amount)) {
          return res.status(400).json({ error: 'Invalid amount' });
        }
        if (method !== 'standard' && method !== 'instant') {
          return res.status(400).json({ error: 'Invalid payout method' });
        }

        // Create a transfer to the connected account
        const transfer = await stripe.transfers.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          destination: accountId,
          metadata: {
            payout_method: method,
          },
        });

        // For instant payouts (if requested and supported)
        if (method === 'instant') {
          try {
            const payout = await stripe.payouts.create(
              {
                amount: Math.round(amount * 100),
                currency: 'usd',
                method: 'instant',
              },
              {
                stripeAccount: accountId,
              }
            );
            return res.json({
              transferId: transfer.id,
              payoutId: payout.id,
              method: 'instant',
              arrivalDate: 'Minutes',
            });
          } catch (instantError: any) {
            // Fall back to standard if instant not available
            console.log('Instant payout not available, using standard:', instantError.message);
          }
        }

        return res.json({
          transferId: transfer.id,
          method: 'standard',
          arrivalDate: '2-3 business days',
        });
      }

      // ============================================
      // CHECK INSTANT PAYOUT ELIGIBILITY
      // ============================================
      case 'checkInstantPayoutEligibility': {
        const { accountId } = params;

        // Input validation
        if (!accountId || !isValidStripeAccountId(accountId)) {
          return res.status(400).json({ error: 'Invalid account ID' });
        }

        const account = await stripe.accounts.retrieve(accountId);
        const payoutMethods = account.external_accounts?.data || [];

        // Check if any external account supports instant payouts
        const hasInstantEligible = payoutMethods.some(
          (method: any) => method.available_payout_methods?.includes('instant')
        );

        return res.json({
          eligible: hasInstantEligible,
          message: hasInstantEligible
            ? 'Instant payouts available'
            : 'Add a debit card for instant payouts',
        });
      }

      // ============================================
      // TRANSFER TO SELLER (for delayed onboarding)
      // Used when seller onboards after a sale was completed
      // ============================================
      case 'transferToSeller': {
        const { sellerAccountId, paymentIntentId, transactionId } = params;

        // Input validation
        if (!sellerAccountId || !isValidStripeAccountId(sellerAccountId)) {
          return res.status(400).json({ error: 'Invalid seller account ID' });
        }
        if (!paymentIntentId || !isValidPaymentIntentId(paymentIntentId)) {
          return res.status(400).json({ error: 'Invalid payment intent ID' });
        }
        if (!transactionId || typeof transactionId !== 'string') {
          return res.status(400).json({ error: 'Missing transaction ID' });
        }

        // Retrieve the payment intent to get amounts
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ error: 'Payment not yet captured' });
        }

        // Get the platform fee from metadata
        const platformFeeCents = parseInt(paymentIntent.metadata.platform_fee_cents || '0', 10);
        const sellerAmount = paymentIntent.amount_received - platformFeeCents;

        // Create transfer to seller
        const transfer = await stripe.transfers.create({
          amount: sellerAmount,
          currency: 'usd',
          destination: sellerAccountId,
          transfer_group: transactionId,
          metadata: {
            payment_intent_id: paymentIntentId,
            transaction_id: transactionId,
          },
        });

        return res.json({
          transferId: transfer.id,
          amount: sellerAmount / 100, // Convert back to dollars
          status: 'transferred',
        });
      }

      // ============================================
      // CREATE IDENTITY VERIFICATION SESSION
      // ============================================
      case 'createIdentitySession': {
        const { userId, returnUrl } = params;

        // Input validation
        if (!userId || typeof userId !== 'string') {
          return res.status(400).json({ error: 'Missing userId' });
        }
        if (!returnUrl || typeof returnUrl !== 'string') {
          return res.status(400).json({ error: 'Missing returnUrl' });
        }

        // Validate returnUrl is from allowed origin
        try {
          const url = new URL(returnUrl);
          const isAllowedOrigin = ALLOWED_ORIGINS.some(origin => {
            try {
              return new URL(origin).host === url.host;
            } catch { return false; }
          });
          if (!isAllowedOrigin && !returnUrl.startsWith('http://localhost')) {
            return res.status(400).json({ error: 'Invalid return URL origin' });
          }
        } catch {
          return res.status(400).json({ error: 'Invalid return URL format' });
        }

        // Create Stripe Identity Verification Session
        const verificationSession = await stripe.identity.verificationSessions.create({
          type: 'document',
          metadata: {
            pipit_user_id: userId,
          },
          options: {
            document: {
              // Accept driver's license, passport, or ID card
              allowed_types: ['driving_license', 'passport', 'id_card'],
              require_matching_selfie: true, // Require selfie to match document
            },
          },
          return_url: `${returnUrl}?verification=complete`,
        });

        return res.json({
          sessionId: verificationSession.id,
          clientSecret: verificationSession.client_secret,
          url: verificationSession.url, // Redirect URL for hosted verification
          status: verificationSession.status,
        });
      }

      // ============================================
      // GET IDENTITY VERIFICATION STATUS
      // ============================================
      case 'getIdentityStatus': {
        const { sessionId } = params;

        // Input validation
        if (!sessionId || typeof sessionId !== 'string') {
          return res.status(400).json({ error: 'Missing sessionId' });
        }

        // Validate session ID format (starts with vs_)
        if (!sessionId.startsWith('vs_')) {
          return res.status(400).json({ error: 'Invalid session ID format' });
        }

        const session = await stripe.identity.verificationSessions.retrieve(sessionId);

        return res.json({
          status: session.status, // 'requires_input', 'processing', 'verified', 'canceled'
          verified: session.status === 'verified',
          lastError: session.last_error?.reason,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error: any) {
    console.error('Stripe API Error:', error);
    return res.status(500).json({
      error: error.message || 'Stripe API error',
      code: error.code,
    });
  }
}
