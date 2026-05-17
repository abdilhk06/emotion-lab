-- Allow conversation participants to mark only received unread messages as read.
-- Existing sender update policy remains unchanged.

drop policy if exists messages_update_received_read_at on public.messages;
create policy messages_update_received_read_at on public.messages
for update to authenticated
using (
  sender_id <> auth.uid()
  and read_at is null
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and (
        conversations.user_1_id = auth.uid()
        or conversations.user_2_id = auth.uid()
        or conversations.sender_id = auth.uid()
        or conversations.receiver_id = auth.uid()
      )
  )
)
with check (
  sender_id <> auth.uid()
  and read_at is not null
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and (
        conversations.user_1_id = auth.uid()
        or conversations.user_2_id = auth.uid()
        or conversations.sender_id = auth.uid()
        or conversations.receiver_id = auth.uid()
      )
  )
);
