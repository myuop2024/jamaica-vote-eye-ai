create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text,
  receiver_id uuid references auth.users(id) on delete cascade,
  receiver_name text,
  content text not null,
  type text not null default 'text',
  file_url text,
  file_name text,
  created_at timestamptz not null default now(),
  deleted boolean not null default false,
  edited boolean not null default false,
  -- Supabase Realtime requires this column for broadcasts to work
  -- when RLS is enabled and policies use it.
  user_id uuid references auth.users(id) default auth.uid()
);

-- Indexes for performance
create index chat_messages_room_idx on public.chat_messages (room, created_at desc);
create index chat_messages_sender_id_idx on public.chat_messages (sender_id);
create index chat_messages_receiver_id_idx on public.chat_messages (receiver_id);

-- Enable Row Level Security
alter table public.chat_messages enable row level security;

-- Policies
create policy "Users can view messages in their rooms"
  on public.chat_messages for select
  using ( auth.role() = 'authenticated' );

create policy "Users can insert their own messages"
  on public.chat_messages for insert
  with check ( auth.uid() = sender_id );

create policy "Users can update their own messages"
  on public.chat_messages for update
  using ( auth.uid() = sender_id );

-- Grant Supabase services access. This is important for Realtime.
grant select on public.chat_messages to supabase_realtime;
grant all on public.chat_messages to service_role; 