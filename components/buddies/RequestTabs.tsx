"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BuddyRequestItem, RequestCard, RequestStatus } from "@/components/buddies/RequestCard";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  pseudo: string | null;
  study_level: string | null;
};

type BuddyRequestRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  status: RequestStatus;
  created_at: string;
  sender_profile: ProfileRow | null;
  receiver_profile: ProfileRow | null;
};

type ViewTab = "received" | "sent";
type ActionState = {
  requestId: string | null;
  action: "accept" | "reject" | null;
};

type RequestsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; received: BuddyRequestItem[]; sent: BuddyRequestItem[] };

const STATUS_ORDER: RequestStatus[] = ["pending", "accepted", "rejected"];

function normalizeRequest(row: BuddyRequestRow, mode: ViewTab): BuddyRequestItem {
  const sourceProfile = mode === "received" ? row.sender_profile : row.receiver_profile;
  const pseudoRaw = sourceProfile?.pseudo?.trim();
  const pseudo = pseudoRaw ? (pseudoRaw.startsWith("@") ? pseudoRaw : `@${pseudoRaw}`) : "@buddy";

  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    profile: {
      pseudo,
      studyLevel: sourceProfile?.study_level?.trim() || "Niveau non precise",
    },
  };
}

function conversationPairFilter(userA: string, userB: string): string {
  return `and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`;
}

