-- Run this in: Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/yzklwfpaukiedfrifaya/sql/new

-- ── Support tickets ───────────────────────────────────────────────────────────
create table if not exists public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.profiles(id) not null,
  subject text not null,
  description text not null,
  category text not null check (category in ('payment','technical','account','billing','other')),
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  status text default 'open' check (status in ('open','in_progress','waiting_creator','resolved','closed')),
  first_response_at timestamptz,
  resolved_at timestamptz,
  sla_deadline timestamptz not null,
  sla_breached boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.support_tickets enable row level security;

drop policy if exists "tickets_creator_own" on public.support_tickets;
create policy "tickets_creator_own" on public.support_tickets
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- ── Ticket messages ───────────────────────────────────────────────────────────
create table if not exists public.ticket_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references public.support_tickets(id) on delete cascade,
  sender_type text check (sender_type in ('creator','agent')),
  sender_name text not null,
  message text not null,
  created_at timestamptz default now()
);
alter table public.ticket_messages enable row level security;

drop policy if exists "messages_ticket_creator" on public.ticket_messages;
drop policy if exists "messages_creator_insert" on public.ticket_messages;

create policy "messages_ticket_creator" on public.ticket_messages
  for select using (
    exists (
      select 1 from public.support_tickets st
      where st.id = ticket_id and st.creator_id = auth.uid()
    )
  );

create policy "messages_creator_insert" on public.ticket_messages
  for insert with check (
    exists (
      select 1 from public.support_tickets st
      where st.id = ticket_id and st.creator_id = auth.uid()
    )
    and sender_type = 'creator'
  );

-- ── Enable Realtime ────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='ticket_messages') then
    alter publication supabase_realtime add table public.ticket_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
