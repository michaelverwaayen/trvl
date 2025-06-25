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