export function RequestTabs() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ViewTab>("received");
  const [state, setState] = useState<RequestsState>({ status: "loading" });
  const [actionState, setActionState] = useState<ActionState>({ requestId: null, action: null });
  const [successByRequestId, setSuccessByRequestId] = useState<Record<string, string>>({});

  useEffect(() => {
    const run = async () => {
      setState({ status: "loading" });
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const selection =
          "id, sender_id, receiver_id, message, status, created_at, sender_profile:profiles!buddy_requests_sender_id_fkey(id, pseudo, study_level), receiver_profile:profiles!buddy_requests_receiver_id_fkey(id, pseudo, study_level)";

        const [receivedRes, sentRes] = await Promise.all([
          supabase
            .from("buddy_requests")
            .select(selection)
            .eq("receiver_id", user.id)
            .in("status", STATUS_ORDER)
            .order("created_at", { ascending: false })
            .returns<BuddyRequestRow[]>(),
          supabase
            .from("buddy_requests")
            .select(selection)
            .eq("sender_id", user.id)
            .in("status", STATUS_ORDER)
            .order("created_at", { ascending: false })
            .returns<BuddyRequestRow[]>(),
        ]);

        const firstError = receivedRes.error ?? sentRes.error;
        if (firstError) {
          setState({ status: "error", message: firstError.message });
          return;
        }

        setState({
          status: "ready",
          received: (receivedRes.data ?? []).map((row) => normalizeRequest(row, "received")),
          sent: (sentRes.data ?? []).map((row) => normalizeRequest(row, "sent")),
        });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Impossible de charger tes demandes pour le moment.",
        });
      }
    };

    void run();
  }, [router]);

  const grouped = useMemo(() => {
    if (state.status !== "ready") return null;
    const source = activeTab === "received" ? state.received : state.sent;
    return STATUS_ORDER.map((status) => ({
      status,
      items: source.filter((item) => item.status === status),
    }));
  }, [activeTab, state]);

  const counts = useMemo(() => {
    if (state.status !== "ready") return { received: 0, sent: 0 };
    return { received: state.received.length, sent: state.sent.length };
  }, [state]);

  const setRequestStatusLocally = (requestId: string, status: RequestStatus) => {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        status: "ready",
        received: prev.received.map((item) => (item.id === requestId ? { ...item, status } : item)),
        sent: prev.sent.map((item) => (item.id === requestId ? { ...item, status } : item)),
      };
    });
  };

  const handleReject = async (requestId: string) => {
    if (state.status !== "ready") return;
    const request = state.received.find((item) => item.id === requestId);
    if (!request || request.status !== "pending") return;

    setActionState({ requestId, action: "reject" });
    setRequestStatusLocally(requestId, "rejected");
    setSuccessByRequestId((prev) => ({ ...prev, [requestId]: "" }));

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("buddy_requests").update({ status: "rejected" }).eq("id", requestId).eq("status", "pending");

      if (error) throw error;
      setSuccessByRequestId((prev) => ({ ...prev, [requestId]: "Demande refusee." }));
    } catch (error) {
      setRequestStatusLocally(requestId, "pending");
      setSuccessByRequestId((prev) => ({ ...prev, [requestId]: "" }));
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Le refus a echoue. Reessaie dans quelques instants.",
      });
    } finally {
      setActionState({ requestId: null, action: null });
    }
  };

  const handleAccept = async (requestId: string) => {
    if (state.status !== "ready") return;
    const request = state.received.find((item) => item.id === requestId);
    if (!request || request.status !== "pending") return;

    setActionState({ requestId, action: "accept" });
    setRequestStatusLocally(requestId, "accepted");
    setSuccessByRequestId((prev) => ({ ...prev, [requestId]: "" }));

    try {
      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase
        .from("buddy_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)
        .eq("status", "pending");

      if (updateError) throw updateError;

      const pairFilter = conversationPairFilter(request.senderId, request.receiverId);
      const existingRes = await supabase
        .from("conversations")
        .select("id")
        .or(pairFilter)
        .limit(1)
        .returns<Array<{ id: string }>>();

      if (existingRes.error) throw existingRes.error;
      if ((existingRes.data ?? []).length === 0) {
        const insertRes = await supabase.from("conversations").insert({
          sender_id: request.senderId,
          receiver_id: request.receiverId,
          user_1_id: request.senderId,
          user_2_id: request.receiverId,
        });
        if (insertRes.error) throw insertRes.error;
      }

      setSuccessByRequestId((prev) => ({ ...prev, [requestId]: "Demande acceptee. Conversation creee." }));
    } catch (error) {
      setRequestStatusLocally(requestId, "pending");
      setSuccessByRequestId((prev) => ({ ...prev, [requestId]: "" }));
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "L'acceptation a echoue. Reessaie dans quelques instants.",
      });
    } finally {
      setActionState({ requestId: null, action: null });
    }
  };

  const statusTitle = (status: RequestStatus) => {
    if (status === "pending") return "En attente";
    if (status === "accepted") return "Acceptees";
    return "Refusees";
  };

  return (
    <div className="requests-page">
      <div className="requests-title">
        <h1>Mes demandes</h1>
        <p>Gère tes invitations reçues et envoyées.</p>
      </div>

      <div className="tab-bar" role="tablist" aria-label="Demandes buddies">
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "received" ? "active" : ""}`}
          aria-selected={activeTab === "received"}
          onClick={() => setActiveTab("received")}
        >
          Reçues <span className="tab-badge">{counts.received}</span>
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "sent" ? "active" : ""}`}
          aria-selected={activeTab === "sent"}
          onClick={() => setActiveTab("sent")}
        >
          Envoyées ({counts.sent})
        </button>
      </div>

      {state.status === "loading" ? (
        <section className="requests-state-card" role="status" aria-live="polite">
          <h2>Chargement des demandes...</h2>
          <p>On recupere tes invitations buddies.</p>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="requests-state-card requests-state-error" role="alert">
          <h2>Impossible de charger tes demandes</h2>
          <p>{state.message}</p>
        </section>
      ) : null}

      {state.status === "ready" && grouped ? (
        <div className="requests-groups">
          {grouped.every((group) => group.items.length === 0) ? (
            <section className="requests-state-card" role="status">
              <h2>{activeTab === "received" ? "Aucune demande recue" : "Aucune demande envoyee"}</h2>
              <p>
                {activeTab === "received"
                  ? "Quand un buddy t'envoie une invitation, elle apparaitra ici."
                  : "Tu n'as pas encore envoye de demande. Va dans l'annuaire pour trouver un binome."}
              </p>
            </section>
          ) : (
            grouped.map((group) => (
              <section key={group.status} className="requests-group">
                <h3>
                  {statusTitle(group.status)} <span>({group.items.length})</span>
                </h3>
                {group.items.length === 0 ? (
                  <p className="requests-group-empty">Aucune demande dans cette section.</p>
                ) : (
                  <div className="requests-list">
                    {group.items.map((item) => (
                      <RequestCard
                        key={item.id}
                        item={item}
                        mode={activeTab}
                        busyAction={actionState.requestId === item.id ? actionState.action : null}
                        disabled={actionState.requestId !== null && actionState.requestId !== item.id}
                        successMessage={successByRequestId[item.id] ?? null}
                        onAccept={handleAccept}
                        onReject={handleReject}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      ) : null}

      <style jsx>{`
        .requests-page {
          display: grid;
          gap: 14px;
        }
        .requests-title h1 {
          margin: 0 0 6px;
          color: #7e3d5e;
          font-size: 32px;
        }
        .requests-title p {
          margin: 0;
          color: var(--texte-gris);
        }
        .tab-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 6px;
        }
        .tab {
          padding: 10px 18px;
          border-radius: 10px;
          cursor: pointer;
          border: 1px solid transparent;
          background: transparent;
          font-weight: 600;
          color: #66738e;
          white-space: nowrap;
        }
        .tab.active {
          background: #fff;
          border-color: #e4dcea;
          color: #07123a;
        }
        .tab-badge {
          background: #f5dde9;
          color: #8a3b65;
          border-radius: 999px;
          padding: 1px 7px;
          font-size: 12px;
          margin-left: 6px;
        }
        .requests-state-card {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 18px;
        }
        .requests-state-card h2 {
          margin: 0 0 8px;
        }
        .requests-state-card p {
          margin: 0;
          color: var(--texte-gris);
        }
        .requests-state-error {
          border-color: #f3c7ce;
          background: #fff8f9;
        }
        .requests-groups {
          display: grid;
          gap: 14px;
        }
        .requests-group {
          display: grid;
          gap: 10px;
        }
        .requests-group h3 {
          margin: 0;
          font-size: 18px;
        }
        .requests-group h3 span {
          color: var(--texte-clair);
          font-size: 14px;
          font-weight: 500;
        }
        .requests-group-empty {
          margin: 0;
          color: var(--texte-clair);
          font-size: 14px;
        }
        .requests-list {
          display: grid;
          gap: 12px;
        }
        @media (max-width: 899px) {
          .tab-bar {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }
        :global(.request-actions) {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        :global(.request-actions .btn-primary) {
          flex: 1;
          background: #8a3b65;
          color: #fff;
          border: 0;
          border-radius: 10px;
          padding: 12px;
          font-weight: 700;
        }
        :global(.request-actions .btn-outline) {
          flex: 1;
          background: #fff;
          color: #8a3b65;
          border: 1px solid #8a3b65;
          border-radius: 10px;
          padding: 12px;
          font-weight: 700;
        }
        :global(.request-actions .btn-ghost) {
          background: transparent;
          color: #66738e;
          border: 0;
          padding: 12px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
