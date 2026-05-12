-- Emotion Lab MVP multi-user schema.
-- Safe to run more than once in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text,
  bio text,
  looking_for text,
  study_level text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mbti_code text not null,
  mbti_name text not null,
  big_five_scores jsonb not null,
  stress_score integer not null,
  balance_score integer not null,
  created_at timestamptz not null default now(),
  constraint test_results_mbti_code_length check (char_length(mbti_code) between 3 and 8),
  constraint test_results_stress_score_range check (stress_score between 0 and 100),
  constraint test_results_balance_score_range check (balance_score between 0 and 100),
  constraint test_results_big_five_object check (jsonb_typeof(big_five_scores) = 'object')
);

create table if not exists public.user_hobbies (
  user_id uuid not null references public.profiles(id) on delete cascade,
  hobby text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, hobby),
  constraint user_hobbies_hobby_not_blank check (btrim(hobby) <> '')
);

create table if not exists public.buddy_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buddy_requests_not_self check (sender_id <> receiver_id),
  constraint buddy_requests_status_check check (status in ('pending', 'accepted', 'rejected', 'cancelled'))
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_not_self check (sender_id <> receiver_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_body_not_blank check (btrim(body) <> '')
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists pseudo text,
  add column if not exists bio text,
  add column if not exists looking_for text,
  add column if not exists study_level text,
  add column if not exists is_visible boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.test_results
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists mbti_code text,
  add column if not exists mbti_name text,
  add column if not exists big_five_scores jsonb,
  add column if not exists stress_score integer,
  add column if not exists balance_score integer,
  add column if not exists created_at timestamptz not null default now();

alter table public.user_hobbies
  add column if not exists user_id uuid,
  add column if not exists hobby text,
  add column if not exists created_at timestamptz not null default now();

alter table public.buddy_requests
  add column if not exists sender_id uuid,
  add column if not exists receiver_id uuid,
  add column if not exists message text,
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.conversations
  add column if not exists sender_id uuid,
  add column if not exists receiver_id uuid,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.messages
  add column if not exists conversation_id uuid,
  add column if not exists sender_id uuid,
  add column if not exists body text,
  add column if not exists read_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists buddy_requests_set_updated_at on public.buddy_requests;
create trigger buddy_requests_set_updated_at
before update on public.buddy_requests
for each row execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create unique index if not exists profiles_pseudo_unique_idx
  on public.profiles (lower(pseudo))
  where pseudo is not null and btrim(pseudo) <> '';

create index if not exists profiles_visible_idx on public.profiles (is_visible, study_level);
create index if not exists test_results_user_created_idx on public.test_results (user_id, created_at desc);
create index if not exists user_hobbies_hobby_idx on public.user_hobbies (hobby);
create index if not exists buddy_requests_sender_idx on public.buddy_requests (sender_id, status, created_at desc);
create index if not exists buddy_requests_receiver_idx on public.buddy_requests (receiver_id, status, created_at desc);
create unique index if not exists buddy_requests_active_pair_unique_idx
  on public.buddy_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
  where status in ('pending', 'accepted');
create index if not exists conversations_sender_idx on public.conversations (sender_id);
create index if not exists conversations_receiver_idx on public.conversations (receiver_id);
create unique index if not exists conversations_pair_unique_idx
  on public.conversations (least(sender_id, receiver_id), greatest(sender_id, receiver_id));
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists resources_published_category_idx on public.resources (is_published, category);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'test_results_user_id_fkey') then
    alter table public.test_results
      add constraint test_results_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_hobbies_user_id_fkey') then
    alter table public.user_hobbies
      add constraint user_hobbies_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'buddy_requests_sender_id_fkey') then
    alter table public.buddy_requests
      add constraint buddy_requests_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'buddy_requests_receiver_id_fkey') then
    alter table public.buddy_requests
      add constraint buddy_requests_receiver_id_fkey foreign key (receiver_id) references public.profiles(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'conversations_sender_id_fkey') then
    alter table public.conversations
      add constraint conversations_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'conversations_receiver_id_fkey') then
    alter table public.conversations
      add constraint conversations_receiver_id_fkey foreign key (receiver_id) references public.profiles(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'messages_conversation_id_fkey') then
    alter table public.messages
      add constraint messages_conversation_id_fkey foreign key (conversation_id) references public.conversations(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'messages_sender_id_fkey') then
    alter table public.messages
      add constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete cascade not valid;
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo, study_level)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data->>'pseudo'), ''),
    nullif(btrim(new.raw_user_meta_data->>'study_level'), '')
  )
  on conflict (id) do update
  set
    pseudo = coalesce(public.profiles.pseudo, excluded.pseudo),
    study_level = coalesce(public.profiles.study_level, excluded.study_level),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.ensure_conversation_for_accepted_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    insert into public.conversations (sender_id, receiver_id)
    values (new.sender_id, new.receiver_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists buddy_requests_create_conversation on public.buddy_requests;
create trigger buddy_requests_create_conversation
after update of status on public.buddy_requests
for each row execute function public.ensure_conversation_for_accepted_request();

alter table public.profiles enable row level security;
alter table public.test_results enable row level security;
alter table public.user_hobbies enable row level security;
alter table public.buddy_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.resources enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.test_results,
  public.user_hobbies,
  public.buddy_requests,
  public.conversations,
  public.messages
to authenticated;
grant select on public.resources to authenticated;

drop policy if exists profiles_select_own_or_visible on public.profiles;
create policy profiles_select_own_or_visible on public.profiles
for select to authenticated
using (id = auth.uid() or is_visible = true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
for delete to authenticated
using (id = auth.uid());

drop policy if exists test_results_select_own_or_visible_profile on public.test_results;
create policy test_results_select_own_or_visible_profile on public.test_results
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles
    where profiles.id = test_results.user_id and profiles.is_visible = true
  )
);

