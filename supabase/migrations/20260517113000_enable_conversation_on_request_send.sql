-- Enable conversation creation at buddy request send time.
-- Canonical conversation participants: user_1_id/user_2_id.

update public.conversations
set
  user_1_id = coalesce(user_1_id, sender_id),
  user_2_id = coalesce(user_2_id, receiver_id)
where user_1_id is null
   or user_2_id is null;

create unique index if not exists conversations_user_pair_unique_idx
  on public.conversations (least(user_1_id, user_2_id), greatest(user_1_id, user_2_id));

drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant on public.conversations
for select to authenticated
using (user_1_id = auth.uid() or user_2_id = auth.uid());

drop policy if exists conversations_insert_after_accepted_request on public.conversations;
create policy conversations_insert_when_pair_has_request on public.conversations
for insert to authenticated
with check (
  (user_1_id = auth.uid() or user_2_id = auth.uid())
  and user_1_id is not null
  and user_2_id is not null
  and user_1_id <> user_2_id
  and exists (
    select 1
    from public.buddy_requests
    where status in ('pending', 'accepted')
      and least(sender_id, receiver_id) = least(conversations.user_1_id, conversations.user_2_id)
      and greatest(sender_id, receiver_id) = greatest(conversations.user_1_id, conversations.user_2_id)
  )
);

drop policy if exists messages_select_conversation_participant on public.messages;
create policy messages_select_conversation_participant on public.messages
for select to authenticated
using (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and (conversations.user_1_id = auth.uid() or conversations.user_2_id = auth.uid())
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
      and (conversations.user_1_id = auth.uid() or conversations.user_2_id = auth.uid())
  )
);
