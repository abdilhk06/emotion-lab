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
  pseudo: "toi",
  mbtiCode: null,
  mbtiName: null,
  hasResult: false,
  buddiesCount: 0,
  unreadMessages: 0,
};

const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Dashboard", active: true },
  { href: "/test/results", label: "Mes resultats" },
  { href: "/buddies", label: "Annuaire Buddy" },
  { href: "/messages", label: "Messagerie" },
  { href: "/resources", label: "Ressources" },
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
          pseudo: profile?.pseudo?.trim() || DEFAULT_DATA.pseudo,
          mbtiCode: result?.mbti_code ?? null,
          mbtiName: result?.mbti_name ?? null,
          hasResult: Boolean(result),
          buddiesCount: 3,
          unreadMessages: 3,
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
    const profileTileSub = data.hasResult && data.mbtiName ? data.mbtiName : "Passe le test pour debloquer ton profil.";

    return (
      <div className="dashboard-stack">
        <DashboardGreeting pseudo={data.pseudo} mbtiCode={data.mbtiCode} mbtiName={data.mbtiName} />

        {state.status === "empty" ? (
          <section className="dash-state-card" role="status">
            <h3>Profil incomplet</h3>
            <p>Ton profil est encore vide. Tu peux deja passer le test pour personnaliser ton dashboard.</p>
            <Link className="btn btn-primary" href="/test/intro">
              Demarrer le test
            </Link>
          </section>
        ) : null}

        {!data.hasResult ? (
          <section className="dash-state-card" role="status">
            <h3>Aucun resultat pour le moment</h3>
            <p>Ton type MBTI apparaitra ici des que tu termines le test de personnalite.</p>
            <Link className="btn btn-primary" href="/test/intro">
              Faire le test
            </Link>
          </section>
        ) : null}

        <div className="dash-grid">
          <DashboardTile
            title="Ton profil"
            value={data.hasResult ? data.mbtiCode ?? "--" : "Test requis"}
            subtitle={profileTileSub}
            ctaLabel={data.hasResult ? "Voir les details" : "Commencer le test"}
            href={data.hasResult ? "/test/results" : "/test/intro"}
          />
          <DashboardTile title="Tes Buddies actifs" value={`${data.buddiesCount} binomes`} subtitle="Tout se passe bien ?" ctaLabel="Voir l'annuaire" href="/buddies" />
          <DashboardTile
            title="Messages"
            value={`${data.unreadMessages}`}
            subtitle={`${data.unreadMessages} non lus`}
            ctaLabel="Ouvrir la messagerie"
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
          gap: 16px;
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
          gap: 14px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .dash-bottom-grid {
          display: grid;
          gap: 14px;
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
