"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { ArticlePreviewCard } from "@/components/dashboard/ArticlePreviewCard";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { DashboardTile } from "@/components/dashboard/DashboardTile";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { SuggestionBanner } from "@/components/dashboard/SuggestionBanner";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  pseudo: string | null;
  study_level: string | null;
};

type TestResultRow = {
  mbti_code: string;
  mbti_name: string;
  created_at: string;
};

type DashboardData = {
  pseudo: string;
  mbtiCode: string | null;
  mbtiName: string | null;
  school: string;
  hasResult: boolean;
  buddiesCount: number;
  unreadMessages: number;
  pendingRequests: number;
};

type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardData }
  | { status: "empty"; data: DashboardData; reasons: Array<"profile" | "result"> };

const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "home" as const, active: true },
  { href: "/test/results", label: "Mes resultats", icon: "chart" as const },
  { href: "/buddies", label: "Annuaire Buddy", icon: "users" as const },
  { href: "/requests", label: "Mes demandes", icon: "mail" as const },
  { href: "/messages", label: "Messagerie", icon: "message" as const },
  { href: "/chatbot", label: "Chatbot", icon: "bot" as const },
  { href: "/resources", label: "Ressources", icon: "book" as const },
];

function pairFilter(userId: string): string {
  return `sender_id.eq.${userId},receiver_id.eq.${userId}`;
}

function countOrZero(count: number | null): number {
  return count ?? 0;
}

