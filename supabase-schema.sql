-- Pipit Database Schema for Supabase
-- Run this SQL in the Supabase SQL Editor to create all required tables

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT,
  email TEXT,
  location_zip TEXT,
  is_verified_parent BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  items_sold INTEGER DEFAULT 0,
  avatar_url TEXT,
  bio TEXT,
  saved_listing_ids TEXT[] DEFAULT '{}',
  saved_searches JSONB DEFAULT '[]',
  following_ids TEXT[] DEFAULT '{}',

  -- Stripe Connect
  stripe_account_id TEXT,
  stripe_onboarded BOOLEAN DEFAULT false,
  stripe_charges_enabled BOOLEAN DEFAULT false,
  stripe_payouts_enabled BOOLEAN DEFAULT false,

  -- Referral Program
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  referral_credit DECIMAL(10,2) DEFAULT 0,
  referral_count INTEGER DEFAULT 0,

  -- Social/Community
  neighborhood TEXT,
  kid_ages INTEGER[] DEFAULT '{}',
  parenting_tags TEXT[] DEFAULT '{}',

  -- Charity
  total_donated DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on referral_code for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- ============================================
-- LISTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  deal_analysis JSONB,
  condition TEXT NOT NULL,
  category TEXT NOT NULL,
  age_range TEXT,
  brand TEXT,
  model TEXT,
  manufacture_date DATE,
  expiration_date DATE,
  is_smoke_free BOOLEAN,
  is_pet_free BOOLEAN,
  images TEXT[] DEFAULT '{}',
  location_zip TEXT,
  is_safety_verified BOOLEAN DEFAULT false,
  safety_check_result JSONB,
  is_sold BOOLEAN DEFAULT false,
  is_promoted BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_is_sold ON listings(is_sold);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  participant_ids TEXT[] NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding user's conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participant_ids);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user reviews
CREATE INDEX IF NOT EXISTS idx_reviews_target_user ON reviews(target_user_id);

-- ============================================
-- OFFERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  counter_amount DECIMAL(10,2),
  message TEXT,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for offer queries
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller_id ON offers(seller_id);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'initiated',

  -- Offer reference
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  original_listing_price DECIMAL(10,2),

  -- Charity donation
  donation_amount DECIMAL(10,2),
  donation_charity_id UUID,
  donation_option TEXT,

  -- Stripe
  stripe_payment_intent_id TEXT,

  -- Meetup
  meetup_location TEXT,
  meetup_time TIMESTAMPTZ,

  -- Inspection
  inspection_photo_url TEXT,
  inspection_checklist JSONB,

  -- Webhook tracking
  payment_captured_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  failure_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHARITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  website_url TEXT,
  logo_url TEXT,
  location_city TEXT,
  location_state TEXT,
  is_active BOOLEAN DEFAULT true,
  total_received DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_avatar_url TEXT,
  reference_id TEXT,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: Public read, self write
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings: Public read, owner write
CREATE POLICY "Listings are viewable by everyone" ON listings
  FOR SELECT USING (true);

CREATE POLICY "Users can create listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = user_id);

-- Conversations: Participants only
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid()::text = ANY(participant_ids));

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid()::text = ANY(participant_ids));

-- Messages: Participants only
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid()::text = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid()::text = ANY(conversations.participant_ids)
    )
  );

-- Reviews: Public read, author write
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Offers: Buyer/Seller access
CREATE POLICY "Users can view own offers" ON offers
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create offers" ON offers
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update offers" ON offers
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Transactions: Buyer/Seller access
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update transactions" ON transactions
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Reports: Reporter can create, admins can view all
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Charities: Public read
CREATE POLICY "Charities are viewable by everyone" ON charities
  FOR SELECT USING (true);

-- Notifications: User can only access own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Optional)
-- ============================================

-- Insert default charity
INSERT INTO charities (name, short_description, is_active)
VALUES ('Seattle Children''s Hospital', 'Supporting pediatric healthcare', true)
ON CONFLICT DO NOTHING;
