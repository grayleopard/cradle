import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const PLATFORM_FEE_PERCENT = 8; // 8% platform fee

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, ...params } = req.body;

  try {
    switch (action) {
      // ============================================
      // CREATE CONNECT ACCOUNT (for sellers)
      // ============================================
      case 'createConnectAccount': {
        const { userId, email, returnUrl } = params;

        // Create a Connect Express account
        const account = await stripe.accounts.create({
          type: 'express',
          email,
          metadata: { cradle_user_id: userId },
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

        // Calculate platform fee
        const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));

        // Create payment intent with application fee
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          // Transfer to seller after capture, minus platform fee
          application_fee_amount: Math.round(platformFee * 100),
          transfer_data: {
            destination: sellerAccountId,
          },
          // Don't capture immediately - we'll capture after inspection
          capture_method: 'manual',
          metadata: {
            transaction_id: transactionId,
            listing_title: listingTitle,
          },
        });

        return res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      }

      // ============================================
      // CAPTURE PAYMENT (after inspection approved)
      // ============================================
      case 'capturePayment': {
        const { paymentIntentId } = params;

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

        const loginLink = await stripe.accounts.createLoginLink(accountId);

        return res.json({
          url: loginLink.url,
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