function displayName(profile: ProfileRow | null, email?: string): string {
  const pseudo = profile?.pseudo?.trim();
  if (pseudo) return pseudo;
  return email?.split("@")[0] || "Ton profil";
}

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({ status: "loading" });

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

        const [profileRes, resultRes, conversationsRes, pendingRequestsRes] = await Promise.all([
          supabase.from("profiles").select("id, pseudo, study_level").eq("id", user.id).maybeSingle<ProfileRow>(),
          supabase
            .from("test_results")
            .select("mbti_code, mbti_name, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle<TestResultRow>(),
          supabase.from("conversations").select("id", { count: "exact" }).or(pairFilter(user.id)),
          supabase
            .from("buddy_requests")
            .select("*", { count: "exact", head: true })
            .eq("receiver_id", user.id)
            .eq("status", "pending"),
        ]);

        const profile = profileRes.data;
        const result = resultRes.data;

        if (profileRes.error || resultRes.error || conversationsRes.error || pendingRequestsRes.error) {
          const message =
            profileRes.error?.message ??
            resultRes.error?.message ??
            conversationsRes.error?.message ??
            pendingRequestsRes.error?.message ??
            "Impossible de charger ton dashboard.";
          setState({ status: "error", message });
          return;
        }

        const conversationIds = (conversationsRes.data ?? []).map((conversation) => conversation.id);
        const unreadRes =
          conversationIds.length > 0
            ? await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .in("conversation_id", conversationIds)
                .neq("sender_id", user.id)
                .is("read_at", null)
            : { count: 0, error: null };

        if (unreadRes.error) {
          setState({ status: "error", message: unreadRes.error.message });
          return;
        }

        const data: DashboardData = {
          pseudo: displayName(profile, user.email),
          mbtiCode: result?.mbti_code ?? null,
          mbtiName: result?.mbti_name ?? null,
          school: profile?.study_level?.trim() || "Niveau non precise",
          hasResult: Boolean(result),
          buddiesCount: countOrZero(conversationsRes.count),
          unreadMessages: countOrZero(unreadRes.count),
          pendingRequests: countOrZero(pendingRequestsRes.count),
        };

        const reasons: Array<"profile" | "result"> = [];
        if (!profile) reasons.push("profile");
        if (!result) reasons.push("result");

        if (reasons.length > 0) {
          setState({ status: "empty", data, reasons });
          return;
        }

        setState({ status: "ready", data });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Une erreur inattendue est survenue.",
        });
      }
    };

    void run();
  }, [router]);

  const content = useMemo(() => {
    if (state.status === "loading") {
      return (
        <section className="dash-state-card" role="status" aria-live="polite">
          <h2>Chargement de ton dashboard...</h2>
          <p>On prepare ton espace Emotion Lab.</p>
        </section>
      );
    }

    if (state.status === "error") {
      return (
        <section className="dash-state-card dash-state-error" role="alert">
          <h2>Impossible de charger le dashboard</h2>
          <p>{state.message}</p>
          <Link className="btn btn-primary" href="/test/intro">
            Revenir au test
          </Link>
        </section>
      );
    }

    const data = state.data;
    const profileTileSub = data.mbtiName ?? "Passe le test pour debloquer ton profil";
    const buddyLabel = data.buddiesCount === 1 ? "conversation" : "conversations";

    return (
      <div className="dashboard-stack">
        <DashboardGreeting pseudo={data.pseudo} mbtiCode={data.mbtiCode} mbtiName={data.mbtiName} school={data.school} />

        {state.status === "empty" && state.reasons.includes("profile") ? (
          <section className="dash-state-card" role="status">
            <h3>Profil incomplet</h3>
            <p>Ton profil est encore vide. Complete-le pour personnaliser ton dashboard.</p>
            <Link className="btn btn-primary" href="/test/intro">
              Demarrer le test
            </Link>
          </section>
        ) : null}

        {state.status === "empty" && state.reasons.includes("result") ? (
          <section className="dash-state-card" role="status">
            <h3>Aucun resultat disponible</h3>
            <p>Passe le test pour afficher ton profil MBTI et recevoir des suggestions adaptees.</p>
            <Link className="btn btn-primary" href="/test/intro">
              Passer le test
            </Link>
          </section>
        ) : null}

        <div className="dash-grid">
          <DashboardTile
            variant="profile"
            title="Ton profil"
            value={data.mbtiCode ?? "--"}
            subtitle={profileTileSub}
            ctaLabel={data.hasResult ? "Voir les details" : "Passer le test"}
            href="/test/results"
          />
          <DashboardTile
            variant="buddies"
            title="Tes Buddies actifs"
            value={`${data.buddiesCount} ${buddyLabel}`}
            subtitle={data.buddiesCount > 0 ? "Tout se passe bien ?" : "Aucune conversation active"}
            ctaLabel="Aller a l'annuaire"
            href="/buddies"
          />
          <DashboardTile
            variant="messages"
            title="Messages"
            value={`${data.unreadMessages}`}
            subtitle={data.unreadMessages > 0 ? "messages non lus" : "aucun message non lu"}
            ctaLabel="Voir mes conversations"
            href="/messages"
          />
        </div>

        <SuggestionBanner
          title="Periode de partiels qui approche ?"
          description="Notre chatbot a des techniques concretes pour gerer le stress avant un examen. 5 minutes, ca peut t'aider."
          ctaHref="/chatbot"
          ctaLabel="Essayer le chatbot"
        />

        <div className="dash-bottom-grid">
          <GoalCard title="Ton objectif" periodLabel="Cette annee" objective="Valider sereinement" progress={58} />
          <ArticlePreviewCard
            category="Sommeil"
            title="Dormir mieux en periode d'exams"
            meta="4 min · par l'equipe Emotion Lab"
            href="/resources"
          />
        </div>
      </div>
    );
  }, [state]);

  const layoutNav =
    state.status === "ready" || state.status === "empty"
      ? DASHBOARD_NAV.map((item) => {
          if (item.href === "/requests") return { ...item, badge: state.data.pendingRequests || undefined };
          if (item.href === "/messages") return { ...item, badge: state.data.unreadMessages || undefined };
          return item;
        })
      : DASHBOARD_NAV;

  return (
    <AppLayout title="Dashboard" nav={layoutNav}>
      {content}
      <style jsx>{`
        .dashboard-stack {
          display: grid;
          gap: 24px;
        }

        .dash-state-card {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 18px;
        }

        .dash-state-card h2,
        .dash-state-card h3 {
          margin: 0 0 8px;
        }

        .dash-state-card p {
          margin: 0 0 14px;
          color: var(--texte-gris);
        }

        .dash-state-error {
          border-color: #f3c7ce;
          background: #fff8f9;
        }

        .dash-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: 1fr 1fr 1fr;
        }

        .dash-bottom-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: 1.1fr 1fr;
        }

        @media (max-width: 1023px) {
          .dash-grid,
          .dash-bottom-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppLayout>
  );
}
