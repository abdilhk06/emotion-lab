import type { SupabaseClient } from "@supabase/supabase-js";

type ConversationRow = {
  id: string;
  user_1_id: string | null;
  user_2_id: string | null;
};

function pairOrFilter(userA: string, userB: string): string {
  return `and(user_1_id.eq.${userA},user_2_id.eq.${userB}),and(user_1_id.eq.${userB},user_2_id.eq.${userA})`;
}

export async function findConversationBetweenUsers(
  supabase: SupabaseClient,
  userA: string,
  userB: string
): Promise<ConversationRow | null> {
  const query = await supabase
    .from("conversations")
    .select("id, user_1_id, user_2_id")
    .or(pairOrFilter(userA, userB))
    .limit(1)
    .returns<ConversationRow[]>();

  if (query.error) throw query.error;
  return query.data?.[0] ?? null;
}

export async function findOrCreateConversationBetweenUsers(
  supabase: SupabaseClient,
  userA: string,
  userB: string
): Promise<string> {
  const existing = await findConversationBetweenUsers(supabase, userA, userB);
  if (existing?.id) return existing.id;

  const insert = await supabase
    .from("conversations")
    .insert({
      user_1_id: userA,
      user_2_id: userB,
      sender_id: userA,
      receiver_id: userB,
    })
    .select("id")
    .single<{ id: string }>();

  if (!insert.error && insert.data?.id) return insert.data.id;

  const duplicate = await findConversationBetweenUsers(supabase, userA, userB);
  if (duplicate?.id) return duplicate.id;

  throw new Error(insert.error?.message || "Impossible de creer la conversation.");
}
