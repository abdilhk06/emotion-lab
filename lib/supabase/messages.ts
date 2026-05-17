"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

type ConversationIdRow = { id: string };
type UnreadMessageRow = { conversation_id: string };

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

export async function fetchUserConversationIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const res = await supabase
    .from("conversations")
    .select("id")
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId},sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .returns<ConversationIdRow[]>();

  if (res.error) {
    throw new Error(res.error.message);
  }

  return uniqueIds((res.data ?? []).map((row) => row.id).filter(Boolean));
}

async function fetchUnreadRows(
  supabase: SupabaseClient,
  userId: string,
  conversationIds: string[]
): Promise<UnreadMessageRow[]> {
  if (conversationIds.length === 0) return [];

  const res = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .is("read_at", null)
    .returns<UnreadMessageRow[]>();

  if (res.error) {
    throw new Error(res.error.message);
  }

  return res.data ?? [];
}

export async function fetchUnreadMessageCount(
  supabase: SupabaseClient,
  userId: string,
  conversationIds?: string[]
): Promise<number> {
  const ids = conversationIds ?? (await fetchUserConversationIds(supabase, userId));
  const rows = await fetchUnreadRows(supabase, userId, ids);
  return rows.length;
}

export async function fetchUnreadMessageCountsByConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationIds: string[]
): Promise<{ byConversation: Map<string, number>; total: number }> {
  const rows = await fetchUnreadRows(supabase, userId, conversationIds);
  const byConversation = new Map<string, number>();

  for (const row of rows) {
    byConversation.set(row.conversation_id, (byConversation.get(row.conversation_id) ?? 0) + 1);
  }

  return { byConversation, total: rows.length };
}

export async function markConversationMessagesAsRead(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<number> {
  const res = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .select("id")
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);

  if (res.error) {
    throw new Error(res.error.message);
  }

  return (res.data ?? []).length;
}
