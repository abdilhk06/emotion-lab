-- Normalize conversation participant columns without dropping legacy compatibility fields.
-- sender_id / receiver_id remain canonical for app queries and RLS.

alter table public.conversations
  add column if not exists user_1_id uuid,
  add column if not exists user_2_id uuid;

update public.conversations
set
  user_1_id = coalesce(user_1_id, sender_id),
  user_2_id = coalesce(user_2_id, receiver_id)
where user_1_id is null
   or user_2_id is null;

create or replace function public.ensure_conversation_for_accepted_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    insert into public.conversations (sender_id, receiver_id, user_1_id, user_2_id)
    values (new.sender_id, new.receiver_id, new.sender_id, new.receiver_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;