drop policy if exists test_results_insert_own on public.test_results;
create policy test_results_insert_own on public.test_results
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists test_results_update_own on public.test_results;
create policy test_results_update_own on public.test_results
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists test_results_delete_own on public.test_results;
create policy test_results_delete_own on public.test_results
for delete to authenticated
using (user_id = auth.uid());

drop policy if exists user_hobbies_select_own_or_visible_profile on public.user_hobbies;
create policy user_hobbies_select_own_or_visible_profile on public.user_hobbies
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles
    where profiles.id = user_hobbies.user_id and profiles.is_visible = true
  )
);

drop policy if exists user_hobbies_insert_own on public.user_hobbies;
create policy user_hobbies_insert_own on public.user_hobbies
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists user_hobbies_update_own on public.user_hobbies;
create policy user_hobbies_update_own on public.user_hobbies
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists user_hobbies_delete_own on public.user_hobbies;
create policy user_hobbies_delete_own on public.user_hobbies
for delete to authenticated
using (user_id = auth.uid());

drop policy if exists buddy_requests_select_participant on public.buddy_requests;
create policy buddy_requests_select_participant on public.buddy_requests
for select to authenticated
using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists buddy_requests_insert_sender_to_visible_receiver on public.buddy_requests;
create policy buddy_requests_insert_sender_to_visible_receiver on public.buddy_requests
for insert to authenticated
with check (
  sender_id = auth.uid()
  and receiver_id <> auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.profiles
    where profiles.id = buddy_requests.receiver_id and profiles.is_visible = true
  )
);

drop policy if exists buddy_requests_update_pending_participant on public.buddy_requests;
create policy buddy_requests_update_pending_participant on public.buddy_requests
for update to authenticated
using ((receiver_id = auth.uid() or sender_id = auth.uid()) and status = 'pending')
with check (
  (receiver_id = auth.uid() and status in ('accepted', 'rejected'))
  or (sender_id = auth.uid() and status = 'cancelled')
);

drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant on public.conversations
for select to authenticated
using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists conversations_insert_after_accepted_request on public.conversations;
create policy conversations_insert_after_accepted_request on public.conversations
for insert to authenticated
with check (
  (sender_id = auth.uid() or receiver_id = auth.uid())
  and exists (
    select 1 from public.buddy_requests
    where buddy_requests.status = 'accepted'
      and least(buddy_requests.sender_id, buddy_requests.receiver_id) = least(conversations.sender_id, conversations.receiver_id)
      and greatest(buddy_requests.sender_id, buddy_requests.receiver_id) = greatest(conversations.sender_id, conversations.receiver_id)
  )
);

drop policy if exists messages_select_conversation_participant on public.messages;
create policy messages_select_conversation_participant on public.messages
for select to authenticated
using (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and (conversations.sender_id = auth.uid() or conversations.receiver_id = auth.uid())
  )
);

drop policy if exists messages_insert_sender_participant on public.messages;
create policy messages_insert_sender_participant on public.messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and (conversations.sender_id = auth.uid() or conversations.receiver_id = auth.uid())
  )
);

drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages
for update to authenticated
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

drop policy if exists messages_delete_own on public.messages;
create policy messages_delete_own on public.messages
for delete to authenticated
using (sender_id = auth.uid());

drop policy if exists resources_select_published on public.resources;
create policy resources_select_published on public.resources
for select to authenticated
using (is_published = true);
