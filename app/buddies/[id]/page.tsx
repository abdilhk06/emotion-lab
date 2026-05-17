"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { BioCard } from "@/components/buddies/BioCard";
import { BuddyCTA } from "@/components/buddies/BuddyCTA";
import { BuddyHero } from "@/components/buddies/BuddyHero";
import { PersonalitySummary } from "@/components/buddies/PersonalitySummary";
import { SharedHobbies } from "@/components/buddies/SharedHobbies";
import { computeBuddyCompatibilityScore } from "@/lib/compatibility";
import { findConversationBetweenUsers, findOrCreateConversationBetweenUsers } from "@/lib/supabase/conversations";
import { getSupabaseClient } from "@/lib/supabase/client";

type BuddyPageProps = {
  params: Promise<{ id: string }>;
};

type ProfileRow = {
  id: string;
  pseudo: string | null;
  bio: string | null;
  looking_for: string | null;
  study_level: string | null;
  is_visible: boolean | null;
  avatar_path: string | null;
};

type ResultRow = {
  user_id: string;
  mbti_code: string | null;
  mbti_name: string | null;
  created_at: string;
};

type HobbyRow = {
  user_id: string;
  hobby: string;
};

type BuddyRequestRow = {
  id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
};

type ReadyState = {
  meId: string;
  buddyId: string;
  isSelf: boolean;
  pseudo: string;
  bio: string | null;
  lookingFor: string | null;
  studyLevel: string;
  mbtiCode: string | null;
  mbtiName: string | null;
  buddyHobbies: string[];
  sharedHobbies: string[];
  compatibility: number;
  existingRequestStatus: "pending" | "accepted" | null;
  conversationId: string | null;
  avatarPath: string | null;
};

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not-found" }
  | { status: "ready"; data: ReadyState };

