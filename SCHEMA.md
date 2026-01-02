
# Cradle Database Schema

Run the following SQL in your Supabase SQL Editor to set up the backend.

> **Note:** If you have already run previous versions of this schema, please run the DROP commands first to reset the tables.

```sql
-- Reset (Optional: Only run if you need to clear existing incompatible tables)
-- DROP TABLE IF EXISTS public.transactions;
-- DROP TABLE IF EXISTS public.reviews;
-- DROP TABLE IF EXISTS public.reports;
-- DROP TABLE IF EXISTS public.messages;
-- DROP TABLE IF EXISTS public.conversations;
-- DROP TABLE IF EXISTS public.listings;
-- DROP TABLE IF EXISTS public.users;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
create table if not exists public.users (
  id uuid not null primary key,
  phone_number text unique,
  email text,
  username text,
  bio text,
  location_zip text,
  is_verified_parent boolean default false,
  is_premium boolean default false,
  is_admin boolean default false,
  items_sold int default 0,
  avatar_url text,
  saved_listing_ids uuid[] default '{}',
  saved_searches jsonb default '[]',
  following_ids uuid[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

create policy "Public profiles are viewable by everyone" on public.users
  for select using (true);

create policy "Users can insert their own profile" on public.users
  for insert with check (true);

create policy "Users can update own profile" on public.users
  for update using (true);

-- ============================================
-- 2. LISTINGS TABLE
-- ============================================
create table if not exists public.listings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  title text not null,
  description text not null,
  price numeric not null,
  original_price numeric,
  deal_analysis jsonb,
  condition text,
  category text,
  age_range text,
  brand text,
  model text,
  manufacture_date text,
  expiration_date text,
  is_smoke_free boolean default false,
  is_pet_free boolean default false,
  images text[] default '{}',
  location_zip text,
  is_safety_verified boolean default false,
  safety_check_result jsonb,
  is_sold boolean default false,
  is_promoted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.listings enable row level security;

create policy "Listings are viewable by everyone" on public.listings
  for select using (true);

create policy "Users can insert own listings" on public.listings
  for insert with check (true);

create policy "Users can update own listings" on public.listings
  for update using (true);

create policy "Users can delete own listings" on public.listings
  for delete using (true);

-- ============================================
-- 3. CONVERSATIONS TABLE
-- ============================================
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  participant_ids uuid[] not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.conversations enable row level security;

create policy "Users can view their conversations" on public.conversations
  for select using (true);

create policy "Users can create conversations" on public.conversations
  for insert with check (true);

create policy "Users can update their conversations" on public.conversations
  for update using (true);

-- ============================================
-- 4. MESSAGES TABLE
-- ============================================
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.users(id) not null,
  text text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Users can view messages" on public.messages
  for select using (true);

create policy "Users can insert messages" on public.messages
  for insert with check (true);

create policy "Users can update messages" on public.messages
  for update using (true);

-- ============================================
-- 5. REVIEWS TABLE
-- ============================================
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  target_user_id uuid references public.users(id) not null,
  author_id uuid references public.users(id) not null,
  author_name text not null,
  rating int check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone" on public.reviews
  for select using (true);

create policy "Users can insert reviews" on public.reviews
  for insert with check (true);

-- ============================================
-- 6. TRANSACTIONS TABLE
-- ============================================
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) not null,
  buyer_id uuid references public.users(id) not null,
  seller_id uuid references public.users(id) not null,
  amount numeric not null,
  platform_fee numeric not null,
  total numeric not null,
  status text default 'initiated' not null,
  meetup_location text,
  meetup_time timestamp with time zone,
  inspection_photo_url text,
  inspection_checklist jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "Users can view their transactions" on public.transactions
  for select using (true);

create policy "Users can create transactions" on public.transactions
  for insert with check (true);

create policy "Users can update their transactions" on public.transactions
  for update using (true);

-- ============================================
-- 7. REPORTS TABLE
-- ============================================
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  reporter_id uuid references public.users(id) not null,
  reason text not null,
  status text default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reports enable row level security;

create policy "Users can view their reports" on public.reports
  for select using (true);

create policy "Users can create reports" on public.reports
  for insert with check (true);

create policy "Admins can update reports" on public.reports
  for update using (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
create index if not exists idx_listings_user_id on public.listings(user_id);
create index if not exists idx_listings_category on public.listings(category);
create index if not exists idx_listings_created_at on public.listings(created_at desc);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_conversations_listing_id on public.conversations(listing_id);
create index if not exists idx_reviews_target_user_id on public.reviews(target_user_id);
create index if not exists idx_transactions_listing_id on public.transactions(listing_id);
create index if not exists idx_transactions_buyer_id on public.transactions(buyer_id);
create index if not exists idx_transactions_seller_id on public.transactions(seller_id);
```

## Quick Start

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Paste the above SQL and run it
4. Your database is ready!

## Environment Variables

Add these to your `.env.local` or Vercel dashboard:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
