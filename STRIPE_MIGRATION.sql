-- Stripe Connect Migration
-- Run this in Supabase SQL Editor to add Stripe fields

-- Add Stripe fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarded boolean DEFAULT false;

-- Add Stripe payment intent to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Create index for Stripe account lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_account ON public.users(stripe_account_id);
