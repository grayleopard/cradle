import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialize Supabase client for updating database
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const config = {
  api: {
    bodyParser: false, // Required for webhook signature verification
  },
};

// Helper to read raw body for signature verification
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      console.error('[Webhook] Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    if (!webhookSecret) {
      console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      // ============================================
      // PAYMENT INTENT SUCCEEDED (payment captured)
      // ============================================
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const transactionId = paymentIntent.metadata?.transaction_id;

        console.log(`[Webhook] Payment succeeded for transaction: ${transactionId}`);

        if (supabase && transactionId) {
          await supabase
            .from('transactions')
            .update({
              status: 'payment_captured',
              payment_captured_at: new Date().toISOString(),
              stripe_payment_intent_id: paymentIntent.id,
            })
            .eq('id', transactionId);
        }
        break;
      }

      // ============================================
      // PAYMENT INTENT FAILED
      // ============================================
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const transactionId = paymentIntent.metadata?.transaction_id;
        const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

        console.log(`[Webhook] Payment failed for transaction: ${transactionId} - ${failureMessage}`);

        if (supabase && transactionId) {
          await supabase
            .from('transactions')
            .update({
              status: 'payment_failed',
              failure_reason: failureMessage,
            })
            .eq('id', transactionId);
        }
        break;
      }

      // ============================================
      // PAYMENT INTENT CANCELED (refund issued)
      // ============================================
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const transactionId = paymentIntent.metadata?.transaction_id;

        console.log(`[Webhook] Payment canceled for transaction: ${transactionId}`);

        if (supabase && transactionId) {
          await supabase
            .from('transactions')
            .update({
              status: 'refunded',
              refunded_at: new Date().toISOString(),
            })
            .eq('id', transactionId);
        }
        break;
      }

      // ============================================
      // CONNECT ACCOUNT UPDATED
      // ============================================
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.cradle_user_id;

        console.log(`[Webhook] Connect account updated: ${account.id}, user: ${userId}`);

        if (supabase && userId) {
          await supabase
            .from('users')
            .update({
              stripe_account_id: account.id,
              stripe_onboarded: account.charges_enabled && account.payouts_enabled,
              stripe_charges_enabled: account.charges_enabled,
              stripe_payouts_enabled: account.payouts_enabled,
            })
            .eq('id', userId);
        }
        break;
      }

      // ============================================
      // CHARGE REFUNDED
      // ============================================
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log(`[Webhook] Charge refunded: ${charge.id}`);
        // Additional refund handling if needed
        break;
      }

      // ============================================
      // PAYOUT PAID (seller received funds)
      // ============================================
      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        console.log(`[Webhook] Payout completed: ${payout.id}, amount: ${payout.amount}`);
        // Could notify seller that funds have been deposited
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] Error processing event:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
