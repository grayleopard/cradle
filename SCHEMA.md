
# Cradle Database Schema

Run the following SQL in your Supabase SQL Editor to set up the backend.

> **Note:** If you have already run previous versions of this schema, please run the DROP commands first to reset the tables.

```sql
-- Reset (Optional: Only run if you need to clear existing incompatible tables)
-- DROP TABLE IF EXISTS public.messages;
-- DROP TABLE IF EXISTS public.listings;
-- DROP TABLE IF EXISTS public.users;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table public.users (
  id uuid not null primary key, -- Removed strict reference to auth.users for flexible MVP auth
  phone_number text unique,
  email text,
  username text,
  bio text,
  location_zip text,
  is_verified_parent boolean default false,
  items_sold int default 0,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" on public.users
  for select using (true);

create policy "Users can insert their own profile" on public.users
  for insert with check (true); -- Allow frontend generated IDs for MVP

create policy "Users can update own profile" on public.users
  for update using (true);

-- 2. LISTINGS TABLE
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  title text not null,
  description text not null,
  price numeric not null,
  original_price numeric,
  deal_analysis jsonb, -- New Field for AI Pricing Data
  condition text,
  category text,
  age_range text,
  is_smoke_free boolean default false,
  is_pet_free boolean default false,
  images text[] default '{}',
  location_zip text,
  is_safety_verified boolean default false,
  is_sold boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.listings enable row level security;

-- Policies
create policy "Listings are viewable by everyone" on public.listings
  for select using (true);

create policy "Users can insert own listings" on public.listings
  for insert with check (true);

create policy "Users can update own listings" on public.listings
  for update using (true);

-- 3. MESSAGES TABLE
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id text not null, 
  sender_id uuid references public.users(id) not null,
  recipient_id uuid references public.users(id) not null,
  text text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies
create policy "Users can view their own messages" on public.messages
  for select using (true);

create policy "Users can insert messages" on public.messages
  for insert with check (true);
```
