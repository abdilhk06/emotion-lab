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
};

type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardData }
  | { status: "empty"; data: DashboardData };

const DEFAULT_DATA: DashboardData = {
  pseudo: "Ghita",
  mbtiCode: "ENFJ",
  mbtiName: "Le Protagoniste",
  school: "PM — ISCAE",
  hasResult: true,
  buddiesCount: 3,
  unreadMessages: 3,
};

const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "home" as const, active: true },
  { href: "/test/results", label: "Mes resultats", icon: "chart" as const },
  { href: "/buddies", label: "Annuaire Buddy", icon: "users" as const },
  { href: "/requests", label: "Mes demandes", icon: "mail" as const, badge: 2 },
  { href: "/messages", label: "Messagerie", icon: "message" as const, badge: 3 },
  { href: "/chatbot", label: "Chatbot", icon: "bot" as const },
  { href: "/resources", label: "Ressources", icon: "book" as const },
];

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

        const [profileRes, resultRes] = await Promise.all([
          supabase.from("profiles").select("id, pseudo").eq("id", user.id).maybeSingle<ProfileRow>(),
          supabase
            .from("test_results")
            .select("mbti_code, mbti_name, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle<TestResultRow>(),
        ]);

        const profile = profileRes.data;
        const result = resultRes.data;

        const data: DashboardData = {
          ...DEFAULT_DATA,
          pseudo: DEFAULT_DATA.pseudo,
          mbtiCode: result?.mbti_code ?? DEFAULT_DATA.mbtiCode,
          mbtiName: result?.mbti_name ?? DEFAULT_DATA.mbtiName,
          hasResult: true,
        };

        if (profileRes.error || resultRes.error) {
          const message = profileRes.error?.message ?? resultRes.error?.message ?? "Impossible de charger ton dashboard.";
          setState({ status: "error", message });
          return;
        }

        if (!profile) {
          setState({ status: "empty", data });
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
    const profileTileSub = data.mbtiName ?? "Le Protagoniste";

    return (
      <div className="dashboard-stack">
        <DashboardGreeting pseudo={data.pseudo} mbtiCode={data.mbtiCode} mbtiName={data.mbtiName} school={data.school} />

        {state.status === "empty" ? (
          <section className="dash-state-card" role="status">
            <h3>Profil incomplet</h3>
            <p>Ton profil est encore vide. Tu peux deja passer le test pour personnaliser ton dashboard.</p>
            <Link className="btn btn-primary" href="/test/intro">
              Demarrer le test
            </Link>
          </section>
        ) : null}

        <div className="dash-grid">
          <DashboardTile
            variant="profile"
            title="Ton profil"
            value={data.mbtiCode ?? "--"}
            subtitle={profileTileSub}
            ctaLabel="Voir les details"
            href="/test/results"
          />
          <DashboardTile
            variant="buddies"
            title="Tes Buddies actifs"
            value={`${data.buddiesCount} binomes`}
            subtitle="Tout se passe bien ?"
            ctaLabel="Aller a l'annuaire"
            href="/buddies"
          />
          <DashboardTile
            variant="messages"
            title="Messages"
            value={`${data.unreadMessages}`}
            subtitle="non lus · Salma, Yassine, Lina"
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

  return (
    <AppLayout title="Dashboard" nav={DASHBOARD_NAV}>
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
