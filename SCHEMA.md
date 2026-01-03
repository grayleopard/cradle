
# Cradle Database Schema

Run the following SQL in your Supabase SQL Editor to set up the backend.

## Quick Migration (if tables already exist)

```sql
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```

## Full Schema

```sql
-- 1. USERS
create table public.users (
  id text primary key,
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
  saved_listing_ids text[] default '{}',
  saved_searches jsonb default '[]',
  following_ids text[] default '{}',
  created_at timestamp with time zone default now()
);

-- 2. LISTINGS
create table public.listings (
  id text primary key,
  user_id text not null,
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
  is_smoke_free boolean default false,
  is_pet_free boolean default false,
  images text[] default '{}',
  location_zip text,
  is_safety_verified boolean default false,
  safety_check_result jsonb,
  is_sold boolean default false,
  is_promoted boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. CONVERSATIONS
create table public.conversations (
  id text primary key,
  listing_id text not null,
  participant_ids text[] not null,
  updated_at timestamp with time zone default now()
);

-- 4. MESSAGES
create table public.messages (
  id text primary key,
  conversation_id text not null,
  sender_id text not null,
  text text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- 5. REVIEWS
create table public.reviews (
  id text primary key,
  target_user_id text not null,
  author_id text not null,
  author_name text not null,
  rating int check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default now()
);

-- 6. TRANSACTIONS
create table public.transactions (
  id text primary key,
  listing_id text not null,
  buyer_id text not null,
  seller_id text not null,
  amount numeric not null,
  platform_fee numeric not null,
  total numeric not null,
  status text default 'initiated' not null,
  meetup_location text,
  meetup_time timestamp with time zone,
  inspection_photo_url text,
  inspection_checklist jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 7. REPORTS
create table public.reports (
  id text primary key,
  listing_id text not null,
  reporter_id text not null,
  reason text not null,
  status text default 'pending' not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.transactions enable row level security;
alter table public.reports enable row level security;

-- Simple policies (allow all for MVP)
create policy "Allow all" on public.users for all using (true) with check (true);
create policy "Allow all" on public.listings for all using (true) with check (true);
create policy "Allow all" on public.conversations for all using (true) with check (true);
create policy "Allow all" on public.messages for all using (true) with check (true);
create policy "Allow all" on public.reviews for all using (true) with check (true);
create policy "Allow all" on public.transactions for all using (true) with check (true);
create policy "Allow all" on public.reports for all using (true) with check (true);

-- Indexes
create index idx_listings_user_id on public.listings(user_id);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_conversations_listing_id on public.conversations(listing_id);
```

## Environment Variables

Add these to your `.env.local` or Vercel dashboard:

```
VITE_SUPABASE_URL=https://heykcjvqkkecpcrjowjy.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