export default function BuddyDetailPage({ params }: BuddyPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: "loading" });

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

        const [buddyProfileRes, myProfileRes, resultsRes, hobbiesRes, buddyRequestRes, conversationRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, pseudo, bio, looking_for, study_level, is_visible, avatar_path")
            .eq("id", id)
            .maybeSingle<ProfileRow>(),
          supabase
            .from("profiles")
            .select("id, study_level")
            .eq("id", user.id)
            .maybeSingle<{ id: string; study_level: string | null }>(),
          supabase
            .from("test_results")
            .select("user_id, mbti_code, mbti_name, created_at")
            .in("user_id", [user.id, id])
            .order("created_at", { ascending: false })
            .returns<ResultRow[]>(),
          supabase.from("user_hobbies").select("user_id, hobby").in("user_id", [user.id, id]).returns<HobbyRow[]>(),
          supabase
            .from("buddy_requests")
            .select("id, status")
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
            .in("status", ["pending", "accepted"])
            .limit(1)
            .returns<BuddyRequestRow[]>(),
          findConversationBetweenUsers(supabase, user.id, id),
        ]);

        const firstError =
          buddyProfileRes.error ?? myProfileRes.error ?? resultsRes.error ?? hobbiesRes.error ?? buddyRequestRes.error;
        if (firstError) {
          setState({ status: "error", message: firstError.message });
          return;
        }

        const buddyProfile = buddyProfileRes.data;
        if (!buddyProfile || buddyProfile.is_visible === false) {
          setState({ status: "not-found" });
          return;
        }

        const latestResultByUser = new Map<string, { mbtiCode: string | null; mbtiName: string | null }>();
        for (const row of resultsRes.data ?? []) {
          if (!latestResultByUser.has(row.user_id)) {
            latestResultByUser.set(row.user_id, { mbtiCode: row.mbti_code, mbtiName: row.mbti_name });
          }
        }

        const hobbiesByUser = new Map<string, Set<string>>();
        for (const row of hobbiesRes.data ?? []) {
          const set = hobbiesByUser.get(row.user_id) ?? new Set<string>();
          set.add(row.hobby);
          hobbiesByUser.set(row.user_id, set);
        }

        const myHobbies = hobbiesByUser.get(user.id) ?? new Set<string>();
        const buddyHobbies = Array.from(hobbiesByUser.get(id) ?? []).sort((a, b) => a.localeCompare(b, "fr"));
        const sharedHobbies = buddyHobbies.filter((hobby) => myHobbies.has(hobby));
        const myMbti = latestResultByUser.get(user.id)?.mbtiCode ?? null;
        const buddyMbti = latestResultByUser.get(id)?.mbtiCode ?? null;
        const compatibility = computeBuddyCompatibilityScore({
          sharedHobbiesCount: sharedHobbies.length,
          currentMbti: myMbti,
          buddyMbti,
          sameStudyLevel: Boolean(
            myProfileRes.data?.study_level && buddyProfile.study_level && myProfileRes.data.study_level === buddyProfile.study_level
          ),
        });

        setState({
          status: "ready",
          data: {
            meId: user.id,
            buddyId: buddyProfile.id,
            isSelf: user.id === buddyProfile.id,
            pseudo: buddyProfile.pseudo?.trim() || "@buddy",
            bio: buddyProfile.bio,
            lookingFor: buddyProfile.looking_for,
            studyLevel: buddyProfile.study_level?.trim() || "Niveau non precise",
            mbtiCode: latestResultByUser.get(id)?.mbtiCode ?? null,
            mbtiName: latestResultByUser.get(id)?.mbtiName ?? null,
            buddyHobbies,
            sharedHobbies,
            compatibility,
            existingRequestStatus: (buddyRequestRes.data?.[0]?.status as "pending" | "accepted" | undefined) ?? null,
            conversationId: conversationRes?.id ?? null,
            avatarPath: buddyProfile.avatar_path ?? null,
          },
        });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Impossible de charger cette fiche buddy.",
        });
      }
    };

    void run();
  }, [id, router]);

  const onSendRequest = useCallback(async (message: string): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (state.status !== "ready") return { ok: false, message: "Le profil n'est pas pret pour envoyer une demande." };

    if (state.data.isSelf) return { ok: false, message: "Tu ne peux pas t'envoyer une demande." };
    if (state.data.existingRequestStatus) return { ok: false, message: "Une relation existe deja avec ce buddy." };

    const supabase = getSupabaseClient();

    const duplicateRes = await supabase
      .from("buddy_requests")
      .select("id, status")
      .or(
        `and(sender_id.eq.${state.data.meId},receiver_id.eq.${state.data.buddyId}),and(sender_id.eq.${state.data.buddyId},receiver_id.eq.${state.data.meId})`
      )
      .in("status", ["pending", "accepted"])
      .limit(1)
      .returns<BuddyRequestRow[]>();

    if (duplicateRes.error) {
      return { ok: false, message: duplicateRes.error.message };
    }

    if ((duplicateRes.data ?? []).length > 0) {
      setState((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              data: { ...prev.data, existingRequestStatus: (duplicateRes.data?.[0]?.status as "pending" | "accepted") ?? "pending" },
            }
          : prev
      );
      return { ok: false, message: "Une demande existe deja pour ce buddy." };
    }

    const insertRes = await supabase.from("buddy_requests").insert({
      sender_id: state.data.meId,
      receiver_id: state.data.buddyId,
      message: message.length > 0 ? message : null,
      status: "pending",
    });

    if (insertRes.error) {
      return { ok: false, message: insertRes.error.message };
    }

    const conversationId = await findOrCreateConversationBetweenUsers(supabase, state.data.meId, state.data.buddyId);
    if (message.length > 0) {
      const firstMessage = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: state.data.meId, body: message })
        .select("id")
        .single<{ id: string }>();

      if (firstMessage.error) {
        return { ok: false, message: firstMessage.error.message };
      }
    }

    setState((prev) =>
      prev.status === "ready"
        ? {
            status: "ready",
            data: { ...prev.data, existingRequestStatus: "pending", conversationId },
          }
        : prev
    );
    router.push(`/messages/${conversationId}`);
    return { ok: true };
  }, [router, state]);

  const onOpenConversation = useCallback(async () => {
    if (state.status !== "ready" || state.data.isSelf) return;
    const supabase = getSupabaseClient();
    const conversationId =
      state.data.conversationId ?? (await findOrCreateConversationBetweenUsers(supabase, state.data.meId, state.data.buddyId));
    router.push(`/messages/${conversationId}`);
  }, [router, state]);

  const content = useMemo(() => {
    if (state.status === "loading") {
      return (
        <section className="buddy-state-card" role="status" aria-live="polite">
          <h2>Chargement du profil buddy...</h2>
          <p>On recupere sa fiche et vos points communs.</p>
        </section>
      );
    }

    if (state.status === "error") {
      return (
        <section className="buddy-state-card buddy-state-error" role="alert">
          <h2>Impossible de charger cette fiche</h2>
          <p>{state.message}</p>
        </section>
      );
    }

    if (state.status === "not-found") {
      return (
        <section className="buddy-state-card" role="status">
          <h2>Profil indisponible</h2>
          <p>Ce profil n&apos;existe pas ou n&apos;est pas visible pour le moment.</p>
        </section>
      );
    }

    const data = state.data;
    return (
      <div className="buddy-detail-stack">
        <BuddyHero
          pseudo={data.pseudo}
          studyLevel={data.studyLevel}
          mbtiCode={data.mbtiCode}
          mbtiName={data.mbtiName}
          compatibility={data.compatibility}
          avatarPath={data.avatarPath}
        />
        <BioCard title="Sa bio" content={data.bio} fallback="Cette personne n'a pas encore ajoute de bio." />
        <BioCard title="Ce qu'elle cherche" content={data.lookingFor} fallback="Objectif de binome non precise pour le moment." />
        <PersonalitySummary mbtiCode={data.mbtiCode} mbtiName={data.mbtiName} studyLevel={data.studyLevel} />
        <SharedHobbies buddyHobbies={data.buddyHobbies} sharedHobbies={data.sharedHobbies} />
        <BuddyCTA
          isSelf={data.isSelf}
          existingStatus={data.existingRequestStatus}
          conversationId={data.conversationId}
          onSendRequest={onSendRequest}
          onOpenConversation={onOpenConversation}
        />
        <div className="buddy-report">
          <button type="button" className="buddy-report-link">
            Signaler ce profil
          </button>
        </div>
      </div>
    );
  }, [onOpenConversation, onSendRequest, state]);

  return (
    <AppLayout title="Fiche Buddy">
      <div className="buddy-detail-page">
        <Link className="btn btn-tertiary buddy-back" href="/buddies">
          Retour a l&apos;annuaire
        </Link>
        {content}
      </div>

      <style jsx>{`
        .buddy-detail-page,
        .buddy-detail-stack {
          display: grid;
          gap: 0;
        }
        .buddy-detail-page {
          max-width: 1000px;
          margin: 0;
          padding: 30px 8px 80px;
          color: #071238;
        }
        .buddy-back {
          justify-self: start;
          border: 0;
          background: transparent;
          color: #25395e;
          font-weight: 700;
          margin-bottom: 22px;
          padding: 0;
        }
        :global(.buddy-hero) {
          min-height: 310px;
          background: linear-gradient(135deg, #8b4d73, #348dbd);
          color: #fff;
          border-radius: 18px;
          padding: 30px;
          display: grid;
          justify-items: center;
          align-content: center;
          text-align: center;
          gap: 0;
          margin-bottom: 26px;
        }
        :global(.buddy-hero-avatar) {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.35);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: "Poppins", sans-serif;
          font-size: 42px;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.16);
          margin-bottom: 18px;
        }
        :global(.buddy-hero h2) {
          margin: 0;
          font-family: "Poppins", sans-serif;
          font-size: 34px;
          color: #fff;
        }
        :global(.buddy-hero-meta) {
          margin: 6px 0 16px;
          color: rgba(255, 255, 255, 0.92);
          font-size: 14px;
        }
        :global(.compatibility-badge) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 800;
          color: #fff;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        :global(.buddy-section),
        .buddy-state-card {
          margin-bottom: 24px;
        }
        :global(.buddy-bio-card),
        :global(.buddy-personality-card),
        .buddy-state-card {
          background: #fff;
          border: 1px solid #e5e0ec;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 8px 24px rgba(26, 26, 46, 0.08);
        }
        :global(.buddy-section-title),
        .buddy-state-card h2 {
          margin: 0 0 12px;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: #7e3d5e;
          font-size: 13px;
          font-weight: 800;
        }
        :global(.buddy-bio-card p),
        .buddy-state-card p {
          margin: 0;
          color: #071238;
          font-style: italic;
          line-height: 1.7;
        }
        :global(.buddy-hobbies-list) {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        :global(.buddy-hobby-chip) {
          border-radius: 999px;
          border: 0;
          padding: 7px 12px;
          font-size: 13px;
        }
        :global(.buddy-hobby-chip.shared) {
          color: #7e3d5e;
          background: #f7bac1;
        }
        :global(.buddy-hobby-chip.muted) {
          color: #31405d;
          background: #f5f0f7;
        }
        :global(.buddy-shared-note),
        :global(.buddy-muted),
        :global(.buddy-success),
        :global(.buddy-error) {
          margin: 10px 0 0;
          font-size: 13px;
        }
        :global(.buddy-shared-note),
        :global(.buddy-success) {
          color: #7e3d5e;
          font-weight: 700;
        }
        :global(.buddy-muted) {
          color: var(--texte-clair);
        }
        :global(.buddy-error) {
          color: #b42318;
        }
        :global(.buddy-info-row) {
          display: grid;
          grid-template-columns: 32px 140px 1fr;
          align-items: center;
          gap: 12px;
          padding: 15px 4px;
          border-bottom: 1px dashed #e5e0ec;
        }
        :global(.buddy-info-row:last-child) {
          border-bottom: 0;
        }
        :global(.buddy-info-label) {
          color: #657493;
        }
        :global(.buddy-info-value) {
          color: #7e3d5e;
          font-weight: 800;
        }
        :global(.buddy-info-value.plain) {
          color: #071238;
        }
        :global(.buddy-cta) {
          display: grid;
          gap: 10px;
          background: #fff;
          border: 1px solid #e5e0ec;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 8px 24px rgba(26, 26, 46, 0.08);
        }
        :global(.buddy-label) {
          font-size: 13px;
          color: var(--texte-gris);
          font-weight: 600;
        }
        :global(.buddy-cta textarea) {
          min-height: 96px;
          border-radius: 12px;
          border: 1px solid var(--bordure);
          padding: 12px;
          font-family: inherit;
          resize: vertical;
        }
        :global(.buddy-report) {
          text-align: center;
          margin-top: -6px;
        }
        :global(.buddy-report-link) {
          border: 0;
          background: transparent;
          color: var(--texte-clair);
          text-decoration: underline;
          cursor: pointer;
          padding: 4px;
        }
        .buddy-state-error {
          border-color: #f3c7ce;
          background: #fff8f9;
        }
        @media (max-width: 699px) {
          :global(.buddy-cta .btn) {
            width: 100%;
          }
          :global(.buddy-info-row) {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </AppLayout>
  );
}
