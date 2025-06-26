-- supabase_schema.sql
-- Database schema for the RFQ platform.

-- Reviews table stores ratings users give to vendors once a job is completed.
create table if not exists reviews (
    id uuid primary key default gen_random_uuid(),
    vendor_id text not null references vendors(id),
    user_id text references users(id),
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamp with time zone default now()
);

-- Chat logs table stores user requests and assistant replies
create table if not exists chat_logs (
    id uuid primary key default gen_random_uuid(),
    user_input text,
    assistant_reply text,
    image_url text,
    user_location jsonb,
    category text,
    status text not null default 'open',
    created_at timestamp with time zone default now()
);

-- Chat messages table stores individual messages in a chat session
create table if not exists chat_messages (
    id uuid primary key default gen_random_uuid(),
    chat_room_id uuid not null,
    sender text not null,
    message text,
    created_at timestamp with time zone default now()
);

-- User profile information for storing location
create table if not exists user_profiles (
    id uuid primary key references users(id),
    full_name text,
    city text,
    state text,
    country text,
    created_at timestamp with time zone default now()
);

-- Vendors table stores vendor profile and service area
create table if not exists vendors (
    id uuid primary key references users(id),
    email text not null,
    name text,
    category text,
    lat double precision,
    lon double precision,
    radius_km numeric,
    created_at timestamp with time zone default now()
);

-- Tickets table records submitted repair requests
create table if not exists tickets (
    id uuid primary key default gen_random_uuid(),
    assistant_reply text,
    severity text,
    category text,
    user_location jsonb,
    image_url text,
    user_email text,
    dispatched_vendor_id uuid references vendors(id),
    chat_room_id uuid,
    expires_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- Quotes from vendors for a specific chat log
create table if not exists quotes (
    id uuid primary key default gen_random_uuid(),
    log_id uuid references chat_logs(id),
    vendor_id uuid references vendors(id),
    vendor_email text,
    quote numeric,
    availability timestamp with time zone,
    status text,
    created_at timestamp with time zone default now()
);

-- Expo push notification tokens
create table if not exists expo_tokens (
    token text primary key,
    created_at timestamp with time zone default now()
);

-- Email alerts queued for vendors
create table if not exists email_alerts (
    id uuid primary key default gen_random_uuid(),
    vendor_id uuid references vendors(id),
    subject text,
    body text,
    created_at timestamp with time zone default now()
);

